/**
 * [INPUT]: 依赖缓动显示数据、现行native菜单源与仓外表生成器。
 * [OUTPUT]: 验证20项身份、三语闭合、五个复用源键和C++表边界。
 * [POS]: tools纯构建期合同；不注册官方键、不启动App、不证明实屏显示。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const DATA = require('./native_easing_display_data.js');
const NATIVE_MENU = require('../languages/native/menus_comp_animation.js');
const generator = require('./build_native_easing_display_table.js');
const REPO_ROOT = path.resolve(__dirname, '..');
const EXPECTED_IDENTITIES = [
  'None', 'SlowIn', 'SlowOut', 'SlowInSlowOut', 'VerySlowIn', 'VerySlowOut',
  'VerySlowInVerySlowOut', 'SpringIn', 'SpringOut', 'SpringInSpringOut',
  'SmallSpringIn', 'SmallSpringOut', 'SmallSpringInSmallSpringOut',
  'AnticipateIn', 'OvershootOut', 'AnticipateInOvershootOut', 'BounceIn',
  'BounceOut', 'BounceInBounceOut', 'Custom',
];

function cloneData() {
  return JSON.parse(JSON.stringify(DATA));
}

function nativeEntriesWith(change) {
  return NATIVE_MENU.entries.map(entry => entry.key === change.key ? change.update(entry) : entry);
}

test('projects the fixed 20 identities and reuses exactly five native translations', () => {
  const rows = generator.projectRows(DATA, NATIVE_MENU.entries);
  assert.equal(rows.length, 20);
  assert.deepEqual(rows.map(row => row.identity), EXPECTED_IDENTITIES);
  assert.equal(new Set(rows.map(row => row.source)).size, 20);
  assert.equal(DATA.rows.filter(row => row.nativeKey).length, 5);
  assert.equal(DATA.rows.filter(row => !row.nativeKey).length, 15);

  const nativeRows = DATA.rows.filter(row => row.nativeKey);
  for (const sourceRow of nativeRows) {
    assert.equal(Object.hasOwn(sourceRow, 'translations'), false);
    const native = NATIVE_MENU.entries.find(entry => entry.key === sourceRow.nativeKey);
    const projected = rows.find(row => row.identity === sourceRow.identity);
    assert.equal(projected.source, native.source);
    assert.equal(projected.zhHans, native.translations['zh-Hans'].text);
    assert.equal(projected.zhHant, native.translations['zh-Hant'].text);
    assert.equal(projected.japanese, native.translations.ja_JP.text);
  }
});

test('marks supplemental translations root-approved but display-only and non-live', () => {
  assert.equal(DATA.provenance.reviewStatus, 'ROOT_APPROVED_DISPLAY_ONLY');
  assert.equal(DATA.provenance.approvedBy, 'root');
  assert.equal(DATA.provenance.officialCatalogRegistration, false);
  assert.equal(DATA.provenance.officialPackStatistics, false);
  assert.equal(DATA.provenance.liveAcceptance, false);
  assert.equal(DATA.rows.filter(row => row.approval === 'ROOT_APPROVED_DISPLAY_ONLY').length, 15);
});

test('rejects incomplete rows, duplicate identities, and duplicate sources', () => {
  const missing = cloneData();
  missing.rows.pop();
  assert.throws(() => generator.projectRows(missing, NATIVE_MENU.entries), /exactly 20 rows/);

  const duplicateIdentity = cloneData();
  duplicateIdentity.rows[1].identity = duplicateIdentity.rows[0].identity;
  assert.throws(() => generator.projectRows(duplicateIdentity, NATIVE_MENU.entries), /duplicate easing identity/);

  const duplicateSource = cloneData();
  duplicateSource.rows[1].source = duplicateSource.rows[0].source;
  assert.throws(() => generator.projectRows(duplicateSource, NATIVE_MENU.entries), /duplicate easing source/);
});

test('rejects stale native sources, missing native translations, and unknown native keys', () => {
  const nativeKey = DATA.rows.find(row => row.nativeKey).nativeKey;
  assert.throws(() => generator.projectRows(DATA, nativeEntriesWith({
    key: nativeKey, update: entry => ({ ...entry, source: 'Changed source' }),
  })), /native source mismatch/);

  assert.throws(() => generator.projectRows(DATA, nativeEntriesWith({
    key: nativeKey,
    update: entry => ({ ...entry, translations: { ...entry.translations, ja_JP: undefined } }),
  })), /native translation is not approved/);

  const unknownKey = cloneData();
  unknownKey.rows.find(row => row.nativeKey).nativeKey = 'menu.unreviewed.key';
  assert.throws(() => generator.projectRows(unknownKey, NATIVE_MENU.entries), /unapproved native easing key/);
});

test('rejects incomplete supplemental translations and non-approved provenance', () => {
  const missingTranslation = cloneData();
  delete missingTranslation.rows.find(row => !row.nativeKey).translations.japanese;
  assert.throws(() => generator.projectRows(missingTranslation, NATIVE_MENU.entries), /japanese must be a non-empty string/);

  const falseApproval = cloneData();
  falseApproval.rows.find(row => !row.nativeKey).approval = 'ROOT_PROPOSED_PENDING_REVIEW';
  assert.throws(() => generator.projectRows(falseApproval, NATIVE_MENU.entries), /lacks display-only root approval/);

  const officialRegistration = cloneData();
  officialRegistration.provenance.officialCatalogRegistration = true;
  assert.throws(() => generator.projectRows(officialRegistration, NATIVE_MENU.entries), /display provenance/);
});

test('renders a self-contained constexpr std::array with valid UTF-8 C++ escapes', () => {
  const rows = generator.projectRows(DATA, NATIVE_MENU.entries);
  const customized = rows.map(row => row.identity === 'SlowIn'
    ? { ...row, zhHans: 'A"\\ 😀' }
    : row);
  const rendered = generator.renderTable(customized);
  assert.match(rendered, /#include <array>/);
  assert.match(rendered, /#include <string_view>/);
  assert.match(rendered, /namespace native_easing_display \{/);
  assert.match(rendered, /struct Row \{/);
  assert.match(rendered, /inline constexpr std::array<Row, 20> kRows\{\{/);
  assert.match(rendered, /std::string_view identity;/);
  assert.match(rendered, /std::string_view japanese;/);
  assert.ok(rendered.includes(String.raw`u8"A\"\\ \U0001f600", 8`));
  assert.doesNotMatch(rendered, /official catalog registration: true/i);

  const malformed = rows.map(row => row.identity === 'SlowIn' ? { ...row, zhHans: '\ud800' } : row);
  assert.throws(() => generator.renderTable(malformed), /unpaired high surrogate/);
});

test('accepts only an absolute output path outside the checkout', () => {
  assert.deepEqual(generator.parseArguments(['--out', path.join(os.tmpdir(), 'easing-display-table.inc')]), {
    outputFile: path.resolve(os.tmpdir(), 'easing-display-table.inc'),
  });
  assert.throws(() => generator.parseArguments([]), /usage:/);
  assert.throws(() => generator.parseArguments(['--out', 'relative.inc']), /absolute path/);
  assert.throws(() => generator.parseArguments(['--out', path.join(REPO_ROOT, 'easing-display-table.inc')]), /outside the repository/);
});

test('classifies Windows output paths with native cross-volume relative semantics', () => {
  const winPath = path.win32;
  const windowsRepo = 'D:\\work\\Cavalry-i18n';
  const parseWindowsOutput = output => generator.parseArguments(
    ['--out', output],
    winPath,
    windowsRepo,
  );

  assert.deepEqual(parseWindowsOutput('D:\\temp\\easing-display-table.inc'), {
    outputFile: 'D:\\temp\\easing-display-table.inc',
  });
  assert.deepEqual(parseWindowsOutput('C:\\temp\\easing-display-table.inc'), {
    outputFile: 'C:\\temp\\easing-display-table.inc',
  });
  assert.deepEqual(parseWindowsOutput('D:\\work\\Cavalry-i18n-output\\easing-display-table.inc'), {
    outputFile: 'D:\\work\\Cavalry-i18n-output\\easing-display-table.inc',
  });
  assert.throws(() => parseWindowsOutput('D:\\work\\Cavalry-i18n\\easing-display-table.inc'), /outside the repository/);
});

test('writes only the requested external table', () => {
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'cavalry-easing-table-test.'));
  const outputFile = path.join(outputDirectory, 'easing-display-table.inc');
  try {
    const receipt = generator.generate({ outputFile });
    assert.equal(receipt.rowCount, 20);
    assert.equal(receipt.reviewStatus, 'ROOT_APPROVED_DISPLAY_ONLY');
    assert.equal(receipt.liveAcceptance, false);
    const table = fs.readFileSync(outputFile, 'utf8');
    assert.match(table, /native_easing_display::kRows/);
    assert.equal((table.match(/^    \{/gm) || []).length, 20);
    assert.equal(fs.readdirSync(outputDirectory).join(','), 'easing-display-table.inc');
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});
