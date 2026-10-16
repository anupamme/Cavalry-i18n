/**
 * [INPUT]: 依赖native locale、生成的有限文字/位置表和已验证源字节。
 * [OUTPUT]: 提供JS字面量投影与optional原函数单次透传策略。
 * [POS]: Demo菜单读回的纯策略；未知owner、路径或文本保留原optional。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <cstddef>
#include <cstdint>
#include <optional>
#include <string>
#include <string_view>
#include <utility>

#include "native_locale_snapshot.h"
#include "demo_reader_source_identity.h"
#include "demo_reader_abi_contract.h"

namespace native_demo_reader {
struct DemoReaderText {
    std::string_view source;
    std::string_view hans;
    std::string_view hant;
    std::string_view japanese;
};
struct DemoReaderSlot {
    std::uint32_t start;
    std::uint32_t end;
    std::uint32_t textIndex;
    char quote;
};
struct DemoReaderFile {
    std::string_view relativePath;
    std::string_view sha256;
    std::uint32_t bytes;
    std::uint32_t slotBegin;
    std::uint32_t slotCount;
};

inline std::string_view translationFor(
    const DemoReaderText &text, cavalry_native_font::Locale locale) noexcept
{
    switch (locale) {
        case cavalry_native_font::Locale::Hans: return text.hans;
        case cavalry_native_font::Locale::Hant: return text.hant;
        case cavalry_native_font::Locale::Japanese: return text.japanese;
        case cavalry_native_font::Locale::Unset:
        case cavalry_native_font::Locale::English:
        case cavalry_native_font::Locale::Unknown: return {};
    }
    return {};
}

inline bool appendJavaScriptLiteral(
    std::string_view value, char quote, std::string *output)
{
    if (output == nullptr || (quote != '\'' && quote != '"')) return false;
    output->push_back(quote);
    for (std::size_t index = 0; index < value.size(); ++index) {
        const unsigned char byte = static_cast<unsigned char>(value[index]);
        if (byte == static_cast<unsigned char>(quote) || byte == '\\') {
            output->push_back('\\');
            output->push_back(static_cast<char>(byte));
        } else if (byte < 0x20U) {
            switch (byte) {
                case '\n': output->append("\\n"); break;
                case '\r': output->append("\\r"); break;
                case '\t': output->append("\\t"); break;
                case '\b': output->append("\\b"); break;
                case '\f': output->append("\\f"); break;
                default:
                    static constexpr char kHex[] = "0123456789abcdef";
                    output->append("\\u00");
                    output->push_back(kHex[(byte >> 4U) & 0x0fU]);
                    output->push_back(kHex[byte & 0x0fU]);
                    break;
            }
        } else if (byte == 0xe2U && index + 2U < value.size() &&
                   static_cast<unsigned char>(value[index + 1U]) == 0x80U &&
                   (static_cast<unsigned char>(value[index + 2U]) == 0xa8U ||
                    static_cast<unsigned char>(value[index + 2U]) == 0xa9U)) {
            output->append(static_cast<unsigned char>(value[index + 2U]) == 0xa8U
                ? "\\u2028" : "\\u2029");
            index += 2U;
        } else {
            output->push_back(static_cast<char>(byte));
        }
    }
    output->push_back(quote);
    return true;
}

template<std::size_t TextCount, std::size_t SlotCount>
bool projectScript(
    std::string_view source, const DemoReaderFile &file,
    const DemoReaderText (&texts)[TextCount], const DemoReaderSlot (&slots)[SlotCount],
    cavalry_native_font::Locale locale, std::string *output)
{
    if (output == nullptr || source.size() != file.bytes ||
        file.slotCount == 0 || file.slotBegin > SlotCount ||
        file.slotCount > SlotCount - file.slotBegin) return false;

    std::string projected;
    projected.reserve(source.size());
    std::size_t cursor = 0;
    const std::size_t endSlot = static_cast<std::size_t>(file.slotBegin) + file.slotCount;
    for (std::size_t index = file.slotBegin; index < endSlot; ++index) {
        const DemoReaderSlot &slot = slots[index];
        if (slot.start < cursor || slot.end <= slot.start || slot.end > source.size() ||
            slot.textIndex >= TextCount || (slot.quote != '\'' && slot.quote != '"') ||
            source[slot.start] != slot.quote || source[slot.end - 1U] != slot.quote) return false;
        const std::string_view translated = translationFor(texts[slot.textIndex], locale);
        if (translated.empty()) return false;
        projected.append(source.data() + cursor, slot.start - cursor);
        if (!appendJavaScriptLiteral(translated, slot.quote, &projected)) return false;
        cursor = slot.end;
    }
    projected.append(source.data() + cursor, source.size() - cursor);
    output->swap(projected);
    return true;
}

template<std::size_t TextCount, std::size_t SlotCount, typename LocaleGetter>
bool projectVerifiedScript(
    std::string_view source, const DemoReaderFile &file,
    const DemoReaderText (&texts)[TextCount],
    const DemoReaderSlot (&slots)[SlotCount], LocaleGetter &&locale,
    std::string *output)
{
    if (source.size() != file.bytes || !sourceDigestMatches(source, file.sha256))
        return false;
    return projectScript(source, file, texts, slots,
                         std::forward<LocaleGetter>(locale)(), output);
}

// -- 原厂optional结果先产生；后续投影失败时保留原字节 ----------------------
template<typename Original, typename LocaleGetter, typename Projector>
contract::TextFromFileResult forwardOnce(
    Original &&original, bool exactCaller, bool exactPath,
    LocaleGetter &&locale, Projector &&project)
{
    contract::TextFromFileResult result = std::forward<Original>(original)();
    if (!result || !exactCaller || !exactPath) return result;
    try {
        std::string projected;
        if (std::forward<Projector>(project)(
                std::string_view(*result), std::forward<LocaleGetter>(locale), &projected)) {
            result->swap(projected);
        }
    } catch (...) {
        // -- 原文已完整保留；仅放弃本次显示投影 -----------------------------
    }
    return result;
}
}  // namespace native_demo_reader
