/**
 * [INPUT]: 接收六owner完整source-bound entries及当前Apply OpenType/Text Shape/Camera显示标签。
 * [OUTPUT]: 约束可由官方notes支持的交叉标签、条件边界、模式方向与技术身份，并提供单槽变异门。
 * [POS]: 六owner已审显示输入的纯测试门；源note与caption引用、63有限反例不宣称通用自然语言判定，不进入产品运行时。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');

const LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const OWNER_COUNTS = Object.freeze({
  applyCharacterSpacing: 8, falloff: 45, pathSplit: 47,
  fourPointWarp: 43, barChart: 13, ditheringFilter: 44,
});
const TOKEN = Object.freeze({
  regex: { 'zh-Hans': '正则表达式', 'zh-Hant': '正則表達式', ja_JP: '正規表現' },
  match: { 'zh-Hans': '匹配项', 'zh-Hant': '相符項', ja_JP: 'マッチ' },
  branch: { 'zh-Hans': '分支', 'zh-Hant': '分支', ja_JP: 'ブランチ' },
  parentPath: { 'zh-Hans': '父路径', 'zh-Hant': '父路徑', ja_JP: '親パス' },
  perpendicular: { 'zh-Hans': '垂线', 'zh-Hant': '垂線', ja_JP: '垂線' },
  frameOnly: { 'zh-Hans': '仅限帧模式', 'zh-Hant': '僅限幀模式', ja_JP: 'フレームモードのみ' },
  recursive: { 'zh-Hans': '递归', 'zh-Hant': '遞迴', ja_JP: '再帰' },
  random: { 'zh-Hans': '随机', 'zh-Hant': '隨機', ja_JP: 'ランダム' },
  eachPoint: { 'zh-Hans': '每个点', 'zh-Hant': '每個點', ja_JP: 'ポイントごと' },
  evaluatedPoint: { 'zh-Hans': '求值点', 'zh-Hant': '求值點', ja_JP: '評価ポイント' },
  calculation: { 'zh-Hans': '计算', 'zh-Hant': '計算', ja_JP: '計算' },
  hide: { 'zh-Hans': '隐藏', 'zh-Hant': '隱藏', ja_JP: '非表示' },
  degrees: { 'zh-Hans': '度', 'zh-Hant': '度', ja_JP: '度' },
  minimum: { 'zh-Hans': '最小', 'zh-Hant': '最小', ja_JP: '最小' },
  radius: { 'zh-Hans': '半径', 'zh-Hant': '半徑', ja_JP: '半径' },
  angle: { 'zh-Hans': '角度', 'zh-Hant': '角度', ja_JP: '角度' },
  nominal: {
    'zh-Hans': /定类|类别|分类/,
    'zh-Hant': /類別|定類|分類/,
    ja_JP: /名義|カテゴリ/,
  },
  maximum: {
    'zh-Hans': /最大.*高/,
    'zh-Hant': /最大.*高/,
    ja_JP: /最大.*高さ/,
  },
  clockwise: { 'zh-Hans': '顺时针', 'zh-Hant': '順時針', ja_JP: '時計回り' },
  counterClockwise: { 'zh-Hans': '逆时针', 'zh-Hant': '逆時針', ja_JP: '反時計回り' },
  hsvValueBrightness: { 'zh-Hans': '明度', 'zh-Hant': '明度', ja_JP: '明度' },
  inputHandle: { 'zh-Hans': '入', 'zh-Hant': '入', ja_JP: 'イン' },
  outputHandle: { 'zh-Hans': '出', 'zh-Hant': '出', ja_JP: 'アウト' },
  corner: {
    'zh-Hans': ['左上', '右上', '右下', '左下'],
    'zh-Hant': ['左上', '右上', '右下', '左下'],
    ja_JP: ['左上', '右上', '右下', '左下'],
  },
});

function findEntry(entries, key) {
  const row = entries.find(item => item.key === key);
  assert.ok(row, `required source-bound row missing: ${key}`);
  return row;
}
function text(entries, key, locale) {
  const value = findEntry(entries, key).translations?.[locale]?.text;
  assert.equal(typeof value, 'string', `${key}/${locale} has a display text`);
  return value;
}
function mustContain(value, token, key) {
  assert.ok(value.includes(token), `${key} should retain source-backed meaning ${JSON.stringify(token)}: ${value}`);
}
function mustMatch(value, pattern, key) {
  assert.match(value, pattern, `${key} should retain source-backed pattern ${pattern}: ${value}`);
}
function boldReference(value, label, key) {
  mustContain(value, `<b>${label}</b>`, key);
}
function approvedText(module, key, locale) {
  const row = module.entries.find(item => item.key === key);
  assert.ok(row, `current approved reference label missing: ${module.provenance?.owner || module.provenance?.module || key}`);
  return row.translations[locale].text;
}
function checkTextSource(entries, key, sourceFragment, noteFragment) {
  const row = findEntry(entries, key);
  mustContain(row.source, sourceFragment, `${key} English source`);
  assert.ok(row.notes.some(note => note.includes(noteFragment)), `${key} source notes bind ${noteFragment}`);
  return row;
}
function assertEntryLocaleSet(entries) {
  assert.deepEqual([...new Set(entries.map(row => row.owner))].sort(), Object.keys(OWNER_COUNTS).sort());
  for (const [owner, count] of Object.entries(OWNER_COUNTS)) {
    assert.equal(entries.filter(row => row.owner === owner).length, count, `${owner} complete source owner`);
  }
  assert.equal(entries.length, 200);
}

function assertSemanticBaseline(entries, references) {
  assertEntryLocaleSet(entries);
  const kerning = Object.fromEntries(LOCALES.map(locale => [locale,
    approvedText(references.openType, 'nodeAttrEnum:applyOpenType.feature.52', locale)]));
  const characterSpacing = Object.fromEntries(LOCALES.map(locale => [locale,
    approvedText(references.textShape, 'nodeAttr:textShape.letterSpacing', locale)]));
  const camera = Object.fromEntries(LOCALES.map(locale => [locale,
    approvedText(references.camera, 'menu.create.camera', locale)]));

  checkTextSource(entries, 'attrInfo:applyCharacterSpacing.pairs.matchString', 'Each match becomes a kerning point', 'specific pairs of characters');
  checkTextSource(entries, 'attrInfo:falloff.useProbability', 'randomly 0 or 1 per point', 'randomly determined');
  checkTextSource(entries, 'attrInfo:falloff.is3d', '2.5D in combination with a <b>Camera</b>', 'simulated depth');
  checkTextSource(entries, 'attrInfo:pathSplit.branchAngle', 'perpendicular to parent path', 'parent path');
  checkTextSource(entries, 'attrInfo:pathSplit.mode', 'Iteration (static) or Frame (animated)', 'fixed, one-off recursive pass');
  checkTextSource(entries, 'attrInfo:fourPointWarp.corner0.tangentIn', 'top-left corner', 'control handles used to shape the curve');
  checkTextSource(entries, 'nodeAttrEnum:barChart.dataType.1', 'Nominal', 'categorical, label-based data');
  checkTextSource(entries, 'nodeAttrEnum:ditheringFilter.greyscaleMode.3', 'Value', 'brightness channel');

  for (const locale of LOCALES) {
    const matchTooltip = text(entries, 'attrInfo:applyCharacterSpacing.pairs.matchString', locale);
    mustContain(matchTooltip, TOKEN.regex[locale], `applyCharacterSpacing matchString/${locale}`);
    mustContain(matchTooltip, TOKEN.match[locale], `applyCharacterSpacing matchString/${locale}`);
    mustContain(matchTooltip, kerning[locale], `applyCharacterSpacing kerning term/${locale}`);
    assert.notEqual(kerning[locale], characterSpacing[locale], `Kerning and Character Spacing stay distinct in ${locale}`);
    mustContain(text(entries, 'nodeInfo:applyCharacterSpacing', locale), kerning[locale], `applyCharacterSpacing node info/${locale}`);
    assert.equal(text(entries, 'nodeAttr:applyCharacterSpacing.pairs.spacing', locale), characterSpacing[locale],
      `Character Spacing label matches the reviewed Text Shape label in ${locale}`);

    const is3d = text(entries, 'attrInfo:falloff.is3d', locale);
    boldReference(is3d, camera[locale], `falloff camera reference/${locale}`);
    const hidden = text(entries, 'attrInfo:falloff.hidden', locale);
    boldReference(hidden, text(entries, 'nodeAttr:falloff.enabled', locale), `falloff enabled reference/${locale}`);
    mustContain(hidden, TOKEN.calculation[locale], `falloff hidden/computation distinction/${locale}`);
    mustContain(hidden, TOKEN.hide[locale], `falloff viewport visibility/${locale}`);
    const probability = text(entries, 'attrInfo:falloff.useProbability', locale);
    mustContain(probability, '0', `falloff probability zero/${locale}`);
    mustContain(probability, '1', `falloff probability one/${locale}`);
    mustContain(probability, TOKEN.random[locale], `falloff stochastic output/${locale}`);
    mustContain(probability, TOKEN.eachPoint[locale], `falloff per-point result/${locale}`);
    const evaluatedOutput = text(entries, 'attrInfo:falloff.out', locale);
    mustContain(evaluatedOutput, TOKEN.evaluatedPoint[locale], `falloff evaluated point/${locale}`);
    mustContain(evaluatedOutput, '0', `falloff zero output/${locale}`);
    mustContain(evaluatedOutput, '1', `falloff unit output/${locale}`);
    mustContain(text(entries, 'attrInfo:falloff.enabled', locale), '1', `falloff disabled output value/${locale}`);
    const outputLabel = text(entries, 'nodeAttr:falloff.out', locale);
    const probabilityLabel = text(entries, 'nodeAttr:falloff.useProbability', locale);
    mustContain(text(entries, 'attrInfo:falloff.strength', locale), outputLabel,
      `falloff strength multiplies current Output label/${locale}`);
    boldReference(text(entries, 'attrInfo:falloff.seed', locale), probabilityLabel,
      `falloff random seed uses current Probability label/${locale}`);
    boldReference(text(entries, 'attrInfo:falloff.angles', locale), text(entries, 'nodeAttr:falloff.shapeType', locale), `falloff shape type reference/${locale}`);
    boldReference(text(entries, 'attrInfo:falloff.angles', locale), text(entries, 'nodeAttrEnum:falloff.shapeType.3', locale), `falloff Sweep reference/${locale}`);
    boldReference(text(entries, 'attrInfo:falloff.repetitions', locale), text(entries, 'nodeAttr:falloff.angles', locale), `falloff Angles reference/${locale}`);

    const branchAngle = text(entries, 'attrInfo:pathSplit.branchAngle', locale);
    mustContain(branchAngle, TOKEN.branch[locale], `Path Split branch direction/${locale}`);
    mustContain(branchAngle, TOKEN.parentPath[locale], `Path Split parent path/${locale}`);
    mustContain(branchAngle, TOKEN.perpendicular[locale], `Path Split perpendicular reference/${locale}`);
    const mode = text(entries, 'attrInfo:pathSplit.mode', locale);
    mustContain(mode, text(entries, 'nodeAttrEnum:pathSplit.mode.0', locale), `Path Split static iteration reference/${locale}`);
    mustContain(mode, text(entries, 'nodeAttrEnum:pathSplit.mode.1', locale), `Path Split animated frame reference/${locale}`);
    mustContain(text(entries, 'attrInfo:pathSplit.iterations', locale), TOKEN.recursive[locale], `Path Split recursive pass/${locale}`);
    mustContain(text(entries, 'attrInfo:pathSplit.maxTotalBranches', locale), TOKEN.frameOnly[locale], `frame-only branch safety limit/${locale}`);
    mustContain(text(entries, 'attrInfo:pathSplit.preventReSplit', locale), TOKEN.frameOnly[locale], `frame-only re-split guard/${locale}`);
    mustContain(text(entries, 'attrInfo:pathSplit.branchArcRadius', locale), TOKEN.radius[locale], `arc radius semantics/${locale}`);
    const arcLabel = text(entries, 'nodeAttrEnum:pathSplit.branchType.1', locale);
    const arcRadius = text(entries, 'attrInfo:pathSplit.branchArcRadius', locale);
    const arcSweep = text(entries, 'attrInfo:pathSplit.branchArcSweepAngle', locale);
    mustContain(arcRadius, arcLabel, `arc radius uses current Arc label/${locale}`);
    mustContain(arcSweep, arcLabel, `arc sweep uses current Arc label/${locale}`);
    mustContain(arcSweep, TOKEN.angle[locale], `arc extent semantics/${locale}`);
    mustContain(arcSweep, TOKEN.degrees[locale], `arc extent unit/${locale}`);
    const lengthThreshold = text(entries, 'nodeAttrEnum:pathSplit.splitCondition.1', locale);
    const curvatureMode = text(entries, 'nodeAttrEnum:pathSplit.splitCondition.3', locale);
    const randomMode = text(entries, 'nodeAttrEnum:pathSplit.splitCondition.2', locale);
    const lengthInfo = text(entries, 'attrInfo:pathSplit.splitLength', locale);
    const curvatureInfo = text(entries, 'attrInfo:pathSplit.splitCurvatureAngle', locale);
    const splitProbability = text(entries, 'attrInfo:pathSplit.splitProbability', locale);
    mustContain(lengthInfo, lengthThreshold, `Path Split Length Threshold uses its current enum/${locale}`);
    mustContain(lengthInfo, TOKEN.minimum[locale], `Path Split length is a lower threshold/${locale}`);
    mustContain(curvatureInfo, curvatureMode, `Path Split Curvature Angle uses its current enum/${locale}`);
    mustContain(curvatureInfo, TOKEN.minimum[locale], `Path Split curvature angle is a lower threshold/${locale}`);
    mustContain(splitProbability, randomMode, `Path Split probability tooltip uses its current Random enum/${locale}`);
    mustContain(splitProbability, text(entries, 'nodeAttr:pathSplit.splitProbability', locale),
      `Path Split probability tooltip uses its current control label/${locale}`);
    assert.equal(text(entries, 'nodeAttrEnum:pathSplit.branchArcDirection.0', locale), TOKEN.clockwise[locale], `clockwise enum index 0/${locale}`);
    assert.equal(text(entries, 'nodeAttrEnum:pathSplit.branchArcDirection.1', locale), TOKEN.counterClockwise[locale], `counter-clockwise enum index 1/${locale}`);

    const nominal = text(entries, 'nodeAttrEnum:barChart.dataType.1', locale);
    mustMatch(nominal, TOKEN.nominal[locale], `barChart Nominal categorical label/${locale}`);
    mustMatch(text(entries, 'nodeAttr:barChart.maximumHeight', locale), TOKEN.maximum[locale], `barChart maximum drawn height/${locale}`);
    assert.notEqual(text(entries, 'nodeAttr:barChart.gapBetweenBars', locale), text(entries, 'nodeAttr:barChart.gapBetweenStacks', locale),
      `adjacent bar gap and stacked-group gap remain separate controls in ${locale}`);
    assert.notEqual(text(entries, 'nodeAttrEnum:barChart.seriesMode.0', locale), text(entries, 'nodeAttrEnum:barChart.seriesMode.1', locale),
      `Stacked and Side by Side enum slots remain distinct in ${locale}`);

    mustContain(text(entries, 'nodeAttrEnum:ditheringFilter.greyscaleMode.3', locale), TOKEN.hsvValueBrightness[locale],
      `HSV Value denotes the brightness channel/${locale}`);
    assert.equal(text(entries, 'nodeAttrEnum:ditheringFilter.pattern.2', locale), 'Bayer',
      `Bayer remains exact source-preserved DNT/${locale}`);
    assert.equal(text(entries, 'nodeAttr:falloff.is3d', locale), '2.5D', `2.5D technical hybrid label is preserved/${locale}`);
  }

  const bayer = findEntry(entries, 'nodeAttrEnum:ditheringFilter.pattern.2');
  assert.equal(bayer.dontTranslate, true, 'Bayer is the one source DNT entry in this batch');
  assert.equal(findEntry(entries, 'nodeAttr:falloff.is3d').dontTranslate, false, '2.5D preserve is not mislabeled DNT');
  for (let corner = 0; corner < 4; corner += 1) {
    const inKey = `nodeAttr:fourPointWarp.corner${corner}.tangentIn`;
    const outKey = `nodeAttr:fourPointWarp.corner${corner}.tangentOut`;
    checkTextSource(entries, inKey, 'In Handle', 'incoming side');
    checkTextSource(entries, outKey, 'Out Handle', 'outgoing side');
    for (const locale of LOCALES) {
      const inText = text(entries, inKey, locale);
      const outText = text(entries, outKey, locale);
      mustContain(inText, TOKEN.inputHandle[locale], `${inKey}/${locale} incoming handle`);
      mustContain(outText, TOKEN.outputHandle[locale], `${outKey}/${locale} outgoing handle`);
      mustContain(inText, TOKEN.corner[locale][corner], `${inKey}/${locale} corner identity`);
      mustContain(outText, TOKEN.corner[locale][corner], `${outKey}/${locale} corner identity`);
      assert.notEqual(inText, outText, `${inKey} and ${outKey} do not collapse opposite handle directions`);
    }
  }
  return 1;
}

function assertSemanticMutants(entries, references) {
  assertSemanticBaseline(entries, references);
  let rejected = 0;
  const mutate = (key, locale, replacement) => {
    const baseline = structuredClone(entries);
    assertSemanticBaseline(baseline, references);
    const mutant = structuredClone(baseline);
    const row = findEntry(mutant, key);
    const before = row.translations[locale].text;
    const after = typeof replacement === 'function' ? replacement(before) : replacement;
    assert.notEqual(after, before, `${key}/${locale} mutant changes one actual display slot`);
    row.translations[locale].text = after;
    assert.throws(() => assertSemanticBaseline(mutant, references), assert.AssertionError,
      `${key}/${locale} source-note semantic reverse mutant must fail`);
    rejected += 1;
  };
  const bad = (key, locale, value) => mutate(key, locale, value);
  for (const locale of LOCALES) {
    const kerning = approvedText(references.openType, 'nodeAttrEnum:applyOpenType.feature.52', locale);
    const spacing = approvedText(references.textShape, 'nodeAttr:textShape.letterSpacing', locale);
    bad('attrInfo:applyCharacterSpacing.pairs.matchString', locale,
      text(entries, 'attrInfo:applyCharacterSpacing.pairs.matchString', locale).replace(kerning, spacing));
    bad('attrInfo:falloff.is3d', locale,
      text(entries, 'attrInfo:falloff.is3d', locale).replace(`<b>${approvedText(references.camera, 'menu.create.camera', locale)}</b>`, '<b>Camera</b>'));
    bad('attrInfo:falloff.useProbability', locale,
      text(entries, 'attrInfo:falloff.useProbability', locale).replace(/0/g, '2'));
    bad('attrInfo:falloff.out', locale,
      text(entries, 'attrInfo:falloff.out', locale).replace(TOKEN.evaluatedPoint[locale], 'pixel'));
    bad('attrInfo:falloff.strength', locale,
      text(entries, 'attrInfo:falloff.strength', locale).replace(
        text(entries, 'nodeAttr:falloff.out', locale), text(entries, 'nodeAttr:falloff.enabled', locale)));
    bad('attrInfo:falloff.seed', locale,
      text(entries, 'attrInfo:falloff.seed', locale).replace(
        `<b>${text(entries, 'nodeAttr:falloff.useProbability', locale)}</b>`, '<b>Probability</b>'));
    bad('attrInfo:falloff.hidden', locale,
      text(entries, 'attrInfo:falloff.hidden', locale).replace(`<b>${text(entries, 'nodeAttr:falloff.enabled', locale)}</b>`, '<b>Enabled</b>'));
    bad('attrInfo:falloff.angles', locale,
      text(entries, 'attrInfo:falloff.angles', locale).replace(`<b>${text(entries, 'nodeAttrEnum:falloff.shapeType.3', locale)}</b>`, '<b>Sweep</b>'));
    bad('attrInfo:pathSplit.branchAngle', locale,
      text(entries, 'attrInfo:pathSplit.branchAngle', locale).replace(TOKEN.parentPath[locale], 'Child Path'));
    bad('attrInfo:pathSplit.mode', locale,
      text(entries, 'attrInfo:pathSplit.mode', locale).replace(text(entries, 'nodeAttrEnum:pathSplit.mode.0', locale), 'Iteration'));
    bad('attrInfo:pathSplit.maxTotalBranches', locale,
      text(entries, 'attrInfo:pathSplit.maxTotalBranches', locale).replace(TOKEN.frameOnly[locale], ''));
    bad('attrInfo:pathSplit.branchArcRadius', locale,
      text(entries, 'attrInfo:pathSplit.branchArcRadius', locale).replace(
        text(entries, 'nodeAttrEnum:pathSplit.branchType.1', locale), 'Branch'));
    bad('attrInfo:pathSplit.splitLength', locale,
      text(entries, 'attrInfo:pathSplit.splitLength', locale).replace(
        text(entries, 'nodeAttrEnum:pathSplit.splitCondition.1', locale), 'Split Length'));
    bad('attrInfo:pathSplit.splitCurvatureAngle', locale,
      text(entries, 'attrInfo:pathSplit.splitCurvatureAngle', locale).replace(
        text(entries, 'nodeAttrEnum:pathSplit.splitCondition.3', locale), 'Split Curvature Angle'));
    bad('attrInfo:pathSplit.splitProbability', locale,
      text(entries, 'attrInfo:pathSplit.splitProbability', locale).replace(
        text(entries, 'nodeAttrEnum:pathSplit.splitCondition.2', locale), 'Random'));
    bad('nodeAttrEnum:pathSplit.branchArcDirection.0', locale,
      text(entries, 'nodeAttrEnum:pathSplit.branchArcDirection.0', locale).replace(TOKEN.clockwise[locale], TOKEN.counterClockwise[locale]));
    const numberText = text(entries, 'nodeAttrEnum:barChart.dataType.0', locale);
    bad('nodeAttrEnum:barChart.dataType.1', locale, numberText);
    bad('nodeAttr:barChart.maximumHeight', locale, text(entries, 'nodeAttr:barChart.barWidth', locale));
    bad('nodeAttr:barChart.gapBetweenStacks', locale, text(entries, 'nodeAttr:barChart.gapBetweenBars', locale));
    bad('nodeAttrEnum:ditheringFilter.greyscaleMode.3', locale, 'Value');
    bad('nodeAttr:fourPointWarp.corner0.tangentIn', locale,
      text(entries, 'nodeAttr:fourPointWarp.corner0.tangentOut', locale));
  }
  return rejected;
}

module.exports = {
  LOCALES,
  OWNER_COUNTS,
  assertSemanticBaseline,
  assertSemanticMutants,
  findEntry,
};
