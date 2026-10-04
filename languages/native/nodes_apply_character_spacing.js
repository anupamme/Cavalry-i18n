/**
 * [INPUT]: 绑定官方Cavalry 2.8 applyCharacterSpacing整域source/notes/roles、AGY V3与独立全域审校后的根审批。
 * [OUTPUT]: 构建期提供8个source-bound显示键及三语决定；保留每个正则相符范围末尾额外间距，与既有Kerning/Character Spacing显示词区分，不改模型/算法。
 * [POS]: languages/native的applyCharacterSpacing完整owner；显式approved_modules装配至producer，不代表真实部署或live。
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
    "owner": "applyCharacterSpacing",
    "keyCount": 8,
    "decisionSlotCount": 24,
    "ownerSourcePairsSha256": "55bc8037ef991b597773b9547b8094343f893f6f027c1332f9bd5cd1ad081315",
    "ownerIdentityAndNotesSha256": "6393451168b1d0eeb29328f9f7a385b8238a3e58230ff493ede2c7e00d0d0bc9",
    "translationDecisionsSha256": "4bff9c9d6e2bd5ebf2b518ae79f65a1f1882c1ec52550755f37cab338d1e0ae0",
    "ownerDecisionCounts": {
      "zh-Hans": {
        "translate": 8,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 8,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 8,
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
    {"key":"attrInfo:applyCharacterSpacing.pairs","source":"List of regex/spacing rules. Each rule searches the text for matches and inserts extra spacing at the end of every match.","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["attributes","pairs","tooltip"],"displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"List of regex/spacing rules. Each rule searches the text for matches and inserts extra spacing at the end of every match.","vendorJapaneseChanged":false,"notes":["Regex (regular expression) is a text pattern-matching syntax."],"sourceRole":"attribute-info","translations":{"zh-Hans":{"decision":"translate","text":"正则表达式/间距规则列表。每条规则在文本中搜索匹配项，并在每个匹配项末尾插入额外的间距。"},"zh-Hant":{"decision":"translate","text":"正則表達式/間距規則清單。每條規則會在文字中搜尋相符項，並在每個相符項結尾插入額外間距。"},"ja_JP":{"decision":"translate","text":"正規表現/間隔ルールのリスト。各ルールはテキスト内のマッチを検索し、すべてのマッチの末尾に追加の間隔を挿入します。"}}},
    {"key":"attrInfo:applyCharacterSpacing.pairs.matchString","source":"Regular expression searched in the text. Each match becomes a kerning point.","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["attributes","pairs.matchString","tooltip"],"displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Regular expression searched in the text. Each match becomes a kerning point.","vendorJapaneseChanged":false,"notes":["Kerning is the adjustment of spacing between specific pairs of characters, for example tightening the gap in ‘AV’."],"sourceRole":"attribute-info","translations":{"zh-Hans":{"decision":"translate","text":"在文本中搜索的正则表达式。每个匹配项都会成为一个字距调整点。"},"zh-Hant":{"decision":"translate","text":"在文字中搜尋的正則表達式。每個相符項都會成為一個字距調整點。"},"ja_JP":{"decision":"translate","text":"テキスト内で検索される正規表現。各マッチがカーニングポイントになります。"}}},
    {"key":"attrInfo:applyCharacterSpacing.pairs.spacing","source":"Extra horizontal space inserted at the end of each match, in pixels.","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["attributes","pairs.spacing","tooltip"],"displayRole":"attribute-info","dontTranslate":false,"vendorJapanese":"Extra horizontal space inserted at the end of each match, in pixels.","vendorJapaneseChanged":false,"notes":["\"Match\" here refers to a matched range of text found by a search."],"sourceRole":"attribute-info","translations":{"zh-Hans":{"decision":"translate","text":"在每个匹配项末尾插入的额外水平间距（像素）。"},"zh-Hant":{"decision":"translate","text":"在每個相符項結尾插入的額外水平間距（像素）。"},"ja_JP":{"decision":"translate","text":"各マッチの末尾に挿入される追加の水平間隔（ピクセル単位）。"}}},
    {"key":"nodeAttr:applyCharacterSpacing.pairs","source":"Matches","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["attributes","pairs","name"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Matches","vendorJapaneseChanged":false,"notes":["As in \"the pattern’s matches in the text\" — results found by a search pattern."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"匹配"},"zh-Hant":{"decision":"translate","text":"相符"},"ja_JP":{"decision":"translate","text":"マッチ"}}},
    {"key":"nodeAttr:applyCharacterSpacing.pairs.matchString","source":"Match String","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["attributes","pairs.matchString","name"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Match String","vendorJapaneseChanged":false,"notes":["\"String\" here means a sequence of text characters (as in programming)."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"匹配字符串"},"zh-Hant":{"decision":"translate","text":"相符字串"},"ja_JP":{"decision":"translate","text":"マッチ文字列"}}},
    {"key":"nodeAttr:applyCharacterSpacing.pairs.spacing","source":"Character Spacing","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["attributes","pairs.spacing","name"],"displayRole":"attribute-label","dontTranslate":false,"vendorJapanese":"Character Spacing","vendorJapaneseChanged":false,"notes":["\"Character Spacing\" is the horizontal gap added between letters in text."],"sourceRole":"attribute-label","translations":{"zh-Hans":{"decision":"translate","text":"字符间距"},"zh-Hant":{"decision":"translate","text":"字元間距"},"ja_JP":{"decision":"translate","text":"文字間隔"}}},
    {"key":"nodeInfo:applyCharacterSpacing","source":"Create procedural kerning pairs via the Text Shape’s Style Behaviours.","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["info","tooltip"],"displayRole":"node-info","dontTranslate":false,"vendorJapanese":"Create procedural kerning pairs via the Text Shape’s Style Behaviours.","vendorJapaneseChanged":false,"notes":["Kerning is the adjustment of spacing between specific pairs of characters, for example tightening the gap in ‘AV’."],"sourceRole":"node-info","translations":{"zh-Hans":{"decision":"translate","text":"通过文本形状的样式行为创建程序化字距调整对。"},"zh-Hant":{"decision":"translate","text":"透過文字形狀的樣式行為建立程序化字距調整對。"},"ja_JP":{"decision":"translate","text":"テキストシェイプのスタイルビヘイビアを通じてプロシージャルなカーニングペアを作成します。"}}},
    {"key":"nodeName:applyCharacterSpacing","source":"Apply Character Spacing","catalogId":"Definitions/Translation/nodeStrings","owner":"applyCharacterSpacing","fieldPath":["info","name"],"displayRole":"node-name","dontTranslate":false,"vendorJapanese":"Apply Character Spacing","vendorJapaneseChanged":false,"notes":["As in the node name \"Apply Character Spacing\" — adjusts the gap between individual text characters (kerning-like)."],"sourceRole":"node-name","translations":{"zh-Hans":{"decision":"translate","text":"应用字符间距"},"zh-Hant":{"decision":"translate","text":"套用字元間距"},"ja_JP":{"decision":"translate","text":"文字間隔を適用"}}},
  ],
};
