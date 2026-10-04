/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的countSubMeshes完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供10个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的countSubMeshes完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
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
    "sourcePairsSha256": "f6b19ac0be57335c16f4391bf72f1c6bfe599a543db3644bea5f4e82ee475f9c",
    "sourceIdentityAndNotesSha256": "46c1ec15e8053f2a446e36a246e2b98f31fb4c9f54ed962e447f1341dfb177da",
    "keysetSha256": "dc8a75802ee47c649c0b9c6242a5a66d06e024b9f5f96b162d6b11f1106a3108",
    "translationDecisionsSha256": "baf1eeb30ab595aa7b00a39ab4dad96608705c3727668b9cbb6b54022b2b4762",
    "owner": "countSubMeshes",
    "keyCount": 10,
    "decisionSlotCount": 30,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 10,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 10,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 10,
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
      "key": "nodeAttr:countSubMeshes.count", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["attributes","count"],
      "source": "Count", "notes": ["\"Count\" is a noun: the number of Sub-Meshes found."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Count", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"数量"},"zh-Hant":{"decision":"translate","text":"數量"},"ja_JP":{"decision":"translate","text":"個数"}}
    },
    {
      "key": "nodeAttr:countSubMeshes.inputShape", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["attributes","inputShape"],
      "source": "Input Shape", "notes": ["As in \"connect the Input Shape\" — the shape this node reads from."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Input Shape", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"输入形状"},"zh-Hant":{"decision":"translate","text":"輸入形狀"},"ja_JP":{"decision":"translate","text":"入力シェイプ"}}
    },
    {
      "key": "nodeAttr:countSubMeshes.level", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["attributes","level"],
      "source": "Custom Level", "notes": ["\"Level\" refers to a tier in the shape’s internal nesting hierarchy."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Custom Level", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"自定义层级"},"zh-Hant":{"decision":"translate","text":"自訂層級"},"ja_JP":{"decision":"translate","text":"カスタムレベル"}}
    },
    {
      "key": "nodeAttr:countSubMeshes.levelMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["attributes","levelMode"],
      "source": "Level Mode", "notes": ["\"Level\" here refers to a hierarchy tier within the shape’s internal structure."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Level Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"层级模式"},"zh-Hant":{"decision":"translate","text":"層級模式"},"ja_JP":{"decision":"translate","text":"レベルモード"}}
    },
    {
      "key": "nodeAttrEnum:countSubMeshes.levelMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["enums","levelMode","0"],
      "source": "Custom...", "notes": ["The ellipsis indicates this option reveals a custom level setting."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Custom...", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"自定义..."},"zh-Hant":{"decision":"translate","text":"自訂..."},"ja_JP":{"decision":"translate","text":"カスタム..."}}
    },
    {
      "key": "nodeAttrEnum:countSubMeshes.levelMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["enums","levelMode","1"],
      "source": "Text (Lines)", "notes": ["Groups by each line of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Lines)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（行）"},"zh-Hant":{"decision":"translate","text":"文字（行）"},"ja_JP":{"decision":"translate","text":"テキスト（行）"}}
    },
    {
      "key": "nodeAttrEnum:countSubMeshes.levelMode.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["enums","levelMode","2"],
      "source": "Text (Words)", "notes": ["Groups by each word of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Words)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（词）"},"zh-Hant":{"decision":"translate","text":"文字（詞）"},"ja_JP":{"decision":"translate","text":"テキスト（単語）"}}
    },
    {
      "key": "nodeAttrEnum:countSubMeshes.levelMode.3", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["enums","levelMode","3"],
      "source": "Text (Characters)", "notes": ["Groups by each individual character of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Characters)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（字符）"},"zh-Hant":{"decision":"translate","text":"文字（字元）"},"ja_JP":{"decision":"translate","text":"テキスト（文字）"}}
    },
    {
      "key": "nodeInfo:countSubMeshes", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["info","tooltip"],
      "source": "Count the number of Sub-Meshes at a given level.", "notes": ["\"Sub-Meshes\" refers to nested/repeated pieces of geometry within a Shape."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Count the number of Sub-Meshes at a given level.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"计数指定层级上的子网格数量。"},"zh-Hant":{"decision":"translate","text":"計數指定層級上的子網格數量。"},"ja_JP":{"decision":"translate","text":"指定レベルのサブメッシュ数を数えます。"}}
    },
    {
      "key": "nodeName:countSubMeshes", "catalogId": "Definitions/Translation/nodeStrings", "owner": "countSubMeshes", "fieldPath": ["info","name"],
      "source": "Count Sub-Meshes", "notes": ["\"Sub-Meshes\" refers to nested/repeated pieces of geometry within a Shape."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Count Sub-Meshes", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"计数子网格"},"zh-Hant":{"decision":"translate","text":"計數子網格"},"ja_JP":{"decision":"translate","text":"サブメッシュを数える"}}
    },
  ],
};
