/**
 * [INPUT]: 依赖官方 2.8 applyOpenType 显示源/notes、AGY/宝玉 Skill 初稿、Grok 两轮与 Luna Max 独立语境审校
 * [OUTPUT]: 提供完整 161 个字体特性显示键的三语源绑定审定输入
 * [POS]: languages/native 的字体功能域；区分替代字形访问、基字相对位置、大小写与 Indic 特性，只投影文案不改字体、枚举索引或预设身份
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 * 本轮图形语境有限修订经非作者验回/root审定；冻结源与历史批准仍保全。
 */
'use strict';

// -- 字形显示键与真实 feature/字体身份分离 --------------------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "catalogPath": "Definitions/Translation/nodeStrings_en-GB.source.json",
    "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
    "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439",
    "sourcePairsSha256": "10f8aebc8489ed9c87669fec3455cf9b5991f93a23502c86a6772406fbee40cb",
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "draftModel": "gemini-3.8-flash-high",
    "draftExecutionMode": "accept-edits",
    "independentReviewProvider": "Grok CLI",
    "sourceContextReview": "GPT-6 Luna Max",
    "revisionProvider": "primary-agent",
    "approvedBy": "primary-agent",
    "reviewScope": "All 161 source/notes/three-locale values; two actual Grok end_turn reports, independent Luna review and primary corrections. Not live font, layout or deployment proof."
  },
  entries: [
    { key: "attrInfo:applyOpenType.features", source: "List of OpenType features to enable or disable on the matched ranges. Only features supported by the current font have an effect.",
      owner: "applyOpenType", fieldPath: ["attributes","features","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Ranges\" here means stretches of selected/matched text characters."], translations: {"zh-Hans":{"decision":"translate","text":"在匹配的范围内启用或禁用 OpenType 特性的列表。仅当前字体支持的特性才会生效。"},"zh-Hant":{"decision":"translate","text":"在符合的範圍內啟用或停用 OpenType 特性的清單。僅目前字型支援的特性才會生效。"},"ja_JP":{"decision":"translate","text":"一致した範囲で有効または無効にする OpenType 特性のリスト。現在のフォントがサポートする特性だけが効果を持ちます。"}}
    },
    { key: "attrInfo:applyOpenType.features.enabled", source: "Whether this feature is turned on (1) or off (0) for the matched ranges.",
      owner: "applyOpenType", fieldPath: ["attributes","features.enabled","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Matched ranges\" refers to the portions of text selected by the search/index settings."], translations: {"zh-Hans":{"decision":"translate","text":"此特性在匹配范围内是开启 (1) 还是关闭 (0)。"},"zh-Hant":{"decision":"translate","text":"此特性在符合範圍內為開啟 (1) 還是關閉 (0)。"},"ja_JP":{"decision":"translate","text":"一致した範囲でこの特性をオン (1) にするかオフ (0) にするか。"}}
    },
    { key: "attrInfo:applyOpenType.features.feature", source: "OpenType feature tag (e.g. Ligatures, Small Caps, Stylistic Set 1) to apply.",
      owner: "applyOpenType", fieldPath: ["attributes","features.feature","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Tag\" here is the short code identifying an OpenType typographic feature (e.g. \"liga\" for ligatures)."], translations: {"zh-Hans":{"decision":"translate","text":"要应用的 OpenType 特性标签（例如连字、小型大写、样式集 1）。"},"zh-Hant":{"decision":"translate","text":"要套用的 OpenType 特性標籤（例如連字、小型大寫、樣式集 1）。"},"ja_JP":{"decision":"translate","text":"適用する OpenType 特性タグ（例: リガチャ、スモールキャップス、スタイルセット 1）。"}}
    },
    { key: "attrInfo:applyOpenType.indexMode", source: "Granularity used by Specific Indices and All modes: by Line, Word, or Character.",
      owner: "applyOpenType", fieldPath: ["attributes","indexMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Granularity\" means the level of detail at which the text is divided — by whole line, whole word, or single character."], translations: {"zh-Hans":{"decision":"translate","text":"“指定索引”和“全部”模式所使用的粒度：按行、词或字符。"},"zh-Hant":{"decision":"translate","text":"「指定索引」與「全部」模式所使用的粒度：按行、詞或字元。"},"ja_JP":{"decision":"translate","text":"「指定インデックス」および「すべて」モードで使用される粒度: 行、単語、または文字単位。"}}
    },
    { key: "attrInfo:applyOpenType.indices", source: "Comma-separated indices and ranges used when Mode is Specific Indices. Indexed by Line/Word/Character per Index Mode.",
      owner: "applyOpenType", fieldPath: ["attributes","indices","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Indices\" and \"Indexed\" refer to numbered positions (e.g. character 0, 1, 2…) within a line, word, or the whole text."], translations: {"zh-Hans":{"decision":"translate","text":"模式为“指定索引”时使用的逗号分隔索引与范围。按索引模式，以行、词或字符为单位编号。"},"zh-Hant":{"decision":"translate","text":"模式為「指定索引」時使用的逗號分隔索引與範圍。依索引模式，以行、詞或字元為單位編號。"},"ja_JP":{"decision":"translate","text":"モードが「指定インデックス」の場合に使用されるカンマ区切りのインデックスと範囲。インデックスモードに応じて行/単語/文字ごとにインデックスが付けられます。"}}
    },
    { key: "attrInfo:applyOpenType.mode", source: "How matched ranges are chosen: Regex, Specific Indices, or All.",
      owner: "applyOpenType", fieldPath: ["attributes","mode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Regex\" is short for \"regular expression\", a text pattern-matching syntax — a computing term unrelated to any other meaning of the abbreviation."], translations: {"zh-Hans":{"decision":"translate","text":"选择匹配范围的方式：正则表达式、指定索引或全部。"},"zh-Hant":{"decision":"translate","text":"選擇符合範圍的方式：正則運算式、指定索引或全部。"},"ja_JP":{"decision":"translate","text":"一致した範囲を選択する方法: 正規表現、指定インデックス、またはすべて。"}}
    },
    { key: "attrInfo:applyOpenType.regex", source: "Regular expression matched against the text when Mode is Regex.",
      owner: "applyOpenType", fieldPath: ["attributes","regex","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Regular expression\" (regex) is a pattern used to search and match text, a computing term."], translations: {"zh-Hans":{"decision":"translate","text":"模式为“正则表达式”时用于匹配文本的正则表达式。"},"zh-Hant":{"decision":"translate","text":"模式為「正則運算式」時用於比對文字的正則運算式。"},"ja_JP":{"decision":"translate","text":"モードが「正規表現」の場合にテキストと照合される正規表現。"}}
    },
    { key: "nodeAttr:applyOpenType.features", source: "Features",
      owner: "applyOpenType", fieldPath: ["attributes","features","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Features\" here means OpenType typographic features (e.g. ligatures, small caps) built into a font."], translations: {"zh-Hans":{"decision":"translate","text":"特性"},"zh-Hant":{"decision":"translate","text":"特性"},"ja_JP":{"decision":"translate","text":"特性"}}
    },
    { key: "nodeAttr:applyOpenType.features.enabled", source: "Enabled",
      owner: "applyOpenType", fieldPath: ["attributes","features.enabled","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"feature is Enabled\" — switched on/active."], translations: {"zh-Hans":{"decision":"translate","text":"已启用"},"zh-Hant":{"decision":"translate","text":"已啟用"},"ja_JP":{"decision":"translate","text":"有効"}}
    },
    { key: "nodeAttr:applyOpenType.features.feature", source: "Font Feature",
      owner: "applyOpenType", fieldPath: ["attributes","features.feature","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Font Feature\" — a specific OpenType typographic feature (e.g. Ligatures, Small Caps) belonging to a font."], translations: {"zh-Hans":{"decision":"translate","text":"字体特性"},"zh-Hant":{"decision":"translate","text":"字型特性"},"ja_JP":{"decision":"translate","text":"フォント特性"}}
    },
    { key: "nodeAttr:applyOpenType.indexMode", source: "Index Mode",
      owner: "applyOpenType", fieldPath: ["attributes","indexMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Index Mode\" — sets whether positions are counted by Line, Word, or Character."], translations: {"zh-Hans":{"decision":"translate","text":"索引模式"},"zh-Hant":{"decision":"translate","text":"索引模式"},"ja_JP":{"decision":"translate","text":"インデックスモード"}}
    },
    { key: "nodeAttr:applyOpenType.indices", source: "Indices",
      owner: "applyOpenType", fieldPath: ["attributes","indices","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"select indices 3 and 7\" — numeric positions within a list (of lines, words or characters)."], translations: {"zh-Hans":{"decision":"translate","text":"索引"},"zh-Hant":{"decision":"translate","text":"索引"},"ja_JP":{"decision":"translate","text":"インデックス"}}
    },
    { key: "nodeAttr:applyOpenType.mode", source: "Mode",
      owner: "applyOpenType", fieldPath: ["attributes","mode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"selection Mode\" — the method used to choose the affected text range."], translations: {"zh-Hans":{"decision":"translate","text":"模式"},"zh-Hant":{"decision":"translate","text":"模式"},"ja_JP":{"decision":"translate","text":"モード"}}
    },
    { key: "nodeAttr:applyOpenType.regex", source: "Regex",
      owner: "applyOpenType", fieldPath: ["attributes","regex","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["Regex (regular expression) is a text pattern-matching syntax."], translations: {"zh-Hans":{"decision":"translate","text":"正则表达式"},"zh-Hant":{"decision":"translate","text":"正則運算式"},"ja_JP":{"decision":"translate","text":"正規表現"}}
    },
    { key: "nodeAttrEnum:applyOpenType.blendMode.0", source: "Normal (Add)",
      owner: "applyOpenType", fieldPath: ["enums","blendMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Normal (Add)\" is the name of a blend mode combining the default \"Normal\" blend with additive colour mixing — a standard compositing term."], translations: {"zh-Hans":{"decision":"translate","text":"正常（相加）"},"zh-Hant":{"decision":"translate","text":"正常（相加）"},"ja_JP":{"decision":"translate","text":"通常（加算）"}}
    },
    { key: "nodeAttrEnum:applyOpenType.blendMode.1", source: "Min.",
      owner: "applyOpenType", fieldPath: ["enums","blendMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Min.\" is short for \"Minimum\" — a blend mode that keeps the lower/darker colour value at each pixel, a standard compositing term."], translations: {"zh-Hans":{"decision":"translate","text":"最小值"},"zh-Hant":{"decision":"translate","text":"最小值"},"ja_JP":{"decision":"translate","text":"最小"}}
    },
    { key: "nodeAttrEnum:applyOpenType.blendMode.2", source: "Max.",
      owner: "applyOpenType", fieldPath: ["enums","blendMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Max.\" is short for \"Maximum\" — a blend mode that keeps the higher/lighter colour value at each pixel, a standard compositing term."], translations: {"zh-Hans":{"decision":"translate","text":"最大值"},"zh-Hant":{"decision":"translate","text":"最大值"},"ja_JP":{"decision":"translate","text":"最大"}}
    },
    { key: "nodeAttrEnum:applyOpenType.blendMode.3", source: "Minus",
      owner: "applyOpenType", fieldPath: ["enums","blendMode","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Minus\" is the name of a blend mode that subtracts colour values from one another — a standard compositing term."], translations: {"zh-Hans":{"decision":"translate","text":"减"},"zh-Hant":{"decision":"translate","text":"減"},"ja_JP":{"decision":"translate","text":"マイナス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.blendMode.4", source: "Multiply",
      owner: "applyOpenType", fieldPath: ["enums","blendMode","4"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Multiply\" is a blend mode that multiplies colour values together, producing a darker result — a standard compositing term."], translations: {"zh-Hans":{"decision":"translate","text":"正片叠底"},"zh-Hant":{"decision":"translate","text":"正片疊底"},"ja_JP":{"decision":"translate","text":"乗算"}}
    },
    { key: "nodeAttrEnum:applyOpenType.blendMode.5", source: "Screen",
      owner: "applyOpenType", fieldPath: ["enums","blendMode","5"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Screen\" is the name of a blend mode here (a compositing technique that lightens)."], translations: {"zh-Hans":{"decision":"translate","text":"滤色"},"zh-Hant":{"decision":"translate","text":"濾色"},"ja_JP":{"decision":"translate","text":"スクリーン"}}
    },
    { key: "nodeAttrEnum:applyOpenType.blendMode.6", source: "Overlay",
      owner: "applyOpenType", fieldPath: ["enums","blendMode","6"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Overlay\" is the name of a blend mode here."], translations: {"zh-Hans":{"decision":"translate","text":"叠加"},"zh-Hant":{"decision":"translate","text":"疊加"},"ja_JP":{"decision":"translate","text":"オーバーレイ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.0", source: "Access All Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Presents all alternate glyph forms available for a character, allowing any one to be chosen."], translations: {"zh-Hans":{"decision":"translate","text":"访问所有替代字形"},"zh-Hant":{"decision":"translate","text":"存取所有替代字形"},"ja_JP":{"decision":"translate","text":"すべての代替グリフへのアクセス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.1", source: "Above-base Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A technical typographic feature governing how certain vowel marks are positioned above the base character in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字上方字形"},"zh-Hant":{"decision":"translate","text":"基字上方字形"},"ja_JP":{"decision":"translate","text":"ベース文字上方の字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.10", source: "Contextual Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","10"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes alternate glyph forms depending on the surrounding characters."], translations: {"zh-Hans":{"decision":"translate","text":"上下文替代字形"},"zh-Hant":{"decision":"translate","text":"上下文替代字形"},"ja_JP":{"decision":"translate","text":"文脈依存代替グリフ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.100", source: "Stretching Glyph Decomposition",
      owner: "applyOpenType", fieldPath: ["enums","feature","100"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Splits a glyph into repeatable pieces so it can be stretched to a required length, as used for some Arabic elongation marks."], translations: {"zh-Hans":{"decision":"translate","text":"拉伸字形分解"},"zh-Hant":{"decision":"translate","text":"拉伸字形分解"},"ja_JP":{"decision":"translate","text":"伸長グリフの分解"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.101", source: "Subscript",
      owner: "applyOpenType", fieldPath: ["enums","feature","101"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters smaller and lowered below the baseline."], translations: {"zh-Hans":{"decision":"translate","text":"下标"},"zh-Hant":{"decision":"translate","text":"下標"},"ja_JP":{"decision":"translate","text":"下付き"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.102", source: "Superscript",
      owner: "applyOpenType", fieldPath: ["enums","feature","102"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters smaller and raised above the baseline."], translations: {"zh-Hans":{"decision":"translate","text":"上标"},"zh-Hant":{"decision":"translate","text":"上標"},"ja_JP":{"decision":"translate","text":"上付き"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.103", source: "Swash",
      owner: "applyOpenType", fieldPath: ["enums","feature","103"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with decorative, flourished forms."], translations: {"zh-Hans":{"decision":"translate","text":"花饰"},"zh-Hant":{"decision":"translate","text":"花飾"},"ja_JP":{"decision":"translate","text":"スワッシュ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.104", source: "Titling",
      owner: "applyOpenType", fieldPath: ["enums","feature","104"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with alternate forms designed for use in large titling text, such as taller capitals."], translations: {"zh-Hans":{"decision":"translate","text":"标题形式"},"zh-Hant":{"decision":"translate","text":"標題形式"},"ja_JP":{"decision":"translate","text":"タイトリング"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.105", source: "Trailing Jamo Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","105"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses the final consonant form of a Korean Hangul syllable block."], translations: {"zh-Hans":{"decision":"translate","text":"韩文终声字母字形"},"zh-Hant":{"decision":"translate","text":"韓文終聲字母字形"},"ja_JP":{"decision":"translate","text":"ハングル終声字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.106", source: "Traditional Name Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","106"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes certain Japanese Kanji characters with traditional forms used in personal names."], translations: {"zh-Hans":{"decision":"translate","text":"姓名用传统字形"},"zh-Hant":{"decision":"translate","text":"姓名用傳統字形"},"ja_JP":{"decision":"translate","text":"人名用の伝統的な字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.107", source: "Tabular Figures",
      owner: "applyOpenType", fieldPath: ["enums","feature","107"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays numbers at a uniform width so that they align in columns."], translations: {"zh-Hans":{"decision":"translate","text":"等宽数字"},"zh-Hant":{"decision":"translate","text":"等寬數字"},"ja_JP":{"decision":"translate","text":"等幅数字"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.108", source: "Traditional Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","108"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes simplified Chinese characters with their traditional equivalents."], translations: {"zh-Hans":{"decision":"translate","text":"传统字形"},"zh-Hant":{"decision":"translate","text":"傳統字形"},"ja_JP":{"decision":"translate","text":"伝統的な字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.109", source: "Third Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","109"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters at one-third-width spacing, as used for some East Asian text."], translations: {"zh-Hans":{"decision":"translate","text":"三分之一宽"},"zh-Hant":{"decision":"translate","text":"三分之一寬"},"ja_JP":{"decision":"translate","text":"3分の1幅"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.11", source: "Case-Sensitive Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","11"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts punctuation and symbol shapes to better align with capital letters."], translations: {"zh-Hans":{"decision":"translate","text":"大写对应形式"},"zh-Hant":{"decision":"translate","text":"大寫對應形式"},"ja_JP":{"decision":"translate","text":"大文字対応形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.110", source: "Unicase",
      owner: "applyOpenType", fieldPath: ["enums","feature","110"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays a single case, mixing capital and lowercase shapes, at a uniform height, used in some decorative typefaces."], translations: {"zh-Hans":{"decision":"translate","text":"单一大小写"},"zh-Hant":{"decision":"translate","text":"單一大小寫"},"ja_JP":{"decision":"translate","text":"ユニケース"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.111", source: "Alternate Vertical Metrics",
      owner: "applyOpenType", fieldPath: ["enums","feature","111"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts character spacing for vertical, top-to-bottom text layout."], translations: {"zh-Hans":{"decision":"translate","text":"替代垂直度量"},"zh-Hant":{"decision":"translate","text":"替代垂直度量"},"ja_JP":{"decision":"translate","text":"代替垂直メトリクス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.112", source: "Kerning for Alternate Proportional Vertical Metrics",
      owner: "applyOpenType", fieldPath: ["enums","feature","112"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts vertical spacing between specific character pairs when Alternate Vertical Metrics is used."], translations: {"zh-Hans":{"decision":"translate","text":"替代比例垂直度量字距"},"zh-Hant":{"decision":"translate","text":"替代比例垂直度量字距"},"ja_JP":{"decision":"translate","text":"代替プロポーショナル垂直メトリクスのカーニング"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.113", source: "Vattu Variants",
      owner: "applyOpenType", fieldPath: ["enums","feature","113"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Combines certain consonant clusters into alternate joined forms, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"Vattu 变体"},"zh-Hant":{"decision":"translate","text":"Vattu 變體"},"ja_JP":{"decision":"translate","text":"ヴァットゥバリアント"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.114", source: "Vertical Contextual Half-width Spacing",
      owner: "applyOpenType", fieldPath: ["enums","feature","114"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts spacing to half-width for certain characters in vertical text, depending on context."], translations: {"zh-Hans":{"decision":"translate","text":"垂直上下文半宽间距"},"zh-Hant":{"decision":"translate","text":"垂直上下文半寬間距"},"ja_JP":{"decision":"translate","text":"垂直文脈依存半角スペーシング"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.115", source: "Vertical Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","115"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with forms designed for vertical, top-to-bottom text layout."], translations: {"zh-Hans":{"decision":"translate","text":"垂直替代"},"zh-Hant":{"decision":"translate","text":"垂直替代"},"ja_JP":{"decision":"translate","text":"垂直代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.116", source: "Alternate Vertical Half Metrics",
      owner: "applyOpenType", fieldPath: ["enums","feature","116"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters at half-width vertical spacing, for vertical text layout."], translations: {"zh-Hans":{"decision":"translate","text":"替代垂直半宽度量"},"zh-Hant":{"decision":"translate","text":"替代垂直半寬度量"},"ja_JP":{"decision":"translate","text":"代替垂直半幅メトリクス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.117", source: "Vowel Jamo Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","117"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses the vowel form of a Korean Hangul syllable block."], translations: {"zh-Hans":{"decision":"translate","text":"韩文元音字母字形"},"zh-Hant":{"decision":"translate","text":"韓文母音字母字形"},"ja_JP":{"decision":"translate","text":"ハングル中声字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.118", source: "Vertical Kana Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","118"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses alternate forms of Japanese kana characters designed for vertical text."], translations: {"zh-Hans":{"decision":"translate","text":"垂直假名替代"},"zh-Hant":{"decision":"translate","text":"垂直假名替代"},"ja_JP":{"decision":"translate","text":"縦書き仮名代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.119", source: "Vertical Kerning",
      owner: "applyOpenType", fieldPath: ["enums","feature","119"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts the spacing between specific character pairs in vertical text layout."], translations: {"zh-Hans":{"decision":"translate","text":"垂直字距调整"},"zh-Hant":{"decision":"translate","text":"垂直字距調整"},"ja_JP":{"decision":"translate","text":"垂直カーニング"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.12", source: "Glyph Composition/Decomposition",
      owner: "applyOpenType", fieldPath: ["enums","feature","12"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Combines or splits glyphs, such as merging a letter and accent into a single precomposed glyph."], translations: {"zh-Hans":{"decision":"translate","text":"字形组合/分解"},"zh-Hant":{"decision":"translate","text":"字形組合/分解"},"ja_JP":{"decision":"translate","text":"グリフ合成/分解"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.120", source: "Proportional Alternate Vertical Metrics",
      owner: "applyOpenType", fieldPath: ["enums","feature","120"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters using proportional, variable vertical spacing, for vertical text."], translations: {"zh-Hans":{"decision":"translate","text":"比例替代垂直度量"},"zh-Hant":{"decision":"translate","text":"比例替代垂直度量"},"ja_JP":{"decision":"translate","text":"プロポーショナル代替垂直メトリクス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.121", source: "Vertical Alternates and Rotation",
      owner: "applyOpenType", fieldPath: ["enums","feature","121"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes and rotates glyphs for correct display in vertical text layout."], translations: {"zh-Hans":{"decision":"translate","text":"垂直替代和旋转"},"zh-Hant":{"decision":"translate","text":"垂直替代和旋轉"},"ja_JP":{"decision":"translate","text":"垂直代替と回転"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.122", source: "Vertical Alternates for Rotation",
      owner: "applyOpenType", fieldPath: ["enums","feature","122"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Rotates certain glyphs, such as Latin letters, for correct display within vertical text."], translations: {"zh-Hans":{"decision":"translate","text":"用于旋转的垂直替代字形"},"zh-Hant":{"decision":"translate","text":"用於旋轉的垂直替代字形"},"ja_JP":{"decision":"translate","text":"回転用の縦書き代替グリフ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.123", source: "Slashed Zero",
      owner: "applyOpenType", fieldPath: ["enums","feature","123"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays the digit zero with a slash through it, to distinguish it from the letter O."], translations: {"zh-Hans":{"decision":"translate","text":"带斜线零"},"zh-Hant":{"decision":"translate","text":"帶斜線零"},"ja_JP":{"decision":"translate","text":"スラッシュ付きゼロ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.13", source: "Conjunct Form After Ro",
      owner: "applyOpenType", fieldPath: ["enums","feature","13"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A technical typographic feature affecting how certain letterforms are shaped after the letter Ro in some Southeast Asian scripts."], translations: {"zh-Hans":{"decision":"translate","text":"Ro 后的连写字形"},"zh-Hant":{"decision":"translate","text":"Ro 後的連寫字形"},"ja_JP":{"decision":"translate","text":"Ro の後の結合形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.14", source: "Contextual Half-width Spacing",
      owner: "applyOpenType", fieldPath: ["enums","feature","14"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts spacing to half-width for certain characters depending on context, in some East Asian scripts."], translations: {"zh-Hans":{"decision":"translate","text":"上下文半宽间距"},"zh-Hant":{"decision":"translate","text":"上下文半寬間距"},"ja_JP":{"decision":"translate","text":"文脈依存半角スペーシング"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.15", source: "Conjunct Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","15"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Combines certain consonant sequences into a single joined glyph in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"连接形式"},"zh-Hant":{"decision":"translate","text":"連接形式"},"ja_JP":{"decision":"translate","text":"接続形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.16", source: "Contextual Ligatures",
      owner: "applyOpenType", fieldPath: ["enums","feature","16"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Joins certain character pairs into a single ligature glyph depending on the surrounding context."], translations: {"zh-Hans":{"decision":"translate","text":"上下文连字"},"zh-Hant":{"decision":"translate","text":"上下文連字"},"ja_JP":{"decision":"translate","text":"文脈依存リガチャ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.17", source: "Centered CJK Punctuation",
      owner: "applyOpenType", fieldPath: ["enums","feature","17"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Centres certain punctuation marks within their character space in Chinese, Japanese or Korean text."], translations: {"zh-Hans":{"decision":"translate","text":"居中 CJK 标点"},"zh-Hant":{"decision":"translate","text":"居中 CJK 標點"},"ja_JP":{"decision":"translate","text":"文字枠中央の CJK 句読点"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.18", source: "Capital Spacing",
      owner: "applyOpenType", fieldPath: ["enums","feature","18"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adds extra spacing around capital letters to improve legibility when used together."], translations: {"zh-Hans":{"decision":"translate","text":"大写字母间距"},"zh-Hant":{"decision":"translate","text":"大寫字母間距"},"ja_JP":{"decision":"translate","text":"大文字の字間"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.19", source: "Contextual Swash",
      owner: "applyOpenType", fieldPath: ["enums","feature","19"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Applies decorative swash glyph forms depending on the surrounding characters."], translations: {"zh-Hans":{"decision":"translate","text":"上下文花饰"},"zh-Hant":{"decision":"translate","text":"上下文花飾"},"ja_JP":{"decision":"translate","text":"文脈依存スワッシュ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.2", source: "Above-base Mark Positioning",
      owner: "applyOpenType", fieldPath: ["enums","feature","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Positions diacritic marks above base characters in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字上方标记定位"},"zh-Hant":{"decision":"translate","text":"基字上方標記定位"},"ja_JP":{"decision":"translate","text":"ベース文字上方のマーク位置調整"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.20", source: "Cursive Positioning",
      owner: "applyOpenType", fieldPath: ["enums","feature","20"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Connects certain glyphs with cursive-style joining strokes, as used in some Arabic-derived scripts."], translations: {"zh-Hans":{"decision":"translate","text":"连笔定位"},"zh-Hant":{"decision":"translate","text":"連筆定位"},"ja_JP":{"decision":"translate","text":"連結筆画の位置調整"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.21", source: "Petite Capitals From Capitals",
      owner: "applyOpenType", fieldPath: ["enums","feature","21"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Converts capital letters into petite capitals, a size smaller than small capitals."], translations: {"zh-Hans":{"decision":"translate","text":"大写转超小型大写"},"zh-Hant":{"decision":"translate","text":"大寫轉超小型大寫"},"ja_JP":{"decision":"translate","text":"大文字からプチキャップス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.22", source: "Small Capitals From Capitals",
      owner: "applyOpenType", fieldPath: ["enums","feature","22"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Converts capital letters into small capitals."], translations: {"zh-Hans":{"decision":"translate","text":"大写转小型大写"},"zh-Hant":{"decision":"translate","text":"大寫轉小型大寫"},"ja_JP":{"decision":"translate","text":"大文字からスモールキャップス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.23", source: "Distances",
      owner: "applyOpenType", fieldPath: ["enums","feature","23"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts the spacing between certain marks and base characters in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"距离"},"zh-Hant":{"decision":"translate","text":"距離"},"ja_JP":{"decision":"translate","text":"距離"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.24", source: "Discretionary Ligatures",
      owner: "applyOpenType", fieldPath: ["enums","feature","24"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Joins certain character pairs into optional decorative ligature glyphs."], translations: {"zh-Hans":{"decision":"translate","text":"任意连字"},"zh-Hant":{"decision":"translate","text":"任意連字"},"ja_JP":{"decision":"translate","text":"任意リガチャ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.25", source: "Denominators",
      owner: "applyOpenType", fieldPath: ["enums","feature","25"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays selected digits as the lower (denominator) part of a fraction."], translations: {"zh-Hans":{"decision":"translate","text":"分母"},"zh-Hant":{"decision":"translate","text":"分母"},"ja_JP":{"decision":"translate","text":"分母"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.26", source: "Dotless Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","26"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Replaces certain letters, such as i or j, with a dotless form, typically for use with added diacritics."], translations: {"zh-Hans":{"decision":"translate","text":"无点形式"},"zh-Hant":{"decision":"translate","text":"無點形式"},"ja_JP":{"decision":"translate","text":"ドットなし形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.27", source: "Expert Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","27"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes standard glyphs with alternate ‘expert set’ forms found in some specialised fonts."], translations: {"zh-Hans":{"decision":"translate","text":"专家形式"},"zh-Hant":{"decision":"translate","text":"專家形式"},"ja_JP":{"decision":"translate","text":"エキスパート形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.28", source: "Final Glyph on Line Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","28"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Applies an alternate glyph form when a character falls at the end of a line."], translations: {"zh-Hans":{"decision":"translate","text":"行尾字形替代"},"zh-Hant":{"decision":"translate","text":"行尾字形替代"},"ja_JP":{"decision":"translate","text":"行末グリフ代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.29", source: "Terminal Forms #2",
      owner: "applyOpenType", fieldPath: ["enums","feature","29"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A specific word-ending letterform used in some Arabic-derived scripts."], translations: {"zh-Hans":{"decision":"translate","text":"词尾字形 #2"},"zh-Hant":{"decision":"translate","text":"詞尾字形 #2"},"ja_JP":{"decision":"translate","text":"語末形 #2"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.3", source: "Above-base Substitutions",
      owner: "applyOpenType", fieldPath: ["enums","feature","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with special above-base mark forms in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字上方替换"},"zh-Hant":{"decision":"translate","text":"基字上方替換"},"ja_JP":{"decision":"translate","text":"ベース文字上方の置換"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.30", source: "Terminal Forms #3",
      owner: "applyOpenType", fieldPath: ["enums","feature","30"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A specific word-ending letterform used in some Arabic-derived scripts."], translations: {"zh-Hans":{"decision":"translate","text":"词尾字形 #3"},"zh-Hant":{"decision":"translate","text":"詞尾字形 #3"},"ja_JP":{"decision":"translate","text":"語末形 #3"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.31", source: "Terminal Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","31"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Applies the letterform used when a character appears at the end of a word, as in Arabic script."], translations: {"zh-Hans":{"decision":"translate","text":"词尾字形"},"zh-Hant":{"decision":"translate","text":"詞尾字形"},"ja_JP":{"decision":"translate","text":"語末形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.32", source: "Flattened Accent Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","32"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a flattened, compressed form of an accent mark, typically to fit within limited vertical space."], translations: {"zh-Hans":{"decision":"translate","text":"扁平重音形式"},"zh-Hant":{"decision":"translate","text":"扁平重音形式"},"ja_JP":{"decision":"translate","text":"平坦アクセント形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.33", source: "Fractions",
      owner: "applyOpenType", fieldPath: ["enums","feature","33"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays numbers separated by a slash as a stacked fraction."], translations: {"zh-Hans":{"decision":"translate","text":"分数"},"zh-Hant":{"decision":"translate","text":"分數"},"ja_JP":{"decision":"translate","text":"分数"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.34", source: "Full Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","34"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters at full-width spacing, as used for some East Asian text."], translations: {"zh-Hans":{"decision":"translate","text":"全宽"},"zh-Hant":{"decision":"translate","text":"全寬"},"ja_JP":{"decision":"translate","text":"全角"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.35", source: "Half Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","35"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a reduced consonant form that omits the inherent vowel, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"半辅音字形"},"zh-Hant":{"decision":"translate","text":"半子音字形"},"ja_JP":{"decision":"translate","text":"半子音字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.36", source: "Halant Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","36"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a special form for a consonant marked to suppress its inherent vowel, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"Halant 字形"},"zh-Hant":{"decision":"translate","text":"Halant 字形"},"ja_JP":{"decision":"translate","text":"ハラント字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.37", source: "Alternate Half Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","37"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters at an alternate half-width spacing, as used for some East Asian text."], translations: {"zh-Hans":{"decision":"translate","text":"替代半宽"},"zh-Hant":{"decision":"translate","text":"替代半寬"},"ja_JP":{"decision":"translate","text":"代替半角"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.38", source: "Historical Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","38"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes modern letterforms with their older, historical equivalents."], translations: {"zh-Hans":{"decision":"translate","text":"历史形式"},"zh-Hant":{"decision":"translate","text":"歷史形式"},"ja_JP":{"decision":"translate","text":"歴史的形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.39", source: "Horizontal Kana Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","39"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses alternate forms of Japanese kana characters designed for horizontal text."], translations: {"zh-Hans":{"decision":"translate","text":"水平假名替代"},"zh-Hant":{"decision":"translate","text":"水平假名替代"},"ja_JP":{"decision":"translate","text":"横書き仮名代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.4", source: "Alternative Fractions",
      owner: "applyOpenType", fieldPath: ["enums","feature","4"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays fractions using stacked numerator/denominator forms, as an alternative to diagonal fractions."], translations: {"zh-Hans":{"decision":"translate","text":"替代分数形式"},"zh-Hant":{"decision":"translate","text":"替代分數"},"ja_JP":{"decision":"translate","text":"代替分数"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.40", source: "Historical Ligatures",
      owner: "applyOpenType", fieldPath: ["enums","feature","40"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Joins certain character pairs into ligatures that were historically used but are uncommon today."], translations: {"zh-Hans":{"decision":"translate","text":"历史连字"},"zh-Hant":{"decision":"translate","text":"歷史連字"},"ja_JP":{"decision":"translate","text":"歴史的リガチャ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.41", source: "Hangul",
      owner: "applyOpenType", fieldPath: ["enums","feature","41"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Converts Korean Hanja (Chinese-derived) characters into their Hangul phonetic equivalents."], translations: {"zh-Hans":{"decision":"translate","text":"韩文"},"zh-Hant":{"decision":"translate","text":"韓文"},"ja_JP":{"decision":"translate","text":"ハングル"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.42", source: "Hojo Kanji Forms (JIS X 0212-1990 Kanji Forms)",
      owner: "applyOpenType", fieldPath: ["enums","feature","42"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses an older standardised set of Japanese Kanji character forms (JIS X 0212-1990)."], translations: {"zh-Hans":{"decision":"translate","text":"补助汉字形式 (JIS X 0212-1990)"},"zh-Hant":{"decision":"translate","text":"補助漢字形式 (JIS X 0212-1990)"},"ja_JP":{"decision":"translate","text":"補助漢字形式 (JIS X 0212-1990)"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.43", source: "Half Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","43"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters at half-width spacing, as used for some East Asian text."], translations: {"zh-Hans":{"decision":"translate","text":"半宽"},"zh-Hant":{"decision":"translate","text":"半寬"},"ja_JP":{"decision":"translate","text":"半角"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.44", source: "Initial Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","44"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Applies the letterform used when a character appears at the start of a word, as in Arabic script."], translations: {"zh-Hans":{"decision":"translate","text":"词首字形"},"zh-Hant":{"decision":"translate","text":"詞首字形"},"ja_JP":{"decision":"translate","text":"語頭形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.45", source: "Isolated Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","45"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Applies the standalone letterform used when a character stands alone, unjoined to others, as in Arabic script."], translations: {"zh-Hans":{"decision":"translate","text":"独立字形"},"zh-Hant":{"decision":"translate","text":"獨立字形"},"ja_JP":{"decision":"translate","text":"独立形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.46", source: "Italics",
      owner: "applyOpenType", fieldPath: ["enums","feature","46"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes upright glyphs with italic (slanted) glyph forms."], translations: {"zh-Hans":{"decision":"translate","text":"斜体"},"zh-Hant":{"decision":"translate","text":"斜體"},"ja_JP":{"decision":"translate","text":"イタリック"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.47", source: "Justification Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","47"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses alternate glyph widths to help evenly justify a line of text."], translations: {"zh-Hans":{"decision":"translate","text":"两端对齐替代"},"zh-Hant":{"decision":"translate","text":"兩端對齊替代"},"ja_JP":{"decision":"translate","text":"両端揃え代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.48", source: "JIS78 Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","48"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses the 1978 Japanese standardised set of Kanji character forms."], translations: {"zh-Hans":{"decision":"translate","text":"JIS78 形式"},"zh-Hant":{"decision":"translate","text":"JIS78 形式"},"ja_JP":{"decision":"translate","text":"JIS78 形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.49", source: "JIS83 Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","49"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses the 1983 Japanese standardised set of Kanji character forms."], translations: {"zh-Hans":{"decision":"translate","text":"JIS83 形式"},"zh-Hant":{"decision":"translate","text":"JIS83 形式"},"ja_JP":{"decision":"translate","text":"JIS83 形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.5", source: "Akhand",
      owner: "applyOpenType", fieldPath: ["enums","feature","5"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A required typographic feature that shapes certain fixed consonant clusters in Indic scripts such as Devanagari."], translations: {"zh-Hans":{"decision":"preserve","text":"Akhand"},"zh-Hant":{"decision":"preserve","text":"Akhand"},"ja_JP":{"decision":"preserve","text":"Akhand"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.50", source: "JIS90 Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","50"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses the 1990 Japanese standardised set of Kanji character forms."], translations: {"zh-Hans":{"decision":"translate","text":"JIS90 形式"},"zh-Hant":{"decision":"translate","text":"JIS90 形式"},"ja_JP":{"decision":"translate","text":"JIS90 形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.51", source: "JIS2004 Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","51"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses the 2004 Japanese standardised set of Kanji character forms."], translations: {"zh-Hans":{"decision":"translate","text":"JIS2004 形式"},"zh-Hant":{"decision":"translate","text":"JIS2004 形式"},"ja_JP":{"decision":"translate","text":"JIS2004 形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.52", source: "Kerning",
      owner: "applyOpenType", fieldPath: ["enums","feature","52"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Kerning is the adjustment of spacing between specific pairs of characters, for example tightening the gap in ‘AV’."], translations: {"zh-Hans":{"decision":"translate","text":"字距调整"},"zh-Hant":{"decision":"translate","text":"字距調整"},"ja_JP":{"decision":"translate","text":"カーニング"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.53", source: "Left Bounds",
      owner: "applyOpenType", fieldPath: ["enums","feature","53"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts a glyph’s left edge to align precisely with its layout boundary."], translations: {"zh-Hans":{"decision":"translate","text":"左边界"},"zh-Hant":{"decision":"translate","text":"左邊界"},"ja_JP":{"decision":"translate","text":"左境界"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.54", source: "Standard Ligatures",
      owner: "applyOpenType", fieldPath: ["enums","feature","54"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Joins certain common character pairs, such as ‘fi’ or ‘fl’, into a single combined glyph."], translations: {"zh-Hans":{"decision":"translate","text":"标准连字"},"zh-Hant":{"decision":"translate","text":"標準連字"},"ja_JP":{"decision":"translate","text":"標準リガチャ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.55", source: "Leading Jamo Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","55"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses the initial consonant form of a Korean Hangul syllable block."], translations: {"zh-Hans":{"decision":"translate","text":"韩文初声字母字形"},"zh-Hant":{"decision":"translate","text":"韓文初聲字母字形"},"ja_JP":{"decision":"translate","text":"ハングル初声字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.56", source: "Lining Figures",
      owner: "applyOpenType", fieldPath: ["enums","feature","56"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays numbers at a uniform height aligned with capital letters."], translations: {"zh-Hans":{"decision":"translate","text":"齐线数字"},"zh-Hant":{"decision":"translate","text":"齊線數字"},"ja_JP":{"decision":"translate","text":"ライニング数字"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.57", source: "Localized Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","57"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with forms appropriate to a specific language or region."], translations: {"zh-Hans":{"decision":"translate","text":"本地化形式"},"zh-Hant":{"decision":"translate","text":"本地化形式"},"ja_JP":{"decision":"translate","text":"ローカライズ形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.58", source: "Left-to-right Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","58"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses an alternate glyph form when a character is set in left-to-right text."], translations: {"zh-Hans":{"decision":"translate","text":"从左到右替代"},"zh-Hant":{"decision":"translate","text":"從左到右替代"},"ja_JP":{"decision":"translate","text":"左から右の代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.59", source: "Left-to-right Mirrored Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","59"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a mirrored glyph form when a character is set in left-to-right text."], translations: {"zh-Hans":{"decision":"translate","text":"从左到右镜像形式"},"zh-Hant":{"decision":"translate","text":"從左到右鏡像形式"},"ja_JP":{"decision":"translate","text":"左から右のミラー形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.6", source: "Kerning for Alternate Proportional Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","6"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts spacing between certain characters when Alternate Proportional Widths is used."], translations: {"zh-Hans":{"decision":"translate","text":"替代比例宽度字距"},"zh-Hant":{"decision":"translate","text":"替代比例寬度字距"},"ja_JP":{"decision":"translate","text":"代替プロポーショナル幅のカーニング"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.60", source: "Mark Positioning",
      owner: "applyOpenType", fieldPath: ["enums","feature","60"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Positions diacritic marks relative to their base characters."], translations: {"zh-Hans":{"decision":"translate","text":"标记定位"},"zh-Hant":{"decision":"translate","text":"標記定位"},"ja_JP":{"decision":"translate","text":"マーク位置調整"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.61", source: "Medial Forms #2",
      owner: "applyOpenType", fieldPath: ["enums","feature","61"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A specific mid-word letterform used in some Arabic-derived scripts."], translations: {"zh-Hans":{"decision":"translate","text":"词中字形 #2"},"zh-Hant":{"decision":"translate","text":"詞中字形 #2"},"ja_JP":{"decision":"translate","text":"語中形 #2"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.62", source: "Medial Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","62"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Applies the letterform used when a character appears in the middle of a word, as in Arabic script."], translations: {"zh-Hans":{"decision":"translate","text":"词中字形"},"zh-Hant":{"decision":"translate","text":"詞中字形"},"ja_JP":{"decision":"translate","text":"語中形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.63", source: "Mathematical Greek",
      owner: "applyOpenType", fieldPath: ["enums","feature","63"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes standard Greek letters with their mathematical variant forms."], translations: {"zh-Hans":{"decision":"translate","text":"数学希腊字母"},"zh-Hant":{"decision":"translate","text":"數學希臘字母"},"ja_JP":{"decision":"translate","text":"数学ギリシャ文字"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.64", source: "Mark to Mark Positioning",
      owner: "applyOpenType", fieldPath: ["enums","feature","64"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Positions one diacritic mark relative to another diacritic mark, when marks are stacked."], translations: {"zh-Hans":{"decision":"translate","text":"标记到标记定位"},"zh-Hant":{"decision":"translate","text":"標記到標記定位"},"ja_JP":{"decision":"translate","text":"マーク間位置調整"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.65", source: "Mark Positioning via Substitution",
      owner: "applyOpenType", fieldPath: ["enums","feature","65"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Positions diacritic marks by substituting a precomposed glyph."], translations: {"zh-Hans":{"decision":"translate","text":"通过替换进行标记定位"},"zh-Hant":{"decision":"translate","text":"通過替換進行標記定位"},"ja_JP":{"decision":"translate","text":"置換によるマーク位置調整"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.66", source: "Alternate Annotation Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","66"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with alternate forms used for annotation, such as circled or parenthesised characters."], translations: {"zh-Hans":{"decision":"translate","text":"替代注释形式"},"zh-Hant":{"decision":"translate","text":"替代注釋形式"},"ja_JP":{"decision":"translate","text":"代替注釈形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.67", source: "NLC Kanji Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","67"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses an alternate standardised set of Japanese Kanji character forms."], translations: {"zh-Hans":{"decision":"translate","text":"NLC 汉字形式"},"zh-Hant":{"decision":"translate","text":"NLC 漢字形式"},"ja_JP":{"decision":"translate","text":"NLC 漢字形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.68", source: "Nukta Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","68"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Combines a base consonant with a dot-like mark into a single glyph, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"点符形式"},"zh-Hant":{"decision":"translate","text":"點符形式"},"ja_JP":{"decision":"translate","text":"ヌクタフォーム"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.69", source: "Numerators",
      owner: "applyOpenType", fieldPath: ["enums","feature","69"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays selected digits as the upper (numerator) part of a fraction."], translations: {"zh-Hans":{"decision":"translate","text":"分子"},"zh-Hant":{"decision":"translate","text":"分子"},"ja_JP":{"decision":"translate","text":"分子"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.7", source: "Below-base Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","7"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A technical typographic feature governing how certain consonant forms are positioned below the base character in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字下方字形"},"zh-Hant":{"decision":"translate","text":"基字下方字形"},"ja_JP":{"decision":"translate","text":"ベース文字下方の字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.70", source: "Oldstyle Figures",
      owner: "applyOpenType", fieldPath: ["enums","feature","70"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays numbers with varying heights and descenders, in a style that blends with lowercase text."], translations: {"zh-Hans":{"decision":"translate","text":"旧式数字"},"zh-Hant":{"decision":"translate","text":"舊式數字"},"ja_JP":{"decision":"translate","text":"オールドスタイル数字"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.71", source: "Optical Bounds",
      owner: "applyOpenType", fieldPath: ["enums","feature","71"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts a glyph’s edge slightly beyond its layout boundary to compensate for its visual shape."], translations: {"zh-Hans":{"decision":"translate","text":"视觉边界"},"zh-Hant":{"decision":"translate","text":"視覺邊界"},"ja_JP":{"decision":"translate","text":"光学境界"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.72", source: "Ordinals",
      owner: "applyOpenType", fieldPath: ["enums","feature","72"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays ordinal suffixes, such as ‘st’, ‘nd’ or ‘rd’, as superscript characters."], translations: {"zh-Hans":{"decision":"translate","text":"序数"},"zh-Hant":{"decision":"translate","text":"序數"},"ja_JP":{"decision":"translate","text":"序数"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.73", source: "Ornaments",
      owner: "applyOpenType", fieldPath: ["enums","feature","73"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes certain characters with decorative ornamental glyphs, such as flourishes or symbols."], translations: {"zh-Hans":{"decision":"translate","text":"装饰符号"},"zh-Hant":{"decision":"translate","text":"裝飾符號"},"ja_JP":{"decision":"translate","text":"装飾"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.74", source: "Proportional Alternate Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","74"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters using their natural proportional widths, as an alternative to fixed-width spacing."], translations: {"zh-Hans":{"decision":"translate","text":"比例替代宽度"},"zh-Hant":{"decision":"translate","text":"比例替代寬度"},"ja_JP":{"decision":"translate","text":"プロポーショナル代替幅"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.75", source: "Petite Capitals",
      owner: "applyOpenType", fieldPath: ["enums","feature","75"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Converts lowercase letters into petite capitals, a size smaller than small capitals."], translations: {"zh-Hans":{"decision":"translate","text":"超小型大写"},"zh-Hant":{"decision":"translate","text":"超小型大寫"},"ja_JP":{"decision":"translate","text":"プチキャップス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.76", source: "Proportional Kana",
      owner: "applyOpenType", fieldPath: ["enums","feature","76"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays Japanese kana characters using proportional, variable widths."], translations: {"zh-Hans":{"decision":"translate","text":"比例假名"},"zh-Hant":{"decision":"translate","text":"比例假名"},"ja_JP":{"decision":"translate","text":"プロポーショナル仮名"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.77", source: "Proportional Figures",
      owner: "applyOpenType", fieldPath: ["enums","feature","77"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays numbers using proportional, variable widths."], translations: {"zh-Hans":{"decision":"translate","text":"比例数字"},"zh-Hant":{"decision":"translate","text":"比例數字"},"ja_JP":{"decision":"translate","text":"プロポーショナル数字"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.78", source: "Pre-base Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","78"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a special consonant form that appears before the base character, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字前方字形"},"zh-Hant":{"decision":"translate","text":"基字前方字形"},"ja_JP":{"decision":"translate","text":"ベース文字前方の字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.79", source: "Pre-base Substitutions",
      owner: "applyOpenType", fieldPath: ["enums","feature","79"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with special pre-base forms in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字前方替换"},"zh-Hant":{"decision":"translate","text":"基字前方替換"},"ja_JP":{"decision":"translate","text":"ベース文字前方の置換"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.8", source: "Below-base Mark Positioning",
      owner: "applyOpenType", fieldPath: ["enums","feature","8"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Positions diacritic marks below base characters in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字下方标记定位"},"zh-Hant":{"decision":"translate","text":"基字下方標記定位"},"ja_JP":{"decision":"translate","text":"ベース文字下方のマーク位置調整"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.80", source: "Post-base Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","80"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a special consonant form that appears after the base character, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字后方字形"},"zh-Hant":{"decision":"translate","text":"基字後方字形"},"ja_JP":{"decision":"translate","text":"ベース文字後方の字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.81", source: "Post-base Substitutions",
      owner: "applyOpenType", fieldPath: ["enums","feature","81"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with special post-base forms in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字后方替换"},"zh-Hant":{"decision":"translate","text":"基字後方替換"},"ja_JP":{"decision":"translate","text":"ベース文字後方の置換"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.82", source: "Proportional Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","82"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters using proportional, variable widths, typically for East Asian scripts, as an alternative to fixed-width spacing."], translations: {"zh-Hans":{"decision":"translate","text":"比例宽度"},"zh-Hant":{"decision":"translate","text":"比例寬度"},"ja_JP":{"decision":"translate","text":"プロポーショナル幅"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.83", source: "Quarter Widths",
      owner: "applyOpenType", fieldPath: ["enums","feature","83"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays characters at quarter-width spacing, as used for some East Asian text."], translations: {"zh-Hans":{"decision":"translate","text":"四分之一宽"},"zh-Hant":{"decision":"translate","text":"四分之一寬"},"ja_JP":{"decision":"translate","text":"4分の1幅"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.84", source: "Randomize",
      owner: "applyOpenType", fieldPath: ["enums","feature","84"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Randomly substitutes between several alternate glyph forms to reduce repetitive patterns, such as in a handwriting-style font."], translations: {"zh-Hans":{"decision":"translate","text":"随机化"},"zh-Hant":{"decision":"translate","text":"隨機化"},"ja_JP":{"decision":"translate","text":"ランダム化"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.85", source: "Required Contextual Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","85"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes alternate glyph forms depending on the surrounding characters, needed for correct rendering — a stronger, mandatory version of Contextual Alternates."], translations: {"zh-Hans":{"decision":"translate","text":"必需上下文替代"},"zh-Hant":{"decision":"translate","text":"必需上下文替代"},"ja_JP":{"decision":"translate","text":"必須文脈代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.86", source: "Rakar Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","86"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Combines a consonant with a specific mark into a single glyph, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"Rakar 字形"},"zh-Hant":{"decision":"translate","text":"Rakar 字形"},"ja_JP":{"decision":"translate","text":"ラカールフォーム"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.87", source: "Required Ligatures",
      owner: "applyOpenType", fieldPath: ["enums","feature","87"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Joins certain character pairs into ligatures required for correct rendering of the script."], translations: {"zh-Hans":{"decision":"translate","text":"必需连字"},"zh-Hant":{"decision":"translate","text":"必需連字"},"ja_JP":{"decision":"translate","text":"必須リガチャ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.88", source: "Reph Form",
      owner: "applyOpenType", fieldPath: ["enums","feature","88"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a special mark form placed above the following consonant, in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"Reph 字形"},"zh-Hant":{"decision":"translate","text":"Reph 字形"},"ja_JP":{"decision":"translate","text":"レフフォーム"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.89", source: "Right Bounds",
      owner: "applyOpenType", fieldPath: ["enums","feature","89"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts a glyph’s right edge to align precisely with its layout boundary."], translations: {"zh-Hans":{"decision":"translate","text":"右边界"},"zh-Hant":{"decision":"translate","text":"右邊界"},"ja_JP":{"decision":"translate","text":"右境界"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.9", source: "Below-base Substitutions",
      owner: "applyOpenType", fieldPath: ["enums","feature","9"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with special below-base forms in some Indic scripts."], translations: {"zh-Hans":{"decision":"translate","text":"基字下方替换"},"zh-Hant":{"decision":"translate","text":"基字下方替換"},"ja_JP":{"decision":"translate","text":"ベース文字下方の置換"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.90", source: "Right-to-left Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","90"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses an alternate glyph form when a character is set in right-to-left text."], translations: {"zh-Hans":{"decision":"translate","text":"从右到左替代"},"zh-Hant":{"decision":"translate","text":"從右到左替代"},"ja_JP":{"decision":"translate","text":"右から左の代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.91", source: "Right-to-left Mirrored Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","91"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses a mirrored glyph form when a character is set in right-to-left text."], translations: {"zh-Hans":{"decision":"translate","text":"从右到左镜像形式"},"zh-Hant":{"decision":"translate","text":"從右到左鏡像形式"},"ja_JP":{"decision":"translate","text":"右から左のミラー形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.92", source: "Ruby Notation Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","92"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses smaller glyph forms suitable for guide annotations placed above or beside characters, as in Japanese furigana."], translations: {"zh-Hans":{"decision":"translate","text":"旁注字形"},"zh-Hant":{"decision":"translate","text":"旁注字形"},"ja_JP":{"decision":"translate","text":"ルビ表記形式"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.93", source: "Required Variation Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","93"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyph forms automatically based on the font’s variation axis settings."], translations: {"zh-Hans":{"decision":"translate","text":"必需变体替代"},"zh-Hant":{"decision":"translate","text":"必需變體替代"},"ja_JP":{"decision":"translate","text":"必須バリエーション代替"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.94", source: "Stylistic Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","94"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes glyphs with alternate decorative forms, offering a different visual style for the same character."], translations: {"zh-Hans":{"decision":"translate","text":"风格替代"},"zh-Hant":{"decision":"translate","text":"風格替代"},"ja_JP":{"decision":"translate","text":"スタイル代替グリフ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.95", source: "Scientific Inferiors",
      owner: "applyOpenType", fieldPath: ["enums","feature","95"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Displays selected digits as subscript characters, as used in scientific notation."], translations: {"zh-Hans":{"decision":"translate","text":"科学下标"},"zh-Hant":{"decision":"translate","text":"科學下標"},"ja_JP":{"decision":"translate","text":"科学下付き"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.96", source: "Optical Size",
      owner: "applyOpenType", fieldPath: ["enums","feature","96"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Adjusts glyph shapes and proportions to suit the size the text is displayed at."], translations: {"zh-Hans":{"decision":"translate","text":"光学尺寸"},"zh-Hant":{"decision":"translate","text":"光學尺寸"},"ja_JP":{"decision":"translate","text":"オプティカルサイズ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.97", source: "Small Capitals",
      owner: "applyOpenType", fieldPath: ["enums","feature","97"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Converts lowercase letters into small capitals."], translations: {"zh-Hans":{"decision":"translate","text":"小型大写"},"zh-Hant":{"decision":"translate","text":"小型大寫"},"ja_JP":{"decision":"translate","text":"スモールキャップス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.98", source: "Simplified Forms",
      owner: "applyOpenType", fieldPath: ["enums","feature","98"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Substitutes traditional Chinese characters with their simplified equivalents."], translations: {"zh-Hans":{"decision":"translate","text":"简化字形"},"zh-Hant":{"decision":"translate","text":"簡化字形"},"ja_JP":{"decision":"translate","text":"簡略化した字形"}}
    },
    { key: "nodeAttrEnum:applyOpenType.feature.99", source: "Math Script-style Alternates",
      owner: "applyOpenType", fieldPath: ["enums","feature","99"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Uses alternate glyph forms for characters appearing in mathematical superscript or subscript positions."], translations: {"zh-Hans":{"decision":"translate","text":"数学上下标替代字形"},"zh-Hant":{"decision":"translate","text":"數學上下標替代字形"},"ja_JP":{"decision":"translate","text":"数式の上下付き代替グリフ"}}
    },
    { key: "nodeAttrEnum:applyOpenType.indexMode.0", source: "Line",
      owner: "applyOpenType", fieldPath: ["enums","indexMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Refers to a line of text (as in a text editor)."], translations: {"zh-Hans":{"decision":"translate","text":"行"},"zh-Hant":{"decision":"translate","text":"行"},"ja_JP":{"decision":"translate","text":"行"}}
    },
    { key: "nodeAttrEnum:applyOpenType.indexMode.1", source: "Word",
      owner: "applyOpenType", fieldPath: ["enums","indexMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Refers to a word of text."], translations: {"zh-Hans":{"decision":"translate","text":"词"},"zh-Hant":{"decision":"translate","text":"詞"},"ja_JP":{"decision":"translate","text":"単語"}}
    },
    { key: "nodeAttrEnum:applyOpenType.indexMode.2", source: "Character",
      owner: "applyOpenType", fieldPath: ["enums","indexMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Refers to a single text character (a letter, digit or symbol)."], translations: {"zh-Hans":{"decision":"translate","text":"字符"},"zh-Hant":{"decision":"translate","text":"字元"},"ja_JP":{"decision":"translate","text":"文字"}}
    },
    { key: "nodeAttrEnum:applyOpenType.mode.0", source: "Regex",
      owner: "applyOpenType", fieldPath: ["enums","mode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["Regex (regular expression) is a text pattern-matching syntax."], translations: {"zh-Hans":{"decision":"translate","text":"正则表达式"},"zh-Hant":{"decision":"translate","text":"正則運算式"},"ja_JP":{"decision":"translate","text":"正規表現"}}
    },
    { key: "nodeAttrEnum:applyOpenType.mode.1", source: "Specific Indices",
      owner: "applyOpenType", fieldPath: ["enums","mode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Indices\" (plural of \"index\") means numbered positions in a list — e.g. the 3rd character or word."], translations: {"zh-Hans":{"decision":"translate","text":"指定索引"},"zh-Hant":{"decision":"translate","text":"指定索引"},"ja_JP":{"decision":"translate","text":"指定インデックス"}}
    },
    { key: "nodeAttrEnum:applyOpenType.mode.2", source: "All",
      owner: "applyOpenType", fieldPath: ["enums","mode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"apply to All\" characters/words — the option meaning every match."], translations: {"zh-Hans":{"decision":"translate","text":"全部"},"zh-Hant":{"decision":"translate","text":"全部"},"ja_JP":{"decision":"translate","text":"すべて"}}
    },
    { key: "nodeInfo:applyOpenType", source: "Apply OpenType features to specific ranges of text.",
      owner: "applyOpenType", fieldPath: ["info","tooltip"], displayRole: "node-info",
      dontTranslate: false, notes: ["\"Features\" here means OpenType typographic features (e.g. ligatures, small caps) built into a font."], translations: {"zh-Hans":{"decision":"translate","text":"将 OpenType 特性应用于特定文本范围。"},"zh-Hant":{"decision":"translate","text":"將 OpenType 特性套用至特定文字範圍。"},"ja_JP":{"decision":"translate","text":"テキストの特定範囲に OpenType 特性を適用します。"}}
    },
    { key: "nodeName:applyOpenType", source: "Apply OpenType",
      owner: "applyOpenType", fieldPath: ["info","name"], displayRole: "node-name",
      dontTranslate: false, notes: ["\"OpenType\" is the name of a font format/standard that supports typographic features like ligatures — a proper noun."], translations: {"zh-Hans":{"decision":"translate","text":"应用 OpenType"},"zh-Hant":{"decision":"translate","text":"套用 OpenType"},"ja_JP":{"decision":"translate","text":"OpenType を適用"}}
    },
    { key: "nodeTab:applyOpenType.capitalWords", source: "Capitalised Words",
      owner: "applyOpenType", fieldPath: ["presets","capitalWords"], displayRole: "preset-label",
      dontTranslate: false, notes: ["\"Capitalised\" means words starting with an upper-case letter) sense."], translations: {"zh-Hans":{"decision":"translate","text":"首字母大写单词"},"zh-Hant":{"decision":"translate","text":"首字母大寫單詞"},"ja_JP":{"decision":"translate","text":"大文字で始まる単語"}}
    },
    { key: "nodeTab:applyOpenType.filenames", source: "File Names",
      owner: "applyOpenType", fieldPath: ["presets","filenames"], displayRole: "preset-label",
      dontTranslate: false, notes: ["As in \"match File Names\" — text that looks like a computer file name (e.g. \"image.png\")."], translations: {"zh-Hans":{"decision":"translate","text":"文件名"},"zh-Hant":{"decision":"translate","text":"檔案名稱"},"ja_JP":{"decision":"translate","text":"ファイル名"}}
    },
    { key: "nodeTab:applyOpenType.inParenthesis", source: "Text in Parenthesis",
      owner: "applyOpenType", fieldPath: ["presets","inParenthesis"], displayRole: "preset-label",
      dontTranslate: false, notes: ["\"Parenthesis\" refers to round bracket characters \"( )\" — this preset matches text enclosed in them."], translations: {"zh-Hans":{"decision":"translate","text":"括号内文本"},"zh-Hant":{"decision":"translate","text":"括號內文字"},"ja_JP":{"decision":"translate","text":"括弧内のテキスト"}}
    },
    { key: "nodeTab:applyOpenType.numbers", source: "Numbers",
      owner: "applyOpenType", fieldPath: ["presets","numbers"], displayRole: "preset-label",
      dontTranslate: false, notes: ["As in a preset that matches Numbers — numeral characters (0-9) within the text."], translations: {"zh-Hans":{"decision":"translate","text":"数字"},"zh-Hant":{"decision":"translate","text":"數字"},"ja_JP":{"decision":"translate","text":"数字"}}
    },
    { key: "nodeTab:applyOpenType.ordinalIndicators", source: "Ordinal Indicators",
      owner: "applyOpenType", fieldPath: ["presets","ordinalIndicators"], displayRole: "preset-label",
      dontTranslate: false, notes: ["Ordinal indicators are the suffixes such as ‘st’, ‘nd’, ‘rd’ or ‘th’ that follow a number, as in ‘1st’ or ‘2nd’."], translations: {"zh-Hans":{"decision":"translate","text":"序数标记"},"zh-Hant":{"decision":"translate","text":"序數標記"},"ja_JP":{"decision":"translate","text":"序数標識"}}
    },
    { key: "nodeTab:applyOpenType.specificWords", source: "Match Specific Words",
      owner: "applyOpenType", fieldPath: ["presets","specificWords"], displayRole: "preset-label",
      dontTranslate: false, notes: ["As in \"Match Specific Words\" — search for particular chosen words within the text."], translations: {"zh-Hans":{"decision":"translate","text":"匹配指定单词"},"zh-Hant":{"decision":"translate","text":"比對特定單詞"},"ja_JP":{"decision":"translate","text":"特定の単語に一致"}}
    },
    { key: "nodeTab:applyOpenType.twoLetterWords", source: "All 2 Letter Words",
      owner: "applyOpenType", fieldPath: ["presets","twoLetterWords"], displayRole: "preset-label",
      dontTranslate: false, notes: ["Matches words made of exactly two letters (e.g. \"is\", \"at\")."], translations: {"zh-Hans":{"decision":"translate","text":"所有两字母单词"},"zh-Hant":{"decision":"translate","text":"所有雙字母單詞"},"ja_JP":{"decision":"translate","text":"アルファベット2文字のすべての単語"}}
    },
    { key: "nodeTab:applyOpenType.vowels", source: "Vowels",
      owner: "applyOpenType", fieldPath: ["presets","vowels"], displayRole: "preset-label",
      dontTranslate: false, notes: ["As in the letters A, E, I, O, U — a preset that matches vowel characters within the text."], translations: {"zh-Hans":{"decision":"translate","text":"元音"},"zh-Hant":{"decision":"translate","text":"母音"},"ja_JP":{"decision":"translate","text":"母音"}}
    },
  ]
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
  "changedLocaleSlots": 6,
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
