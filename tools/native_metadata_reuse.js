#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_metadata_help.js 的 name-bound description 索引、旧四语 MetaData documents 与显式 source/可选译文 SHA-256 approvals
 * [OUTPUT]: 对外提供三语 source-bound reviews 和未批准项台账，不写回旧文档或投影任何机器字段
 * [POS]: tools 的 metadata 旧译复用边界；只读取旧 description，后续仍由 projectMetadataHelp 做投影与模板复核
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const { createHash } = require('node:crypto');
const { collectMetadataDescriptions } = require('./native_metadata_help.js');

const LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;

function requireRecord(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value;
}

function requireKey(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be non-empty`);
  return value;
}

function sourceHash(source) {
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

function filePart(key, name) {
  const separator = key.indexOf('#/');
  if (separator <= 0) throw new Error(`${name} must contain a stable metadata key`);
  return key.slice(0, separator);
}

function makeLegacyIndex(legacyDocuments, locale, file, cache) {
  const cacheKey = `${locale}\0${file}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const localizedFiles = legacyDocuments[locale];
  if (!localizedFiles || typeof localizedFiles !== 'object' || Array.isArray(localizedFiles)
      || !Object.hasOwn(localizedFiles, file)) {
    throw new Error(`missing legacy metadata document: ${locale}/${file}`);
  }
  const index = new Map(collectMetadataDescriptions(file, localizedFiles[file]).map(entry => [entry.key, entry]));
  cache.set(cacheKey, index);
  return index;
}

function validateTranslationHashes(approval, texts, key) {
  if (!Object.hasOwn(approval, 'translationSha256')) return;
  const hashes = requireRecord(approval.translationSha256, `translationSha256 for ${key}`);
  if (Object.keys(hashes).some(locale => !LOCALES.includes(locale))) {
    throw new Error(`translationSha256 must contain only the three target locales for ${key}`);
  }
  for (const locale of LOCALES) {
    if (!Object.hasOwn(hashes, locale)) throw new Error(`translationSha256 missing digest for ${locale}/${key}`);
    const digest = hashes[locale];
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error(`translationSha256 digest must be a SHA-256 hex value for ${locale}/${key}`);
    }
    if (digest !== sourceHash(texts[locale])) {
      throw new Error(`legacy translation hash differs for ${locale}/${key}`);
    }
  }
}

function resolveApprovedMetadataReuse({ file, source, legacyDocuments, approvals }) {
  const currentEntries = collectMetadataDescriptions(file, source);
  requireRecord(legacyDocuments, 'legacyDocuments');
  if (!Array.isArray(approvals)) throw new Error('approvals must be an array');

  const currentByKey = new Map(currentEntries.map(entry => [entry.key, entry]));
  const approved = new Map();
  const legacyCache = new Map();

  for (const approval of approvals) {
    requireRecord(approval, 'metadata approval');
    const key = requireKey(approval.key, 'metadata approval key');
    if (approved.has(key)) throw new Error(`duplicate metadata approval key: ${key}`);
    const entry = currentByKey.get(key);
    if (!entry) throw new Error(`unknown metadata approval key: ${key}`);

    if (typeof approval.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(approval.sourceSha256)) {
      throw new Error(`approval sourceSha256 must be a SHA-256 hex digest for ${key}`);
    }
    if (approval.sourceSha256 !== sourceHash(entry.source)) {
      throw new Error(`approval source hash differs for ${key}`);
    }

    const legacyKey = approval.legacyKey == null ? key : requireKey(approval.legacyKey, 'legacyKey');
    const legacyFile = approval.legacyFile == null ? filePart(legacyKey, 'legacyKey') : requireKey(approval.legacyFile, 'legacyFile');
    if (filePart(legacyKey, 'legacyKey') !== legacyFile) {
      throw new Error(`legacy key does not belong to legacy file: ${legacyKey}`);
    }

    const english = makeLegacyIndex(legacyDocuments, 'en', legacyFile, legacyCache).get(legacyKey);
    if (!english) throw new Error(`unknown legacy metadata key: ${legacyKey}`);
    if (english.source !== entry.source) throw new Error(`legacy English source differs for ${key}`);

    const texts = {};
    for (const locale of LOCALES) {
      const translation = makeLegacyIndex(legacyDocuments, locale, legacyFile, legacyCache).get(legacyKey);
      if (!translation) throw new Error(`missing legacy ${locale} description: ${legacyKey}`);
      if (typeof translation.source !== 'string' || !translation.source.trim()) {
        throw new Error(`legacy translation must be non-empty for ${locale}/${legacyKey}`);
      }
      texts[locale] = translation.source;
    }
    validateTranslationHashes(approval, texts, key);
    approved.set(key, { entry, texts });
  }

  const reviews = Object.fromEntries(LOCALES.map(locale => [locale, []]));
  for (const [key, { entry, texts }] of [...approved].sort(([left], [right]) => compare(left, right))) {
    for (const locale of LOCALES) reviews[locale].push({ key, source: entry.source, text: texts[locale] });
  }

  const missingApprovals = currentEntries.filter(entry => !approved.has(entry.key)).map(entry => ({
    key: entry.key,
    source: entry.source,
    sourceSha256: sourceHash(entry.source),
    owner: entry.owner,
  }));

  return { reviews, missingApprovals };
}

module.exports = { resolveApprovedMetadataReuse };
