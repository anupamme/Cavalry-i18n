#!/usr/bin/env node
/**
 * [INPUT]: 依赖 2.8 官方 appStrings/nodeStrings 稳定键摘要、源身份与原生三语格式门
 * [OUTPUT]: 锁定当前实机观察的 43 个显示键、完整 catalog 身份、Auto 限定词、DNT 边界及真实日语优先语义
 * [POS]: tools 的观测 UI 缺口 TDD；仅验静态源绑定数据，不证明 App 注入、现场覆盖或布局
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { test } = require('node:test');
const { collectNativeCatalog, renderNativePack, resolveTranslations } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');

const LANGUAGES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const SOURCE_PAIRS_SHA256 = '0bc8ae20ad1d868f58660fb15b0a152850346643fdb0ced622f33b49c8d9ac4e';
const SOURCE_IDENTITY_SHA256 = 'eeaa1613dbde8b6fcf4af7fa0a9dc9bf3cf29bf3013dc93ca76ad86aaff56efa';
const APP_SOURCE_SHA256 = '464f0d291cd7aac46dba9552ab08debf4302cbd36b7b8d9d49f692085004e82e';
const APP_VENDOR_JA_SHA256 = '4ecb6baf0196edaac4524bf9fbd12f4f082311239c89e9d6602770bd063d58dc';
const NODE_SOURCE_SHA256 = 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0';
const NODE_VENDOR_JA_SHA256 = '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439';

// -- 官方 catalog 精确观测集：不把同文案的不同 UI 身份合并 ----------
const EXPECTED_SOURCES = [
  ['attributeEditor.font.auto', 'Auto'],
  ['attributeEditor.font.generator', 'Generator'],
  ['attributeEditor.font.glyphs', 'Glyphs'],
  ['attributeEditor.font.openType', 'OpenType'],
  ['attributeEditor.font.reset', 'Reset'],
  ['attributeEditor.input.placeholder.dragShape', 'Drag in a Shape layer'],
  ['attributeEditor.input.placeholder.noConnection', 'No Connection'],
  ['nodeAttr:drawable.opacity', 'Opacity'],
  ...['10', '25', '50', '75', '100', '200', '400', '800'].map(value => [`playback.zoom.${value}`, `${value}%`]),
  ['shapeMenu.menu.reverseContour', 'Reverse Contours'],
  ['shapeMenu.menu.setFirstPoint', 'Set First Point'],
  ...[
    ['arc', 'Arc'], ['arrow', 'Arrow'], ['camera', 'Camera'], ['capsule', 'Capsule'],
    ['cogwheel', 'Cogwheel'], ['editShape', 'Edit Shape'], ['ellipse', 'Ellipse'],
    ['line', 'Line'], ['mesh', 'Mesh'], ['pen', 'Pen'], ['pencil', 'Pencil'],
    ['pivot', 'Pivot'], ['polygon', 'Polygon'], ['rectangle', 'Rectangle'],
    ['select', 'Select'], ['star', 'Star'], ['strokeWidth', 'Stroke Width'],
    ['superEllipse', 'Super Ellipse'], ['superShape', 'Super Shape'], ['text', 'Text'],
    ['tracking', 'Tracking'],
  ].map(([id, source]) => [`tool.${id}.name`, source]),
  ['viewport.settings.antiAliasing.auto', 'Auto (Recommended)'],
  ['viewport.settings.antiAliasing.msaa', 'Enhanced (MSAA)'],
  ['viewport.settings.antiAliasing.standard', 'Standard'],
  ['zoomMenu.menu.zoom', 'Zoom'],
].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);

const DONT_TRANSLATE_KEYS = new Set([
  'attributeEditor.font.openType',
  ...['10', '25', '50', '75', '100', '200', '400', '800'].map(value => `playback.zoom.${value}`),
]);
const loadError = (() => {
  try {
    return { data: require('../languages/native/runtime_observed_supplement.js'), error: null };
  } catch (error) {
    return { data: null, error };
  }
})();
const observed = loadError.data;
const compareKeys = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const sha256 = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function requireObservedData() {
  assert.ok(!loadError.error,
    `runtime observed UI data module must exist before its contract can pass: ${loadError.error?.message}`);
  assert.ok(observed && Array.isArray(observed.entries), 'module exports { provenance, entries }');
  return observed;
}

function translationsFor(entry) {
  assert.deepEqual(Object.keys(entry.translations || {}).sort(), [...LANGUAGES].sort(), entry.key);
  return entry.translations;
}

test('runtime observed supplement is present before its data contracts can pass', () => {
  requireObservedData();
});

test('all and only 43 official observed display keys bind exact source and catalog identity', { skip: !observed }, () => {
  const { entries, provenance } = requireObservedData();
  const expectedKeys = EXPECTED_SOURCES.map(([key]) => key);
  assert.equal(entries.length, 43);
  assert.deepEqual(entries.map(entry => entry.key), expectedKeys, 'entries are unique and deterministically key-sorted');
  assert.equal(new Set(entries.map(entry => entry.key)).size, 43);

  for (const [key, source] of EXPECTED_SOURCES) {
    const entry = entries.find(candidate => candidate.key === key);
    assert.ok(entry, `missing observed native key: ${key}`);
    assert.equal(entry.source, source, key);
    assert.ok(Array.isArray(entry.notes) && entry.notes.every(note => typeof note === 'string'), `${key} notes`);
    if (key === 'nodeAttr:drawable.opacity') {
      assert.equal(entry.catalogId, 'Definitions/Translation/nodeStrings', key);
      assert.equal(entry.owner, 'drawable', key);
      assert.deepEqual(entry.fieldPath, ['attributes', 'opacity', 'name'], key);
    } else {
      assert.equal(entry.catalogId, 'Definitions/Translation/appStrings', key);
      assert.equal(entry.owner, undefined, `${key} must not invent a node owner`);
      assert.deepEqual(entry.fieldPath, [key], key);
    }
    assert.equal(entry.dontTranslate === true, DONT_TRANSLATE_KEYS.has(key), `${key} DNT source contract`);
  }

  assert.equal(entries.filter(entry => entry.catalogId === 'Definitions/Translation/appStrings').length, 42);
  assert.equal(entries.filter(entry => entry.catalogId === 'Definitions/Translation/nodeStrings').length, 1);
  assert.equal(entries.filter(entry => entry.dontTranslate === true).length, 9);
  assert.equal(sha256(entries.map(entry => [entry.key, entry.source])), SOURCE_PAIRS_SHA256);
  assert.equal(sha256(entries.map(entry => [
    entry.key, entry.catalogId, entry.owner ?? null, entry.fieldPath,
    entry.source, entry.notes, entry.dontTranslate === true,
  ])), SOURCE_IDENTITY_SHA256);

  assert.equal(provenance.cavalryVersion, '2.8.0');
  assert.equal(provenance.sourcePairsSha256, SOURCE_PAIRS_SHA256);
  assert.equal(provenance.sourceIdentitySha256, SOURCE_IDENTITY_SHA256);
  assert.deepEqual(provenance.catalogs.appStrings, {
    sourcePath: 'Definitions/Translation/appStrings_en-GB.source.json',
    sourceSha256: APP_SOURCE_SHA256,
    vendorJapanesePath: 'Definitions/Translation/appStrings_ja-JP.translation.json',
    vendorJapaneseSha256: APP_VENDOR_JA_SHA256,
  });
  assert.deepEqual(provenance.catalogs.nodeStrings, {
    sourcePath: 'Definitions/Translation/nodeStrings_en-GB.source.json',
    sourceSha256: NODE_SOURCE_SHA256,
    vendorJapanesePath: 'Definitions/Translation/nodeStrings_ja-JP.translation.json',
    vendorJapaneseSha256: NODE_VENDOR_JA_SHA256,
  });
});

test('each observed row has an explicit format-safe reviewed value; DNT and OpenType remain exact', { skip: !observed }, () => {
  const { entries } = requireObservedData();
  for (const entry of entries) {
    const translations = translationsFor(entry);
    for (const language of LANGUAGES) {
      const target = translations[language];
      assert.ok(['translate', 'preserve'].includes(target.decision), `${entry.key} ${language} decision`);
      assert.ok(typeof target.text === 'string' && target.text.trim(), `${entry.key} ${language} text`);
      assert.equal(target.text === entry.source, target.decision === 'preserve', `${entry.key} ${language}`);
      assertNativeTranslationFormat(entry.source, target.text);
      assert.equal((target.text.match(/\n/g) || []).length, (entry.source.match(/\n/g) || []).length,
        `${entry.key} ${language} line count`);
      assert.equal(target.decision, DONT_TRANSLATE_KEYS.has(entry.key) ? 'preserve' : 'translate',
        `${entry.key} ${language} must follow official dontTranslate metadata`);
    }
  }
  for (const language of LANGUAGES) {
    assert.equal(entries.find(entry => entry.key === 'attributeEditor.font.openType').translations[language].text, 'OpenType');
    assert.match(entries.find(entry => entry.key === 'viewport.settings.antiAliasing.msaa').translations[language].text,
      /MSAA/, 'MSAA is an explicitly protected technical acronym');
  }
});

test('a genuinely translated vendor Japanese value wins, while an English vendor value does not block review', { skip: !observed }, () => {
  const entry = observed.entries.find(candidate => candidate.key === 'tool.arc.name');
  assert.ok(entry, 'synthetic precedence fixture uses an observed official registry key');
  const sourceRecord = [{ type: 'strings', value: { [entry.key]: { 'UI-text': entry.source, notes: entry.notes } } }];
  const vendorRecord = [{ type: 'strings', value: {
    [entry.key]: { 'UI-text': '円弧' },
  } }];
  const projected = collectNativeCatalog('appStrings', sourceRecord, vendorRecord).entries;
  const resolved = resolveTranslations(projected, 'ja_JP', [{
    key: entry.key, source: entry.source, decision: 'translate', text: '弧を描く',
  }]);
  assert.equal(resolved.rows[0].status, 'vendor');
  assert.equal(resolved.rows[0].text, '円弧');

  const englishVendor = [{ type: 'strings', value: {
    [entry.key]: { 'UI-text': entry.source },
  } }];
  const englishProjected = collectNativeCatalog('appStrings', sourceRecord, englishVendor).entries;
  const reviewed = resolveTranslations(englishProjected, 'ja_JP', [{
    key: entry.key, source: entry.source, decision: 'translate', text: '弧を描く',
  }]);
  assert.equal(reviewed.rows[0].status, 'reviewed');
  assert.equal(reviewed.rows[0].text, '弧を描く');
});

test('related Auto labels keep separate identities and the recommendation qualifier without rewriting source metadata', { skip: !observed }, () => {
  const { entries } = requireObservedData();
  const before = JSON.stringify(entries);
  const autoLabels = entries.filter(entry => entry.key === 'attributeEditor.font.auto'
    || entry.key === 'viewport.settings.antiAliasing.auto').map(entry => [entry.key, entry.source]);
  assert.deepEqual(autoLabels, [
    ['attributeEditor.font.auto', 'Auto'],
    ['viewport.settings.antiAliasing.auto', 'Auto (Recommended)'],
  ]);
  assert.equal(entries.filter(entry => entry.source === 'Standard').length, 1);
  assert.equal(entries.filter(entry => entry.source === 'Opacity').length, 1);

  const appEntry = entries.find(entry => entry.key === 'tool.arc.name');
  const nativeSource = [{ type: 'strings', value: { [appEntry.key]: { 'UI-text': appEntry.source, notes: appEntry.notes } } }];
  const nativeProjection = collectNativeCatalog('appStrings', nativeSource).entries;
  assert.deepEqual(nativeProjection.map(entry => entry.key), ['tool.arc.name']);
  assert.equal(nativeProjection[0].source, 'Arc');
  assert.deepEqual(nativeProjection[0].fieldPath, ['tool.arc.name']);
  assert.equal(JSON.stringify(entries), before);
});

test('the mixed observed app/node surface generates all 43 display keys while leaving drawable identity unchanged', { skip: !observed }, () => {
  const { entries } = requireObservedData();
  const appEntries = entries.filter(entry => entry.catalogId === 'Definitions/Translation/appStrings');
  const appSource = [{ type: 'strings', value: Object.fromEntries(appEntries.map(entry => [
    entry.key, { 'UI-text': entry.source, notes: entry.notes, ...(entry.dontTranslate ? { dontTranslate: true } : {}) },
  ])) }];
  const opacity = entries.find(entry => entry.key === 'nodeAttr:drawable.opacity');
  const nodeSource = [{ type: 'nodeStrings', value: {
    nodeType: 'drawable', niceName: 'Drawable', modelIdentity: 'fixture:drawable',
    attributes: { opacity: { name: { 'UI-text': opacity.source, notes: opacity.notes }, default: 1 } },
  } }];
  const before = structuredClone({ appSource, nodeSource });
  const projectedApp = collectNativeCatalog('Definitions/Translation/appStrings', appSource);
  const projectedNode = collectNativeCatalog('Definitions/Translation/nodeStrings', nodeSource);
  assert.deepEqual(projectedApp.unmapped, []);
  assert.deepEqual(projectedNode.unmapped, []);
  const projected = [...projectedApp.entries, ...projectedNode.entries];
  assert.equal(projected.length, 43);
  for (const language of LANGUAGES) {
    const resolved = resolveTranslations(projected, language, entries.map(entry => ({
      key: entry.key, source: entry.source, ...entry.translations[language],
    })));
    assert.ok(resolved.rows.every(row => ['reviewed', 'preserved'].includes(row.status)));
    const [record] = JSON.parse(renderNativePack(resolved));
    assert.equal(record.type, 'strings');
    assert.equal(Object.keys(record.value).length, 43);
    for (const entry of entries) assert.deepEqual(record.value[entry.key], { 'UI-text': entry.translations[language].text });
  }
  assert.deepEqual({ appSource, nodeSource }, before);
});

test('observed commands assign the selected first point and retain recommendation and motion-tracking meaning', { skip: !observed }, () => {
  const byKey = new Map(observed.entries.map(entry => [entry.key, entry]));
  assert.deepEqual(LANGUAGES.map(language => byKey.get('shapeMenu.menu.setFirstPoint').translations[language].text),
    ['设为第一点', '設為第一點', '最初のポイントに設定']);
  assert.deepEqual(LANGUAGES.map(language => byKey.get('viewport.settings.antiAliasing.auto').translations[language].text),
    ['自动（推荐）', '自動（建議）', '自動（推奨）']);
  assert.deepEqual(LANGUAGES.map(language => byKey.get('tool.tracking.name').translations[language].text),
    ['跟踪', '追蹤', 'トラッキング']);
});
