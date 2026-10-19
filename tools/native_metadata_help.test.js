#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_metadata_help.js 的说明身份、审定投影及根表接口，使用合成或锁定四文件源
 * [OUTPUT]: 验证 source binding、384非def根、17def根与嵌套边界
 * [POS]: tools 的脚本帮助合同；只用显式源和审定译文，不接 UI ICU 或运行时消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const api = () => require('./native_metadata_help.js');

const mesh = (extra = {}) => ({
  name: 'Mesh',
  type: 'class',
  description: 'A mesh container.',
  properties: [
    { name: 'vertexCount', return_type: 'int', description: 'The number of vertices.' },
  ],
  methods: [
    {
      name: 'getMaterialAtIndex',
      arguments: [{ name: 'index', type: 'int', required: true }],
      return_type: 'Material',
      description: 'Returns {name, scope} for "<paletteId>.array.<index>" as `materialColor`.',
    },
    {
      name: 'addPath',
      arguments: [{ name: 'path', type: 'Path', required: true }],
      return_type: 'void',
      description: 'Adds a path.',
    },
  ],
  ...extra,
});

const classMethodsKey = 'core_api_function_metadata.json#/Mesh/methods/getMaterialAtIndex/description';
const classPropertyKey = 'core_api_function_metadata.json#/Mesh/properties/vertexCount/description';

test('collects top-level and nested descriptions by stable name identity, never array position', () => {
  const first = [
    { name: 'find/asset~path', description: 'Finds an asset.' },
    mesh(),
    { name: 'Line', methods: [{ name: 'length', description: 'Returns its length.' }] },
  ];
  const reordered = [first[2], first[1], first[0]];

  const collect = api().collectMetadataDescriptions;
  const a = collect('core_api_function_metadata.json', first);
  const b = collect('core_api_function_metadata.json', reordered);

  assert.deepEqual(a.map(({ key, source, owner }) => ({ key, source, owner })),
    b.map(({ key, source, owner }) => ({ key, source, owner })));
  assert.ok(a.some(row => row.key === classMethodsKey));
  assert.ok(a.some(row => row.key === classPropertyKey));
  assert.ok(a.some(row => row.key === 'core_api_function_metadata.json#/find~1asset~0path/description'));
  assert.equal(a.find(row => row.key === classMethodsKey).owner,
    'core_api_function_metadata.json#/Mesh/methods/getMaterialAtIndex');
});

test('projects only reviewed descriptions, preserves source and all machine fields, and lists missing leaves', () => {
  const source = [
    {
      name: 'replaceAsset', type: 'function', namespace: '@JS_GUI_API',
      arguments: [{ name: 'path', type: 'string', required: true, default: 'unchanged' }],
      return_type: 'bool', description: 'Replaces the current asset.',
    },
    mesh(),
  ];
  const original = structuredClone(source);
  const result = api().projectMetadataHelp('core_api_function_metadata.json', source, [
    { key: classMethodsKey, source: mesh().methods[0].description,
      text: '返回 {name, scope}，用于 "<paletteId>.array.<index>" 的 `materialColor`。' },
  ]);

  assert.deepEqual(source, original);
  assert.notEqual(result.document, source);
  assert.notEqual(result.document[1].methods, source[1].methods);
  assert.equal(result.document[1].methods[0].description,
    '返回 {name, scope}，用于 "<paletteId>.array.<index>" 的 `materialColor`。');
  assert.equal(result.document[1].properties[0].description, source[1].properties[0].description);
  assert.deepEqual(result.document[0].arguments, source[0].arguments);
  assert.equal(result.document[0].return_type, source[0].return_type);
  assert.equal(result.document[0].namespace, source[0].namespace);
  assert.deepEqual(result.missing, [
    {
      key: 'core_api_function_metadata.json#/Mesh/description',
      source: 'A mesh container.',
      owner: 'core_api_function_metadata.json#/Mesh',
    },
    {
      key: classPropertyKey,
      source: 'The number of vertices.',
      owner: 'core_api_function_metadata.json#/Mesh/properties/vertexCount',
    },
    {
      key: 'core_api_function_metadata.json#/Mesh/methods/addPath/description',
      source: 'Adds a path.',
      owner: 'core_api_function_metadata.json#/Mesh/methods/addPath',
    },
    {
      key: 'core_api_function_metadata.json#/replaceAsset/description',
      source: 'Replaces the current asset.',
      owner: 'core_api_function_metadata.json#/replaceAsset',
    },
  ].sort((a, b) => a.key.localeCompare(b.key)));
});

test('supports the four metadata catalog filenames and rejects unknown identities', () => {
  const catalogs = [
    'api_function_metadata.json',
    'core_api_function_metadata.json',
    'gui_api_function_metadata.json',
    'widget_api_function_metadata.json',
  ];
  for (const file of catalogs) {
    assert.deepEqual(api().collectMetadataDescriptions(file, [{ name: 'entry', description: 'Text.' }])
      .map(row => row.key), [`${file}#/entry/description`]);
  }
  assert.throws(() => api().collectMetadataDescriptions('../api_function_metadata.json', []), /unsupported metadata file/);
});

test('rejects unknown, duplicate, stale-source and malformed reviews', () => {
  const source = [{ name: 'one', description: 'Original.' }];
  const base = { key: 'api_function_metadata.json#/one/description', source: 'Original.', text: '译文。' };

  assert.throws(() => api().projectMetadataHelp('api_function_metadata.json', source,
    [{ ...base, key: 'api_function_metadata.json#/missing/description' }]), /unknown metadata review key/);
  assert.throws(() => api().projectMetadataHelp('api_function_metadata.json', source, [base, base]), /duplicate metadata review key/);
  assert.throws(() => api().projectMetadataHelp('api_function_metadata.json', source,
    [{ ...base, source: 'Stale source.' }]), /metadata review source differs/);
  assert.throws(() => api().projectMetadataHelp('api_function_metadata.json', source,
    [{ ...base, text: '  ' }]), /review text must be non-empty/);
  assert.throws(() => api().projectMetadataHelp('api_function_metadata.json', source, {}), /reviews must be an array/);
});

test('rejects duplicate entity owners and description leaves outside named method/property identities', () => {
  assert.throws(() => api().collectMetadataDescriptions('api_function_metadata.json', [
    { name: 'same', description: 'First.' }, { name: 'same', description: 'Second.' },
  ]), /duplicate metadata entity name/);
  assert.throws(() => api().collectMetadataDescriptions('core_api_function_metadata.json', [
    { name: 'Mesh', methods: [{ name: 'same', description: 'First.' }, { name: 'same', description: 'Second.' }] },
  ]), /duplicate metadata methods name/);
  assert.throws(() => api().collectMetadataDescriptions('api_function_metadata.json', [
    { name: 'entry', arguments: [{ name: 'arg', description: 'Unmapped description.' }] },
  ]), /unmapped metadata description/);
});

test('requires inline code and angle-bracket API templates to survive translation verbatim', () => {
  const source = [{ name: 'scenePalette', description: mesh().methods[0].description }];
  const key = 'api_function_metadata.json#/scenePalette/description';
  const valid = '{name, scope}："<paletteId>.array.<index>" 中的 `materialColor`。';
  assert.equal(api().projectMetadataHelp('api_function_metadata.json', source,
    [{ key, source: source[0].description, text: valid }]).document[0].description, valid);

  assert.throws(() => api().projectMetadataHelp('api_function_metadata.json', source,
    [{ key, source: source[0].description, text: '返回 `<paletteId>.array.<index>` 的颜色。' }]), /inline code tokens differ/);
  assert.throws(() => api().projectMetadataHelp('api_function_metadata.json', source,
    [{ key, source: source[0].description, text: '返回 {name, scope} 的 `materialColor`。' }]), /angle-bracket templates differ/);
});

test('preserves unquoted object and JSON templates without freezing ordinary braced prose', () => {
  const project = (sourceText, targetText) => api().projectMetadataHelp('api_function_metadata.json', [
    { name: 'entry', description: sourceText },
  ], [{
    key: 'api_function_metadata.json#/entry/description', source: sourceText, text: targetText,
  }]);

  assert.throws(() => project('Returns {name, scope}.', '返回结果。'), /object templates differ/);
  assert.throws(() => project('Returns {"id": 0, "label": "mesh"}.', '返回 {"id": 1, "label": "mesh"}。'),
    /object templates differ/);
  assert.equal(project('Returns {"id": 0, "label": "mesh"}.', '返回 {"id": 0, "label": "mesh"}。')
    .document[0].description, '返回 {"id": 0, "label": "mesh"}。');
  assert.equal(project('Write {left and right} literally.', '按字面写出 {左侧与右侧}。')
    .document[0].description, '按字面写出 {左侧与右侧}。');
});

test('preserves optional fields and mixed outer metadata projection schemas byte-for-byte', () => {
  const project = (sourceText, targetText) => api().projectMetadataHelp('api_function_metadata.json', [
    { name: 'entry', description: sourceText },
  ], [{
    key: 'api_function_metadata.json#/entry/description', source: sourceText, text: targetText,
  }]);
  const actualPaletteSource = [
    'Creates a new .pal palette file in the library or project palette folder. ',
    'swatches is Array<string|Object> — strings are colour values; objects are {color, name?}. ',
    'metadata is {author?, website?, overwrite?}. Returns the new file path. ',
    'Refuses to overwrite an existing palette unless metadata.overwrite is true.',
  ].join('');
  const actualPaletteLookupSource = [
    'Returns a palette by name: {name, scope, path, author, website, version, swatches: [{name, hex, uid}]} ',
    '— or null if not found. `scope` is "library" or "project"; if omitted, both tiers are searched (library first).',
  ].join('');

  assert.throws(() => project(actualPaletteSource,
    actualPaletteSource.replace('{color, name?}', '{color}')), /object templates differ/);
  assert.throws(() => project(actualPaletteSource,
    actualPaletteSource.replace('{author?, website?, overwrite?}', '{author?, website?}')),
  /object templates differ/);
  assert.throws(() => project(actualPaletteLookupSource,
    'Returns a palette by name: {name, path, swatches: [{name, hex, uid}]} — or null if not found. `scope` is "library" or "project"; if omitted, both tiers are searched (library first).'),
  /object templates differ/);
  assert.equal(project(actualPaletteLookupSource, actualPaletteLookupSource).document[0].description,
    actualPaletteLookupSource);
});

const runtimeMetadataFiles = [
  'api_function_metadata.json',
  'core_api_function_metadata.json',
  'gui_api_function_metadata.json',
  'widget_api_function_metadata.json',
];
const runtimeLocales = ['zh-Hans', 'zh-Hant', 'ja_JP'];

function runtimeRootFixture() {
  return {
    'api_function_metadata.json': [
      { name: 'zRoot', namespace: '@JS_GUI_API', description: 'Z root source.' },
      { name: 'defRoot', namespace: '@JS_DEFORMER', description: 'Def root source.' },
    ],
    'core_api_function_metadata.json': [{
      name: 'Mesh', type: 'class',
      methods: [{ name: 'nestedMethod', description: 'Nested method source.' }],
      properties: [{ name: 'nestedProperty', description: 'Nested property source.' }],
    }],
    'gui_api_function_metadata.json': [
      { name: 'aRoot', namespace: '@JS_CTX', description: 'A root source.' },
    ],
    'widget_api_function_metadata.json': [],
  };
}

function runtimeRootReviews(documents) {
  const all = runtimeMetadataFiles.flatMap(file => api().collectMetadataDescriptions(file, documents[file]));
  return Object.fromEntries(runtimeLocales.map(locale => [locale, all.map(({ key, source }) => ({
    key, source, text: `${locale}: ${source}`,
  }))]));
}

test('builds deterministic isolated main/def root tables and excludes nested descriptions', () => {
  const documents = runtimeRootFixture();
  const reviewsByLocale = runtimeRootReviews(documents);
  const result = api().buildRuntimeRootHelpTable({ metadataDocuments: documents, reviewsByLocale });

  assert.deepEqual(result.entries.map(row => row.runtimeName), ['aRoot', 'zRoot']);
  assert.deepEqual(result.entries[0], {
    runtimeName: 'aRoot',
    sourceDescription: 'A root source.',
    translations: {
      'zh-Hans': 'zh-Hans: A root source.',
      'zh-Hant': 'zh-Hant: A root source.',
      ja_JP: 'ja_JP: A root source.',
    },
  });
  assert.deepEqual(result.defEntries, [{
    runtimeName: 'defRoot',
    sourceDescription: 'Def root source.',
    translations: {
      'zh-Hans': 'zh-Hans: Def root source.',
      'zh-Hant': 'zh-Hant: Def root source.',
      ja_JP: 'ja_JP: Def root source.',
    },
  }]);
  assert.deepEqual(result.counts, {
    descriptionLeaves: 5,
    rootDescriptionLeaves: 3,
    candidateRoots: 2,
    excludedDefRoots: 1,
    nestedDescriptions: 2,
  });

  const reordered = structuredClone(documents);
  reordered['api_function_metadata.json'].reverse();
  assert.deepEqual(
    api().buildRuntimeRootHelpTable({ metadataDocuments: reordered, reviewsByLocale }).entries,
    result.entries,
  );
  assert.deepEqual(
    api().buildRuntimeRootHelpTable({ metadataDocuments: reordered, reviewsByLocale }).defEntries,
    result.defEntries,
  );
});

test('keeps same bare name isolated between main and def projections', () => {
  const documents = {
    'api_function_metadata.json': [
      { name: 'getBoundingBox', namespace: '@JS_DEFORMER', description: 'Returns deformer bounds.' },
    ],
    'core_api_function_metadata.json': [],
    'gui_api_function_metadata.json': [
      { name: 'getBoundingBox', namespace: '@JS_GUI_API', description: 'Returns UI bounds.' },
    ],
    'widget_api_function_metadata.json': [],
  };
  const reviewsByLocale = runtimeRootReviews(documents);
  const result = api().buildRuntimeRootHelpTable({ metadataDocuments: documents, reviewsByLocale });

  assert.equal(result.entries[0].runtimeName, 'getBoundingBox');
  assert.equal(result.entries[0].sourceDescription, 'Returns UI bounds.');
  assert.equal(result.defEntries[0].runtimeName, 'getBoundingBox');
  assert.equal(result.defEntries[0].sourceDescription, 'Returns deformer bounds.');
});

test('rejects missing/stale reviews, duplicate bare runtime names, and unknown namespaces', () => {
  const documents = runtimeRootFixture();
  const reviewsByLocale = runtimeRootReviews(documents);
  const incomplete = structuredClone(reviewsByLocale);
  incomplete['zh-Hant'] = incomplete['zh-Hant'].filter(review => !review.key.endsWith('#/Mesh/properties/nestedProperty/description'));
  assert.throws(() => api().buildRuntimeRootHelpTable({ metadataDocuments: documents, reviewsByLocale: incomplete }),
    /missing approved metadata descriptions/);

  const stale = structuredClone(reviewsByLocale);
  stale['ja_JP'].find(review => review.key.endsWith('#/aRoot/description')).source = 'Changed source.';
  assert.throws(() => api().buildRuntimeRootHelpTable({ metadataDocuments: documents, reviewsByLocale: stale }),
    /metadata review source differs/);

  const duplicate = structuredClone(documents);
  duplicate['widget_api_function_metadata.json'].push({
    name: 'aRoot', namespace: '@JS_WIDGET_API', description: 'Another source with the same bare name.',
  });
  assert.throws(() => api().buildRuntimeRootHelpTable({
    metadataDocuments: duplicate, reviewsByLocale: runtimeRootReviews(duplicate),
  }), /duplicate runtime root name: aRoot/);

  const unknownNamespace = structuredClone(documents);
  unknownNamespace['widget_api_function_metadata.json'].push({
    name: 'unknownRoot', namespace: '@JS_OTHER', description: 'Unknown namespace source.',
  });
  assert.throws(() => api().buildRuntimeRootHelpTable({
    metadataDocuments: unknownNamespace, reviewsByLocale: runtimeRootReviews(unknownNamespace),
  }), /unsupported runtime root namespace/);

  const duplicateDef = structuredClone(documents);
  duplicateDef['core_api_function_metadata.json'].push({
    name: 'defRoot', namespace: '@JS_DEFORMER', description: 'Duplicate def source.',
  });
  assert.throws(() => api().buildRuntimeRootHelpTable({
    metadataDocuments: duplicateDef, reviewsByLocale: runtimeRootReviews(duplicateDef),
  }), /duplicate runtime def name: defRoot/);
});
