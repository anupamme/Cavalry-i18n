/**
 * [INPUT]: 依赖fixture共享快照、constructor回执与实际dyld interpose计数。
 * [OUTPUT]: 断言早期调用原样到达一次，且closed gate未进入dispatcher。
 * [POS]: 无vendor动态加载验收程序；坏message地址不得被解引用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "welcome_dyld_fixture_contract.h"

#include <cstddef>
#include <cstdint>
#include <cstdio>

namespace {
unsigned gFailures = 0;

void expect(bool condition, const char *message)
{
    if (condition) return;
    std::fprintf(stderr, "FAIL: %s\n", message);
    ++gFailures;
}
}

int main()
{
    const auto *snapshot = welcomeFixtureSnapshot();
    expect(snapshot != nullptr, "shared snapshot exists");
    if (snapshot == nullptr) return 1;

    expect(welcomeFixtureInterposerReady() == 1,
           "interposer constructor completed after dependencies");
    expect(snapshot->interposerReadyAtEntry == 0,
           "early dependency constructor calls before interposer constructor");
    expect(welcomeFixtureInterposerGate() == 0,
           "exact caller gate stays closed before ABI admission");
    expect(welcomeFixtureVeneerEntryCount == 1,
           "dyld routed the early dependency import through the veneer once");
    expect(welcomeFixtureDispatcherCalls() == 0,
           "closed gate bypasses the projection dispatcher");
    expect(snapshot->originalCallCount == 1,
           "the previous implementation receives exactly one call");
    expect(snapshot->registers[0] == 0x1234,
           "unknown route preserves logger argument");
    expect(snapshot->registers[1] == 1,
           "unknown route forwards unreadable message pointer without access");
    expect(snapshot->registers[2] == 1 && snapshot->registers[3] == 0,
           "unknown route preserves both boolean arguments");
    for (std::size_t reg = 4; reg <= 15; ++reg)
        expect(snapshot->registers[reg] == 0x1000 + reg,
               "unknown route preserves remaining caller-saved payload registers");
    constexpr std::uintptr_t calleeSavedSentinels[] = {
        0x1919, 0x2020, 0x2121, 0x2222, 0x2323,
        0x2424, 0x2525, 0x2626, 0x2727, 0x2828,
    };
    for (std::size_t index = 0; index < 10; ++index)
        expect(snapshot->registers[index + 19] == calleeSavedSentinels[index],
               "unknown route preserves callee-saved registers");
    expect(snapshot->registers[30] == welcomeFixtureExpectedReturn(),
           "unknown route preserves the original caller return address");
    expect(snapshot->registers[29] == welcomeFixtureExpectedFramePointer,
           "unknown route preserves frame pointer");
    expect(snapshot->entryStackPointer == welcomeFixtureExpectedCallStackPointer,
           "unknown route preserves caller stack pointer");
    expect((snapshot->entryStackPointer & 0xfU) == 0,
           "unknown route preserves arm64 stack alignment");
    expect(snapshot->errnoAtEntry == 0x5a,
           "unknown route preserves errno into the original implementation");
    expect(welcomeFixturePostCallErrno() == 0x5a,
           "original call returns with errno unchanged");

    if (gFailures != 0) {
        std::fprintf(stderr, "FAIL: %u dyld fixture assertion(s)\n", gFailures);
        return 1;
    }
    std::puts("PASS: early dyld constructor call reaches original once with closed gate, untouched payload pointer, registers, LR, and errno.");
    return 0;
}
