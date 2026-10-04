<!--
[INPUT]: 依赖 Cavalry 显示source/notes、translation-guidelines.md、现有审校决策与分地区厂商文档
[OUTPUT]: 对外提供四语术语、图像/数值/几何/文本角色分流、地区证据边界、品牌保留与显示层例外的规范表
[POS]: docs 的术语真相源，被三语 TS/JSON 翻译、质量检查与人工审校共同消费
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

| en | zh-Hans | zh-Hant | ja_JP | note |
|---|---|---|---|---|
| Language Switcher | 语言切换器 | 語言切換器 | 言語切り替え | UI name |
| Position | 位置 | 位置 | 位置 | Align with After Effects / Blender terminology |
| Rotation | 旋转 | 旋轉 | 回転 | Do not use "转动" |
| Scale | 缩放 | 縮放 | スケール | 几何变换与尺寸操控的项目首选；若当前 owner 明确指相对尺寸的倍率，「比例」可理解，统一为缩放属于一致性建议。不得把这一首选扩成所有数值语境的禁词。 |
| Opacity | 不透明度 | 不透明度 | 不透明度 | Do not simplify to "透明度" |
| Transform | 变换 | 變換 | トランスフォーム | 项目UI/动画首选词；[Adobe 日文 Illustrator](https://helpx.adobe.com/jp/illustrator/desktop/manage-objects/reshape-transform-objects/transform-panel-overview.html)也把位置/旋转/缩放面板称変形；[Adobe 台湾 Illustrator](https://helpx.adobe.com/tw/illustrator/desktop/manage-objects/reshape-transform-objects/transform-panel-overview.html)亦用變形面板指移動/旋轉/縮放。因此変形/變形不自动等于Deform误译；沿项目标签统一可列建议。Freeze仍须区分烘焙归零与锁定。 |
| Extrude | 挤出 | 擠出 | 押し出し | 本项目同owner角度/距离/说明首选挤出；[Maxon 中文 MoGraph](https://www.maxon.net/zh/cinema-4d/features/mograph-basics)把基于样条徽标的同类几何操作称挤压，挤压不是仅凭字面就可判错的地区/产品用语。统一节点标题属一致性建议；不能反推用户操作方向或重写模型身份。 |
| Anchor Point | 锚点 | 錨點 | アンカーポイント | |
| Pivot | 锚点 | 錨點 | ピボット | Use same term as Anchor Point unless context requires distinction |
| Keyframe | 关键帧 | 關鍵幀 | キーフレーム | Do not use "关键格" |
| Direct Layer Selection | 直接选择图层 | 直接選取圖層 | レイヤーを直接選択 | Transform Tool action; “Direct” describes the selection mode, never “项目 / 項目” |
| Snapping | 吸附 | 吸附 | スナップ | Graphics alignment behavior; do not translate as “抓取” |
| Easing | 缓动 | 緩動 | イージング | |
| Ease In | 缓入 | 緩入 | イーズイン | |
| Ease Out | 缓出 | 緩出 | イーズアウト | |
| Composition | 合成 | 合成 | コンポジション | Do not use "组合" |
| Pre-compose | 预合成 | 預合成 | プリコンポーズ | |
| Layer | 图层 | 圖層 | レイヤー | Do not use "层" |
| Parent | 父级 | 父級 | 親 | Hierarchy context |
| Child | 子级 | 子級 | 子 | Hierarchy context |
| Mask | 蒙版 | 遮罩 | マスク | zh-Hans: Prefer AE terminology over "遮罩" |
| Track Matte | 轨道遮罩 | 軌道遮罩 | トラックマット | Image-based matte, distinct from Mask; do not mechanically apply the Mask-only 蒙版 rule |
| Stroke | 描边 | 描邊 | ストローク | 项目首选描邊；[Adobe 台湾 Illustrator 端点/接合文档](https://helpx.adobe.com/tw/illustrator/desktop/paint-and-fill/apply-and-edit-strokes/change-the-caps-or-joins-of-a-line.html)（2026-02-11）以筆畫面板和筆畫線條指同一矢量stroke。繁中筆畫并非只指书写字形；几何owner明确时保留成熟地区用法，沿项目标签统一描邊只能列建议，不能套用简中禁词判功能错。 |
| Pen Tool | 钢笔工具 | 鋼筆工具 | ペンツール | Vector path editing tool |
| Pencil Tool | 铅笔工具 | 鉛筆工具 | 鉛筆ツール | Freehand drawing tool |
| Fill | 填充 | 填充 | 塗り | |
| Bezier | 贝塞尔 | 貝茲 | ベジェ | Use standard Chinese graphics term |
| Path | 路径 | 路徑 | パス | |
| Curve | 曲线 | 曲線 | カーブ | |
| Viewport | 视口 | 檢視區 | ビューポート | Do not use "视窗" |
| Deformer | 变形器 | 變形器 | デフォーマ | Cinema 4D terminology |
| Shader | 着色器 | 著色器 | シェーダー | |
| Render | 渲染 | 算繪 | レンダリング | |
| Render Tokens | 渲染标记 | 算繪標記 | レンダートークン | UI feature name; preserve the actual filename token syntax |
| Solo | 单独显示 | 單獨顯示 | ソロ | Isolate layers in the viewport; not a musical performance |
| Padding (Accumulator) | 间隔 | 間距 | 間隔 | Extra spacing between accumulated steps, not CSS/box inset |
| Padding (frame filename) | 补零位数 | 補零位數 | ゼロ埋め桁数 | Number of leading-zero digits; preserve actual filename examples |
| Resize String | 缩短字符串 | 縮短字串 | 文字列の短縮 | String-operator length reduction, not geometric Scale/Resize |
| Blending Mode | 混合模式 | 混合模式 | 描画モード | Do not use "融合模式" |
| Expression | 表达式 | 運算式 | エクスプレッション | Do not use "公式" |
| Null | 空对象 | 空物件 | ヌル | Do not shorten to "空" |
| Duplicator | 复制器 | 複製器 | デュプリケーター | Cinema 4D terminology |
| Node | 节点 | 節點 | ノード | |
| Bone | 骨骼 | 骨骼 | ボーン | Rigging/Bone Tool display term; do not use “骨头 / 骨頭” or bare Japanese “骨” |
| Smoothing Steps | 平滑步数 | 平滑步數 | スムージングステップ数 | Cavalry 2.7.2 cross-platform `smoother` attribute; align with existing Smooth / smoothing terminology |
| Pitch Radius | 节圆半径 | 節圓半徑 | ピッチ半径 | Cog/gear geometry; JSON attribute and runtime CogTool prefix must stay aligned |
| Basic Shape | 基本形状 | 基本形狀 | 基本シェイプ | |
| Property | 属性 | 屬性 | プロパティ | |
| Font | 字体 | 字型 | フォント | Label only; preserve actual font-family and weight values |
| Typeface | 字体 | 字體 | 書体 | Font design/Typeface utility, not a single glyph; a Typeface may include font and weight |
| Typeface Array | 字体数组 | 字體陣列 | 書体配列 | Display name for the connected list; keep typefaceArray identity English |
| Glyph | 字形 | 字形 | グリフ | Individual character shape; do not use this translation for Typeface |
| Tooltip | 工具提示 | 工具提示 | ツールチップ | Microsoft UI terminology |
| Tip | 提示 | 提示 | ヒント | |
| Onboarding | 新手引导 | 新手導覽 | オンボーディング | Product education context |
| Plugin | 插件 | 外掛程式 | プラグイン | |
| Preset | 预设 | 預設 | プリセット | |
| Timeline | 时间线 | 時間軸 | タイムライン | |
| Graph Editor | 图形编辑器 | 圖形編輯器 | グラフエディター | After Effects terminology |
| Motion Blur | 运动模糊 | 動態模糊 | モーションブラー | |
| Gradient | 渐变 | 漸層 | グラデーション | |
| Scene | 场景 | 場景 | シーン | |
| Preview | 预览 | 預覽 | プレビュー | |
| Playback | 播放 | 播放 | 再生 | |
| Loop | 循环 | 循環 | ループ | |
| Resolution | 分辨率 | 解析度 | 解像度 | |
| Frame Rate | 帧率 | 幀率 | フレームレート | |
| Workspace | 工作区 | 工作區 | ワークスペース | |
| Preferences | 首选项 | 偏好設定 | 環境設定 | macOS-style UI wording |
| Apply | 应用 | 套用 | 適用 | |
| Restart | 重新启动 | 重新啟動 | 再起動 | |
| Switch | 切换 | 切換 | 切り替える | Switcher primary button; starts the language transaction directly |
| Save | 保存 | 儲存 | 保存 | |
| Save As | 另存为 | 另存新檔 | 名前を付けて保存 | |
| Open | 打开 | 開啟 | 開く | |
| Close | 关闭 | 關閉 | 閉じる | |
| File | 文件 | 檔案 | ファイル | Microsoft UI terminology |
| Edit | 编辑 | 編輯 | 編集 | Microsoft UI terminology |
| View | 视图 | 檢視 | 表示 | Microsoft UI terminology |
| Window | 窗口 | 視窗 | ウィンドウ | Microsoft UI terminology |
| Scripts | 脚本 | 腳本 | スクリプト | |
| Alpha | Alpha | Alpha | Alpha | In channel context, allow "Alpha 通道" |
| RGB | RGB | RGB | RGB | Keep English acronym |
| CMYK | CMYK | CMYK | CMYK | Keep English acronym |
| SVG | SVG | SVG | SVG | Keep English acronym |
| JSON | JSON | JSON | JSON | Keep English acronym |
| CSV | CSV | CSV | CSV | Keep English acronym |
| FPS | FPS | FPS | FPS | Keep English acronym |
| BPM | BPM | BPM | BPM | Keep English acronym |
| GPU | GPU | GPU | GPU | Keep English acronym |
| Lottie | Lottie | Lottie | Lottie | Product / format name |
| Cavalry | Cavalry | Cavalry | Cavalry | Product name |
| Canva | Canva | Canva | Canva | Brand name |
| Canva Sheets | Canva 表格 | Canva 試算表 | Canva シート | Spreadsheet product display name; Traditional Chinese/Japanese follow [Canva zh-TW](https://www.canva.com/zh_tw/sheets/) / [Canva ja-JP](https://www.canva.com/ja_jp/sheets/); Simplified Chinese is the spreadsheet-context translation, not a claimed official regional product title. Preserve model/API identifiers. |
| Canva Sheet | Canva 表格 | Canva 試算表 | Canva シート | Singular UI alias of Canva Sheets in Cavalry's import feature; localize display copy only, never `canvaSheet` / `loadCanvaSheet` / other data or code identifiers. |
| Finder | 访达 | Finder | Finder | macOS product name; use Apple’s localized Simplified Chinese name and preserve the product name in Traditional Chinese/Japanese |
| QuickTime | QuickTime | QuickTime | QuickTime | Apple media format brand; preserve in render-format lists |
| Excel | Excel | Excel | Excel | Product name; allow labels like "Excel 工作表" / "Excel シート" |
| Forge Dynamics | Forge 动力学 | Forge 動力學 | フォージダイナミクス | UI display term; keep model niceName English |
| Undo | 撤销 | 復原 | 元に戻す | |
| Redo | 重做 | 重做 | やり直し | |
| Copy | 复制 | 複製 | コピー | |
| Paste | 粘贴 | 貼上 | ペースト | |
| Delete | 删除 | 刪除 | 削除 | |
| Group | 编组 | 群組 | グループ | |
| Export | 导出 | 匯出 | エクスポート | |
| Import | 导入 | 匯入 | インポート | |
| Color | 颜色 | 顏色 | カラー | |
| Animation | 动画 | 動畫 | アニメーション | |
| Offset | 偏移 | 偏移 | オフセット | |
| Select All | 全选 | 全選 | すべて選択 | |
| Default | 默认 | 預設 | デフォルト | |
| Video | 视频 | 影片 | ビデオ | |
| Program | 程序 | 程式 | プログラム | |
| Information | 信息 | 資訊 | 情報 | |
| Software | 软件 | 軟體 | ソフトウェア | |
| Print | 打印 | 列印 | 印刷 | |

## 图形/动效语境：同词不同角色

以下括号限定适用场景，不属于实际 UI 文案。先确认 owner、控件用途与原厂说明，再选择译词；不得把这份表当作全局字符串替换规则。

| en | zh-Hans | zh-Hant | ja_JP | note |
|---|---|---|---|---|
| Multiply (numeric operation) | 相乘 | 相乘 | 乗算 | 数值或 Behaviour 输出运算，例如 Behaviour Mixer；不使用图像混合模式名。中文是本项目按数值语境采用的数学表达，不冒称厂商三语官方标签。 |
| Add (numeric operation) | 相加 | 相加 | 加算 | 数值相加，例如 Apply Font Size 的 Normal (Add)；不借用图像 Overlay 的「叠加/疊加」名称。以当前 owner 的 source/notes 判定运算对象，不因控件叫 Blend Mode 就自动当像素合成。 |
| Multiply (image blend mode) | 正片叠底 | 正片疊底 | 乗算 | 图层/像素颜色相乘。[Adobe 简中](https://helpx.adobe.com/cn/photoshop/desktop/repair-retouch/adjust-light-tone/blending-mode-descriptions.html)与[日文](https://helpx.adobe.com/jp/photoshop/desktop/repair-retouch/adjust-light-tone/blending-mode-descriptions.html)支持对应模式名；繁中沿用项目现词，[Adobe 台湾](https://helpx.adobe.com/tw/photoshop/desktop/repair-retouch/adjust-light-tone/blending-mode-descriptions.html)使用「色彩增值」，不得把本项目词形冒称台湾官方译名或机械覆写现有资源。 |
| Value (numeric or metadata) | 值 | 值 | 値 | 普通数值或元数据键对应的数据，例 Accumulator / Render Queue Item；不套用颜色通道译词。 |
| Fade (stored numeric values) | 衰减 | 衰減 | 減衰 | Value Solver / Value2 Solver 的 notes 明确将历史数值逐渐归零或回到默认值，不是图像不透明度的淡入淡出；不能将此规则扩到颜色过渡等其他 Fade owner。 |
| Fill All (include available elements) | 全部使用 | 全部使用 | すべて使用 | 取样/分布节点使用全部可用元素，不是颜料填充；沿 owner 分别显示「使用全部边／頂點」等具体对象，控件引用必须与实际枚举标签一致。 |
| With (replacement text) | 替换为 | 取代為 | 置換後 | Replace String 的新文本字段，不是「包含／含む」；只限定替换操作的字段角色，不替换所有英语介词 With。 |
| Shift Channels (source mapping) | 通道重映射 | 通道重映射 | チャンネル再割り当て | 当前节点的 notes 定义交换输出颜色通道的数据来源，不是像素的空间位移；这些是项目显示词，不冒称各厂商或地区的统一官方标签。 |
| Value (HSV component) | 明度 | 明度 | 明度 | HSV 的 V 分量，沿当前已审颜色节点；与普通 Value、Luma、Luminosity 的角色分别核对，不因英文相近合并。 |
| Line (text selection unit) | 行 | 行 | 行 | 文本选择粒度，与 Word/Character 并列；[Cavalry Apply Font Size](https://cavalry.studio/docs/nodes/utilities/apply-font-size/)说明其作用于字符串内的文本行，不是几何直线或描边。此证据证明功能，三语词形是项目按该语境选择。 |
| Still (physics body state) | 静止 | 靜止 | 静止 | Forge 的物体运动状态，当前 notes 明确 motionless/static；不是静帧、静止图片或 Still Render。Body 泛称模拟物体，只有源义明确 rigid body 时才译刚体，不能排除同一分类的可变形软体。 |
| Fixture (physics collision shape) | 碰撞形状 | 碰撞形狀 | フィクスチャ | Forge 碰撞参数中的项目显示词；[Box2D 2.4.1](https://box2d.org/doc_version_2_4/classb2_fixture.html)说明 fixture 将 shape 附着到 body 参与碰撞并承载摩擦等数据，支持该语义，不冒称官方三语译名。不是硬件固定件，也不重命名 API。 |
| Wrap (layout overflow) | 换行 | 換行 | 折り返し | Layout Group 内空间不足时移至新行或列；沿同 owner 的 No Wrap 与 tooltip，不是图像环绕、纹理重复或文字绕排。日语「ラップ」可表达该概念，对齐为「折り返し」属于控件一致性选择，不判外来语为错。 |
| Multiplier (numeric factor) | 乘数 | 乘數 | 倍率 | 数值缩放因子或通道权重，例 Halftone 的 RGB 系数；不是相乘次数，也不套用图像 Multiply 混合模式名。具体用途可在说明里译系数或权重，不能机械替换全部英文同词。 |
| Oklab Interpolation | Oklab 插值 | Oklab 插值 | Oklab 補間 | 当前 source 明确选用具名 Oklab 空间；保留技术名，不能仅译为一般「感知色彩插值」而丢失空间身份。此条是项目显示词，不改色彩算法。 |
| Combine / Merge (meshes) | 合并 | 合併 | 結合 | 合成多个网格为一个。繁中现代UI优先「合併」，但[教育部並字释义](https://dict.variants.moe.edu.tw/dictView.jsp?educode=A00018)也包含合併义；旧「合並」统一为「合併」按现代词形建议，不凭单字断言功能错误。网格API身份不变。 |
| Row / Column (table or grid axes) | 行 / 列 | 列 / 欄 | 行 / 列 | 水平row与垂直column按地区分列；繁中布局族沿已审网格统一列/欄，不为了追随另一中文区域的行/列而改错Row角色，不扩大到文字Line或几何端点。 |
| Minutes (Local Time cycle count) | 分钟数 | 分鐘數 | 経過時間（分） | 周期内分钟计数。日文分数可表示分钟数，[Adobe Premiere25.4时间码教程](https://www.adobe.com/jp/learn/premiere-pro/web/learn-the-basics-of-video-editing-with-creative-college-premiere-pro-course)有成熟用例；显式分单位为澄清建议，不把合法分数无条件当数学fraction错译。 |
| Stepped Next (keyframe interpolation) | 阶梯（下一个关键帧） | 階梯（下一個關鍵幀） | ステップ（次のキー） | [Cavalry Graph Editor](https://cavalry.studio/docs/user-interface/menus/window-menu/scene-window/graph-editor/)现行Interpolation定义立即取下一关键帧值并保持，Next不是普通下一影格；这是项目显示词形，不冒称官方三语名称或2.8实机算法验证。 |
| Over First / Under First (Knot) | 先在上方 / 先在下方 | 先在上方 / 先在下方 | 上から開始 / 下から開始 | [Cavalry Knot](https://cavalry.studio/docs/nodes/behaviours/knot/)说明自交处采用重复的上/下次序。采用保守起始方向标签，拒绝图层上下优先或先画段永久在上/下的解释；原 notes 的 drawing-order 表述保全，并在审批谱系记录歧义。网页未标版本，只支持功能语义交叉核对，不证明锁定 2.8 的算法或官方本地化词形。 |
| End Length (arrow geometry) | 端部长度 | 端部長度 | 端部の長さ | Basic Arrow Head / Chevron Head 的空间尺寸；[Cavalry Arrow](https://cavalry.studio/docs/nodes/shapes/basic-shape/arrow/)定义箭身末端到箭尖的距离。这是项目译词，不是 Cavalry 官方三语译名；不是时间或操作的「结束长度」。 |
| Round (stroke cap) | 圆头 | 圓頭 | ラウンド | 半圆形描边端点，沿当前 Stroke Material；[Adobe 简中 Illustrator](https://helpx.adobe.com/cn/illustrator/desktop/paint-and-fill/apply-and-edit-strokes/change-the-caps-or-joins-of-a-line.html)区分圆头端点与圆角连接。不得套用数值「四舍五入」。 |
| Flat (stroke cap) | 平头端点 | 平端點 | バット線端 / フラット | 线段端部不向端点外延伸；[Adobe 台湾 Illustrator](https://helpx.adobe.com/tw/illustrator/desktop/paint-and-fill/apply-and-edit-strokes/change-the-caps-or-joins-of-a-line.html)与[日文 Illustrator](https://helpx.adobe.com/jp/illustrator/desktop/paint-and-fill/apply-and-edit-strokes/change-the-caps-or-joins-of-a-line.html)支持对应端点形态；不是二维平面。合法フラット短标签不强制改。 |
| Projecting (stroke cap) | 方头端点 / 投影 | 方端點 | 突出線端 | 指方形线端向外延伸半个线宽，不是场景投影操作。[Adobe 简中 After Effects](https://helpx.adobe.com/cn/after-effects/desktop/apply-effects-and-animation-presets/list-of-effects/generate-effects.html)在涂抹效果同一端点定义中正式采用“投影”，因此不能仅凭另一软件的方头词形断言中文“投影”错译；台湾/日文 Illustrator 使用方端點/突出線端，地区与产品用例不可互相冒充。选择更明晰的标签可列建议，已证合法用法不全局替换。 |
| Round (stroke join) | 圆角 | 圓角 | ラウンド | 描边转角的连接样式，与端点、数值取整分开；繁日沿项目现有显示词，不冒称由简中来源证明三语官方译名。 |
| Underline (text formatting) | 下划线 | 底線 | 下線 | 文字装饰线；繁中词形有[Adobe 台湾 Illustrator](https://helpx.adobe.com/tw/illustrator/desktop/design-with-text/edit-format-text/underline-or-strike-through-text.html)依据。不是普通几何线、背景形状或 API 标识。 |

### 原厂说明冲突不能机械覆盖历史纠错

官方英文身份仍需保持源绑定，但说明文字也可能有误。已登记 `sourceCorrections` 的条目必须先核对其定义、官方文档与历史合同，不因 source/notes 的旧错误把已证实正确的译文改坏。例如 Text Shape 的 `lineStyle` 按[官方 Text Shape 文档](https://cavalry.studio/docs/nodes/shapes/text-shape/)控制下划线/删除线穿过词间空格还是留隙，不属于文本背景形状。此例不授权其他条目绕过源绑定，也不改写厂商实译日语。
