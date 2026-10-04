#!/usr/bin/env node
/**
 * [INPUT]: 依赖 soundLegacy 的源绑定审批数据、native_language_pack 显示投影与三语格式门。
 * [OUTPUT]: 锁定旧场景完整48键、独有最大dB与兼容说明、声像/阈值/采样关系、技术保留及当前标签引用。
 * [POS]: tools 的旧版 Sound 离线合同；不从新版 Sound 推断旧场景行为一致，不读取App或用户配置。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { test } = require('node:test');
const { collectNativeCatalog, resolveTranslations, renderNativePack } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const legacy = () => require('../languages/native/nodes_sound_legacy.js');
const LOCALES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text = (key, locale) => legacy().entries.find(entry => entry.key === key).translations[locale].text;
const key = attribute => `attrInfo:soundLegacy.${attribute}`;
const TECHNICAL = {
  'nodeAttrEnum:soundLegacy.frequencyScale.1': 'Mel',
  'nodeAttrEnum:soundLegacy.frequencyScale.2': 'Bark',
};

// -- 同源显示关系只验文本；不声明两个节点的音频计算相同 ------------
const RELATIONS = {
  'zh-Hans': {
    playbackPan: /左声道（负值）.*右声道（正值）/,
    clipping: /低于此阈值的值.*忽略/,
    smoothingFrames: /2.*当前帧与(?:其)?前一帧.*平均/,
    subSteps: /0 表示每帧采样一次.*1 表示在 (?:第 )?0\.5、1 和 1\.5 帧处采样.*平均/,
    weightingGraph: /0.*频段静音.*1.*(?:翻倍|加倍).*0\.5.*保持不变/,
    maxDb: /素材中找到的最大 dB 值/,
    eqGraph: /单独选择各频段/,
  },
  'zh-Hant': {
    playbackPan: /左聲道（負值）.*右聲道（正值）/,
    clipping: /低於此閾值的值.*忽略/,
    smoothingFrames: /2.*(?:目前|當前)幀與(?:其)?前一幀.*平均/,
    subSteps: /0 表示每幀取樣一次.*1 表示在 (?:第 )?0\.5、1 和 1\.5 幀處取樣.*平均/,
    weightingGraph: /0.*頻段靜音.*1.*加倍.*0\.5.*保持不變/,
    maxDb: /素材中找到的最大 dB 值/,
    eqGraph: /個別選取各頻段/,
  },
  ja_JP: {
    playbackPan: /左（負の値）.*右（正の値）/,
    clipping: /しきい値を下回る値.*無視/,
    smoothingFrames: /2.*現在のフレームとその(?:直)?前のフレーム.*平均化/,
    subSteps: /0 はフレームごとに 1 回サンプリング.*1 は (?:フレーム )?0\.5、1、1\.5(?: フレーム)?でサンプリング.*平均化/,
    weightingGraph: /0 はバンドをミュート.*1 は 2 倍.*0\.5.*変更し(?:ません|ない)/,
    maxDb: /アセット内で見つかった最大 dB 値/,
    eqGraph: /周波数バンドを個別に選択/,
  },
};
function assertRelations(locale, readText) {
  for (const [attribute, guard] of Object.entries(RELATIONS[locale])) {
    assert.match(readText(key(attribute)), guard, `${attribute}/${locale} relationship changed`);
  }
}

test('Sound Legacy binds all 48 official source leaves and their full contextual identity', () => {
  const { entries, provenance } = legacy();
  assert.equal(entries.length, 48);
  assert.equal(new Set(entries.map(entry => entry.key)).size, 48);
  assert.ok(entries.every(entry => entry.owner === 'soundLegacy' && entry.dontTranslate === false));
  assert.deepEqual(entries.map(entry => entry.key), entries.map(entry => entry.key).sort());
  assert.equal(provenance.sourceSha256, 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0');
  assert.equal(provenance.vendorJapaneseSha256, '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439');
  assert.equal(digest(entries.map(entry => [entry.key, entry.source])),
    '067a94eb724190671cdf14128c5fa663a2c7a728432a0cb79f095952a15ad5af');
  assert.equal(digest(entries.map(entry => [entry.key, entry.owner, entry.fieldPath, entry.source, entry.notes])),
    'd6d11289ade9869f35d1f3d8ee614df228dcd34c2a50aa30767d31e730a7bd4f');
  assert.deepEqual(Object.fromEntries([...new Set(entries.map(entry => entry.displayRole))]
    .map(role => [role, entries.filter(entry => entry.displayRole === role).length])), {
    'attribute-info': 19, 'attribute-label': 19, 'enum-label': 4,
    'node-info': 1, 'node-name': 1, 'tab-label': 1, 'notification-text': 3,
  });
});

test('Sound Legacy has all 144 explicit decisions and preserves only Mel and Bark', () => {
  for (const entry of legacy().entries) for (const locale of LOCALES) {
    const decision = entry.translations[locale];
    assert.equal(decision.decision, TECHNICAL[entry.key] ? 'preserve' : 'translate');
    assert.equal(typeof decision.text, 'string');
    assert.ok(decision.text.trim());
    if (TECHNICAL[entry.key]) {
      assert.equal(entry.source, TECHNICAL[entry.key]);
      assert.equal(decision.text, entry.source);
    }
    assertNativeTranslationFormat(entry.source, decision.text);
  }
});

test('Sound Legacy keeps its compatibility explanation and maximum dB instead of current-only analysis controls', () => {
  const { entries } = legacy();
  for (const attribute of ['autoNormalise', 'startAtZero', 'dbRange', 'mode', 'levelType', 'channel']) {
    assert.ok(!entries.some(entry => entry.key === `nodeAttr:soundLegacy.${attribute}`));
  }
  assert.match(text('nodeInfo:soundLegacy', 'zh-Hans'), /旧版.*音频分析.*修正.*前.*场景/);
  assert.match(text('nodeInfo:soundLegacy', 'zh-Hant'), /舊版.*音訊分析.*修正.*前.*場景/);
  assert.match(text('nodeInfo:soundLegacy', 'ja_JP'), /レガシー.*解析.*修正される前.*シーン/);
  for (const locale of LOCALES) {
    assert.match(text(key('maxDb'), locale), /dB/);
    assert.match(text('nodeAttr:soundLegacy.clipping', locale), locale === 'ja_JP' ? /しきい値/ : /阈值|閾值/);
    assert.doesNotMatch(text('nodeAttr:soundLegacy.clipping', locale), /削波|クリッピング/);
    assert.match(text(key('playbackVolume'), locale), locale === 'ja_JP' ? /クリッピング/ : /削波/);
  }
});

test('Sound Legacy frequency enum positions and translated tooltip labels stay aligned', () => {
  const keys = [0, 1, 2, 3].map(index => `nodeAttrEnum:soundLegacy.frequencyScale.${index}`);
  for (const locale of LOCALES) {
    assert.deepEqual(keys.map(entryKey => text(entryKey, locale)),
      [locale === 'ja_JP' ? '対数' : locale === 'zh-Hant' ? '對數' : '对数', 'Mel', 'Bark', locale === 'ja_JP' ? 'リニア' : locale === 'zh-Hant' ? '線性' : '线性']);
    const refs = { frequencyScale: keys, length: ['nodeAttr:soundLegacy.file'],
      maxDb: ['nodeAttr:soundLegacy.file'], outActiveBands: ['nodeAttr:soundLegacy.eqGraph'],
      playAudio: ['nodeAttr:soundLegacy.file'], weightingGraph: ['nodeAttr:soundLegacy.frequencyRange'] };
    for (const [attribute, labels] of Object.entries(refs)) {
      const bold = [...text(key(attribute), locale).matchAll(/<b>(.*?)<\/b>/g)].map(match => match[1]).sort();
      assert.deepEqual(bold, labels.map(entryKey => text(entryKey, locale)).sort());
    }
  }
});

test('Sound Legacy preserves all directional, threshold, averaging and weighting relationships', () => {
  for (const locale of LOCALES) {
    assertRelations(locale, entryKey => text(entryKey, locale));
    for (const token of ['P', '0..1', 'L..H', '0.5']) assert.ok(text(key('weightingGraph'), locale).includes(token));
    for (const token of ['20 Hz', '20,000 Hz']) assert.ok(text(key('frequencyRange'), locale).includes(token));
  }
});

test('Sound Legacy semantic checks reject actual reversed relations, not just missing numbers', () => {
  for (const [attribute, from, to] of [
    ['playbackPan', '左声道（负值）', '左声道（正值）'],
    ['clipping', '低于此阈值', '高于此阈值'],
    ['smoothingFrames', '其前一帧', '其后一帧'],
    ['subSteps', '0 表示每帧采样一次', '0 表示每两帧采样一次'],
    ['weightingGraph', '1 为翻倍', '1 为保持不变'],
    ['maxDb', '素材中找到的最大', '素材中找到的最小'],
    ['eqGraph', '单独选择各频段', '物理拆分各频段'],
  ]) {
    const original = text(key(attribute), 'zh-Hans');
    assert.ok(original.includes(from), `${attribute} must mutate a real substring`);
    const mutated = original.replace(from, to);
    assert.throws(() => assertRelations('zh-Hans', entryKey =>
      entryKey === key(attribute) ? mutated : text(entryKey, 'zh-Hans')), /relationship changed/);
  }
});

test('Sound Legacy projects only display keys and keeps model identity plus vendor Japanese priority', () => {
  const { entries } = legacy();
  const value = { nodeType: 'soundLegacy', modelIdentity: 'legacy-audio-model' };
  for (const entry of entries) {
    let target = value;
    for (const part of entry.fieldPath.slice(0, -1)) target = target[part] ??= {};
    target[entry.fieldPath.at(-1)] = { 'UI-text': entry.source, notes: entry.notes };
  }
  const source = [{ type: 'nodeStrings', value }];
  const before = structuredClone(source);
  const vendor = [{ type: 'nodeStrings', value: { nodeType: 'soundLegacy', info: { name: { 'UI-text': 'メーカーの旧サウンド' } } } }];
  const catalog = collectNativeCatalog('sound-legacy-fixture', source, vendor);
  assert.equal(catalog.entries.length, 48); assert.equal(catalog.unmapped.length, 0);
  for (const locale of LOCALES) {
    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[locale] }));
    const resolution = resolveTranslations(catalog.entries, locale, reviews);
    const pack = JSON.parse(renderNativePack(resolution));
    assert.ok(resolution.rows.every(row => ['reviewed', 'preserved', 'vendor'].includes(row.status)));
    assert.equal(Object.keys(pack[0].value).length, 48);
    for (const entry of entries) assert.deepEqual(pack[0].value[entry.key], { 'UI-text':
      locale === 'ja_JP' && entry.key === 'nodeName:soundLegacy' ? 'メーカーの旧サウンド' : entry.translations[locale].text });
    assert.deepEqual(source, before);
    assert.equal(source[0].value.modelIdentity, 'legacy-audio-model');
  }
});
