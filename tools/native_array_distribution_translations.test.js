#!/usr/bin/env node
/**
 * [INPUT]: 依赖 Array Distribution 四个官方显示叶、source-bound module、native_language_pack 与 native_translation_format。
 * [OUTPUT]: 锁定完整4键source/notes/role/identity digest、手工坐标列表/计数/index关系、12值审定文本和真实反向变异。
 * [POS]: tools 的 Array Distribution 审批合同；显式 source-only stage 仅验证源域，正式模块必须满足全部译值与显示投影门。
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
const OWNER = 'arrayDistribution';
const OFFICIAL_MODULE = path.join(__dirname, '../languages/native/nodes_array_distribution.js');
const STAGE_INPUT = process.env.CAVALRY_ARRAY_DISTRIBUTION_TEST_STAGE_INPUT;
const INPUT_PATH = STAGE_INPUT ? path.resolve(STAGE_INPUT) : OFFICIAL_MODULE;
const INPUT_EXISTS = fs.existsSync(INPUT_PATH);
const SKIP_SOURCE_CONTRACT = INPUT_EXISTS ? false : 'RED: no selected input; source-bound contracts wait for explicit stage input or official module';
const SOURCE_PAIRS_SHA256 = '393ea3b4d8ae888086514a6c475601f2f09029c7ba88dddcdbcf153f686f154a';
const IDENTITY_NOTES_SHA256 = '17cf6095ca95d0b1f2bfcdb0ebbfbc4e1d7cc14de1d8db74ab69bcf53e4feb5b';
const SOURCE_SHA256 = 'd5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0';
const VENDOR_JAPANESE_SHA256 = '7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439';
const SOURCE_ONLY_APPROVAL = 'source-and-old-candidates-only; no translation decisions or approval';
const FORMAL_APPROVAL = 'approved-source-bound-display-input';
const SOURCE_ONLY_SKIP = 'RED: explicit stage input has source only; no locale candidate or root adjudication yet';
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

// -- 固定当前完整owner；queue batch只作来源旁证，不扩充owner范围。
const EXPECTED_ROWS = Object.freeze({
  'attrInfo:arrayDistribution.array': {
    source: 'Explicit list of (X, Y) positions, one per duplicate. The list’s length sets the duplicate count.',
    fieldPath: ['attributes', 'array', 'tooltip'],
    displayRole: 'attribute-info',
    notes: ['"Explicit list" means a manually entered set of values.'],
  },
  'nodeAttr:arrayDistribution.array': {
    source: 'Position',
    fieldPath: ['attributes', 'array', 'name'],
    displayRole: 'attribute-label',
    notes: ['As in "set the Position for each entry in the list" — an X/Y coordinate.'],
  },
  'nodeInfo:arrayDistribution': {
    source: 'Distribute points by specifying positions for each index.',
    fieldPath: ['info', 'tooltip'],
    displayRole: 'node-info',
    notes: ["\"Index\" here is a duplicate’s position number in its sequence."],
  },
  'nodeName:arrayDistribution': {
    source: 'Array',
    fieldPath: ['info', 'name'],
    displayRole: 'node-name',
    notes: ['The name of a behaviour that places duplicates at an explicit list of positions, a programming/data term (a list of values).'],
  },
});
const EXPECTED_KEYS = Object.keys(EXPECTED_ROWS).sort();
const EXPECTED_ROLE_KEYS = Object.freeze({
  'attribute-info': ['attrInfo:arrayDistribution.array'],
  'attribute-label': ['nodeAttr:arrayDistribution.array'],
  'node-info': ['nodeInfo:arrayDistribution'],
  'node-name': ['nodeName:arrayDistribution'],
});

// -- 语义审定锁：明确手工坐标与计数方向，不将数据列表译成网格 --------
const EXPECTED_TEXT = Object.freeze({
  'attrInfo:arrayDistribution.array': {
    'zh-Hans': '手动列出每个副本的 (X, Y) 位置；列表长度决定副本数量。',
    'zh-Hant': '手動列出每個副本的 (X, Y) 位置；清單長度決定副本數量。',
    ja_JP: '複製ごとに (X, Y) 座標を1組ずつ手動で指定するリストです。リストの長さで複製数が決まります。',
  },
  'nodeAttr:arrayDistribution.array': { 'zh-Hans': '位置', 'zh-Hant': '位置', ja_JP: '位置' },
  'nodeInfo:arrayDistribution': {
    'zh-Hans': '通过为每个索引指定位置来分布点。',
    'zh-Hant': '透過為每個索引指定位置來分佈點。',
    ja_JP: '各インデックスに位置を指定してポイントを配置します。',
  },
  'nodeName:arrayDistribution': { 'zh-Hans': '数组', 'zh-Hant': '陣列', ja_JP: '配列' },
});

function assertReviewedSemantics(entries) {
  for (const key of EXPECTED_KEYS) for (const locale of LOCALES) {
    const actual = findEntry(entries, key).translations?.[locale];
    assert.equal(actual?.decision, 'translate', `${key}/${locale} is approved display text`);
    assert.equal(actual.text, EXPECTED_TEXT[key][locale], `${key}/${locale} source-note semantic lock`);
  }
}

function readInput() {
  assert.ok(INPUT_EXISTS, STAGE_INPUT
    ? `RED: requested Array Distribution input is missing at ${INPUT_PATH}`
    : `RED: approved arrayDistribution module is not present at ${OFFICIAL_MODULE}`);
  if (STAGE_INPUT) return JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  return require(OFFICIAL_MODULE);
}

function findEntry(entries, key) {
  const entry = entries.find(row => row.key === key);
  assert.ok(entry, `missing source-bound key ${key}`);
  return entry;
}

function sourceIdentityDigest(entries) {
  return digest(entries.map(row => [
    row.key, row.owner, row.fieldPath, row.source, row.notes, row.displayRole, row.dontTranslate, row.vendorJapanese,
  ]));
}

function assertSourceContract(data) {
  const { entries } = data;
  assert.ok(Array.isArray(entries), 'source-bound input must have entries');
  const keys = entries.map(row => row.key);
  assert.equal(entries.length, 4, 'Array Distribution is exactly four official display leaves');
  assert.equal(new Set(keys).size, 4, 'owner keys are unique');
  assert.deepEqual(keys, EXPECTED_KEYS, 'no generated button, enum, or adjacent owner leaf is in scope');
  assert.equal(data.owner ?? entries[0]?.owner, OWNER);
  assert.equal(data.catalogId ?? entries[0]?.catalogId, 'Definitions/Translation/nodeStrings');

  const sourceProvenance = data.sourceProvenance ?? data.provenance;
  assert.ok(sourceProvenance, 'official source provenance is required');
  assert.equal(sourceProvenance.cavalryVersion, '2.8.0');
  assert.equal(sourceProvenance.catalogPath, 'Definitions/Translation/nodeStrings_en-GB.source.json');
  assert.equal(sourceProvenance.sourceSha256, SOURCE_SHA256);
  assert.equal(sourceProvenance.vendorJapanesePath, 'Definitions/Translation/nodeStrings_ja-JP.translation.json');
  assert.equal(sourceProvenance.vendorJapaneseSha256, VENDOR_JAPANESE_SHA256);

  assert.equal(digest(entries.map(row => [row.key, row.source])), SOURCE_PAIRS_SHA256);
  assert.equal(sourceIdentityDigest(entries), IDENTITY_NOTES_SHA256);
  const scope = data.scope ?? {};
  const provenance = data.provenance ?? {};
  assert.equal(scope.ownerPairsSha256 ?? provenance.sourcePairsSha256, SOURCE_PAIRS_SHA256);
  assert.equal(scope.ownerIdentityAndNotesSha256 ?? provenance.sourceIdentityAndNotesSha256, IDENTITY_NOTES_SHA256);

  for (const row of entries) {
    const expected = EXPECTED_ROWS[row.key];
    assert.equal(row.owner, OWNER, `${row.key} owner`);
    assert.equal(row.catalogId, 'Definitions/Translation/nodeStrings', `${row.key} catalog`);
    assert.deepEqual(row.fieldPath, expected.fieldPath, `${row.key} display leaf`);
    assert.equal(row.source, expected.source, `${row.key} source text`);
    assert.deepEqual(row.notes, expected.notes, `${row.key} semantic notes`);
    assert.equal(row.displayRole, expected.displayRole, `${row.key} display role`);
    assert.equal(row.dontTranslate, false, `${row.key} is a translatable display value`);
    assert.equal(row.vendorJapanese, row.source, `${row.key} vendor Japanese is an English echo, not a translation`);
    assertNativeTranslationFormat(row.source, row.source);
  }

  for (const [role, expected] of Object.entries(EXPECTED_ROLE_KEYS)) {
    assert.deepEqual(entries.filter(row => row.displayRole === role).map(row => row.key), expected, `${role} role binding`);
  }
}

function assertHistoricalCandidatesAreReadOnly(entries) {
  const arrayName = findEntry(entries, 'nodeName:arrayDistribution');
  if (!arrayName.oldCandidates) {
    assert.ok(entries.every(row => !Object.hasOwn(row, 'oldCandidates')),
      'historical candidate index belongs to stage evidence, not the approved module');
    return;
  }

  for (const locale of LOCALES) {
    const candidateSet = arrayName.oldCandidates[locale];
    assert.equal(candidateSet.candidateKind, 'exact-single-candidate', `${locale} history classification`);
    for (const candidate of candidateSet.candidates) for (const origin of candidate.origins) {
      assert.equal(origin.writeback, false, `${locale} historical candidate is evidence only`);
      if (origin.sourceRole === 'model-display') {
        assert.equal(origin.displayOnly, true, `${locale} model display origin is display-only`);
        assert.equal(origin.id, 'tools/model_display_translations.json');
        assert.equal(origin.path, '/entries/source=Array/translation');
      }
    }
    assert.ok(candidateSet.candidates.some(candidate => candidate.origins.some(origin => origin.sourceRole === 'model-display')),
      `${locale} display model origin remains explicitly non-writeback`);
  }
}

function isSourceOnlyStageInput(data, stageInput) {
  return Boolean(stageInput
    && data?.approvalState === SOURCE_ONLY_APPROVAL
    && !data?.provenance?.approvalState
    && Array.isArray(data?.entries)
    && data.entries.every(row => !Object.hasOwn(row, 'translations')));
}

function translationContractSkipReason(inputExists, stageInput, data) {
  if (!inputExists) return SKIP_SOURCE_CONTRACT;
  if (isSourceOnlyStageInput(data, stageInput)) return SOURCE_ONLY_SKIP;
  return false;
}

const SELECTED_INPUT = INPUT_EXISTS ? (() => {
  try { return readInput(); } catch { return null; }
})() : null;
const SKIP_TRANSLATION_CONTRACT = translationContractSkipReason(INPUT_EXISTS, STAGE_INPUT, SELECTED_INPUT);

function assertDecisionAndFormatContract(entries) {
  let count = 0;
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry.translations ?? {}).sort(), [...LOCALES].sort(), `${entry.key} locale set`);
    for (const locale of LOCALES) {
      const decision = entry.translations[locale];
      assert.ok(decision && ['translate', 'preserve'].includes(decision.decision), `${entry.key}/${locale} explicit decision`);
      assert.equal(typeof decision.text, 'string');
      assert.ok(decision.text.trim(), `${entry.key}/${locale} text is nonempty`);
      if (decision.decision === 'preserve') assert.equal(decision.text, entry.source, `${entry.key}/${locale} preserve identity`);
      assertNativeTranslationFormat(entry.source, decision.text);
      count += 1;
    }
  }
  assert.equal(count, 12, 'four source leaves require twelve explicit locale decisions');
  for (const locale of LOCALES) {
    const tooltip = findEntry(entries, 'attrInfo:arrayDistribution.array').translations[locale].text;
    assert.ok(tooltip.includes('(X, Y)'), `${locale} preserves the coordinate parameter literally`);
  }
}

function assertDisplayProjection(data) {
  const { entries } = data;
  const nodeValue = { nodeType: OWNER, niceName: 'Array model identity', modelIdentity: 'fixture-identity' };
  for (const entry of entries) {
    let target = nodeValue;
    for (const part of entry.fieldPath.slice(0, -1)) target = target[part] ??= {};
    target[entry.fieldPath.at(-1)] = { 'UI-text': entry.source, notes: entry.notes };
  }
  const source = [{ type: 'nodeStrings', value: nodeValue }];
  const before = structuredClone(source);
  const vendorJapanese = [{ type: 'nodeStrings', value: structuredClone(nodeValue) }];
  const vendorBefore = structuredClone(vendorJapanese);
  const catalog = collectNativeCatalog('array-distribution-fixture', source, vendorJapanese);
  assert.equal(catalog.entries.length, 4);
  assert.equal(catalog.unmapped.length, 0);
  for (const locale of LOCALES) {
    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[locale] }));
    const resolved = resolveTranslations(catalog.entries, locale, reviews);
    const pack = JSON.parse(renderNativePack(resolved));
    assert.equal(pack.length, 1);
    assert.equal(pack[0].type, 'strings');
    assert.equal(Object.keys(pack[0].value).length, 4);
    for (const row of resolved.rows) {
      const decision = findEntry(entries, row.key).translations[locale].decision;
      assert.equal(row.status, decision === 'preserve' ? 'preserved' : 'reviewed', `${row.key}/${locale} projection status`);
    }
    for (const entry of entries) {
      assert.deepEqual(pack[0].value[entry.key], { 'UI-text': entry.translations[locale].text },
        `${entry.key}/${locale} displays only its explicit decision text`);
    }
    assert.deepEqual(source, before);
    assert.deepEqual(vendorJapanese, vendorBefore);
    assert.equal(source[0].value.nodeType, OWNER);
    assert.equal(source[0].value.niceName, 'Array model identity');
    assert.equal(source[0].value.modelIdentity, 'fixture-identity');
  }
}

test('Array Distribution loads only the selected source and gates approval at the fixed module path', () => {
  assert.ok(INPUT_EXISTS, STAGE_INPUT
    ? `RED: requested Array Distribution stage input is missing at ${INPUT_PATH}`
    : `RED: approved arrayDistribution module is not present at ${OFFICIAL_MODULE}`);
  const selected = readInput();
  assert.ok(Array.isArray(selected.entries), 'selected input must contain source-bound entries');
  if (STAGE_INPUT) {
    assert.equal(path.resolve(INPUT_PATH), path.resolve(STAGE_INPUT));
    if (path.basename(INPUT_PATH) === 'source.json') {
      assert.equal(selected.approvalState, SOURCE_ONLY_APPROVAL);
    }
    return;
  }
  assert.equal(selected.provenance.approvalState, FORMAL_APPROVAL);
});

test('Array Distribution binds its exact four official source leaves, notes, roles and identity digests',
  { skip: SKIP_SOURCE_CONTRACT }, () => assertSourceContract(readInput()));

test('Position, duplicate-list length, sequence index and Array data-list meaning stay source-bound',
  { skip: SKIP_SOURCE_CONTRACT }, () => {
    const { entries } = readInput();
    const tooltip = findEntry(entries, 'attrInfo:arrayDistribution.array');
    const position = findEntry(entries, 'nodeAttr:arrayDistribution.array');
    const info = findEntry(entries, 'nodeInfo:arrayDistribution');
    const name = findEntry(entries, 'nodeName:arrayDistribution');
    assert.ok(tooltip.source.includes('(X, Y)'), 'coordinate parameter token is literal source content');
    assert.match(tooltip.source, /one per duplicate/i);
    assert.match(tooltip.source, /list’s length sets the duplicate count/i);
    assert.match(tooltip.notes[0], /manually entered set of values/i);
    assert.equal(position.source, 'Position');
    assert.match(position.notes[0], /X\/Y coordinate/i);
    assert.match(info.source, /positions for each index/i);
    assert.match(info.notes[0], /duplicate’s position number in its sequence/i);
    assert.equal(name.source, 'Array');
    assert.match(name.notes[0], /programming\/data term \(a list of values\)/i);
    assert.doesNotMatch(name.notes[0], /grid|lattice/i);
  });

test('historical Array display-name candidates remain non-writeback evidence',
  { skip: SKIP_SOURCE_CONTRACT }, () => assertHistoricalCandidatesAreReadOnly(readInput().entries));

test('source-contract reverse mutants reject changed coordinates, counts, indices, grid meaning and candidate ownership',
  { skip: SKIP_SOURCE_CONTRACT }, () => {
    const original = readInput();
    const mutations = [
      ['coordinate parameter', data => { findEntry(data.entries, 'attrInfo:arrayDistribution.array').source = data.entries[0].source.replace('(X, Y)', '(X/Y)'); }],
      ['one position per duplicate', data => { findEntry(data.entries, 'attrInfo:arrayDistribution.array').source = data.entries[0].source.replace('one per duplicate', 'one list per layout'); }],
      ['list length determines duplicate count', data => { findEntry(data.entries, 'attrInfo:arrayDistribution.array').source = data.entries[0].source.replace('The list’s length sets the duplicate count.', 'The duplicate count sets the list’s length.'); }],
      ['Position is an X/Y coordinate', data => { findEntry(data.entries, 'nodeAttr:arrayDistribution.array').notes[0] = 'As in setting the grid row for each item.'; }],
      ['index is a duplicate sequence position', data => { findEntry(data.entries, 'nodeInfo:arrayDistribution').notes[0] = 'Index is a generated row in a regular grid.'; }],
      ['Array is a value list, not a grid', data => { findEntry(data.entries, 'nodeName:arrayDistribution').notes[0] = 'The name of a regular grid generator.'; }],
    ];
    assert.ok(mutations.length >= 6);
    for (const [label, mutate] of mutations) {
      const changed = structuredClone(original);
      mutate(changed);
      assert.throws(() => assertSourceContract(changed), assert.AssertionError, `${label} mutant must fail`);
    }
    if (original.entries.some(row => row.oldCandidates)) {
      const changed = structuredClone(original.entries);
      const candidate = findEntry(changed, 'nodeName:arrayDistribution').oldCandidates['zh-Hans'].candidates[0];
      const displayOrigin = candidate.origins.find(origin => origin.sourceRole === 'model-display');
      displayOrigin.writeback = true;
      assert.throws(() => assertHistoricalCandidatesAreReadOnly(changed), assert.AssertionError,
        'display-only candidate writeback mutant must fail');
    }
  });

test('approved-state input with one missing locale is not skipped and fails the twelve-decision contract', () => {
  const entries = Object.entries(EXPECTED_ROWS).map(([key, row]) => ({
    ...structuredClone(row), key, owner: OWNER, translations: Object.fromEntries(LOCALES.map(locale => [locale, {
      decision: 'preserve', text: row.source,
    }])),
  }));
  const approvedFixture = {
    approvalState: FORMAL_APPROVAL,
    provenance: { approvalState: FORMAL_APPROVAL },
    entries,
  };
  const sourceOnlyFixture = {
    approvalState: SOURCE_ONLY_APPROVAL,
    entries: Object.entries(EXPECTED_ROWS).map(([key, row]) => ({ ...structuredClone(row), key, owner: OWNER })),
  };
  delete findEntry(entries, 'attrInfo:arrayDistribution.array').translations.ja_JP;

  assert.equal(translationContractSkipReason(true, '/stage/source.json', sourceOnlyFixture), SOURCE_ONLY_SKIP,
    'only an explicitly selected source-only stage fixture may defer translations');
  assert.equal(translationContractSkipReason(true, null, sourceOnlyFixture), false,
    'source-only contents at the formal path are not allowed to defer approval contracts');
  assert.equal(translationContractSkipReason(true, null, approvedFixture), false,
    'a present formal input must execute, never skip, the locale contract');
  assert.equal(translationContractSkipReason(true, '/stage/approved-array.json', approvedFixture), false,
    'approval-state stage data with missing text is not source-only');
  assert.throws(() => assertDecisionAndFormatContract(entries), assert.AssertionError,
    'missing one locale must produce RED even when all supplied values are exact-source preserves');

  const inventedFormat = Object.entries(EXPECTED_ROWS).map(([key, row]) => ({
    ...structuredClone(row), key, owner: OWNER, translations: Object.fromEntries(LOCALES.map(locale => [locale, {
      decision: 'preserve', text: row.source,
    }])),
  }));
  const tooltip = findEntry(inventedFormat, 'attrInfo:arrayDistribution.array').translations['zh-Hans'];
  tooltip.decision = 'translate';
  tooltip.text = `<b>${findEntry(inventedFormat, 'attrInfo:arrayDistribution.array').source}</b>`;
  assert.throws(() => assertDecisionAndFormatContract(inventedFormat), /HTML tag\/attribute format/,
    'synthetic source-equivalent baseline with invented markup must fail format validation');
});

test('all twelve future locale decisions retain source formatting and the literal coordinate pair',
  { skip: SKIP_TRANSLATION_CONTRACT }, () => {
    const { entries } = readInput();
    assertSourceContract(readInput());
    assertDecisionAndFormatContract(entries);
  });

test('all twelve reviewed values retain manual entry, list-count direction, sequence index and regional Array terms',
  { skip: SKIP_TRANSLATION_CONTRACT }, () => assertReviewedSemantics(readInput().entries));

test('actual translation mutants cannot reverse counts, delete manual entry, spatialize index or invent a grid',
  { skip: SKIP_TRANSLATION_CONTRACT }, () => {
    const original = readInput().entries;
    assertReviewedSemantics(original);
    const mutations = [
      ['manual entry', 'attrInfo:arrayDistribution.array', 'zh-Hans', text => text.replace('手动', '自动')],
      ['manual entry Traditional', 'attrInfo:arrayDistribution.array', 'zh-Hant', text => text.replace('手動', '自動')],
      ['manual entry Japanese', 'attrInfo:arrayDistribution.array', 'ja_JP', text => text.replace('手動で', '自動で')],
      ['count direction', 'attrInfo:arrayDistribution.array', 'zh-Hans', text => text.replace('列表长度决定副本数量', '副本数量决定列表长度')],
      ['one coordinate pair', 'attrInfo:arrayDistribution.array', 'ja_JP', text => text.replace('1組ずつ', '2組ずつ')],
      ['coordinate literal', 'attrInfo:arrayDistribution.array', 'zh-Hant', text => text.replace('(X, Y)', '(X/Y)')],
      ['coordinate label', 'nodeAttr:arrayDistribution.array', 'zh-Hans', () => '索引'],
      ['sequence index', 'nodeInfo:arrayDistribution', 'zh-Hans', text => text.replace('每个索引', '每个网格行')],
      ['Japanese placement grammar', 'nodeInfo:arrayDistribution', 'ja_JP', text => text.replace('配置します', '分布します')],
      ['data-list name', 'nodeName:arrayDistribution', 'zh-Hans', () => '网格'],
      ['regional data-list name', 'nodeName:arrayDistribution', 'zh-Hant', () => '網格'],
      ['Japanese data-list name', 'nodeName:arrayDistribution', 'ja_JP', () => 'グリッド'],
    ];
    for (const [label, key, locale, mutate] of mutations) {
      const changed = structuredClone(original);
      const value = findEntry(changed, key).translations[locale];
      const before = value.text;
      value.text = mutate(before);
      assert.notEqual(value.text, before, `${label} must be a real text mutation`);
      assert.throws(() => assertReviewedSemantics(changed), assert.AssertionError, `${label} must fail`);
    }
  });

test('native pack projects only the reviewed display leaves without mutating Array model identity',
  { skip: SKIP_TRANSLATION_CONTRACT }, () => assertDisplayProjection(readInput()));
