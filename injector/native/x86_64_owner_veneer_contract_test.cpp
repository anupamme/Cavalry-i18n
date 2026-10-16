/**
 * [INPUT]: 依赖x86_64 GetPath/Blob/Help/Welcome veneer与合成caller标签。
 * [OUTPUT]: 验证寄存器、sret、stack frame、exact PC及未知调用单次透传。
 * [POS]: vendor-free ABI合同；不证明官方二进制caller或运行接线。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "getpath_font_abi.h"
#include "viewport_blob_abi.h"

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <cstdio>

namespace {
int gFailures = 0;
int gGetPathCalls = 0;
int gBlobCalls = 0;
int gHelpDispatchCalls = 0;
int gHelpOriginalCalls = 0;
int gWelcomeDispatchCalls = 0;
int gWelcomeOriginalCalls = 0;
std::uintptr_t gLastHelpPc = 0;
std::uintptr_t gLastWelcomePc = 0;
std::uintptr_t gLastGetPathPc = 0;
std::uintptr_t gLastBlobPc = 0;
std::uintptr_t gLastGetPathFrame = 0;
std::uintptr_t gLastBlobFrame = 0;
float gBlobReturn = 17.0F;
int gText = 1;
int gFont = 2;
int gBounds = 3;
int gPaint = 4;
int gPath = 5;
int gCanvas = 6;
int gDocument = 7;
int gHelpKey = 10;
std::uint64_t gHelpDocument = 71;
int gLogger = 8;
int gMessage = 9;

void expect(bool condition, const char *message)
{
    if (!condition) {
        std::fprintf(stderr, "FAIL: %s\n", message);
        ++gFailures;
    }
}
}  // namespace

extern "C" std::uintptr_t gProbeCallerFrame = 0;

extern "C" {
__attribute__((visibility("hidden")))
std::atomic<std::uintptr_t> nativeHelpExpectedReturnPc{0};
__attribute__((visibility("hidden")))
std::atomic<std::uintptr_t> nativeHelpExpectedDefReturnPc{0};
__attribute__((visibility("hidden")))
std::atomic<std::uintptr_t> nativeWelcomeLogItExpectedReturnPc{0};
}

extern "C" std::uintptr_t probeGetPathReturnAddress();
extern "C" std::uintptr_t probeViewportBlobReturnAddress();
extern "C" std::uintptr_t probeHelpMainReturnAddress();
extern "C" std::uintptr_t probeHelpDefReturnAddress();
extern "C" std::uintptr_t probeWelcomeReturnAddress();
extern "C" void probeGetPath(const void *, std::size_t, int, float, float,
                             const void *, void *);
#if defined(__clang__)
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wreturn-type-c-linkage"
#endif
extern "C" viewport_blob::BlobResultAbi probeViewportBlob(
    const void *, std::size_t, const void *, int);
#if defined(__clang__)
#pragma clang diagnostic pop
#endif
extern "C" void probeHelpMain(void *, const void *, const void *);
extern "C" void probeHelpDef(void *, const void *, const void *);
extern "C" void probeWelcome(void *, const void *, bool, bool);

extern "C" void nativeHelpDocumentationInterpose(
    void *, const void *, const void *);
extern "C" void nativeWelcomeLogItVeneer(void *, const void *, bool, bool);

extern "C" void helpDocumentationEntryTarget(
    void *, const void *, const void *)
    __asm__("__ZN8TextEdit27addScriptDocumentationEntryERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKN7cavalry19ScriptDocumentationE");
extern "C" void welcomeLogItTarget(void *, const void *, bool, bool)
    __asm__("__ZN6spdlog6logger7log_it_ERKNS_7details7log_msgEbb");

extern "C" void getPathFontDispatch(
    const void *text, std::size_t length, int encoding, float x, float y,
    const void *font, void *path, std::uintptr_t callerPc,
    std::uintptr_t callerFrame)
{
    ++gGetPathCalls;
    expect(text == &gText && length == 0x1234 && encoding == 3,
           "GetPath rdi/rsi/rdx");
    expect(x == 1.25F && y == -2.5F, "GetPath xmm0/xmm1");
    expect(font == &gFont && path == &gPath, "GetPath rcx/r8");
    gLastGetPathPc = callerPc;
    gLastGetPathFrame = callerFrame;
}

extern "C" viewport_blob::BlobResultAbi viewportBlobDispatch(
    const void *text, std::size_t length, const void *font, int encoding,
    std::uintptr_t callerPc, std::uintptr_t callerFrame) noexcept
{
    ++gBlobCalls;
    const bool exact = text == &gText && length == 0x4321 &&
        font == &gFont && encoding == 1;
    if (!exact) {
        std::fprintf(stderr, "BLOB text=%p/%p length=%zu font=%p/%p enc=%d\n",
                     text, static_cast<void *>(&gText), length, font,
                     static_cast<void *>(&gFont), encoding);
    }
    expect(exact, "Blob input registers after hidden sret");
    gLastBlobPc = callerPc;
    gLastBlobFrame = callerFrame;
    return viewport_blob::BlobResultAbi(&gBlobReturn);
}

extern "C" void nativeHelpDocumentationDispatcher(
    void *owner, const void *key, const void *document,
    std::uintptr_t callerPc)
{
    ++gHelpDispatchCalls;
    gLastHelpPc = callerPc;
    helpDocumentationEntryTarget(owner, key, document);
}

extern "C" void helpDocumentationEntryTarget(
    void *owner, const void *key, const void *document)
{
    ++gHelpOriginalCalls;
    expect(owner == &gDocument && key == &gHelpKey &&
               document == &gHelpDocument,
           "Help original receives original argument registers");
}

extern "C" void nativeWelcomeLogItDispatcher(
    void *logger, const void *message, bool enabled, bool traceback,
    std::uintptr_t callerPc)
{
    ++gWelcomeDispatchCalls;
    gLastWelcomePc = callerPc;
    welcomeLogItTarget(logger, message, enabled, traceback);
}

extern "C" void welcomeLogItTarget(
    void *logger, const void *message, bool enabled, bool traceback)
{
    ++gWelcomeOriginalCalls;
    expect(logger == &gLogger && message == &gMessage && enabled && !traceback,
           "Welcome original receives original arguments");
}

int main()
{
    probeGetPath(&gText, 0x1234, 3, 1.25F, -2.5F, &gFont, &gPath);
    expect(gGetPathCalls == 1, "GetPath dispatcher called once");
    expect(gLastGetPathPc == probeGetPathReturnAddress(), "GetPath caller PC");
    expect(gLastGetPathFrame == gProbeCallerFrame, "GetPath caller RBP");

    auto blob = probeViewportBlob(&gText, 0x4321, &gFont, 1);
    expect(blob.pointer == &gBlobReturn, "Blob hidden sret result");
    expect(gBlobCalls == 1, "Blob dispatcher called once");
    expect(gLastBlobPc == probeViewportBlobReturnAddress(), "Blob caller PC");
    expect(gLastBlobFrame == gProbeCallerFrame, "Blob caller RBP");

    nativeHelpExpectedReturnPc.store(probeHelpMainReturnAddress());
    nativeHelpExpectedDefReturnPc.store(probeHelpDefReturnAddress());
    probeHelpMain(&gDocument, &gHelpKey, &gHelpDocument);
    expect(gHelpDispatchCalls == 1 && gHelpOriginalCalls == 1,
           "Help main caller dispatches and forwards once");
    expect(gLastHelpPc == probeHelpMainReturnAddress(), "Help main return PC");
    probeHelpDef(&gDocument, &gHelpKey, &gHelpDocument);
    expect(gHelpDispatchCalls == 2 && gHelpOriginalCalls == 2,
           "Help def caller dispatches and forwards once");
    expect(gLastHelpPc == probeHelpDefReturnAddress(), "Help def return PC");
    nativeHelpDocumentationInterpose(&gDocument, &gHelpKey, &gHelpDocument);
    expect(gHelpDispatchCalls == 2 && gHelpOriginalCalls == 3,
           "Unknown Help caller tail-forwards once without dispatch");

    nativeWelcomeLogItExpectedReturnPc.store(probeWelcomeReturnAddress());
    probeWelcome(&gLogger, &gMessage, true, false);
    expect(gWelcomeDispatchCalls == 1 && gWelcomeOriginalCalls == 1,
           "Welcome exact caller dispatches and forwards once");
    expect(gLastWelcomePc == probeWelcomeReturnAddress(), "Welcome return PC");
    nativeWelcomeLogItExpectedReturnPc.store(0);
    nativeWelcomeLogItVeneer(&gLogger, &gMessage, true, false);
    expect(gWelcomeDispatchCalls == 1 && gWelcomeOriginalCalls == 2,
           "Unknown Welcome caller forwards once without dispatch");

    if (gFailures != 0) return 1;
    std::puts("PASS: x86_64 owner veneers preserve args, PC/frame, sret and unknown forwarding");
    return 0;
}
