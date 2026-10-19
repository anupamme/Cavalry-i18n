/**
 * [INPUT]: 依赖graphEditor.emptyState批准译文与GetPath owner类型。
 * [OUTPUT]: 提供Hans、Hant、JA唯一空状态文本项。
 * [POS]: 独立于225项lane的GraphEditor精确表；未知locale返回空。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
namespace native_getpath_font {
static constexpr TextEntry kZhHansGraphEditorEmptyEntry[] = {
    {Owner::GraphEditorEmptyState, "选择图层或属性以查看其关键帧"},
};
static constexpr TextEntry kZhHantGraphEditorEmptyEntry[] = {
    {Owner::GraphEditorEmptyState, "選取圖層或屬性以檢視其關鍵幀"},
};
static constexpr TextEntry kJaJpGraphEditorEmptyEntry[] = {
    {Owner::GraphEditorEmptyState,
     "レイヤーまたは属性を選択するとキーフレームが表示されます"},
};

inline const TextEntry *graphEditorEmptyTextEntry(
    cavalry_native_font::Locale locale) noexcept
{
    switch (locale) {
        case cavalry_native_font::Locale::Hans: return kZhHansGraphEditorEmptyEntry;
        case cavalry_native_font::Locale::Hant: return kZhHantGraphEditorEmptyEntry;
        case cavalry_native_font::Locale::Japanese: return kJaJpGraphEditorEmptyEntry;
        case cavalry_native_font::Locale::Unset:
        case cavalry_native_font::Locale::English:
        case cavalry_native_font::Locale::Unknown: return nullptr;
    }
    return nullptr;
}
} // namespace native_getpath_font
