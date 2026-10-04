/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的applyDistribution完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供16个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的applyDistribution完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
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
    "sourcePairsSha256": "e8819571ab6523f408b337f0b37b063549c6da28e368279a820fa87f051622bc",
    "sourceIdentityAndNotesSha256": "fdd6b5895df8b0f07ea3f421c311314178a7807e429008f12eaab8629b0886aa",
    "keysetSha256": "d5708ef0b67c4251f29ba0f940796c818f6a53473b5393c81a09c0b5934166b7",
    "translationDecisionsSha256": "b4660ca7b5ab4ff4b8d2a38a3cac99ad8db5aae47a7aca7f4f1956d2fa3a62bc",
    "owner": "applyDistribution",
    "keyCount": 16,
    "decisionSlotCount": 48,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 16,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 16,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 16,
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
      "key": "attrInfo:applyDistribution.distribution", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","distribution","tooltip"],
      "source": "Determine the layout of the sub-shapes.", "notes": ["\"Distribution\" here means the pattern/arrangement in which sub-shapes are laid out (e.g. grid, spiral)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Determine the layout of the sub-shapes.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"确定子形状的排列方式。"},"zh-Hant":{"decision":"translate","text":"確定子形狀的排列方式。"},"ja_JP":{"decision":"translate","text":"サブシェイプの配置方法を決めます。"}}
    },
    {
      "key": "attrInfo:applyDistribution.hcenter", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","hcenter","tooltip"],
      "source": "Offset each sub-mesh by half its bounding-box width so the distribution’s points land at sub-mesh centres rather than their left edges.", "notes": ["\"Bounding-box\" is the smallest rectangle enclosing a shape, a geometry term."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Offset each sub-mesh by half its bounding-box width so the distribution’s points land at sub-mesh centres rather than their left edges.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"将每个子网格偏移其边界框宽度的一半，使分布的点落在子网格中心，而不是左边缘。"},"zh-Hant":{"decision":"translate","text":"將每個子網格偏移其邊界框寬度的一半，使分佈的點落在子網格中心，而不是左緣。"},"ja_JP":{"decision":"translate","text":"各サブメッシュを境界ボックスの幅の半分だけオフセットし、分布のポイントが左端ではなくサブメッシュの中心に来るようにします。"}}
    },
    {
      "key": "attrInfo:applyDistribution.level", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","level","tooltip"],
      "source": "Nesting level the distribution acts on when Level Mode is Custom. 0 is the root mesh; deeper levels are nested sub-meshes.", "notes": ["\"Root mesh\" is the top-level shape geometry before any nested children."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Nesting level the distribution acts on when Level Mode is Custom. 0 is the root mesh; deeper levels are nested sub-meshes.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"层级模式为自定义时，分布所作用的嵌套层级。0 为根网格，更深的层级为嵌套子网格。"},"zh-Hant":{"decision":"translate","text":"層級模式為自訂時，分佈所作用的巢狀層級。0 為根網格，更深的層級為巢狀子網格。"},"ja_JP":{"decision":"translate","text":"レベルモードがカスタムのとき、分布が作用するネストレベルです。0 はルートメッシュ、それより深いレベルはネストしたサブメッシュです。"}}
    },
    {
      "key": "attrInfo:applyDistribution.levelMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","levelMode","tooltip"],
      "source": "Which nesting level the distribution lays out: Custom (use Custom Level), or Text Lines/Words/Characters.", "notes": ["\"Nesting level\" refers to depth within a shape’s hierarchy of child-meshes."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Which nesting level the distribution lays out: Custom (use Custom Level), or Text Lines/Words/Characters.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"分布所排列的嵌套层级：自定义（使用自定义层级），或文本（行）、文本（词）、文本（字符）。"},"zh-Hant":{"decision":"translate","text":"分佈所排列的巢狀層級：自訂（使用自訂層級），或文字（行）、文字（詞）、文字（字元）。"},"ja_JP":{"decision":"translate","text":"分布が配置するネストレベルを選びます。カスタム（カスタムレベルを使用）、またはテキスト（行）、テキスト（単語）、テキスト（文字）です。"}}
    },
    {
      "key": "attrInfo:applyDistribution.vcenter", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","vcenter","tooltip"],
      "source": "Offset each sub-mesh by half its bounding-box height so the distribution’s points land at sub-mesh centres rather than their bottom edges.", "notes": ["\"Bounding-box\" is the smallest rectangle enclosing a shape, a geometry term."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Offset each sub-mesh by half its bounding-box height so the distribution’s points land at sub-mesh centres rather than their bottom edges.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"将每个子网格偏移其边界框高度的一半，使分布的点落在子网格中心，而不是底边缘。"},"zh-Hant":{"decision":"translate","text":"將每個子網格偏移其邊界框高度的一半，使分佈的點落在子網格中心，而不是底緣。"},"ja_JP":{"decision":"translate","text":"各サブメッシュを境界ボックスの高さの半分だけオフセットし、分布のポイントが下端ではなくサブメッシュの中心に来るようにします。"}}
    },
    {
      "key": "nodeAttr:applyDistribution.distribution", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","distribution","name"],
      "source": "Distribution", "notes": ["\"Distribution\" is a noun: the pattern used to lay out copies (e.g. a grid or circle)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Distribution", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"分布"},"zh-Hant":{"decision":"translate","text":"分佈"},"ja_JP":{"decision":"translate","text":"分布"}}
    },
    {
      "key": "nodeAttr:applyDistribution.hcenter", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","hcenter","name"],
      "source": "Horizontal Centre", "notes": ["As in \"Horizontal Centre\" — aligning sub-shapes to the middle along the horizontal axis."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Horizontal Centre", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"水平居中"},"zh-Hant":{"decision":"translate","text":"水平置中"},"ja_JP":{"decision":"translate","text":"水平中央"}}
    },
    {
      "key": "nodeAttr:applyDistribution.level", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","level","name"],
      "source": "Custom Level", "notes": ["\"Level\" refers to a tier in the shape’s internal nesting hierarchy."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Custom Level", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"自定义层级"},"zh-Hant":{"decision":"translate","text":"自訂層級"},"ja_JP":{"decision":"translate","text":"カスタムレベル"}}
    },
    {
      "key": "nodeAttr:applyDistribution.levelMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","levelMode","name"],
      "source": "Level Mode", "notes": ["\"Nesting level\" refers to a tier of the shape’s internal hierarchy."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Level Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"层级模式"},"zh-Hant":{"decision":"translate","text":"層級模式"},"ja_JP":{"decision":"translate","text":"レベルモード"}}
    },
    {
      "key": "nodeAttr:applyDistribution.vcenter", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["attributes","vcenter","name"],
      "source": "Vertical Centre", "notes": ["As in \"Vertical Centre\" — aligning sub-shapes to the middle along the vertical axis."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Vertical Centre", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"垂直居中"},"zh-Hant":{"decision":"translate","text":"垂直置中"},"ja_JP":{"decision":"translate","text":"垂直中央"}}
    },
    {
      "key": "nodeAttrEnum:applyDistribution.levelMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["enums","levelMode","0"],
      "source": "Custom...", "notes": ["The ellipsis indicates this option reveals a custom level setting."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Custom...", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"自定义..."},"zh-Hant":{"decision":"translate","text":"自訂..."},"ja_JP":{"decision":"translate","text":"カスタム..."}}
    },
    {
      "key": "nodeAttrEnum:applyDistribution.levelMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["enums","levelMode","1"],
      "source": "Text (Lines)", "notes": ["Groups by each line of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Lines)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（行）"},"zh-Hant":{"decision":"translate","text":"文字（行）"},"ja_JP":{"decision":"translate","text":"テキスト（行）"}}
    },
    {
      "key": "nodeAttrEnum:applyDistribution.levelMode.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["enums","levelMode","2"],
      "source": "Text (Words)", "notes": ["Groups by each word of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Words)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（词）"},"zh-Hant":{"decision":"translate","text":"文字（詞）"},"ja_JP":{"decision":"translate","text":"テキスト（単語）"}}
    },
    {
      "key": "nodeAttrEnum:applyDistribution.levelMode.3", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["enums","levelMode","3"],
      "source": "Text (Characters)", "notes": ["Groups by each individual character of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Characters)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（字符）"},"zh-Hant":{"decision":"translate","text":"文字（字元）"},"ja_JP":{"decision":"translate","text":"テキスト（文字）"}}
    },
    {
      "key": "nodeInfo:applyDistribution", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["info","tooltip"],
      "source": "Apply a Distribution to the Sub-Meshes on a Shape.", "notes": ["\"Distribution\" refers to the pattern used to lay out repeated copies of geometry; \"Sub-Meshes\" refers to nested/repeated pieces of geometry within a Shape."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Apply a Distribution to the Sub-Meshes on a Shape.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"将分布应用到形状上的子网格。"},"zh-Hant":{"decision":"translate","text":"將分佈套用到形狀上的子網格。"},"ja_JP":{"decision":"translate","text":"シェイプ上のサブメッシュに分布を適用します。"}}
    },
    {
      "key": "nodeName:applyDistribution", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyDistribution", "fieldPath": ["info","name"],
      "source": "Apply Distribution", "notes": ["\"Distribution\" refers to the pattern used to lay out repeated copies of geometry, such as a grid or circle."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Apply Distribution", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"应用分布"},"zh-Hant":{"decision":"translate","text":"套用分佈"},"ja_JP":{"decision":"translate","text":"分布を適用"}}
    },
  ],
};
