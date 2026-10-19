/**
 * [INPUT]: 依赖SkTextUtils::GetPath七参签名与arm64 x29/x30入口寄存器。
 * [OUTPUT]: 声明保留原参数、附加caller PC/FP的C dispatcher。
 * [POS]: GetPath ABI边界；浮点参数仍走s0/s1，函数不承诺noexcept。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <cstddef>
#include <cstdint>

namespace native_getpath_font {
using Original = void (*)(const void *, std::size_t, int, float, float,
                          const void *, void *);
}

extern "C" {
void getPathFontVeneer(const void *, std::size_t, int, float, float,
                       const void *, void *);
void getPathFontDispatch(const void *, std::size_t, int, float, float,
                         const void *, void *, std::uintptr_t, std::uintptr_t);
}
