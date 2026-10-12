/**
 * [INPUT]: 依赖同bundle Extension/UI映像、唯一gLocale及384/17分表。
 * [OUTPUT]: 发布main/def已验caller并提供窄description dispatcher。
 * [POS]: native候选同TU接线；两caller复用原API与+0x00 shadow。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "help_description_adapter.inc"
#include NATIVE_HELP_DESCRIPTION_TABLE

extern "C" {
__attribute__((visibility("hidden")))
std::atomic<std::uintptr_t> nativeHelpExpectedReturnPc{0};
__attribute__((visibility("hidden")))
std::atomic<std::uintptr_t> nativeHelpExpectedDefReturnPc{0};
}

namespace {
namespace help_contract = native_help_description::contract;
using HelpOriginal = native_help_description::AddScriptDocumentationEntry;
std::atomic<HelpOriginal> gOriginalHelpEntry{nullptr};
std::atomic<bool> gHelpDescriptionContractReady{false};
LoadedImage gHelpUiImage{};
LoadedImage gHelpExtensionImage{};

HelpOriginal resolveHelpEntryOriginal() noexcept
{
    HelpOriginal original = gOriginalHelpEntry.load(std::memory_order_acquire);
    if (original != nullptr) return original;
    const auto target = findMachOSymbol(gHelpUiImage, help_contract::kEntrySymbol);
    original = target != nullptr ? reinterpret_cast<HelpOriginal>(target)
                          : &helpDocumentationEntryTarget;
    HelpOriginal expected = nullptr;
    if (!gOriginalHelpEntry.compare_exchange_strong(
            expected, original, std::memory_order_release, std::memory_order_relaxed))
        return expected;
    return original;
}

bool verifyHelpDescriptionContract() noexcept
{
    std::array<char, PATH_MAX> extensionPath{};
    std::array<char, PATH_MAX> uiPath{};
    if (!appFrameworkPath("libExtensionLayer.dylib", extensionPath.data(),
                          extensionPath.size()) ||
        !appFrameworkPath("libCavalryUI.dylib", uiPath.data(), uiPath.size()) ||
        !findLoadedImageExactPath(extensionPath.data(), &gHelpExtensionImage) ||
        !findLoadedImageExactPath(uiPath.data(), &gHelpUiImage)) return false;

    const auto target = findMachOSymbol(gHelpUiImage, help_contract::kEntrySymbol);
    if (target != imageAddress(gHelpUiImage, help_contract::kCavalryUiEntryOffset)) return false;
    gOriginalHelpEntry.store(reinterpret_cast<HelpOriginal>(target),
                            std::memory_order_release);
    const bool ready = imageUuidEquals(gHelpExtensionImage, help_contract::kExtensionUuid) &&
        imageUuidEquals(gHelpUiImage, help_contract::kCavalryUiUuid) &&
        matchesCode(gHelpExtensionImage, help_contract::kExtensionCallerOffset,
                    help_contract::kCallerBranchBytes) &&
        matchesCode(gHelpExtensionImage, help_contract::kDefCallerConditionOffset,
                    help_contract::kDefCallerConditionBytes) &&
        matchesCode(gHelpExtensionImage, help_contract::kDefCallerOffset,
                    help_contract::kDefCallerBranchBytes) &&
        matchesCode(gHelpExtensionImage, help_contract::kExtensionStubOffset,
                    help_contract::kImportStubBytes) &&
        matchesCode(gHelpUiImage, help_contract::kCavalryUiEntryOffset,
                    help_contract::kCalleeEntryBytes);
    nativeHelpExpectedReturnPc.store(ready ? reinterpret_cast<std::uintptr_t>(
        imageAddress(gHelpExtensionImage, help_contract::kExtensionReturnOffset)) : 0,
        std::memory_order_release);
    nativeHelpExpectedDefReturnPc.store(ready ? reinterpret_cast<std::uintptr_t>(
        imageAddress(gHelpExtensionImage, help_contract::kDefReturnOffset)) : 0,
        std::memory_order_release);
    gHelpDescriptionContractReady.store(ready, std::memory_order_release);
    return ready;
}
}  // namespace

extern "C" __attribute__((noinline, visibility("hidden")))
void nativeHelpDocumentationDispatcher(
    void *owner, const std::string &key,
    const native_help_description::contract::ScriptDocumentationAbiMirror &documentation)
{
    const auto original = resolveHelpEntryOriginal();
    const auto caller = reinterpret_cast<std::uintptr_t>(__builtin_return_address(0));
    if (!gHelpDescriptionContractReady.load(std::memory_order_acquire)) {
        original(owner, key, documentation);
        return;
    }
    native_help_description::forwardAddScriptDocumentationEntry(
        original, owner, key, documentation, caller,
        reinterpret_cast<std::uintptr_t>(imageAddress(
            gHelpExtensionImage, help_contract::kExtensionReturnOffset)),
        reinterpret_cast<std::uintptr_t>(imageAddress(
            gHelpExtensionImage, help_contract::kDefReturnOffset)),
        gLocale,
        native_help_description::HelpDescriptionTableView{
            native_help_description::kApprovedRuntimeRootHelp,
            native_help_description::kApprovedRuntimeRootHelpCount},
        native_help_description::HelpDescriptionTableView{
            native_help_description::kApprovedRuntimeDefHelp,
            native_help_description::kApprovedRuntimeDefHelpCount});
}
