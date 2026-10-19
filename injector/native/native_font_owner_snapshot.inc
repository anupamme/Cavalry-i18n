/**
 * [INPUT]: 依赖已通过机器码门的Timeline closure和本进程受限读取器。
 * [OUTPUT]: 提供短/长字符串完整跨度及精确caller快照。
 * [POS]: Timeline字体分发的owner读边界；不访问未知布局或跨架构偏移。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
bool readOwnerSpan(const void *closure, OwnerSpan *output) noexcept
{
#if defined(__x86_64__)
    const void *captureAddress = nullptr;
#if defined(__x86_64__)
    constexpr std::uintptr_t captureOffset =
        native_font_x86_64_abi::contract::kTimelineCapturePointerOffset;
    constexpr std::uintptr_t stringOffset =
        native_font_x86_64_abi::contract::kTimelineNodeDataStringOffset;
    constexpr std::size_t stringObjectBytes =
        native_font_x86_64_abi::contract::kTimelineStringObjectBytes;
#else
    constexpr std::uintptr_t captureOffset = observer_contract::kNodeDataCaptureOffset;
    constexpr std::uintptr_t stringOffset = observer_contract::kStringFieldOffset;
    constexpr std::size_t stringObjectBytes = observer_contract::kStringObjectBytes;
#endif
    if (output == nullptr || !addOffset(closure, captureOffset, &captureAddress)) return false;
    std::uintptr_t nodeData = 0;
    if (!readSelf(captureAddress, sizeof(nodeData), &nodeData) || nodeData == 0) return false;
    const void *stringAddress = nullptr;
    if (!addOffset(reinterpret_cast<const void *>(nodeData), stringOffset, &stringAddress)) return false;
    unsigned char object[stringObjectBytes]{};
    if (!readSelf(stringAddress, sizeof(object), object)) return false;
    OwnerSpan candidate{};
#if defined(__x86_64__)
    native_font_x86_64_abi::contract::TimelineStringView view{};
    if (!native_font_x86_64_abi::contract::decodeTimelineString(
            object, reinterpret_cast<std::uintptr_t>(stringAddress),
            cavalry_i18n::mac_timeline::kMaxTextBytes, &view)) return false;
    candidate.data = reinterpret_cast<const unsigned char *>(view.dataAddress);
    candidate.size = view.size;
    if (view.longForm) {
        if (view.dataAddress > std::numeric_limits<std::uintptr_t>::max() - view.size) return false;
        unsigned char terminator = 1;
        if (!readSelf(reinterpret_cast<const void *>(view.dataAddress + view.size),
                      sizeof(terminator), &terminator) || terminator != 0) return false;
    }
#else
    const unsigned char tag = object[observer_contract::kStringTagOffset];
    if ((tag & 0x80U) != 0) {
        std::uintptr_t dataAddress = 0;
        std::uint64_t fullSize = 0;
        std::memcpy(&dataAddress, object, sizeof(dataAddress));
        std::memcpy(&fullSize, object + sizeof(dataAddress), sizeof(fullSize));
        if (dataAddress == 0 || fullSize > std::numeric_limits<std::size_t>::max()) return false;
        candidate.data = reinterpret_cast<const unsigned char *>(dataAddress);
        candidate.size = static_cast<std::size_t>(fullSize);
    } else {
        if (tag > observer_contract::kShortStringCapacity || object[tag] != 0) return false;
        candidate.data = reinterpret_cast<const unsigned char *>(stringAddress);
        candidate.size = tag;
    }
#endif
    if (candidate.size == 0 || candidate.size > cavalry_i18n::mac_timeline::kMaxTextBytes) return false;
    *output = candidate;
    return true;

#else
    const void *captureAddress = nullptr;
    if (output == nullptr ||
        !addOffset(closure, observer_contract::kNodeDataCaptureOffset, &captureAddress)) return false;
    std::uintptr_t nodeData = 0;
    if (!readSelf(captureAddress, sizeof(nodeData), &nodeData) || nodeData == 0) return false;
    const void *stringAddress = nullptr;
    if (!addOffset(reinterpret_cast<const void *>(nodeData),
                   observer_contract::kStringFieldOffset, &stringAddress)) return false;
    unsigned char object[observer_contract::kStringObjectBytes]{};
    if (!readSelf(stringAddress, sizeof(object), object)) return false;
    const unsigned char tag = object[observer_contract::kStringTagOffset];
    OwnerSpan candidate{};
    if ((tag & 0x80U) != 0) {
        std::uintptr_t dataAddress = 0;
        std::uint64_t fullSize = 0;
        std::memcpy(&dataAddress, object, sizeof(dataAddress));
        std::memcpy(&fullSize, object + sizeof(dataAddress), sizeof(fullSize));
        if (dataAddress == 0 || fullSize > std::numeric_limits<std::size_t>::max()) return false;
        candidate.data = reinterpret_cast<const unsigned char *>(dataAddress);
        candidate.size = static_cast<std::size_t>(fullSize);
    } else {
        if (tag > observer_contract::kShortStringCapacity || object[tag] != 0) return false;
        candidate.data = reinterpret_cast<const unsigned char *>(stringAddress);
        candidate.size = tag;
    }
    if (candidate.size == 0 ||
        candidate.size > cavalry_i18n::mac_timeline::kMaxTextBytes) return false;
    *output = candidate;
    return true;

#endif
}
bool snapshotOwner(const void *text, std::size_t length, const void *closure,
                   std::uintptr_t callerPc, Caller caller,
                   TextSnapshot *snapshot, policy::OwnerProof *proof) noexcept
{
#if defined(__x86_64__)
    const std::uintptr_t expectedOffset = caller == Caller::Measure
        ? timeline_owner_observer::x86_64_contract::kMeasureReturnOffset
        : timeline_owner_observer::x86_64_contract::kDrawReturnOffset;
#else
    const std::uintptr_t expectedOffset = caller == Caller::Measure
        ? observer_contract::kMeasureReturnOffset : observer_contract::kDrawReturnOffset;
#endif
    if (snapshot == nullptr || proof == nullptr) return false;
    *proof = {};
    if (callerPc != reinterpret_cast<std::uintptr_t>(
            imageAddress(gExtensionImage, expectedOffset))) return false;
    proof->exactCaller = true;
    OwnerSpan owner{};
    proof->readable = readOwnerSpan(closure, &owner);
    if (!proof->readable) return false;
    proof->pointerMatches = text == owner.data;
    proof->lengthMatches = length == owner.size;
    if (!proof->pointerMatches || !proof->lengthMatches ||
        !readSelf(owner.data, owner.size, snapshot->bytes.data())) return false;
    snapshot->size = owner.size;
    proof->completeSpan = true;
    return true;
}
