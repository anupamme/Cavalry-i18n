/**
 * [INPUT]: 依赖GetPath owner、225项固定lane、Graph专表与唯一 native gLocale。
 * [OUTPUT]: 为固定lane、Graph空状态与FPS格式串调用Caller::Draw共享字形核心。
 * [POS]: 未知ABI/owner/locale/prefix或空参数只透传一次，不建候选字体。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const native_getpath_font::TextEntry *getPathEntries(
    native_locale::Locale locale) noexcept
{
    switch (locale) {
        case native_locale::Locale::Hans: return native_getpath_font::kZhHansEntries;
        case native_locale::Locale::Hant: return native_getpath_font::kZhHantEntries;
        case native_locale::Locale::Japanese: return native_getpath_font::kJaJpEntries;
        case native_locale::Locale::Unset:
        case native_locale::Locale::English:
        case native_locale::Locale::Unknown: return nullptr;
    }
    return nullptr;
}

extern "C" void getPathFontDispatch(
    const void *text, std::size_t size, int encoding, float x, float y,
    const void *font, void *path, std::uintptr_t callerPc,
    std::uintptr_t callerFrame)
{
    native_getpath_font::Original original =
        gOriginalGetPath.load(std::memory_order_acquire);
    if (original == nullptr) original = &getPathTarget;
    const auto forward = [&]() {
        original(text, size, encoding, x, y, font, path);
    };
    if (gInsideRuntime || !gAdmitted.load(std::memory_order_acquire) ||
        text == nullptr || size == 0 || size > native_getpath_font::kMaxTextBytes ||
        encoding != 0 || font == nullptr || path == nullptr) {
        forward();
        return;
    }

    const auto coreBase = reinterpret_cast<std::uintptr_t>(imageAddress(gCoreImage, 0));
    const auto extensionBase = reinterpret_cast<std::uintptr_t>(
        imageAddress(gExtensionImage, 0));
#if defined(__x86_64__)
    constexpr std::uintptr_t expectedCoreReturn =
        native_getpath_graph_x86_64::contract::kCoreGetPathReturnOffset;
    if (callerPc < coreBase || callerPc - coreBase != expectedCoreReturn) {
#else
    if (callerPc < coreBase ||
        callerPc - coreBase != native_getpath_abi::contract::kCoreOwnerReturnOffset) {
#endif
        forward();
        return;
    }
    const auto stack = currentThreadStack();
    const auto read = [](std::uintptr_t address, std::size_t length,
                         void *destination) noexcept {
        return readSelf(reinterpret_cast<const void *>(address), length, destination);
    };
    const native_getpath_font::Owner owner = native_getpath::owner(
        coreBase, extensionBase, callerPc, callerFrame, stack, read);
    if (native_getpath::forwardUnknownOwner(owner, forward)) return;

    const native_locale::Locale locale = gLocale.value();
    TextSnapshot snapshot{};
    if (!readSelf(text, size, snapshot.bytes.data())) {
        forward();
        return;
    }
    snapshot.size = size;
    if (owner == native_getpath_font::Owner::GraphEditorEmptyState) {
        const native_getpath_font::TextEntry *entry =
            native_getpath_font::graphEditorEmptyTextEntry(locale);
        if (native_getpath_font::forwardUnapprovedGraphEditorEmptyText(
                snapshot.bytes.data(), snapshot.size, encoding, owner, entry,
                forward)) return;
    } else {
        const native_getpath_font::TextEntry *entries = getPathEntries(locale);
        if (entries == nullptr) {
            forward();
            return;
        }
        if (owner == native_getpath_font::Owner::ViewportFps) {
            if (!native_getpath_font::viewportFpsText(
                    snapshot.bytes.data(), snapshot.size, encoding, owner,
                    native_getpath_font::viewportFpsPrefix(locale))) {
                forward();
                return;
            }
        } else if (native_getpath_font::exactText(
                   snapshot.bytes.data(), snapshot.size, encoding, owner, entries,
                   native_getpath_font::kEntriesPerLocale) < 0) {
            forward();
            return;
        }
    }

    RuntimeScope scope;
    dispatchVerifiedText(font, snapshot, encoding, Caller::Draw,
        [&](const void *displayFont) {
            original(text, size, encoding, x, y, displayFont, path);
        },
        [](DecisionReason) noexcept {});
}
