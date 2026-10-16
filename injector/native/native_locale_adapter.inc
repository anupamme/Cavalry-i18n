/**
 * [INPUT]: 依赖two-level activeLocale导入、同bundle映像、x86 caller窗与GOT。
 * [OUTPUT]: 提供getter单次转发、locale快照和分架构owner门。
 * [POS]: locale门与字体门分离；未知caller透传，不能单独启用字体lane。
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
#if defined(__x86_64__)
    if (original == nullptr ||
        reinterpret_cast<const void *>(original) != imageAddress(
            api, native_locale_x86::kGetterEntryOffset)) return false;
    const void *extensionTarget = nullptr;
    return readSelf(imageAddress(extension, native_locale_x86::kGotOffset),
                    sizeof(extensionTarget), &extensionTarget) &&
        extensionTarget == reinterpret_cast<const void *>(nativeActiveLocaleInterpose);
#else
    if (original == nullptr ||
        reinterpret_cast<const void *>(original) != imageAddress(
            api, native_locale_contract::kActiveLocaleEntryOffset)) return false;
    const void *extensionTarget = nullptr;
    if (!readSelf(imageAddress(
            extension, native_locale_contract::kActiveLocaleGotOffset),
            sizeof(extensionTarget), &extensionTarget)) return false;
    return native_locale_contract::extensionGotTargetsInterposer(
        extensionTarget, reinterpret_cast<const void *>(nativeActiveLocaleInterpose));
#endif
}

#if defined(__x86_64__)
bool verifyNativeLocaleRuntimeContract() noexcept
{
    std::array<char, PATH_MAX> corePath{};
    std::array<char, PATH_MAX> extensionPath{};
    std::array<char, PATH_MAX> apiPath{};
    LoadedImage core{};
    LoadedImage extension{};
    LoadedImage api{};
    if (!appFrameworkPath("libCore.dylib", corePath.data(), corePath.size()) ||
        !appFrameworkPath("libExtensionLayer.dylib", extensionPath.data(),
                          extensionPath.size()) ||
        !appFrameworkPath("libApi.dylib", apiPath.data(), apiPath.size()) ||
        !findLoadedImageExactPath(corePath.data(), &core) ||
        !findLoadedImageExactPath(extensionPath.data(), &extension) ||
        !findLoadedImageExactPath(apiPath.data(), &api) ||
        !imageUuidEquals(core, native_candidate_arch::expectedUuid(
            native_candidate_arch::ImageRole::Core,
            native_candidate_arch::Architecture::X86_64)) ||
        !imageUuidEquals(extension, native_candidate_arch::expectedUuid(
            native_candidate_arch::ImageRole::Extension,
            native_candidate_arch::Architecture::X86_64)) ||
        !imageUuidEquals(api, native_candidate_arch::expectedUuid(
            native_candidate_arch::ImageRole::Api,
            native_candidate_arch::Architecture::X86_64)) ||
        !symbolAt(api, native_locale_x86::kGetterSymbol,
                  native_locale_x86::kGetterEntryOffset) ||
        !symbolAt(extension, native_locale_x86::kRegisterNodesSetupSymbol,
                  native_locale_x86::kRegisterNodesSetupEntryOffset) ||
        !matchesCode(api, native_locale_x86::kGetterEntryOffset,
                     native_locale_x86::kGetterEntryBytes) ||
        !matchesCode(api, native_locale_x86::kGetterSretSaveOffset,
                     native_locale_x86::kGetterSretSaveBytes) ||
        !matchesCode(api, native_locale_x86::kGetterReturnSretOffset,
                     native_locale_x86::kGetterReturnSretBytes) ||
        !matchesCode(extension, native_locale_x86::kOwnerSretArgumentOffset,
                     native_locale_x86::kOwnerSretArgumentBytes) ||
        !matchesCode(extension, native_locale_x86::kOwnerApiArgumentOffset,
                     native_locale_x86::kOwnerApiArgumentBytes) ||
        !matchesCode(extension, native_locale_x86::kRegisterNodesSetupCallOffset,
                     native_locale_x86::kOwnerCallBytes) ||
        !matchesCode(extension, native_locale_x86::kOwnerReturnUseOffset,
                     native_locale_x86::kOwnerReturnUseBytes) ||
        !matchesCode(extension, native_locale_x86::kOwnerSetLocaleCallOffset,
                     native_locale_x86::kOwnerSetLocaleCallBytes) ||
        !matchesCode(extension, native_locale_x86::kStubOffset,
                     native_locale_x86::kActiveLocaleStubBytes) ||
        !exactNativeLocaleRuntimeBinding(api, extension)) return false;

    gCoreImage = core;
    gExtensionImage = extension;
    gApiImage = api;
    return true;
}
#endif

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
#if defined(__x86_64__)
    return callerPc == reinterpret_cast<std::uintptr_t>(imageAddress(
        gExtensionImage,
        native_locale_x86::kRegisterNodesSetupReturnOffset));
#else
    return callerPc == reinterpret_cast<std::uintptr_t>(imageAddress(
        gExtensionImage, native_locale_contract::kActiveLocaleReturnOffset));
#endif
}
