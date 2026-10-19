/**
 * [INPUT]: 依赖固定 Easing 源行与 native locale 快照枚举。
 * [OUTPUT]: 只为精确源标签选择三语显示文本；其它输入返回空投影。
 * [POS]: Vendor-free 策略层；调用方保留 QAction 与 EasingMode 身份。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "native_locale_snapshot.h"

#include <cstdint>
#include <string_view>
#include <utility>

namespace native_easing_menu {
inline bool hasDisplayLocale(cavalry_native_font::Locale locale) noexcept
{
    using cavalry_native_font::Locale;
    return locale == Locale::Hans || locale == Locale::Hant ||
        locale == Locale::Japanese;
}

template <typename Rows>
std::string_view sourceProjection(
    std::string_view source,
    cavalry_native_font::Locale locale,
    const Rows &rows) noexcept
{
    using cavalry_native_font::Locale;
    if (source.empty() || !hasDisplayLocale(locale)) return {};

    std::string_view projection;
    bool found = false;
    for (const auto &row : rows) {
        if (row.source != source) continue;
        if (row.identity.empty()) return {};
        if (found) return {};
        found = true;
        switch (locale) {
            case Locale::Hans: projection = row.zhHans; break;
            case Locale::Hant: projection = row.zhHant; break;
            case Locale::Japanese: projection = row.japanese; break;
            case Locale::Unset:
            case Locale::English:
            case Locale::Unknown: return {};
        }
    }
    return found ? projection : std::string_view{};
}

// -- 正常分支只转发一次；投影异常向上传播，不重放原调用 -------------------
// -- 未知调用者先透传；精确caller才读取locale与action文本 ------------------
template <typename ForwardOriginal, typename ReadLocale, typename ReadSource,
          typename SetDisplayText, typename Rows>
void forwardProjectedAction(
    ForwardOriginal &&forwardOriginal,
    bool contractReady,
    std::uintptr_t callerReturnPc,
    std::uintptr_t expectedReturnPc,
    ReadLocale &&readLocale,
    ReadSource &&readSource,
    SetDisplayText &&setDisplayText,
    const Rows &rows)
{
    if (!contractReady || expectedReturnPc == 0 ||
        callerReturnPc != expectedReturnPc) {
        std::forward<ForwardOriginal>(forwardOriginal)();
        return;
    }

    const auto locale = std::forward<ReadLocale>(readLocale)();
    if (!hasDisplayLocale(locale)) {
        std::forward<ForwardOriginal>(forwardOriginal)();
        return;
    }

    const std::string_view source =
        std::forward<ReadSource>(readSource)();
    const std::string_view projection = sourceProjection(source, locale, rows);
    if (projection.empty()) {
        std::forward<ForwardOriginal>(forwardOriginal)();
        return;
    }

    std::forward<SetDisplayText>(setDisplayText)(projection);
    std::forward<ForwardOriginal>(forwardOriginal)();
}
}  // namespace native_easing_menu
