/**
 * [INPUT]: 绑定root批准的Cavalry 2.8 thirdPartyFilter完整官方source/notes/角色、厂商日语/DNT身份与修订译值。
 * [OUTPUT]: 构建期提供26个source-bound显示键及zh-Hans/zh-Hant/ja_JP决策文本，不将reason写入显示包。
 * [POS]: languages/native的thirdPartyFilter完整owner投影；沿approved_modules显式装配到producer，不改模型/算法，也不证明部署或live。
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
  "ownerSourcePairsSha256": "76f3e8ceae0badbcc694905082de67304fbe6482a299de84ad225a3ee7b5c094",
  "ownerIdentityAndNotesSha256": "21e4e3c8c91454fa6c777f854e029218cba023d5888555e18a4c1eb5c07bbb91",
  "keysetSha256": "64997666c58e201ab1c048be94181a56f8bef0aa3bb0bf014326b34c35673228",
  "translationDecisionsSha256": "6083befac07ee09e11274875040914c3aa8d0aa654fbfc1e1572a6e784cf5c86",
  "owner": "thirdPartyFilter",
  "keyCount": 26,
  "decisionSlotCount": 78,
  "ownerDecisionCounts": {
    "zh-Hans": {
      "translate": 24,
      "preserve": 2
    },
    "zh-Hant": {
      "translate": 24,
      "preserve": 2
    },
    "ja_JP": {
      "translate": 24,
      "preserve": 2
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
  "preserveKeys": [
    "nodeAttrEnum:thirdPartyFilter.samplingQuality.2",
    "nodeAttrEnum:thirdPartyFilter.samplingQuality.3"
  ],
  "officialDntCount": 1,
  "technicalPreserveRationale": "Catmull-Rom is source DNT; Mitchell is source dontTranslate=false but retained as named algorithm per source notes.",
  "liveVerified": false,
  "live": "NOT_RUN",
  "publicRelease": "NOT_APPROVED"
};
const entries = [
  {"key":"attrInfo:thirdPartyFilter.samplingQuality","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["attributes","samplingQuality","tooltip"],"source":"Controls how the image is sampled/interpolated.","notes":["As in \"controls how the image is sampled/interpolated\" — describes the technical method used to read pixel colours when resizing."],"sourceRole":"attribute-info","displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Controls how the image is sampled/interpolated.","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"控制图像的采样/插值方式。"},"zh-Hant":{"decision":"translate","text":"控制影像的取樣／插值方式。"},"ja_JP":{"decision":"translate","text":"画像のサンプリング／補間方法を制御します。"}}},
  {"key":"nodeAttr:thirdPartyFilter.blendMode","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["attributes","blendMode"],"source":"Blend Mode","notes":["As in \"Blend Mode\" — the setting controlling how this Filter’s output combines with the layer beneath it, \"Mode\" being a noun for a selectable option."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Blend Mode","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"混合模式"},"zh-Hant":{"decision":"translate","text":"混合模式"},"ja_JP":{"decision":"translate","text":"描画モード"}}},
  {"key":"nodeAttr:thirdPartyFilter.renderPassesOffscreen","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["attributes","renderPassesOffscreen"],"source":"Render Passes Offscreen","notes":["Here, \"Passes\" is a noun referring to individual rendering stages."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Render Passes Offscreen","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"离屏渲染阶段"},"zh-Hant":{"decision":"translate","text":"離屏算繪階段"},"ja_JP":{"decision":"translate","text":"オフスクリーンレンダリングパス"}}},
  {"key":"nodeAttr:thirdPartyFilter.samplingQuality","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["attributes","samplingQuality","name"],"source":"Sampling Quality","notes":["As in \"Sampling Quality\" — how finely pixel colours are read/interpolated when an image is resized, \"Sampling\" here is an imaging term."],"sourceRole":"attribute-label","displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Sampling Quality","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"采样质量"},"zh-Hant":{"decision":"translate","text":"取樣品質"},"ja_JP":{"decision":"translate","text":"サンプリング品質"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.1","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","1"],"source":"Replace","notes":["As in the \"Replace\" blend mode, which overwrites the pixels underneath with the new pixel values — a verb used as the name of a mode."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Replace","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"替换"},"zh-Hant":{"decision":"translate","text":"替換"},"ja_JP":{"decision":"translate","text":"置換"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.12","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","12"],"source":"Plus","notes":["As in the \"Plus\" blend mode, which adds pixel colour values together to brighten the result."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Plus","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"相加"},"zh-Hant":{"decision":"translate","text":"相加"},"ja_JP":{"decision":"translate","text":"加算"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.14","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","14"],"source":"Screen","notes":["\"Screen\" here names a specific way of blending colours (based on inverted multiplication)."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Screen","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"滤色"},"zh-Hant":{"decision":"translate","text":"濾色"},"ja_JP":{"decision":"translate","text":"スクリーン"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.15","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","15"],"source":"Overlay","notes":["As in the \"Overlay\" blend mode, which boosts contrast by combining lightening and darkening effects."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Overlay","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"叠加"},"zh-Hant":{"decision":"translate","text":"疊加"},"ja_JP":{"decision":"translate","text":"オーバーレイ"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.16","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","16"],"source":"Darken","notes":["As in the \"Darken\" blend mode, which keeps whichever of the two layers is darker at each pixel — a verb used as a mode name."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Darken","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"变暗"},"zh-Hant":{"decision":"translate","text":"變暗"},"ja_JP":{"decision":"translate","text":"比較（暗）"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.17","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","17"],"source":"Lighten","notes":["As in the \"Lighten\" blend mode, which keeps whichever of the two layers is lighter at each pixel — a verb used as a mode name."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Lighten","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"变亮"},"zh-Hant":{"decision":"translate","text":"變亮"},"ja_JP":{"decision":"translate","text":"比較（明）"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.18","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","18"],"source":"Color Dodge","notes":["\"Dodge\" is a photography darkroom term for selectively lightening part of an image."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Color Dodge","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"颜色减淡"},"zh-Hant":{"decision":"translate","text":"顏色減淡"},"ja_JP":{"decision":"translate","text":"覆い焼きカラー"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.19","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","19"],"source":"Color Burn","notes":["\"Burn\" is a photography darkroom term for selectively darkening part of an image."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Color Burn","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"颜色加深"},"zh-Hant":{"decision":"translate","text":"顏色加深"},"ja_JP":{"decision":"translate","text":"焼き込みカラー"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.20","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","20"],"source":"Hard Light","notes":["As in the \"Hard Light\" blend mode, which simulates a harsh light source shining on the layers below."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Hard Light","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"强光"},"zh-Hant":{"decision":"translate","text":"強光"},"ja_JP":{"decision":"translate","text":"ハードライト"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.21","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","21"],"source":"Soft Light","notes":["As in the \"Soft Light\" blend mode, a gentler version of Hard Light that simulates a diffuse light source."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Soft Light","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"柔光"},"zh-Hant":{"decision":"translate","text":"柔光"},"ja_JP":{"decision":"translate","text":"ソフトライト"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.22","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","22"],"source":"Difference","notes":["As in the \"Difference\" blend mode, which subtracts the darker colour from the lighter one per channel."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Difference","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"差值"},"zh-Hant":{"decision":"translate","text":"差值"},"ja_JP":{"decision":"translate","text":"差の絶対値"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.23","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","23"],"source":"Exclusion","notes":["As in the \"Exclusion\" blend mode, similar to Difference but lower contrast."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Exclusion","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"排除"},"zh-Hant":{"decision":"translate","text":"排除"},"ja_JP":{"decision":"translate","text":"除外"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.24","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","24"],"source":"Multiply","notes":["As in the \"Multiply\" blend mode, which multiplies the colour values of two layers together to darken the result — a verb used as a mode name."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Multiply","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"正片叠底"},"zh-Hant":{"decision":"translate","text":"正片疊底"},"ja_JP":{"decision":"translate","text":"乗算"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.25","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","25"],"source":"Hue","notes":["As in the \"Hue\" blend mode, which takes the hue (colour-wheel position) of the top layer while keeping the base’s saturation and brightness."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Hue","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"色相"},"zh-Hant":{"decision":"translate","text":"色相"},"ja_JP":{"decision":"translate","text":"色相"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.26","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","26"],"source":"Saturation","notes":["As in the \"Saturation\" blend mode, which takes the colour intensity of the top layer while keeping the base’s hue and brightness, unrelated to chemical saturation."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Saturation","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"饱和度"},"zh-Hant":{"decision":"translate","text":"飽和度"},"ja_JP":{"decision":"translate","text":"彩度"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.27","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","27"],"source":"Color","notes":["As in the \"Color\" blend mode, which takes the hue and saturation of the top layer while keeping the base’s brightness."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Color","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"颜色"},"zh-Hant":{"decision":"translate","text":"顏色"},"ja_JP":{"decision":"translate","text":"カラー"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.28","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","28"],"source":"Luminosity","notes":["As in the \"Luminosity\" blend mode, which takes the brightness of the top layer while keeping the base’s hue and saturation."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Luminosity","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"明度"},"zh-Hant":{"decision":"translate","text":"明度"},"ja_JP":{"decision":"translate","text":"輝度"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.blendMode.3","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","blendMode","3"],"source":"Normal","notes":["As in the \"Normal\" blend mode — the default, unmodified way two layers combine.\""],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Normal","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"正常"},"zh-Hant":{"decision":"translate","text":"正常"},"ja_JP":{"decision":"translate","text":"通常"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.samplingQuality.0","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","samplingQuality","0"],"source":"Nearest Neighbour","notes":["\"Nearest Neighbour\" here names a specific image-scaling algorithm."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Nearest Neighbour","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"最近邻"},"zh-Hant":{"decision":"translate","text":"最近鄰"},"ja_JP":{"decision":"translate","text":"最近傍"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.samplingQuality.1","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","samplingQuality","1"],"source":"Bilinear","notes":["As in \"Bilinear\" sampling — an interpolation method that averages the four nearest pixels, a technical imaging term."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Bilinear","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"translate","text":"双线性"},"zh-Hant":{"decision":"translate","text":"雙線性"},"ja_JP":{"decision":"translate","text":"バイリニア"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.samplingQuality.2","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","samplingQuality","2"],"source":"Catmull-Rom","notes":["\"Catmull-Rom\" names a specific image-scaling algorithm."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":true,"vendorJapanese":"Catmull-Rom","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"preserve","text":"Catmull-Rom"},"zh-Hant":{"decision":"preserve","text":"Catmull-Rom"},"ja_JP":{"decision":"preserve","text":"Catmull-Rom"}}},
  {"key":"nodeAttrEnum:thirdPartyFilter.samplingQuality.3","catalogId":"Definitions/Translation/nodeStrings","owner":"thirdPartyFilter","fieldPath":["enums","samplingQuality","3"],"source":"Mitchell","notes":["\"Mitchell\" names a specific image-scaling algorithm (Mitchell-Netravali)."],"sourceRole":"enum-label","displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Mitchell","vendorJapaneseChanged":false,"translations":{"zh-Hans":{"decision":"preserve","text":"Mitchell"},"zh-Hant":{"decision":"preserve","text":"Mitchell"},"ja_JP":{"decision":"preserve","text":"Mitchell"}}},
];
module.exports = { provenance, entries };
