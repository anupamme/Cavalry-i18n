/**
 * [INPUT]: 依赖QtWidgets原setter、唯一gLocale与固定Guide ABI合同。
 * [OUTPUT]: 对精确caller/source投影三语正文，并单次调用原setter。
 * [POS]: 同TU窄interpose；ABI失败只关投影，未知caller不读文本或locale。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if defined(__arm64__)
#include <arm_acle.h>
#endif
#include <QtCore/QString>
#include <QtCore/qglobal.h>
#include <QtWidgets/QTextEdit>

#include "guide_body_abi_contract.h"
#include "guide_body_policy.h"

static_assert(QT_VERSION == QT_VERSION_CHECK(6, 9, 2));

extern "C" void guideBodySetTextTarget(QTextEdit *, const QString &)
    __asm__("__ZN9QTextEdit7setTextERK7QString");
extern "C" void nativeGuideBodySetTextInterpose(QTextEdit *, const QString &);

namespace {
namespace guide_body_contract = native_guide_body::contract;
using GuideBodySetText = void (*)(QTextEdit *, const QString &);

std::atomic<GuideBodySetText> gOriginalGuideBodySetText{nullptr};
std::atomic<bool> gGuideBodyContractReady{false};
std::atomic<std::uintptr_t> gGuideBodyExpectedReturnPc{0};
LoadedImage gGuideBodyExtensionImage{};
LoadedImage gGuideBodyQtWidgetsImage{};

bool verifyGuideBodyContract() noexcept
{
    // -- 原导入先绑定；任何ABI失败只关闭投影，不关闭原setter ------------------
    gOriginalGuideBodySetText.store(
        &guideBodySetTextTarget, std::memory_order_release);
    std::array<char, PATH_MAX> extensionPath{};
    std::array<char, PATH_MAX> qtWidgetsFrameworkPath{};
    std::array<char, PATH_MAX> qtWidgetsPath{};
    std::array<char, PATH_MAX> canonicalExtensionPath{};
    std::array<char, PATH_MAX> canonicalQtWidgetsPath{};
    if (!appFrameworkPath("libExtensionLayer.dylib", extensionPath.data(),
                          extensionPath.size()) ||
        !appFrameworkPath("QtWidgets.framework", qtWidgetsFrameworkPath.data(),
                          qtWidgetsFrameworkPath.size()))
        return false;
    const int qtWidgetsPathLength = std::snprintf(
        qtWidgetsPath.data(), qtWidgetsPath.size(), "%s/Versions/A/QtWidgets",
        qtWidgetsFrameworkPath.data());
    if (qtWidgetsPathLength <= 0 ||
        static_cast<std::size_t>(qtWidgetsPathLength) >= qtWidgetsPath.size() ||
        ::realpath(extensionPath.data(), canonicalExtensionPath.data()) == nullptr ||
        ::realpath(qtWidgetsPath.data(), canonicalQtWidgetsPath.data()) == nullptr ||
        !findLoadedImageExactPath(canonicalExtensionPath.data(),
                                  &gGuideBodyExtensionImage) ||
        !findLoadedImageExactPath(canonicalQtWidgetsPath.data(),
                                  &gGuideBodyQtWidgetsImage))
        return false;

    const auto setter = findMachOSymbol(
        gGuideBodyQtWidgetsImage, guide_body_contract::kSetTextSymbol);
    if (setter == nullptr) return false;
    gOriginalGuideBodySetText.store(
        reinterpret_cast<GuideBodySetText>(setter), std::memory_order_release);

    const char *runtimeVersion = qVersion();
    const bool ready = runtimeVersion != nullptr &&
        std::strcmp(runtimeVersion, guide_body_contract::kQtVersion) == 0 &&
        imageUuidEquals(gGuideBodyExtensionImage, guide_body_contract::kExtensionUuid) &&
        imageUuidEquals(gGuideBodyQtWidgetsImage, guide_body_contract::kQtWidgetsUuid) &&
        setter == imageAddress(gGuideBodyQtWidgetsImage,
                               guide_body_contract::kSetTextOffset) &&
        matchesCode(gGuideBodyExtensionImage, guide_body_contract::kCallerOffset,
                    guide_body_contract::kCallerBranchBytes) &&
        matchesCode(gGuideBodyExtensionImage, guide_body_contract::kBodyOverrideOffset,
                    guide_body_contract::kBodyOverrideBytes);
    gGuideBodyExpectedReturnPc.store(ready ? reinterpret_cast<std::uintptr_t>(
        imageAddress(gGuideBodyExtensionImage, guide_body_contract::kReturnOffset)) : 0,
        std::memory_order_release);
    gGuideBodyContractReady.store(ready, std::memory_order_release);
    return ready;
}

GuideBodySetText requireGuideBodyOriginal() noexcept
{
    const GuideBodySetText original =
        gOriginalGuideBodySetText.load(std::memory_order_acquire);
    return original != nullptr ? original : &guideBodySetTextTarget;
}

__attribute__((used)) static struct {
    const void *replacement;
    const void *replacee;
} guideBodySetTextInterpose __attribute__((section("__DATA,__interpose"))) = {
    reinterpret_cast<const void *>(nativeGuideBodySetTextInterpose),
    reinterpret_cast<const void *>(guideBodySetTextTarget),
};
}  // namespace

extern "C" __attribute__((noinline)) void nativeGuideBodySetTextInterpose(
    QTextEdit *editor, const QString &text)
{
    const GuideBodySetText original = requireGuideBodyOriginal();
    const std::uintptr_t callerReturnPc = reinterpret_cast<std::uintptr_t>(
        __builtin_return_address(0));
    if (!gGuideBodyContractReady.load(std::memory_order_acquire) ||
        callerReturnPc != gGuideBodyExpectedReturnPc.load(std::memory_order_acquire)) {
        original(editor, text);
        return;
    }

    if (text != QStringLiteral("Keep going...")) {
        original(editor, text);
        return;
    }

    native_guide_body::forwardBodyText(
        [&](std::string_view projection) {
            if (projection.empty()) {
                original(editor, text);
                return;
            }
            const QString localized = QString::fromUtf8(
                projection.data(), static_cast<qsizetype>(projection.size()));
            original(editor, localized);
        },
        callerReturnPc,
        gGuideBodyExpectedReturnPc.load(std::memory_order_acquire),
        native_guide_body::kSourceText,
        gLocale.value());
}
