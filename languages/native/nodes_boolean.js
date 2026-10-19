/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的boolean完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供3个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的boolean完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
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
    "sourcePairsSha256": "97e64ff80baf6b50202ef6e806a28176a402e5a5ac693640a2d96ad8ecd9d943",
    "sourceIdentityAndNotesSha256": "0ff6b892e0a02adc710de813ca63f827cfe36161b7f1ede71e18fb5508e8b684",
    "keysetSha256": "ab353799fa0bb031a5275e059d0ea3221434701b43148aa588acf6e5ce4816c8",
    "translationDecisionsSha256": "7a8ec06035851fcba48929c524fc9c1dbb926bcb692a2aaf0ad12b5aa75ab0f2",
    "owner": "boolean",
    "keyCount": 3,
    "decisionSlotCount": 9,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 3,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 3,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 3,
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
      "key": "nodeAttr:boolean.clippingShapes", "catalogId": "Definitions/Translation/nodeStrings", "owner": "boolean", "fieldPath": ["attributes","clippingShapes"],
      "source": "Clipping Shapes", "notes": ["\"Clipping\" is a verb/gerund here: using shapes to cut away or limit other shapes."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Clipping Shapes", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"裁切形状"},"zh-Hant":{"decision":"translate","text":"裁切形狀"},"ja_JP":{"decision":"translate","text":"クリッピングシェイプ"}}
    },
    {
      "key": "nodeInfo:boolean", "catalogId": "Definitions/Translation/nodeStrings", "owner": "boolean", "fieldPath": ["info","tooltip"],
      "source": "Add, subtract, union and intersect Shapes.", "notes": ["\"Add\", \"subtract\", \"union\" and \"intersect\" are Boolean-operation verbs describing how two Shapes combine."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Add, subtract, union and intersect Shapes.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"对形状进行相加、相减、联集和交集。"},"zh-Hant":{"decision":"translate","text":"對形狀進行相加、相減、聯集和交集。"},"ja_JP":{"decision":"translate","text":"シェイプの加算、減算、和集合、交差を行います。"}}
    },
    {
      "key": "nodeName:boolean", "catalogId": "Definitions/Translation/nodeStrings", "owner": "boolean", "fieldPath": ["info","name"],
      "source": "Boolean", "notes": ["\"Boolean\" here names logical set operations on shapes."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Boolean", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"布尔"},"zh-Hant":{"decision":"translate","text":"布林"},"ja_JP":{"decision":"translate","text":"ブール"}}
    },
  ],
};
