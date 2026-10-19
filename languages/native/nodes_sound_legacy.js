/**
 * [INPUT]: 依赖官方2.8 soundLegacy完整显示源/notes、AGY/宝玉Skill草稿、Grok全144译值审查与Luna Max语境核对。
 * [OUTPUT]: 提供旧版Sound完整48键三语审定输入，Mel/Bark明确保留，最大dB与旧场景限定独立绑定。
 * [POS]: languages/native的旧场景Sound显示域；单独选取频段不译物理拆频，分析阈值不混播放削波，不复制新版独有控制或承诺两节点行为一致。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 显示文本与真实音频值、枚举索引分离 ---------------------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "catalogPath": "Definitions/Translation/nodeStrings_en-GB.source.json",
    "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
    "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439",
    "sourcePairsSha256": "067a94eb724190671cdf14128c5fa663a2c7a728432a0cb79f095952a15ad5af",
    "batchSourcePairsSha256": "5484b89929cd1c7b0417d27516e402ccbe9ea8601400b9c2f3c88aae3dc78e31",
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "skillVersion": "1.117.3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "draftModel": "gemini-3.8-flash-high",
    "draftExecutionMode": "accept-edits",
    "draftConversationId": "c532c72c-6cf1-42cf-9e71-195777a23b62",
    "draftExitCode": 0,
    "independentReviewProvider": "Grok CLI",
    "independentReviewStatus": "Complete end_turn revise review; all six structured findings reconciled by primary-agent. Summary says seven strings but no seventh finding exists.",
    "sourceContextReview": "GPT-6 Luna Max reviewed provisional all48/144; primary-agent adopted two clarity suggestions across identical Sound display sources.",
    "revisionProvider": "primary-agent",
    "approvedBy": "primary-agent",
    "approvalState": "approved-source-bound-display-input",
    "reviewScope": "All 48 soundLegacy source/notes/144 locale values; full AGY/Skill draft, independent Grok final, Luna provisional review and primary decisions. 46 translate + 2 technical preserves per locale. Maximum dB is the observed asset maximum, not a configurable ceiling; older scene analysis-correction qualification retained. No current Sound runtime parity, scene migration or live claim.",
    "independentReviewModel": "grok-4.7",
    "independentReviewConversationId": "01a0fe0b-83ea-7522-a2aa-392fe434e84a"
  },
  entries: [
    { key: "attrInfo:soundLegacy.aWeighting", source: "When checked, A-weighting adjusts the Frequency Bands’ amplitude to match the loudness perceived by the human ear.",
      owner: "soundLegacy", fieldPath: ["attributes","aWeighting","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"A-weighting\" is a standard curve for adjusting measured sound levels to match human hearing sensitivity."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，A 计权会调整各频段的振幅，以匹配人耳感知的响度。"},"zh-Hant":{"decision":"translate","text":"勾選時，A 加權會調整各頻段的振幅，以符合人耳感知的響度。"},"ja_JP":{"decision":"translate","text":"チェックすると、A 特性により各周波数バンドの振幅が調整され、人間の耳が知覚する音の大きさに合わせられます。"}}
    },
    { key: "attrInfo:soundLegacy.bands", source: "Set the number of frequency bins the audio is split into. Each band returns its own output and behaves like an array that can drive other Attributes.",
      owner: "soundLegacy", fieldPath: ["attributes","bands","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["A \"band\" here is one slice of the audio frequency spectrum (like a bass or treble range)."], translations: {"zh-Hans":{"decision":"translate","text":"设置音频分割的频段数量。每个频段返回独立的输出，且表现为一个数组，可用于驱动其他属性。"},"zh-Hant":{"decision":"translate","text":"設定音訊分割的頻段數量。每個頻段會傳回獨立的輸出，且運作方式如同陣列，可用來驅動其他屬性。"},"ja_JP":{"decision":"translate","text":"オーディオを分割する周波数バンドの数を設定します。各バンドは独自の出力を返し、他の属性を駆動できる配列のように動作します。"}}
    },
    { key: "attrInfo:soundLegacy.clipping", source: "Any values that fall below this threshold will be ignored (represented by a red line in the equalizer).",
      owner: "soundLegacy", fieldPath: ["attributes","clipping","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Clipping\" in audio means a signal is cut off above a threshold."], translations: {"zh-Hans":{"decision":"translate","text":"任何低于此阈值的值都将被忽略（在均衡器中以红线表示）。"},"zh-Hant":{"decision":"translate","text":"任何低於此閾值的值都將被忽略（在等化器中以紅線表示）。"},"ja_JP":{"decision":"translate","text":"このしきい値を下回る値はすべて無視されます（イコライザーでは赤い線で表示されます）。"}}
    },
    { key: "attrInfo:soundLegacy.eqGraph", source: "Preview the sound file and isolate the Frequency Bands. Click bands to include or omit them; the buttons on the right activate or deactivate all bands.",
      owner: "soundLegacy", fieldPath: ["attributes","eqGraph","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Isolate\" means to select/solo specific frequency bands for editing."], translations: {"zh-Hans":{"decision":"translate","text":"预览声音文件并单独选择各频段。单击频段可将其包含或排除；右侧按钮可启用或停用所有频段。"},"zh-Hant":{"decision":"translate","text":"預覽聲音檔案並個別選取各頻段。按一下頻段可將其包含或排除；右側按鈕可啟用或停用所有頻段。"},"ja_JP":{"decision":"translate","text":"サウンドファイルをプレビューし、周波数バンドを個別に選択します。バンドをクリックして含めるか除外します。右側のボタンですべてのバンドを有効化または無効化します。"}}
    },
    { key: "attrInfo:soundLegacy.file", source: "Connect the audio Asset to play/sample by dragging in an audio file from the Assets Window.",
      owner: "soundLegacy", fieldPath: ["attributes","file","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Sample\" here means to read/measure the audio data."], translations: {"zh-Hans":{"decision":"translate","text":"从素材窗口拖入音频文件，连接要播放/采样的音频素材。"},"zh-Hant":{"decision":"translate","text":"從素材視窗拖入音訊檔案，連接要播放/取樣的音訊素材。"},"ja_JP":{"decision":"translate","text":"アセットウィンドウからオーディオファイルをドラッグして、再生/サンプリングするオーディオアセットを接続します。"}}
    },
    { key: "attrInfo:soundLegacy.frameOffset", source: "Set a value to shift the audio’s playback position in frames.",
      owner: "soundLegacy", fieldPath: ["attributes","frameOffset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Frames\" here are units of animation time."], translations: {"zh-Hans":{"decision":"translate","text":"以帧为单位移动音频的播放位置。"},"zh-Hant":{"decision":"translate","text":"以幀為單位移動音訊的播放位置。"},"ja_JP":{"decision":"translate","text":"オーディオの再生位置をフレーム単位でずらします。"}}
    },
    { key: "attrInfo:soundLegacy.frequencyRange", source: "Set the range of frequencies to sample within. Human hearing spans around 20 Hz to 20,000 Hz.",
      owner: "soundLegacy", fieldPath: ["attributes","frequencyRange","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Hz\" (Hertz) is the unit for sound frequency (cycles per second)."], translations: {"zh-Hans":{"decision":"translate","text":"设置要测量的频率范围。人类听觉范围大约为 20 Hz 至 20,000 Hz。"},"zh-Hant":{"decision":"translate","text":"設定要測量的頻率範圍。人類聽覺範圍約為 20 Hz 至 20,000 Hz。"},"ja_JP":{"decision":"translate","text":"測定する周波数の範囲を設定します。人間の可聴域はおよそ 20 Hz 〜 20,000 Hz です。"}}
    },
    { key: "attrInfo:soundLegacy.frequencyScale", source: "Model used to sample the file’s frequencies: <b>Logarithmic</b> (musical octaves), <b>Mel</b> (perceived pitch, good for speech), <b>Bark</b> (auditory masking), <b>Linear</b> (no remapping).",
      owner: "soundLegacy", fieldPath: ["attributes","frequencyScale","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Mel\" and \"Bark\" are names of psychoacoustic frequency scales used in audio analysis."], translations: {"zh-Hans":{"decision":"translate","text":"用于对文件频率进行采样的模型：<b>对数</b>（音乐八度）、<b>Mel</b>（感知音高，适合语音）、<b>Bark</b>（听觉掩蔽）、<b>线性</b>（无重新映射）。"},"zh-Hant":{"decision":"translate","text":"用於對檔案頻率進行取樣的模型：<b>對數</b>（音樂八度）、<b>Mel</b>（感知音高，適合語音）、<b>Bark</b>（聽覺遮蔽）、<b>線性</b>（無重新對應）。"},"ja_JP":{"decision":"translate","text":"ファイルの周波数をサンプリングするために使用されるモデル：<b>対数</b>（音楽のオクターブ）、<b>Mel</b>（知覚される音高、音声に適しています）、<b>Bark</b>（聴覚マスキング）、<b>リニア</b>（再マッピングなし）。"}}
    },
    { key: "attrInfo:soundLegacy.length", source: "The duration of the asset connected to the <b>File</b> attribute, in frames.",
      owner: "soundLegacy", fieldPath: ["attributes","length","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Asset\" refers to the connected audio file resource."], translations: {"zh-Hans":{"decision":"translate","text":"连接到<b>文件</b>属性的素材时长（以帧为单位）。"},"zh-Hant":{"decision":"translate","text":"連接至<b>檔案</b>屬性的素材時長（以幀為單位）。"},"ja_JP":{"decision":"translate","text":"<b>ファイル</b>属性に接続されたアセットの長さ（フレーム単位）。"}}
    },
    { key: "attrInfo:soundLegacy.maxDb", source: "The maximum dB value found within the asset connected to the <b>File</b> attribute.",
      owner: "soundLegacy", fieldPath: ["attributes","maxDb","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"dB\" (decibels) measures the loudness of the audio."], translations: {"zh-Hans":{"decision":"translate","text":"在连接到<b>文件</b>属性的素材中找到的最大 dB 值。"},"zh-Hant":{"decision":"translate","text":"在連接至<b>檔案</b>屬性的素材中找到的最大 dB 值。"},"ja_JP":{"decision":"translate","text":"<b>ファイル</b>属性に接続されたアセット内で見つかった最大 dB 値。"}}
    },
    { key: "attrInfo:soundLegacy.offset", source: "Add/remove a value to the output.",
      owner: "soundLegacy", fieldPath: ["attributes","offset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Output\" is the value this node produces for other attributes to use."], translations: {"zh-Hans":{"decision":"translate","text":"为输出增加或减少一个数值。"},"zh-Hant":{"decision":"translate","text":"為輸出增加或減少一個數值。"},"ja_JP":{"decision":"translate","text":"出力に対して値を加算または減算します。"}}
    },
    { key: "attrInfo:soundLegacy.outActiveBands", source: "The number of active frequency bands selected in the <b>Equaliser</b>.",
      owner: "soundLegacy", fieldPath: ["attributes","outActiveBands","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Active\" means currently enabled/included bands."], translations: {"zh-Hans":{"decision":"translate","text":"在<b>均衡器</b>中选中的启用频段数量。"},"zh-Hant":{"decision":"translate","text":"在<b>等化器</b>中選取的啟用頻段數量。"},"ja_JP":{"decision":"translate","text":"<b>イコライザー</b>で選択されているアクティブな周波数バンドの数。"}}
    },
    { key: "attrInfo:soundLegacy.playAudio", source: "When checked, the <b>File</b> will be audible during playback.",
      owner: "soundLegacy", fieldPath: ["attributes","playAudio","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Audible\" means able to be heard during playback."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，在播放过程中可以听到<b>文件</b>的声音。"},"zh-Hant":{"decision":"translate","text":"勾選時，在播放期間可以聽到<b>檔案</b>的聲音。"},"ja_JP":{"decision":"translate","text":"チェックすると、再生中に<b>ファイル</b>の音声が聞こえるようになります。"}}
    },
    { key: "attrInfo:soundLegacy.playbackPan", source: "Bias audio towards the left (negative) or right (positive) stereo channels.",
      owner: "soundLegacy", fieldPath: ["attributes","playbackPan","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Pan\" in audio means the left/right stereo positioning of a sound."], translations: {"zh-Hans":{"decision":"translate","text":"将音频偏向立体声的左声道（负值）或右声道（正值）。"},"zh-Hant":{"decision":"translate","text":"將音訊偏向立體聲的左聲道（負值）或右聲道（正值）。"},"ja_JP":{"decision":"translate","text":"オーディオを左（負の値）または右（正の値）のステレオチャンネルへ寄せます。"}}
    },
    { key: "attrInfo:soundLegacy.playbackVolume", source: "Increase/decrease the volume of the audio track. Note that high values may result in audio clipping.",
      owner: "soundLegacy", fieldPath: ["attributes","playbackVolume","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Clipping\" here refers to audio distortion caused by the signal exceeding the maximum level."], translations: {"zh-Hans":{"decision":"translate","text":"增加或减小音轨的音量。请注意，较高的值可能会导致音频削波。"},"zh-Hant":{"decision":"translate","text":"增加或減小音訊軌道的音量。請注意，過高的數值可能會導致音訊削波。"},"ja_JP":{"decision":"translate","text":"オーディオトラックの音量を増減します。高い値を設定すると音声のクリッピングが発生する可能性があることに注意してください。"}}
    },
    { key: "attrInfo:soundLegacy.smoothingFrames", source: "Smooth the signal by averaging over past frames. A value of 2 averages the current frame with the one before it.",
      owner: "soundLegacy", fieldPath: ["attributes","smoothingFrames","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Frame\" means a single step of the animation timeline."], translations: {"zh-Hans":{"decision":"translate","text":"通过对过去的帧进行平均来平滑信号。值为 2 时，会将当前帧与其前一帧取平均。"},"zh-Hant":{"decision":"translate","text":"透過對過去的幀進行平均來平滑訊號。值為 2 時，會將目前幀與其前一幀進行平均。"},"ja_JP":{"decision":"translate","text":"過去のフレームを平均化することで信号を滑らかにします。値が 2 の場合、現在のフレームとその直前のフレームが平均化されます。"}}
    },
    { key: "attrInfo:soundLegacy.subSteps", source: "Smooth the signal by sampling between frames. 0 samples once per frame; 1 samples at frames 0.5, 1 and 1.5 and averages them.",
      owner: "soundLegacy", fieldPath: ["attributes","subSteps","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Signal\" refers to the audio data being analysed over time."], translations: {"zh-Hans":{"decision":"translate","text":"通过在帧之间进行采样来平滑信号。0 表示每帧采样一次；1 表示在 0.5、1 和 1.5 帧处采样并计算平均值。"},"zh-Hant":{"decision":"translate","text":"透過在幀之間進行取樣來平滑訊號。0 表示每幀取樣一次；1 表示在 0.5、1 和 1.5 幀處取樣並計算平均值。"},"ja_JP":{"decision":"translate","text":"フレーム間でサンプリングを行うことで信号を滑らかにします。0 はフレームごとに 1 回サンプリングします。1 は 0.5、1、1.5 フレームでサンプリングし、それらを平均化します。"}}
    },
    { key: "attrInfo:soundLegacy.useIndex", source: "When checked, any incoming Index context (e.g. from a Duplicator) is used so each duplicate gets a different value for each frequency band.",
      owner: "soundLegacy", fieldPath: ["attributes","useIndex","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Index\" is a numeric identifier per duplicate item."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，将使用任何传入的索引上下文（例如来自复制器），以便每个副本在每个频段上获得不同的数值。"},"zh-Hant":{"decision":"translate","text":"勾選時，將使用任何傳入的索引上下文（例如來自複製器），使每個複本在每個頻段上獲得不同的數值。"},"ja_JP":{"decision":"translate","text":"チェックすると、入力されたインデックスコンテキスト（デュプリケーターなどからのもの）が使用され、複製ごとに各周波数バンドの異なる値が取得されます。"}}
    },
    { key: "attrInfo:soundLegacy.weightingGraph", source: "Graph controlling each band’s contribution, where curve position P (0..1) maps to <b>Frequency Range Hz</b> (L..H). Value 0 mutes the band, 1 doubles it, and 0.5 (default) leaves it unchanged.",
      owner: "soundLegacy", fieldPath: ["attributes","weightingGraph","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Mutes\" means silences that frequency band entirely."], translations: {"zh-Hans":{"decision":"translate","text":"控制每个频段贡献的图，其中曲线位置 P (0..1) 映射到<b>频率范围 Hz</b> (L..H)。值为 0 会使频段静音，1 为翻倍，0.5（默认值）保持不变。"},"zh-Hant":{"decision":"translate","text":"控制每個頻段貢獻量的圖，其中曲線位置 P (0..1) 對應至<b>頻率範圍 Hz</b> (L..H)。值為 0 會使頻段靜音，1 為加倍，0.5（預設值）保持不變。"},"ja_JP":{"decision":"translate","text":"各バンドの寄与度を制御するグラフで、カーブ位置 P (0..1) が<b>周波数範囲 Hz</b> (L..H) にマッピングされます。値 0 はバンドをミュートし、1 は 2 倍にし、0.5（デフォルト）は変更しません。"}}
    },
    { key: "nodeAttr:soundLegacy.aWeighting", source: "A-Weighting",
      owner: "soundLegacy", fieldPath: ["attributes","aWeighting","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"A-Weighting\" is a standard audio-engineering adjustment that matches human hearing sensitivity."], translations: {"zh-Hans":{"decision":"translate","text":"A 计权"},"zh-Hant":{"decision":"translate","text":"A 加權"},"ja_JP":{"decision":"translate","text":"A 特性"}}
    },
    { key: "nodeAttr:soundLegacy.bands", source: "Frequency Bands",
      owner: "soundLegacy", fieldPath: ["attributes","bands","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Bands\" here refers to frequency ranges the audio is split into for analysis."], translations: {"zh-Hans":{"decision":"translate","text":"频段"},"zh-Hant":{"decision":"translate","text":"頻段"},"ja_JP":{"decision":"translate","text":"周波数バンド"}}
    },
    { key: "nodeAttr:soundLegacy.clipping", source: "Volume Clipping",
      owner: "soundLegacy", fieldPath: ["attributes","clipping","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Clipping\" here means values falling below a volume threshold are ignored/cut off, a different sense from audio distortion caused by excessive volume."], translations: {"zh-Hans":{"decision":"translate","text":"音量阈值"},"zh-Hant":{"decision":"translate","text":"音量閾值"},"ja_JP":{"decision":"translate","text":"音量しきい値"}}
    },
    { key: "nodeAttr:soundLegacy.eqGraph", source: "Equaliser",
      owner: "soundLegacy", fieldPath: ["attributes","eqGraph","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Equaliser\" (often abbreviated EQ) is an audio tool for adjusting the balance of different frequency bands."], translations: {"zh-Hans":{"decision":"translate","text":"均衡器"},"zh-Hant":{"decision":"translate","text":"等化器"},"ja_JP":{"decision":"translate","text":"イコライザー"}}
    },
    { key: "nodeAttr:soundLegacy.file", source: "File",
      owner: "soundLegacy", fieldPath: ["attributes","file","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"connect the audio File to play\" — a media asset."], translations: {"zh-Hans":{"decision":"translate","text":"文件"},"zh-Hant":{"decision":"translate","text":"檔案"},"ja_JP":{"decision":"translate","text":"ファイル"}}
    },
    { key: "nodeAttr:soundLegacy.frameOffset", source: "Frame Offset",
      owner: "soundLegacy", fieldPath: ["attributes","frameOffset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Frame Offset\" — a shift in timeline position measured in frames."], translations: {"zh-Hans":{"decision":"translate","text":"帧偏移"},"zh-Hant":{"decision":"translate","text":"幀偏移"},"ja_JP":{"decision":"translate","text":"フレームオフセット"}}
    },
    { key: "nodeAttr:soundLegacy.frequencyRange", source: "Frequency Range Hz",
      owner: "soundLegacy", fieldPath: ["attributes","frequencyRange","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Hz\" = Hertz, a unit of frequency."], translations: {"zh-Hans":{"decision":"translate","text":"频率范围 Hz"},"zh-Hant":{"decision":"translate","text":"頻率範圍 Hz"},"ja_JP":{"decision":"translate","text":"周波数範囲 Hz"}}
    },
    { key: "nodeAttr:soundLegacy.frequencyScale", source: "Frequency Scale",
      owner: "soundLegacy", fieldPath: ["attributes","frequencyScale","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Logarithmic\"/\"Mel\"/\"Bark\" are technical audio-frequency scale names for how pitch is perceived; \"Linear\" spaces frequencies evenly."], translations: {"zh-Hans":{"decision":"translate","text":"频率刻度"},"zh-Hant":{"decision":"translate","text":"頻率刻度"},"ja_JP":{"decision":"translate","text":"周波数スケール"}}
    },
    { key: "nodeAttr:soundLegacy.length", source: "File Length",
      owner: "soundLegacy", fieldPath: ["attributes","length","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in the audio \"File Length\" — its duration in frames."], translations: {"zh-Hans":{"decision":"translate","text":"文件时长"},"zh-Hant":{"decision":"translate","text":"檔案時長"},"ja_JP":{"decision":"translate","text":"ファイルの長さ"}}
    },
    { key: "nodeAttr:soundLegacy.maxDb", source: "Maximum dB",
      owner: "soundLegacy", fieldPath: ["attributes","maxDb","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"dB\" = decibels, a unit of audio volume/loudness."], translations: {"zh-Hans":{"decision":"translate","text":"最大分贝"},"zh-Hant":{"decision":"translate","text":"最大分貝"},"ja_JP":{"decision":"translate","text":"最大デシベル"}}
    },
    { key: "nodeAttr:soundLegacy.offset", source: "Value Offset",
      owner: "soundLegacy", fieldPath: ["attributes","offset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Value Offset\" — a fixed amount added to the output value."], translations: {"zh-Hans":{"decision":"translate","text":"数值偏移"},"zh-Hant":{"decision":"translate","text":"數值偏移"},"ja_JP":{"decision":"translate","text":"値オフセット"}}
    },
    { key: "nodeAttr:soundLegacy.outActiveBands", source: "Active Bands",
      owner: "soundLegacy", fieldPath: ["attributes","outActiveBands","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Bands\" are frequency ranges the audio is split into for analysis."], translations: {"zh-Hans":{"decision":"translate","text":"启用频段"},"zh-Hant":{"decision":"translate","text":"啟用頻段"},"ja_JP":{"decision":"translate","text":"アクティブバンド"}}
    },
    { key: "nodeAttr:soundLegacy.playAudio", source: "Play Audio",
      owner: "soundLegacy", fieldPath: ["attributes","playAudio","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Play Audio\" — start audible playback of the sound."], translations: {"zh-Hans":{"decision":"translate","text":"播放音频"},"zh-Hant":{"decision":"translate","text":"播放音訊"},"ja_JP":{"decision":"translate","text":"オーディオを再生"}}
    },
    { key: "nodeAttr:soundLegacy.playbackPan", source: "Pan",
      owner: "soundLegacy", fieldPath: ["attributes","playbackPan","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Pan\" is a noun: the left/right stereo balance."], translations: {"zh-Hans":{"decision":"translate","text":"声像"},"zh-Hant":{"decision":"translate","text":"聲像"},"ja_JP":{"decision":"translate","text":"パン"}}
    },
    { key: "nodeAttr:soundLegacy.playbackVolume", source: "Volume Adjustment dB",
      owner: "soundLegacy", fieldPath: ["attributes","playbackVolume","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"dB\" = decibels, a unit of audio volume."], translations: {"zh-Hans":{"decision":"translate","text":"音量调整 dB"},"zh-Hant":{"decision":"translate","text":"音量調整 dB"},"ja_JP":{"decision":"translate","text":"音量調整 dB"}}
    },
    { key: "nodeAttr:soundLegacy.smoothingFrames", source: "Smoothing Frames",
      owner: "soundLegacy", fieldPath: ["attributes","smoothingFrames","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Smoothing Frames\" — how many animation frames are averaged to reduce jitter."], translations: {"zh-Hans":{"decision":"translate","text":"平滑帧数"},"zh-Hant":{"decision":"translate","text":"平滑幀數"},"ja_JP":{"decision":"translate","text":"スムージングフレーム数"}}
    },
    { key: "nodeAttr:soundLegacy.subSteps", source: "Sub Steps",
      owner: "soundLegacy", fieldPath: ["attributes","subSteps","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Sub Steps\" adds extra audio samples between frames to smooth the result."], translations: {"zh-Hans":{"decision":"translate","text":"子步数"},"zh-Hant":{"decision":"translate","text":"子步數"},"ja_JP":{"decision":"translate","text":"サブステップ"}}
    },
    { key: "nodeAttr:soundLegacy.useIndex", source: "Use Incoming Index",
      owner: "soundLegacy", fieldPath: ["attributes","useIndex","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Index\" here identifies each individual copy/instance in a repeated (duplicated) set of layers."], translations: {"zh-Hans":{"decision":"translate","text":"使用传入索引"},"zh-Hant":{"decision":"translate","text":"使用傳入索引"},"ja_JP":{"decision":"translate","text":"入力インデックスを使用"}}
    },
    { key: "nodeAttr:soundLegacy.weightingGraph", source: "Band Weighting Graph",
      owner: "soundLegacy", fieldPath: ["attributes","weightingGraph","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Weighting\" means giving each frequency band a different level of contribution; \"Graph\" refers to a curve-editing control."], translations: {"zh-Hans":{"decision":"translate","text":"频段加权图"},"zh-Hant":{"decision":"translate","text":"頻段加權圖"},"ja_JP":{"decision":"translate","text":"バンド重み付けグラフ"}}
    },
    { key: "nodeAttrEnum:soundLegacy.frequencyScale.0", source: "Logarithmic",
      owner: "soundLegacy", fieldPath: ["enums","frequencyScale","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A frequency scale based on musical octaves, a technical audio term."], translations: {"zh-Hans":{"decision":"translate","text":"对数"},"zh-Hant":{"decision":"translate","text":"對數"},"ja_JP":{"decision":"translate","text":"対数"}}
    },
    { key: "nodeAttrEnum:soundLegacy.frequencyScale.1", source: "Mel",
      owner: "soundLegacy", fieldPath: ["enums","frequencyScale","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Mel\" is a frequency scale matching human pitch perception, a technical audio term."], translations: {"zh-Hans":{"decision":"preserve","text":"Mel"},"zh-Hant":{"decision":"preserve","text":"Mel"},"ja_JP":{"decision":"preserve","text":"Mel"}}
    },
    { key: "nodeAttrEnum:soundLegacy.frequencyScale.2", source: "Bark",
      owner: "soundLegacy", fieldPath: ["enums","frequencyScale","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Bark\" is a frequency scale matching human hearing perception, a technical audio term."], translations: {"zh-Hans":{"decision":"preserve","text":"Bark"},"zh-Hant":{"decision":"preserve","text":"Bark"},"ja_JP":{"decision":"preserve","text":"Bark"}}
    },
    { key: "nodeAttrEnum:soundLegacy.frequencyScale.3", source: "Linear",
      owner: "soundLegacy", fieldPath: ["enums","frequencyScale","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in the \"Linear\" frequency scale — no remapping/curve applied, a straight one-to-one mapping."], translations: {"zh-Hans":{"decision":"translate","text":"线性"},"zh-Hant":{"decision":"translate","text":"線性"},"ja_JP":{"decision":"translate","text":"リニア"}}
    },
    { key: "nodeInfo:soundLegacy", source: "Playback audio and drive deformation or values. (Legacy — kept for scenes created before the sound node’s audio analysis was corrected.)",
      owner: "soundLegacy", fieldPath: ["info","tooltip"], displayRole: "node-info",
      dontTranslate: false, notes: ["\"Legacy\" here means an older node kept for backward compatibility with existing scene files."], translations: {"zh-Hans":{"decision":"translate","text":"播放音频并驱动变形或数值。（旧版，保留用于声音节点音频分析修正之前创建的场景。）"},"zh-Hant":{"decision":"translate","text":"播放音訊並驅動變形或數值。（舊版，保留用於聲音節點音訊分析修正之前建立的場景。）"},"ja_JP":{"decision":"translate","text":"オーディオを再生し、変形や数値を駆動します。（レガシー — サウンドノードのオーディオ解析が修正される前に作成されたシーン用に保持されています。）"}}
    },
    { key: "nodeName:soundLegacy", source: "Sound Legacy",
      owner: "soundLegacy", fieldPath: ["info","name"], displayRole: "node-name",
      dontTranslate: false, notes: ["\"Legacy\" here means an older, superseded version of this feature kept for backwards compatibility."], translations: {"zh-Hans":{"decision":"translate","text":"声音（旧版）"},"zh-Hant":{"decision":"translate","text":"聲音（舊版）"},"ja_JP":{"decision":"translate","text":"サウンド（レガシー）"}}
    },
    { key: "nodeTab:soundLegacy.advanced", source: "Advanced",
      owner: "soundLegacy", fieldPath: ["tabs","advanced"], displayRole: "tab-label",
      dontTranslate: false, notes: ["As in an \"Advanced\" settings tab for extra, less commonly used options."], translations: {"zh-Hans":{"decision":"translate","text":"高级"},"zh-Hant":{"decision":"translate","text":"進階"},"ja_JP":{"decision":"translate","text":"詳細"}}
    },
    { key: "soundLegacy.0", source: "Number of Bands must be above 1.",
      owner: "soundLegacy", fieldPath: ["notifications","0"], displayRole: "notification-text",
      dontTranslate: false, notes: ["\"Bands\" are frequency ranges the audio is split into for analysis."], translations: {"zh-Hans":{"decision":"translate","text":"频段数必须大于 1。"},"zh-Hant":{"decision":"translate","text":"頻段數必須大於 1。"},"ja_JP":{"decision":"translate","text":"バンド数は 1 より大きい必要があります。"}}
    },
    { key: "soundLegacy.1", source: "Could not find audio asset with this name.",
      owner: "soundLegacy", fieldPath: ["notifications","1"], displayRole: "notification-text",
      dontTranslate: false, notes: ["\"Asset\" refers to the connected audio file resource."], translations: {"zh-Hans":{"decision":"translate","text":"找不到此名称的音频素材。"},"zh-Hant":{"decision":"translate","text":"找不到此名稱的音訊素材。"},"ja_JP":{"decision":"translate","text":"この名前のオーディオアセットが見つかりませんでした。"}}
    },
    { key: "soundLegacy.2", source: "Drag an Audio Asset onto the File attribute.",
      owner: "soundLegacy", fieldPath: ["notifications","2"], displayRole: "notification-text",
      dontTranslate: false, notes: ["\"Drag\" is the mouse action of dragging-and-dropping a file."], translations: {"zh-Hans":{"decision":"translate","text":"将音频素材拖到文件属性上。"},"zh-Hant":{"decision":"translate","text":"將音訊素材拖曳到檔案屬性上。"},"ja_JP":{"decision":"translate","text":"オーディオアセットをファイル属性にドラッグします。"}}
    },
  ],
};
