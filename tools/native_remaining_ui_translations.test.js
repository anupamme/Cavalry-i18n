/**
 * [INPUT]: 依赖显式审批的剩余全局/节点UI模块、有限真实回退样本、原生格式/显示投影与完整源身份摘要。
 * [OUTPUT]: 锁定十三分区5643键及有限旧值回退；保留空提示单键修订的历史摘要，缺模块保持RED。
 * [POS]: tools 的剩余 UI 入库合同，不读取私有审稿台账或真实 App，不构建安装包、不证明 live。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { resolveTranslations, renderNativePack, nativeSourceIdentitySha256 } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const { NODE_B_THIRD_REPAIRS, GLOBAL_FIFTH_REPAIRS, NODE_B_SECOND_REPAIRS, NODE_A_SECOND_REPAIRS, NODE_A_THIRD_REPAIRS, NODE_B_FIRST_REPAIRS, GLOBAL_FOURTH_REPAIRS } = require('./native_remaining_ui_repair_cases');
const { GLOBAL_SIXTH_REPAIRS, GLOBAL_SIXTH_DECISION_REPAIRS, NODE_A_FOURTH_REPAIRS } = require('./native_remaining_ui_final_repair_cases');
const { LOCALES, hash, sorted, identity, decisionRows, assertAdditionalPartition, assertFiniteRepairs } = require('./native_remaining_ui_contract');
const MODULE = 'remaining_global_ui_01';
const EXPECTED = Object.freeze({
  keys: 418,
  keyset: '52eafda8b630fda1d0db989431c44cd0b5a9cefbb3f1e4b8623d2d96a0aea5b9',
  pairs: '1be4cac074ffbc705377dd077081cd3de266665db7168b007d880f8c3b50def1',
  identity: '2f793d682566c6aaa89ecf8e5773c983e7bb2e0cfbb2217a9ed2191bbd10ca0f',
  decisions: 'c1e493e5cc6a4604332fa30c20f7413ca8fe4d140e5748952fabe88ac4a936fd',
});
const data = () => require(`../languages/native/${MODULE}.js`);
const SECOND = Object.freeze({
  module: 'remaining_global_ui_02', keys: 446,
  keyset: 'b501d809c4e085487affe277e6efad483f8b8a5191315c11b610d14b0afda80b',
  pairs: '4f97b56b96453ce64b66105673cbfccae19f56c78d3cb039ebc5c0ae36dac2ee',
  identity: '39d1ae3b24ffa19b8bd313bee6d548066dd202605f74bef108b42ab86439adf0',
  decisions: '789b487b5d1de31b07b0e6b909c130765952f68baeacfb80e2aa1527e0152cc9',
});
const THIRD = Object.freeze({
  module: 'remaining_global_ui_03', keys: 449,
  keyset: '2514f48ddc037f584bc7c8c8cecbe8e7b96d774d1e31e608f5fe75cbc6cfaf53',
  pairs: '5fc6c8ac0328518af8a503da997a6e91cde4bd21b6a55861ff3e87f42e00f4b1',
  identity: '9f00f5ed8da037da09d1541145c3ecdcabb14602d55b035a107aeb1faa4ab171',
  decisions: 'c29731dbea989fd14d415b66abae8a4db7c3e486918b47f5ecfc9bd091586e92',
});
const THIRD_PRE_SNIPPET_PLACEHOLDER_REVISION = '4a3acb743bac44afae3a9133ac14237a4c89331d4182904bce719055937bcb0b';
const THIRD_PRE_EMPTY_REGION_CATEGORY = '9bbb25315a1668d929038af82d731ee8b753f650d46326dff0f8ff9ecb8883be';
const NODE_A_FIRST = Object.freeze({
  module: 'remaining_node_ui_a_01', keys: 406,
  keyset: '3971fab3774ad87877588b43115fb03de0d158ffb25f25b70de73c789b00177f',
  pairs: '80fc7c916163c28bbf7ae696019138c7094d280f6588a03c57f0bd0a9e3eb720',
  identity: '35b33ccece5e19fa0a522a8ff3f892384520e82884bccd36c29ff3f4fe20f31a',
  decisions: '8153cf4c939f8943eb141887600df41e7506f0659026a62594c28d4fb548c39a',
});
const NODE_A_SECOND = Object.freeze({
  "module": "remaining_node_ui_a_02",
  "keys": 433,
  "keyset": "55d761bbbf30c2a98cb8b105b204d774b9552e3fb972f6421c43edfa2d3f69a6",
  "pairs": "3c5488422dc37232bdf69726ecf2c4642a5f838f292f204ba1a3fbf61d35ce11",
  "identity": "f7d5e9ec1deb564b32fefac708f790bcd6db069dd53086f589d7166a55a15f15",
  "decisions": "ec6b2f028aada3dd68141de3d02c3010182a85f5d23f3450c0ba4a4af6392a41"
});
const NODE_A_THIRD = Object.freeze({
  "module": "remaining_node_ui_a_03",
  "keys": 438,
  "keyset": "74a06d58c8ac9f9d25e41791d49f17a8660294bd4477ef1b37702eca2fde863c",
  "pairs": "dc302eaadd7baed653c9552556277978328d8348019971527ed76e80be3853a9",
  "identity": "ccccf64c6a4c259b10ec41fb24fdf1ac3ab8a57731df78d0918620ce68a0157b",
  "decisions": "92c47aa6a6a233d08d63dc902f7ef80d0298344e88710aeb1e28723863e69014"
});
const NODE_A_FOURTH = Object.freeze({
  module: 'remaining_node_ui_a_04', keys: 443,
  keyset: 'a987dd8eeb5184ae255a91a031af5facbd7a0985e13e2b7073a6ab607cd84058',
  pairs: '292182a60db6c5101f76d91baf319616c8d44dd05ca44bd6a37e89ab1e3cae62',
  identity: '226f6a61798a15def827f1199f3e66bbe7af4b5148bb96cbaf906854a3c952f8',
  decisions: '46ab9b277d88cc0260531f4091613afedd3b2100f100fdf2349b193e352ee769',
});
const NODE_B_FIRST = Object.freeze({
  "module": "remaining_node_ui_b_01",
  "keys": 428,
  "keyset": "a21f28f53c19004d947d4acc38c5fedcf9f56c589611f1feea556822decb5247",
  "pairs": "85f8b3fbcd59a8825bb188fbbf6c21786c44eb1e9582e5d42473ba5d4a4c032c",
  "identity": "e5d92fa450d2f5b669602ea405efe9c12dae1a94bdeef51f6ae7e4472b52e72c",
  "decisions": "79aab33a49ef04fd5c135cc30e3db9017affe2f08d8f03733b82e525d02697a5"
});
const FOURTH = Object.freeze({
  "module": "remaining_global_ui_04",
  "keys": 449,
  "keyset": "606a6c62f2c57d7ada57fe5f92a2624951f00bd2b79ff48cddb518f5d0d15d73",
  "pairs": "c9b65b5c63d0dbadb360c96e10c63b4ac67c588363d7e39484c73693a2386dbd",
  "identity": "70f592eb213fc2c05e6c77a7f8a266a1b523577c7a4efc8e8d6ee89ba38184c9",
  "decisions": "b6135fa896ea0a76431730c4b1c8e9aa4c3ad58eefcc2e0e49580c57284b4775"
});
const NODE_B_SECOND = Object.freeze({
  "module": "remaining_node_ui_b_02",
  "keys": 450,
  "keyset": "eb7bceabba97949a727445bb0b038e00021d7e00e2c975bbda441ceb3fe34b17",
  "pairs": "1785a22f9af5f071be4b6389864a475f02f703e181477a545d9265a36a4e1a0e",
  "identity": "4f54fa2c056bfc5651c743101d5a1822fdc3c37f3e313a7b27b37e2b639d200b",
  "decisions": "38bbb48a002cc6e09a04ab39db82e5f9b434b2536fe5782d653159f13d6b67ea"
});
const FIFTH = Object.freeze({
  "module": "remaining_global_ui_05",
  "keys": 449,
  "keyset": "68b480d922efb6bd848d621d0cf24f90a801b4ffa0c0831301f29c3c41fb9274",
  "pairs": "36a49731406e9ba620f97a9ec850e08b8fe7a5b650935cb0bca9d1c5bf87f5f9",
  "identity": "84fbbd6a808875d08c4df6a6098f5ec752b8dde175562d58c2b9b1ab6737c496",
  "decisions": "69df262e0cab07feda1ac427bcdde4ebe9f46bd9e6915046ac029c12e42116eb"
});
const FIFTH_PRE_JA_DECISIONS = '56526b577657cbefe6ce948b76fc64883ff67e851000d9dee08218757337cab6';
const FIFTH_PRE_EMPTY_REGION_CATEGORY = 'd7847dfbdfb272d04d2195b413bc631bf581562a8be8dac207fd1cce9a18522b';
const NODE_B_THIRD = Object.freeze({
  "module": "remaining_node_ui_b_03",
  "keys": 449,
  "keyset": "7be622f180343d479f1a4ad5f620e985be68cd796c849929cc924034568bc92e",
  "pairs": "2b96a958ce2e1c2509a34652526c293a2ce88104c022a4b4d33bda00628957ad",
  "identity": "d1511d002081d2b47493e8c51f7b198110262532d5b3ba3b913d1a979de47862",
  "decisions": "011020d1aaf3e921ead7e4bb471d20575e9b497a9dd2eaea1c265f8d7acd4bb3"
});
const SIXTH = Object.freeze({
  "module": "remaining_global_ui_06",
  "keys": 385,
  "keyset": "c02f969c33346c7ee4b2a035c86414921b87b2f3db395f36ce0695b593fd3e46",
  "pairs": "50d356839c3d8cbff437ce210b36b9dbd9de953bb5c0a428fc7d6bd6ecba43d9",
  "identity": "5dce4c17580bb29580e991cf4bc42821dc2ccc46428cfdf064fc0bf1052b4eb6",
  "decisions": "ad93231a0a004cf27624fec33ff2e80f62bbb8c2be669456abcba4a0a6123ca3"
});

test('remaining UI registers only the approved complete partition with real review scope', () => {
  const { entries, provenance } = data();
  const registry = require('../languages/native/approved_modules');
  assert.ok(registry.APPROVED_MODULES.includes(MODULE));
  assert.equal(entries.length, EXPECTED.keys);
  assert.equal(provenance.approvedBy, 'primary-agent');
  assert.equal(provenance.approvalState, 'approved-source-bound-display-input');
  assert.equal(provenance.candidateModel, 'gpt-6-luna');
  assert.equal(provenance.candidateReasoningEffort, 'max');
  assert.equal(provenance.independentFullReviewCount, 1);
  assert.equal(provenance.independentFullReviewKeys, EXPECTED.keys);
  assert.equal(provenance.independentFullReviewSlots, EXPECTED.keys * 3);
  assert.equal(provenance.unresolvedFindingKeys, 0);
  assert.equal(provenance.liveApproval, false);
  assert.ok(fs.readFileSync(path.join(__dirname, '../languages/native', `${MODULE}.js`), 'utf8').split('\n').length <= 800);
});

test('remaining UI pins every canonical key/source/context and all final locale decisions', () => {
  const rows = sorted(data().entries);
  assert.equal(new Set(rows.map(row => row.key)).size, EXPECTED.keys);
  assert.equal(hash(rows.map(row => row.key)), EXPECTED.keyset);
  assert.equal(hash(rows.map(row => [row.key, row.source])), EXPECTED.pairs);
  assert.equal(hash(rows.map(identity)), EXPECTED.identity);
  assert.equal(hash(decisionRows(rows)), EXPECTED.decisions);
  for (const row of rows) {
    assert.ok(row.notes.every(note => typeof note === 'string'));
    assert.deepEqual(Object.keys(row.translations).sort(), [...LOCALES].sort());
    for (const locale of LOCALES) {
      const value = row.translations[locale];
      assert.equal(value.decision === 'preserve', value.text === row.source);
      if (row.dontTranslate) assert.equal(value.text, row.source);
      if (locale === 'ja_JP' && !row.dontTranslate && row.vendorJapanese !== row.source) {
        assert.equal(value.text, row.vendorJapanese);
      }
      assertNativeTranslationFormat(row.source, value.text);
    }
  }
});

test('all approved remaining UI values survive the real producer, without audit metadata', () => {
  const rows = data().entries;
  for (const locale of LOCALES) {
    const reviews = rows.map(row => ({ key: row.key, source: row.source, ...row.translations[locale] }));
    const resolved = resolveTranslations(rows, locale, reviews);
    assert.equal(resolved.rows.filter(row => row.status === 'missing').length, 0);
    const [record] = JSON.parse(renderNativePack(resolved));
    assert.equal(record.type, 'strings');
    assert.equal(Object.keys(record.value).length, EXPECTED.keys);
    for (const row of resolved.rows) assert.deepEqual(record.value[row.key], { 'UI-text': row.text });
  }
});

test('font captions cannot regress to first-character truncation', () => {
  const row = data().entries.find(entry => entry.key === 'attributeEditor.font.tooltip.familyName');
  assert.equal(row.translations['zh-Hant'].text, '字型家族名稱');
  const bad = structuredClone(data().entries);
  bad.find(entry => entry.key === row.key).translations['zh-Hant'].text = '字';
  assert.notEqual(hash(decisionRows(bad)), EXPECTED.decisions);
});

test('IK and FK remain kinematics, and animation simplification is not baking failure', () => {
  const byKey = new Map(data().entries.map(row => [row.key, row]));
  assert.match(byKey.get('attributeEditor.bone.fkControls').translations.ja_JP.text, /順運動学/);
  assert.match(byKey.get('attributeEditor.ikControls.tooltip.loadUI').translations.ja_JP.text, /逆運動学/);
  for (const locale of LOCALES) {
    const text = byKey.get('bakeAnim.log.cannotSimplify').translations[locale].text;
    assert.match(text, /进一步简化|進一步簡化|これ以上簡略化/);
  }
});

test('same UI easing and scripting names stay localized, while clipboard behavior is unchanged', () => {
  const byKey = new Map(data().entries.map(row => [row.key, row]));
  assert.equal(byKey.get('clipboard.tooltip.copyEasing').translations['zh-Hant'].text,
    '複製貝茲控制柄、插值與魔法緩動');
  assert.equal(byKey.get('clipboard.tooltip.pasteEasing').translations.ja_JP.text,
    'クリップボードからベジェハンドル、補間、マジックイージングを貼り付け');
  assert.equal(byKey.get('attributeEditor.row.menu.addMathScript').translations['zh-Hant'].text,
    '新增數學/腳本節點');
});


for (const scope of [SECOND, THIRD, NODE_A_FIRST, NODE_A_SECOND, NODE_A_THIRD, NODE_A_FOURTH, NODE_B_FIRST, FOURTH, NODE_B_SECOND, FIFTH, NODE_B_THIRD, SIXTH]) {
  test(`${scope.module} pins its complete independent review, identity, decisions and producer`, () => {
    assertAdditionalPartition(scope);
  });
}

test('Canva Sheets display names, clipboard cut and gradient stops retain their exact meanings', () => {
  const rows = require(`../languages/native/${SECOND.module}.js`).entries;
  const byKey = new Map(rows.map(row => [row.key, row]));
  assert.equal(byKey.get('dialog.canvaSheet.urlTitle').translations['zh-Hant'].text, 'Canva 試算表素材');
  assert.equal(byKey.get('dialog.canvaSheet.urlMessage').translations.ja_JP.text, 'Canva シートの URL: ');
  assert.equal(byKey.get('copyPaste.menu.cutPath').translations['zh-Hans'].text, '剪切路径');
  assert.equal(byKey.get('compoundGradient.menu.distributeStops').translations.ja_JP.text,
    'カラーストップを均等に配置');
  assert.equal(byKey.get('curves.preset.dayForNight').translations['zh-Hans'].text, '日转夜');
  const bad = structuredClone(rows);
  bad.find(row => row.key === 'copyPaste.menu.cutPath').translations['zh-Hans'].text = '切割路径';
  assert.notEqual(hash(decisionRows(bad)), SECOND.decisions);
});

test('plural menu selectors do not display a nonexistent count, and data categories include colours', () => {
  const byKey = new Map(require(`../languages/native/${THIRD.module}.js`).entries.map(row => [row.key, row]));
  const point = byKey.get('fixedGraph.menu.deletePoints');
  assert.equal(point.translations['zh-Hans'].text, '删除{0, plural, one {点} other {点}}');
  assert.equal(point.translations['zh-Hant'].text, '刪除{0, plural, one {點} other {點}}');
  assert.equal(byKey.get('nodeCategory.values').translations['zh-Hans'].text, '值');
  assert.equal(byKey.get('nodeCategory.values').translations['zh-Hant'].text, '值');
  assert.equal(byKey.get('meshExplorer.row.unableToPreview').translations['zh-Hans'].text, ' 无法预览网格。 ');
});

test('MCP authorization keeps explicit user initiation, literal API identity and rich-text formatting', () => {
  const byKey = new Map(require(`../languages/native/${THIRD.module}.js`).entries.map(row => [row.key, row]));
  const warning = byKey.get('mcp.auth.requestFromUnknown').translations['zh-Hant'].text;
  assert.match(warning, /<b>MCP 用戶端<\/b>/);
  assert.match(warning, /執行腳本/);
  assert.match(warning, /只有在連線由您發起時才允許/);
  assert.match(byKey.get('macOSAppDelegate.log.swizzleOpenFilesFailed').translations.ja_JP.text,
    /application:openFiles:/);
});

test('Forge feature display terms follow the project glossary, without rewriting source identities', () => {
  const byKey = new Map(require(`../languages/native/${THIRD.module}.js`).entries.map(row => [row.key, row]));
  assert.equal(byKey.get('nudgeToUpgrade.feature.forge').source, 'Forge Dynamics');
  assert.equal(byKey.get('nudgeToUpgrade.feature.forge').translations.ja_JP.text, 'フォージダイナミクス');
  assert.equal(byKey.get('nodeCategory.forgeConstraint').translations.ja_JP.text, 'フォージコンストレイント');
});

test('node captions distinguish geometric ends, Taiwan table axes, and numeric multiplication', () => {
  const rows = require(`../languages/native/${NODE_A_FIRST.module}.js`).entries;
  const byKey = new Map(rows.map(row => [row.key, row]));
  for (const owner of ['basicArrowHead', 'chevronHead']) {
    const row = byKey.get(`nodeAttr:${owner}.headLength`);
    assert.equal(row.translations['zh-Hans'].text, '端部长度');
    assert.equal(row.translations['zh-Hant'].text, '端部長度');
    assert.equal(row.translations.ja_JP.text, '端部の長さ');
  }
  assert.equal(byKey.get('nodeAttr:bentoShape.gridColumns').translations['zh-Hant'].text, '網格欄');
  assert.equal(byKey.get('nodeAttr:bentoShape.gridRows').translations['zh-Hant'].text, '網格列');
  assert.equal(byKey.get('nodeAttrEnum:behaviourMixer.blendMode.4').translations['zh-Hans'].text, '相乘');
  assert.equal(byKey.get('nodeAttrEnum:applyTextMaterial.blendMode.24').translations['zh-Hans'].text, '正片叠底');
});

test('colour fading does not become opacity fading or a rigid-body-only operation', () => {
  const byKey = new Map(require(`../languages/native/${NODE_A_FIRST.module}.js`).entries.map(row => [row.key, row]));
  assert.equal(byKey.get('attrInfo:colorCollisionEvent.fadeTime').translations['zh-Hans'].text, '颜色渐变所需的时间（秒）。');
  assert.match(byKey.get('attrInfo:colorCollisionEvent.useCollisionIndex').translations['zh-Hant'].text, /物體索引/);
  assert.match(byKey.get('attrInfo:cogwheelShape.toothThickness').translations.ja_JP.text, /パーセント/);
  assert.equal(byKey.get('nodeAttr:applyTextMaterial.overwriteBlendMode').translations.ja_JP.text, '描画モードを上書き');
  assert.match(byKey.get('nodeInfo:bridgeConstraint').translations.ja_JP.text, /フォージダイナミクス/);
});

// -- A02有限裁定：17错误与4自然度/控件引用建议分开于完整域摘要 ----


test('node A02 pins all 21 independently rechecked repairs and exact source identities', () => {
  const { entries } = require('../languages/native/remaining_node_ui_a_02');
  assert.equal(NODE_A_SECOND_REPAIRS.length, 21);
  assert.equal(new Set(NODE_A_SECOND_REPAIRS.map(([key]) => key)).size, 13);
  assertFiniteRepairs(entries, NODE_A_SECOND_REPAIRS);
  for (const [key, locale, before] of NODE_A_SECOND_REPAIRS) {
    const reverted = structuredClone(entries);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, NODE_A_SECOND_REPAIRS), undefined, `${key}/${locale}`);
  }
});

test('node A02 keeps physics states, deformable bodies and frozen geometry apart', () => {
  const byKey = new Map(require('../languages/native/remaining_node_ui_a_02').entries.map(row => [row.key, row]));
  const still = byKey.get('nodeAttrEnum:forgeDynamicsShape.bodyType.1');
  assert.equal(still.translations['zh-Hans'].text, '静止');
  assert.equal(still.translations['zh-Hant'].text, '靜止');
  assert.equal(still.translations.ja_JP.text, '静止');
  const collision = byKey.get('attrInfo:forgeDynamicsShape.shapes.shapeType');
  assert.match(collision.source, /up to 8 sides/);
  assert.match(collision.translations['zh-Hans'].text, /可变形物理物体/);
  assert.match(collision.translations['zh-Hant'].text, /可變形物理物體/);
  for (const locale of LOCALES) {
    assert.match(collision.translations[locale].text, /8/);
    assert.match(collision.translations[locale].text, /<b>.*<\/b>/);
    assertNativeTranslationFormat(collision.source, collision.translations[locale].text);
  }
});

// -- A03有限裁定：26错误/19建议；不以摘要代替功能语义审读 --------


test('node A03 pins all 45 finite repairs and rejects each actual old-value rollback', () => {
  const { entries } = require('../languages/native/remaining_node_ui_a_03');
  assert.equal(NODE_A_THIRD_REPAIRS.length, 45);
  assert.equal(new Set(NODE_A_THIRD_REPAIRS.map(([key]) => key)).size, 21);
  assertFiniteRepairs(entries, NODE_A_THIRD_REPAIRS);
  for (const [key, locale, before] of NODE_A_THIRD_REPAIRS) {
    const reverted = structuredClone(entries);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, NODE_A_THIRD_REPAIRS), undefined, `${key}/${locale}`);
  }
});
test('node A03 keeps geometric start order, layout wrapping and numeric factors distinct', () => {
  const { entries, provenance } = require('../languages/native/remaining_node_ui_a_03');
  const byKey = new Map(entries.map(row => [row.key, row]));
  const over = byKey.get('nodeAttrEnum:knot.mode.0');
  const under = byKey.get('nodeAttrEnum:knot.mode.1');
  assert.deepEqual(LOCALES.map(l => over.translations[l].text), ['先在上方', '先在上方', '上から開始']);
  assert.deepEqual(LOCALES.map(l => under.translations[l].text), ['先在下方', '先在下方', '下から開始']);
  assert.ok(provenance.sourceInterpretationEvidence.some(r => r.keys.includes(over.key)));
  for (const [key, locale, wrong] of [
    ['nodeAttrEnum:knot.mode.0', 'zh-Hans', '先绘制的路径段在上'],
    ['nodeAttrEnum:knot.mode.1', 'ja_JP', '先に描画したパス部分を下に'],
    ['attrInfo:linearDistribution.distributionMode', 'zh-Hant', '「符合」會將 Count 個點均勻分布在 Size 長度內。'],
  ]) {
    const bad = structuredClone(entries);
    bad.find(row => row.key === key).translations[locale].text = wrong;
    assert.throws(() => assertFiniteRepairs(bad, NODE_A_THIRD_REPAIRS));
  }
  assert.equal(byKey.get('nodeAttr:layoutGroup.wrapMode').translations['zh-Hant'].text, '換行模式');
  assert.equal(byKey.get('nodeAttr:halftoneFilter.customRed').translations.ja_JP.text, '赤の倍率');
  assert.equal(byKey.get('nodeAttrEnum:gradientShader.gradientMode.3').translations['zh-Hans'].text, 'Oklab 插值');
  assert.equal(byKey.get('nodeAttrEnum:grainFilter.blendMode.13').translations.ja_JP.text, 'モジュレート');
  assert.equal(byKey.get('nodeAttrEnum:grainFilter.blendMode.24').translations.ja_JP.text, '乗算');
});

// -- A04有限77槽：全分区摘要与实际旧值回退分开守门 ----------------
test('node A04 pins all 77 source-bound repairs and rejects each original-value rollback', () => {
  const { entries } = require(`../languages/native/${NODE_A_FOURTH.module}`);
  assert.equal(NODE_A_FOURTH_REPAIRS.length, 77);
  assert.equal(new Set(NODE_A_FOURTH_REPAIRS.map(([key]) => key)).size, 42);
  assertFiniteRepairs(entries, NODE_A_FOURTH_REPAIRS);
  for (const [key, locale, before] of NODE_A_FOURTH_REPAIRS) {
    const reverted = structuredClone(entries);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, NODE_A_FOURTH_REPAIRS), undefined, `${key}/${locale}`);
  }
});
test('node A04 preserves legal Curl, Metaballs, Text Box and Projecting keeps while separating math and geometry', () => {
  const { entries, provenance } = require(`../languages/native/${NODE_A_FOURTH.module}`);
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.equal(provenance.rootRevision.changedKeys, 42);
  assert.equal(provenance.rootRevision.changedLocaleSlots, 77);
  assert.equal(provenance.rootRevision.confirmedErrorSlots, 25);
  assert.equal(provenance.rootRevision.advisorySlotsAdopted, 52);
  const sourceBound = (key, source, sha256) => {
    const row = byKey.get(key);
    assert.ok(row, key);
    assert.equal(row.source, source, key);
    assert.equal(nativeSourceIdentitySha256(row), sha256, key);
    return row;
  };

  const curl = sourceBound('nodeAttr:noiseEngine.curl', 'Curl Noise',
    '21e424f2a45801e04c714ece2d54306d671aa414016de637e1fd30e5d57954f8');
  assert.deepEqual(LOCALES.map(locale => curl.translations[locale].text), ['卷曲噪波', '捲曲噪波', 'カールノイズ']);
  const curlAmount = sourceBound('nodeAttr:noiseEngine.curlAmplitude', 'Curl Amount',
    '9c7cda91a1259e670209ce25d028a6e0aa1ff2d0661449c5df5dbfb59d40cc33');
  assert.deepEqual(LOCALES.map(locale => curlAmount.translations[locale].text), ['卷曲量', '捲曲量', 'カール量']);

  const metaballs = sourceBound('nodeName:metaballs', 'Metaballs',
    '18e48b97c19d3ddb9a6c277988e8f419abd9964233db5cb873517be82d2c6b90');
  assert.deepEqual(LOCALES.map(locale => metaballs.translations[locale].text), ['融合球', '融合球', 'メタボール']);
  const textBox = sourceBound('nodeAttr:measureText.textBoxSize', 'Text Box Size',
    '494f1ccd3338868dab4c038be3aceb26732d01bfe24557c387e30818e95645ee');
  assert.deepEqual(LOCALES.map(locale => textBox.translations[locale].text),
    ['文本框大小', '文字框大小', 'テキストボックスサイズ']);
  const projecting = sourceBound('nodeAttrEnum:pathOffsetBehaviour.openPathMode.3', 'Projecting',
    '06f1b07d3ce43e36f0fde52666649eabba69b6aa3c605e79e1eddcf51258ce39');
  assert.deepEqual(LOCALES.map(locale => projecting.translations[locale].text), ['投影', '投影', '突出線端']);

  const multiply = sourceBound('nodeAttrEnum:math.operation.2', 'Multiply',
    '6b758c866590a888849217adb95d717eeaf86ae1997333dae372faf12dcf1d24');
  assert.deepEqual(LOCALES.map(locale => multiply.translations[locale].text), ['相乘', '相乘', '乗算']);
  const modulus = sourceBound('nodeAttrEnum:math.operation.4', 'Modulus',
    'a38306192bead25f8c0add0a2ba99b0200986e418c0530f102d1fd6d64f7ff17');
  assert.deepEqual(LOCALES.map(locale => modulus.translations[locale].text), ['求余', '求餘', 'モジュラス']);
  const roundCap = sourceBound('nodeAttrEnum:pathOffsetBehaviour.openPathMode.4', 'Round',
    '874987bfab527023812ae768b6bb7db2f422b64fd4d8dbaa2b4705fbd9fd8e89');
  assert.deepEqual(LOCALES.map(locale => roundCap.translations[locale].text), ['圆头端点', '圓端點', '丸型線端']);
  const transform = sourceBound('nodeInfo:manipulator', 'Apply transformations to Shapes.',
    '13037380220ff43596315bef496d177bb884cb425ffe79f38051e87dd37b37a3');
  assert.equal(transform.translations['zh-Hant'].text, '對形狀套用變換。');
});

// -- B01：有限128槽实际旧译守门，不作全局同词替换 -----------

test('node B01 pins all 128 finite repairs and rejects every actual old-value rollback', () => {
  const { entries } = require('../languages/native/remaining_node_ui_b_01');
  assert.equal(NODE_B_FIRST_REPAIRS.length, 128);
  assert.equal(new Set(NODE_B_FIRST_REPAIRS.map(([key]) => key)).size, 58);
  assertFiniteRepairs(entries, NODE_B_FIRST_REPAIRS);
  for (const [key, locale, before] of NODE_B_FIRST_REPAIRS) {
    const reverted = structuredClone(entries);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, NODE_B_FIRST_REPAIRS), undefined, `${key}/${locale}`);
  }
});
test('node B01 separates numeric multiplication, image blending, text lines and physics bodies', () => {
  const { entries, provenance } = require('../languages/native/remaining_node_ui_b_01');
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.equal(provenance.independentFullReviewCount, 1);
  assert.equal(provenance.rootRevision.changedKeys, 58);
  assert.equal(provenance.rootRevision.changedLocaleSlots, 128);
  assert.equal(provenance.rootRevision.confirmedErrorSlots, 69);
  assert.equal(provenance.rootRevision.advisorySlotsAdopted, 59);
  for (const owner of ['applyFontSize', 'behaviour']) {
    const multiply = byKey.get(`nodeAttrEnum:${owner}.blendMode.4`);
    assert.deepEqual(LOCALES.map(l => multiply.translations[l].text), ['相乘', '相乘', '乗算']);
  }
  assert.equal(byKey.get('nodeAttrEnum:blendShader.blendMode.24').translations['zh-Hans'].text, '正片叠底');
  assert.equal(byKey.get('nodeAttrEnum:blendShader.blendMode.16').translations.ja_JP.text, '暗く');
  assert.equal(byKey.get('nodeAttrEnum:blendShader.blendMode.17').translations.ja_JP.text, '明るく');
  assert.deepEqual(LOCALES.map(l => byKey.get('nodeAttrEnum:applyFontSize.indexMode.0').translations[l].text), ['行', '行', '行']);
  assert.deepEqual(LOCALES.map(l => byKey.get('nodeAttr:capsuleShape.end').translations[l].text), ['终点', '終點', '終点']);
  assert.equal(byKey.get('nodeAttrEnum:colorBlend.gradientMode.3').translations.ja_JP.text, 'Oklab 補間');
  assert.equal(byKey.get('nodeAttrEnum:colorInfo.mode.2').translations['zh-Hant'].text, '明度');
  assert.equal(byKey.get('nodeName:bodySettingCollisionEvent').translations['zh-Hans'].text, '物体设置碰撞事件');
  assert.match(byKey.get('attrInfo:buoyancyField.surfaceTensionForce').translations['zh-Hans'].text, /冲量/);
  for (const [key, locale, wrong] of [
    ['nodeAttrEnum:applyFontSize.blendMode.4', 'zh-Hans', '正片叠底'],
    ['nodeAttrEnum:applyFontSize.indexMode.0', 'ja_JP', '線'],
    ['nodeName:bodySettingCollisionEvent', 'zh-Hans', '刚体设置碰撞事件'],
  ]) {
    const bad = structuredClone(entries);
    bad.find(row => row.key === key).translations[locale].text = wrong;
    assert.throws(() => assertFiniteRepairs(bad, NODE_B_FIRST_REPAIRS));
  }
});

// -- Global04：精确有限修订，合法词形保持 ---------------------
test('global UI04 pins 154 actual finite repairs and rejects each original-value rollback', () => {
  const { entries } = require('../languages/native/remaining_global_ui_04');
  assert.equal(GLOBAL_FOURTH_REPAIRS.length, 154);
  assert.equal(new Set(GLOBAL_FOURTH_REPAIRS.map(([key]) => key)).size, 83);
  assertFiniteRepairs(entries, GLOBAL_FOURTH_REPAIRS);
  for (const [key, locale, before] of GLOBAL_FOURTH_REPAIRS) {
    const reverted = structuredClone(entries);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, GLOBAL_FOURTH_REPAIRS), undefined, `${key}/${locale}`);
  }
});
test('global UI04 keeps valid loanwords and Unicode while colour names, graph view and counts stay exact', () => {
  const { entries, provenance } = require('../languages/native/remaining_global_ui_04');
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.equal(provenance.independentFullReviewCount, 1);
  assert.equal(provenance.rootRevision.changedLocaleSlots, 154);
  assert.equal(provenance.rootRevision.confirmedErrorSlots, 93);
  assert.equal(provenance.rootRevision.advisorySlotsAdopted, 61);
  assert.equal(byKey.get('playback.window.title').translations.ja_JP.text, 'プレイバック');
  assert.equal(byKey.get('playback.grid.editor.type.regular').translations.ja_JP.text, 'レギュラー');
  assert.equal(byKey.get('palette.gradient.revert').translations.ja_JP.text, 'リバート');
  const transform = byKey.get('preset.save.transforms.tooltip').translations['zh-Hant'].text;
  assert.match(transform, /縮放/); assert.ok(!transform.includes('缩'));
  assert.equal(byKey.get('preferences.option.rememberCurveFraming').translations['zh-Hant'].text, '記住圖形編輯器中的曲線檢視範圍');
  assert.equal(byKey.get('projectStats.section.nodeTypes').translations['zh-Hans'].text, '各类节点数量');
  for (const [key, locale, expected] of [
    ['palette.gradient.value', 'zh-Hant', '明度'],
    ['palette.dialog.saveAsJson', 'zh-Hans', '保存为 JSON'],
    ['projectAssets.colour.linearSRGB', 'ja_JP', 'リニア sRGB'],
  ]) assert.equal(byKey.get(key).translations[locale].text, expected);
  for (const [key, locale, wrong] of [
    ['preferences.option.rememberCurveFraming', 'zh-Hant', '記住曲線編輯器的檢視範圍'],
    ['projectStats.section.nodeTypes', 'zh-Hans', '节点类型数'],
    ['palette.menu.selectLayersWithColor', 'ja_JP', 'カラー付きレイヤーを選択'],
    ['playback.log.compositionAlphaWarning', 'ja_JP', 'コンポジション背景のアルファ値は255に設定されています。コンポジションメニューから背景を透明にしてください。'],
  ]) {
    const bad = structuredClone(entries);
    bad.find(row => row.key === key).translations[locale].text = wrong;
    assert.throws(() => assertFiniteRepairs(bad, GLOBAL_FOURTH_REPAIRS));
  }
});

// -- 第二节点B完整owner与38个实际原稿回退 -----------------------
test('node UI B02 pins 38 finite repairs and rejects each actual old-value rollback', () => {
  const rows = require('../languages/native/remaining_node_ui_b_02').entries;
  assert.equal(NODE_B_SECOND_REPAIRS.length, 38);
  assertFiniteRepairs(rows, NODE_B_SECOND_REPAIRS);
  for (const [key, locale, before] of NODE_B_SECOND_REPAIRS) {
    const reverted = structuredClone(rows);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, NODE_B_SECOND_REPAIRS), undefined, key + '/' + locale);
  }
});
test('node UI B02 separates physical impulse, HSV value, submeshes and extrude end faces', () => {
  const { entries, provenance } = require('../languages/native/remaining_node_ui_b_02');
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.equal(provenance.independentFullReviewCount, 1);
  assert.equal(provenance.rootRevision.changedLocaleSlots, 38);
  assert.equal(provenance.rootRevision.confirmedErrorSlots, 23);
  assert.equal(provenance.rootRevision.advisorySlotsAdopted, 15);
  assert.deepEqual(LOCALES.map(l => byKey.get('nodeAttrEnum:edgeDetection.greyScaleMode.3').translations[l].text), ['明度', '明度', '明度']);
  assert.equal(byKey.get('nodeAttrEnum:distanceConstraint.breakingMode.3').translations['zh-Hant'].text, '衝量');
  assert.equal(byKey.get('nodeAttr:extrude.capEnd').translations.ja_JP.text, '端面を閉じる');
  assert.equal(byKey.get('nodeAttr:extrude.combineMeshes').translations['zh-Hant'].text, '合併網格');
  assert.equal(byKey.get('nodeAttr:extrude.combineMeshes').translations.ja_JP.text, 'メッシュを結合');
  assert.equal(byKey.get('nodeAttr:getSubMeshTransform.index').translations.ja_JP.text, 'サブメッシュインデックス');
  assert.equal(byKey.get('nodeAttrEnum:connectShape.autoBezierMode.0').source, 'Shoulder Both');
  assert.equal(byKey.get('nodeAttrEnum:gradientMapFilter.greyscaleMode.7').translations.ja_JP.text, 'カスタム RGB 倍率');
});

// -- 第五全局UI：有限旧值回退与联合句法 --------------------------
test('global UI05 scopes placeholder punctuation revisions and restores both historical summaries', () => {
  const { entries, provenance } = require('../languages/native/remaining_global_ui_05');
  const row = entries.find(
    entry => entry.key === 'sceneTree.placeholder.empty'
  );
  assert.ok(row);
  assert.deepEqual(identity(row), [
    'sceneTree.placeholder.empty',
    'Definitions/Translation/appStrings',
    null,
    ['sceneTree.placeholder.empty'],
    'Use the Create menu to add a Layer to the active Composition.',
    ['Placeholder text; ‘Create menu’ names the app’s menu for adding layers.'],
    false,
    'Use the Create menu to add a Layer to the active Composition.',
    undefined,
    undefined,
  ]);
  assert.equal(row.translations['zh-Hans'].decision, 'translate');
  assert.equal(row.translations['zh-Hans'].text, '使用“创建”菜单向当前合成添加图层');
  assert.equal(row.translations['zh-Hant'].decision, 'translate');
  assert.equal(row.translations['zh-Hant'].text, '使用「建立」選單將圖層新增至作用中的合成');
  assert.equal(row.translations.ja_JP.text, '作成メニューからアクティブなコンポジションにレイヤーを追加してください');
  assert.doesNotMatch(row.translations['zh-Hans'].text, /。$/);
  assert.doesNotMatch(row.translations['zh-Hant'].text, /。$/);
  assert.doesNotMatch(row.translations.ja_JP.text, /。$/);
  const chineseRevision = provenance.placeholderPunctuationRevision;
  assert.equal(chineseRevision.approvedBy, 'primary-agent');
  assert.equal(chineseRevision.key, row.key);
  assert.deepEqual(chineseRevision.locales, ['zh-Hans', 'zh-Hant']);
  assert.equal(chineseRevision.changedLocaleSlots, 2);
  assert.equal(chineseRevision.sourceIdentitySha256, nativeSourceIdentitySha256(row));
  assert.equal(chineseRevision.liveApproval, false);
  assert.equal(chineseRevision.currentDecisionSha256, FIFTH_PRE_JA_DECISIONS);
  assert.equal(chineseRevision.previousDecisionSha256,
    '98b48d199a2dbc1c025ff3fc739960abfc677f82f6764fe9df16a3000093f095');
  assert.equal(provenance.approvalReceiptSha256,
    'e2381d3f033e09c47f8f54addc372218bc6d9308cf16b86a815c5b2497075e2c');
  const japaneseRevision = provenance.placeholderJapaneseNoFullStopRevision;
  assert.equal(japaneseRevision.requestedBy, 'user');
  assert.equal(japaneseRevision.approvedBy, 'primary-agent');
  assert.equal(japaneseRevision.approvalState, 'approved-source-bound-single-key-revision');
  assert.equal(japaneseRevision.approvalReceiptSha256,
    '00a264bcdc50bf6d04cf66fc5725f6aeecb17701e71538dbe785358b0caa14b9');
  assert.equal(japaneseRevision.key, row.key);
  assert.deepEqual(japaneseRevision.locales, ['ja_JP']);
  assert.equal(japaneseRevision.changedLocaleSlots, 1);
  assert.equal(japaneseRevision.sourceIdentitySha256, nativeSourceIdentitySha256(row));
  assert.equal(japaneseRevision.sourceIdentityChanged, false);
  assert.equal(japaneseRevision.vendorJapaneseChanged, false);
  assert.equal(japaneseRevision.liveApproval, false);
  assert.equal(japaneseRevision.previousDecisionSha256, FIFTH_PRE_JA_DECISIONS);
  assert.equal(japaneseRevision.currentDecisionSha256, FIFTH_PRE_EMPTY_REGION_CATEGORY);
  assert.equal(japaneseRevision.instructionSha256,
    '4be7cfbda9b09b6641fbebea0d5ae616c0edc9990d2fc34bf465b30677424f04');
  assert.equal(japaneseRevision.previousTranslationSha256,
    crypto.createHash('sha256')
      .update('作成メニューからアクティブなコンポジションにレイヤーを追加してください。')
      .digest('hex'));
  assert.equal(japaneseRevision.currentTranslationSha256,
    crypto.createHash('sha256').update(row.translations.ja_JP.text).digest('hex'));
  // -- 仅恢复日文即回到两中文修订后的旧完整摘要 -------------------
  const beforeJapanese = structuredClone(entries);
  const categoryRevision = provenance.emptyRegionPromptPunctuationRevision.changes
    .find(change => change.key === 'renderQueue.tree.placeholder');
  const renderQueuePlaceholder = beforeJapanese.find(entry => entry.key === categoryRevision.key);
  for (const locale of LOCALES) {
    renderQueuePlaceholder.translations[locale].text = categoryRevision.previousTranslations[locale];
  }
  beforeJapanese.find(entry => entry.key === row.key).translations.ja_JP.text += '。';
  assert.equal(hash(decisionRows(beforeJapanese)), japaneseRevision.previousDecisionSha256);
  // -- 再恢复两中文即回到其历史审批摘要 ---------------------------
  const historical = structuredClone(beforeJapanese);
  const historicalRow = historical.find(entry => entry.key === row.key);
  for (const locale of chineseRevision.locales) historicalRow.translations[locale].text += '。';
  assert.equal(hash(decisionRows(historical)), chineseRevision.previousDecisionSha256);
});

test('global UI03 JS Snippet placeholder keeps CJK punctuation out through the producer', () => {
  const { entries, provenance } = require('../languages/native/remaining_global_ui_03');
  const row = entries.find(entry => entry.key === 'jsSnippets.placeholder');
  const expected = {
    'zh-Hans': '将一些 JavaScript 拖到此处以创建代码片段',
    'zh-Hant': '將一些 JavaScript 拖曳至此以建立程式碼片段',
    ja_JP: 'JavaScriptをここにドラッグしてスニペットを作成します',
  };
  assert.ok(row);
  assert.equal(row.source, 'Drag some JavaScript here to make a Snippet.');
  assert.equal(row.vendorJapanese, row.source);
  const revision = provenance.jsSnippetPlaceholderNoFullStopRevision;
  assert.equal(revision.requestedBy, 'user');
  assert.equal(revision.approvedBy, 'primary-agent');
  assert.equal(revision.key, row.key);
  assert.deepEqual(revision.locales, LOCALES);
  assert.equal(revision.changedLocaleSlots, 3);
  assert.equal(revision.sourceIdentitySha256, nativeSourceIdentitySha256(row));
  assert.equal(revision.previousDecisionSha256, THIRD_PRE_SNIPPET_PLACEHOLDER_REVISION);
  assert.equal(revision.currentDecisionSha256, THIRD_PRE_EMPTY_REGION_CATEGORY);
  assert.equal(revision.sourceIdentityChanged, false);
  assert.equal(revision.vendorJapaneseChanged, false);
  assert.equal(revision.liveApproval, false);
  assert.equal(provenance.approvalReceiptSha256,
    '4c744a0e2b48fe04581430ed2125540b02aee0f6874dced9665b3e91172fc6e4');

  for (const locale of LOCALES) {
    assert.equal(row.translations[locale].decision, 'translate');
    assert.equal(row.translations[locale].text, expected[locale]);
    assert.doesNotMatch(row.translations[locale].text, /[。.]$/u);
    assert.equal(revision.translations[locale].previous.endsWith('。'), true);
    assert.equal(revision.translations[locale].previousSha256,
      crypto.createHash('sha256').update(revision.translations[locale].previous).digest('hex'));
    assert.equal(revision.translations[locale].current, expected[locale]);
    assert.equal(revision.translations[locale].currentSha256,
      crypto.createHash('sha256').update(expected[locale]).digest('hex'));
    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[locale] }));
    const resolved = resolveTranslations(entries, locale, reviews);
    const [record] = JSON.parse(renderNativePack(resolved));
    assert.deepEqual(record.value[row.key], { 'UI-text': expected[locale] });
  }

  const historical = structuredClone(entries);
  const categoryRevision = provenance.emptyRegionPromptPunctuationRevision.changes
    .find(change => change.key === 'meshExplorer.empty');
  const meshExplorer = historical.find(entry => entry.key === categoryRevision.key);
  for (const locale of LOCALES) {
    meshExplorer.translations[locale].text = categoryRevision.previousTranslations[locale];
  }
  const historicalRow = historical.find(entry => entry.key === row.key);
  for (const locale of revision.locales) {
    historicalRow.translations[locale].text = revision.translations[locale].previous;
  }
  assert.equal(hash(decisionRows(historical)), revision.previousDecisionSha256);
});

test('global UI05 pins 133 finite source-bound repairs and every actual old-value rollback', () => {
  const rows = require('../languages/native/remaining_global_ui_05').entries;
  assert.equal(GLOBAL_FIFTH_REPAIRS.length, 133);
  assert.equal(new Set(GLOBAL_FIFTH_REPAIRS.map(([key]) => key)).size, 73);
  assertFiniteRepairs(rows, GLOBAL_FIFTH_REPAIRS);
  for (const [key, locale, before] of GLOBAL_FIFTH_REPAIRS) {
    const reverted = structuredClone(rows);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, GLOBAL_FIFTH_REPAIRS), undefined, key + '/' + locale);
  }
});
test('global UI05 composes all 18 safety warnings and keeps parenting direction and valid ID words', () => {
  const { entries, provenance } = require('../languages/native/remaining_global_ui_05');
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.equal(provenance.independentFullReviewCount, 1);
  assert.equal(provenance.rootRevision.changedLocaleSlots, 133);
  assert.equal(provenance.rootRevision.confirmedErrorSlots, 68);
  assert.equal(provenance.rootRevision.advisorySlotsAdopted, 65);
  const cases = [
    ['zh-Hans', '此脚本还会{0}。', '{0} {1}。你信任此脚本吗？', '运行 Shell 命令', '调用 Web API', '调用 Web API 并运行 Shell 命令'],
    ['zh-Hant', '此指令碼也會{0}。', '{0} {1}。你信任此指令碼嗎？', '執行 Shell 命令', '呼叫 Web API', '呼叫 Web API 並執行 Shell 命令'],
    ['ja_JP', 'このスクリプトはさらに{0}。', '{0} は{1}。このスクリプトを信頼しますか？', 'シェルコマンドを実行します', 'Web API を呼び出します', 'Web API を呼び出し、シェルコマンドを実行します'],
  ];
  let renderedCases = 0;
  for (const [locale, also, trust, ...fragments] of cases) {
    for (const [index, suffix] of ['shellCommands', 'webCalls', 'webCallsAndShellCommands'].entries()) {
      const fragment = byKey.get('scriptSafety.scan.' + suffix).translations[locale].text;
      assert.equal(fragment, fragments[index]);
      for (const [suffix, expectedTemplate] of [['alsoCapabilities', also], ['doYouTrust', trust]]) {
        const template = byKey.get('scriptSafety.dialog.' + suffix).translations[locale].text;
        assert.equal(template, expectedTemplate);
        const output = template.replace('{0}', suffix === 'alsoCapabilities' ? fragment : 'myScript.js').replace('{1}', fragment);
        assert.ok(!/\{\d+\}/.test(output));
        if (locale === 'ja_JP') assert.ok(!/実行します(?:を)?実行|呼び出します(?:を)?実行|しますします/.test(output));
        renderedCases++;
      }
    }
  }
  assert.equal(renderedCases, 18);
  assert.deepEqual(LOCALES.map(l => byKey.get('sceneTree.dialog.parent').translations[l].text), ['建立父子关系', '建立父子關係', '親子関係を設定']);
  assert.deepEqual(LOCALES.map(l => byKey.get('sceneTree.dialog.parentOrMove').translations[l].text), ['建立父子关系还是移入合成？', '建立父子關係還是移入合成？', '親子付けしますか？それともコンポジション内へ移動しますか？']);
  assert.deepEqual(LOCALES.map(l => byKey.get('sceneTree.menu.copyLayerId').translations[l].text), ['复制图层标识符', '複製圖層識別碼', 'レイヤー識別子をコピー']);
});

// -- 第三节点B：区域轴词和周期内分钟值 --------------------------
test('node UI B03 pins 50 actual source-bound repairs and rejects each old-value rollback', () => {
  const rows = require('../languages/native/remaining_node_ui_b_03').entries;
  assert.equal(NODE_B_THIRD_REPAIRS.length, 50);
  assert.equal(new Set(NODE_B_THIRD_REPAIRS.map(([key]) => key)).size, 31);
  assertFiniteRepairs(rows, NODE_B_THIRD_REPAIRS);
  for (const [key, locale, before] of NODE_B_THIRD_REPAIRS) {
    const reverted = structuredClone(rows);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, NODE_B_THIRD_REPAIRS), undefined, key + '/' + locale);
  }
});
test('node UI B03 retains Taiwan Row/Column axes and distinguishes minute counts from image blending', () => {
  const { entries, provenance } = require('../languages/native/remaining_node_ui_b_03');
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.equal(provenance.independentFullReviewCount, 1);
  assert.equal(provenance.rootRevision.changedLocaleSlots, 50);
  assert.equal(provenance.rootRevision.confirmedErrorSlots, 13);
  assert.equal(provenance.rootRevision.advisorySlotsAdopted, 37);
  assert.equal(byKey.get('nodeName:gridLayoutRow').translations['zh-Hant'].text, '網格佈局列');
  assert.equal(byKey.get('nodeInfo:gridLayoutRow').translations['zh-Hant'].text, '建立用於網格佈局群組的網格列。');
  assert.equal(byKey.get('nodeAttr:gridLayout.columns').translations['zh-Hant'].text, '欄');
  assert.equal(byKey.get('nodeAttr:gridLayout.rows').translations['zh-Hant'].text, '列');
  assert.equal(byKey.get('nodeAttr:gridLayoutRow.minimumColumnWidth').translations['zh-Hant'].text, '最小欄寬');
  for (const [index, expected] of [[6, '1時間内の経過時間（分）'], [7, '1日内の経過時間（分）'], [8, '1週間内の経過時間（分）'], [9, '1か月内の経過時間（分）'], [10, '1年内の経過時間（分）']]) {
    const row = byKey.get('nodeAttrEnum:localTime.mode.' + index);
    assert.ok(row.source.startsWith('Minutes through'));
    assert.equal(row.translations.ja_JP.text, expected);
  }
  assert.equal(byKey.get('nodeAttrEnum:math2.operation.2').source, 'Multiply');
  assert.equal(byKey.get('nodeAttrEnum:math2.operation.2').translations['zh-Hans'].text, '相乘');
});

// -- 最后全局UI：112文字与6物理键决定必须分别保护 ---------------
test('global UI06 pins 112 real repairs and rejects every original text rollback', () => {
  const rows = require('../languages/native/remaining_global_ui_06').entries;
  assert.equal(GLOBAL_SIXTH_REPAIRS.length, 112);
  assert.equal(new Set(GLOBAL_SIXTH_REPAIRS.map(([key]) => key)).size, 52);
  assertFiniteRepairs(rows, GLOBAL_SIXTH_REPAIRS);
  for (const [key, locale, before] of GLOBAL_SIXTH_REPAIRS) {
    const reverted = structuredClone(rows);
    reverted.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertFiniteRepairs(reverted, GLOBAL_SIXTH_REPAIRS), undefined, key + '/' + locale);
  }
});
test('global UI06 preserves physical key names without altering raw DNT and keeps valid cap variants', () => {
  const { entries, provenance } = require('../languages/native/remaining_global_ui_06');
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.equal(provenance.rootRevision.changedLocaleSlots, 112);
  assert.equal(provenance.rootRevision.changedDecisionSlots, 6);
  assert.equal(provenance.rootRevision.confirmedErrorSlots, 75);
  assert.equal(provenance.rootRevision.advisorySlotsAdopted, 37);
  const assertKeys = rows => {
    const keyed = new Map(rows.map(row => [row.key, row]));
    for (const [key, locale, , after, identity] of GLOBAL_SIXTH_DECISION_REPAIRS) {
      const row = keyed.get(key);
      assert.equal(nativeSourceIdentitySha256(row), identity);
      assert.equal(row.dontTranslate === true, false);
      assert.equal(row.translations[locale].decision, after);
      assert.equal(row.translations[locale].text, row.source);
    }
  };
  assert.equal(GLOBAL_SIXTH_DECISION_REPAIRS.length, 6); assertKeys(entries);
  for (const [key, locale, before] of GLOBAL_SIXTH_DECISION_REPAIRS) {
    const reverted = structuredClone(entries);
    reverted.find(row => row.key === key).translations[locale].decision = before;
    assert.throws(() => assertKeys(reverted));
  }
  assert.deepEqual(LOCALES.map(l => byKey.get('tool.cap.projecting').translations[l].text), ['投影', '投影', '突出線端']);
  assert.equal(byKey.get('uploadManager.log.noPreset').translations.ja_JP.text, '現在のプリセットはありません。');
});
