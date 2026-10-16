/**
 * [INPUT]: 依赖官方2.8 x86_64 Extension与Core GetPath调用合同。
 * [OUTPUT]: 锁定Viewport FPS格式化文案进入MakePathFromText的返回点。
 * [POS]: GetPath x86 FPS owner的窄补充；不匹配时保留原绘制。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#if !defined(__x86_64__)
#error "Viewport FPS x86_64 contract requires x86_64."
#endif

#include <array>
#include <cstdint>

namespace native_getpath_fps_x86_64::contract {
inline constexpr char kExtensionUuid[] =
    "DB431633-99A8-3C32-89EF-3378D4B418EA";
inline constexpr char kCoreUuid[] =
    "F1CF1469-3FB9-3C2B-B695-3827F32F341A";
inline constexpr char kMakePathFromTextSymbol[] =
    "__ZN7cavalry16MakePathFromTextERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEd";
inline constexpr std::uintptr_t kMakePathFromTextCallOffset = 0x275210;
inline constexpr std::uintptr_t kMakePathFromTextReturnOffset = 0x275215;
inline constexpr std::uintptr_t kViewportFpsProducerWindowOffset = 0x2751e0;
inline constexpr std::array<std::uint8_t, 53> kViewportFpsProducerWindowBytes = {
    0x48, 0x8d, 0x35, 0x00, 0x11, 0xee, 0x00, 0x48,
    0x8d, 0xbd, 0xa0, 0xf3, 0xff, 0xff, 0x48, 0x8d,
    0x95, 0x50, 0xf2, 0xff, 0xff, 0xe8, 0x96, 0xe2,
    0xdf, 0xff, 0x48, 0x8d, 0xbd, 0xf0, 0xf2, 0xff,
    0xff, 0x48, 0x8d, 0xb5, 0xa0, 0xf3, 0xff, 0xff,
    0xf2, 0x0f, 0x10, 0x05, 0x08, 0x3b, 0xce, 0x00,
    0xe8, 0x38, 0xd8, 0xcc, 0x00};
inline constexpr char kLocaleKey[] = "viewport.fps";

constexpr bool viewportFpsProducerReturn(std::uintptr_t extensionOffset) noexcept
{
    return extensionOffset == kMakePathFromTextReturnOffset;
}

static_assert(kMakePathFromTextCallOffset + 5U == kMakePathFromTextReturnOffset);
static_assert(kViewportFpsProducerWindowOffset +
              kViewportFpsProducerWindowBytes.size() ==
              kMakePathFromTextReturnOffset);
} // namespace native_getpath_fps_x86_64::contract
