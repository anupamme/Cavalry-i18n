#!/usr/bin/env node
/**
 * [INPUT]: 依赖native_help_popup_rows.js与native_metadata_help.js的根键合同。
 * [OUTPUT]: 验证函数/属性根、可选参数标记、返回字典键与source boundary。
 * [POS]: tools的纯数据合同；不读Cavalry安装，不验证Qt显示或像素宽度。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const projectRows = require('./native_help_popup_rows.js').projectNativeHelpPopupRows;
const metadataApi = require('./native_metadata_help.js');

function documents() {
  return {
    'api_function_metadata.json': [
      {
        name: 'createItem', type: 'function', namespace: '@JS_GUI_API',
        arguments: [
          { name: 'name', type: 'string', required: true },
          { name: 'overwriteExisting', type: 'bool', required: false, default: false },
        ],
        return_type: 'string', description: 'Creates an item.',
      },
      {
        name: 'bounds', type: 'property', namespace: '@JS_GUI_API',
        arguments: null, return_type: { width: 'number', height: 'number' },
        description: 'Returns bounds.',
      },
      {
        name: 'nestedResult', type: 'function', namespace: '@JS_GUI_API',
        arguments: [], return_type: { nested: { ignored: 'string' }, value: 'number' },
        description: 'Returns a nested object.',
      },
      { name: 'classRoot', type: 'class', namespace: '@JS_GUI_API', methods: [
        { name: 'nested', description: 'Nested description.' },
      ] },
    ],
    'core_api_function_metadata.json': [
      { name: 'defOnly', type: 'function', namespace: '@JS_DEFORMER', arguments: [], description: 'Def root.' },
    ],
    'gui_api_function_metadata.json': [],
    'widget_api_function_metadata.json': [],
  };
}

test('projects stable root keys, preserves kind, and formats approved source fields', () => {
  const rows = projectRows(documents());
  assert.deepEqual(rows, [
    {
      key: 'api_function_metadata.json#/bounds/description',
      runtimeName: 'bounds', kind: 'property', argumentsText: '', returnsText: '{height, width}',
    },
    {
      key: 'api_function_metadata.json#/createItem/description',
      runtimeName: 'createItem', kind: 'function',
      argumentsText: 'name:string, <i>overwriteExisting:bool</i>', returnsText: 'string',
    },
    {
      key: 'api_function_metadata.json#/nestedResult/description',
      runtimeName: 'nestedResult', kind: 'function', argumentsText: '', returnsText: '{nested, value}',
    },
    {
      key: 'core_api_function_metadata.json#/defOnly/description',
      runtimeName: 'defOnly', kind: 'function', argumentsText: '', returnsText: '',
    },
  ]);
});

test('root selection matches the existing 384 main / 17 def boundary and keeps duplicate names', () => {
  const source = documents();
  source['core_api_function_metadata.json'].push({
    name: 'bounds', type: 'function', namespace: '@JS_DEFORMER',
    return_type: 'Mesh', description: 'Def bounds.',
  });
  const rows = projectRows(source);
  const sameName = rows.filter(row => row.runtimeName === 'bounds');
  assert.equal(sameName.length, 2);
  assert.deepEqual(sameName.map(row => row.key), [
    'api_function_metadata.json#/bounds/description',
    'core_api_function_metadata.json#/bounds/description',
  ]);

  const mainNames = new Set(['@JS_CORE_API', '@JS_CTX', '@JS_GUI_API', '@JS_WIDGET_API']);
  const sourceRows = Object.entries(source).flatMap(([file, document]) =>
    metadataApi.collectMetadataDescriptions(file, document)
      .filter(leaf => leaf.entityPath.length === 1)
      .map(leaf => ({ leaf, record: document.find(item => item.name === leaf.entityPath[0]) })));
  const expectedKeys = sourceRows.filter(({ record }) =>
    mainNames.has(record.namespace) || record.namespace === '@JS_DEFORMER')
    .map(({ leaf }) => leaf.key).sort();
  assert.deepEqual(rows.map(row => row.key), expectedKeys);
});

test('rejects unsupported root namespaces, malformed source types, and incomplete input files', () => {
  const unknown = documents();
  unknown['widget_api_function_metadata.json'].push({
    name: 'foreign', type: 'function', namespace: '@JS_OTHER', description: 'Not a runtime root.',
  });
  assert.throws(() => projectRows(unknown), /unsupported runtime root namespace/);

  const badKind = documents();
  badKind['api_function_metadata.json'][0].type = 'class';
  assert.throws(() => projectRows(badKind), /root type must be function or property/);

  const missingFile = documents();
  delete missingFile['widget_api_function_metadata.json'];
  assert.throws(() => projectRows(missingFile), /exactly the four official metadata files/);
});

test('rejects malformed argument and return records instead of inventing display text', () => {
  const badArgument = documents();
  badArgument['api_function_metadata.json'][0].arguments[1].required = 'false';
  assert.throws(() => projectRows(badArgument), /lacks name, type, or required/);

  const badReturn = documents();
  badReturn['api_function_metadata.json'][0].return_type = ['string'];
  assert.throws(() => projectRows(badReturn), /return_type must be a string or object/);
});
