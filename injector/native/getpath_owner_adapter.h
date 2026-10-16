/**
 * [INPUT]: 依赖既有线程栈范围、帧读取器与各架构GetPath caller合同。
 * [OUTPUT]: ARM校验缓存owner；x86校验直连与缓存两帧owner。
 * [POS]: GetPath薄适配边界；x86只准入Graph/FPS/缓存固定生产者。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "viewport_owner_snapshot.h"
#include "getpath_font_policy.h"
#if defined(__x86_64__)
#include "getpath_graph_empty_x86_64_abi_contract.h"
#include "getpath_fps_x86_64_abi_contract.h"
#include "getpath_cache_x86_64_abi_contract.h"
#endif
namespace native_getpath {
#if defined(__x86_64__)
namespace cache_x86 = native_getpath_cache_x86_64::contract;
constexpr native_getpath_font::Owner ownerForX86Returns(
    std::uintptr_t coreReturnOffset,
    std::uintptr_t extensionReturnOffset) noexcept
{
    using namespace native_getpath_graph_x86_64::contract;
    using namespace native_getpath_fps_x86_64::contract;
    if (coreReturnOffset != kCoreGetPathReturnOffset)
        return native_getpath_font::Owner::Unknown;
    if (extensionReturnOffset == kExtensionGraphProducerReturnOffset)
        return native_getpath_font::Owner::GraphEditorEmptyState;
    if (viewportFpsProducerReturn(extensionReturnOffset))
        return native_getpath_font::Owner::ViewportFps;
    return native_getpath_font::Owner::Unknown;
}

constexpr native_getpath_font::Owner ownerForX86CacheReturns(
    std::uintptr_t coreReturnOffset,
    std::uintptr_t cacheReturnOffset,
    std::uintptr_t producerReturnOffset) noexcept
{
    if (coreReturnOffset != cache_x86::kCoreGetPathReturnOffset ||
        cacheReturnOffset != cache_x86::kCachedGetPathReturnOffset)
        return native_getpath_font::Owner::Unknown;
    switch (cache_x86::producerForReturn(producerReturnOffset)) {
        case cache_x86::CachedProducer::ToolHelpA:
        case cache_x86::CachedProducer::ToolHelpB:
            return native_getpath_font::Owner::ToolHelp;
        case cache_x86::CachedProducer::ViewportQuality:
            return native_getpath_font::Owner::ViewportStatus;
        case cache_x86::CachedProducer::Unknown:
            return native_getpath_font::Owner::Unknown;
    }
    return native_getpath_font::Owner::Unknown;
}
#endif

template<class Read>
native_getpath_font::Owner owner(std::uintptr_t coreBase, std::uintptr_t extensionBase,
    std::uintptr_t callerPc, std::uintptr_t callerFrame,
    viewport_owner::StackRange stack, Read read) noexcept {
    using namespace native_getpath_abi::contract;
#if defined(__x86_64__)
    using namespace native_getpath_graph_x86_64::contract;
    if (coreBase == 0 || extensionBase == 0 || callerPc < coreBase ||
        callerPc - coreBase != kCoreGetPathReturnOffset ||
        extensionBase > std::numeric_limits<std::uintptr_t>::max() -
            kExtensionGraphProducerReturnOffset ||
        extensionBase > std::numeric_limits<std::uintptr_t>::max() -
            cache_x86::kViewportQualityProducerReturnOffset ||
        extensionBase > std::numeric_limits<std::uintptr_t>::max() -
            native_getpath_fps_x86_64::contract::kMakePathFromTextReturnOffset)
        return native_getpath_font::Owner::Unknown;

    viewport_owner::CallerFrameRecord coreCaller{};
    if (!viewport_owner::callerFrameRecord(callerFrame, stack, read, &coreCaller))
        return native_getpath_font::Owner::Unknown;
    if (coreCaller.returnPc < extensionBase)
        return native_getpath_font::Owner::Unknown;
    const auto coreReturnOffset = callerPc - coreBase;
    const auto extensionReturnOffset = coreCaller.returnPc - extensionBase;
    const auto directOwner = ownerForX86Returns(
        coreReturnOffset, extensionReturnOffset);
    if (directOwner != native_getpath_font::Owner::Unknown) return directOwner;
    if (extensionReturnOffset != cache_x86::kCachedGetPathReturnOffset)
        return native_getpath_font::Owner::Unknown;

    // -- 缓存链再读一层；只接收两个ToolHelp与Viewport质量生产者 ---------
    viewport_owner::CallerFrameRecord cacheCaller{};
    if (!viewport_owner::callerFrameRecord(coreCaller.parent, stack, read,
                                           &cacheCaller) ||
        cacheCaller.returnPc < extensionBase)
        return native_getpath_font::Owner::Unknown;
    return ownerForX86CacheReturns(
        coreReturnOffset, extensionReturnOffset,
        cacheCaller.returnPc - extensionBase);
#else
    // -- 只读已验证线程栈；复用帧关系，不另建遍历器 ------------------
    if (coreBase == 0 || extensionBase == 0 || callerPc < coreBase ||
        callerPc - coreBase != kCoreOwnerReturnOffset ||
        extensionBase > std::numeric_limits<std::uintptr_t>::max() -
            kGraphEditorEmptyStateProducerReturn)
        return native_getpath_font::Owner::Unknown;

    // -- 一次读取Core父帧，分开FPS直绘与既有缓存链 ------------------------
    viewport_owner::CallerFrameRecord coreCaller{};
    if (!viewport_owner::callerFrameRecord(callerFrame, stack, read, &coreCaller))
        return native_getpath_font::Owner::Unknown;
    if (coreCaller.returnPc == extensionBase + kViewportFpsProducerReturn)
        return native_getpath_font::Owner::ViewportFps;
    if (coreCaller.returnPc == extensionBase + kGraphEditorEmptyStateProducerReturn)
        return native_getpath_font::Owner::GraphEditorEmptyState;
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
#endif
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
