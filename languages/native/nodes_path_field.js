/**
 * [INPUT]: 绑定root批准的Cavalry 2.8 pathField完整官方source/notes/角色、厂商日语/DNT身份与修订译值。
 * [OUTPUT]: 构建期提供22个source-bound显示键及zh-Hans/zh-Hant/ja_JP决策文本，不将reason写入显示包。
 * [POS]: languages/native的pathField完整owner投影；沿approved_modules显式装配到producer，不改模型/算法，也不证明部署或live。
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
  "ownerSourcePairsSha256": "173a0d07b3ee09dc0da2cbf86e0898964b8e367b2aff547c5071fa65bf8814d1",
  "ownerIdentityAndNotesSha256": "5272fe34804a5e97d8f1573654a64822ffafaa3e2426c57846a870bdb3ca14cd",
  "keysetSha256": "4e7d1fb02a8ddf003b9efe45942ac8349b4bca88986ae0d3d3dc444b53519075",
  "translationDecisionsSha256": "cfdadbb8d5c18360db6033a8e9253601a9cc2ff0e57820dc1e1c133a34112a50",
  "owner": "pathField",
  "keyCount": 22,
  "decisionSlotCount": 66,
  "ownerDecisionCounts": {
    "zh-Hans": {
      "translate": 22,
      "preserve": 0
    },
    "zh-Hant": {
      "translate": 22,
      "preserve": 0
    },
    "ja_JP": {
      "translate": 22,
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
  {"key":"attrInfo:pathField.captureForce","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","captureForce","tooltip"],"source":"Strength of the force pulling bodies towards the path.","notes":["\"Pulling bodies towards the path\" is a physics attraction force."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Strength of the force pulling bodies towards the path.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"将物体拉向路径的力的强度。"},"zh-Hant":{"decision":"translate","text":"將物體拉向路徑的力的強度。"},"ja_JP":{"decision":"translate","text":"物体をパスに引き寄せる力の強さです。"}}},
  {"key":"attrInfo:pathField.captureGraph","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","captureGraph","tooltip"],"source":"Control how capture force attenuates with distance from the path.","notes":["\"Attenuates\" means gradually weakens/reduces."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Control how capture force attenuates with distance from the path.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"控制捕获力随离路径距离增加而衰减的方式。"},"zh-Hant":{"decision":"translate","text":"控制捕捉力隨離路徑距離增加而衰減的方式。"},"ja_JP":{"decision":"translate","text":"パスからの距離に応じて、キャプチャ力が減衰する度合いを制御します。"}}},
  {"key":"attrInfo:pathField.captureMargin","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","captureMargin","tooltip"],"source":"Distance from the path where capture forces apply.","notes":["\"Distance from the path\" is measured perpendicular to the curve."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Distance from the path where capture forces apply.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"捕获力在离路径多远处生效。"},"zh-Hant":{"decision":"translate","text":"捕捉力會在距離路徑多遠的位置生效。"},"ja_JP":{"decision":"translate","text":"パスからどのくらい離れた位置までキャプチャ力が作用するかを指定します。"}}},
  {"key":"attrInfo:pathField.flowForce","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowForce","tooltip"],"source":"Strength of the force moving bodies along the path tangent.","notes":["\"Tangent\" here is the path’s direction of travel at a given point."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Strength of the force moving bodies along the path tangent.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"沿路径切线推动物体运动的力的强度。"},"zh-Hant":{"decision":"translate","text":"沿路徑切線推動物體運動的力的強度。"},"ja_JP":{"decision":"translate","text":"パスの接線方向に物体を動かす力の強さです。"}}},
  {"key":"attrInfo:pathField.flowGraph","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowGraph","tooltip"],"source":"Control how flow force attenuates with distance from the path.","notes":["\"Attenuates\" means gradually weakens/reduces."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Control how flow force attenuates with distance from the path.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"控制流动力随离路径距离增加而衰减的方式。"},"zh-Hant":{"decision":"translate","text":"控制流動力隨離路徑距離增加而衰減的方式。"},"ja_JP":{"decision":"translate","text":"パスからの距離に応じて、フロー力が減衰する度合いを制御します。"}}},
  {"key":"attrInfo:pathField.flowMargin","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowMargin","tooltip"],"source":"Distance from the path where flow forces apply.","notes":["\"Distance from the path\" is measured perpendicular to the curve."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Distance from the path where flow forces apply.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"流动力在离路径多远处生效。"},"zh-Hant":{"decision":"translate","text":"流動力會在距離路徑多遠的位置生效。"},"ja_JP":{"decision":"translate","text":"パスからどのくらい離れた位置までフロー力が作用するかを指定します。"}}},
  {"key":"attrInfo:pathField.flowVariance","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowVariance","tooltip"],"source":"Add randomness to flow direction for more natural motion.","notes":["\"Randomness\" here is a controlled amount of procedural variation."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Add randomness to flow direction for more natural motion.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"为流动方向添加随机变化，使运动更自然。"},"zh-Hant":{"decision":"translate","text":"為流動方向加入隨機變化，使運動更自然。"},"ja_JP":{"decision":"translate","text":"フロー方向にばらつきを加え、動きを自然にします。"}}},
  {"key":"attrInfo:pathField.pathToFollow","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","pathToFollow","tooltip"],"source":"Connect a Shape to define the path that bodies will follow.","notes":["\"Connect\" here means linking a node in the graph as an input."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Connect a Shape to define the path that bodies will follow.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"连接一个形状，用它定义物体要跟随的路径。"},"zh-Hant":{"decision":"translate","text":"連接一個形狀，用它定義物體要追隨的路徑。"},"ja_JP":{"decision":"translate","text":"シェイプを接続し、物体が追従するパスを定義します。"}}},
  {"key":"attrInfo:pathField.velocityDamping","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","velocityDamping","tooltip"],"source":"Opposes body velocity to prevent oscillation and instability. Higher values create more stable but slower motion.","notes":["\"Oscillation\" means unwanted back-and-forth jittering motion."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Opposes body velocity to prevent oscillation and instability. Higher values create more stable but slower motion.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"抑制物体速度，避免振荡和不稳定。值越高，运动越稳定，但速度越慢。"},"zh-Hant":{"decision":"translate","text":"抑制物體速度，避免振盪和不穩定。值越高，運動越穩定，但速度越慢。"},"ja_JP":{"decision":"translate","text":"物体の速度を抑えて振動や不安定さを防ぎます。値を大きくすると動きは安定しますが、遅くなります。"}}},
  {"key":"nodeAttr:pathField.captureForce","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","captureForce","name"],"source":"Capture Force","notes":["As in \"the Capture Force pulling bodies to the path\" — the strength drawing bodies toward the path."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Capture Force","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"捕获力"},"zh-Hant":{"decision":"translate","text":"捕捉力"},"ja_JP":{"decision":"translate","text":"キャプチャ力"}}},
  {"key":"nodeAttr:pathField.captureGraph","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","captureGraph","name"],"source":"Capture Curve","notes":["As in \"edit the Capture Curve\" — a graph controlling how capture force fades with distance."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Capture Curve","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"捕获曲线"},"zh-Hant":{"decision":"translate","text":"捕捉曲線"},"ja_JP":{"decision":"translate","text":"キャプチャカーブ"}}},
  {"key":"nodeAttr:pathField.captureMargin","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","captureMargin","name"],"source":"Capture Margin","notes":["As in \"the Capture Margin around the path\" — the distance range where the capture force takes effect."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Capture Margin","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"捕获范围"},"zh-Hant":{"decision":"translate","text":"捕捉範圍"},"ja_JP":{"decision":"translate","text":"キャプチャ範囲"}}},
  {"key":"nodeAttr:pathField.drawCaptureMargin","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","drawCaptureMargin"],"source":"Draw Capture Margin","notes":["As in \"Draw Capture Margin\" — display the capture margin as a visual guide in the viewport."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Draw Capture Margin","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"显示捕获范围"},"zh-Hant":{"decision":"translate","text":"顯示捕捉範圍"},"ja_JP":{"decision":"translate","text":"キャプチャ範囲を表示"}}},
  {"key":"nodeAttr:pathField.drawFlowMargin","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","drawFlowMargin"],"source":"Draw Flow Margin","notes":["As in \"Draw Flow Margin\" — display the flow margin as a visual guide in the viewport."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Draw Flow Margin","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"显示流动范围"},"zh-Hant":{"decision":"translate","text":"顯示流動範圍"},"ja_JP":{"decision":"translate","text":"フロー範囲を表示"}}},
  {"key":"nodeAttr:pathField.flowForce","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowForce","name"],"source":"Flow Force","notes":["As in \"the Flow Force moving bodies along the path\" — the force driving movement along the path’s direction."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Flow Force","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"流动力"},"zh-Hant":{"decision":"translate","text":"流動力"},"ja_JP":{"decision":"translate","text":"フロー力"}}},
  {"key":"nodeAttr:pathField.flowGraph","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowGraph","name"],"source":"Flow Curve","notes":["As in \"edit the Flow Curve\" — a graph controlling how flow force fades with distance."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Flow Curve","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"流动曲线"},"zh-Hant":{"decision":"translate","text":"流動曲線"},"ja_JP":{"decision":"translate","text":"フローカーブ"}}},
  {"key":"nodeAttr:pathField.flowMargin","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowMargin","name"],"source":"Flow Margin","notes":["As in \"the Flow Margin around the path\" — the distance range where the flow force takes effect."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Flow Margin","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"流动范围"},"zh-Hant":{"decision":"translate","text":"流動範圍"},"ja_JP":{"decision":"translate","text":"フロー範囲"}}},
  {"key":"nodeAttr:pathField.flowVariance","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","flowVariance","name"],"source":"Flow Variance","notes":["As in \"add Flow Variance for natural motion\" — random variation in the flow direction."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Flow Variance","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"流动方向随机性"},"zh-Hant":{"decision":"translate","text":"流動方向隨機性"},"ja_JP":{"decision":"translate","text":"フロー方向のばらつき"}}},
  {"key":"nodeAttr:pathField.pathToFollow","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","pathToFollow","name"],"source":"Path to Follow","notes":["As in \"connect the Path to Follow\" — the curve shape bodies are guided along."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Path to Follow","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"跟随路径"},"zh-Hant":{"decision":"translate","text":"追隨路徑"},"ja_JP":{"decision":"translate","text":"追従するパス"}}},
  {"key":"nodeAttr:pathField.velocityDamping","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["attributes","velocityDamping","name"],"source":"Velocity Damping","notes":["As in \"increase Velocity Damping to stabilise motion\" — reducing a body’s speed to prevent oscillation."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Velocity Damping","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"速度阻尼"},"zh-Hant":{"decision":"translate","text":"速度阻尼"},"ja_JP":{"decision":"translate","text":"速度ダンピング"}}},
  {"key":"nodeInfo:pathField","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["info","tooltip"],"source":"Apply path-following forces to Shapes.","notes":["\"Path-following\" means forces that pull bodies along a defined curve/path."],"sourceRole":"node-info","displayRole":"node-info","dontTranslate":false,"vendorJapanese":"Apply path-following forces to Shapes.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"对形状施加路径跟随力。"},"zh-Hant":{"decision":"translate","text":"對形狀施加路徑追隨力。"},"ja_JP":{"decision":"translate","text":"シェイプにパスに追従させる力を加えます。"}}},
  {"key":"nodeName:pathField","catalogId":"Definitions/Translation/nodeStrings","owner":"pathField","fieldPath":["info","name"],"source":"Path Field","notes":["\"Path\" here means a vector curve/shape outline that objects follow; \"Field\" means a force field in a physics simulation."],"sourceRole":"node-name","displayRole":"node-name","dontTranslate":false,"vendorJapanese":"Path Field","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"路径力场"},"zh-Hant":{"decision":"translate","text":"路徑力場"},"ja_JP":{"decision":"translate","text":"パスフィールド"}}},
];
module.exports = { provenance, entries };
