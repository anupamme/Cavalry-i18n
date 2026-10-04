/**
 * [INPUT]: 绑定root批准的Cavalry 2.8 meshShape完整官方source/notes/角色、厂商日语/DNT身份与修订译值。
 * [OUTPUT]: 构建期提供26个source-bound显示键及zh-Hans/zh-Hant/ja_JP决策文本，不将reason写入显示包。
 * [POS]: languages/native的meshShape完整owner投影；沿approved_modules显式装配到producer，不改模型/算法，也不证明部署或live。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 根审批源绑定显示输入；仅经显式清单装配，不证明部署或live ------------
const provenance = {
  "cavalryVersion": "2.8.0",
  "qtVersion": "6.9.2",
  "bundleIdentifier": "com.scenegroup.cavalry",
  "catalogPath": "Definitions/Translation/nodeStrings_en-GB.source.json",
  "catalogId": "Definitions/Translation/nodeStrings",
  "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
  "vendorJapanesePath": "Definitions/Translation/nodeStrings_ja-JP.translation.json",
  "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439",
  "officialTargetManifestSha256": "b6c6c6de1145035dc5ead1f21daf27d405de79fb70f430ecc828f6d09522be84",
  "candidateCaptureSha256": "66f97bbcca18f83f589146e7bc1674fd4b013d71d0769650d882ff8f7aff09de",
  "sourceJsonSha256": "a4feaf0b0634fe5ce694d0b3818ead1e6958cf2961edf3d2ca10457cffcae3b8",
  "sourcePairsSha256": "133bc53ccbad695353b38f2970e36caefbae2411c8ba2818cca15f97d97f845a",
  "sourceIdentityAndNotesSha256": "b6af1dc1e821711574509a938ef6d67fc46ed121f8bd849ff7b7bd52a33763a5",
  "sourceKeysSha256": "4ef4d9e99ea38bc8a067d063ea61c79b0c1c43436ea70680c8646155bd606851",
  "ownerSourcePairsSha256": "538559c2b2d1b7990903647ad51657f8e50cea3886196e1598229bc4b03d9d94",
  "ownerIdentityAndNotesSha256": "e2db47c4f9bd99c914d88a7caeba10da6bec6e0d7a2dead53fcc004cdcb0d9c7",
  "keysetSha256": "75cff6e277e4d12b9668cd542f4b8f52b3e8c5dd0302e4a2719791ee7fdfcb42",
  "translationDecisionsSha256": "cd988164901413f6655431d9c72b13ecf3c0bc32017589d0a3b0a4cce42fcee0",
  "owner": "meshShape",
  "keyCount": 26,
  "decisionSlotCount": 78,
  "ownerDecisionCounts": {
    "zh-Hans": {
      "translate": 26,
      "preserve": 0
    },
    "zh-Hant": {
      "translate": 26,
      "preserve": 0
    },
    "ja_JP": {
      "translate": 26,
      "preserve": 0
    }
  },
  "sourceApprovalSha256": "283fb4b5f4d5c0a6e31228bedf660071aab82d76fc52226f582130db219823f7",
  "rootAdjudicationSha256": "74b6691ef83ea32ce952903f341c69733738563b76e85ec47080ce6586e4bfe8",
  "rootAdjudicationTraceSupplementSha256": "852deae0c71a2186c976f16b4e396a144f1b7318fe5d0552d0e86be83f5005b9",
  "rootRevisedCandidateSha256": "38d0265a02de36b3a9a0be86ee23cd81a8594491f0671d0f61971e2041e53cf3",
  "approvedBy": "primary-agent",
  "approvedAt": "2026-10-03T17:53:44.580359+00:00",
  "approvalState": "approved-source-bound-display-input",
  "approvalKind": "source-bound display input only; no deployment/live approval",
  "registryState": "registered-source-bound-display-input",
  "candidateAuthor": "delegated GPT-6 Luna Max agent; no AGY/Grok output used for this 152-key batch",
  "candidateProvider": "delegated Codex agent",
  "candidateModel": "gpt-6-luna",
  "candidateReasoningEffort": "max",
  "providerEndTurnMetadataObserved": false,
  "independentFullReviewCount": 2,
  "independentFullReviewSlotsPerReviewer": 456,
  "independentFullReviewReceipts": [
    {
      "reviewer": "GPT-6 Luna Max native full review",
      "sha256": "02127b3a3dbd7302d3a0e5957aa91f78687d31aa7e98b7db7226945d614a67b5"
    },
    {
      "reviewer": "GPT-6 Luna Max OpenType full review",
      "sha256": "c321ccb7e02594dc0a0acb8273fb13e0e97fe37077b36ab715a0df2d8cf61738"
    }
  ],
  "deltaReviewCount": 2,
  "deltaReviewScope": {
    "changedLocaleSlots": 18,
    "changedDisplaySlots": 15,
    "reasonOnlySlots": 3,
    "unchangedLocaleSlots": 438,
    "revisedFormatPasses": 456,
    "sharedBlendLocalePairs": 54
  },
  "deltaReviewReceipts": [
    {
      "reviewer": "GPT-6 Luna Max native delta review",
      "sha256": "24de5f669d565483c5a470c84385cfd9bf53e0e08e3bcc4d752047b7b4755372"
    },
    {
      "reviewer": "GPT-6 Luna Max OpenType delta review",
      "sha256": "e643c6ce211ff6ac29a5d0e357922f95d2ca4f9acdbaecd39d4d04ee41aa3c06"
    }
  ],
  "traceSupplementReviewReceiptSha256": "23869c1b2273479f5302365d51105781b18cdd2f42be700fdd489da46083d166",
  "preserveKeys": [],
  "officialDntCount": 0,
  "technicalPreserveRationale": "No owner-specific preserve decisions.",
  "liveVerified": false,
  "live": "NOT_RUN",
  "publicRelease": "NOT_APPROVED"
};
const entries = [
  {"key":"attrInfo:meshShape.bottomLeftOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","bottomLeftOffset","tooltip"],"source":"Set a position offset for the Shape’s bottom left corner.","notes":["As in \"a position offset for the corner\" — offset here is a displacement in 2D space."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Set a position offset for the Shape’s bottom left corner.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"设置形状左下角的位置偏移。"},"zh-Hant":{"decision":"translate","text":"設定形狀左下角的位置偏移。"},"ja_JP":{"decision":"translate","text":"シェイプの左下隅の位置オフセットを設定します。"}}},
  {"key":"attrInfo:meshShape.bottomRightOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","bottomRightOffset","tooltip"],"source":"Set a position offset for the Shape’s bottom right corner.","notes":["As in \"a position offset for the corner\" — offset here is a displacement in 2D space."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Set a position offset for the Shape’s bottom right corner.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"设置形状右下角的位置偏移。"},"zh-Hant":{"decision":"translate","text":"設定形狀右下角的位置偏移。"},"ja_JP":{"decision":"translate","text":"シェイプの右下隅の位置オフセットを設定します。"}}},
  {"key":"attrInfo:meshShape.mesh","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","mesh","tooltip"],"source":"When checked, the Shape is converted to a mesh and so can be deformed by adding vertices with the Mesh tool.","notes":["As in \"adding vertices with the Mesh tool\" — vertices are the individual points of the mesh grid that can be moved to deform the shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"When checked, the Shape is converted to a mesh and so can be deformed by adding vertices with the Mesh tool.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用后，形状会转换为网格，可用网格工具添加顶点进行变形。"},"zh-Hant":{"decision":"translate","text":"啟用後，形狀會轉換為網格，可用網格工具新增頂點進行變形。"},"ja_JP":{"decision":"translate","text":"オンにすると、シェイプがメッシュに変換され、メッシュツールで頂点を追加して変形できるようになります。"}}},
  {"key":"attrInfo:meshShape.meshControllerFalloffs","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshControllerFalloffs","tooltip"],"source":"Add Falloffs which can be used to affect groups of vertices.","notes":["A Falloff gradually varies the strength of an effect across a group of vertices."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Add Falloffs which can be used to affect groups of vertices.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"添加衰减效果，用于影响成组顶点。"},"zh-Hant":{"decision":"translate","text":"新增衰減效果，用於影響成組頂點。"},"ja_JP":{"decision":"translate","text":"フォールオフを追加し、頂点のグループに作用させます。"}}},
  {"key":"attrInfo:meshShape.meshVertex","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex","tooltip"],"source":"Open a popover window containing a list of the mesh vertices.","notes":["As in \"open a popover window\" — a small overlay panel that appears above the current view."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Open a popover window containing a list of the mesh vertices.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"打开弹出面板，查看网格顶点列表。"},"zh-Hant":{"decision":"translate","text":"開啟彈出面板，檢視網格頂點清單。"},"ja_JP":{"decision":"translate","text":"ポップオーバーを開き、メッシュ頂点の一覧を表示します。"}}},
  {"key":"attrInfo:meshShape.meshVertex.bindPosition","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex.bindPosition","tooltip"],"source":"Set the starting position for the vertex.","notes":["As in \"the starting position for the vertex\" — the vertex’s original, undeformed location before any offset is applied."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Set the starting position for the vertex.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"设置顶点的起始位置。"},"zh-Hant":{"decision":"translate","text":"設定頂點的起始位置。"},"ja_JP":{"decision":"translate","text":"頂点の開始位置を設定します。"}}},
  {"key":"attrInfo:meshShape.meshVertex.offset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex.offset","tooltip"],"source":"Set values to offset the vertex’s position from its Bind Position.","notes":["\"Bind Position\" refers to the vertex’s original, undeformed position (as in a rigging \"bind pose\")."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Set values to offset the vertex’s position from its Bind Position.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"设置顶点相对于绑定位置的偏移值。"},"zh-Hant":{"decision":"translate","text":"設定頂點相對於綁定位置的偏移值。"},"ja_JP":{"decision":"translate","text":"頂点のバインド位置からのオフセット値を設定します。"}}},
  {"key":"attrInfo:meshShape.size","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","size","tooltip"],"source":"Set the size of the Shape.","notes":["As in \"set the size of the Shape\" — the width and height dimensions of this Shape layer."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Set the size of the Shape.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"设置形状的尺寸。"},"zh-Hant":{"decision":"translate","text":"設定形狀的尺寸。"},"ja_JP":{"decision":"translate","text":"シェイプのサイズを設定します。"}}},
  {"key":"attrInfo:meshShape.topLeftOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","topLeftOffset","tooltip"],"source":"Set a position offset for the Shape’s top left corner.","notes":["As in \"a position offset for the corner\" — offset here is a displacement in 2D space."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Set a position offset for the Shape’s top left corner.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"设置形状左上角的位置偏移。"},"zh-Hant":{"decision":"translate","text":"設定形狀左上角的位置偏移。"},"ja_JP":{"decision":"translate","text":"シェイプの左上隅の位置オフセットを設定します。"}}},
  {"key":"attrInfo:meshShape.topRightOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","topRightOffset","tooltip"],"source":"Set a position offset for the Shape’s top right corner.","notes":["As in \"a position offset for the corner\" — offset here is a displacement in 2D space."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Set a position offset for the Shape’s top right corner.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"设置形状右上角的位置偏移。"},"zh-Hant":{"decision":"translate","text":"設定形狀右上角的位置偏移。"},"ja_JP":{"decision":"translate","text":"シェイプの右上隅の位置オフセットを設定します。"}}},
  {"key":"nodeAttr:meshShape.bottomLeftOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","bottomLeftOffset","name"],"source":"Bottom Left Offset","notes":["As in \"the Bottom Left Offset of the shape’s corner\" — Offset means a positional shift/displacement from the default corner position."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Bottom Left Offset","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"左下角偏移"},"zh-Hant":{"decision":"translate","text":"左下角偏移"},"ja_JP":{"decision":"translate","text":"左下オフセット"}}},
  {"key":"nodeAttr:meshShape.bottomRightOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","bottomRightOffset","name"],"source":"Bottom Right Offset","notes":["As in \"the Bottom Right Offset of the shape’s corner\" — Offset means a positional shift/displacement from the default corner position."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Bottom Right Offset","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"右下角偏移"},"zh-Hant":{"decision":"translate","text":"右下角偏移"},"ja_JP":{"decision":"translate","text":"右下オフセット"}}},
  {"key":"nodeAttr:meshShape.mesh","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","mesh","name"],"source":"Mesh","notes":["\"Mesh\" refers to a grid of connected points used to deform a shape."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Mesh","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"网格"},"zh-Hant":{"decision":"translate","text":"網格"},"ja_JP":{"decision":"translate","text":"メッシュ"}}},
  {"key":"nodeAttr:meshShape.meshControllerFalloffs","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshControllerFalloffs","name"],"source":"Controllers","notes":["As in objects that influence/control nearby vertices."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Controllers","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"控制器"},"zh-Hant":{"decision":"translate","text":"控制器"},"ja_JP":{"decision":"translate","text":"コントローラー"}}},
  {"key":"nodeAttr:meshShape.meshVertex","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex","name"],"source":"Vertices","notes":["As in \"the Vertices of the mesh\" — the individual movable points of the mesh grid."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Vertices","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"顶点"},"zh-Hant":{"decision":"translate","text":"頂點"},"ja_JP":{"decision":"translate","text":"頂点"}}},
  {"key":"nodeAttr:meshShape.meshVertex.bindPath","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex.bindPath"],"source":"Offset Path","notes":["As in \"the Offset Path of a vertex\" — a path (curve) used to move the vertex."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Offset Path","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"偏移路径"},"zh-Hant":{"decision":"translate","text":"偏移路徑"},"ja_JP":{"decision":"translate","text":"オフセットパス"}}},
  {"key":"nodeAttr:meshShape.meshVertex.bindPosition","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex.bindPosition","name"],"source":"Bind Position","notes":["\"Bind\" is used as an adjective here, describing the vertex’s original, undeformed position (as in a rigging \"bind pose\")."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Bind Position","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"绑定位置"},"zh-Hant":{"decision":"translate","text":"綁定位置"},"ja_JP":{"decision":"translate","text":"バインド位置"}}},
  {"key":"nodeAttr:meshShape.meshVertex.offset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex.offset","name"],"source":"Offset Position","notes":["As in \"the Offset Position of a vertex\" — how far this vertex has moved from its starting position."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Offset Position","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"偏移位置"},"zh-Hant":{"decision":"translate","text":"偏移位置"},"ja_JP":{"decision":"translate","text":"オフセット位置"}}},
  {"key":"nodeAttr:meshShape.meshVertex.offsetPath","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","meshVertex.offsetPath"],"source":"Bind Path","notes":["\"Bind\" is used as an adjective here, describing the vertex’s original, undeformed position (as in a rigging \"bind pose\")."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Bind Path","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"绑定路径"},"zh-Hant":{"decision":"translate","text":"綁定路徑"},"ja_JP":{"decision":"translate","text":"バインドパス"}}},
  {"key":"nodeAttr:meshShape.resolution","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","resolution"],"source":"Size","notes":["\"Size\" here refers to the number of grid subdivisions (rows and columns) in the mesh."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Size","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"网格细分数"},"zh-Hant":{"decision":"translate","text":"網格細分數"},"ja_JP":{"decision":"translate","text":"メッシュ分割数"}}},
  {"key":"nodeAttr:meshShape.size","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","size","name"],"source":"Size","notes":["As in \"set the Size of the Mesh Shape\" — the overall width and height dimensions."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Size","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"尺寸"},"zh-Hant":{"decision":"translate","text":"尺寸"},"ja_JP":{"decision":"translate","text":"サイズ"}}},
  {"key":"nodeAttr:meshShape.topLeftOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","topLeftOffset","name"],"source":"Top Left Offset","notes":["As in \"the Top Left Offset of the shape’s corner\" — Offset means a positional shift/displacement from the default corner position."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Top Left Offset","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"左上角偏移"},"zh-Hant":{"decision":"translate","text":"左上角偏移"},"ja_JP":{"decision":"translate","text":"左上オフセット"}}},
  {"key":"nodeAttr:meshShape.topRightOffset","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["attributes","topRightOffset","name"],"source":"Top Right Offset","notes":["As in \"the Top Right Offset of the shape’s corner\" — Offset means a positional shift/displacement from the default corner position."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Top Right Offset","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"右上角偏移"},"zh-Hant":{"decision":"translate","text":"右上角偏移"},"ja_JP":{"decision":"translate","text":"右上オフセット"}}},
  {"key":"nodeInfo:meshShape","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["info","tooltip"],"source":"Use the Mesh Tool in combination with this Shape to warp images and shaders.","notes":["As in \"warp images and shaders\" — warp means to distort/bend the visual content by moving mesh points."],"sourceRole":"node-info","displayRole":"node-info","dontTranslate":false,"vendorJapanese":"Use the Mesh Tool in combination with this Shape to warp images and shaders.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"结合此形状使用网格工具，可使图像和着色器变形。"},"zh-Hant":{"decision":"translate","text":"結合此形狀使用網格工具，可使影像和著色器變形。"},"ja_JP":{"decision":"translate","text":"このシェイプとメッシュツールを組み合わせて、画像やシェーダーを変形します。"}}},
  {"key":"nodeName:meshShape","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["info","name"],"source":"Mesh Shape","notes":["As in \"a Mesh Shape you can warp with the Mesh tool\" — Mesh is a grid of connected points used to deform the shape."],"sourceRole":"node-name","displayRole":"node-name","dontTranslate":false,"vendorJapanese":"Mesh Shape","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"网格形状"},"zh-Hant":{"decision":"translate","text":"網格形狀"},"ja_JP":{"decision":"translate","text":"メッシュシェイプ"}}},
  {"key":"nodeTab:meshShape.mesh","catalogId":"Definitions/Translation/nodeStrings","owner":"meshShape","fieldPath":["tabs","mesh"],"source":"Mesh","notes":["\"Mesh\" refers to a grid of connected points used to deform a shape."],"sourceRole":"tab-label","displayRole":"tab-label","dontTranslate":false,"vendorJapanese":"Mesh","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"网格"},"zh-Hant":{"decision":"translate","text":"網格"},"ja_JP":{"decision":"translate","text":"メッシュ"}}},
];
module.exports = { provenance, entries };
