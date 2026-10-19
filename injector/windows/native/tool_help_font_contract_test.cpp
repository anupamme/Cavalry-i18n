/*
 * [INPUT]: Windows前缀薄策略与共享三语固定帮助lane。
 * [OUTPUT]: 三语Alt组合正例、源字节保全及未知文本/编码/长度拒绝回归。
 * [POS]: Pivot实屏缺字根因的隔离合同；不启动宿主或授像素PASS。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "tool_help_font_policy.h"
#include "../../native/getpath_font_texts.inc"
#include <string>
#include <cstdio>

int main(){
    using namespace native_getpath_font;
    const TextEntry *lanes[]={kZhHansEntries,kZhHantEntries,kJaJpEntries};
    for(const auto *lane:lanes){
        const std::string shared=lane[71].text;
        if(shared.rfind("Option/Alt + ",0)!=0)return 1;
        const std::string windows="Alt + "+shared.substr(13),before=windows;
        // 旧共享策略确实拒绝此Windows原厂组合，避免回归测试没有命中原缺口。
        if(exactText(windows.data(),windows.size(),0,Owner::ToolHelp,lane,75)>=0)return 2;
        if(!native_windows_tool_help::approvedText(windows.data(),windows.size(),0,lane) || windows!=before)return 3;
        if(!native_windows_tool_help::approvedText(shared.data(),shared.size(),0,lane))return 4;
        if(native_windows_tool_help::approvedText(windows.data(),windows.size(),1,lane))return 5;
        const std::string unknown="Alt + user text",wrong="Alt + "+std::string(lane[49].text);
        if(native_windows_tool_help::approvedText(unknown.data(),unknown.size(),0,lane) ||
           native_windows_tool_help::approvedText(wrong.data(),wrong.size(),0,lane) ||
           native_windows_tool_help::approvedText(nullptr,1,0,lane) ||
           native_windows_tool_help::approvedText(windows.data(),513,0,lane))return 6;
    }
    std::puts("Windows Alt ToolHelp font admission: 3 locales and rejection boundaries PASS");
}
