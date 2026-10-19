#!/usr/bin/env node
/**
 * [INPUT]: 依赖原生 Slit Scan source-bound module、native_language_pack 与 native_translation_format
 * [OUTPUT]: 锁定48键/144译值、owner/source/notes/角色摘要、混合模式引用、扫描标签语义及显示身份边界
 * [POS]: tools 的 Slit Scan 默认离线审定合同；stage JSON仅供红绿验收，不代替实机显示证明
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { collectNativeCatalog, resolveTranslations, renderNativePack } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');

const LOCALES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const OWNER = 'slitScanFilter';
const OFFICIAL_MODULE = path.join(__dirname, '../languages/native/nodes_slit_scan.js');
const STAGE_INPUT = process.env.CAVALRY_SLIT_SCAN_TEST_STAGE_INPUT;
const INPUT_PATH = STAGE_INPUT ? path.resolve(STAGE_INPUT) : OFFICIAL_MODULE;
const INPUT_EXISTS = fs.existsSync(INPUT_PATH);
const SKIP_CONTRACT = INPUT_EXISTS ? false : 'RED: official module is absent; stage-contract tests wait for a supplied stage input';
const EXPECTED_SOURCE_PAIRS_SHA256 = '43bbc2290cb1d557b55f12fbef1914548a5f4fea10f815c3063d5e69b8e539f6';
const EXPECTED_IDENTITY_NOTES_SHA256 = 'dcb5ba2a609096c75cc616d98532f45b5c67e8cd7ca389586ed9c8a91e822ec8';
const EXPECTED_SOURCE_SHA256 = 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0';
const EXPECTED_VENDOR_JA_SHA256 = '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439';
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const translations = (zhHans, zhHant, jaJp) => ({ 'zh-Hans': zhHans, 'zh-Hant': zhHant, ja_JP: jaJp });

// -- 官方源标签；下方摘要同时绑定说明与身份元数据。
const EXPECTED_SOURCES = Object.freeze({
  "nodeAttr:slitScanFilter.blendMode": "Blend Mode",
  "nodeAttr:slitScanFilter.glow": "Glow Size",
  "nodeAttr:slitScanFilter.glowBlendMode": "Glow Blend Mode",
  "nodeAttr:slitScanFilter.glowColor": "Glow Color",
  "nodeAttr:slitScanFilter.mirrorScan": "Mirror Scan",
  "nodeAttr:slitScanFilter.offset": "Offset",
  "nodeAttr:slitScanFilter.opacity": "Opacity",
  "nodeAttr:slitScanFilter.perspective": "Perspective",
  "nodeAttr:slitScanFilter.rotation": "Rotation",
  "nodeAttr:slitScanFilter.speed": "Frame Speed",
  "nodeAttr:slitScanFilter.time": "Time",
  "nodeAttrEnum:slitScanFilter.blendMode.1": "Replace",
  "nodeAttrEnum:slitScanFilter.blendMode.12": "Plus",
  "nodeAttrEnum:slitScanFilter.blendMode.14": "Screen",
  "nodeAttrEnum:slitScanFilter.blendMode.15": "Overlay",
  "nodeAttrEnum:slitScanFilter.blendMode.16": "Darken",
  "nodeAttrEnum:slitScanFilter.blendMode.17": "Lighten",
  "nodeAttrEnum:slitScanFilter.blendMode.18": "Color Dodge",
  "nodeAttrEnum:slitScanFilter.blendMode.19": "Color Burn",
  "nodeAttrEnum:slitScanFilter.blendMode.20": "Hard Light",
  "nodeAttrEnum:slitScanFilter.blendMode.21": "Soft Light",
  "nodeAttrEnum:slitScanFilter.blendMode.22": "Difference",
  "nodeAttrEnum:slitScanFilter.blendMode.23": "Exclusion",
  "nodeAttrEnum:slitScanFilter.blendMode.24": "Multiply",
  "nodeAttrEnum:slitScanFilter.blendMode.25": "Hue",
  "nodeAttrEnum:slitScanFilter.blendMode.26": "Saturation",
  "nodeAttrEnum:slitScanFilter.blendMode.27": "Color",
  "nodeAttrEnum:slitScanFilter.blendMode.28": "Luminosity",
  "nodeAttrEnum:slitScanFilter.blendMode.3": "Normal",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.12": "Plus",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.14": "Screen",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.15": "Overlay",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.16": "Darken",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.17": "Lighten",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.18": "Color Dodge",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.19": "Color Burn",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.20": "Hard Light",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.21": "Soft Light",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.22": "Difference",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.23": "Exclusion",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.24": "Multiply",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.25": "Hue",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.26": "Saturation",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.27": "Color",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.28": "Luminosity",
  "nodeAttrEnum:slitScanFilter.glowBlendMode.3": "Normal",
  "nodeInfo:slitScanFilter": "Create an animated fly-through effect.",
  "nodeName:slitScanFilter": "Slit Scan"
});

// -- Root 已审定的 UI 文案；不采用 Grok 提出的待审措辞。
const EXPECTED_TEXT = Object.freeze({
  "nodeAttr:slitScanFilter.blendMode": translations("混合模式", "混合模式", "描画モード"),
  "nodeAttr:slitScanFilter.glow": translations("辉光大小", "輝光大小", "グローサイズ"),
  "nodeAttr:slitScanFilter.glowBlendMode": translations("辉光混合模式", "輝光混合模式", "グロー描画モード"),
  "nodeAttr:slitScanFilter.glowColor": translations("辉光颜色", "輝光顏色", "グローカラー"),
  "nodeAttr:slitScanFilter.mirrorScan": translations("镜像扫描", "鏡像掃描", "ミラースキャン"),
  "nodeAttr:slitScanFilter.offset": translations("偏移", "偏移", "オフセット"),
  "nodeAttr:slitScanFilter.opacity": translations("不透明度", "不透明度", "不透明度"),
  "nodeAttr:slitScanFilter.perspective": translations("透视", "透視", "パースペクティブ"),
  "nodeAttr:slitScanFilter.rotation": translations("旋转", "旋轉", "回転"),
  "nodeAttr:slitScanFilter.speed": translations("帧速度", "幀速度", "フレーム速度"),
  "nodeAttr:slitScanFilter.time": translations("时间", "時間", "時間"),
  "nodeAttrEnum:slitScanFilter.blendMode.1": translations("替换", "替換", "置換"),
  "nodeAttrEnum:slitScanFilter.blendMode.12": translations("相加", "相加", "加算"),
  "nodeAttrEnum:slitScanFilter.blendMode.14": translations("滤色", "濾色", "スクリーン"),
  "nodeAttrEnum:slitScanFilter.blendMode.15": translations("叠加", "疊加", "オーバーレイ"),
  "nodeAttrEnum:slitScanFilter.blendMode.16": translations("变暗", "變暗", "比較（暗）"),
  "nodeAttrEnum:slitScanFilter.blendMode.17": translations("变亮", "變亮", "比較（明）"),
  "nodeAttrEnum:slitScanFilter.blendMode.18": translations("颜色减淡", "顏色減淡", "覆い焼きカラー"),
  "nodeAttrEnum:slitScanFilter.blendMode.19": translations("颜色加深", "顏色加深", "焼き込みカラー"),
  "nodeAttrEnum:slitScanFilter.blendMode.20": translations("强光", "強光", "ハードライト"),
  "nodeAttrEnum:slitScanFilter.blendMode.21": translations("柔光", "柔光", "ソフトライト"),
  "nodeAttrEnum:slitScanFilter.blendMode.22": translations("差值", "差值", "差の絶対値"),
  "nodeAttrEnum:slitScanFilter.blendMode.23": translations("排除", "排除", "除外"),
  "nodeAttrEnum:slitScanFilter.blendMode.24": translations("正片叠底", "正片疊底", "乗算"),
  "nodeAttrEnum:slitScanFilter.blendMode.25": translations("色相", "色相", "色相"),
  "nodeAttrEnum:slitScanFilter.blendMode.26": translations("饱和度", "飽和度", "彩度"),
  "nodeAttrEnum:slitScanFilter.blendMode.27": translations("颜色", "顏色", "カラー"),
  "nodeAttrEnum:slitScanFilter.blendMode.28": translations("明度", "明度", "輝度"),
  "nodeAttrEnum:slitScanFilter.blendMode.3": translations("正常", "正常", "通常"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.12": translations("相加", "相加", "加算"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.14": translations("滤色", "濾色", "スクリーン"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.15": translations("叠加", "疊加", "オーバーレイ"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.16": translations("变暗", "變暗", "比較（暗）"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.17": translations("变亮", "變亮", "比較（明）"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.18": translations("颜色减淡", "顏色減淡", "覆い焼きカラー"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.19": translations("颜色加深", "顏色加深", "焼き込みカラー"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.20": translations("强光", "強光", "ハードライト"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.21": translations("柔光", "柔光", "ソフトライト"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.22": translations("差值", "差值", "差の絶対値"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.23": translations("排除", "排除", "除外"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.24": translations("正片叠底", "正片疊底", "乗算"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.25": translations("色相", "色相", "色相"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.26": translations("饱和度", "飽和度", "彩度"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.27": translations("颜色", "顏色", "カラー"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.28": translations("明度", "明度", "輝度"),
  "nodeAttrEnum:slitScanFilter.glowBlendMode.3": translations("正常", "正常", "通常"),
  "nodeInfo:slitScanFilter": translations("创建动画穿越效果。", "建立動態穿越效果。", "アニメーション付きフライスルーエフェクトを作成。"),
  "nodeName:slitScanFilter": translations("狭缝扫描", "狹縫掃描", "スリットスキャン")
});

const EXPECTED_ROLE_KEYS = Object.freeze({
  "attribute-label": ["nodeAttr:slitScanFilter.blendMode", "nodeAttr:slitScanFilter.glow", "nodeAttr:slitScanFilter.glowBlendMode", "nodeAttr:slitScanFilter.glowColor", "nodeAttr:slitScanFilter.mirrorScan", "nodeAttr:slitScanFilter.offset", "nodeAttr:slitScanFilter.opacity", "nodeAttr:slitScanFilter.perspective", "nodeAttr:slitScanFilter.rotation", "nodeAttr:slitScanFilter.speed", "nodeAttr:slitScanFilter.time"],
  "enum-label": ["nodeAttrEnum:slitScanFilter.blendMode.1", "nodeAttrEnum:slitScanFilter.blendMode.12", "nodeAttrEnum:slitScanFilter.blendMode.14", "nodeAttrEnum:slitScanFilter.blendMode.15", "nodeAttrEnum:slitScanFilter.blendMode.16", "nodeAttrEnum:slitScanFilter.blendMode.17", "nodeAttrEnum:slitScanFilter.blendMode.18", "nodeAttrEnum:slitScanFilter.blendMode.19", "nodeAttrEnum:slitScanFilter.blendMode.20", "nodeAttrEnum:slitScanFilter.blendMode.21", "nodeAttrEnum:slitScanFilter.blendMode.22", "nodeAttrEnum:slitScanFilter.blendMode.23", "nodeAttrEnum:slitScanFilter.blendMode.24", "nodeAttrEnum:slitScanFilter.blendMode.25", "nodeAttrEnum:slitScanFilter.blendMode.26", "nodeAttrEnum:slitScanFilter.blendMode.27", "nodeAttrEnum:slitScanFilter.blendMode.28", "nodeAttrEnum:slitScanFilter.blendMode.3", "nodeAttrEnum:slitScanFilter.glowBlendMode.12", "nodeAttrEnum:slitScanFilter.glowBlendMode.14", "nodeAttrEnum:slitScanFilter.glowBlendMode.15", "nodeAttrEnum:slitScanFilter.glowBlendMode.16", "nodeAttrEnum:slitScanFilter.glowBlendMode.17", "nodeAttrEnum:slitScanFilter.glowBlendMode.18", "nodeAttrEnum:slitScanFilter.glowBlendMode.19", "nodeAttrEnum:slitScanFilter.glowBlendMode.20", "nodeAttrEnum:slitScanFilter.glowBlendMode.21", "nodeAttrEnum:slitScanFilter.glowBlendMode.22", "nodeAttrEnum:slitScanFilter.glowBlendMode.23", "nodeAttrEnum:slitScanFilter.glowBlendMode.24", "nodeAttrEnum:slitScanFilter.glowBlendMode.25", "nodeAttrEnum:slitScanFilter.glowBlendMode.26", "nodeAttrEnum:slitScanFilter.glowBlendMode.27", "nodeAttrEnum:slitScanFilter.glowBlendMode.28", "nodeAttrEnum:slitScanFilter.glowBlendMode.3"],
  "node-info": ["nodeInfo:slitScanFilter"],
  "node-name": ["nodeName:slitScanFilter"]
});
const EXPECTED_KEYS = Object.keys(EXPECTED_SOURCES).sort();
const CONTRACT_ENABLED = INPUT_EXISTS;

function slitScan() {
  assert.ok(INPUT_EXISTS, STAGE_INPUT
    ? `RED: Slit Scan stage input is missing at ${INPUT_PATH}`
    : `RED: approved Slit Scan module is not present at ${OFFICIAL_MODULE}`);
  if (STAGE_INPUT) return JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  return require(OFFICIAL_MODULE);
}

function findEntry(entries, key) {
  const entry = entries.find(row => row.key === key);
  assert.ok(entry, `missing source-bound key ${key}`);
  return entry;
}

function readText(entries, key, locale) {
  const value = findEntry(entries, key).translations?.[locale]?.text;
  assert.equal(typeof value, 'string', `${key}/${locale} text is missing`);
  return value;
}

function assertSourceContract({ entries, provenance }) {
  const keys = entries.map(row => row.key);
  assert.equal(entries.length, 48);
  assert.equal(new Set(keys).size, 48);
  assert.deepEqual(keys, EXPECTED_KEYS);
  assert.equal(provenance.cavalryVersion, '2.8.0');
  assert.equal(provenance.catalogPath, 'Definitions/Translation/nodeStrings_en-GB.source.json');
  assert.equal(provenance.sourceSha256, EXPECTED_SOURCE_SHA256);
  assert.equal(provenance.vendorJapanesePath, 'Definitions/Translation/nodeStrings_ja-JP.translation.json');
  assert.equal(provenance.vendorJapaneseSha256, EXPECTED_VENDOR_JA_SHA256);
  assert.equal(provenance.sourcePairsSha256, EXPECTED_SOURCE_PAIRS_SHA256);
  assert.equal(provenance.sourceIdentityAndNotesSha256, EXPECTED_IDENTITY_NOTES_SHA256);
  assert.equal(digest(entries.map(row => [row.key, row.source])), EXPECTED_SOURCE_PAIRS_SHA256);
  assert.equal(digest(entries.map(row => [row.key, row.owner, row.fieldPath, row.source, row.notes,
    row.displayRole, row.dontTranslate, row.vendorJapanese])), EXPECTED_IDENTITY_NOTES_SHA256);
  for (const row of entries) {
    assert.equal(row.owner, OWNER, `${row.key} owner`);
    assert.equal(row.catalogId, 'Definitions/Translation/nodeStrings', `${row.key} catalog`);
    assert.equal(row.dontTranslate, false, `${row.key} DNT`);
    assert.equal(row.source, EXPECTED_SOURCES[row.key], `${row.key} source`);
    assert.ok(Array.isArray(row.fieldPath), `${row.key} fieldPath`);
    assert.ok(Array.isArray(row.notes), `${row.key} notes`);
    assert.equal(row.vendorJapanese, row.source, `${row.key} vendor Japanese is an English echo, not a translation`);
  }
  for (const [role, expectedKeys] of Object.entries(EXPECTED_ROLE_KEYS)) {
    const actual = entries.filter(row => row.displayRole === role).map(row => row.key);
    assert.deepEqual(actual, expectedKeys, `${role} role/key binding`);
  }
  assert.deepEqual([...new Set(entries.map(row => row.displayRole))].sort(), Object.keys(EXPECTED_ROLE_KEYS).sort());
}

function assertLocaleText(locale, getText) {
  for (const [key, localized] of Object.entries(EXPECTED_TEXT)) {
    assert.equal(getText(key), localized[locale], `${key}/${locale} differs from the root-adjudicated copy`);
  }
}

function textMismatches(entries) {
  const mismatches = [];
  for (const [key, localized] of Object.entries(EXPECTED_TEXT)) for (const locale of LOCALES) {
    const actual = findEntry(entries, key).translations?.[locale]?.text;
    if (actual !== localized[locale]) mismatches.push({ key, locale, actual, expected: localized[locale] });
  }
  return mismatches;
}

const MUTANTS_ENABLED = INPUT_EXISTS && (() => {
  try {
    return textMismatches(slitScan().entries).length === 0;
  } catch {
    return false;
  }
})();
const SKIP_MUTANTS = MUTANTS_ENABLED ? false : 'reverse mutants require the root-adjudicated baseline';

function assertAllDecisions(entries) {
  let decisionCount = 0;
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry.translations || {}).sort(), [...LOCALES].sort(), `${entry.key} locale set`);
    for (const locale of LOCALES) {
      const decision = entry.translations?.[locale];
      assert.ok(decision, `${entry.key}/${locale} decision missing`);
      assert.equal(decision.decision, 'translate', `${entry.key}/${locale} explicit decision`);
      assert.equal(typeof decision.text, 'string');
      assert.ok(decision.text.trim(), `${entry.key}/${locale} text empty`);
      assertNativeTranslationFormat(entry.source, decision.text);
      decisionCount += 1;
    }
  }
  assert.equal(decisionCount, 144);
}

test('Slit Scan reads the selected input and gates formal approval on the fixed module', () => {
  assert.ok(INPUT_EXISTS, STAGE_INPUT
    ? `RED: requested stage input is missing at ${INPUT_PATH}`
    : `RED: approved slitScanFilter module is not present at ${OFFICIAL_MODULE}`);
  const selected = slitScan();
  assert.ok(Array.isArray(selected.entries), 'selected input must contain source-bound entries');
  if (STAGE_INPUT) {
    assert.equal(path.resolve(INPUT_PATH), path.resolve(STAGE_INPUT));
    return;
  }
  assert.equal(selected.provenance.approvalState, 'approved-source-bound-display-input');
});

test('Slit Scan binds all 48 source keys, notes, owner identities and display roles', { skip: SKIP_CONTRACT }, () => {
  assertSourceContract(slitScan());
});

test('Slit Scan has 144 explicit locale decisions and preserves source format contracts', { skip: SKIP_CONTRACT }, () => {
  const { entries } = slitScan();
  assertAllDecisions(entries);
  const decisionCount = entries.reduce((count, entry) => count + Object.keys(entry.translations).length, 0);
  assert.equal(decisionCount, 144);
});

test('Slit Scan ships the complete root-adjudicated 48-key display table', { skip: SKIP_CONTRACT }, () => {
  const { entries } = slitScan();
  const mismatches = textMismatches(entries);
  assert.deepEqual(mismatches, [], `root-adjudicated text differs in ${mismatches.length} slots`);
});

test('Blend Mode labels reuse the same localized root term across base and Glow controls', { skip: SKIP_CONTRACT }, () => {
  const { entries } = slitScan();
  const baseLabel = findEntry(entries, 'nodeAttr:slitScanFilter.blendMode');
  const glowLabel = findEntry(entries, 'nodeAttr:slitScanFilter.glowBlendMode');
  for (const locale of LOCALES) {
    const base = baseLabel.translations[locale].text;
    const glow = glowLabel.translations[locale].text;
    assert.ok(glow.endsWith(base), `${locale} Glow Blend Mode must reuse the current Blend Mode term`);
    assert.notEqual(glow, base, `${locale} Glow scope remains explicit`);
  }
});

test('Base and Glow blend enums retain all 17 shared mode identities and matching labels', { skip: SKIP_CONTRACT }, () => {
  const { entries } = slitScan();
  const baseModes = entries.filter(row => row.key.startsWith('nodeAttrEnum:slitScanFilter.blendMode.'));
  const glowModes = entries.filter(row => row.key.startsWith('nodeAttrEnum:slitScanFilter.glowBlendMode.'));
  assert.equal(baseModes.length, 18);
  assert.equal(glowModes.length, 17);
  assert.ok(baseModes.some(row => row.key === 'nodeAttrEnum:slitScanFilter.blendMode.1' && row.source === 'Replace'));
  assert.ok(!glowModes.some(row => row.source === 'Replace'), 'Replace exists only in the base list');
  for (const glow of glowModes) {
    const index = glow.key.slice(glow.key.lastIndexOf('.') + 1);
    const base = findEntry(entries, `nodeAttrEnum:slitScanFilter.blendMode.${index}`);
    assert.equal(glow.source, base.source, `blend enum ${index} source identity`);
    for (const locale of LOCALES) {
      assert.equal(glow.translations[locale].text, base.translations[locale].text,
        `${glow.source}/${locale} base and Glow formula label`);
    }
  }
});

test('Mirror Scan keeps the approved label without claiming whole-image flipping or a cyclic algorithm', { skip: SKIP_CONTRACT }, () => {
  const { entries } = slitScan();
  const text = Object.fromEntries(LOCALES.map(locale => [locale,
    readText(entries, 'nodeAttr:slitScanFilter.mirrorScan', locale)]));
  assert.deepEqual(text, EXPECTED_TEXT['nodeAttr:slitScanFilter.mirrorScan']);
  assert.doesNotMatch(text['zh-Hans'], /(?:整幅|整个|图像|画面).{0,3}(?:翻转|反转|镜像)|(?:翻转|反转).{0,3}(?:图像|画面)/);
  assert.doesNotMatch(text['zh-Hant'], /(?:整幅|整個|圖像|畫面).{0,3}(?:翻轉|反轉|鏡像)|(?:翻轉|反轉).{0,3}(?:圖像|畫面)/);
  assert.doesNotMatch(text.ja_JP, /(?:画像|画面).{0,3}反転|反転.{0,3}(?:画像|画面)/);
  // [守卫] 标签可保留“镜像”含义；不可臆造路径往复或循环次数承诺。
  assert.doesNotMatch(text['zh-Hans'], /(?:往复扫描|循环扫描|循环次数)/);
  assert.doesNotMatch(text['zh-Hant'], /(?:往復掃描|循環掃描|循環次數)/);
  assert.doesNotMatch(text.ja_JP, /(?:往復スキャン|循環スキャン|ループ回数)/);
});

test('Approved Mode, Opacity and Glow Size terminology stays distinct and source-bound', { skip: SKIP_CONTRACT }, () => {
  const { entries } = slitScan();
  for (const locale of LOCALES) {
    assert.equal(readText(entries, 'nodeAttr:slitScanFilter.opacity', locale), EXPECTED_TEXT['nodeAttr:slitScanFilter.opacity'][locale]);
    assert.equal(readText(entries, 'nodeAttr:slitScanFilter.glow', locale), EXPECTED_TEXT['nodeAttr:slitScanFilter.glow'][locale]);
    assert.notEqual(readText(entries, 'nodeAttr:slitScanFilter.blendMode', locale),
      readText(entries, 'nodeAttr:slitScanFilter.glowBlendMode', locale));
  }
  assert.equal(findEntry(entries, 'nodeAttr:slitScanFilter.opacity').source, 'Opacity');
  assert.equal(findEntry(entries, 'nodeAttr:slitScanFilter.glow').source, 'Glow Size');
});

test('Slit Scan rendering projects only approved display leaves and preserves model identity', { skip: SKIP_CONTRACT }, () => {
  const { entries } = slitScan();
  const nodeValue = { nodeType: OWNER, modelIdentity: 'fixture-model-identity', niceName: 'Slit Scan model identity' };
  for (const entry of entries) {
    let target = nodeValue;
    for (const part of entry.fieldPath.slice(0, -1)) target = target[part] ??= {};
    target[entry.fieldPath.at(-1)] = { 'UI-text': entry.source, notes: entry.notes };
  }
  const source = [{ type: 'nodeStrings', value: nodeValue }];
  const before = structuredClone(source);
  const vendorJapanese = [{ type: 'nodeStrings', value: structuredClone(nodeValue) }];
  const vendorBefore = structuredClone(vendorJapanese);
  const catalog = collectNativeCatalog('slit-scan-fixture', source, vendorJapanese);
  assert.equal(catalog.entries.length, 48);
  assert.equal(catalog.unmapped.length, 0);
  for (const locale of LOCALES) {
    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[locale] }));
    const resolution = resolveTranslations(catalog.entries, locale, reviews);
    const pack = JSON.parse(renderNativePack(resolution));
    assert.equal(pack.length, 1);
    assert.equal(pack[0].type, 'strings');
    assert.equal(Object.keys(pack[0].value).length, 48);
    assert.ok(resolution.rows.every(row => row.status === 'reviewed'));
    for (const entry of entries) {
      assert.deepEqual(pack[0].value[entry.key], { 'UI-text': entry.translations[locale].text });
    }
    assert.deepEqual(source, before);
    assert.deepEqual(vendorJapanese, vendorBefore);
    assert.equal(source[0].value.nodeType, OWNER);
    assert.equal(source[0].value.modelIdentity, 'fixture-model-identity');
    assert.equal(source[0].value.niceName, 'Slit Scan model identity');
  }
});

test('Slit Scan rejects real reversed labels, false decisions, note drift and invented rich text', { skip: SKIP_CONTRACT || SKIP_MUTANTS }, () => {
  const original = slitScan();
  const mutations = [
    ['zh-Hans', 'nodeAttr:slitScanFilter.mirrorScan', '往复扫描'],
    ['zh-Hant', 'nodeAttr:slitScanFilter.mirrorScan', '往復掃描'],
    ['zh-Hans', 'nodeAttrEnum:slitScanFilter.blendMode.12', '加'],
    ['ja_JP', 'nodeAttrEnum:slitScanFilter.blendMode.12', 'プラス'],
    ['ja_JP', 'nodeAttrEnum:slitScanFilter.blendMode.16', '暗く'],
    ['ja_JP', 'nodeAttrEnum:slitScanFilter.blendMode.17', '明るく'],
    ['ja_JP', 'nodeAttrEnum:slitScanFilter.glowBlendMode.16', '暗く'],
    ['ja_JP', 'nodeAttrEnum:slitScanFilter.glowBlendMode.17', '明るく'],
  ];
  assert.ok(mutations.length >= 6);
  for (const [locale, key, mutantText] of mutations) {
    const mutated = structuredClone(original.entries);
    const row = findEntry(mutated, key);
    assert.notEqual(row.translations[locale].text, mutantText, `${key}/${locale} mutant is real`);
    row.translations[locale].text = mutantText;
    assert.throws(() => assertLocaleText(locale, candidateKey => readText(mutated, candidateKey, locale)),
      assert.AssertionError, `${key}/${locale} reverse mutant must fail`);
  }
  const falseDecision = structuredClone(original.entries);
  findEntry(falseDecision, 'nodeAttr:slitScanFilter.opacity').translations['zh-Hans'].decision = 'preserve';
  assert.throws(() => assertAllDecisions(falseDecision), assert.AssertionError);
  const noteDrift = structuredClone(original);
  findEntry(noteDrift.entries, 'nodeAttr:slitScanFilter.mirrorScan').notes[0] += ' Extra unsupported algorithm.';
  assert.throws(() => assertSourceContract(noteDrift), assert.AssertionError);
  const info = findEntry(original.entries, 'nodeInfo:slitScanFilter');
  assert.throws(() => assertNativeTranslationFormat(info.source,
    `<b>${info.translations['zh-Hans'].text}</b>`));
  assert.throws(() => assertNativeTranslationFormat(info.source,
    '{count, plural, one {创建动画穿越效果。} other {创建动画穿越效果。}}'));
});
