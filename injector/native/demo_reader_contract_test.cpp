/**
 * [INPUT]: 依赖optional<string> ABI合同、精确slot策略与模拟原函数。
 * [OUTPUT]: 验证nullopt/短长文本、owner门、单次原调用及异常边界。
 * [POS]: vendor-free Demo合同；不加载Cavalry或触发菜单回调。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "demo_reader_abi_contract.h"
#include "demo_reader_policy.h"

#include <cstdio>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <utility>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wreturn-type-c-linkage"
extern "C" native_demo_reader::contract::TextFromFileResult demoTextFromFileAbiProbe(
    const std::string &path)
    __asm__("__ZN7cavalry12textFromFileERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE");
#pragma clang diagnostic pop

namespace {
using namespace native_demo_reader;
using Result = contract::TextFromFileResult;
using AbiFunction = contract::TextFromFileFunction;
static_assert(std::is_same_v<decltype(&demoTextFromFileAbiProbe), AbiFunction>);
static_assert(sizeof(Result) == 0x20);
static_assert(alignof(Result) == 8);
static_assert(!std::is_trivially_destructible_v<Result>);

bool require(bool condition, const char *message)
{
    if (condition) return true;
    std::fprintf(stderr, "FAIL: %s\n", message);
    return false;
}

struct CallCounts {
    std::size_t original = 0;
    std::size_t locale = 0;
    std::size_t project = 0;
};

bool localizedTextUsesOnlyApprovedSlots()
{
    const DemoReaderText texts[] = {{"Hello", "你好", "妳好", "こんにちは"}};
    const std::string source = "const title = 'Hello';\n// Keep this English comment.";
    const std::size_t start = source.find("'Hello'");
    const DemoReaderSlot slots[] = {{static_cast<std::uint32_t>(start),
        static_cast<std::uint32_t>(start + 7U), 0U, '\''}};
    const DemoReaderFile file = {"Demo.js", "unused-by-pure-projector",
        static_cast<std::uint32_t>(source.size()), 0U, 1U};
    std::string output;
    return require(projectScript(source, file, texts, slots,
                                 cavalry_native_font::Locale::Hans, &output),
                   "verified table projects one source slot") &&
        require(output == "const title = '你好';\n// Keep this English comment.",
                "projection preserves every byte outside the approved slot");
}

bool quoteEscapesAndUnknownLocaleStayBounded()
{
    const DemoReaderText texts[] = {{"Say", "她说\"好\"", "她說'好'", "彼女は'良い'と言う"}};
    const std::string source = "const label = \"Say\";";
    const std::size_t start = source.find("\"Say\"");
    const DemoReaderSlot slots[] = {{static_cast<std::uint32_t>(start),
        static_cast<std::uint32_t>(start + 5U), 0U, '"'}};
    const DemoReaderFile file = {"Dialog.js", "unused-by-pure-projector",
        static_cast<std::uint32_t>(source.size()), 0U, 1U};
    std::string output = "sentinel";
    if (!require(projectScript(source, file, texts, slots,
                               cavalry_native_font::Locale::Hans, &output),
                 "double-quoted source literal is projected")) return false;
    if (!require(output == "const label = \"她说\\\"好\\\"\";",
                 "translation quote is escaped for the original delimiter")) return false;
    output = "sentinel";
    return require(!projectScript(source, file, texts, slots,
                                  cavalry_native_font::Locale::English, &output) &&
                   output == "sentinel",
                   "English locale leaves the original output untouched");
}

bool optionalForwardingIsSingleAndExceptionSafe()
{
    const DemoReaderText texts[] = {{"Go", "走", "走", "進む"}};
    const std::string shortSource = "const x='Go';";
    const std::size_t start = shortSource.find("'Go'");
    const DemoReaderSlot slots[] = {{static_cast<std::uint32_t>(start),
        static_cast<std::uint32_t>(start + 4U), 0U, '\''}};
    const DemoReaderFile file = {"Short.js", "baef9a27ee9b9e99ede2fdbf902b97eaddfc60001398b0d07b4470064ed6cb28",
        static_cast<std::uint32_t>(shortSource.size()), 0U, 1U};

    CallCounts counts{};
    Result shortResult = forwardOnce(
        [&]() -> Result { ++counts.original; return shortSource; }, true, true,
        [&]() { ++counts.locale; return cavalry_native_font::Locale::Hant; },
        [&](std::string_view source, auto &&locale, std::string *output) {
            ++counts.project;
            return projectVerifiedScript(source, file, texts, slots,
                std::forward<decltype(locale)>(locale), output);
        });
    if (!require(counts.original == 1 && counts.locale == 1 && counts.project == 1,
                 "engaged short result calls original/projector once") ||
        !require(shortResult && *shortResult == "const x='走';",
                 "short-string optional result survives localization")) return false;

    counts = {};
    const DemoReaderFile staleFile = {"Short.js", "0000000000000000000000000000000000000000000000000000000000000000",
        static_cast<std::uint32_t>(shortSource.size()), 0U, 1U};
    Result staleSource = forwardOnce(
        [&]() -> Result { ++counts.original; return shortSource; }, true, true,
        [&]() { ++counts.locale; return cavalry_native_font::Locale::Hans; },
        [&](std::string_view source, auto &&locale, std::string *output) {
            ++counts.project;
            return projectVerifiedScript(source, staleFile, texts, slots,
                std::forward<decltype(locale)>(locale), output);
        });
    if (!require(staleSource && *staleSource == shortSource && counts.original == 1 &&
                 counts.project == 1 && counts.locale == 0,
                 "changed source SHA falls back before reading locale")) return false;

    counts = {};
    Result noFile = forwardOnce(
        [&]() -> Result { ++counts.original; return std::nullopt; }, true, true,
        [&]() { ++counts.locale; return cavalry_native_font::Locale::Hans; },
        [&](std::string_view, auto &&, std::string *) { ++counts.project; return true; });
    if (!require(!noFile && counts.original == 1 && counts.locale == 0 && counts.project == 0,
                 "disengaged optional passes through without locale or projection")) return false;

    counts = {};
    const std::string longSource(512, 'x');
    Result longResult = forwardOnce(
        [&]() -> Result { ++counts.original; return longSource; }, true, true,
        [&]() { ++counts.locale; return cavalry_native_font::Locale::Hans; },
        [&](std::string_view source, auto &&locale, std::string *output) {
            ++counts.project;
            if (locale() != cavalry_native_font::Locale::Hans || source.size() != 512U)
                return false;
            *output = std::string(700, 'y');
            return true;
        });
    if (!require(longResult && longResult->size() == 700U &&
                 longResult->front() == 'y' && counts.original == 1,
                 "long heap-backed string moves through optional result")) return false;

    counts = {};
    Result unknownOwner = forwardOnce(
        [&]() -> Result { ++counts.original; return shortSource; }, false, true,
        [&]() { ++counts.locale; return cavalry_native_font::Locale::Hans; },
        [&](std::string_view, auto &&, std::string *) { ++counts.project; return true; });
    if (!require(unknownOwner && *unknownOwner == shortSource && counts.original == 1 &&
                 counts.locale == 0 && counts.project == 0,
                 "unknown caller transparently returns the original optional")) return false;

    counts = {};
    Result unknownPath = forwardOnce(
        [&]() -> Result { ++counts.original; return shortSource; }, true, false,
        [&]() { ++counts.locale; return cavalry_native_font::Locale::Hans; },
        [&](std::string_view, auto &&, std::string *) { ++counts.project; return true; });
    if (!require(unknownPath && *unknownPath == shortSource && counts.original == 1 &&
                 counts.locale == 0 && counts.project == 0,
                 "unknown path transparently returns the original optional")) return false;

    counts = {};
    Result projectionFailure = forwardOnce(
        [&]() -> Result { ++counts.original; return shortSource; }, true, true,
        [&]() { ++counts.locale; return cavalry_native_font::Locale::Hans; },
        [&](std::string_view, auto &&, std::string *) -> bool {
            ++counts.project;
            throw std::runtime_error("projection-only failure");
        });
    if (!require(projectionFailure && *projectionFailure == shortSource &&
                 counts.original == 1 && counts.project == 1,
                 "projection failure keeps the complete source result")) return false;

    counts = {};
    bool originalExceptionPropagated = false;
    try {
        (void)forwardOnce(
            [&]() -> Result { ++counts.original; throw std::runtime_error("vendor failure"); },
            true, true,
            [&]() { ++counts.locale; return cavalry_native_font::Locale::Hans; },
            [&](std::string_view, auto &&, std::string *) { ++counts.project; return true; });
    } catch (const std::runtime_error &) {
        originalExceptionPropagated = true;
    }
    return require(originalExceptionPropagated && counts.original == 1 &&
                   counts.locale == 0 && counts.project == 0,
                   "original exception propagates after exactly one original call");
}
}  // namespace

int main()
{
    if (!localizedTextUsesOnlyApprovedSlots() ||
        !quoteEscapesAndUnknownLocaleStayBounded() ||
        !optionalForwardingIsSingleAndExceptionSafe()) return 1;
    std::puts("PASS: optional<string> ABI and Demo exact-owner/source policy contract");
    return 0;
}
