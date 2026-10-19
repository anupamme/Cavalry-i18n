/**
 * [INPUT]: 依赖C++17的size_t、uintptr_t与类型特征。
 * [OUTPUT]: 提供8字节非平凡结果、原函数类型及两个C ABI入口。
 * [POS]: 锁定TextBlob结果槽；dispatcher第六参数接收调用者帧指针。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include <cstddef>
#include <cstdint>
#include <type_traits>

namespace viewport_blob {
struct BlobResultAbi {
    void *pointer;

    explicit BlobResultAbi(void *value = nullptr) noexcept : pointer(value) {}
    BlobResultAbi(BlobResultAbi &&other) noexcept : pointer(other.pointer) {
        other.pointer = nullptr;
    }
    BlobResultAbi(const BlobResultAbi &) = delete;
    BlobResultAbi &operator=(const BlobResultAbi &) = delete;
    ~BlobResultAbi() noexcept {}
};

using BlobOriginal = BlobResultAbi (*)(const void *, std::size_t, const void *, int);

static_assert(sizeof(BlobResultAbi) == sizeof(void *), "result ABI must be one pointer");
static_assert(alignof(BlobResultAbi) == alignof(void *), "result ABI pointer alignment");
static_assert(!std::is_trivially_move_constructible<BlobResultAbi>::value,
              "move construction must stay nontrivial");
static_assert(!std::is_trivially_destructible<BlobResultAbi>::value,
              "destruction must stay nontrivial");
static_assert(!std::is_copy_constructible<BlobResultAbi>::value,
              "result ownership must not be copied");

#if defined(__clang__)
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wreturn-type-c-linkage"
#endif
extern "C" BlobResultAbi viewportBlobVeneer(
    const void *text, std::size_t length, const void *font, int encoding) noexcept;

extern "C" BlobResultAbi viewportBlobDispatch(
    const void *text, std::size_t length, const void *font, int encoding,
    std::uintptr_t callerPc, std::uintptr_t callerFrame) noexcept;
#if defined(__clang__)
#pragma clang diagnostic pop
#endif
} // namespace viewport_blob
