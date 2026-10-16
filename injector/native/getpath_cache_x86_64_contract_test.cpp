/**
 * [INPUT]: 依赖x86缓存GetPath合同、栈帧读取器与Owner分类。
 * [OUTPUT]: 验证两帧正例、错误帧拒绝和未知调用单次透传。
 * [POS]: Rosetta vendor-free合同；不加载Cavalry或candidate dylib。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "getpath_owner_adapter.h"

#include <array>
#include <cstdint>
#include <cstring>
#include <cstdio>
#include <limits>

namespace cache = native_getpath_cache_x86_64::contract;
namespace graph = native_getpath_graph_x86_64::contract;
namespace fps = native_getpath_fps_x86_64::contract;
using Owner = native_getpath_font::Owner;

namespace {
constexpr std::uintptr_t kCoreBase = 0x10000000;
constexpr std::uintptr_t kExtensionBase = 0x20000000;

struct FakeFrames {
    alignas(16) std::array<std::uintptr_t, 8> words{};
    unsigned reads = 0;
    bool failCacheFrame = false;

    std::uintptr_t low() const noexcept
    {
        return reinterpret_cast<std::uintptr_t>(words.data());
    }

    viewport_owner::StackRange stack() const noexcept
    {
        return {low(), low() + sizeof(words)};
    }

    void seed(std::uintptr_t producerReturn) noexcept
    {
        const auto first = low();
        words[0] = first + 16U;
        words[1] = kExtensionBase + cache::kCachedGetPathReturnOffset;
        words[2] = first + 32U;
        words[3] = kExtensionBase + producerReturn;
    }

    bool read(std::uintptr_t address, std::size_t size,
              void *destination) noexcept
    {
        ++reads;
        if (failCacheFrame && address == low() + 16U) return false;
        const auto bounds = stack();
        if (address < bounds.low || address > bounds.high ||
            size > bounds.high - address) return false;
        std::memcpy(destination, reinterpret_cast<const void *>(address), size);
        return true;
    }
};

Owner cachedOwner(FakeFrames &frames)
{
    return native_getpath::owner(
        kCoreBase, kExtensionBase,
        kCoreBase + cache::kCoreGetPathReturnOffset,
        frames.low(), frames.stack(),
        [&frames](std::uintptr_t address, std::size_t size,
                  void *destination) noexcept {
            return frames.read(address, size, destination);
        });
}

bool cachedProducersNeedBothExactFrames()
{
    constexpr std::array<std::uintptr_t, 3> producerReturns = {
        cache::kToolHelpProducerReturnAOffset,
        cache::kToolHelpProducerReturnBOffset,
        cache::kViewportQualityProducerReturnOffset,
    };
    constexpr std::array<Owner, 3> expected = {
        Owner::ToolHelp, Owner::ToolHelp, Owner::ViewportStatus,
    };
    for (std::size_t index = 0; index < producerReturns.size(); ++index) {
        FakeFrames frames{};
        frames.seed(producerReturns[index]);
        if (cachedOwner(frames) != expected[index] || frames.reads != 2U)
            return false;
    }
    return true;
}

bool wrongFramesFailClosedAndForwardOnce()
{
    FakeFrames frames{};
    frames.seed(cache::kToolHelpProducerReturnAOffset);
    frames.words[1] += 1U;
    auto owner = cachedOwner(frames);
    int forwards = 0;
    if (owner != Owner::Unknown || frames.reads != 1U ||
        !native_getpath::forwardUnknownOwner(
            owner, [&forwards] { ++forwards; }) || forwards != 1) return false;

    frames = FakeFrames{};
    frames.seed(cache::kViewportQualityProducerReturnOffset);
    frames.words[3] += 1U;
    owner = cachedOwner(frames);
    forwards = 0;
    if (owner != Owner::Unknown || frames.reads != 2U ||
        !native_getpath::forwardUnknownOwner(
            owner, [&forwards] { ++forwards; }) || forwards != 1) return false;

    frames = FakeFrames{};
    frames.seed(cache::kToolHelpProducerReturnBOffset);
    frames.failCacheFrame = true;
    owner = cachedOwner(frames);
    return owner == Owner::Unknown && frames.reads == 2U;
}

bool directGraphAndFpsRemainOneFrameOwners()
{
    FakeFrames frames{};
    frames.words[0] = frames.low() + 16U;
    frames.words[1] = kExtensionBase +
        graph::kExtensionGraphProducerReturnOffset;
    if (native_getpath::owner(
            kCoreBase, kExtensionBase,
            kCoreBase + graph::kCoreGetPathReturnOffset,
            frames.low(), frames.stack(),
            [&frames](std::uintptr_t address, std::size_t size,
                      void *destination) noexcept {
                return frames.read(address, size, destination);
            }) != Owner::GraphEditorEmptyState || frames.reads != 1U)
        return false;

    frames = FakeFrames{};
    frames.words[0] = frames.low() + 16U;
    frames.words[1] = kExtensionBase + fps::kMakePathFromTextReturnOffset;
    return native_getpath::owner(
               kCoreBase, kExtensionBase,
               kCoreBase + graph::kCoreGetPathReturnOffset,
               frames.low(), frames.stack(),
               [&frames](std::uintptr_t address, std::size_t size,
                         void *destination) noexcept {
                   return frames.read(address, size, destination);
               }) == Owner::ViewportFps && frames.reads == 1U;
}

bool wrongCoreAndOverflowDoNotReadFrames()
{
    FakeFrames frames{};
    frames.seed(cache::kToolHelpProducerReturnAOffset);
    auto owner = native_getpath::owner(
        kCoreBase, kExtensionBase,
        kCoreBase + cache::kCoreGetPathReturnOffset + 1U,
        frames.low(), frames.stack(),
        [&frames](std::uintptr_t address, std::size_t size,
                  void *destination) noexcept {
            return frames.read(address, size, destination);
        });
    if (owner != Owner::Unknown || frames.reads != 0U) return false;

    constexpr std::uintptr_t maxExtensionReturn =
        graph::kExtensionGraphProducerReturnOffset;
    const auto invalidBase = std::numeric_limits<std::uintptr_t>::max() -
        maxExtensionReturn + 1U;
    frames.reads = 0;
    owner = native_getpath::owner(
        kCoreBase, invalidBase,
        kCoreBase + cache::kCoreGetPathReturnOffset,
        frames.low(), frames.stack(),
        [&frames](std::uintptr_t address, std::size_t size,
                  void *destination) noexcept {
            return frames.read(address, size, destination);
        });
    return owner == Owner::Unknown && frames.reads == 0U;
}
}  // namespace

int main()
{
    if (!cachedProducersNeedBothExactFrames()) return 1;
    if (!wrongFramesFailClosedAndForwardOnce()) return 2;
    if (!directGraphAndFpsRemainOneFrameOwners()) return 3;
    if (!wrongCoreAndOverflowDoNotReadFrames()) return 4;
    std::puts("GREEN: x86 cached GetPath requires the exact Core/cache/producer frame chain");
    std::puts("GREEN: unknown, changed, unreadable, and overflowing frames fail closed");
    std::puts("GREEN: Graph/FPS direct owners retain their existing one-frame path");
    return 0;
}
