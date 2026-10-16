/**
 * [INPUT]: 依赖实际Welcome veneer、fake spdlog two-level import与共享状态。
 * [OUTPUT]: 提供dyld interpose tuple、关闭的caller门及constructor回执。
 * [POS]: 仅用于隔离dyld fixture；不进入native产品候选。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "welcome_dyld_fixture_contract.h"

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <cstdlib>

extern "C" {
__attribute__((visibility("hidden"))) std::atomic<std::uintptr_t>
    nativeWelcomeLogItExpectedReturnPc{0};
__attribute__((visibility("hidden"))) std::atomic<std::uintptr_t>
    nativeWelcomeLogItOriginal{0};
void nativeWelcomeLogItVeneer(void *logger, const void *message,
                              bool logEnabled, bool tracebackEnabled);
void welcomeLogItTarget(void *logger, const void *message,
                        bool logEnabled, bool tracebackEnabled)
    __asm__("__ZN6spdlog6logger7log_it_ERKNS_7details7log_msgEbb");
void nativeWelcomeLogItDispatcher(void *logger, const void *message,
                                  bool logEnabled, bool tracebackEnabled,
                                  std::uintptr_t callerPc);
}

extern "C" void nativeWelcomeLogItDispatcher(
    void *logger, const void *message, bool logEnabled,
    bool tracebackEnabled, std::uintptr_t)
{
    welcomeFixtureNoteDispatcher();
    welcomeLogItTarget(logger, message, logEnabled, tracebackEnabled);
}

extern "C" __attribute__((constructor)) void welcomeFixtureInterposerConstructor()
{
    welcomeFixtureRecordInterposerGate(
        nativeWelcomeLogItExpectedReturnPc.load(std::memory_order_acquire));
    welcomeFixtureMarkInterposerReady();
    welcomeFixtureEarlyCallerAnchor();
}

__attribute__((used)) static struct {
    const void *replacement;
    const void *replacee;
} welcomeFixtureInterpose __attribute__((section("__DATA,__interpose"))) = {
    reinterpret_cast<const void *>(nativeWelcomeLogItVeneer),
    reinterpret_cast<const void *>(welcomeLogItTarget)
};

// -- Unsafe snapshot compatibility: the old veneer requires these zero slots --
extern "C" __attribute__((noreturn)) void nativeWelcomeLogItMissingOriginal()
{
    std::abort();
}
