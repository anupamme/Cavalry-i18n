#!/usr/bin/env node
/**
 * [INPUT]: 依赖官方assets、精确官方target域helper、Forge八键及365缺源固定source、审批模块、纠错登记及native/ICU纯投影。
 * [OUTPUT]: 提供三语预览/确定性manifest与区分官方/补充总量的CLI摘要；批准必须匹配source DNT，缺译保留fallback。
 * [POS]: macOS用户语言事务的构建输入owner；源身份/格式不符拒绝发布，不复制原厂catalog、不读私库或用户profile。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { collectNativeCatalog, resolveTranslations, renderNativePack } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const { sourceEntries: forgeSourceEntries, validateSupplementEntries, SUPPLEMENT_CATALOG_ID } = require('./native_schema_supplement');
const { sourceEntries: gapSourceEntries, validateGapEntries, GAP_CATALOG_ID } = require('./native_schema_gap_sources');
const { assertOfficialTarget } = require('./native_official_target');
const { APPROVED_VENDOR_CORRECTIONS } = require('../languages/native/approved_vendor_corrections');
const LANGUAGES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// -- 单一装配：源绑定先于任何输出，missing不会填入未经审批旧候选 ------
function collectOfficialEntries(pairs) {
  const entries = [];
  for (const pair of [...pairs].sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
    const collected = collectNativeCatalog(pair.id, pair.source, pair.japanese);
    if (collected.unmapped.length) throw new Error(`unmapped native display leaves: ${pair.id}`);
    entries.push(...collected.entries);
  }
  return entries;
}
function buildNativeResourceBundle(pairs, approved, trustedVendorCorrections = APPROVED_VENDOR_CORRECTIONS,
  supplementalEntries = []) {
  const entries = collectOfficialEntries(pairs);
  if (!Array.isArray(supplementalEntries)) throw new Error('native schema supplement entries must be an array');
  const forge = supplementalEntries.filter(row => row?.catalogId === SUPPLEMENT_CATALOG_ID);
  const gaps = supplementalEntries.filter(row => row?.catalogId === GAP_CATALOG_ID);
  if (forge.length + gaps.length !== supplementalEntries.length) throw new Error('unknown native schema supplement domain');
  const verifiedForge = forge.length ? validateSupplementEntries(forge, entries) : [];
  const verifiedGaps = gaps.length ? validateGapEntries(gaps, entries, { existingSupplementEntries: verifiedForge }) : [];
  const supplements = [...verifiedForge, ...verifiedGaps];
  entries.push(...supplements);
  const indexed = new Map();
  for (const row of entries) {
    if (indexed.has(row.key)) throw new Error(`duplicate native key: ${row.key}`);
    indexed.set(row.key, row);
  }
  const seen = new Set();
  for (const row of approved) {
    if (seen.has(row.key)) throw new Error(`duplicate approved key: ${row.key}`);
    seen.add(row.key);
    const source = indexed.get(row.key);
    if (!source) throw new Error(`unknown approved key: ${row.key}`);
    if (Object.hasOwn(row, 'dontTranslate') && typeof row.dontTranslate !== 'boolean') {
      throw new Error(`approved dontTranslate must be boolean for ${row.key}`);
    }
    if ((row.dontTranslate === true) !== (source.dontTranslate === true)) {
      throw new Error(`approved dontTranslate differs for ${row.key}`);
    }
    for (const field of ['source', 'notes', 'catalogId', 'owner', 'fieldPath']) {
      if ((field === 'source' || field === 'notes' || Object.hasOwn(row, field)) && !same(row[field], source[field])) {
        throw new Error(`approved ${field} differs for ${row.key}`);
      }
    }
    for (const language of LANGUAGES) {
      const decision = row.translations?.[language];
      if (!decision || typeof decision !== 'object' || Array.isArray(decision)
          || !Object.hasOwn(decision, 'decision') || !Object.hasOwn(decision, 'text')
          || Object.keys(decision).some(field => !['decision', 'text', 'vendorCorrection'].includes(field))) {
        throw new Error(`invalid locale decision for ${row.key}: ${language}`);
      }
    }
  }
  const packs = {};
  const manifest = {
    schemaVersion: 1, kind: 'development-preview', cavalryVersion: '2.8.0',
    approvedUIKeys: approved.length, nativeKeys: entries.length,
    supplementalKeys: supplements.length, complete: false, packs: {},
  };
  for (const language of LANGUAGES) {
    const reviews = approved.map(row => {
      const translation = row.translations[language];
      const review = { key: row.key, source: row.source, decision: translation.decision, text: translation.text };
      if (Object.hasOwn(translation, 'vendorCorrection')) review.vendorCorrection = translation.vendorCorrection;
      return review;
    });
    const resolved = resolveTranslations(entries, language, reviews, trustedVendorCorrections);
    const counts = { reviewed: 0, preserved: 0, vendor: 0, missing: 0 };
    for (const row of resolved.rows) {
      // vendor按官方来源槽计数；内部状态区分原样采用与源绑定纠错，不增typed manifest字段。
      counts[row.status === 'vendor-corrected' ? 'vendor' : row.status] += 1;
      if (row.status !== 'missing') assertNativeTranslationFormat(row.source, row.text);
    }
    packs[language] = renderNativePack(resolved);
    manifest.packs[language] = {
      file: `${language}.json`, nativeLocale: resolved.nativeLocale,
      sha256: sha256(packs[language]), bytes: Buffer.byteLength(packs[language]), ...counts,
    };
  }
  manifest.complete = LANGUAGES.every(language => manifest.packs[language].missing === 0);
  return { manifest, packs };
}

function safeRegularFile(root, relative) {
  if (path.isAbsolute(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`unsafe catalog relative path: ${relative}`);
  }
  let cursor = root;
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    const info = fs.lstatSync(cursor);
    if (info.isSymbolicLink()) throw new Error(`symlink catalog path: ${relative}`);
  }
  if (!fs.lstatSync(cursor).isFile()) throw new Error(`catalog is not a regular file: ${relative}`);
  return fs.readFileSync(cursor);
}

// -- 明确输入：锁定全部source/厂商JA，不递归猜测未来catalog ----------
function buildFromAssetRoot(assetRoot) {
  const root = fs.realpathSync(assetRoot);
  const targetBytes = fs.readFileSync(path.join(__dirname, 'cavalry_native_target.json'));
  const { target } = assertOfficialTarget(targetBytes);
  const sourceLock = target.sourceFiles?.[0];
  const pairs = target.catalogs.map(catalog => {
    const source = safeRegularFile(root, catalog.source);
    const japanese = safeRegularFile(root, catalog.japanese);
    if (sha256(source) !== catalog.sourceSha256 || sha256(japanese) !== catalog.japaneseSha256) {
      throw new Error(`official native catalog digest differs: ${catalog.id}`);
    }
    return { id: catalog.id, source: JSON.parse(source), japanese: JSON.parse(japanese) };
  });
  const nodeDefinitions = safeRegularFile(root, sourceLock.path);
  if (sha256(nodeDefinitions) !== sourceLock.sha256) throw new Error('native schema supplement source digest differs');
  const officialEntries = collectOfficialEntries(pairs);
  const supplements = [...forgeSourceEntries(nodeDefinitions, officialEntries),
    ...gapSourceEntries(nodeDefinitions, officialEntries)];
  const { approvedEntries } = require('../languages/native/approved_modules');
  const result = buildNativeResourceBundle(pairs, approvedEntries(), undefined, supplements);
  if (result.manifest.nativeKeys !== target.nativeKeys + target.supplementalKeys
      || result.manifest.supplementalKeys !== target.supplementalKeys
      || result.manifest.packs.ja_JP.vendor !== target.vendorJapaneseKeys) {
    throw new Error('native target key/vendor cardinality differs');
  }
  result.manifest.targetSha256 = sha256(targetBytes);
  result.manifest.inputSha256 = inputDigest();
  return result;
}

// -- 陈旧构建不能靠旧manifest重新获批；显式编译前核对tracked输入 ----
function inputDigest() {
  const { APPROVED_MODULES } = require('../languages/native/approved_modules');
  const files = [
    'languages/native/approved_modules.js',
    'languages/native/approved_vendor_corrections.js',
    ...APPROVED_MODULES.map(name => `languages/native/${name}.js`),
    'tools/native_resource_bundle.js', 'tools/native_language_pack.js',
    'tools/native_translation_format.js', 'tools/native_schema_supplement.js',
    'tools/native_schema_gap_sources.js',
    'tools/native_official_target.js', 'package-lock.json',
  ].sort();
  const repo = path.resolve(__dirname, '..');
  return sha256(JSON.stringify(files.map(file => [file, sha256(safeRegularFile(repo, file))])));
}
function validateBuildFreshness(manifest, expectedInputs, expectedTarget) {
  if (manifest.inputSha256 !== expectedInputs) throw new Error('native preview inputs are stale; rebuild native resources');
  if (manifest.targetSha256 !== expectedTarget) throw new Error('native preview target is stale; rebuild native resources');
  return true;
}
function checkBuildOutput() {
  const root = path.resolve(__dirname, '../src-tauri/target/native-language-packs');
  const manifest = JSON.parse(safeRegularFile(root, 'manifest.json'));
  validateBuildFreshness(manifest, inputDigest(), sha256(fs.readFileSync(path.join(__dirname, 'cavalry_native_target.json'))));
  for (const language of LANGUAGES) {
    const info = manifest.packs?.[language];
    if (info?.file !== `${language}.json`) throw new Error('native preview pack path differs');
    const bytes = safeRegularFile(root, info.file);
    if (bytes.length !== info.bytes || sha256(bytes) !== info.sha256) throw new Error('native preview payload differs');
  }
}

function publishBuildOutput(result) {
  const output = path.resolve(__dirname, '../src-tauri/target/native-language-packs');
  // 派生目录是固定构建位置；不允许symlink把写入引向App或profile。
  let cursor = path.parse(output).root;
  for (const part of output.slice(cursor.length).split(path.sep)) {
    cursor = path.join(cursor, part);
    if (!fs.existsSync(cursor)) fs.mkdirSync(cursor);
    const info = fs.lstatSync(cursor);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`unsafe build directory: ${cursor}`);
  }
  const allowed = new Set(['manifest.json', ...LANGUAGES.map(code => `${code}.json`)]);
  for (const name of fs.readdirSync(output)) {
    if (!allowed.has(name) || !fs.lstatSync(path.join(output, name)).isFile()
        || fs.lstatSync(path.join(output, name)).isSymbolicLink()) throw new Error(`foreign build output: ${name}`);
  }
  const atomicWrite = (name, bytes) => {
    const temporary = path.join(output, `.${name}.${randomUUID()}.tmp`);
    try { fs.writeFileSync(temporary, bytes, { mode: 0o600, flag: 'wx' }); fs.renameSync(temporary, path.join(output, name)); }
    finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  };
  for (const language of LANGUAGES) atomicWrite(`${language}.json`, result.packs[language]);
  // manifest最后发布；构建并发读到旧manifest/新payload会因摘要不符而拒绝使用。
  atomicWrite('manifest.json', `${JSON.stringify(result.manifest, null, 2)}\n`);
  return output;
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--check') { checkBuildOutput(); process.exit(0); }
    if (args.length !== 2 || args[0] !== '--assets-root') throw new Error('usage: native_resource_bundle.js --assets-root <official Contents/assets>');
    const result = buildFromAssetRoot(args[1]);
    const output = publishBuildOutput(result);
    console.log(JSON.stringify({
      output,
      approvedUIKeys: result.manifest.approvedUIKeys,
      nativeKeys: result.manifest.nativeKeys,
      officialCatalogKeys: result.manifest.nativeKeys - result.manifest.supplementalKeys,
      supplementalKeys: result.manifest.supplementalKeys,
      complete: result.manifest.complete,
      packs: result.manifest.packs,
    }, null, 2));
  } catch (error) { console.error(`[native-resource-bundle] ${error.message}`); process.exitCode = 1; }
}
module.exports = { buildNativeResourceBundle, buildFromAssetRoot, publishBuildOutput, validateBuildFreshness };
