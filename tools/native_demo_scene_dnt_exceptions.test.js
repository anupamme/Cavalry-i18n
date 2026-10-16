#!/usr/bin/env node
/**
 * [INPUT]: 依赖原生语言pack选择器与官方100条demo leaf身份摘要；译文仅用合成样例
 * [OUTPUT]: 验证DNT显示例外的默认关闭、精确三语审批、身份漂移和越界拒绝
 * [POS]: tools的离线构建合同；不批准真实译文，不构建资源包或启动Cavalry
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { OFFICIAL_DEMO_SCENE_DNT_IDENTITIES } = require('./native_demo_scene_dnt_identities');
const api = () => require('./native_language_pack');

const KEY = 'demoScene.customShadersAndFilters.cloudsShader';
const CATALOG = 'Definitions/Translation/appStrings';
const SOURCE = 'Clouds Shader';
const NOTES = ['Name of a built-in demo scene preset.'];
const row = (key = KEY, source = SOURCE, notes = NOTES, catalogId = CATALOG,
  dontTranslate = true, vendorJapanese = SOURCE) => ({
  catalogId, key, source, notes: [...notes], fieldPath: [key], dontTranslate, vendorJapanese,
});
const leaf = (text, notes = NOTES, dontTranslate = true) => ({ 'UI-text': text, notes, dontTranslate });
const pair = (key = KEY, value = leaf(SOURCE), jaText = SOURCE, catalogId = CATALOG) => ({
  id: catalogId,
  source: [{ type: 'strings', value: { [key]: value } }],
  japanese: [{ type: 'strings', language: 'ja-JP', value: { [key]: { 'UI-text': jaText } } }],
});
const approval = (key = KEY) => ({
  catalogId: CATALOG, key, source: SOURCE, notes: [...NOTES], fieldPath: [key],
  vendorJapanese: SOURCE, dontTranslate: true,
  translations: {
    'zh-Hans': { decision: 'translate', text: '云层着色器' },
    'zh-Hant': { decision: 'translate', text: '雲層著色器' },
    ja_JP: { decision: 'translate', text: '雲シェーダー' },
  },
});

test('official registry is exactly 100 DNT demo leaves, without category or orphan', () => {
  const keys = Object.keys(OFFICIAL_DEMO_SCENE_DNT_IDENTITIES);
  assert.equal(keys.length, 100);
  assert.equal(new Set(keys).size, 100);
  for (const key of keys) {
    assert.match(key, /^demoScene\..+\..+$/);
    assert.notEqual(key, 'demoScene.javascript');
    assert.notEqual(key, 'demoScene.audio.audioSolver');
    assert.match(OFFICIAL_DEMO_SCENE_DNT_IDENTITIES[key], /^[a-f0-9]{64}$/);
  }
});

test('empty exception set preserves the existing DNT result; exact opt-in is display-only', () => {
  const entries = api().collectNativeCatalog(CATALOG, pair().source, pair().japanese).entries;
  const selectedReview = [{ key: KEY, source: SOURCE, decision: 'translate', text: '雲シェーダー' }];
  const ordinary = api().resolveTranslations(entries, 'ja_JP', selectedReview);
  assert.equal(ordinary.rows[0].status, 'preserved');
  assert.equal(ordinary.rows[0].text, SOURCE);

  const selected = api().resolveTranslations(entries, 'ja_JP', selectedReview, [], [approval()]);
  assert.equal(selected.rows[0].status, 'reviewed');
  assert.equal(selected.rows[0].text, '雲シェーダー');
  assert.equal(selected.rows[0].dontTranslate, true);
  assert.equal(selected.rows[0].source, SOURCE);
  assert.throws(() => api().resolveTranslations(entries, 'ja_JP', [
    { key: KEY, source: SOURCE, decision: 'translate', text: '未批准文字' },
  ], [], [approval()]), /exact locale review/i);
});

test('opt-in requires source-bound approval and the exact reviewed value in every locale', () => {
  const entries = api().collectNativeCatalog(CATALOG, pair().source, pair().japanese).entries;
  const approved = [approval()];
  api().validateDemoSceneDntDisplayApprovals(entries, approved, [KEY]);
  for (const language of ['zh-Hans', 'zh-Hant', 'ja_JP']) {
    const text = approved[0].translations[language].text;
    const resolved = api().resolveTranslations(entries, language,
      [{ key: KEY, source: SOURCE, decision: 'translate', text }], [], approved);
    assert.equal(resolved.rows[0].status, 'reviewed');
    assert.equal(resolved.rows[0].text, text);
    assert.equal(resolved.rows[0].dontTranslate, true);
    assert.equal(resolved.rows[0].source, SOURCE);
  }
  const closed = api().resolveTranslations(entries, 'ja_JP', [
    { key: KEY, source: SOURCE, decision: 'translate', text: approved[0].translations.ja_JP.text },
  ]);
  assert.equal(closed.rows[0].status, 'preserved');
  assert.equal(closed.rows[0].text, SOURCE);
});

test('unapproved, incomplete, and vendor-correction-shaped approvals fail closed', () => {
  const missingLocale = approval();
  delete missingLocale.translations.ja_JP;
  const entries = api().collectNativeCatalog(CATALOG, pair().source, pair().japanese).entries;
  assert.throws(() => api().validateDemoSceneDntDisplayApprovals(entries, [missingLocale], [KEY]), /locale/i);

  const preserve = approval();
  preserve.translations['zh-Hans'].decision = 'preserve';
  preserve.translations['zh-Hans'].text = SOURCE;
  assert.throws(() => api().validateDemoSceneDntDisplayApprovals(entries, [preserve], [KEY]), /three-locale/i);

  const vendorCorrection = approval();
  vendorCorrection.translations.ja_JP.vendorCorrection = {};
  assert.throws(() => api().validateDemoSceneDntDisplayApprovals(entries, [vendorCorrection], [KEY]), /three-locale/i);
});

test('audio orphan, JavaScript category, non-demo DNT, and unknown keys are not selectable', () => {
  const source = [
    { type: 'strings', value: {
      [KEY]: leaf(SOURCE),
      'demoScene.audio.audioSolver': leaf('Audio Solver'),
      'demoScene.javascript': leaf('JavaScript'),
      'otherIdentity.keep': leaf('Keep'),
    } },
  ];
  const entries = api().collectNativeCatalog(CATALOG, source, pair().japanese).entries;
  for (const rejected of ['demoScene.audio.audioSolver', 'demoScene.javascript', 'otherIdentity.keep', 'unknown.demo.leaf']) {
    assert.throws(() => api().indexDemoSceneDntDisplayExceptions(entries, [rejected]), /unapproved or stale/i, rejected);
  }
});

test('source, catalog, notes, DNT, and vendor identity drift invalidate the exception', () => {
  const changes = [
    { source: 'Cloud Shader' },
    { catalogId: 'other/catalog' },
    { fieldPath: ['other', KEY] },
    { notes: ['Name of a different preset.'] },
    { dontTranslate: false },
    { vendorJapanese: '雲シェーダー' },
  ];
  for (const change of changes) {
    const changed = { ...row(), ...change };
    assert.throws(() => api().indexDemoSceneDntDisplayExceptions([changed], [KEY]), /unapproved or stale/i);
  }
  assert.throws(() => api().indexDemoSceneDntDisplayExceptions([row()], [KEY, KEY]), /duplicate/i);
  assert.throws(() => api().indexDemoSceneDntDisplayExceptions([row()], KEY), /array/i);
});
