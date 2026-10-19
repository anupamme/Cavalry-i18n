/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的bevel完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供15个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的bevel完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 审定显示输入显式注册；审批谱系不进入运行时strings包 ----------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "bundleIdentifier": "com.scenegroup.cavalry",
    "catalogPath": "Definitions/Translation/nodeStrings_en-GB.source.json",
    "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
    "vendorJapanesePath": "Definitions/Translation/nodeStrings_ja-JP.translation.json",
    "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439",
    "officialTargetManifestSha256": "b6c6c6de1145035dc5ead1f21daf27d405de79fb70f430ecc828f6d09522be84",
    "officialSourcePairLedgerSha256": "7bb4ebbffc4a9f2c89f3e0202cc7901bfa8a9e39a57fc2ab3448305d83f8ea31",
    "sourcePairsSha256": "dec72a4e3e365983784fb2ea5901e2d48673c5ebe6fa88f68b8d900325d49cb1",
    "sourceIdentityAndNotesSha256": "f2aaf9526803b397df484f499acf3948245df4d7182fe7caca24b264d20c47c7",
    "keysetSha256": "50a5aab36367b7e37c4166de2b814bec6854113543c6492542672cd12dd3e158",
    "translationDecisionsSha256": "bb49e98a7fe749307f2941207e06048b96617e99aacbd41412ae36aca214491b",
    "owner": "bevel",
    "keyCount": 15,
    "decisionSlotCount": 45,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 15,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 15,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 15,
        "preserve": 0
      }
    },
    "quotaFallback": true,
    "draftProvider": "Grok CLI",
    "draftTerminalResultObserved": false,
    "revisionProvider": "GPT-6 Luna Max",
    "draftBaseSha256": "908cb38c71d499241efc3d27af118d96cb2d31e381d164b66e42b2ba23f085e1",
    "draftBaseTerminalClaim": false,
    "independentReviewProvider": "GPT-6 Luna Max",
    "independentFullReviewCount": 2,
    "independentReviewStatus": "two completed full-scope Luna Max reviews recorded in root approval lineage",
    "supplementaryReviewProvider": "AGY CLI",
    "supplementaryReviewStatus": "not-yet-captured; not used as a passed gate",
    "approvedBy": "primary-agent",
    "approvalKind": "source-bound display input only",
    "approvalArtifactSha256": "b6330d7113e0140f9766025882c66049f9e0b2550a2185447c3fa8c806abb589",
    "approvalReceiptSha256": "6b9669a3367e7f33a5444cc0e2f7ccbd908c2e5b5741965979d8403e17a75aee",
    "approvedAt": "2026-10-03T13:09:38.748Z",
    "registryState": "registered-source-bound-display-input",
    "approvalState": "approved-source-bound-display-input",
    "scope": "Explicitly registered root-approved source-bound display input; supplementary AGY review was pending at approval and was not used as a passed gate. This metadata does not prove packaging, deployment or live UI."
  },
  entries: [
    {
      "key": "attrInfo:bevel.maxAngle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","maxAngle","tooltip"],
      "source": "Only bevel corners with an interior angle less than this value (in degrees).", "notes": ["\"bevel\" is used as a verb here (to round off)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Only bevel corners with an interior angle less than this value (in degrees).", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"仅对内角小于此值（度）的拐角进行倒角。"},"zh-Hant":{"decision":"translate","text":"僅對內角小於此值（度）的拐角進行倒角。"},"ja_JP":{"decision":"translate","text":"内角がこの値（度）より小さい角だけをベベルします。"}}
    },
    {
      "key": "attrInfo:bevel.minAngle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","minAngle","tooltip"],
      "source": "Only bevel corners with an interior angle greater than this value (in degrees).", "notes": ["\"bevel\" is used as a verb here (to apply the corner-rounding effect)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Only bevel corners with an interior angle greater than this value (in degrees).", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"仅对内角大于此值（度）的拐角进行倒角。"},"zh-Hant":{"decision":"translate","text":"僅對內角大於此值（度）的拐角進行倒角。"},"ja_JP":{"decision":"translate","text":"内角がこの値（度）より大きい角だけをベベルします。"}}
    },
    {
      "key": "attrInfo:bevel.radiusMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","radiusMode","tooltip"],
      "source": "When Radius has an input, this dictates how the radius is then calculated.", "notes": ["\"Radius\" here refers to the bevel’s corner-rounding distance."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When Radius has an input, this dictates how the radius is then calculated.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"当半径有输入时，此项决定随后如何计算半径。"},"zh-Hant":{"decision":"translate","text":"當半徑有輸入時，此項決定隨後如何計算半徑。"},"ja_JP":{"decision":"translate","text":"半径に入力がある場合、その後の半径の計算方法を指定します。"}}
    },
    {
      "key": "nodeAttr:bevel.curveToEndPoints", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","curveToEndPoints"],
      "source": "Curve To End Points", "notes": ["\"End Points\" are the two open ends of an unclosed path; \"Curve\" is a verb here (curving in towards them)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Curve To End Points", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"弯向端点"},"zh-Hant":{"decision":"translate","text":"彎向端點"},"ja_JP":{"decision":"translate","text":"端点へカーブ"}}
    },
    {
      "key": "nodeAttr:bevel.maxAngle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","maxAngle","name"],
      "source": "Max Angle", "notes": ["\"Angle\" here means the interior angle at a corner (in degrees)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Max Angle", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"最大角度"},"zh-Hant":{"decision":"translate","text":"最大角度"},"ja_JP":{"decision":"translate","text":"最大角度"}}
    },
    {
      "key": "nodeAttr:bevel.minAngle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","minAngle","name"],
      "source": "Min Angle", "notes": ["\"Angle\" here means the interior angle at a corner (in degrees)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Min Angle", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"最小角度"},"zh-Hant":{"decision":"translate","text":"最小角度"},"ja_JP":{"decision":"translate","text":"最小角度"}}
    },
    {
      "key": "nodeAttr:bevel.mode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","mode"],
      "source": "Mode", "notes": ["As in \"Bevel Mode\" — selects which bevelling algorithm/style is applied."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"模式"},"zh-Hant":{"decision":"translate","text":"模式"},"ja_JP":{"decision":"translate","text":"モード"}}
    },
    {
      "key": "nodeAttr:bevel.radius", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","radius"],
      "source": "Radius", "notes": ["As in \"set the bevel Radius in pixels\" — the rounding distance applied to each corner."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Radius", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"半径"},"zh-Hant":{"decision":"translate","text":"半徑"},"ja_JP":{"decision":"translate","text":"半径"}}
    },
    {
      "key": "nodeAttr:bevel.radiusMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["attributes","radiusMode","name"],
      "source": "Radius Mode", "notes": ["As in \"Radius Mode\" — chooses how the bevel Radius value is interpreted (e.g. absolute vs. relative)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Radius Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"半径模式"},"zh-Hant":{"decision":"translate","text":"半徑模式"},"ja_JP":{"decision":"translate","text":"半径モード"}}
    },
    {
      "key": "nodeAttrEnum:bevel.mode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["enums","mode","0"],
      "source": "Fillet", "notes": ["\"Fillet\" is a rounded corner join, a technical term."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Fillet", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"圆角"},"zh-Hant":{"decision":"translate","text":"圓角"},"ja_JP":{"decision":"translate","text":"フィレット"}}
    },
    {
      "key": "nodeAttrEnum:bevel.mode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["enums","mode","1"],
      "source": "Chamfer", "notes": ["\"Chamfer\" is a flat, angled corner join, a technical term."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Chamfer", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"切角"},"zh-Hant":{"decision":"translate","text":"切角"},"ja_JP":{"decision":"translate","text":"面取り"}}
    },
    {
      "key": "nodeAttrEnum:bevel.radiusMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["enums","radiusMode","0"],
      "source": "Per Sub-Mesh", "notes": ["\"Sub-Mesh\" refers to one of several separate sub-shapes that together make up a single compound shape."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Per Sub-Mesh", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"按子网格"},"zh-Hant":{"decision":"translate","text":"依子網格"},"ja_JP":{"decision":"translate","text":"サブメッシュごと"}}
    },
    {
      "key": "nodeAttrEnum:bevel.radiusMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["enums","radiusMode","1"],
      "source": "Per Point", "notes": ["\"Point\" refers to an individual vertex/anchor point along a shape’s path."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Per Point", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"按点"},"zh-Hant":{"decision":"translate","text":"依點"},"ja_JP":{"decision":"translate","text":"ポイントごと"}}
    },
    {
      "key": "nodeInfo:bevel", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["info","tooltip"],
      "source": "A deformer to create round or mitred edges.", "notes": ["\"Mitred\" describes a corner cut at a sharp angle."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "A deformer to create round or mitred edges.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"用于生成圆角或斜切边缘的变形器。"},"zh-Hant":{"decision":"translate","text":"用於建立圓角或斜切邊緣的變形器。"},"ja_JP":{"decision":"translate","text":"丸めたエッジ、または斜めに切ったエッジを作るデフォーマ。"}}
    },
    {
      "key": "nodeName:bevel", "catalogId": "Definitions/Translation/nodeStrings", "owner": "bevel", "fieldPath": ["info","name"],
      "source": "Bevel", "notes": ["\"Bevel\" refers to cutting or rounding off a sharp corner into a flat or curved edge."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Bevel", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"倒角"},"zh-Hant":{"decision":"translate","text":"倒角"},"ja_JP":{"decision":"translate","text":"ベベル"}}
    },
  ],
};
