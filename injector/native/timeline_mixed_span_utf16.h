/**
 * [INPUT]: 依赖锁定E4严格UTF-8 decoder、完整UTF-8 span及原SkTypeface逐scalar glyph查询。
 * [OUTPUT]: 提供全串验证后的首个缺glyph scalar UTF-16 range及明确的无缺字/非法状态。
 * [POS]: 平台无关range策略；CoreText/DirectWrite只消费该结果作薄API适配，不包含词表或字体选择。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "../cavalry_i18n_macos_timeline_font_policy.h"

#include <cstddef>
#include <cstdint>

namespace timeline_system_fallback_mixed_span {
enum class Utf16SpanStatus : std::uint8_t {
    InvalidArgument,
    InvalidUtf8,
    NoMissingGlyph,
    Found
};

struct Utf16Range {
    std::size_t location = 0;
    std::size_t length = 0;
};

struct Utf16Span {
    Utf16SpanStatus status = Utf16SpanStatus::InvalidArgument;
    Utf16Range firstMissing{};
    std::size_t totalUnits = 0;
};

// 扫描完整UTF-8 span；即使已经找到缺字，也继续验证后缀再发布范围。
inline Utf16Span findFirstMissingUtf16Range(
    const void *typeface, const void *text, std::size_t byteLength,
    cavalry_i18n::mac_timeline::GlyphLookup glyph) noexcept
{
    using cavalry_i18n::mac_timeline::kMaxTextBytes;
    using cavalry_i18n::mac_timeline::nextCodepoint;
    if (typeface == nullptr || text == nullptr || byteLength == 0 ||
        byteLength > kMaxTextBytes || glyph == nullptr) {
        return {Utf16SpanStatus::InvalidArgument, {}, 0};
    }

    const auto *bytes = static_cast<const unsigned char *>(text);
    std::size_t byteOffset = 0;
    std::size_t utf16Offset = 0;
    Utf16Range firstMissing{};
    bool found = false;
    while (byteOffset < byteLength) {
        std::int32_t codepoint = 0;
        if (!nextCodepoint(bytes, byteLength, byteOffset, codepoint)) {
            // 输入尾部非法时，绝不暴露前缀扫描中暂存的局部range。
            return {Utf16SpanStatus::InvalidUtf8, {}, 0};
        }
        const std::size_t width = codepoint > 0xFFFF ? 2 : 1;
        if (!found && codepoint > 0x20 && glyph(typeface, codepoint) == 0) {
            firstMissing = {utf16Offset, width};
            found = true;
        }
        utf16Offset += width;
    }
    return {found ? Utf16SpanStatus::Found : Utf16SpanStatus::NoMissingGlyph,
            firstMissing, utf16Offset};
}
}  // namespace timeline_system_fallback_mixed_span
