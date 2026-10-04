/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的applyLayout完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供9个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的applyLayout完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
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
    "sourcePairsSha256": "59ec4db7ef00cdc7444dba1f8c3ff1969dbf69138db88ca30048d01a800cc8a0",
    "sourceIdentityAndNotesSha256": "2f04675784b012df0e423c35983ba23a13218a9e045d722dccff9a14061bc58e",
    "keysetSha256": "3ce518f46d63b500f1d3fe8bafe55af20f135e44651dd23a1f3d5eb54ace16d5",
    "translationDecisionsSha256": "e207fc677d0d89be99a265d519383d8ccd6a2ce9e81095aa9cea4935bdb58ecf",
    "owner": "applyLayout",
    "keyCount": 9,
    "decisionSlotCount": 27,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 9,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 9,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 9,
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
      "key": "attrInfo:applyLayout.layout", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["attributes","layout","tooltip"],
      "source": "Choose the direction Shapes should be position in.", "notes": ["\"Layout\" here is the arrangement/direction shapes are placed in (e.g. rows/columns)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Choose the direction Shapes should be position in.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"选择形状的排列方向。"},"zh-Hant":{"decision":"translate","text":"選擇形狀的排列方向。"},"ja_JP":{"decision":"translate","text":"シェイプを並べる方向を選択します。"}}
    },
    {
      "key": "attrInfo:applyLayout.level", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["attributes","level","tooltip"],
      "source": "The Sub-Mesh depth to use with the layout.", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "The Sub-Mesh depth to use with the layout.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"布局所使用的子网格深度。"},"zh-Hant":{"decision":"translate","text":"佈局所使用的子網格深度。"},"ja_JP":{"decision":"translate","text":"レイアウトで使用するサブメッシュの深さです。"}}
    },
    {
      "key": "nodeAttr:applyLayout.horizontalAlignment", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["attributes","horizontalAlignment"],
      "source": "Horizontal Alignment", "notes": ["As in \"Horizontal Alignment\" — how shapes line up along the left/right axis."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Horizontal Alignment", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"水平对齐"},"zh-Hant":{"decision":"translate","text":"水平對齊"},"ja_JP":{"decision":"translate","text":"水平整列"}}
    },
    {
      "key": "nodeAttr:applyLayout.layout", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["attributes","layout","name"],
      "source": "Layout", "notes": ["\"Layout\" is a noun: the arrangement direction."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Layout", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"布局"},"zh-Hant":{"decision":"translate","text":"佈局"},"ja_JP":{"decision":"translate","text":"レイアウト"}}
    },
    {
      "key": "nodeAttr:applyLayout.level", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["attributes","level","name"],
      "source": "Level", "notes": ["\"Level\" refers to a hierarchy tier within the shape’s internal structure."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Level", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"层级"},"zh-Hant":{"decision":"translate","text":"層級"},"ja_JP":{"decision":"translate","text":"レベル"}}
    },
    {
      "key": "nodeAttr:applyLayout.resolution", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["attributes","resolution"],
      "source": "Size", "notes": ["As in the layout’s \"Size\" — the dimensions of the grid/area shapes are placed within."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Size", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"尺寸"},"zh-Hant":{"decision":"translate","text":"尺寸"},"ja_JP":{"decision":"translate","text":"サイズ"}}
    },
    {
      "key": "nodeAttr:applyLayout.verticalAlignment", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["attributes","verticalAlignment"],
      "source": "Vertical Alignment", "notes": ["As in \"Vertical Alignment\" — how shapes line up along the up/down axis."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Vertical Alignment", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"垂直对齐"},"zh-Hant":{"decision":"translate","text":"垂直對齊"},"ja_JP":{"decision":"translate","text":"垂直整列"}}
    },
    {
      "key": "nodeInfo:applyLayout", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["info","tooltip"],
      "source": "Stack Shapes within a Sub-Mesh in a similar way to the Layout Group.", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape; \"Layout Group\" is the name of a different node type in the app."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Stack Shapes within a Sub-Mesh in a similar way to the Layout Group.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"以与布局编组相似的方式，在子网格内堆叠形状。"},"zh-Hant":{"decision":"translate","text":"以與佈局群組相似的方式，在子網格內堆疊形狀。"},"ja_JP":{"decision":"translate","text":"レイアウトグループと同様に、サブメッシュ内でシェイプを積み重ねます。"}}
    },
    {
      "key": "nodeName:applyLayout", "catalogId": "Definitions/Translation/nodeStrings", "owner": "applyLayout", "fieldPath": ["info","name"],
      "source": "Apply Layout", "notes": ["\"Layout\" refers to the arrangement direction shapes are stacked in."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Apply Layout", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"应用布局"},"zh-Hant":{"decision":"translate","text":"套用佈局"},"ja_JP":{"decision":"translate","text":"レイアウトを適用"}}
    },
  ],
};
