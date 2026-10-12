/**
 * [INPUT]: 绑定Cavalry 2.8 Plugins/Twist Filter官方显示源、键映射、历史全域审查与单键修订批准。
 * [OUTPUT]: 构建期提供13个源绑定显示键与三语决定；Twist名称修订仅覆盖zh-Hans/zh-Hant。
 * [POS]: languages/native的完整catalog审批输入，显式装配；保留历史摘要/时间与JA，修订另绑源身份和批准证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 * 本轮图形语境有限修订经非作者验回/root审定；冻结源与历史批准仍保全。
 * 单键名称修订不改变source/notes/owner/vendorJapanese或其他键；不证明部署/live/发行。
 */
'use strict';

// -- 源绑定显示审批；仅经显式清单投影，不进入显示热路径 ------------
const provenance = {
  "cavalryVersion": "2.8.0",
  "qtVersion": "6.9.2",
  "bundleIdentifier": "com.scenegroup.cavalry",
  "officialTargetManifestSha256": "b6c6c6de1145035dc5ead1f21daf27d405de79fb70f430ecc828f6d09522be84",
  "sourceJsonSha256": "b0c1aecab95df92ce2a591c61e61b415720318a6271bca2a8151ac449bf0571c",
  "authorCandidateSha256": "f28fedda6182bf90027854385c9930294a125edecbeb7f5a81ac8e3f383ef2a8",
  "rootRevisedCandidateSha256": "21d29cb431e216619f93d89d441b4e08c31c17311d1ff0a5a713b57aa1d8db01",
  "rootAdjudicationSha256": "af3329fccece6f28bbff3ce09a729759e7c1b4a5661f7f67b33ce32faf1c3ed8",
  "approvedBy": "primary-agent",
  "approvedAt": "2026-10-03T21:49:39.823Z",
  "approvalState": "approved-source-bound-display-input",
  "approvalKind": "source-bound display input only; no deployment/live approval",
  "registryState": "registered-source-bound-display-input",
  "candidateAuthor": "prior-session delegated GPT-6 Luna Max draft; primary-agent semantic revisions in this handoff",
  "candidateProvider": "delegated Codex agent; no AGY/Grok output used for this 396-key batch",
  "candidateModel": "gpt-6-luna",
  "candidateReasoningEffort": "max",
  "rootRevisionAuthor": "primary-agent",
  "providerEndTurnMetadataObserved": false,
  "independentFullReviewCount": 2,
  "independentFullReviewSlotsPerReviewer": 1188,
  "independentFullReviewReceipts": [
    {
      "reviewer": "GPT-6 Luna Max independent full review A",
      "sha256": "c9b438f7d102796cbeae4749ae70349ca15069e9b7aa2a28c29b75eec7d94bf8"
    },
    {
      "reviewer": "GPT-6 Luna Max independent full review B",
      "sha256": "02c7bf10a201fe2fdd67957d8e28d434c5d97bc84c18ab357362da5f676a91eb"
    }
  ],
  "deltaReviewCount": 2,
  "deltaReviewScope": {
    "finalChangedSlotsAgainstAuthor": 87,
    "finalChangedKeysAgainstAuthor": 48,
    "firstDeltaSlotsPerReviewer": 89,
    "subsequentCorrectionSlotsPerReviewer": 4
  },
  "firstDeltaReviewReceipts": [
    {
      "reviewer": "GPT-6 Luna Max delta A v1; four glossary issues found",
      "sha256": "f0acdc6600ce7a65915f666f3e54ac52362bce792cda0cfa36a42269af277b31"
    },
    {
      "reviewer": "GPT-6 Luna Max delta B v1; four glossary issues found",
      "sha256": "90e49a3c3b7df1fc59d564d3fdaf11670d4fe9abe50b1973d4065a7e4fca3f1e"
    }
  ],
  "deltaReviewReceipts": [
    {
      "reviewer": "GPT-6 Luna Max delta A v2; corrections confirmed",
      "sha256": "496a17d023a3c3e3a8e6d833e149b60b95affac2eea3dcf905b7fd8afb5f25c2"
    },
    {
      "reviewer": "GPT-6 Luna Max delta B v2; corrections confirmed",
      "sha256": "7a0f1d8e23a67ae78c4150e83feb39ae8a5098fdc082d6d13cbf08f2752392ed"
    }
  ],
  "canonicalMappingSha256": "4152e4b612a6c468f452deffa53c675af44d17120fa53b7e35fba2c85a7812de",
  "sourceRole": "display-only canonical Guide/Plugin catalogs",
  "fullCatalogs": 15,
  "batchKeyCount": 396,
  "batchDecisionSlotCount": 1188,
  "vendorJapaneseChangedKeys": 390,
  "officialDntCount": 6,
  "sourceIdentityChanges": 0,
  "jaChangedSlots": 0,
  "dntChangedSlots": 0,
  "liveVerified": false,
  "live": "NOT_RUN",
  "publicRelease": "NOT_APPROVED",
  "retainedRisk": "My Shape English display anchor mitigates wording only; real guide/example consumer still requires live validation",
  "catalogId": "Plugins/Twist Filter/Translation/strings",
  "catalogPath": "Plugins/Twist Filter/Translation/strings_en-GB.source.json",
  "sourceSha256": "e40a515366f9c692440a252d5fbf63cb996e792e447421c1d1334a82f1735ffc",
  "vendorJapanesePath": "Plugins/Twist Filter/Translation/strings_ja-JP.translation.json",
  "vendorJapaneseSha256": "9313039093c237fef8621aaddd31cbcdae56163dcf30e653afdcc93ff0574586",
  "sourceApprovalSha256": "1188e33280b780f41d7f23c0f12c3391a40ccfd2d127bc8bbf79c3d672c435e9",
  "keyCount": 13,
  "decisionSlotCount": 39,
  "keysetSha256": "21406a3846413267cdc4ffd634d93a1ca44a1a53333371777e210631c232088a",
  "sourcePairsSha256": "62d37189b7048ba1f2ea360ef7d2186a0e02a205928fd0b273e0c962043808cf",
  "sourceIdentityAndNotesSha256": "227da8d8c5b66de1496c4fe61bbb6cdbbb2f387c31c594565c1e72b520fc8060",
  "translationDecisionsSha256": {
    "zh-Hans": "0c2362769ee98475318945851bf06e1339dfcdf32be466740fa23e42a2aac69d",
    "zh-Hant": "63fd51b5bcd193dbe7345d98d1598491c232f4f3e8b5a4fab1d94411bebdb456",
    "ja_JP": "fc74a1329f07e4ffd362653d5584364c759c3716402b4da17c36e8006575774d"
  }
};

const entries = [
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","angle","tooltip"],"source":"Set the twist angle at the Centre, in degrees. The angle falls off to zero at the Radius.","notes":["\"Centre\" and \"Radius\" are two of this filter’s own attributes; \"falls off\" means gradually reduces."],"owner":"sceneGroup::twistFilter","key":"attrInfo:sceneGroup::twistFilter.angle","vendorJapanese":"中心でのひねりの角度を度単位で設定します。角度は半径でゼロに減衰します。","sourceRole":"ui-display","displayRole":"plugin-attribute-info","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"设置中心处的扭转角度（度）。到达半径位置时，角度会衰减至零。"},"zh-Hant":{"decision":"translate","text":"設定中心處的扭轉角度（度）。到達半徑位置時，角度會衰減至零。"},"ja_JP":{"decision":"translate","text":"中心でのひねりの角度を度単位で設定します。角度は半径でゼロに減衰します。"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","centre","tooltip"],"source":"Set the pivot point of the twist, where (0, 0) is the centre of the Shape.","notes":["\"Shape\" refers to the layer this filter is applied to."],"owner":"sceneGroup::twistFilter","key":"attrInfo:sceneGroup::twistFilter.centre","vendorJapanese":"ひねりの中心点を設定します。（0,0）がシェイプの中心です。","sourceRole":"ui-display","displayRole":"plugin-attribute-info","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"设置扭转的锚点；(0, 0) 为形状图层的中心。"},"zh-Hant":{"decision":"translate","text":"設定扭轉的錨點；(0, 0) 為形狀圖層的中心。"},"ja_JP":{"decision":"translate","text":"ひねりの中心点を設定します。（0,0）がシェイプの中心です。"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","falloff","tooltip"],"source":"Set the shape for how the Angle falls off from the Centre to the Radius.","notes":["\"Falloff\" means a gradual reduction in effect strength over distance."],"owner":"sceneGroup::twistFilter","key":"attrInfo:sceneGroup::twistFilter.falloff","vendorJapanese":"中心から半径にかけて角度が減衰する形状を設定します。","sourceRole":"ui-display","displayRole":"plugin-attribute-info","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"设置角度从中心到半径的衰减曲线形状。"},"zh-Hant":{"decision":"translate","text":"設定角度從中心到半徑的衰減曲線形狀。"},"ja_JP":{"decision":"translate","text":"中心から半径にかけて角度が減衰する形状を設定します。"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","radius","tooltip"],"source":"Set the distance from the centre, in pixels, at which the twist’s Angle returns to zero.","notes":["\"Angle\" is another attribute of this filter."],"owner":"sceneGroup::twistFilter","key":"attrInfo:sceneGroup::twistFilter.radius","vendorJapanese":"ひねりの角度がゼロに戻るまでの中心からの距離を、ピクセル単位で設定します。","sourceRole":"ui-display","displayRole":"plugin-attribute-info","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"设置从中心起算的距离（像素）；到达该距离时，扭转角度回到零。"},"zh-Hant":{"decision":"translate","text":"設定從中心起算的距離（像素）；到達該距離時，扭轉角度回到零。"},"ja_JP":{"decision":"translate","text":"ひねりの角度がゼロに戻るまでの中心からの距離を、ピクセル単位で設定します。"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","angle","name"],"source":"Angle","notes":["As in \"the rotation angle, in degrees\" — not a personal viewpoint, a camera angle, or a fishing angle."],"owner":"sceneGroup::twistFilter","key":"nodeAttr:sceneGroup::twistFilter.angle","vendorJapanese":"角度","sourceRole":"ui-display","displayRole":"plugin-attribute-label","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"角度"},"zh-Hant":{"decision":"translate","text":"角度"},"ja_JP":{"decision":"translate","text":"角度"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","centre","name"],"source":"Centre","notes":["As in \"the centre point the twist rotates around\" — a specific X,Y position, not a place (e.g. a town centre) or the non-spatial sense in \"centre of attention.\""],"owner":"sceneGroup::twistFilter","key":"nodeAttr:sceneGroup::twistFilter.centre","vendorJapanese":"中央","sourceRole":"ui-display","displayRole":"plugin-attribute-label","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"中心"},"zh-Hant":{"decision":"translate","text":"中心"},"ja_JP":{"decision":"translate","text":"中央"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","falloff","name"],"source":"Falloff","notes":["\"Falloff\" means a gradual reduction in effect strength over distance."],"owner":"sceneGroup::twistFilter","key":"nodeAttr:sceneGroup::twistFilter.falloff","vendorJapanese":"減衰","sourceRole":"ui-display","displayRole":"plugin-attribute-label","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"衰减"},"zh-Hant":{"decision":"translate","text":"衰減"},"ja_JP":{"decision":"translate","text":"減衰"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["attributes","radius","name"],"source":"Radius","notes":["The radius of the twist effect."],"owner":"sceneGroup::twistFilter","key":"nodeAttr:sceneGroup::twistFilter.radius","vendorJapanese":"半径","sourceRole":"ui-display","displayRole":"plugin-attribute-label","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"半径"},"zh-Hant":{"decision":"translate","text":"半徑"},"ja_JP":{"decision":"translate","text":"半径"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["enums","falloff","0"],"source":"Linear","notes":["As in \"a linear curve\", meaning a constant, straight-line rate of change — not \"linear\" meaning sequential or arranged in a line."],"owner":"sceneGroup::twistFilter","key":"nodeAttrEnum:sceneGroup::twistFilter.falloff.0","vendorJapanese":"リニア","sourceRole":"ui-display","displayRole":"plugin-enum-label","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"线性"},"zh-Hant":{"decision":"translate","text":"線性"},"ja_JP":{"decision":"translate","text":"リニア"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["enums","falloff","1"],"source":"Smooth","notes":["As in \"a smooth, eased curve\" that transitions gradually — not physically smooth to the touch, nor \"smooth\" describing a suave person."],"owner":"sceneGroup::twistFilter","key":"nodeAttrEnum:sceneGroup::twistFilter.falloff.1","vendorJapanese":"流ちょう","sourceRole":"ui-display","displayRole":"plugin-enum-label","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"平滑"},"zh-Hant":{"decision":"translate","text":"平滑"},"ja_JP":{"decision":"translate","text":"スムーズ","vendorCorrection":{"approvedBy":"primary-agent","approvalState":"approved-source-bound-vendor-correction","sourceIdentitySha256":"3c29e70b503e91ac2778a637803f4139fc7ff7ba4537b4468754a2716e25a529","translationSha256":"c9c6156329a593ef64b31f001c916cc1efd76eaebf7d7d89934c7985e1102b21","vendorJapanese":"流ちょう","approvalReceiptSha256":"5c85772dbbe527736eb35487cd63f6c5f4a1d97fbe2a0de0fa23d06694e7abc6"}}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["enums","falloff","2"],"source":"Quadratic","notes":["\"Quadratic\" is a mathematical term meaning based on the square (second power) of a value, as in a quadratic equation or curve."],"owner":"sceneGroup::twistFilter","key":"nodeAttrEnum:sceneGroup::twistFilter.falloff.2","vendorJapanese":"二次","sourceRole":"ui-display","displayRole":"plugin-enum-label","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"二次曲线"},"zh-Hant":{"decision":"translate","text":"二次曲線"},"ja_JP":{"decision":"translate","text":"二次"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["layerInfo"],"source":"Rotate a Shape’s materials around a centre point.","notes":["\"Shape\" refers to the layer this filter is applied to."],"owner":"sceneGroup::twistFilter","key":"nodeInfo:sceneGroup::twistFilter","vendorJapanese":"シェイプの素材を、中心点を中心に回転させます。","sourceRole":"ui-display","displayRole":"plugin-info","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"围绕中心点旋转形状图层的材质。"},"zh-Hant":{"decision":"translate","text":"圍繞中心點旋轉形狀圖層的材質。"},"ja_JP":{"decision":"translate","text":"シェイプの素材を、中心点を中心に回転させます。"}}},
  {"catalogId":"Plugins/Twist Filter/Translation/strings","fieldPath":["niceName"],"source":"Twist","notes":["As in \"a twist distortion effect\" that spirals an image around a point — not a dance move, a plot twist, or the idiom \"twist someone’s arm.\""],"owner":"sceneGroup::twistFilter","key":"nodeName:sceneGroup::twistFilter","vendorJapanese":"ひねり","sourceRole":"ui-display","displayRole":"plugin-name","dontTranslate":false,"vendorJapaneseChanged":true,"translations":{"zh-Hans":{"decision":"translate","text":"扭转"},"zh-Hant":{"decision":"translate","text":"扭轉"},"ja_JP":{"decision":"translate","text":"ひねり"}}},
];
module.exports = { provenance, entries };

// -- 图形语境复审：历史谱系不覆盖，本轮有限修订独立绑定 ------------
module.exports.provenance.graphicsReaudit = {
  "approvalReceiptSha256": "b90444cdeeec13611234814135f5c7c4107a884fb0004eff7c44365f629f0607",
  "approvedBy": "primary-agent",
  "approvalState": "approved-source-bound-graphics-repairs",
  "fullReviewScope": "mixed",
  "fullReviewLedgerSha256": "03f2850f14cf96bec177993c798d574abeb0a0c22b342f034adf8ab51f9077e5",
  "fullReviewKeys": 1197,
  "fullReviewSlots": 3591,
  "changedLocaleSlots": 1,
  "deltaReviewReceiptSha256s": [
    "4881bb6837e2df77e833387666d23f8e3b69a442a77d2372ff0032c71459eed2",
    "7f96dbc98837f48b1f7ea4379fb690343ad44a2a5904029be019916bed6b0b56",
    "80cd3e4ca80bcb3dc107d8ed4952820aeafe07d674681f33c12aabe8aacc4d04",
    "dfa112a7a39533ee2526fb5ffa7a1dcf6206fb69ec3cc80601db70c137eec420"
  ],
  "sourceIdentityChanged": false,
  "officialVendorChanged": false,
  "liveApproval": false
};

// -- 单键译名修订：不重写原13键审批摘要或历史时间 --------------------
module.exports.provenance.nameRevision = {
  "revisionId": "c3-twist-name-20261009-r1",
  "key": "nodeName:sceneGroup::twistFilter",
  "sourceIdentitySha256": "af1165e23d2ff3d2bcaacc53daed89df7f8a9054319d79fa5ea32574dee82d30",
  "locales": {
    "zh-Hans": {
      "previous": "扭曲",
      "previousSha256": "b1837195155340d21109c98e2cb35a434ed75241965152c6fe121f5b8d9a3b6b",
      "approved": "扭转",
      "approvedSha256": "3d90591f6e6c851be30ca6f6216f6e007b016e4fed32f727a37ac8de46d96d0f"
    },
    "zh-Hant": {
      "previous": "扭曲",
      "previousSha256": "b1837195155340d21109c98e2cb35a434ed75241965152c6fe121f5b8d9a3b6b",
      "approved": "扭轉",
      "approvedSha256": "3d593ef619febd64b3e8714e9882c8eca1c7c7256dbc29569593c0a0e9da8277"
    },
    "ja_JP": {
      "previous": "ひねり",
      "previousSha256": "2a41a8b6b618701268b4fcc0d55b71696d48f1a6bf313c02bdd122fcd1d32e02",
      "approved": "ひねり",
      "approvedSha256": "2a41a8b6b618701268b4fcc0d55b71696d48f1a6bf313c02bdd122fcd1d32e02"
    }
  },
  "preservedNormalizedEntriesSha256": "0a12b941569e21162e7a804dc9f615690653e97de3cfe23dfd38a5b77f61915a",
  "rootApprovalDecisionSha256": "8764921c320f0ab2e0ae519f29b162d70cafd222f2538875a96b14596b9140bd",
  "independentReviewReportSha256": "0348b31468b8dbb66a19ce2e40a395539dac7e39fda0762fe7896180d83719dc",
  "approvedBy": "primary-agent",
  "approvalState": "approved-single-key-name-revision",
  "scope": "zh-Hans/zh-Hant node display only; source, notes, owner, vendorJapanese, ja_JP, and other entries remain unchanged"
};
