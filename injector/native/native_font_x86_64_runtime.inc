/**
 * [INPUT]: 依赖实际加载的Core、Extension与Skia映像及官方x86 ABI事实表。
 * [OUTPUT]: 验证x86原函数绑定、factory与所有字体owner机器码窗。
 * [POS]: x86字体门只在本合同及独立locale合同都通过后开放。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
bool verifyX86FontAbiContract() noexcept
{
    namespace abi = native_font_x86_64_abi::contract;
    namespace graph = native_getpath_graph_x86_64::contract;
    namespace fps = native_getpath_fps_x86_64::contract;
    namespace cache = native_getpath_cache_x86_64::contract;
    namespace viewport_blob = native_viewport_blob_x86_64::contract;
    namespace timeline = timeline_owner_observer::x86_64_contract;
    LoadedImage core{};
    LoadedImage extension{};
    LoadedImage skia{};
    std::array<char, PATH_MAX> corePath{};
    std::array<char, PATH_MAX> extensionPath{};
    std::array<char, PATH_MAX> skiaPath{};
    if (!appFrameworkPath("libCore.dylib", corePath.data(), corePath.size()) ||
        !appFrameworkPath("libExtensionLayer.dylib", extensionPath.data(),
                          extensionPath.size()) ||
        !appFrameworkPath("libskia.dylib", skiaPath.data(), skiaPath.size()) ||
        !findLoadedImageExactPath(corePath.data(), &core) ||
        !findLoadedImageExactPath(extensionPath.data(), &extension) ||
        !findLoadedImageExactPath(skiaPath.data(), &skia) ||
        !imageUuidEquals(core, abi::kCoreUuid) ||
        !imageUuidEquals(extension, abi::kExtensionUuid) ||
        !imageUuidEquals(skia, abi::kSkiaUuid)) return false;

    const bool verified = symbolAt(core, abi::kMakeScalableFontSymbol,
                    abi::kMakeScalableFontOffset) &&
        matchesCode(core, abi::kMakeScalableFontOffset,
                    abi::kMakeScalableFontBytes) &&
        symbolAt(core, graph::kMakePathFromTextSymbol,
                 graph::kMakePathFromTextExportOffset) &&
        matchesCode(core, graph::kCoreGetPathCallOffset - 19U,
                    graph::kCoreGetPathCallWindowBytes) &&
        symbolAt(skia, abi::kMakeTypefaceSymbol, abi::kMakeTypefaceOffset) &&
        matchesCode(skia, abi::kMakeTypefaceOffset, abi::kMakeTypefaceBytes) &&
        symbolAt(skia, abi::kGetCTFontSymbol, abi::kGetCTFontOffset) &&
        matchesCode(skia, abi::kGetCTFontOffset, abi::kGetCTFontBytes) &&
        symbolAt(skia, abi::kGlyphSymbol, abi::kGlyphOffset) &&
        matchesCode(skia, abi::kGlyphOffset, abi::kGlyphBytes) &&
        symbolAt(skia, abi::kGetPathSymbol, abi::kGetPathOffset) &&
        matchesCode(skia, abi::kGetPathOffset, abi::kGetPathBytes) &&
        symbolAt(skia, abi::kSetSizeSymbol, abi::kSetSizeOffset) &&
        matchesCode(skia, abi::kSetSizeOffset, abi::kSetSizeBytes) &&
        symbolAt(skia, timeline::kMeasureSymbol, timeline::kMeasureSymbolOffset) &&
        symbolAt(skia, timeline::kDrawSymbol, timeline::kDrawSymbolOffset) &&
        symbolAt(extension, timeline::kPaintNodeTextSymbol,
                 timeline::kPaintNodeTextOffset) &&
        symbolAt(extension, timeline::kTimelineClosureSymbol,
                 timeline::kClosureEntryOffset) &&
        matchesCode(extension, graph::kExtensionGraphProducerCallOffset - 11U,
                    graph::kExtensionGraphProducerCallWindowBytes) &&
        matchesCode(extension, fps::kViewportFpsProducerWindowOffset,
                    fps::kViewportFpsProducerWindowBytes) &&
        symbolAt(extension, cache::kGetOrCreateTextPathSymbol,
                 cache::kGetOrCreateTextPathFunctionOffset) &&
        symbolAt(extension, cache::kToolHelpProducerSymbol,
                 cache::kToolHelpProducerFunctionOffset) &&
        symbolAt(extension, cache::kViewportStatusProducerSymbol,
                 cache::kViewportQualityProducerFunctionOffset) &&
        matchesCode(extension, cache::kCachedGetPathWindowOffset,
                    cache::kCachedGetPathWindowBytes) &&
        matchesCode(extension, cache::kToolHelpProducerAWindowOffset,
                    cache::kToolHelpProducerAWindowBytes) &&
        matchesCode(extension, cache::kToolHelpProducerBWindowOffset,
                    cache::kToolHelpProducerBWindowBytes) &&
        matchesCode(extension, cache::kViewportQualityProducerWindowOffset,
                    cache::kViewportQualityProducerWindowBytes) &&
        symbolAt(extension, viewport_blob::kViewportNameLambdaSymbol,
                 viewport_blob::kViewportNameLambdaOffset) &&
        symbolAt(core, viewport_blob::kGetNiceNameSymbol,
                 viewport_blob::kGetNiceNameExportOffset) &&
        matchesCode(extension, viewport_blob::kViewportNameLambdaOffset,
                    viewport_blob::kViewportNameLambdaEntryBytes) &&
        matchesCode(extension, viewport_blob::kGetNiceNameCallOffset - 10U,
                    viewport_blob::kGetNiceNameCallWindowBytes) &&
        matchesCode(extension, viewport_blob::kNameDecodeOffset,
                    viewport_blob::kNameDecodeWindowBytes) &&
        matchesCode(extension, viewport_blob::kViewportBlobCallOffset - 20U,
                    viewport_blob::kViewportBlobCallWindowBytes) &&
        matchesCode(extension, viewport_blob::kMixedVariantBlobCallOffset - 21U,
                    viewport_blob::kMixedVariantBlobCallWindowBytes) &&
        symbolAt(skia, viewport_blob::kMakeFromTextSymbol,
                 viewport_blob::kMakeFromTextOffset) &&
        matchesCode(skia, viewport_blob::kMakeFromTextOffset,
                    viewport_blob::kMakeFromTextFunctionBytes) &&
        matchesCode(extension, abi::kMeasureCaptureLoadOffset,
                    abi::kMeasureCaptureLoadBytes) &&
        matchesCode(extension, abi::kMeasureStringTagReadOffset,
                    abi::kMeasureStringBranchBytes) &&
        matchesCode(extension, abi::kMeasureCallOffset, abi::kMeasureCallBytes) &&
        matchesCode(extension, abi::kDrawStringDecodeOffset,
                    abi::kDrawStringDecodeBytes) &&
        matchesCode(extension, abi::kDrawCallOffset, abi::kDrawCallBytes);
    if (!verified) return false;

    const auto skiaBase = reinterpret_cast<std::uintptr_t>(imageAddress(skia, 0));
    const native_font_x86_64_abi::contract::OriginalFunctionAddresses originals{
        reinterpret_cast<std::uintptr_t>(gOriginalGetPath.load(std::memory_order_acquire)),
        reinterpret_cast<std::uintptr_t>(gOriginalMeasure.load(std::memory_order_acquire)),
        reinterpret_cast<std::uintptr_t>(gOriginalDraw.load(std::memory_order_acquire)),
        reinterpret_cast<std::uintptr_t>(gOriginalBlob.load(std::memory_order_acquire))};
    if (!abi::originalFunctionsMatch(
            originals, skiaBase, abi::kGetPathOffset,
            timeline::kMeasureSymbolOffset, timeline::kDrawSymbolOffset,
            viewport_blob::kMakeFromTextOffset)) return false;

    const native_font_x86_64_abi::contract::FactoryAddresses addresses{
        reinterpret_cast<std::uintptr_t>(imageAddress(skia, abi::kMakeTypefaceOffset)),
        reinterpret_cast<std::uintptr_t>(imageAddress(skia, abi::kGetCTFontOffset)),
        reinterpret_cast<std::uintptr_t>(imageAddress(core, abi::kMakeScalableFontOffset)),
        reinterpret_cast<std::uintptr_t>(imageAddress(skia, abi::kGlyphOffset)),
        reinterpret_cast<std::uintptr_t>(imageAddress(skia, abi::kSetSizeOffset))};
    const auto coreBase = reinterpret_cast<std::uintptr_t>(imageAddress(core, 0));
    if (!native_font_x86_64_abi::contract::factoryAddressesMatch(
            addresses, skiaBase, coreBase)) return false;

    gCoreImage = core;
    gExtensionImage = extension;
    gSkiaImage = skia;
    gMakeTypeface = reinterpret_cast<MakeTypeface>(addresses.makeTypeface);
    gGetCTFont = reinterpret_cast<GetCTFont>(addresses.getCTFont);
    gMakeFont = reinterpret_cast<MakeFont>(addresses.makeScalableFont);
    gGlyph = reinterpret_cast<GlyphLookup>(addresses.glyph);
    gSetSize = reinterpret_cast<SetSize>(addresses.setSize);
    return gMakeTypeface != nullptr && gGetCTFont != nullptr && gMakeFont != nullptr &&
        gGlyph != nullptr && gSetSize != nullptr;
}
