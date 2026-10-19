/**
 * [INPUT]: 接收已审201个owner行与正式autoAnimate显示项，读取行内source/notes/三语决策。
 * [OUTPUT]: 提供本轮统一スタッガー引用及旧スタガー回退反例、Stagger引用、Taper/Travel/仅缺失替换的源语境与已审短标签合同及有限逐槽反例，不充当自然语言解析器。
 * [POS]: tools 的纯语义合同片段；由默认入库测试与stage验证器共用，不读取stage文件或运行时数据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');

const LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const STAGGER_KEYS = Object.freeze([
  'attrInfo:chopPath.offset', 'attrInfo:chopPath.spread', 'nodeAttr:chopPath.spreadHelp',
  'attrInfo:subMesh.shapeOpacity', 'attrInfo:subMesh.shapePosition', 'attrInfo:subMesh.shapeRotation',
  'attrInfo:subMesh.shapeScale', 'attrInfo:subMesh.shapeTimeOffset', 'attrInfo:subMesh.shapeVisibility',
]);
const GENERIC_TAPER_KEYS = Object.freeze([
  'nodeAttr:strokeMaterial.taperFrom', 'nodeAttr:strokeMaterial.taperedWidth',
]);
const REPLACE_MISSING_KEYS = Object.freeze([
  'nodeAttrEnum:subMesh.fillReplacementMode.1', 'nodeAttrEnum:subMesh.strokeReplacementMode.1',
]);
const ACCEPTED_TRIM_TRAVEL_COPY = Object.freeze({
  'zh-Hans': '移动', 'zh-Hant': '移動',
});
const LEGACY_V2_REVERSION_CASES = Object.freeze([
  ['F-01', 'attrInfo:chopPath.offset', 'zh-Hans', '偏移路径上被切开的部分。也可连接随机、噪波或交错等行为，以产生有趣的效果。'],
  ['F-01', 'attrInfo:chopPath.offset', 'zh-Hant', '偏移路徑上被切開的部分。也可連接隨機、雜訊或交錯等行為，以產生有趣的效果。'],
  ['F-01', 'attrInfo:chopPath.offset', 'ja_JP', 'パスの切断部分をオフセットします。ランダム、ノイズ、スタガーなどのビヘイビアを接続して、面白い効果を作ることもできます。'],
  ['F-01', 'attrInfo:chopPath.spread', 'zh-Hans', '设置各次切割之间的间隙。也可连接随机、噪波或交错等行为，以产生有趣的效果。'],
  ['F-01', 'attrInfo:chopPath.spread', 'zh-Hant', '設定各次切割之間的間隙。也可連接隨機、雜訊或交錯等行為，以產生有趣的效果。'],
  ['F-01', 'attrInfo:chopPath.spread', 'ja_JP', '切断同士の間隔を設定します。ランダム、ノイズ、スタガーなどのビヘイビアを接続して、面白い効果を作ることもできます。'],
  ['F-01', 'nodeAttr:chopPath.spreadHelp', 'zh-Hans', '将随机、噪波或交错等行为连接到“间隙”和/或“偏移”，以产生有趣的效果。'],
  ['F-01', 'nodeAttr:chopPath.spreadHelp', 'zh-Hant', '將隨機、雜訊或交錯等行為連接到「間隙」和/或「偏移」，以產生有趣的效果。'],
  ['F-01', 'nodeAttr:chopPath.spreadHelp', 'ja_JP', 'ランダム、ノイズ、スタガーなどのビヘイビアを「間隔」および／または「オフセット」に接続すると、面白い効果を作れます。'],
  ['F-01', 'attrInfo:subMesh.shapeOpacity', 'zh-Hans', '设置子网格的不透明度。连接行为（例如随机、交错），即可为每个子网格应用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeOpacity', 'zh-Hant', '設定子網格的不透明度。連接行為（例如隨機、交錯），即可為每個子網格套用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeOpacity', 'ja_JP', '子メッシュの不透明度を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。'],
  ['F-01', 'attrInfo:subMesh.shapePosition', 'zh-Hans', '设置子网格的位置。连接行为（例如随机、交错），即可为每个子网格应用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapePosition', 'zh-Hant', '設定子網格的位置。連接行為（例如隨機、交錯），即可為每個子網格套用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapePosition', 'ja_JP', '子メッシュの位置を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。'],
  ['F-01', 'attrInfo:subMesh.shapeRotation', 'zh-Hans', '设置子网格的旋转。连接行为（例如随机、交错），即可为每个子网格应用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeRotation', 'zh-Hant', '設定子網格的旋轉。連接行為（例如隨機、交錯），即可為每個子網格套用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeRotation', 'ja_JP', '子メッシュの回転を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。'],
  ['F-01', 'attrInfo:subMesh.shapeScale', 'zh-Hans', '设置子网格的缩放。连接行为（例如随机、交错），即可为每个子网格应用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeScale', 'zh-Hant', '設定子網格的縮放。連接行為（例如隨機、交錯），即可為每個子網格套用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeScale', 'ja_JP', '子メッシュのスケールを設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。'],
  ['F-01', 'attrInfo:subMesh.shapeTimeOffset', 'zh-Hans', '设置子网格的时间偏移，单位为帧。连接行为（例如随机、交错），即可为每个子网格应用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeTimeOffset', 'zh-Hant', '設定子網格的時間偏移，單位為幀。連接行為（例如隨機、交錯），即可為每個子網格套用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeTimeOffset', 'ja_JP', '子メッシュの時間オフセットをフレーム単位で設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。'],
  ['F-01', 'attrInfo:subMesh.shapeVisibility', 'zh-Hans', '设置子网格的可见性。连接行为（例如随机、交错），即可为每个子网格应用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeVisibility', 'zh-Hant', '設定子網格的可見性。連接行為（例如隨機、交錯），即可為每個子網格套用不同的值。'],
  ['F-01', 'attrInfo:subMesh.shapeVisibility', 'ja_JP', '子メッシュの可視性を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。'],
  ['F-02', 'nodeAttr:strokeMaterial.taperFrom', 'zh-Hans', '渐细起点'],
  ['F-02', 'nodeAttr:strokeMaterial.taperFrom', 'zh-Hant', '漸細起點'],
  ['F-02', 'nodeAttr:strokeMaterial.taperedWidth', 'zh-Hans', '渐细宽度'],
  ['F-02', 'nodeAttr:strokeMaterial.taperedWidth', 'zh-Hant', '漸細寬度'],
  ['F-03', 'nodeAttr:strokeMaterial.trimTravel', 'zh-Hans', '推移'],
  ['F-03', 'nodeAttr:strokeMaterial.trimTravel', 'zh-Hant', '推移'],
  ['F-04', 'nodeAttrEnum:subMesh.fillReplacementMode.1', 'zh-Hans', '替换缺失'],
  ['F-04', 'nodeAttrEnum:subMesh.fillReplacementMode.1', 'zh-Hant', '替換缺失'],
  ['F-04', 'nodeAttrEnum:subMesh.fillReplacementMode.1', 'ja_JP', '欠落を置換'],
  ['F-04', 'nodeAttrEnum:subMesh.strokeReplacementMode.1', 'zh-Hans', '替换缺失'],
  ['F-04', 'nodeAttrEnum:subMesh.strokeReplacementMode.1', 'zh-Hant', '替換缺失'],
  ['F-04', 'nodeAttrEnum:subMesh.strokeReplacementMode.1', 'ja_JP', '欠落を置換'],
].map(row => Object.freeze(row)));

function rowFor(entries, key) {
  const row = entries.find(entry => entry.key === key);
  assert.ok(row, `semantic contract requires ${key}`);
  return row;
}

function autoAnimateLabel(autoEntries, locale) {
  const row = rowFor(autoEntries, 'attrInfo:autoAnimate.automaticTimeOffset');
  const text = row.translations[locale]?.text;
  assert.ok(typeof text === 'string' && text, `approved autoAnimate label exists for ${locale}`);
  const patterns = {
    'zh-Hans': /(?:如|例如)“([^”]+)”/u,
    'zh-Hant': /(?:如|例如)「([^」]+)」/u,
    ja_JP: /（例：([^）]+)）/u,
  };
  const match = text.match(patterns[locale]);
  assert.ok(match?.[1], `approved Auto Animate example label is parseable for ${locale}`);
  return match[1];
}

function assertStaggerLinks(entries, autoEntries) {
  assert.equal(STAGGER_KEYS.length, 9);
  for (const key of STAGGER_KEYS) {
    const row = rowFor(entries, key);
    assert.ok(row.source.includes('Stagger') && row.source.includes('Behaviour'), `${key} source defines the node reference`);
    for (const locale of LOCALES) {
      assert.equal(row.translations[locale].decision, 'translate', `${key}/${locale} is translated display copy`);
      const token = autoAnimateLabel(autoEntries, locale);
      const text = row.translations[locale].text;
      assert.equal(text.split(token).length - 1, 1, `${key}/${locale} uses the current Auto Animate display label exactly once`);
    }
  }
}

function assertGenericTaper(entries, locale) {
  for (const key of GENERIC_TAPER_KEYS) {
    const row = rowFor(entries, key);
    assert.match(row.notes.join(' '), /Taper(?:ed)?"? means gradually narrowing\/widening/i,
      `${key} notes permit narrowing or widening`);
    const text = row.translations[locale].text;
    if (locale === 'zh-Hans' || locale === 'zh-Hant') {
      // 已审短标签绑定双向源语义；新措辞须重新审校，不能靠词同现冒充NLP。
      const widthChange = locale === 'zh-Hans' ? '宽度渐变' : '寬度漸變';
      const origin = locale === 'zh-Hans' ? '起点' : '起點';
      assert.equal(text, widthChange + (key.endsWith('taperFrom') ? origin : ''),
        `${key}/${locale} accepted direction-neutral caption regression; not the only valid translation`);
    } else {
      assert.doesNotMatch(text, /両端|両側|兩端|雙端/u, `${key}/ja_JP does not inherit Double Taper's two-end promise`);
    }
  }
}

function assertDoubleTaper(entries, locale) {
  const row = rowFor(entries, 'nodeAttr:strokeMaterial.doubleTaper');
  assert.match(row.notes.join(' '), /Taper.*gradually narrowing.*Double.*both ends/i,
    'Double Taper alone carries the both-ends narrowing meaning');
  const text = row.translations[locale].text;
  if (locale === 'zh-Hans') assert.match(text, /(?:双端|两端).{0,4}(?:渐细|收窄|变窄)/u);
  else if (locale === 'zh-Hant') assert.match(text, /(?:雙端|兩端).{0,4}(?:漸細|收窄|變窄)/u);
  else assert.ok(/両端/u.test(text) && /テーパー|絞|細/u.test(text), 'Japanese retains both ends plus tapering');
}

function assertTrimTravelCopy(entries, locale) {
  const row = rowFor(entries, 'nodeAttr:strokeMaterial.trimTravel');
  assert.match(row.notes.join(' '), /shifts both trim points together along the path/i,
    'source defines Travel as spatial motion of both trim points');
  assert.ok(['zh-Hans', 'zh-Hant'].includes(locale), 'selected Travel copy regression is limited to the two reviewed Chinese values');
  assert.equal(row.translations[locale].text, ACCEPTED_TRIM_TRAVEL_COPY[locale],
    `accepted ${locale} Travel copy regression; this is not the only valid translation`);
}

function assertReplaceMissing(entries, key, locale) {
  const row = rowFor(entries, key);
  const pathLeaf = row.fieldPath.at(-2);
  assert.ok(pathLeaf === 'fillReplacementMode' || pathLeaf === 'strokeReplacementMode');
  const material = pathLeaf === 'fillReplacementMode' ? 'fill' : 'stroke';
  assert.match(row.notes.join(' '), new RegExp(`only child-meshes without an existing ${material} get one applied`, 'i'),
    `${key} applies only when that material is missing`);
  const text = row.translations[locale].text;
  const accepted = { 'zh-Hans': '未设置时替换', 'zh-Hant': '未設定時替換', ja_JP: '未設定時に置換' };
  assert.ok(Object.hasOwn(accepted, locale));
  assert.equal(text, accepted[locale],
    `${key}/${locale} accepted missing-material caption regression; not the only valid translation`);
}

function assertAllSemanticContracts(entries, autoEntries) {
  assertStaggerLinks(entries, autoEntries);
  for (const locale of LOCALES) {
    assertGenericTaper(entries, locale);
    assertDoubleTaper(entries, locale);
    if (locale !== 'ja_JP') assertTrimTravelCopy(entries, locale);
    for (const key of REPLACE_MISSING_KEYS) assertReplaceMissing(entries, key, locale);
  }
}

function semanticMutationCases(autoEntries) {
  const cases = [];
  for (const key of STAGGER_KEYS) for (const locale of LOCALES) cases.push({
    name: `${key}/${locale} approved Stagger label`, guard: rows => assertStaggerLinks(rows, autoEntries),
    key, locale, mutate: text => text.replace(autoAnimateLabel(autoEntries, locale), locale === 'ja_JP' ? '別の語' : '其他术语'),
  });
  for (const key of GENERIC_TAPER_KEYS) for (const locale of ['zh-Hans', 'zh-Hant']) cases.push({
    name: `${key}/${locale} generic bidirectional Taper`, guard: rows => assertGenericTaper(rows, locale),
    key, locale, mutate: () => locale === 'zh-Hans' ? '仅逐渐收窄' : '僅逐漸收窄',
  });
  for (const key of GENERIC_TAPER_KEYS) for (const locale of ['zh-Hans', 'zh-Hant']) cases.push({
    name: `${key}/${locale} generic Taper must not negate width change`, guard: rows => assertGenericTaper(rows, locale),
    key, locale, mutate: () => locale === 'zh-Hans' ? '宽度没有变化' : '寬度沒有變化',
  });
  for (const key of REPLACE_MISSING_KEYS) for (const locale of LOCALES) cases.push({
    name: `${key}/${locale} Replace Missing condition`, guard: rows => assertReplaceMissing(rows, key, locale),
    key, locale, mutate: () => locale === 'zh-Hans' ? '已设置时替换' : locale === 'zh-Hant' ? '已設定時替換' : '設定済みの場合に置換',
  });
  for (const key of REPLACE_MISSING_KEYS) for (const locale of LOCALES) cases.push({
    name: `${key}/${locale} Replace Missing must not negate the action`, guard: rows => assertReplaceMissing(rows, key, locale),
    key, locale, mutate: () => locale === 'zh-Hans' ? '未设置时不替换' : locale === 'zh-Hant' ? '未設定時不替換' : '未設定時に置換しない',
  });
  for (const locale of LOCALES) cases.push({
    name: `nodeAttr:strokeMaterial.doubleTaper/${locale} both-end boundary`,
    guard: rows => assertDoubleTaper(rows, locale), key: 'nodeAttr:strokeMaterial.doubleTaper', locale,
    mutate: () => locale === 'zh-Hans' ? '渐细' : locale === 'zh-Hant' ? '漸細' : 'テーパー',
  });
  for (const key of GENERIC_TAPER_KEYS) cases.push({
    name: `${key}/ja_JP generic Taper excludes Double Taper promise`,
    guard: rows => assertGenericTaper(rows, 'ja_JP'), key, locale: 'ja_JP',
    mutate: text => `${text}（両端）`,
  });
  const observedCaptionCounterexamples = [
    ['nodeAttr:strokeMaterial.taperFrom', 'zh-Hans', '宽度无需变化'],
    ['nodeAttr:strokeMaterial.taperedWidth', 'zh-Hans', '宽度不必变化'],
    ['nodeAttr:strokeMaterial.taperFrom', 'zh-Hant', '寬度無需變化'],
    ['nodeAttrEnum:subMesh.fillReplacementMode.1', 'zh-Hans', '未设置时无法替换'],
    ['nodeAttrEnum:subMesh.fillReplacementMode.1', 'ja_JP', '未設定時に置換できない'],
    ['nodeAttrEnum:subMesh.strokeReplacementMode.1', 'ja_JP', '未設定時に置換不可'],
  ];
  for (const [key, locale, text] of observedCaptionCounterexamples) cases.push({
    name: `${key}/${locale} independently observed caption counterexample`, key, locale, mutate: () => text,
    guard: rows => key.startsWith('nodeAttrEnum:') ? assertReplaceMissing(rows, key, locale) : assertGenericTaper(rows, locale),
  });
  return cases;
}

function assertSemanticMutants(entries, autoEntries) {
  assertAllSemanticContracts(entries, autoEntries);
  const cases = semanticMutationCases(autoEntries);
  for (const semanticCase of cases) {
    semanticCase.guard(entries);
    const changed = structuredClone(entries);
    const target = rowFor(changed, semanticCase.key);
    const before = target.translations[semanticCase.locale].text;
    const after = semanticCase.mutate(before);
    assert.notEqual(after, before, `${semanticCase.name} mutant changes the actual source-bound slot`);
    target.translations[semanticCase.locale].text = after;
    assert.throws(() => semanticCase.guard(changed), assert.AssertionError,
      `${semanticCase.name} single-slot semantic regression is rejected`);
  }
  return cases.length;
}

function guardForFinding(finding, key, locale, entries, autoEntries) {
  if (finding === 'F-01') return assertStaggerLinks(entries, autoEntries);
  if (finding === 'F-02') return assertGenericTaper(entries, locale);
  if (finding === 'F-03') return assertTrimTravelCopy(entries, locale);
  if (finding === 'F-04') return assertReplaceMissing(entries, key, locale);
  assert.fail(`unknown accepted V3 finding ${finding}`);
}

function assertLegacyV2Reversions(entries, autoEntries) {
  assertAllSemanticContracts(entries, autoEntries);
  const counts = { 'F-01': 0, 'F-02': 0, 'F-03': 0, 'F-04': 0 };
  for (const [finding, key, locale, oldText] of LEGACY_V2_REVERSION_CASES) {
    guardForFinding(finding, key, locale, entries, autoEntries);
    const changed = structuredClone(entries);
    const row = rowFor(changed, key);
    const current = row.translations[locale].text;
    assert.notEqual(current, oldText, `${key}/${locale} V3 baseline differs from its actual old V2 value`);
    row.translations[locale].text = oldText;
    const changedSlots = [];
    for (const candidate of entries) for (const candidateLocale of LOCALES) {
      const next = rowFor(changed, candidate.key).translations[candidateLocale].text;
      if (next !== candidate.translations[candidateLocale].text) changedSlots.push(`${candidate.key}/${candidateLocale}`);
    }
    assert.deepEqual(changedSlots, [`${key}/${locale}`], 'real V2 reversion changes exactly one display value');
    assert.throws(() => guardForFinding(finding, key, locale, changed, autoEntries), assert.AssertionError,
      `${finding} ${key}/${locale} real V2 value is rejected by the same source-bound accepted-copy guard`);
    counts[finding] += 1;
  }
  assert.deepEqual(counts, { 'F-01': 27, 'F-02': 4, 'F-03': 2, 'F-04': 6 });
  return LEGACY_V2_REVERSION_CASES.length;
}

module.exports = Object.freeze({
  ACCEPTED_TRIM_TRAVEL_COPY,
  GENERIC_TAPER_KEYS,
  LEGACY_V2_REVERSION_CASES,
  LOCALES,
  REPLACE_MISSING_KEYS,
  STAGGER_KEYS,
  assertAllSemanticContracts,
  assertDoubleTaper,
  assertGenericTaper,
  assertReplaceMissing,
  assertSemanticMutants,
  assertLegacyV2Reversions,
  assertStaggerLinks,
  assertTrimTravelCopy,
  autoAnimateLabel,
  semanticMutationCases,
});
