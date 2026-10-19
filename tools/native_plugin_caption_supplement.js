/**
 * [INPUT]: 依赖SHA锁定的Directional Blur插件definitions原始字节及官方catalog键集合。
 * [OUTPUT]: 仅提供directionalBlurFilter.amount的一条caption source，不提供帮助或行为说明。
 * [POS]: native resource producer的独立插件source域；与官方catalog、Forge及通用缺源域分开。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

const SOURCE_PATH = 'Plugins/Directional Blur Filter/definitions.json';
const SOURCE_SHA256 = '1cab672a44cd4dbe9595e4ac2eef90e681f46ee4816d4d1af527edb92937d4bd';
const PLUGIN_CAPTION_CATALOG_ID = `pluginCaptionSupplement/${SOURCE_PATH}`;
const PLUGIN_CAPTION_KEY_COUNT = 1;
const KEY = 'nodeAttr:sceneGroup::directionalBlurFilter.amount';
const OWNER = 'sceneGroup::directionalBlurFilter';
const NOTES = 'Cavalry 2.8.0 Directional Blur definition declares the Inspector attribute amount; Amount is a caption-only fallback, with no units, help, or behavior claim.';
const FIXED_SOURCE_ROWS = Object.freeze([Object.freeze({
  key: KEY,
  catalogId: PLUGIN_CAPTION_CATALOG_ID,
  owner: OWNER,
  fieldPath: Object.freeze(['attributes', 'amount']),
  source: 'Amount',
  vendorJapanese: null,
  dontTranslate: false,
  notes: Object.freeze([NOTES]),
})]);

function fail(message) { throw new Error(`native plugin caption supplement ${message}`); }
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function cloneRow(row) { return { ...row, fieldPath: [...row.fieldPath], notes: [...row.notes] }; }

function assertNoOfficialCollision(rows, officialEntries) {
  if (!Array.isArray(officialEntries)) fail('official source entries must be an array');
  const keys = new Set(officialEntries.map(row => row?.key));
  for (const row of rows) if (keys.has(row.key)) fail(`official catalog key collision: ${row.key}`);
}

function validateDefinition(definitions) {
  if (!Array.isArray(definitions) || definitions.length !== 1) fail('definition file must contain one plugin');
  const definition = definitions[0];
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)
      || definition.author !== 'sceneGroup' || definition.type !== 'directionalBlurFilter'
      || definition.superType !== 'thirdPartyFilter'
      || !isDeepStrictEqual(definition.attributes?.amount,
        { type: 'double', default: 10, min: 0, max: 250, step: 1 })
      || !isDeepStrictEqual(definition.UI?.attributeOrder, ['angle', 'amount'])) {
    fail('Directional Blur owner, amount schema, or Inspector order differs');
  }
}

function validatePluginCaptionEntries(entries, officialEntries = []) {
  if (!Array.isArray(entries) || entries.length !== PLUGIN_CAPTION_KEY_COUNT) {
    fail('requires exactly one source entry');
  }
  if (!isDeepStrictEqual(entries[0], FIXED_SOURCE_ROWS[0])) fail(`source identity differs: ${KEY}`);
  assertNoOfficialCollision(FIXED_SOURCE_ROWS, officialEntries);
  return FIXED_SOURCE_ROWS.map(cloneRow);
}

function sourceEntries(definitionBytes, officialEntries = []) {
  if (!Buffer.isBuffer(definitionBytes) && !(definitionBytes instanceof Uint8Array)) {
    fail('source input must be raw bytes');
  }
  const bytes = Buffer.from(definitionBytes);
  if (sha256(bytes) !== SOURCE_SHA256) fail('Directional Blur definitions SHA-256 differs');
  let definitions;
  try { definitions = JSON.parse(bytes.toString('utf8')); }
  catch { fail('Directional Blur definitions JSON is invalid'); }
  validateDefinition(definitions);
  return validatePluginCaptionEntries(FIXED_SOURCE_ROWS, officialEntries);
}

module.exports = {
  SOURCE_PATH, SOURCE_SHA256, PLUGIN_CAPTION_CATALOG_ID, PLUGIN_CAPTION_KEY_COUNT,
  KEY, OWNER, NOTES, FIXED_SOURCE_ROWS, sourceEntries, validateDefinition,
  validatePluginCaptionEntries,
};
