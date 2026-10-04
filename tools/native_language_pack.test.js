#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_language_pack.js 的三家族显示投影、译文选择与序列化接口；仅使用合成 2.8 schema
 * [OUTPUT]: 提供实体/字段稳定键、插件命名空间、厂商日语默认优先及独立登记与自报授权拒绝、有限源绑定纠错、身份保护与确定性输出合同
 * [POS]: tools 的 2.8 native-first 离线 TDD 验收，不依赖私库、厂商安装、Qt 或真实用户目录，不代替格式门及实机覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHash } = require('node:crypto');
const sha256 = value => createHash('sha256').update(value).digest('hex');

// -- 合成显示目录：不携带厂商 bundle 或用户状态 ----------------------
const api = () => require('./native_language_pack.js');
const leaf = (text, notes = []) => ({ 'UI-text': text, notes });
const strings = (value) => [{ type: 'strings', value }];
const vendor = (value) => [{ type: 'strings', language: 'ja-JP', value }];
const review = (key, source, text, decision = 'translate') => ({ key, source, text, decision });
const entries = () => api().collectStringCatalog('app', strings({
  'menu.file.newScene': leaf('New Scene', ['Create a new scene.']),
  'about.product': leaf('Cavalry'),
}));
const node = (nodeType, value) => ({ type: 'nodeStrings', value: { nodeType, ...value } });
const layer = (author, layerType, value) => ({ type: 'layerStrings', value: { author, layerType, ...value } });

test('stable 2.8 keys distinguish different meanings of the same English sentence', () => {
  const rows = api().collectStringCatalog('app', strings({ noun: leaf('Open', ['A state.']), verb: leaf('Open') }));
  assert.deepEqual(rows.map(row => [row.key, row.source]), [['noun', 'Open'], ['verb', 'Open']]);
  assert.deepEqual(rows[0].notes, ['A state.']);
  assert.equal(rows[0].catalogId, 'app');
});

test('collection is order-independent and does not mutate source catalogs', () => {
  const input = strings({ z: leaf('Last'), a: leaf('First') });
  const before = JSON.stringify(input);
  assert.deepEqual(api().collectStringCatalog('guide', input),
    api().collectStringCatalog('guide', strings({ a: leaf('First'), z: leaf('Last') })));
  assert.equal(JSON.stringify(input), before);
});

test('malformed UI-text and unprojected families cannot disappear silently', () => {
  assert.throws(() => api().collectStringCatalog('app', strings({ bad: { notes: [] } })), /UI-text/);
  assert.throws(() => api().collectStringCatalog('app', strings({ bad: leaf(12) })), /UI-text/);
  assert.throws(() => api().collectStringCatalog('node', [{ type: 'nodeStrings', value: {} }]), /strings/);
});

test('duplicate registry identities do not silently follow array order', () => {
  assert.throws(() => api().collectStringCatalog('app', [
    ...strings({ shared: leaf('First meaning') }), ...strings({ shared: leaf('Second meaning') }),
  ]), /duplicate.*shared/);
});

test('vendor Japanese aligns by key, not catalog order', () => {
  const rows = api().collectStringCatalog('guide', strings({ next: leaf('Next'), done: leaf('Done') }),
    vendor({ done: leaf('完了'), next: leaf('次へ') }));
  assert.deepEqual(rows.map(row => [row.key, row.vendorJapanese]), [['done', '完了'], ['next', '次へ']]);
});

test('vendor Japanese takes priority over different old reviewed Japanese', () => {
  const rows = api().collectStringCatalog('guide', strings({ done: leaf('Done') }), vendor({ done: leaf('完了') }));
  const result = api().resolveTranslations(rows, 'ja_JP', [review('done', 'Done', '終了')]);
  assert.equal(result.nativeLocale, 'ja');
  assert.equal(result.rows[0].status, 'vendor');
  assert.equal(result.rows[0].text, '完了');
});

test('vendor values remain byte-exact even if old style preferences would rewrite them', () => {
  const text = '<b>Shape</b> のレンダリング {0}';
  const rows = api().collectStringCatalog('guide', strings({ tip: leaf('<b>Shape</b> rendering {0}') }), vendor({ tip: leaf(text) }));
  assert.equal(api().resolveTranslations(rows, 'ja_JP', []).rows[0].text, text);
});

// -- 合成纠错授权：检验结构边界，不替代真实译文的一手查证 ----------
function vendorCorrectionFixture() {
  const rows = api().collectStringCatalog('synthetic-only', strings({
    amount: leaf('Amount', ['Synthetic blur-strength label; not a real product approval.']),
    anotherAmount: leaf('Amount'),
  }), vendor({ amount: leaf('金額'), anotherAmount: leaf('金額') }));
  const correction = review('amount', 'Amount', 'ぼかし量');
  correction.vendorCorrection = {
    approvedBy: 'primary-agent',
    approvalState: 'approved-source-bound-vendor-correction',
    sourceIdentitySha256: api().nativeSourceIdentitySha256(rows.find(row => row.key === 'amount')),
    translationSha256: sha256(correction.text),
    vendorJapanese: '金額',
    approvalReceiptSha256: 'a'.repeat(64),
  };
  const trusted = [{ key: correction.key,
    sourceIdentitySha256: correction.vendorCorrection.sourceIdentitySha256,
    translationSha256: correction.vendorCorrection.translationSha256,
    approvalReceiptSha256: correction.vendorCorrection.approvalReceiptSha256 }];
  return { rows, correction, trusted };
}

test('explicit vendor correction changes only its bound Japanese display key', () => {
  const { rows, correction, trusted } = vendorCorrectionFixture();
  const before = JSON.stringify({ rows, correction });
  const result = api().resolveTranslations(rows, 'ja_JP', [correction], trusted);
  const changed = result.rows.find(row => row.key === 'amount');
  assert.equal(changed.status, 'vendor-corrected');
  assert.equal(changed.text, 'ぼかし量');
  assert.equal(changed.vendorJapanese, '金額', 'official comparison value remains intact');
  assert.equal(result.rows.find(row => row.key === 'anotherAmount').text, '金額');
  assert.equal(JSON.parse(api().renderNativePack(result))[0].value.amount['UI-text'], 'ぼかし量');
  assert.equal(JSON.stringify({ rows, correction }), before);
  delete correction.vendorCorrection;
  assert.equal(api().resolveTranslations(rows, 'ja_JP', [correction]).rows[0].text, '金額');
});

test('vendor corrections fail closed on context, approval, locale or identity drift', () => {
  const { rows, correction, trusted } = vendorCorrectionFixture();
  for (const field of ['catalogId', 'owner', 'fieldPath', 'notes', 'vendorJapanese']) {
    const changed = structuredClone(rows);
    changed.find(row => row.key === 'amount')[field] = field === 'notes' ? ['Other meaning'] : 'changed';
    assert.throws(() => api().resolveTranslations(changed, 'ja_JP', [correction], trusted), /vendor correction/i, field);
  }
  for (const delta of [{ approvedBy: 'author' }, { approvalState: 'draft' },
    { sourceIdentitySha256: 'b'.repeat(64) }, { vendorJapanese: 'changed' },
    { translationSha256: 'b'.repeat(64) }, { approvalReceiptSha256: '' }]) {
    const changed = structuredClone(correction);
    Object.assign(changed.vendorCorrection, delta);
    assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [changed], trusted), /vendor correction/i);
  }
  assert.throws(() => api().resolveTranslations(rows, 'zh-Hans', [correction]), /vendor correction/i);
  const otherKey = structuredClone(correction);
  otherKey.key = 'anotherAmount';
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [otherKey]), /vendor correction/i);
  const otherText = structuredClone(correction);
  otherText.text = '未承認の文言';
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [otherText]), /vendor correction/i);
  const changed = structuredClone(rows);
  changed.find(row => row.key === 'amount').dontTranslate = true;
  assert.throws(() => api().resolveTranslations(changed, 'ja_JP', [correction]), /vendor correction/i);
  const unchanged = structuredClone(correction);
  unchanged.text = '金額';
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [unchanged]), /vendor correction/i);
});

test('self-reported metadata cannot authorize a vendor correction or forge its receipt', () => {
  const { rows, correction, trusted } = vendorCorrectionFixture();
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [correction]), /vendor correction/i);
  const forged = structuredClone(correction);
  forged.vendorCorrection.approvalReceiptSha256 = 'b'.repeat(64);
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [forged], trusted), /vendor correction/i);
  for (const object of [forged, forged.vendorCorrection]) {
    const changed = structuredClone(correction);
    (object === forged ? changed : changed.vendorCorrection).extra = 'not authorized';
    assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [changed], trusted), /vendor correction/i);
  }
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [correction], [...trusted, trusted[0]]), /duplicate.*vendor/i);
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [correction], [{ ...trusted[0], extra: true }]), /vendor/i);
  const changed = structuredClone(correction);
  changed.text = '別の新訳';
  changed.vendorCorrection.translationSha256 = sha256(changed.text);
  assert.throws(() => api().resolveTranslations(rows, 'ja_JP', [changed], trusted), /vendor correction/i);
});

test('English copies and empty vendor Japanese are not counted as translated content', () => {
  const rows = api().collectStringCatalog('app', strings({ a: leaf('Open'), b: leaf('Save') }), vendor({ a: leaf('Open'), b: leaf('') }));
  const result = api().resolveTranslations(rows, 'ja_JP', [review('a', 'Open', '開く')]);
  assert.equal(result.rows.find(row => row.key === 'a').status, 'reviewed');
  assert.equal(result.rows.find(row => row.key === 'b').status, 'missing');
});

test('vendor Japanese never leaks into the Chinese packs', () => {
  const rows = api().collectStringCatalog('guide', strings({ done: leaf('Done') }), vendor({ done: leaf('完了') }));
  for (const language of ['zh-Hans', 'zh-Hant']) {
    const result = api().resolveTranslations(rows, language, [review('done', 'Done', '完成')]);
    assert.equal(result.rows[0].status, 'reviewed');
    assert.equal(result.rows[0].text, '完成');
  }
});

test('unreviewed reuse candidates and stale English sources cannot enter the pack', () => {
  assert.throws(() => api().resolveTranslations(entries(), 'zh-Hans', [review('menu.file.newScene', 'New Scene', '新建场景', 'candidate')]), /decision/);
  assert.throws(() => api().resolveTranslations(entries(), 'zh-Hans', [review('menu.file.newScene', 'Old command', '新建场景')]), /source.*menu\.file\.newScene/);
});

test('a reviewed translation does not spread to another key sharing the English source', () => {
  const rows = api().collectStringCatalog('app', strings({ noun: leaf('Open'), verb: leaf('Open') }));
  const result = api().resolveTranslations(rows, 'zh-Hans', [review('verb', 'Open', '打开')]);
  assert.equal(result.rows.find(row => row.key === 'noun').status, 'missing');
  assert.equal(result.rows.find(row => row.key === 'verb').text, '打开');
});

test('unknown and duplicated reviewed keys fail before rendering', () => {
  assert.throws(() => api().resolveTranslations(entries(), 'zh-Hans', [review('unknown', 'x', '甲')]), /unknown.*unknown/);
  const same = review('menu.file.newScene', 'New Scene', '新建场景');
  assert.throws(() => api().resolveTranslations(entries(), 'zh-Hans', [same, same]), /duplicate.*menu/);
});

test('explicit English preservation is different from missing or empty translation', () => {
  const result = api().resolveTranslations(entries(), 'zh-Hans', [review('about.product', 'Cavalry', 'Cavalry', 'preserve')]);
  assert.equal(result.rows.find(row => row.key === 'about.product').status, 'preserved');
  assert.equal(result.rows.find(row => row.key === 'menu.file.newScene').status, 'missing');
  assert.throws(() => api().resolveTranslations(entries(), 'zh-Hans', [review('about.product', 'Cavalry', '骑兵', 'preserve')]), /preserve/);
  assert.throws(() => api().resolveTranslations(entries(), 'zh-Hans', [review('menu.file.newScene', 'New Scene', '')]), /empty/);
  assert.throws(() => api().resolveTranslations(entries(), 'zh-Hans', [review('menu.file.newScene', 'New Scene', 'New Scene')]), /preserve/);
});

test('source dontTranslate metadata survives collection but never enters the display pack', () => {
  const rows = api().collectStringCatalog('app', strings({
    product: { ...leaf('Cavalry'), dontTranslate: true },
  }));
  assert.equal(rows[0].dontTranslate, true);
  const result = api().resolveTranslations(rows, 'zh-Hans', []);
  assert.equal(result.rows[0].status, 'preserved');
  assert.equal(result.rows[0].text, 'Cavalry');
  assert.doesNotMatch(api().renderNativePack(result), /dontTranslate/);
});

test('native dontTranslate source wins over an old translated review', () => {
  const rows = api().collectStringCatalog('app', strings({
    format: { ...leaf('OpenType'), dontTranslate: true },
  }));
  const result = api().resolveTranslations(rows, 'zh-Hans', [review('format', 'OpenType', '开放字体')]);
  assert.equal(result.rows[0].status, 'preserved');
  assert.equal(result.rows[0].text, 'OpenType');
});

test('native dontTranslate is a stronger identity boundary than vendor Japanese', () => {
  const rows = api().collectStringCatalog('app', strings({
    identity: { ...leaf('MSAA'), dontTranslate: true },
    action: leaf('Done'),
  }), vendor({ identity: leaf('支援技術名'), action: leaf('完了') }));
  const result = api().resolveTranslations(rows, 'ja_JP', [
    review('identity', 'MSAA', 'MSAA', 'preserve'),
    review('action', 'Done', '終了'),
  ]);

  const identity = result.rows.find(row => row.key === 'identity');
  assert.equal(identity.status, 'preserved');
  assert.equal(identity.text, 'MSAA');
  const action = result.rows.find(row => row.key === 'action');
  assert.equal(action.status, 'vendor');
  assert.equal(action.text, '完了');
});

test('product language mapping is separate from vendor source filenames', () => {
  for (const [code, locale] of [['en', 'en-GB'], ['zh-Hans', 'zh-Hans'], ['zh-Hant', 'zh-Hant'], ['ja_JP', 'ja']]) {
    assert.equal(api().nativeLocaleForLanguage(code), locale);
  }
  assert.throws(() => api().nativeLocaleForLanguage('ja-JP'), /unsupported/);
  assert.throws(() => api().nativeLocaleForLanguage('zh_CN'), /unsupported/);
});

test('pack contains only the selected language and strings wrapper, not source metadata', () => {
  const result = api().resolveTranslations(entries(), 'zh-Hans', [review('menu.file.newScene', 'New Scene', '新建场景')]);
  const pack = JSON.parse(api().renderNativePack(result));
  assert.deepEqual(pack, [{ type: 'strings', language: 'zh-Hans', value: { 'menu.file.newScene': { 'UI-text': '新建场景' } } }]);
  assert.doesNotMatch(JSON.stringify(pack), /notes|catalogId|source|nodeType|author/);
});

test('missing keys stay in the ledger but are omitted for native English fallback', () => {
  const result = api().resolveTranslations(entries(), 'ja_JP', []);
  assert.equal(result.rows.length, 2);
  assert.ok(result.rows.every(row => row.status === 'missing'));
  assert.deepEqual(JSON.parse(api().renderNativePack(result))[0].value, {});
});

test('direct node registry keys serialize without writing model identity fields', () => {
  const rows = [{ catalogId: 'node', key: 'nodeName:group', source: 'Group', notes: [] }];
  const before = JSON.stringify(rows);
  const pack = JSON.parse(api().renderNativePack(api().resolveTranslations(rows, 'zh-Hans', [review('nodeName:group', 'Group', '组')])));
  assert.equal(pack[0].type, 'strings');
  assert.equal(pack[0].value['nodeName:group']['UI-text'], '组');
  assert.equal(JSON.stringify(rows), before);
});

test('HTML, Unicode, arguments and ICU bytes survive serialization; this is not ICU validation', () => {
  const source = '<b>{1}</b>: {0, plural, =0 {No items} one {# item} other {# items}}';
  const text = '<b>{1}</b>：{0, plural, =0 {没有项目} one {# 个项目} other {# 个项目}}';
  const rows = api().collectStringCatalog('app', strings({ count: leaf(source) }));
  const pack = JSON.parse(api().renderNativePack(api().resolveTranslations(rows, 'zh-Hans', [review('count', source, text)])));
  assert.equal(pack[0].value.count['UI-text'], text);
});

test('__proto__ is an ordinary own registry key, not an object prototype', () => {
  const rows = api().collectStringCatalog('app', strings(JSON.parse('{"__proto__":{"UI-text":"Prototype"}}')));
  const pack = JSON.parse(api().renderNativePack(api().resolveTranslations(rows, 'zh-Hans', [review('__proto__', 'Prototype', '原型')])));
  assert.ok(Object.hasOwn(pack[0].value, '__proto__'));
  assert.equal(pack[0].value.__proto__['UI-text'], '原型');
});

test('equivalent inputs produce byte-identical packs without session or environment metadata', () => {
  const rows = entries();
  const reviews = [review('about.product', 'Cavalry', 'Cavalry', 'preserve'), review('menu.file.newScene', 'New Scene', '新建场景')];
  const first = api().renderNativePack(api().resolveTranslations(rows, 'zh-Hans', reviews));
  const second = api().renderNativePack(api().resolveTranslations([...rows].reverse(), 'zh-Hans', [...reviews].reverse()));
  assert.equal(first, second);
  assert.ok(first.endsWith('\n'));
  assert.doesNotMatch(first, /createdAt|timestamp|session|home|Applications/);
});

// -- 节点/插件源结构：先验已证据键；未知显示叶显式记账 --------------
test('nodeStrings source projects names, help, attributes and numeric enums into the proven key families', () => {
  const source = [node('group', {
    info: { name: leaf('Group'), tooltip: leaf('Collect layers.') },
    attributes: { groupMode: { name: leaf('Blending & Opacity'), tooltip: leaf('Choose group mode.') } },
    enums: { groupMode: { 0: leaf('Artboard'), 1: leaf('Individual Layers') } },
  })];
  const before = JSON.stringify(source);
  const result = api().collectNativeCatalog('node', source);
  assert.deepEqual(result.entries.map(row => [row.key, row.source]), [
    ['attrInfo:group.groupMode', 'Choose group mode.'],
    ['nodeAttr:group.groupMode', 'Blending & Opacity'],
    ['nodeAttrEnum:group.groupMode.0', 'Artboard'],
    ['nodeAttrEnum:group.groupMode.1', 'Individual Layers'],
    ['nodeInfo:group', 'Collect layers.'],
    ['nodeName:group', 'Group'],
  ]);
  assert.deepEqual(result.unmapped, []);
  assert.equal(JSON.stringify(source), before);
});

test('node values arrays and direct UI-text shapes are collected without losing entities', () => {
  const result = api().collectNativeCatalog('node', [{ type: 'nodeStrings', values: [
    { nodeType: 'element', info: leaf('Element'), attributes: { hidden: leaf('Hidden') } },
    { nodeType: 'lattice', info: { name: leaf('Lattice') } },
  ] }]);
  assert.deepEqual(result.entries.map(row => row.key), ['nodeAttr:element.hidden', 'nodeName:element', 'nodeName:lattice']);
});

test('source and vendor node entities align by nodeType and field path, not array offsets', () => {
  const source = [{ type: 'nodeStrings', values: [
    { nodeType: 'first', info: leaf('First') }, { nodeType: 'second', info: leaf('Second') },
  ] }];
  const target = [node('second', { info: leaf('二番目') }), node('first', { info: leaf('最初') })];
  const result = api().collectNativeCatalog('node', source, target);
  assert.deepEqual(result.entries.map(row => [row.key, row.vendorJapanese]), [
    ['nodeName:first', '最初'], ['nodeName:second', '二番目'],
  ]);
});

test('plugin layer namespaces use author and layerType exactly, never directory names', () => {
  const result = api().collectNativeCatalog('Plugins/Polar Coordinates Filter', [layer('sceneGroup', 'rectToPolarFilter', {
    niceName: leaf('Polar Coordinates'), layerInfo: leaf('Remap layers into polar space.'),
    attributes: { 'corner0.position': { name: leaf('Corner Position'), tooltip: leaf('Move this corner.') } },
    enums: { 'choice.mode': { 0: leaf('Front') } },
  })]);
  assert.deepEqual(result.entries.map(row => row.key), [
    'attrInfo:sceneGroup::rectToPolarFilter.corner0.position',
    'nodeAttr:sceneGroup::rectToPolarFilter.corner0.position',
    'nodeAttrEnum:sceneGroup::rectToPolarFilter.choice.mode.0',
    'nodeInfo:sceneGroup::rectToPolarFilter',
    'nodeName:sceneGroup::rectToPolarFilter',
  ]);
  assert.ok(result.entries.every(row => !row.key.includes('Polar Coordinates Filter')));
});

test('plugin native name translation only writes the display registry, never author/type/niceName model data', () => {
  const source = [layer('sceneGroup', 'bulgeFilter', { niceName: leaf('Bulge') })];
  const before = JSON.stringify(source);
  const target = [layer('sceneGroup', 'bulgeFilter', { niceName: leaf('バルジ') })];
  const result = api().collectNativeCatalog('plugin', source, target);
  const pack = JSON.parse(api().renderNativePack(api().resolveTranslations(result.entries, 'ja_JP', [])));
  assert.deepEqual(pack[0].value, { 'nodeName:sceneGroup::bulgeFilter': { 'UI-text': 'バルジ' } });
  assert.equal(JSON.stringify(source), before);
});

test('proven direct tab keys do not hide unknown nested shapes in other display sections', () => {
  const source = [node('shape', {
    info: leaf('Shape'), tabs: { fill: leaf('Fill') },
    presets: { example: { description: leaf('Example') } },
    notifications: { 0: { description: leaf('No path.') } }, enums: { rgb: { future: leaf('RGB') } },
  })];
  const result = api().collectNativeCatalog('node', source);
  assert.deepEqual(result.entries.map(row => row.key), ['nodeName:shape', 'nodeTab:shape.fill']);
  assert.deepEqual(result.unmapped.map(row => row.fieldPath), [
    ['enums', 'rgb', 'future'], ['notifications', '0', 'description'], ['presets', 'example', 'description'],
  ]);
  assert.ok(result.unmapped.every(row => row.owner === 'shape' && row.reason === 'unverified-registry-family'));
  assert.equal(result.entries.length + result.unmapped.length, 5);
});

test('plugin tabs use the proven author-qualified nodeTab namespace and preserve vendor Japanese verbatim', () => {
  const source = [layer('sceneGroup', 'spheriseFilter', { tabs: {
    filter: leaf('Settings', ['Main settings.']), lighting: leaf('Lighting'),
  } })];
  const target = [layer('sceneGroup', 'spheriseFilter', { tabs: {
    lighting: leaf('照明'), filter: leaf('設定'),
  } })];
  const result = api().collectNativeCatalog('plugin', source, target);
  assert.equal(result.unmapped.length, 0);
  assert.deepEqual(result.entries.map(row => row.key), [
    'nodeTab:sceneGroup::spheriseFilter.filter', 'nodeTab:sceneGroup::spheriseFilter.lighting',
  ]);
  assert.deepEqual(result.entries[0].notes, ['Main settings.']);
  const resolved = api().resolveTranslations(result.entries, 'ja_JP', [
    review('nodeTab:sceneGroup::spheriseFilter.filter', 'Settings', '古い訳'),
  ]);
  assert.deepEqual(JSON.parse(api().renderNativePack(resolved))[0].value, {
    'nodeTab:sceneGroup::spheriseFilter.filter': { 'UI-text': '設定' },
    'nodeTab:sceneGroup::spheriseFilter.lighting': { 'UI-text': '照明' },
  });
});

test('future nested tab display shapes are not silently flattened into proven direct tab keys', () => {
  const result = api().collectNativeCatalog('node', [node('shape', {
    tabs: { fill: { name: leaf('Fill') } },
  })]);
  assert.equal(result.entries.length, 0);
  assert.deepEqual(result.unmapped[0].fieldPath, ['tabs', 'fill', 'name']);
});

test('native presets deliberately share the tab key builder even inside values records', () => {
  const result = api().collectNativeCatalog('node', [{ type: 'nodeStrings', values: [
    { nodeType: 'applyFontSize', presets: { numbers: leaf('Numbers', ['A matching preset.']) } },
  ] }]);
  assert.deepEqual(result.entries.map(row => row.key), ['nodeTab:applyFontSize.numbers']);
  assert.equal(result.unmapped.length, 0);
  assert.deepEqual(result.entries[0].fieldPath, ['presets', 'numbers']);
});

test('native direct enum UI-text uses the observed zero index rather than dropping the unusual source shape', () => {
  const result = api().collectNativeCatalog('node', [node('curvesFilter', {
    enums: { rgb: leaf('RGB'), red: leaf('Red') },
  })]);
  assert.deepEqual(result.entries.map(row => row.key), ['nodeAttrEnum:curvesFilter.red.0', 'nodeAttrEnum:curvesFilter.rgb.0']);
  assert.equal(result.unmapped.length, 0);
  assert.throws(() => api().collectNativeCatalog('node', [node('curvesFilter', {
    enums: { rgb: { ...leaf('RGB'), 0: leaf('A competing zero index') } },
  })]), /duplicate.*nodeAttrEnum:curvesFilter.rgb.0/);
});

test('notification text uses the loader-proven unprefixed owner and decimal index key', () => {
  const result = api().collectNativeCatalog('node', [node('pathfinder', {
    notifications: { 0: leaf('No input path connected.'), 1: leaf('Another notification.') },
  })]);
  assert.deepEqual(result.entries.map(row => row.key), ['pathfinder.0', 'pathfinder.1']);
  assert.equal(result.unmapped.length, 0);
  assert.throws(() => api().collectNativeCatalog('mixed', [
    ...strings({ 'pathfinder.0': leaf('A competing global key') }),
    node('pathfinder', { notifications: { 0: leaf('No input path connected.') } }),
  ]), /duplicate.*pathfinder.0/);
});

test('tab and preset namespace collisions are rejected instead of fabricating different key families', () => {
  assert.throws(() => api().collectNativeCatalog('node', [node('shape', {
    tabs: { fill: leaf('Fill tab') }, presets: { fill: leaf('Fill preset') },
  })]), /duplicate.*nodeTab:shape.fill/);
});

test('unknown future display leaves are counted; ordinary identity fields are not translation debt', () => {
  const result = api().collectNativeCatalog('node', [node('shape', {
    author: 'Not display text', id: 'untouched', future: { description: leaf('Future UI') },
  })]);
  assert.equal(result.entries.length, 0);
  assert.equal(result.unmapped.length, 1);
  assert.deepEqual(result.unmapped[0].fieldPath, ['future', 'description']);
});

test('node/layer metadata errors and malformed display leaves stop before generating invalid identities', () => {
  assert.throws(() => api().collectNativeCatalog('node', [node('', { info: leaf('Empty type') })]), /nodeType/);
  assert.throws(() => api().collectNativeCatalog('plugin', [layer('', 'filter', { niceName: leaf('Filter') })]), /author/);
  assert.throws(() => api().collectNativeCatalog('plugin', [layer('sceneGroup', '', { niceName: leaf('Filter') })]), /layerType/);
  assert.throws(() => api().collectNativeCatalog('node', [node('shape', { info: leaf(4) })]), /UI-text/);
  assert.throws(() => api().collectNativeCatalog('node', [node('shape', { info: { 'UI-text': 'Shape', notes: 'not an array' } })]), /notes/);
});

test('entity and global namespace collisions are rejected before serializing a pack', () => {
  assert.throws(() => api().collectNativeCatalog('node', [node('group', { info: leaf('Group') }), node('group', { info: leaf('Other') })]), /duplicate/);
  assert.throws(() => api().collectNativeCatalog('mixed', [
    ...strings({ 'nodeName:group': leaf('Global collision') }), node('group', { info: leaf('Group') }),
  ]), /duplicate.*nodeName:group/);
});

test('vendor fields outside the selected 2.8 source cannot introduce translations or new identities', () => {
  assert.throws(() => api().collectNativeCatalog('node', [node('group', { info: leaf('Group') })], [node('other', { info: leaf('他') })]), /unknown vendor/);
});

test('node projection retains source dontTranslate policy and stable results across entity ordering', () => {
  const source = [node('b', { info: leaf('Second') }), node('a', { info: { ...leaf('RGB'), dontTranslate: true } })];
  const first = api().collectNativeCatalog('node', source);
  assert.deepEqual(first, api().collectNativeCatalog('node', [...source].reverse()));
  const result = api().resolveTranslations(first.entries, 'zh-Hans', []);
  assert.equal(result.rows.find(row => row.key === 'nodeName:a').status, 'preserved');
});
