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
}
