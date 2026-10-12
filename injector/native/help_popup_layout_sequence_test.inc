/**
 * [INPUT]: 依赖同bundle生成的401行宽表、主/def说明表与PopupFixture。
 * [OUTPUT]: 比较三语getBoundingBox与addDynamic长行切短后的fresh几何。
 * [POS]: 隔离Qt回归片段；核参数/返回包装行与隐藏行恢复，不泵事件。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const Row *findLayoutRowByKey(std::string_view key)
{
    for (std::size_t index = 0;
         index < native_help_popup_metadata::kRowCount; ++index) {
        const Row &row = native_help_popup_metadata::kRows[index];
        if (row.key == key) return &row;
    }
    return nullptr;
}

const HelpDescriptionEntry *findRootHelpByName(std::string_view name)
{
    for (std::size_t index = 0;
         index < native_help_description::kApprovedRuntimeRootHelpCount;
         ++index) {
        const HelpDescriptionEntry &entry =
            native_help_description::kApprovedRuntimeRootHelp[index];
        if (entry.runtimeName == name) return &entry;
    }
    return nullptr;
}

ApiCase findRootApi(std::string_view key, std::string_view name)
{
    return {findLayoutRowByKey(key), findRootHelpByName(name)};
}

struct SequenceState {
    int popupWidth = 0;
    int popupHeight = 0;
    int bodyWidth = 0;
    int bodyHeight = 0;
    int argumentsRowWidth = 0;
    int returnsRowWidth = 0;
};

SequenceState updateLikeVendor(PopupFixture &fixture,
                               OneLocaleEnvelope &cache,
                               const ApiCase &api,
                               Locale locale,
                               const char *label)
{
    expect(api.layout && api.help, "sequence API binds approved root rows");
    if (!api.layout || !api.help) return {};

    fixture.setContent(api, toQString(helpText(*api.help, locale)));
    const bool measured = cache.measureOnce(fixture.top);
    const bool applied = native_help_popup_layout::applyUniformEnvelope(
        fixture.top, fixture.description, cache.width);

    // -- 模拟原调用：生产helper之后只激活root，再沿用vendor adjustSize。 --
    fixture.top->activate();
    fixture.root.adjustSize();

    expect(measured && cache.calls == 1,
           "sequence reuses the one locale catalog measurement");
    expect(applied, "sequence accepts the exact four-row popup");
    expect(fixture.description->text()
               == toQString(helpText(*api.help, locale)),
           "sequence preserves complete approved body text");
    expect(fixture.argumentsWidget->isHidden()
               == api.layout->argumentsText.empty()
               && fixture.returnsWidget->isHidden()
                      == api.layout->returnsText.empty(),
           "sequence restores vendor argument and return row visibility");
    expect(siblingLabelsDoNotOverlap(&fixture.root),
           "sequence leaves visible labels non-overlapping");
    expect(visibleLabelsAreNotClipped(&fixture.root, fixture.description),
           "sequence gives visible labels their natural geometry");

    const SequenceState state{
        fixture.root.width(), fixture.root.height(),
        fixture.description->width(), fixture.description->height(),
        fixture.argumentsWidget->width(), fixture.returnsWidget->width()};
    std::cout << "SEQUENCE locale=" << label
              << " api=" << api.layout->runtimeName
              << " popup=" << state.popupWidth << 'x' << state.popupHeight
              << " body=" << state.bodyWidth << 'x' << state.bodyHeight
              << " argsRow=" << state.argumentsRowWidth
              << " returnsRow=" << state.returnsRowWidth
              << " hiddenArgs=" << fixture.argumentsWidget->isHidden()
              << " hiddenReturns=" << fixture.returnsWidget->isHidden()
              << '\n';
    return state;
}

void testShortWidthAfterLongRows(const LocaleLabels &labels,
                                 OneLocaleEnvelope &cache)
{
    const ApiCase box = findRootApi(
        "api_function_metadata.json#/getBoundingBox/description",
        "getBoundingBox");
    const ApiCase children = findRootApi(
        "api_function_metadata.json#/getChildren/description", "getChildren");
    const ApiCase dynamic = findRootApi(
        "api_function_metadata.json#/addDynamic/description", "addDynamic");
    const ApiCase precomp = findRootApi(
        "api_function_metadata.json#/addPreCompOverride/description",
        "addPreCompOverride");
    const ApiCase clear = findRootApi(
        "api_function_metadata.json#/clearProject/description", "clearProject");
    expect(box.layout && box.help && children.layout && children.help
               && dynamic.layout && dynamic.help && precomp.layout
               && precomp.help && clear.layout && clear.help,
           "sequence pairs resolve by exact source key and root help owner");
    if (!box.layout || !box.help || !children.layout || !children.help
        || !dynamic.layout || !dynamic.help || !precomp.layout || !precomp.help
        || !clear.layout || !clear.help) {
        return;
    }

    expect(cache.initialized && cache.calls == 1 && cache.width > 0,
           "sequence reuses the locale catalog measurement");
    PopupFixture boxThenChildren(labels);
    const SequenceState boxState = updateLikeVendor(
        boxThenChildren, cache, box, labels.locale, labels.name);
    const SequenceState childrenAfterBox = updateLikeVendor(
        boxThenChildren, cache, children, labels.locale, labels.name);
    PopupFixture freshChildren(labels);
    const SequenceState childrenFresh = updateLikeVendor(
        freshChildren, cache, children, labels.locale, labels.name);
    expect(boxState.popupWidth > childrenFresh.popupWidth,
           "getBoundingBox supplies a longer first row than fresh getChildren");
    expect(childrenAfterBox.popupWidth == childrenFresh.popupWidth,
           "getChildren after getBoundingBox matches fresh short layout");
    expect(childrenAfterBox.argumentsRowWidth
                   == childrenFresh.argumentsRowWidth
               && childrenAfterBox.returnsRowWidth
                      == childrenFresh.returnsRowWidth,
           "getChildren wrapper rows match fresh argument and return geometry");

    PopupFixture dynamicThenPrecomp(labels);
    const SequenceState dynamicState = updateLikeVendor(
        dynamicThenPrecomp, cache, dynamic, labels.locale, labels.name);
    const SequenceState precompAfterDynamic = updateLikeVendor(
        dynamicThenPrecomp, cache, precomp, labels.locale, labels.name);
    PopupFixture freshPrecomp(labels);
    const SequenceState precompFresh = updateLikeVendor(
        freshPrecomp, cache, precomp, labels.locale, labels.name);
    expect(dynamic.layout->argumentsText.size()
               > precomp.layout->argumentsText.size(),
           "addDynamic carries a longer parameter row than precomp");
    expect(dynamicState.argumentsRowWidth > 0,
           "addDynamic displays its full parameter row before the transition");
    expect(precompAfterDynamic.popupWidth == precompFresh.popupWidth,
           "precomp after addDynamic matches fresh short layout");
    expect(precompAfterDynamic.argumentsRowWidth
               == precompFresh.argumentsRowWidth,
           "precomp argument wrapper matches fresh short-row geometry");

    PopupFixture hiddenThenVisible(labels);
    const SequenceState hidden = updateLikeVendor(
        hiddenThenVisible, cache, clear, labels.locale, labels.name);
    expect(hidden.popupWidth > 0 && hiddenThenVisible.argumentsWidget->isHidden()
               && hiddenThenVisible.returnsWidget->isHidden(),
           "empty vendor rows stay hidden during the update sequence");
    const SequenceState restored = updateLikeVendor(
        hiddenThenVisible, cache, children, labels.locale, labels.name);
    expect(restored.popupWidth == childrenFresh.popupWidth,
           "visible rows recover after hidden-row transition");
}
