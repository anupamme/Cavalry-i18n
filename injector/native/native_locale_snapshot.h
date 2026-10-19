/**
 * [INPUT]: 依赖原厂std::string返回值的精确字节范围。
 * [OUTPUT]: 提供locale标签归一化与单次原生语言枚举快照。
 * [POS]: 本模块唯一语言状态；ABI转发与owner准入由native locale适配器执行。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include <atomic>
#include <string>
#include <string_view>
namespace cavalry_native_font {
// -- 原生事实：只接收厂商标签 --------------------------------------------
enum class Locale : unsigned char { Unset, English, Hans, Hant, Japanese, Unknown };
static_assert(std::atomic<Locale>::is_always_lock_free);
inline Locale normalise(std::string_view value) noexcept {
    if (value == "en-GB") return Locale::English;
    if (value == "zh-Hans") return Locale::Hans;
    if (value == "zh-Hant") return Locale::Hant;
    if (value == "ja") return Locale::Japanese;
    return Locale::Unknown;
}
class LocaleSnapshot {
    std::atomic<Locale> value_{Locale::Unset};
public:
    bool publish(std::string_view value) noexcept {
        Locale expected = Locale::Unset;
        return value_.compare_exchange_strong(expected, normalise(value),
            std::memory_order_release, std::memory_order_relaxed);
    }
    Locale value() const noexcept { return value_.load(std::memory_order_acquire); }
    const char* hint() const noexcept {
        switch (value()) {
            case Locale::Hans: return "zh-Hans";
            case Locale::Hant: return "zh-Hant";
            case Locale::Japanese: return "ja";
            default: return nullptr;
        }
    }
};
// -- 原调用：每次调用一次。original异常原样传播 --------------------------
template<class Api, class Getter>
std::string forwardNativeLocale(Api* api, Getter original, bool exactOwner,
                                LocaleSnapshot& snapshot) {
    std::string result = original(api);
    if (exactOwner)
        snapshot.publish(std::string_view(result.data(), result.size()));
    return result;
}
}
