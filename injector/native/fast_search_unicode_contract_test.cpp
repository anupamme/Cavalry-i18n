/**
 * [INPUT]: 依赖Fast caller策略和原构造器透传模板。
 * [OUTPUT]: 验证options门、单次调用、原值透传与异常传播。
 * [POS]: 无Qt/vendor依赖的纯合同测试；不证明dyld或Cavalry消费。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "fast_search_unicode_policy.h"

#include <cassert>
#include <cstdint>

namespace {
struct Capture {
    unsigned calls = 0;
    int options = -1;
};

void originalConstructor(Capture *capture, const int &, int options)
{
    ++capture->calls;
    capture->options = options;
}

struct OriginalFailure {};
}  // namespace

int main()
{
    using namespace native_fast_search;
    constexpr std::uintptr_t expectedReturn = abi::kReturnOffset;
    bool patternChecked = false;
    const bool exactCall = policy::eligible(
        true, expectedReturn, expectedReturn, abi::kNoPatternOption,
        [&patternChecked]() noexcept {
            patternChecked = true;
            return true;
        });
    assert(exactCall);
    assert(patternChecked);
    patternChecked = false;
    assert(!policy::eligible(false, expectedReturn, expectedReturn, 0,
        [&patternChecked]() noexcept { patternChecked = true; return false; }));
    assert(!patternChecked);
    assert(!policy::eligible(true, expectedReturn + 4, expectedReturn, 0,
        [&patternChecked]() noexcept { patternChecked = true; return false; }));
    assert(!patternChecked);
    assert(!policy::eligible(true, expectedReturn, expectedReturn, 1,
        [&patternChecked]() noexcept { patternChecked = true; return false; }));
    assert(!patternChecked);
    assert(!policy::eligible(true, expectedReturn, expectedReturn, 0,
        [&patternChecked]() noexcept { patternChecked = true; return false; }));
    assert(patternChecked);

    Capture capture{};
    int self = 0;
    const int pattern = 7;
    policy::forwardOriginal(originalConstructor, &capture, pattern, 0,
                            exactCall, abi::kUnicodePropertiesOption);
    assert(capture.calls == 1);
    assert(capture.options == abi::kUnicodePropertiesOption);

    capture = {};
    policy::forwardOriginal(originalConstructor, &capture, pattern, 0,
                            false, abi::kUnicodePropertiesOption);
    assert(capture.calls == 1);
    assert(capture.options == abi::kNoPatternOption);

    capture = {};
    policy::forwardOriginal(originalConstructor, &capture, pattern, 3,
                            false, abi::kUnicodePropertiesOption);
    assert(capture.calls == 1);
    assert(capture.options == 3);

    bool exceptionPropagated = false;
    try {
        policy::forwardOriginal(
            [](int *, const int &, int) { throw OriginalFailure{}; },
            &self, pattern, 0, true, abi::kUnicodePropertiesOption);
    } catch (const OriginalFailure &) {
        exceptionPropagated = true;
    }
    assert(exceptionPropagated);
    return 0;
}
