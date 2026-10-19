/**
 * [INPUT]: 依赖官方 2.8 autoAnimate 显示源/notes、AGY/宝玉 Skill 初稿、Grok 全键审稿与主代理修订
 * [OUTPUT]: 提供完整 128 个自动动画显示键的三语源绑定审定输入
 * [POS]: languages/native 的自动动画域；区分相机变焦与几何缩放、可逆进退场及控制标签引用，只投影文案不改模型、动画曲线或枚举身份
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 * 本轮图形语境有限修订经非作者验回/root审定；冻结源与历史批准仍保全。
 */
'use strict';

// -- 自动动画显示与真实控制值分离 --------------------------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "catalogPath": "Definitions/Translation/nodeStrings_en-GB.source.json",
    "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
    "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439",
    "sourcePairsSha256": "e512895495cf8b593c43eabb550d746e1d1f55e084ca47608ea82656c72baffa",
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
    "reviewScope": "All 128 source/notes/384 locale pairs, actual Grok end_turn review and primary corrections; keep camera Zoom distinct from Scale, reversible Slide From and exact control-label references. Not live layout, behaviour or deployment proof."
  },
  entries: [
    { key: "attrInfo:autoAnimate.alternateDirection", source: "Reverses the direction of every other path. Requires *Use Levels* to be checked.",
      owner: "autoAnimate", fieldPath: ["attributes","alternateDirection","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Checked\" here means the checkbox toggle is switched on."], translations: {"zh-Hans":{"decision":"translate","text":"反转每隔一条路径的方向。需要勾选 *使用层级*。"},"zh-Hant":{"decision":"translate","text":"反轉每隔一條路徑的方向。需要勾選 *使用層級*。"},"ja_JP":{"decision":"translate","text":"1 つおきのパスの方向を反転します。*レベルを使用* にチェックを入れる必要があります。"}}
    },
    { key: "attrInfo:autoAnimate.angleDistance", source: "When Position Mode is Drift, the angle (degrees) and distance (pixels) the layer travels in over the animation.",
      owner: "autoAnimate", fieldPath: ["attributes","angleDistance","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Drift\" here means a slow, steady directional movement."], translations: {"zh-Hans":{"decision":"translate","text":"当“位置模式”为“漂移”时，图层在动画过程中移动的角度（度）和距离（像素）。"},"zh-Hant":{"decision":"translate","text":"當「位置模式」為「飄移」時，圖層在動畫過程中移動的角度（度）和距離（像素）。"},"ja_JP":{"decision":"translate","text":"位置モードが［ドリフト］のとき、アニメーション中にレイヤーが移動する角度（度）と距離（ピクセル）。"}}
    },
    { key: "attrInfo:autoAnimate.automaticTimeOffset", source: "When unchecked, connect a Behaviour (e.g. Stagger) to the Animation Time Offset to customise it.",
      owner: "autoAnimate", fieldPath: ["attributes","automaticTimeOffset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Behaviour\" here refers to a Cavalry node type that can drive this value procedurally."], translations: {"zh-Hans":{"decision":"translate","text":"未勾选时，将行为（如“错开”）连接到“动画时间偏移”以进行自定义。"},"zh-Hant":{"decision":"translate","text":"取消勾選時，將行為（如「錯開」）連接到「動畫時間偏移」以進行自訂。"},"ja_JP":{"decision":"translate","text":"チェックを外すと、ビヘイビア（例：スタッガー）をアニメーション時間オフセットに接続してカスタマイズできます。"}}
    },
    { key: "attrInfo:autoAnimate.bendAngle", source: "Maximum bend angle in degrees applied at full Bend Progress. 0 disables the bend.",
      owner: "autoAnimate", fieldPath: ["attributes","bendAngle","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Bend\" here means a curving distortion applied to the shape."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲进度达到最大值时应用的最大弯曲角度（度）。0 可禁用弯曲。"},"zh-Hant":{"decision":"translate","text":"彎曲進度達到最大值時套用的最大彎曲角度（度）。0 可停用彎曲。"},"ja_JP":{"decision":"translate","text":"ベンドプログレスが最大のときに適用される最大ベンド角度（度）。0 に設定するとベンドが無効になります。"}}
    },
    { key: "attrInfo:autoAnimate.bendDirection", source: "Axis the bend pivots around (Horizontal or Vertical).",
      owner: "autoAnimate", fieldPath: ["attributes","bendDirection","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Pivot\" here is the axis line the bend rotates/curves around."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲所围绕的轴向（水平或垂直）。"},"zh-Hant":{"decision":"translate","text":"彎曲所圍繞的軸向（水平或垂直）。"},"ja_JP":{"decision":"translate","text":"ベンドが回転する軸（水平または垂直）。"}}
    },
    { key: "attrInfo:autoAnimate.bendHorizontalPin", source: "Edge of the layer’s bounding box that stays fixed during the bend (Left, Centre, Right).",
      owner: "autoAnimate", fieldPath: ["attributes","bendHorizontalPin","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Pin\" here means the fixed anchor edge that does not move while the rest of the shape bends."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲期间图层定界框保持固定的边缘（左、中心、右）。"},"zh-Hant":{"decision":"translate","text":"彎曲期間圖層邊界框保持固定的邊緣（左、中心、右）。"},"ja_JP":{"decision":"translate","text":"ベンド中に固定されるレイヤーのバウンディングボックスのエッジ（左、中心、右）。"}}
    },
    { key: "attrInfo:autoAnimate.bendProgress", source: "Per-aspect progress for Bend when Progress Mode is Individual Controls.",
      owner: "autoAnimate", fieldPath: ["attributes","bendProgress","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Per-aspect\" here means this progress value only controls the bend component, independent of other animation aspects."], translations: {"zh-Hans":{"decision":"translate","text":"当“进度模式”为“精确进度控制”时，“弯曲”的单项进度。"},"zh-Hant":{"decision":"translate","text":"當「進度模式」為「精確進度控制」時，「彎曲」的單項進度。"},"ja_JP":{"decision":"translate","text":"プログレスモードが［精密プログレスコントロール］のときにベンドを個別に制御するプログレス。"}}
    },
    { key: "attrInfo:autoAnimate.bendVerticalPin", source: "Vertical position of the bend’s pivot (-1 = bottom, 0 = centre, 1 = top).",
      owner: "autoAnimate", fieldPath: ["attributes","bendVerticalPin","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Pivot\" here is the point the bend curves around, expressed as a -1 to 1 value from bottom to top."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲轴心的垂直位置（-1 = 底部，0 = 中心，1 = 顶部）。"},"zh-Hant":{"decision":"translate","text":"彎曲軸心的垂直位置（-1 = 底部，0 = 中心，1 = 頂部）。"},"ja_JP":{"decision":"translate","text":"ベンドのピボットの垂直位置（-1 = 下、0 = 中央、1 = 上）。"}}
    },
    { key: "attrInfo:autoAnimate.directionMode", source: "When Position Mode is Slide From Composition Edge, which edge the slide originates from (Left, Right, Top, Bottom).",
      owner: "autoAnimate", fieldPath: ["attributes","directionMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Composition\" here is the overall canvas/scene the layer sits in."], translations: {"zh-Hans":{"decision":"translate","text":"当“位置模式”为“从合成边缘滑动”时，滑动起始的边缘（左、右、顶部、底部）。"},"zh-Hant":{"decision":"translate","text":"當「位置模式」為「從合成邊緣滑動」時，滑動起始的邊緣（左、右、頂部、底部）。"},"ja_JP":{"decision":"translate","text":"位置モードが［コンポジション端からスライド］のとき、スライドが開始するエッジ（左、右、上、下）。"}}
    },
    { key: "attrInfo:autoAnimate.distance", source: "When Position Mode is Zoom, the depth distance the layer moves through. Higher values produce more dramatic zoom.",
      owner: "autoAnimate", fieldPath: ["attributes","distance","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Depth\" here refers to simulated distance toward/away from the camera in a 3D-like zoom effect."], translations: {"zh-Hans":{"decision":"translate","text":"当“位置模式”为“变焦”时，图层移动的深度距离。数值越大，变焦效果越明显。"},"zh-Hant":{"decision":"translate","text":"當「位置模式」為「變焦」時，圖層移動的深度距離。數值越大，變焦效果越明顯。"},"ja_JP":{"decision":"translate","text":"位置モードが［ズーム］のとき、レイヤーが移動する奥行きの距離。値が大きいほど、よりダイナミックなズームになります。"}}
    },
    { key: "attrInfo:autoAnimate.level", source: "Nesting level used when Level Mode is Custom. 0 is the root mesh; deeper levels are nested sub-meshes.",
      owner: "autoAnimate", fieldPath: ["attributes","level","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Root mesh\" here is the top-level shape in the hierarchy before any nested sub-shapes."], translations: {"zh-Hans":{"decision":"translate","text":"“层级模式”为“自定义”时使用的嵌套层级。0 为根网格；更深层级为嵌套子网格。"},"zh-Hant":{"decision":"translate","text":"「層級模式」為「自訂」時使用的嵌套層級。0 為根網格；更深層級為嵌套子網格。"},"ja_JP":{"decision":"translate","text":"レベルモードが［カスタム］のときに使用されるネスト階層レベル。0 はルートメッシュで、それより深いレベルはネストされたサブメッシュです。"}}
    },
    { key: "attrInfo:autoAnimate.levelMode", source: "Which nesting level the animation runs on: Custom, Text Lines/Words/Characters, or All. Only applies when Use Levels is on.",
      owner: "autoAnimate", fieldPath: ["attributes","levelMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Nesting level\" here means how deep into a hierarchy of sub-elements (e.g. words inside lines) the effect reaches."], translations: {"zh-Hans":{"decision":"translate","text":"动画在哪一嵌套层级上运行：自定义、文本行/词/字符，或全部。仅在启用“使用层级”时生效。"},"zh-Hant":{"decision":"translate","text":"動畫在哪個嵌套層級上運行：自訂、文字行/詞/字元，或全部。僅在啟用「使用層級」時套用。"},"ja_JP":{"decision":"translate","text":"アニメーションを適用するネスト階層レベル：カスタム、テキスト行/単語/文字、またはすべて。［レベルを使用］がオンの場合にのみ適用されます。"}}
    },
    { key: "attrInfo:autoAnimate.offsetAnimationMode", source: "Aligns the animation to the layer’s visibility range.",
      owner: "autoAnimate", fieldPath: ["attributes","offsetAnimationMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Visibility range\" here is the span of frames during which the layer is shown on the timeline."], translations: {"zh-Hans":{"decision":"translate","text":"将动画与图层的可见范围对齐。"},"zh-Hant":{"decision":"translate","text":"將動畫與圖層的可見範圍對齊。"},"ja_JP":{"decision":"translate","text":"アニメーションをレイヤーの表示範囲に整列します。"}}
    },
    { key: "attrInfo:autoAnimate.opacityMode", source: "Type of opacity animation: None, Fade In, or Fade Out.",
      owner: "autoAnimate", fieldPath: ["attributes","opacityMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Opacity\" here means how transparent or solid the shape appears."], translations: {"zh-Hans":{"decision":"translate","text":"不透明度动画类型：无、淡入或淡出。"},"zh-Hant":{"decision":"translate","text":"不透明度動畫類型：無、淡入或淡出。"},"ja_JP":{"decision":"translate","text":"不透明度アニメーションの種類：なし、フェードイン、またはフェードアウト。"}}
    },
    { key: "attrInfo:autoAnimate.opacityProgress", source: "Per-aspect progress for Opacity when Progress Mode is Individual Controls.",
      owner: "autoAnimate", fieldPath: ["attributes","opacityProgress","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Per-aspect\" here means this progress value only controls the opacity/fade component, independent of other aspects."], translations: {"zh-Hans":{"decision":"translate","text":"当“进度模式”为“精确进度控制”时，“不透明度”的单项进度。"},"zh-Hant":{"decision":"translate","text":"當「進度模式」為「精確進度控制」時，「不透明度」的單項進度。"},"ja_JP":{"decision":"translate","text":"プログレスモードが［精密プログレスコントロール］のときに不透明度を個別に制御するプログレス。"}}
    },
    { key: "attrInfo:autoAnimate.parentRandomSeed", source: "Seed used when grouping sub-meshes by parent for random ordering.",
      owner: "autoAnimate", fieldPath: ["attributes","parentRandomSeed","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Seed\" here is the starting number for the random-number generator."], translations: {"zh-Hans":{"decision":"translate","text":"按父级对子网格分组以进行随机排序时使用的随机种子。"},"zh-Hant":{"decision":"translate","text":"依父級對子網格分組以進行隨機排序時使用的隨機種子。"},"ja_JP":{"decision":"translate","text":"親ごとにサブメッシュをグループ化してランダムに順序付けする際に使用されるシード値。"}}
    },
    { key: "attrInfo:autoAnimate.positionMode", source: "Type of position animation: None, Slide From Composition Edge, Drift (along Drift Angle/Distance), or Zoom.",
      owner: "autoAnimate", fieldPath: ["attributes","positionMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Drift\" here means a slow, steady movement in a set direction."], translations: {"zh-Hans":{"decision":"translate","text":"位置动画类型：无、从合成边缘滑动、漂移（沿漂移角度/距离）或变焦。"},"zh-Hant":{"decision":"translate","text":"位置動畫類型：無、從合成邊緣滑動、飄移（沿飄移角度/距離）或變焦。"},"ja_JP":{"decision":"translate","text":"位置アニメーションの種類：なし、コンポジション端からスライド、ドリフト（ドリフト角度/距離に沿う）、またはズーム。"}}
    },
    { key: "attrInfo:autoAnimate.positionProgress", source: "Per-aspect progress for Position when Progress Mode is Individual Controls.",
      owner: "autoAnimate", fieldPath: ["attributes","positionProgress","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Per-aspect\" means calculated separately for each animation component (position, rotation, etc.)."], translations: {"zh-Hans":{"decision":"translate","text":"当“进度模式”为“精确进度控制”时，“位置”的单项进度。"},"zh-Hant":{"decision":"translate","text":"當「進度模式」為「精確進度控制」時，「位置」的單項進度。"},"ja_JP":{"decision":"translate","text":"プログレスモードが［精密プログレスコントロール］のときに位置を個別に制御するプログレス。"}}
    },
    { key: "attrInfo:autoAnimate.progress", source: "Master animation progress (0–100%). 0% = animation in flight (off-stage / faded out / scaled to 0 / mid-spin); 100% = at rest (final visible state). Keyframe 0 → 100 for an entrance, 100 → 0 for an exit. Drives every enabled aspect (Position, Rotation, Scale, Opacity, Visibility, Bend) when Progress Mode is Single Control.",
      owner: "autoAnimate", fieldPath: ["attributes","progress","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Master\" here means the single top-level control that drives every enabled animation aspect at once."], translations: {"zh-Hans":{"decision":"translate","text":"主动画进度（0–100%）。0% = 动画进行中（在画外 / 已淡出 / 缩放为 0 / 自转途中）；100% = 静止状态（最终可见状态）。入场时打关键帧 0 → 100，出场时打关键帧 100 → 0。当“进度模式”为“单一进度控制”时，驱动所有已启用的属性（位置、旋转、缩放、不透明度、可见性、弯曲）。"},"zh-Hant":{"decision":"translate","text":"主要動畫進度（0–100%）。0% = 動畫進行中（在畫外 / 已淡出 / 縮放為 0 / 自轉途中）；100% = 靜止狀態（最終可見狀態）。入場時設定關鍵幀 0 → 100，出場時設定關鍵幀 100 → 0。當「進度模式」為「單一進度控制」時，驅動所有已啟用的屬性（位置、旋轉、縮放、不透明度、可見性、彎曲）。"},"ja_JP":{"decision":"translate","text":"マスターアニメーションのプログレス（0–100%）。0% = アニメーション中（画面外 / フェードアウト / スケール 0 / スピンの途中）、100% = 静止時（最終的な表示状態）。登場は 0 → 100、退場は 100 → 0 でキーフレームを設定します。プログレスモードが［単一プログレスコントロール］の場合、有効になっているすべての要素（位置、回転、スケール、不透明度、表示、ベンド）を制御します。"}}
    },
    { key: "attrInfo:autoAnimate.progressMode", source: "Control each animation with a single control, or with individual controls for each aspect of the animation.",
      owner: "autoAnimate", fieldPath: ["attributes","progressMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Aspect\" here means one component of the animation (e.g. position, rotation, scale)."], translations: {"zh-Hans":{"decision":"translate","text":"使用单个控制器控制整个动画，或使用各个属性的独立控制器分别控制动画。"},"zh-Hant":{"decision":"translate","text":"使用單個控制器控制整個動畫，或使用各個屬性的獨立控制器分別控制動畫。"},"ja_JP":{"decision":"translate","text":"単一のコントロールでアニメーション全体を制御するか、アニメーションの各要素を個別のコントロールで制御します。"}}
    },
    { key: "attrInfo:autoAnimate.randomSeed", source: "Seed used when Randomise is on.",
      owner: "autoAnimate", fieldPath: ["attributes","randomSeed","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Seed\" here is the starting number for the random-number generator."], translations: {"zh-Hans":{"decision":"translate","text":"启用“随机化”时使用的随机种子。"},"zh-Hant":{"decision":"translate","text":"啟用「隨機化」時使用的隨機種子。"},"ja_JP":{"decision":"translate","text":"［ランダム化］がオンのときに使用されるシード値。"}}
    },
    { key: "attrInfo:autoAnimate.randomiseTimeOffset", source: "When on, each sub-mesh’s start time is randomised within Animation Time Offset rather than evenly staggered.",
      owner: "autoAnimate", fieldPath: ["attributes","randomiseTimeOffset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Staggered\" here means spaced out in even, sequential steps."], translations: {"zh-Hans":{"decision":"translate","text":"开启后，各子网格的开始时间将在“动画时间偏移”范围内随机分布，而不是均匀错开。"},"zh-Hant":{"decision":"translate","text":"開啟後，各子網格的開始時間將在「動畫時間偏移」範圍內隨機分佈，而不是均勻錯開。"},"ja_JP":{"decision":"translate","text":"オンにすると、各サブメッシュの開始時間が均等にずらされるのではなく、アニメーション時間オフセットの範囲内でランダムに設定されます。"}}
    },
    { key: "attrInfo:autoAnimate.reverseTimeOffset", source: "When checked, reverse the order each child mesh is animated in.",
      owner: "autoAnimate", fieldPath: ["attributes","reverseTimeOffset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Checked\" here means the checkbox toggle is turned on."], translations: {"zh-Hans":{"decision":"translate","text":"勾选后，反转各个子网格的动画播放顺序。"},"zh-Hant":{"decision":"translate","text":"勾選後，反轉各個子網格的動畫播放順序。"},"ja_JP":{"decision":"translate","text":"チェックを入れると、各子メッシュのアニメーション順序が反転します。"}}
    },
    { key: "attrInfo:autoAnimate.rotationMode", source: "Type of rotation animation: None, Spin, or Swing From Left/Right/Top/Bottom/Centre.",
      owner: "autoAnimate", fieldPath: ["attributes","rotationMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Swing\" here means a pendulum-like back-and-forth rotation from a fixed edge."], translations: {"zh-Hans":{"decision":"translate","text":"旋转动画类型：无、自转，或从左/右/顶部/底部/中心摆动。"},"zh-Hant":{"decision":"translate","text":"旋轉動畫類型：無、自轉，或從左/右/頂部/底部/中心擺動。"},"ja_JP":{"decision":"translate","text":"回転アニメーションの種類：なし、スピン、または左/右/上/下/中央からのスイング。"}}
    },
    { key: "attrInfo:autoAnimate.rotationProgress", source: "Per-aspect progress for Rotation when Progress Mode is Individual Controls.",
      owner: "autoAnimate", fieldPath: ["attributes","rotationProgress","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Per-aspect\" here means this progress value only controls the rotation component, independent of other animation aspects."], translations: {"zh-Hans":{"decision":"translate","text":"当“进度模式”为“精确进度控制”时，“旋转”的单项进度。"},"zh-Hant":{"decision":"translate","text":"當「進度模式」為「精確進度控制」時，「旋轉」的單項進度。"},"ja_JP":{"decision":"translate","text":"プログレスモードが［精密プログレスコントロール］のときに回転を個別に制御するプログレス。"}}
    },
    { key: "attrInfo:autoAnimate.scaleFromMode", source: "Where the Scale animation pivots: Path Pivot Point, Path Centre, or Layer Pivot.",
      owner: "autoAnimate", fieldPath: ["attributes","scaleFromMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Pivot\" here is the fixed point the scaling expands or contracts around."], translations: {"zh-Hans":{"decision":"translate","text":"缩放动画的锚点位置：路径锚点、路径中心或图层锚点。"},"zh-Hant":{"decision":"translate","text":"縮放動畫的錨點位置：路徑錨點、路徑中心或圖層錨點。"},"ja_JP":{"decision":"translate","text":"スケールアニメーションの基準となるピボット位置：パスピボットポイント、パス中心、またはレイヤーピボット。"}}
    },
    { key: "attrInfo:autoAnimate.scaleMode", source: "Type of scale animation: None, Scale Up, or Scale Down.",
      owner: "autoAnimate", fieldPath: ["attributes","scaleMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Scale\" here refers to resizing the shape larger or smaller."], translations: {"zh-Hans":{"decision":"translate","text":"缩放动画类型：无、放大或缩小。"},"zh-Hant":{"decision":"translate","text":"縮放動畫類型：無、放大或縮小。"},"ja_JP":{"decision":"translate","text":"スケールアニメーションの種類：なし、拡大、または縮小。"}}
    },
    { key: "attrInfo:autoAnimate.scaleProgress", source: "Per-aspect progress for Scale when Progress Mode is Individual Controls.",
      owner: "autoAnimate", fieldPath: ["attributes","scaleProgress","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Per-aspect\" here means this progress value only controls the scale component, independent of position or rotation."], translations: {"zh-Hans":{"decision":"translate","text":"当“进度模式”为“精确进度控制”时，“缩放”的单项进度。"},"zh-Hant":{"decision":"translate","text":"當「進度模式」為「精確進度控制」時，「縮放」的單項進度。"},"ja_JP":{"decision":"translate","text":"プログレスモードが［精密プログレスコントロール］のときにスケールを個別に制御するプログレス。"}}
    },
    { key: "attrInfo:autoAnimate.strength", source: "Overall multiplier on the animation’s effect (0–100%).",
      owner: "autoAnimate", fieldPath: ["attributes","strength","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Multiplier\" here scales the whole animation’s intensity up or down."], translations: {"zh-Hans":{"decision":"translate","text":"动画效果的整体倍率（0–100%）。"},"zh-Hant":{"decision":"translate","text":"動畫效果的整體倍率（0–100%）。"},"ja_JP":{"decision":"translate","text":"アニメーション効果全体の乗数（0–100%）。"}}
    },
    { key: "attrInfo:autoAnimate.timeOffset", source: "Total stagger time across all sub-meshes, in frames. The effective offset per sub-mesh is this divided by the number of sub-meshes.",
      owner: "autoAnimate", fieldPath: ["attributes","timeOffset","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Stagger\" here means to space out start times sequentially."], translations: {"zh-Hans":{"decision":"translate","text":"所有子网格的总错开时间（帧）。每个子网格的实际偏移量为该值除以子网格数量。"},"zh-Hant":{"decision":"translate","text":"所有子網格的總錯開時間（幀）。每個子網格的實際偏移量為該值除以子網格數量。"},"ja_JP":{"decision":"translate","text":"すべてのサブメッシュにわたるスタガー（時間差）の合計（フレーム単位）。サブメッシュごとの有効なオフセットは、この値をサブメッシュ数で割った値になります。"}}
    },
    { key: "attrInfo:autoAnimate.useLevels", source: "When on, the animation runs per sub-mesh at the chosen Level. When off, the whole layer animates as one.",
      owner: "autoAnimate", fieldPath: ["attributes","useLevels","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Sub-mesh\" here is one nested part of a larger shape’s hierarchy, a modelling/animation term."], translations: {"zh-Hans":{"decision":"translate","text":"开启时，动画会在所选层级按子网格分别运行。关闭时，整个图层作为一个整体进行动画。"},"zh-Hant":{"decision":"translate","text":"開啟時，動畫會在所選層級依子網格分別運行。關閉時，整個圖層作為一個整體進行動畫。"},"ja_JP":{"decision":"translate","text":"オンにすると、選択したレベルのサブメッシュごとにアニメーションが実行されます。オフにすると、レイヤー全体が 1 つとしてアニメーション化されます。"}}
    },
    { key: "attrInfo:autoAnimate.visibilityMode", source: "Requires *Use Levels* to be checked.",
      owner: "autoAnimate", fieldPath: ["attributes","visibilityMode","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Checked\" here means the checkbox toggle is turned on."], translations: {"zh-Hans":{"decision":"translate","text":"需要勾选 *使用层级*。"},"zh-Hant":{"decision":"translate","text":"需要勾選 *使用層級*。"},"ja_JP":{"decision":"translate","text":"*レベルを使用* にチェックを入れる必要があります。"}}
    },
    { key: "attrInfo:autoAnimate.visibilityProgress", source: "Per-aspect progress for Visibility when Progress Mode is Individual Controls.",
      owner: "autoAnimate", fieldPath: ["attributes","visibilityProgress","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Per-aspect\" here means this progress value only controls the visibility component, independent of other animation aspects."], translations: {"zh-Hans":{"decision":"translate","text":"当“进度模式”为“精确进度控制”时，“可见性”的单项进度。"},"zh-Hant":{"decision":"translate","text":"當「進度模式」為「精確進度控制」時，「可見性」的單項進度。"},"ja_JP":{"decision":"translate","text":"プログレスモードが［精密プログレスコントロール］のときに表示を個別に制御するプログレス。"}}
    },
    { key: "attrInfo:autoAnimate.zoom", source: "Set the lens angle for the internal camera used for rotation animations. Lower numbers such as 100 create a very wide angle lens effect.",
      owner: "autoAnimate", fieldPath: ["attributes","zoom","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, notes: ["\"Lens angle\" here is the simulated camera field-of-view used internally for the effect."], translations: {"zh-Hans":{"decision":"translate","text":"设置用于旋转动画的内置摄像机镜头视角。较小的数值（如 100）会产生超广角镜头效果。"},"zh-Hant":{"decision":"translate","text":"設定用於旋轉動畫的內建攝影機鏡頭視角。較小的數值（如 100）會產生超廣角鏡頭效果。"},"ja_JP":{"decision":"translate","text":"回転アニメーションに使用される内部カメラのレンズ画角を設定します。100 などの小さな値を設定すると、超広角レンズ効果が得られます。"}}
    },
    { key: "nodeAttr:autoAnimate.alternateDirection", source: "Alternate Direction",
      owner: "autoAnimate", fieldPath: ["attributes","alternateDirection","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Alternate Direction\" — reverses every other path’s direction to create a back-and-forth pattern."], translations: {"zh-Hans":{"decision":"translate","text":"交替方向"},"zh-Hant":{"decision":"translate","text":"交替方向"},"ja_JP":{"decision":"translate","text":"方向交互"}}
    },
    { key: "nodeAttr:autoAnimate.angleDistance", source: "Drift Angle and Distance",
      owner: "autoAnimate", fieldPath: ["attributes","angleDistance","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Drift Angle and Distance\" — the direction (in degrees) and length (in pixels) a layer travels during a drift animation."], translations: {"zh-Hans":{"decision":"translate","text":"漂移角度和距离"},"zh-Hant":{"decision":"translate","text":"飄移角度和距離"},"ja_JP":{"decision":"translate","text":"ドリフト角度と距離"}}
    },
    { key: "nodeAttr:autoAnimate.animationModeHelp", source: "Use the individual ‘Progress’ Attributes below to create a more bespoke animation.",
      owner: "autoAnimate", fieldPath: ["attributes","animationModeHelp"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Bespoke\" here means custom-tailored to specific needs."], translations: {"zh-Hans":{"decision":"translate","text":"使用下方各个属性的“进度”来制作更定制化的动画。"},"zh-Hant":{"decision":"translate","text":"使用下方各個屬性的「進度」來製作更客製化的動畫。"},"ja_JP":{"decision":"translate","text":"下記の個別の「プログレス」アトリビュートを使用して、より詳細にカスタマイズされたアニメーションを作成できます。"}}
    },
    { key: "nodeAttr:autoAnimate.automaticTimeOffset", source: "Time Offset",
      owner: "autoAnimate", fieldPath: ["attributes","automaticTimeOffset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Time Offset\" — a shift applied to when each sub-mesh’s animation begins."], translations: {"zh-Hans":{"decision":"translate","text":"时间偏移"},"zh-Hant":{"decision":"translate","text":"時間偏移"},"ja_JP":{"decision":"translate","text":"タイムオフセット"}}
    },
    { key: "nodeAttr:autoAnimate.bendAngle", source: "Bend Angle",
      owner: "autoAnimate", fieldPath: ["attributes","bendAngle","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Bend Angle\" — how many degrees the shape curves."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲角度"},"zh-Hant":{"decision":"translate","text":"彎曲角度"},"ja_JP":{"decision":"translate","text":"ベンド角度"}}
    },
    { key: "nodeAttr:autoAnimate.bendDirection", source: "Bend Direction",
      owner: "autoAnimate", fieldPath: ["attributes","bendDirection","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Bend Direction\" — which axis (horizontal or vertical) the bend distortion pivots around."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲方向"},"zh-Hant":{"decision":"translate","text":"彎曲方向"},"ja_JP":{"decision":"translate","text":"ベンド方向"}}
    },
    { key: "nodeAttr:autoAnimate.bendHorizontalPin", source: "Bend Horizontal Pin",
      owner: "autoAnimate", fieldPath: ["attributes","bendHorizontalPin","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Pin\" means a fixed anchor point that does not move."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲水平固定"},"zh-Hant":{"decision":"translate","text":"彎曲水平固定"},"ja_JP":{"decision":"translate","text":"ベンド水平ピン"}}
    },
    { key: "nodeAttr:autoAnimate.bendProgress", source: "Bend Progress",
      owner: "autoAnimate", fieldPath: ["attributes","bendProgress","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Bend Progress\" — the 0–100% progress value driving only the bend/curve animation aspect."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲进度"},"zh-Hant":{"decision":"translate","text":"彎曲進度"},"ja_JP":{"decision":"translate","text":"ベンドプログレス"}}
    },
    { key: "nodeAttr:autoAnimate.bendVerticalPin", source: "Bend Vertical Pin",
      owner: "autoAnimate", fieldPath: ["attributes","bendVerticalPin","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Pin\" means a fixed anchor point that does not move."], translations: {"zh-Hans":{"decision":"translate","text":"弯曲垂直固定"},"zh-Hant":{"decision":"translate","text":"彎曲垂直固定"},"ja_JP":{"decision":"translate","text":"ベンド垂直ピン"}}
    },
    { key: "nodeAttr:autoAnimate.directionMode", source: "Direction",
      owner: "autoAnimate", fieldPath: ["attributes","directionMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Direction\" — which edge of the composition a sliding entrance animation comes from."], translations: {"zh-Hans":{"decision":"translate","text":"方向"},"zh-Hant":{"decision":"translate","text":"方向"},"ja_JP":{"decision":"translate","text":"方向"}}
    },
    { key: "nodeAttr:autoAnimate.distance", source: "Zoom Distance",
      owner: "autoAnimate", fieldPath: ["attributes","distance","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Zoom Distance\" — how far, in simulated depth, the layer travels during a zoom animation."], translations: {"zh-Hans":{"decision":"translate","text":"变焦距离"},"zh-Hant":{"decision":"translate","text":"變焦距離"},"ja_JP":{"decision":"translate","text":"ズーム距離"}}
    },
    { key: "nodeAttr:autoAnimate.level", source: "Custom Level",
      owner: "autoAnimate", fieldPath: ["attributes","level","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Custom Level\" — a user-chosen nesting depth in the shape’s hierarchy."], translations: {"zh-Hans":{"decision":"translate","text":"自定义层级"},"zh-Hant":{"decision":"translate","text":"自訂層級"},"ja_JP":{"decision":"translate","text":"カスタム階層"}}
    },
    { key: "nodeAttr:autoAnimate.levelMode", source: "Level Mode",
      owner: "autoAnimate", fieldPath: ["attributes","levelMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Level Mode\" — which nesting depth of sub-elements (e.g. words, characters) the animation applies to."], translations: {"zh-Hans":{"decision":"translate","text":"层级模式"},"zh-Hant":{"decision":"translate","text":"層級模式"},"ja_JP":{"decision":"translate","text":"レベルモード"}}
    },
    { key: "nodeAttr:autoAnimate.offsetAnimationMode", source: "Align Animation",
      owner: "autoAnimate", fieldPath: ["attributes","offsetAnimationMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Align Animation\" — how the animation’s timing lines up with the layer’s visible range on the timeline."], translations: {"zh-Hans":{"decision":"translate","text":"对齐动画"},"zh-Hant":{"decision":"translate","text":"對齊動畫"},"ja_JP":{"decision":"translate","text":"アニメーション整列"}}
    },
    { key: "nodeAttr:autoAnimate.offsetAnimationModeHelp", source: "When ‘Start at In Frame’ is selected, animation starts at the layer’s In Point. When ‘Finish at Out Frame’ is selected, animation ends at the layer’s Out Point.",
      owner: "autoAnimate", fieldPath: ["attributes","offsetAnimationModeHelp"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"In Point\" and \"Out Point\" here are the first and last visible frames of a layer on the timeline."], translations: {"zh-Hans":{"decision":"translate","text":"选择“在入帧开始”时，动画从图层的入点开始。选择“在出帧结束”时，动画在图层的出点结束。"},"zh-Hant":{"decision":"translate","text":"選擇「在入幀開始」時，動畫從圖層的入點開始。選擇「在出幀結束」時，動畫在圖層的出點結束。"},"ja_JP":{"decision":"translate","text":"［インフレームから開始］を選択すると、アニメーションはレイヤーのインポイントから開始されます。［アウトフレームで終了］を選択すると、アニメーションはレイヤーのアウトポイントで終了します。"}}
    },
    { key: "nodeAttr:autoAnimate.opacityMode", source: "Opacity Mode",
      owner: "autoAnimate", fieldPath: ["attributes","opacityMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Opacity Mode\" — which style of transparency animation (fade in/out) this node applies."], translations: {"zh-Hans":{"decision":"translate","text":"不透明度模式"},"zh-Hant":{"decision":"translate","text":"不透明度模式"},"ja_JP":{"decision":"translate","text":"不透明度モード"}}
    },
    { key: "nodeAttr:autoAnimate.opacityProgress", source: "Opacity Progress",
      owner: "autoAnimate", fieldPath: ["attributes","opacityProgress","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Opacity Progress\" — the 0–100% progress value driving only the transparency/fade animation aspect."], translations: {"zh-Hans":{"decision":"translate","text":"不透明度进度"},"zh-Hant":{"decision":"translate","text":"不透明度進度"},"ja_JP":{"decision":"translate","text":"不透明度プログレス"}}
    },
    { key: "nodeAttr:autoAnimate.parentRandomSeed", source: "Random Seed",
      owner: "autoAnimate", fieldPath: ["attributes","parentRandomSeed","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Random Seed\" — the starting number determining the randomised grouping order of sub-meshes by parent."], translations: {"zh-Hans":{"decision":"translate","text":"随机种子"},"zh-Hant":{"decision":"translate","text":"隨機種子"},"ja_JP":{"decision":"translate","text":"ランダムシード"}}
    },
    { key: "nodeAttr:autoAnimate.positionMode", source: "Position Mode",
      owner: "autoAnimate", fieldPath: ["attributes","positionMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Position Mode\" — which style of position animation (e.g. slide, drift, zoom) this node applies."], translations: {"zh-Hans":{"decision":"translate","text":"位置模式"},"zh-Hant":{"decision":"translate","text":"位置模式"},"ja_JP":{"decision":"translate","text":"位置モード"}}
    },
    { key: "nodeAttr:autoAnimate.positionProgress", source: "Position Progress",
      owner: "autoAnimate", fieldPath: ["attributes","positionProgress","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Position Progress\" — the 0–100% progress value driving only the position animation aspect."], translations: {"zh-Hans":{"decision":"translate","text":"位置进度"},"zh-Hant":{"decision":"translate","text":"位置進度"},"ja_JP":{"decision":"translate","text":"位置プログレス"}}
    },
    { key: "nodeAttr:autoAnimate.progress", source: "Progress",
      owner: "autoAnimate", fieldPath: ["attributes","progress","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Progress\" — a 0–100% value representing how far through the animation the object currently is."], translations: {"zh-Hans":{"decision":"translate","text":"进度"},"zh-Hant":{"decision":"translate","text":"進度"},"ja_JP":{"decision":"translate","text":"プログレス"}}
    },
    { key: "nodeAttr:autoAnimate.progressMode", source: "Progress Mode",
      owner: "autoAnimate", fieldPath: ["attributes","progressMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Progress Mode\" — chooses whether one single control drives the whole animation, or several separate controls drive each aspect."], translations: {"zh-Hans":{"decision":"translate","text":"进度模式"},"zh-Hant":{"decision":"translate","text":"進度模式"},"ja_JP":{"decision":"translate","text":"プログレスモード"}}
    },
    { key: "nodeAttr:autoAnimate.randomSeed", source: "Random Seed",
      owner: "autoAnimate", fieldPath: ["attributes","randomSeed","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Random Seed\" — a starting number that determines the specific pattern of randomness produced."], translations: {"zh-Hans":{"decision":"translate","text":"随机种子"},"zh-Hant":{"decision":"translate","text":"隨機種子"},"ja_JP":{"decision":"translate","text":"ランダムシード"}}
    },
    { key: "nodeAttr:autoAnimate.randomiseTimeOffset", source: "Randomise",
      owner: "autoAnimate", fieldPath: ["attributes","randomiseTimeOffset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Randomise\" — makes each sub-mesh’s start time vary unpredictably."], translations: {"zh-Hans":{"decision":"translate","text":"随机化"},"zh-Hant":{"decision":"translate","text":"隨機化"},"ja_JP":{"decision":"translate","text":"ランダム化"}}
    },
    { key: "nodeAttr:autoAnimate.reverseTimeOffset", source: "Reverse",
      owner: "autoAnimate", fieldPath: ["attributes","reverseTimeOffset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Reverse\" — plays the staggering order of sub-meshes backwards."], translations: {"zh-Hans":{"decision":"translate","text":"反转"},"zh-Hant":{"decision":"translate","text":"反轉"},"ja_JP":{"decision":"translate","text":"反転"}}
    },
    { key: "nodeAttr:autoAnimate.rotationMode", source: "Rotation Mode",
      owner: "autoAnimate", fieldPath: ["attributes","rotationMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Rotation Mode\" — which style of rotation animation (e.g. spin, swing) this node applies."], translations: {"zh-Hans":{"decision":"translate","text":"旋转模式"},"zh-Hant":{"decision":"translate","text":"旋轉模式"},"ja_JP":{"decision":"translate","text":"回転モード"}}
    },
    { key: "nodeAttr:autoAnimate.rotationProgress", source: "Rotation Progress",
      owner: "autoAnimate", fieldPath: ["attributes","rotationProgress","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Rotation Progress\" — the 0–100% progress value driving only the rotation animation aspect."], translations: {"zh-Hans":{"decision":"translate","text":"旋转进度"},"zh-Hant":{"decision":"translate","text":"旋轉進度"},"ja_JP":{"decision":"translate","text":"回転プログレス"}}
    },
    { key: "nodeAttr:autoAnimate.scaleFromMode", source: "Scale From",
      owner: "autoAnimate", fieldPath: ["attributes","scaleFromMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Scale From\" — the reference point the scale animation grows or shrinks from."], translations: {"zh-Hans":{"decision":"translate","text":"缩放起点"},"zh-Hant":{"decision":"translate","text":"縮放起點"},"ja_JP":{"decision":"translate","text":"スケール起点"}}
    },
    { key: "nodeAttr:autoAnimate.scaleMode", source: "Scale Mode",
      owner: "autoAnimate", fieldPath: ["attributes","scaleMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Scale\" is a noun here: the size/zoom animation type applied (e.g. Scale Up or Scale Down)."], translations: {"zh-Hans":{"decision":"translate","text":"缩放模式"},"zh-Hant":{"decision":"translate","text":"縮放模式"},"ja_JP":{"decision":"translate","text":"スケールモード"}}
    },
    { key: "nodeAttr:autoAnimate.scaleProgress", source: "Scale Progress",
      owner: "autoAnimate", fieldPath: ["attributes","scaleProgress","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Scale Progress\" — the 0–100% progress value driving only the size/scale animation aspect."], translations: {"zh-Hans":{"decision":"translate","text":"缩放进度"},"zh-Hant":{"decision":"translate","text":"縮放進度"},"ja_JP":{"decision":"translate","text":"スケールプログレス"}}
    },
    { key: "nodeAttr:autoAnimate.strength", source: "Strength",
      owner: "autoAnimate", fieldPath: ["attributes","strength","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Strength\" — how strongly this effect is applied."], translations: {"zh-Hans":{"decision":"translate","text":"强度"},"zh-Hant":{"decision":"translate","text":"強度"},"ja_JP":{"decision":"translate","text":"強度"}}
    },
    { key: "nodeAttr:autoAnimate.timeOffset", source: "Animation Time Offset",
      owner: "autoAnimate", fieldPath: ["attributes","timeOffset","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Animation Time Offset\" — the total stagger time spread across sub-meshes."], translations: {"zh-Hans":{"decision":"translate","text":"动画时间偏移"},"zh-Hant":{"decision":"translate","text":"動畫時間偏移"},"ja_JP":{"decision":"translate","text":"アニメーション時間オフセット"}}
    },
    { key: "nodeAttr:autoAnimate.timingHelp", source: "‘Use Levels’ must be checked to use the Time Offset feature.",
      owner: "autoAnimate", fieldPath: ["attributes","timingHelp"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Checked\" here means the checkbox toggle is turned on."], translations: {"zh-Hans":{"decision":"translate","text":"必须勾选“使用层级”才能使用时间偏移功能。"},"zh-Hant":{"decision":"translate","text":"必須勾選「使用層級」才能使用時間偏移功能。"},"ja_JP":{"decision":"translate","text":"タイムオフセット機能を使用するには、［レベルを使用］にチェックを入れる必要があります。"}}
    },
    { key: "nodeAttr:autoAnimate.useLevels", source: "Use Levels",
      owner: "autoAnimate", fieldPath: ["attributes","useLevels","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Use Levels\" — toggles whether the animation is applied per nested sub-element."], translations: {"zh-Hans":{"decision":"translate","text":"使用层级"},"zh-Hant":{"decision":"translate","text":"使用層級"},"ja_JP":{"decision":"translate","text":"レベルを使用"}}
    },
    { key: "nodeAttr:autoAnimate.useLevelsHelp", source: "Levels can be used to animate the individual child-meshes in a Duplicator, or the Lines/Words/Characters of a Text Shape.",
      owner: "autoAnimate", fieldPath: ["attributes","useLevelsHelp"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["\"Duplicator\" here is a Cavalry node type that repeats a shape multiple times."], translations: {"zh-Hans":{"decision":"translate","text":"“层级”可用于对复制器中的各个子网格，或文本形状的行/词/字符进行独立动画。"},"zh-Hant":{"decision":"translate","text":"「層級」可用於對複製器中的各個子網格，或文字形狀的行/詞/字元進行獨立動畫。"},"ja_JP":{"decision":"translate","text":"レベルを使用すると、デュプリケーター内の個々の子メッシュや、テキストシェイプの行/単語/文字をアニメーション化できます。"}}
    },
    { key: "nodeAttr:autoAnimate.visibilityMode", source: "Visibility Mode",
      owner: "autoAnimate", fieldPath: ["attributes","visibilityMode","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Visibility Mode\" — which style of show/hide animation (Appear or Disappear) this node applies."], translations: {"zh-Hans":{"decision":"translate","text":"可见性模式"},"zh-Hant":{"decision":"translate","text":"可見性模式"},"ja_JP":{"decision":"translate","text":"表示モード"}}
    },
    { key: "nodeAttr:autoAnimate.visibilityProgress", source: "Visibility Progress",
      owner: "autoAnimate", fieldPath: ["attributes","visibilityProgress","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Visibility Progress\" — the 0–100% progress value driving only the show/hide animation aspect."], translations: {"zh-Hans":{"decision":"translate","text":"可见性进度"},"zh-Hant":{"decision":"translate","text":"可見性進度"},"ja_JP":{"decision":"translate","text":"表示プログレス"}}
    },
    { key: "nodeAttr:autoAnimate.zoom", source: "Zoom",
      owner: "autoAnimate", fieldPath: ["attributes","zoom","name"], displayRole: "attribute-label",
      dontTranslate: false, notes: ["As in \"Zoom\" — the simulated camera lens angle used for rotation animations."], translations: {"zh-Hans":{"decision":"translate","text":"变焦"},"zh-Hant":{"decision":"translate","text":"變焦"},"ja_JP":{"decision":"translate","text":"ズーム"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendDirection.0", source: "Horizontal",
      owner: "autoAnimate", fieldPath: ["enums","bendDirection","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Horizontal\" — the bend pivots around a left-right axis."], translations: {"zh-Hans":{"decision":"translate","text":"水平"},"zh-Hant":{"decision":"translate","text":"水平"},"ja_JP":{"decision":"translate","text":"水平"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendDirection.1", source: "Vertical",
      owner: "autoAnimate", fieldPath: ["enums","bendDirection","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Vertical\" — the bend pivots around a top-bottom axis."], translations: {"zh-Hans":{"decision":"translate","text":"垂直"},"zh-Hant":{"decision":"translate","text":"垂直"},"ja_JP":{"decision":"translate","text":"垂直"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendHorizontalPin.0", source: "Centre",
      owner: "autoAnimate", fieldPath: ["enums","bendHorizontalPin","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Centre\" — the bend’s fixed horizontal anchor point is the shape’s horizontal middle."], translations: {"zh-Hans":{"decision":"translate","text":"中心"},"zh-Hant":{"decision":"translate","text":"中心"},"ja_JP":{"decision":"translate","text":"中心"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendHorizontalPin.1", source: "Left",
      owner: "autoAnimate", fieldPath: ["enums","bendHorizontalPin","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Left\" — the bend’s fixed horizontal anchor point is the shape’s left edge."], translations: {"zh-Hans":{"decision":"translate","text":"左"},"zh-Hant":{"decision":"translate","text":"左"},"ja_JP":{"decision":"translate","text":"左"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendHorizontalPin.2", source: "Right",
      owner: "autoAnimate", fieldPath: ["enums","bendHorizontalPin","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Right\" — the bend’s fixed horizontal anchor point is the shape’s right edge."], translations: {"zh-Hans":{"decision":"translate","text":"右"},"zh-Hant":{"decision":"translate","text":"右"},"ja_JP":{"decision":"translate","text":"右"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendVerticalPin.0", source: "Middle",
      owner: "autoAnimate", fieldPath: ["enums","bendVerticalPin","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Middle\" — the bend’s fixed vertical anchor point is the shape’s vertical centre."], translations: {"zh-Hans":{"decision":"translate","text":"中间"},"zh-Hant":{"decision":"translate","text":"中間"},"ja_JP":{"decision":"translate","text":"中間"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendVerticalPin.1", source: "Top",
      owner: "autoAnimate", fieldPath: ["enums","bendVerticalPin","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Top\" — the bend’s fixed vertical anchor point is the shape’s top edge."], translations: {"zh-Hans":{"decision":"translate","text":"顶部"},"zh-Hant":{"decision":"translate","text":"頂部"},"ja_JP":{"decision":"translate","text":"上"}}
    },
    { key: "nodeAttrEnum:autoAnimate.bendVerticalPin.2", source: "Bottom",
      owner: "autoAnimate", fieldPath: ["enums","bendVerticalPin","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Bottom\" — the bend’s fixed vertical anchor point is the shape’s bottom edge."], translations: {"zh-Hans":{"decision":"translate","text":"底部"},"zh-Hant":{"decision":"translate","text":"底部"},"ja_JP":{"decision":"translate","text":"下"}}
    },
    { key: "nodeAttrEnum:autoAnimate.directionMode.0", source: "Left",
      owner: "autoAnimate", fieldPath: ["enums","directionMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Left\" — the layer slides in from the left edge of the composition, a screen direction."], translations: {"zh-Hans":{"decision":"translate","text":"左"},"zh-Hant":{"decision":"translate","text":"左"},"ja_JP":{"decision":"translate","text":"左"}}
    },
    { key: "nodeAttrEnum:autoAnimate.directionMode.1", source: "Right",
      owner: "autoAnimate", fieldPath: ["enums","directionMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Right\" — the layer slides in from the right edge of the composition, a screen direction."], translations: {"zh-Hans":{"decision":"translate","text":"右"},"zh-Hant":{"decision":"translate","text":"右"},"ja_JP":{"decision":"translate","text":"右"}}
    },
    { key: "nodeAttrEnum:autoAnimate.directionMode.2", source: "Top",
      owner: "autoAnimate", fieldPath: ["enums","directionMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Top\" — the layer slides in from the top edge of the composition."], translations: {"zh-Hans":{"decision":"translate","text":"顶部"},"zh-Hant":{"decision":"translate","text":"頂部"},"ja_JP":{"decision":"translate","text":"上"}}
    },
    { key: "nodeAttrEnum:autoAnimate.directionMode.3", source: "Bottom",
      owner: "autoAnimate", fieldPath: ["enums","directionMode","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Bottom\" — the layer slides in from the bottom edge of the composition."], translations: {"zh-Hans":{"decision":"translate","text":"底部"},"zh-Hant":{"decision":"translate","text":"底部"},"ja_JP":{"decision":"translate","text":"下"}}
    },
    { key: "nodeAttrEnum:autoAnimate.levelMode.0", source: "Custom...",
      owner: "autoAnimate", fieldPath: ["enums","levelMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Custom.\" — lets the user manually set a specific nesting level."], translations: {"zh-Hans":{"decision":"translate","text":"自定义..."},"zh-Hant":{"decision":"translate","text":"自訂..."},"ja_JP":{"decision":"translate","text":"カスタム..."}}
    },
    { key: "nodeAttrEnum:autoAnimate.levelMode.1", source: "Text (Lines)/ Duplicator",
      owner: "autoAnimate", fieldPath: ["enums","levelMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Text (Lines)/ Duplicator\" — applies the animation per text line, or per duplicated copy if this is a Duplicator node."], translations: {"zh-Hans":{"decision":"translate","text":"文本（行）/ 复制器"},"zh-Hant":{"decision":"translate","text":"文字（行）/ 複製器"},"ja_JP":{"decision":"translate","text":"テキスト（行）/ デュプリケーター"}}
    },
    { key: "nodeAttrEnum:autoAnimate.levelMode.2", source: "Text (Words)",
      owner: "autoAnimate", fieldPath: ["enums","levelMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Text (Words)\" — applies the animation per individual word within a Text Shape."], translations: {"zh-Hans":{"decision":"translate","text":"文本（词）"},"zh-Hant":{"decision":"translate","text":"文字（詞）"},"ja_JP":{"decision":"translate","text":"テキスト（単語）"}}
    },
    { key: "nodeAttrEnum:autoAnimate.levelMode.3", source: "Text (Characters)",
      owner: "autoAnimate", fieldPath: ["enums","levelMode","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Text (Characters)\" — applies the animation per individual character/letter within a Text Shape."], translations: {"zh-Hans":{"decision":"translate","text":"文本（字符）"},"zh-Hant":{"decision":"translate","text":"文字（字元）"},"ja_JP":{"decision":"translate","text":"テキスト（文字）"}}
    },
    { key: "nodeAttrEnum:autoAnimate.offsetAnimationMode.0", source: "None",
      owner: "autoAnimate", fieldPath: ["enums","offsetAnimationMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"None\" — the animation timing is not aligned to the layer’s visibility range at all."], translations: {"zh-Hans":{"decision":"translate","text":"无"},"zh-Hant":{"decision":"translate","text":"無"},"ja_JP":{"decision":"translate","text":"なし"}}
    },
    { key: "nodeAttrEnum:autoAnimate.offsetAnimationMode.1", source: "Start at In Frame",
      owner: "autoAnimate", fieldPath: ["enums","offsetAnimationMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Start at In Frame\" — the animation begins exactly when the layer first becomes visible on the timeline."], translations: {"zh-Hans":{"decision":"translate","text":"在入帧开始"},"zh-Hant":{"decision":"translate","text":"在入幀開始"},"ja_JP":{"decision":"translate","text":"インフレームから開始"}}
    },
    { key: "nodeAttrEnum:autoAnimate.offsetAnimationMode.2", source: "Finish at Out Frame",
      owner: "autoAnimate", fieldPath: ["enums","offsetAnimationMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Finish at Out Frame\" — the animation ends exactly when the layer becomes invisible on the timeline."], translations: {"zh-Hans":{"decision":"translate","text":"在出帧结束"},"zh-Hant":{"decision":"translate","text":"在出幀結束"},"ja_JP":{"decision":"translate","text":"アウトフレームで終了"}}
    },
    { key: "nodeAttrEnum:autoAnimate.opacityMode.0", source: "None",
      owner: "autoAnimate", fieldPath: ["enums","opacityMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"None\" — no opacity/fade animation is applied."], translations: {"zh-Hans":{"decision":"translate","text":"无"},"zh-Hant":{"decision":"translate","text":"無"},"ja_JP":{"decision":"translate","text":"なし"}}
    },
    { key: "nodeAttrEnum:autoAnimate.opacityMode.1", source: "Fade Up",
      owner: "autoAnimate", fieldPath: ["enums","opacityMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Up\" means becoming more visible/opaque."], translations: {"zh-Hans":{"decision":"translate","text":"淡入"},"zh-Hant":{"decision":"translate","text":"淡入"},"ja_JP":{"decision":"translate","text":"フェードイン"}}
    },
    { key: "nodeAttrEnum:autoAnimate.opacityMode.2", source: "Fade Down",
      owner: "autoAnimate", fieldPath: ["enums","opacityMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Down\" means becoming less visible/opaque (fading out)."], translations: {"zh-Hans":{"decision":"translate","text":"淡出"},"zh-Hant":{"decision":"translate","text":"淡出"},"ja_JP":{"decision":"translate","text":"フェードアウト"}}
    },
    { key: "nodeAttrEnum:autoAnimate.parentTimingMode.0", source: "Normal",
      owner: "autoAnimate", fieldPath: ["enums","parentTimingMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Normal\" — parent groups of sub-meshes are staggered evenly in sequence."], translations: {"zh-Hans":{"decision":"translate","text":"正常"},"zh-Hant":{"decision":"translate","text":"正常"},"ja_JP":{"decision":"translate","text":"通常"}}
    },
    { key: "nodeAttrEnum:autoAnimate.parentTimingMode.1", source: "Random",
      owner: "autoAnimate", fieldPath: ["enums","parentTimingMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Random\" — parent groups of sub-meshes have their timing shuffled unpredictably."], translations: {"zh-Hans":{"decision":"translate","text":"随机"},"zh-Hant":{"decision":"translate","text":"隨機"},"ja_JP":{"decision":"translate","text":"ランダム"}}
    },
    { key: "nodeAttrEnum:autoAnimate.parentTimingMode.2", source: "Middle out",
      owner: "autoAnimate", fieldPath: ["enums","parentTimingMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Middle out\" describes animation starting from the centre and spreading outward to both ends."], translations: {"zh-Hans":{"decision":"translate","text":"从中间向外"},"zh-Hant":{"decision":"translate","text":"從中間向外"},"ja_JP":{"decision":"translate","text":"中央から外へ"}}
    },
    { key: "nodeAttrEnum:autoAnimate.positionMode.0", source: "None",
      owner: "autoAnimate", fieldPath: ["enums","positionMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"None\" — no position animation is applied."], translations: {"zh-Hans":{"decision":"translate","text":"无"},"zh-Hant":{"decision":"translate","text":"無"},"ja_JP":{"decision":"translate","text":"なし"}}
    },
    { key: "nodeAttrEnum:autoAnimate.positionMode.1", source: "Slide From Composition Edge",
      owner: "autoAnimate", fieldPath: ["enums","positionMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Slide From Composition Edge\" — the layer animates in by sliding from outside the visible canvas boundary."], translations: {"zh-Hans":{"decision":"translate","text":"从合成边缘滑动"},"zh-Hant":{"decision":"translate","text":"從合成邊緣滑動"},"ja_JP":{"decision":"translate","text":"コンポジション端からスライド"}}
    },
    { key: "nodeAttrEnum:autoAnimate.positionMode.2", source: "Drift",
      owner: "autoAnimate", fieldPath: ["enums","positionMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Drift\" here means a slow, gradual floating movement."], translations: {"zh-Hans":{"decision":"translate","text":"漂移"},"zh-Hant":{"decision":"translate","text":"飄移"},"ja_JP":{"decision":"translate","text":"ドリフト"}}
    },
    { key: "nodeAttrEnum:autoAnimate.positionMode.3", source: "Zoom",
      owner: "autoAnimate", fieldPath: ["enums","positionMode","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Zoom\" position mode — the layer animates by moving toward or away from the camera."], translations: {"zh-Hans":{"decision":"translate","text":"变焦"},"zh-Hant":{"decision":"translate","text":"變焦"},"ja_JP":{"decision":"translate","text":"ズーム"}}
    },
    { key: "nodeAttrEnum:autoAnimate.progressMode.0", source: "Single Progress Control",
      owner: "autoAnimate", fieldPath: ["enums","progressMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Single Progress Control\" — one shared 0–100% value drives every enabled animation aspect together."], translations: {"zh-Hans":{"decision":"translate","text":"单一进度控制"},"zh-Hant":{"decision":"translate","text":"單一進度控制"},"ja_JP":{"decision":"translate","text":"単一プログレスコントロール"}}
    },
    { key: "nodeAttrEnum:autoAnimate.progressMode.1", source: "Precise Progress Controls",
      owner: "autoAnimate", fieldPath: ["enums","progressMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Precise Progress Controls\" — separate 0–100% values let each animation aspect be timed independently."], translations: {"zh-Hans":{"decision":"translate","text":"精确进度控制"},"zh-Hant":{"decision":"translate","text":"精確進度控制"},"ja_JP":{"decision":"translate","text":"精密プログレスコントロール"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.0", source: "None",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"None\" — no rotation animation is applied."], translations: {"zh-Hans":{"decision":"translate","text":"无"},"zh-Hant":{"decision":"translate","text":"無"},"ja_JP":{"decision":"translate","text":"なし"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.1", source: "Spin",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Spin\" — the shape continuously rotates in full circles."], translations: {"zh-Hans":{"decision":"translate","text":"自转"},"zh-Hant":{"decision":"translate","text":"自轉"},"ja_JP":{"decision":"translate","text":"スピン"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.2", source: "Swing From Left",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Swing From Left\" — the shape rotates like a pendulum hinged from its left edge."], translations: {"zh-Hans":{"decision":"translate","text":"从左侧摆动"},"zh-Hant":{"decision":"translate","text":"從左側擺動"},"ja_JP":{"decision":"translate","text":"左からスイング"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.3", source: "Swing From Right",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","3"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Swing From Right\" — the shape rotates like a pendulum hinged from its right edge."], translations: {"zh-Hans":{"decision":"translate","text":"从右侧摆动"},"zh-Hant":{"decision":"translate","text":"從右側擺動"},"ja_JP":{"decision":"translate","text":"右からスイング"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.4", source: "Swing From Top",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","4"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Swing From Top\" — the shape rotates like a pendulum hinged from its top edge."], translations: {"zh-Hans":{"decision":"translate","text":"从顶部摆动"},"zh-Hant":{"decision":"translate","text":"從頂部擺動"},"ja_JP":{"decision":"translate","text":"上からスイング"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.5", source: "Swing From Bottom",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","5"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Swing From Bottom\" — the shape rotates like a pendulum hinged from its bottom edge."], translations: {"zh-Hans":{"decision":"translate","text":"从底部摆动"},"zh-Hant":{"decision":"translate","text":"從底部擺動"},"ja_JP":{"decision":"translate","text":"下からスイング"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.6", source: "Swing From Centre Horizontal",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","6"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Swing From Centre Horizontal\" — the shape rotates like a pendulum hinged along its horizontal centre line."], translations: {"zh-Hans":{"decision":"translate","text":"从水平中心摆动"},"zh-Hant":{"decision":"translate","text":"從水平中心擺動"},"ja_JP":{"decision":"translate","text":"水平中央からスイング"}}
    },
    { key: "nodeAttrEnum:autoAnimate.rotationMode.7", source: "Swing From Centre Vertical",
      owner: "autoAnimate", fieldPath: ["enums","rotationMode","7"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Swing From Centre Vertical\" — the shape rotates like a pendulum hinged along its vertical centre line."], translations: {"zh-Hans":{"decision":"translate","text":"从垂直中心摆动"},"zh-Hant":{"decision":"translate","text":"從垂直中心擺動"},"ja_JP":{"decision":"translate","text":"垂直中央からスイング"}}
    },
    { key: "nodeAttrEnum:autoAnimate.scaleFromMode.0", source: "Path Pivot Point",
      owner: "autoAnimate", fieldPath: ["enums","scaleFromMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Path Pivot Point\" — scaling grows/shrinks from the path’s defined pivot point."], translations: {"zh-Hans":{"decision":"translate","text":"路径锚点"},"zh-Hant":{"decision":"translate","text":"路徑錨點"},"ja_JP":{"decision":"translate","text":"パスピボットポイント"}}
    },
    { key: "nodeAttrEnum:autoAnimate.scaleFromMode.1", source: "Path Centre",
      owner: "autoAnimate", fieldPath: ["enums","scaleFromMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Path Centre\" — scaling grows/shrinks from the geometric middle of the path’s bounding area."], translations: {"zh-Hans":{"decision":"translate","text":"路径中心"},"zh-Hant":{"decision":"translate","text":"路徑中心"},"ja_JP":{"decision":"translate","text":"パス中心"}}
    },
    { key: "nodeAttrEnum:autoAnimate.scaleFromMode.2", source: "Layer Pivot",
      owner: "autoAnimate", fieldPath: ["enums","scaleFromMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Layer Pivot\" — scaling grows/shrinks from the layer’s own pivot point, distinct from the path’s pivot."], translations: {"zh-Hans":{"decision":"translate","text":"图层锚点"},"zh-Hant":{"decision":"translate","text":"圖層錨點"},"ja_JP":{"decision":"translate","text":"レイヤーピボット"}}
    },
    { key: "nodeAttrEnum:autoAnimate.scaleMode.0", source: "None",
      owner: "autoAnimate", fieldPath: ["enums","scaleMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"None\" — no scale/size animation is applied."], translations: {"zh-Hans":{"decision":"translate","text":"无"},"zh-Hant":{"decision":"translate","text":"無"},"ja_JP":{"decision":"translate","text":"なし"}}
    },
    { key: "nodeAttrEnum:autoAnimate.scaleMode.1", source: "Scale Up",
      owner: "autoAnimate", fieldPath: ["enums","scaleMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Scale Up\" — the shape grows larger during the animation."], translations: {"zh-Hans":{"decision":"translate","text":"放大"},"zh-Hant":{"decision":"translate","text":"放大"},"ja_JP":{"decision":"translate","text":"拡大"}}
    },
    { key: "nodeAttrEnum:autoAnimate.scaleMode.2", source: "Scale Down",
      owner: "autoAnimate", fieldPath: ["enums","scaleMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Scale Down\" — the shape shrinks smaller during the animation."], translations: {"zh-Hans":{"decision":"translate","text":"缩小"},"zh-Hant":{"decision":"translate","text":"縮小"},"ja_JP":{"decision":"translate","text":"縮小"}}
    },
    { key: "nodeAttrEnum:autoAnimate.timingMode.0", source: "Normal",
      owner: "autoAnimate", fieldPath: ["enums","timingMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Normal\" timing — sub-meshes are staggered evenly in sequence.\""], translations: {"zh-Hans":{"decision":"translate","text":"正常"},"zh-Hant":{"decision":"translate","text":"正常"},"ja_JP":{"decision":"translate","text":"通常"}}
    },
    { key: "nodeAttrEnum:autoAnimate.timingMode.1", source: "Random",
      owner: "autoAnimate", fieldPath: ["enums","timingMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Random\" timing — sub-meshes’ start times are shuffled unpredictably."], translations: {"zh-Hans":{"decision":"translate","text":"随机"},"zh-Hant":{"decision":"translate","text":"隨機"},"ja_JP":{"decision":"translate","text":"ランダム"}}
    },
    { key: "nodeAttrEnum:autoAnimate.timingMode.2", source: "Middle out",
      owner: "autoAnimate", fieldPath: ["enums","timingMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["\"Middle out\" describes animation starting from the centre and spreading outward to both ends."], translations: {"zh-Hans":{"decision":"translate","text":"从中间向外"},"zh-Hant":{"decision":"translate","text":"從中間向外"},"ja_JP":{"decision":"translate","text":"中央から外へ"}}
    },
    { key: "nodeAttrEnum:autoAnimate.visibilityMode.0", source: "None",
      owner: "autoAnimate", fieldPath: ["enums","visibilityMode","0"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"None\" — no visibility/show-hide animation is applied."], translations: {"zh-Hans":{"decision":"translate","text":"无"},"zh-Hant":{"decision":"translate","text":"無"},"ja_JP":{"decision":"translate","text":"なし"}}
    },
    { key: "nodeAttrEnum:autoAnimate.visibilityMode.1", source: "Appear",
      owner: "autoAnimate", fieldPath: ["enums","visibilityMode","1"], displayRole: "enum-label",
      dontTranslate: false, notes: ["As in \"Appear\" — the shape becomes visible during the animation."], translations: {"zh-Hans":{"decision":"translate","text":"出现"},"zh-Hant":{"decision":"translate","text":"出現"},"ja_JP":{"decision":"translate","text":"出現"}}
    },
    { key: "nodeAttrEnum:autoAnimate.visibilityMode.2", source: "Dissapear",
      owner: "autoAnimate", fieldPath: ["enums","visibilityMode","2"], displayRole: "enum-label",
      dontTranslate: false, notes: ["This is a misspelling of \"Disappear\" in the source string — the shape becomes hidden during the animation."], translations: {"zh-Hans":{"decision":"translate","text":"消失"},"zh-Hant":{"decision":"translate","text":"消失"},"ja_JP":{"decision":"translate","text":"消失"}}
    },
    { key: "nodeInfo:autoAnimate", source: "Add a variety of animations to Shapes with only a few keyframes.",
      owner: "autoAnimate", fieldPath: ["info","tooltip"], displayRole: "node-info",
      dontTranslate: false, notes: ["\"Keyframes\" are the individual recorded points that define an animation’s start/end values, a standard animation term."], translations: {"zh-Hans":{"decision":"translate","text":"仅用少量关键帧为形状添加多种动画。"},"zh-Hant":{"decision":"translate","text":"僅用少量關鍵幀為形狀新增多種動畫。"},"ja_JP":{"decision":"translate","text":"少数のキーフレームでシェイプに多彩なアニメーションを追加します。"}}
    },
    { key: "nodeName:autoAnimate", source: "Auto-Animate",
      owner: "autoAnimate", fieldPath: ["info","name"], displayRole: "node-name",
      dontTranslate: false, notes: ["As in \"Auto-Animate\" — a node that automatically generates animation from a few keyframes."], translations: {"zh-Hans":{"decision":"translate","text":"自动动画"},"zh-Hant":{"decision":"translate","text":"自動動畫"},"ja_JP":{"decision":"translate","text":"自動アニメート"}}
    },
    { key: "nodeTab:autoAnimate.animation", source: "Animation",
      owner: "autoAnimate", fieldPath: ["tabs","animation"], displayRole: "tab-label",
      dontTranslate: false, notes: ["As in \"Animation\" tab — groups the controls for how the shape moves over time."], translations: {"zh-Hans":{"decision":"translate","text":"动画"},"zh-Hant":{"decision":"translate","text":"動畫"},"ja_JP":{"decision":"translate","text":"アニメーション"}}
    },
    { key: "nodeTab:autoAnimate.deformers", source: "Deformers",
      owner: "autoAnimate", fieldPath: ["tabs","deformers"], displayRole: "tab-label",
      dontTranslate: false, notes: ["As in \"Deformers\" tab — groups nodes that reshape/distort the connected shape’s geometry."], translations: {"zh-Hans":{"decision":"translate","text":"变形器"},"zh-Hant":{"decision":"translate","text":"變形器"},"ja_JP":{"decision":"translate","text":"デフォーマ"}}
    },
    { key: "nodeTab:autoAnimate.timing", source: "Timing",
      owner: "autoAnimate", fieldPath: ["tabs","timing"], displayRole: "tab-label",
      dontTranslate: false, notes: ["As in \"Timing\" tab — groups the controls for when and how the staggering/sequencing happens."], translations: {"zh-Hans":{"decision":"translate","text":"时序"},"zh-Hant":{"decision":"translate","text":"時序"},"ja_JP":{"decision":"translate","text":"タイミング"}}
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
  "changedLocaleSlots": 1,
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
