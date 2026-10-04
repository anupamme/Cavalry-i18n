/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的chopPath完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供16个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的chopPath完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 * 本轮图形语境有限修订经非作者验回/root审定；冻结源与历史批准仍保全。
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
    "sourcePairsSha256": "5e4a305d115e9324d35b51f37e7cd3ecb087450e867f35154cd43ea363f73442",
    "sourceIdentityAndNotesSha256": "4e6c1de243022bddab681055e24bc4321e6e4244949432672c3cbd1d97244ac0",
    "keysetSha256": "5fcab5de21bf797561fed08f4a346d2ddc08472bc4d05f9cf70551840d89c3c3",
    "translationDecisionsSha256": "c5c322e1c1ce11fbed4e3950e90dec92939da8d5162b9194b0190638f29a0366",
    "owner": "chopPath",
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
      "key": "attrInfo:chopPath.angle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","angle","tooltip"],
      "source": "Set the angle of the cuts.", "notes": ["As in the \"angle\" (in degrees) at which the path is sliced."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the angle of the cuts.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置切割的角度。"},"zh-Hant":{"decision":"translate","text":"設定切割的角度。"},"ja_JP":{"decision":"translate","text":"切断の角度を設定します。"}}
    },
    {
      "key": "attrInfo:chopPath.count", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","count","tooltip"],
      "source": "Set the number of rectangles to use when chopping the path.", "notes": ["\"Chopping\" means cutting the path into segments using rectangles."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the number of rectangles to use when chopping the path.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置切割路径时使用的矩形数量。"},"zh-Hant":{"decision":"translate","text":"設定切割路徑時使用的矩形數量。"},"ja_JP":{"decision":"translate","text":"パスを切断するときに使う矩形の数を設定します。"}}
    },
    {
      "key": "attrInfo:chopPath.deformers", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","deformers","tooltip"],
      "source": "Deform the Rectangles used to cut the path.", "notes": ["\"Deform\" means reshape the rectangle’s geometry via a connected Deformer node."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Deform the Rectangles used to cut the path.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"对用于切割路径的矩形进行变形。"},"zh-Hant":{"decision":"translate","text":"對用於切割路徑的矩形進行變形。"},"ja_JP":{"decision":"translate","text":"パスの切断に使う矩形を変形します。"}}
    },
    {
      "key": "attrInfo:chopPath.flattenShape", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","flattenShape","tooltip"],
      "source": "With this on, the Chop will treat all Sub-Meshes as if they are one.", "notes": ["\"Sub-Meshes\" refers to nested/repeated pieces of geometry within a Shape."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "With this on, the Chop will treat all Sub-Meshes as if they are one.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"开启后，切割会将所有子网格视为一个整体。"},"zh-Hant":{"decision":"translate","text":"開啟後，切割會將所有子網格視為一個整體。"},"ja_JP":{"decision":"translate","text":"オンにすると、この切断はすべてのサブメッシュを 1 つとして扱います。"}}
    },
    {
      "key": "attrInfo:chopPath.offset", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","offset","tooltip"],
      "source": "Offset the cut parts of the path. Optionally connect a Behaviour such as Random, Noise, or Stagger to create interesting effects.", "notes": ["\"Behaviour\" here is a category of Cavalry nodes that drive animated values."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Offset the cut parts of the path. Optionally connect a Behaviour such as Random, Noise, or Stagger to create interesting effects.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"偏移路径上被切开的部分。也可连接随机、噪波或错开等行为，以产生有趣的效果。"},"zh-Hant":{"decision":"translate","text":"偏移路徑上被切開的部分。也可連接隨機、雜訊或錯開等行為，以產生有趣的效果。"},"ja_JP":{"decision":"translate","text":"パスの切断部分をオフセットします。ランダム、ノイズ、スタッガーなどのビヘイビアを接続して、面白い効果を作ることもできます。"}}
    },
    {
      "key": "attrInfo:chopPath.spread", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","spread","tooltip"],
      "source": "Set the gap between the cuts. Optionally connect a Behaviour such as Random, Noise, or Stagger to create interesting effects.", "notes": ["\"Gap\" is the spacing left between cut segments of the path."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the gap between the cuts. Optionally connect a Behaviour such as Random, Noise, or Stagger to create interesting effects.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置各次切割之间的间隙。也可连接随机、噪波或错开等行为，以产生有趣的效果。"},"zh-Hant":{"decision":"translate","text":"設定各次切割之間的間隙。也可連接隨機、雜訊或錯開等行為，以產生有趣的效果。"},"ja_JP":{"decision":"translate","text":"切断同士の間隔を設定します。ランダム、ノイズ、スタッガーなどのビヘイビアを接続して、面白い効果を作ることもできます。"}}
    },
    {
      "key": "nodeAttr:chopPath.angle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","angle","name"],
      "source": "Angle", "notes": ["\"Angle\" refers to the rotation angle of the cuts."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Angle", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"角度"},"zh-Hant":{"decision":"translate","text":"角度"},"ja_JP":{"decision":"translate","text":"角度"}}
    },
    {
      "key": "nodeAttr:chopPath.count", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","count","name"],
      "source": "Count", "notes": ["\"Count\" is a noun: the number of pieces the path is chopped into."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Count", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"数量"},"zh-Hant":{"decision":"translate","text":"數量"},"ja_JP":{"decision":"translate","text":"個数"}}
    },
    {
      "key": "nodeAttr:chopPath.deformers", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","deformers","name"],
      "source": "Rectangle Deformers", "notes": ["As in \"Rectangle Deformers\" — Deformer nodes applied to reshape each cutting rectangle."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Rectangle Deformers", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"矩形变形器"},"zh-Hant":{"decision":"translate","text":"矩形變形器"},"ja_JP":{"decision":"translate","text":"矩形デフォーマ"}}
    },
    {
      "key": "nodeAttr:chopPath.flattenShape", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","flattenShape","name"],
      "source": "Flatten Shape", "notes": ["\"Flatten\" is a verb: merge the sub-pieces into one, dropping their individual structure."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Flatten Shape", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"展平形状"},"zh-Hant":{"decision":"translate","text":"展平形狀"},"ja_JP":{"decision":"translate","text":"シェイプをフラット化"}}
    },
    {
      "key": "nodeAttr:chopPath.flattenShapeHelp", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","flattenShapeHelp"],
      "source": "With Flatten Shape on, any input materials will be lost. To apply a material to the output slices, use a Sub-Mesh Behaviour.", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "With Flatten Shape on, any input materials will be lost. To apply a material to the output slices, use a Sub-Mesh Behaviour.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"开启“展平形状”后，任何输入材质都会丢失。要对输出切片应用材质，请使用子网格行为。"},"zh-Hant":{"decision":"translate","text":"開啟「展平形狀」後，任何輸入材質都會遺失。若要對輸出切片套用材質，請使用子網格行為。"},"ja_JP":{"decision":"translate","text":"「シェイプをフラット化」をオンにすると、入力マテリアルはすべて失われます。出力スライスにマテリアルを適用するには、サブメッシュビヘイビアを使います。"}}
    },
    {
      "key": "nodeAttr:chopPath.offset", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","offset","name"],
      "source": "Offset", "notes": ["As in \"Offset\" — shifting the cut segments’ position."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Offset", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"偏移"},"zh-Hant":{"decision":"translate","text":"偏移"},"ja_JP":{"decision":"translate","text":"オフセット"}}
    },
    {
      "key": "nodeAttr:chopPath.spread", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","spread","name"],
      "source": "Spread", "notes": ["\"Spread\" is a noun: the gap between the cut pieces."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Spread", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"间隙"},"zh-Hant":{"decision":"translate","text":"間隙"},"ja_JP":{"decision":"translate","text":"間隔"}}
    },
    {
      "key": "nodeAttr:chopPath.spreadHelp", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["attributes","spreadHelp"],
      "source": "Connect a Behaviour such as Random, Noise, or Stagger to ‘Spread’ and/or ‘Offset’ to create interesting effects.", "notes": ["\"Spread\" here is the gap/distance between the cut segments."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Connect a Behaviour such as Random, Noise, or Stagger to ‘Spread’ and/or ‘Offset’ to create interesting effects.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"将随机、噪波或错开等行为连接到“间隙”和/或“偏移”，以产生有趣的效果。"},"zh-Hant":{"decision":"translate","text":"將隨機、雜訊或錯開等行為連接到「間隙」和/或「偏移」，以產生有趣的效果。"},"ja_JP":{"decision":"translate","text":"ランダム、ノイズ、スタッガーなどのビヘイビアを「間隔」および／または「オフセット」に接続すると、面白い効果を作れます。"}}
    },
    {
      "key": "nodeInfo:chopPath", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["info","tooltip"],
      "source": "Cuts a path into chunks using Rectangles.", "notes": ["\"Path\" here is a vector outline/curve, and \"chunks\" are the resulting cut segments."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Cuts a path into chunks using Rectangles.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"用矩形将路径切成片段。"},"zh-Hant":{"decision":"translate","text":"用矩形將路徑切成片段。"},"ja_JP":{"decision":"translate","text":"矩形でパスを断片に切断します。"}}
    },
    {
      "key": "nodeName:chopPath", "catalogId": "Definitions/Translation/nodeStrings", "owner": "chopPath", "fieldPath": ["info","name"],
      "source": "Chop Path", "notes": ["\"Chop\" is a verb: cut into pieces."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Chop Path", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"切割路径"},"zh-Hant":{"decision":"translate","text":"切割路徑"},"ja_JP":{"decision":"translate","text":"パスを切断"}}
    },
  ],
};

// -- 图形语境复审：历史谱系不覆盖，本轮有限修订独立绑定 ------------
module.exports.provenance.graphicsReaudit = {
  "approvalReceiptSha256": "b90444cdeeec13611234814135f5c7c4107a884fb0004eff7c44365f629f0607",
  "approvedBy": "primary-agent",
  "approvalState": "approved-source-bound-graphics-repairs",
  "fullReviewScope": "nodes",
  "fullReviewLedgerSha256": "41f3ce9235b6646791e1294e2b96ace0cc25d3df77b391999ff6bffef8719a56",
  "fullReviewKeys": 1581,
  "fullReviewSlots": 4743,
  "changedLocaleSlots": 3,
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
