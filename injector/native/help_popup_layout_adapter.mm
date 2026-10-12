/**
 * [INPUT]: 依赖同bundle CavalryUI/QtWidgets、401根布局表与原QLayout::activate。
 * [OUTPUT]: 在已验setContent唯一caller前应用一次当前locale行宽上限。
 * [POS]: 独立原生布局hook；未知caller只调用原函数一次，不修改字体或内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__arm64__)
#error "Help popup layout candidate is arm64-only."
#endif

#include <arm_acle.h>
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
namespace help_abi = native_help_description::contract;
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
        && macho::imageUuidEquals(ui, help_abi::kCavalryUiUuid)
        && macho::imageUuidEquals(widgets, abi::kQtWidgetsUuid)
        && target == imageAddress(widgets, abi::kQtLayoutActivateOffset)
        && findMachOSymbol(ui, abi::kDocumentationSetContentSymbol)
            == imageAddress(ui, abi::kDocumentationSetContentOffset)
        && macho::matchesCode(ui, abi::kActivateCallWindowOffset,
                              abi::kActivateCallWindowBytes)
        && macho::matchesCode(ui, abi::kActivateImportStubOffset,
                              abi::kActivateImportStubBytes);
    if (!ready) return;

    gExpectedReturn.store(reinterpret_cast<std::uintptr_t>(
        imageAddress(ui, abi::kActivateReturnOffset)),
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
