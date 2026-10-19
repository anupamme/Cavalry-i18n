#!/usr/bin/env node
/**
 * [INPUT]: 依赖调用方提供的 2.8 catalog/dontTranslate/厂商日语及源审校决定；DNT显示例外只认官方demo叶身份
 * [OUTPUT]: 提供显示键投影/未知叶台账、语言码、源身份摘要、默认厂商优先及受限例外选择与单语言 strings.json
 * [POS]: tools 的构建期纯数据投影；默认保留DNT，例外只改显示值，不改模型身份或原始catalog
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const { createHash } = require('node:crypto');
const { OFFICIAL_DEMO_SCENE_DNT_IDENTITIES } = require('./native_demo_scene_dnt_identities');

const NATIVE_LOCALES = Object.freeze({ en: 'en-GB', 'zh-Hans': 'zh-Hans', 'zh-Hant': 'zh-Hant', ja_JP: 'ja' });
const compareKeys = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

function nativeLocaleForLanguage(language) {
  if (!Object.hasOwn(NATIVE_LOCALES, language)) throw new Error(`unsupported product language: ${language}`);
  return NATIVE_LOCALES[language];
}

// -- 来源投影：显示身份来自原生键，不按相同英文合并 ------------------
function stringValues(catalog) {
  if (!Array.isArray(catalog)) throw new Error('strings catalog must be an array');
  const values = new Map();
  for (const record of catalog) {
    if (record?.type !== 'strings' || !record.value || typeof record.value !== 'object' || Array.isArray(record.value)) {
      throw new Error('expected a strings record with an object value');
    }
    for (const [key, value] of Object.entries(record.value)) {
      if (values.has(key)) throw new Error(`duplicate registry key: ${key}`);
      if (!key || typeof value?.['UI-text'] !== 'string') throw new Error(`invalid UI-text for registry key: ${key}`);
      values.set(key, value);
    }
  }
  return values;
}

function collectStringCatalog(catalogId, source, vendorJapanese = []) {
  const sourceValues = stringValues(source);
  const vendorValues = stringValues(vendorJapanese);
  for (const key of vendorValues.keys()) {
    if (!sourceValues.has(key)) throw new Error(`unknown vendor registry key: ${key}`);
  }
  return [...sourceValues].map(([key, value]) => {
    const row = { catalogId, key, source: value['UI-text'], notes: [...(value.notes || [])] };
    if (value.dontTranslate === true) row.dontTranslate = true;
    if (vendorValues.has(key)) row.vendorJapanese = vendorValues.get(key)['UI-text'];
    return row;
  }).sort(compareKeys);
}

// -- 原生结构：以实体身份和字段路径对齐，不用 record/values 的序号 ---
function requireIdentity(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`invalid ${name} in native catalog`);
  return value;
}

function sourceRow(catalogId, fieldPath, leaf, owner) {
  if (typeof leaf['UI-text'] !== 'string') throw new Error(`invalid UI-text at ${fieldPath.join('.')}`);
  if (leaf.notes != null && (!Array.isArray(leaf.notes) || leaf.notes.some(note => typeof note !== 'string'))) {
    throw new Error(`invalid notes at ${fieldPath.join('.')}`);
  }
  const row = { catalogId, fieldPath, source: leaf['UI-text'], notes: [...(leaf.notes || [])] };
  if (owner != null) row.owner = owner;
  if (leaf.dontTranslate === true) row.dontTranslate = true;
  return row;
}

function walkDisplayLeaves(value, fieldPath, visit) {
  if (!value || typeof value !== 'object') return;
  if (Object.hasOwn(value, 'UI-text')) visit(fieldPath, value);
  for (const [key, child] of Object.entries(value)) {
    if (key !== 'notes' && key !== 'UI-text') walkDisplayLeaves(child, [...fieldPath, key], visit);
  }
}

function recordValues(record) {
  const hasValue = Object.hasOwn(record, 'value');
  const hasValues = Object.hasOwn(record, 'values');
  if (hasValue === hasValues || (hasValues && !Array.isArray(record.values))) {
    throw new Error('native record requires exactly one value or values array');
  }
  const values = hasValue ? [record.value] : record.values;
  if (values.some(value => !value || typeof value !== 'object' || Array.isArray(value))) {
    throw new Error('native record values must be objects');
  }
  return values;
}

function registryKeyFor(family, owner, fieldPath) {
  if (family === 'strings') return fieldPath.length === 1 ? fieldPath[0] : null;
  const [section, id, role] = fieldPath;
  if (family === 'nodeStrings' && section === 'info') {
    if (fieldPath.length === 1 || (fieldPath.length === 2 && id === 'name')) return `nodeName:${owner}`;
    if (fieldPath.length === 2 && id === 'tooltip') return `nodeInfo:${owner}`;
  }
  if (family === 'layerStrings' && fieldPath.length === 1) {
    if (section === 'niceName') return `nodeName:${owner}`;
    if (section === 'layerInfo') return `nodeInfo:${owner}`;
  }
  if (section === 'attributes') {
    if (fieldPath.length === 2 || (fieldPath.length === 3 && role === 'name')) return `nodeAttr:${owner}.${id}`;
    if (fieldPath.length === 3 && role === 'tooltip') return `attrInfo:${owner}.${id}`;
  }
  if (section === 'enums' && fieldPath.length === 3 && /^\d+$/.test(role)) {
    return `nodeAttrEnum:${owner}.${id}.${role}`;
  }
  // -- 厂商共用 builder：preset 与 tab 不另造命名空间 ---------------
  if ((section === 'tabs' || section === 'presets') && fieldPath.length === 2) {
    return `nodeTab:${owner}.${id}`;
  }
  // -- curvesFilter 的直文本枚举经厂商 strtol 路径落在 index 0 -------
  if (section === 'enums' && fieldPath.length === 2) return `nodeAttrEnum:${owner}.${id}.0`;
  // -- 此键已有 loader/store 证据，具体通知 UI 仍须独立 live 验证 ----
  if (section === 'notifications' && fieldPath.length === 2 && /^\d+$/.test(id)) return `${owner}.${id}`;
  return null;
}

function nativeLeaves(catalogId, catalog) {
  if (!Array.isArray(catalog)) throw new Error('native catalog must be an array');
  const leaves = new Map();
  for (const record of catalog) {
    if (!['strings', 'nodeStrings', 'layerStrings'].includes(record?.type)) {
      throw new Error(`unsupported native record type: ${record?.type}`);
    }
    const family = record.type;
    for (const value of recordValues(record)) {
      let owner;
      if (family === 'nodeStrings') owner = requireIdentity(value.nodeType, 'nodeType');
      if (family === 'layerStrings') owner = `${requireIdentity(value.author, 'author')}::${requireIdentity(value.layerType, 'layerType')}`;
      walkDisplayLeaves(value, [], (fieldPath, leaf) => {
        const identity = JSON.stringify([family, owner ?? null, fieldPath]);
        if (leaves.has(identity)) throw new Error(`duplicate native display identity: ${identity}`);
        const row = sourceRow(catalogId, fieldPath, leaf, owner);
        const key = registryKeyFor(family, owner, fieldPath);
        if (key != null) row.key = key;
        leaves.set(identity, row);
      });
    }
  }
  return leaves;
}

function collectNativeCatalog(catalogId, source, vendorJapanese = []) {
  const sourceLeaves = nativeLeaves(catalogId, source);
  const vendorLeaves = nativeLeaves(catalogId, vendorJapanese);
  for (const identity of vendorLeaves.keys()) {
    if (!sourceLeaves.has(identity)) throw new Error(`unknown vendor display identity: ${identity}`);
  }
  const entries = [];
  const unmapped = [];
  for (const [identity, leaf] of sourceLeaves) {
    const row = { ...leaf };
    if (vendorLeaves.has(identity)) row.vendorJapanese = vendorLeaves.get(identity).source;
    if (row.key != null) entries.push(row);
    else unmapped.push({ ...row, reason: 'unverified-registry-family' });
  }
  indexEntries(entries);
  unmapped.sort((a, b) => {
    const left = JSON.stringify([a.owner ?? null, a.fieldPath]);
    const right = JSON.stringify([b.owner ?? null, b.fieldPath]);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  return { entries: entries.sort(compareKeys), unmapped };
}

// -- 决策边界：候选不等于审定译文；厂商实译只优先进入日语 ------------
function indexEntries(entries) {
  const result = new Map();
  for (const entry of entries) {
    if (!entry.key || typeof entry.source !== 'string') throw new Error('entry requires a registry key and source');
    if (result.has(entry.key)) throw new Error(`duplicate registry key: ${entry.key}`);
    result.set(entry.key, entry);
  }
  return result;
}

function indexDemoSceneDntDisplayExceptions(entries, keys = []) {
  if (!Array.isArray(keys)) throw new Error('demo scene DNT display exception keys must be an array');
  if (Object.keys(OFFICIAL_DEMO_SCENE_DNT_IDENTITIES).length !== 100) {
    throw new Error('official demo scene DNT identity registry cardinality differs');
  }
  const indexedEntries = indexEntries(entries);
  const result = new Map();
  for (const key of keys) {
    if (typeof key !== 'string' || result.has(key)) throw new Error('invalid or duplicate demo scene DNT display exception key');
    const identity = Object.hasOwn(OFFICIAL_DEMO_SCENE_DNT_IDENTITIES, key)
      ? OFFICIAL_DEMO_SCENE_DNT_IDENTITIES[key] : null;
    const entry = indexedEntries.get(key);
    if (!identity || !entry || !key.startsWith('demoScene.') || key.split('.').length < 3
        || key === 'demoScene.audio.audioSolver' || entry.catalogId !== 'Definitions/Translation/appStrings'
        || entry.dontTranslate !== true || nativeSourceIdentitySha256(entry) !== identity) {
      throw new Error(`unapproved or stale demo scene DNT display exception: ${key}`);
    }
    result.set(key, identity);
  }
  return result;
}

function validateDemoSceneDntDisplayApprovals(entries, approved, keys = []) {
  const selected = indexDemoSceneDntDisplayExceptions(entries, keys);
  if (!selected.size) return selected;
  if (!Array.isArray(approved)) throw new Error('approved native translations must be an array');
  const byKey = new Map();
  for (const row of approved) {
    if (byKey.has(row?.key)) throw new Error(`duplicate approved key: ${row?.key}`);
    byKey.set(row?.key, row);
  }
  const indexedEntries = indexEntries(entries);
  for (const key of selected.keys()) {
    const source = indexedEntries.get(key);
    const row = byKey.get(key);
    if (!row || row.catalogId !== source.catalogId || row.source !== source.source
        || JSON.stringify(row.fieldPath) !== JSON.stringify(source.fieldPath)
        || (row.owner ?? null) !== (source.owner ?? null)
        || row.vendorJapanese !== source.vendorJapanese
        || JSON.stringify(row.notes) !== JSON.stringify(source.notes) || row.dontTranslate !== true
        || !row.translations || typeof row.translations !== 'object' || Array.isArray(row.translations)
        || JSON.stringify(Object.keys(row.translations).sort()) !== JSON.stringify(['ja_JP', 'zh-Hans', 'zh-Hant'])) {
      throw new Error(`missing or stale three-locale demo scene DNT approval: ${key}`);
    }
    for (const language of ['zh-Hans', 'zh-Hant', 'ja_JP']) {
      const decision = row.translations[language];
      if (!exactFields(decision, ['decision', 'text']) || decision.decision !== 'translate'
          || typeof decision.text !== 'string' || !decision.text.trim() || decision.text === source.source) {
        throw new Error(`invalid three-locale demo scene DNT approval: ${key}:${language}`);
      }
    }
  }
  return selected;
}

// -- 有限厂商纠错：批准来源/精确含义/新译三者均绑定，不按英语扩散 ---
const sha256 = value => createHash('sha256').update(value).digest('hex');
function nativeSourceIdentitySha256(entry) {
  return sha256(JSON.stringify([entry.key, entry.catalogId, entry.owner ?? null,
    entry.fieldPath, entry.source, entry.notes || [], entry.dontTranslate === true,
    entry.vendorJapanese ?? null]));
}
function exactFields(value, fields) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field));
}
function indexVendorCorrections(corrections) {
  if (!Array.isArray(corrections)) throw new Error('vendor correction registry must be an array');
  const result = new Map();
  const fields = ['key', 'sourceIdentitySha256', 'translationSha256', 'approvalReceiptSha256'];
  for (const correction of corrections) {
    if (!exactFields(correction, fields) || typeof correction.key !== 'string' || !correction.key
        || fields.slice(1).some(field => !/^[a-f0-9]{64}$/.test(correction[field] || ''))) {
      throw new Error('invalid vendor correction registry record');
    }
    if (result.has(correction.key)) throw new Error(`duplicate vendor correction: ${correction.key}`);
    result.set(correction.key, correction);
  }
  return result;
}
function assertVendorCorrection(entry, review, language, trusted) {
  const correction = review.vendorCorrection;
  const registered = trusted.get(entry.key);
  if (language !== 'ja_JP' || entry.dontTranslate === true || !correction
      || !exactFields(review, ['key', 'source', 'decision', 'text', 'vendorCorrection'])
      || !exactFields(correction, ['approvedBy', 'approvalState', 'sourceIdentitySha256',
        'translationSha256', 'vendorJapanese', 'approvalReceiptSha256'])
      || !registered || ['sourceIdentitySha256', 'translationSha256', 'approvalReceiptSha256']
        .some(field => correction[field] !== registered[field])
      || correction.approvedBy !== 'primary-agent'
      || correction.approvalState !== 'approved-source-bound-vendor-correction'
      || correction.sourceIdentitySha256 !== nativeSourceIdentitySha256(entry)
      || correction.translationSha256 !== sha256(review.text)
      || !/^[a-f0-9]{64}$/.test(correction.approvalReceiptSha256 || '')
      || typeof entry.vendorJapanese !== 'string' || !entry.vendorJapanese.trim()
      || entry.vendorJapanese === entry.source
      || correction.vendorJapanese !== entry.vendorJapanese
      || review.decision !== 'translate' || review.text === entry.vendorJapanese) {
    throw new Error(`invalid vendor correction for ${review.key}`);
  }
}

function indexReviews(entries, reviews, language, trusted) {
  const result = new Map();
  for (const review of reviews) {
    const entry = entries.get(review.key);
    if (!entry) throw new Error(`unknown reviewed key: ${review.key}`);
    if (result.has(review.key)) throw new Error(`duplicate reviewed key: ${review.key}`);
    if (review.source !== entry.source) throw new Error(`review source differs for ${review.key}`);
    if (!['translate', 'preserve'].includes(review.decision)) throw new Error(`invalid review decision for ${review.key}`);
    if (typeof review.text !== 'string' || !review.text.trim()) throw new Error(`empty reviewed translation for ${review.key}`);
    if (review.decision === 'preserve' ? review.text !== entry.source : review.text === entry.source) {
      throw new Error(`preserve decision must match the source for ${review.key}`);
    }
    if (Object.hasOwn(review, 'vendorCorrection')) assertVendorCorrection(entry, review, language, trusted);
    result.set(review.key, review);
  }
  return result;
}

function resolveTranslations(entries, language, reviews = [], trustedVendorCorrections = [], dntDisplayExceptionApprovals = []) {
  const nativeLocale = nativeLocaleForLanguage(language);
  const indexedEntries = indexEntries(entries);
  if (!Array.isArray(dntDisplayExceptionApprovals)) throw new Error('demo scene DNT approvals must be an array');
  const dntDisplayExceptions = validateDemoSceneDntDisplayApprovals([...indexedEntries.values()],
    dntDisplayExceptionApprovals, dntDisplayExceptionApprovals.map(row => row?.key));
  const approvedDntByKey = new Map(dntDisplayExceptionApprovals.map(row => [row.key, row]));
  const trusted = indexVendorCorrections(trustedVendorCorrections);
  const indexedReviews = indexReviews(indexedEntries, reviews, language, trusted);
  const rows = [...indexedEntries.values()].sort(compareKeys).map(entry => {
    const row = { ...entry, notes: [...(entry.notes || [])] };
    const reviewed = indexedReviews.get(entry.key);
    if (entry.dontTranslate === true) {
      if (!dntDisplayExceptions.has(entry.key)) return { ...row, status: 'preserved', text: entry.source };
      const approved = approvedDntByKey.get(entry.key)?.translations?.[language];
      if (!reviewed || !approved || reviewed.decision !== approved.decision || reviewed.text !== approved.text
          || reviewed.decision !== 'translate' || reviewed.text === entry.source
          || Object.hasOwn(reviewed, 'vendorCorrection')) {
        throw new Error(`missing exact locale review for demo scene DNT display exception: ${entry.key}`);
      }
      return { ...row, status: 'reviewed', text: reviewed.text };
    }
    if (language === 'ja_JP' && typeof entry.vendorJapanese === 'string'
        && entry.vendorJapanese.trim() && entry.vendorJapanese !== entry.source) {
      if (reviewed?.vendorCorrection) return { ...row, status: 'vendor-corrected', text: reviewed.text };
      return { ...row, status: 'vendor', text: entry.vendorJapanese };
    }
    if (reviewed) {
      return { ...row, status: reviewed.decision === 'preserve' ? 'preserved' : 'reviewed', text: reviewed.text };
    }
    return { ...row, status: 'missing' };
  });
  return { language, nativeLocale, rows };
}

// -- 工件投影：只输出已决策的显示值；缺键交回厂商 English fallback ----
function renderNativePack(resolved) {
  const locale = nativeLocaleForLanguage(resolved.language);
  if (resolved.nativeLocale !== locale) throw new Error('native locale differs from the product mapping');
  const rows = [...indexEntries(resolved.rows).values()].sort(compareKeys);
  const value = Object.fromEntries(rows.filter(row => row.status !== 'missing').map(row => {
    if (!['vendor', 'vendor-corrected', 'reviewed', 'preserved'].includes(row.status) || typeof row.text !== 'string' || !row.text.trim()) {
      throw new Error(`invalid resolved translation for ${row.key}`);
    }
    return [row.key, { 'UI-text': row.text }];
  }));
  return `${JSON.stringify([{ type: 'strings', language: locale, value }], null, 2)}\n`;
}

module.exports = { collectStringCatalog, collectNativeCatalog, nativeLocaleForLanguage,
  nativeSourceIdentitySha256, indexDemoSceneDntDisplayExceptions,
  validateDemoSceneDntDisplayApprovals, resolveTranslations, renderNativePack };
