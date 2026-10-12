/**
 * [INPUT]: 依赖裸 runtime name、精确英文 description、三语表与唯一 locale 枚举。
 * [OUTPUT]: 提供精确description查询、main/def表视图和逐成员shadow构造。
 * [POS]: 纯策略层；未知键、源漂移、English与未知locale均不改输入。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "help_description_abi_contract.h"
#include "native_locale_snapshot.h"

#include <cstddef>
#include <string>
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
    const HelpDescriptionEntry *entries,
    std::size_t count,
    std::string_view runtimeName,
    std::string_view currentDescription,
    cavalry_native_font::Locale locale) noexcept
{
    if (entries == nullptr || runtimeName.empty() || currentDescription.empty()) return {};
    switch (locale) {
        case cavalry_native_font::Locale::Hans:
        case cavalry_native_font::Locale::Hant:
        case cavalry_native_font::Locale::Japanese:
            break;
        case cavalry_native_font::Locale::Unset:
        case cavalry_native_font::Locale::English:
        case cavalry_native_font::Locale::Unknown:
            return {};
    }

    for (std::size_t index = 0; index < count; ++index) {
        const HelpDescriptionEntry &entry = entries[index];
        if (entry.runtimeName != runtimeName) continue;
        if (entry.sourceDescription != currentDescription) return {};
        switch (locale) {
            case cavalry_native_font::Locale::Hans: return entry.zhHans;
            case cavalry_native_font::Locale::Hant: return entry.zhHant;
            case cavalry_native_font::Locale::Japanese: return entry.jaJp;
            case cavalry_native_font::Locale::Unset:
            case cavalry_native_font::Locale::English:
            case cavalry_native_font::Locale::Unknown:
                return {};
        }
    }
    return {};
}

inline contract::ScriptDocumentationAbiMirror makeDescriptionShadow(
    const contract::ScriptDocumentationAbiMirror &source,
    std::string_view translatedDescription)
{
    return {
        std::string(translatedDescription.data(), translatedDescription.size()),
        source.opaqueString18,
        source.opaqueString30,
        source.opaqueString48,
        source.opaqueStrings60,
    };
}
}  // namespace native_help_description
