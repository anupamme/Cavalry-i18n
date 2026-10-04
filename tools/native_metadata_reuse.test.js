#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_metadata_reuse.js 的显式旧说明复用解析器与合成四语 metadata documents
 * [OUTPUT]: 验证 source/可选三语译文 hash、旧英文本绑定、跨文件迁移、三语完整和无 approval 不复用
 * [POS]: tools 的 metadata 复用合同；纯内存测试，不读取 Cavalry、不生成审定清单、不投影机器字段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');

const api = () => require('./native_metadata_reuse.js');
const LOCALES = ['en', 'zh-Hans', 'zh-Hant', 'ja_JP'];
const FILES = [
  'api_function_metadata.json',
  'core_api_function_metadata.json',
  'gui_api_function_metadata.json',
  'widget_api_function_metadata.json',
];

const hash = source => createHash('sha256').update(source, 'utf8').digest('hex');
const keyFor = (file, name) => `${file}#/${name}/description`;

function legacyDocuments(entriesByFileAndLocale) {
  return Object.fromEntries(LOCALES.map(locale => [locale, Object.fromEntries(FILES.map(file => [
    file,
    entriesByFileAndLocale[locale]?.[file] || [],
  ]))]));
}

function commonLegacy(sourceFile, sourceName, sourceText, translations, machine = {}) {
  return legacyDocuments(Object.fromEntries(LOCALES.map((locale, index) => [locale, {
    [sourceFile]: [{
      name: sourceName,
      description: locale === 'en' ? sourceText : translations[index - 1],
      arguments: [{ name: 'path', type: 'string', required: index === 0 }],
      namespace: '@JS_GUI_API',
      return_type: 'string',
      type: 'function',
      ...machine,
    }],
  }])));
}

test('reuses only explicitly approved, exact-source descriptions by stable key across array reordering', () => {
  const apiFile = 'api_function_metadata.json';
  const current = [
    { name: 'getAssetURI', description: 'Returns an asset URI.', return_type: 'string', namespace: 'new' },
    { name: 'loadCanvaSheet', description: 'Loads a Canva Sheet.', arguments: [{ name: 'page', type: 'int' }] },
    { name: 'newMethod', description: 'New source has no prior translation.' },
  ];
  const legacy = legacyDocuments(Object.fromEntries(LOCALES.map((locale, index) => [locale, {
    [apiFile]: [
      {
        name: 'loadCanvaSheet',
        description: locale === 'en' ? current[1].description : ['載入 Canva Sheet。', '載入 Canva Sheet。', 'Canva Sheet を読み込みます。'][index - 1],
        // -- 旧署名不同；这里只提名 description，不复制参数和 namespace ---------
        arguments: [{ name: 'oldArg', type: 'OldType', required: false }],
        namespace: 'old-namespace',
      },
      {
        name: 'getAssetURI',
        description: locale === 'en' ? current[0].description : ['返回素材 URI。', '傳回素材 URI。', 'アセット URI を返します。'][index - 1],
      },
    ],
  }])));
  const approvals = [
    { key: keyFor(apiFile, 'getAssetURI'), sourceSha256: hash(current[0].description) },
    { key: keyFor(apiFile, 'loadCanvaSheet'), sourceSha256: hash(current[1].description) },
  ];

  const result = api().resolveApprovedMetadataReuse({
    file: apiFile, source: current, legacyDocuments: legacy, approvals,
  });

  assert.deepEqual(result.reviews['zh-Hans'], [
    { key: keyFor(apiFile, 'getAssetURI'), source: current[0].description, text: '返回素材 URI。' },
    { key: keyFor(apiFile, 'loadCanvaSheet'), source: current[1].description, text: '載入 Canva Sheet。' },
  ]);
  assert.deepEqual(result.reviews['zh-Hant'], [
    { key: keyFor(apiFile, 'getAssetURI'), source: current[0].description, text: '傳回素材 URI。' },
    { key: keyFor(apiFile, 'loadCanvaSheet'), source: current[1].description, text: '載入 Canva Sheet。' },
  ]);
  assert.deepEqual(result.reviews.ja_JP, [
    { key: keyFor(apiFile, 'getAssetURI'), source: current[0].description, text: 'アセット URI を返します。' },
    { key: keyFor(apiFile, 'loadCanvaSheet'), source: current[1].description, text: 'Canva Sheet を読み込みます。' },
  ]);
  assert.deepEqual(result.missingApprovals, [{
    key: keyFor(apiFile, 'newMethod'), source: current[2].description,
    sourceSha256: hash(current[2].description), owner: `${apiFile}#/newMethod`,
  }]);
  for (const locale of ['zh-Hans', 'zh-Hant', 'ja_JP']) {
    assert.ok(result.reviews[locale].every(row => Object.keys(row).sort().join(',') === 'key,source,text'));
  }
});

test('moves replaceAsset only when the approval explicitly names the prior GUI identity', () => {
  const apiFile = 'api_function_metadata.json';
  const guiFile = 'gui_api_function_metadata.json';
  const sourceText = 'Replaces an asset with one located at a new file path.';
  const current = [{ name: 'replaceAsset', description: sourceText, arguments: [{ name: 'newPath' }] }];
  const legacy = legacyDocuments(Object.fromEntries(LOCALES.map((locale, index) => [locale, {
    [guiFile]: [{
      name: 'replaceAsset',
      description: locale === 'en' ? sourceText : ['用新檔案路徑中的素材替換素材。', '用新檔案路徑中的素材替換素材。', '新しいファイルパスにあるアセットで置き換えます。'][index - 1],
      namespace: '@JS_GUI_API',
    }],
  }])));
  const approval = {
    key: keyFor(apiFile, 'replaceAsset'), sourceSha256: hash(sourceText),
    legacyKey: keyFor(guiFile, 'replaceAsset'),
  };

  const result = api().resolveApprovedMetadataReuse({
    file: apiFile, source: current, legacyDocuments: legacy, approvals: [approval],
  });

  assert.deepEqual(result.reviews.ja_JP, [{
    key: keyFor(apiFile, 'replaceAsset'), source: sourceText,
    text: '新しいファイルパスにあるアセットで置き換えます。',
  }]);
  assert.deepEqual(result.missingApprovals, []);
});

test('without approval, even exact old translations stay in the explicit missing ledger', () => {
  const file = 'api_function_metadata.json';
  const source = [{ name: 'known', description: 'Same source as the old catalog.' }];
  const prior = commonLegacy(file, 'known', source[0].description, ['旧译', '舊譯', '旧訳']);

  const result = api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: prior, approvals: [],
  });

  assert.deepEqual(result.reviews, { 'zh-Hans': [], 'zh-Hant': [], ja_JP: [] });
  assert.deepEqual(result.missingApprovals, [{
    key: keyFor(file, 'known'), source: source[0].description,
    sourceSha256: hash(source[0].description), owner: `${file}#/known`,
  }]);
});

test('rejects unknown, duplicate, malformed-hash and stale-source approvals', () => {
  const file = 'api_function_metadata.json';
  const source = [{ name: 'known', description: 'Current description.' }];
  const prior = commonLegacy(file, 'known', source[0].description, ['简中', '繁中', '日本語']);
  const approval = { key: keyFor(file, 'known'), sourceSha256: hash(source[0].description) };
  const resolve = approvals => api().resolveApprovedMetadataReuse({ file, source, legacyDocuments: prior, approvals });

  assert.throws(() => resolve([{ ...approval, key: keyFor(file, 'unknown') }]), /unknown metadata approval key/);
  assert.throws(() => resolve([approval, approval]), /duplicate metadata approval key/);
  assert.throws(() => resolve([{ ...approval, sourceSha256: 'bad' }]), /approval sourceSha256 must be a SHA-256 hex digest/);
  assert.throws(() => resolve([{ ...approval, sourceSha256: hash('stale') }]), /approval source hash differs/);
  const oldSource = commonLegacy(file, 'known', 'Older English text.', ['简中', '繁中', '日本語']);
  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: oldSource, approvals: [approval],
  }), /legacy English source differs/);
});

test('optional translationSha256 locks every legacy locale value and fails closed when incomplete', () => {
  const file = 'api_function_metadata.json';
  const sourceText = 'Stable source description.';
  const source = [{ name: 'known', description: sourceText }];
  const translations = { 'zh-Hans': '简中。', 'zh-Hant': '繁中。', ja_JP: '日本語。' };
  const prior = commonLegacy(file, 'known', sourceText,
    [translations['zh-Hans'], translations['zh-Hant'], translations.ja_JP]);
  const approval = {
    key: keyFor(file, 'known'),
    sourceSha256: hash(sourceText),
    translationSha256: Object.fromEntries(Object.entries(translations).map(([locale, text]) => [locale, hash(text)])),
  };

  const result = api().resolveApprovedMetadataReuse({ file, source, legacyDocuments: prior, approvals: [approval] });
  assert.deepEqual(result.reviews, {
    'zh-Hans': [{ key: keyFor(file, 'known'), source: sourceText, text: translations['zh-Hans'] }],
    'zh-Hant': [{ key: keyFor(file, 'known'), source: sourceText, text: translations['zh-Hant'] }],
    ja_JP: [{ key: keyFor(file, 'known'), source: sourceText, text: translations.ja_JP }],
  });

  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: prior,
    approvals: [{ ...approval, translationSha256: { ...approval.translationSha256, 'zh-Hans': 'a'.repeat(64) } }],
  }), /legacy translation hash differs for zh-Hans/);
  const missingLocaleDigest = { ...approval.translationSha256 };
  delete missingLocaleDigest.ja_JP;
  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: prior,
    approvals: [{ ...approval, translationSha256: missingLocaleDigest }],
  }), /translationSha256 missing digest for ja_JP/);
  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: prior,
    approvals: [{ ...approval, translationSha256: { ...approval.translationSha256, 'zh-Hant': 'not-a-digest' } }],
  }), /translationSha256 digest must be a SHA-256 hex value for zh-Hant/);
  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: prior,
    approvals: [{ ...approval, translationSha256: { ...approval.translationSha256, en: hash(sourceText) } }],
  }), /translationSha256 must contain only the three target locales/);
});

test('fails closed for missing legacy files/keys, empty locale text and incomplete language sources', () => {
  const file = 'api_function_metadata.json';
  const gui = 'gui_api_function_metadata.json';
  const text = 'Current source.';
  const source = [{ name: 'replaceAsset', description: text }];
  const approval = { key: keyFor(file, 'replaceAsset'), sourceSha256: hash(text) };
  const base = commonLegacy(file, 'replaceAsset', text, ['简中', '繁中', '日本語']);
  const missingGui = structuredClone(base);
  for (const locale of LOCALES) delete missingGui[locale][gui];

  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: missingGui,
    approvals: [{ ...approval, legacyFile: gui, legacyKey: keyFor(gui, 'replaceAsset') }],
  }), /missing legacy metadata document/);
  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: base,
    approvals: [{ ...approval, legacyFile: file, legacyKey: keyFor(gui, 'replaceAsset') }],
  }), /legacy key does not belong to legacy file/);
  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: base,
    approvals: [{ ...approval, legacyFile: gui }],
  }), /legacy key does not belong to legacy file/);
  const emptyLocale = structuredClone(base);
  emptyLocale['zh-Hant'][file][0].description = '  ';
  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: emptyLocale, approvals: [approval],
  }), /metadata description must be non-empty text/);
  assert.throws(() => api().resolveApprovedMetadataReuse({ file, source, legacyDocuments: {}, approvals: [approval] }),
    /missing legacy metadata document/);
});

test('rejects duplicated legacy identities and does not copy any old machine fields into reviews', () => {
  const file = 'api_function_metadata.json';
  const text = 'Current source.';
  const source = [{ name: 'known', description: text, type: 'function', namespace: 'new', return_type: 'newType' }];
  const prior = commonLegacy(file, 'known', text, ['简中', '繁中', '日本語'], { type: 'old', namespace: 'old' });
  for (const locale of LOCALES) prior[locale][file].push({ name: 'known', description: text });

  assert.throws(() => api().resolveApprovedMetadataReuse({
    file, source, legacyDocuments: prior,
    approvals: [{ key: keyFor(file, 'known'), sourceSha256: hash(text) }],
  }), /duplicate metadata entity name/);
});
