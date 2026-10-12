/**
 * [INPUT]: 依赖精确Guide caller、原文与native locale快照。
 * [OUTPUT]: 为三语返回固定Guide正文；未知输入返回空投影。
 * [POS]: 纯策略层；调用方把空投影交给唯一原callee原文转发。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "guide_body_abi_contract.h"
#include "native_locale_snapshot.h"

#include <cstdint>
#include <string_view>
#include <utility>

namespace native_guide_body {
inline constexpr std::string_view kSourceText = contract::kSourceText;

inline std::string_view approvedBody(
    std::uintptr_t callerReturnPc,
    std::uintptr_t expectedReturnPc,
    std::string_view source,
    cavalry_native_font::Locale locale) noexcept
{
    if (expectedReturnPc == 0 || callerReturnPc != expectedReturnPc ||
        source != kSourceText) return {};
    switch (locale) {
        case cavalry_native_font::Locale::Hans: return "继续…";
        case cavalry_native_font::Locale::Hant: return "繼續…";
        case cavalry_native_font::Locale::Japanese: return "続けてください…";
        case cavalry_native_font::Locale::Unset:
        case cavalry_native_font::Locale::English:
        case cavalry_native_font::Locale::Unknown:
            return {};
    }
    return {};
}

template <typename ForwardOriginal>
void forwardBodyText(
    ForwardOriginal &&forwardOriginal,
    std::uintptr_t callerReturnPc,
    std::uintptr_t expectedReturnPc,
    std::string_view source,
    cavalry_native_font::Locale locale)
{
    const std::string_view projection = approvedBody(
        callerReturnPc, expectedReturnPc, source, locale);
    std::forward<ForwardOriginal>(forwardOriginal)(projection);
}
}  // namespace native_guide_body
