/*
 * [INPUT]: 共享GetPath固定帮助lane及Windows原厂Alt快捷键前缀。
 * [OUTPUT]: 仅将Windows Alt前缀映射至已批准Option/Alt组合做字体准入，原显示字节不变。
 * [POS]: Windows工具帮助的薄字体策略；owner调用链仍由runtime验证，不扩大共享翻译或用户文本范围。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "../../native/getpath_font_policy.h"
#include <array>

namespace native_windows_tool_help {
inline bool approvedText(const void *text,std::size_t length,int encoding,
                         const native_getpath_font::TextEntry *entries) noexcept {
    using namespace native_getpath_font;
    if(exactText(text,length,encoding,Owner::ToolHelp,entries,kEntriesPerLocale)>=0)return true;
    constexpr char windowsPrefix[]="Alt + ",sharedPrefix[]="Option/Alt + ";
    constexpr std::size_t windowsSize=sizeof(windowsPrefix)-1,sharedSize=sizeof(sharedPrefix)-1;
    if(!text || encoding!=0 || length<=windowsSize || length>kMaxTextBytes-(sharedSize-windowsSize) ||
       std::memcmp(text,windowsPrefix,windowsSize)!=0)return false;
    // === 只在栈上构造准入比较值；传给厂商的text/length/font布局始终保全 ===
    std::array<char,kMaxTextBytes> comparison{};
    std::memcpy(comparison.data(),sharedPrefix,sharedSize);
    std::memcpy(comparison.data()+sharedSize,static_cast<const char*>(text)+windowsSize,length-windowsSize);
    return exactText(comparison.data(),length+sharedSize-windowsSize,encoding,Owner::ToolHelp,entries,kEntriesPerLocale)>=0;
}
}
