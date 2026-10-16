/**
 * [INPUT]: 依赖官方2.8 x86_64 Extension/libskia UUID与$_46测量/绘制调用窗。
 * [OUTPUT]: 固定closure捕获、目标调用、代码窗和返回PC。
 * [POS]: 仅证明x86_64静态调用点；不证明被捕对象的字段布局。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#if !defined(__x86_64__)
#error "Timeline x86_64 ABI contract requires an x86_64 target."
#endif

#include <array>
#include <cstddef>
#include <cstdint>

namespace timeline_owner_observer::x86_64_contract {
inline constexpr char kExtensionUuid[] =
    "DB431633-99A8-3C32-89EF-3378D4B418EA";
inline constexpr char kSkiaUuid[] =
    "3E709FF2-F798-3456-9282-28F9350B57A7";
inline constexpr char kMeasureSymbol[] =
    "__ZNK6SkFont11measureTextEPKvm14SkTextEncodingP6SkRectPK7SkPaint";
inline constexpr char kDrawSymbol[] =
    "__ZN8SkCanvas14drawSimpleTextEPKvm14SkTextEncodingffRK6SkFontRK7SkPaint";
inline constexpr char kPaintNodeTextSymbol[] =
    "__ZN7cavalry16SkTimeEditorView13paintNodeTextEP8SkCanvasd4num2IdES4_RKNS_9RectangleE";
inline constexpr char kTimelineClosureSymbol[] =
    "__ZZN7cavalry16SkTimeEditorView13paintNodeTextEP8SkCanvasd4num2IdES4_RKNS_9RectangleEENK4$_46clEdd";

inline constexpr std::uintptr_t kMeasureSymbolOffset = 0x123060;
inline constexpr std::uintptr_t kDrawSymbolOffset = 0x0ffec0;
inline constexpr std::uintptr_t kPaintNodeTextOffset = 0x688980;
inline constexpr std::uintptr_t kClosureCallOffset = 0x688d69;
inline constexpr std::uintptr_t kClosureEntryOffset = 0x689c30;
inline constexpr std::uintptr_t kClosureCaptureOffset = 0x689c73;
inline constexpr std::uintptr_t kMeasureCaptureLoadOffset = 0x689d37;
inline constexpr std::uintptr_t kMeasureArgSetupOffset = 0x689d54;
inline constexpr std::uintptr_t kMeasureCallOffset = 0x689d6e;
inline constexpr std::uintptr_t kMeasureReturnOffset = 0x689d73;
inline constexpr std::uintptr_t kMeasureReturnUseOffset = 0x689d73;
inline constexpr std::uintptr_t kDrawCaptureLoadOffset = 0x68a21f;
inline constexpr std::uintptr_t kDrawTextArgSetupOffset = 0x68a21b;
inline constexpr std::uintptr_t kDrawFloatArgSetupOffset = 0x68a244;
inline constexpr std::uintptr_t kDrawCallOffset = 0x68a25b;
inline constexpr std::uintptr_t kDrawReturnOffset = 0x68a260;
inline constexpr std::uintptr_t kCapturePointerOffset = 0x18;

inline constexpr std::array<std::uint8_t, 5> kClosureCallBytes = {
    0xe8, 0xc2, 0x0e, 0x00, 0x00};
inline constexpr std::array<std::uint8_t, 3> kClosureCaptureBytes = {
    0x48, 0x89, 0xfb};
inline constexpr std::array<std::uint8_t, 4> kMeasureCaptureLoadBytes = {
    0x4c, 0x8b, 0x73, 0x18};
inline constexpr std::array<std::uint8_t, 5> kMeasureOpaqueByteReadBytes = {
    0x41, 0xf6, 0x46, 0x08, 0x01};
inline constexpr std::array<std::uint8_t, 5> kMeasureCallBytes = {
    0xe8, 0x6e, 0xaa, 0x8b, 0x00};
inline constexpr std::array<std::uint8_t, 26> kMeasureArgSetupBytes = {
    0x48, 0x8d, 0x7d, 0xa0, 0x4c, 0x8d, 0x85, 0x00, 0xff,
    0xff, 0xff, 0x4c, 0x8d, 0x8d, 0x80, 0xfd, 0xff, 0xff,
    0x4c, 0x89, 0xf6, 0x48, 0x89, 0xc2, 0x31, 0xc9};
inline constexpr std::array<std::uint8_t, 4> kMeasureReturnUseBytes = {
    0x48, 0x8b, 0x43, 0x20};
inline constexpr std::array<std::uint8_t, 4> kDrawCaptureLoadBytes = {
    0x48, 0x8b, 0x73, 0x18};
inline constexpr std::array<std::uint8_t, 5> kDrawCallBytes = {
    0xe8, 0xd9, 0x92, 0x8b, 0x00};
inline constexpr std::array<std::uint8_t, 37> kDrawTextArgSetupBytes = {
    0x48, 0x8b, 0x4b, 0x08, 0x48, 0x8b, 0x73, 0x18, 0x48, 0x8b,
    0x39, 0x0f, 0xb6, 0x56, 0x08, 0xf6, 0xc2, 0x01, 0x75, 0x09,
    0x48, 0x83, 0xc6, 0x09, 0x48, 0xd1, 0xea, 0xeb, 0x08, 0x48,
    0x8b, 0x56, 0x10, 0x48, 0x8b, 0x76, 0x18};
inline constexpr std::array<std::uint8_t, 23> kDrawFloatArgSetupBytes = {
    0x0f, 0x57, 0xc0, 0xf3, 0x0f, 0x2a, 0xc0, 0x4c, 0x8d, 0x45,
    0xa0, 0x4c, 0x8d, 0x8d, 0x80, 0xfd, 0xff, 0xff, 0x0f, 0x57,
    0xc9, 0x31, 0xc9};

static_assert(kMeasureCallOffset + kMeasureCallBytes.size() ==
              kMeasureReturnOffset);
static_assert(kDrawCallOffset + kDrawCallBytes.size() == kDrawReturnOffset);
static_assert(kCapturePointerOffset == 0x18);
}  // namespace timeline_owner_observer::x86_64_contract
