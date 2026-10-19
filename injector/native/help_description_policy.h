/**
 * [INPUT]: 依赖裸 runtime name、精确英文 description、三语表与唯一 locale 枚举。
 * [OUTPUT]: 复用跨平台精确description查询，提供Mac逐成员shadow构造。
 * [POS]: Mac文档对象边界；纯查询独立于libc++ ABI，未知输入保全。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "help_description_abi_contract.h"
#include "help_description_lookup.h"

#include <cstddef>
#include <string>
#include <string_view>

namespace native_help_description {
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
