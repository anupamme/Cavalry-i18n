/*
 * [INPUT]: Windows optional ABI、共享有限JS投影与模拟原厂结果。
 * [OUTPUT]: 验证三语精确源、nullopt、未知caller不读输入、源漂移保全和原异常单次传播。
 * [POS]: vendor-free Windows Demo合同；不创建Scene，不授菜单执行信用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "demo_adapter.h"
#include <cstdio>
#include <stdexcept>
namespace {
int calls=0;bool throws=false;native_windows_demo::Result result;
native_windows_demo::Result original(const std::string&){++calls;if(throws)throw std::runtime_error("vendor");return result;}
}
int main(){
    using cavalry_native_font::Locale;using namespace native_demo_reader;
    const DemoReaderText texts[]={{"Name","名称","名稱","名前"}};
    const DemoReaderSlot slots[]={{10,16,0,'"'}};
    const std::string source="const x = \"Name\";\r\n";
    const auto digest=QCryptographicHash::hash(QByteArrayView(source.data(),source.size()),QCryptographicHash::Sha256).toHex();
    const DemoReaderFile file{"Demo.js",std::string_view(digest.constData(),digest.size()),static_cast<unsigned>(source.size()),0,1};
    constexpr std::uintptr_t base=0x100000000ULL;
    for(auto locale:{Locale::Hans,Locale::Hant,Locale::Japanese}){
        calls=0;result=source;
        const auto value=native_windows_demo::forward(original,"path",base+0xc8f9c7,base,[&]{return locale;},
            [&](std::string_view input,auto &&readLocale,std::string *out){return projectVerifiedScript(input,file,texts,slots,readLocale,out);});
        if(calls!=1 || !value || value->find(std::string(translationFor(texts[0],locale)))==std::string::npos || result!=source)return 1;
    }
    for(const auto &value:{native_windows_demo::Result{},native_windows_demo::Result{"different"}}){
        result=value;calls=0;int probes=0;
        const auto got=native_windows_demo::forward(original,"path",base+1,base,[]{return Locale::Hans;},[&](auto,auto&&,auto*){++probes;return true;});
        if(calls!=1 || probes!=0 || got!=value)return 2;
    }
    result="different";calls=0;
    const auto drift=native_windows_demo::forward(original,"path",base+0xc8f9c7,base,[]{return Locale::Hans;},
        [&](std::string_view input,auto&&locale,std::string*out){return projectVerifiedScript(input,file,texts,slots,locale,out);});
    if(calls!=1 || drift!=result)return 3;
    for(const auto caller:{base+0xc8f1da,base+0xc8fd05}){
        result=source;calls=0;int probes=0;
        const auto untouched=native_windows_demo::forward(original,"path",caller,base,[]{return Locale::Hans;},[&](auto,auto&&,auto*){++probes;return true;});
        if(calls!=1 || probes!=0 || untouched!=result)return 6;
    }
    throws=true;calls=0;
    try{native_windows_demo::forward(original,"path",base+1,base,[]{return Locale::Hans;},[](auto,auto&&,auto*){return false;});return 4;}
    catch(const std::runtime_error&){if(calls!=1)return 5;}
    std::puts("Windows Demo ABI/source/three-locale/forward-once contracts passed");
}
