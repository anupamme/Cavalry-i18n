#!/usr/bin/env node
/**
 * [INPUT]: 依赖 languages/native 的已审源绑定数据、native_language_pack 的原生显示投影与项目 Video 术语
 * [OUTPUT]: 提供完整 UI/形状/字体/累加渲染与脚本帮助的源绑定、格式/引用和显示投影合同，区分替代字形访问、基字相对位置与字母匹配
 * [POS]: tools 的分域补译入库门；不调用 AGY/Grok，不读厂商安装，分域通过不等于全量界面完成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { test } = require('node:test');
const { collectNativeCatalog, resolveTranslations, renderNativePack } = require('./native_language_pack');
const data = () => require('../languages/native/reviewed_translations.js');
const languages = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const expectedSources = {
  'aiStudio.brief.subjectLabel': 'Subject',
  'aiStudio.brief.transparentLabel': 'Transparent background',
  'aiStudio.brief.whatLabel': 'What would you like to make?',
  'aiStudio.modelLabel': 'Model',
  'aiStudio.prompt.sectionTitle': 'Prompt',
  'aiStudio.results.sectionTitle': 'Results',
  'aiStudio.source.videoLabel': 'Video',
  'aiStudio.results.emptyHint': 'Generated artwork will appear here.',
  'aiStudio.generateNeedsSubject': 'Describe what you would like to make first.',
};
const sourceEntries = () => collectNativeCatalog('app', [{ type: 'strings', value:
  Object.fromEntries(Object.entries(expectedSources).map(([key, source]) => [key, { 'UI-text': source }]))
}]).entries;
const reviewsFor = (language) => data().entries.map(entry => ({
  key: entry.key, source: entry.source, ...entry.translations[language],
}));

test('native reviewed input pins official source and the project translation workflow', () => {
  const { provenance } = data();
  assert.equal(provenance.cavalryVersion, '2.8.0');
  assert.equal(provenance.catalogPath, 'Definitions/Translation/appStrings_en-GB.source.json');
  assert.equal(provenance.sourceSha256, '464f0d291cd7aac46dba9552ab08debf4302cbd36b7b8d9d49f692085004e82e');
  assert.equal(provenance.skillPath, '.agents/skills/baoyu-translate/SKILL.md');
  assert.match(provenance.skillCommit, /^[0-9a-f]{40}$/);
  assert.equal(provenance.draftProvider, 'AGY CLI');
  assert.equal(provenance.independentReviewProvider, 'Grok CLI');
  assert.equal(provenance.mode, 'refined');
});

test('each approved key has its exact 2.8 source, official context and three explicit decisions', () => {
  const { entries } = data();
  assert.equal(entries.length, 9);
  assert.deepEqual(Object.fromEntries(entries.map(entry => [entry.key, entry.source])), expectedSources);
  for (const entry of entries) {
    assert.ok(entry.notes.length > 0 && entry.notes.every(note => typeof note === 'string'));
    assert.deepEqual(Object.keys(entry.translations).sort(), [...languages].sort());
    for (const translation of Object.values(entry.translations)) {
      assert.equal(translation.decision, 'translate');
      assert.equal(typeof translation.text, 'string');
      assert.ok(translation.text.trim().length > 0);
      assert.notEqual(translation.text, entry.source);
      assert.ok(!/[<>\n\r{}]/.test(translation.text), 'this simple UI batch must not add markup, line breaks or arguments');
    }
  }
});

test('approved three-language input survives native pack projection with no missing or extra keys', () => {
  for (const language of languages) {
    const resolved = resolveTranslations(sourceEntries(), language, reviewsFor(language));
    assert.ok(resolved.rows.every(row => row.status === 'reviewed'));
    const [record] = JSON.parse(renderNativePack(resolved));
    assert.equal(record.type, 'strings');
    assert.deepEqual(Object.keys(record.value).sort(), Object.keys(expectedSources).sort());
    for (const review of reviewsFor(language)) assert.deepEqual(record.value[review.key], { 'UI-text': review.text });
  }
});

test('native supplement uses project Video terminology and separates question from disabled-button guidance', () => {
  const entries = new Map(data().entries.map(entry => [entry.key, entry]));
  for (const [language, text] of Object.entries({ 'zh-Hans': '视频', 'zh-Hant': '影片', ja_JP: 'ビデオ' })) {
    assert.equal(entries.get('aiStudio.source.videoLabel').translations[language].text, text);
    assert.notEqual(entries.get('aiStudio.brief.whatLabel').translations[language].text,
      entries.get('aiStudio.generateNeedsSubject').translations[language].text);
  }
});

test('an approved Japanese supplement never defeats an actual vendor Japanese value', () => {
  const entries = sourceEntries().map(entry => entry.key === 'aiStudio.results.sectionTitle'
    ? { ...entry, vendorJapanese: '公式訳をそのまま保持' } : entry);
  const resolved = resolveTranslations(entries, 'ja_JP', reviewsFor('ja_JP'));
  const result = resolved.rows.find(row => row.key === 'aiStudio.results.sectionTitle');
  assert.equal(result.status, 'vendor');
  assert.equal(result.text, '公式訳をそのまま保持');
});

// -- 全量缺口域：首批九条不是边界，后续补齐整组 AI Studio ------------
const aiStudioSupplement = () => require('../languages/native/ai_studio_supplement.js');

test('the complete remaining AI Studio no-candidate group binds all 103 current key/source pairs', () => {
  const { entries, provenance } = aiStudioSupplement();
  assertBatchProvenance(provenance, '16453bd92461ec9a46fd1ed275d724a55437099ea53a92b512cb859051a4500d');
  assert.equal(entries.length, 103);
  assert.equal(new Set(entries.map(entry => entry.key)).size, 103);
  assert.ok(entries.every(entry => entry.key.startsWith('aiStudio.')));
  const pairs = entries.map(entry => [entry.key, entry.source]).sort((a, b) => a[0] < b[0] ? -1 : 1);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(pairs)).digest('hex'),
    '16453bd92461ec9a46fd1ed275d724a55437099ea53a92b512cb859051a4500d');
  assert.ok(entries.every(entry => !Object.hasOwn(expectedSources, entry.key)));
});

test('every supplemented UI row has three approved decisions and passes the real format gate', () => {
  const { assertNativeTranslationFormat } = require('./native_translation_format');
  for (const entry of aiStudioSupplement().entries) {
    assert.ok(entry.notes.every(note => typeof note === 'string'));
    assert.deepEqual(Object.keys(entry.translations).sort(), [...languages].sort());
    for (const translation of Object.values(entry.translations)) {
      assert.ok(['translate', 'preserve'].includes(translation.decision));
      assert.ok(translation.text.trim());
      assert.equal(translation.text === entry.source, translation.decision === 'preserve');
      assertNativeTranslationFormat(entry.source, translation.text);
    }
  }
});

test('the full approved AI Studio supplement merges with the first batch without gaps or duplicate keys', () => {
  const entries = [...data().entries, ...aiStudioSupplement().entries];
  const source = [{ type: 'strings', value: Object.fromEntries(entries.map(entry => [entry.key, { 'UI-text': entry.source }])) }];
  const projected = collectNativeCatalog('app', source).entries;
  assert.equal(projected.length, 112);
  for (const language of languages) {
    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[language] }));
    const resolved = resolveTranslations(projected, language, reviews);
    assert.ok(resolved.rows.every(row => ['reviewed', 'preserved'].includes(row.status)));
    assert.equal(Object.keys(JSON.parse(renderNativePack(resolved))[0].value).length, 112);
  }
});

function assertBatchProvenance(provenance, sourceDigest) {
  assert.equal(provenance.cavalryVersion, '2.8.0');
  assert.equal(provenance.sourcePairsSha256, sourceDigest);
  assert.equal(provenance.skillPath, '.agents/skills/baoyu-translate/SKILL.md');
  assert.equal(provenance.skillCommit, '1567581c26ec29f4216c6e6835415bf30343b0e3');
  assert.equal(provenance.mode, 'refined');
  assert.equal(provenance.draftProvider, 'AGY CLI');
  assert.equal(provenance.independentReviewProvider, 'Grok CLI');
  assert.equal(provenance.approvedBy, 'primary-agent');
}

function assertApprovedBatch(file, count, sourceDigest, checkFormat = true) {
  const { entries, provenance } = require(`../languages/native/${file}`);
  assertBatchProvenance(provenance, sourceDigest);
  if (checkFormat && !file.startsWith('nodes_')) {
    assert.equal(provenance.catalogPath, 'Definitions/Translation/appStrings_en-GB.source.json');
    assert.equal(provenance.sourceSha256, '464f0d291cd7aac46dba9552ab08debf4302cbd36b7b8d9d49f692085004e82e');
  }
  assert.equal(entries.length, count);
  assert.equal(new Set(entries.map(entry => entry.key)).size, count);
  const pairs = entries.map(entry => [entry.key, entry.source]).sort((a, b) => a[0] < b[0] ? -1 : 1);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(pairs)).digest('hex'), sourceDigest);
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry.translations).sort(), [...languages].sort());
    for (const translation of Object.values(entry.translations)) {
      assert.ok(['translate', 'preserve'].includes(translation.decision));
      assert.ok(translation.text.trim());
      assert.equal(translation.text === entry.source, translation.decision === 'preserve');
      if (checkFormat) require('./native_translation_format').assertNativeTranslationFormat(entry.source, translation.text);
    }
  }
  return entries;
}

test('all remaining AI Studio reuse candidates and all AI Credits strings are approved as a complete group', () => {
  const entries = assertApprovedBatch('ai_studio_reuse_and_credits.js', 45, '15adb4bc74cd59ac731aebfb5dc73f84f70dfc1a8ee2a303c035bbedb5741339');
  const aiStudio = [...data().entries, ...aiStudioSupplement().entries, ...entries.filter(e => e.key.startsWith('aiStudio.'))];
  assert.equal(new Set(aiStudio.map(entry => entry.key)).size, 138);
  assert.equal(entries.filter(entry => entry.key.startsWith('aiCredits.')).length, 19);
});

test('Canva Preflight, Upload and Assets are handled as complete native display domains', () => {
  const entries = assertApprovedBatch('canva_and_assets.js', 71, '514c9a8784de52608f54c789f97a5d214b440bc55809dc541e65f3e1d0d3e0b8');
  assert.ok(entries.every(entry => ['canvaPreflight.', 'canvaUpload.', 'assets.'].some(prefix => entry.key.startsWith(prefix))));
});

test('File, Edit, Create and Help menus are translated as four complete native domains', () => {
  const entries = assertApprovedBatch('menus_file_edit_create_help.js', 84,
    '64445e46e52eb461bb847097a388057ff0cfd8a3e221ec0f92f39eeb850673a7');
  const domains = ['menu.file', 'menu.edit', 'menu.create', 'menu.help'];
  assert.ok(entries.every(row => domains.some(prefix => row.key === prefix || row.key.startsWith(`${prefix}.`))));
  assert.deepEqual(domains.map(prefix => entries.filter(row => row.key === prefix || row.key.startsWith(`${prefix}.`)).length),
    [30, 10, 30, 14]);
  const byKey = new Map(entries.map(row => [row.key, row]));
  assert.deepEqual(languages.map(language => byKey.get('menu.file.exportArchive').translations[language].text),
    ['为 Canva 导出（测试版）...', '為 Canva 匯出（測試版）...', 'Canva 用に書き出し（ベータ）...']);
  for (const [key, mnemonic] of [['menu.help', 'H'], ['menu.help.about', 'A']]) {
    for (const language of languages) {
      assert.ok(byKey.get(key).translations[language].text.endsWith(`(&${mnemonic})`));
    }
  }
});

test('Composition and Animation menus cover both complete native domains', () => {
  const entries = assertApprovedBatch('menus_comp_animation.js', 102,
    '34910a094c72e2290b33704eec3f6fba5902bd9d14d37e31c7c8a626c34daeac');
  assert.deepEqual(['menu.comp', 'menu.anim'].map(prefix => entries.filter(row => row.key === prefix || row.key.startsWith(`${prefix}.`)).length), [53, 49]);
});

test('View and Window menus cover both complete native domains', () => {
  const entries = assertApprovedBatch('menus_view_window.js', 71,
    '792fc8b612fb5bfe7d2c4975c96501b6e0fa98af74cc31b41808b6e45928b332');
  assert.deepEqual(['menu.view', 'menu.window'].map(prefix => entries.filter(row => row.key === prefix || row.key.startsWith(`${prefix}.`)).length), [33, 38]);
});

test('all other menus complete the 352-key source scope without duplicate or missing batch keys', () => {
  const entries = assertApprovedBatch('menus_other.js', 95,
    '82d60e325d0cfffa817c18cd373afb4bd5892213ce56163bf4e4087cef8811ac');
  const all = [...entries, ...require('../languages/native/menus_file_edit_create_help').entries,
    ...require('../languages/native/menus_comp_animation').entries,
    ...require('../languages/native/menus_view_window').entries];
  assert.equal(all.length, 352);
  assert.equal(new Set(all.map(row => row.key)).size, 352);
  assert.ok(all.every(row => row.key.startsWith('menu.')));
});

test('all 580 approved UI keys merge without collisions and preserve cross-menu terminology and whitespace', () => {
  const files = ['reviewed_translations', 'ai_studio_supplement', 'ai_studio_reuse_and_credits',
    'canva_and_assets', 'menus_file_edit_create_help', 'menus_comp_animation', 'menus_view_window', 'menus_other'];
  const all = files.flatMap(file => require(`../languages/native/${file}`).entries);
  assert.equal(all.length, 580);
  assert.equal(new Set(all.map(row => row.key)).size, 580);
  const byKey = new Map(all.map(row => [row.key, row]));
  const projected = collectNativeCatalog('app', [{ type: 'strings', value:
    Object.fromEntries(all.map(row => [row.key, { 'UI-text': row.source }])) }]).entries;
  for (const language of languages) {
    const reviews = all.map(row => ({ key: row.key, source: row.source, ...row.translations[language] }));
    const resolved = resolveTranslations(projected, language, reviews);
    assert.ok(resolved.rows.every(row => ['reviewed', 'preserved'].includes(row.status)));
    assert.equal(Object.keys(JSON.parse(renderNativePack(resolved))[0].value).length, 580);
    for (const [left, right] of [['menu.file.importCanvaSheet', 'menu.assets.importCanvaSheet'],
      ['menu.comp.preferences', 'menu.window.preferences'],
      ['menu.anim.rubberHoseNoShape', 'menu.log.rubberHoseNoShape'],
      ['menu.comp.soloSelection', 'menu.composition.soloSelectionInViewport']]) {
      assert.equal(byKey.get(left).translations[language].text, byKey.get(right).translations[language].text);
    }
    for (const key of ['menu.log.canvaAccessTokenExpired', 'menu.suffix.demo', 'menu.suffix.pro']) {
      const source = byKey.get(key).source;
      assert.equal(byKey.get(key).translations[language].text.match(/^\s*/)[0], source.match(/^\s*/)[0]);
    }
    assert.match(byKey.get('menu.window.controlCentrePro').translations[language].text, /\(Pro\)$/);
    assert.match(byKey.get('menu.window.javaScriptEditorPro').translations[language].text, /\(Pro\)$/);
  }
  assert.equal(byKey.get('menu.window.graphEditor').translations['zh-Hans'].text, '图形编辑器');
  assert.equal(byKey.get('menu.comp.preferences').translations['zh-Hans'].text, '首选项');
  assert.notEqual(byKey.get('menu.dynamics.activeSolver').translations['zh-Hans'].text, '启用 Forge 求解器');
});

// -- 完整节点 owner：名称、属性、说明、枚举和页签一起审定 --------------
const coreNodes = () => require('../languages/native/nodes_group_transform_null.js');

test('Group, Transform and Null cover all 58 official display leaves with exact owner and field identities', () => {
  const entries = assertApprovedBatch('nodes_group_transform_null.js', 58,
    '6c3ae1678250d5a49a59251dbc949bcb8c7732e6ba527b0df2929bb2639f83f9');
  assert.deepEqual(['group', 'transform', 'null'].map(owner => entries.filter(row => row.owner === owner).length), [6, 15, 37]);
  const identities = entries.map(row => [row.key, row.owner, row.fieldPath, row.source, row.notes]);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(identities)).digest('hex'),
    'c4fd7915bf624a78034510d3ef20098f417335bd93a7f4be05a0bbcf5b592ef7');
  const { provenance } = coreNodes();
  assert.equal(provenance.catalogPath, 'Definitions/Translation/nodeStrings_en-GB.source.json');
  assert.equal(provenance.sourceSha256, 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0');
  assert.equal(provenance.sourcePairsSha256, '6c3ae1678250d5a49a59251dbc949bcb8c7732e6ba527b0df2929bb2639f83f9');
  assert.equal(provenance.draftModel, 'gemini-3.8-flash-high');
  assert.equal(provenance.draftExecutionMode, 'accept-edits');
  assert.equal(provenance.draftProvider, 'AGY CLI');
  assert.equal(provenance.independentReviewProvider, 'Grok CLI');
});

test('all 638 reviewed UI keys project as display strings without rewriting reconstructed node identities', () => {
  const nodes = new Map();
  for (const entry of coreNodes().entries) {
    if (!nodes.has(entry.owner)) nodes.set(entry.owner, { nodeType: entry.owner, modelId: `identity:${entry.owner}` });
    let target = nodes.get(entry.owner);
    for (const part of entry.fieldPath.slice(0, -1)) target = target[part] ??= {};
    target[entry.fieldPath.at(-1)] = { 'UI-text': entry.source, notes: entry.notes };
  }
  const source = [...nodes.values()].map(value => ({ type: 'nodeStrings', value }));
  const before = structuredClone(source);
  const projectedNodes = collectNativeCatalog('node', source);
  assert.deepEqual(projectedNodes.unmapped, []);
  assert.equal(projectedNodes.entries.length, 58);
  const prior = ['reviewed_translations', 'ai_studio_supplement', 'ai_studio_reuse_and_credits',
    'canva_and_assets', 'menus_file_edit_create_help', 'menus_comp_animation', 'menus_view_window', 'menus_other']
    .flatMap(file => require(`../languages/native/${file}`).entries);
  const app = collectNativeCatalog('app', [{ type: 'strings', value:
    Object.fromEntries(prior.map(row => [row.key, { 'UI-text': row.source }])) }]).entries;
  const all = [...prior, ...coreNodes().entries];
  assert.equal(new Set(all.map(row => row.key)).size, 638);
  for (const language of languages) {
    const resolved = resolveTranslations([...app, ...projectedNodes.entries], language,
      all.map(row => ({ key: row.key, source: row.source, ...row.translations[language] })));
    assert.ok(resolved.rows.every(row => ['reviewed', 'preserved'].includes(row.status)));
    const [record] = JSON.parse(renderNativePack(resolved));
    assert.equal(record.type, 'strings');
    assert.equal(Object.keys(record.value).length, 638);
    for (const entry of coreNodes().entries) assert.deepEqual(record.value[entry.key], { 'UI-text': entry.translations[language].text });
  }
  assert.deepEqual(source, before);
});

test('core node labels follow the project glossary and preserve the 2.5D technical value explicitly', () => {
  const byKey = new Map(coreNodes().entries.map(row => [row.key, row]));
  const expected = {
    'nodeName:group': ['编组', '群組', 'グループ'],
    'nodeName:null': ['空对象', '空物件', 'ヌル'],
    'nodeName:transform': ['变换', '變換', 'トランスフォーム'],
    'nodeAttr:transform.pivot': ['锚点', '錨點', 'ピボット'],
    'nodeAttr:transform.position': ['位置', '位置', '位置'],
    'nodeAttr:transform.rotation': ['旋转', '旋轉', '回転'],
    'nodeAttr:transform.scale': ['缩放', '縮放', 'スケール'],
    'nodeAttr:null.positionLimit': ['限制位置', '限制位置', '位置を制限'],
    'nodeAttr:null.rotationLimit': ['限制旋转', '限制旋轉', '回転を制限'],
    'nodeAttr:null.scaleLimit': ['限制缩放', '限制縮放', 'スケールを制限'],
  };
  for (const [key, values] of Object.entries(expected)) {
    assert.deepEqual(languages.map(language => byKey.get(key).translations[language].text), values);
  }
  assert.equal(byKey.get('nodeAttr:null.customColor').translations['zh-Hant'].text, '自訂顏色');
  for (const language of languages) {
    assert.deepEqual(byKey.get('nodeAttr:null.is3d').translations[language], { decision: 'preserve', text: '2.5D' });
    const groupInfo = byKey.get('attrInfo:group.groupMode');
    const text = groupInfo.translations[language].text;
    assert.equal((text.match(/\n/g) || []).length, (groupInfo.source.match(/\n/g) || []).length);
    for (const key of ['nodeAttrEnum:group.groupMode.0', 'nodeAttrEnum:group.groupMode.1']) {
      assert.ok(text.includes(`<b>${byKey.get(key).translations[language].text}</b>`), 'mode tooltip headings must match the selected enum labels');
    }
    for (const [tooltip, label] of [['attrInfo:null.nullColor', 'nodeAttr:null.customColor'],
      ['attrInfo:null.customColor', 'nodeAttr:null.nullColor']]) {
      assert.ok(byKey.get(tooltip).translations[language].text.includes(`<b>${byKey.get(label).translations[language].text}</b>`),
        'Null color tooltip references must match the current attribute labels');
    }
  }
});

// -- 形状域：完整 owner 的叶集合和显示投影，不拷贝模型定义 -----------
const shapeBatches = [
  { file: 'nodes_shape.js', count: 100, owners: { shape: 100 },
    sourceDigest: '6b1f150e099736e822a514456f6c470c37e9db46c24916a30af23d8f97a25ea5',
    identityDigest: 'be690164bdf5370fbe291747fca7d07b6b8066c11e98edc9024fc156ff3145c9' },
  { file: 'nodes_text_shape.js', count: 103, owners: { textShape: 103 },
    sourceDigest: 'ffec12f91c056e56cffa0620507cb4d034c9f56bb6e1303bdfda6a394198b9d8',
    identityDigest: 'ba0736070b2f120379e0f48d9b84508a0cfdcd2e7e36e3dddbed7d6feccb02b8' },
  { file: 'nodes_basic_primitives.js', count: 78, owners: {
    arcShape: 14, basicLine: 4, basicShape: 4, bezierLine: 7, circleShape: 3,
    ellipseShape: 6, polygonShape: 5, rectangleShape: 22, simpleLine: 4, starShape: 9 },
    sourceDigest: '1dd624a3103b838439e246ef4e85f4715379289ff5c4831a84e0f0cad1b7e8ba',
    identityDigest: '6db4c34b39af04704b909ce9639326b9ce9fcd4c4d69a1fb4d47bf1d662834cd' },
];

for (const batch of shapeBatches) test(`${batch.file} covers the complete current owner/source/role scope`, () => {
  const entries = assertApprovedBatch(batch.file, batch.count, batch.sourceDigest);
  assert.deepEqual(Object.fromEntries(Object.keys(batch.owners).map(owner =>
    [owner, entries.filter(row => row.owner === owner).length])), batch.owners);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(entries.map(row =>
    [row.key, row.owner, row.fieldPath, row.source, row.notes]))).digest('hex'), batch.identityDigest);
  const { provenance } = require(`../languages/native/${batch.file}`);
  assert.equal(provenance.catalogPath, 'Definitions/Translation/nodeStrings_en-GB.source.json');
  assert.equal(provenance.sourceSha256, 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0');
  assert.equal(provenance.vendorJapaneseSha256, '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439');
  assert.equal(provenance.draftModel, 'gemini-3.8-flash-high');
  assert.equal(provenance.draftExecutionMode, 'accept-edits');
  for (const row of entries) {
    assert.equal(row.dontTranslate, false, 'this source-bound batch contains no original dontTranslate leaves');
    for (const translation of Object.values(row.translations)) {
      assert.equal((translation.text.match(/\n/g) || []).length, (row.source.match(/\n/g) || []).length);
    }
  }
});

test('all 919 reviewed UI keys merge across app and 15 node owners without model writes', () => {
  const nodeEntries = [...coreNodes().entries, ...shapeBatches.flatMap(batch => require(`../languages/native/${batch.file}`).entries)];
  const nodes = new Map();
  for (const row of nodeEntries) {
    if (!nodes.has(row.owner)) nodes.set(row.owner, { nodeType: row.owner, modelIdentity: `keep:${row.owner}` });
    let target = nodes.get(row.owner);
    for (const part of row.fieldPath.slice(0, -1)) target = target[part] ??= {};
    assert.equal(target[row.fieldPath.at(-1)], undefined, 'field identity must not be overwritten');
    target[row.fieldPath.at(-1)] = { 'UI-text': row.source, notes: row.notes };
  }
  assert.equal(nodes.size, 15);
  const source = [...nodes.values()].map(value => ({ type: 'nodeStrings', value }));
  const before = structuredClone(source);
  const projected = collectNativeCatalog('node', source);
  assert.deepEqual(projected.unmapped, []);
  assert.equal(projected.entries.length, 339);
  const appEntries = ['reviewed_translations', 'ai_studio_supplement', 'ai_studio_reuse_and_credits',
    'canva_and_assets', 'menus_file_edit_create_help', 'menus_comp_animation', 'menus_view_window', 'menus_other']
    .flatMap(file => require(`../languages/native/${file}`).entries);
  const app = collectNativeCatalog('app', [{ type: 'strings', value:
    Object.fromEntries(appEntries.map(row => [row.key, { 'UI-text': row.source }])) }]).entries;
  const all = [...appEntries, ...nodeEntries];
  assert.equal(new Set(all.map(row => row.key)).size, 919);
  for (const language of languages) {
    const resolved = resolveTranslations([...app, ...projected.entries], language,
      all.map(row => ({ key: row.key, source: row.source, ...row.translations[language] })));
    assert.ok(resolved.rows.every(row => ['reviewed', 'preserved'].includes(row.status)));
    const [record] = JSON.parse(renderNativePack(resolved));
    assert.equal(Object.keys(record.value).length, 919);
    for (const row of nodeEntries) assert.deepEqual(record.value[row.key], { 'UI-text': row.translations[language].text });
  }
  assert.deepEqual(source, before);
});

test('shape UI samples preserve literal code and technical values while tooltips use their actual labels', () => {
  const byKey = new Map(shapeBatches.flatMap(batch => require(`../languages/native/${batch.file}`).entries)
    .map(row => [row.key, row]));
  const sample = byKey.get('attrInfo:textShape.array');
  const code = [...sample.source.matchAll(/`([^`]+)`/g)].map(match => match[1]);
  assert.deepEqual(code, ['yourString {0}']);
  for (const language of languages) {
    assert.deepEqual([...sample.translations[language].text.matchAll(/`([^`]+)`/g)].map(match => match[1]), code);
    for (const key of ['nodeAttr:shape.is3d', 'nodeAttrEnum:shape.matteMode.4']) {
      const row = byKey.get(key);
      assert.deepEqual(row.translations[language], { decision: 'preserve', text: row.source });
    }
    for (const [tooltip, label] of [
      ['attrInfo:textShape.array', 'nodeAttr:textShape.text'],
      ['attrInfo:textShape.autoScaleFontSize', 'nodeAttr:textShape.fontSize'],
      ['attrInfo:textShape.autoScaleFontSize', 'nodeAttr:textShape.autoHeight'],
      ['attrInfo:textShape.allowWordBreaks', 'nodeAttr:textShape.autoScaleFontSize'],
      ['attrInfo:textShape.backgroundMode', 'nodeAttr:textShape.backgroundShape'],
      ['attrInfo:textShape.justifyAllLines', 'nodeAttr:textShape.horizontalAlignment'],
    ]) {
      assert.ok(byKey.get(tooltip).translations[language].text.includes(
        `<b>${byKey.get(label).translations[language].text}</b>`), `${language}: ${tooltip} label reference`);
    }
  }
});

test('evidenced source mistakes are corrected explicitly without changing current English identities', () => {
  const cases = [
    { file: 'nodes_basic_primitives.js', key: 'attrInfo:arcShape.radius',
      source: 'Set the inner radius of the circle the arc is drawn around.',
      url: 'https://cavalry.studio/docs/nodes/shapes/basic-shape/arc/',
      text: ['设置圆弧所在圆的外半径。', '設定圓弧所在圓的外半徑。', '円弧を描く円の外半径を設定します。'] },
    { file: 'nodes_text_shape.js', key: 'attrInfo:textShape.lineStyle',
      source: 'How background shapes are drawn when they overlap: Through (continue across gaps), Gaps (separate per item).',
      url: 'https://cavalry.studio/docs/nodes/shapes/text-shape/',
      text: ['设置下划线和删除线在词间空格处的绘制方式：连续（穿过空格），间断（在空格处断开）。',
        '設定底線和刪除線在詞間空格處的繪製方式：連續（穿過空格），間斷（在空格處斷開）。',
        '下線と取り消し線の単語間の空白での描き方を設定します: 連続（空白を通して描く）、空白で区切る（空白部分で線を途切れさせる）。'] },
    { file: 'nodes_text_shape.js', key: 'attrInfo:textShape.avoidOrphans',
      source: 'When checked, an attempt to prevent the last word appearing as the only word on the last line will be made. Requires <b>Auto</b> for <b>Text Box Siz</b> to be unchecked.',
      url: 'Definitions/nodeDefinitions.json#textShape.attributes.avoidOrphans.dimming',
      text: ['勾选时，将尽量避免末行仅出现一个孤词。需要未勾选<b>文本框大小</b>的<b>自动宽度</b>。',
        '勾選時，將儘量避免末行僅出現一個孤詞。需要未勾選<b>文字框大小</b>的<b>自動寬度</b>。',
        'チェックを入れると、最終行に単語が1つだけ残ることをできるだけ防ぎます。<b>テキストボックスサイズ</b>の<b>自動幅</b>のチェックが外れている必要があります。'] },
  ];
  for (const item of cases) {
    const { entries, provenance } = require(`../languages/native/${item.file}`);
    const row = entries.find(entry => entry.key === item.key);
    assert.equal(row.source, item.source, 'source typo must remain bound to the official bytes');
    assert.deepEqual(languages.map(language => row.translations[language].text), item.text);
    const correction = provenance.sourceCorrections.find(record => record.key === item.key);
    assert.ok(correction.reason && correction.evidence.includes(item.url));
    assert.ok(correction.evidence.includes('Definitions/nodeDefinitions.json'));
  }
});

test('Text Shape string resizing describes string shortening, and orphan gating names Auto Width', () => {
  const byKey = new Map(require('../languages/native/nodes_text_shape.js').entries.map(row => [row.key, row]));
  assert.deepEqual(languages.map(language => byKey.get('attrInfo:textShape.manipulators').translations[language].text),
    ['连接用于处理字符串的图层（缩短字符串、大小写转换、随机打乱等）。',
      '連接用於處理字串的圖層（縮短字串、變更大寫/小寫、隨機打亂等）。',
      '文字列を加工するレイヤー（文字列の短縮、大文字/小文字の変更、シャッフルなど）を接続します。']);
  for (const language of languages) assert.ok(byKey.get('attrInfo:textShape.avoidOrphans').translations[language].text.includes(
    `<b>${byKey.get('nodeAttr:textShape.autoWidth').translations[language].text}</b>`));
});

// -- OpenType：翻译显示功能名，不触碰字体/feature/预设身份 ----------
test('Apply OpenType binds its complete 161 display leaves without changing feature or preset identities', () => {
  const entries = assertApprovedBatch('nodes_apply_opentype.js', 161,
    '10f8aebc8489ed9c87669fec3455cf9b5991f93a23502c86a6772406fbee40cb');
  assert.ok(entries.every(row => row.owner === 'applyOpenType' && row.dontTranslate === false));
  assert.deepEqual(entries.reduce((counts, row) => {
    counts[row.displayRole] = (counts[row.displayRole] || 0) + 1;
    return counts;
  }, {}), { 'attribute-info': 7, 'attribute-label': 7, 'enum-label': 137,
    'node-info': 1, 'node-name': 1, 'preset-label': 8 });
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(entries.map(row =>
    [row.key, row.owner, row.fieldPath, row.source, row.notes]))).digest('hex'),
    'c14e13a7a5d52b2c76f3a9f22e85f8d3aa3ae2dc4c5447f50ad98645a3a5bec1');
  const { provenance } = require('../languages/native/nodes_apply_opentype.js');
  assert.equal(provenance.sourceSha256, 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0');
});

test('OpenType labels distinguish additive blending, petite caps, Indic forms and mathematical scripts', () => {
  const byKey = new Map(require('../languages/native/nodes_apply_opentype.js').entries.map(row => [row.key, row]));
  for (const language of languages) {
    const text = id => byKey.get(`nodeAttrEnum:applyOpenType.feature.${id}`).translations[language].text;
    assert.notEqual(text(21), text(22));
    assert.notEqual(text(75), text(97));
    assert.notEqual(text(35), text(43));
    assert.doesNotMatch(text(99), /脚本|腳本/);
    assert.ok(text(13).includes('Ro'));
    assert.deepEqual(byKey.get('nodeAttrEnum:applyOpenType.feature.5').translations[language],
      { decision: 'preserve', text: 'Akhand' });
    assert.notEqual(byKey.get('nodeAttrEnum:applyOpenType.blendMode.0').translations[language].text,
      byKey.get('nodeAttrEnum:applyOpenType.blendMode.6').translations[language].text);
    const enabled = byKey.get('attrInfo:applyOpenType.features.enabled').translations[language].text;
    assert.ok(enabled.includes('(1)') && enabled.includes('(0)'));
  }
  const japanese = [...byKey.values()].map(row => row.translations.ja_JP.text).join('\n');
  assert.doesNotMatch(japanese, /上下文|必需|字母|数学脚本/);
  assert.ok(byKey.get('nodeAttrEnum:applyOpenType.feature.116').translations.ja_JP.text.includes('メトリクス'));
  assert.deepEqual(languages.slice(0, 2).map(language =>
    byKey.get('nodeAttrEnum:applyOpenType.feature.113').translations[language].text),
    ['Vattu 变体', 'Vattu 變體']);
});

test('OpenType alternate access, relative base placement and letter matching retain the actual operations', () => {
  const byKey = new Map(require('../languages/native/nodes_apply_opentype.js').entries.map(row => [row.key, row]));
  const feature = index => byKey.get(`nodeAttrEnum:applyOpenType.feature.${index}`);
  assert.equal(feature(0).source, 'Access All Alternates');
  assert.deepEqual(languages.map(language => feature(0).translations[language].text),
    ['访问所有替代字形', '存取所有替代字形', 'すべての代替グリフへのアクセス']);
  for (const [indices, position] of [
    [[1, 2, 3], '上方'], [[7, 8, 9], '下方'], [[78, 79], '前方'], [[80, 81], '後方'],
  ]) {
    for (const index of indices) {
      const japanese = feature(index).translations.ja_JP.text;
      assert.ok(japanese.includes(position), `feature ${index} places a form relative to the base character`);
      assert.doesNotMatch(japanese, /上部|下部|前部|後部|基線/, 'neither a glyph part nor the baseline is the base character');
    }
  }
  const words = byKey.get('nodeTab:applyOpenType.twoLetterWords');
  assert.equal(words.source, 'All 2 Letter Words');
  assert.ok(words.translations.ja_JP.text.includes('アルファベット2文字'));
});

// -- 累加与渲染：完整 owner、技术路径和声明式显示输入 ----------------
const renderQueueNodes = () => require('../languages/native/nodes_accumulator_renderqueue.js');
test('Accumulator and Render Queue Item bind all 100 current display leaves and source flags', () => {
  const entries = assertApprovedBatch('nodes_accumulator_renderqueue.js', 100,
    '1fbdc4d9c8fde7efa856991e59739e7a43084eaa1518353385c9b1211506e6e7');
  assert.deepEqual(['accumulator', 'renderQueueItem'].map(owner => entries.filter(row => row.owner === owner).length), [8, 92]);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(entries.map(row =>
    [row.key, row.owner, row.fieldPath, row.source, row.notes]))).digest('hex'),
  'a6e07d2017d212c486b5da4731c5cb8ff5b1c7e952bbc304f6074b79621f4e0c');
  assert.deepEqual(entries.filter(row => row.dontTranslate).map(row => row.key),
    ['nodeAttrEnum:renderQueueItem.metaDataFormat.0', 'nodeAttrEnum:renderQueueItem.upload.1']);
  assert.equal(renderQueueNodes().provenance.sourceSha256, 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0');
});

test('render explanations retain actual paths, timecode, numeric examples and referenced labels', () => {
  const byKey = new Map(renderQueueNodes().entries.map(row => [row.key, row]));
  assert.doesNotMatch(byKey.get('attrInfo:renderQueueItem.ensureUniqueNames').translations.ja_JP.text, /或者/);
  for (const language of languages) {
    for (const [key, token] of [
      ['attrInfo:renderQueueItem.filePath', '@project/Renders'],
      ['attrInfo:renderQueueItem.targets.remapToTimecode', 'MM:SS:FF'],
      ['attrInfo:renderQueueItem.padding', 'fileName.0001.png'],
      ['attrInfo:renderQueueItem.dynamicRenderRange', '0..5'],
    ]) assert.ok(byKey.get(key).translations[language].text.includes(token), `${language}: ${key} technical example`);
    for (const [tooltip, label] of [
      ['attrInfo:renderQueueItem.dynamicIndexOffset', 'nodeAttr:renderQueueItem.dynamicIndex'],
      ['attrInfo:renderQueueItem.dynamicRender', 'nodeAttr:renderQueueItem.dynamicIndex'],
      ['attrInfo:renderQueueItem.enableMetadata', 'nodeAttr:renderQueueItem.metadata'],
      ['attrInfo:renderQueueItem.ensureUniqueNames', 'nodeAttr:renderQueueItem.fileName'],
      ['attrInfo:renderQueueItem.frameRange', 'nodeAttr:renderQueueItem.frameRangeMode'],
    ]) assert.ok(byKey.get(tooltip).translations[language].text.includes(
      `<b>${byKey.get(label).translations[language].text}</b>`), `${language}: ${tooltip} reference`);
    for (const row of byKey.values()) if (row.dontTranslate) {
      assert.deepEqual(row.translations[language], { decision: 'preserve', text: row.source });
    }
    assert.equal(byKey.get('nodeAttr:accumulator.padding').translations[language].text,
      ['间隔', '間距', '間隔'][languages.indexOf(language)]);
    assert.equal(byKey.get('nodeAttr:renderQueueItem.padding').translations[language].text,
      ['补零位数', '補零位數', 'ゼロ埋め桁数'][languages.indexOf(language)]);
  }
});

test('render review preserves frame-step semantics, technical FPS and cross-surface terminology', () => {
  const byKey = new Map(renderQueueNodes().entries.map(row => [row.key, row]));
  for (const language of ['zh-Hans', 'zh-Hant']) {
    const step = byKey.get('attrInfo:renderQueueItem.usePlaybackStep').translations[language].text;
    assert.ok(step.includes('N'));
    assert.doesNotMatch(step, /每隔 N/);
    assert.ok(step.includes(language === 'zh-Hans' ? '播放步进' : '播放步進'));
    assert.doesNotMatch(byKey.get('attrInfo:renderQueueItem.respectViewportFiltering').translations[language].text,
      /独奏|獨奏/);
    for (const key of ['nodeAttr:renderQueueItem.targets.remapToFPS', 'nodeAttr:renderQueueItem.targets.remapFPS']) {
      assert.ok(byKey.get(key).translations[language].text.includes('FPS'));
    }
  }
  assert.ok(byKey.get('attrInfo:renderQueueItem.generator').translations['zh-Hant'].text.includes('編解碼器'));
  assert.ok(byKey.get('attrInfo:renderQueueItem.targets').translations['zh-Hant'].text.includes('素材視窗'));
  assert.doesNotMatch(byKey.get('attrInfo:renderQueueItem.targets.remapToTimecode').translations.ja_JP.text, /基いて/);
});

test('render queue source projection preserves nested attribute identities while emitting only UI strings', () => {
  const { entries } = renderQueueNodes();
  const nodes = new Map();
  for (const row of entries) {
    if (!nodes.has(row.owner)) nodes.set(row.owner, { nodeType: row.owner, modelId: `identity:${row.owner}` });
    let value = nodes.get(row.owner);
    for (const field of row.fieldPath.slice(0, -1)) value = value[field] ??= {};
    value[row.fieldPath.at(-1)] = { 'UI-text': row.source, notes: row.notes, dontTranslate: row.dontTranslate };
  }
  const source = [...nodes.values()].map(value => ({ type: 'nodeStrings', value }));
  const before = structuredClone(source);
  const projected = collectNativeCatalog('node', source);
  assert.deepEqual(projected.unmapped, []);
  assert.equal(projected.entries.length, 100);
  for (const language of languages) {
    const resolved = resolveTranslations(projected.entries, language,
      entries.map(row => ({ key: row.key, source: row.source, ...row.translations[language] })));
    assert.ok(resolved.rows.every(row => ['reviewed', 'preserved'].includes(row.status)));
    const [pack] = JSON.parse(renderNativePack(resolved));
    assert.equal(Object.keys(pack.value).length, 100);
    for (const row of entries) assert.deepEqual(pack.value[row.key], { 'UI-text': row.translations[language].text });
  }
  assert.deepEqual(source, before);
});

test('all 34 genuinely new metadata descriptions are source-bound independently of native ICU messages', () => {
  const entries = assertApprovedBatch('metadata_supplement.js', 34, '7aa91f15e69264edb068cd57fa23d27f0b985c159c61b1d67f3e70b5fa73fa97', false);
  assert.ok(entries.every(entry => entry.key.endsWith('/description') && entry.key.includes('.json#/')));
  for (const entry of entries) {
    const code = [...entry.source.matchAll(/`([^`]+)`/g)].map(match => match[1]);
    for (const translation of Object.values(entry.translations)) {
      assert.deepEqual([...translation.text.matchAll(/`([^`]+)`/g)].map(match => match[1]), code);
    }
  }
});

// -- 旧说明复用：显式审定 manifest，不复制三份旧译数据 -----------------
const metadataFiles = ['api_function_metadata.json', 'core_api_function_metadata.json',
  'gui_api_function_metadata.json', 'widget_api_function_metadata.json'];
function legacyMetadataDocuments() {
  return Object.fromEntries(['en', ...languages].map(language => [language,
    Object.fromEntries(metadataFiles.map(file => [file, require(`../languages/${language}/MetaData/${file}`)]))]));
}
function reconstructedMetadataSource() {
  const documents = structuredClone(legacyMetadataDocuments().en);
  const oldGui = documents['gui_api_function_metadata.json'];
  const moved = oldGui.find(record => record.name === 'replaceAsset');
  assert.ok(moved);
  documents['gui_api_function_metadata.json'] = oldGui.filter(record => record !== moved);
  documents['api_function_metadata.json'].push(moved);
  for (const entry of require('../languages/native/metadata_supplement').entries) {
    const [file, pointer] = entry.key.split('#/');
    const parts = pointer.split('/').slice(0, -1);
    if (parts.length === 1) {
      documents[file].push({ name: parts[0], description: entry.source, type: 'function', arguments: [] });
    } else {
      const parent = documents[file].find(record => record.name === parts[0]);
      assert.ok(parent && parts[1] === 'methods');
      parent.methods.push({ name: parts[2], description: entry.source, arguments: [] });
    }
  }
  // -- 合成新版参数证明：投影不能从旧文档复制机器 schema ----------------
  for (const name of ['setGradientFromColors', 'setGradientInterpolation']) {
    const method = documents['api_function_metadata.json'].find(record => record.name === name);
    method.arguments = [{ name: 'currentLayer', type: 'string', required: true },
      { name: 'currentAttribute', type: 'string', required: true }];
    method.fixtureRevision = 'current-source-only';
  }
  return documents;
}

test('metadata reuse manifest explicitly approves 478 prior descriptions including one moved function', () => {
  const { approvals } = require('../languages/native/metadata_reuse_manifest');
  assert.equal(approvals.length, 478);
  assert.equal(new Set(approvals.map(row => row.key)).size, 478);
  for (const row of approvals) {
    assert.match(row.sourceSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(Object.keys(row.translationSha256).sort(), [...languages].sort());
    for (const hash of Object.values(row.translationSha256)) assert.match(hash, /^[a-f0-9]{64}$/);
  }
  const moved = approvals.find(row => row.key === 'api_function_metadata.json#/replaceAsset/description');
  assert.equal(moved.legacyKey, 'gui_api_function_metadata.json#/replaceAsset/description');
});

test('478 explicitly approved reused descriptions plus 34 new ones cover the reconstructed 512-description source', () => {
  const { approvals } = require('../languages/native/metadata_reuse_manifest');
  const { resolveApprovedMetadataReuse } = require('./native_metadata_reuse');
  const { collectMetadataDescriptions, projectMetadataHelp } = require('./native_metadata_help');
  const sources = reconstructedMetadataSource();
  const old = legacyMetadataDocuments();
  const newEntries = require('../languages/native/metadata_supplement').entries;
  const withoutDescriptions = value => Array.isArray(value) ? value.map(withoutDescriptions)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== 'description').map(([key, child]) => [key, withoutDescriptions(child)])) : value;
  let descriptionCount = 0;
  const sourceCounts = {};
  for (const file of metadataFiles) {
    sourceCounts[file] = collectMetadataDescriptions(file, sources[file]).length;
    descriptionCount += sourceCounts[file];
    const reused = resolveApprovedMetadataReuse({ file, source: sources[file], legacyDocuments: old,
      approvals: approvals.filter(row => row.key.startsWith(`${file}#`)) });
    const added = newEntries.filter(row => row.key.startsWith(`${file}#`));
    assert.equal(reused.missingApprovals.length, added.length);
    for (const language of languages) {
      const reviews = [...reused.reviews[language], ...added.map(row => ({ key: row.key,
        source: row.source, text: row.translations[language].text }))];
      const projected = projectMetadataHelp(file, sources[file], reviews);
      assert.deepEqual(projected.missing, []);
      assert.deepEqual(withoutDescriptions(projected.document), withoutDescriptions(sources[file]));
    }
  }
  assert.equal(descriptionCount, 512);
  assert.deepEqual(sourceCounts, Object.fromEntries(metadataFiles.map((file, index) => [file, [220, 165, 92, 35][index]])));
});
