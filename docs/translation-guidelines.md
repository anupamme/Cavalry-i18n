<!--
[INPUT]: 依赖 Cavalry 运行时 source、行业软件既有术语、cavalry-glossary.md 与各语言 UI 书写惯例
[OUTPUT]: 提供三语功能语境/保留词、空区域提示标点、caption准入与行为证据分离、厂商日语有限源绑定纠错、demo DNT显示例外、字体/模型/API身份保护与Add Layer显示/检索分离契约
[POS]: docs 的翻译政策入口，被 TS/JSON 资源、生成表、质量门与人工审校共同消费
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# 翻译原则

## 空区域提示：按语言保留末尾标点

空场景、面板和连接槽的短提示，简体、繁体和日文不加末尾句号。
英文原文不动。有限键合同锁定适用提示与三语生产投影。
不扩到文本输入框、tooltip、帮助正文、错误消息或多句说明。
运行时不裁剪标点。

## 字体选择：业务值不是界面文案

字体族名称与字体样式名称是字体查找的业务值，必须保留字体系统提供的原文；即使 `Regular`、`Bold`、`Black`、`Medium` 或某个字体族名称命中翻译词典，也不能改写输入值或下拉选项。字段标签、说明和占位提示可以独立翻译。

JSON 节点定义中的 `type: "font"` 同样属于这个边界：其 `default` 是字体查找参数，不是显示文案，必须与英文基线完整一致（包括字体族、样式及后续新增的身份参数）。保护控件不能修复已经被翻译的默认数据；两条入口必须分别验收。

`QSignalBlocker` 只阻断信号，不能让 `setText()` 成为无副作用的显示投影；`DisplayRole` 也不天然独立于 `EditRole`、`currentText()` 或业务查找。不能仅凭“未改 UserRole / currentIndex”认定字体选择安全。

当前选择保留原始字体名称，不增加字体译名展示机制。未来若显示“粗体”等译名，必须先建立独立显示层，保证底层查找与提交仍使用 `Bold` 等原始值，并验证选择、编辑、失焦和重绘均不污染原值；不得以通用文本替换模拟这种分离。

### 选择输入值回归

跨平台接线合同随 `npm run test:contracts` 执行；Windows Qt 行为测试随原生 CTest 执行。macOS 可显式运行：

```bash
npm run test:injector:selection:macos -- "$CAVALRY_QT_PREFIX" \
  "/path/to/Cavalry.app/Contents/Frameworks"
```

该 fixture 直调生产翻译入口，只读链接 vendor `libskia.dylib`，使用同一套 Qt 6.6.3 SDK 与 offscreen plugin；不启动或修改 Cavalry，也不能替代真实字体选择/渲染验收。

## Add Layer：查询、检索依据、显示与身份各有职责

以下是实现和验收契约，不以规则文档代替真实平台验收。

- **查询是用户数据**：任何词、大小写、部分输入、中文/日文输入及清空都不得触发文案替换；占位提示不属于查询，可以翻译。禁止临时写入英文再恢复本地文字。交互补全编辑器即使尚未建立窗口父链也必须保护已有输入；精确 owner 校验用于挂接搜索适配器，不能成为输入保护的前提。
- **检索依据属于条目**：每个真实条目通过同一翻译来源获得当前语言别名，并保留英文依据；原厂还检索说明的入口必须同时保留英文与当前语言说明，不能只补名称；名称与说明必须保留各自的原生匹配规则，禁止把整段说明塞入名称模糊索引来扩大误匹配；不按报告中的几个关键词特判，不为匹配样例创造隐藏节点或唯一映射。
- **Unicode 不能丢失**：非空查询不能因 ASCII-only 清理而变成空查询、误匹配全部条目。规范化及过滤应保留当前语言字符，空查询与未命中查询必须区别对待。
- **显示不承担命令身份**：结果标题显示当前语言；创建、回车、拖拽与保存继续使用原始命令/节点身份，不能改 JSON niceName、tags 或 nodeType。Qt role 名称不能代替对其真实消费者的核实。
- **入口行为一致不等于实现相同**：右侧面板与弹窗须分别确认 owner、模型、过滤和绘制路径；共享已证明的策略，不把某个入口的模型假设套到另一个入口。

验收必须分别证明输入原文保持、正确命中/未命中、显示翻译、分类/排序/清空及创建身份。报告中的词仅作回归样例；还须覆盖其他条目、新增词条、别名重合和多语言，不能以少量样例或标准 Qt 模型测试冒充原厂过滤器通过。

## 1. 首要原则：跟行业内已有软件保持一致

Cavalry 是动效/动画软件，用户同时也用 **After Effects、Cinema 4D、Blender、DaVinci Resolve**。这些软件的官方多语言版本已经建立了约定俗成的术语，**必须对齐**，不要自己造词。

### 简体中文参考

| English | 简体中文（AE/C4D 标准） | ❌ 不要翻成 |
|---------|----------------------|------------|
| Position | 位置 | 定位 |
| Rotation | 旋转 | 转动 |
| Scale（几何变换/尺寸操控） | 缩放 | 比例（明确倍率语境另按 owner 判断） |
| Opacity | 不透明度 | 透明度 |
| Keyframe | 关键帧 | 关键格 |
| Easing | 缓动 | 渐变 |
| Composition | 合成 | 组合 |
| Layer | 图层 | 层 |
| Mask | 蒙版 | 遮罩（AE 用蒙版） |
| Stroke | 描边 | 笔画 |
| Fill | 填充 | 填色 |
| Bezier | 贝塞尔 | 贝兹 |
| Viewport | 视口 | 视窗 |
| Deformer | 变形器 | 变形工具 |
| Shader | 着色器 | 渲染器 |
| Render | 渲染 | 绘制 |
| Blending Mode | 混合模式 | 融合模式 |
| Anchor Point / Pivot | 锚点 | 定点 |
| Expression | 表达式 | 公式 |
| Null | 空对象 | 空 |
| Pre-compose | 预合成 | 预组合 |
| Duplicator | 复制器（C4D 用法） | — |

### 日本語参考

| English | 日本語（AE/C4D 標準） | ❌ 使わない |
|---------|---------------------|------------|
| Layer | レイヤー | 層 |
| Keyframe | キーフレーム | — |
| Composition | コンポジション | 構成 |
| Mask | マスク | — |
| Easing | イージング | 緩和 |
| Blending Mode | 描画モード | ブレンドモード |
| Render | レンダリング | 描画 |
| Viewport | ビューポート | — |
| Deformer | デフォーマ | 変形ツール |
| Shader | シェーダー | — |
| Gradient | グラデーション | 傾斜 |
| Opacity | 不透明度 | 透明度 |

> **原则**：日文中外来语术语优先使用カタカナ表记（如 `"Screen Gain"` → `"スクリーンゲイン"`），不要用半翻半留的日英夹杂体（如 `"スクリーンGain"` ❌）。

### 图形软件范围限定：按功能选择术语，不按单词全局替换

Cavalry 同时包含图像合成、矢量几何、动画时序、数值运算、物理模拟与文字排版。审校先读 owner、完整说明及相邻控件，再查现有词表与历史调研；只有证据缺失或冲突时补查成熟软件的一手文档。

- 同词分流见 `cavalry-glossary.md`：数值 Multiply 不用图像「正片叠底」，HSV Value 不当普通「值」，描边 Round 不当数值取整，几何端部不当时间结束。
- Scale 的禁用词只针对几何变换首选，不将明确数值倍率中的「比例」机械判错；历史值归零的 Fade 用衰减，取样全部元素的 Fill All 用全部使用，替换文本的 With 用替换为。精确对象、引用标签及地区词形见词表，不能把范围限定变成新的全局替换。
- Stroke 的项目首选是简中描边、繁中描邊；Adobe 台湾 Illustrator 用筆畫指矢量描边面板与线条。几何语境下的繁中筆畫不能仅凭简中禁词或汉字词源判错，按同 owner 标签统一可列建议；字形笔画与矢量描边仍按具体对象区分。
- 厂商术语须记录产品、版本、地区和具体功能；简繁日不是机械转换，也不能把某地区译名称作所有地区标准。不同成熟软件的同义译词不自动成为必须修改的错误。 例如描边端点的 Projecting：Adobe 简中 After Effects 在相同伸出半线宽的功能中使用“投影”，Illustrator 使用方头端点；应先证功能/对象偏差，不能仅因同字也表示几何投影而判错。详情按词表的分产品、地区来源核对。
- 源说明与实际定义冲突时，先检查正式模块的 `provenance.sourceCorrections` 和已有合同；有证据的历史纠错不能被字面重译推翻。新增纠错同样必须明确记录证据，英语身份保持源绑定。仅有外部标准、尚无目标版本的实际行为证据时，保留 source/notes 并独立登记未决行为问题；按 caption 准入显示词不等于已经证明算法或消除该问题。
- 作者与审稿职责分开，实读、发现、修复与差分验回分开记录；机械格式校验不代表术语或功能语义已经通过。日语合法汉字和繁中地区用法不得仅因字形被误判。
- 模型/API/字体与快捷键身份继续保持原文；厂商日语默认优先，但不是免审。经维护者授权、逐键一手查证和独立验回的确证错译可按下列边界有限纠正，词形偏好不构成改写理由。

### 厂商日语：默认优先，确证错误有限纠正

保留原厂 catalog bytes、`vendorJapanese` 和完整英语 source/notes，不能通过改原始对照使错误消失。纠错只存在于源绑定显示决定的 `ja_JP.vendorCorrection`：绑定 key、catalog、owner、fieldPath、source、notes、dontTranslate 和原日语的 `sourceIdentitySha256`，同时绑定新译的 `translationSha256`、主代理批准状态与批准回执摘要。决定必须精确命中独立的 `languages/native/approved_vendor_corrections.js` 有限登记；生产装配显式加载登记，纯选择API默认空登记，metadata本身不能授权。locale只接收decision/text/可选vendorCorrection，不能重写所属key/source。缺登记/回执不符、语境或新译漂移、其他语种、DNT/API/模型身份均拒绝；没有该精确纠错决定的日语仍采用厂商原值。

审批元数据是受审构建输入的追溯约束，不是签名或任意调用者的授权凭据。只有显式登记、独立复审并由主代理批准的数据才可进入产品 producer；合成测试填入正确字段不代表真实译文已通过查证。

构建期内部 `vendor-corrected` 区分纠错与原样采用，实际语言包仍只输出单语言 `UI-text`。为保持现有 Rust typed manifest 契约，`manifest.packs.ja_JP.vendor` 统计厂商来源槽（含已批有限纠错），不是“全部逐字采用原厂译文”的数量；确切纠错键与新旧值必须另行可核验。不得借纠错增加译键、隐藏缺译或无证据改写其余厂商日语。

## 2. 有些术语不翻译

保持英文原文或英文+中文注释的：
- **专有名词**：Lottie、Bezier、RGB、CMYK、SVG
- **品牌/产品名**：Cavalry、Canva、Excel
- **行业通用缩写**：FPS、BPM、GPU、JSON、CSV
- **约定俗成不翻的**：Alpha（Alpha 通道）、UV

`Forge Dynamics` 在 UI 显示层统一使用本地化术语：简中 `Forge 动力学`、繁中 `Forge 動力學`、日文 `フォージダイナミクス`；但模型数据里的 `niceName` 保持英文，避免 Time Editor 自绘层出现 CJK 渲染问题。

### 原厂 DNT 与 demo 菜单显示例外

构建器默认保留所有 `dontTranslate` 行。显示例外必须显式选择，且必须命中固定的100个官方 demo 叶身份。身份摘要绑定 catalog、键、source、notes、DNT 与厂商日语值。类别键、`demoScene.audio.audioSolver` 和其他 DNT 键不在登记内。

例外必须带三语精确审定值。三种语言都必须选择 `translate`。例外不得携带 `vendorCorrection`。纯投影API默认关闭例外；asset-root生产入口只选择 `languages/native/official_demo_menus.js` 中已批准的100个叶项。例外只投影菜单显示文字，不改官方 DNT、preset 路径、模型名或触发动作。其他 DNT 继续保留。

## 3. 参考资源

| 资源 | 用途 |
|------|------|
| [Microsoft Terminology Search](https://learn.microsoft.com/en-us/globalization/reference/microsoft-terminology) | 查标准 UI 术语翻译（File→文件、Edit→编辑、Undo→撤销） |
| [Microsoft 简体中文风格指南](https://aka.ms/chinese-simplified-styleguide) | 中文本地化的文风、标点、格式规范 |
| [Microsoft 繁体中文风格指南](https://aka.ms/chinese-traditional-styleguide) | 繁体差异（如"打印"vs"列印"） |
| [Microsoft 日语风格指南](https://aka.ms/japanese-styleguide) | 日语翻译规范 |
| **After Effects 中文版** | 动效术语的权威参考 |
| **Blender 翻译项目**（Weblate） | 开源 3D 软件翻译的标杆，有完整术语表 |
| **Cinema 4D 中文版** | 复制器(Duplicator)、变形器(Deformer)等术语来源 |

## 4. 简繁中文差异注意

| English | 简体中文 | 繁體中文 |
|---------|---------|---------|
| File | 文件 | 檔案 |
| Save | 保存 | 儲存 |
| Print | 打印 | 列印 |
| Software | 软件 | 軟體 |
| Default | 默认 | 預設 |
| Video | 视频 | 影片 |
| Program | 程序 | 程式 |
| Information | 信息 | 資訊 |

## 5. 我建议的工作流

```
第一步：建立术语表（glossary）
  ├── 从 AE/C4D/Blender 中文版提取标准术语
  ├── 用 Microsoft Terminology 查 UI 通用术语
  └── 形成 cavalry-glossary.csv（英/简中/繁中/日）

第二步：先翻术语表，再翻全文
  ├── 术语表确认后，作为翻译约束
  └── 全文翻译时严格引用术语表

第三步：AI 辅助 + 人工校对
  ├── 用 AI 批量翻译 JSON（带术语表约束）
  └── 人工校对专业术语和上下文
```

先建一个术语对照表（glossary），这是整个翻译质量的基础。

## 6. 零混合语言原则

翻译产物中，**同一个字符串值内禁止出现目标语言与英文的混合体**。

### 合法形态（仅三种）

| 形态 | 示例 | 说明 |
|---|---|---|
| 纯目标语言 | `"滤色增益"` / `"スクリーンゲイン"` | 完整翻译 |
| 纯英文术语 | `"Alpha"` / `"RGB"` / `"Lottie"` | 术语表中标记为不翻译的 |
| 英文术语 + 空格 + 目标语言 | `"Alpha 偏移"` / `"Alpha バイアス"` | 术语表术语与目标语言词之间必须有空格分隔 |

### 快捷键标记例外

快捷键提示中的物理键位是身份标记，不是待翻译正文。`S`、`X`、`Space`、`Shift`、`Control`、`Alt` 等键名保持厂商原文，只翻译点击、拖动、按住等操作说明；因此 `Space + 单击 + 拖动`、`Space + 按一下 + 拖曳`、`Space + クリック + ドラッグ` 都是合法本地化。不要把单独的 `Space` 翻成“空格”“空白鍵”或“スペース”，也不要把 `クリック`、`ドラッグ` 这类标准日语 UI 外来语退回英文。

### 违规形态（绝对禁止）

| ❌ 错误 | ✅ 正确 | 语言 |
|---|---|---|
| `"滤色Gain"` | `"滤色增益"` | zh-Hans |
| `"Alpha偏移"` | `"Alpha 偏移"` | zh-Hans |
| `"Despill强度"` | `"去溢色强度"` | zh-Hans |
| `"スクリーンSoftness"` | `"スクリーン柔らかさ"` | ja_JP |
| `"シャドウGain"` | `"シャドウゲイン"` | ja_JP |
| `"Despill強度"` | `"デスピル強度"` | ja_JP |

### 遇到不确定的英文术语怎么办？

1. **先查术语表** (`cavalry-glossary.md`)——有对应翻译就用翻译
2. **术语表没有？查 AE/C4D/Blender 中文版**——用行业标准译法
3. **行业内也没有标准译法？完整保留英文**——宁可全英文也不要杂交体
4. **所有语言保持一致策略**——同一个术语，三种语言要么都翻，要么都保留英文；有显示层/模型层分流的术语，以术语表备注为准
