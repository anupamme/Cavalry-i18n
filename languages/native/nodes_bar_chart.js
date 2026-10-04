/**
 * [INPUT]: 绑定官方Cavalry 2.8 barChart整域source/notes/roles、AGY V3与独立全域审校后的根审批。
 * [OUTPUT]: 构建期提供13个source-bound显示键及三语决定；统计Nominal按分类资料语境，柱高不误作表格列，堆叠/并排与各间隔独立，不改模型/算法。
 * [POS]: languages/native的barChart完整owner；显式approved_modules装配至producer，不代表真实部署或live。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 审定显示输入显式装配；审批谱系不进入运行时strings包 ------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "qtVersion": "6.9.2",
    "bundleIdentifier": "com.scenegroup.cavalry",
    "catalogPath": "Definitions/Translation/nodeStrings_en-GB.source.json",
    "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
    "vendorJapanesePath": "Definitions/Translation/nodeStrings_ja-JP.translation.json",
    "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439",
    "sourceJsonSha256": "d9621efd4a442435b3699c6fe5f76aef0d1ae31ed47cfc28c2970d69a213cc12",
    "sourcePairsSha256": "366f129add2a80afa7366ec5bfc5815da27bdb974363fec9597d558ef6569a12",
    "sourceIdentityAndNotesSha256": "c69c91fc087dc8bd58da35ffaea5afc52d3ca8d1e595b8cddaa38deac176d5f1",
    "sourceKeysSha256": "c9a96d7d0d297e607ac0cc39afe5dd7a67dbb37f6a656a14c09956f343f411bf",
    "officialTargetManifestSha256": "b6c6c6de1145035dc5ead1f21daf27d405de79fb70f430ecc828f6d09522be84",
    "officialSourcePairLedgerSha256": "7bb4ebbffc4a9f2c89f3e0202cc7901bfa8a9e39a57fc2ab3448305d83f8ea31",
    "candidateProvider": "AGY CLI",
    "candidateModel": "gemini-3.8-flash-high",
    "candidateCaptureSha256": "75dce8e0ea6571c7c9d92fe67d062eab4fef84b33a6141544ea823a98f50215d",
    "providerTerminalResultObserved": false,
    "workingAdjudicationSha256": "7e9ceebee8e3b9d19cc6b8faaf6b4f5725debe35f3809b9315dcce307ef2af20",
    "workingFindingCount": 83,
    "workingAdjudicationCounts": {
      "accepted": 80,
      "rejected": 2,
      "modified": 1
    },
    "workingAdjudicationStatus": "root-adjudicated 83; immutable captured provider artifact retained",
    "independentReviewStatus": "complete source200/locale600 review and independent stage contract audit",
    "approvalState": "approved-source-bound-display-input",
    "approvalKind": "source-bound display input only; no deployment/live approval",
    "approvedBy": "primary-agent",
    "registryState": "registered-source-bound-display-input",
    "liveVerified": false,
    "candidateSourceJoin": "exact key plus exact source against role-aware official rows; legacy draft aggregate digest is historical owner-grouped lineage only",
    "owner": "barChart",
    "keyCount": 13,
    "decisionSlotCount": 39,
    "ownerSourcePairsSha256": "ec74785b4cd7edc987e98a150e1136c89b843c2f5934628d31965c6c0e1d1d0b",
    "ownerIdentityAndNotesSha256": "c7d424097c91544017e6122efbf37887232952d920e27c3b91b8af1a8cb8f777",
    "translationDecisionsSha256": "acbbe433e80397c68193aea2ffc88b66c9243361a4982a98d3d5d28c10c74c88",
    "ownerDecisionCounts": {
      "zh-Hans": {
        "translate": 13,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 13,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 13,
        "preserve": 0
      }
    },
    "technicalPreserveRationale": "No owner-specific technical source preserve.",
    "providerFinalResponseObserved": true,
    "explicitEndTurnMetadataObserved": false,
    "independentFullReviewReceiptSha256": "71d2ca9a76580028f10566b7dcfa11921bca28ec066279c81114283afcb0d1fc",
    "independentContractReviewReceiptSha256": "bd700d29816bc2eacf898b8e8aac19a52143a5125453e357c1c96c8a5d191c6e",
    "sourceApprovalSha256": "5d6bcbc40285ff92336bb30347e255fe94d890de140f1d69ec25d66ace215196",
    "rootAdjudicationSha256": "24b3c492cb326832aa135bbd6862bb35fe19224e88b9ebd2eef282b87ed1c1d0",
    "approvedAt": "2026-10-03T14:26:05.087849+00:00"
  },
  entries: [
    {"key":"nodeAttr:barChart.barWidth","source":"Bar Width","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["attributes","barWidth"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Bar Width","vendorJapaneseChanged":false,"notes":["As in \"set the Bar Width of each column\" — how wide each bar in the chart is drawn."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"柱状宽度"},"zh-Hant":{"decision":"translate","text":"柱狀寬度"},"ja_JP":{"decision":"translate","text":"バー幅"}}},
    {"key":"nodeAttr:barChart.file","source":"Spreadsheet","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["attributes","file"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Spreadsheet","vendorJapaneseChanged":false,"notes":["As in \"load a Spreadsheet file of data to chart\" — a table of rows and columns of data."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"电子表格"},"zh-Hant":{"decision":"translate","text":"試算表"},"ja_JP":{"decision":"translate","text":"スプレッドシート"}}},
    {"key":"nodeAttr:barChart.gapBetweenBars","source":"Bar Spacing","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["attributes","gapBetweenBars"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Bar Spacing","vendorJapaneseChanged":false,"notes":["As in \"set the Bar Spacing between adjacent bars\" — the gap left between neighbouring bars."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"柱状间距"},"zh-Hant":{"decision":"translate","text":"柱狀間距"},"ja_JP":{"decision":"translate","text":"バー間隔"}}},
    {"key":"nodeAttr:barChart.gapBetweenStacks","source":"Stacking Gap","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["attributes","gapBetweenStacks"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Stacking Gap","vendorJapaneseChanged":false,"notes":["As in \"set the Stacking Gap between groups of stacked bars\" — the space between separate stacked-bar groups."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"堆叠间隔"},"zh-Hant":{"decision":"translate","text":"堆疊間隔"},"ja_JP":{"decision":"translate","text":"スタック間隔"}}},
    {"key":"nodeAttr:barChart.maximumHeight","source":"Maximum Column Height","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["attributes","maximumHeight"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Maximum Column Height","vendorJapaneseChanged":false,"notes":["As in \"set the Maximum Column Height so tall values still fit\" — the tallest a bar is allowed to be drawn."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"最大柱高"},"zh-Hant":{"decision":"translate","text":"最大長條高度"},"ja_JP":{"decision":"translate","text":"最大バー高さ"}}},
    {"key":"nodeAttr:barChart.seriesMode","source":"Series Mode","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["attributes","seriesMode"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Series Mode","vendorJapaneseChanged":false,"notes":["\"Series\" is a data-visualisation term for a set of related data values plotted together on the chart."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"系列模式"},"zh-Hant":{"decision":"translate","text":"系列模式"},"ja_JP":{"decision":"translate","text":"シリーズモード"}}},
    {"key":"nodeAttr:barChart.xAxisColumn","source":"X Axis","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["attributes","xAxisColumn"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"X Axis","vendorJapaneseChanged":false,"notes":["As in \"choose the spreadsheet column used for the X Axis\" — the chart’s horizontal axis."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"X 轴"},"zh-Hant":{"decision":"translate","text":"X 軸"},"ja_JP":{"decision":"translate","text":"X 軸"}}},
    {"key":"nodeAttrEnum:barChart.dataType.0","source":"Number","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["enums","dataType","0"],"displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Number","vendorJapaneseChanged":false,"notes":["As in \"the column contains a Number value\" — numeric spreadsheet data."],"sourceRole":"enum-label","translations":{"zh-Hans":{"decision":"translate","text":"数字"},"zh-Hant":{"decision":"translate","text":"數字"},"ja_JP":{"decision":"translate","text":"数値"}}},
    {"key":"nodeAttrEnum:barChart.dataType.1","source":"Nominal","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["enums","dataType","1"],"displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Nominal","vendorJapaneseChanged":false,"notes":["\"Nominal\" is used here in its statistics sense, meaning categorical, label-based data."],"sourceRole":"enum-label","translations":{"zh-Hans":{"decision":"translate","text":"定类"},"zh-Hant":{"decision":"translate","text":"類別"},"ja_JP":{"decision":"translate","text":"名義"}}},
    {"key":"nodeAttrEnum:barChart.dataType.2","source":"Date","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["enums","dataType","2"],"displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Date","vendorJapaneseChanged":false,"notes":["As in \"the column contains a Date value\" — a calendar date."],"sourceRole":"enum-label","translations":{"zh-Hans":{"decision":"translate","text":"日期"},"zh-Hant":{"decision":"translate","text":"日期"},"ja_JP":{"decision":"translate","text":"日付"}}},
    {"key":"nodeAttrEnum:barChart.seriesMode.0","source":"Stacked","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["enums","seriesMode","0"],"displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Stacked","vendorJapaneseChanged":false,"notes":["As in \"display series as Stacked bars\" — bars drawn on top of each other."],"sourceRole":"enum-label","translations":{"zh-Hans":{"decision":"translate","text":"堆叠"},"zh-Hant":{"decision":"translate","text":"堆疊"},"ja_JP":{"decision":"translate","text":"スタック"}}},
    {"key":"nodeAttrEnum:barChart.seriesMode.1","source":"Side by Side","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["enums","seriesMode","1"],"displayRole":"enum-label","dontTranslate":false,"vendorJapanese":"Side by Side","vendorJapaneseChanged":false,"notes":["As in \"display series Side by Side\" — bars drawn next to each other."],"sourceRole":"enum-label","translations":{"zh-Hans":{"decision":"translate","text":"并排"},"zh-Hant":{"decision":"translate","text":"並排"},"ja_JP":{"decision":"translate","text":"横並び"}}},
    {"key":"nodeName:barChart","source":"Bar Chart","catalogId":"Definitions/Translation/nodeStrings","owner":"barChart","fieldPath":["info"],"displayRole":"node-name","dontTranslate":false,"vendorJapanese":"Bar Chart","vendorJapaneseChanged":false,"notes":["As in \"open the Bar Chart node\" — a chart made of column-shaped bars."],"sourceRole":"node-name","translations":{"zh-Hans":{"decision":"translate","text":"柱状图"},"zh-Hant":{"decision":"translate","text":"長條圖"},"ja_JP":{"decision":"translate","text":"棒グラフ"}}},
  ],
};
