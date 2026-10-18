/*
 * [INPUT]: 官方Windows2.8 Viewport分段blob的sret/borrowed SkFont、同线程栈和精确父调用。
 * [OUTPUT]: 读取父层完整MSVC名称快照；片段只参与原厂绘制，字体必须覆盖完整名称。
 * [POS]: Windows ABI薄适配；font=父帧+88、完整string=父帧+190，未知链/越栈/过长均透传。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include <windows.h>
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>

namespace native_windows_viewport {
struct Snapshot {std::array<std::byte,4096> bytes{};std::size_t size=0;};
inline bool read(const void *address,void *destination,std::size_t bytes) noexcept {
    SIZE_T copied=0;
    return ReadProcessMemory(GetCurrentProcess(),address,destination,bytes,&copied) && copied==bytes;
}
inline bool snapshot(const void *font,std::uintptr_t extension,Snapshot *output) noexcept {
    if(!font || !output)return false;
    void *frames[12]{};const auto count=CaptureStackBackTrace(0,12,frames,nullptr);
    bool blobCaller=false,parent=false;
    for(unsigned i=0;i<count;++i){
        const auto pc=reinterpret_cast<std::uintptr_t>(frames[i]);
        if(pc==extension+0x42a4bf)blobCaller=true;
        else if(blobCaller && pc==extension+0x407084){parent=true;break;}
    }
    if(!parent)return false;
    ULONG_PTR low=0,high=0;GetCurrentThreadStackLimits(&low,&high);
    const auto fontAddress=reinterpret_cast<std::uintptr_t>(font);
    if(fontAddress<low || fontAddress>high || high-fontAddress<0x128)return false;
    const auto source=fontAddress+0x108;
    std::array<std::uintptr_t,4> words{};
    if(!read(reinterpret_cast<const void*>(source),words.data(),sizeof(words)))return false;
    if(words[3]<15 || words[2]==0 || words[2]>words[3] || words[2]>output->bytes.size())return false;
    const auto data=words[3]<16?source:words[0];
    if(!data || !read(reinterpret_cast<const void*>(data),output->bytes.data(),words[2]))return false;
    output->size=words[2];return true;
}
}
