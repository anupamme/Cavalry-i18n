/**
 * [INPUT]: 依赖arm64 SkFont::measureText/SkCanvas::drawSimpleText的已核参数寄存器与返回寄存器合同。
 * [OUTPUT]: 提供精确原函数与veneer/typed-dispatcher声明，供候选与合同测试复用。
 * [POS]: Timeline observer窄ABI边界；不含解析、owner读取、字体策略或状态配对。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <cstddef>
#include <cstdint>

namespace timeline_owner_observer {
using MeasureOriginal = float (*)(const void*, const void*, std::size_t, int,
                                  const void*, const void*);
using DrawOriginal = void (*)(const void*, const void*, std::size_t, int,
                              float, float, const void*, const void*);
}

extern "C" {
float timelineMeasureVeneer(const void*, const void*, std::size_t, int,
                            const void*, const void*) noexcept;
void timelineDrawVeneer(const void*, const void*, std::size_t, int,
                        float, float, const void*, const void*) noexcept;

float timelineMeasureDispatch(const void*, const void*, std::size_t, int,
                              const void*, const void*, const void*,
                              std::uintptr_t) noexcept;
void timelineDrawDispatch(const void*, const void*, std::size_t, int,
                          float, float, const void*, const void*, const void*,
                          std::uintptr_t) noexcept;
}
