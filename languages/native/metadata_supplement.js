/**
 * [INPUT]: 依赖官方 2.8 四份脚本 MetaData 源与签名上下文、宝玉 Skill 驱动 AGY 修订、Grok 独立审稿
 * [OUTPUT]: 提供 34 条真正新增 description 的源绑定三语审定输入，不提供函数签名或运行时包
 * [POS]: 仅替换脚本帮助description；顿号空格支持QLabel自然断词，不混入原生UI ICU registry
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 帮助说明：机器 schema 和模板保持原样 ----------------------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "catalogPaths": [
      "MetaData/api_function_metadata.json",
      "MetaData/core_api_function_metadata.json",
      "MetaData/gui_api_function_metadata.json"
    ],
    "sourcePairsSha256": "7aa91f15e69264edb068cd57fa23d27f0b985c159c61b1d67f3e70b5fa73fa97",
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "independentReviewProvider": "Grok CLI",
    "approvedBy": "primary-agent",
    "reviewScope": "New description source/context/technical templates; no live help/layout acceptance."
  },
  entries: [
    { key: "api_function_metadata.json#/addSceneSwatch/description", source: "Adds a colour swatch to the Scene Palette and returns its array index. `color` is any string Cavalry can parse (e.g. \"#ff2266\"). `name` is the swatch label; if omitted, a name is derived from the closest named colour. Connect from \"<paletteId>.array.<index>\" (paletteId from getScenePalette()) into a material's materialColor to share the swatch across shapes.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "向场景调色板添加一个色样并返回其数组索引。`color` 为 Cavalry 可解析的任意字符串（例如 \"#ff2266\"）。`name` 为色样标签；若省略，则根据最接近的具名颜色自动派生名称。可从 \"<paletteId>.array.<index>\"（paletteId 来自 getScenePalette()）连接到材质的 materialColor，以在多个形状间共享该色样。"},
        "zh-Hant": {"decision": "translate", "text": "向場景調色盤新增一個色票並傳回其陣列索引。`color` 為 Cavalry 可解析的任意字串（例如 \"#ff2266\"）。`name` 為色票標籤；若省略，則根據最接近的具名顏色自動衍生名稱。可從 \"<paletteId>.array.<index>\"（paletteId 來自 getScenePalette()）連接到材質的 materialColor，以在多個形狀間共用該色票。"},
        ja_JP: {"decision": "translate", "text": "シーンパレットにカラースウォッチを追加し、その配列インデックスを返します。`color` は Cavalry が解析可能な任意の文字列です（例: \"#ff2266\"）。`name` はスウォッチのラベルです。省略した場合は、最も近い名前付きカラーから名前が自動導出されます。\"<paletteId>.array.<index>\"（paletteId は getScenePalette() から取得）からマテリアルの materialColor に接続して、複数のシェイプ間でスウォッチを共有します。"} }
    },
    { key: "api_function_metadata.json#/addSwatchToPalette/description", source: "Adds a swatch to a saved palette and re-saves the .pal file. swatchName auto-derives from the closest named colour if omitted. Refuses non-.pal palettes (.ase/.theme are read-only). Returns the new swatch's uid.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "向已保存的调色板添加色样并重新保存 .pal 文件。若省略 swatchName，则根据最接近的具名颜色自动派生。拒绝非 .pal 调色板（.ase/.theme 为只读）。返回新色样的 uid。"},
        "zh-Hant": {"decision": "translate", "text": "向已儲存的調色盤新增色票並重新儲存 .pal 檔案。若省略 swatchName，則根據最接近的具名顏色自動衍生。拒絕非 .pal 調色盤（.ase/.theme 為唯讀）。傳回新色票的 uid。"},
        ja_JP: {"decision": "translate", "text": "保存されているパレットにスウォッチを追加し、.pal ファイルを再保存します。swatchName を省略した場合は、最も近い名前付きカラーから自動導出されます。.pal 以外のパレットは拒否されます（.ase/.theme は読み取り専用）。新しいスウォッチの uid を返します。"} }
    },
    { key: "api_function_metadata.json#/controlCentreSetLayout/description", source: "Replaces the scene-wide Control Centre layout with the supplied JSON-encoded items array.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "将整个场景的控制中心布局替换为所提供的 JSON 编码的 items 数组。"},
        "zh-Hant": {"decision": "translate", "text": "將全場景的控制中心版面配置取代為所提供的 JSON 編碼 items 陣列。"},
        ja_JP: {"decision": "translate", "text": "シーン全体のコントロールセンターのレイアウトを、指定された JSON エンコード済みの items 配列で置き換えます。"} }
    },
    { key: "api_function_metadata.json#/createColorArrayFromPalette/description", source: "Creates a colorArray layer populated from a named palette's swatches, mirroring the Color Window's \"Create Array From Palette\" action. Returns the new layer's id. scope is \"library\" or \"project\"; both tiers are searched if omitted.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "根据指定调色板的色样填充并创建 colorArray 图层，对应颜色窗口的“从调色板创建数组”操作。返回新图层的 id。scope 为 \"library\" 或 \"project\"；若省略，则搜索这两个层级。"},
        "zh-Hant": {"decision": "translate", "text": "根據指定調色盤的色票填入並建立 colorArray 圖層，對應顏色視窗的「從調色盤建立陣列」操作。傳回新圖層的 id。scope 為 \"library\" 或 \"project\"；若省略，則搜尋這兩個層級。"},
        ja_JP: {"decision": "translate", "text": "指定したパレットのスウォッチから生成された colorArray レイヤーを作成します。カラーウィンドウの「パレットから配列を作成」操作に対応します。新しいレイヤーの id を返します。scope には \"library\" または \"project\" を指定します。省略した場合は両方の階層が検索されます。"} }
    },
    { key: "api_function_metadata.json#/createPalette/description", source: "Creates a new .pal palette file in the library or project palette folder. swatches is Array<string|Object> — strings are colour values; objects are {color, name?}. metadata is {author?, website?, overwrite?}. Returns the new file path. Refuses to overwrite an existing palette unless metadata.overwrite is true.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "在库或项目调色板文件夹中创建新的 .pal 调色板文件。swatches 为 Array<string|Object> —— 字符串为颜色值；对象为 {color, name?}。metadata 为 {author?, website?, overwrite?}。返回新文件路径。除非 metadata.overwrite 为 true，否则拒绝覆盖现有调色板。"},
        "zh-Hant": {"decision": "translate", "text": "在調色盤資料庫或專案調色盤資料夾中建立新的 .pal 調色盤檔案。swatches 為 Array<string|Object> —— 字串為顏色值；物件為 {color, name?}。metadata 為 {author?, website?, overwrite?}。傳回新檔案路徑。除非 metadata.overwrite 為 true，否則拒絕覆寫現有調色盤。"},
        ja_JP: {"decision": "translate", "text": "ライブラリまたはプロジェクトのパレットフォルダーに新しい .pal パレットファイルを作成します。swatches は Array<string|Object> です（文字列はカラー値、オブジェクトは {color, name?}）。metadata は {author?, website?, overwrite?} です。新しいファイルパスを返します。metadata.overwrite が true でない限り、既存のパレットの上書きは拒否されます。"} }
    },
    { key: "api_function_metadata.json#/deletePalette/description", source: "Deletes a palette file from the library or project palettes folder. scope must be explicit (\"library\" or \"project\") to prevent accidental cross-tier deletion. Returns true on success.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "从库或项目调色板文件夹中删除调色板文件。scope 必须显式指定（\"library\" 或 \"project\"），以防止意外跨层级删除。成功时返回 true。"},
        "zh-Hant": {"decision": "translate", "text": "從調色盤資料庫或專案調色盤資料夾中刪除調色盤檔案。scope 必須明確指定（\"library\" 或 \"project\"），以防止意外跨層級刪除。成功時傳回 true。"},
        ja_JP: {"decision": "translate", "text": "ライブラリまたはプロジェクトのパレットフォルダーからパレットファイルを削除します。異なる階層での誤削除を防ぐため、scope は明示的に指定する必要があります（\"library\" または \"project\"）。成功した場合は true を返します。"} }
    },
    { key: "api_function_metadata.json#/generateHarmoniousPalette/description", source: "Generates a harmonious palette of hex colours from a base colour. type is \"monochromatic\", \"analogous\", \"complementary\", \"splitComplementary\", \"triadic\", \"square\", \"rectangular\", \"circular\", or \"goldenRatio\". options.harmonic=true and options.colorSpace=\"RGB\"|\"LAB\" are honoured. count is clamped to the same per-type maxima used by the Color Window's Generator.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "根据基础颜色生成协调的十六进制颜色调色板。type 可以是 \"monochromatic\"、 \"analogous\"、 \"complementary\"、 \"splitComplementary\"、 \"triadic\"、 \"square\"、 \"rectangular\"、 \"circular\" 或 \"goldenRatio\"。支持 options.harmonic=true 以及 options.colorSpace=\"RGB\"|\"LAB\"。count 会被限制在颜色窗口生成器所采用的各类型最大值以内。"},
        "zh-Hant": {"decision": "translate", "text": "根據基礎顏色產生協調的十六進位顏色調色盤。type 可以是 \"monochromatic\"、 \"analogous\"、 \"complementary\"、 \"splitComplementary\"、 \"triadic\"、 \"square\"、 \"rectangular\"、 \"circular\" 或 \"goldenRatio\"。支援 options.harmonic=true 以及 options.colorSpace=\"RGB\"|\"LAB\"。count 會被限制在顏色視窗產生器所採用的各類型最大值以內。"},
        ja_JP: {"decision": "translate", "text": "ベースカラーから調和のとれた 16 進数カラーのパレットを生成します。type には \"monochromatic\"、 \"analogous\"、 \"complementary\"、 \"splitComplementary\"、 \"triadic\"、 \"square\"、 \"rectangular\"、 \"circular\"、 または \"goldenRatio\" を指定します。options.harmonic=true および options.colorSpace=\"RGB\"|\"LAB\" に対応しています。count はカラーウィンドウのジェネレーターで使用されるタイプごとの最大値と同じ範囲に制限されます。"} }
    },
    { key: "api_function_metadata.json#/getAssetURI/description", source: "Returns the URI of an asset. For file based assets this is the absolute file path.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "返回资源的 URI。对于基于文件的资源，此项为绝对文件路径。"},
        "zh-Hant": {"decision": "translate", "text": "傳回素材的 URI。對於基於檔案的素材，此項為絕對檔案路徑。"},
        ja_JP: {"decision": "translate", "text": "アセットの URI を返します。ファイルベースのアセットの場合、これは絶対ファイルパスになります。"} }
    },
    { key: "api_function_metadata.json#/getLibraryPalettePath/description", source: "Retrieves the path of the user's shared palette library folder. Palettes here are visible to every project (the \"library\" tier in listPalettes/createPalette/etc.).",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "获取用户共享调色板库文件夹的路径。此处的调色板对所有项目均可见（即 listPalettes/createPalette/etc. 中的 \"library\" 层级）。"},
        "zh-Hant": {"decision": "translate", "text": "擷取使用者共用調色盤資料庫資料夾的路徑。此處的調色盤對所有專案皆可見（即 listPalettes/createPalette/etc. 中的 \"library\" 層級）。"},
        ja_JP: {"decision": "translate", "text": "ユーザーの共有パレットライブラリフォルダーのパスを取得します。ここにあるパレットはすべてのプロジェクトから参照できます（listPalettes/createPalette/etc. における \"library\" 階層）。"} }
    },
    { key: "api_function_metadata.json#/getMagicEasing/description", source: "Returns the Magic Easing name set on an Attribute's keyframe (and its custom expression, if the easing is \"Custom\") — or null if the Attribute isn't keyframed or has no keyframe on that frame.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "返回属性关键帧上设置的魔法缓动名称（若缓动为 \"Custom\"，还包括其自定义表达式）；如果该属性未设置关键帧或在该帧上没有关键帧，则返回 null。"},
        "zh-Hant": {"decision": "translate", "text": "傳回屬性關鍵幀上設定的魔法緩動名稱（若緩動為 \"Custom\"，還包括其自訂運算式）；如果該屬性未設定關鍵幀或在該幀上沒有關鍵幀，則傳回 null。"},
        ja_JP: {"decision": "translate", "text": "属性のキーフレームに設定されているマジックイージング名（イージングが \"Custom\" の場合はそのカスタムエクスプレッションも含む）を返します。属性にキーフレームが設定されていない場合、またはそのフレームにキーフレームがない場合は null を返します。"} }
    },
    { key: "api_function_metadata.json#/getPalette/description", source: "Returns a palette by name: {name, scope, path, author, website, version, swatches: [{name, hex, uid}]} — or null if not found. `scope` is \"library\" or \"project\"; if omitted, both tiers are searched (library first).",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "按名称返回调色板：{name, scope, path, author, website, version, swatches: [{name, hex, uid}]} —— 未找到时返回 null。`scope` 为 \"library\" 或 \"project\"；若省略，则搜索这两个层级（优先搜索 library）。"},
        "zh-Hant": {"decision": "translate", "text": "依名稱傳回調色盤：{name, scope, path, author, website, version, swatches: [{name, hex, uid}]} —— 未找到時傳回 null。`scope` 為 \"library\" 或 \"project\"；若省略，則搜尋這兩個層級（優先搜尋 library）。"},
        ja_JP: {"decision": "translate", "text": "名前でパレットを取得して返します: {name, scope, path, author, website, version, swatches: [{name, hex, uid}]} —— 見つからない場合は null を返します。`scope` には \"library\" または \"project\" を指定します。省略した場合は両方の階層が検索されます（library が優先）。"} }
    },
    { key: "api_function_metadata.json#/getScenePalette/description", source: "Retrieves the ID of the Scene Palette — a colorArray node that holds swatches shared across the scene. Combine with addSceneSwatch / removeSceneSwatch to manage swatches, then api.connect from \"<paletteId>.array.<index>\" into a material's materialColor to drive several shapes off one swatch (changing the swatch updates everything connected to it).",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "获取场景调色板的 ID —— 这是一个保存整个场景共享色样的 colorArray 节点。可结合 addSceneSwatch / removeSceneSwatch 管理色样，然后通过 api.connect 将 \"<paletteId>.array.<index>\" 连接到材质的 materialColor，从而由单个色样驱动多个形状（修改该色样会更新与其连接的所有对象）。"},
        "zh-Hant": {"decision": "translate", "text": "擷取場景調色盤的 ID —— 這是一個保存整個場景共用色票的 colorArray 節點。可結合 addSceneSwatch / removeSceneSwatch 管理色票，然後透過 api.connect 將 \"<paletteId>.array.<index>\" 連接到材質的 materialColor，從而由單個色票驅動多個形狀（修改該色票會更新與其連接的所有物件）。"},
        ja_JP: {"decision": "translate", "text": "シーンパレットの ID（シーン全体で共有されるスウォッチを保持する colorArray ノード）を取得します。addSceneSwatch / removeSceneSwatch と組み合わせてスウォッチを管理し、api.connect で \"<paletteId>.array.<index>\" からマテリアルの materialColor に接続することで、1 つのスウォッチから複数のシェイプを制御できます（スウォッチを変更すると接続されているすべての要素が更新されます）。"} }
    },
    { key: "api_function_metadata.json#/getThirdPartyPluginsFolder/description", source: "Retrieves the folder where installPlugin and writePluginFile place third-party plugins. Useful for inspecting or cleaning up plugins from a script.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "获取 installPlugin 和 writePluginFile 存放第三方插件的文件夹路径。便于通过脚本检查或清理插件。"},
        "zh-Hant": {"decision": "translate", "text": "擷取 installPlugin 和 writePluginFile 存放第三方外掛程式的資料夾路徑。便於透過腳本檢查或清理外掛程式。"},
        ja_JP: {"decision": "translate", "text": "installPlugin および writePluginFile がサードパーティ製プラグインを配置するフォルダーのパスを取得します。スクリプトからプラグインを確認またはクリーンアップする際に役立ちます。"} }
    },
    { key: "api_function_metadata.json#/importPalette/description", source: "Imports a .pal, .ase, or .theme palette file from outside Cavalry into the library or project palettes folder. Returns the destination path. Refuses unsupported extensions and path-traversal attempts.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "将 Cavalry 外部的 .pal、.ase 或 .theme 调色板文件导入库或项目调色板文件夹中。返回目标路径。拒绝不支持的扩展名和路径遍历尝试。"},
        "zh-Hant": {"decision": "translate", "text": "將 Cavalry 外部的 .pal、.ase 或 .theme 調色盤檔案匯入調色盤資料庫或專案調色盤資料夾中。傳回目標路徑。拒絕不受支援的副檔名以及路徑遍歷嘗試。"},
        ja_JP: {"decision": "translate", "text": "Cavalry の外部から .pal、.ase、または .theme パレットファイルをライブラリまたはプロジェクトのパレットフォルダーにインポートします。保存先パスを返します。サポートされていない拡張子やパストラバーサルの試行は拒否されます。"} }
    },
    { key: "api_function_metadata.json#/listPalettes/description", source: "Lists file-backed palettes. `scope` is \"library\", \"project\", or \"all\" (default \"all\"). Returns [{name, scope, path, swatchCount}, ...]. Excludes the scene palette — use getScenePalette() for that.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "列出基于文件的调色板。`scope` 为 \"library\"、\"project\" 或 \"all\"（默认为 \"all\"）。返回 [{name, scope, path, swatchCount}, ...]。不包含场景调色板 —— 获取场景调色板请使用 getScenePalette()。"},
        "zh-Hant": {"decision": "translate", "text": "列出基於檔案的調色盤。`scope` 為 \"library\"、\"project\" 或 \"all\"（預設為 \"all\"）。傳回 [{name, scope, path, swatchCount}, ...]。不包含場景調色盤 —— 取得場景調色盤請使用 getScenePalette()。"},
        ja_JP: {"decision": "translate", "text": "ファイルベースのパレットを一覧表示します。`scope` には \"library\"、\"project\"、または \"all\"（デフォルトは \"all\"）を指定します。[{name, scope, path, swatchCount}, ...] を返します。シーンパレットは除外されます。シーンパレットには getScenePalette() を使用してください。"} }
    },
    { key: "api_function_metadata.json#/loadCanvaSheet/description", source: "Loads a Canva Sheet design as a CSV asset and returns the asset ID. `page` is 1-based; defaults to 1 if omitted.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "将 Canva Sheet 设计加载为 CSV 资源并返回该资源 ID。`page` 从 1 开始计数；若省略则默认为 1。"},
        "zh-Hant": {"decision": "translate", "text": "將 Canva Sheet 設計載入為 CSV 素材並傳回該素材 ID。`page` 從 1 開始計數；若省略則預設為 1。"},
        ja_JP: {"decision": "translate", "text": "Canva Sheet デザインを CSV アセットとして読み込み、アセット ID を返します。`page` は 1 から始まり、省略した場合はデフォルトで 1 になります。"} }
    },
    { key: "api_function_metadata.json#/lookupColor/description", source: "Looks up a colour by name across loaded library and project palettes. Returns [{paletteName, swatchName, hex}, ...] (substring/case-insensitive). options.qualified=true accepts \"Red (Cavalry)\" syntax and returns at most one match.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "在已加载的库调色板和项目调色板中按名称查找颜色。返回 [{paletteName, swatchName, hex}, ...]（子字符串匹配且不区分大小写）。options.qualified=true 接受 \"Red (Cavalry)\" 语法并至多返回一个匹配项。"},
        "zh-Hant": {"decision": "translate", "text": "在已載入的調色盤資料庫與專案調色盤中依名稱尋找顏色。傳回 [{paletteName, swatchName, hex}, ...]（子字串比對且不區分大小寫）。options.qualified=true 接受 \"Red (Cavalry)\" 語法並至多傳回一個相符項。"},
        ja_JP: {"decision": "translate", "text": "読み込まれているライブラリおよびプロジェクトのパレットから名前でカラーを検索します。[{paletteName, swatchName, hex}, ...] を返します（部分一致 / 大文字と小文字を区別しません）。options.qualified=true は \"Red (Cavalry)\" 構文を受け付け、最大 1 つの一致項目を返します。"} }
    },
    { key: "api_function_metadata.json#/removeSceneSwatch/description", source: "Removes the swatch at the given index from the Scene Palette. Indices match those returned by addSceneSwatch. Returns true on success.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "从场景调色板中移除指定索引处的色样。索引与 addSceneSwatch 返回的索引一致。成功时返回 true。"},
        "zh-Hant": {"decision": "translate", "text": "從場景調色盤中移除指定索引處的色票。索引與 addSceneSwatch 傳回的索引相符。成功時傳回 true。"},
        ja_JP: {"decision": "translate", "text": "指定したインデックスのスウォッチをシーンパレットから削除します。インデックスは addSceneSwatch から返されるものと一致します。成功した場合は true を返します。"} }
    },
    { key: "api_function_metadata.json#/removeSwatchFromPalette/description", source: "Removes a swatch from a saved palette and re-saves the .pal file. Pass an integer to remove by index (0-based, in current swatch order); pass {uid: int} to remove by stable uid. Returns true on success.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "从已保存的调色板中移除色样并重新保存 .pal 文件。传入整数按索引移除（从 0 开始，按当前色样顺序）；传入 {uid: int} 则按稳定的 uid 移除。成功时返回 true。"},
        "zh-Hant": {"decision": "translate", "text": "從已儲存的調色盤中移除色票並重新儲存 .pal 檔案。傳入整數依索引移除（從 0 開始，按目前色票順序）；傳入 {uid: int} 則依穩定的 uid 移除。成功時傳回 true。"},
        ja_JP: {"decision": "translate", "text": "保存されているパレットからスウォッチを削除し、.pal ファイルを再保存します。インデックスで削除する場合は整数（0 から始まる現在のスウォッチ順）を渡し、固定 uid で削除する場合は {uid: int} を渡します。成功した場合は true を返します。"} }
    },
    { key: "api_function_metadata.json#/setGradientFromPalette/description", source: "Sets a gradient attribute's stops to the swatches of a named palette (library or project). Mirrors the Color Window's \"Set Gradient From Palette\" action. Returns true on success.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "将渐变属性的色标设置为指定调色板（库或项目）的色样。对应颜色窗口的“从调色板设置渐变”操作。成功时返回 true。"},
        "zh-Hant": {"decision": "translate", "text": "將漸層屬性的色標設定為指定調色盤（資料庫或專案）的色票。對應顏色視窗的「從調色盤設定漸層」操作。成功時傳回 true。"},
        ja_JP: {"decision": "translate", "text": "グラデーション属性のカラーストップに指定したパレット（ライブラリまたはプロジェクト）のスウォッチを設定します。カラーウィンドウの「パレットからグラデーションを設定」操作に対応します。成功した場合は true を返します。"} }
    },
    { key: "core_api_function_metadata.json#/Mesh/methods/getMaterialAtIndex/description", source: "Returns the material for the path at the specified index, or undefined if the path inherits its material from the parent mesh.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "返回指定索引处路径的材质；若该路径从父级网格继承材质，则返回 undefined。"},
        "zh-Hant": {"decision": "translate", "text": "傳回指定索引處路徑的材質；若該路徑從父級網格繼承材質，則傳回 undefined。"},
        ja_JP: {"decision": "translate", "text": "指定したインデックスにあるパスのマテリアルを返します。パスが親メッシュからマテリアルを継承している場合は undefined を返します。"} }
    },
    { key: "gui_api_function_metadata.json#/discardCanvaExportAttempt/description", source: "Abandons the export attempt begun by runCanvaPreflightModal when the user backs out before exportArchive runs.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "当用户在 exportArchive 运行前退出时，放弃由 runCanvaPreflightModal 发起的导出尝试。"},
        "zh-Hant": {"decision": "translate", "text": "當使用者在 exportArchive 執行前退出時，放棄由 runCanvaPreflightModal 發起的匯出嘗試。"},
        ja_JP: {"decision": "translate", "text": "exportArchive の実行前にユーザーが中断した場合、runCanvaPreflightModal によって開始されたエクスポート試行を破棄します。"} }
    },
    { key: "gui_api_function_metadata.json#/getCanvaPreflightResults/description", source: "Runs the Canva pre-flight checks and returns the results as a JSON string.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "运行 Canva 预检并以 JSON 字符串形式返回结果。"},
        "zh-Hant": {"decision": "translate", "text": "執行 Canva 預檢並以 JSON 字串形式傳回結果。"},
        ja_JP: {"decision": "translate", "text": "Canva プリフライトチェックを実行し、結果を JSON 文字列として返します。"} }
    },
    { key: "gui_api_function_metadata.json#/getCanvaSheetAssetURL/description", source: "Returns the URL for the given Canva Sheet Asset.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "返回给定 Canva Sheet 资源的 URL。"},
        "zh-Hant": {"decision": "translate", "text": "傳回指定 Canva Sheet 素材的 URL。"},
        ja_JP: {"decision": "translate", "text": "指定された Canva Sheet アセットの URL を返します。"} }
    },
    { key: "gui_api_function_metadata.json#/installPlugin/description", source: "Install a plugin folder or .zip into the user's third-party plugins folder and register its definitions and strings into the live session. Returns {ok, installedPath, registeredTypes, wasUpdate, requiresRestart, error}. Schema-changing updates are detected (wasUpdate=true) but only take effect after a Cavalry restart — existing scene instances depend on the previous attribute layout. Source-only changes (.sksl, .js) are picked up the next time an instance is created. Always ask the user before calling this.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "将插件文件夹或 .zip 安装到用户的第三方插件文件夹中，并将其定义和字符串注册到当前活动会话中。返回 {ok, installedPath, registeredTypes, wasUpdate, requiresRestart, error}。会检测修改架构的更新（wasUpdate=true），但只有在重新启动 Cavalry 后才会生效 —— 现有场景实例依赖先前的属性布局。仅源码更改（.sksl、.js）将在下次创建实例时生效。调用此函数前务必先询问用户。"},
        "zh-Hant": {"decision": "translate", "text": "將外掛程式資料夾或 .zip 安裝到使用者的第三方外掛程式資料夾中，並將其定義與字串註冊到當前使用中工作階段中。傳回 {ok, installedPath, registeredTypes, wasUpdate, requiresRestart, error}。會偵測修改結構綱要的更新（wasUpdate=true），但只有在重新啟動 Cavalry 後才會生效 —— 現有場景實例相依於先前的屬性版面配置。僅原始碼變更（.sksl、.js）將在下次建立實例時生效。呼叫此函式前務必先詢問使用者。"},
        ja_JP: {"decision": "translate", "text": "プラグインフォルダーまたは .zip をユーザーのサードパーティ製プラグインフォルダーにインストールし、その定義と文字列を現在のセッションに登録します。{ok, installedPath, registeredTypes, wasUpdate, requiresRestart, error} を返します。スキーマを変更する更新は検出されますが（wasUpdate=true）、既存のシーンインスタンスが以前の属性レイアウトに依存しているため、Cavalry の再起動後にのみ有効になります。ソースのみの変更（.sksl、.js）は次回インスタンスが作成されたときに反映されます。これを呼び出す前に必ずユーザーに確認してください。"} }
    },
    { key: "gui_api_function_metadata.json#/isCanvaSheetAsset/description", source: "Returns true if the Asset is a Canva Sheet.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "如果该资源是 Canva Sheet，则返回 true。"},
        "zh-Hant": {"decision": "translate", "text": "如果該素材是 Canva Sheet，則傳回 true。"},
        ja_JP: {"decision": "translate", "text": "アセットが Canva Sheet の場合は true を返します。"} }
    },
    { key: "gui_api_function_metadata.json#/openWindow/description", source: "Opens a window of the given type. An optional minimum height can be provided.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "打开指定类型的窗口。可选择提供最小高度。"},
        "zh-Hant": {"decision": "translate", "text": "開啟指定類型的視窗。可選擇提供最小高度。"},
        ja_JP: {"decision": "translate", "text": "指定したタイプのウィンドウを開きます。オプションで最小の高さを指定できます。"} }
    },
    { key: "gui_api_function_metadata.json#/recoverySessionDirectory/description", source: "Returns this session's crash-recovery directory. For testing.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "返回此会话的崩溃恢复目录。用于测试。"},
        "zh-Hant": {"decision": "translate", "text": "傳回此工作階段的當機復原目錄。用於測試。"},
        ja_JP: {"decision": "translate", "text": "このセッションのクラッシュ復旧ディレクトリを返します。テスト用です。"} }
    },
    { key: "gui_api_function_metadata.json#/replaceCanvaSheet/description", source: "Replaces a Canva Sheet asset with a new design id (and optional page; defaults to 1).",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "使用新的设计 ID（以及可选的 page，默认为 1）替换 Canva Sheet 资源。"},
        "zh-Hant": {"decision": "translate", "text": "使用新的設計 ID（以及選填的 page，預設為 1）取代 Canva Sheet 素材。"},
        ja_JP: {"decision": "translate", "text": "Canva Sheet アセットを新しいデザイン ID（およびオプションの page、デフォルトは 1）で置き換えます。"} }
    },
    { key: "gui_api_function_metadata.json#/resetWorkspace/description", source: "Resets the workspace to the default layout.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "将工作区重置为默认布局。"},
        "zh-Hant": {"decision": "translate", "text": "將工作區重設為預設版面配置。"},
        ja_JP: {"decision": "translate", "text": "ワークスペースをデフォルトのレイアウトにリセットします。"} }
    },
    { key: "gui_api_function_metadata.json#/runCanvaPreflightModal/description", source: "Runs the Canva pre-flight checks and returns true if no blocking issues were found.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "运行 Canva 预检；若未发现阻塞性问题则返回 true。"},
        "zh-Hant": {"decision": "translate", "text": "執行 Canva 預檢；若未發現阻礙性問題則傳回 true。"},
        ja_JP: {"decision": "translate", "text": "Canva プリフライトチェックを実行し、ブロッキング問題が見つからなかった場合は true を返します。"} }
    },
    { key: "gui_api_function_metadata.json#/scrollToAttribute/description", source: "Loads the given layer in the Attribute Editor and scrolls to the specified attribute row.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "在属性编辑器中加载指定图层，并滚动到指定的属性行。"},
        "zh-Hant": {"decision": "translate", "text": "在屬性編輯器中載入指定圖層，並捲動到指定的屬性列。"},
        ja_JP: {"decision": "translate", "text": "指定したレイヤーをアトリビュートエディターに読み込み、指定された属性行までスクロールします。"} }
    },
    { key: "gui_api_function_metadata.json#/snapshotLayer/description", source: "Render a single drawable layer and its descendants to an offscreen PNG, returned as base64.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "将单个可绘制图层及其后代渲染为离屏 PNG，并以 base64 格式返回。"},
        "zh-Hant": {"decision": "translate", "text": "將單個可繪製圖層及其後代算繪為離屏 PNG，並以 base64 格式傳回。"},
        ja_JP: {"decision": "translate", "text": "単一の描画可能レイヤーとその子孫をオフスクリーン PNG にレンダリングし、base64 として返します。"} }
    },
    { key: "gui_api_function_metadata.json#/writePluginFile/description", source: "Writes a text file to <pluginName>/<relPath> in the plugins folder; refuses escaping paths. Used by the MCP before installPlugin; ask the user first.",
      notes: ["Script help; machine parameters, types and identifiers remain unchanged."],
      translations: { "zh-Hans": {"decision": "translate", "text": "在插件文件夹中的 <pluginName>/<relPath> 写入文本文件；拒绝越界逃逸路径。由 MCP 在调用 installPlugin 之前使用；操作前请先询问用户。"},
        "zh-Hant": {"decision": "translate", "text": "在外掛程式資料夾中的 <pluginName>/<relPath> 寫入文字檔案；拒絕越界逃逸路徑。由 MCP 在呼叫 installPlugin 之前使用；操作前請先詢問使用者。"},
        ja_JP: {"decision": "translate", "text": "プラグインフォルダー内の <pluginName>/<relPath> にテキストファイルを書き込みます。フォルダー外へ出るパスは拒否されます。installPlugin の前に MCP で使用されます。事前にユーザーに確認してください。"} }
    },
  ],
};
