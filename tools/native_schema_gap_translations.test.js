/**
 * [INPUT]: 依赖固定365条补充源、两个已审caption模块、显式registry及真实资源producer；只用合成官方catalog。
 * [OUTPUT]: 守住364键/1092槽源身份、三语摘要、有限错义回退及World Scale未决分母，证明派生包不伪造完整性。
 * [POS]: schema缺源准入的离线合同；不读取私账/App/profile，不以静态caption审批代替实屏验收。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { APPROVED_MODULES, approvedEntries } = require('../languages/native/approved_modules');
const { FIXED_SOURCE_ROWS } = require('./native_schema_supplement');
const { FIXED_GAP_SOURCE_ROWS } = require('./native_schema_gap_sources');
const { buildNativeResourceBundle } = require('./native_resource_bundle');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const PARTS = ['schema_attribute_gap_a', 'schema_attribute_gap_b'];
const LOCALES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const PENDING_KEY = 'nodeAttr:particleShape.worldScale';
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const modules = () => PARTS.map(name => require(`../languages/native/${name}`));

test('schema gap approvals enter only the explicit registry and keep one pending source key', () => {
  assert.equal(APPROVED_MODULES.length, 80);
  for (const name of PARTS) assert.equal(APPROVED_MODULES.filter(value => value === name).length, 1);
  const rows = modules().flatMap(part => part.entries);
  assert.equal(rows.length, 364);
  assert.equal(new Set(rows.map(row => row.key)).size, 364);
  assert.ok(!rows.some(row => row.key === PENDING_KEY));
  assert.equal(approvedEntries().length, 10650);
  assert.equal(FIXED_GAP_SOURCE_ROWS.length, 365);
  const sourceByKey = new Map(FIXED_GAP_SOURCE_ROWS.map(row => [row.key, row]));
  assert.deepEqual(FIXED_GAP_SOURCE_ROWS.filter(row => !rows.some(approval => approval.key === row.key))
    .map(row => row.key), [PENDING_KEY]);
  for (const row of rows) {
    const { translations, ...source } = row;
    assert.deepEqual(source, sourceByKey.get(row.key), row.key);
    assert.deepEqual(Object.keys(translations).sort(), [...LOCALES].sort());
    for (const locale of LOCALES) {
      assertNativeTranslationFormat(row.source, translations[locale].text);
      assert.ok(['translate', 'preserve'].includes(translations[locale].decision));
    }
  }
});

test('real producer counts pending World Scale honestly and leaves its fallback to native resolution', () => {
  const pairs = [{ id: 'Definitions/Translation/appStrings',
    source: [{ type: 'strings', value: { identity: { 'UI-text': 'ABI-ID', dontTranslate: true } } }],
    japanese: [{ type: 'strings', value: {} }],
  }];
  const approved = [...require('../languages/native/forge_attribute_supplement').entries,
    ...modules().flatMap(part => part.entries)];
  const sources = [...FIXED_SOURCE_ROWS, ...FIXED_GAP_SOURCE_ROWS];
  const before = JSON.stringify({ pairs, approved, sources });
  const { manifest, packs } = buildNativeResourceBundle(pairs, approved, undefined, sources);
  assert.equal(manifest.nativeKeys, 374);
  assert.equal(manifest.supplementalKeys, 373);
  assert.equal(manifest.approvedUIKeys, 372);
  assert.equal(manifest.complete, false);
  for (const locale of LOCALES) {
    assert.equal(manifest.packs[locale].missing, 1);
    const value = JSON.parse(packs[locale])[0].value;
    assert.equal(value[PENDING_KEY], undefined);
    assert.equal(Object.keys(value).length, 373);
    for (const row of approved) assert.deepEqual(value[row.key], { 'UI-text': row.translations[locale].text });
    assert.deepEqual(value.identity, { 'UI-text': 'ABI-ID' });
  }
  assert.equal(JSON.stringify({ pairs, approved, sources }), before);
});

test('producer aggregation refuses unknown, partial, official-colliding and cross-domain source identities', () => {
  const pairs = [{ id: 'Definitions/Translation/appStrings', source: [], japanese: [] }];
  const full = [...FIXED_SOURCE_ROWS, ...FIXED_GAP_SOURCE_ROWS];
  assert.throws(() => buildNativeResourceBundle(pairs, [], undefined,
    [...full, { catalogId: 'unproven-domain', key: 'extra' }]), /unknown.*supplement.*domain/);
  assert.throws(() => buildNativeResourceBundle(pairs, [], undefined,
    [...FIXED_SOURCE_ROWS, ...FIXED_GAP_SOURCE_ROWS.slice(1)]), /exactly 365/);
  const officialCollision = structuredClone(pairs);
  officialCollision[0].source = [{ type: 'strings', value: {
    [FIXED_GAP_SOURCE_ROWS[0].key]: { 'UI-text': FIXED_GAP_SOURCE_ROWS[0].source },
  } }];
  assert.throws(() => buildNativeResourceBundle(officialCollision, [], undefined, full), /official.*collision/);
  const crossDomain = structuredClone(full);
  crossDomain[FIXED_SOURCE_ROWS.length].key = FIXED_SOURCE_ROWS[0].key;
  assert.throws(() => buildNativeResourceBundle(pairs, [], undefined, crossDomain), /supplement.*collision/);
  const domainHijack = structuredClone(full);
  domainHijack[FIXED_SOURCE_ROWS.length].catalogId = FIXED_SOURCE_ROWS[0].catalogId;
  assert.throws(() => buildNativeResourceBundle(pairs, [], undefined, domainHijack), /eight source|exactly eight/);
});

test('the finite reviewed physics, layout, camera and CRT repairs cannot return to their old mistakes', () => {
  const rows = new Map(modules().flatMap(part => part.entries).map(row => [row.key, row]));
  const expected = {
    'nodeAttr:bodySettingCollisionEvent.fadeChanges': ['逐渐恢复原设置', '逐漸恢復原設定', '元の設定に徐々に戻す'],
    'nodeAttr:bodySettingCollisionEvent.fadeTime': ['恢复时长', '恢復時間', '元の設定に戻るまでの時間'],
    'nodeAttr:bodySettingCollisionEvent.killOnCollision': ['碰撞时移出模拟', '碰撞時移出模擬', '衝突時にシミュレーションから除外'],
    'nodeAttr:gridLayout.cellMargins': ['单元格内边距', '儲存格內邊距', 'セル内の余白'],
    'nodeAttr:crtScanLines.shadowMaskScale': ['荫罩缩放', '蔭罩縮放', 'シャドウマスクの倍率'],
    'nodeAttr:planarCamera.inputGuides': ['输入相机辅助框', '輸入攝影機輔助框', '入力ガイド'],
    'nodeAttr:particleShape.lifespan': ['粒子寿命', '粒子壽命', '寿命'],
    'nodeAttr:particleShape.fitToLifespan': ['适配粒子寿命', '適配粒子壽命', '寿命にフィット'],
  };
  for (const [key, values] of Object.entries(expected)) {
    assert.deepEqual(LOCALES.map(locale => rows.get(key).translations[locale].text), values, key);
  }
  assert.equal(sha(modules().flatMap(part => part.entries).map(row => row.key)),
    'aad7c7fd8bba9800fe193ef133b6f2ec6c05cfe98a51d44d9a24ce21d29f9785');
});

// -- 完整locale摘要守候选批准字节；不把摘要当独立语义审读 ---------
const LOCALE_DIGESTS = Object.freeze({
  "schema_attribute_gap_a": {
    "zh-Hans": "12b89a26a05d4f24b2cb8c2ae072b3f3b53363f3c317d8fa97eadb7eaaf7e464",
    "zh-Hant": "f2a16b4690270c9bb349f33be2528f6e989bfcee0b9c762feec41acc21abdd2b",
    "ja_JP": "b3b071eecb4275efaec75e7afd93c08a72a34dd8d10aac7e94a7b0a30a0febd2"
  },
  "schema_attribute_gap_b": {
    "zh-Hans": "15dafb6dd04d4b1d87b5ab390cd533e9c784e298a264bdbed9209ed6e5e76a4a",
    "zh-Hant": "5f2383609348496fc80c4ca132b1ce469553d797885739f92f776f28cdfc0706",
    "ja_JP": "00e81fd86ec5d7a569705d8ef8a1b14ee8e1ce2e23b8394fba585121c4e956d8"
  }
});
test('each full schema-gap locale keeps the reviewed decision bytes', () => {
  for (const name of PARTS) for (const locale of LOCALES) {
    const rows = require(`../languages/native/${name}`).entries;
    assert.equal(sha(rows.map(row => [row.key, row.translations[locale]])), LOCALE_DIGESTS[name][locale]);
  }
});
