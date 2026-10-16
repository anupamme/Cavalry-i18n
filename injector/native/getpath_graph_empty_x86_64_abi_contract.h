/**
 * [INPUT]: 依赖官方2.8 x86_64 Core、Extension与Skia字节窗。
 * [OUTPUT]: 锁定Graph空态GetPath调用及Core到Extension双帧owner链。
 * [POS]: x86 Graph静态合同；不改arm64 GetPath合同或准入其他owner。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <array>
#include <cstddef>
#include <cstdint>

namespace native_getpath_graph_x86_64::contract {
inline constexpr char kCoreUuid[] = "F1CF1469-3FB9-3C2B-B695-3827F32F341A";
inline constexpr char kExtensionUuid[] = "DB431633-99A8-3C32-89EF-3378D4B418EA";
inline constexpr char kSkiaUuid[] = "3E709FF2-F798-3456-9282-28F9350B57A7";
inline constexpr char kMakePathFromTextSymbol[] =
    "__ZN7cavalry16MakePathFromTextERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEd";
inline constexpr char kGetPathSymbol[] =
    "__ZN11SkTextUtils7GetPathEPKvm14SkTextEncodingffRK6SkFontP6SkPath";
inline constexpr std::uintptr_t kMakePathFromTextExportOffset = 0x000796f0;
inline constexpr std::uintptr_t kGetPathExportOffset = 0x0001b760;
inline constexpr std::uintptr_t kCoreGetPathCallOffset = 0x000797b3;
inline constexpr std::uintptr_t kCoreGetPathReturnOffset = 0x000797b8;
inline constexpr std::array<std::uint8_t, 24> kCoreGetPathCallWindowBytes = {
    0x48, 0x8d, 0x4d, 0xb0, 0x4c, 0x8d, 0x45, 0xd8,
    0x0f, 0x57, 0xc0, 0x0f, 0x57, 0xc9, 0x4c, 0x89,
    0xf7, 0x31, 0xd2, 0xe8, 0xe6, 0x2d, 0xc9, 0x00,
};
inline constexpr std::uintptr_t kExtensionGraphProducerCallOffset = 0x0063bf20;
inline constexpr std::uintptr_t kExtensionGraphProducerReturnOffset = 0x0063bf25;
inline constexpr std::array<std::uint8_t, 16> kExtensionGraphProducerCallWindowBytes = {
    0x48, 0x8d, 0x7d, 0x80, 0x48, 0x8d, 0xb5, 0xe0,
    0xfe, 0xff, 0xff, 0xe8, 0x28, 0x6b, 0x90, 0x00,
};
static_assert(kCoreGetPathCallOffset + 5U == kCoreGetPathReturnOffset);
static_assert(kExtensionGraphProducerCallOffset + 5U ==
              kExtensionGraphProducerReturnOffset);
static_assert(kCoreGetPathCallWindowBytes[19] == 0xe8);
static_assert(kExtensionGraphProducerCallWindowBytes[11] == 0xe8);
}  // namespace native_getpath_graph_x86_64::contract
