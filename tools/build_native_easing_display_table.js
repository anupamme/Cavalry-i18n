#!/usr/bin/env node
/**
 * [INPUT]: 依赖20项固定缓动行与现行五个native菜单源键。
 * [OUTPUT]: 在仓外生成native_easing_display::kRows C++头文件。
 * [POS]: tools构建期投影；不注册catalog、不接入运行时或官方包统计。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const DISPLAY_DATA = require('./native_easing_display_data.js');
const NATIVE_MENU = require('../languages/native/menus_comp_animation.js');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOCALES = Object.freeze(['zhHans', 'zhHant', 'japanese']);
const NATIVE_LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const EXPECTED_NATIVE_KEYS = Object.freeze([
  'menu.anim.easingNone',
  'menu.anim.easingSlowInOut',
  'menu.anim.easingVerySlowInOut',
  'menu.anim.easingSpringOut',
  'menu.anim.easingBounceOut',
]);
const ROW_COUNT = 20;

function requireProvenance(provenance) {
  if (!provenance || provenance.schemaVersion !== 1 ||
      provenance.reviewStatus !== 'ROOT_APPROVED_DISPLAY_ONLY' ||
      provenance.scope !== 'display-only built-in menu labels' ||
      provenance.officialCatalogRegistration !== false ||
      provenance.officialPackStatistics !== false ||
      provenance.approvedBy !== 'root' || provenance.liveAcceptance !== false ||
      typeof provenance.approvalScope !== 'string' || provenance.approvalScope.length === 0) {
    throw new Error('display provenance must stay root-approved, non-live, and outside official catalog statistics');
  }
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
}

function requireProjectedRows(rows) {
  if (!Array.isArray(rows) || rows.length !== ROW_COUNT) {
    throw new Error(`easing display table must contain exactly ${ROW_COUNT} rows`);
  }
  const identities = new Set();
  const sources = new Set();
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object') throw new Error(`row ${index} must be an object`);
    for (const field of ['identity', 'source', ...LOCALES]) requireText(row[field], `row ${index} ${field}`);
    if (identities.has(row.identity)) throw new Error(`duplicate easing identity: ${row.identity}`);
    if (sources.has(row.source)) throw new Error(`duplicate easing source: ${row.source}`);
    identities.add(row.identity);
    sources.add(row.source);
  }
  return rows;
}

function projectRows(data, nativeEntries) {
  requireProvenance(data && data.provenance);
  if (!Array.isArray(data.rows) || data.rows.length !== ROW_COUNT) {
    throw new Error(`source data must contain exactly ${ROW_COUNT} rows`);
  }
  if (!Array.isArray(nativeEntries)) throw new Error('native menu entries must be an array');

  const expectedKeys = new Set(EXPECTED_NATIVE_KEYS);
  const nativeByKey = new Map();
  for (const entry of nativeEntries) {
    if (!entry || !expectedKeys.has(entry.key)) continue;
    if (nativeByKey.has(entry.key)) throw new Error(`duplicate native menu key: ${entry.key}`);
    nativeByKey.set(entry.key, entry);
  }

  const identities = new Set();
  const sources = new Set();
  const referencedKeys = new Set();
  const projected = data.rows.map((row, index) => {
    if (!row || typeof row !== 'object') throw new Error(`source row ${index} must be an object`);
    requireText(row.identity, `source row ${index} identity`);
    requireText(row.source, `source row ${index} source`);
    if (identities.has(row.identity)) throw new Error(`duplicate easing identity: ${row.identity}`);
    if (sources.has(row.source)) throw new Error(`duplicate easing source: ${row.source}`);
    identities.add(row.identity);
    sources.add(row.source);

    const nativeKey = row.nativeKey;
    let translations;
    if (nativeKey !== null && nativeKey !== undefined) {
      if (!expectedKeys.has(nativeKey)) throw new Error(`unapproved native easing key: ${nativeKey}`);
      if (referencedKeys.has(nativeKey)) throw new Error(`duplicate native easing reference: ${nativeKey}`);
      if (row.translations !== undefined) throw new Error(`native row must reuse its existing translations: ${nativeKey}`);
      const nativeRow = nativeByKey.get(nativeKey);
      if (!nativeRow) throw new Error(`missing existing native easing key: ${nativeKey}`);
      if (nativeRow.source !== row.source) throw new Error(`native source mismatch for ${nativeKey}`);
      translations = Object.fromEntries(NATIVE_LOCALES.map((locale, localeIndex) => {
        const decision = nativeRow.translations && nativeRow.translations[locale];
        if (!decision || decision.decision !== 'translate') {
          throw new Error(`native translation is not approved for ${nativeKey} ${locale}`);
        }
        requireText(decision.text, `native translation ${nativeKey} ${locale}`);
        return [LOCALES[localeIndex], decision.text];
      }));
      referencedKeys.add(nativeKey);
    } else {
      if (row.approval !== 'ROOT_APPROVED_DISPLAY_ONLY') {
        throw new Error(`supplemental row ${row.identity} lacks display-only root approval`);
      }
      if (!row.translations || typeof row.translations !== 'object') {
        throw new Error(`supplemental row ${row.identity} lacks translations`);
      }
      translations = Object.fromEntries(LOCALES.map(locale => {
        requireText(row.translations[locale], `${row.identity} ${locale}`);
        return [locale, row.translations[locale]];
      }));
    }

    return {
      identity: row.identity,
      source: row.source,
      zhHans: translations.zhHans,
      zhHant: translations.zhHant,
      japanese: translations.japanese,
    };
  });

  if (referencedKeys.size !== EXPECTED_NATIVE_KEYS.length ||
      EXPECTED_NATIVE_KEYS.some(key => !referencedKeys.has(key))) {
    throw new Error('the five existing native easing keys must be referenced exactly once');
  }
  return requireProjectedRows(projected);
}

function requireWellFormedUnicode(value, label) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error(`${label} contains an unpaired high surrogate`);
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new Error(`${label} contains an unpaired low surrogate`);
    }
  }
}

function cppLiteral(value, label) {
  requireWellFormedUnicode(value, label);
  let escaped = '';
  for (const character of value) {
    const code = character.codePointAt(0);
    if (character === '"') escaped += '\\"';
    else if (character === '\\') escaped += '\\\\';
    else if (code === 0x07) escaped += '\\a';
    else if (code === 0x08) escaped += '\\b';
    else if (code === 0x09) escaped += '\\t';
    else if (code === 0x0a) escaped += '\\n';
    else if (code === 0x0b) escaped += '\\v';
    else if (code === 0x0c) escaped += '\\f';
    else if (code === 0x0d) escaped += '\\r';
    else if (code < 0x20 || code === 0x7f) escaped += `\\${code.toString(8).padStart(3, '0')}`;
    else if (code <= 0x7e) escaped += character;
    else if (code <= 0xffff) escaped += `\\u${code.toString(16).padStart(4, '0')}`;
    else escaped += `\\U${code.toString(16).padStart(8, '0')}`;
  }
  return `u8"${escaped}"`;
}

function renderTable(rows) {
  requireProjectedRows(rows);
  const fields = ['identity', 'source', 'zhHans', 'zhHant', 'japanese'];
  return [
    '/**',
    ' * [INPUT]: 依赖20项固定缓动身份、五个现有native源键和15项root批准补译。',
    ' * [OUTPUT]: 提供native_easing_display::kRows的20项constexpr表。',
    ' * [POS]: 构建期显示数据；不声称实屏通过，不计官方catalog或语言包统计。',
    ' * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md',
    ' */',
    '// Generated by tools/build_native_easing_display_table.js.',
    '#pragma once',
    '#include <array>',
    '#include <string_view>',
    '',
    'namespace native_easing_display {',
    'struct Row {',
    '    std::string_view identity;',
    '    std::string_view source;',
    '    std::string_view zhHans;',
    '    std::string_view zhHant;',
    '    std::string_view japanese;',
    '};',
    '',
    `inline constexpr std::array<Row, ${ROW_COUNT}> kRows{{`,
    ...rows.map((row, rowIndex) => `    {${fields.map(field => {
      const value = row[field];
      return `std::string_view{${cppLiteral(value, `${field}[${rowIndex}]`)}, ${Buffer.byteLength(value, 'utf8')}}`;
    }).join(', ')}},`),
    '}};',
    '}  // namespace native_easing_display',
    '',
  ].join('\n');
}

function validateOutputPath(outputInput, pathModel = path, repoRoot = REPO_ROOT) {
  if (typeof outputInput !== 'string' || !pathModel.isAbsolute(outputInput)) {
    throw new Error('output file must be an absolute path');
  }
  const outputFile = pathModel.resolve(outputInput);
  const relativeOutput = pathModel.relative(pathModel.resolve(repoRoot), outputFile);
  if (relativeOutput === '' || (!relativeOutput.startsWith(`..${pathModel.sep}`) &&
      relativeOutput !== '..' && !pathModel.isAbsolute(relativeOutput))) {
    throw new Error('output must remain outside the repository');
  }
  return outputFile;
}

function parseArguments(argv, pathModel = path, repoRoot = REPO_ROOT) {
  if (argv.length !== 2 || argv[0] !== '--out' || !argv[1] || argv[1].startsWith('--')) {
    throw new Error('usage: build_native_easing_display_table.js --out <absolute-file-outside-repository>');
  }
  return { outputFile: validateOutputPath(argv[1], pathModel, repoRoot) };
}

function generate({ outputFile }) {
  outputFile = validateOutputPath(outputFile);
  const rows = projectRows(DISPLAY_DATA, NATIVE_MENU.entries);
  const rendered = renderTable(rows);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, rendered, 'utf8');
  return { outputFile, rowCount: rows.length, reviewStatus: DISPLAY_DATA.provenance.reviewStatus, liveAcceptance: false };
}

function main(argv) {
  try {
    const result = generate(parseArguments(argv));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`build_native_easing_display_table: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { generate, parseArguments, projectRows, renderTable };
