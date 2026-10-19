/*
 * [INPUT]: Windows标题ABI薄适配、共享标题投影及隔离栈布局fixture。
 * [OUTPUT]: 证明三语空标题、用户同名占位保全、含分隔符名称和dirty后缀，以及未知ABI透传。
 * [POS]: Windows2.8标题边界合同；不读取或启动真实宿主。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "title_adapter.h"
#include <cstdio>
#include <new>

int main(){
    using namespace native_windows_title;
    alignas(16) std::array<std::byte,0x280> frame{};
    auto *projectSource=new(frame.data()+0x1b0) std::string;
    auto *output=new(frame.data()+0x1d0) std::string;
    auto *sceneSource=new(frame.data()+0x1f0) std::string;
    auto *values=reinterpret_cast<native_title_format_abi::FormatValue*>(frame.data()+0x98);
    auto *args=new(frame.data()+0x190) Arguments{0xcdd,values};
    auto *format=new(frame.data()+0x1a0) View{"Project: {} - Scene: {} {}",26};
    std::memcpy(frame.data()+0x210,"None",5);
    std::memcpy(frame.data()+0x230,"Untitled",9);
    values[0].string={reinterpret_cast<const char*>(frame.data()+0x210),4};
    values[1].string={reinterpret_cast<const char*>(frame.data()+0x230),8};
    auto input=capture(output,format,args);
    if(!input.valid || !input.projectFallback || !input.sceneFallback)return 1;
    const cavalry_native_font::Locale locales[]={cavalry_native_font::Locale::Hans,cavalry_native_font::Locale::Hant,cavalry_native_font::Locale::Japanese};
    const char *expected[]={"项目: 无 - 场景: 无标题 *","專案: 無 - 場景: 無標題 *","プロジェクト: なし - シーン: 無題 *"};
    for(unsigned i=0;i<3;++i){*output="Project: None - Scene: Untitled *";if(!project(*output,locales[i],input) || *output!=expected[i])return 2;}
    *projectSource="None";*sceneSource="Untitled";
    input=capture(output,format,args);
    if(input.projectFallback || input.sceneFallback)return 3;
    *output="Project: None - Scene: Untitled *";
    if(!project(*output,locales[0],input) || *output!="项目: None - 场景: Untitled *")return 4;
    constexpr char name[]="Shot - Scene: Take";
    values[0].string={name,sizeof(name)-1};
    input=capture(output,format,args);*output="Project: Shot - Scene: Take - Scene: Untitled *";
    if(!project(*output,locales[1],input) || *output!="專案: Shot - Scene: Take - 場景: Untitled *")return 5;
    args->descriptor=0;
    if(capture(output,format,args).valid)return 6;
    output->~basic_string();projectSource->~basic_string();sceneSource->~basic_string();
    std::puts("PASS: Windows title layout, three locales, user placeholders/delimiters, suffix and unknown ABI");
}
