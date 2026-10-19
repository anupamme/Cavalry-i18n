/**
 * [INPUT]: 依赖官方2.8 x86 Core GetPath与Extension缓存调用窗口。
 * [OUTPUT]: 锁定Core→缓存→固定生产者的两帧owner链。
 * [POS]: x86 ToolHelp与Viewport质量owner合同；未知生产者保持原路径。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#if !defined(__x86_64__)
#error "Cached GetPath x86_64 contract requires x86_64."
#endif

#include <array>
#include <cstdint>

namespace native_getpath_cache_x86_64::contract {
inline constexpr char kCoreUuid[] =
    "F1CF1469-3FB9-3C2B-B695-3827F32F341A";
inline constexpr char kExtensionUuid[] =
    "DB431633-99A8-3C32-89EF-3378D4B418EA";
inline constexpr char kMakePathFromTextSymbol[] =
    "__ZN7cavalry16MakePathFromTextERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEd";
inline constexpr char kGetOrCreateTextPathSymbol[] =
    "__ZN20GraphicsViewportBase19getOrCreateTextPathERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEdRNS0_13unordered_mapIS6_N7cavalry4PathENS0_4hashIS6_EENS0_8equal_toIS6_EENS4_INS0_4pairIS7_SB_EEEEEE";
inline constexpr char kToolHelpProducerSymbol[] =
    "__ZN20GraphicsViewportBase13setupToolHelpEv";
inline constexpr char kViewportStatusProducerSymbol[] =
    "__ZN20GraphicsViewportBase11renderFrameER8SkCanvasb";

inline constexpr std::uintptr_t kGetOrCreateTextPathFunctionOffset = 0x0027a610;
inline constexpr std::uintptr_t kToolHelpProducerFunctionOffset = 0x0026e550;
inline constexpr std::uintptr_t kViewportQualityProducerFunctionOffset = 0x00270490;
inline constexpr std::uintptr_t kCoreGetPathReturnOffset = 0x000797b8;
inline constexpr std::uintptr_t kCachedGetPathCallOffset = 0x0027a7bd;
inline constexpr std::uintptr_t kCachedGetPathReturnOffset = 0x0027a7c2;
inline constexpr std::uintptr_t kToolHelpProducerCallAOffset = 0x0026e67b;
inline constexpr std::uintptr_t kToolHelpProducerReturnAOffset = 0x0026e680;
inline constexpr std::uintptr_t kToolHelpProducerCallBOffset = 0x0026e698;
inline constexpr std::uintptr_t kToolHelpProducerReturnBOffset = 0x0026e69d;
inline constexpr std::uintptr_t kViewportQualityProducerCallOffset = 0x00275728;
inline constexpr std::uintptr_t kViewportQualityProducerReturnOffset = 0x0027572d;

inline constexpr std::uintptr_t kCachedGetPathWindowOffset = 0x0027a7b2;
inline constexpr std::array<std::uint8_t, 16> kCachedGetPathWindowBytes = {
    0x48, 0x89, 0xdf, 0x4c, 0x89, 0xfe, 0xf2, 0x0f,
    0x10, 0x45, 0x98, 0xe8, 0x8b, 0x82, 0xcc, 0x00,
};
inline constexpr std::uintptr_t kToolHelpProducerAWindowOffset = 0x0026e674;
inline constexpr std::array<std::uint8_t, 12> kToolHelpProducerAWindowBytes = {
    0x4c, 0x8b, 0x6d, 0xc0, 0x4c, 0x89,
    0xe9, 0xe8, 0x90, 0xbf, 0x00, 0x00,
};
inline constexpr std::uintptr_t kToolHelpProducerBWindowOffset = 0x0026e695;
inline constexpr std::array<std::uint8_t, 8> kToolHelpProducerBWindowBytes = {
    0x4c, 0x89, 0xe9, 0xe8, 0x73, 0xbf, 0x00, 0x00,
};
inline constexpr std::uintptr_t kViewportQualityProducerWindowOffset = 0x0027570b;
inline constexpr std::array<std::uint8_t, 34> kViewportQualityProducerWindowBytes = {
    0x49, 0x8d, 0x8e, 0x30, 0x05, 0x00, 0x00,
    0x48, 0x8d, 0xbd, 0xa0, 0xf3, 0xff, 0xff,
    0x48, 0x8d, 0x95, 0xf0, 0xf2, 0xff, 0xff,
    0xf2, 0x0f, 0x10, 0x05, 0xf0, 0x35, 0xce, 0x00,
    0xe8, 0xe3, 0x4e, 0x00, 0x00,
};

static_assert(kCachedGetPathCallOffset + 5U == kCachedGetPathReturnOffset);
static_assert(kToolHelpProducerCallAOffset + 5U == kToolHelpProducerReturnAOffset);
static_assert(kToolHelpProducerCallBOffset + 5U == kToolHelpProducerReturnBOffset);
static_assert(kViewportQualityProducerCallOffset + 5U ==
              kViewportQualityProducerReturnOffset);
static_assert(kCachedGetPathWindowOffset + kCachedGetPathWindowBytes.size() ==
              kCachedGetPathReturnOffset);
static_assert(kToolHelpProducerAWindowOffset + kToolHelpProducerAWindowBytes.size() ==
              kToolHelpProducerReturnAOffset);
static_assert(kToolHelpProducerBWindowOffset + kToolHelpProducerBWindowBytes.size() ==
              kToolHelpProducerReturnBOffset);
static_assert(kViewportQualityProducerWindowOffset +
              kViewportQualityProducerWindowBytes.size() ==
              kViewportQualityProducerReturnOffset);

enum class CachedProducer : std::uint8_t {
    Unknown,
    ToolHelpA,
    ToolHelpB,
    ViewportQuality,
};

constexpr CachedProducer producerForReturn(std::uintptr_t producerReturn) noexcept
{
    if (producerReturn == kToolHelpProducerReturnAOffset)
        return CachedProducer::ToolHelpA;
    if (producerReturn == kToolHelpProducerReturnBOffset)
        return CachedProducer::ToolHelpB;
    if (producerReturn == kViewportQualityProducerReturnOffset)
        return CachedProducer::ViewportQuality;
    return CachedProducer::Unknown;
}
}  // namespace native_getpath_cache_x86_64::contract
