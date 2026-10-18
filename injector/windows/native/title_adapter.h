/*
 * [INPUT]: 官方Windows2.8 updateAppTitle精确fmt调用、MSVC32字节string源及共享标题策略。
 * [OUTPUT]: 在原厂format完成后投影标题标签与已证真实空值，用户同名None/Untitled及后缀保持原字节。
 * [POS]: Windows标题ABI薄适配；格式/参数/frame关系任一不符即透传，不使用Mac源对象布局。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "../../native/title_format_policy.h"
#include <array>

namespace native_windows_title {
using View = native_title_format_abi::FormatStringView;
using Arguments = native_title_format_abi::FormatArguments;
struct Inputs {
    native_title_format::BorrowedText project{}, scene{};
    bool projectFallback=false, sceneFallback=false, valid=false;
};
static_assert(sizeof(std::string)==32, "Requires verified MSVC release string ABI");
inline Inputs capture(std::string *output,const View *format,const Arguments *arguments) noexcept {
    Inputs result;
    constexpr std::string_view expected="Project: {} - Scene: {} {}";
    if(!output || !format || !arguments || arguments->descriptor!=0xcdd ||
       !format->data || format->size!=expected.size() ||
       std::memcmp(format->data,expected.data(),expected.size())!=0 || !arguments->values)return result;
    const auto values=reinterpret_cast<std::uintptr_t>(arguments->values);
    // updateAppTitle(rbp)中values=rbp+98；三对象和两个fmt参数均须属于同一已证帧。
    if(values<0x98)return result;
    const auto frame=values-0x98;
    if(reinterpret_cast<std::uintptr_t>(arguments)!=frame+0x190 ||
       reinterpret_cast<std::uintptr_t>(format)!=frame+0x1a0 ||
       reinterpret_cast<std::uintptr_t>(output)!=frame+0x1d0)return result;
    result.project={arguments->values[0].string.data,arguments->values[0].string.size};
    result.scene={arguments->values[1].string.data,arguments->values[1].string.size};
    std::array<std::uintptr_t,4> project{},scene{};
    std::memcpy(project.data(),reinterpret_cast<const void*>(frame+0x1b0),32);
    std::memcpy(scene.data(),reinterpret_cast<const void*>(frame+0x1f0),32);
    if(project[3]<15 || project[2]>project[3] || scene[3]<15 || scene[2]>scene[3])return {};
    result.projectFallback=project[2]==0 && result.project.size==4 &&
        reinterpret_cast<std::uintptr_t>(result.project.data)==frame+0x210;
    result.sceneFallback=scene[2]==0 && result.scene.size==8 &&
        reinterpret_cast<std::uintptr_t>(result.scene.data)==frame+0x230;
    result.valid=true;
    return result;
}
inline bool project(std::string &output,cavalry_native_font::Locale locale,const Inputs &inputs) {
    return inputs.valid && native_title_format::projectValues(output,locale,inputs.project,
        inputs.scene,inputs.projectFallback,inputs.sceneFallback);
}
}
