/**
 * [INPUT]: 依赖Fast调用返回地址、原options、固定pattern匹配和ABI合同。
 * [OUTPUT]: 提供唯一准入谓词与原C1单次透传模板。
 * [POS]: Fast适配和纯合同测试共用的窄策略；不触碰Qt运行状态。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <cstdint>

#include "fast_search_unicode_abi_contract.h"

namespace native_fast_search::policy {
template <typename ExactPattern>
inline bool eligible(
    bool admitted, std::uintptr_t returnAddress,
    std::uintptr_t expectedReturn, int options,
    ExactPattern exactPattern) noexcept(noexcept(exactPattern()))
{
    return admitted && returnAddress == expectedReturn &&
        options == abi::kNoPatternOption && exactPattern();
}

template <typename Original, typename Self, typename Pattern, typename Options>
inline void forwardOriginal(
    Original original, Self *self, const Pattern &pattern,
    const Options &originalOptions, bool useUnicodeProperties,
    const Options &unicodeOptions)
{
    original(self, pattern,
             useUnicodeProperties ? unicodeOptions : originalOptions);
}
}  // namespace native_fast_search::policy
