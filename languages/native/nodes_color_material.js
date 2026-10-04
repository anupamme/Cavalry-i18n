/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的colorMaterial完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供5个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的colorMaterial完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
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
    "sourcePairsSha256": "4683309574fd5b5f53c0056448de3f80b48b7dcfd73e2dbb39bd6504da20df7b",
    "sourceIdentityAndNotesSha256": "a2723a62b622198e56b8f0b96133d6830e0b5f59c48e876987b1fa32fc36924d",
    "keysetSha256": "80578810d9a0f9141d417e3583c969d44531372b186030f61b0e740063139263",
    "translationDecisionsSha256": "6bc820ddbad84bbb7cf4b69887021bb339b6bc92c6295e873d09daf9f0d6b6ca",
    "owner": "colorMaterial",
    "keyCount": 5,
    "decisionSlotCount": 15,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 4,
        "preserve": 1
      },
      "zh-Hant": {
        "translate": 4,
        "preserve": 1
      },
      "ja_JP": {
        "translate": 4,
        "preserve": 1
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
      "key": "nodeAttr:colorMaterial.alpha", "catalogId": "Definitions/Translation/nodeStrings", "owner": "colorMaterial", "fieldPath": ["attributes","alpha"],
      "source": "Alpha", "notes": ["\"Alpha\" refers to transparency/opacity."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Alpha", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"preserve","text":"Alpha"},"zh-Hant":{"decision":"preserve","text":"Alpha"},"ja_JP":{"decision":"preserve","text":"Alpha"}}
    },
    {
      "key": "nodeAttr:colorMaterial.colorShaders", "catalogId": "Definitions/Translation/nodeStrings", "owner": "colorMaterial", "fieldPath": ["attributes","colorShaders"],
      "source": "Shaders", "notes": ["\"Shaders\" here are connected nodes that generate or modify colour (e.g. gradients)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Shaders", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"着色器"},"zh-Hant":{"decision":"translate","text":"著色器"},"ja_JP":{"decision":"translate","text":"シェーダー"}}
    },
    {
      "key": "nodeAttr:colorMaterial.materialColor", "catalogId": "Definitions/Translation/nodeStrings", "owner": "colorMaterial", "fieldPath": ["attributes","materialColor"],
      "source": "Color", "notes": ["As in \"the Fill’s Color\" — the colour value itself."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Color", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"颜色"},"zh-Hant":{"decision":"translate","text":"顏色"},"ja_JP":{"decision":"translate","text":"カラー"}}
    },
    {
      "key": "nodeInfo:colorMaterial", "catalogId": "Definitions/Translation/nodeStrings", "owner": "colorMaterial", "fieldPath": ["info","tooltip"],
      "source": "Adds a Fill material that can be used on many shapes at once.", "notes": ["\"Fill\" is a noun here: the solid or gradient colour applied inside a Shape’s outline."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Adds a Fill material that can be used on many shapes at once.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"添加可同时用于多个形状的填充材质。"},"zh-Hant":{"decision":"translate","text":"新增可同時用於多個形狀的填充材質。"},"ja_JP":{"decision":"translate","text":"複数のシェイプに同時に使える塗りマテリアルを追加します。"}}
    },
    {
      "key": "nodeName:colorMaterial", "catalogId": "Definitions/Translation/nodeStrings", "owner": "colorMaterial", "fieldPath": ["info","name"],
      "source": "Fill", "notes": ["\"Fill\" is a shape’s interior colour/texture, as a noun."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Fill", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"填充"},"zh-Hant":{"decision":"translate","text":"填充"},"ja_JP":{"decision":"translate","text":"塗り"}}
    },
  ],
};
