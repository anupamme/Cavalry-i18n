/**
 * [INPUT]: 依赖93项固定source key、owner、UTF-8文本与原joiner。
 * [OUTPUT]: 提供三条互斥31项固定文本lane，不包含locale状态或字体descriptor。
 * [POS]: GetPath exactText的静态数据；运行时只按共享gLocale选一条lane。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
namespace native_getpath_font {
static constexpr TextEntry kZhHansEntries[] = {
    // 00 ToolHelp: tool.transform.help.enableSnapping
    {native_getpath_font::Owner::ToolHelp, "启用吸附"},
    // 01 ToolHelp: tool.transform.shortcut.spaceClickDrag
    {native_getpath_font::Owner::ToolHelp, "Space + 单击 + 拖动"},
    // 02 ToolHelp: tool.transform.help.pan
    {native_getpath_font::Owner::ToolHelp, "平移"},
    // 03 ToolHelp: tool.help.key.space
    {native_getpath_font::Owner::ToolHelp, "Space"},
    // 04 ToolHelp: tool.transform.help.playStop
    {native_getpath_font::Owner::ToolHelp, "播放/停止"},
    // 05 ToolHelp: tool.transform.shortcut.holdS
    {native_getpath_font::Owner::ToolHelp, "按住 S"},
    // 06 ToolHelp: tool.transform.help.directLayerSelection
    {native_getpath_font::Owner::ToolHelp, "直接选择图层"},
    // 07 ToolHelp: tool.transform.shortcut.sClickPath
    {native_getpath_font::Owner::ToolHelp, "S + 单击运动路径"},
    // 08 ToolHelp: tool.transform.help.insertKeyframe
    {native_getpath_font::Owner::ToolHelp, "插入关键帧"},
    // 09 ViewportStatus: viewport.qualityHigh
    {native_getpath_font::Owner::ViewportStatus, "视口质量：完整"},
    // 10 ViewportStatus: viewport.qualityHigh + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "视口质量：完整 + MSAA"},
    // 11 ViewportStatus: viewport.qualityHigh + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "视口质量：完整 + MSAA（自动）"},
    // 12 ViewportStatus: viewport.qualityLow
    {native_getpath_font::Owner::ViewportStatus, "视口质量：无抗锯齿"},
    // 13 ViewportStatus: viewport.qualityLow + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "视口质量：无抗锯齿 + MSAA"},
    // 14 ViewportStatus: viewport.qualityLow + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "视口质量：无抗锯齿 + MSAA（自动）"},
    // 15 ViewportStatus: viewport.qualityLowest
    {native_getpath_font::Owner::ViewportStatus, "视口质量：无抗锯齿、着色器或滤镜"},
    // 16 ViewportStatus: viewport.qualityLowest + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "视口质量：无抗锯齿、着色器或滤镜 + MSAA"},
    // 17 ViewportStatus: viewport.qualityLowest + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "视口质量：无抗锯齿、着色器或滤镜 + MSAA（自动）"},
    // 18 ToolHelp: tool.editShape.help.bezierAngleSnap
    {native_getpath_font::Owner::ToolHelp, "启用贝塞尔角度吸附"},
    // 19 ToolHelp: tool.editShape.help.deleteBezierHandle
    {native_getpath_font::Owner::ToolHelp, "删除贝塞尔控制柄"},
    // 20 ToolHelp: tool.editShape.help.disableSnapping
    {native_getpath_font::Owner::ToolHelp, "禁用吸附"},
    // 21 ToolHelp: tool.editShape.help.splitPathBezier
    {native_getpath_font::Owner::ToolHelp, "拆分路径（贝塞尔）"},
    // 22 ToolHelp: tool.editShape.help.splitPathCorner
    {native_getpath_font::Owner::ToolHelp, "拆分路径（角点）"},
    // 23 ToolHelp: tool.editShape.help.toggleTransformTool
    {native_getpath_font::Owner::ToolHelp, "切换变换工具"},
    // 24 ToolHelp: tool.editShape.shortcut.sClick
    {native_getpath_font::Owner::ToolHelp, "S + 单击"},
    // 25 ToolHelp: tool.editShape.shortcut.sDoubleClick
    {native_getpath_font::Owner::ToolHelp, "S + 双击"},
    // 26 ToolHelp: tool.editShape.shortcut.xClick
    {native_getpath_font::Owner::ToolHelp, "X + 单击"},
    // 27 ToolHelp: tool.mesh.help.addEditBind
    {native_getpath_font::Owner::ToolHelp, "添加或编辑绑定位置"},
    // 28 ToolHelp: tool.mesh.help.createEdge
    {native_getpath_font::Owner::ToolHelp, "单击两个顶点之间拖动一条线以创建边缘。"},
    // 29 ToolHelp: tool.mesh.help.disableSoftSelection
    {native_getpath_font::Owner::ToolHelp, "禁用软选择"},
    // 30 ToolHelp: tool.mesh.help.softSelectionSize
    {native_getpath_font::Owner::ToolHelp, "单击拖曳以编辑软选择大小"},
};
static constexpr TextEntry kZhHantEntries[] = {
    // 00 ToolHelp: tool.transform.help.enableSnapping
    {native_getpath_font::Owner::ToolHelp, "啟用吸附"},
    // 01 ToolHelp: tool.transform.shortcut.spaceClickDrag
    {native_getpath_font::Owner::ToolHelp, "Space + 按一下 + 拖曳"},
    // 02 ToolHelp: tool.transform.help.pan
    {native_getpath_font::Owner::ToolHelp, "移動檢視"},
    // 03 ToolHelp: tool.help.key.space
    {native_getpath_font::Owner::ToolHelp, "Space"},
    // 04 ToolHelp: tool.transform.help.playStop
    {native_getpath_font::Owner::ToolHelp, "播放/停止"},
    // 05 ToolHelp: tool.transform.shortcut.holdS
    {native_getpath_font::Owner::ToolHelp, "按住 S"},
    // 06 ToolHelp: tool.transform.help.directLayerSelection
    {native_getpath_font::Owner::ToolHelp, "直接選取圖層"},
    // 07 ToolHelp: tool.transform.shortcut.sClickPath
    {native_getpath_font::Owner::ToolHelp, "S + 按一下運動路徑"},
    // 08 ToolHelp: tool.transform.help.insertKeyframe
    {native_getpath_font::Owner::ToolHelp, "插入關鍵幀"},
    // 09 ViewportStatus: viewport.qualityHigh
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：完整"},
    // 10 ViewportStatus: viewport.qualityHigh + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：完整 + MSAA"},
    // 11 ViewportStatus: viewport.qualityHigh + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：完整 + MSAA（自動）"},
    // 12 ViewportStatus: viewport.qualityLow
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：無抗鋸齒"},
    // 13 ViewportStatus: viewport.qualityLow + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：無抗鋸齒 + MSAA"},
    // 14 ViewportStatus: viewport.qualityLow + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：無抗鋸齒 + MSAA（自動）"},
    // 15 ViewportStatus: viewport.qualityLowest
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：無抗鋸齒、著色器或濾鏡"},
    // 16 ViewportStatus: viewport.qualityLowest + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：無抗鋸齒、著色器或濾鏡 + MSAA"},
    // 17 ViewportStatus: viewport.qualityLowest + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "檢視區品質：無抗鋸齒、著色器或濾鏡 + MSAA（自動）"},
    // 18 ToolHelp: tool.editShape.help.bezierAngleSnap
    {native_getpath_font::Owner::ToolHelp, "啟用貝茲角度吸附"},
    // 19 ToolHelp: tool.editShape.help.deleteBezierHandle
    {native_getpath_font::Owner::ToolHelp, "刪除貝茲控制柄"},
    // 20 ToolHelp: tool.editShape.help.disableSnapping
    {native_getpath_font::Owner::ToolHelp, "停用吸附"},
    // 21 ToolHelp: tool.editShape.help.splitPathBezier
    {native_getpath_font::Owner::ToolHelp, "分割路徑（貝茲）"},
    // 22 ToolHelp: tool.editShape.help.splitPathCorner
    {native_getpath_font::Owner::ToolHelp, "分割路徑（角點）"},
    // 23 ToolHelp: tool.editShape.help.toggleTransformTool
    {native_getpath_font::Owner::ToolHelp, "切換變換工具"},
    // 24 ToolHelp: tool.editShape.shortcut.sClick
    {native_getpath_font::Owner::ToolHelp, "S + 按一下"},
    // 25 ToolHelp: tool.editShape.shortcut.sDoubleClick
    {native_getpath_font::Owner::ToolHelp, "S + 連按兩下"},
    // 26 ToolHelp: tool.editShape.shortcut.xClick
    {native_getpath_font::Owner::ToolHelp, "X + 按一下"},
    // 27 ToolHelp: tool.mesh.help.addEditBind
    {native_getpath_font::Owner::ToolHelp, "新增或編輯綁定位置"},
    // 28 ToolHelp: tool.mesh.help.createEdge
    {native_getpath_font::Owner::ToolHelp, "單擊兩個頂點之間拖動一條線以建立邊緣。"},
    // 29 ToolHelp: tool.mesh.help.disableSoftSelection
    {native_getpath_font::Owner::ToolHelp, "停用軟選擇"},
    // 30 ToolHelp: tool.mesh.help.softSelectionSize
    {native_getpath_font::Owner::ToolHelp, "單擊拖曳以編輯軟選擇大小"},
};
static constexpr TextEntry kJaJpEntries[] = {
    // 00 ToolHelp: tool.transform.help.enableSnapping
    {native_getpath_font::Owner::ToolHelp, "スナップを有効にする"},
    // 01 ToolHelp: tool.transform.shortcut.spaceClickDrag
    {native_getpath_font::Owner::ToolHelp, "Space + クリック + ドラッグ"},
    // 02 ToolHelp: tool.transform.help.pan
    {native_getpath_font::Owner::ToolHelp, "パン"},
    // 03 ToolHelp: tool.help.key.space
    {native_getpath_font::Owner::ToolHelp, "Space"},
    // 04 ToolHelp: tool.transform.help.playStop
    {native_getpath_font::Owner::ToolHelp, "再生/停止"},
    // 05 ToolHelp: tool.transform.shortcut.holdS
    {native_getpath_font::Owner::ToolHelp, "S キーを押したままにする"},
    // 06 ToolHelp: tool.transform.help.directLayerSelection
    {native_getpath_font::Owner::ToolHelp, "レイヤーを直接選択"},
    // 07 ToolHelp: tool.transform.shortcut.sClickPath
    {native_getpath_font::Owner::ToolHelp, "S + モーションパスをクリック"},
    // 08 ToolHelp: tool.transform.help.insertKeyframe
    {native_getpath_font::Owner::ToolHelp, "キーフレームを挿入"},
    // 09 ViewportStatus: viewport.qualityHigh
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: フル"},
    // 10 ViewportStatus: viewport.qualityHigh + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: フル + MSAA"},
    // 11 ViewportStatus: viewport.qualityHigh + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: フル + MSAA（自動）"},
    // 12 ViewportStatus: viewport.qualityLow
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: アンチエイリアスなし"},
    // 13 ViewportStatus: viewport.qualityLow + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: アンチエイリアスなし + MSAA"},
    // 14 ViewportStatus: viewport.qualityLow + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: アンチエイリアスなし + MSAA（自動）"},
    // 15 ViewportStatus: viewport.qualityLowest
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: アンチエイリアス、シェーダー、フィルターなし"},
    // 16 ViewportStatus: viewport.qualityLowest + viewport.qualityMSAA
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: アンチエイリアス、シェーダー、フィルターなし + MSAA"},
    // 17 ViewportStatus: viewport.qualityLowest + viewport.qualityMSAAAuto
    {native_getpath_font::Owner::ViewportStatus, "ビューポート品質: アンチエイリアス、シェーダー、フィルターなし + MSAA（自動）"},
    // 18 ToolHelp: tool.editShape.help.bezierAngleSnap
    {native_getpath_font::Owner::ToolHelp, "ベジェ角度スナップを有効にする"},
    // 19 ToolHelp: tool.editShape.help.deleteBezierHandle
    {native_getpath_font::Owner::ToolHelp, "ベジェハンドルを削除"},
    // 20 ToolHelp: tool.editShape.help.disableSnapping
    {native_getpath_font::Owner::ToolHelp, "スナップを無効にする"},
    // 21 ToolHelp: tool.editShape.help.splitPathBezier
    {native_getpath_font::Owner::ToolHelp, "パスを分割（ベジェ）"},
    // 22 ToolHelp: tool.editShape.help.splitPathCorner
    {native_getpath_font::Owner::ToolHelp, "パスを分割（コーナー）"},
    // 23 ToolHelp: tool.editShape.help.toggleTransformTool
    {native_getpath_font::Owner::ToolHelp, "トランスフォームツールを切り替え"},
    // 24 ToolHelp: tool.editShape.shortcut.sClick
    {native_getpath_font::Owner::ToolHelp, "S + クリック"},
    // 25 ToolHelp: tool.editShape.shortcut.sDoubleClick
    {native_getpath_font::Owner::ToolHelp, "S + ダブルクリック"},
    // 26 ToolHelp: tool.editShape.shortcut.xClick
    {native_getpath_font::Owner::ToolHelp, "X + クリック"},
    // 27 ToolHelp: tool.mesh.help.addEditBind
    {native_getpath_font::Owner::ToolHelp, "バインド位置を追加または編集"},
    // 28 ToolHelp: tool.mesh.help.createEdge
    {native_getpath_font::Owner::ToolHelp, "2つの頂点間の線をドラッグしてエッジを作成します。"},
    // 29 ToolHelp: tool.mesh.help.disableSoftSelection
    {native_getpath_font::Owner::ToolHelp, "ソフト選択を無効にする"},
    // 30 ToolHelp: tool.mesh.help.softSelectionSize
    {native_getpath_font::Owner::ToolHelp, "ドラッグをクリックしてソフト選択サイズを編集"},
};
} // namespace native_getpath_font
