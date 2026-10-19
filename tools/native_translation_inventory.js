#!/usr/bin/env node
/**
 * [INPUT]: 依赖调用方提供的官方源/日语 catalog 对、旧 JSON 候选 surfaces 与已提取 TS 词条
 * [OUTPUT]: 对外提供按 registry key 稳定排序的全量候选队列、未映射叶及逐语言状态计数
 * [POS]: tools 的纯只读队列编排器；组合键投影和候选索引，不读取安装、不做审校、不写语言包
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const { collectNativeCatalog } = require('./native_language_pack.js');
const { buildTranslationCandidates } = require('./native_translation_candidates.js');

const LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const CATEGORIES = Object.freeze([
  'dontTranslate',
  'vendor-ja',
  'exact-single-candidate',
  'exact-ambiguous',
  'no-existing-candidate',
]);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function requireArray(value, name) {
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`);
  return value;
}

function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be a non-empty string`);
  return value;
}

function hasVendorJapanese(entry) {
  return typeof entry.vendorJapanese === 'string'
    && entry.vendorJapanese.trim().length > 0
    && entry.vendorJapanese !== entry.source;
}

function candidateFor(row, locale) {
  const candidate = row.locales[locale] || { kind: 'no-existing-candidate', candidates: [] };
  const priority = row.dontTranslate === true
    ? 'dontTranslate'
    : locale === 'ja_JP' && hasVendorJapanese(row) ? 'vendor-ja' : null;
  return {
    candidateKind: candidate.kind,
    candidates: candidate.candidates,
    priority,
  };
}

function categoryFor(row, locale, state) {
  if (row.dontTranslate === true) return 'dontTranslate';
  if (locale === 'ja_JP' && hasVendorJapanese(row)) return 'vendor-ja';
  return state.candidateKind;
}

function sortUnmapped(rows) {
  return [...rows].sort((a, b) => compare(a.catalogId || '', b.catalogId || '')
    || compare(a.owner || '', b.owner || '')
    || compare(JSON.stringify(a.fieldPath || []), JSON.stringify(b.fieldPath || []))
    || compare(a.source || '', b.source || ''));
}

function buildNativeTranslationInventory(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('inventory input must be an object');
  }
  const catalogPairs = requireArray(input.catalogPairs, 'catalogPairs');
  const jsonSurfaces = requireArray(input.jsonSurfaces, 'jsonSurfaces');
  const tsEntries = requireArray(input.tsEntries, 'tsEntries');
  if (catalogPairs.length === 0) throw new Error('catalogPairs must not be empty');
  for (const surface of jsonSurfaces) {
    if (!LOCALES.includes(surface?.locale)) throw new Error(`unsupported JSON locale: ${surface?.locale}`);
  }
  for (const entry of tsEntries) {
    if (!LOCALES.includes(entry?.locale)) throw new Error(`unsupported TS locale: ${entry?.locale}`);
  }

  // -- 每个文件对必须具名；交由调用方核对期望清单，编排器不猜缺失文件 --------
  const seenCatalogIds = new Set();
  const entries = [];
  const unmapped = [];
  for (const pair of catalogPairs) {
    const id = requireText(pair?.id, 'catalog pair id');
    if (seenCatalogIds.has(id)) throw new Error(`duplicate catalog id: ${id}`);
    seenCatalogIds.add(id);
    const source = requireArray(pair.source, `catalog source for ${id}`);
    if (source.length === 0) throw new Error(`catalog source must not be empty: ${id}`);
    if (!Object.hasOwn(pair, 'japanese')) throw new Error(`catalog pair requires japanese: ${id}`);
    requireArray(pair.japanese, `catalog japanese for ${id}`);
    const collected = collectNativeCatalog(id, pair.source, pair.japanese);
    entries.push(...collected.entries);
    unmapped.push(...collected.unmapped);
  }

  // -- 键是跨 catalog 的唯一实体身份；撞键不得靠后写覆盖前写 -----------------
  const seenKeys = new Set();
  for (const entry of entries) {
    if (seenKeys.has(entry.key)) throw new Error(`duplicate registry key: ${entry.key}`);
    seenKeys.add(entry.key);
  }
  entries.sort((a, b) => compare(a.key, b.key));

  const candidateResult = buildTranslationCandidates({ jsonSurfaces, tsEntries, mappedEntries: entries });
  const rows = candidateResult.rows.map(row => {
    const locales = Object.fromEntries(LOCALES.map(locale => [locale, candidateFor(row, locale)]));
    return { ...row, locales };
  }).sort((a, b) => compare(a.key, b.key));

  const counts = Object.fromEntries(LOCALES.map(locale => {
    const perLocale = { total: rows.length, ...Object.fromEntries(CATEGORIES.map(category => [category, 0])) };
    for (const row of rows) {
      const category = categoryFor(row, locale, row.locales[locale]);
      if (!Object.hasOwn(perLocale, category)) throw new Error(`unsupported candidate state: ${category}`);
      perLocale[category] += 1;
    }
    return [locale, perLocale];
  }));

  return {
    catalogCount: seenCatalogIds.size,
    catalogIds: [...seenCatalogIds].sort(compare),
    entries,
    rows,
    unmapped: sortUnmapped(unmapped),
    counts,
  };
}

module.exports = { buildNativeTranslationInventory };
