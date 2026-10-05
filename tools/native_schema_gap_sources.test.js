/**
 * [INPUT]: 依赖固定365组(owner, attributeId, fallback)源行、target锁中的source/Core预期摘要常量、调用方提供的完整官方键集及合成定义树。
 * [OUTPUT]: 锁定源行canonical摘要，并证明根/继承schema、递归Inspector声明和官方键碰撞均被校验。
 * [POS]: source-only候选边界合同；不批准候选、不读私有stage/vendor/App/profile，也不接入资源producer。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { createHash } = require('node:crypto');
const {
  FIXED_GAP_LABELS,
  SOURCE_DEFINITIONS_SHA256,
  CORE_FALLBACK_SHA256,
  validateGapDefinitions,
} = require('./native_schema_gap_sources');

const SOURCE_ROWS_SHA256 = 'd2f66a17f1a1fb9eddb26c0d8547088faa8fd99aebc7bd474d97246250f85f8f';
const TARGET_PATH = path.join(__dirname, 'cavalry_native_target.json');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const tupleKey = ([owner, attributeId]) => `${owner}\0${attributeId}`;

function definitionByType(definitions, nodeType) {
  return definitions.find(row => row.nodeType === nodeType);
}

function attributeOrderArrays(value, output = []) {
  if (Array.isArray(value)) {
    for (const child of value) attributeOrderArrays(child, output);
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'attributeOrder' && Array.isArray(child)) output.push(child);
    else attributeOrderArrays(child, output);
  }
  return output;
}

function syntheticDefinitions() {
  const inherited = new Set(FIXED_GAP_LABELS.slice(0, 13).map(tupleKey));
  const root = { nodeType: 'fixtureRoot', attributes: {} };
  const byOwner = new Map();

  FIXED_GAP_LABELS.forEach(([owner, attributeId], index) => {
    let definition = byOwner.get(owner);
    if (!definition) {
      definition = { nodeType: owner, attributes: {}, UI: { attributeOrder: [], tabs: [] } };
      byOwner.set(owner, definition);
    }
    if ([...inherited].some(key => key.startsWith(`${owner}\0`))) definition.superType = 'fixtureRoot';

    if (inherited.has(tupleKey([owner, attributeId]))) {
      root.attributes[attributeId] = { type: 'double' };
    } else if (index === 13) {
      definition.attributes[attributeId] = { type: 'list', child: { type: 'number' } };
    } else if (index === 14) {
      definition.attributes[attributeId] = { type: 'compound', children: { x: { type: 'number' } } };
    } else {
      definition.attributes[attributeId] = { type: 'number' };
    }

    if (index % 3 === 0) {
      definition.UI.attributeOrder.push(attributeId);
    } else if (index % 3 === 1) {
      definition.UI.tabs.push({ id: `tab-${index}`, attributeOrder: [attributeId] });
    } else {
      definition.UI.tabs.push({
        id: `layout-${index}`,
        layout: { rows: [{ columns: [{ attributeOrder: [attributeId] }] }] },
      });
    }
  });

  return [root, ...byOwner.values()];
}

function removeDeclaredReference(definition, attributeId) {
  for (const order of attributeOrderArrays(definition.UI)) {
    for (let index = order.length - 1; index >= 0; index -= 1) {
      if (order[index] === attributeId) order.splice(index, 1);
    }
  }
}

test('fixed source rows keep the exact canonical 365-tuple identity', () => {
  assert.equal(FIXED_GAP_LABELS.length, 365);
  assert.ok(Object.isFrozen(FIXED_GAP_LABELS));
  assert.ok(FIXED_GAP_LABELS.every(row => Object.isFrozen(row) && row.length === 3
    && row.every(value => typeof value === 'string' && value.length > 0)));

  const keys = FIXED_GAP_LABELS.map(tupleKey);
  assert.equal(new Set(keys).size, 365, 'owner/id pairs are unique');
  assert.equal(new Set(FIXED_GAP_LABELS.map(([, attributeId]) => attributeId)).size, 238);
  assert.ok(FIXED_GAP_LABELS.every(([owner, attributeId]) =>
    /^[A-Za-z][A-Za-z0-9_]*$/.test(owner)
      && /^[A-Za-z][A-Za-z0-9_]*$/.test(attributeId)
      && !attributeId.includes('.')));
  assert.ok(FIXED_GAP_LABELS.every(([owner]) => owner !== 'forgeDynamicsShape'),
    'the separately reviewed eight-key Forge supplement is not part of this candidate table');

  const canonical = Buffer.from(`${JSON.stringify(FIXED_GAP_LABELS)}\n`);
  assert.equal(sha256(canonical), SOURCE_ROWS_SHA256);
});

test('source/Core digests remain the values locked by the native target', () => {
  const target = JSON.parse(fs.readFileSync(TARGET_PATH, 'utf8'));
  assert.equal(target.sourceFiles.find(row => row.path === 'Definitions/nodeDefinitions.json')?.sha256,
    SOURCE_DEFINITIONS_SHA256);
  assert.equal(target.runtimeFiles.find(row => row.path === 'Contents/Frameworks/libCore.dylib')?.sha256,
    CORE_FALLBACK_SHA256);
});

test('all fixed labels resolve through direct or inherited fields and recursive UI layouts', () => {
  const definitions = syntheticDefinitions();
  const rows = validateGapDefinitions(definitions, []);
  assert.strictEqual(rows, FIXED_GAP_LABELS);
  assert.equal(rows.length, 365);

  const firstInherited = FIXED_GAP_LABELS[0];
  const owner = definitionByType(definitions, firstInherited[0]);
  const root = definitionByType(definitions, 'fixtureRoot');
  assert.equal(owner.superType, 'fixtureRoot');
  assert.ok(Object.hasOwn(root.attributes, firstInherited[1]));
  assert.ok(definitions.some(row => Object.values(row.attributes || {}).some(field => field.type === 'list')));
  assert.ok(definitions.some(row => Object.values(row.attributes || {}).some(field => field.type === 'compound')));
});

test('the fixed inherited-field topology cannot silently drift', () => {
  const definitions = syntheticDefinitions();
  const [owner, id] = FIXED_GAP_LABELS[0];
  definitionByType(definitions, owner).attributes[id] = { type: 'double' };
  assert.throws(() => validateGapDefinitions(definitions, []), /inherited.*source row count differs/i);
});

test('unknown definition keys do not widen the fixed source-only allowlist', () => {
  const definitions = syntheticDefinitions();
  definitions.push({ nodeType: 'unreviewedOwner', attributes: { unreviewedId: { type: 'number' } },
    UI: { tabs: [{ layout: [{ attributeOrder: ['unreviewedId'] }] }] } });
  assert.strictEqual(validateGapDefinitions(definitions, []), FIXED_GAP_LABELS);
  assert.ok(!FIXED_GAP_LABELS.some(([owner, id]) => owner === 'unreviewedOwner' || id === 'unreviewedId'));
});

test('vendor nodeType index accepts numeric-leading owners and parent references', () => {
  const definitions = syntheticDefinitions();
  const [candidateOwner] = FIXED_GAP_LABELS[13];
  definitionByType(definitions, candidateOwner).superType = '3dMatrix';
  definitions.push({ nodeType: 'behaviour', superType: 'fixtureRoot', attributes: {}, UI: {} });
  definitions.push({ nodeType: '3dMatrix', superType: 'behaviour', attributes: {}, UI: {} });
  assert.strictEqual(validateGapDefinitions(definitions, []), FIXED_GAP_LABELS);
});

test('official collision evidence must be explicitly supplied', () => {
  const definitions = syntheticDefinitions();
  assert.throws(() => validateGapDefinitions(definitions), /official entries must be an array/i);
  assert.strictEqual(validateGapDefinitions(definitions, []), FIXED_GAP_LABELS);
});

test('duplicate and illegal nodeType owners fail closed', () => {
  const duplicate = syntheticDefinitions();
  duplicate.push(structuredClone(duplicate[1]));
  assert.throws(() => validateGapDefinitions(duplicate, []), /duplicate.*nodeType/i);

  const illegalOwner = syntheticDefinitions();
  illegalOwner.push({ nodeType: 'bad owner', attributes: {}, UI: {} });
  assert.throws(() => validateGapDefinitions(illegalOwner, []), /illegal.*owner/i);
});

test('missing parents and cyclic inheritance fail closed', () => {
  const missingParent = syntheticDefinitions();
  definitionByType(missingParent, 'fixtureRoot').superType = 'unresolvedParent';
  assert.throws(() => validateGapDefinitions(missingParent, []), /missing.*parent/i);

  const cycle = syntheticDefinitions();
  const firstOwner = definitionByType(cycle, FIXED_GAP_LABELS[0][0]);
  definitionByType(cycle, 'fixtureRoot').superType = firstOwner.nodeType;
  assert.throws(() => validateGapDefinitions(cycle, []), /cycle/i);
});

test('every candidate needs a resolvable field and an owner-local Inspector reference', () => {
  const missingField = syntheticDefinitions();
  const [fieldOwner, fieldId] = FIXED_GAP_LABELS[13];
  delete definitionByType(missingField, fieldOwner).attributes[fieldId];
  delete definitionByType(missingField, 'fixtureRoot').attributes[fieldId];
  assert.throws(() => validateGapDefinitions(missingField, []), /attribute.*unresolved/i);

  const missingUi = syntheticDefinitions();
  const [uiOwner, uiId] = FIXED_GAP_LABELS[0];
  removeDeclaredReference(definitionByType(missingUi, uiOwner), uiId);
  assert.throws(() => validateGapDefinitions(missingUi, []), /Inspector.*reference.*missing/i);
});

test('non-schema field values cannot satisfy a fixed candidate', () => {
  const [owner, id] = FIXED_GAP_LABELS[13];
  const invalidSchemas = [null, 'number', {}, { type: '' }, { label: 'not a schema' }];

  for (const invalidSchema of invalidSchemas) {
    const definitions = syntheticDefinitions();
    definitionByType(definitions, owner).attributes[id] = invalidSchema;
    assert.throws(() => validateGapDefinitions(definitions, []), /attribute.*schema.*invalid/i,
      `rejected invalid schema ${JSON.stringify(invalidSchema)}`);
  }
});

test('UI titles and arbitrary strings do not count as Inspector attributeOrder references', () => {
  const definitions = syntheticDefinitions();
  const [owner, id] = FIXED_GAP_LABELS[0];
  definitionByType(definitions, owner).UI = { title: id, description: `Field ${id}`, text: [id] };
  assert.throws(() => validateGapDefinitions(definitions, []), /Inspector.*reference.*missing/i);
});

test('cyclic Inspector layout objects fail closed', () => {
  const definitions = syntheticDefinitions();
  const [owner, id] = FIXED_GAP_LABELS[0];
  const cyclicLayout = { attributeOrder: [id] };
  cyclicLayout.self = cyclicLayout;
  definitionByType(definitions, owner).UI = { tabs: [cyclicLayout] };
  assert.throws(() => validateGapDefinitions(definitions, []), /cyclic Inspector layout/i);
});

test('direct and inherited official nodeAttr collisions are rejected', () => {
  const direct = syntheticDefinitions();
  const [owner, id] = FIXED_GAP_LABELS[20];
  assert.throws(() => validateGapDefinitions(direct, [{ key: `nodeAttr:${owner}.${id}` }]),
    /official.*collision/i);

  const inherited = syntheticDefinitions();
  const [child, inheritedId] = FIXED_GAP_LABELS[0];
  assert.throws(() => validateGapDefinitions(inherited, [{ key: `nodeAttr:fixtureRoot.${inheritedId}` }]),
    /official.*parent.*collision/i);
  assert.equal(definitionByType(inherited, child).superType, 'fixtureRoot');
});
