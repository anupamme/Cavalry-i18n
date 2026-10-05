/**
 * [INPUT]: 依赖2.8.0 nodeDefinitions原始字节、八个固定Forge字段schema及官方catalog键集合。
 * [OUTPUT]: 仅提供经SHA/owner/父链/schema/UI顺序及显式dontTranslate=false绑定的八条source；共享source锁门的总补充数量由调用方显式提供，不提供译文或批准。
 * [POS]: native resource producer的窄schema回退源；不扫描其他字段、不推断未来ID、不进入运行时。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

const SOURCE_PATH = 'Definitions/nodeDefinitions.json';
const SOURCE_SHA256 = '96c7ffbda8d8244a111b3ad3e60fe530eb919fe9f93cbdf3577e2e29ca11d48f';
const SUPPLEMENT_CATALOG_ID = `${SOURCE_PATH}#prettifyAttrPath`;
const OWNER = 'forgeDynamicsShape';
const NOTES = 'Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf.';
const SUPPLEMENT_KEY_COUNT = 8;
const PARENT_CHAIN = Object.freeze([
  ['forgeDynamicsShape', 'shape'], ['shape', 'drawable'], ['drawable', 'transform'],
  ['transform', 'element'], ['element', 'molecule'], ['molecule'],
]);
const SHAPE_ORDER = Object.freeze(['time', 'startFrame', 'gravity', 'groundMode', 'groundFriction',
  'groundBounce', 'velocityIterations', 'positionIterations', 'fields', 'collisionEvents']);
const FIELD_SCHEMAS = Object.freeze([
  ['time', 'Time', { type: 'int', compConnect: 'time' }],
  ['startFrame', 'Start Frame', { type: 'int', min: 0 }],
  ['gravity', 'Gravity', { type: 'double2', default: { x: 0, y: -10 },
    children: { x: { prefix: 'X' }, y: { prefix: 'Y' } } }],
  ['groundFriction', 'Ground Friction', { type: 'double', default: 1, min: 0,
    softMax: 2, step: 0.01, dimming: 'groundMode == 0' }],
  ['groundBounce', 'Ground Bounce', { type: 'double', default: 0.1, min: 0,
    softMax: 1, step: 0.01, dimming: 'groundMode == 0' }],
  ['velocityIterations', 'Velocity Iterations', { type: 'int', default: 30, min: 1, keyable: false }],
  ['positionIterations', 'Position Iterations', { type: 'int', default: 10, min: 1, keyable: false }],
  ['fields', 'Fields', { type: 'list', vectorAutoDelete: true,
    child: { type: 'nodeId', supportedInputNodeTypes: ['dynamicField'] } }],
]);

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function fail(message) { throw new Error(`native schema supplement ${message}`); }

const FIXED_SOURCE_ROWS = deepFreeze(FIELD_SCHEMAS.map(([id, source]) => ({
  key: `nodeAttr:${OWNER}.${id}`,
  catalogId: SUPPLEMENT_CATALOG_ID,
  owner: OWNER,
  fieldPath: ['attributes', id],
  source,
  dontTranslate: false,
  notes: [NOTES],
})));

function assertNoOfficialCollision(rows, officialEntries) {
  if (!Array.isArray(officialEntries)) fail('official source entries must be an array');
  const officialKeys = new Set();
  for (const row of officialEntries) {
    if (!row || typeof row.key !== 'string' || !row.key) fail('official source entry lacks a key');
    officialKeys.add(row.key);
  }
  for (const row of rows) {
    if (officialKeys.has(row.key)) fail(`official catalog key collision: ${row.key}`);
  }
}

function validateSupplementEntries(entries, officialEntries = []) {
  if (!Array.isArray(entries) || entries.length !== FIXED_SOURCE_ROWS.length) {
    fail('requires exactly eight source entries');
  }
  const fields = ['key', 'catalogId', 'owner', 'fieldPath', 'source', 'dontTranslate', 'notes'];
  for (let index = 0; index < FIXED_SOURCE_ROWS.length; index += 1) {
    const row = entries[index];
    if (!row || typeof row !== 'object' || Array.isArray(row)
        || Object.keys(row).length !== fields.length || fields.some(field => !Object.hasOwn(row, field))) {
      fail(`entry ${index} has an unexpected identity shape`);
    }
    if (!isDeepStrictEqual(row, FIXED_SOURCE_ROWS[index])) {
      fail(`entry source/schema identity differs: ${FIXED_SOURCE_ROWS[index].key}`);
    }
  }
  assertNoOfficialCollision(FIXED_SOURCE_ROWS, officialEntries);
  return FIXED_SOURCE_ROWS.map(clone);
}

function assertSupplementTarget(target, expectedKeyCount = SUPPLEMENT_KEY_COUNT) {
  const files = target?.sourceFiles;
  if (!Number.isInteger(expectedKeyCount) || expectedKeyCount < SUPPLEMENT_KEY_COUNT
      || target?.supplementalKeys !== expectedKeyCount || !Array.isArray(files) || files.length !== 1
      || !files[0] || Object.keys(files[0]).length !== 2
      || files[0].path !== SOURCE_PATH || files[0].sha256 !== SOURCE_SHA256) {
    fail('target supplement count/source lock differs');
  }
  return true;
}

function sourceEntriesFromDefinitions(definitions, officialEntries = []) {
  if (!Array.isArray(definitions)) fail('nodeDefinitions must be an array');
  const byType = new Map();
  for (const row of definitions) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    if (typeof row.nodeType !== 'string') continue;
    if (byType.has(row.nodeType)) fail(`duplicate owner/parent definition: ${row.nodeType}`);
    byType.set(row.nodeType, row);
  }
  for (const [nodeType, parent] of PARENT_CHAIN) {
    const row = byType.get(nodeType);
    if (!row) fail(`missing owner/parent definition: ${nodeType}`);
    if (parent === undefined ? Object.hasOwn(row, 'superType') : row.superType !== parent) {
      fail(`parent chain differs at ${nodeType}`);
    }
  }

  const owner = byType.get(OWNER);
  if (!owner.attributes || typeof owner.attributes !== 'object' || Array.isArray(owner.attributes)) {
    fail('Forge owner attributes are missing');
  }
  for (const [id, , schema] of FIELD_SCHEMAS) {
    if (!Object.hasOwn(owner.attributes, id) || !isDeepStrictEqual(owner.attributes[id], schema)) {
      fail(`Forge field schema differs: ${id}`);
    }
  }
  const tabs = owner.UI?.tabs;
  const shapeTabs = Array.isArray(tabs) ? tabs.filter(tab => tab?.id === 'shape') : [];
  if (shapeTabs.length !== 1 || !isDeepStrictEqual(shapeTabs[0].attributeOrder, SHAPE_ORDER)) {
    fail('Forge shape Inspector order differs');
  }
  return validateSupplementEntries(FIXED_SOURCE_ROWS, officialEntries);
}

function sourceEntries(nodeDefinitionsBytes, officialEntries = []) {
  if (!Buffer.isBuffer(nodeDefinitionsBytes) && !(nodeDefinitionsBytes instanceof Uint8Array)) {
    fail('source input must be raw bytes');
  }
  const bytes = Buffer.from(nodeDefinitionsBytes);
  if (sha256(bytes) !== SOURCE_SHA256) fail('nodeDefinitions SHA-256 differs');
  let definitions;
  try { definitions = JSON.parse(bytes.toString('utf8')); }
  catch { fail('nodeDefinitions JSON is invalid'); }
  return sourceEntriesFromDefinitions(definitions, officialEntries);
}

module.exports = {
  SOURCE_PATH, SOURCE_SHA256, SUPPLEMENT_KEY_COUNT, SUPPLEMENT_CATALOG_ID, OWNER, NOTES,
  FIXED_SOURCE_ROWS, sourceEntries, sourceEntriesFromDefinitions, validateSupplementEntries,
  assertSupplementTarget,
};
