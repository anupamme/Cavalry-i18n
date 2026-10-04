/**
 * [INPUT]: 绑定官方Cavalry 2.8 nodeStrings中的subMesh完整source、notes、source/display角色与root批准的quota-fallback source-bound显示译值。
 * [OUTPUT]: 仅为构建期提供68个root批准的source-bound显示键与三语显式决策；不改变模型、算法、参数或用户数据。
 * [POS]: languages/native的subMesh完整owner显示输入；经显式approved_modules供producer消费，不代表部署或实机通过。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 * 本轮图形语境有限修订经非作者验回/root审定；冻结源与历史批准仍保全。
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
    "sourcePairsSha256": "07ec41e83ec014b658f4a922242ed5b23b0c717d6f742c529363bc1488cced12",
    "sourceIdentityAndNotesSha256": "67edd38b2f46caa47c2aa1c42473d31dae460e87de7a7160368f78884d0b1fb5",
    "keysetSha256": "692acf1976b7a8ac73ed9285728eade0cbdd9ed9c077423310374da47c527b69",
    "translationDecisionsSha256": "e13afbe6512e7e751e6cc287e34ad05a014287c1814885c458726958410a728a",
    "owner": "subMesh",
    "keyCount": 68,
    "decisionSlotCount": 204,
    "localeDecisionCounts": {
      "zh-Hans": {
        "translate": 68,
        "preserve": 0
      },
      "zh-Hant": {
        "translate": 68,
        "preserve": 0
      },
      "ja_JP": {
        "translate": 68,
        "preserve": 0
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
      "key": "attrInfo:subMesh.deformers", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","deformers","tooltip"],
      "source": "Add and/or connect a Deformer from the list.", "notes": ["\"Deformer\" is a category of Cavalry nodes that reshape geometry."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Add and/or connect a Deformer from the list.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"从列表中添加和/或连接变形器。"},"zh-Hant":{"decision":"translate","text":"從清單中新增和/或連接變形器。"},"ja_JP":{"decision":"translate","text":"リストからデフォーマを追加、および／または接続します。"}}
    },
    {
      "key": "attrInfo:subMesh.fillBehaviours", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","fillBehaviours","tooltip"],
      "source": "Connect a Material Override Layer in order to blend between the original Fill color and the values set by the Override.", "notes": ["\"Fill\" is a shape’s interior colour/texture."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Connect a Material Override Layer in order to blend between the original Fill color and the values set by the Override.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"连接材质覆盖图层，以便在原始填充颜色与覆盖所设置的值之间混合。"},"zh-Hant":{"decision":"translate","text":"連接材質覆蓋圖層，以便在原始填充顏色與覆蓋所設定的值之間混合。"},"ja_JP":{"decision":"translate","text":"マテリアルオーバーライドレイヤーを接続し、元の塗りのカラーとオーバーライドで設定した値との間をブレンドします。"}}
    },
    {
      "key": "attrInfo:subMesh.fillReplacementMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","fillReplacementMode","tooltip"],
      "source": "Determine how materials are replaced by targeting certain conditions.", "notes": ["\"Materials\" here are the fill/stroke colour or texture applied to a shape."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Determine how materials are replaced by targeting certain conditions.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"按特定条件决定如何替换材质。"},"zh-Hant":{"decision":"translate","text":"依特定條件決定如何替換材質。"},"ja_JP":{"decision":"translate","text":"特定の条件を対象に、マテリアルをどのように置換するかを決めます。"}}
    },
    {
      "key": "attrInfo:subMesh.filters", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","filters","tooltip"],
      "source": "Add and connect a Filter (e.g. Blur, Drop Shadow) which is applied per child-mesh.", "notes": ["\"Filter\" here is a visual-effect node (like Blur)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Add and connect a Filter (e.g. Blur, Drop Shadow) which is applied per child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"添加并连接滤镜（例如模糊、投影），并按每个子网格应用。"},"zh-Hant":{"decision":"translate","text":"新增並連接濾鏡（例如模糊、投影），並套用至每個子網格。"},"ja_JP":{"decision":"translate","text":"フィルター（ブラー、ドロップシャドウなど）を追加して接続します。子メッシュごとに適用されます。"}}
    },
    {
      "key": "attrInfo:subMesh.flattenMeshAtLevel", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","flattenMeshAtLevel","tooltip"],
      "source": "Set a level which will flatten all child-meshes below this level up to. It can be used, for example, to convert per-character materials to per-word/line.", "notes": ["\"Flatten\" means merge nested child-meshes into a single level."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set a level which will flatten all child-meshes below this level up to. It can be used, for example, to convert per-character materials to per-word/line.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置一个层级，将低于该层级的所有子网格向上展平到此层级。例如，可将逐字符材质转换为逐词或逐行材质。"},"zh-Hant":{"decision":"translate","text":"設定一個層級，將低於該層級的所有子網格向上展平到此層級。例如，可將逐字元材質轉換為逐詞或逐行材質。"},"ja_JP":{"decision":"translate","text":"このレベルより下のすべての子メッシュを、このレベルまでフラット化するレベルを設定します。たとえば、文字ごとのマテリアルを単語ごと、または行ごとに変換できます。"}}
    },
    {
      "key": "attrInfo:subMesh.indexMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","indexMode","tooltip"],
      "source": "Determine if Behaviours such as Random give unique values for every child-mesh, or if the index is unique per parent mesh.", "notes": ["\"Index\" is a per-copy identifying number assigned to each duplicated child-mesh."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Determine if Behaviours such as Random give unique values for every child-mesh, or if the index is unique per parent mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"决定随机等行为是为每个子网格给出各自的值，还是使索引在每个父级网格内唯一。"},"zh-Hant":{"decision":"translate","text":"決定隨機等行為是為每個子網格給出各自的值，還是使索引在每個父級網格內唯一。"},"ja_JP":{"decision":"translate","text":"ランダムなどのビヘイビアが子メッシュごとに固有の値を与えるか、インデックスが親メッシュごとに固有になるかを決めます。"}}
    },
    {
      "key": "attrInfo:subMesh.levelMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","levelMode","tooltip"],
      "source": "Choose which levels of a Mesh’s hierarchy to affect. Level 0 is the root mesh, deeper levels are nested child-meshes. Use the <b>Mesh Explorer</b> to reveal the levels contained within a Shape.", "notes": ["\"Root mesh\" is the top-level shape before any nested children."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Choose which levels of a Mesh’s hierarchy to affect. Level 0 is the root mesh, deeper levels are nested child-meshes. Use the <b>Mesh Explorer</b> to reveal the levels contained within a Shape.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"选择要影响的网格层级。层级 0 是根网格，更深的层级是嵌套子网格。使用<b>网格浏览器</b>查看形状中包含的层级。"},"zh-Hant":{"decision":"translate","text":"選擇要影響的網格層級。層級 0 是根網格，更深的層級是巢狀子網格。使用<b>網格瀏覽器</b>查看形狀中包含的層級。"},"ja_JP":{"decision":"translate","text":"影響するメッシュ階層のレベルを選択します。レベル 0 はルートメッシュ、それより深いレベルはネストした子メッシュです。<b>メッシュエクスプローラー</b>で、シェイプに含まれるレベルを確認できます。"}}
    },
    {
      "key": "attrInfo:subMesh.levels", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","levels","tooltip"],
      "source": "Set the range of levels within the Mesh’s hierarchy to affect. For example, setting a range of 1..2 might be used to override the color of an SVG for all the child-meshes on levels 1 and 2 but not on level 3.", "notes": ["\"Levels\" refer to depth within the nested child-mesh hierarchy (like folder depth)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the range of levels within the Mesh’s hierarchy to affect. For example, setting a range of 1..2 might be used to override the color of an SVG for all the child-meshes on levels 1 and 2 but not on level 3.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置要影响的网格层级范围。例如，将范围设为 1..2，可用于覆盖层级 1 和 2 上所有子网格的 SVG 颜色，但不覆盖层级 3。"},"zh-Hant":{"decision":"translate","text":"設定要影響的網格層級範圍。例如，將範圍設為 1..2，可用於覆蓋層級 1 與 2 上所有子網格的 SVG 顏色，但不覆蓋層級 3。"},"ja_JP":{"decision":"translate","text":"影響するメッシュ階層のレベル範囲を設定します。たとえば、範囲を 1..2 にすると、レベル 1 と 2 のすべての子メッシュでは SVG のカラーをオーバーライドできますが、レベル 3 ではできません。"}}
    },
    {
      "key": "attrInfo:subMesh.material", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","material","tooltip"],
      "source": "When checked, the Sub-Mesh will overwrite the Fill for the Shapes it is connected to with the Color and/or Shaders set in this tab.", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape; \"Fill\" is a shape’s interior colour/texture; \"Shaders\" refers to procedural texture/colour effects, a graphics term."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When checked, the Sub-Mesh will overwrite the Fill for the Shapes it is connected to with the Color and/or Shaders set in this tab.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"勾选后，子网格会用此标签页中设置的颜色和/或着色器，覆盖所连接形状的填充。"},"zh-Hant":{"decision":"translate","text":"勾選後，子網格會以此標籤頁中設定的顏色和/或著色器，覆蓋所連接形狀的填充。"},"ja_JP":{"decision":"translate","text":"オンにすると、サブメッシュは、このタブで設定したカラーおよび／またはシェーダーで、接続先シェイプの塗りを上書きします。"}}
    },
    {
      "key": "attrInfo:subMesh.mode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","mode","tooltip"],
      "source": "Sub-Meshes operates on whole sub-mesh objects; Polygons treats each polygon (sub-path) as a sub-mesh.", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Sub-Meshes operates on whole sub-mesh objects; Polygons treats each polygon (sub-path) as a sub-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"“子网格”作用于完整的子网格对象；“多边形”将每个多边形（子路径）视为一个子网格。"},"zh-Hant":{"decision":"translate","text":"「子網格」作用於完整的子網格物件；「多邊形」將每個多邊形（子路徑）視為一個子網格。"},"ja_JP":{"decision":"translate","text":"「サブメッシュ」はサブメッシュオブジェクト全体を対象にします。「ポリゴン」は各ポリゴン（サブパス）を 1 つのサブメッシュとして扱います。"}}
    },
    {
      "key": "attrInfo:subMesh.opacityMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","opacityMode","tooltip"],
      "source": "Determine if any existing opacity should be overwritten or multiplied.", "notes": ["\"Overwritten\" means the existing opacity value is replaced entirely."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Determine if any existing opacity should be overwritten or multiplied.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"决定是覆盖现有不透明度，还是与之相乘。"},"zh-Hant":{"decision":"translate","text":"決定是覆蓋現有的不透明度，還是與之相乘。"},"ja_JP":{"decision":"translate","text":"既存の不透明度を上書きするか、乗算するかを決めます。"}}
    },
    {
      "key": "attrInfo:subMesh.pivotPosition", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","pivotPosition","tooltip"],
      "source": "When Recalculate Pivot is checked, position the pivots by aligning them to each child-mesh’s bounding box.", "notes": ["\"Bounding box\" is the smallest rectangle enclosing a shape, a geometry term."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When Recalculate Pivot is checked, position the pivots by aligning them to each child-mesh’s bounding box.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"勾选重新计算锚点后，按每个子网格的边界框对齐来放置锚点。"},"zh-Hant":{"decision":"translate","text":"勾選重新計算錨點後，依每個子網格的邊界框對齊來放置錨點。"},"ja_JP":{"decision":"translate","text":"「ピボットを再計算」がオンのとき、各子メッシュの境界ボックスに合わせてピボットを配置します。"}}
    },
    {
      "key": "attrInfo:subMesh.shapeOpacity", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeOpacity","tooltip"],
      "source": "Set the opacity for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "notes": ["\"Opacity\" is the visual transparency level (0 = invisible, 1 = solid)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the opacity for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置子网格的不透明度。连接行为（例如随机、错开），即可为每个子网格应用不同的值。"},"zh-Hant":{"decision":"translate","text":"設定子網格的不透明度。連接行為（例如隨機、錯開），即可為每個子網格套用不同的值。"},"ja_JP":{"decision":"translate","text":"子メッシュの不透明度を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"}}
    },
    {
      "key": "attrInfo:subMesh.shapePosition", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapePosition","tooltip"],
      "source": "Set the position for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "notes": ["\"Stagger\" is a Behaviour node that offsets values sequentially across items."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the position for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置子网格的位置。连接行为（例如随机、错开），即可为每个子网格应用不同的值。"},"zh-Hant":{"decision":"translate","text":"設定子網格的位置。連接行為（例如隨機、錯開），即可為每個子網格套用不同的值。"},"ja_JP":{"decision":"translate","text":"子メッシュの位置を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"}}
    },
    {
      "key": "attrInfo:subMesh.shapeRotation", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeRotation","tooltip"],
      "source": "Set the rotation for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "notes": ["\"Rotation\" here is the angle a shape is turned to."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the rotation for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置子网格的旋转。连接行为（例如随机、错开），即可为每个子网格应用不同的值。"},"zh-Hant":{"decision":"translate","text":"設定子網格的旋轉。連接行為（例如隨機、錯開），即可為每個子網格套用不同的值。"},"ja_JP":{"decision":"translate","text":"子メッシュの回転を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"}}
    },
    {
      "key": "attrInfo:subMesh.shapeScale", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeScale","tooltip"],
      "source": "Set the scale for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "notes": ["\"Scale\" here refers to relative size (e.g. 1.0 = original size)."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the scale for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置子网格的缩放。连接行为（例如随机、错开），即可为每个子网格应用不同的值。"},"zh-Hant":{"decision":"translate","text":"設定子網格的縮放。連接行為（例如隨機、錯開），即可為每個子網格套用不同的值。"},"ja_JP":{"decision":"translate","text":"子メッシュのスケールを設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"}}
    },
    {
      "key": "attrInfo:subMesh.shapeTimeOffset", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeTimeOffset","tooltip"],
      "source": "Set a time offset, in frames, for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "notes": ["\"Frames\" are units of animation time."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set a time offset, in frames, for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置子网格的时间偏移，单位为帧。连接行为（例如随机、错开），即可为每个子网格应用不同的值。"},"zh-Hant":{"decision":"translate","text":"設定子網格的時間偏移，單位為幀。連接行為（例如隨機、錯開），即可為每個子網格套用不同的值。"},"ja_JP":{"decision":"translate","text":"子メッシュの時間オフセットをフレーム単位で設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"}}
    },
    {
      "key": "attrInfo:subMesh.shapeVisibility", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeVisibility","tooltip"],
      "source": "Set the visibility for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "notes": ["\"Visibility\" toggles whether the shape is rendered/shown, unrelated to visibility in fog or weather."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Set the visibility for the child-meshes. Connect a Behaviour (e.g. Random, Stagger) to apply different values per child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"设置子网格的可见性。连接行为（例如随机、错开），即可为每个子网格应用不同的值。"},"zh-Hant":{"decision":"translate","text":"設定子網格的可見性。連接行為（例如隨機、錯開），即可為每個子網格套用不同的值。"},"ja_JP":{"decision":"translate","text":"子メッシュの可視性を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"}}
    },
    {
      "key": "attrInfo:subMesh.stroke", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","stroke","tooltip"],
      "source": "When checked the Sub-Mesh will overwrite the Stroke for the Shapes it is connected to with the Color and/or Shaders set in this tab.", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape; \"Stroke\" is a shape’s outline; \"Shaders\" refers to procedural texture/colour effects, a graphics term."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When checked the Sub-Mesh will overwrite the Stroke for the Shapes it is connected to with the Color and/or Shaders set in this tab.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"勾选后，子网格会用此标签页中设置的颜色和/或着色器，覆盖所连接形状的描边。"},"zh-Hant":{"decision":"translate","text":"勾選後，子網格會以此標籤頁中設定的顏色和/或著色器，覆蓋所連接形狀的描邊。"},"ja_JP":{"decision":"translate","text":"オンにすると、サブメッシュは、このタブで設定したカラーおよび／またはシェーダーで、接続先シェイプのストロークを上書きします。"}}
    },
    {
      "key": "attrInfo:subMesh.strokeBehaviours", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","strokeBehaviours","tooltip"],
      "source": "Connect a Material Override Layer in order to blend between the original Stroke color and the values set by the Override.", "notes": ["\"Stroke\" is a shape’s outline."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Connect a Material Override Layer in order to blend between the original Stroke color and the values set by the Override.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"连接材质覆盖图层，以便在原始描边颜色与覆盖所设置的值之间混合。"},"zh-Hant":{"decision":"translate","text":"連接材質覆蓋圖層，以便在原始描邊顏色與覆蓋所設定的值之間混合。"},"ja_JP":{"decision":"translate","text":"マテリアルオーバーライドレイヤーを接続し、元のストロークのカラーとオーバーライドで設定した値との間をブレンドします。"}}
    },
    {
      "key": "attrInfo:subMesh.strokeReplacementMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","strokeReplacementMode","tooltip"],
      "source": "Determine how materials are replaced by targeting certain conditions.", "notes": ["\"Materials\" here refers to the stroke’s colour/texture."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "Determine how materials are replaced by targeting certain conditions.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"按特定条件决定如何替换材质。"},"zh-Hant":{"decision":"translate","text":"依特定條件決定如何替換材質。"},"ja_JP":{"decision":"translate","text":"特定の条件を対象に、マテリアルをどのように置換するかを決めます。"}}
    },
    {
      "key": "attrInfo:subMesh.transformAroundCenter", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","transformAroundCenter","tooltip"],
      "source": "When checked, use the <b>Pivot Position</b> to align the pivot for each child-mesh.", "notes": ["\"Pivot\" is the point a shape rotates/scales around."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When checked, use the <b>Pivot Position</b> to align the pivot for each child-mesh.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"勾选后，使用<b>锚点位置</b>对齐每个子网格的锚点。"},"zh-Hant":{"decision":"translate","text":"勾選後，使用<b>錨點位置</b>對齊每個子網格的錨點。"},"ja_JP":{"decision":"translate","text":"オンにすると、<b>ピボット位置</b>で各子メッシュのピボットを揃えます。"}}
    },
    {
      "key": "attrInfo:subMesh.useIndex", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","useIndex","tooltip"],
      "source": "When checked, the Sub-Mesh will pull ‘Context’ and pass a unique value to each child-mesh. Unchecking this attribute will result in all child-meshes being passed the same values.", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape; \"Context\" is the technical term for per-copy data passed to each duplicate."], "sourceRole": "attribute-info", "displayRole": "attribute-info",
      "dontTranslate": false, "vendorJapanese": "When checked, the Sub-Mesh will pull ‘Context’ and pass a unique value to each child-mesh. Unchecking this attribute will result in all child-meshes being passed the same values.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"勾选后，子网格会读取“上下文”，并向每个子网格传递唯一值。取消勾选此属性后，所有子网格都会得到相同的值。"},"zh-Hant":{"decision":"translate","text":"勾選後，子網格會讀取「上下文」，並向每個子網格傳遞唯一值。取消勾選此屬性後，所有子網格都會得到相同的值。"},"ja_JP":{"decision":"translate","text":"オンにすると、サブメッシュは「コンテキスト」を取得し、各子メッシュに固有の値を渡します。この属性をオフにすると、すべての子メッシュに同じ値が渡されます。"}}
    },
    {
      "key": "nodeAttr:subMesh.deformers", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","deformers","name"],
      "source": "Deformers", "notes": ["As in \"Deformers\" — nodes that reshape geometry (e.g. bulge, bend)."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Deformers", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"变形器"},"zh-Hant":{"decision":"translate","text":"變形器"},"ja_JP":{"decision":"translate","text":"デフォーマ"}}
    },
    {
      "key": "nodeAttr:subMesh.fillBehaviours", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","fillBehaviours","name"],
      "source": "Fill Overrides", "notes": ["\"Fill\" is a shape’s interior colour/texture, as a noun."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Fill Overrides", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"填充覆盖"},"zh-Hant":{"decision":"translate","text":"填充覆蓋"},"ja_JP":{"decision":"translate","text":"塗りオーバーライド"}}
    },
    {
      "key": "nodeAttr:subMesh.fillReplacementMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","fillReplacementMode","name"],
      "source": "Replacement Mode", "notes": ["As in \"Replacement Mode\" — how a shape’s fill colour is substituted."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Replacement Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"替换模式"},"zh-Hant":{"decision":"translate","text":"替換模式"},"ja_JP":{"decision":"translate","text":"置換モード"}}
    },
    {
      "key": "nodeAttr:subMesh.filters", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","filters","name"],
      "source": "Filters", "notes": ["\"Filters\" is a plural noun: a list of image-processing effects, such as Blur or Drop Shadow."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Filters", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"滤镜"},"zh-Hant":{"decision":"translate","text":"濾鏡"},"ja_JP":{"decision":"translate","text":"フィルター"}}
    },
    {
      "key": "nodeAttr:subMesh.flattenMeshAtLevel", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","flattenMeshAtLevel","name"],
      "source": "Flatten Mesh at Level", "notes": ["\"Flatten\" is a verb: merge nested geometry levels into one."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Flatten Mesh at Level", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"在指定层级展平网格"},"zh-Hant":{"decision":"translate","text":"在指定層級展平網格"},"ja_JP":{"decision":"translate","text":"指定レベルでメッシュをフラット化"}}
    },
    {
      "key": "nodeAttr:subMesh.indexMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","indexMode","name"],
      "source": "Index Mode", "notes": ["\"Index\" is a per-copy identifying number assigned to each duplicated child-mesh."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Index Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"索引模式"},"zh-Hant":{"decision":"translate","text":"索引模式"},"ja_JP":{"decision":"translate","text":"インデックスモード"}}
    },
    {
      "key": "nodeAttr:subMesh.levelMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","levelMode","name"],
      "source": "Level Mode", "notes": ["\"Level\" refers to a hierarchy tier within the shape’s internal structure."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Level Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"层级模式"},"zh-Hant":{"decision":"translate","text":"層級模式"},"ja_JP":{"decision":"translate","text":"レベルモード"}}
    },
    {
      "key": "nodeAttr:subMesh.levels", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","levels","name"],
      "source": "Custom Level Range", "notes": ["\"Level\" refers to a hierarchy tier within the shape’s internal structure."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Custom Level Range", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"自定义层级范围"},"zh-Hant":{"decision":"translate","text":"自訂層級範圍"},"ja_JP":{"decision":"translate","text":"カスタムレベル範囲"}}
    },
    {
      "key": "nodeAttr:subMesh.material", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","material","name"],
      "source": "Replace Fill", "notes": ["\"Fill\" is a shape’s interior colour/texture, as a noun."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Replace Fill", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"替换填充"},"zh-Hant":{"decision":"translate","text":"替換填充"},"ja_JP":{"decision":"translate","text":"塗りを置換"}}
    },
    {
      "key": "nodeAttr:subMesh.mode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","mode","name"],
      "source": "Geometry Mode", "notes": ["As in \"Geometry Mode\" — a setting affecting how shape geometry is handled."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Geometry Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"几何模式"},"zh-Hant":{"decision":"translate","text":"幾何模式"},"ja_JP":{"decision":"translate","text":"ジオメトリモード"}}
    },
    {
      "key": "nodeAttr:subMesh.opacityMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","opacityMode","name"],
      "source": "Opacity Mode", "notes": ["As in \"Opacity Mode\" — how the transparency setting is combined with existing values."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Opacity Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"不透明度模式"},"zh-Hant":{"decision":"translate","text":"不透明度模式"},"ja_JP":{"decision":"translate","text":"不透明度モード"}}
    },
    {
      "key": "nodeAttr:subMesh.pivotPosition", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","pivotPosition","name"],
      "source": "Pivot Position", "notes": ["\"Pivot\" is the point a transform (rotation/scale) is measured from."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Pivot Position", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"锚点位置"},"zh-Hant":{"decision":"translate","text":"錨點位置"},"ja_JP":{"decision":"translate","text":"ピボット位置"}}
    },
    {
      "key": "nodeAttr:subMesh.shapeOpacity", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeOpacity","name"],
      "source": "Opacity", "notes": ["As in \"Opacity\" — how transparent or solid the child-mesh appears."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Opacity", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"不透明度"},"zh-Hant":{"decision":"translate","text":"不透明度"},"ja_JP":{"decision":"translate","text":"不透明度"}}
    },
    {
      "key": "nodeAttr:subMesh.shapePosition", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapePosition","name"],
      "source": "Position", "notes": ["As in \"Position\" — the child-mesh’s location coordinates."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Position", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"位置"},"zh-Hant":{"decision":"translate","text":"位置"},"ja_JP":{"decision":"translate","text":"位置"}}
    },
    {
      "key": "nodeAttr:subMesh.shapeRotation", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeRotation","name"],
      "source": "Rotation", "notes": ["As in \"Rotation\" — the child-mesh’s angular orientation."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Rotation", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"旋转"},"zh-Hant":{"decision":"translate","text":"旋轉"},"ja_JP":{"decision":"translate","text":"回転"}}
    },
    {
      "key": "nodeAttr:subMesh.shapeScale", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeScale","name"],
      "source": "Scale", "notes": ["\"Scale\" is a noun here: the size/zoom factor of the child-mesh."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Scale", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"缩放"},"zh-Hant":{"decision":"translate","text":"縮放"},"ja_JP":{"decision":"translate","text":"スケール"}}
    },
    {
      "key": "nodeAttr:subMesh.shapeTimeOffset", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeTimeOffset","name"],
      "source": "Time Offset", "notes": ["As in \"Time Offset\" — shifting the child-mesh’s animation timing in frames."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Time Offset", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"时间偏移"},"zh-Hant":{"decision":"translate","text":"時間偏移"},"ja_JP":{"decision":"translate","text":"時間オフセット"}}
    },
    {
      "key": "nodeAttr:subMesh.shapeVisibility", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","shapeVisibility","name"],
      "source": "Visibility", "notes": ["As in \"Visibility\" — whether the child-mesh is shown or hidden."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Visibility", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"可见性"},"zh-Hant":{"decision":"translate","text":"可見性"},"ja_JP":{"decision":"translate","text":"可視性"}}
    },
    {
      "key": "nodeAttr:subMesh.stroke", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","stroke","name"],
      "source": "Replace Stroke", "notes": ["\"Stroke\" is a shape’s outline, as a noun."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Replace Stroke", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"替换描边"},"zh-Hant":{"decision":"translate","text":"替換描邊"},"ja_JP":{"decision":"translate","text":"ストロークを置換"}}
    },
    {
      "key": "nodeAttr:subMesh.strokeBehaviours", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","strokeBehaviours","name"],
      "source": "Stroke Overrides", "notes": ["\"Stroke\" is a shape’s outline, as a noun."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Stroke Overrides", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"描边覆盖"},"zh-Hant":{"decision":"translate","text":"描邊覆蓋"},"ja_JP":{"decision":"translate","text":"ストロークオーバーライド"}}
    },
    {
      "key": "nodeAttr:subMesh.strokeReplacementMode", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","strokeReplacementMode","name"],
      "source": "Replacement Mode", "notes": ["As in \"Replacement Mode\" — how a shape’s outline (stroke) colour is substituted."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Replacement Mode", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"替换模式"},"zh-Hant":{"decision":"translate","text":"替換模式"},"ja_JP":{"decision":"translate","text":"置換モード"}}
    },
    {
      "key": "nodeAttr:subMesh.transformAroundCenter", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","transformAroundCenter","name"],
      "source": "Recalculate Pivot", "notes": ["\"Pivot\" is the point a transform (rotation/scale) is measured from."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Recalculate Pivot", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"重新计算锚点"},"zh-Hant":{"decision":"translate","text":"重新計算錨點"},"ja_JP":{"decision":"translate","text":"ピボットを再計算"}}
    },
    {
      "key": "nodeAttr:subMesh.useIndex", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["attributes","useIndex","name"],
      "source": "Use Index Context", "notes": ["\"Index\" identifies each individual copy among the duplicated child-meshes; \"Context\" is the technical term for that per-copy data."], "sourceRole": "attribute-label", "displayRole": "attribute-label",
      "dontTranslate": false, "vendorJapanese": "Use Index Context", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"使用索引上下文"},"zh-Hant":{"decision":"translate","text":"使用索引上下文"},"ja_JP":{"decision":"translate","text":"インデックスコンテキストを使用"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.fillReplacementMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","fillReplacementMode","0"],
      "source": "Replace All", "notes": ["As in \"Replace All\" — every child-mesh’s fill is overwritten regardless of whether it already has one."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Replace All", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"全部替换"},"zh-Hant":{"decision":"translate","text":"全部替換"},"ja_JP":{"decision":"translate","text":"すべて置換"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.fillReplacementMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","fillReplacementMode","1"],
      "source": "Replace Missing", "notes": ["As in \"Replace Missing\" — only child-meshes without an existing fill get one applied."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Replace Missing", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"未设置时替换"},"zh-Hant":{"decision":"translate","text":"未設定時替換"},"ja_JP":{"decision":"translate","text":"未設定時に置換"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.fillReplacementMode.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","fillReplacementMode","2"],
      "source": "Replace Existing", "notes": ["As in \"Replace Existing\" — only child-meshes that already have a fill get it overwritten."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Replace Existing", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"替换现有"},"zh-Hant":{"decision":"translate","text":"替換現有"},"ja_JP":{"decision":"translate","text":"既存を置換"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.indexMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","indexMode","0"],
      "source": "Unique Index", "notes": ["Every child-mesh gets its own distinct index value."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Unique Index", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"唯一索引"},"zh-Hant":{"decision":"translate","text":"唯一索引"},"ja_JP":{"decision":"translate","text":"一意のインデックス"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.indexMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","indexMode","1"],
      "source": "Child Index", "notes": ["The index is unique per parent mesh."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Child Index", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"子级索引"},"zh-Hant":{"decision":"translate","text":"子級索引"},"ja_JP":{"decision":"translate","text":"子インデックス"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.levelMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","levelMode","0"],
      "source": "Custom...", "notes": ["The ellipsis indicates this option reveals a custom level setting."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Custom...", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"自定义..."},"zh-Hant":{"decision":"translate","text":"自訂..."},"ja_JP":{"decision":"translate","text":"カスタム..."}}
    },
    {
      "key": "nodeAttrEnum:subMesh.levelMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","levelMode","1"],
      "source": "Text (Lines)", "notes": ["Groups by each line of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Lines)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（行）"},"zh-Hant":{"decision":"translate","text":"文字（行）"},"ja_JP":{"decision":"translate","text":"テキスト（行）"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.levelMode.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","levelMode","2"],
      "source": "Text (Words)", "notes": ["Groups by each word of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Words)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（词）"},"zh-Hant":{"decision":"translate","text":"文字（詞）"},"ja_JP":{"decision":"translate","text":"テキスト（単語）"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.levelMode.3", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","levelMode","3"],
      "source": "Text (Characters)", "notes": ["Groups by each individual character of text."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Text (Characters)", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"文本（字符）"},"zh-Hant":{"decision":"translate","text":"文字（字元）"},"ja_JP":{"decision":"translate","text":"テキスト（文字）"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.levelMode.4", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","levelMode","4"],
      "source": "All", "notes": ["As in the \"All\" level option — the effect applies to every nesting level."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "All", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"全部"},"zh-Hant":{"decision":"translate","text":"全部"},"ja_JP":{"decision":"translate","text":"すべて"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.mode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","mode","0"],
      "source": "Sub-Meshes", "notes": ["\"Sub-Meshes\" refers to nested/repeated pieces of geometry within a Shape."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Sub-Meshes", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"子网格"},"zh-Hant":{"decision":"translate","text":"子網格"},"ja_JP":{"decision":"translate","text":"サブメッシュ"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.mode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","mode","1"],
      "source": "Polygons", "notes": ["\"Polygons\" here means each individual sub-path is treated as its own repeatable unit."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Polygons", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"多边形"},"zh-Hant":{"decision":"translate","text":"多邊形"},"ja_JP":{"decision":"translate","text":"ポリゴン"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.opacityMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","opacityMode","0"],
      "source": "Replace", "notes": ["\"Replace\" is a verb: overwrite the existing opacity."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Replace", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"替换"},"zh-Hant":{"decision":"translate","text":"替換"},"ja_JP":{"decision":"translate","text":"置換"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.opacityMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","opacityMode","1"],
      "source": "Multiply Existing", "notes": ["As in \"Multiply Existing\" — the new opacity value is multiplied with the shape’s current opacity."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Multiply Existing", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"乘以现有值"},"zh-Hant":{"decision":"translate","text":"乘以現有值"},"ja_JP":{"decision":"translate","text":"既存値と乗算"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.strokeReplacementMode.0", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","strokeReplacementMode","0"],
      "source": "Replace All", "notes": ["As in \"Replace All\" — every child-mesh’s stroke (outline) is overwritten regardless of whether it already has one."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Replace All", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"全部替换"},"zh-Hant":{"decision":"translate","text":"全部替換"},"ja_JP":{"decision":"translate","text":"すべて置換"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.strokeReplacementMode.1", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","strokeReplacementMode","1"],
      "source": "Replace Missing", "notes": ["As in \"Replace Missing\" — only child-meshes without an existing stroke get one applied."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Replace Missing", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"未设置时替换"},"zh-Hant":{"decision":"translate","text":"未設定時替換"},"ja_JP":{"decision":"translate","text":"未設定時に置換"}}
    },
    {
      "key": "nodeAttrEnum:subMesh.strokeReplacementMode.2", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["enums","strokeReplacementMode","2"],
      "source": "Replace Existing", "notes": ["As in \"Replace Existing\" — only child-meshes that already have a stroke get it overwritten."], "sourceRole": "enum-label", "displayRole": "enum-label",
      "dontTranslate": false, "vendorJapanese": "Replace Existing", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"替换现有"},"zh-Hant":{"decision":"translate","text":"替換現有"},"ja_JP":{"decision":"translate","text":"既存を置換"}}
    },
    {
      "key": "nodeInfo:subMesh", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["info","tooltip"],
      "source": "Access the child-meshes within Shapes to apply transforms, materials and more.", "notes": ["\"Child-meshes\" are nested sub-shapes within a parent shape’s geometry hierarchy."], "sourceRole": "node-info", "displayRole": "node-info",
      "dontTranslate": false, "vendorJapanese": "Access the child-meshes within Shapes to apply transforms, materials and more.", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"访问形状内的子网格，以应用变换、材质等。"},"zh-Hant":{"decision":"translate","text":"存取形狀內的子網格，以套用變換、材質等。"},"ja_JP":{"decision":"translate","text":"シェイプ内の子メッシュにアクセスし、トランスフォームやマテリアルなどを適用します。"}}
    },
    {
      "key": "nodeName:subMesh", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["info","name"],
      "source": "Sub-Mesh", "notes": ["\"Sub-Mesh\" refers to a nested piece of geometry within a Shape."], "sourceRole": "node-name", "displayRole": "node-name",
      "dontTranslate": false, "vendorJapanese": "Sub-Mesh", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"子网格"},"zh-Hant":{"decision":"translate","text":"子網格"},"ja_JP":{"decision":"translate","text":"サブメッシュ"}}
    },
    {
      "key": "nodeTab:subMesh.advanced", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["tabs","advanced"],
      "source": "Advanced", "notes": ["As in an \"Advanced\" settings tab for extra, less commonly used options."], "sourceRole": "tab-label", "displayRole": "tab-label",
      "dontTranslate": false, "vendorJapanese": "Advanced", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"高级"},"zh-Hant":{"decision":"translate","text":"進階"},"ja_JP":{"decision":"translate","text":"詳細"}}
    },
    {
      "key": "nodeTab:subMesh.fill", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["tabs","fill"],
      "source": "Fill", "notes": ["\"Fill\" is a shape’s interior colour/texture, as a noun."], "sourceRole": "tab-label", "displayRole": "tab-label",
      "dontTranslate": false, "vendorJapanese": "Fill", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"填充"},"zh-Hant":{"decision":"translate","text":"填充"},"ja_JP":{"decision":"translate","text":"塗り"}}
    },
    {
      "key": "nodeTab:subMesh.stroke", "catalogId": "Definitions/Translation/nodeStrings", "owner": "subMesh", "fieldPath": ["tabs","stroke"],
      "source": "Stroke", "notes": ["\"Stroke\" is a shape’s outline, as a noun."], "sourceRole": "tab-label", "displayRole": "tab-label",
      "dontTranslate": false, "vendorJapanese": "Stroke", "vendorJapaneseChanged": false,
      "translations": {"zh-Hans":{"decision":"translate","text":"描边"},"zh-Hant":{"decision":"translate","text":"描邊"},"ja_JP":{"decision":"translate","text":"ストローク"}}
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
