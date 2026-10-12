/**
 * [INPUT]: 依赖CoreText字符串长度、共享严格UTF-8缺字扫描及调用方SkTypeface glyph查询。
 * [OUTPUT]: 将经过完整UTF-8验证且与CFString长度一致的首缺scalar位置映射为CFRange。
 * [POS]: macOS薄适配层；不选字体、不放宽全span glyph门，其他平台只复用底层Unicode helper。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <CoreText/CoreText.h>

#include "timeline_mixed_span_utf16.h"

#include <cstddef>
#include <limits>

namespace timeline_system_fallback_mixed_span {
struct CoreTextRange {
    CFRange value{};
    bool valid = false;
};

inline CoreTextRange coreTextRangeForFirstMissingScalar(
    CFStringRef string, const void *typeface, const void *utf8,
    std::size_t byteLength,
    cavalry_i18n::mac_timeline::GlyphLookup glyph) noexcept
{
    if (string == nullptr) return {};
    const Utf16Span span = findFirstMissingUtf16Range(
        typeface, utf8, byteLength, glyph);
    const CFIndex stringLength = CFStringGetLength(string);
    if (span.status != Utf16SpanStatus::Found || stringLength < 0 ||
        span.firstMissing.length == 0 ||
        span.totalUnits != static_cast<std::size_t>(stringLength) ||
        span.firstMissing.location > static_cast<std::size_t>(std::numeric_limits<CFIndex>::max()) ||
        span.firstMissing.length > static_cast<std::size_t>(std::numeric_limits<CFIndex>::max())) {
        return {};
    }
    return {CFRangeMake(static_cast<CFIndex>(span.firstMissing.location),
                        static_cast<CFIndex>(span.firstMissing.length)), true};
}
}  // namespace timeline_system_fallback_mixed_span
