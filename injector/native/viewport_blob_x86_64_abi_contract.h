/**
 * [INPUT]: 依赖官方2.8 x86_64 Extension与Skia机器码、Mach-O UUID。
 * [OUTPUT]: 锁定Viewport getNiceName到首个TextBlob caller及sret调用窗。
 * [POS]: 只证明固定Viewport名称路径；混合文字覆盖路径不获准入。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#if !defined(__x86_64__)
#error "Viewport TextBlob x86_64 contract requires x86_64."
#endif

#include <array>
#include <cstddef>
#include <cstdint>

namespace native_viewport_blob_x86_64::contract {
inline constexpr char kExtensionUuid[] =
    "DB431633-99A8-3C32-89EF-3378D4B418EA";
inline constexpr char kSkiaUuid[] =
    "3E709FF2-F798-3456-9282-28F9350B57A7";
inline constexpr char kCoreUuid[] =
    "F1CF1469-3FB9-3C2B-B695-3827F32F341A";

inline constexpr char kViewportNameLambdaSymbol[] =
    "__ZZN20GraphicsViewportBase11renderFrameER8SkCanvasbENK4$_35clEP12DrawableNodeb";
inline constexpr std::uintptr_t kViewportNameLambdaOffset = 0x278050;
inline constexpr std::array<std::uint8_t, 45> kViewportNameLambdaEntryBytes = {
    0x55, 0x48, 0x89, 0xe5, 0x41, 0x57, 0x41, 0x56,
    0x41, 0x55, 0x41, 0x54, 0x53, 0x48, 0x81, 0xec,
    0xe8, 0x02, 0x00, 0x00, 0x89, 0xd3, 0x49, 0x89,
    0xf7, 0x49, 0x89, 0xfe, 0x48, 0x8b, 0x05, 0x7d,
    0x0b, 0xf5, 0x00, 0x48, 0x8b, 0x00, 0x48, 0x89,
    0x45, 0xd0, 0x48, 0x8b, 0x3f};

// -- getNiceName writes the source into the fixed local std::string ---------
inline constexpr std::uintptr_t kGetNiceNameCallOffset = 0x27809a;
inline constexpr std::array<std::uint8_t, 15> kGetNiceNameCallWindowBytes = {
    0x48, 0x8d, 0xbd, 0x30, 0xff, 0xff, 0xff, 0x4c,
    0x89, 0xfe, 0xe8, 0x80, 0xa7, 0xcc, 0x00};
inline constexpr char kGetNiceNameSymbol[] = "__ZN7cavalry11getNiceNameEPK8NodeBase";
inline constexpr std::uintptr_t kGetNiceNameExportOffset = 0x420630;
inline constexpr std::uintptr_t kNameObjectBelowFrame = 0xd0;
inline constexpr std::size_t kStringObjectBytes = 0x18;
inline constexpr std::uintptr_t kStringTagOffset = 0x00;
inline constexpr std::uint8_t kLongStringFlagMask = 0x01;
inline constexpr std::uintptr_t kLongStringLengthOffset = 0x08;
inline constexpr std::uintptr_t kLongStringDataOffset = 0x10;
inline constexpr std::uintptr_t kShortStringDataOffset = 0x01;
inline constexpr std::uint8_t kShortStringLengthShift = 1;
inline constexpr std::size_t kShortStringCapacity = 22;
inline constexpr std::size_t kMaximumNameBytes = 16384;
inline constexpr std::uintptr_t kNameDecodeOffset = 0x27826d;
inline constexpr std::array<std::uint8_t, 41> kNameDecodeWindowBytes = {
    0x0f, 0xb6, 0x95, 0x30, 0xff, 0xff, 0xff, 0x48,
    0x8d, 0x9d, 0x31, 0xff, 0xff, 0xff, 0xf6, 0xc2,
    0x01, 0x74, 0x10, 0x48, 0x8b, 0xb5, 0x40, 0xff,
    0xff, 0xff, 0x48, 0x8b, 0x95, 0x38, 0xff, 0xff,
    0xff, 0xeb, 0x06, 0x48, 0xd1, 0xea, 0x48, 0x89,
    0xde};

// -- 首个Blob使用完整裁切后名称；第二个Blob只绘制variant，不准入 ---------
inline constexpr char kMakeFromTextSymbol[] =
    "__ZN10SkTextBlob12MakeFromTextEPKvmRK6SkFont14SkTextEncoding";
inline constexpr std::uintptr_t kMakeFromTextOffset = 0x1e34d0;
inline constexpr std::uintptr_t kViewportBlobCallOffset = 0x278dd1;
inline constexpr std::uintptr_t kViewportBlobReturnOffset = 0x278dd6;
inline constexpr std::array<std::uint8_t, 38> kViewportBlobCallWindowBytes = {
    0x48, 0x8d, 0x0d, 0xc4, 0x5e, 0xfd, 0x00, 0x48,
    0x8d, 0x7d, 0x90, 0x4c, 0x89, 0xee, 0x48, 0x89,
    0xc2, 0x45, 0x31, 0xc0, 0xe8, 0x77, 0x6f, 0xcc,
    0x00, 0x48, 0x8b, 0x75, 0x90, 0x48, 0x85, 0xf6,
    0x0f, 0x84, 0xd1, 0x03, 0x00, 0x00};
inline constexpr std::uintptr_t kMixedVariantBlobCallOffset = 0x278fe5;
inline constexpr std::uintptr_t kMixedVariantBlobReturnOffset = 0x278fea;
inline constexpr std::array<std::uint8_t, 26> kMixedVariantBlobCallWindowBytes = {
    0x48, 0x8b, 0x53, 0x08, 0x48, 0x8b, 0x73, 0x10,
    0x48, 0x8d, 0xbd, 0x60, 0xfe, 0xff, 0xff, 0x4c,
    0x89, 0xf9, 0x45, 0x31, 0xc0, 0xe8, 0x63, 0x6d,
    0xcc, 0x00};

inline constexpr std::array<std::uint8_t, 32> kMakeFromTextFunctionBytes = {
    0x55, 0x48, 0x89, 0xe5, 0x41, 0x57, 0x41, 0x56,
    0x41, 0x55, 0x41, 0x54, 0x53, 0x48, 0x81, 0xec,
    0x98, 0x00, 0x00, 0x00, 0x45, 0x89, 0xc4, 0x49,
    0x89, 0xce, 0x48, 0x89, 0xf3, 0x49, 0x89, 0xff};
inline constexpr std::uintptr_t kSretSlotBelowFrame = 0x70;

inline constexpr bool exactViewportNameBlobCaller(
    std::uintptr_t extensionOffset) noexcept
{
    return extensionOffset == kViewportBlobReturnOffset;
}

static_assert(kViewportBlobCallOffset + 5U == kViewportBlobReturnOffset);
static_assert(kMixedVariantBlobCallOffset + 5U == kMixedVariantBlobReturnOffset);
static_assert(kStringObjectBytes == 24U && kNameObjectBelowFrame == 0xd0U);
static_assert(kViewportBlobCallWindowBytes.size() == 38U);
} // namespace native_viewport_blob_x86_64::contract
