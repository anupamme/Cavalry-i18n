/**
 * [INPUT]: 依赖TextBlob x86合同、线程栈边界与受限只读函数。
 * [OUTPUT]: 复制与getNiceName临时串完全相同的有限Viewport名称。
 * [POS]: x86 TextBlob owner读取器；短串和长串均拒绝不稳定对象。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "viewport_blob_x86_64_abi_contract.h"

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <limits>

namespace native_viewport_blob_x86_64 {
struct StackRange {
    std::uintptr_t low = 0;
    std::uintptr_t high = 0;
};

struct StringView {
    std::uintptr_t data = 0;
    std::size_t size = 0;
};

inline bool contains(StackRange stack, std::uintptr_t address,
                     std::size_t size) noexcept
{
    return stack.low < stack.high && address >= stack.low && address < stack.high &&
        size <= stack.high - address;
}

inline bool decodeNameString(
    const std::array<unsigned char, contract::kStringObjectBytes> &object,
    std::uintptr_t objectAddress, StringView *output) noexcept
{
    if (output == nullptr || objectAddress == 0) return false;
    StringView candidate{};
    const unsigned char tag = object[contract::kStringTagOffset];
    if ((tag & contract::kLongStringFlagMask) != 0) {
        std::uint64_t size = 0;
        std::uintptr_t data = 0;
        std::memcpy(&size, object.data() + contract::kLongStringLengthOffset,
                    sizeof(size));
        std::memcpy(&data, object.data() + contract::kLongStringDataOffset,
                    sizeof(data));
        if (data == 0 || size == 0 || size > contract::kMaximumNameBytes ||
            size > std::numeric_limits<std::size_t>::max() ||
            data > std::numeric_limits<std::uintptr_t>::max() - size) return false;
        candidate = {data, static_cast<std::size_t>(size)};
    } else {
        const std::size_t size = tag >> contract::kShortStringLengthShift;
        if (size == 0 || size > contract::kShortStringCapacity ||
            object[contract::kShortStringDataOffset + size] != 0 ||
            objectAddress > std::numeric_limits<std::uintptr_t>::max() -
                contract::kShortStringDataOffset) return false;
        candidate = {objectAddress + contract::kShortStringDataOffset, size};
    }
    *output = candidate;
    return true;
}

template <class Read>
bool snapshot(std::uintptr_t extensionOffset, int encoding,
              std::uintptr_t callerFrame, StackRange stack,
              std::uintptr_t text, std::size_t length, Read read,
              unsigned char *output, std::size_t outputCapacity,
              std::size_t *outputLength) noexcept
{
    if (outputLength != nullptr) *outputLength = 0;
    if (output == nullptr || outputLength == nullptr || encoding != 0 ||
        !contract::exactViewportNameBlobCaller(extensionOffset) ||
        (callerFrame & 15U) != 0 || callerFrame < contract::kNameObjectBelowFrame ||
        !contains(stack, callerFrame, sizeof(std::uintptr_t)) ||
        length == 0 || length > contract::kMaximumNameBytes ||
        length > outputCapacity) return false;

    const std::uintptr_t objectAddress =
        callerFrame - contract::kNameObjectBelowFrame;
    if (!contains(stack, objectAddress, contract::kStringObjectBytes)) return false;
    std::array<unsigned char, contract::kStringObjectBytes> before{};
    std::array<unsigned char, contract::kStringObjectBytes> after{};
    StringView owner{};
    if (!read(objectAddress, before.size(), before.data()) ||
        !decodeNameString(before, objectAddress, &owner) ||
        owner.data != text || owner.size != length ||
        !read(owner.data, owner.size, output) ||
        std::memchr(output, 0, owner.size) != nullptr) return false;

    unsigned char terminator = 1;
    if (!read(owner.data + owner.size, 1, &terminator) || terminator != 0 ||
        !read(objectAddress, after.size(), after.data()) || before != after) return false;
    *outputLength = owner.size;
    return true;
}
} // namespace native_viewport_blob_x86_64
