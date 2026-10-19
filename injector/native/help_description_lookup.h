/**
 * [INPUT]: 裸runtime name、精确英文description、三语审批表与唯一locale。
 * [OUTPUT]: 独立main/def表视图及精确来源匹配；不依赖平台string对象布局。
 * [POS]: Mac/Windows共享帮助说明选择策略；各平台单独承担文档对象ABI与原调用转发。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "native_locale_snapshot.h"
#include <cstddef>
#include <string_view>

namespace native_help_description {
struct HelpDescriptionEntry {
    std::string_view runtimeName;
    std::string_view sourceDescription;
    std::string_view zhHans;
    std::string_view zhHant;
    std::string_view jaJp;
};
struct HelpDescriptionTableView {
    const HelpDescriptionEntry *entries = nullptr;
    std::size_t count = 0;
};
inline std::string_view approvedDescription(
    const HelpDescriptionEntry *entries,std::size_t count,
    std::string_view runtimeName,std::string_view currentDescription,
    cavalry_native_font::Locale locale) noexcept
{
    if (!entries || runtimeName.empty() || currentDescription.empty()) return {};
    using cavalry_native_font::Locale;
    if (locale!=Locale::Hans && locale!=Locale::Hant && locale!=Locale::Japanese) return {};
    for (std::size_t index=0;index<count;++index) {
        const auto &entry=entries[index];
        if (entry.runtimeName!=runtimeName) continue;
        if (entry.sourceDescription!=currentDescription) return {};
        if (locale==Locale::Hans) return entry.zhHans;
        if (locale==Locale::Hant) return entry.zhHant;
        return entry.jaJp;
    }
    return {};
}
} // namespace native_help_description
