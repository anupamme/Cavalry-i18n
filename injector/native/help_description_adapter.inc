/**
 * [INPUT]: 依赖原import、owner/key、main/def caller PC、分表与同TU gLocale。
 * [OUTPUT]: 提供一次原 callee 转发；只在 caller、key、原文和 locale 全匹配时换说明。
 * [POS]: 两caller按LR选独立表；同名异源不串表，不创建getter或locale状态。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "help_description_policy.h"

#include <cstdint>
#include <string>

namespace native_help_description {
using AddScriptDocumentationEntry = void (*) (
    void *owner,
    const std::string &key,
    const contract::ScriptDocumentationAbiMirror &documentation);

template <typename LocaleSnapshot>
void forwardAddScriptDocumentationEntry(
    AddScriptDocumentationEntry original,
    void *owner,
    const std::string &key,
    const contract::ScriptDocumentationAbiMirror &documentation,
    std::uintptr_t callerReturnPc,
    std::uintptr_t expectedMainReturnPc,
    std::uintptr_t expectedDefReturnPc,
    const LocaleSnapshot &localeSnapshot,
    HelpDescriptionTableView mainTable,
    HelpDescriptionTableView defTable)
{
    // -- 安装门先核对 two-level 原 import；此处不重解析、不重试、不吞异常 --------
    HelpDescriptionTableView table;
    if (callerReturnPc == expectedMainReturnPc) {
        table = mainTable;
    } else if (callerReturnPc == expectedDefReturnPc) {
        table = defTable;
    } else {
        original(owner, key, documentation);
        return;
    }

    const std::string_view translated = approvedDescription(
        table.entries,
        table.count,
        std::string_view(key.data(), key.size()),
        std::string_view(documentation.description.data(),
                         documentation.description.size()),
        localeSnapshot.value());
    if (translated.empty()) {
        original(owner, key, documentation);
        return;
    }

    const contract::ScriptDocumentationAbiMirror shadow =
        makeDescriptionShadow(documentation, translated);
    original(owner, key, shadow);
}
}  // namespace native_help_description
