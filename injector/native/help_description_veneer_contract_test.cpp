/**
 * [INPUT]: 依赖help_description_veneer.S、探针汇编的固定寄存器快照与返回槽。
 * [OUTPUT]: 以进程退出码断言未知caller透传及main/def精确caller分流。
 * [POS]: native帮助veneer的vendor-free arm64 ABI合同；不加载Qt或Cavalry。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include <cstdint>
#include <cstddef>
#include <cstdio>

#if !defined(__aarch64__) && !defined(__arm64__)
#error "This contract test requires arm64."
#endif

extern "C" {
void nativeHelpProbeUnknownA();
void nativeHelpProbeUnknownB();
void nativeHelpProbeExactMain();
void nativeHelpProbeExactDef();

extern volatile std::uint64_t nativeHelpExpectedReturnPc;
extern volatile std::uint64_t nativeHelpExpectedDefReturnPc;
extern volatile std::uint64_t nativeHelpOriginalCallCount;
extern volatile std::uint64_t nativeHelpDispatcherCallCount;
extern volatile std::uint64_t nativeHelpEntryGprs[9];
extern volatile std::uint64_t nativeHelpEntryVectors[16];
extern volatile std::uint64_t nativeHelpEntrySp;
extern volatile std::uint64_t nativeHelpEntryFp;
extern volatile std::uint64_t nativeHelpEntryLr;
extern volatile std::uint64_t nativeHelpProbeExpectedSp;
extern volatile std::uint64_t nativeHelpProbeExpectedFp;
extern volatile std::uint64_t nativeHelpProbeExpectedLr;
extern volatile std::uint64_t nativeHelpUnknownReturnX0;
extern volatile std::uint64_t nativeHelpUnknownReturnV0[2];
extern volatile std::uint64_t nativeHelpExactMainReturnX0;
extern volatile std::uint64_t nativeHelpExactMainReturnV0[2];
extern volatile std::uint64_t nativeHelpExactDefReturnX0;
extern volatile std::uint64_t nativeHelpExactDefReturnV0[2];
extern volatile std::uint64_t nativeHelpIndirectResultBuffer[2];
}

namespace {

constexpr std::uint64_t kInputGprs[8] = {
    0x0102030405060708ULL,
    0x1112131415161718ULL,
    0x2122232425262728ULL,
    0x3132333435363738ULL,
    0x4142434445464748ULL,
    0x5152535455565758ULL,
    0x6162636465666768ULL,
    0x7172737475767778ULL,
};

constexpr std::uint64_t kInputVectors[16] = {
    0x0123456789abcdefULL, 0xfedcba9876543210ULL,
    0x1023456789abcdefULL, 0xefdcba9876543210ULL,
    0x2023456789abcdefULL, 0xdfdcba9876543210ULL,
    0x3023456789abcdefULL, 0xcfdcba9876543210ULL,
    0x4023456789abcdefULL, 0xbfdcba9876543210ULL,
    0x5023456789abcdefULL, 0xafdcba9876543210ULL,
    0x6023456789abcdefULL, 0x9fdcba9876543210ULL,
    0x7023456789abcdefULL, 0x8fdcba9876543210ULL,
};

constexpr std::uint64_t kOriginalX0 = 0x123456789abcdef0ULL;
constexpr std::uint64_t kOriginalV0[2] = {
    0xaabbccddeeff0011ULL, 0x2233445566778899ULL,
};
constexpr std::uint64_t kIndirectResult[2] = {
    0x0badf00d12345678ULL, 0x87654321cafef00dULL,
};
constexpr std::uint64_t kDispatcherX0 = 0xfedcba9876543210ULL;
constexpr std::uint64_t kDispatcherV0[2] = {
    0x55aa55aa55aa55aaULL, 0xaa55aa55aa55aa55ULL,
};

int failures = 0;

void expect(bool condition, const char* message) {
    if (condition) return;
    std::fprintf(stderr, "FAIL: %s\n", message);
    ++failures;
}

void expect_equal(std::uint64_t actual, std::uint64_t expected, const char* message) {
    if (actual == expected) return;
    std::fprintf(stderr, "FAIL: %s (actual=0x%016llx expected=0x%016llx)\n",
                 message,
                 static_cast<unsigned long long>(actual),
                 static_cast<unsigned long long>(expected));
    ++failures;
}

void reset_observations() {
    nativeHelpExpectedReturnPc = 0;
    nativeHelpExpectedDefReturnPc = 0;
    nativeHelpOriginalCallCount = 0;
    nativeHelpDispatcherCallCount = 0;
    nativeHelpUnknownReturnX0 = 0;
    nativeHelpUnknownReturnV0[0] = 0;
    nativeHelpUnknownReturnV0[1] = 0;
    nativeHelpExactMainReturnX0 = 0;
    nativeHelpExactMainReturnV0[0] = 0;
    nativeHelpExactMainReturnV0[1] = 0;
    nativeHelpExactDefReturnX0 = 0;
    nativeHelpExactDefReturnV0[0] = 0;
    nativeHelpExactDefReturnV0[1] = 0;
    nativeHelpIndirectResultBuffer[0] = 0;
    nativeHelpIndirectResultBuffer[1] = 0;
}

void verify_unknown_snapshot(const char* caller) {
    for (std::size_t i = 0; i < 8; ++i) {
        char label[80];
        std::snprintf(label, sizeof(label), "%s preserves x%zu", caller, i);
        expect_equal(nativeHelpEntryGprs[i], kInputGprs[i], label);
    }
    expect_equal(nativeHelpEntryGprs[8],
                 reinterpret_cast<std::uintptr_t>(nativeHelpIndirectResultBuffer),
                 "unknown caller preserves x8 indirect result pointer");

    for (std::size_t i = 0; i < 16; ++i) {
        char label[80];
        std::snprintf(label, sizeof(label), "%s preserves v%zu lane", caller, i / 2);
        expect_equal(nativeHelpEntryVectors[i], kInputVectors[i], label);
    }

    expect_equal(nativeHelpEntrySp, nativeHelpProbeExpectedSp,
                 "unknown caller preserves entry sp");
    expect_equal(nativeHelpEntryFp, nativeHelpProbeExpectedFp,
                 "unknown caller preserves entry x29");
    expect_equal(nativeHelpEntryLr, nativeHelpProbeExpectedLr,
                 "unknown caller preserves entry x30");
    expect_equal(nativeHelpUnknownReturnX0, kOriginalX0,
                 "unknown caller keeps original x0 return");
    expect_equal(nativeHelpUnknownReturnV0[0], kOriginalV0[0],
                 "unknown caller keeps original v0 low lane");
    expect_equal(nativeHelpUnknownReturnV0[1], kOriginalV0[1],
                 "unknown caller keeps original v0 high lane");
    expect_equal(nativeHelpIndirectResultBuffer[0], kIndirectResult[0],
                 "unknown caller keeps indirect result low word");
    expect_equal(nativeHelpIndirectResultBuffer[1], kIndirectResult[1],
                 "unknown caller keeps indirect result high word");
}

}  // namespace

int main() {
    reset_observations();

    nativeHelpProbeUnknownA();
    expect_equal(nativeHelpOriginalCallCount, 1,
                 "first unknown caller invokes only original callee once");
    expect_equal(nativeHelpDispatcherCallCount, 0,
                 "first unknown caller bypasses dispatcher");
    verify_unknown_snapshot("first unknown caller");
    const std::uint64_t firstUnknownLr = nativeHelpEntryLr;

    nativeHelpProbeUnknownB();
    expect_equal(nativeHelpOriginalCallCount, 2,
                 "second unknown caller invokes original callee once");
    expect_equal(nativeHelpDispatcherCallCount, 0,
                 "second unknown caller bypasses dispatcher");
    expect(nativeHelpEntryLr != firstUnknownLr,
           "unknown caller probes use distinct return addresses");
    verify_unknown_snapshot("second unknown caller");

    nativeHelpProbeExactMain();
    expect_equal(nativeHelpDispatcherCallCount, 1,
                 "main LR invokes dispatcher exactly once");
    expect_equal(nativeHelpOriginalCallCount, 2,
                 "main LR does not invoke original callee");
    expect_equal(nativeHelpExactMainReturnX0, kDispatcherX0,
                 "main LR returns dispatcher x0");
    expect_equal(nativeHelpExactMainReturnV0[0], kDispatcherV0[0],
                 "main LR returns dispatcher v0 low lane");
    expect_equal(nativeHelpExactMainReturnV0[1], kDispatcherV0[1],
                 "main LR returns dispatcher v0 high lane");

    nativeHelpProbeExactDef();
    expect_equal(nativeHelpDispatcherCallCount, 2,
                 "def LR invokes dispatcher exactly once");
    expect_equal(nativeHelpOriginalCallCount, 2,
                 "def LR does not invoke original callee");
    expect_equal(nativeHelpExactDefReturnX0, kDispatcherX0,
                 "def LR returns dispatcher x0");
    expect_equal(nativeHelpExactDefReturnV0[0], kDispatcherV0[0],
                 "def LR returns dispatcher v0 low lane");
    expect_equal(nativeHelpExactDefReturnV0[1], kDispatcherV0[1],
                 "def LR returns dispatcher v0 high lane");

    if (failures != 0) {
        std::fprintf(stderr, "FAIL: %d assertion(s)\n", failures);
        return 1;
    }
    std::puts("PASS: arm64 veneer preserves unknown-caller ABI; exact main/def LR dispatch once and return original dispatcher results.");
    return 0;
}
