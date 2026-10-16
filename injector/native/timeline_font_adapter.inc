/**
 * [INPUT]: 依赖原完整 owner 与两个 Timeline return PC。
 * [OUTPUT]: 为共享字体核心提供已验证的全名称快照。
 * [POS]: 保留既有 pointer、length、closure 门。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
template <typename Original>
auto dispatchFont(const void *originalFont, const void *text, std::size_t textLength,
                  int encoding, const void *closure, std::uintptr_t callerPc,
                  Caller caller, Original original) noexcept
    -> decltype(original(originalFont))
{
#if defined(__x86_64__)
    const bool admitted = !gInsideRuntime && gAdmitted.load(std::memory_order_acquire);
    const std::uintptr_t callerOffset = caller == Caller::Measure
        ? timeline_owner_observer::x86_64_contract::kMeasureReturnOffset
        : timeline_owner_observer::x86_64_contract::kDrawReturnOffset;
    const bool exactCaller = admitted && callerPc == reinterpret_cast<std::uintptr_t>(
        imageAddress(gExtensionImage, callerOffset));
    TextSnapshot textSnapshot{};
    policy::OwnerProof ownerProof{};
    const bool completeOwner = exactCaller && snapshotOwner(
        text, textLength, closure, callerPc, caller, &textSnapshot, &ownerProof);
    return native_font_x86_64_abi::contract::forwardUnlessVerified(
        admitted, exactCaller, completeOwner,
        [&]() { return original(originalFont); },
        [&]() {
            RuntimeScope runtimeScope;
            return dispatchVerifiedText(originalFont, textSnapshot, encoding,
                caller, original, [](DecisionReason) noexcept {});
        });
#else
    if (gInsideRuntime || !gAdmitted.load(std::memory_order_acquire))
        return original(originalFont);
    const std::uintptr_t callerOffset = caller == Caller::Measure
        ? observer_contract::kMeasureReturnOffset : observer_contract::kDrawReturnOffset;
    if (callerPc != reinterpret_cast<std::uintptr_t>(imageAddress(gExtensionImage, callerOffset)))
        return original(originalFont);
    RuntimeScope runtimeScope;
    TextSnapshot textSnapshot{};
    policy::OwnerProof ownerProof{};
    if (!snapshotOwner(text, textLength, closure, callerPc, caller,
                       &textSnapshot, &ownerProof)) {
        return original(originalFont);
    }
    return dispatchVerifiedText(originalFont,textSnapshot,encoding,caller,original,
        [](DecisionReason) noexcept {});
#endif
}
