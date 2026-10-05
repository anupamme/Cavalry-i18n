/**
 * [INPUT]: 依赖 native_resource_bundle 的纯生成入口、合成官方catalog/审定数据及固定schema补充源记录。
 * [OUTPUT]: 验证三语显示工件、DNT身份一致性、厂商默认优先/有限纠错、格式拒绝与官方/补充来源分计数和碰撞拒绝。
 * [POS]: macOS native UI 接线的构建边界合同；补充测试只证明有限8键producer契约，不审批译文/不证明实际显示。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildNativeResourceBundle } = require('./native_resource_bundle');
const { createHash } = require('node:crypto');
const sha = value => createHash('sha256').update(value).digest('hex');
function fixture() {
  const pairs = [{ id: 'Definitions/Translation/appStrings',
    source: [{ type: 'strings', value: {
      hello: { 'UI-text': 'Hello {0}', notes: ['Greeting'] },
      vendor: { 'UI-text': 'Done' },
      identity: { 'UI-text': 'MSAA', dontTranslate: true },
      missing: { 'UI-text': 'Missing' },
    } }],
    japanese: [{ type: 'strings', value: {
      hello: { 'UI-text': 'Hello {0}' }, vendor: { 'UI-text': '完了' },
      identity: { 'UI-text': 'MSAA' }, missing: { 'UI-text': 'Missing' },
    } }],
  }];
  const approved = [{ key: 'hello', source: 'Hello {0}', notes: ['Greeting'], translations: {
    'zh-Hans': { decision: 'translate', text: '你好 {0}' },
    'zh-Hant': { decision: 'translate', text: '你好 {0}' },
    ja_JP: { decision: 'translate', text: 'こんにちは {0}' },
  } }];
  return { pairs, approved };
}
test('native build emits one-language display-only previews with honest fallback counts', () => {
  const { pairs, approved } = fixture();
  const { manifest, packs } = buildNativeResourceBundle(pairs, approved);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.kind, 'development-preview');
  assert.equal(manifest.cavalryVersion, '2.8.0');
  assert.equal(manifest.approvedUIKeys, 1);
  assert.equal(manifest.nativeKeys, 4);
  assert.equal(manifest.supplementalKeys, 0);
  assert.equal(manifest.complete, false);
  for (const [code, locale] of [['zh-Hans', 'zh-Hans'], ['zh-Hant', 'zh-Hant'], ['ja_JP', 'ja']]) {
    const pack = JSON.parse(packs[code]);
    assert.deepEqual(Object.keys(pack[0]).sort(), ['language', 'type', 'value']);
    assert.equal(pack[0].language, locale);
    assert.equal(pack[0].type, 'strings');
    assert.deepEqual(pack[0].value.identity, { 'UI-text': 'MSAA' });
    assert.equal(pack[0].value.missing, undefined);
    assert.equal(manifest.packs[code].sha256, sha(packs[code]));
    assert.equal(manifest.packs[code].bytes, Buffer.byteLength(packs[code]));
    assert.equal(manifest.packs[code].missing, code === 'ja_JP' ? 1 : 2);
  }
  assert.deepEqual(JSON.parse(packs.ja_JP)[0].value.vendor, { 'UI-text': '完了' });
});
test('native build rejects duplicate/unknown reviews instead of silently omitting them', () => {
  const { pairs, approved } = fixture();
  assert.throws(() => buildNativeResourceBundle(pairs, [...approved, approved[0]]), /duplicate/);
  assert.throws(() => buildNativeResourceBundle(pairs, [{ ...approved[0], key: 'unknown' }]), /unknown/);
});
test('approved Japanese vendor correction reaches the pack without changing manifest shape or official source', () => {
  const { pairs, approved } = fixture();
  const { collectNativeCatalog, nativeSourceIdentitySha256 } = require('./native_language_pack');
  const source = collectNativeCatalog(pairs[0].id, pairs[0].source, pairs[0].japanese).entries.find(row => row.key === 'vendor');
  approved.push({ ...source, translations: {
    'zh-Hans': { decision: 'translate', text: '完成' },
    'zh-Hant': { decision: 'translate', text: '完成' },
    ja_JP: { decision: 'translate', text: '完了しました', vendorCorrection: {
      approvedBy: 'primary-agent', approvalState: 'approved-source-bound-vendor-correction',
      sourceIdentitySha256: nativeSourceIdentitySha256(source), vendorJapanese: '完了',
      translationSha256: sha('完了しました'),
      approvalReceiptSha256: 'a'.repeat(64),
    } },
  } });
  const before = JSON.stringify({ pairs, approved });
  const trusted = [{ key: source.key,
    sourceIdentitySha256: nativeSourceIdentitySha256(source),
    translationSha256: sha('完了しました'), approvalReceiptSha256: 'a'.repeat(64) }];
  assert.throws(() => buildNativeResourceBundle(pairs, approved), /vendor correction/i);
  const { manifest, packs } = buildNativeResourceBundle(pairs, approved, trusted);
  assert.equal(JSON.parse(packs.ja_JP)[0].value.vendor['UI-text'], '完了しました');
  assert.equal(manifest.packs.ja_JP.vendor, 1, 'vendor counts source-origin slots, including approved corrections');
  assert.equal(manifest.packs.ja_JP.reviewed, 1);
  assert.deepEqual(Object.keys(manifest.packs.ja_JP).sort(),
    ['file', 'nativeLocale', 'sha256', 'bytes', 'reviewed', 'preserved', 'vendor', 'missing'].sort());
  assert.equal(JSON.stringify({ pairs, approved }), before);
});
test('locale payloads cannot override approved key/source or introduce hidden decision fields', () => {
  const { pairs, approved } = fixture();
  for (const language of ['zh-Hans', 'zh-Hant', 'ja_JP']) {
    for (const delta of [{ key: 'vendor' }, { source: 'Done' }, { extra: 'hidden' }]) {
      const changed = structuredClone(approved);
      Object.assign(changed[0].translations[language], delta);
      assert.throws(() => buildNativeResourceBundle(pairs, changed), /locale.*decision/i);
    }
  }
});
test('native build binds the current source, notes, owner and field path before publishing', () => {
  const { pairs, approved } = fixture();
  for (const delta of [{ source: 'Hello' }, { notes: [] }, { owner: 'wrong' }, { fieldPath: ['wrong'] }, { catalogId: 'wrong' }]) {
    assert.throws(() => buildNativeResourceBundle(pairs, [{ ...approved[0], ...delta }]), /differs/);
  }
});
test('native build refuses malformed format and incomplete locale decisions', () => {
  const { pairs, approved } = fixture();
  const broken = structuredClone(approved);
  broken[0].translations['zh-Hans'].text = '你好';
  assert.throws(() => buildNativeResourceBundle(pairs, broken), /format|argument|placeholder/i);
  delete broken[0].translations['zh-Hans'];
  assert.throws(() => buildNativeResourceBundle(pairs, broken), /locale|decision/i);
});
test('native build is deterministic under input ordering, and never changes catalogs or reviews', () => {
  const { pairs, approved } = fixture();
  const before = JSON.stringify({ pairs, approved });
  const first = buildNativeResourceBundle(pairs, approved);
  const second = buildNativeResourceBundle([...pairs].reverse(), [...approved].reverse());
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify({ pairs, approved }), before);
});
test('native build rejects unknown display families and global key collisions', () => {
  const { pairs, approved } = fixture();
  assert.throws(() => buildNativeResourceBundle([...pairs, { ...pairs[0], id: 'other' }], approved), /duplicate/);
  const broken = structuredClone(pairs);
  broken[0].source = [{ type: 'nodeStrings', value: { nodeType: 'example', future: { 'UI-text': 'Future' } } }];
  broken[0].japanese = [];
  assert.throws(() => buildNativeResourceBundle(broken, []), /unmapped/);
});
test('schema supplements are a fixed source-only eight-key partition with separate counts', () => {
  const { pairs, approved } = fixture();
  const { FIXED_SOURCE_ROWS } = require('./native_schema_supplement');
  const supplements = FIXED_SOURCE_ROWS.map(row => ({ ...row, fieldPath: [...row.fieldPath], notes: [...row.notes] }));
  const { manifest, packs } = buildNativeResourceBundle(pairs, approved, undefined, supplements);
  assert.equal(manifest.nativeKeys, 12);
  assert.equal(manifest.supplementalKeys, 8);
  assert.equal(manifest.approvedUIKeys, 1, 'source-only supplement rows do not become approvals');
  assert.equal(manifest.packs['zh-Hans'].missing, 10);
  assert.equal(manifest.packs['zh-Hant'].missing, 10);
  assert.equal(manifest.packs.ja_JP.missing, 9);
  for (const pack of Object.values(packs)) {
    const value = JSON.parse(pack)[0].value;
    assert.equal(value['nodeAttr:forgeDynamicsShape.time'], undefined, 'unreviewed supplement stays omitted');
    assert.equal(Object.keys(value).length < 12, true);
  }
});
test('schema supplements reject partial, altered, foreign, duplicate and official-colliding identities', () => {
  const { pairs, approved } = fixture();
  const { FIXED_SOURCE_ROWS } = require('./native_schema_supplement');
  const supplements = FIXED_SOURCE_ROWS.map(row => ({ ...row, fieldPath: [...row.fieldPath], notes: [...row.notes] }));
  assert.throws(() => buildNativeResourceBundle(pairs, approved, undefined, supplements.slice(0, 7)), /exactly eight|eight source/i);
  for (const delta of [
    { key: 'nodeAttr:otherOwner.time' },
    { owner: 'shape' },
    { source: 'Clock' },
    { fieldPath: ['attributes', 'other'] },
    { catalogId: 'Definitions/Translation/nodeStrings' },
    { dontTranslate: true },
    { extra: 'unaudited' },
  ]) {
    const changed = supplements.map(row => ({ ...row, fieldPath: [...row.fieldPath], notes: [...row.notes] }));
    Object.assign(changed[0], delta);
    assert.throws(() => buildNativeResourceBundle(pairs, approved, undefined, changed), /supplement|schema|identity|source/i);
  }
  const duplicate = [...supplements, supplements[0]];
  assert.throws(() => buildNativeResourceBundle(pairs, approved, undefined, duplicate), /exactly eight|duplicate/i);
  const collidingPairs = structuredClone(pairs);
  collidingPairs[0].source[0].value['nodeAttr:forgeDynamicsShape.time'] = { 'UI-text': 'Time' };
  collidingPairs[0].japanese[0].value['nodeAttr:forgeDynamicsShape.time'] = { 'UI-text': 'Time' };
  assert.throws(() => buildNativeResourceBundle(collidingPairs, approved, undefined, supplements), /collision|duplicate/i);
});
test('supplement approvals bind dontTranslate and normalize an omitted false flag', () => {
  const { pairs } = fixture();
  const { FIXED_SOURCE_ROWS } = require('./native_schema_supplement');
  const supplements = FIXED_SOURCE_ROWS.map(row => ({ ...row, fieldPath: [...row.fieldPath], notes: [...row.notes] }));
  const source = supplements[0];
  const approval = {
    ...structuredClone(source),
    translations: {
      'zh-Hans': { decision: 'translate', text: '时间' },
      'zh-Hant': { decision: 'translate', text: '時間' },
      ja_JP: { decision: 'translate', text: '時間' },
    },
  };
  const absentDnt = structuredClone(approval);
  delete absentDnt.dontTranslate;
  assert.equal(buildNativeResourceBundle(pairs, [absentDnt], undefined, supplements).manifest.packs['zh-Hans'].reviewed, 1);
  assert.throws(() => buildNativeResourceBundle(pairs, [{ ...approval, dontTranslate: true }], undefined, supplements), /dontTranslate/i);
  assert.throws(() => buildNativeResourceBundle(pairs, [{ ...approval, dontTranslate: 'false' }], undefined, supplements), /dontTranslate.*boolean/i);
});
test('native preview build rejects stale approval or target input instead of recompiling old packs', () => {
  const { validateBuildFreshness } = require('./native_resource_bundle');
  const manifest = { inputSha256: 'a'.repeat(64), targetSha256: 'b'.repeat(64) };
  assert.equal(validateBuildFreshness(manifest, 'a'.repeat(64), 'b'.repeat(64)), true);
  assert.throws(() => validateBuildFreshness(manifest, 'c'.repeat(64), 'b'.repeat(64)), /stale|inputs/);
  assert.throws(() => validateBuildFreshness(manifest, 'a'.repeat(64), 'c'.repeat(64)), /stale|target/);
});
