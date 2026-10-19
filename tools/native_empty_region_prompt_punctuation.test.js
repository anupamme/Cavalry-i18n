/**
 * [INPUT]: 依赖 native approved_modules、native_language_pack、有限空区域键合同及原生格式校验。
 * [OUTPUT]: 锁定38条空区域提示；先回退后续MessageBar单键，再验证类别历史摘要。
 * [POS]: tools 的离线标点类别合同；不裁剪运行时文案，不读App，不代表live。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { APPROVED_MODULES, approvedEntries } = require('../languages/native/approved_modules');
const { nativeSourceIdentitySha256, resolveTranslations, renderNativePack } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const { hash, decisionRows, LOCALES, restoreMessageBarNoFurtherRevision } = require('./native_remaining_ui_contract');
const { APPROVED_VENDOR_CORRECTIONS } = require('../languages/native/approved_vendor_corrections');

// -- 只含空区域短提示；不含 tooltip、帮助正文、错误或多句说明 --------
const CANDIDATES = [
  {
    "module": "reviewed_translations",
    "key": "aiStudio.results.emptyHint",
    "source": "Generated artwork will appear here.",
    "translations": {
      "zh-Hans": "生成的作品将显示在此处",
      "zh-Hant": "生成的作品將顯示在此處",
      "ja_JP": "生成されたアートワークはここに表示されます"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attrListPopup.placeholder.noConnections",
    "source": "No Connections.",
    "translations": {
      "zh-Hans": "暂无连接",
      "zh-Hant": "尚無連線",
      "ja_JP": "接続はありません"
    }
  },
  {
    "module": "runtime_observed_supplement",
    "key": "attributeEditor.input.placeholder.dragShape",
    "source": "Drag in a Shape layer",
    "translations": {
      "zh-Hans": "拖入形状图层",
      "zh-Hant": "拖入形狀圖層",
      "ja_JP": "シェイプレイヤーをドラッグ"
    }
  },
  {
    "module": "runtime_observed_supplement",
    "key": "attributeEditor.input.placeholder.noConnection",
    "source": "No Connection",
    "translations": {
      "zh-Hans": "无连接",
      "zh-Hant": "無連接",
      "ja_JP": "接続なし"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.asset.placeholder.dragFromAssets",
    "source": "Drag in a file from the Assets window",
    "translations": {
      "zh-Hans": "从素材窗口拖入文件",
      "zh-Hant": "從素材視窗拖入檔案",
      "ja_JP": "アセットウィンドウからファイルをドラッグ"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.empty.dragConnection",
    "source": "Drag an Attribute connection here.",
    "translations": {
      "zh-Hans": "将属性连接拖到此处",
      "zh-Hant": "將屬性連線拖曳至此",
      "ja_JP": "ここに属性接続をドラッグします"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.empty.dragMode",
    "source": "Drag layers here to see their settings.",
    "translations": {
      "zh-Hans": "将图层拖到此处以查看其设置",
      "zh-Hant": "將圖層拖曳至此以查看其設定",
      "ja_JP": "レイヤーをここにドラッグして設定を確認します"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.empty.liveMode",
    "source": "Select layers to see their settings",
    "translations": {
      "zh-Hans": "选择图层以查看其设置",
      "zh-Hant": "選取圖層以查看其設定",
      "ja_JP": "レイヤーを選択して設定を表示"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.input.placeholder.connectBehaviour",
    "source": "Connect a Behaviour or Utility here.",
    "translations": {
      "zh-Hans": "在此连接行为节点或实用节点",
      "zh-Hant": "在此連接行為節點或實用節點",
      "ja_JP": "ビヘイビアまたはユーティリティノードをここに接続"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.input.placeholder.connectLayerAttribute",
    "source": "Connect a Layer or Attribute here.",
    "translations": {
      "zh-Hans": "在此处连接图层或属性",
      "zh-Hant": "在此處連接圖層或屬性",
      "ja_JP": "ここにレイヤーまたは属性を接続"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.input.placeholder.dragAsset",
    "source": "Drag in or connect an Asset",
    "translations": {
      "zh-Hans": "拖入或连接素材",
      "zh-Hant": "拖入或連接素材",
      "ja_JP": "アセットをドラッグまたは接続"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.input.placeholder.dragShapeLayer",
    "source": "Drag a Shape layer here",
    "translations": {
      "zh-Hans": "将形状图层拖到此处",
      "zh-Hant": "將形狀圖層拖曳至此",
      "ja_JP": "シェイプレイヤーをここにドラッグ"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.input.placeholder.dragSmartFolder",
    "source": "Drag in a Smart Folder",
    "translations": {
      "zh-Hans": "将智能文件夹拖入此处",
      "zh-Hant": "將智慧型資料夾拖入此處",
      "ja_JP": "スマートフォルダーをここにドラッグ"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.input.placeholder.dragSpreadsheet",
    "source": "Drag in a Spreadsheet from the Assets Window",
    "translations": {
      "zh-Hans": "从素材窗口拖入电子表格",
      "zh-Hant": "從素材視窗拖入試算表",
      "ja_JP": "アセットウィンドウからスプレッドシートをドラッグ"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.output.placeholder.addBackground",
    "source": "Click the + button to add a background",
    "translations": {
      "zh-Hans": "单击 + 按钮添加背景图层",
      "zh-Hant": "按一下 + 按鈕新增背景圖層",
      "ja_JP": "+ ボタンをクリックして背景レイヤーを追加"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.output.placeholder.addPlacementUtility",
    "source": "Click the + button to add a Placement Utility",
    "translations": {
      "zh-Hans": "单击 + 按钮添加放置辅助节点",
      "zh-Hant": "按一下 + 按鈕新增放置輔助節點",
      "ja_JP": "+ ボタンをクリックして配置ユーティリティノードを追加"
    }
  },
  {
    "module": "remaining_global_ui_01",
    "key": "attributeEditor.output.placeholder.dragConnection",
    "source": "Drag a connection from here.",
    "translations": {
    "zh-Hans": "从此处拖出连接",
    "zh-Hant": "從此處拖出連線",
      "ja_JP": "ここから接続をドラッグ"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "compRow.placeholder.organiseOverrides",
    "source": "Organise Pre-Comp Overrides here.",
    "translations": {
      "zh-Hans": "在此整理预合成覆盖项",
      "zh-Hant": "在此整理預合成覆寫項",
      "ja_JP": "ここでプリコンポジションのオーバーライドを整理してください"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "connectionList.placeholder.addFalloff",
    "source": "Right click to add a Falloff",
    "translations": {
      "zh-Hans": "右键单击以添加衰减",
      "zh-Hant": "按一下滑鼠右鍵以新增衰減",
      "ja_JP": "右クリックしてフォールオフを追加"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "connectionList.placeholder.addModifier",
    "source": "Right click to add a Modifier",
    "translations": {
      "zh-Hans": "右键单击以添加修改器",
      "zh-Hant": "按一下滑鼠右鍵以新增修改器",
      "ja_JP": "右クリックしてモディファイアを追加"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "connectionList.placeholder.addShader",
    "source": "Right click to add a Shader",
    "translations": {
      "zh-Hans": "右键单击以添加着色器",
      "zh-Hant": "按一下滑鼠右鍵以新增著色器",
      "ja_JP": "右クリックしてシェーダーを追加"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "connectionList.placeholder.dragShape",
    "source": "Drag a Shape here",
    "translations": {
      "zh-Hans": "将形状拖到此处",
      "zh-Hant": "將形狀拖曳到此處",
      "ja_JP": "ここにシェイプをドラッグ"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "connectionList.placeholder.dragTwoShapes",
    "source": "Drag at least two Shapes here",
    "translations": {
      "zh-Hans": "将至少两个形状拖到此处",
      "zh-Hant": "將至少兩個形狀拖曳到此處",
      "ja_JP": "ここに2つ以上のシェイプをドラッグ"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "connectionList.placeholder.noConnections",
    "source": "No Connections.",
    "translations": {
      "zh-Hans": "暂无连接",
      "zh-Hant": "尚無連線",
      "ja_JP": "接続はありません"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "connectionList.placeholder.noNamed",
    "source": "No {0}",
    "translations": {
      "zh-Hans": "没有 {0}",
      "zh-Hant": "沒有 {0}",
      "ja_JP": "{0} はありません"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "controlCentre.emptyHint",
    "source": "Right Click on Attributes to add them to this window.",
    "translations": {
      "zh-Hans": "右键单击属性以将其添加到此窗口",
      "zh-Hant": "在屬性上按一下右鍵，將其新增至此視窗",
      "ja_JP": "属性を右クリックして、このウィンドウに追加します"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "dgView.bookmark.placeholder",
    "source": "No bookmarks yet.",
    "translations": {
      "zh-Hans": "尚无书签",
      "zh-Hant": "尚無書籤",
      "ja_JP": "ブックマークはまだありません"
    }
  },
  {
    "module": "remaining_global_ui_02",
    "key": "expressionEditor.placeholder.noInputConnection",
    "source": "No input connection.",
    "translations": {
      "zh-Hans": "没有输入连接",
      "zh-Hant": "沒有輸入連接",
      "ja_JP": "入力接続がありません"
    }
  },
  {
    "module": "remaining_global_ui_03",
    "key": "graphEditor.emptyState",
    "source": "Select a Layer or Attribute to view its keyframes",
    "translations": {
      "zh-Hans": "选择图层或属性以查看其关键帧",
      "zh-Hant": "選取圖層或屬性以檢視其關鍵幀",
      "ja_JP": "レイヤーまたは属性を選択するとキーフレームが表示されます"
    }
  },
  {
    "module": "remaining_global_ui_03",
    "key": "jsSnippets.placeholder",
    "source": "Drag some JavaScript here to make a Snippet.",
    "translations": {
      "zh-Hans": "将一些 JavaScript 拖到此处以创建代码片段",
      "zh-Hant": "將一些 JavaScript 拖曳至此以建立程式碼片段",
      "ja_JP": "JavaScriptをここにドラッグしてスニペットを作成します"
    }
  },
  {
    "module": "remaining_global_ui_03",
    "key": "meshExplorer.empty",
    "source": "Select a Shape to see its internal mesh structure.",
    "translations": {
      "zh-Hans": "选择一个形状以查看其内部网格结构",
      "zh-Hant": "選取形狀以檢視其內部網格結構",
      "ja_JP": "シェイプを選択すると内部メッシュ構造が表示されます"
    }
  },
  {
    "module": "remaining_global_ui_04",
    "key": "palette.placeholder.createPalette",
    "source": "Create a palette to begin.",
    "translations": {
      "zh-Hans": "创建调色板以开始",
      "zh-Hant": "建立調色盤以開始",
      "ja_JP": "パレットを作成する"
    }
  },
  {
    "module": "remaining_global_ui_04",
    "key": "palette.placeholder.dragColors",
    "source": "Drag colors here.",
    "translations": {
      "zh-Hans": "将颜色拖到此处",
      "zh-Hant": "將顏色拖曳到此處",
      "ja_JP": "ここにカラーをドラッグしてください"
    }
  },
  {
    "module": "remaining_global_ui_04",
    "key": "palette.placeholder.dragColours",
    "source": "Drag colours here.",
    "translations": {
      "zh-Hans": "将颜色拖到此处",
      "zh-Hant": "將顏色拖曳到此處",
      "ja_JP": "ここにカラーをドラッグしてください"
    }
  },
  {
    "module": "remaining_global_ui_04",
    "key": "palette.placeholder.noProjectSet",
    "source": "No Project Set.",
    "translations": {
      "zh-Hans": "尚未设置项目",
      "zh-Hant": "尚未設定專案",
      "ja_JP": "プロジェクトが設定されていません"
    }
  },
  {
    "module": "remaining_global_ui_04",
    "key": "projectAssets.empty.importHint",
    "source": "Double click here to import Assets.",
    "translations": {
      "zh-Hans": "双击此处以导入素材",
      "zh-Hant": "連按兩下此處以匯入素材",
      "ja_JP": "ここをダブルクリックしてアセットをインポートします"
    }
  },
  {
    "module": "remaining_global_ui_05",
    "key": "renderQueue.tree.placeholder",
    "source": "Drag in Compositions or use the ‘+ Current Composition’ button.",
    "translations": {
      "zh-Hans": "将合成拖入此处，或使用“+ 当前合成”按钮",
      "zh-Hant": "將合成拖曳至此，或使用「+ 目前合成」按鈕",
      "ja_JP": "コンポジションをここにドラッグするか、「+ 現在のコンポジション」ボタンを使ってください"
    }
  },
  {
    "module": "remaining_global_ui_05",
    "key": "sceneTree.placeholder.empty",
    "source": "Use the Create menu to add a Layer to the active Composition.",
    "translations": {
      "zh-Hans": "使用“创建”菜单向当前合成添加图层",
      "zh-Hant": "使用「建立」選單將圖層新增至作用中的合成",
      "ja_JP": "作成メニューからアクティブなコンポジションにレイヤーを追加してください"
    }
  }
];
const REVISION_ID = 'empty-region-prompt-no-terminal-full-stop-20261012-r1';
const REVISION_SUMMARIES = Object.freeze({
  reviewed_translations: {
    previous: '0bcc4702aeb179ca3cdc1617887d1f5d76fbe1492c2134fed8166ec89ce9e7dc',
    current: '94ef3918d6199a6f76bfb16adf33d0809af070f08866fabdeb9c9d2407c2961e',
    sourceSha256: '464f0d291cd7aac46dba9552ab08debf4302cbd36b7b8d9d49f692085004e82e',
  },
  remaining_global_ui_01: {
    previous: '8213e937c52702d3521307a78186525aca2ff6da5c324309b57b3feabcef717a',
    current: 'c1e493e5cc6a4604332fa30c20f7413ca8fe4d140e5748952fabe88ac4a936fd',
    approvalReceiptSha256: '9cd68123e7d9cc4c4aae110acb080c4cc1378e812716e1246ab5f360d499cb25',
  },
  remaining_global_ui_02: {
    previous: 'd0aceeb063fcb70d7095ff2811dd1e1482fda3a84953c7d751b5507e430de6f3',
    current: '789b487b5d1de31b07b0e6b909c130765952f68baeacfb80e2aa1527e0152cc9',
    approvalReceiptSha256: 'c1e9714745ad3448c52d12d4fd4a40dcf2420574161e612dbfc9a6647bf47411',
  },
  remaining_global_ui_03: {
    previous: '9bbb25315a1668d929038af82d731ee8b753f650d46326dff0f8ff9ecb8883be',
    current: 'c29731dbea989fd14d415b66abae8a4db7c3e486918b47f5ecfc9bd091586e92',
    approvalReceiptSha256: '4c744a0e2b48fe04581430ed2125540b02aee0f6874dced9665b3e91172fc6e4',
  },
  remaining_global_ui_04: {
    previous: 'c847daaccf680aa1c7e2451b15754ce8f6a2e511763a6e171f9a9050e68a8d09',
    current: 'b6135fa896ea0a76431730c4b1c8e9aa4c3ad58eefcc2e0e49580c57284b4775',
    approvalReceiptSha256: 'a6ef5c1b38377e7a00758b0399e5e414472e0b0a047151946069888ae75d1e81',
  },
  remaining_global_ui_05: {
    previous: 'd7847dfbdfb272d04d2195b413bc631bf581562a8be8dac207fd1cce9a18522b',
    current: '69df262e0cab07feda1ac427bcdde4ebe9f46bd9e6915046ac029c12e42116eb',
    approvalReceiptSha256: 'e2381d3f033e09c47f8f54addc372218bc6d9308cf16b86a815c5b2497075e2c',
  },
});
const changedKeys = new Set([
  'aiStudio.results.emptyHint',
  'attributeEditor.input.placeholder.connectBehaviour',
  'attributeEditor.input.placeholder.connectLayerAttribute',
  'attributeEditor.output.placeholder.dragConnection',
  'dgView.bookmark.placeholder',
  'expressionEditor.placeholder.noInputConnection',
  'meshExplorer.empty',
  'palette.placeholder.createPalette',
  'renderQueue.tree.placeholder',
]);

function entriesByModule(moduleName) {
  return require('../languages/native/' + moduleName + '.js').entries;
}

// -- 精确列表固定范围与逐槽文字，防止类别扩成通用句号裁剪 ----------
test('empty-region prompt category pins 38 exact source-bound entries', () => {
  assert.equal(CANDIDATES.length, 38);
  assert.equal(new Set(CANDIDATES.map(row => row.key)).size, CANDIDATES.length);
  const approved = approvedEntries();
  const sources = new Map(approved.map(row => [row.key, row]));
  assert.equal(sources.size, approved.length);
  for (const candidate of CANDIDATES) {
    const row = sources.get(candidate.key);
    assert.ok(row, candidate.key);
    assert.equal(APPROVED_MODULES.find(moduleName => entriesByModule(moduleName).some(entry => entry.key === candidate.key)), candidate.module);
    assert.equal(row.source, candidate.source, candidate.key);
    if (row.vendorJapanese !== undefined) assert.equal(row.vendorJapanese, row.source, candidate.key);
    for (const locale of LOCALES) {
      assert.equal(row.translations[locale].decision, 'translate', candidate.key + '/' + locale);
      assert.equal(row.translations[locale].text, candidate.translations[locale], candidate.key + '/' + locale);
      assert.doesNotMatch(candidate.translations[locale], /[。.]$/u, candidate.key + '/' + locale);
      assertNativeTranslationFormat(row.source, row.translations[locale].text);
    }
  }
});

// -- 单一类别revision保留原审批receipt及每个模块的旧/新摘要 ---------
test('empty-region category revision preserves approval receipts and restores prior module summaries', () => {
  for (const [moduleName, expected] of Object.entries(REVISION_SUMMARIES)) {
    const { entries, provenance } = require('../languages/native/' + moduleName + '.js');
    const revision = provenance.emptyRegionPromptPunctuationRevision;
    assert.ok(revision, moduleName);
    assert.equal(revision.revisionId, REVISION_ID);
    assert.equal(revision.approvalState, 'approved-source-bound-category-revision');
    assert.equal(revision.approvedBy, 'primary-agent');
    assert.equal(revision.liveApproval, false);
    assert.equal(revision.previousDecisionSha256, expected.previous);
    assert.equal(revision.currentDecisionSha256, expected.current);
    const revisionBaseline = structuredClone(entries);
    if (moduleName === 'remaining_global_ui_03') {
      restoreMessageBarNoFurtherRevision(revisionBaseline, provenance.messageBarNoFurtherAsciiTailRevision);
    }
    assert.equal(hash(decisionRows(revisionBaseline)), expected.current);
    assert.equal(revision.changedKeys, revision.changes.length);
    assert.equal(revision.changedLocaleSlots,
      revision.changes.reduce((total, change) => total + change.changedLocales.length, 0));
    if (expected.approvalReceiptSha256) assert.equal(provenance.approvalReceiptSha256, expected.approvalReceiptSha256);
    if (expected.sourceSha256) assert.equal(provenance.sourceSha256, expected.sourceSha256);

    const changed = revision.changes;
    const expectedChanged = CANDIDATES.filter(row => changedKeys.has(row.key) && row.module === moduleName).map(row => row.key).sort();
    assert.deepEqual(changed.map(row => row.key).sort(), expectedChanged, moduleName);
    const historical = structuredClone(revisionBaseline);
    for (const change of changed) {
      const live = entries.find(row => row.key === change.key);
      const old = historical.find(row => row.key === change.key);
      const contract = CANDIDATES.find(row => row.key === change.key);
      assert.equal(live.source, change.source);
      assert.equal(live.source, contract.source);
      assert.equal(nativeSourceIdentitySha256(live), change.sourceIdentitySha256);
      assert.deepEqual(change.currentTranslations, contract.translations);
      assert.deepEqual(change.changedLocales,
        LOCALES.filter(locale => change.previousTranslations[locale] !== change.currentTranslations[locale]));
      for (const locale of LOCALES) {
        assert.equal(live.translations[locale].text, change.currentTranslations[locale]);
        assert.doesNotMatch(change.currentTranslations[locale], /[。.]$/u);
        if (change.changedLocales.includes(locale)) assert.match(change.previousTranslations[locale], /[。.]$/u);
        else assert.equal(change.previousTranslations[locale], change.currentTranslations[locale]);
        old.translations[locale].text = change.previousTranslations[locale];
      }
    }
    assert.equal(hash(decisionRows(historical)), expected.previous, moduleName);
    assert.notEqual(hash(decisionRows(historical)), expected.current, moduleName);
  }

  const third = require('../languages/native/remaining_global_ui_03').provenance;
  assert.equal(third.jsSnippetPlaceholderNoFullStopRevision.currentDecisionSha256,
    REVISION_SUMMARIES.remaining_global_ui_03.previous);
  const fifth = require('../languages/native/remaining_global_ui_05').provenance;
  assert.equal(fifth.placeholderJapaneseNoFullStopRevision.currentDecisionSha256,
    REVISION_SUMMARIES.remaining_global_ui_05.previous);
});

// -- 实际三语显示producer输出逐键等于审定source行 ------------------
test('native pack producer emits the exact 38 prompts in Simplified, Traditional and Japanese', () => {
  const entries = approvedEntries();
  for (const locale of LOCALES) {
    const reviews = entries.map(row => ({ key: row.key, source: row.source, ...row.translations[locale] }));
    const resolved = resolveTranslations(entries, locale, reviews, APPROVED_VENDOR_CORRECTIONS);
    const pack = JSON.parse(renderNativePack(resolved))[0];
    assert.equal(pack.language, locale === 'ja_JP' ? 'ja' : locale);
    for (const candidate of CANDIDATES) {
      assert.deepEqual(pack.value[candidate.key], { 'UI-text': candidate.translations[locale] },
        locale + '/' + candidate.key);
    }
  }
});
