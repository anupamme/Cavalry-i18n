#!/usr/bin/env node
/**
 * [INPUT]: 依赖六个完整node owner的显式审批模块、approved_modules登记、native格式门与native_resource_bundle producer。
 * [OUTPUT]: 官方owner选择同时绑定catalogId，不混入同owner schema补充；锁定152键源/notes/角色/owner摘要、root批准及三语决定；合成源保留真实DNT，验证技术保留、有限语义反例、格式与显示投影。
 * [POS]: 六owner默认离线合同；同目录helper以真实源/notes/当前caption关系校验基线，再拒绝逐槽语义反例，不证明live或发布。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const {
  assertFiniteSemanticContracts,
  assertSourceBoundSemanticContracts,
  assertRootApprovedRevisionAnchors,
} = require(path.join(__dirname, 'native_mesh_family_semantic_contract.js'));

function isRepoRoot(candidate) {
  return fs.existsSync(path.join(candidate, 'languages/native/approved_modules.js'))
    && fs.existsSync(path.join(candidate, 'tools/native_translation_format.js'));
}
const REPO_ROOT = [path.resolve(process.cwd()), path.resolve(__dirname, '..')].find(isRepoRoot);
assert.ok(REPO_ROOT, 'run from the repository root or place this file under tools/');

const CATALOG_ID = 'Definitions/Translation/nodeStrings';
const LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const OWNER_SPECS = Object.freeze({
  meshDistribution: {
    file: 'nodes_mesh_distribution', count: 26,
    keys: '92294d813bdf62a759f60dab223d6fcc0dd1e41e51474acb51501fef328d7ae8',
    pairs: '178f30a580c4edc68faaff994d58501054d2edd43d5a3fb839a28c39d43a7ea1',
    identity: 'f5c5f6871af5a477931c7105131bc64d3466a72b4d5c240f3215d957b053c6c1',
    roles: { 'attribute-info': 10, 'attribute-label': 10, 'enum-label': 4, 'node-info': 1, 'node-name': 1 },
  },
  meshShape: {
    file: 'nodes_mesh_shape', count: 26,
    keys: '75cff6e277e4d12b9668cd542f4b8f52b3e8c5dd0302e4a2719791ee7fdfcb42',
    pairs: '538559c2b2d1b7990903647ad51657f8e50cea3886196e1598229bc4b03d9d94',
    identity: 'e2db47c4f9bd99c914d88a7caeba10da6bec6e0d7a2dead53fcc004cdcb0d9c7',
    roles: { 'attribute-info': 10, 'attribute-label': 13, 'node-info': 1, 'node-name': 1, 'tab-label': 1 },
  },
  pathField: {
    file: 'nodes_path_field', count: 22,
    keys: '4e7d1fb02a8ddf003b9efe45942ac8349b4bca88986ae0d3d3dc444b53519075',
    pairs: '173a0d07b3ee09dc0da2cbf86e0898964b8e367b2aff547c5071fa65bf8814d1',
    identity: '5272fe34804a5e97d8f1573654a64822ffafaa3e2426c57846a870bdb3ca14cd',
    roles: { 'attribute-info': 9, 'attribute-label': 11, 'node-info': 1, 'node-name': 1 },
  },
  randomDistribution: {
    file: 'nodes_random_distribution', count: 26,
    keys: '3709edfcd116b64eb2c1f42dd04999d27e062d1df041e58f8a0a716bac1c9bfb',
    pairs: 'f0ca6dfe30c90f6d8b1f6aa442127f4d5535e573582272657ddee8aefe8deb45',
    identity: '1655dee152c70399c5c2ae82bcf638fc6f5dc26b3b525db976efcd89df2aafb6',
    roles: { 'attribute-info': 11, 'attribute-label': 11, 'enum-label': 2, 'node-info': 1, 'node-name': 1 },
  },
  skslFilter: {
    file: 'nodes_sksl_filter', count: 26,
    keys: '36ae0ada87880044b60d050bf399e5f6289e44f4c9095d7177dfacda2404b735',
    pairs: '3c583126dd774efea8cac8cea14ec43510c80f77fc4266ec366ca5a9ac4d988c',
    identity: '77b10e751b49ecb7989d03e88f1bf7b28b3d8b65822d0f8beab8828ac24f7f07',
    roles: { 'attribute-info': 3, 'attribute-label': 3, 'enum-label': 18, 'node-info': 1, 'node-name': 1 },
  },
  thirdPartyFilter: {
    file: 'nodes_third_party_filter', count: 26,
    keys: '64997666c58e201ab1c048be94181a56f8bef0aa3bb0bf014326b34c35673228',
    pairs: '76f3e8ceae0badbcc694905082de67304fbe6482a299de84ad225a3ee7b5c094',
    identity: '21e4e3c8c91454fa6c777f854e029218cba023d5888555e18a4c1eb5c07bbb91',
    roles: { 'attribute-info': 1, 'attribute-label': 3, 'enum-label': 22 },
  },
});
const SOURCE = Object.freeze({
  jsonSha256: 'a4feaf0b0634fe5ce694d0b3818ead1e6958cf2961edf3d2ca10457cffcae3b8',
  keysetSha256: '4ef4d9e99ea38bc8a067d063ea61c79b0c1c43436ea70680c8646155bd606851',
  sourcePairsSha256: '133bc53ccbad695353b38f2970e36caefbae2411c8ba2818cca15f97d97f845a',
  identityAndNotesSha256: 'b6af1dc1e821711574509a938ef6d67fc46ed121f8bd849ff7b7bd52a33763a5',
  entryCount: 152,
  dntKeys: ['nodeAttrEnum:thirdPartyFilter.samplingQuality.2'],
  vendorJapaneseChangedCount: 0,
});
// -- root源绑定显示输入批准及各locale决定摘要 -----------------------------
const ROOT_APPROVAL = Object.freeze({
  state: 'approved-source-bound-display-input',
  sourceApprovalSha256: '283fb4b5f4d5c0a6e31228bedf660071aab82d76fc52226f582130db219823f7',
  localeTranslationSha256: {
    'zh-Hans': '83e736e78cc2e49cb75fe8ab6b5c3e281094d3fad2f416941367512ce1abd403',
    'zh-Hant': '562c99d6f1bad0b523b7bb5144faad96bf12b80af6476e3d865be7bceff3f04b',
    ja_JP: 'b686d67a14f2eeee4fe155092045e76bdd7f54da5a621bbbb8a655a50a195163',
  },
  registryState: 'registered-source-bound-display-input',
  candidateAuthor: 'delegated GPT-6 Luna Max agent; no AGY/Grok output used for this 152-key batch',
  candidateProvider: 'delegated Codex agent',
  candidateModel: 'gpt-6-luna',
  candidateReasoningEffort: 'max',
  providerEndTurnMetadataObserved: false,
  liveVerified: false,
  live: 'NOT_RUN',
  publicRelease: 'NOT_APPROVED',
});
const KEY_ROLE = Object.freeze({
  'attrInfo:': 'attribute-info',
  'nodeAttr:': 'attribute-label',
  'nodeAttrEnum:': 'enum-label',
  'nodeInfo:': 'node-info',
  'nodeName:': 'node-name',
  'nodeTab:': 'tab-label',
});
const SORT = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const sha = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sorted = rows => [...rows].sort((left, right) => SORT(left.key, right.key));
const modulePath = owner => path.join(REPO_ROOT, 'languages/native', `${OWNER_SPECS[owner].file}.js`);
function sourceRoleForKey(key) {
  const prefix = Object.keys(KEY_ROLE).find(item => key.startsWith(item));
  assert.ok(prefix, `known stable key role prefix: ${key}`);
  return KEY_ROLE[prefix];
}
function sourceIdentity(row) {
  // -- 先读取真实身份字段；缺字段由逐行断言拒绝，不以默认值补造摘要
  return [row.key, row.catalogId, row.owner, row.fieldPath, row.source, row.notes,
    row.sourceRole, row.displayRole, row.dontTranslate, row.vendorJapanese];
}
function localeDecisionSummary(entries) {
  return Object.fromEntries(LOCALES.map(locale => [locale, sha(sorted(entries).map(row => [
    row.key, row.translations[locale].decision, row.translations[locale].text,
  ]))]));
}
function allEntries(modules) {
  return modules.flatMap(module => module.data.entries);
}
function assertRootApproval(modules, entries) {
  assert.equal(ROOT_APPROVAL.state, 'approved-source-bound-display-input',
    'RED: root source-bound display-input approval must be explicit');
  assert.match(ROOT_APPROVAL.sourceApprovalSha256 || '', /^[a-f0-9]{64}$/,
    'root source-bound approval digest must be locked');
  assert.deepEqual(localeDecisionSummary(entries), ROOT_APPROVAL.localeTranslationSha256,
    'per-locale decision/text digests must match root-adjudicated summaries');
  for (const { owner, data } of modules) {
    assert.equal(data.provenance.approvalState, 'approved-source-bound-display-input', `${owner} root approval state`);
    assert.equal(data.provenance.sourceApprovalSha256, ROOT_APPROVAL.sourceApprovalSha256, `${owner} root approval binding`);
    assert.equal(data.provenance.registryState, ROOT_APPROVAL.registryState, `${owner} registered source-bound input state`);
    assert.equal(data.provenance.candidateAuthor, ROOT_APPROVAL.candidateAuthor, `${owner} authoring provenance`);
    assert.equal(data.provenance.candidateProvider, ROOT_APPROVAL.candidateProvider, `${owner} delegated provider provenance`);
    assert.equal(data.provenance.candidateModel, ROOT_APPROVAL.candidateModel, `${owner} authoring model`);
    assert.equal(data.provenance.candidateReasoningEffort, ROOT_APPROVAL.candidateReasoningEffort, `${owner} authoring effort`);
    assert.equal(data.provenance.providerEndTurnMetadataObserved, ROOT_APPROVAL.providerEndTurnMetadataObserved, `${owner} no provider terminal claim`);
    assert.equal(data.provenance.liveVerified, ROOT_APPROVAL.liveVerified, `${owner} has no live evidence`);
    assert.equal(data.provenance.live, ROOT_APPROVAL.live, `${owner} live status remains explicit`);
    assert.equal(data.provenance.publicRelease, ROOT_APPROVAL.publicRelease, `${owner} public release is not approved`);
  }
}
function assertExplicitRegistration(modules) {
  const registry = require(path.join(REPO_ROOT, 'languages/native/approved_modules.js'));
  for (const [owner, spec] of Object.entries(OWNER_SPECS)) {
    assert.ok(registry.APPROVED_MODULES.includes(spec.file), `${owner} is explicitly registered`);
  }
  assert.equal(new Set(registry.APPROVED_MODULES).size, registry.APPROVED_MODULES.length,
    'approval registry contains no duplicate module names');
  const registered = registry.approvedEntries();
  assert.equal(new Set(registered.map(row => row.key)).size, registered.length,
    'registered entries contain no duplicate source keys');
  const owners = new Set(Object.keys(OWNER_SPECS));
  const selected = sorted(registered.filter(row => row.catalogId === 'Definitions/Translation/nodeStrings' && owners.has(row.owner)));
  assert.equal(selected.length, SOURCE.entryCount);
  assert.deepEqual(selected, sorted(allEntries(modules)), 'registry rows equal the six complete modules');
}
function assertSourceBinding(modules) {
  const entries = allEntries(modules);
  assert.equal(entries.length, SOURCE.entryCount);
  assert.equal(new Set(entries.map(row => row.key)).size, SOURCE.entryCount);
  const canonical = sorted(entries);
  assert.equal(sha(canonical.map(row => row.key)), SOURCE.keysetSha256);
  assert.equal(sha(canonical.map(row => [row.key, row.source])), SOURCE.sourcePairsSha256);
  assert.equal(sha(canonical.map(sourceIdentity)), SOURCE.identityAndNotesSha256);
  const roleCounts = {};
  for (const row of canonical) {
    for (const field of ['catalogId', 'sourceRole', 'vendorJapanese', 'vendorJapaneseChanged']) {
      assert.ok(Object.hasOwn(row, field), `${row.key} carries actual ${field} source identity`);
    }
    assert.equal(row.catalogId, CATALOG_ID, `${row.key} catalog`);
    assert.equal(row.sourceRole, sourceRoleForKey(row.key), `${row.key} source role`);
    assert.equal(row.displayRole, sourceRoleForKey(row.key), `${row.key} display role`);
    assert.ok(Object.hasOwn(OWNER_SPECS, row.owner), `${row.key} exact owner`);
    assert.ok(Array.isArray(row.fieldPath) && row.fieldPath.length > 0, `${row.key} field path`);
    assert.ok(Array.isArray(row.notes), `${row.key} source notes`);
    assert.equal(row.vendorJapanese, row.source, `${row.key} unchanged vendor Japanese`);
    assert.equal(row.vendorJapaneseChanged, false, `${row.key} vendor status`);
    roleCounts[row.displayRole] = (roleCounts[row.displayRole] || 0) + 1;
  }
  assert.deepEqual(roleCounts, {
    'attribute-info': 44, 'attribute-label': 51, 'enum-label': 46,
    'node-info': 5, 'node-name': 5, 'tab-label': 1,
  });
  for (const [owner, spec] of Object.entries(OWNER_SPECS)) {
    const module = modules.find(candidate => candidate.owner === owner);
    const rows = module.data.entries;
    assert.equal(rows.length, spec.count, `${owner} complete owner key count`);
    assert.deepEqual(rows.map(row => row.key), sorted(rows).map(row => row.key), `${owner} stable key order`);
    assert.equal(new Set(rows.map(row => row.key)).size, spec.count, `${owner} no duplicate keys`);
    assert.equal(sha(rows.map(row => row.key)), spec.keys, `${owner} source key digest`);
    assert.equal(sha(rows.map(row => [row.key, row.source])), spec.pairs, `${owner} source-pair digest`);
    assert.equal(sha(rows.map(sourceIdentity)), spec.identity, `${owner} source/notes/role digest`);
    assert.deepEqual(Object.fromEntries(Object.entries(rows.reduce((counts, row) => {
      counts[row.displayRole] = (counts[row.displayRole] || 0) + 1;
      return counts;
    }, {})).sort(([left], [right]) => SORT(left, right))),
    Object.fromEntries(Object.entries(spec.roles).sort(([left], [right]) => SORT(left, right))), `${owner} role counts`);
    assert.equal(module.data.provenance.owner, owner, `${owner} provenance owner`);
    assert.equal(module.data.provenance.keyCount, spec.count, `${owner} provenance count`);
    assert.equal(module.data.provenance.sourceJsonSha256, SOURCE.jsonSha256, `${owner} source handoff binding`);
    assert.equal(module.data.provenance.sourcePairsSha256, SOURCE.sourcePairsSha256, `${owner} aggregate source pairs`);
    assert.equal(module.data.provenance.sourceIdentityAndNotesSha256, SOURCE.identityAndNotesSha256, `${owner} aggregate source identity`);
  }
  return entries;
}
function assertLocaleDecisions(entries) {
  const counts = Object.fromEntries(LOCALES.map(locale => [locale, { translate: 0, preserve: 0 }]));
  const preserved = [];
  for (const row of entries) {
    assert.deepEqual(Object.keys(row.translations).sort(SORT), [...LOCALES].sort(SORT), `${row.key} exact locales`);
    for (const locale of LOCALES) {
      const item = row.translations[locale];
      assert.ok(item && ['translate', 'preserve'].includes(item.decision), `${row.key}/${locale} explicit decision`);
      assert.deepEqual(Object.keys(item).sort(SORT), ['decision', 'text'], `${row.key}/${locale} runtime value contains no reason/provider metadata`);
      assert.equal(typeof item.text, 'string', `${row.key}/${locale} string display text`);
      assert.ok(item.text.trim(), `${row.key}/${locale} nonempty display text`);
      if (item.decision === 'preserve') {
        assert.equal(item.text, row.source, `${row.key}/${locale} exact technical preserve`);
        preserved.push([row.key, locale]);
      } else assert.notEqual(item.text, row.source, `${row.key}/${locale} translated display slot`);
      if (row.dontTranslate) assert.equal(item.decision, 'preserve', `${row.key}/${locale} DNT wins`);
      counts[locale][item.decision] += 1;
    }
    assert.ok(!Object.hasOwn(row, 'reason'), 'author reasoning stays out of runtime module data');
  }
  assert.deepEqual(counts, Object.fromEntries(LOCALES.map(locale => [locale, { translate: 150, preserve: 2 }])));
  const expected = LOCALES.flatMap(locale => [
    ['nodeAttrEnum:thirdPartyFilter.samplingQuality.2', locale],
    ['nodeAttrEnum:thirdPartyFilter.samplingQuality.3', locale],
  ]);
  assert.deepEqual(preserved.sort((a, b) => SORT(`${a[0]}|${a[1]}`, `${b[0]}|${b[1]}`)),
    expected.sort((a, b) => SORT(`${a[0]}|${a[1]}`, `${b[0]}|${b[1]}`)));
  const rows = new Map(entries.map(row => [row.key, row]));
  const catmull = rows.get('nodeAttrEnum:thirdPartyFilter.samplingQuality.2');
  assert.equal(catmull.source, 'Catmull-Rom');
  assert.equal(catmull.dontTranslate, true);
  const mitchell = rows.get('nodeAttrEnum:thirdPartyFilter.samplingQuality.3');
  assert.equal(mitchell.source, 'Mitchell');
  assert.equal(mitchell.dontTranslate, false, 'Mitchell technical preserve is not official DNT');
  return { counts, preserved };
}
function assertFormat(entries) {
  const { assertNativeTranslationFormat } = require(path.join(REPO_ROOT, 'tools/native_translation_format.js'));
  let checked = 0;
  for (const row of entries) for (const locale of LOCALES) {
    assertNativeTranslationFormat(row.source, row.translations[locale].text);
    checked += 1;
  }
  assert.equal(checked, 456);
  return checked;
}
function syntheticCatalog(entries) {
  const values = new Map();
  for (const row of entries) {
    const value = values.get(row.owner) || { nodeType: row.owner, fixtureModelIdentity: `identity:${row.owner}` };
    values.set(row.owner, value);
    let cursor = value;
    for (const part of row.fieldPath.slice(0, -1)) cursor = cursor[part] ??= {};
    const leaf = row.fieldPath.at(-1);
    assert.equal(Object.hasOwn(cursor, leaf), false, `${row.key} synthetic field path is unique`);
    cursor[leaf] = { 'UI-text': row.source, notes: [...row.notes], dontTranslate: row.dontTranslate };
  }
  return [...values.values()].map(value => ({ type: 'nodeStrings', value }));
}
function assertDisplayProjection(entries) {
  const source = syntheticCatalog(entries);
  const before = structuredClone(source);
  const pairs = [{ id: CATALOG_ID, source, japanese: [] }];
  const { buildNativeResourceBundle } = require(path.join(REPO_ROOT, 'tools/native_resource_bundle.js'));
  const { manifest, packs } = buildNativeResourceBundle(pairs, entries);
  assert.equal(manifest.nativeKeys, SOURCE.entryCount);
  assert.equal(manifest.approvedUIKeys, SOURCE.entryCount);
  assert.equal(manifest.complete, true, 'synthetic catalog is complete only for this 152-key input');
  for (const locale of LOCALES) {
    const pack = JSON.parse(packs[locale]);
    assert.equal(Object.keys(pack[0].value).length, SOURCE.entryCount);
    for (const row of entries) assert.deepEqual(pack[0].value[row.key], { 'UI-text': row.translations[locale].text });
    assert.deepEqual(source, before, `${locale} display projection is read-only`);
    for (const item of source) assert.equal(item.value.fixtureModelIdentity, `identity:${item.value.nodeType}`);
  }
}

function moduleViews(entries) {
  return Object.keys(OWNER_SPECS).map(owner => ({
    owner,
    data: { entries: entries.filter(row => row.owner === owner) },
  }));
}

function assertFullSemanticContract(candidateRows, sourceRows, currentCaptionRows) {
  assertSourceBoundSemanticContracts({ candidateRows, sourceRows, currentCaptionRows });
  assertFiniteSemanticContracts(moduleViews(candidateRows));
  assertRootApprovedRevisionAnchors(candidateRows, sourceRows);
  assert.equal(assertFormat(candidateRows), 456, 'the same finite semantic gate checks every translated display value format');
}

function oneSlotMutation(rows, { key, locale, text }) {
  const changed = structuredClone(rows);
  const row = changed.find(entry => entry.key === key);
  assert.ok(row, `mutant source key exists: ${key}`);
  assert.ok(Object.hasOwn(row.translations, locale), `mutant locale exists: ${key}/${locale}`);
  assert.notEqual(row.translations[locale].text, text, `${key}/${locale} mutant changes the actual display value`);
  row.translations[locale].text = text;
  const expected = structuredClone(rows);
  expected.find(entry => entry.key === key).translations[locale].text = text;
  assert.deepEqual(changed, expected, `${key}/${locale} mutant changes exactly one locale text slot`);
  return changed;
}

function phraseMutation(rows, { name, key, locale, before, after }) {
  const row = rows.find(entry => entry.key === key);
  assert.ok(row && row.translations[locale], `${name} targets a real source-bound slot`);
  const text = row.translations[locale].text;
  assert.ok(text.includes(before), `${name} finds the exact source-bound phrase`);
  assert.equal(text.indexOf(before), text.lastIndexOf(before), `${name} phrase is unique in its locale slot`);
  return oneSlotMutation(rows, { key, locale, text: text.replace(before, after) });
}

const SEMANTIC_COUNTEREXAMPLES = Object.freeze([
  { name: 'Fill All仍受Count限制', key: 'attrInfo:meshDistribution.fill', locale: 'zh-Hans', text: '使用输入中的每个子网格，仍受“数量”设置限制。' },
  { name: 'Fill All开启后Count仍生效', key: 'attrInfo:meshDistribution.count', locale: 'zh-Hans', text: '使用的子网格最大数量。启用“全部使用”时，此设置会继续生效。' },
  { name: '纵横比错误地选择较大轴', key: 'attrInfo:meshDistribution.keepAspectRatio', locale: 'ja_JP', before: '小さい方の値', after: '大きい方の値' },
  { name: 'level零不再是根网格', key: 'attrInfo:meshDistribution.level', locale: 'zh-Hans', before: '0 表示根网格', after: '0 表示子网格' },
  { name: '关闭层级仍只取样所选项', key: 'attrInfo:meshDistribution.useLevels', locale: 'zh-Hant', before: '關閉時，取樣層級結構中的所有子網格', after: '關閉時，只取樣所選層級中的子網格' },
  { name: '空子网格错误地产生点', key: 'attrInfo:meshDistribution.ignoreEmptySubMeshes', locale: 'ja_JP', text: 'ジオメトリのないサブメッシュにもポイントを生成します。' },
  { name: 'Resolution标签误作整体尺寸', key: 'nodeAttr:meshShape.resolution', locale: 'zh-Hans', before: '网格细分数', after: '尺寸' },
  { name: 'Offset Path与Bind Path标签互换', key: 'nodeAttr:meshShape.meshVertex.bindPath', locale: 'zh-Hant', textFromKey: 'nodeAttr:meshShape.meshVertex.offsetPath' },
  { name: 'Capture force错误地沿切线推动', key: 'attrInfo:pathField.captureForce', locale: 'zh-Hans', before: '将物体拉向路径', after: '沿路径切线推动物体' },
  { name: '越界点被钳制而非剔除', key: 'attrInfo:randomDistribution.keepShape', locale: 'zh-Hans', text: '启用时，松弛过程中被推到边界形状外的点会保留并钳制在边界内。' },
  { name: '概率范围扩大到0至100', key: 'attrInfo:randomDistribution.probability', locale: 'ja_JP', before: '確率（0～1）', after: '確率（0～100）' },
  { name: '最小间距丢失像素单位', key: 'attrInfo:randomDistribution.relaxDistance', locale: 'zh-Hans', before: '单位为像素', after: '单位为点数' },
  { name: '迭代的相对均匀效果被抹去', key: 'attrInfo:randomDistribution.maxRelaxIterations', locale: 'ja_JP', before: 'より均等', after: '均等' },
  { name: 'SkSL Padding误作Accumulator步骤间距', key: 'attrInfo:skslFilter.padding', locale: 'zh-Hans', text: '此设置表示每个累积步骤之间的间隔。' },
  { name: 'SkSL语言身份被翻译掉', key: 'nodeInfo:skslFilter', locale: 'zh-Hant', before: 'GLSL', after: '著色器语言' },
  { name: 'Mitchell与Catmull-Rom算法混淆', key: 'nodeAttrEnum:thirdPartyFilter.samplingQuality.3', locale: 'zh-Hans', before: 'Mitchell', after: 'Catmull-Rom' },
  { name: 'Filter Plus同源模式标签分歧', key: 'nodeAttrEnum:skslFilter.blendMode.12', locale: 'zh-Hans', before: '相加', after: '相減' },
  { name: 'Probability标签偏离当前已审caption', key: 'nodeAttr:randomDistribution.probability', locale: 'zh-Hant', before: '機率', after: '概率' },
  { name: 'SkSL Padding标签混入Accumulator间距词', key: 'nodeAttr:skslFilter.padding', locale: 'zh-Hant', before: '邊距', after: '間距' },
  { name: 'Mesh Shape标签偏离当前Mesh Tool caption', key: 'nodeAttr:meshShape.mesh', locale: 'ja_JP', before: 'メッシュ', after: '格子' },
  { name: 'Filter Blend Mode标签偏离已审caption', key: 'nodeAttr:skslFilter.blendMode', locale: 'ja_JP', before: '描画モード', after: '混合モード' },
]);

function buildSemanticMutant(rows, spec) {
  if (spec.textFromKey) {
    const reference = rows.find(entry => entry.key === spec.textFromKey);
    assert.ok(reference, `swap source label exists: ${spec.textFromKey}`);
    return oneSlotMutation(rows, { ...spec, text: reference.translations[spec.locale].text });
  }
  if (Object.hasOwn(spec, 'text')) return oneSlotMutation(rows, spec);
  return phraseMutation(rows, spec);
}

function assertSingleSlotRejected(rows, currentCaptionRows, mutant, label) {
  assert.doesNotThrow(() => assertFullSemanticContract(rows, rows, currentCaptionRows), `${label}: full approved baseline passes first`);
  assert.throws(() => assertFullSemanticContract(mutant, rows, currentCaptionRows), undefined,
    `${label}: same source-bound semantic/format checker rejects one-slot mutant`);
}

// -- 六模块逐项存在性 RED 后，完整候选数据才进入合同 ----------------------
test('six complete owners carry root-approved source-bound display decisions', async t => {
  const modules = [];
  for (const [owner, spec] of Object.entries(OWNER_SPECS)) {
    let loaded = null;
    await t.test(`${owner}: ${spec.file} module must exist`, () => {
      const file = modulePath(owner);
      assert.ok(fs.existsSync(file), `RED: complete owner module missing: ${file}`);
      loaded = require(file);
      assert.ok(Array.isArray(loaded.entries), `${owner} module exposes entries`);
      assert.ok(loaded.provenance && typeof loaded.provenance === 'object', `${owner} module exposes provenance`);
    });
    if (loaded) modules.push({ owner, file: spec.file, count: spec.count, data: loaded });
  }
  // -- 缺模块由上面的六个子测试逐一报告RED；不使用skip，也不伪造候选Green
  if (modules.length !== Object.keys(OWNER_SPECS).length) return;
  const entries = allEntries(modules);
  await t.test('all 152 keys bind source, notes, roles and owner digests', () => assertSourceBinding(modules));
  await t.test('root approval and locale summary are locked, not provisional', () => assertRootApproval(modules, entries));
  await t.test('six modules are explicitly present in approved registry', () => assertExplicitRegistration(modules));
  await t.test('all 456 locale decisions preserve exact DNT and technical-name boundaries', () => assertLocaleDecisions(entries));
  await t.test('all three locales pass the shared native format gate', () => assert.equal(assertFormat(entries), 456));
  await t.test('same-source SkSL/third-party mode labels remain consistent', () => assertFiniteSemanticContracts(modules));
  const currentCaptionRows = require(path.join(REPO_ROOT, 'languages/native/approved_modules.js')).approvedEntries();
  await t.test('root-approved semantic baseline passes before single-slot counterexamples', () => {
    assertFullSemanticContract(entries, entries, currentCaptionRows);
  });
  await t.test('all 15 root-approved display revisions reject their actual old values', async nested => {
    const anchors = require('./native_mesh_family_semantic_contract.js').ROOT_APPROVED_REVISIONS;
    assert.equal(anchors.length, 15);
    for (const [key, locale, previousText] of anchors) {
      await nested.test(`${key}/${locale} rejects the historical value`, () => assertSingleSlotRejected(
        entries, currentCaptionRows,
        oneSlotMutation(entries, { key, locale, text: previousText }),
        `${key}/${locale} revision rollback`,
      ));
    }
  });
  await t.test('finite source/notes and caption counterexamples reject one changed locale slot', async nested => {
    for (const spec of SEMANTIC_COUNTEREXAMPLES) {
      await nested.test(spec.name, () => assertSingleSlotRejected(
        entries, currentCaptionRows, buildSemanticMutant(entries, spec), spec.name,
      ));
    }
  });
  await t.test('producer output projects UI-text only without mutating source identity', () => assertDisplayProjection(entries));
});
