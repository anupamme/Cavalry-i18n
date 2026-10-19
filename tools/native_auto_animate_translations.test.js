#!/usr/bin/env node
/**
 * [INPUT]: 依赖官方 2.8 autoAnimate 源绑定数据、native_language_pack 投影和原生三语格式门
 * [OUTPUT]: 锁定 128 个显示叶的 owner/source/notes/key 摘要、三语格式、当前 UI 标签引用、厂商日语优先与模型身份隔离
 * [POS]: tools 的 autoAnimate 全域补译合同；只验数据边界，不证明实机布局或运行时部署完成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { test } = require('node:test');
const {
  collectNativeCatalog,
  renderNativePack,
  resolveTranslations,
} = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');

const LANGUAGES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const SOURCE_PAIRS_SHA256 = 'e512895495cf8b593c43eabb550d746e1d1f55e084ca47608ea82656c72baffa';
const SOURCE_IDENTITY_SHA256 = '60b2395d07dd91f409256077462f5a3a5c7615fec7fa0d24c2b133b5e89bc6eb';
const OFFICIAL_NODE_SOURCE_SHA256 = 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0';
const OFFICIAL_VENDOR_JAPANESE_SHA256 = '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439';
const nativeAutoAnimate = () => require('../languages/native/nodes_auto_animate.js');
const compareKeys = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const sha256 = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function createNodeStrings(entries, vendorTranslation) {
  const value = { nodeType: 'autoAnimate', modelIdentity: 'autoAnimate:model-identity' };
  for (const entry of entries) {
    let target = value;
    for (const part of entry.fieldPath.slice(0, -1)) {
      target[part] ??= {};
      assert.equal(typeof target[part], 'object', `display path collides with identity at ${entry.key}`);
      target = target[part];
    }
    const leaf = entry.fieldPath.at(-1);
    assert.equal(target[leaf], undefined, `duplicate display path at ${entry.key}`);
    target[leaf] = {
      'UI-text': entry.source,
      notes: entry.notes,
      ...(entry.dontTranslate ? { dontTranslate: true } : {}),
    };
  }
  const source = [{ type: 'nodeStrings', value }];
  const vendorJapanese = vendorTranslation ? [{
    type: 'nodeStrings',
    value: buildVendorValue(entries, vendorTranslation),
  }] : [];
  return { source, vendorJapanese };
}

function buildVendorValue(entries, vendorTranslation) {
  const value = { nodeType: 'autoAnimate' };
  const entry = entries.find(row => row.key === vendorTranslation.key);
  assert.ok(entry, `vendor fixture key is unknown: ${vendorTranslation.key}`);
  let target = value;
  for (const part of entry.fieldPath.slice(0, -1)) target = target[part] ??= {};
  target[entry.fieldPath.at(-1)] = { 'UI-text': vendorTranslation.text };
  return value;
}

function reviewsFor(entries, language) {
  return entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[language] }));
}

function assertAutoAnimateProvenance(provenance) {
  assert.equal(provenance.cavalryVersion, '2.8.0');
  assert.equal(provenance.catalogPath, 'Definitions/Translation/nodeStrings_en-GB.source.json');
  assert.equal(provenance.sourceSha256, OFFICIAL_NODE_SOURCE_SHA256);
  assert.equal(provenance.vendorJapaneseSha256, OFFICIAL_VENDOR_JAPANESE_SHA256);
  assert.equal(provenance.sourcePairsSha256, SOURCE_PAIRS_SHA256);
  assert.equal(provenance.skillPath, '.agents/skills/baoyu-translate/SKILL.md');
  assert.equal(provenance.skillCommit, '1567581c26ec29f4216c6e6835415bf30343b0e3');
  assert.equal(provenance.mode, 'refined');
  assert.equal(provenance.draftProvider, 'AGY CLI');
  assert.equal(provenance.draftModel, 'gemini-3.8-flash-high');
  assert.equal(provenance.draftExecutionMode, 'accept-edits');
}

test('autoAnimate pins all 128 official source rows, owner identities, role coverage and digests', () => {
  const { entries, provenance } = nativeAutoAnimate();
  assertAutoAnimateProvenance(provenance);
  assert.equal(entries.length, 128);
  assert.equal(new Set(entries.map(entry => entry.key)).size, 128);
  assert.ok(entries.every(entry => entry.owner === 'autoAnimate'));
  assert.deepEqual(Object.fromEntries(['attribute-info', 'attribute-label', 'enum-label', 'node-info', 'node-name', 'tab-label']
    .map(role => [role, entries.filter(entry => entry.displayRole === role).length])), {
    'attribute-info': 34,
    'attribute-label': 38,
    'enum-label': 51,
    'node-info': 1,
    'node-name': 1,
    'tab-label': 3,
  });
  const sorted = [...entries].sort((left, right) => compareKeys(left.key, right.key));
  assert.deepEqual(entries, sorted, 'entry order must be deterministic by stable key');
  assert.equal(sha256(entries.map(entry => [entry.key, entry.source])), SOURCE_PAIRS_SHA256);
  assert.equal(sha256(entries.map(entry => [entry.key, entry.owner, entry.fieldPath, entry.source, entry.notes])),
    SOURCE_IDENTITY_SHA256);
  for (const entry of entries) {
    assert.ok(Array.isArray(entry.fieldPath) && entry.fieldPath.length > 0);
    assert.ok(Array.isArray(entry.notes) && entry.notes.every(note => typeof note === 'string'));
    assert.equal(entry.dontTranslate, false, `${entry.key} must preserve the official translate boundary`);
  }
});

test('every autoAnimate display leaf has three explicit, source-consistent translations passing the native format gate', () => {
  const { entries } = nativeAutoAnimate();
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry.translations).sort(), [...LANGUAGES].sort(), entry.key);
    for (const language of LANGUAGES) {
      const translation = entry.translations[language];
      assert.ok(['translate', 'preserve'].includes(translation.decision), `${entry.key} ${language}`);
      assert.ok(typeof translation.text === 'string' && translation.text.trim(), `${entry.key} ${language}`);
      assert.equal(translation.text === entry.source, translation.decision === 'preserve', `${entry.key} ${language}`);
      assertNativeTranslationFormat(entry.source, translation.text);
      assert.equal((translation.text.match(/\n/g) || []).length, (entry.source.match(/\n/g) || []).length,
        `line count changed for ${entry.key} ${language}`);
    }
  }
});

test('autoAnimate translations project only display leaves and leave node identity/source data untouched', () => {
  const { entries } = nativeAutoAnimate();
  const { source, vendorJapanese } = createNodeStrings(entries);
  const before = structuredClone(source);
  const projected = collectNativeCatalog('node', source, vendorJapanese);
  assert.deepEqual(projected.unmapped, []);
  assert.equal(projected.entries.length, 128);
  assert.deepEqual(projected.entries.map(entry => entry.key), entries.map(entry => entry.key));
  for (const language of LANGUAGES) {
    const resolved = resolveTranslations(projected.entries, language, reviewsFor(entries, language));
    assert.ok(resolved.rows.every(row => ['reviewed', 'preserved'].includes(row.status)));
    const [record] = JSON.parse(renderNativePack(resolved));
    assert.equal(record.type, 'strings');
    assert.equal(Object.keys(record.value).length, 128);
    for (const entry of entries) {
      assert.deepEqual(record.value[entry.key], { 'UI-text': entry.translations[language].text });
    }
  }
  assert.equal(source[0].value.nodeType, 'autoAnimate');
  assert.equal(source[0].value.modelIdentity, 'autoAnimate:model-identity');
  assert.deepEqual(source, before);
});

test('an actual vendor Japanese value wins over the autoAnimate supplement for the same stable key', () => {
  const { entries } = nativeAutoAnimate();
  const key = entries[0].key;
  const vendorText = '公式の autoAnimate 表示';
  const { source, vendorJapanese } = createNodeStrings(entries, { key, text: vendorText });
  const projected = collectNativeCatalog('node', source, vendorJapanese).entries;
  const resolved = resolveTranslations(projected, 'ja_JP', reviewsFor(entries, 'ja_JP'));
  const selected = resolved.rows.find(row => row.key === key);
  assert.equal(selected.status, 'vendor');
  assert.equal(selected.text, vendorText);
});

// -- 操作说明引用实际可选标签，不沿用旧英文控制模式别名 ------------
test('Auto-Animate tooltips reference the current progress-mode and level labels', () => {
  const byKey = new Map(nativeAutoAnimate().entries.map(entry => [entry.key, entry]));
  for (const language of LANGUAGES) {
    const text = key => byKey.get(key).translations[language].text;
    const individual = text('nodeAttrEnum:autoAnimate.progressMode.1');
    for (const aspect of ['bend', 'opacity', 'position', 'rotation', 'scale', 'visibility']) {
      assert.ok(text(`attrInfo:autoAnimate.${aspect}Progress`).includes(individual),
        `${language} ${aspect} progress must name its actual UI mode`);
    }
    assert.ok(text('attrInfo:autoAnimate.progress').includes(text('nodeAttrEnum:autoAnimate.progressMode.0')));
    const levels = text('nodeAttr:autoAnimate.useLevels');
    for (const key of ['alternateDirection', 'visibilityMode']) {
      assert.ok(text(`attrInfo:autoAnimate.${key}`).includes(`*${levels}*`));
    }
  }
});

test('Auto-Animate keeps camera Zoom distinct from Scale and preserves entrance and exit directions', () => {
  const byKey = new Map(nativeAutoAnimate().entries.map(entry => [entry.key, entry]));
  for (const [language, zoom, distance] of [
    ['zh-Hans', '变焦', '变焦距离'], ['zh-Hant', '變焦', '變焦距離'],
  ]) {
    const text = key => byKey.get(key).translations[language].text;
    assert.equal(text('nodeAttrEnum:autoAnimate.positionMode.3'), zoom);
    assert.equal(text('nodeAttr:autoAnimate.zoom'), zoom);
    assert.equal(text('nodeAttr:autoAnimate.distance'), distance);
    assert.notEqual(text('nodeAttr:autoAnimate.zoom'), text('nodeAttr:autoAnimate.scaleMode'));
    for (const key of ['nodeAttrEnum:autoAnimate.positionMode.1',
      'attrInfo:autoAnimate.directionMode', 'attrInfo:autoAnimate.positionMode']) {
      assert.doesNotMatch(text(key), /滑入/);
      assert.ok(text(key).includes('滑动') || text(key).includes('滑動'));
    }
  }
  for (const language of LANGUAGES) {
    const progress = byKey.get('attrInfo:autoAnimate.progress').translations[language].text;
    for (const token of ['0–100%', '0%', '100%', '0 → 100', '100 → 0']) assert.ok(progress.includes(token));
  }
  assert.doesNotMatch(byKey.get('attrInfo:autoAnimate.progress').translations.ja_JP.text, /イン（登場）|アウト（退場）/);
  assert.equal(byKey.get('nodeAttr:autoAnimate.progress').translations.ja_JP.text, 'プログレス');
  assert.equal(byKey.get('nodeAttr:autoAnimate.progressMode').translations.ja_JP.text, 'プログレスモード');
  assert.equal(byKey.get('nodeAttrEnum:autoAnimate.progressMode.1').translations.ja_JP.text,
    '精密プログレスコントロール');
  for (const language of LANGUAGES) {
    assert.doesNotMatch(byKey.get('attrInfo:autoAnimate.bendAngle').translations[language].text, /100%/,
      'full Bend Progress must not acquire an extra numeric promise');
  }
});
