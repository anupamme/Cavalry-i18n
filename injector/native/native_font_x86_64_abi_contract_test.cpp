/**
 * [INPUT]: 依赖x86 factory、原函数绑定、字体lane及Viewport owner合同。
 * [OUTPUT]: 验证错误绑定闭门、短长串和未知owner单次透传。
 * [POS]: Rosetta可运行的vendor-free合同；不装载Cavalry或候选dylib。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "native_font_x86_64_abi_contract.h"
#include "getpath_owner_adapter.h"
#include "timeline_owner_observer_x86_64_contract.h"
#include "viewport_blob_x86_64_owner_snapshot.h"

#include <array>
#include <cstdint>
#include <cstring>
#include <cstdio>
#include <string_view>

namespace contract = native_font_x86_64_abi::contract;
namespace blob_contract = native_viewport_blob_x86_64::contract;

namespace {
struct FakeStack {
    static constexpr std::uintptr_t kLow = 0x0c00;
    static constexpr std::uintptr_t kHigh = 0x1800;
    static constexpr std::uintptr_t kFrame = 0x1000;
    static constexpr std::uintptr_t kObject =
        kFrame - blob_contract::kNameObjectBelowFrame;
    std::array<unsigned char, kHigh - kLow> bytes{};
    unsigned objectReads = 0;
    bool mutateOnSecondObjectRead = false;

    void write(std::uintptr_t address, const void *source, std::size_t size)
    {
        std::memcpy(bytes.data() + (address - kLow), source, size);
    }

    bool read(std::uintptr_t address, std::size_t size, void *destination)
    {
        if (address < kLow || address > kHigh || size > kHigh - address)
            return false;
        if (address == kObject && size == blob_contract::kStringObjectBytes) {
            ++objectReads;
            if (mutateOnSecondObjectRead && objectReads == 2U)
                bytes[address - kLow] ^= 0x02U;
        }
        std::memcpy(destination, bytes.data() + (address - kLow), size);
        return true;
    }
};
} // namespace

int main()
{
    if (!contract::uuidMatches(contract::kCoreUuid, contract::kCoreUuid) ||
        contract::uuidMatches(contract::kCoreUuid, contract::kExtensionUuid)) {
        return 1;
    }

    constexpr auto expected = contract::kSetSizeBytes;
    if (!contract::codeWindowMatches(expected, expected)) return 2;
    auto changedBytes = expected;
    changedBytes[changedBytes.size() / 2U] ^= 0x01U;
    if (contract::codeWindowMatches(expected, changedBytes)) return 3;

    if (!contract::timelineStringLayoutMatches(contract::kTimelineStringLayout))
        return 4;
    auto wrongField = contract::kTimelineStringLayout;
    ++wrongField.fieldOffset;
    auto wrongLongPointer = contract::kTimelineStringLayout;
    --wrongLongPointer.longDataOffset;
    auto wrongShortLimit = contract::kTimelineStringLayout;
    --wrongShortLimit.shortCapacity;
    if (contract::timelineStringLayoutMatches(wrongField) ||
        contract::timelineStringLayoutMatches(wrongLongPointer) ||
        contract::timelineStringLayoutMatches(wrongShortLimit)) return 5;

    if (contract::kMeasureCallOffset + contract::kMeasureCallBytes.size() !=
            contract::kMeasureReturnOffset ||
        contract::kDrawCallOffset + contract::kDrawCallBytes.size() !=
            contract::kDrawReturnOffset ||
        contract::kTimelineCapturePointerOffset != 0x18U) return 6;

    constexpr std::uintptr_t skia = 0x100000000ULL;
    constexpr std::uintptr_t core = 0x200000000ULL;
    constexpr contract::FactoryAddresses bindings{
        skia + contract::kMakeTypefaceOffset, skia + contract::kGetCTFontOffset,
        core + contract::kMakeScalableFontOffset, skia + contract::kGlyphOffset,
        skia + contract::kSetSizeOffset};
    if (!contract::factoryAddressesMatch(bindings, skia, core)) return 7;
    auto wrongBinding = bindings;
    ++wrongBinding.makeScalableFont;
    if (contract::factoryAddressesMatch(wrongBinding, skia, core) ||
        contract::factoryAddressesMatch(bindings, 0, core)) return 8;

    namespace timeline = timeline_owner_observer::x86_64_contract;
    constexpr contract::OriginalFunctionAddresses originalFunctions{
        skia + contract::kGetPathOffset,
        skia + timeline::kMeasureSymbolOffset,
        skia + timeline::kDrawSymbolOffset,
        skia + blob_contract::kMakeFromTextOffset};
    if (!contract::originalFunctionsMatch(
            originalFunctions, skia, contract::kGetPathOffset,
            timeline::kMeasureSymbolOffset, timeline::kDrawSymbolOffset,
            blob_contract::kMakeFromTextOffset)) return 23;
    auto wrongOriginals = originalFunctions;
    ++wrongOriginals.getPath;
    if (contract::originalFunctionsMatch(
            wrongOriginals, skia, contract::kGetPathOffset,
            timeline::kMeasureSymbolOffset, timeline::kDrawSymbolOffset,
            blob_contract::kMakeFromTextOffset)) return 24;
    wrongOriginals = originalFunctions;
    ++wrongOriginals.measureText;
    if (contract::originalFunctionsMatch(
            wrongOriginals, skia, contract::kGetPathOffset,
            timeline::kMeasureSymbolOffset, timeline::kDrawSymbolOffset,
            blob_contract::kMakeFromTextOffset)) return 25;
    wrongOriginals = originalFunctions;
    ++wrongOriginals.drawText;
    if (contract::originalFunctionsMatch(
            wrongOriginals, skia, contract::kGetPathOffset,
            timeline::kMeasureSymbolOffset, timeline::kDrawSymbolOffset,
            blob_contract::kMakeFromTextOffset)) return 26;
    wrongOriginals = originalFunctions;
    ++wrongOriginals.makeTextBlob;
    if (contract::originalFunctionsMatch(
            wrongOriginals, skia, contract::kGetPathOffset,
            timeline::kMeasureSymbolOffset, timeline::kDrawSymbolOffset,
            blob_contract::kMakeFromTextOffset) ||
        contract::originalFunctionsMatch(
            originalFunctions, 0, contract::kGetPathOffset,
            timeline::kMeasureSymbolOffset, timeline::kDrawSymbolOffset,
            blob_contract::kMakeFromTextOffset)) return 27;
    if (contract::fontLaneContractsReady(false, false) ||
        contract::fontLaneContractsReady(false, true) ||
        contract::fontLaneContractsReady(true, false) ||
        !contract::fontLaneContractsReady(true, true)) return 28;

    std::array<std::uint8_t, contract::kTimelineStringObjectBytes> shortObject{};
    constexpr char shortText[] = "Cavalry";
    shortObject[0] = static_cast<std::uint8_t>(sizeof(shortText) - 1U) << 1U;
    std::memcpy(shortObject.data() + 1, shortText, sizeof(shortText));
    contract::TimelineStringView view{};
    constexpr std::uintptr_t stringBase = 0x300000000ULL;
    if (!contract::decodeTimelineString(shortObject.data(), stringBase, 64, &view) ||
        view.longForm || view.dataAddress != stringBase + 1 ||
        view.size != sizeof(shortText) - 1U) return 9;
    shortObject[0] = 0xff;
    if (contract::decodeTimelineString(shortObject.data(), stringBase, 64, &view)) return 10;

    std::array<std::uint8_t, contract::kTimelineStringObjectBytes> longObject{};
    constexpr std::uint64_t longSize = 64;
    constexpr std::uintptr_t longData = 0x400000000ULL;
    const std::uint64_t longTag = 1;
    std::memcpy(longObject.data(), &longTag, sizeof(longTag));
    std::memcpy(longObject.data() + contract::kLongStringLengthOffset,
                &longSize, sizeof(longSize));
    std::memcpy(longObject.data() + contract::kLongStringDataOffset,
                &longData, sizeof(longData));
    if (!contract::decodeTimelineString(longObject.data(), stringBase, 128, &view) ||
        !view.longForm || view.dataAddress != longData || view.size != longSize ||
        contract::decodeTimelineString(longObject.data(), stringBase, 32, &view)) return 11;

    for (unsigned denied = 0; denied < 3; ++denied) {
        unsigned originalCalls = 0;
        unsigned adaptCalls = 0;
        const bool admitted = denied != 0;
        const bool caller = denied != 1;
        const bool owner = denied != 2;
        const int result = contract::forwardUnlessVerified(
            admitted, caller, owner,
            [&]() { ++originalCalls; return 17; },
            [&]() { ++adaptCalls; return 23; });
        if (result != 17 || originalCalls != 1 || adaptCalls != 0) return 12;
    }
    unsigned originalCalls = 0;
    unsigned adaptCalls = 0;
    const int adapted = contract::forwardUnlessVerified(
        true, true, true,
        [&]() { ++originalCalls; return 17; },
        [&]() { ++adaptCalls; return 23; });
    if (adapted != 23 || originalCalls != 0 || adaptCalls != 1) return 13;

    if (!blob_contract::exactViewportNameBlobCaller(
            blob_contract::kViewportBlobReturnOffset) ||
        blob_contract::exactViewportNameBlobCaller(
            blob_contract::kMixedVariantBlobReturnOffset) ||
        blob_contract::exactViewportNameBlobCaller(
            blob_contract::kViewportBlobReturnOffset + 1U)) return 14;

    using GetPathOwner = native_getpath_font::Owner;
    using native_getpath::ownerForX86Returns;
    namespace GraphContract = native_getpath_graph_x86_64::contract;
    namespace FpsContract = native_getpath_fps_x86_64::contract;
    if (ownerForX86Returns(GraphContract::kCoreGetPathReturnOffset,
            FpsContract::kMakePathFromTextReturnOffset) != GetPathOwner::ViewportFps ||
        ownerForX86Returns(GraphContract::kCoreGetPathReturnOffset,
            GraphContract::kExtensionGraphProducerReturnOffset) !=
                GetPathOwner::GraphEditorEmptyState ||
        ownerForX86Returns(GraphContract::kCoreGetPathReturnOffset + 1U,
            FpsContract::kMakePathFromTextReturnOffset) != GetPathOwner::Unknown ||
        ownerForX86Returns(GraphContract::kCoreGetPathReturnOffset,
            FpsContract::kMakePathFromTextReturnOffset + 1U) != GetPathOwner::Unknown)
        return 15;
    constexpr char hansFps[] = "帧率：60.00";
    constexpr char hantFps[] = "幀率：60.00";
    constexpr char japaneseFps[] = "フレームレート: 60.00";
    if (!native_getpath_font::viewportFpsText(
            hansFps, sizeof(hansFps) - 1U, 0, GetPathOwner::ViewportFps,
            native_getpath_font::viewportFpsPrefix(cavalry_native_font::Locale::Hans)) ||
        !native_getpath_font::viewportFpsText(
            hantFps, sizeof(hantFps) - 1U, 0, GetPathOwner::ViewportFps,
            native_getpath_font::viewportFpsPrefix(cavalry_native_font::Locale::Hant)) ||
        !native_getpath_font::viewportFpsText(
            japaneseFps, sizeof(japaneseFps) - 1U, 0, GetPathOwner::ViewportFps,
            native_getpath_font::viewportFpsPrefix(cavalry_native_font::Locale::Japanese)) ||
        native_getpath_font::viewportFpsText(
            hansFps, sizeof(hansFps) - 1U, 0, GetPathOwner::ViewportFps,
            native_getpath_font::viewportFpsPrefix(cavalry_native_font::Locale::Hant)) ||
        native_getpath_font::viewportFpsText(
            hansFps, sizeof(hansFps) - 1U, 0, GetPathOwner::Unknown,
            native_getpath_font::viewportFpsPrefix(cavalry_native_font::Locale::Hans)))
        return 22;

    // -- x86 libc++短串：帧内对象必须与TextBlob输入完全同源 ------------
    FakeStack shortStack{};
    constexpr char viewportName[] = "Cavalry";
    std::array<unsigned char, blob_contract::kStringObjectBytes> nameObject{};
    nameObject[0] = static_cast<unsigned char>((sizeof(viewportName) - 1U) << 1U);
    std::memcpy(nameObject.data() + blob_contract::kShortStringDataOffset,
                viewportName, sizeof(viewportName));
    shortStack.write(FakeStack::kObject, nameObject.data(), nameObject.size());
    std::array<unsigned char, 64> copiedName{};
    std::size_t copiedSize = 0;
    auto shortRead = [&](std::uintptr_t address, std::size_t size, void *destination) {
        return shortStack.read(address, size, destination);
    };
    const auto shortTextAddress = FakeStack::kObject +
        blob_contract::kShortStringDataOffset;
    const bool shortAccepted = native_viewport_blob_x86_64::snapshot(
        blob_contract::kViewportBlobReturnOffset, 0, FakeStack::kFrame,
        {FakeStack::kLow, FakeStack::kHigh}, shortTextAddress,
        sizeof(viewportName) - 1U, shortRead, copiedName.data(),
        copiedName.size(), &copiedSize);
    if (!shortAccepted || copiedSize != sizeof(viewportName) - 1U ||
        std::memcmp(copiedName.data(), viewportName, copiedSize) != 0) return 16;

    // -- 长串、未知返回点、错误长度、编码和不稳定栈对象必须拒绝 ---------
    FakeStack longStack{};
    constexpr char longViewportName[] = "A Traditional Viewport Name";
    constexpr std::uintptr_t longTextAddress = 0x1600;
    nameObject = {};
    const std::uint64_t longNameSize = sizeof(longViewportName) - 1U;
    const std::uintptr_t longNameAddress = longTextAddress;
    nameObject[0] = 0x01;
    std::memcpy(nameObject.data() + blob_contract::kLongStringLengthOffset,
                &longNameSize, sizeof(longNameSize));
    std::memcpy(nameObject.data() + blob_contract::kLongStringDataOffset,
                &longNameAddress, sizeof(longNameAddress));
    longStack.write(FakeStack::kObject, nameObject.data(), nameObject.size());
    longStack.write(longTextAddress, longViewportName, sizeof(longViewportName));
    auto longRead = [&](std::uintptr_t address, std::size_t size, void *destination) {
        return longStack.read(address, size, destination);
    };
    const bool longAccepted = native_viewport_blob_x86_64::snapshot(
        blob_contract::kViewportBlobReturnOffset, 0, FakeStack::kFrame,
        {FakeStack::kLow, FakeStack::kHigh}, longTextAddress,
        sizeof(longViewportName) - 1U, longRead, copiedName.data(),
        copiedName.size(), &copiedSize);
    if (!longAccepted || copiedSize != sizeof(longViewportName) - 1U ||
        std::memcmp(copiedName.data(), longViewportName, copiedSize) != 0) return 17;
    if (native_viewport_blob_x86_64::snapshot(
            blob_contract::kMixedVariantBlobReturnOffset, 0, FakeStack::kFrame,
            {FakeStack::kLow, FakeStack::kHigh}, longTextAddress,
            sizeof(longViewportName) - 1U, longRead, copiedName.data(),
            copiedName.size(), &copiedSize) ||
        native_viewport_blob_x86_64::snapshot(
            blob_contract::kViewportBlobReturnOffset, 1, FakeStack::kFrame,
            {FakeStack::kLow, FakeStack::kHigh}, longTextAddress,
            sizeof(longViewportName) - 1U, longRead, copiedName.data(),
            copiedName.size(), &copiedSize) ||
        native_viewport_blob_x86_64::snapshot(
            blob_contract::kViewportBlobReturnOffset, 0, FakeStack::kFrame,
            {FakeStack::kLow, FakeStack::kHigh}, longTextAddress,
            sizeof(longViewportName), longRead, copiedName.data(),
            copiedName.size(), &copiedSize)) return 18;

    FakeStack unstableStack = longStack;
    unstableStack.objectReads = 0;
    unstableStack.mutateOnSecondObjectRead = true;
    auto unstableRead = [&](std::uintptr_t address, std::size_t size, void *destination) {
        return unstableStack.read(address, size, destination);
    };
    if (native_viewport_blob_x86_64::snapshot(
            blob_contract::kViewportBlobReturnOffset, 0, FakeStack::kFrame,
            {FakeStack::kLow, FakeStack::kHigh}, longTextAddress,
            sizeof(longViewportName) - 1U, unstableRead, copiedName.data(),
            copiedName.size(), &copiedSize)) return 19;

    // -- 否定owner只透传一次；完整owner只执行一次策略 --------------------
    originalCalls = 0;
    adaptCalls = 0;
    const int unknownOwner = contract::forwardUnlessVerified(
        true, false, longAccepted,
        [&]() { ++originalCalls; return 17; },
        [&]() { ++adaptCalls; return 23; });
    if (unknownOwner != 17 || originalCalls != 1 || adaptCalls != 0) return 20;
    originalCalls = 0;
    adaptCalls = 0;
    const int exactOwner = contract::forwardUnlessVerified(
        true, true, longAccepted,
        [&]() { ++originalCalls; return 17; },
        [&]() { ++adaptCalls; return 23; });
    if (exactOwner != 23 || originalCalls != 0 || adaptCalls != 1) return 21;
    std::puts("PASS: x86 Timeline, Viewport TextBlob and FPS contracts fail closed");
    return 0;
}
