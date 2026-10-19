/**
 * [INPUT]: 依赖官方 2.8 app/node 显示源、CUA 定位的漏项、AGY/宝玉 Skill 初稿与 Grok 独立审校
 * [OUTPUT]: 提供 42 个 app 键和 drawable 不透明度的三语源绑定审定输入
 * [POS]: languages/native 的已观测 UI 补译域；只投影工具/菜单/辅助控件，保留九个 DNT、MSAA 及模型输入，不代表现场覆盖已验收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 现场显示漏项按真实键归属，不扩大为模型或用户文本翻译 ----------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "catalogs": {
      "appStrings": {
        "sourcePath": "Definitions/Translation/appStrings_en-GB.source.json",
        "sourceSha256": "464f0d291cd7aac46dba9552ab08debf4302cbd36b7b8d9d49f692085004e82e",
        "vendorJapanesePath": "Definitions/Translation/appStrings_ja-JP.translation.json",
        "vendorJapaneseSha256": "4ecb6baf0196edaac4524bf9fbd12f4f082311239c89e9d6602770bd063d58dc"
      },
      "nodeStrings": {
        "sourcePath": "Definitions/Translation/nodeStrings_en-GB.source.json",
        "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
        "vendorJapanesePath": "Definitions/Translation/nodeStrings_ja-JP.translation.json",
        "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439"
      }
    },
    "sourcePairsSha256": "0bc8ae20ad1d868f58660fb15b0a152850346643fdb0ced622f33b49c8d9ac4e",
    "sourceIdentitySha256": "eeaa1613dbde8b6fcf4af7fa0a9dc9bf3cf29bf3013dc93ca76ad86aaff56efa",
    "officialCatalogPairs": 17,
    "jsonFilesPerLocale": 38,
    "tsEntriesPerLocale": {
      "zh-Hans": 3892,
      "zh-Hant": 3817,
      "ja_JP": 3819
    },
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "draftModel": "gemini-3.8-flash-high",
    "draftExecutionMode": "accept-edits",
    "independentReviewProvider": "Grok CLI",
    "revisionProvider": "primary-agent",
    "approvedBy": "primary-agent",
    "reviewScope": "All 43 source-bound keys and three locale values; actual Grok end_turn and primary revision. The original CUA observation found these missing; this dataset does not prove their live deployment."
  },
  entries: [
    { key: "attributeEditor.font.auto", source: "Auto",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["attributeEditor.font.auto"],
      dontTranslate: false, notes: ["Dropdown option label; lets the app automatically choose a value (e.g. line spacing) rather than a fixed one."], translations: {"zh-Hans":{"decision":"translate","text":"自动"},"zh-Hant":{"decision":"translate","text":"自動"},"ja_JP":{"decision":"translate","text":"自動"}}
    },
    { key: "attributeEditor.font.generator", source: "Generator",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["attributeEditor.font.generator"],
      dontTranslate: false, notes: ["Label; refers to a node/tool that generates text."], translations: {"zh-Hans":{"decision":"translate","text":"生成器"},"zh-Hant":{"decision":"translate","text":"生成器"},"ja_JP":{"decision":"translate","text":"ジェネレーター"}}
    },
    { key: "attributeEditor.font.glyphs", source: "Glyphs",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["attributeEditor.font.glyphs"],
      dontTranslate: false, notes: ["Label; typography term for character shapes."], translations: {"zh-Hans":{"decision":"translate","text":"字形"},"zh-Hant":{"decision":"translate","text":"字形"},"ja_JP":{"decision":"translate","text":"グリフ"}}
    },
    { key: "attributeEditor.font.openType", source: "OpenType",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["attributeEditor.font.openType"],
      dontTranslate: true, notes: ["Label; refers to the OpenType font format."], translations: {"zh-Hans":{"decision":"preserve","text":"OpenType"},"zh-Hant":{"decision":"preserve","text":"OpenType"},"ja_JP":{"decision":"preserve","text":"OpenType"}}
    },
    { key: "attributeEditor.font.reset", source: "Reset",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["attributeEditor.font.reset"],
      dontTranslate: false, notes: ["Button label; resets font styling/variation settings back to their defaults."], translations: {"zh-Hans":{"decision":"translate","text":"重置"},"zh-Hant":{"decision":"translate","text":"重設"},"ja_JP":{"decision":"translate","text":"リセット"}}
    },
    { key: "attributeEditor.input.placeholder.dragShape", source: "Drag in a Shape layer",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["attributeEditor.input.placeholder.dragShape"],
      dontTranslate: false, notes: ["Placeholder text; \"Shape\" is a layer type in the app (a vector shape layer)."], translations: {"zh-Hans":{"decision":"translate","text":"拖入形状图层"},"zh-Hant":{"decision":"translate","text":"拖入形狀圖層"},"ja_JP":{"decision":"translate","text":"シェイプレイヤーをドラッグ"}}
    },
    { key: "attributeEditor.input.placeholder.noConnection", source: "No Connection",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["attributeEditor.input.placeholder.noConnection"],
      dontTranslate: false, notes: ["Placeholder/status text for an input slot with nothing connected."], translations: {"zh-Hans":{"decision":"translate","text":"无连接"},"zh-Hant":{"decision":"translate","text":"無連接"},"ja_JP":{"decision":"translate","text":"接続なし"}}
    },
    { key: "nodeAttr:drawable.opacity", source: "Opacity",
      catalogId: "Definitions/Translation/nodeStrings", fieldPath: ["attributes","opacity","name"], owner: "drawable",
      dontTranslate: false, notes: ["As in \"set the Shape’s Opacity\" -- how transparent or solid it appears."], translations: {"zh-Hans":{"decision":"translate","text":"不透明度"},"zh-Hant":{"decision":"translate","text":"不透明度"},"ja_JP":{"decision":"translate","text":"不透明度"}}
    },
    { key: "playback.zoom.10", source: "10%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.10"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"10%"},"zh-Hant":{"decision":"preserve","text":"10%"},"ja_JP":{"decision":"preserve","text":"10%"}}
    },
    { key: "playback.zoom.100", source: "100%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.100"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"100%"},"zh-Hant":{"decision":"preserve","text":"100%"},"ja_JP":{"decision":"preserve","text":"100%"}}
    },
    { key: "playback.zoom.200", source: "200%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.200"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"200%"},"zh-Hant":{"decision":"preserve","text":"200%"},"ja_JP":{"decision":"preserve","text":"200%"}}
    },
    { key: "playback.zoom.25", source: "25%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.25"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"25%"},"zh-Hant":{"decision":"preserve","text":"25%"},"ja_JP":{"decision":"preserve","text":"25%"}}
    },
    { key: "playback.zoom.400", source: "400%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.400"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"400%"},"zh-Hant":{"decision":"preserve","text":"400%"},"ja_JP":{"decision":"preserve","text":"400%"}}
    },
    { key: "playback.zoom.50", source: "50%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.50"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"50%"},"zh-Hant":{"decision":"preserve","text":"50%"},"ja_JP":{"decision":"preserve","text":"50%"}}
    },
    { key: "playback.zoom.75", source: "75%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.75"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"75%"},"zh-Hant":{"decision":"preserve","text":"75%"},"ja_JP":{"decision":"preserve","text":"75%"}}
    },
    { key: "playback.zoom.800", source: "800%",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["playback.zoom.800"],
      dontTranslate: true, notes: ["Preset viewport zoom-level option (a percentage)."], translations: {"zh-Hans":{"decision":"preserve","text":"800%"},"zh-Hant":{"decision":"preserve","text":"800%"},"ja_JP":{"decision":"preserve","text":"800%"}}
    },
    { key: "shapeMenu.menu.reverseContour", source: "Reverse Contours",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["shapeMenu.menu.reverseContour"],
      dontTranslate: false, notes: ["Context-menu item reversing the point order of path contours. ‘Contour’ here is a geometry term for a closed/open path outline, not a verb."], translations: {"zh-Hans":{"decision":"translate","text":"反转轮廓"},"zh-Hant":{"decision":"translate","text":"反轉輪廓"},"ja_JP":{"decision":"translate","text":"輪郭を反転"}}
    },
    { key: "shapeMenu.menu.setFirstPoint", source: "Set First Point",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["shapeMenu.menu.setFirstPoint"],
      dontTranslate: false, notes: ["Context-menu item setting which point on a path is treated as the starting point."], translations: {"zh-Hans":{"decision":"translate","text":"设为第一点"},"zh-Hant":{"decision":"translate","text":"設為第一點"},"ja_JP":{"decision":"translate","text":"最初のポイントに設定"}}
    },
    { key: "tool.arc.name", source: "Arc",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.arc.name"],
      dontTranslate: false, notes: ["Short name of the Arc tool, which draws an arc (a curved segment of a circle) Shape; used standalone, e.g. in a status bar."], translations: {"zh-Hans":{"decision":"translate","text":"圆弧"},"zh-Hant":{"decision":"translate","text":"圓弧"},"ja_JP":{"decision":"translate","text":"円弧"}}
    },
    { key: "tool.arrow.name", source: "Arrow",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.arrow.name"],
      dontTranslate: false, notes: ["Short name of the Arrow tool, which draws an arrow Shape (a line with an arrowhead)."], translations: {"zh-Hans":{"decision":"translate","text":"箭头"},"zh-Hant":{"decision":"translate","text":"箭頭"},"ja_JP":{"decision":"translate","text":"矢印"}}
    },
    { key: "tool.camera.name", source: "Camera",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.camera.name"],
      dontTranslate: false, notes: ["Short name of the Camera tool, which manipulates the 3D viewport camera (dolly, orbit and track)."], translations: {"zh-Hans":{"decision":"translate","text":"相机"},"zh-Hant":{"decision":"translate","text":"攝影機"},"ja_JP":{"decision":"translate","text":"カメラ"}}
    },
    { key: "tool.capsule.name", source: "Capsule",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.capsule.name"],
      dontTranslate: false, notes: ["Short name of the Capsule (a rectangle with rounded/semicircular ends) drawing tool."], translations: {"zh-Hans":{"decision":"translate","text":"胶囊"},"zh-Hant":{"decision":"translate","text":"膠囊"},"ja_JP":{"decision":"translate","text":"カプセル"}}
    },
    { key: "tool.cogwheel.name", source: "Cogwheel",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.cogwheel.name"],
      dontTranslate: false, notes: ["Short name of the Cogwheel (gear shape) drawing tool."], translations: {"zh-Hans":{"decision":"translate","text":"齿轮"},"zh-Hant":{"decision":"translate","text":"齒輪"},"ja_JP":{"decision":"translate","text":"歯車"}}
    },
    { key: "tool.editShape.name", source: "Edit Shape",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.editShape.name"],
      dontTranslate: false, notes: ["Short name of the Edit Shape tool (edits a Shape’s points/curves)."], translations: {"zh-Hans":{"decision":"translate","text":"编辑形状"},"zh-Hant":{"decision":"translate","text":"編輯形狀"},"ja_JP":{"decision":"translate","text":"シェイプを編集"}}
    },
    { key: "tool.ellipse.name", source: "Ellipse",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.ellipse.name"],
      dontTranslate: false, notes: ["Short name of the Ellipse tool, which draws an ellipse Shape."], translations: {"zh-Hans":{"decision":"translate","text":"椭圆"},"zh-Hant":{"decision":"translate","text":"橢圓"},"ja_JP":{"decision":"translate","text":"楕円"}}
    },
    { key: "tool.line.name", source: "Line",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.line.name"],
      dontTranslate: false, notes: ["Short name of the Line tool, which draws a straight-line Shape."], translations: {"zh-Hans":{"decision":"translate","text":"直线"},"zh-Hant":{"decision":"translate","text":"直線"},"ja_JP":{"decision":"translate","text":"線"}}
    },
    { key: "tool.mesh.name", source: "Mesh",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.mesh.name"],
      dontTranslate: false, notes: ["Short name of the Mesh tool, which creates and edits PolyMesh geometry (vertices, edges and binds)."], translations: {"zh-Hans":{"decision":"translate","text":"网格"},"zh-Hant":{"decision":"translate","text":"網格"},"ja_JP":{"decision":"translate","text":"メッシュ"}}
    },
    { key: "tool.pen.name", source: "Pen",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.pen.name"],
      dontTranslate: false, notes: ["Short name of the Pen tool (Bézier drawing tool)."], translations: {"zh-Hans":{"decision":"translate","text":"钢笔"},"zh-Hant":{"decision":"translate","text":"鋼筆"},"ja_JP":{"decision":"translate","text":"ペン"}}
    },
    { key: "tool.pencil.name", source: "Pencil",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.pencil.name"],
      dontTranslate: false, notes: ["Short name of the Pencil tool, which draws freehand Shapes by sketching directly."], translations: {"zh-Hans":{"decision":"translate","text":"铅笔"},"zh-Hant":{"decision":"translate","text":"鉛筆"},"ja_JP":{"decision":"translate","text":"鉛筆"}}
    },
    { key: "tool.pivot.name", source: "Pivot",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.pivot.name"],
      dontTranslate: false, notes: ["Short name of the Pivot tool (repositions a Layer’s pivot/anchor point)."], translations: {"zh-Hans":{"decision":"translate","text":"锚点"},"zh-Hant":{"decision":"translate","text":"錨點"},"ja_JP":{"decision":"translate","text":"ピボット"}}
    },
    { key: "tool.polygon.name", source: "Polygon",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.polygon.name"],
      dontTranslate: false, notes: ["Short name of the Polygon tool, which draws a regular polygon Shape."], translations: {"zh-Hans":{"decision":"translate","text":"多边形"},"zh-Hant":{"decision":"translate","text":"多邊形"},"ja_JP":{"decision":"translate","text":"多角形"}}
    },
    { key: "tool.rectangle.name", source: "Rectangle",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.rectangle.name"],
      dontTranslate: false, notes: ["Short name of the Rectangle tool, which draws a rectangle Shape."], translations: {"zh-Hans":{"decision":"translate","text":"矩形"},"zh-Hant":{"decision":"translate","text":"矩形"},"ja_JP":{"decision":"translate","text":"長方形"}}
    },
    { key: "tool.select.name", source: "Select",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.select.name"],
      dontTranslate: false, notes: ["Short name of the Select tool (for selecting layers/points in the viewport, not a settings dropdown)."], translations: {"zh-Hans":{"decision":"translate","text":"选择"},"zh-Hant":{"decision":"translate","text":"選取"},"ja_JP":{"decision":"translate","text":"選択"}}
    },
    { key: "tool.star.name", source: "Star",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.star.name"],
      dontTranslate: false, notes: ["Short name of the Star tool, which draws a star Shape."], translations: {"zh-Hans":{"decision":"translate","text":"星形"},"zh-Hant":{"decision":"translate","text":"星形"},"ja_JP":{"decision":"translate","text":"星形"}}
    },
    { key: "tool.strokeWidth.name", source: "Stroke Width",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.strokeWidth.name"],
      dontTranslate: false, notes: ["Short name of the Stroke Width tool, which adjusts a Shape’s stroke width along its length."], translations: {"zh-Hans":{"decision":"translate","text":"描边宽度"},"zh-Hant":{"decision":"translate","text":"描邊寬度"},"ja_JP":{"decision":"translate","text":"ストローク幅"}}
    },
    { key: "tool.superEllipse.name", source: "Super Ellipse",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.superEllipse.name"],
      dontTranslate: false, notes: ["Short name of the \"Super Ellipse\" shape tool (a shape with adjustable corner rounding; a proper feature name)."], translations: {"zh-Hans":{"decision":"translate","text":"超级椭圆"},"zh-Hant":{"decision":"translate","text":"超級橢圓"},"ja_JP":{"decision":"translate","text":"スーパー楕円"}}
    },
    { key: "tool.superShape.name", source: "Super Shape",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.superShape.name"],
      dontTranslate: false, notes: ["Short name of the \"Super Shape\" tool (a parametric multi-lobed shape; a proper feature name)."], translations: {"zh-Hans":{"decision":"translate","text":"超级形状"},"zh-Hant":{"decision":"translate","text":"超級形狀"},"ja_JP":{"decision":"translate","text":"スーパーシェイプ"}}
    },
    { key: "tool.text.name", source: "Text",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.text.name"],
      dontTranslate: false, notes: ["Short name of the Text tool, which creates and edits Text layers."], translations: {"zh-Hans":{"decision":"translate","text":"文字"},"zh-Hant":{"decision":"translate","text":"文字"},"ja_JP":{"decision":"translate","text":"テキスト"}}
    },
    { key: "tool.tracking.name", source: "Tracking",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["tool.tracking.name"],
      dontTranslate: false, notes: ["Short name of the Tracking tool (motion tracking)."], translations: {"zh-Hans":{"decision":"translate","text":"跟踪"},"zh-Hant":{"decision":"translate","text":"追蹤"},"ja_JP":{"decision":"translate","text":"トラッキング"}}
    },
    { key: "viewport.settings.antiAliasing.auto", source: "Auto (Recommended)",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["viewport.settings.antiAliasing.auto"],
      dontTranslate: false, notes: ["Anti-aliasing option"], translations: {"zh-Hans":{"decision":"translate","text":"自动（推荐）"},"zh-Hant":{"decision":"translate","text":"自動（建議）"},"ja_JP":{"decision":"translate","text":"自動（推奨）"}}
    },
    { key: "viewport.settings.antiAliasing.msaa", source: "Enhanced (MSAA)",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["viewport.settings.antiAliasing.msaa"],
      dontTranslate: false, notes: ["Anti-aliasing option; multisample anti-aliasing. \"MSAA\" should usually remain untranslated."], translations: {"zh-Hans":{"decision":"translate","text":"增强 (MSAA)"},"zh-Hant":{"decision":"translate","text":"增強 (MSAA)"},"ja_JP":{"decision":"translate","text":"強化 (MSAA)"}}
    },
    { key: "viewport.settings.antiAliasing.standard", source: "Standard",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["viewport.settings.antiAliasing.standard"],
      dontTranslate: false, notes: ["Anti-aliasing option; Normal."], translations: {"zh-Hans":{"decision":"translate","text":"标准"},"zh-Hant":{"decision":"translate","text":"標準"},"ja_JP":{"decision":"translate","text":"標準"}}
    },
    { key: "zoomMenu.menu.zoom", source: "Zoom",
      catalogId: "Definitions/Translation/appStrings", fieldPath: ["zoomMenu.menu.zoom"],
      dontTranslate: false, notes: ["Menu heading for zoom-level options, such as preset percentage values."], translations: {"zh-Hans":{"decision":"translate","text":"缩放"},"zh-Hant":{"decision":"translate","text":"縮放"},"ja_JP":{"decision":"translate","text":"ズーム"}}
    },
  ]
};
