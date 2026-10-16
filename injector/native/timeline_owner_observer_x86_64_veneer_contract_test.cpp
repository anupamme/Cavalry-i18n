/**
 * [INPUT]: 依赖Timeline原ABI声明、x86_64合同值与合成寄存器探针。
 * [OUTPUT]: 验证原始参数、closure、caller PC、单次调用和float返回值。
 * [POS]: x86_64 veneer离线运行合同；不证明vendor dyld接线或候选完整性。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "timeline_owner_observer_abi.h"
#include "timeline_owner_observer_x86_64_contract.h"

#include <cstdint>
#include <cstdio>

extern "C" float timelineOwnerProbeMeasure(
    const void*, const void*, const void*, std::size_t, int,
    const void*, const void*);
extern "C" void timelineOwnerProbeDraw(
    const void*, const void*, const void*, std::size_t, int,
    float, float, const void*, const void*);
extern "C" const char* timelineOwnerProbeMeasureReturnAddress();
extern "C" const char* timelineOwnerProbeDrawReturnAddress();

namespace {
int gClosure;
int gFont;
int gText;
int gBounds;
int gPaint;
int gCanvas;
int gMeasureCalls = 0;
int gDrawCalls = 0;
int gFailures = 0;
constexpr float kMeasureReturn = 37.25F;

void expect(bool condition, const char* message) noexcept
{
    if (!condition) {
        std::fprintf(stderr, "FAIL: %s\n", message);
        ++gFailures;
    }
}
}  // namespace

extern "C" float timelineMeasureDispatch(
    const void* font, const void* text, std::size_t length, int encoding,
    const void* bounds, const void* paint, const void* closure,
    std::uintptr_t callerPc) noexcept
{
    ++gMeasureCalls;
    expect(font == &gFont, "Measure font register");
    expect(text == &gText, "Measure text register");
    expect(length == 0x1234, "Measure length register");
    expect(encoding == 3, "Measure encoding register");
    expect(bounds == &gBounds, "Measure bounds register");
    expect(paint == &gPaint, "Measure paint register");
    expect(closure == &gClosure, "Measure closure from %rbx");
    expect(callerPc == reinterpret_cast<std::uintptr_t>(
                           timelineOwnerProbeMeasureReturnAddress()),
           "Measure return PC from original stack");
    return kMeasureReturn;
}

extern "C" void timelineDrawDispatch(
    const void* canvas, const void* text, std::size_t length, int encoding,
    float x, float y, const void* font, const void* paint,
    const void* closure, std::uintptr_t callerPc) noexcept
{
    ++gDrawCalls;
    expect(canvas == &gCanvas, "Draw canvas register");
    expect(text == &gText, "Draw text register");
    expect(length == 0x4321, "Draw length register");
    expect(encoding == 1, "Draw encoding register");
    expect(x == 12.5F && y == -7.25F, "Draw xmm0/xmm1 values");
    expect(font == &gFont, "Draw font register");
    expect(paint == &gPaint, "Draw paint register");
    expect(closure == &gClosure, "Draw closure from %rbx");
    expect(callerPc == reinterpret_cast<std::uintptr_t>(
                           timelineOwnerProbeDrawReturnAddress()),
           "Draw return PC from original stack");
}

int main()
{
    const float measured = timelineOwnerProbeMeasure(
        &gClosure, &gFont, &gText, 0x1234, 3, &gBounds, &gPaint);
    expect(measured == kMeasureReturn, "Measure float return in xmm0");
    timelineOwnerProbeDraw(
        &gClosure, &gCanvas, &gText, 0x4321, 1, 12.5F, -7.25F,
        &gFont, &gPaint);
    expect(gMeasureCalls == 1, "Measure dispatcher called once");
    expect(gDrawCalls == 1, "Draw dispatcher called once");
    if (gFailures != 0) return 1;
    std::puts("PASS: x86_64 Timeline veneer preserves args, closure, return PC and result");
    return 0;
}
