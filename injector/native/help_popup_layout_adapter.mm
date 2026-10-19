/**
 * [INPUT]: 依赖同bundle CavalryUI/QtWidgets、401根布局表与原QLayout::activate。
 * [OUTPUT]: 仅在完整架构ABI合同通过后应用一次当前locale行宽上限。
 * [POS]: 独立原生布局hook；未知caller或未核架构只调用原函数一次。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__arm64__) && !defined(__x86_64__)
#error "Help popup layout supports only verified macOS target architectures."
#endif

#if defined(__arm64__)
#include <arm_acle.h>
#endif
#include <QtCore/qglobal.h>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLayout>

#include "cavalry_i18n_macos_abi.h"
#include "help_description_abi_contract.h"
#include "help_popup_layout_abi_contract.h"
#include "help_popup_layout_policy.h"
#include "native_image_paths.h"
#include NATIVE_HELP_LAYOUT_ROWS

#include <array>
#include <atomic>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <mach-o/dyld.h>

static_assert(QT_VERSION == QT_VERSION_CHECK(6, 9, 2));

extern "C" bool qLayoutActivateTarget(QLayout *)
    __asm__("__ZN7QLayout8activateEv");
extern "C" bool nativeHelpLayoutActivateInterpose(QLayout *);

namespace {
namespace abi = native_help_popup_layout::abi;
#if defined(__x86_64__)
namespace popup_abi = native_help_popup_layout::abi::x86_64;
constexpr const char *kPopupUiUuid = popup_abi::kCavalryUiUuid;
#else
namespace popup_abi = native_help_popup_layout::abi;
namespace help_abi = native_help_description::contract;
constexpr const char *kPopupUiUuid = help_abi::kCavalryUiUuid;
#endif
namespace macho = cavalry_i18n::macos_abi;
using Original = bool (*)(QLayout *);
using macho::LoadedImage;
using macho::imageAddress;
using macho::findMachOSymbol;

std::atomic<Original> gOriginal{nullptr};
std::atomic<std::uintptr_t> gExpectedReturn{0};

bool findAppImage(const char *leaf, const char *suffix, const char *basename,
                  LoadedImage *output) noexcept
{
    char executable[PATH_MAX]{};
    std::uint32_t length = sizeof(executable);
    char framework[PATH_MAX]{};
    char expected[PATH_MAX]{};
    char canonical[PATH_MAX]{};
    if (_NSGetExecutablePath(executable, &length) != 0
        || !native_image_paths::frameworksPathForExecutable(
            executable, leaf, framework, sizeof(framework))) {
        return false;
    }
    const int size = std::snprintf(expected, sizeof(expected), "%s%s",
                                   framework, suffix);
    if (size <= 0 || static_cast<std::size_t>(size) >= sizeof(expected)
        || ::realpath(expected, canonical) == nullptr
        || !macho::findLoadedImage(basename, output)) {
        return false;
    }
    return native_image_paths::pathMatchesCanonical(output->path, canonical);
}

__attribute__((constructor)) void initializeHelpPopupLayout() noexcept
{
    // -- 原目标先解析；合同失败时所有调用仍走同一原导入 ------------------
    gOriginal.store(&qLayoutActivateTarget, std::memory_order_release);
    LoadedImage ui{};
    LoadedImage widgets{};
    LoadedImage core{};
    if (!findAppImage("libCavalryUI.dylib", "", "libCavalryUI.dylib", &ui)
        || !findAppImage("QtWidgets.framework", "/Versions/A/QtWidgets",
                         "QtWidgets", &widgets)
        || !findAppImage("QtCore.framework", "/Versions/A/QtCore",
                         "QtCore", &core)) {
        return;
    }

    const auto target = findMachOSymbol(widgets, abi::kQtLayoutActivateSymbol);
    if (target != nullptr) {
        gOriginal.store(reinterpret_cast<Original>(target),
                        std::memory_order_release);
    }
    const bool ready = std::strcmp(qVersion(), "6.9.2") == 0
        && macho::imageUuidEquals(ui, kPopupUiUuid)
        && macho::imageUuidEquals(widgets, popup_abi::kQtWidgetsUuid)
        && target == imageAddress(widgets, popup_abi::kQtLayoutActivateOffset)
        && findMachOSymbol(ui, popup_abi::kDocumentationSetContentSymbol)
            == imageAddress(ui, popup_abi::kDocumentationSetContentOffset)
        && macho::matchesCode(ui, popup_abi::kActivateCallWindowOffset,
                              popup_abi::kActivateCallWindowBytes)
        && macho::matchesCode(ui, popup_abi::kActivateImportStubOffset,
                              popup_abi::kActivateImportStubBytes);
    if (!ready) return;

    gExpectedReturn.store(reinterpret_cast<std::uintptr_t>(
        imageAddress(ui, popup_abi::kActivateReturnOffset)),
        std::memory_order_release);
}

__attribute__((used)) const struct {
    const void *replacement;
    const void *replacee;
} helpPopupLayoutInterpose __attribute__((section("__DATA,__interpose"))) = {
    reinterpret_cast<const void *>(&nativeHelpLayoutActivateInterpose),
    reinterpret_cast<const void *>(&qLayoutActivateTarget),
};
}  // namespace

extern "C" __attribute__((noinline))
bool nativeHelpLayoutActivateInterpose(QLayout *layout)
{
    const auto caller = reinterpret_cast<std::uintptr_t>(
        __builtin_return_address(0));
    const auto expected = gExpectedReturn.load(std::memory_order_acquire);
    if (abi::isExactActivationCaller(caller, expected)) {
        if (QLabel *body = native_help_popup_layout::descriptionLabel(layout)) {
            // -- 首次批准popup才遍历401项；进程内只保留一个整数宽度 ----------
            static const int envelopeWidth =
                native_help_popup_layout::measureCatalogEnvelope(
                    layout, native_help_popup_metadata::kRows,
                    native_help_popup_metadata::kRowCount);
            if (envelopeWidth > 0) {
                (void)native_help_popup_layout::applyUniformEnvelope(
                    layout, body, envelopeWidth);
            }
        }
    }

    Original original = gOriginal.load(std::memory_order_acquire);
    if (original == nullptr) original = &qLayoutActivateTarget;
    return original(layout);
}
