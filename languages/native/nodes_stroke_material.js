/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的strokeMaterial完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供54个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的strokeMaterial完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
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
    "sourcePairsSha256": "c1a35ac1209d5e91191da4b079dff0494f3e52589445818160043a3980a019ff",
    "sourceIdentityAndNotesSha256": "8befdc2e311a70b331018815228197a8580e18a80e68ec2886eec80af80b1552",
    "keysetSha256": "a08f63ae1737aa8f3e91b370ccbce623f89fba7dd5325c42dcde3e54653e67a8",
    "translationDecisionsSha256": "470a3d5b6eede2cb1f2099729e5a84813b9dbcdc22bb5955771ec11e1932ad1b",
    "owner": "strokeMaterial",
    "keyCount": 54,
    "decisionSlotCount": 162,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 53,
        "preserve": 1
      },
      "zh-Hant": {
        "translate": 53,
        "preserve": 1
      },
      "ja_JP": {
        "translate": 53,
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
      "key": "attrInfo:strokeMaterial.capCentres", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","capCentres","tooltip"],
      "source": "Cap Style must be set to Round.", "notes": ["\"Cap Style\" refers to how the Stroke’s ends are finished (e.g. rounded, squared); \"Round\" here is that cap shape."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Cap Style must be set to Round.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"端点样式必须设为圆头。"},"zh-Hant":{"decision":"translate","text":"端點樣式必須設為圓頭。"},"ja_JP":{"decision":"translate","text":"キャップスタイルはラウンドに設定する必要があります。"}}
    },
    {
      "key": "attrInfo:strokeMaterial.gradientTrimMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","gradientTrimMode","tooltip"],
      "source": "When <b>Color Mode</b> is set to <b>Gradient</b> and <b>Trim</b> is checked, determine how the gradient is treated when adjusting the Stroke’s <b>Trim</b>.\n\n<b>Compress</b> - Fit the gradient to the path’s length after trimming.\n\n<b>Crop</b> - Keep the gradient fixed to the full path so that trimming masks part of it.", "notes": ["\"Compress\" and \"Crop\" are two ways the colour gradient responds when the Stroke is trimmed shorter."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When <b>Color Mode</b> is set to <b>Gradient</b> and <b>Trim</b> is checked, determine how the gradient is treated when adjusting the Stroke’s <b>Trim</b>.\n\n<b>Compress</b> - Fit the gradient to the path’s length after trimming.\n\n<b>Crop</b> - Keep the gradient fixed to the full path so that trimming masks part of it.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"当<b>颜色模式</b>设为<b>渐变</b>且勾选<b>修剪</b>时，决定调整描边<b>修剪</b>时如何处理渐变。\n\n<b>压缩</b> - 使渐变适配修剪后的路径长度。\n\n<b>裁剪</b> - 使渐变保持固定在完整路径上，因此修剪会遮住其中一部分。"},"zh-Hant":{"decision":"translate","text":"當<b>顏色模式</b>設為<b>漸層</b>且勾選<b>修剪</b>時，決定調整描邊<b>修剪</b>時如何處理漸層。\n\n<b>壓縮</b> - 使漸層符合修剪後的路徑長度。\n\n<b>裁切</b> - 使漸層保持固定在完整路徑上，因此修剪會遮住其中一部分。"},"ja_JP":{"decision":"translate","text":"<b>カラーモード</b>が<b>グラデーション</b>で<b>トリム</b>がオンのとき、ストロークの<b>トリム</b>を調整する際にグラデーションをどう扱うかを決めます。\n\n<b>圧縮</b> - トリム後のパスの長さにグラデーションを合わせます。\n\n<b>クロップ</b> - グラデーションをパス全体に固定したままにし、トリムでその一部を隠します。"}}
    },
    {
      "key": "attrInfo:strokeMaterial.taperedWidth", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","taperedWidth","tooltip"],
      "source": "When checked, the Width Profile can be used to vary the Stroke’s Width along its path’s length", "notes": ["\"tapered\" and \"Width Profile\" describe gradually varying the Stroke’s thickness along its length."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When checked, the Width Profile can be used to vary the Stroke’s Width along its path’s length", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"勾选后，可使用宽度曲线沿路径长度改变描边宽度。"},"zh-Hant":{"decision":"translate","text":"勾選後，可使用寬度曲線沿路徑長度改變描邊寬度。"},"ja_JP":{"decision":"translate","text":"オンにすると、幅グラフでパスの長さに沿ってストロークの幅を変えられます。"}}
    },
    {
      "key": "attrInfo:strokeMaterial.widthGraph", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","widthGraph","tooltip"],
      "source": "Use a graph to multiply the Stroke’s Width by different values along its path’s length. 0 is no Width, 1 is the full Width.", "notes": ["\"graph\" here means an animation/value curve editor used to vary the Width."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Use a graph to multiply the Stroke’s Width by different values along its path’s length. 0 is no Width, 1 is the full Width.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"用曲线沿路径长度，以不同的值乘以描边宽度。0 表示没有宽度，1 表示完整宽度。"},"zh-Hant":{"decision":"translate","text":"用曲線沿路徑長度，以不同的值乘以描邊寬度。0 表示沒有寬度，1 表示完整寬度。"},"ja_JP":{"decision":"translate","text":"グラフを使い、パスの長さに沿ってストロークの幅に異なる値を掛けます。0 は幅なし、1 は完全な幅です。"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.align", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","align"],
      "source": "Align", "notes": ["\"Align\" is a noun here: where the stroke sits relative to the path."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Align", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"对齐"},"zh-Hant":{"decision":"translate","text":"對齊"},"ja_JP":{"decision":"translate","text":"整列"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.alpha", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","alpha"],
      "source": "Alpha", "notes": ["\"Alpha\" refers to transparency/opacity."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Alpha", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"preserve","text":"Alpha"},"zh-Hant":{"decision":"preserve","text":"Alpha"},"ja_JP":{"decision":"preserve","text":"Alpha"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.capCentres", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","capCentres","name"],
      "source": "Cap Centres", "notes": ["\"Cap\" is the shape of a stroke’s open ends."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Cap Centres", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"端点中心"},"zh-Hant":{"decision":"translate","text":"端點中心"},"ja_JP":{"decision":"translate","text":"キャップ中心"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.capStyle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","capStyle"],
      "source": "Cap Style", "notes": ["\"Cap\" is the shape of a stroke’s open ends."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Cap Style", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"端点样式"},"zh-Hant":{"decision":"translate","text":"端點樣式"},"ja_JP":{"decision":"translate","text":"キャップスタイル"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.colorShaders", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","colorShaders"],
      "source": "Shaders", "notes": ["\"Shaders\" here are connected nodes that generate or modify colour."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Shaders", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"着色器"},"zh-Hant":{"decision":"translate","text":"著色器"},"ja_JP":{"decision":"translate","text":"シェーダー"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.dashOffset", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","dashOffset"],
      "source": "Dash Offset", "notes": ["As in \"Dash Offset\" — shifts the starting point of the dash pattern along the path."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Dash Offset", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"虚线偏移"},"zh-Hant":{"decision":"translate","text":"虛線偏移"},"ja_JP":{"decision":"translate","text":"破線オフセット"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.dashPattern", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","dashPattern"],
      "source": "Dash Pattern", "notes": ["As in \"Dash Pattern\" — the sequence of on/off segment lengths that make up a dashed line."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Dash Pattern", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"虚线图案"},"zh-Hant":{"decision":"translate","text":"虛線圖案"},"ja_JP":{"decision":"translate","text":"破線パターン"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.dashPatternMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","dashPatternMode"],
      "source": "Dash Pattern Mode", "notes": ["As in \"Dash Pattern Mode\" — chooses whether the Dash Pattern’s values are read as Pixels or Percentage."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Dash Pattern Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"虚线图案模式"},"zh-Hant":{"decision":"translate","text":"虛線圖案模式"},"ja_JP":{"decision":"translate","text":"破線パターンモード"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.doubleTaper", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","doubleTaper"],
      "source": "Double Taper", "notes": ["\"Taper\" means gradually narrowing; \"Double\" means at both ends."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Double Taper", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"双端渐细"},"zh-Hant":{"decision":"translate","text":"雙端漸細"},"ja_JP":{"decision":"translate","text":"両端テーパー"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.doubleTaperHelp", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","doubleTaperHelp"],
      "source": "A good default for a double taper is to set the Start and End Widths to 0.", "notes": ["\"double taper\" describes a Stroke that narrows at both its Start and End, like a pointed line; \"taper\" is a noun/adjective here."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "A good default for a double taper is to set the Start and End Widths to 0.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"双端渐细的一个合适默认值，是将起始宽度和结束宽度设为 0。"},"zh-Hant":{"decision":"translate","text":"雙端漸細的一個合適預設，是將起始寬度與結束寬度設為 0。"},"ja_JP":{"decision":"translate","text":"両端テーパーでは、開始幅と終了幅を 0 にするのが適切な初期値です。"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.endWidth", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","endWidth"],
      "source": "End Width", "notes": ["As in \"End Width\" — the Stroke’s thickness at the end of its path."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "End Width", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"结束宽度"},"zh-Hant":{"decision":"translate","text":"結束寬度"},"ja_JP":{"decision":"translate","text":"終了幅"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.gradientMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","gradientMode"],
      "source": "Gradient Mode", "notes": ["As in \"Gradient Mode\" — chooses how a colour gradient is applied along the Stroke."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Gradient Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"渐变模式"},"zh-Hant":{"decision":"translate","text":"漸層模式"},"ja_JP":{"decision":"translate","text":"グラデーションモード"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.gradientTrimMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","gradientTrimMode","name"],
      "source": "Gradient Trim Mode", "notes": ["\"Trim\" is a verb: shorten the visible stroke to a portion of the path."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Gradient Trim Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"渐变修剪模式"},"zh-Hant":{"decision":"translate","text":"漸層修剪模式"},"ja_JP":{"decision":"translate","text":"グラデーショントリムモード"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.joinStyle", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","joinStyle"],
      "source": "Join Style", "notes": ["\"Join\" is a noun: the shape where two stroke segments meet at a corner."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Join Style", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"接合样式"},"zh-Hant":{"decision":"translate","text":"接合樣式"},"ja_JP":{"decision":"translate","text":"結合スタイル"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.middleLength", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","middleLength"],
      "source": "Middle Length", "notes": ["As in \"Middle Length\" — the proportion of the Stroke’s path kept at full width between the tapered Start and End sections."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Middle Length", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"中间长度"},"zh-Hant":{"decision":"translate","text":"中間長度"},"ja_JP":{"decision":"translate","text":"中間の長さ"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.miter", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","miter"],
      "source": "Mitre Limit", "notes": ["\"Mitre\" is a sharp, pointed corner join style; the limit caps how far it can extend before switching to a bevelled corner."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Mitre Limit", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"斜接限制"},"zh-Hant":{"decision":"translate","text":"斜接限制"},"ja_JP":{"decision":"translate","text":"マイター制限"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.reversePath", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","reversePath"],
      "source": "Reverse Path", "notes": ["\"Reverse\" is a verb."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Reverse Path", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"反转路径"},"zh-Hant":{"decision":"translate","text":"反轉路徑"},"ja_JP":{"decision":"translate","text":"パスを反転"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.startWidth", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","startWidth"],
      "source": "Start Width", "notes": ["As in \"Start Width\" — the Stroke’s thickness at the beginning of its path."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Start Width", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"起始宽度"},"zh-Hant":{"decision":"translate","text":"起始寬度"},"ja_JP":{"decision":"translate","text":"開始幅"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.strokeColor", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","strokeColor"],
      "source": "Color", "notes": ["As in \"the Stroke’s Color\" — the colour of the outline."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Color", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"颜色"},"zh-Hant":{"decision":"translate","text":"顏色"},"ja_JP":{"decision":"translate","text":"カラー"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.taperFrom", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","taperFrom"],
      "source": "Taper From", "notes": ["\"Taper\" means gradually narrowing/widening."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Taper From", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"宽度渐变起点"},"zh-Hant":{"decision":"translate","text":"寬度漸變起點"},"ja_JP":{"decision":"translate","text":"テーパー起点"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.taperedWidth", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","taperedWidth","name"],
      "source": "Tapered Width", "notes": ["\"Tapered\" means gradually narrowing/widening."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Tapered Width", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"宽度渐变"},"zh-Hant":{"decision":"translate","text":"寬度漸變"},"ja_JP":{"decision":"translate","text":"テーパー幅"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.trim", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","trim"],
      "source": "Trim", "notes": ["\"Trim\" is a verb: shorten the visible stroke to a portion of the path."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Trim", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"修剪"},"zh-Hant":{"decision":"translate","text":"修剪"},"ja_JP":{"decision":"translate","text":"トリム"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.trimEnd", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","trimEnd"],
      "source": "End", "notes": ["As in \"Trim End\" — the point along the Stroke’s path where the visible portion stops."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "End", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"结束"},"zh-Hant":{"decision":"translate","text":"結束"},"ja_JP":{"decision":"translate","text":"終了"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.trimStart", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","trimStart"],
      "source": "Start", "notes": ["As in \"Trim Start\" — the point along the Stroke’s path where the visible portion begins."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Start", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"开始"},"zh-Hant":{"decision":"translate","text":"開始"},"ja_JP":{"decision":"translate","text":"開始"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.trimTravel", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","trimTravel"],
      "source": "Travel", "notes": ["\"Travel\" is a noun: shifts both trim points together along the path."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Travel", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"移动"},"zh-Hant":{"decision":"translate","text":"移動"},"ja_JP":{"decision":"translate","text":"移動"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.width", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","width"],
      "source": "Width", "notes": ["As in \"the Stroke’s Width\" — how thick the outline is drawn."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Width", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"宽度"},"zh-Hant":{"decision":"translate","text":"寬度"},"ja_JP":{"decision":"translate","text":"幅"}}
    },
    {
      "key": "nodeAttr:strokeMaterial.widthGraph", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["attributes","widthGraph","name"],
      "source": "Width Profile", "notes": ["\"Profile\" here refers to a graph/curve controlling how a value changes along a length."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Width Profile", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"宽度曲线"},"zh-Hant":{"decision":"translate","text":"寬度曲線"},"ja_JP":{"decision":"translate","text":"幅グラフ"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.align.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","align","0"],
      "source": "Centre", "notes": ["The stroke is centred on the path, straddling its edge equally on both sides."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Centre", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"居中"},"zh-Hant":{"decision":"translate","text":"置中"},"ja_JP":{"decision":"translate","text":"中央"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.align.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","align","1"],
      "source": "Inner", "notes": ["The stroke sits entirely inside the path’s edge."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Inner", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"内部"},"zh-Hant":{"decision":"translate","text":"內部"},"ja_JP":{"decision":"translate","text":"内側"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.align.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","align","2"],
      "source": "Outer", "notes": ["The stroke sits entirely outside the path’s edge."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Outer", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"外部"},"zh-Hant":{"decision":"translate","text":"外部"},"ja_JP":{"decision":"translate","text":"外側"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.capStyle.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","capStyle","0"],
      "source": "Flat", "notes": ["A stroke end cut off flush, with no extension."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Flat", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"平头"},"zh-Hant":{"decision":"translate","text":"平頭"},"ja_JP":{"decision":"translate","text":"フラット"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.capStyle.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","capStyle","1"],
      "source": "Round", "notes": ["A stroke end rounded into a semicircle."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Round", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"圆头"},"zh-Hant":{"decision":"translate","text":"圓頭"},"ja_JP":{"decision":"translate","text":"ラウンド"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.capStyle.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","capStyle","2"],
      "source": "Projecting", "notes": ["A stroke end extended slightly past the path’s actual end, with a flat cut."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Projecting", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"方头"},"zh-Hant":{"decision":"translate","text":"方頭"},"ja_JP":{"decision":"translate","text":"突出"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.colorMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","colorMode","0"],
      "source": "Single Color", "notes": ["As in \"Single Color\" — one flat colour for the whole Stroke."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Single Color", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"单色"},"zh-Hant":{"decision":"translate","text":"單色"},"ja_JP":{"decision":"translate","text":"単色"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.colorMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","colorMode","1"],
      "source": "Gradient", "notes": ["\"Gradient\" here means a smooth transition between colours."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Gradient", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"渐变"},"zh-Hant":{"decision":"translate","text":"漸層"},"ja_JP":{"decision":"translate","text":"グラデーション"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.dashPatternMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","dashPatternMode","0"],
      "source": "Pixels", "notes": ["As in \"Pixels\" — the Dash Pattern’s segment lengths are measured in screen pixels."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Pixels", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"像素"},"zh-Hant":{"decision":"translate","text":"像素"},"ja_JP":{"decision":"translate","text":"ピクセル"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.dashPatternMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","dashPatternMode","1"],
      "source": "Percentage", "notes": ["As in \"Percentage\" — the Dash Pattern’s segment lengths are measured as a percentage of the path’s total length."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Percentage", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"百分比"},"zh-Hant":{"decision":"translate","text":"百分比"},"ja_JP":{"decision":"translate","text":"パーセント"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientMode","0"],
      "source": "RGB Interpolation", "notes": ["\"RGB\" = Red/Green/Blue colour model, a technical abbreviation."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "RGB Interpolation", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"RGB 插值"},"zh-Hant":{"decision":"translate","text":"RGB 插值"},"ja_JP":{"decision":"translate","text":"RGB 補間"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientMode","1"],
      "source": "HSV Interpolation (Short Path)", "notes": ["\"HSV\" = Hue/Saturation/Value colour model; \"Short Path\" takes the nearer of the two directions around the hue wheel."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "HSV Interpolation (Short Path)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"HSV 插值（色轮较短方向）"},"zh-Hant":{"decision":"translate","text":"HSV 插值（色輪較短方向）"},"ja_JP":{"decision":"translate","text":"HSV 補間（色相環の短い方向）"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientMode.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientMode","2"],
      "source": "HSV Interpolation (Long Path)", "notes": ["\"HSV\" = Hue/Saturation/Value colour model; \"Long Path\" takes the further of the two directions around the hue wheel."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "HSV Interpolation (Long Path)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"HSV 插值（色轮较长方向）"},"zh-Hant":{"decision":"translate","text":"HSV 插值（色輪較長方向）"},"ja_JP":{"decision":"translate","text":"HSV 補間（色相環の長い方向）"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientMode.3", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientMode","3"],
      "source": "Oklab Interpolation", "notes": ["\"Oklab\" is a perceptually uniform colour space name, a technical term."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Oklab Interpolation", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"Oklab 插值"},"zh-Hant":{"decision":"translate","text":"Oklab 插值"},"ja_JP":{"decision":"translate","text":"Oklab 補間"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientMode.4", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientMode","4"],
      "source": "LCH Interpolation (Short Path)", "notes": ["\"LCH\" = Lightness/Chroma/Hue colour model; \"Short Path\" takes the nearer of the two directions around the hue wheel."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "LCH Interpolation (Short Path)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"LCH 插值（色轮较短方向）"},"zh-Hant":{"decision":"translate","text":"LCH 插值（色輪較短方向）"},"ja_JP":{"decision":"translate","text":"LCH 補間（色相環の短い方向）"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientMode.5", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientMode","5"],
      "source": "LCH Interpolation (Long Path)", "notes": ["\"LCH\" = Lightness/Chroma/Hue colour model; \"Long Path\" takes the further of the two directions around the hue wheel."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "LCH Interpolation (Long Path)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"LCH 插值（色轮较长方向）"},"zh-Hant":{"decision":"translate","text":"LCH 插值（色輪較長方向）"},"ja_JP":{"decision":"translate","text":"LCH 補間（色相環の長い方向）"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientTrimMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientTrimMode","0"],
      "source": "Compress", "notes": ["Squeezes the whole gradient into the trimmed length."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Compress", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"压缩"},"zh-Hant":{"decision":"translate","text":"壓縮"},"ja_JP":{"decision":"translate","text":"圧縮"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.gradientTrimMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","gradientTrimMode","1"],
      "source": "Crop", "notes": ["Keeps the gradient fixed to the full path, so trimming reveals only part of it."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Crop", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"裁剪"},"zh-Hant":{"decision":"translate","text":"裁切"},"ja_JP":{"decision":"translate","text":"クロップ"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.joinStyle.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","joinStyle","0"],
      "source": "Mitre", "notes": ["\"Mitre\" is a sharp, pointed corner join style."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Mitre", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"斜接"},"zh-Hant":{"decision":"translate","text":"斜接"},"ja_JP":{"decision":"translate","text":"マイター"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.joinStyle.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","joinStyle","1"],
      "source": "Round", "notes": ["A rounded corner join."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Round", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"圆角"},"zh-Hant":{"decision":"translate","text":"圓角"},"ja_JP":{"decision":"translate","text":"ラウンド"}}
    },
    {
      "key": "nodeAttrEnum:strokeMaterial.joinStyle.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["enums","joinStyle","2"],
      "source": "Bevel", "notes": ["\"Bevel\" is a flat, angled corner join style."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Bevel", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"斜角"},"zh-Hant":{"decision":"translate","text":"斜角"},"ja_JP":{"decision":"translate","text":"ベベル"}}
    },
    {
      "key": "nodeInfo:strokeMaterial", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["info","tooltip"],
      "source": "Adds a Stroke material that can be used on many shapes at once.", "notes": ["\"Stroke\" is a noun here: the outline drawn along a Shape’s path."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Adds a Stroke material that can be used on many shapes at once.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"添加可同时用于多个形状的描边材质。"},"zh-Hant":{"decision":"translate","text":"新增可同時用於多個形狀的描邊材質。"},"ja_JP":{"decision":"translate","text":"複数のシェイプに同時に使えるストロークマテリアルを追加します。"}}
    },
    {
      "key": "nodeName:strokeMaterial", "catalogId": "Definitions/Translation/nodeStrings", "owner": "strokeMaterial", "fieldPath": ["info","name"],
      "source": "Stroke", "notes": ["\"Stroke\" is a shape’s outline, as a noun."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Stroke", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"描边"},"zh-Hant":{"decision":"translate","text":"描邊"},"ja_JP":{"decision":"translate","text":"ストローク"}}
    },
  ],
};
