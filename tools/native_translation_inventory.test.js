#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_translation_inventory.js 的纯组合接口与合成 catalog/旧候选 surfaces
 * [OUTPUT]: 锁定稳定键合并、未映射可见性、dontTranslate/厂商日语优先级及候选状态非完成态
 * [POS]: tools 的全量旧译队列合同；不读官方 app、不调用翻译、不写语言包或用户目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const build = () => require('./native_translation_inventory.js').buildNativeTranslationInventory;
const strings = (values, options = {}) => [{
  type: 'strings', language: options.language || 'en',
  value: Object.fromEntries(Object.entries(values).map(([key, value]) => [key,
    typeof value === 'string' ? { 'UI-text': value } : { 'UI-text': value.text, ...value.meta },
  ])),
}];
const pair = (id, values, japanese = {}) => ({
  id, source: strings(values), japanese: strings(japanese, { language: 'ja' }),
});
const oldStrings = (locale, translations) => ({
  id: 'languages/en/appStrings.json', locale,
  english: [{ type: 'strings', language: 'en', value: Object.fromEntries(Object.keys(translations).map(source => [source, source])) }],
  target: [{ type: 'strings', language: locale, value: translations }],
});

test('composes stable-key catalog entries with exact old candidates without merging equal sources', () => {
  const inventory = build()({
    catalogPairs: [pair('appStrings', { 'menu.open': 'Open', 'toolbar.open': 'Open' })],
    jsonSurfaces: [oldStrings('zh-Hans', { Open: '打开' })],
    tsEntries: [],
  });

  assert.deepEqual(inventory.entries.map(entry => entry.key), ['menu.open', 'toolbar.open']);
  assert.equal(inventory.rows.length, 2);
  assert.equal(inventory.rows[0].locales['zh-Hans'].candidateKind, 'exact-single-candidate');
  assert.equal(inventory.rows[1].locales['zh-Hans'].candidateKind, 'exact-single-candidate');
  assert.equal(inventory.counts['zh-Hans']['exact-single-candidate'], 2);
  assert.deepEqual(inventory.catalogIds, ['appStrings']);
});

test('dontTranslate and official Japanese take priority while Chinese still counts legacy candidate work', () => {
  const inventory = build()({
    catalogPairs: [pair('appStrings', {
      'brand.name': { text: 'Brand', meta: { dontTranslate: true } },
      'menu.open': 'Open',
      'identity.keep': 'Keep English',
    }, {
      'brand.name': '品牌', 'menu.open': '開く', 'identity.keep': 'Keep English',
    })],
    jsonSurfaces: [
      oldStrings('zh-Hans', { Brand: '品牌旧', Open: '打开', 'Keep English': '保持英文' }),
      oldStrings('ja_JP', { Brand: 'ブランド旧', Open: '開く旧', 'Keep English': '英語を保持' }),
    ],
    tsEntries: [],
  });

  const byKey = Object.fromEntries(inventory.rows.map(row => [row.key, row]));
  assert.equal(byKey['brand.name'].locales.ja_JP.priority, 'dontTranslate');
  assert.equal(byKey['brand.name'].locales.ja_JP.candidateKind, 'exact-single-candidate');
  assert.equal(byKey['menu.open'].locales.ja_JP.priority, 'vendor-ja');
  assert.equal(byKey['menu.open'].locales.ja_JP.candidateKind, 'exact-single-candidate');
  assert.equal(byKey['menu.open'].locales['zh-Hans'].priority, null);
  assert.equal(byKey['menu.open'].locales['zh-Hans'].candidateKind, 'exact-single-candidate');
  assert.equal(byKey['identity.keep'].locales.ja_JP.priority, null);
  assert.equal(inventory.counts.ja_JP.dontTranslate, 1);
  assert.equal(inventory.counts.ja_JP['vendor-ja'], 1);
  assert.equal(inventory.counts.ja_JP['exact-single-candidate'], 1);
  assert.equal(inventory.counts['zh-Hans'].dontTranslate, 1);
  assert.equal(inventory.counts['zh-Hans']['vendor-ja'], 0);
  assert.equal(inventory.counts['zh-Hans']['exact-single-candidate'], 2);
});

test('390 vendor-Japanese rows remain untranslated work in both Chinese locales', () => {
  const source = Object.fromEntries(Array.from({ length: 390 }, (_, i) => [`native.${i}`, `Source ${i}`]));
  const japanese = Object.fromEntries(Array.from({ length: 390 }, (_, i) => [`native.${i}`, `日本語 ${i}`]));
  const inventory = build()({ catalogPairs: [pair('largeStrings', source, japanese)], jsonSurfaces: [], tsEntries: [] });

  for (const locale of ['zh-Hans', 'zh-Hant']) {
    assert.equal(inventory.counts[locale].total, 390);
    assert.equal(inventory.counts[locale]['no-existing-candidate'], 390);
    assert.equal(inventory.counts[locale]['vendor-ja'], 0);
  }
  assert.equal(inventory.counts.ja_JP['vendor-ja'], 390);
  assert.equal(inventory.rows.every(row => row.locales.ja_JP.priority === 'vendor-ja'), true);
});

test('unmapped display leaves are returned, empty catalog lists fail, and unsupported families throw', () => {
  const result = build()({
    catalogPairs: [
      pair('mapped', { 'menu.open': 'Open' }),
      { id: 'unmapped', source: [{ type: 'nodeStrings', value: {
        nodeType: 'custom', unknownDisplayFamily: { 'UI-text': 'Visible but unkeyed' },
      } }], japanese: [] },
    ],
    jsonSurfaces: [], tsEntries: [],
  });

  assert.equal(result.entries.length, 1);
  assert.equal(result.unmapped.length, 1);
  assert.equal(result.unmapped[0].source, 'Visible but unkeyed');
  assert.equal(result.unmapped[0].catalogId, 'unmapped');
  assert.throws(() => build()({ catalogPairs: [], jsonSurfaces: [], tsEntries: [] }), /catalogPairs/);
  assert.throws(() => build()({ catalogPairs: [{ id: 'bad', source: [{ type: 'unknown' }], japanese: [] }], jsonSurfaces: [], tsEntries: [] }), /unsupported native record type/);
});

test('catalog identities and registry key collisions fail closed', () => {
  assert.throws(() => build()({
    catalogPairs: [pair('same', { 'menu.open': 'Open' }), pair('same', { 'menu.close': 'Close' })],
    jsonSurfaces: [], tsEntries: [],
  }), /duplicate catalog id/);
  assert.throws(() => build()({
    catalogPairs: [pair('one', { 'menu.open': 'Open' }), pair('two', { 'menu.open': 'Close' })],
    jsonSurfaces: [], tsEntries: [],
  }), /duplicate registry key/);
  assert.throws(() => build()({ catalogPairs: [{ id: 'missing-japanese', source: strings({ key: 'Text' }) }], jsonSurfaces: [], tsEntries: [] }), /japanese/);
  assert.throws(() => build()({ catalogPairs: [{ id: 'empty', source: [], japanese: [] }], jsonSurfaces: [], tsEntries: [] }), /source must not be empty/);
  assert.throws(() => build()({ catalogPairs: [pair('supported', { key: 'Text' })], jsonSurfaces: [oldStrings('fr', { Text: 'Texte' })], tsEntries: [] }), /unsupported JSON locale/);
});

test('ambiguous old translations are counted as review work and empty translations are ignored', () => {
  const sourcePair = pair('appStrings', { first: 'Open', second: 'Open', third: 'Save' });
  const jsonSurfaces = [{
    id: 'languages/en/appStrings.json', locale: 'zh-Hans',
    english: [{ type: 'strings', value: { first: 'Open', second: 'Open', third: 'Save' } }],
    target: [{ type: 'strings', value: { first: '打开', second: '开启', third: '' } }],
  }];
  const before = structuredClone({ sourcePair, jsonSurfaces });
  const inventory = build()({ catalogPairs: [sourcePair], jsonSurfaces, tsEntries: [] });
  const byKey = Object.fromEntries(inventory.rows.map(row => [row.key, row]));

  assert.equal(byKey.first.locales['zh-Hans'].candidateKind, 'exact-ambiguous');
  assert.equal(byKey.second.locales['zh-Hans'].candidateKind, 'exact-ambiguous');
  assert.equal(byKey.third.locales['zh-Hans'].candidateKind, 'no-existing-candidate');
  assert.equal(inventory.counts['zh-Hans']['exact-ambiguous'], 2);
  assert.equal(inventory.counts['zh-Hans']['no-existing-candidate'], 1);
  assert.deepEqual({ sourcePair, jsonSurfaces }, before);
});

test('candidate availability is not completion or review approval and output order is deterministic', () => {
  const catalogPairs = [pair('z', { 'z.key': 'Open' }), pair('a', { 'a.key': 'Open' })];
  const jsonSurfaces = [oldStrings('zh-Hans', { Open: '打开' })];
  const forward = build()({ catalogPairs, jsonSurfaces, tsEntries: [] });
  const reverse = build()({ catalogPairs: [...catalogPairs].reverse(), jsonSurfaces, tsEntries: [] });

  assert.deepEqual(forward, reverse);
  assert.deepEqual(forward.entries.map(entry => entry.key), ['a.key', 'z.key']);
  assert.equal(forward.rows[0].locales['zh-Hans'].candidateKind, 'exact-single-candidate');
  assert.equal(Object.hasOwn(forward.rows[0].locales['zh-Hans'], 'complete'), false);
  assert.equal(Object.hasOwn(forward.rows[0].locales['zh-Hans'], 'decision'), false);
  assert.equal(Object.hasOwn(forward.rows[0], 'text'), false);
});
