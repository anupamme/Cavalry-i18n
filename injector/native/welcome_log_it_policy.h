/**
 * [INPUT]: 依赖固定Welcome源文、三语批准译文、原payload与locale快照。
 * [OUTPUT]: 只投影裸Welcome或两种精确节日payload并保留后缀。
 * [POS]: 无状态纯文本策略；未知suffix、locale和caller都保留原消息。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <cstddef>
#include <cstdint>
#include <cstring>

namespace welcome_log_it::policy {

inline constexpr char kSource[] = "Welcome to Cavalry.";
inline constexpr char kNewYearSuffix[] = " Happy New Year!";
inline constexpr char kHolidaySuffix[] = " Happy Holidays!";
inline constexpr char kHans[] = "欢迎使用 Cavalry。";
inline constexpr char kHant[] = "歡迎使用 Cavalry。";
inline constexpr char kJapanese[] = "Cavalry へようこそ。";
inline constexpr std::size_t kMaxProjectedBytes = 64;

enum class Locale : std::uint8_t { Unknown, Hans, Hant, Japanese };
enum class PayloadKind : std::uint8_t { Other, Bare, NewYear, Holidays };

inline PayloadKind classify(const char *payload, std::size_t size) noexcept
{
    constexpr std::size_t sourceSize = sizeof(kSource) - 1;
    constexpr std::size_t newYearSize = sizeof(kNewYearSuffix) - 1;
    constexpr std::size_t holidaySize = sizeof(kHolidaySuffix) - 1;
    if (payload == nullptr || size < sourceSize ||
        std::memcmp(payload, kSource, sourceSize) != 0) return PayloadKind::Other;
    if (size == sourceSize) return PayloadKind::Bare;
    if (size == sourceSize + newYearSize &&
        std::memcmp(payload + sourceSize, kNewYearSuffix, newYearSize) == 0)
        return PayloadKind::NewYear;
    if (size == sourceSize + holidaySize &&
        std::memcmp(payload + sourceSize, kHolidaySuffix, holidaySize) == 0)
        return PayloadKind::Holidays;
    return PayloadKind::Other;
}

inline const char *translatedSource(Locale locale, std::size_t *size) noexcept
{
    if (size == nullptr) return nullptr;
    switch (locale) {
        case Locale::Hans:
            *size = sizeof(kHans) - 1;
            return kHans;
        case Locale::Hant:
            *size = sizeof(kHant) - 1;
            return kHant;
        case Locale::Japanese:
            *size = sizeof(kJapanese) - 1;
            return kJapanese;
        case Locale::Unknown:
            *size = 0;
            return nullptr;
    }
    *size = 0;
    return nullptr;
}

inline bool projectPayload(const char *payload, std::size_t size, Locale locale,
                           char *output, std::size_t capacity,
                           std::size_t *outputSize) noexcept
{
    if (output == nullptr || outputSize == nullptr) return false;
    const PayloadKind kind = classify(payload, size);
    if (kind == PayloadKind::Other) return false;

    std::size_t translatedSize = 0;
    const char *translated = translatedSource(locale, &translatedSize);
    if (translated == nullptr) return false;

    const char *suffix = "";
    std::size_t suffixSize = 0;
    if (kind == PayloadKind::NewYear) {
        suffix = kNewYearSuffix;
        suffixSize = sizeof(kNewYearSuffix) - 1;
    } else if (kind == PayloadKind::Holidays) {
        suffix = kHolidaySuffix;
        suffixSize = sizeof(kHolidaySuffix) - 1;
    }
    if (translatedSize > capacity || suffixSize > capacity - translatedSize ||
        translatedSize + suffixSize > kMaxProjectedBytes) return false;

    std::memcpy(output, translated, translatedSize);
    if (suffixSize != 0)
        std::memcpy(output + translatedSize, suffix, suffixSize);
    *outputSize = translatedSize + suffixSize;
    return true;
}

}  // namespace welcome_log_it::policy
