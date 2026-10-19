/**
 * [INPUT]: 依赖合成Directional Blur definition、SHA锁定source helper、显式审批module及native producer。
 * [OUTPUT]: 验证schema/row身份、原始bytes的SHA拒绝门、三语producer projection与撤批missing。
 * [POS]: 独立插件caption域合同；不内嵌厂商definition字节，真实raw正例由assets-root验收闭合。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const supplement = require('./native_plugin_caption_supplement');
const { buildNativeResourceBundle } = require('./native_resource_bundle');
const moduleData = require('../languages/native/plugin_caption_supplement');
const { APPROVED_MODULES, approvedEntries } = require('../languages/native/approved_modules');

const KEY = 'nodeAttr:sceneGroup::directionalBlurFilter.amount';
const LOCALES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const values = Object.freeze({ 'zh-Hans': '模糊量', 'zh-Hant': '模糊量', ja_JP: 'ぼかし量' });
const definitionFixture = [{ author: 'sceneGroup', type: 'directionalBlurFilter', superType: 'thirdPartyFilter',
  attributes: { amount: { type: 'double', default: 10, min: 0, max: 250, step: 1 } },
  UI: { attributeOrder: ['angle', 'amount'] },
}];
const syntheticBytes = Buffer.from(JSON.stringify(definitionFixture));
const pairs = [{ id: 'Definitions/Translation/appStrings',
  source: [{ type: 'strings', value: { identity: { 'UI-text': 'ABI-ID', dontTranslate: true } } }],
  japanese: [{ type: 'strings', value: {} }],
}];

function withoutKey(pack, key) {
  const records = JSON.parse(pack);
  delete records[0].value[key];
  return `${JSON.stringify(records, null, 2)}\n`;
}

test('Directional Blur source bytes bind exactly one verified caption identity', () => {
  assert.equal(APPROVED_MODULES.filter(name => name === 'plugin_caption_supplement').length, 1);
  assert.equal(approvedEntries().filter(row => row.key === KEY).length, 1);
  assert.match(supplement.SOURCE_SHA256, /^[a-f0-9]{64}$/);
  supplement.validateDefinition(definitionFixture);
  const rows = supplement.validatePluginCaptionEntries(supplement.FIXED_SOURCE_ROWS);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], supplement.FIXED_SOURCE_ROWS[0]);
  assert.deepEqual([rows[0].key, rows[0].source, rows[0].owner, rows[0].fieldPath], [
    KEY, 'Amount', 'sceneGroup::directionalBlurFilter', ['attributes', 'amount'],
  ]);
  assert.throws(() => supplement.sourceEntries(syntheticBytes), /SHA-256/);
  assert.throws(() => supplement.validatePluginCaptionEntries(rows, [{ key: KEY }]), /collision/);
  assert.throws(() => supplement.validatePluginCaptionEntries([{ ...rows[0], source: 'Blur Amount' }]), /identity/);
  const changedDefinition = structuredClone(definitionFixture);
  changedDefinition[0].attributes.amount.max = 200;
  assert.throws(() => supplement.validateDefinition(changedDefinition), /schema/);
});

test('approved caption projects through the resource producer and removing it preserves old output', () => {
  const sources = supplement.validatePluginCaptionEntries(supplement.FIXED_SOURCE_ROWS);
  const approved = moduleData.entries;
  assert.equal(approved.length, 1);
  assert.equal(approved[0].key, KEY);
  const before = buildNativeResourceBundle(pairs, []);
  const current = buildNativeResourceBundle(pairs, approved, undefined, sources);
  assert.equal(current.manifest.nativeKeys, before.manifest.nativeKeys + 1);
  assert.equal(current.manifest.supplementalKeys, 1);
  assert.equal(current.manifest.approvedUIKeys, 1);
  assert.equal(current.manifest.complete, true);
  for (const locale of LOCALES) {
    const projected = JSON.parse(current.packs[locale])[0].value;
    assert.deepEqual(projected[KEY], { 'UI-text': values[locale] });
    assert.equal(withoutKey(current.packs[locale], KEY), before.packs[locale], `${locale} old projection`);
    assert.deepEqual(JSON.parse(current.packs[locale])[0].value.identity, { 'UI-text': 'ABI-ID' });
  }
});

test('missing approval leaves the exact supplement unprojected and reports one missing key', () => {
  const { manifest, packs } = buildNativeResourceBundle(pairs, [], undefined,
    supplement.validatePluginCaptionEntries(supplement.FIXED_SOURCE_ROWS));
  assert.equal(manifest.nativeKeys, 2);
  assert.equal(manifest.supplementalKeys, 1);
  assert.equal(manifest.approvedUIKeys, 0);
  assert.equal(manifest.complete, false);
  for (const locale of LOCALES) {
    assert.equal(manifest.packs[locale].missing, 1);
    assert.equal(JSON.parse(packs[locale])[0].value[KEY], undefined);
  }
});

test('module translations reuse the approved Directional Blur Blur Amount caption only', () => {
  const sourceApproval = require('../languages/native/plugins_directional_blur').entries
    .find(row => row.key === 'nodeAttr:sceneGroup::directionalBlurFilter.blurAmount');
  assert.ok(sourceApproval);
  assert.deepEqual(LOCALES.map(locale => sourceApproval.translations[locale].text), LOCALES.map(locale => values[locale]));
  assert.deepEqual(LOCALES.map(locale => moduleData.entries[0].translations[locale].text),
    LOCALES.map(locale => values[locale]));
  assert.equal(moduleData.provenance.liveConsumerVerified, false);
  assert.equal(moduleData.provenance.reusedApprovedKey, sourceApproval.key);
});
