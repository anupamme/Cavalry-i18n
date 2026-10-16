/**
 * [INPUT]: 依赖fake spdlog的入口快照及各fixture镜像的生命周期回执。
 * [OUTPUT]: 提供构造顺序、原调用、dispatcher、errno与寄存器快照。
 * [POS]: vendor-free dyld fixture共享状态；不加载Qt或Cavalry。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "welcome_dyld_fixture_contract.h"

#include <cerrno>
#include <cstddef>

namespace {
WelcomeDyldFixtureSnapshot gSnapshot{};
int gInterposerReady = 0;
unsigned gDispatcherCalls = 0;
int gPostCallErrno = -1;
std::uintptr_t gInterposerGate = ~std::uintptr_t{0};
std::uintptr_t gExpectedReturn = 0;
}

extern "C" {
volatile std::uintptr_t welcomeFixtureVeneerEntryCount = 0;
volatile std::uintptr_t welcomeFixtureExpectedFramePointer = 0;
volatile std::uintptr_t welcomeFixtureExpectedCallStackPointer = 0;
}

extern "C" const WelcomeDyldFixtureSnapshot *welcomeFixtureSnapshot()
{
    return &gSnapshot;
}

extern "C" void welcomeFixtureRecordOriginal(
    const std::uintptr_t *registers, std::uintptr_t entryStackPointer)
{
    const int entryErrno = errno;
    for (std::size_t index = 0; index < 31; ++index)
        gSnapshot.registers[index] = registers[index];
    gSnapshot.entryStackPointer = entryStackPointer;
    gSnapshot.errnoAtEntry = entryErrno;
    gSnapshot.interposerReadyAtEntry = gInterposerReady;
    ++gSnapshot.originalCallCount;
}

extern "C" void welcomeFixtureMarkInterposerReady()
{
    gInterposerReady = 1;
}

extern "C" int welcomeFixtureInterposerReady()
{
    return gInterposerReady;
}

extern "C" void welcomeFixtureRecordInterposerGate(std::uintptr_t gate)
{
    gInterposerGate = gate;
}

extern "C" std::uintptr_t welcomeFixtureInterposerGate()
{
    return gInterposerGate;
}

extern "C" void welcomeFixtureRecordExpectedReturn(std::uintptr_t address)
{
    gExpectedReturn = address;
}

extern "C" std::uintptr_t welcomeFixtureExpectedReturn()
{
    return gExpectedReturn;
}

extern "C" void welcomeFixtureNoteDispatcher()
{
    ++gDispatcherCalls;
}

extern "C" unsigned welcomeFixtureDispatcherCalls()
{
    return gDispatcherCalls;
}

extern "C" void welcomeFixtureRecordPostCallErrno(int value)
{
    gPostCallErrno = value;
}

extern "C" int welcomeFixturePostCallErrno()
{
    return gPostCallErrno;
}
