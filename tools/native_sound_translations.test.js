#!/usr/bin/env node
/**
 * [INPUT]: 依赖官方 Sound 显示域的源绑定审批数据、native_language_pack 投影与三语格式门。
 * [OUTPUT]: 锁定完整65键/上下文身份、三语技术名保留、音频数值语义、当前标签引用及厂商日语优先。
 * [POS]: tools 的 Sound owner 离线合同；不读取厂商App或用户profile，不把数据审批当现场显示证明。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { test } = require('node:test');
const { collectNativeCatalog, resolveTranslations, renderNativePack } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const sound = () => require('../languages/native/nodes_sound.js');
const LOCALES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const TECHNICAL_SOURCES = {
  'nodeAttrEnum:sound.frequencyScale.1': 'Mel',
  'nodeAttrEnum:sound.frequencyScale.2': 'Bark',
  'nodeAttrEnum:sound.levelType.0': 'RMS',
};
const TECHNICAL_KEYS = new Set(Object.keys(TECHNICAL_SOURCES));
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text = (key, locale) => sound().entries.find(entry => entry.key === key).translations[locale].text;


// -- 关系比数值存在更重要：不能把倍增、方向或阈值上下界翻反 --------
const SEMANTIC_GUARDS = {
  'zh-Hans': {
    weightingGraph: /0 会使频段静音.*1 为翻倍.*0\.5.*保持不变/,
    playbackPan: /左声道（负值）.*右声道（正值）/,
    subSteps: /0 表示每帧采样一次.*1 表示在 0\.5、1 和 1\.5 帧处采样并计算平均值/,
    smoothingFrames: /2.*当前帧与其前一帧取平均/,
    clipping: /低于此阈值的值.*忽略/,
    startAtZero: /从每个值中减去.*最小 dB.*处于 0.*不会压缩/,
    autoNormalise: /应用.*数值偏移.*和强度之前.*峰值.*H.*0-1/,
    eqGraph: /单独选择各频段/,
  },
  'zh-Hant': {
    weightingGraph: /0 會使頻段靜音.*1 為加倍.*0\.5.*保持不變/,
    playbackPan: /左聲道（負值）.*右聲道（正值）/,
    subSteps: /0 表示每幀取樣一次.*1 表示在 0\.5、1 和 1\.5 幀處取樣並計算平均值/,
    smoothingFrames: /2.*目前幀與其前一幀進行平均/,
    clipping: /低於此閾值的值.*忽略/,
    startAtZero: /從每個值中減去.*最小 dB.*處於 0.*不會壓縮/,
    autoNormalise: /套用.*數值偏移.*和強度之前.*峰值.*H.*0-1/,
    eqGraph: /個別選取各頻段/,
  },
  ja_JP: {
    weightingGraph: /0 はバンドをミュート.*1 は 2 倍.*0\.5.*変更しません/,
    playbackPan: /左（負の値）.*右（正の値）/,
    subSteps: /0 はフレームごとに 1 回サンプリング.*1 は 0\.5、1、1\.5 フレームでサンプリング.*平均化/,
    smoothingFrames: /2.*現在のフレームとその直前のフレーム.*平均化/,
    clipping: /しきい値を下回る値.*無視/,
    startAtZero: /各値から.*最小 dB.*減算.*圧縮することなく.*0/,
    autoNormalise: /値オフセット.*と強度が適用される前.*ピーク.*H.*0-1/,
    eqGraph: /周波数バンドを個別に選択/,
  },
};
function assertSoundSemantics(locale, readText) {
  for (const [attribute, guard] of Object.entries(SEMANTIC_GUARDS[locale])) {
    assert.match(readText(`attrInfo:sound.${attribute}`), guard, `${attribute}/${locale} relationship changed`);
  }
}

test('Sound covers all 65 immutable official source leaves and their contextual identities', () => {
  const { entries, provenance } = sound();
  assert.equal(provenance.sourceSha256, 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0');
  assert.equal(provenance.vendorJapaneseSha256, '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439');
  assert.equal(entries.length, 65);
  assert.equal(new Set(entries.map(entry => entry.key)).size, 65);
  assert.ok(entries.every(entry => entry.owner === 'sound' && entry.dontTranslate === false));
  assert.deepEqual(entries.map(entry => entry.key), entries.map(entry => entry.key).sort());
  assert.equal(digest(entries.map(entry => [entry.key, entry.source])),
    '6a670055d3980a696a6c221944d0e1a09616f55360618753f6bc11d696c9c7f9');
  assert.equal(digest(entries.map(entry => [entry.key, entry.owner, entry.fieldPath, entry.source, entry.notes])),
    '7760791f91076ba2ad1590755c491d4ad1468d51f668d8fff7f404e31f4fdee8');
  assert.deepEqual(Object.fromEntries([...new Set(entries.map(entry => entry.displayRole))]
    .map(role => [role, entries.filter(entry => entry.displayRole === role).length])), {
    'attribute-info': 24, 'attribute-label': 24, 'enum-label': 11,
    'node-info': 1, 'node-name': 1, 'tab-label': 1, 'notification-text': 3,
  });
});

test('Sound has explicit three-language decisions and preserves only evidenced technical names', () => {
  for (const entry of sound().entries) for (const locale of LOCALES) {
    const decision = entry.translations[locale];
    assert.equal(decision.decision, TECHNICAL_KEYS.has(entry.key) ? 'preserve' : 'translate');
    assert.equal(typeof decision.text, 'string');
    assert.ok(decision.text.trim(), `${entry.key}/${locale} is empty`);
    if (TECHNICAL_KEYS.has(entry.key)) {
      assert.equal(entry.source, TECHNICAL_SOURCES[entry.key]);
      assert.equal(decision.text, entry.source);
    }
    assertNativeTranslationFormat(entry.source, decision.text);
  }
});

test('Sound labels distinguish stereo position, output baseline and threshold filtering', () => {
  assert.equal(text('nodeAttr:sound.playbackPan', 'zh-Hans'), '声像');
  assert.equal(text('nodeAttr:sound.playbackPan', 'zh-Hant'), '聲像');
  assert.equal(text('nodeAttr:sound.autoNormalise', 'zh-Hans'), '自动归一化');
  assert.match(text('nodeAttr:sound.clipping', 'ja_JP'), /しきい値/);
  assert.equal(text('nodeAttr:sound.clipping', 'zh-Hans'), '音量阈值');
  assert.equal(text('nodeAttr:sound.clipping', 'zh-Hant'), '音量閾值');
  assert.doesNotMatch(text('nodeAttr:sound.clipping', 'ja_JP'), /クリッピング/);
  assert.match(text('attrInfo:sound.playbackVolume', 'ja_JP'), /クリッピング/);
  assert.match(text('nodeAttr:sound.startAtZero', 'zh-Hans'), /最低值归零/);
  assert.match(text('nodeAttr:sound.startAtZero', 'zh-Hant'), /最低值歸零/);
  assert.match(text('nodeAttr:sound.startAtZero', 'ja_JP'), /最小値をゼロに/);
});

test('Sound enum indexes keep channel direction, frequency models and analysis modes', () => {
  const keys = [
    ...[0, 1, 2].map(index => `nodeAttrEnum:sound.channel.${index}`),
    ...[0, 1, 2, 3].map(index => `nodeAttrEnum:sound.frequencyScale.${index}`),
    ...[0, 1].map(index => `nodeAttrEnum:sound.levelType.${index}`),
    ...[0, 1].map(index => `nodeAttrEnum:sound.mode.${index}`),
  ];
  const expected = {
    'zh-Hans': ['单声道', '左', '右', '对数', 'Mel', 'Bark', '线性', 'RMS', '峰值', '频谱', '电平'],
    'zh-Hant': ['單聲道', '左', '右', '對數', 'Mel', 'Bark', '線性', 'RMS', '峰值', '頻譜', '電平'],
    ja_JP: ['モノラル', '左', '右', '対数', 'Mel', 'Bark', 'リニア', 'RMS', 'ピーク', 'スペクトル', 'レベル'],
  };
  for (const locale of LOCALES) assert.deepEqual(keys.map(key => text(key, locale)), expected[locale]);
});

test('Sound normalization, sampling and weighting keep their numeric meanings', () => {
  for (const locale of LOCALES) {
    assertSoundSemantics(locale, key => text(key, locale));
    const normalize = text('attrInfo:sound.autoNormalise', locale);
    assert.match(normalize, /0-1/);
    assert.match(normalize, /H/);
    const start = text('attrInfo:sound.startAtZero', locale);
    assert.match(start, /L/);
    assert.match(start, /0/);
    const sampling = text('attrInfo:sound.subSteps', locale);
    for (const value of ['0.5', '1.5']) assert.ok(sampling.includes(value));
    const weighting = text('attrInfo:sound.weightingGraph', locale);
    for (const value of ['P', '0..1', 'L..H', '0.5']) assert.ok(weighting.includes(value));
    assert.match(text('attrInfo:sound.frequencyRange', locale), /20 Hz/);
    assert.match(text('attrInfo:sound.frequencyRange', locale), /20,000 Hz/);
    assert.match(text('attrInfo:sound.smoothingFrames', locale), /2/);
    const pan = text('attrInfo:sound.playbackPan', locale);
    assert.match(pan, /左/); assert.match(pan, /右/);
  }
});


test('Sound semantic guards actually reject reversed relationships despite unchanged numbers', () => {
  const mutations = [
    ['weightingGraph', '1 为翻倍', '1 为保持不变'],
    ['playbackPan', '左声道（负值）', '左声道（正值）'],
    ['subSteps', '0 表示每帧采样一次', '0 表示每两帧采样一次'],
    ['smoothingFrames', '其前一帧', '其后一帧'],
    ['clipping', '低于此阈值', '高于此阈值'],
    ['startAtZero', '减去', '加上'],
    ['autoNormalise', '和强度之前', '和强度之后'],
    ['eqGraph', '单独选择各频段', '物理拆分各频段'],
  ];
  for (const [attribute, from, to] of mutations) {
    const key = `attrInfo:sound.${attribute}`;
    const original = text(key, 'zh-Hans');
    assert.ok(original.includes(from), `${attribute} must exercise a real mutation`);
    const changed = original.replace(from, to);
    assert.notEqual(changed, original);
    assert.throws(() => assertSoundSemantics('zh-Hans', candidateKey =>
      candidateKey === key ? changed : text(candidateKey, 'zh-Hans')), /relationship changed/);
  }
});

test('Sound rich-text references follow the current translated labels despite grammatical reordering', () => {
  const refs = {
    autoNormalise: ['nodeAttr:sound.dbRange', 'nodeAttr:sound.offset'],
    dbRange: ['nodeAttr:sound.file'], length: ['nodeAttr:sound.file'],
    frequencyScale: [0, 1, 2, 3].map(index => `nodeAttrEnum:sound.frequencyScale.${index}`),
    levelType: ['nodeAttr:sound.mode', 'nodeAttrEnum:sound.levelType.0', 'nodeAttrEnum:sound.levelType.1'],
    mode: ['nodeAttrEnum:sound.mode.0', 'nodeAttrEnum:sound.mode.1'],
    outActiveBands: ['nodeAttr:sound.eqGraph'], playAudio: ['nodeAttr:sound.file'],
    startAtZero: ['nodeAttr:sound.dbRange'], weightingGraph: ['nodeAttr:sound.frequencyRange'],
  };
  for (const locale of LOCALES) for (const [attribute, keys] of Object.entries(refs)) {
    const bold = [...text(`attrInfo:sound.${attribute}`, locale).matchAll(/<b>(.*?)<\/b>/g)]
      .map(match => match[1]).sort();
    assert.deepEqual(bold, keys.map(key => text(key, locale)).sort(), `${attribute}/${locale}`);
  }
});

// -- 合成投影仅验显示边界；实际源对齐由官方摘要锁 producer 复核 --------
test('Sound display projection preserves model identity and gives vendor Japanese priority on translatable keys', () => {
  const { entries } = sound();
  const value = { nodeType: 'sound', modelIdentity: 'sound-model-identity' };
  for (const entry of entries) {
    let target = value;
    for (const part of entry.fieldPath.slice(0, -1)) target = target[part] ??= {};
    target[entry.fieldPath.at(-1)] = { 'UI-text': entry.source, notes: entry.notes };
  }
  const source = [{ type: 'nodeStrings', value }];
  const vendorJapanese = [{ type: 'nodeStrings', value: { nodeType: 'sound',
    info: { name: { 'UI-text': 'メーカーの音声名' } },
  } }];
  const before = structuredClone(source);
  const catalog = collectNativeCatalog('sound-fixture', source, vendorJapanese);
  assert.equal(catalog.entries.length, 65);
  assert.equal(catalog.unmapped.length, 0);
  for (const locale of LOCALES) {
    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[locale] }));
    const resolution = resolveTranslations(catalog.entries, locale, reviews);
    const pack = JSON.parse(renderNativePack(resolution));
    assert.ok(resolution.rows.every(row => ['reviewed', 'preserved', 'vendor'].includes(row.status)));
    assert.equal(Object.keys(pack[0].value).length, 65);
    for (const entry of entries) {
      const expected = locale === 'ja_JP' && entry.key === 'nodeName:sound'
        ? 'メーカーの音声名' : entry.translations[locale].text;
      assert.deepEqual(pack[0].value[entry.key], { 'UI-text': expected });
    }
    assert.deepEqual(source, before);
    assert.equal(source[0].value.modelIdentity, 'sound-model-identity');
    assert.equal(source[0].value.info.name['UI-text'], 'Sound');
    assert.equal(pack[0].type, 'strings');
    assert.equal(pack[0].value['nodeName:sound']['UI-text'], locale === 'ja_JP' ? 'メーカーの音声名' : text('nodeName:sound', locale));
  }
});
