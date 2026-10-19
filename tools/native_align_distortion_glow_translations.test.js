#!/usr/bin/env node
/**
 * [INPUT]: 依赖 align/distortionFilter/glowFilter 的官方100叶审定模块、可选stage证据、native_language_pack 与 ICU 格式门
 * [OUTPUT]: 官方owner选择同时绑定catalogId，不混入同owner schema补充；锁定完整source identity/notes/provenance、300个决策槽、图像/合成语义反例及只改显示值的投影边界
 * [POS]: tools 的默认整域审批合同；显式stage候选只诊断语义，不构成正式入库或运行时显示证明
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

// -- 正式落入 tools/ 后从 dirname 推导；stage 运行必须明确给 ROOT ----------
const REPO_ROOT = process.env.CAVALRY_REPO_ROOT
  ? path.resolve(process.env.CAVALRY_REPO_ROOT)
  : path.resolve(__dirname, '..');
const { collectNativeCatalog, resolveTranslations, renderNativePack } = require(path.join(REPO_ROOT, 'tools/native_language_pack.js'));
const { assertNativeTranslationFormat } = require(path.join(REPO_ROOT, 'tools/native_translation_format.js'));
const MODULE_PATH = path.join(REPO_ROOT, 'languages/native/nodes_align_distortion_glow.js');
const STAGE_SOURCE_PATH = process.env.CAVALRY_ALIGN_DISTORTION_GLOW_STAGE_SOURCE
  ? path.resolve(process.env.CAVALRY_ALIGN_DISTORTION_GLOW_STAGE_SOURCE) : null;
const STAGE_CANDIDATE_PATH = process.env.CAVALRY_ALIGN_DISTORTION_GLOW_STAGE_CANDIDATE
  ? path.resolve(process.env.CAVALRY_ALIGN_DISTORTION_GLOW_STAGE_CANDIDATE) : null;
const STAGE_REVIEWED_INPUT_PATH = process.env.CAVALRY_ALIGN_DISTORTION_GLOW_REVIEWED_INPUT
  ? path.resolve(process.env.CAVALRY_ALIGN_DISTORTION_GLOW_REVIEWED_INPUT) : null;
const LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const OWNERS = Object.freeze({ align: 6, distortionFilter: 47, glowFilter: 47 });
const OWNER_NAMES = Object.keys(OWNERS);
const SOURCE_ONLY_APPROVAL = 'source-and-old-candidates-only; no translation decisions or approval';
const FORMAL_APPROVAL = 'approved-source-bound-display-input';
const SOURCE_CATALOG = 'Definitions/Translation/nodeStrings_en-GB.source.json';
const JAPANESE_CATALOG = 'Definitions/Translation/nodeStrings_ja-JP.translation.json';
const ENGLISH_SOURCE_SHA256 = 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0';
const JAPANESE_SOURCE_SHA256 = '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439';
const FULL_SOURCE_PAIRS_SHA256 = 'aafe14ec59597cdab7fb53decc19d2ff8ae3884b1ff5bc32177bc2071dbc1bdf';
const FULL_KEYSET_SHA256 = '7bcde753b6f73e95f80e1388b01c7dd6ce0399e0ad30f460c0afb0911ffbedaf';
const FULL_IDENTITY_NOTES_SHA256 = 'f972657a62c3e9a30638e2be1097ccb9a3acb31f0857abd2470efbe84558379c';
const EXPECTED_OWNER_DIGESTS = Object.freeze({
  align: {
    keyCount: 6,
    sourcePairsSha256: '755124ce8ee1ef69f8fce1322c652b14365b0e913642197220b4f5c7b9be9d06',
    identityAndNotesSha256: '5f8aeb8d4708f5b3d682c42def3b886b644d51715823c1c5cfa4aa1831016acc',
    keySetSha256: 'ad5815242228ecd47f80589e9e7f9c83c2ed4fdd594a7ade140f7f5e2b8225c5',
  },
  distortionFilter: {
    keyCount: 47,
    sourcePairsSha256: 'ec62d0a41aef227d17bd6febafc0d4af5b613bb57e77d8a9ad4d35b3396ad5f3',
    identityAndNotesSha256: 'df4b02beb4b9ecd7ad14f877a2893f22c6f1f21e619eac0691372c8b287590e5',
    keySetSha256: '1cbb8a3372a29ecb06018c3a8c5d93a35b5ffec9566c0510dc77bd64e60d34d8',
  },
  glowFilter: {
    keyCount: 47,
    sourcePairsSha256: '74ee2fc0eb8cdaf9d92c539c5bfcd9af13ab2aa9635aa0c0e09254189f09109d',
    identityAndNotesSha256: '7fe2ff0141b98e80c0cd0c826d3708c55d92f6105364c95383e124ac786a7b9e',
    keySetSha256: '44ae0aeae7faa3a53ff5678bc7011e82c34247f186ec85d7c61965225cdf5e99',
  },
});
const SHARED_BLEND_INDICES = Object.freeze([1, 3, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]);
const ALPHA_BLEND_INDICES = Object.freeze([30, 31]);
const JAPANESE_PORTER_DUFF = Object.freeze({
  4: { source: 'Dst Over', operand: /デスティネーション/, operator: /オーバー/, replaceOperand: 'ソース', replaceOperator: 'アトップ' },
  5: { source: 'Src In', operand: /ソース/, operator: /イン/, replaceOperand: 'デスティネーション', replaceOperator: 'アウト' },
  6: { source: 'Dst In', operand: /デスティネーション/, operator: /イン/, replaceOperand: 'ソース', replaceOperator: 'アウト' },
  8: { source: 'Dst Out', operand: /デスティネーション/, operator: /アウト/, replaceOperand: 'ソース', replaceOperator: 'イン' },
  9: { source: 'Src Atop', operand: /ソース/, operator: /アトップ/, replaceOperand: 'デスティネーション', replaceOperator: 'オーバー' },
  10: { source: 'Dst Atop', operand: /デスティネーション/, operator: /アトップ/, replaceOperand: 'ソース', replaceOperator: 'オーバー' },
});
const DIGEST = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const SOURCE_ONLY_SKIP = STAGE_SOURCE_PATH && !STAGE_CANDIDATE_PATH
  && !STAGE_REVIEWED_INPUT_PATH
  ? 'SKIP: explicitly selected source-only stage input has no locale draft; translation assertions wait for draft/root adjudication'
  : false;
const MUTATION_SKIP = STAGE_CANDIDATE_PATH && !STAGE_REVIEWED_INPUT_PATH
  ? 'SKIP: unadjudicated candidate has known semantic failures; reverse-mutation checks require a valid baseline'
  : SOURCE_ONLY_SKIP;
const DECISION_SLOTS = 300;
let cachedInput;

function readJson(file, label) {
  assert.ok(fs.existsSync(file), `RED: ${label} is missing at ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function sourceIdentity(rows) {
  return rows.map(row => [row.key, row.owner, row.fieldPath, row.source, row.notes, row.displayRole, row.dontTranslate, row.vendorJapanese]);
}
function findEntry(entries, key) {
  const entry = entries.find(row => row.key === key);
  assert.ok(entry, `missing source-bound key ${key}`);
  return entry;
}
function currentText(entries, key, locale) {
  const translation = findEntry(entries, key).translations?.[locale];
  assert.equal(typeof translation?.text, 'string', `${key}/${locale} translation text missing`);
  return translation.text;
}
function loadSelectedInput() {
  if (cachedInput) return cachedInput;
  if (STAGE_REVIEWED_INPUT_PATH && (!STAGE_SOURCE_PATH || STAGE_CANDIDATE_PATH)) {
    assert.fail('RED: root-reviewed source-bound input requires the explicit full source and no raw candidate path');
  }
  if (STAGE_CANDIDATE_PATH && !STAGE_SOURCE_PATH) {
    assert.fail('RED: stage candidate requires the explicitly selected complete official source input');
  }
  if (STAGE_SOURCE_PATH) {
    const source = readJson(STAGE_SOURCE_PATH, 'official full-source stage input');
    assert.equal(source.approvalState, SOURCE_ONLY_APPROVAL, 'stage source remains unapproved evidence');
    assert.equal(source.batchId, 'batch-019-align-distortion-glow');
    const entries = source.entries;
    if (STAGE_REVIEWED_INPUT_PATH) {
      const reviewed = readJson(STAGE_REVIEWED_INPUT_PATH, 'root-reviewed source-bound input');
      assert.equal(formalApprovalState(reviewed), FORMAL_APPROVAL, 'reviewed input carries root adjudication state');
      assert.equal(reviewed.provenance?.sourcePairsSha256, FULL_SOURCE_PAIRS_SHA256);
      assert.equal(DIGEST(sourceIdentity(reviewed.entries)), FULL_IDENTITY_NOTES_SHA256);
      assert.deepEqual(reviewed.entries.map(row => row.key), entries.map(row => row.key));
      for (let index = 0; index < entries.length; index += 1) {
        assert.deepEqual(sourceIdentity([reviewed.entries[index]]), sourceIdentity([entries[index]]),
          `${entries[index].key} reviewed source identity still matches official source`);
      }
      cachedInput = { ...reviewed, __stageSourceOnly: false, __formal: false, __rootReviewedSourceBound: true };
      return cachedInput;
    }
    if (!STAGE_CANDIDATE_PATH) {
      cachedInput = { ...source, entries, __stageSourceOnly: true, __formal: false };
      return cachedInput;
    }
    const draft = readJson(STAGE_CANDIDATE_PATH, 'unapproved full-draft diagnostic input');
    assert.equal(draft.batchId, source.batchId);
    assert.equal(draft.sourcePairsSha256, FULL_SOURCE_PAIRS_SHA256);
    assert.equal(draft.entries.length, 100);
    const draftByKey = new Map(draft.entries.map(row => [row.key, row]));
    assert.equal(draftByKey.size, 100, 'candidate keys are unique');
    const mergedEntries = entries.map(sourceRow => {
      const candidate = draftByKey.get(sourceRow.key);
      assert.ok(candidate, `candidate is missing ${sourceRow.key}`);
      assert.equal(candidate.source, sourceRow.source, `${sourceRow.key} source echo`);
      return { ...sourceRow, translations: candidate.translations };
    });
    assert.equal(draft.entries.every(row => entries.some(sourceRow => sourceRow.key === row.key)), true,
      'candidate has no foreign display keys');
    cachedInput = { ...source, entries: mergedEntries, __stageSourceOnly: false, __formal: false,
      __unapprovedDraft: true, __candidateEnvelope: draft };
    return cachedInput;
  }
  assert.ok(fs.existsSync(MODULE_PATH), `RED: approved align/distortionFilter/glowFilter module is not present at ${MODULE_PATH}`);
  const formal = require(MODULE_PATH);
  cachedInput = { ...formal, __stageSourceOnly: false, __formal: true };
  return cachedInput;
}
function formalApprovalState(data) {
  return data.provenance?.approvalState ?? data.approvalState;
}
function assertSourceContract(data) {
  const entries = data.entries;
  assert.ok(Array.isArray(entries), 'selected source-bound data must expose entries');
  const sorted = [...entries].sort((a, b) => compare(a.key, b.key));
  assert.equal(entries.length, 100, 'align/distortionFilter/glowFilter are exactly 100 display leaves');
  assert.deepEqual(entries.map(row => row.key), sorted.map(row => row.key), 'stable registry-key order');
  assert.equal(new Set(entries.map(row => row.key)).size, 100, 'all source keys are unique');
  assert.equal(DIGEST(entries.map(row => row.key)), FULL_KEYSET_SHA256, 'full 100-key set is source-locked');
  assert.equal(DIGEST(entries.map(row => [row.key, row.source])), FULL_SOURCE_PAIRS_SHA256);
  assert.equal(DIGEST(sourceIdentity(entries)), FULL_IDENTITY_NOTES_SHA256, 'full source identity/notes/role/vendor projection is locked');
  const counts = Object.fromEntries(OWNER_NAMES.map(owner => [owner, entries.filter(row => row.owner === owner).length]));
  assert.deepEqual(counts, OWNERS);
  for (const [owner, expectation] of Object.entries(EXPECTED_OWNER_DIGESTS)) {
    const rows = entries.filter(row => row.owner === owner);
    assert.equal(DIGEST(rows.map(row => row.key)), expectation.keySetSha256, `${owner} exact keyset`);
    assert.equal(DIGEST(rows.map(row => [row.key, row.source])), expectation.sourcePairsSha256, `${owner} source pairs`);
    assert.equal(DIGEST(sourceIdentity(rows)), expectation.identityAndNotesSha256, `${owner} identity and notes`);
  }
  assert.equal(entries.every(row => row.catalogId === 'Definitions/Translation/nodeStrings'), true, 'all 100 leaves use the locked catalog');
  assert.equal(entries.every(row => row.dontTranslate === false), true, 'source scope has no DNT identity leaves');
  assert.equal(entries.every(row => row.vendorJapanese === row.source), true, 'JA source echoes English for every row; no vendor JA text is silently imported');
  assert.equal(entries.every(row => row.vendorJapaneseChanged !== true), true, 'no source row records a changed vendor Japanese translation');
  if (!data.__rootReviewedSourceBound) {
    assert.equal(entries.every(row => row.vendorJapaneseChanged === false), true,
      'official source and future formal data retain the explicit unchanged-vendor-Japanese fact');
  }
  assert.equal(entries.every(row => Array.isArray(row.fieldPath) && Array.isArray(row.notes)
    && row.notes.every(note => typeof note === 'string') && typeof row.displayRole === 'string'), true,
  'each key retains its full fieldPath, notes and source displayRole');
  assert.equal(entries.every(row => ['attribute-info', 'attribute-label', 'enum-label', 'node-info', 'node-name', 'tab-label'].includes(row.displayRole)), true);
  const provenance = data.sourceProvenance ?? data.provenance;
  assert.ok(provenance, 'official source provenance is required');
  assert.equal(provenance.cavalryVersion, '2.8.0');
  assert.equal(provenance.bundleIdentifier, 'com.scenegroup.cavalry');
  assert.equal(provenance.catalogPath, SOURCE_CATALOG);
  assert.equal(provenance.sourceSha256, ENGLISH_SOURCE_SHA256);
  assert.equal(provenance.vendorJapanesePath, JAPANESE_CATALOG);
  assert.equal(provenance.vendorJapaneseSha256, JAPANESE_SOURCE_SHA256);
  if (data.scope?.sourcePairsSha256 != null) assert.equal(data.scope.sourcePairsSha256, FULL_SOURCE_PAIRS_SHA256);
  if (data.scope?.keyCount != null) assert.equal(data.scope.keyCount, 100);
}
function assertTranslationContract(entries) {
  assert.equal(entries.length, 100);
  let slots = 0;
  for (const entry of entries) for (const locale of LOCALES) {
    const translation = entry.translations?.[locale];
    assert.ok(translation, `${entry.key}/${locale} decision missing`);
    const mustPreserve = ['nodeAttr:align.x', 'nodeAttr:align.y'].includes(entry.key);
    assert.equal(translation.decision, mustPreserve ? 'preserve' : 'translate',
      `${entry.key}/${locale} decision category; only X/Y axis symbols are source-preserved`);
    assert.equal(typeof translation.text, 'string');
    assert.ok(translation.text.trim(), `${entry.key}/${locale} translation empty`);
    if (mustPreserve) assert.equal(translation.text, entry.source, `${entry.key}/${locale} exact X/Y source identity`);
    else assert.notEqual(translation.text, entry.source, `${entry.key}/${locale} translated display text cannot silently preserve English`);
    assertNativeTranslationFormat(entry.source, translation.text);
    slots += 1;
  }
  assert.equal(slots, DECISION_SLOTS, '100 keys × 3 locales = exactly 300 decision slots');
}
function assertFormalModuleRegistered() {
  assert.ok(fs.existsSync(MODULE_PATH), `RED: formal approval module is absent: ${MODULE_PATH}`);
  const data = require(MODULE_PATH);
  assert.equal(formalApprovalState(data), FORMAL_APPROVAL, 'module provenance must record root-adjudicated status');
  const registry = require(path.join(REPO_ROOT, 'languages/native/approved_modules.js'));
  assert.ok(registry.APPROVED_MODULES.includes('nodes_align_distortion_glow'), 'approved module is explicitly registered, never auto-discovered');
  assert.equal(registry.approvedEntries().filter(row => row.catalogId === 'Definitions/Translation/nodeStrings'
    && ['align', 'distortionFilter', 'glowFilter'].includes(row.owner)).length, 100,
    'approved registry exposes exactly the merged owner data');
  assert.equal(data.entries.every(row => !Object.hasOwn(row, 'oldCandidates')), true,
    'read-only old candidates must not leak into the formal module');
}
function assertSignMapping(entries, locale, axis) {
  const key = `attrInfo:align.${axis}`;
  const text = currentText(entries, key, locale);
  const negIndex = text.search(/[-−]\s*1/);
  assert.notEqual(negIndex, -1, `${key}/${locale} keeps the -1 control`);
  const negEnd = negIndex + text.slice(negIndex).match(/[-−]\s*1/)[0].length;
  const positiveIndex = text.indexOf('1', negEnd);
  assert.notEqual(positiveIndex, -1, `${key}/${locale} keeps the +1 control`);
  const negativeSegment = text.slice(negEnd, positiveIndex);
  const positiveSegment = text.slice(positiveIndex + 1);
  const marker = axis === 'x'
    ? { negative: /左/, positive: /右/ }
    : locale === 'ja_JP'
      ? { negative: /下部|下/, positive: /上部|上/ }
      : { negative: /底部|底|下部/, positive: /顶部|頂部|上部|頂|顶/ };
  assert.match(negativeSegment, marker.negative, `${key}/${locale}: -1 must map to the source-side direction`);
  assert.match(positiveSegment, marker.positive, `${key}/${locale}: +1 must map to the opposite source-side direction`);
}
function assertAlignSigns(entries) {
  for (const locale of LOCALES) for (const axis of ['x', 'y']) assertSignMapping(entries, locale, axis);
}
function localeTerms(locale) {
  return {
    radius: locale === 'zh-Hant' ? /半徑/ : /半径/,
    intensity: locale === 'zh-Hant' ? /強度|亮度/ : locale === 'ja_JP' ? /強度|輝度|明るさ/ : /强度|亮度/,
    preview: locale === 'zh-Hant' ? /預覽/ : locale === 'ja_JP' ? /プレビュー/ : /预览/,
    visible: locale === 'zh-Hant' ? /顯示|啟用|開啟/ : locale === 'ja_JP' ? /表示|有効/ : /显示|启用|开启/,
    opacity: /不透明度|透明度/,
  };
}
function assertRadiusIntensity(entries) {
  for (const locale of LOCALES) {
    const radius = currentText(entries, 'nodeAttr:glowFilter.blur', locale);
    const intensity = currentText(entries, 'nodeAttr:glowFilter.intensity', locale);
    assert.match(radius, localeTerms(locale).radius, `${locale} Glow Radius remains a distance control`);
    assert.match(intensity, localeTerms(locale).intensity, `${locale} Intensity remains a strength/brightness control`);
    assert.notEqual(radius, intensity, `${locale} radius cannot collapse into intensity`);
    for (const channel of ['R', 'G', 'B']) {
      assert.match(currentText(entries, `nodeAttr:glowFilter.blur${channel}`, locale), localeTerms(locale).radius,
        `${locale} ${channel} Glow Radius is still radius`);
      assert.match(currentText(entries, `nodeAttr:glowFilter.intensity${channel}`, locale), localeTerms(locale).intensity,
        `${locale} ${channel} Intensity is still strength/brightness`);
    }
  }
}
function assertPreviewVisibilityOpacity(entries) {
  for (const locale of LOCALES) {
    const visibility = currentText(entries, 'nodeAttr:distortionFilter.showPreview', locale);
    const opacity = currentText(entries, 'nodeAttr:distortionFilter.shaderOpacity', locale);
    assert.match(visibility, localeTerms(locale).preview);
    assert.match(visibility, localeTerms(locale).visible, `${locale} Show Preview remains a visibility toggle`);
    assert.match(opacity, localeTerms(locale).preview);
    assert.match(opacity, localeTerms(locale).opacity, `${locale} Preview Opacity remains a transparency amount`);
    assert.notEqual(visibility, opacity, `${locale} preview visibility and opacity are independent controls`);
  }
}
function assertHsvValue(entries) {
  const cue = { 'zh-Hans': /HSV|\bV\b|明度|亮度/, 'zh-Hant': /HSV|\bV\b|明度|亮度/, ja_JP: /HSV|\bV\b|明度|輝度|明るさ/ };
  for (const locale of LOCALES) {
    const label = currentText(entries, 'nodeAttrEnum:distortionFilter.sampleMode.2', locale);
    assert.match(label, cue[locale], `${locale} Value is the HSV V/brightness channel, not an abstract value`);
    assert.doesNotMatch(label, /^(?:值|値)$/, `${locale} generic Value alone loses HSV channel identity`);
  }
}
function assertRgbChannelIdentity(entries) {
  const names = {
    'zh-Hans': { R: /红/, G: /绿/, B: /蓝/ },
    'zh-Hant': { R: /紅/, G: /綠/, B: /藍/ },
    ja_JP: { R: /赤/, G: /緑/, B: /青/ },
  };
  for (const locale of LOCALES) {
    const values = [];
    for (const [suffix, marker] of Object.entries(names[locale])) {
      const label = currentText(entries, `nodeAttrEnum:distortionFilter.sampleMode.${{ R: 3, G: 4, B: 5 }[suffix]}`, locale);
      assert.match(label, marker, `${locale} ${suffix} sample channel mapping`);
      values.push(label);
      assert.match(currentText(entries, `nodeAttr:glowFilter.blur${suffix}`, locale), marker,
        `${locale} ${suffix} glow radius mapping`);
      assert.match(currentText(entries, `nodeAttr:glowFilter.intensity${suffix}`, locale), marker,
        `${locale} ${suffix} glow intensity mapping`);
    }
    assert.equal(new Set(values).size, 3, `${locale} RGB selector labels stay distinct`);
  }
}
function assertXorIsExclusive(entries) {
  const valid = {
    'zh-Hans': /异或|排他.{0,3}或|\bXOR\b/i,
    'zh-Hant': /異或|排他.{0,3}或|\bXOR\b/i,
    ja_JP: /排他的論理和|排他.{0,4}論理和|\bXOR\b/i,
  };
  for (const locale of LOCALES) {
    const text = currentText(entries, 'nodeAttrEnum:glowFilter.blendMode.11', locale);
    assert.match(text, valid[locale], `${locale} Xor means exclusive OR, not AND or inclusive OR`);
  }
}
function assertDstModesDistinct(entries) {
  for (const locale of LOCALES) {
    const over = currentText(entries, 'nodeAttrEnum:glowFilter.blendMode.4', locale);
    const atop = currentText(entries, 'nodeAttrEnum:glowFilter.blendMode.10', locale);
    assert.notEqual(over, atop, `${locale} Dst Over and Dst Atop are distinct selector values`);
  }
}
function assertJapanesePorterDuffTerms(entries) {
  assert.equal(Object.keys(JAPANESE_PORTER_DUFF).length, 6, 'the source scope contains six Src/Dst Porter-Duff operator labels');
  for (const [index, terms] of Object.entries(JAPANESE_PORTER_DUFF)) {
    const key = `nodeAttrEnum:glowFilter.blendMode.${index}`;
    const entry = findEntry(entries, key);
    assert.equal(entry.source, terms.source, `${key} source label maps to its Porter-Duff operation`);
    const text = currentText(entries, key, 'ja_JP');
    assert.match(text, terms.operand, `${key} uses the full Japanese operand name`);
    assert.match(text, terms.operator, `${key} preserves the Japanese Porter-Duff operation`);
  }
}
function assertAlphaBlendMatchesShape(entries) {
  const shapeEntries = require(path.join(REPO_ROOT, 'languages/native/nodes_shape.js')).entries;
  for (const index of ALPHA_BLEND_INDICES) {
    const key = `nodeAttrEnum:distortionFilter.blendMode.${index}`;
    const shapeKey = `nodeAttrEnum:shape.blendMode.${index}`;
    const distortion = findEntry(entries, key);
    const shape = findEntry(shapeEntries, shapeKey);
    assert.equal(distortion.source, shape.source, `${index} Alpha blend operation has the same English source label`);
    for (const locale of LOCALES) {
      assert.equal(currentText(entries, key, locale), currentText(shapeEntries, shapeKey, locale),
        `${index}/${locale} Alpha blend label matches the already-approved Shape selector`);
    }
  }
}
function assertJapaneseGammaCorrection(entries) {
  const gamma = currentText(entries, 'nodeAttrEnum:distortionFilter.sampleMode.0', 'ja_JP');
  assert.match(gamma, /ガンマ.{0,2}補正/, 'Gamma Corrected uses Japanese image-processing 補正');
  assert.doesNotMatch(gamma, /校正/, 'calibration 校正 is not gamma correction');
}
function assertSharedBlendLabels(entries) {
  for (const index of SHARED_BLEND_INDICES) {
    const distortionKey = `nodeAttrEnum:distortionFilter.blendMode.${index}`;
    const glowKey = `nodeAttrEnum:glowFilter.blendMode.${index}`;
    const distortion = findEntry(entries, distortionKey);
    const glow = findEntry(entries, glowKey);
    assert.equal(distortion.displayRole, 'enum-label');
    assert.equal(glow.displayRole, 'enum-label');
    assert.equal(distortion.source, glow.source, `${index} shared source selector identity`);
    for (const locale of LOCALES) assert.equal(currentText(entries, distortionKey, locale), currentText(entries, glowKey, locale),
      `${index}/${locale} shared blend-mode label remains consistent`);
  }
}
function assertProjectionPreservesModel(entries) {
  const values = new Map(OWNER_NAMES.map(owner => [owner, { nodeType: owner, modelIdentity: `identity:${owner}` }]));
  for (const row of entries) {
    let cursor = values.get(row.owner);
    assert.ok(cursor, `fixture owner ${row.owner}`);
    for (const part of row.fieldPath.slice(0, -1)) cursor = cursor[part] ??= {};
    const leaf = row.fieldPath.at(-1);
    assert.equal(Object.hasOwn(cursor, leaf), false, `${row.key} fieldPath is unique`);
    cursor[leaf] = { 'UI-text': row.source, notes: row.notes };
  }
  const sourceCatalog = [...values.values()].map(value => ({ type: 'nodeStrings', value }));
  const before = structuredClone(sourceCatalog);
  const catalog = collectNativeCatalog('align-distortion-glow-fixture', sourceCatalog, []);
  assert.equal(catalog.entries.length, 100);
  assert.equal(catalog.unmapped.length, 0);
  for (const locale of LOCALES) {
    const reviews = entries.map(row => ({ key: row.key, source: row.source, ...row.translations[locale] }));
    const resolved = resolveTranslations(catalog.entries, locale, reviews);
    const pack = JSON.parse(renderNativePack(resolved));
    assert.equal(pack.length, 1);
    assert.equal(pack[0].value && Object.keys(pack[0].value).length, 100);
    for (const row of entries) assert.deepEqual(pack[0].value[row.key], { 'UI-text': row.translations[locale].text });
    assert.deepEqual(sourceCatalog, before, `${locale} display projection cannot mutate source/model data`);
    for (const value of sourceCatalog.map(record => record.value)) {
      assert.equal(value.modelIdentity, `identity:${value.nodeType}`);
    }
  }
}
function swapTokens(text, leftPattern, rightPattern) {
  const left = text.match(leftPattern)?.[0];
  const right = text.match(rightPattern)?.[0];
  assert.ok(left && right && left !== right, 'reverse mutation requires distinct present semantic tokens');
  return text.replace(left, '\u0000').replace(right, left).replace('\u0000', right);
}
function replaceText(entries, key, locale, text) {
  findEntry(entries, key).translations[locale].text = text;
}

// -- 源身份用官方摘要锁定；语义修订另锁实际审定文字及旧稿回退 --------
test('formal approved module and explicit registry registration exist; otherwise this is real RED', () => {
  assertFormalModuleRegistered();
});
test('the complete 100-key official source, owner identities, notes and source echoes are locked', () => {
  const data = loadSelectedInput();
  assertSourceContract(data);
  if (data.__formal || data.__rootReviewedSourceBound) {
    assert.equal(formalApprovalState(data), FORMAL_APPROVAL);
    assert.equal(data.entries.every(row => !Object.hasOwn(row, 'oldCandidates')), true);
  } else {
    assert.equal(data.approvalState, SOURCE_ONLY_APPROVAL, 'stage source stays explicitly unapproved');
  }
});
test('stage source and locale evidence retain their actual approval boundary', () => {
  const data = loadSelectedInput();
  if (data.__formal) {
    assert.equal(formalApprovalState(data), FORMAL_APPROVAL);
  } else if (data.__rootReviewedSourceBound) {
    assert.equal(formalApprovalState(data), FORMAL_APPROVAL, 'root-reviewed source-bound evidence is not downgraded to a raw draft');
    assert.equal(data.__formal, false, 'selected stage evidence is distinct from loading the registered formal module');
  } else if (data.__stageSourceOnly) {
    assert.equal(data.approvalState, SOURCE_ONLY_APPROVAL);
    assert.equal(data.entries.every(row => row.translations == null), true, 'source-only evidence carries no translation decisions');
  } else {
    assert.equal(data.approvalState, SOURCE_ONLY_APPROVAL);
    assert.equal(data.__unapprovedDraft, true, 'stage translation draft is diagnostic only');
    assert.equal(data.__candidateEnvelope.sourcePairsSha256, FULL_SOURCE_PAIRS_SHA256);
  }
});
test('the 300 translation slots preserve only X/Y and format-check every locale value', { skip: SOURCE_ONLY_SKIP }, () => {
  assertTranslationContract(loadSelectedInput().entries);
});
test('align X and Y sign mappings preserve the official horizontal and vertical direction', { skip: SOURCE_ONLY_SKIP }, () => {
  assertAlignSigns(loadSelectedInput().entries);
});
test('glow radius, per-channel radius, intensity and channel controls remain distinct', { skip: SOURCE_ONLY_SKIP }, () => {
  assertRadiusIntensity(loadSelectedInput().entries);
});
test('distortion preview visibility remains separate from preview-overlay opacity', { skip: SOURCE_ONLY_SKIP }, () => {
  assertPreviewVisibilityOpacity(loadSelectedInput().entries);
});
test('Distortion Value retains its HSV V brightness-channel meaning', { skip: SOURCE_ONLY_SKIP }, () => {
  assertHsvValue(loadSelectedInput().entries);
});
test('RGB sample and glow controls preserve red, green and blue channel identity', { skip: SOURCE_ONLY_SKIP }, () => {
  assertRgbChannelIdentity(loadSelectedInput().entries);
});
test('Xor remains exclusive OR rather than logical AND or inclusive OR', { skip: SOURCE_ONLY_SKIP }, () => {
  assertXorIsExclusive(loadSelectedInput().entries);
});
test('Dst Over and Dst Atop remain separate blend-mode selector entries', { skip: SOURCE_ONLY_SKIP }, () => {
  assertDstModesDistinct(loadSelectedInput().entries);
});
test('Japanese Src/Dst Porter-Duff labels preserve full operands and all six operator identities', { skip: SOURCE_ONLY_SKIP }, () => {
  assertJapanesePorterDuffTerms(loadSelectedInput().entries);
});
test('Alpha Add and Alpha Add Under match the existing approved Shape selector labels in all locales', { skip: SOURCE_ONLY_SKIP }, () => {
  assertAlphaBlendMatchesShape(loadSelectedInput().entries);
});
test('Japanese Gamma Corrected uses correction 補正 rather than calibration 校正', { skip: SOURCE_ONLY_SKIP }, () => {
  assertJapaneseGammaCorrection(loadSelectedInput().entries);
});
test('all 18 shared distortion/glow blend keys retain the same source and locale selector labels', { skip: SOURCE_ONLY_SKIP }, () => {
  assert.equal(SHARED_BLEND_INDICES.length, 18);
  assertSharedBlendLabels(loadSelectedInput().entries);
});
test('native display projection changes only UI-text and leaves model identity untouched', { skip: SOURCE_ONLY_SKIP }, () => {
  assertProjectionPreservesModel(loadSelectedInput().entries);
});
test('actual reverse mutations are rejected by focused semantic guards', { skip: MUTATION_SKIP }, () => {
  const base = loadSelectedInput().entries;
  const cases = [];
  for (const locale of LOCALES) {
    for (const axis of ['x', 'y']) {
      const directions = axis === 'x'
        ? { negative: /左/, positive: /右/ }
        : locale === 'ja_JP'
          ? { negative: /下部|下/, positive: /上部|上/ }
          : { negative: /底部|底|下部/, positive: /顶部|頂部|上部|頂|顶/ };
      cases.push([`${locale} ${axis} direction sign reversal`, assertAlignSigns, entries => {
        const row = findEntry(entries, `attrInfo:align.${axis}`);
        row.translations[locale].text = swapTokens(row.translations[locale].text, directions.negative, directions.positive);
      }]);
    }
    cases.push([`${locale} radius/intensity collapse`, assertRadiusIntensity, entries => {
      const radius = currentText(entries, 'nodeAttr:glowFilter.blur', locale);
      const intensity = currentText(entries, 'nodeAttr:glowFilter.intensity', locale);
      replaceText(entries, 'nodeAttr:glowFilter.blur', locale, intensity);
      replaceText(entries, 'nodeAttr:glowFilter.intensity', locale, radius);
    }]);
    cases.push([`${locale} preview visibility/opacity collapse`, assertPreviewVisibilityOpacity, entries => {
      const visibility = currentText(entries, 'nodeAttr:distortionFilter.showPreview', locale);
      const opacity = currentText(entries, 'nodeAttr:distortionFilter.shaderOpacity', locale);
      replaceText(entries, 'nodeAttr:distortionFilter.showPreview', locale, opacity);
      replaceText(entries, 'nodeAttr:distortionFilter.shaderOpacity', locale, visibility);
    }]);
    cases.push([`${locale} generic Value loses HSV V`, assertHsvValue, entries => {
      replaceText(entries, 'nodeAttrEnum:distortionFilter.sampleMode.2', locale, 'Value');
    }]);
    cases.push([`${locale} red/blue selector swap`, assertRgbChannelIdentity, entries => {
      const redKey = 'nodeAttrEnum:distortionFilter.sampleMode.3';
      const blueKey = 'nodeAttrEnum:distortionFilter.sampleMode.5';
      const red = currentText(entries, redKey, locale);
      const blue = currentText(entries, blueKey, locale);
      replaceText(entries, redKey, locale, blue);
      replaceText(entries, blueKey, locale, red);
    }]);
    cases.push([`${locale} Xor changed to AND`, assertXorIsExclusive, entries => {
      replaceText(entries, 'nodeAttrEnum:glowFilter.blendMode.11', locale,
        locale === 'ja_JP' ? '論理積' : locale === 'zh-Hant' ? '邏輯與' : '逻辑与');
    }]);
    cases.push([`${locale} Dst Atop collapsed into Dst Over`, assertDstModesDistinct, entries => {
      replaceText(entries, 'nodeAttrEnum:glowFilter.blendMode.10', locale,
        currentText(entries, 'nodeAttrEnum:glowFilter.blendMode.4', locale));
    }]);
  }
  for (const [index, terms] of Object.entries(JAPANESE_PORTER_DUFF)) {
    cases.push([`ja_JP ${terms.source} operand swapped`, assertJapanesePorterDuffTerms, entries => {
      const key = `nodeAttrEnum:glowFilter.blendMode.${index}`;
      replaceText(entries, key, 'ja_JP', currentText(entries, key, 'ja_JP').replace(terms.operand, terms.replaceOperand));
    }]);
    cases.push([`ja_JP ${terms.source} operator swapped`, assertJapanesePorterDuffTerms, entries => {
      const key = `nodeAttrEnum:glowFilter.blendMode.${index}`;
      replaceText(entries, key, 'ja_JP', currentText(entries, key, 'ja_JP').replace(terms.operator, terms.replaceOperator));
    }]);
  }
  cases.push(['Alpha Add Under drifted from the approved Shape label', assertAlphaBlendMatchesShape, entries => {
    replaceText(entries, 'nodeAttrEnum:distortionFilter.blendMode.31', 'ja_JP',
      `${currentText(entries, 'nodeAttrEnum:distortionFilter.blendMode.31', 'ja_JP')}違い`);
  }]);
  cases.push(['Japanese Gamma calibration mutant', assertJapaneseGammaCorrection, entries => {
    replaceText(entries, 'nodeAttrEnum:distortionFilter.sampleMode.0', 'ja_JP', 'ガンマ校正');
  }]);
  cases.push(['one shared blend selector label drift', assertSharedBlendLabels, entries => {
    replaceText(entries, 'nodeAttrEnum:glowFilter.blendMode.12', 'ja_JP', '__selector-drift__');
  }]);
  for (const [label, guard, mutate] of cases) {
    guard(base);
    const mutant = structuredClone(base);
    mutate(mutant);
    assert.notDeepEqual(mutant, base, `${label} mutation changes the selected semantic value`);
    assert.throws(() => guard(mutant), assert.AssertionError, `${label} must be rejected`);
  }
});

// -- 主代理审定的22个实际变化，不把空变异伪称回归保护 ----------------
const REVIEWED_TEXT_REVISIONS = Object.freeze([
  {"key":"nodeAttrEnum:distortionFilter.sampleMode.2","locale":"zh-Hans","text":"明度","originalDraft":"值"},
  {"key":"nodeAttrEnum:distortionFilter.sampleMode.2","locale":"zh-Hant","text":"明度","originalDraft":"值"},
  {"key":"nodeAttrEnum:distortionFilter.sampleMode.2","locale":"ja_JP","text":"明度","originalDraft":"値"},
  {"key":"nodeAttr:distortionFilter.autoPad","locale":"zh-Hans","text":"自动边距","originalDraft":"自动内边距"},
  {"key":"nodeAttr:distortionFilter.autoPad","locale":"zh-Hant","text":"自動邊距","originalDraft":"自動內邊距"},
  {"key":"nodeAttr:distortionFilter.padding","locale":"zh-Hans","text":"边距","originalDraft":"内边距"},
  {"key":"nodeAttr:distortionFilter.padding","locale":"zh-Hant","text":"邊距","originalDraft":"內邊距"},
  {"key":"nodeAttrEnum:distortionFilter.sampleMode.0","locale":"ja_JP","text":"輝度（ガンマ補正）","originalDraft":"輝度（ガンマ校正）"},
  {"key":"nodeAttrEnum:distortionFilter.blendMode.30","locale":"zh-Hans","text":"Alpha 相加","originalDraft":"Alpha 叠加"},
  {"key":"nodeAttrEnum:distortionFilter.blendMode.30","locale":"zh-Hant","text":"Alpha 相加","originalDraft":"Alpha 疊加"},
  {"key":"nodeAttrEnum:distortionFilter.blendMode.31","locale":"zh-Hans","text":"Alpha 下层相加","originalDraft":"Alpha 下层叠加"},
  {"key":"nodeAttrEnum:distortionFilter.blendMode.31","locale":"zh-Hant","text":"Alpha 下層相加","originalDraft":"Alpha 下層疊加"},
  {"key":"nodeAttrEnum:distortionFilter.blendMode.31","locale":"ja_JP","text":"Alpha 下層加算","originalDraft":"Alpha 下加算"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.11","locale":"ja_JP","text":"排他的論理和","originalDraft":"排他的論理と"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.13","locale":"zh-Hant","text":"調制","originalDraft":"調製"},
  {"key":"nodeInfo:glowFilter","locale":"zh-Hant","text":"為形狀新增輝光效果，並可個別控制 RGB 通道。","originalDraft":"為形狀新增發光效果，並可個別控制 RGB 通道。"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.10","locale":"ja_JP","text":"デスティネーションアトップ","originalDraft":"デスト上"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.4","locale":"ja_JP","text":"デスティネーションオーバー","originalDraft":"デスト上"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.5","locale":"ja_JP","text":"ソースイン","originalDraft":"ソース内"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.6","locale":"ja_JP","text":"デスティネーションイン","originalDraft":"デスト内"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.8","locale":"ja_JP","text":"デスティネーションアウト","originalDraft":"デスト外"},
  {"key":"nodeAttrEnum:glowFilter.blendMode.9","locale":"ja_JP","text":"ソースアトップ","originalDraft":"ソース上"},
]);
function assertReviewedTextRevisions(entries) {
  for (const { key, locale, text } of REVIEWED_TEXT_REVISIONS) {
    assert.equal(currentText(entries, key, locale), text, `${key}/${locale} keeps the adjudicated source-specific term`);
  }
}
test('all 22 actual root revisions stay exact and each original-draft reversion is rejected', { skip: SOURCE_ONLY_SKIP }, () => {
  const base = loadSelectedInput().entries;
  assert.equal(REVIEWED_TEXT_REVISIONS.length, 22);
  assertReviewedTextRevisions(base);
  for (const { key, locale, text, originalDraft } of REVIEWED_TEXT_REVISIONS) {
    assert.notEqual(originalDraft, text, `${key}/${locale} really changed from the AGY draft`);
    const mutant = structuredClone(base);
    replaceText(mutant, key, locale, originalDraft);
    assert.notDeepEqual(mutant, base, `${key}/${locale} original-draft reversion changes the selected text`);
    assert.throws(() => assertReviewedTextRevisions(mutant), assert.AssertionError, `${key}/${locale} original-draft regression must fail`);
  }
});
