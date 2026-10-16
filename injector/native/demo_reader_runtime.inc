/**
 * [INPUT]: 依赖官方Core/Extension映像、生成的源表与唯一gLocale快照。
 * [OUTPUT]: 仅对Preset菜单exact caller和已验证官方文件投影三语JS字面量。
 * [POS]: 在全局命名空间接two-level interpose；其它调用一次原样透传。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include <array>
#include <atomic>
#include <cstdio>
#include <cstring>
#include <iterator>
#include <string_view>
#include "demo_reader_abi_contract.h"
#include "demo_reader_policy.h"
#include "demo_reader_source_identity.h"

#ifndef NATIVE_DEMO_READER_TEXTS_TABLE
#error "Build must provide the generated Demo text table"
#endif
#ifndef NATIVE_DEMO_READER_FILES_TABLE
#error "Build must provide the generated Demo source/slot table"
#endif

namespace native_demo_reader {
#include NATIVE_DEMO_READER_TEXTS_TABLE
#include NATIVE_DEMO_READER_FILES_TABLE
static_assert(std::size(kDemoReaderTexts) == 297);
static_assert(std::size(kDemoReaderSlots) == 489);
static_assert(std::size(kDemoReaderFiles) == 100);

std::atomic<bool> gContractReady{false};
std::atomic<std::uintptr_t> gExpectedReturnPc{0};
std::array<char, PATH_MAX> gCanonicalPresetRoot{};

bool presetRootForSelectedExecutable(const char *corePath,
                                     char *output, std::size_t capacity) noexcept
{
    if (corePath == nullptr || output == nullptr || capacity == 0) return false;
    constexpr char kCoreSuffix[] = "/Contents/Frameworks/libCore.dylib";
    const std::size_t pathLength = std::strlen(corePath);
    constexpr std::size_t suffixLength = sizeof(kCoreSuffix) - 1U;
    if (pathLength <= suffixLength ||
        std::strcmp(corePath + pathLength - suffixLength, kCoreSuffix) != 0) return false;

    std::array<char, PATH_MAX> candidate{};
    const int length = std::snprintf(candidate.data(), candidate.size(),
        "%.*s/Contents/assets/Presets", static_cast<int>(pathLength - suffixLength),
        corePath);
    if (length <= 0 || static_cast<std::size_t>(length) >= candidate.size()) return false;
    std::array<char, PATH_MAX> canonical{};
    if (::realpath(candidate.data(), canonical.data()) == nullptr) return false;
    const std::size_t canonicalLength = std::strlen(canonical.data());
    if (canonicalLength + 1U > capacity) return false;
    std::memcpy(output, canonical.data(), canonicalLength + 1U);
    return true;
}

bool exactPresetFileIndex(const std::string &path, std::size_t *index) noexcept
{
    if (index == nullptr || path.empty() || path.size() >= PATH_MAX ||
        path.find('\0') != std::string::npos) return false;
    std::array<char, PATH_MAX> canonicalInput{};
    if (::realpath(path.c_str(), canonicalInput.data()) == nullptr) return false;
    const std::size_t rootLength = std::strlen(gCanonicalPresetRoot.data());
    const std::size_t inputLength = std::strlen(canonicalInput.data());
    if (rootLength == 0 || inputLength <= rootLength ||
        std::strncmp(canonicalInput.data(), gCanonicalPresetRoot.data(), rootLength) != 0 ||
        canonicalInput[rootLength] != '/') return false;
    const std::string_view relativePath(
        canonicalInput.data() + rootLength + 1U,
        inputLength - rootLength - 1U);
    for (std::size_t fileIndex = 0; fileIndex < std::size(kDemoReaderFiles); ++fileIndex) {
        const DemoReaderFile &file = kDemoReaderFiles[fileIndex];
        if (file.relativePath == relativePath) {
            *index = fileIndex;
            return true;
        }
    }
    return false;
}

bool verifyContract() noexcept
{
    if (!gNativeLocaleContractReady.load(std::memory_order_acquire) ||
        gCoreImage.header == nullptr || gExtensionImage.header == nullptr) return false;
    LoadedImage core{};
    LoadedImage extension{};
    std::array<char, PATH_MAX> corePath{};
    std::array<char, PATH_MAX> extensionPath{};
    if (!appFrameworkPath("libCore.dylib", corePath.data(), corePath.size()) ||
        !appFrameworkPath("libExtensionLayer.dylib", extensionPath.data(), extensionPath.size()) ||
        !findLoadedImageExactPath(corePath.data(), &core) ||
        !findLoadedImageExactPath(extensionPath.data(), &extension) ||
        core.header != gCoreImage.header || extension.header != gExtensionImage.header ||
        !imageUuidEquals(core, contract::kCoreUuid) ||
        !imageUuidEquals(extension, contract::kExtensionUuid) ||
        findMachOSymbol(core, contract::kTextFromFileSymbol) !=
            imageAddress(core, contract::kTextFromFileExportOffset) ||
        reinterpret_cast<const void *>(
            &demoTextFromFileTarget) != imageAddress(core, contract::kTextFromFileExportOffset) ||
        !matchesCode(core, contract::kCoreEntryWindowOffset,
                     contract::kCoreEntryWindowBytes) ||
        !matchesCode(extension, contract::kPresetCallWindowOffset,
                     contract::kPresetCallWindowBytes)) return false;

    const void *loadedGotTarget = nullptr;
    if (!readSelf(imageAddress(extension, contract::kTextFromFileGotOffset),
                  sizeof(loadedGotTarget), &loadedGotTarget) ||
        loadedGotTarget != reinterpret_cast<const void *>(
            &nativeDemoTextFromFileInterpose)) return false;

    std::array<char, PATH_MAX> presetRoot{};
    if (!presetRootForSelectedExecutable(
            corePath.data(), presetRoot.data(), presetRoot.size())) return false;
    gCanonicalPresetRoot = presetRoot;
    gExpectedReturnPc.store(reinterpret_cast<std::uintptr_t>(imageAddress(
        extension, contract::kPresetTextFromFileReturnOffset)), std::memory_order_release);
    return true;
}

bool exactPresetCaller(std::uintptr_t returnPc) noexcept
{
    return gContractReady.load(std::memory_order_acquire) &&
        returnPc == gExpectedReturnPc.load(std::memory_order_acquire);
}

template<typename LocaleGetter>
bool projectVerifiedSource(std::size_t fileIndex, std::string_view source,
                           LocaleGetter &&localeGetter, std::string *output)
{
    if (fileIndex >= std::size(kDemoReaderFiles) || output == nullptr) return false;
    const DemoReaderFile &file = kDemoReaderFiles[fileIndex];
    return projectVerifiedScript(source, file, kDemoReaderTexts, kDemoReaderSlots,
                                 std::forward<LocaleGetter>(localeGetter), output);
}
}  // namespace native_demo_reader

namespace {
bool verifyDemoReaderContract() noexcept
{
    return native_demo_reader::verifyContract();
}

DemoTextFromFileOriginal requireDemoTextFromFileOriginal() noexcept
{
    return &demoTextFromFileTarget;
}

__attribute__((used)) static struct {
    const void *replacement;
    const void *replacee;
} demoTextFromFileInterpose __attribute__((section("__DATA,__interpose"))) = {
    reinterpret_cast<const void *>(nativeDemoTextFromFileInterpose),
    reinterpret_cast<const void *>(&demoTextFromFileTarget),
};

}  // namespace
