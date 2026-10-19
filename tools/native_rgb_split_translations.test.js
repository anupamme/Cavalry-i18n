#!/usr/bin/env node
/**
 * [INPUT]: 依赖 Cavalry 2.8 rgbSplitFilter 源绑定译文、native_language_pack 与三语格式门。
 * [OUTPUT]: 锁定35键/105译值、source/notes/role/provenance、RGB偏移、Padding、重复语义、预设及16种混合模式。
 * [POS]: tools 的 RGB Split 离线审定合同；stage 输入仅供只读红绿验证，不读取App/profile或证明实机显示。
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
const OFFICIAL_MODULE = path.join(__dirname, '../languages/native/nodes_rgb_split.js');
const STAGE_INPUT = process.env.CAVALRY_RGB_SPLIT_TEST_STAGE_INPUT;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const translations = (zhHans, zhHant, jaJp) => ({ 'zh-Hans': zhHans, 'zh-Hant': zhHant, ja_JP: jaJp });

// -- 官方英文键与显示职责：键名投影不能替代源身份摘要 -----------------
const ATTRIBUTE_SOURCES = {
  autoPad: 'Automatic Padding', blue: 'Blue Channel', blueOffset: 'Blue Channel Offset',
  green: 'Green Channel', greenOffset: 'Green Channel Offset', passDist: 'Repetition Distance',
  passes: 'Repetitions', radius: 'Lens Radius', red: 'Red Channel',
  redOffset: 'Red Channel Offset', rotation: 'Rotation', strength: 'Strength', viewPort: 'Padding',
};

const ATTRIBUTE_TEXT = {
  autoPad: translations('自动边距', '自動邊距', '自動パディング'),
  blue: translations('蓝色通道', '藍色通道', '青チャンネル'),
  blueOffset: translations('蓝色通道偏移', '藍色通道偏移', '青チャンネルオフセット'),
  green: translations('绿色通道', '綠色通道', '緑チャンネル'),
  greenOffset: translations('绿色通道偏移', '綠色通道偏移', '緑チャンネルオフセット'),
  passDist: translations('重复距离', '重複距離', '繰り返し距離'),
  passes: translations('重复次数', '重複次數', '繰り返し回数'),
  radius: translations('镜头半径', '鏡頭半徑', 'レンズ半径'),
  red: translations('红色通道', '紅色通道', '赤チャンネル'),
  redOffset: translations('红色通道偏移', '紅色通道偏移', '赤チャンネルオフセット'),
  rotation: translations('旋转', '旋轉', '回転'),
  strength: translations('强度', '強度', '強度'),
  viewPort: translations('边距', '邊距', 'パディング'),
};

const BLEND_MODES = [
  [12, 'Plus', translations('相加', '相加', '加算')],
  [14, 'Screen', translations('滤色', '濾色', 'スクリーン')],
  [15, 'Overlay', translations('叠加', '疊加', 'オーバーレイ')],
  [16, 'Darken', translations('变暗', '變暗', '比較（暗）')],
  [17, 'Lighten', translations('变亮', '變亮', '比較（明）')],
  [18, 'Color Dodge', translations('颜色减淡', '顏色減淡', '覆い焼きカラー')],
  [19, 'Color Burn', translations('颜色加深', '顏色加深', '焼き込みカラー')],
  [20, 'Hard Light', translations('强光', '強光', 'ハードライト')],
  [21, 'Soft Light', translations('柔光', '柔光', 'ソフトライト')],
  [22, 'Difference', translations('差值', '差值', '差の絶対値')],
  [23, 'Exclusion', translations('排除', '排除', '除外')],
  [24, 'Multiply', translations('正片叠底', '正片疊底', '乗算')],
  [25, 'Hue', translations('色相', '色相', '色相')],
  [26, 'Saturation', translations('饱和度', '飽和度', '彩度')],
  [27, 'Color', translations('颜色', '顏色', 'カラー')],
  [28, 'Luminosity', translations('明度', '明度', '輝度')],
];

const OTHER_ROWS = {
  'nodeInfo:rgbSplitFilter': {
    source: 'Offset the Red, Green and Blue color channels of a layer.',
    role: 'node-info',
    text: translations('偏移图层的 RGB 颜色通道。', '偏移圖層的 RGB 顏色通道。', 'レイヤーの RGB カラーチャンネルをオフセットします。'),
  },
  'nodeName:rgbSplitFilter': {
    source: 'RGB Split', role: 'node-name',
    text: translations('RGB 分离', 'RGB 分離', 'RGB スプリット'),
  },
  'nodeTab:rgbSplitFilter.colours': {
    source: 'Colors', role: 'tab-label', text: translations('颜色', '顏色', 'カラー'),
  },
  'nodeTab:rgbSplitFilter.modeOne': {
    source: 'One', role: 'preset-label', text: translations('一', '一', 'ワン'),
  },
  'nodeTab:rgbSplitFilter.modeTwo': {
    source: 'Two', role: 'preset-label', text: translations('二', '二', 'ツー'),
  },
  'nodeTab:rgbSplitFilter.modeZero': {
    source: 'Zero', role: 'preset-label', text: translations('零', '零', 'ゼロ'),
  },
};

const EXPECTED_ROLE_KEYS = {
  'attribute-label': Object.keys(ATTRIBUTE_SOURCES).map(name => `nodeAttr:rgbSplitFilter.${name}`),
  'enum-label': BLEND_MODES.map(([index]) => `nodeAttrEnum:rgbSplitFilter.blendMode.${index}`),
  'node-info': ['nodeInfo:rgbSplitFilter'],
  'node-name': ['nodeName:rgbSplitFilter'],
  'preset-label': ['nodeTab:rgbSplitFilter.modeOne', 'nodeTab:rgbSplitFilter.modeTwo', 'nodeTab:rgbSplitFilter.modeZero'],
  'tab-label': ['nodeTab:rgbSplitFilter.colours'],
};

const EXPECTED_TEXT = Object.fromEntries([
  ...Object.entries(ATTRIBUTE_TEXT).map(([name, value]) => [`nodeAttr:rgbSplitFilter.${name}`, value]),
  ...BLEND_MODES.map(([index, , value]) => [`nodeAttrEnum:rgbSplitFilter.blendMode.${index}`, value]),
  ...Object.entries(OTHER_ROWS).map(([key, value]) => [key, value.text]),
]);
const EXPECTED_SOURCES = Object.fromEntries([
  ...Object.entries(ATTRIBUTE_SOURCES).map(([name, source]) => [`nodeAttr:rgbSplitFilter.${name}`, source]),
  ...BLEND_MODES.map(([index, source]) => [`nodeAttrEnum:rgbSplitFilter.blendMode.${index}`, source]),
  ...Object.entries(OTHER_ROWS).map(([key, value]) => [key, value.source]),
]);

function rgbSplit() {
  if (STAGE_INPUT) return JSON.parse(fs.readFileSync(path.resolve(STAGE_INPUT), 'utf8'));
  assert.ok(fs.existsSync(OFFICIAL_MODULE),
    'RED: approved rgbSplitFilter module is not present at languages/native/nodes_rgb_split.js');
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

function assertLocaleText(locale, getText) {
  for (const [key, expected] of Object.entries(EXPECTED_TEXT)) {
    assert.equal(getText(key), expected[locale], `${key}/${locale} label changed`);
  }
}

test('RGB Split binds the complete 35-key source, notes, roles and official provenance', () => {
  const { entries, provenance } = rgbSplit();
  const keys = entries.map(row => row.key);
  assert.equal(entries.length, 35);
  assert.equal(new Set(keys).size, 35);
  assert.deepEqual(keys, [...keys].sort());
  assert.deepEqual(keys, Object.keys(EXPECTED_SOURCES).sort());
  assert.equal(provenance.cavalryVersion, '2.8.0');
  assert.equal(provenance.catalogPath, 'Definitions/Translation/nodeStrings_en-GB.source.json');
  assert.equal(provenance.sourceSha256, 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0');
  assert.equal(provenance.vendorJapanesePath, 'Definitions/Translation/nodeStrings_ja-JP.translation.json');
  assert.equal(provenance.vendorJapaneseSha256, '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439');
  assert.equal(provenance.sourcePairsSha256, '9c714e7f2281ae0183f9490606bda501c85a5890412276fdd6e415a53d046781');
  assert.equal(provenance.batchSourcePairsSha256, '55006b9695a5628c6ab6a83ce1ad4c51892eca9a2fb24c5a1bc491d215f6fe87');
  assert.equal(digest(entries.map(row => [row.key, row.source])), provenance.sourcePairsSha256);
  assert.equal(digest(entries.map(row => [row.key, row.owner, row.fieldPath, row.source, row.notes])),
    '113c8293a5dc84330bab4abf40c172e5f0538fbc5b6afec34d7792d69f4be562');
  for (const entry of entries) {
    assert.equal(entry.owner, 'rgbSplitFilter', `${entry.key} owner`);
    assert.equal(entry.catalogId, 'Definitions/Translation/nodeStrings', `${entry.key} catalog`);
    assert.equal(entry.dontTranslate, false, `${entry.key} DNT`);
    assert.equal(entry.source, EXPECTED_SOURCES[entry.key], `${entry.key} source identity`);
  }
  for (const [role, roleKeys] of Object.entries(EXPECTED_ROLE_KEYS)) {
    assert.deepEqual(entries.filter(row => row.displayRole === role).map(row => row.key), roleKeys,
      `${role} source-role binding`);
  }
});

test('RGB Split has exactly 105 explicit, nonempty locale decisions with format preservation', () => {
  const { entries } = rgbSplit();
  let decisionCount = 0;
  for (const entry of entries) for (const locale of LOCALES) {
    const decision = entry.translations?.[locale];
    assert.ok(decision, `${entry.key}/${locale} decision missing`);
    assert.equal(decision.decision, 'translate', `${entry.key}/${locale} decision kind`);
    assert.equal(typeof decision.text, 'string');
    assert.ok(decision.text.trim(), `${entry.key}/${locale} translation empty`);
    assertNativeTranslationFormat(entry.source, decision.text);
    decisionCount += 1;
  }
  assert.equal(decisionCount, 105);
});

test('RGB Split attribute labels preserve channel identity and direction-neutral offset values', () => {
  const { entries } = rgbSplit();
  for (const locale of LOCALES) {
    for (const key of [
      'nodeAttr:rgbSplitFilter.blueOffset',
      'nodeAttr:rgbSplitFilter.greenOffset',
      'nodeAttr:rgbSplitFilter.redOffset',
    ]) assert.equal(readText(entries, key, locale), EXPECTED_TEXT[key][locale], `${key}/${locale}`);
    const description = readText(entries, 'nodeInfo:rgbSplitFilter', locale);
    assert.match(description, /RGB /, `${locale} keeps an acronym separator`);
    assert.match(description, locale === 'ja_JP' ? /オフセット/ : /偏移/);
    assert.doesNotMatch(description, /相加|加算|正值|負值|负值|正方向|負方向|负方向|[+-]\s*\d/,
      `${locale} must not invent channel arithmetic or a fixed offset sign`);
  }
});

test('RGB Split keeps Lens Radius and design Padding distinct from focal length or accumulated spacing', () => {
  const { entries } = rgbSplit();
  for (const locale of LOCALES) {
    assert.equal(readText(entries, 'nodeAttr:rgbSplitFilter.radius', locale), EXPECTED_TEXT['nodeAttr:rgbSplitFilter.radius'][locale]);
    assert.equal(readText(entries, 'nodeAttr:rgbSplitFilter.autoPad', locale), EXPECTED_TEXT['nodeAttr:rgbSplitFilter.autoPad'][locale]);
    assert.equal(readText(entries, 'nodeAttr:rgbSplitFilter.viewPort', locale), EXPECTED_TEXT['nodeAttr:rgbSplitFilter.viewPort'][locale]);
    const labels = [
      readText(entries, 'nodeAttr:rgbSplitFilter.radius', locale),
      readText(entries, 'nodeAttr:rgbSplitFilter.autoPad', locale),
      readText(entries, 'nodeAttr:rgbSplitFilter.viewPort', locale),
    ].join(' ');
    assert.doesNotMatch(labels, /焦距|焦点距離|累计间隔|累積間隔|補零|补零|zero[- ]fill/i);
    assert.notEqual(readText(entries, 'nodeAttr:rgbSplitFilter.autoPad', locale),
      readText(entries, 'nodeAttr:rgbSplitFilter.viewPort', locale), `${locale} keeps Automatic Padding distinct`);
  }
});

test('RGB Split distinguishes neutral repetition distance from an explicit repetition count', () => {
  const { entries } = rgbSplit();
  for (const locale of LOCALES) {
    const distance = readText(entries, 'nodeAttr:rgbSplitFilter.passDist', locale);
    const count = readText(entries, 'nodeAttr:rgbSplitFilter.passes', locale);
    assert.equal(distance, EXPECTED_TEXT['nodeAttr:rgbSplitFilter.passDist'][locale]);
    assert.equal(count, EXPECTED_TEXT['nodeAttr:rgbSplitFilter.passes'][locale]);
    assert.notEqual(distance, count);
    assert.doesNotMatch(distance, /相邻|相鄰|隣接|首末|最初|最後|first|last/i,
      `${locale} does not choose an adjacent-gap or first-to-last algorithm`);
  }
});

test('One, Two and Zero remain compact preset labels without inferred channel or parameter settings', () => {
  const { entries } = rgbSplit();
  const keys = ['nodeTab:rgbSplitFilter.modeOne', 'nodeTab:rgbSplitFilter.modeTwo', 'nodeTab:rgbSplitFilter.modeZero'];
  for (const locale of LOCALES) {
    assert.deepEqual(keys.map(key => readText(entries, key, locale)), keys.map(key => EXPECTED_TEXT[key][locale]));
    for (const key of keys) assert.doesNotMatch(readText(entries, key, locale), /通道|チャンネル|模式|モード|参数|パラメーター/);
  }
});

test('all 16 blend-mode enum indices retain their named image-mode identity in Simplified Chinese', () => {
  const { entries } = rgbSplit();
  const actual = entries.filter(row => row.displayRole === 'enum-label').map(row => [row.key, row.source]);
  assert.deepEqual(actual, BLEND_MODES.map(([index, source]) => [`nodeAttrEnum:rgbSplitFilter.blendMode.${index}`, source]));
  for (const [index, source, expected] of BLEND_MODES) {
    const key = `nodeAttrEnum:rgbSplitFilter.blendMode.${index}`;
    assert.equal(findEntry(entries, key).source, source);
    assert.equal(readText(entries, key, 'zh-Hans'), expected['zh-Hans'], `${source} keeps its mode name`);
  }
});

test('all 16 blend-mode enum indices retain their named image-mode identity in Traditional Chinese', () => {
  const { entries } = rgbSplit();
  for (const [index, source, expected] of BLEND_MODES) {
    const key = `nodeAttrEnum:rgbSplitFilter.blendMode.${index}`;
    assert.equal(findEntry(entries, key).source, source);
    assert.equal(readText(entries, key, 'zh-Hant'), expected['zh-Hant'], `${source} keeps its mode name`);
  }
});

test('all 16 blend-mode enum indices retain their named image-mode identity in Japanese', () => {
  const { entries } = rgbSplit();
  for (const [index, source, expected] of BLEND_MODES) {
    const key = `nodeAttrEnum:rgbSplitFilter.blendMode.${index}`;
    assert.equal(findEntry(entries, key).source, source);
    assert.equal(readText(entries, key, 'ja_JP'), expected.ja_JP, `${source} keeps its mode name`);
  }
});

test('the named Plus, Darken and Lighten blend modes use the approved locale terminology', () => {
  const { entries } = rgbSplit();
  for (const [index, source, expected] of [BLEND_MODES[0], BLEND_MODES[3], BLEND_MODES[4]]) {
    const key = `nodeAttrEnum:rgbSplitFilter.blendMode.${index}`;
    assert.equal(findEntry(entries, key).source, source);
    for (const locale of LOCALES) assert.equal(readText(entries, key, locale), expected[locale], `${source}/${locale}`);
  }
});

test('RGB Split guards reject actual reversed or over-specified semantic mutations', () => {
  const mutations = [
    ['zh-Hans', 'nodeAttr:rgbSplitFilter.redOffset', '红色通道偏移', '蓝色通道偏移'],
    ['ja_JP', 'nodeAttr:rgbSplitFilter.blueOffset', '青チャンネルオフセット', '青チャンネル加算'],
    ['zh-Hans', 'nodeAttr:rgbSplitFilter.radius', '镜头半径', '镜头焦距'],
    ['zh-Hans', 'nodeAttr:rgbSplitFilter.viewPort', '边距', '累积间隔'],
    ['zh-Hans', 'nodeTab:rgbSplitFilter.modeOne', '一', '一（红色通道）'],
    ['zh-Hans', 'nodeAttr:rgbSplitFilter.passDist', '重复距离', '相邻副本间距'],
    ['ja_JP', 'nodeAttr:rgbSplitFilter.passDist', '繰り返し距離', '最初と最後の繰り返しの距離'],
    ['ja_JP', 'nodeAttr:rgbSplitFilter.passes', '繰り返し回数', '繰り返し距離'],
    ['zh-Hans', 'nodeAttrEnum:rgbSplitFilter.blendMode.12', '相加', '加'],
    ['ja_JP', 'nodeAttrEnum:rgbSplitFilter.blendMode.16', '比較（暗）', '暗く'],
    ['ja_JP', 'nodeAttrEnum:rgbSplitFilter.blendMode.17', '比較（明）', '明るく'],
  ];
  assert.ok(mutations.length >= 6);
  for (const [locale, key, from, to] of mutations) {
    const expected = EXPECTED_TEXT[key]?.[locale];
    assert.equal(expected, from, `${key}/${locale} mutant baseline`);
    assert.notEqual(to, from);
    assert.throws(() => assertLocaleText(locale, candidateKey => candidateKey === key ? to : EXPECTED_TEXT[candidateKey][locale]),
      assert.AssertionError, `${key}/${locale} reverse mutant must fail`);
  }
});

test('RGB Split projects only approved display keys without mutating node identity', () => {
  const { entries } = rgbSplit();
  const nodeValue = { nodeType: 'rgbSplitFilter', modelIdentity: 'fixture-model-identity' };
  for (const entry of entries) {
    let target = nodeValue;
    for (const part of entry.fieldPath.slice(0, -1)) target = target[part] ??= {};
    target[entry.fieldPath.at(-1)] = { 'UI-text': entry.source, notes: entry.notes };
  }
  const source = [{ type: 'nodeStrings', value: nodeValue }];
  const before = structuredClone(source);
  const vendorJapanese = [{ type: 'nodeStrings', value: structuredClone(nodeValue) }];
  const catalog = collectNativeCatalog('rgb-split-fixture', source, vendorJapanese);
  assert.equal(catalog.entries.length, 35);
  assert.equal(catalog.unmapped.length, 0);
  for (const locale of LOCALES) {
    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[locale] }));
    const resolution = resolveTranslations(catalog.entries, locale, reviews);
    const pack = JSON.parse(renderNativePack(resolution));
    assert.equal(pack.length, 1);
    assert.equal(pack[0].type, 'strings');
    assert.equal(Object.keys(pack[0].value).length, 35);
    assert.ok(resolution.rows.every(row => row.status === 'reviewed'));
    for (const entry of entries) {
      assert.deepEqual(pack[0].value[entry.key], { 'UI-text': entry.translations[locale].text });
    }
    assert.deepEqual(source, before);
    assert.equal(source[0].value.modelIdentity, 'fixture-model-identity');
  }
});
