/**
 * [INPUT]: 绑定root批准的Cavalry 2.8 meshDistribution完整官方source/notes/角色、厂商日语/DNT身份与修订译值。
 * [OUTPUT]: 构建期提供26个source-bound显示键及zh-Hans/zh-Hant/ja_JP决策文本，不将reason写入显示包。
 * [POS]: languages/native的meshDistribution完整owner投影；沿approved_modules显式装配到producer，不改模型/算法，也不证明部署或live。
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
  "ownerSourcePairsSha256": "178f30a580c4edc68faaff994d58501054d2edd43d5a3fb839a28c39d43a7ea1",
  "ownerIdentityAndNotesSha256": "f5c5f6871af5a477931c7105131bc64d3466a72b4d5c240f3215d957b053c6c1",
  "keysetSha256": "92294d813bdf62a759f60dab223d6fcc0dd1e41e51474acb51501fef328d7ae8",
  "translationDecisionsSha256": "893caf759e2167576df7d9bda2c2aff0057427306ba16af01fd9259e1661df1b",
  "owner": "meshDistribution",
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
  {"key":"attrInfo:meshDistribution.count","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","count","tooltip"],"source":"Maximum number of sub-meshes used. Ignored when Fill All is on.","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Maximum number of sub-meshes used. Ignored when Fill All is on.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"使用的子网格最大数量。启用“全部使用”时，此设置会被忽略。"},"zh-Hant":{"decision":"translate","text":"使用的子網格最大數量。啟用「全部使用」時，此設定會被忽略。"},"ja_JP":{"decision":"translate","text":"使用するサブメッシュの最大数です。「すべて使用」がオンの場合、この設定は無視されます。"}}},
  {"key":"attrInfo:meshDistribution.fill","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","fill","tooltip"],"source":"Use every sub-mesh on the input, regardless of Count.","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Use every sub-mesh on the input, regardless of Count.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"使用输入中的每个子网格，不受“数量”设置限制。"},"zh-Hant":{"decision":"translate","text":"使用輸入中的每個子網格，不受「數量」設定限制。"},"ja_JP":{"decision":"translate","text":"入力に含まれるすべてのサブメッシュを使用します。「数」の設定は適用されません。"}}},
  {"key":"attrInfo:meshDistribution.ignoreEmptySubMeshes","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","ignoreEmptySubMeshes","tooltip"],"source":"Skip sub-meshes that have no geometry rather than emitting a point at their position.","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Skip sub-meshes that have no geometry rather than emitting a point at their position.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"跳过没有几何体的子网格，而不是在其位置生成点。"},"zh-Hant":{"decision":"translate","text":"略過沒有幾何體的子網格，而不是在其位置產生點。"},"ja_JP":{"decision":"translate","text":"ジオメトリのないサブメッシュはスキップし、その位置にポイントを生成しません。"}}},
  {"key":"attrInfo:meshDistribution.inputShape","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","inputShape","tooltip"],"source":"Shape whose sub-meshes provide the point positions. Each sub-mesh contributes one point at its centre.","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Shape whose sub-meshes provide the point positions. Each sub-mesh contributes one point at its centre.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"提供点位置的形状。每个子网格都对应一个位于其中心的点。"},"zh-Hant":{"decision":"translate","text":"提供點位置的形狀。每個子網格都對應一個位於其中心的點。"},"ja_JP":{"decision":"translate","text":"ポイント位置の基準となるシェイプです。各サブメッシュの中心にポイントを1つ配置します。"}}},
  {"key":"attrInfo:meshDistribution.keepAspectRatio","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","keepAspectRatio","tooltip"],"source":"When Scale To Fit is on, lock the per-point scale’s X and Y to the same value (using the smaller axis) so duplicates are not stretched.","notes":["\"Scale\" refers to the per-point resizing factor (its X and Y components)."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"When Scale To Fit is on, lock the per-point scale’s X and Y to the same value (using the smaller axis) so duplicates are not stretched.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用“缩放以适合”时，每个点的 X、Y 缩放分量取两者中较小的值并设为相同值，避免副本被拉伸。"},"zh-Hant":{"decision":"translate","text":"啟用「縮放以符合」時，每個點的 X、Y 縮放分量取兩者中較小的值並設為相同值，避免副本被拉伸。"},"ja_JP":{"decision":"translate","text":"「サイズに合わせてスケール」がオンの場合、各ポイントの X と Y のスケール成分を、X と Y のうち小さい方の値に揃え、複製形状が引き伸ばされないようにします。"}}},
  {"key":"attrInfo:meshDistribution.level","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","level","tooltip"],"source":"Nesting level to sample when Level Mode is Custom. 0 is the root mesh; deeper levels are nested sub-meshes.","notes":["A sub-mesh is a nested mesh object — a self-contained piece of geometry — within a larger Shape; the \"root mesh\" is the top-level one this nests inside."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Nesting level to sample when Level Mode is Custom. 0 is the root mesh; deeper levels are nested sub-meshes.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"“层级模式”设为“自定义”时要采样的嵌套层级。0 表示根网格，更深层级表示嵌套子网格。"},"zh-Hant":{"decision":"translate","text":"「層級模式」設為「自訂」時要取樣的巢狀層級。0 表示根網格，更深層級表示巢狀子網格。"},"ja_JP":{"decision":"translate","text":"「レベルモード」が「カスタム」のときにサンプリングするネスト階層です。0はルートメッシュ、それより深いレベルはネストされたサブメッシュを示します。"}}},
  {"key":"attrInfo:meshDistribution.levelMode","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","levelMode","tooltip"],"source":"Which nesting level to sample sub-meshes from: Custom (use Custom Level), or Text Lines/Words/Characters.","notes":["A sub-mesh is a nested mesh object — a self-contained piece of geometry — within a larger Shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Which nesting level to sample sub-meshes from: Custom (use Custom Level), or Text Lines/Words/Characters.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"选择从哪个嵌套层级采样子网格：“自定义”（使用“自定义层级”），或按文本行、词、字符分组。"},"zh-Hant":{"decision":"translate","text":"選擇從哪個巢狀層級取樣子網格：「自訂」（使用「自訂層級」），或依文字行、詞、字元分組。"},"ja_JP":{"decision":"translate","text":"サブメッシュをサンプリングするネスト階層を選択します。「カスタム」（「カスタムレベル」を使用）、またはテキストの行・単語・文字単位で選択します。"}}},
  {"key":"attrInfo:meshDistribution.scaleMultiplier","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","scaleMultiplier","tooltip"],"source":"Multiplier applied to the Scale To Fit output.","notes":["\"Scale\" here is the resizing factor produced by the Scale To Fit option."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Multiplier applied to the Scale To Fit output.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"应用于“缩放以适合”输出值的倍数。"},"zh-Hant":{"decision":"translate","text":"套用至「縮放以符合」輸出值的倍數。"},"ja_JP":{"decision":"translate","text":"「サイズに合わせてスケール」の出力値に適用する倍率です。"}}},
  {"key":"attrInfo:meshDistribution.scaleToFit","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","scaleToFit","tooltip"],"source":"When on, also output a per-point scale that matches the source sub-mesh’s bounding-box size, so duplicates can be sized to fit each cell.","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape. \"Bounding box\" is the smallest rectangle that fully encloses a shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"When on, also output a per-point scale that matches the source sub-mesh’s bounding-box size, so duplicates can be sized to fit each cell.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用后，还会输出逐点缩放值，使其匹配源子网格的边界框大小，从而让副本适合各单元格。"},"zh-Hant":{"decision":"translate","text":"啟用後，也會輸出逐點縮放值，使其符合來源子網格的邊界框大小，讓複製形狀適配各儲存格。"},"ja_JP":{"decision":"translate","text":"オンにすると、ソースのサブメッシュのバウンディングボックスの大きさに合わせたポイントごとのスケールも出力し、複製形状を各セルに収められます。"}}},
  {"key":"attrInfo:meshDistribution.useLevels","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","useLevels","tooltip"],"source":"When on, restrict sampling to the chosen Level Mode/Level. When off, sample every sub-mesh in the hierarchy.","notes":["A sub-mesh is a nested mesh object — a self-contained piece of geometry — within a larger Shape."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"When on, restrict sampling to the chosen Level Mode/Level. When off, sample every sub-mesh in the hierarchy.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用时，仅从所选“层级模式/层级”采样；关闭时，采样层级结构中的所有子网格。"},"zh-Hant":{"decision":"translate","text":"啟用時，只從所選的「層級模式／層級」取樣；關閉時，取樣層級結構中的所有子網格。"},"ja_JP":{"decision":"translate","text":"オンにすると、選択した「レベルモード／レベル」だけをサンプリングします。オフにすると、階層内のすべてのサブメッシュをサンプリングします。"}}},
  {"key":"nodeAttr:meshDistribution.count","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","count","name"],"source":"Count","notes":["As in \"set the Count of points to distribute across the mesh\" — a quantity."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Count","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"数量"},"zh-Hant":{"decision":"translate","text":"數量"},"ja_JP":{"decision":"translate","text":"数"}}},
  {"key":"nodeAttr:meshDistribution.fill","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","fill","name"],"source":"Fill All","notes":["\"Fill\" means use/include everything available."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Fill All","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"全部使用"},"zh-Hant":{"decision":"translate","text":"全部使用"},"ja_JP":{"decision":"translate","text":"すべて使用"}}},
  {"key":"nodeAttr:meshDistribution.ignoreEmptySubMeshes","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","ignoreEmptySubMeshes","name"],"source":"Ignore Empty Sub-Meshes","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Ignore Empty Sub-Meshes","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"忽略空子网格"},"zh-Hant":{"decision":"translate","text":"忽略空子網格"},"ja_JP":{"decision":"translate","text":"空のサブメッシュを無視"}}},
  {"key":"nodeAttr:meshDistribution.inputShape","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","inputShape","name"],"source":"Input Shape","notes":["As in \"choose the Input Shape to distribute points across\" — the source shape/mesh."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Input Shape","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"输入形状"},"zh-Hant":{"decision":"translate","text":"輸入形狀"},"ja_JP":{"decision":"translate","text":"入力シェイプ"}}},
  {"key":"nodeAttr:meshDistribution.keepAspectRatio","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","keepAspectRatio","name"],"source":"Keep Aspect Ratio","notes":["As in \"Keep Aspect Ratio so shapes are not stretched\" — preserve the width-to-height proportion."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Keep Aspect Ratio","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"保持纵横比"},"zh-Hant":{"decision":"translate","text":"保持長寬比"},"ja_JP":{"decision":"translate","text":"縦横比を維持"}}},
  {"key":"nodeAttr:meshDistribution.level","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","level","name"],"source":"Custom Level","notes":["\"Level\" here means a nesting depth within the Shape’s hierarchy."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Custom Level","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"自定义层级"},"zh-Hant":{"decision":"translate","text":"自訂層級"},"ja_JP":{"decision":"translate","text":"カスタムレベル"}}},
  {"key":"nodeAttr:meshDistribution.levelMode","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","levelMode","name"],"source":"Level Mode","notes":["\"Level\" here means a nesting depth within the Shape’s hierarchy (how deeply nested a sub-mesh is)."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Level Mode","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"层级模式"},"zh-Hant":{"decision":"translate","text":"層級模式"},"ja_JP":{"decision":"translate","text":"レベルモード"}}},
  {"key":"nodeAttr:meshDistribution.scaleMultiplier","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","scaleMultiplier","name"],"source":"Scale Multiplier","notes":["\"Scale\" here means a resizing factor."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Scale Multiplier","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"缩放倍数"},"zh-Hant":{"decision":"translate","text":"縮放倍率"},"ja_JP":{"decision":"translate","text":"スケール倍率"}}},
  {"key":"nodeAttr:meshDistribution.scaleToFit","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","scaleToFit","name"],"source":"Scale To Fit","notes":["As in \"turn on Scale To Fit\" — resize duplicates so they fill the target area."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Scale To Fit","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"缩放以适合"},"zh-Hant":{"decision":"translate","text":"縮放以符合"},"ja_JP":{"decision":"translate","text":"サイズに合わせてスケール"}}},
  {"key":"nodeAttr:meshDistribution.useLevels","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["attributes","useLevels","name"],"source":"Use Levels","notes":["\"Levels\" here means nesting depths within the Shape’s hierarchy."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Use Levels","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"使用层级"},"zh-Hant":{"decision":"translate","text":"使用層級"},"ja_JP":{"decision":"translate","text":"レベルを使用"}}},
  {"key":"nodeAttrEnum:meshDistribution.levelMode.0","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["enums","levelMode","0"],"source":"Custom...","notes":["As in \"a Custom level\" — a user-defined grouping level. Ellipsis indicates it opens further options."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Custom...","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"自定义..."},"zh-Hant":{"decision":"translate","text":"自訂..."},"ja_JP":{"decision":"translate","text":"カスタム..."}}},
  {"key":"nodeAttrEnum:meshDistribution.levelMode.1","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["enums","levelMode","1"],"source":"Text (Lines)","notes":["\"Lines\" means lines of text (as in a paragraph)."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Text (Lines)","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"文本（行）"},"zh-Hant":{"decision":"translate","text":"文字（行）"},"ja_JP":{"decision":"translate","text":"テキスト（行）"}}},
  {"key":"nodeAttrEnum:meshDistribution.levelMode.2","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["enums","levelMode","2"],"source":"Text (Words)","notes":["\"Words\" means individual words of text, the unit the distribution groups by."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Text (Words)","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"文本（词）"},"zh-Hant":{"decision":"translate","text":"文字（詞）"},"ja_JP":{"decision":"translate","text":"テキスト（単語）"}}},
  {"key":"nodeAttrEnum:meshDistribution.levelMode.3","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["enums","levelMode","3"],"source":"Text (Characters)","notes":["\"Characters\" means individual text characters/glyphs."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Text (Characters)","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"文本（字符）"},"zh-Hant":{"decision":"translate","text":"文字（字元）"},"ja_JP":{"decision":"translate","text":"テキスト（文字）"}}},
  {"key":"nodeInfo:meshDistribution","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["info","tooltip"],"source":"Distribute points onto the positions of child-meshes.","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape."],"sourceRole":"node-info","displayRole":"node-info","dontTranslate":false,"vendorJapanese":"Distribute points onto the positions of child-meshes.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"将点分布到子网格所在的位置。"},"zh-Hant":{"decision":"translate","text":"將點分布到子網格所在的位置。"},"ja_JP":{"decision":"translate","text":"サブメッシュの位置にポイントを配置します。"}}},
  {"key":"nodeName:meshDistribution","catalogId":"Definitions/Translation/nodeStrings","owner":"meshDistribution","fieldPath":["info","name"],"source":"Sub-Mesh","notes":["\"Mesh\" refers to a shape’s underlying geometric data (its points and faces); a \"sub-mesh\" is one such mesh nested inside a larger Shape."],"sourceRole":"node-name","displayRole":"node-name","dontTranslate":false,"vendorJapanese":"Sub-Mesh","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"子网格"},"zh-Hant":{"decision":"translate","text":"子網格"},"ja_JP":{"decision":"translate","text":"サブメッシュ"}}},
];
module.exports = { provenance, entries };
