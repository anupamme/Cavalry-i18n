/**
 * [INPUT]: 依赖既有线程栈范围、帧读取器与GetPath 2.8 caller合同。
 * [OUTPUT]: 单读帧记录并校验Core→FPS或Core→缓存→固定UI owner。
 * [POS]: GetPath薄适配边界，不选择字体、不读语言或用户文本。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "viewport_owner_snapshot.h"
#include "getpath_font_policy.h"
namespace native_getpath {
template<class Read>
native_getpath_font::Owner owner(std::uintptr_t coreBase, std::uintptr_t extensionBase,
    std::uintptr_t callerPc, std::uintptr_t callerFrame,
    viewport_owner::StackRange stack, Read read) noexcept {
    using namespace native_getpath_abi::contract;
    // -- 只读已验证线程栈；复用帧关系，不另建遍历器 ------------------
    if (coreBase == 0 || extensionBase == 0 || callerPc < coreBase ||
        callerPc - coreBase != kCoreOwnerReturnOffset ||
        extensionBase > std::numeric_limits<std::uintptr_t>::max() - kCacheOwnerReturnOffset)
        return native_getpath_font::Owner::Unknown;

    // -- 一次读取Core父帧，分开FPS直绘与既有缓存链 ------------------------
    viewport_owner::CallerFrameRecord coreCaller{};
    if (!viewport_owner::callerFrameRecord(callerFrame, stack, read, &coreCaller))
        return native_getpath_font::Owner::Unknown;
    if (coreCaller.returnPc == extensionBase + kViewportFpsProducerReturn)
        return native_getpath_font::Owner::ViewportFps;
    if (coreCaller.returnPc != extensionBase + kCacheOwnerReturnOffset)
        return native_getpath_font::Owner::Unknown;

    // -- 缓存路径只读一次生产者帧；旧ToolHelp/质量分类保持不变 ----------
    viewport_owner::CallerFrameRecord cacheCaller{};
    if (!viewport_owner::callerFrameRecord(coreCaller.parent, stack, read,
                                           &cacheCaller) ||
        cacheCaller.returnPc < extensionBase)
        return native_getpath_font::Owner::Unknown;
    const auto candidate = native_getpath_font::pathOwner(
        kCoreOwnerReturnOffset, kCacheOwnerReturnOffset,
        cacheCaller.returnPc - extensionBase);
    return candidate;
}

// -- 未知owner只调用原函数一次，不进入字体核心 ---------------------------
template<class Forward>
bool forwardUnknownOwner(native_getpath_font::Owner owner, Forward forward)
{
    if (owner != native_getpath_font::Owner::Unknown) return false;
    forward();
    return true;
}
} // namespace native_getpath
