/**
 * [INPUT]: 依赖213项固定source key、owner、UTF-8文本与原joiner。
 * [OUTPUT]: 提供三条互斥71项固定文本lane，不包含locale状态或字体descriptor。
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
    // 31 ToolHelp: tool.camera.help.dolly
    {native_getpath_font::Owner::ToolHelp, "前后移动"},
    // 32 ToolHelp: tool.camera.help.orbit
    {native_getpath_font::Owner::ToolHelp, "环绕"},
    // 33 ToolHelp: tool.camera.help.trackXY
    {native_getpath_font::Owner::ToolHelp, "在 XY 平面平移"},
    // 34 ToolHelp: tool.forgeDynamics.help.goBackToStart
    {native_getpath_font::Owner::ToolHelp, "返回起始帧后再移动模拟物体。"},
    // 35 ToolHelp: tool.forgeDynamics.help.moveInputShapes
    {native_getpath_font::Owner::ToolHelp, "移动模拟物体"},
    // 36 ToolHelp: tool.help.key.click
    {native_getpath_font::Owner::ToolHelp, "单击"},
    // 37 ToolHelp: tool.help.key.doubleClick
    {native_getpath_font::Owner::ToolHelp, "双击"},
    // 38 ToolHelp: tool.knife.help.cutAction
    {native_getpath_font::Owner::ToolHelp, "单击并拖动以定义剪切线"},
    // 39 ToolHelp: tool.knife.help.label
    {native_getpath_font::Owner::ToolHelp, "切割路径工具"},
    // 40 ToolHelp: tool.pen.help.clearPath + tool.pencil.help.clearPath
    {native_getpath_font::Owner::ToolHelp, "清除路径"},
    // 41 ToolHelp: tool.pen.help.createAsMask + tool.pencil.help.createAsMask
    {native_getpath_font::Owner::ToolHelp, "创建为遮罩"},
    // 42 ToolHelp: tool.pen.help.startNewContour
    {native_getpath_font::Owner::ToolHelp, "新建轮廓"},
    // 43 ToolHelp: tool.pen.help.startNewShape
    {native_getpath_font::Owner::ToolHelp, "新建形状"},
    // 44 ToolHelp: tool.pen.help.straightLine
    {native_getpath_font::Owner::ToolHelp, "绘制直线"},
    // 45 ToolHelp: tool.pencil.help.newShape
    {native_getpath_font::Owner::ToolHelp, "新建形状"},
    // 46 ToolHelp: tool.pivot.help.constrainAxis
    {native_getpath_font::Owner::ToolHelp, "约束轴"},
    // 47 ToolHelp: tool.pivot.help.movePivotLayerMoves
    {native_getpath_font::Owner::ToolHelp, "移动锚点（图层移动）"},
    // 48 ToolHelp: tool.pivot.help.movePivotLayerStays
    {native_getpath_font::Owner::ToolHelp, "移动锚点（图层保持）"},
    // 49 ToolHelp: tool.pivot.help.quickSetLayerMoves
    {native_getpath_font::Owner::ToolHelp, "快速设置锚点（图层移动）"},
    // 50 ToolHelp: tool.pivot.help.quickSetLayerStays
    {native_getpath_font::Owner::ToolHelp, "快速设置锚点（图层保持）"},
    // 51 ToolHelp: tool.pivot.help.toggleSnapping
    {native_getpath_font::Owner::ToolHelp, "切换吸附"},
    // 52 ToolHelp: tool.shared.help.constrainProportions
    {native_getpath_font::Owner::ToolHelp, "锁定纵横比"},
    // 53 ToolHelp: tool.shared.help.createFromCentre
    {native_getpath_font::Owner::ToolHelp, "从中心创建"},
    // 54 ToolHelp: tool.shared.help.snap90
    {native_getpath_font::Owner::ToolHelp, "与 90 度角对齐"},
    // 55 ToolHelp: tool.shared.shortcut.drag
    {native_getpath_font::Owner::ToolHelp, "拖拽"},
    // 56 ToolHelp: tool.skeleton.help.rotateBone
    {native_getpath_font::Owner::ToolHelp, "旋转骨骼"},
    // 57 ToolHelp: tool.skeleton.help.select
    {native_getpath_font::Owner::ToolHelp, "选择"},
    // 58 ToolHelp: tool.skeleton.help.startFinishBone
    {native_getpath_font::Owner::ToolHelp, "开始/完成添加骨骼"},
    // 59 ToolHelp: tool.skeleton.help.stretchBone
    {native_getpath_font::Owner::ToolHelp, "拉伸骨骼"},
    // 60 ToolHelp: tool.skeleton.shortcut.clickBone
    {native_getpath_font::Owner::ToolHelp, "单击骨骼"},
    // 61 ToolHelp: tool.skeleton.shortcut.clickHandle
    {native_getpath_font::Owner::ToolHelp, "单击手柄"},
    // 62 ToolHelp: tool.skeleton.shortcut.clickHandleDrag
    {native_getpath_font::Owner::ToolHelp, "单击手柄并拖动"},
    // 63 ToolHelp: tool.strokeWidth.help.addPoint
    {native_getpath_font::Owner::ToolHelp, "单击描边以添加宽度点"},
    // 64 ToolHelp: tool.strokeWidth.help.positionOnly
    {native_getpath_font::Owner::ToolHelp, "仅移动点的位置，保持其宽度"},
    // 65 ToolHelp: tool.strokeWidth.help.removePoint
    {native_getpath_font::Owner::ToolHelp, "移除宽度点"},
    // 66 ToolHelp: tool.strokeWidth.help.typeWidth
    {native_getpath_font::Owner::ToolHelp, "输入该点的宽度"},
    // 67 ToolHelp: tool.strokeWidth.help.widthOnly
    {native_getpath_font::Owner::ToolHelp, "仅更改宽度，保持点的位置"},
    // 68 ToolHelp: tool.tracking.help.addTracker
    {native_getpath_font::Owner::ToolHelp, "添加跟踪点（需要 4 个）。"},
    // 69 ToolHelp: tool.tracking.help.newKeyframe
    {native_getpath_font::Owner::ToolHelp, "创建新关键帧。"},
    // 70 ToolHelp: tool.tracking.help.removeTracker
    {native_getpath_font::Owner::ToolHelp, "删除选中的跟踪点。"},
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
    // 31 ToolHelp: tool.camera.help.dolly
    {native_getpath_font::Owner::ToolHelp, "前後移動"},
    // 32 ToolHelp: tool.camera.help.orbit
    {native_getpath_font::Owner::ToolHelp, "環繞"},
    // 33 ToolHelp: tool.camera.help.trackXY
    {native_getpath_font::Owner::ToolHelp, "在 XY 平面平移"},
    // 34 ToolHelp: tool.forgeDynamics.help.goBackToStart
    {native_getpath_font::Owner::ToolHelp, "返回起始影格後再移動模擬物體。"},
    // 35 ToolHelp: tool.forgeDynamics.help.moveInputShapes
    {native_getpath_font::Owner::ToolHelp, "移動模擬物體"},
    // 36 ToolHelp: tool.help.key.click
    {native_getpath_font::Owner::ToolHelp, "單擊"},
    // 37 ToolHelp: tool.help.key.doubleClick
    {native_getpath_font::Owner::ToolHelp, "連按兩下"},
    // 38 ToolHelp: tool.knife.help.cutAction
    {native_getpath_font::Owner::ToolHelp, "單擊並拖動以定義剪切線"},
    // 39 ToolHelp: tool.knife.help.label
    {native_getpath_font::Owner::ToolHelp, "切割路徑工具"},
    // 40 ToolHelp: tool.pen.help.clearPath + tool.pencil.help.clearPath
    {native_getpath_font::Owner::ToolHelp, "清除路徑"},
    // 41 ToolHelp: tool.pen.help.createAsMask + tool.pencil.help.createAsMask
    {native_getpath_font::Owner::ToolHelp, "建立為遮罩"},
    // 42 ToolHelp: tool.pen.help.startNewContour
    {native_getpath_font::Owner::ToolHelp, "新增輪廓"},
    // 43 ToolHelp: tool.pen.help.startNewShape
    {native_getpath_font::Owner::ToolHelp, "新增形狀"},
    // 44 ToolHelp: tool.pen.help.straightLine
    {native_getpath_font::Owner::ToolHelp, "繪製直線"},
    // 45 ToolHelp: tool.pencil.help.newShape
    {native_getpath_font::Owner::ToolHelp, "新增形狀"},
    // 46 ToolHelp: tool.pivot.help.constrainAxis
    {native_getpath_font::Owner::ToolHelp, "約束軸"},
    // 47 ToolHelp: tool.pivot.help.movePivotLayerMoves
    {native_getpath_font::Owner::ToolHelp, "移動錨點（圖層移動）"},
    // 48 ToolHelp: tool.pivot.help.movePivotLayerStays
    {native_getpath_font::Owner::ToolHelp, "移動錨點（圖層保持）"},
    // 49 ToolHelp: tool.pivot.help.quickSetLayerMoves
    {native_getpath_font::Owner::ToolHelp, "快速設定錨點（圖層移動）"},
    // 50 ToolHelp: tool.pivot.help.quickSetLayerStays
    {native_getpath_font::Owner::ToolHelp, "快速設定錨點（圖層保持）"},
    // 51 ToolHelp: tool.pivot.help.toggleSnapping
    {native_getpath_font::Owner::ToolHelp, "切換吸附"},
    // 52 ToolHelp: tool.shared.help.constrainProportions
    {native_getpath_font::Owner::ToolHelp, "鎖定長寬比"},
    // 53 ToolHelp: tool.shared.help.createFromCentre
    {native_getpath_font::Owner::ToolHelp, "從中心建立"},
    // 54 ToolHelp: tool.shared.help.snap90
    {native_getpath_font::Owner::ToolHelp, "與 90 度角對齊"},
    // 55 ToolHelp: tool.shared.shortcut.drag
    {native_getpath_font::Owner::ToolHelp, "拖曳"},
    // 56 ToolHelp: tool.skeleton.help.rotateBone
    {native_getpath_font::Owner::ToolHelp, "旋轉骨骼"},
    // 57 ToolHelp: tool.skeleton.help.select
    {native_getpath_font::Owner::ToolHelp, "選取"},
    // 58 ToolHelp: tool.skeleton.help.startFinishBone
    {native_getpath_font::Owner::ToolHelp, "開始/完成新增骨骼"},
    // 59 ToolHelp: tool.skeleton.help.stretchBone
    {native_getpath_font::Owner::ToolHelp, "拉伸骨骼"},
    // 60 ToolHelp: tool.skeleton.shortcut.clickBone
    {native_getpath_font::Owner::ToolHelp, "按一下骨骼"},
    // 61 ToolHelp: tool.skeleton.shortcut.clickHandle
    {native_getpath_font::Owner::ToolHelp, "按一下手柄"},
    // 62 ToolHelp: tool.skeleton.shortcut.clickHandleDrag
    {native_getpath_font::Owner::ToolHelp, "按一下手柄後拖曳"},
    // 63 ToolHelp: tool.strokeWidth.help.addPoint
    {native_getpath_font::Owner::ToolHelp, "按一下描邊以新增寬度點"},
    // 64 ToolHelp: tool.strokeWidth.help.positionOnly
    {native_getpath_font::Owner::ToolHelp, "只移動點的位置，維持其寬度"},
    // 65 ToolHelp: tool.strokeWidth.help.removePoint
    {native_getpath_font::Owner::ToolHelp, "移除寬度點"},
    // 66 ToolHelp: tool.strokeWidth.help.typeWidth
    {native_getpath_font::Owner::ToolHelp, "輸入該點的寬度"},
    // 67 ToolHelp: tool.strokeWidth.help.widthOnly
    {native_getpath_font::Owner::ToolHelp, "只變更寬度，維持點的位置"},
    // 68 ToolHelp: tool.tracking.help.addTracker
    {native_getpath_font::Owner::ToolHelp, "新增追蹤點（需要 4 個）。"},
    // 69 ToolHelp: tool.tracking.help.newKeyframe
    {native_getpath_font::Owner::ToolHelp, "建立新關鍵幀。"},
    // 70 ToolHelp: tool.tracking.help.removeTracker
    {native_getpath_font::Owner::ToolHelp, "刪除選取的追蹤點。"},
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
    // 31 ToolHelp: tool.camera.help.dolly
    {native_getpath_font::Owner::ToolHelp, "前後移動"},
    // 32 ToolHelp: tool.camera.help.orbit
    {native_getpath_font::Owner::ToolHelp, "オービット"},
    // 33 ToolHelp: tool.camera.help.trackXY
    {native_getpath_font::Owner::ToolHelp, "XY 平面内をパン"},
    // 34 ToolHelp: tool.forgeDynamics.help.goBackToStart
    {native_getpath_font::Owner::ToolHelp, "ボディを動かすには開始フレームに戻ります。"},
    // 35 ToolHelp: tool.forgeDynamics.help.moveInputShapes
    {native_getpath_font::Owner::ToolHelp, "ボディを移動"},
    // 36 ToolHelp: tool.help.key.click
    {native_getpath_font::Owner::ToolHelp, "クリック"},
    // 37 ToolHelp: tool.help.key.doubleClick
    {native_getpath_font::Owner::ToolHelp, "ダブルクリック"},
    // 38 ToolHelp: tool.knife.help.cutAction
    {native_getpath_font::Owner::ToolHelp, "クリックしてドラッグして切断ラインを定義する"},
    // 39 ToolHelp: tool.knife.help.label
    {native_getpath_font::Owner::ToolHelp, "カットパスツール"},
    // 40 ToolHelp: tool.pen.help.clearPath + tool.pencil.help.clearPath
    {native_getpath_font::Owner::ToolHelp, "パスをクリア"},
    // 41 ToolHelp: tool.pen.help.createAsMask + tool.pencil.help.createAsMask
    {native_getpath_font::Owner::ToolHelp, "マスクとして作成"},
    // 42 ToolHelp: tool.pen.help.startNewContour
    {native_getpath_font::Owner::ToolHelp, "新しい輪郭を開始"},
    // 43 ToolHelp: tool.pen.help.startNewShape
    {native_getpath_font::Owner::ToolHelp, "新規シェイプを開始"},
    // 44 ToolHelp: tool.pen.help.straightLine
    {native_getpath_font::Owner::ToolHelp, "直線を描く"},
    // 45 ToolHelp: tool.pencil.help.newShape
    {native_getpath_font::Owner::ToolHelp, "新規シェイプ"},
    // 46 ToolHelp: tool.pivot.help.constrainAxis
    {native_getpath_font::Owner::ToolHelp, "制約軸"},
    // 47 ToolHelp: tool.pivot.help.movePivotLayerMoves
    {native_getpath_font::Owner::ToolHelp, "ピボットを移動（レイヤーも移動）"},
    // 48 ToolHelp: tool.pivot.help.movePivotLayerStays
    {native_getpath_font::Owner::ToolHelp, "ピボットを移動（レイヤーは固定）"},
    // 49 ToolHelp: tool.pivot.help.quickSetLayerMoves
    {native_getpath_font::Owner::ToolHelp, "ピボットをクイック設定（レイヤー移動）"},
    // 50 ToolHelp: tool.pivot.help.quickSetLayerStays
    {native_getpath_font::Owner::ToolHelp, "ピボットをクイック設定（レイヤー固定）"},
    // 51 ToolHelp: tool.pivot.help.toggleSnapping
    {native_getpath_font::Owner::ToolHelp, "スナップを切り替える"},
    // 52 ToolHelp: tool.shared.help.constrainProportions
    {native_getpath_font::Owner::ToolHelp, "縦横比を固定"},
    // 53 ToolHelp: tool.shared.help.createFromCentre
    {native_getpath_font::Owner::ToolHelp, "センターから作成"},
    // 54 ToolHelp: tool.shared.help.snap90
    {native_getpath_font::Owner::ToolHelp, "90度の角度にスナップ"},
    // 55 ToolHelp: tool.shared.shortcut.drag
    {native_getpath_font::Owner::ToolHelp, "ドラッグ"},
    // 56 ToolHelp: tool.skeleton.help.rotateBone
    {native_getpath_font::Owner::ToolHelp, "ボーンを回転させる"},
    // 57 ToolHelp: tool.skeleton.help.select
    {native_getpath_font::Owner::ToolHelp, "選択"},
    // 58 ToolHelp: tool.skeleton.help.startFinishBone
    {native_getpath_font::Owner::ToolHelp, "ボーンの追加を開始/完了"},
    // 59 ToolHelp: tool.skeleton.help.stretchBone
    {native_getpath_font::Owner::ToolHelp, "ボーンを伸ばす"},
    // 60 ToolHelp: tool.skeleton.shortcut.clickBone
    {native_getpath_font::Owner::ToolHelp, "ボーンをクリック"},
    // 61 ToolHelp: tool.skeleton.shortcut.clickHandle
    {native_getpath_font::Owner::ToolHelp, "ハンドルをクリック"},
    // 62 ToolHelp: tool.skeleton.shortcut.clickHandleDrag
    {native_getpath_font::Owner::ToolHelp, "ハンドルをクリックしてドラッグ"},
    // 63 ToolHelp: tool.strokeWidth.help.addPoint
    {native_getpath_font::Owner::ToolHelp, "ストロークをクリックして幅のポイントを追加"},
    // 64 ToolHelp: tool.strokeWidth.help.positionOnly
    {native_getpath_font::Owner::ToolHelp, "幅を変えずにポイントの位置だけを移動"},
    // 65 ToolHelp: tool.strokeWidth.help.removePoint
    {native_getpath_font::Owner::ToolHelp, "幅のポイントを削除"},
    // 66 ToolHelp: tool.strokeWidth.help.typeWidth
    {native_getpath_font::Owner::ToolHelp, "ポイントの幅を入力"},
    // 67 ToolHelp: tool.strokeWidth.help.widthOnly
    {native_getpath_font::Owner::ToolHelp, "ポイントの位置を変えずに幅だけを変更"},
    // 68 ToolHelp: tool.tracking.help.addTracker
    {native_getpath_font::Owner::ToolHelp, "トラッカーを追加します（4 個必要）。"},
    // 69 ToolHelp: tool.tracking.help.newKeyframe
    {native_getpath_font::Owner::ToolHelp, "新しいキーフレームを作成します。"},
    // 70 ToolHelp: tool.tracking.help.removeTracker
    {native_getpath_font::Owner::ToolHelp, "選択したトラッカーを削除します。"},
};
} // namespace native_getpath_font
