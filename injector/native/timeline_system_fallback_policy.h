/**
 * [INPUT]: 依赖共享严格UTF-8策略、caller、owner与SkFont快照事实。
 * [OUTPUT]: 提供非文本缓存键、locale哨兵、owner/字号门和纯策略。
 * [POS]: 系统字体回退共用边界；它不调用CoreText或vendor ABI。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "../cavalry_i18n_macos_timeline_font_policy.h"

#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <mutex>

namespace timeline_system_fallback::policy {
using GlyphLookup = cavalry_i18n::mac_timeline::GlyphLookup;
inline constexpr std::size_t kFontSizeOffset = 8;
inline constexpr std::size_t kFontStyleOffset = 12;
inline constexpr std::size_t kFontSemanticEnd = 23;
inline constexpr std::size_t kFontStyleBytes = kFontSemanticEnd - kFontStyleOffset;
inline constexpr std::size_t kFontSemanticBytes = kFontSemanticEnd - kFontSizeOffset;
inline constexpr std::size_t kPostScriptNameBytes = 256;

enum class Caller : std::uint8_t { Measure = 0, Draw = 1 };
enum class Locale : std::uint8_t { Hans = 0, Hant = 1, Japanese = 2, Unset = 255 };
enum class TextDisposition : std::uint8_t {
    Invalid,
    Ascii,
    OriginalCovers,
    NeedsSystemFallback
};
enum class SlotLookupKind : std::uint8_t { Hit, Reserved, Full };

struct FontKey {
    std::array<char, kPostScriptNameBytes> postScriptName{};
    std::uint32_t symbolicTraits = 0;
    std::uint64_t weightBits = 0;
    std::uint64_t widthBits = 0;
    std::uint64_t slantBits = 0;
    Locale locale = Locale::Hans;
    Caller caller = Caller::Measure;
};

struct FontTraits {
    std::uint32_t symbolic = 0;
    std::uint64_t weightBits = 0;
    std::uint64_t widthBits = 0;
    std::uint64_t slantBits = 0;
};

inline bool sameFontTraits(const FontTraits &left, const FontTraits &right) noexcept
{
    return left.symbolic == right.symbolic && left.weightBits == right.weightBits &&
           left.widthBits == right.widthBits && left.slantBits == right.slantBits;
}

struct SlotLookup {
    SlotLookupKind kind = SlotLookupKind::Full;
    std::size_t index = 0;
};

struct OwnerProof {
    bool exactCaller = false;
    bool readable = false;
    bool pointerMatches = false;
    bool lengthMatches = false;
    bool completeSpan = false;
};

inline bool ownerIsComplete(const OwnerProof &proof) noexcept
{
    return proof.exactCaller && proof.readable && proof.pointerMatches &&
           proof.lengthMatches && proof.completeSpan;
}

inline bool validFontSize(float size) noexcept
{
    return std::isfinite(size) && size > 0.0F;
}

inline TextDisposition classifyText(const void *originalTypeface,
                                    const void *text, std::size_t size,
                                    int encoding, GlyphLookup glyph) noexcept
{
    if (!originalTypeface || !text || size == 0 ||
        size > cavalry_i18n::mac_timeline::kMaxTextBytes || encoding != 0 || !glyph) {
        return TextDisposition::Invalid;
    }
    const auto *bytes = static_cast<const unsigned char *>(text);
    std::size_t offset = 0;
    bool nonAscii = false;
    bool missing = false;
    while (offset < size) {
        std::int32_t codepoint = 0;
        if (!cavalry_i18n::mac_timeline::nextCodepoint(bytes, size, offset, codepoint)) {
            return TextDisposition::Invalid;
        }
        nonAscii |= codepoint >= 0x80;
        if (codepoint > 0x20 && glyph(originalTypeface, codepoint) == 0) missing = true;
    }
    if (!nonAscii) return TextDisposition::Ascii;
    return missing ? TextDisposition::NeedsSystemFallback : TextDisposition::OriginalCovers;
}

inline const void *selectWholeSpan(const void *originalTypeface,
                                   const void *fallbackTypeface,
                                   const void *text, std::size_t size,
                                   int encoding, GlyphLookup glyph) noexcept
{
    if (!fallbackTypeface) return originalTypeface;
    const void *faces[] = {fallbackTypeface};
    return cavalry_i18n::mac_timeline::selectTypeface(
        originalTypeface, faces, 1, text, size, encoding, glyph);
}

template <typename ResolveFallback>
inline const void *selectForOwner(const OwnerProof &proof,
                                 const void *originalTypeface,
                                 const void *text, std::size_t size,
                                 int encoding, GlyphLookup glyph,
                                 ResolveFallback resolveFallback,
                                 TextDisposition *dispositionOutput = nullptr) noexcept
{
    if (dispositionOutput != nullptr) *dispositionOutput = TextDisposition::Invalid;
    if (!ownerIsComplete(proof)) return originalTypeface;
    const TextDisposition disposition = classifyText(
        originalTypeface, text, size, encoding, glyph);
    if (dispositionOutput != nullptr) *dispositionOutput = disposition;
    if (disposition != TextDisposition::NeedsSystemFallback) return originalTypeface;
    const void *fallbackTypeface = resolveFallback();
    return selectWholeSpan(originalTypeface, fallbackTypeface, text, size, encoding, glyph);
}

inline bool makeFontKey(const char *postScriptName, std::uint32_t symbolicTraits,
                        std::uint64_t weightBits, std::uint64_t widthBits,
                        std::uint64_t slantBits, Locale locale, Caller caller,
                        FontKey *output) noexcept
{
    if (!postScriptName || !output) return false;
    const void *terminator = std::memchr(postScriptName, '\0', kPostScriptNameBytes);
    if (!terminator || terminator == postScriptName) return false;
    FontKey key{};
    const auto length = static_cast<std::size_t>(
        static_cast<const char *>(terminator) - postScriptName);
    std::memcpy(key.postScriptName.data(), postScriptName, length);
    key.symbolicTraits = symbolicTraits;
    key.weightBits = weightBits;
    key.widthBits = widthBits;
    key.slantBits = slantBits;
    key.locale = locale;
    key.caller = caller;
    *output = key;
    return true;
}

inline bool sameFontKey(const FontKey &left, const FontKey &right) noexcept
{
    return left.postScriptName == right.postScriptName &&
           left.symbolicTraits == right.symbolicTraits &&
           left.weightBits == right.weightBits && left.widthBits == right.widthBits &&
           left.slantBits == right.slantBits && left.locale == right.locale &&
           left.caller == right.caller;
}

template <std::size_t Capacity>
class FixedFontKeyTable {
public:
    SlotLookup lookupOrReserve(const FontKey &key) noexcept
    {
        for (std::size_t index = 0; index < used_; ++index) {
            if (sameFontKey(keys_[index], key)) return {SlotLookupKind::Hit, index};
        }
        if (used_ == Capacity) return {SlotLookupKind::Full, 0};
        const std::size_t index = used_++;
        keys_[index] = key;
        return {SlotLookupKind::Reserved, index};
    }

    constexpr std::size_t capacity() const noexcept { return Capacity; }
    std::size_t size() const noexcept { return used_; }

private:
    std::array<FontKey, Capacity> keys_{};
    std::size_t used_ = 0;
};

inline bool sameFontStyle(const void *font, const void *original) noexcept
{
    if (!font || !original) return false;
    const auto *left = static_cast<const unsigned char *>(font);
    const auto *right = static_cast<const unsigned char *>(original);
    return std::memcmp(left + kFontStyleOffset, right + kFontStyleOffset,
                       kFontStyleBytes) == 0;
}

inline bool sameFontSemantics(const void *font, const void *original) noexcept
{
    if (!font || !original) return false;
    const auto *left = static_cast<const unsigned char *>(font);
    const auto *right = static_cast<const unsigned char *>(original);
    return std::memcmp(left + kFontSizeOffset, right + kFontSizeOffset,
                       kFontSemanticBytes) == 0;
}

template <typename SetSize>
bool resizeAndValidate(void *slotFont, const void *originalFont, float size,
                       SetSize setSize) noexcept
{
    if (!slotFont || !originalFont || !validFontSize(size) ||
        !sameFontStyle(slotFont, originalFont)) return false;
    setSize(slotFont, size);
    return sameFontSemantics(slotFont, originalFont);
}

class OriginalCallScope {
public:
    explicit OriginalCallScope(bool &inside) noexcept : inside_(inside), previous_(inside)
    {
        inside_ = true;
    }
    ~OriginalCallScope() { inside_ = previous_; }
    OriginalCallScope(const OriginalCallScope &) = delete;
    OriginalCallScope &operator=(const OriginalCallScope &) = delete;
private:
    bool &inside_;
    bool previous_;
};

template <typename Original>
auto callOriginalOnce(bool &insideOriginal, Original original)
    -> decltype(original())
{
    if (insideOriginal) return original();
    OriginalCallScope scope(insideOriginal);
    return original();
}

template <typename Original, typename SelectSlot>
auto callWithLockedSlot(std::mutex &mutex, bool &insideOriginal,
                        const void *originalFont, Original original,
                        SelectSlot selectSlot)
    -> decltype(original(originalFont))
{
    if (insideOriginal) return original(originalFont);
    std::unique_lock<std::mutex> lock(mutex);
    const void *slotFont = selectSlot();
    if (!slotFont) {
        lock.unlock();
        OriginalCallScope scope(insideOriginal);
        return original(originalFont);
    }
    OriginalCallScope scope(insideOriginal);
    return original(slotFont);
}
}  // namespace timeline_system_fallback::policy
