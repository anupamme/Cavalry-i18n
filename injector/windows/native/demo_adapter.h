/*
 * [INPUT]: Windows Core的MSVC optional<string> ABI与Extension唯一Preset读取caller。
 * [OUTPUT]: 提供同ABI函数类型及共享单次转发薄适配；源/路径投影仍由共享策略和运行边界裁决。
 * [POS]: Windows Demo reader ABI；Core7662d0证明engaged0x20及binary输入；同一菜单factory的c8f930分支读取JS并调用runGuiScript，importPreset/普通Script分支不准入。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "../../native/demo_reader_policy.h"
#include <type_traits>
namespace native_windows_demo {
using Result=std::optional<std::string>;
using Original=Result(*)(const std::string&);
inline constexpr std::uintptr_t kDemoReturn=0xc8f9c7;
static_assert(sizeof(std::string)==0x20 && sizeof(Result)==0x28 && alignof(Result)==8);
static_assert(!std::is_trivially_destructible_v<Result>);
template<typename LocaleGetter,typename Projector>
Result forward(Original original,const std::string &path,std::uintptr_t caller,std::uintptr_t extension,
               LocaleGetter &&locale,Projector &&project){
    return native_demo_reader::forwardOnce([&]{return original(path);},caller==extension+kDemoReturn,true,
        std::forward<LocaleGetter>(locale),std::forward<Projector>(project));
}
}
