/**
 * [INPUT]: 依赖官方 2.8 Sound 完整显示源/notes、AGY/宝玉 Skill 初稿、Grok 全键审稿及 Luna Max 语义核对。
 * [OUTPUT]: 提供完整 65 个 Sound 显示键的三语源绑定审定输入，Mel/Bark/RMS 显式保留。
 * [POS]: languages/native 的新版 Sound 域；区分分析阈值与播放削波、最低值归零与播放起点，保护采样/计权/声像关系，不覆盖 soundLegacy 或音频模型身份。
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
    "sourcePairsSha256": "6a670055d3980a696a6c221944d0e1a09616f55360618753f6bc11d696c9c7f9",
    "batchSourcePairsSha256": "55006b9695a5628c6ab6a83ce1ad4c51892eca9a2fb24c5a1bc491d215f6fe87",
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "skillVersion": "1.117.3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "draftModel": "gemini-3.8-flash-high",
    "draftExecutionMode": "accept-edits",
    "draftConversationId": "330a3bfd-e12c-4725-ad6f-e152a7090779",
    "draftExitCode": 0,
    "independentReviewProvider": "Grok CLI",
    "independentReviewStatus": "Complete end_turn needs-revision review; all 16 findings reconciled by primary-agent",
    "sourceContextReview": "GPT-6 Luna Max",
    "revisionProvider": "primary-agent",
    "approvedBy": "primary-agent",
    "approvalState": "approved-source-bound-display-input",
    "reviewScope": "All 65 Sound source/notes/195 locale values; actual AGY/Skill draft, complete Grok final review, Luna Max semantic review and primary corrections. 62 translate + 3 explicit technical preserves per locale. New Sound only, not soundLegacy, audio behavior parity, live layout or deployment proof.",
    "independentReviewModel": "grok-4.7",
    "independentReviewConversationId": "01a0fde4-7114-70b2-8d2a-96769affbb3d",
    "postApprovalClarityReview": "Primary-agent adopted Luna Max Legacy followup for identical official source/notes only: zh-Hans/zh-Hant Volume Clipping names explicitly threshold; three eqGraph tooltips individually select bands, not physical split. Actual added semantic RED, then corrected display values; no runtime parity claim."
  },
  entries: [
    { key: "attrInfo:sound.aWeighting", source: "When checked, A-weighting adjusts the Frequency Bands’ amplitude to match the loudness perceived by the human ear.",
      owner: "sound", fieldPath: ["attributes","aWeighting","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"A-weighting\" is a standard curve for adjusting measured sound levels to match human hearing sensitivity."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，A 计权会调整各频段的振幅，以匹配人耳感知的响度。"},"zh-Hant":{"decision":"translate","text":"勾選時，A 加權會調整各頻段的振幅，以符合人耳感知的響度。"},"ja_JP":{"decision":"translate","text":"チェックすると、A 特性により各周波数バンドの振幅が調整され、人間の耳が知覚する音の大きさに合わせられます。"}}
    },
    { key: "attrInfo:sound.autoNormalise", source: "When checked, output is scaled by the track’s peak (<b>dB Range</b> H) into a 0-1 range before <b>Value Offset</b> and strength are applied.",
      owner: "sound", fieldPath: ["attributes","autoNormalise","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Peak\" is the loudest point measured in the audio track."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，输出会在应用<b>数值偏移</b>和强度之前，按音轨的峰值（<b>dB 范围</b> H）缩放到 0-1 范围。"},"zh-Hant":{"decision":"translate","text":"勾選時，輸出會在套用<b>數值偏移</b>和強度之前，依音訊軌道的峰值（<b>dB 範圍</b> H）縮放至 0-1 範圍。"},"ja_JP":{"decision":"translate","text":"チェックすると、<b>値オフセット</b>と強度が適用される前に、トラックのピーク（<b>dB 範囲</b> H）によって出力が 0-1 の範囲にスケーリングされます。"}}
    },
    { key: "attrInfo:sound.bands", source: "Set the number of frequency bins the audio is split into. Each band returns its own output and behaves like an array that can drive other Attributes.",
      owner: "sound", fieldPath: ["attributes","bands","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["A \"band\" here is one slice of the audio frequency spectrum (like a bass or treble range)."], translations: {"zh-Hans":{"decision":"translate","text":"设置音频分割的频段数量。每个频段返回独立的输出，且表现为一个数组，可用于驱动其他属性。"},"zh-Hant":{"decision":"translate","text":"設定音訊分割的頻段數量。每個頻段會傳回獨立的輸出，且運作方式如同陣列，可用來驅動其他屬性。"},"ja_JP":{"decision":"translate","text":"オーディオを分割する周波数バンドの数を設定します。各バンドは独自の出力を返し、他の属性を駆動できる配列のように動作します。"}}
    },
    { key: "attrInfo:sound.channel", source: "Choose which channels of the audio to analyse.",
      owner: "sound", fieldPath: ["attributes","channel","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Channels\" refers to the separate left/right/mono audio streams."], translations: {"zh-Hans":{"decision":"translate","text":"选择要分析的音频声道。"},"zh-Hant":{"decision":"translate","text":"選擇要分析的音訊聲道。"},"ja_JP":{"decision":"translate","text":"分析するオーディオのチャンネルを選択します。"}}
    },
    { key: "attrInfo:sound.clipping", source: "Any values that fall below this threshold will be ignored (represented by a red line in the equalizer).",
      owner: "sound", fieldPath: ["attributes","clipping","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Clipping\" in audio means a signal is cut off above a threshold."], translations: {"zh-Hans":{"decision":"translate","text":"任何低于此阈值的值都将被忽略（在均衡器中以红线表示）。"},"zh-Hant":{"decision":"translate","text":"任何低於此閾值的值都將被忽略（在等化器中以紅線表示）。"},"ja_JP":{"decision":"translate","text":"このしきい値を下回る値はすべて無視されます（イコライザーでは赤い線で表示されます）。"}}
    },
    { key: "attrInfo:sound.dbRange", source: "The minimum (L) and maximum (H) dB values found within the asset connected to the <b>File</b> attribute, for the current analysis settings.",
      owner: "sound", fieldPath: ["attributes","dbRange","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"dB\" (decibels) measures the loudness of the audio."], translations: {"zh-Hans":{"decision":"translate","text":"在当前分析设置下，连接到<b>文件</b>属性的素材所测得的最低 (L) 和最高 (H) dB 值。"},"zh-Hant":{"decision":"translate","text":"在目前的分析設定下，連接至<b>檔案</b>屬性的素材中所測得的最低 (L) 與最高 (H) dB 值。"},"ja_JP":{"decision":"translate","text":"現在の分析設定において、<b>ファイル</b>属性に接続されたアセット内で検出された最小 (L) および最大 (H) の dB 値。"}}
    },
    { key: "attrInfo:sound.eqGraph", source: "Preview the sound file and isolate the Frequency Bands. Click bands to include or omit them; the buttons on the right activate or deactivate all bands.",
      owner: "sound", fieldPath: ["attributes","eqGraph","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Isolate\" means to select/solo specific frequency bands for editing."], translations: {"zh-Hans":{"decision":"translate","text":"预览声音文件并单独选择各频段。单击频段可将其包含或排除；右侧按钮可启用或停用所有频段。"},"zh-Hant":{"decision":"translate","text":"預覽聲音檔案並個別選取各頻段。按一下頻段可將其包含或排除；右側按鈕可啟用或停用所有頻段。"},"ja_JP":{"decision":"translate","text":"サウンドファイルをプレビューし、周波数バンドを個別に選択します。バンドをクリックして含めるか除外します。右側のボタンですべてのバンドを有効化または無効化します。"}}
    },
    { key: "attrInfo:sound.file", source: "Connect the audio Asset to play/sample by dragging in an audio file from the Assets Window.",
      owner: "sound", fieldPath: ["attributes","file","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Sample\" here means to read/measure the audio data."], translations: {"zh-Hans":{"decision":"translate","text":"从素材窗口拖入音频文件，连接要播放/采样的音频素材。"},"zh-Hant":{"decision":"translate","text":"從素材視窗拖入音訊檔案，連接要播放/取樣的音訊素材。"},"ja_JP":{"decision":"translate","text":"アセットウィンドウからオーディオファイルをドラッグして、再生/サンプリングするオーディオアセットを接続します。"}}
    },
    { key: "attrInfo:sound.frameOffset", source: "Set a value to shift the audio’s playback position in frames.",
      owner: "sound", fieldPath: ["attributes","frameOffset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Frames\" here are units of animation time."], translations: {"zh-Hans":{"decision":"translate","text":"以帧为单位移动音频的播放位置。"},"zh-Hant":{"decision":"translate","text":"以幀為單位移動音訊的播放位置。"},"ja_JP":{"decision":"translate","text":"オーディオの再生位置をフレーム単位でずらします。"}}
    },
    { key: "attrInfo:sound.frequencyRange", source: "Set the range of frequencies to sample within. Human hearing spans around 20 Hz to 20,000 Hz.",
      owner: "sound", fieldPath: ["attributes","frequencyRange","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Hz\" (Hertz) is the unit for sound frequency (cycles per second)."], translations: {"zh-Hans":{"decision":"translate","text":"设置要测量的频率范围。人类听觉范围大约为 20 Hz 至 20,000 Hz。"},"zh-Hant":{"decision":"translate","text":"設定要測量的頻率範圍。人類聽覺範圍約為 20 Hz 至 20,000 Hz。"},"ja_JP":{"decision":"translate","text":"測定する周波数の範囲を設定します。人間の可聴域はおよそ 20 Hz 〜 20,000 Hz です。"}}
    },
    { key: "attrInfo:sound.frequencyScale", source: "Model used to sample the file’s frequencies: <b>Logarithmic</b> (musical octaves), <b>Mel</b> (perceived pitch, good for speech), <b>Bark</b> (auditory masking), <b>Linear</b> (no remapping).",
      owner: "sound", fieldPath: ["attributes","frequencyScale","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Mel\" and \"Bark\" are names of psychoacoustic frequency scales used in audio analysis."], translations: {"zh-Hans":{"decision":"translate","text":"用于对文件频率进行采样的模型：<b>对数</b>（音乐八度）、<b>Mel</b>（感知音高，适合语音）、<b>Bark</b>（听觉掩蔽）、<b>线性</b>（无重新映射）。"},"zh-Hant":{"decision":"translate","text":"用於對檔案頻率進行取樣的模型：<b>對數</b>（音樂八度）、<b>Mel</b>（感知音高，適合語音）、<b>Bark</b>（聽覺遮蔽）、<b>線性</b>（無重新對應）。"},"ja_JP":{"decision":"translate","text":"ファイルの周波数をサンプリングするために使用されるモデル：<b>対数</b>（音楽のオクターブ）、<b>Mel</b>（知覚される音高、音声に適しています）、<b>Bark</b>（聴覚マスキング）、<b>リニア</b>（再マッピングなし）。"}}
    },
    { key: "attrInfo:sound.length", source: "The duration of the asset connected to the <b>File</b> attribute, in frames.",
      owner: "sound", fieldPath: ["attributes","length","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Asset\" refers to the connected audio file resource."], translations: {"zh-Hans":{"decision":"translate","text":"连接到<b>文件</b>属性的素材时长（以帧为单位）。"},"zh-Hant":{"decision":"translate","text":"連接至<b>檔案</b>屬性的素材時長（以幀為單位）。"},"ja_JP":{"decision":"translate","text":"<b>ファイル</b>属性に接続されたアセットの長さ（フレーム単位）。"}}
    },
    { key: "attrInfo:sound.levelType", source: "When <b>Mode</b> is Level, choose <b>RMS</b> (average loudness, smoother) or <b>Peak</b> (loudest instantaneous sample, more responsive to transients).",
      owner: "sound", fieldPath: ["attributes","levelType","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"RMS\" (root-mean-square) and \"Peak\" are audio-loudness measurement methods; \"transients\" are brief sudden bursts of sound."], translations: {"zh-Hans":{"decision":"translate","text":"当<b>模式</b>为电平时，选择 <b>RMS</b>（平均响度，更平滑）或<b>峰值</b>（瞬时最大采样，对瞬态响应更灵敏）。"},"zh-Hant":{"decision":"translate","text":"當<b>模式</b>為電平時，選擇 <b>RMS</b>（平均響度，更平滑）或<b>峰值</b>（瞬時最大取樣，對瞬態反應更靈敏）。"},"ja_JP":{"decision":"translate","text":"<b>モード</b>がレベルの場合、<b>RMS</b>（平均音量、より滑らか）または<b>ピーク</b>（最も大きな瞬間サンプル、トランジェントに対する応答性が高い）を選択します。"}}
    },
    { key: "attrInfo:sound.mode", source: "Choose how the audio is analysed. <b>Spectral</b> splits it into frequency bands; <b>Level</b> reads overall loudness (RMS or Peak), ignoring frequency content.",
      owner: "sound", fieldPath: ["attributes","mode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"RMS\" (root mean square) is a technical term for average loudness over time, distinct from \"Peak\", the single loudest instantaneous sample."], translations: {"zh-Hans":{"decision":"translate","text":"选择音频的分析方式。<b>频谱</b>会将其拆分为多个频段；<b>电平</b>则读取整体响度（RMS 或峰值），忽略频率内容。"},"zh-Hant":{"decision":"translate","text":"選擇音訊的分析方式。<b>頻譜</b>會將其拆分為多個頻段；<b>電平</b>則讀取整體響度（RMS 或峰值），忽略頻率內容。"},"ja_JP":{"decision":"translate","text":"オーディオの分析方法を選択します。<b>スペクトル</b>は周波数バンドに分割します。<b>レベル</b>は周波数成分を無視して、全体の音量（RMS またはピーク）を読み取ります。"}}
    },
    { key: "attrInfo:sound.offset", source: "Add/remove a value to the output.",
      owner: "sound", fieldPath: ["attributes","offset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Output\" is the value this node produces for other attributes to use."], translations: {"zh-Hans":{"decision":"translate","text":"为输出增加或减少一个数值。"},"zh-Hant":{"decision":"translate","text":"為輸出增加或減少一個數值。"},"ja_JP":{"decision":"translate","text":"出力に対して値を加算または減算します。"}}
    },
    { key: "attrInfo:sound.outActiveBands", source: "The number of active frequency bands selected in the <b>Equaliser</b>.",
      owner: "sound", fieldPath: ["attributes","outActiveBands","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Active\" means currently enabled/included bands."], translations: {"zh-Hans":{"decision":"translate","text":"在<b>均衡器</b>中选中的启用频段数量。"},"zh-Hant":{"decision":"translate","text":"在<b>等化器</b>中選取的啟用頻段數量。"},"ja_JP":{"decision":"translate","text":"<b>イコライザー</b>で選択されているアクティブな周波数バンドの数。"}}
    },
    { key: "attrInfo:sound.playAudio", source: "When checked, the <b>File</b> will be audible during playback.",
      owner: "sound", fieldPath: ["attributes","playAudio","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Audible\" means able to be heard during playback."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，在播放过程中可以听到<b>文件</b>的声音。"},"zh-Hant":{"decision":"translate","text":"勾選時，在播放期間可以聽到<b>檔案</b>的聲音。"},"ja_JP":{"decision":"translate","text":"チェックすると、再生中に<b>ファイル</b>の音声が聞こえるようになります。"}}
    },
    { key: "attrInfo:sound.playbackPan", source: "Bias audio towards the left (negative) or right (positive) stereo channels.",
      owner: "sound", fieldPath: ["attributes","playbackPan","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Pan\" in audio means the left/right stereo positioning of a sound."], translations: {"zh-Hans":{"decision":"translate","text":"将音频偏向立体声的左声道（负值）或右声道（正值）。"},"zh-Hant":{"decision":"translate","text":"將音訊偏向立體聲的左聲道（負值）或右聲道（正值）。"},"ja_JP":{"decision":"translate","text":"オーディオを左（負の値）または右（正の値）のステレオチャンネルへ寄せます。"}}
    },
    { key: "attrInfo:sound.playbackVolume", source: "Increase/decrease the volume of the audio track. Note that high values may result in audio clipping.",
      owner: "sound", fieldPath: ["attributes","playbackVolume","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Clipping\" here refers to audio distortion caused by the signal exceeding the maximum level."], translations: {"zh-Hans":{"decision":"translate","text":"增加或减小音轨的音量。请注意，较高的值可能会导致音频削波。"},"zh-Hant":{"decision":"translate","text":"增加或減小音訊軌道的音量。請注意，過高的數值可能會導致音訊削波。"},"ja_JP":{"decision":"translate","text":"オーディオトラックの音量を増減します。高い値を設定すると音声のクリッピングが発生する可能性があることに注意してください。"}}
    },
    { key: "attrInfo:sound.smoothingFrames", source: "Smooth the signal by averaging over past frames. A value of 2 averages the current frame with the one before it.",
      owner: "sound", fieldPath: ["attributes","smoothingFrames","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Frame\" means a single step of the animation timeline."], translations: {"zh-Hans":{"decision":"translate","text":"通过对过去的帧进行平均来平滑信号。值为 2 时，会将当前帧与其前一帧取平均。"},"zh-Hant":{"decision":"translate","text":"透過對過去的幀進行平均來平滑訊號。值為 2 時，會將目前幀與其前一幀進行平均。"},"ja_JP":{"decision":"translate","text":"過去のフレームを平均化することで信号を滑らかにします。値が 2 の場合、現在のフレームとその直前のフレームが平均化されます。"}}
    },
    { key: "attrInfo:sound.startAtZero", source: "When checked, the track’s minimum dB (<b>dB Range</b> L) is subtracted from every value before strength is applied, so the quietest moment sits at 0 without compressing the range.",
      owner: "sound", fieldPath: ["attributes","startAtZero","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"dB\" is decibels, a unit of sound loudness; \"compressing the range\" means shrinking the spread between quiet and loud."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，在应用强度之前，会从每个值中减去音轨的最小 dB（<b>dB 范围</b> L），使最安静的时刻处于 0，而不会压缩信号范围。"},"zh-Hant":{"decision":"translate","text":"勾選時，在套用強度之前，會從每個值中減去音訊軌道的最小 dB（<b>dB 範圍</b> L），使最安靜的時刻處於 0，而不會壓縮訊號範圍。"},"ja_JP":{"decision":"translate","text":"チェックすると、強度が適用される前に各値からトラックの最小 dB（<b>dB 範囲</b> L）が減算されるため、ダイナミックレンジを圧縮することなく、最も静かな瞬間が 0 になります。"}}
    },
    { key: "attrInfo:sound.subSteps", source: "Smooth the signal by sampling between frames. 0 samples once per frame; 1 samples at frames 0.5, 1 and 1.5 and averages them.",
      owner: "sound", fieldPath: ["attributes","subSteps","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Signal\" refers to the audio data being analysed over time."], translations: {"zh-Hans":{"decision":"translate","text":"通过在帧之间进行采样来平滑信号。0 表示每帧采样一次；1 表示在 0.5、1 和 1.5 帧处采样并计算平均值。"},"zh-Hant":{"decision":"translate","text":"透過在幀之間進行取樣來平滑訊號。0 表示每幀取樣一次；1 表示在 0.5、1 和 1.5 幀處取樣並計算平均值。"},"ja_JP":{"decision":"translate","text":"フレーム間でサンプリングを行うことで信号を滑らかにします。0 はフレームごとに 1 回サンプリングします。1 は 0.5、1、1.5 フレームでサンプリングし、それらを平均化します。"}}
    },
    { key: "attrInfo:sound.useIndex", source: "When checked, any incoming Index context (e.g. from a Duplicator) is used so each duplicate gets a different value for each frequency band.",
      owner: "sound", fieldPath: ["attributes","useIndex","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Index\" is a numeric identifier per duplicate item."], translations: {"zh-Hans":{"decision":"translate","text":"勾选时，将使用任何传入的索引上下文（例如来自复制器），以便每个副本在每个频段上获得不同的数值。"},"zh-Hant":{"decision":"translate","text":"勾選時，將使用任何傳入的索引上下文（例如來自複製器），使每個複本在每個頻段上獲得不同的數值。"},"ja_JP":{"decision":"translate","text":"チェックすると、入力されたインデックスコンテキスト（デュプリケーターなどからのもの）が使用され、複製ごとに各周波数バンドの異なる値が取得されます。"}}
    },
    { key: "attrInfo:sound.weightingGraph", source: "Graph controlling each band’s contribution, where curve position P (0..1) maps to <b>Frequency Range Hz</b> (L..H). Value 0 mutes the band, 1 doubles it, and 0.5 (default) leaves it unchanged.",
      owner: "sound", fieldPath: ["attributes","weightingGraph","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Mutes\" means silences that frequency band entirely."], translations: {"zh-Hans":{"decision":"translate","text":"控制每个频段贡献的图，其中曲线位置 P (0..1) 映射到<b>频率范围 Hz</b> (L..H)。值为 0 会使频段静音，1 为翻倍，0.5（默认值）保持不变。"},"zh-Hant":{"decision":"translate","text":"控制每個頻段貢獻量的圖，其中曲線位置 P (0..1) 對應至<b>頻率範圍 Hz</b> (L..H)。值為 0 會使頻段靜音，1 為加倍，0.5（預設值）保持不變。"},"ja_JP":{"decision":"translate","text":"各バンドの寄与度を制御するグラフで、カーブ位置 P (0..1) が<b>周波数範囲 Hz</b> (L..H) にマッピングされます。値 0 はバンドをミュートし、1 は 2 倍にし、0.5（デフォルト）は変更しません。"}}
    },
    { key: "nodeAttr:sound.aWeighting", source: "A-Weighting",
      owner: "sound", fieldPath: ["attributes","aWeighting","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"A-Weighting\" is a standard audio-engineering adjustment that matches human hearing sensitivity."], translations: {"zh-Hans":{"decision":"translate","text":"A 计权"},"zh-Hant":{"decision":"translate","text":"A 加權"},"ja_JP":{"decision":"translate","text":"A 特性"}}
    },
    { key: "nodeAttr:sound.autoNormalise", source: "Auto-Normalise",
      owner: "sound", fieldPath: ["attributes","autoNormalise","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Normalise\" here means rescaling values into a fixed 0-1 range based on the loudest point in the track."], translations: {"zh-Hans":{"decision":"translate","text":"自动归一化"},"zh-Hant":{"decision":"translate","text":"自動正規化"},"ja_JP":{"decision":"translate","text":"自動ノーマライズ"}}
    },
    { key: "nodeAttr:sound.bands", source: "Frequency Bands",
      owner: "sound", fieldPath: ["attributes","bands","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Bands\" here refers to frequency ranges the audio is split into for analysis."], translations: {"zh-Hans":{"decision":"translate","text":"频段"},"zh-Hant":{"decision":"translate","text":"頻段"},"ja_JP":{"decision":"translate","text":"周波数バンド"}}
    },
    { key: "nodeAttr:sound.channel", source: "Channel",
      owner: "sound", fieldPath: ["attributes","channel","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in an audio \"Channel\" (mono/left/right) — a stream of sound data."], translations: {"zh-Hans":{"decision":"translate","text":"声道"},"zh-Hant":{"decision":"translate","text":"聲道"},"ja_JP":{"decision":"translate","text":"チャンネル"}}
    },
    { key: "nodeAttr:sound.clipping", source: "Volume Clipping",
      owner: "sound", fieldPath: ["attributes","clipping","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Clipping\" here means values falling below a volume threshold are ignored/cut off, a different sense from audio distortion caused by excessive volume."], translations: {"zh-Hans":{"decision":"translate","text":"音量阈值"},"zh-Hant":{"decision":"translate","text":"音量閾值"},"ja_JP":{"decision":"translate","text":"音量しきい値"}}
    },
    { key: "nodeAttr:sound.dbRange", source: "dB Range",
      owner: "sound", fieldPath: ["attributes","dbRange","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"dB\" = decibels, a unit of audio volume; \"L\"/\"H\" abbreviate low/high."], translations: {"zh-Hans":{"decision":"translate","text":"dB 范围"},"zh-Hant":{"decision":"translate","text":"dB 範圍"},"ja_JP":{"decision":"translate","text":"dB 範囲"}}
    },
    { key: "nodeAttr:sound.eqGraph", source: "Equaliser",
      owner: "sound", fieldPath: ["attributes","eqGraph","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Equaliser\" (often abbreviated EQ) is an audio tool for adjusting the balance of different frequency bands."], translations: {"zh-Hans":{"decision":"translate","text":"均衡器"},"zh-Hant":{"decision":"translate","text":"等化器"},"ja_JP":{"decision":"translate","text":"イコライザー"}}
    },
    { key: "nodeAttr:sound.file", source: "File",
      owner: "sound", fieldPath: ["attributes","file","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"connect the audio File to play\" — a media asset."], translations: {"zh-Hans":{"decision":"translate","text":"文件"},"zh-Hant":{"decision":"translate","text":"檔案"},"ja_JP":{"decision":"translate","text":"ファイル"}}
    },
    { key: "nodeAttr:sound.frameOffset", source: "Frame Offset",
      owner: "sound", fieldPath: ["attributes","frameOffset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Frame Offset\" — a shift in timeline position measured in frames."], translations: {"zh-Hans":{"decision":"translate","text":"帧偏移"},"zh-Hant":{"decision":"translate","text":"幀偏移"},"ja_JP":{"decision":"translate","text":"フレームオフセット"}}
    },
    { key: "nodeAttr:sound.frequencyRange", source: "Frequency Range Hz",
      owner: "sound", fieldPath: ["attributes","frequencyRange","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Hz\" = Hertz, a unit of frequency."], translations: {"zh-Hans":{"decision":"translate","text":"频率范围 Hz"},"zh-Hant":{"decision":"translate","text":"頻率範圍 Hz"},"ja_JP":{"decision":"translate","text":"周波数範囲 Hz"}}
    },
    { key: "nodeAttr:sound.frequencyScale", source: "Frequency Scale",
      owner: "sound", fieldPath: ["attributes","frequencyScale","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Logarithmic\"/\"Mel\"/\"Bark\" are technical audio-frequency scale names for how pitch is perceived; \"Linear\" spaces frequencies evenly."], translations: {"zh-Hans":{"decision":"translate","text":"频率刻度"},"zh-Hant":{"decision":"translate","text":"頻率刻度"},"ja_JP":{"decision":"translate","text":"周波数スケール"}}
    },
    { key: "nodeAttr:sound.length", source: "File Length",
      owner: "sound", fieldPath: ["attributes","length","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in the audio \"File Length\" — its duration in frames."], translations: {"zh-Hans":{"decision":"translate","text":"文件时长"},"zh-Hant":{"decision":"translate","text":"檔案時長"},"ja_JP":{"decision":"translate","text":"ファイルの長さ"}}
    },
    { key: "nodeAttr:sound.levelType", source: "Level Type",
      owner: "sound", fieldPath: ["attributes","levelType","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Level\" here refers to audio loudness (volume) being measured."], translations: {"zh-Hans":{"decision":"translate","text":"电平类型"},"zh-Hant":{"decision":"translate","text":"電平類型"},"ja_JP":{"decision":"translate","text":"レベルタイプ"}}
    },
    { key: "nodeAttr:sound.mode", source: "Mode",
      owner: "sound", fieldPath: ["attributes","mode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Mode\" refers to which method is used to analyse the audio."], translations: {"zh-Hans":{"decision":"translate","text":"模式"},"zh-Hant":{"decision":"translate","text":"模式"},"ja_JP":{"decision":"translate","text":"モード"}}
    },
    { key: "nodeAttr:sound.offset", source: "Value Offset",
      owner: "sound", fieldPath: ["attributes","offset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Value Offset\" — a fixed amount added to the output value."], translations: {"zh-Hans":{"decision":"translate","text":"数值偏移"},"zh-Hant":{"decision":"translate","text":"數值偏移"},"ja_JP":{"decision":"translate","text":"値オフセット"}}
    },
    { key: "nodeAttr:sound.outActiveBands", source: "Active Bands",
      owner: "sound", fieldPath: ["attributes","outActiveBands","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Bands\" are frequency ranges the audio is split into for analysis."], translations: {"zh-Hans":{"decision":"translate","text":"启用频段"},"zh-Hant":{"decision":"translate","text":"啟用頻段"},"ja_JP":{"decision":"translate","text":"アクティブバンド"}}
    },
    { key: "nodeAttr:sound.playAudio", source: "Play Audio",
      owner: "sound", fieldPath: ["attributes","playAudio","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Play Audio\" — start audible playback of the sound."], translations: {"zh-Hans":{"decision":"translate","text":"播放音频"},"zh-Hant":{"decision":"translate","text":"播放音訊"},"ja_JP":{"decision":"translate","text":"オーディオを再生"}}
    },
    { key: "nodeAttr:sound.playbackPan", source: "Pan",
      owner: "sound", fieldPath: ["attributes","playbackPan","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Pan\" is a noun: the left/right stereo balance."], translations: {"zh-Hans":{"decision":"translate","text":"声像"},"zh-Hant":{"decision":"translate","text":"聲像"},"ja_JP":{"decision":"translate","text":"パン"}}
    },
    { key: "nodeAttr:sound.playbackVolume", source: "Volume Adjustment dB",
      owner: "sound", fieldPath: ["attributes","playbackVolume","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"dB\" = decibels, a unit of audio volume."], translations: {"zh-Hans":{"decision":"translate","text":"音量调整 dB"},"zh-Hant":{"decision":"translate","text":"音量調整 dB"},"ja_JP":{"decision":"translate","text":"音量調整 dB"}}
    },
    { key: "nodeAttr:sound.smoothingFrames", source: "Smoothing Frames",
      owner: "sound", fieldPath: ["attributes","smoothingFrames","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Smoothing Frames\" — how many animation frames are averaged to reduce jitter."], translations: {"zh-Hans":{"decision":"translate","text":"平滑帧数"},"zh-Hant":{"decision":"translate","text":"平滑幀數"},"ja_JP":{"decision":"translate","text":"スムージングフレーム数"}}
    },
    { key: "nodeAttr:sound.startAtZero", source: "Start at Zero",
      owner: "sound", fieldPath: ["attributes","startAtZero","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Zero\" refers to the output value, not to a point in time."], translations: {"zh-Hans":{"decision":"translate","text":"最低值归零"},"zh-Hant":{"decision":"translate","text":"最低值歸零"},"ja_JP":{"decision":"translate","text":"最小値をゼロに"}}
    },
    { key: "nodeAttr:sound.subSteps", source: "Sub Steps",
      owner: "sound", fieldPath: ["attributes","subSteps","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Sub Steps\" adds extra audio samples between frames to smooth the result."], translations: {"zh-Hans":{"decision":"translate","text":"子步数"},"zh-Hant":{"decision":"translate","text":"子步數"},"ja_JP":{"decision":"translate","text":"サブステップ"}}
    },
    { key: "nodeAttr:sound.useIndex", source: "Use Incoming Index",
      owner: "sound", fieldPath: ["attributes","useIndex","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Index\" here identifies each individual copy/instance in a repeated (duplicated) set of layers."], translations: {"zh-Hans":{"decision":"translate","text":"使用传入索引"},"zh-Hant":{"decision":"translate","text":"使用傳入索引"},"ja_JP":{"decision":"translate","text":"入力インデックスを使用"}}
    },
    { key: "nodeAttr:sound.weightingGraph", source: "Band Weighting Graph",
      owner: "sound", fieldPath: ["attributes","weightingGraph","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Weighting\" means giving each frequency band a different level of contribution; \"Graph\" refers to a curve-editing control."], translations: {"zh-Hans":{"decision":"translate","text":"频段加权图"},"zh-Hant":{"decision":"translate","text":"頻段加權圖"},"ja_JP":{"decision":"translate","text":"バンド重み付けグラフ"}}
    },
    { key: "nodeAttrEnum:sound.channel.0", source: "Mono",
      owner: "sound", fieldPath: ["enums","channel","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Mono\" audio — a single combined channel."], translations: {"zh-Hans":{"decision":"translate","text":"单声道"},"zh-Hant":{"decision":"translate","text":"單聲道"},"ja_JP":{"decision":"translate","text":"モノラル"}}
    },
    { key: "nodeAttrEnum:sound.channel.1", source: "Left",
      owner: "sound", fieldPath: ["enums","channel","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in the \"Left\" audio channel — the left stereo speaker."], translations: {"zh-Hans":{"decision":"translate","text":"左"},"zh-Hant":{"decision":"translate","text":"左"},"ja_JP":{"decision":"translate","text":"左"}}
    },
    { key: "nodeAttrEnum:sound.channel.2", source: "Right",
      owner: "sound", fieldPath: ["enums","channel","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in the \"Right\" audio channel — the right stereo speaker."], translations: {"zh-Hans":{"decision":"translate","text":"右"},"zh-Hant":{"decision":"translate","text":"右"},"ja_JP":{"decision":"translate","text":"右"}}
    },
    { key: "nodeAttrEnum:sound.frequencyScale.0", source: "Logarithmic",
      owner: "sound", fieldPath: ["enums","frequencyScale","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["A frequency scale based on musical octaves, a technical audio term."], translations: {"zh-Hans":{"decision":"translate","text":"对数"},"zh-Hant":{"decision":"translate","text":"對數"},"ja_JP":{"decision":"translate","text":"対数"}}
    },
    { key: "nodeAttrEnum:sound.frequencyScale.1", source: "Mel",
      owner: "sound", fieldPath: ["enums","frequencyScale","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Mel\" is a frequency scale matching human pitch perception, a technical audio term."], translations: {"zh-Hans":{"decision":"preserve","text":"Mel"},"zh-Hant":{"decision":"preserve","text":"Mel"},"ja_JP":{"decision":"preserve","text":"Mel"}}
    },
    { key: "nodeAttrEnum:sound.frequencyScale.2", source: "Bark",
      owner: "sound", fieldPath: ["enums","frequencyScale","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Bark\" is a frequency scale matching human hearing perception, a technical audio term."], translations: {"zh-Hans":{"decision":"preserve","text":"Bark"},"zh-Hant":{"decision":"preserve","text":"Bark"},"ja_JP":{"decision":"preserve","text":"Bark"}}
    },
    { key: "nodeAttrEnum:sound.frequencyScale.3", source: "Linear",
      owner: "sound", fieldPath: ["enums","frequencyScale","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in the \"Linear\" frequency scale — no remapping/curve applied, a straight one-to-one mapping."], translations: {"zh-Hans":{"decision":"translate","text":"线性"},"zh-Hant":{"decision":"translate","text":"線性"},"ja_JP":{"decision":"translate","text":"リニア"}}
    },
    { key: "nodeAttrEnum:sound.levelType.0", source: "RMS",
      owner: "sound", fieldPath: ["enums","levelType","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"RMS\" (root mean square) is a technical term for average loudness over time."], translations: {"zh-Hans":{"decision":"preserve","text":"RMS"},"zh-Hant":{"decision":"preserve","text":"RMS"},"ja_JP":{"decision":"preserve","text":"RMS"}}
    },
    { key: "nodeAttrEnum:sound.levelType.1", source: "Peak",
      owner: "sound", fieldPath: ["enums","levelType","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Peak\" is the single loudest instantaneous sample in the audio."], translations: {"zh-Hans":{"decision":"translate","text":"峰值"},"zh-Hant":{"decision":"translate","text":"峰值"},"ja_JP":{"decision":"translate","text":"ピーク"}}
    },
    { key: "nodeAttrEnum:sound.mode.0", source: "Spectral",
      owner: "sound", fieldPath: ["enums","mode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Spectral\" describes audio split into frequency bands, a technical audio-analysis term."], translations: {"zh-Hans":{"decision":"translate","text":"频谱"},"zh-Hant":{"decision":"translate","text":"頻譜"},"ja_JP":{"decision":"translate","text":"スペクトル"}}
    },
    { key: "nodeAttrEnum:sound.mode.1", source: "Level",
      owner: "sound", fieldPath: ["enums","mode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Level\" describes reading overall loudness."], translations: {"zh-Hans":{"decision":"translate","text":"电平"},"zh-Hant":{"decision":"translate","text":"電平"},"ja_JP":{"decision":"translate","text":"レベル"}}
    },
    { key: "nodeInfo:sound", source: "Playback audio and drive deformation or values.",
      owner: "sound", fieldPath: ["info","tooltip"], displayRole: "node-info",
      dontTranslate: false, notes: ["\"Drive\" means to control or influence another attribute’s value over time."], translations: {"zh-Hans":{"decision":"translate","text":"播放音频并驱动变形或数值。"},"zh-Hant":{"decision":"translate","text":"播放音訊並驅動變形或數值。"},"ja_JP":{"decision":"translate","text":"オーディオを再生し、変形や数値を駆動します。"}}
    },
    { key: "nodeName:sound", source: "Sound",
      owner: "sound", fieldPath: ["info","name"], displayRole: "node-name",
      dontTranslate: false, notes: ["As in the \"Sound\" node that plays and analyses audio — the noun for audio)."], translations: {"zh-Hans":{"decision":"translate","text":"声音"},"zh-Hant":{"decision":"translate","text":"聲音"},"ja_JP":{"decision":"translate","text":"サウンド"}}
    },
    { key: "nodeTab:sound.advanced", source: "Advanced",
      owner: "sound", fieldPath: ["tabs","advanced"], displayRole: "tab-label",
      dontTranslate: false, notes: ["As in an \"Advanced\" settings tab for extra, less commonly used options."], translations: {"zh-Hans":{"decision":"translate","text":"高级"},"zh-Hant":{"decision":"translate","text":"進階"},"ja_JP":{"decision":"translate","text":"詳細"}}
    },
    { key: "sound.0", source: "Number of Bands must be above 1.",
      owner: "sound", fieldPath: ["notifications","0"], displayRole: "notification-text",
      dontTranslate: false, notes: ["\"Bands\" are frequency ranges the audio is split into for analysis."], translations: {"zh-Hans":{"decision":"translate","text":"频段数必须大于 1。"},"zh-Hant":{"decision":"translate","text":"頻段數必須大於 1。"},"ja_JP":{"decision":"translate","text":"バンド数は 1 より大きい必要があります。"}}
    },
    { key: "sound.1", source: "Could not find audio asset with this name.",
      owner: "sound", fieldPath: ["notifications","1"], displayRole: "notification-text",
      dontTranslate: false, notes: ["\"Asset\" refers to the connected audio file resource."], translations: {"zh-Hans":{"decision":"translate","text":"找不到此名称的音频素材。"},"zh-Hant":{"decision":"translate","text":"找不到此名稱的音訊素材。"},"ja_JP":{"decision":"translate","text":"この名前のオーディオアセットが見つかりませんでした。"}}
    },
    { key: "sound.2", source: "Drag an Audio Asset onto the File attribute.",
      owner: "sound", fieldPath: ["notifications","2"], displayRole: "notification-text",
      dontTranslate: false, notes: ["\"Drag\" is the mouse action of dragging-and-dropping a file."], translations: {"zh-Hans":{"decision":"translate","text":"将音频素材拖到文件属性上。"},"zh-Hant":{"decision":"translate","text":"將音訊素材拖曳到檔案屬性上。"},"ja_JP":{"decision":"translate","text":"オーディオアセットをファイル属性にドラッグします。"}}
    },
  ],
};
