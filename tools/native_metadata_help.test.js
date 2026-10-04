#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_metadata_help.js 的 metadata description 身份收集与审定投影接口，使用合成四文件 schema
 * [OUTPUT]: 验证 name/path 稳定性、仅 description 写回、缺失台账、source binding 与对象/代码模板保真
 * [POS]: tools 的 metadata 帮助翻译合同；不读 Cavalry、profile 或磁盘，不将代码示例送入 UI ICU 格式门
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
