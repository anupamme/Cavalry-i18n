/**
 * [INPUT]: 绑定root批准的Cavalry 2.8 randomDistribution完整官方source/notes/角色、厂商日语/DNT身份与修订译值。
 * [OUTPUT]: 构建期提供26个source-bound显示键及zh-Hans/zh-Hant/ja_JP决策文本，不将reason写入显示包。
 * [POS]: languages/native的randomDistribution完整owner投影；沿approved_modules显式装配到producer，不改模型/算法，也不证明部署或live。
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
  "ownerSourcePairsSha256": "f0ca6dfe30c90f6d8b1f6aa442127f4d5535e573582272657ddee8aefe8deb45",
  "ownerIdentityAndNotesSha256": "1655dee152c70399c5c2ae82bcf638fc6f5dc26b3b525db976efcd89df2aafb6",
  "keysetSha256": "3709edfcd116b64eb2c1f42dd04999d27e062d1df041e58f8a0a716bac1c9bfb",
  "translationDecisionsSha256": "acda3a8ddfd9540bf0614b64224ecbc67573319621e9a8f4cdc813487a314ad2",
  "owner": "randomDistribution",
  "keyCount": 26,
  "decisionSlotCount": 78,
  "ownerDecisionCounts": {
    "zh-Hans": {
      "translate": 26,
      "preserve": 0
    },
    "zh-Hant": {
      "translate": 26,
      "preserve": 0
    },
    "ja_JP": {
      "translate": 26,
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
  {"key":"attrInfo:randomDistribution.Threshold","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","Threshold","tooltip"],"source":"Min/max range Probability is compared against. Points whose probability falls inside the range are kept.","notes":["\"Range\" here is a numeric min/max band."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Min/max range Probability is compared against. Points whose probability falls inside the range are kept.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"用于比较概率的最小值/最大值范围。概率落在此范围内的点会被保留。"},"zh-Hant":{"decision":"translate","text":"用來比較機率的最小值／最大值範圍。機率落在此範圍內的點會保留。"},"ja_JP":{"decision":"translate","text":"確率と比較する最小値／最大値の範囲です。確率がこの範囲内に入るポイントを保持します。"}}},
  {"key":"attrInfo:randomDistribution.count","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","count","tooltip"],"source":"Number of random points to generate.","notes":["\"Generate\" here means computed/created by the algorithm."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Number of random points to generate.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"要生成的随机点数量。"},"zh-Hant":{"decision":"translate","text":"要產生的隨機點數量。"},"ja_JP":{"decision":"translate","text":"生成するランダムポイントの数です。"}}},
  {"key":"attrInfo:randomDistribution.keepShape","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","keepShape","tooltip"],"source":"When on, points pushed outside the bounding shape during relaxation are culled rather than clamped.","notes":["\"Culled\" means removed entirely; \"clamped\" means kept but pulled back within the boundary."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"When on, points pushed outside the bounding shape during relaxation are culled rather than clamped.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用时，松弛过程中被推到边界形状外的点会被剔除，而不是钳制在边界内。"},"zh-Hant":{"decision":"translate","text":"啟用時，鬆弛過程中被推到邊界形狀外的點會被剔除，而不是限制在邊界內。"},"ja_JP":{"decision":"translate","text":"オンにすると、リラックス処理中に境界形状の外へ押し出されたポイントは、境界内にクランプされずに除去されます。"}}},
  {"key":"attrInfo:randomDistribution.maxRelaxIterations","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","maxRelaxIterations","tooltip"],"source":"Maximum number of relaxation passes. Higher values produce more even spacing at the cost of compute.","notes":["\"Compute\" here means processing time/resources used."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Maximum number of relaxation passes. Higher values produce more even spacing at the cost of compute.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"松弛迭代的最大次数。值越高，点间距越均匀，但计算量也越大。"},"zh-Hant":{"decision":"translate","text":"鬆弛迭代的最大次數。值越高，點間距越均勻，但計算量也越大。"},"ja_JP":{"decision":"translate","text":"リラックス処理の最大反復回数です。値を大きくするとポイント間隔がより均等になりますが、計算量が増えます。"}}},
  {"key":"attrInfo:randomDistribution.probability","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","probability","tooltip"],"source":"Per-point probability (0–1) of being kept when Use Probability is on. Combined with the Threshold range.","notes":["\"Threshold range\" here is a min/max band a probability value must fall within to pass."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Per-point probability (0–1) of being kept when Use Probability is on. Combined with the Threshold range.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用“使用概率”时，每个点被保留的概率（0–1）。此值与“阈值”范围共同生效。"},"zh-Hant":{"decision":"translate","text":"啟用「使用機率」時，每個點被保留的機率（0–1）。此值與「閾值」範圍共同生效。"},"ja_JP":{"decision":"translate","text":"「確率を使用」がオンのときに各ポイントを保持する確率（0～1）です。「しきい値」の範囲と組み合わせて使います。"}}},
  {"key":"attrInfo:randomDistribution.relaxDistance","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","relaxDistance","tooltip"],"source":"Minimum allowed distance between any two points when Relax is on, in pixels.","notes":["\"Relax\" here is an algorithm step that nudges points apart to avoid clumping."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Minimum allowed distance between any two points when Relax is on, in pixels.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用“松弛”时，任意两点之间允许的最小距离，单位为像素。"},"zh-Hant":{"decision":"translate","text":"啟用「鬆弛」時，任意兩點之間允許的最小距離，單位為像素。"},"ja_JP":{"decision":"translate","text":"「リラックス」がオンのときの、任意の2ポイント間の最小距離です。単位はピクセルです。"}}},
  {"key":"attrInfo:randomDistribution.relaxMode","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","relaxMode","tooltip"],"source":"When on, points are iteratively pushed apart so no two are closer than Relax Distance. Produces a Poisson-disc-like spread.","notes":["\"Poisson-disc\" refers to a technique for generating randomly placed points that are evenly spread out, with no two points closer than a set minimum distance."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"When on, points are iteratively pushed apart so no two are closer than Relax Distance. Produces a Poisson-disc-like spread.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用后会反复推开各点，使任意两点间距都不小于“松弛距离”，形成类似泊松圆盘的分布。"},"zh-Hant":{"decision":"translate","text":"啟用後會反覆推開各點，使任意兩點間距都不小於「鬆弛距離」，形成類似泊松圓盤的分布。"},"ja_JP":{"decision":"translate","text":"オンにするとポイントを反復して押し離し、任意の2ポイント間が「リラックス距離」未満にならないようにします。ポアソンディスク状の分布になります。"}}},
  {"key":"attrInfo:randomDistribution.seed","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","seed","tooltip"],"source":"Integer seed for the random generator. The same seed always produces the same point set.","notes":["\"Seed\" here is a starting number for the random algorithm so results are reproducible."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Integer seed for the random generator. The same seed always produces the same point set.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"随机数生成器的整数种子。相同种子始终生成相同的点集。"},"zh-Hant":{"decision":"translate","text":"亂數產生器的整數種子。相同種子始終產生相同的點集合。"},"ja_JP":{"decision":"translate","text":"乱数ジェネレーターに渡す整数シードです。同じシードでは常に同じポイント群が生成されます。"}}},
  {"key":"attrInfo:randomDistribution.shapeType","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","shapeType","tooltip"],"source":"Region the points are scattered inside: Rectangle (the Size box) or Ellipse (inscribed in Size).","notes":["\"Inscribed\" here is a geometry term: the ellipse is drawn to fit exactly within the rectangular Size area."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Region the points are scattered inside: Rectangle (the Size box) or Ellipse (inscribed in Size).","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"点的散布区域：由“区域大小”定义的矩形，或内切于该矩形的椭圆。"},"zh-Hant":{"decision":"translate","text":"點的散布區域：由「區域大小」定義的矩形，或內切於該矩形的橢圓。"},"ja_JP":{"decision":"translate","text":"ポイントを散布する領域です。「領域サイズ」で指定した矩形、またはその矩形に内接する楕円を選びます。"}}},
  {"key":"attrInfo:randomDistribution.size","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","size","tooltip"],"source":"Width and height of the area within which points are scattered, in pixels.","notes":["\"Scattered\" here means randomly placed within the area."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Width and height of the area within which points are scattered, in pixels.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"点的散布区域的宽度和高度，单位为像素。"},"zh-Hant":{"decision":"translate","text":"點的散布區域的寬度和高度，單位為像素。"},"ja_JP":{"decision":"translate","text":"ポイントを散布する領域の幅と高さです。単位はピクセルです。"}}},
  {"key":"attrInfo:randomDistribution.useProbability","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","useProbability","tooltip"],"source":"When on, each candidate point is randomly accepted or rejected based on Probability and Threshold, thinning the result.","notes":["\"Thinning\" here means reducing the number of points in the result."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"When on, each candidate point is randomly accepted or rejected based on Probability and Threshold, thinning the result.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"启用后，根据“概率”和“阈值”随机接受或拒绝每个候选点，从而减少最终点数。"},"zh-Hant":{"decision":"translate","text":"啟用後，根據「機率」和「閾值」隨機接受或拒絕每個候選點，藉此減少最終點數。"},"ja_JP":{"decision":"translate","text":"オンにすると、「確率」と「しきい値」に基づいて候補ポイントをランダムに採用または除外し、最終的なポイント数を減らします。"}}},
  {"key":"nodeAttr:randomDistribution.Threshold","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","Threshold","name"],"source":"Threshold","notes":["As in \"set the Threshold range Probability is tested against\" — a min/max numeric band."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Threshold","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"阈值"},"zh-Hant":{"decision":"translate","text":"閾值"},"ja_JP":{"decision":"translate","text":"しきい値"}}},
  {"key":"nodeAttr:randomDistribution.count","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","count","name"],"source":"Count","notes":["As in \"set the Count of random points to generate\" — how many points are created."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Count","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"数量"},"zh-Hant":{"decision":"translate","text":"數量"},"ja_JP":{"decision":"translate","text":"数"}}},
  {"key":"nodeAttr:randomDistribution.keepShape","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","keepShape","name"],"source":"Keep Shape","notes":["As in \"enable Keep Shape to constrain points to a region shape\" — a toggle switch."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Keep Shape","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"保持点在形状内"},"zh-Hant":{"decision":"translate","text":"保持點在形狀內"},"ja_JP":{"decision":"translate","text":"形状内にポイントを保持"}}},
  {"key":"nodeAttr:randomDistribution.maxRelaxIterations","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","maxRelaxIterations","name"],"source":"Max Iterations","notes":["As in \"increase Max Iterations for more even spacing\" — the number of algorithm passes."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Max Iterations","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"最大迭代次数"},"zh-Hant":{"decision":"translate","text":"最大迭代次數"},"ja_JP":{"decision":"translate","text":"最大反復回数"}}},
  {"key":"nodeAttr:randomDistribution.probability","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","probability","name"],"source":"Probability","notes":["As in \"set the Probability a point survives filtering\" — a chance value between 0 and 1."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Probability","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"概率"},"zh-Hant":{"decision":"translate","text":"機率"},"ja_JP":{"decision":"translate","text":"確率"}}},
  {"key":"nodeAttr:randomDistribution.relaxDistance","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","relaxDistance","name"],"source":"Relax Distance","notes":["As in \"increase Relax Distance to spread points apart\" — a minimum spacing in pixels."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Relax Distance","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"松弛距离"},"zh-Hant":{"decision":"translate","text":"鬆弛距離"},"ja_JP":{"decision":"translate","text":"リラックス距離"}}},
  {"key":"nodeAttr:randomDistribution.relaxMode","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","relaxMode","name"],"source":"Relax","notes":["\"Relax\" refers to an algorithm that iteratively pushes points apart until they are evenly spaced."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Relax","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"松弛"},"zh-Hant":{"decision":"translate","text":"鬆弛"},"ja_JP":{"decision":"translate","text":"リラックス"}}},
  {"key":"nodeAttr:randomDistribution.seed","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","seed","name"],"source":"Seed","notes":["\"Seed\" refers to the starting number fed into a random-number generator."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Seed","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"种子"},"zh-Hant":{"decision":"translate","text":"種子"},"ja_JP":{"decision":"translate","text":"シード"}}},
  {"key":"nodeAttr:randomDistribution.shapeType","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","shapeType","name"],"source":"Shape","notes":["As in \"choose the Shape points are scattered inside: Rectangle or Ellipse\" — the region’s geometric outline."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Shape","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"形状"},"zh-Hant":{"decision":"translate","text":"形狀"},"ja_JP":{"decision":"translate","text":"形状"}}},
  {"key":"nodeAttr:randomDistribution.size","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","size","name"],"source":"Size","notes":["As in \"set the Size of the scatter area\" — its width and height in pixels."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Size","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"区域大小"},"zh-Hant":{"decision":"translate","text":"區域大小"},"ja_JP":{"decision":"translate","text":"領域サイズ"}}},
  {"key":"nodeAttr:randomDistribution.useProbability","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["attributes","useProbability","name"],"source":"Use Probability","notes":["As in \"enable Use Probability to randomly thin the points\" — a toggle switch."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Use Probability","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"使用概率"},"zh-Hant":{"decision":"translate","text":"使用機率"},"ja_JP":{"decision":"translate","text":"確率を使用"}}},
  {"key":"nodeAttrEnum:randomDistribution.shapeType.0","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["enums","shapeType","0"],"source":"Rectangle","notes":["As in \"scatter points inside a Rectangle\" — the four-sided geometric region."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Rectangle","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"矩形"},"zh-Hant":{"decision":"translate","text":"矩形"},"ja_JP":{"decision":"translate","text":"長方形"}}},
  {"key":"nodeAttrEnum:randomDistribution.shapeType.1","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["enums","shapeType","1"],"source":"Ellipse","notes":["As in \"scatter points inside an Ellipse\" — an oval geometric region)."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Ellipse","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"椭圆"},"zh-Hant":{"decision":"translate","text":"橢圓"},"ja_JP":{"decision":"translate","text":"楕円"}}},
  {"key":"nodeInfo:randomDistribution","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["info","tooltip"],"source":"Distribute points to random positions.","notes":["\"Positions\" here are X/Y coordinates."],"sourceRole":"node-info","displayRole":"node-info","dontTranslate":false,"vendorJapanese":"Distribute points to random positions.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"将点分布到随机位置。"},"zh-Hant":{"decision":"translate","text":"將點分布到隨機位置。"},"ja_JP":{"decision":"translate","text":"ポイントをランダムな位置に配置します。"}}},
  {"key":"nodeName:randomDistribution","catalogId":"Definitions/Translation/nodeStrings","owner":"randomDistribution","fieldPath":["info","name"],"source":"Random","notes":["The name of a behaviour that scatters points unpredictably."],"sourceRole":"node-name","displayRole":"node-name","dontTranslate":false,"vendorJapanese":"Random","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"随机"},"zh-Hant":{"decision":"translate","text":"隨機"},"ja_JP":{"decision":"translate","text":"ランダム"}}},
];
module.exports = { provenance, entries };
