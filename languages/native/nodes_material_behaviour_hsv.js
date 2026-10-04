/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的materialBehaviourHSV完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供5个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的materialBehaviourHSV完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
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
    "sourcePairsSha256": "c5db50598a7223b5622c1d8ba1d808e944a17cfd46983fa9a92104a7b7ab780d",
    "sourceIdentityAndNotesSha256": "6ae5adf16cb49ba6896464661b5bab5ca74d48feefb4532fee5569709eaeaef6",
    "keysetSha256": "c27d2630a1ea4f2a051fa58f82084a9e4f2a08802a54c7edf72d9e1b092422f5",
    "translationDecisionsSha256": "955f2b15008f622383d793e0c4faf4e5977d2c04af6cb7161f363b5f1cf56220",
    "owner": "materialBehaviourHSV",
    "keyCount": 5,
    "decisionSlotCount": 15,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 5,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 5,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 5,
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
      "key": "nodeAttr:materialBehaviourHSV.adjustHue", "catalogId": "Definitions/Translation/nodeStrings", "owner": "materialBehaviourHSV", "fieldPath": ["attributes","adjustHue"],
      "source": "Hue", "notes": ["\"Hue\" is the base colour tone (e.g. red vs blue)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Hue", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"色相"},"zh-Hant":{"decision":"translate","text":"色相"},"ja_JP":{"decision":"translate","text":"色相"}}
    },
    {
      "key": "nodeAttr:materialBehaviourHSV.adjustSaturation", "catalogId": "Definitions/Translation/nodeStrings", "owner": "materialBehaviourHSV", "fieldPath": ["attributes","adjustSaturation"],
      "source": "Saturation", "notes": ["\"Saturation\" is colour intensity/purity."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Saturation", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"饱和度"},"zh-Hant":{"decision":"translate","text":"飽和度"},"ja_JP":{"decision":"translate","text":"彩度"}}
    },
    {
      "key": "nodeAttr:materialBehaviourHSV.adjustValue", "catalogId": "Definitions/Translation/nodeStrings", "owner": "materialBehaviourHSV", "fieldPath": ["attributes","adjustValue"],
      "source": "Value", "notes": ["As part of HSV, \"Value\" here means brightness."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Value", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"明度"},"zh-Hant":{"decision":"translate","text":"明度"},"ja_JP":{"decision":"translate","text":"明度"}}
    },
    {
      "key": "nodeInfo:materialBehaviourHSV", "catalogId": "Definitions/Translation/nodeStrings", "owner": "materialBehaviourHSV", "fieldPath": ["info","tooltip"],
      "source": "Override the Hue, Saturation and Value of Shapes within Sub-Meshes.", "notes": ["\"Sub-Meshes\" refers to nested/repeated pieces of geometry within a Shape."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Override the Hue, Saturation and Value of Shapes within Sub-Meshes.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"覆盖子网格内形状的色相、饱和度和明度。"},"zh-Hant":{"decision":"translate","text":"覆蓋子網格內形狀的色相、飽和度和明度。"},"ja_JP":{"decision":"translate","text":"サブメッシュ内のシェイプの色相、彩度、明度をオーバーライドします。"}}
    },
    {
      "key": "nodeName:materialBehaviourHSV", "catalogId": "Definitions/Translation/nodeStrings", "owner": "materialBehaviourHSV", "fieldPath": ["info","name"],
      "source": "HSV Material Override", "notes": ["\"HSV\" is a colour model made up of Hue, Saturation and Value (brightness)."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "HSV Material Override", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"HSV 材质覆盖"},"zh-Hant":{"decision":"translate","text":"HSV 材質覆蓋"},"ja_JP":{"decision":"translate","text":"HSV マテリアルオーバーライド"}}
    },
  ],
};
