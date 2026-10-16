/**
 * [INPUT]: 依赖fake spdlog、早期caller与interposer的共享状态。
 * [OUTPUT]: 声明dyld构造顺序、原调用寄存器与errno的只读合同。
 * [POS]: vendor-free动态加载fixture的窄C ABI；不进入产品候选。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <cstdint>

struct WelcomeDyldFixtureSnapshot {
    std::uintptr_t registers[31];
    std::uintptr_t entryStackPointer;
    int errnoAtEntry;
    int interposerReadyAtEntry;
    unsigned originalCallCount;
};

extern "C" {
const WelcomeDyldFixtureSnapshot *welcomeFixtureSnapshot();
void welcomeFixtureRecordOriginal(const std::uintptr_t *registers,
                                 std::uintptr_t entryStackPointer);
void welcomeFixtureMarkInterposerReady();
int welcomeFixtureInterposerReady();
void welcomeFixtureRecordInterposerGate(std::uintptr_t gate);
std::uintptr_t welcomeFixtureInterposerGate();
void welcomeFixtureRecordExpectedReturn(std::uintptr_t address);
std::uintptr_t welcomeFixtureExpectedReturn();
void welcomeFixtureNoteDispatcher();
unsigned welcomeFixtureDispatcherCalls();
void welcomeFixtureRecordPostCallErrno(int value);
int welcomeFixturePostCallErrno();
void welcomeFixtureTriggerEarlyLog();
void welcomeFixtureEarlyCallerAnchor();
extern char welcomeFixtureOriginalReturn;
extern volatile std::uintptr_t welcomeFixtureVeneerEntryCount;
extern volatile std::uintptr_t welcomeFixtureExpectedFramePointer;
extern volatile std::uintptr_t welcomeFixtureExpectedCallStackPointer;
}
