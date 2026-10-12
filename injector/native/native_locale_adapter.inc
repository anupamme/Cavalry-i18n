/**
 * [INPUT]: 依赖two-level activeLocale导入、同 bundle 路径与Extension GOT证据。
 * [OUTPUT]: 提供原getter一次转发、精确映像查找及caller准入门。
 * [POS]: native getter适配层；未知target只透传，不发布字体locale。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
// -- 精确映像查找与two-level原函数绑定 ----------------------------------
bool imagePathMatches(const char *path, const char *expected) noexcept;
bool readSelf(const void *source, std::size_t size, void *destination) noexcept;

bool findLoadedImageExactPath(const char *expectedPath, LoadedImage *output) noexcept
{
    if (expectedPath == nullptr || output == nullptr) return false;
    LoadedImage match{};
    bool found = false;
    for (std::uint32_t index = 0; index < _dyld_image_count(); ++index) {
        const char *path = _dyld_get_image_name(index);
        if (!imagePathMatches(path, expectedPath)) continue;
        if (found || !cavalry_i18n::macos_abi::loadImageMetadata(
                _dyld_get_image_header(index),
                _dyld_get_image_vmaddr_slide(index), path, &match)) return false;
        found = true;
    }
    if (!found) return false;
    *output = match;
    return true;
}

NativeLocaleGetter resolveNativeLocaleOriginal() noexcept
{
    NativeLocaleGetter current = gOriginalNativeLocale.load(std::memory_order_acquire);
    if (current != nullptr) return current;
    const auto original = reinterpret_cast<NativeLocaleGetter>(&activeLocaleTarget);
    if (original == nullptr) return nullptr;
    NativeLocaleGetter expected = nullptr;
    if (!gOriginalNativeLocale.compare_exchange_strong(
            expected, original, std::memory_order_release, std::memory_order_relaxed)) {
        return expected;
    }
    return original;
}

bool exactNativeLocaleRuntimeBinding(
    const LoadedImage &api, const LoadedImage &extension) noexcept
{
    const NativeLocaleGetter original = resolveNativeLocaleOriginal();
    if (original == nullptr ||
        reinterpret_cast<const void *>(original) != imageAddress(
            api, native_locale_contract::kActiveLocaleEntryOffset)) return false;
    const void *extensionTarget = nullptr;
    if (!readSelf(imageAddress(
            extension, native_locale_contract::kActiveLocaleGotOffset),
            sizeof(extensionTarget), &extensionTarget)) return false;
    return native_locale_contract::extensionGotTargetsInterposer(
        extensionTarget, reinterpret_cast<const void *>(nativeActiveLocaleInterpose));
}

bool policyLocaleFor(native_locale::Locale locale, Locale *output) noexcept
{
    if (output == nullptr) return false;
    switch (locale) {
        case native_locale::Locale::Hans: *output = Locale::Hans; return true;
        case native_locale::Locale::Hant: *output = Locale::Hant; return true;
        case native_locale::Locale::Japanese: *output = Locale::Japanese; return true;
        case native_locale::Locale::English:
        case native_locale::Locale::Unknown:
        case native_locale::Locale::Unset: return false;
    }
    return false;
}

bool exactNativeLocaleOwner(std::uintptr_t callerPc) noexcept
{
    if (!gNativeLocaleContractReady.load(std::memory_order_acquire) ||
        gApiImage.header == nullptr || gExtensionImage.header == nullptr) return false;
    return callerPc == reinterpret_cast<std::uintptr_t>(imageAddress(
        gExtensionImage, native_locale_contract::kActiveLocaleReturnOffset));
}
