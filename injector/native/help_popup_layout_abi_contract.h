/**
 * [INPUT]: 依赖Cavalry 2.8 arm64 DocumentationPopup、QtWidgets导出与同bundle Mach-O证据。
 * [OUTPUT]: 锁定setContent内唯一QLayout::activate返回地址和原始调用窗。
 * [POS]: 帮助布局adapter的窄准入合同；未知调用只透传原函数。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <array>
#include <cstdint>

namespace native_help_popup_layout::abi {

inline constexpr char kQtWidgetsUuid[] =
    "01652E29-047E-3528-9DC2-1BD084292E50";
inline constexpr char kDocumentationSetContentSymbol[] =
    "__ZN18DocumentationPopup10setContentERK7QStringS2_S2_S2_S2_";
inline constexpr char kQtLayoutActivateSymbol[] = "__ZN7QLayout8activateEv";

inline constexpr std::uintptr_t kDocumentationSetContentOffset = 0x92394;
inline constexpr std::uintptr_t kActivateCallWindowOffset = 0x924f4;
inline constexpr std::uintptr_t kActivateReturnOffset = 0x92500;
inline constexpr std::uintptr_t kActivateImportStubOffset = 0xad15c;
inline constexpr std::uintptr_t kQtLayoutActivateOffset = 0x3cda0;

inline constexpr std::array<std::uint8_t, 20> kActivateCallWindowBytes = {
    0xe0, 0x03, 0x13, 0xaa, 0xac, 0x71, 0x00, 0x94,
    0x18, 0x6b, 0x00, 0x94, 0xe0, 0x03, 0x13, 0xaa,
    0xaf, 0x6b, 0x00, 0x94,
};
inline constexpr std::array<std::uint8_t, 12> kActivateImportStubBytes = {
    0xd0, 0x00, 0x00, 0x90, 0x10, 0x26, 0x41, 0xf9,
    0x00, 0x02, 0x1f, 0xd6,
};

static_assert(kActivateReturnOffset == kActivateCallWindowOffset + 12,
    "the approved return address must follow the QLayout::activate call");

constexpr bool isExactActivationCaller(std::uintptr_t caller,
                                       std::uintptr_t expected) noexcept
{
    return expected != 0 && caller == expected;
}

}  // namespace native_help_popup_layout::abi
