/**
 * [INPUT]: 依赖适配器已准入的文字快照、原字体与getter语言快照。
 * [OUTPUT]: 先验CoreText字体，再按locale固定PostScript名做全串覆盖选择。
 * [POS]: Timeline、Viewport和GetPath共用回退；非覆盖失败不重试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
using viewport_font::selectVerifiedTextCandidates;
template<class Original,class Report>
auto dispatchVerifiedText(const void *originalFont,const TextSnapshot &textSnapshot,
 int encoding,Caller caller,Original original,Report report)
 noexcept(noexcept(original(originalFont)) && noexcept(report(DecisionReason{})))
 -> decltype(original(originalFont)) {
    FontSnapshot input{};
    if (!readFontSnapshot(originalFont, &input)) {
        report( DecisionReason::FontReadUnavailable);
        return original(originalFont);
    }
    Locale policyLocale = Locale::Unset;
    (void)policyLocaleFor(gLocale.value(), &policyLocale);
    const auto getCTFont = reinterpret_cast<GetCTFont>(
        imageAddress(gSkiaImage, e4_contract::kGetCTFontOffset));
    SlotLock slotLock;
    FontSlot *selectedSlot = nullptr;
    constexpr std::size_t candidateCount = 1 + viewport_font::kNamedFallbackPostScriptNameCount;
    std::array<FontSlot *, candidateCount> candidateSlots{};
    bool slotLockAcquired = false;
    DecisionReason failure = DecisionReason::CoverageRejected;
    TextDisposition disposition = TextDisposition::Invalid;
    std::size_t selectedIndex = candidateCount;
    const void *selectedTypeface = selectVerifiedTextCandidates(
        input.typeface, textSnapshot.bytes.data(), textSnapshot.size,
        encoding, gGlyph, candidateCount, [&](std::size_t candidateIndex) -> const void * {
            if (policyLocale != Locale::Hans && policyLocale != Locale::Hant &&
                policyLocale != Locale::Japanese) {
                failure = DecisionReason::LocaleUnavailable;
                return nullptr;
            }
            if (!policy::validFontSize(input.size)) {
                failure = DecisionReason::SizeRejected;
                return nullptr;
            }
            CTFontRef resolvedRaw = nullptr;
            if (candidateIndex == 0) {
                CTFontRef baseFont = getCTFont(input.typeface); // SkTypeface持有的borrowed引用。
                CFStringOwner ownerString(makeOwnerString(textSnapshot));
                CFStringOwner language(makeLanguageString(policyLocale));
                if (baseFont == nullptr || ownerString.get() == nullptr || language.get() == nullptr) {
                    failure = DecisionReason::SystemFontUnavailable;
                    return nullptr;
                }
                const auto range = timeline_system_fallback_mixed_span::coreTextRangeForFirstMissingScalar(
                    ownerString.get(), input.typeface, textSnapshot.bytes.data(), textSnapshot.size, gGlyph);
                if (!range.valid) { failure = DecisionReason::InvalidText; return nullptr; }
                resolvedRaw = CTFontCreateForStringWithLanguage(
                    baseFont, ownerString.get(), range.value, language.get());
            } else {
                const char *postScriptName = viewport_font::namedFallbackPostScriptName(
                    policyLocale, candidateIndex - 1);
                CFStringOwner fontName(postScriptName == nullptr ? nullptr : CFStringCreateWithCString(
                    kCFAllocatorDefault, postScriptName, kCFStringEncodingUTF8));
                if (fontName.get() == nullptr) {
                    failure = DecisionReason::SystemFontUnavailable;
                    return nullptr;
                }
                resolvedRaw = CTFontCreateWithName(fontName.get(), input.size, nullptr);
            }
            CTFontOwner resolvedFont(resolvedRaw);
            if (resolvedFont.get() == nullptr) {
                failure = DecisionReason::SystemFontUnavailable;
                return nullptr;
            }
            FontKey key{};
            if (!makeKeyForFont(resolvedFont.get(), policyLocale, caller, &key)) {
                failure = DecisionReason::SystemFontUnavailable;
                return nullptr;
            }
            if (!slotLockAcquired) {
                if (!slotLock.acquire()) {
                    failure = DecisionReason::CacheFull;
                    return nullptr;
                }
                slotLockAcquired = true;
            }
            DecisionReason slotFailure = DecisionReason::FactoryFailed;
            FontSlot *candidateSlot = findOrCreateSlot(key, resolvedFont.get(), input, &slotFailure);
            if (candidateSlot == nullptr || !candidateSlot->ready ||
                candidateSlot->font == nullptr || candidateSlot->typeface == nullptr) {
                failure = slotFailure;
                return nullptr;
            }
            if (!policy::sameFontStyle(candidateSlot->font->storage.data(), input.font.storage.data())) {
                failure = DecisionReason::StyleMismatch;
                return nullptr;
            }
            if (!policy::resizeAndValidate(candidateSlot->font->storage.data(),
                    input.font.storage.data(), input.size, gSetSize)) {
                failure = DecisionReason::SizeRejected;
                return nullptr;
            }
            candidateSlots[candidateIndex] = candidateSlot;
            return candidateSlot->typeface;
        }, &disposition, &selectedIndex);
    if (selectedIndex < candidateSlots.size()) selectedSlot = candidateSlots[selectedIndex];
    if (disposition == TextDisposition::Ascii) {
        slotLock.unlock();
        report( DecisionReason::AsciiOriginal);
        return original(originalFont);
    }
    if (disposition == TextDisposition::OriginalCovers) {
        slotLock.unlock();
        report( DecisionReason::OriginalCovers);
        return original(originalFont);
    }
    if (disposition != TextDisposition::NeedsSystemFallback) {
        slotLock.unlock();
        report( DecisionReason::InvalidText);
        return original(originalFont);
    }
    if (selectedSlot != nullptr && selectedTypeface == selectedSlot->typeface &&
        selectedSlot->font != nullptr) {
        report( DecisionReason::FallbackApplied);
        // 锁在原同步measure/draw返回后才解；同线程递归入口由RuntimeScope原样透传。
        return original(selectedSlot->font);
    }
    slotLock.unlock();
    report( failure);
    return original(originalFont);
}
