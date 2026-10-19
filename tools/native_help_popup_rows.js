#!/usr/bin/env node
/**
 * [INPUT]: 依赖四份官方MetaData数组与native_metadata_help的稳定根键。
 * [OUTPUT]: 提供main/def根的type、参数行与返回行候选文本。
 * [POS]: tools的构建期纯投影；不读安装、不含翻译说明、不接运行时。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const {
  METADATA_FILE_NAMES,
  collectMetadataDescriptions,
} = require('./native_metadata_help.js');

// -- 根API命名空间必须与说明表投影保持一致 -------------------------------
const MAIN_NAMESPACES = new Set([
  '@JS_CORE_API',
  '@JS_CTX',
  '@JS_GUI_API',
  '@JS_WIDGET_API',
]);
const DEF_NAMESPACE = '@JS_DEFORMER';

function requireExactMetadataDocuments(metadataDocuments) {
  if (!metadataDocuments || typeof metadataDocuments !== 'object' || Array.isArray(metadataDocuments)) {
    throw new Error('metadataDocuments must be an object');
  }
  const actual = Object.keys(metadataDocuments).sort();
  const expected = [...METADATA_FILE_NAMES].sort();
  if (actual.length !== expected.length || actual.some((file, index) => file !== expected[index])) {
    throw new Error('metadataDocuments must contain exactly the four official metadata files');
  }
  for (const file of METADATA_FILE_NAMES) {
    if (!Array.isArray(metadataDocuments[file])) throw new Error(`${file} must be an array`);
  }
}

function formatArguments(argumentsValue, owner) {
  if (argumentsValue == null) return '';
  if (!Array.isArray(argumentsValue)) throw new Error(`arguments must be an array or null for ${owner}`);
  return argumentsValue.map((argument, index) => {
    if (!argument || typeof argument !== 'object' || Array.isArray(argument)) {
      throw new Error(`argument ${index} must be an object for ${owner}`);
    }
    if (typeof argument.name !== 'string' || !argument.name ||
        typeof argument.type !== 'string' || !argument.type ||
        typeof argument.required !== 'boolean') {
      throw new Error(`argument ${index} lacks name, type, or required for ${owner}`);
    }
    const text = `${argument.name}:${argument.type}`;
    return argument.required ? text : `<i>${text}</i>`;
  }).join(', ');
}

function formatReturns(record, owner) {
  if (!Object.hasOwn(record, 'return_type')) return '';
  const value = record.return_type;
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`return_type must be a string or object for ${owner}`);
  }
  const keys = Object.keys(value).sort();
  if (keys.length === 0) throw new Error(`return_type object must not be empty for ${owner}`);
  return `{${keys.join(', ')}}`;
}

function projectNativeHelpPopupRows(metadataDocuments) {
  requireExactMetadataDocuments(metadataDocuments);
  const rows = [];

  for (const file of METADATA_FILE_NAMES) {
    const document = metadataDocuments[file];
    const recordsByName = new Map(document.map(record => [record.name, record]));
    for (const leaf of collectMetadataDescriptions(file, document)) {
      if (leaf.entityPath.length !== 1) continue;
      const record = recordsByName.get(leaf.entityPath[0]);
      if (!record) throw new Error(`root disappeared for ${leaf.key}`);

      const namespace = record.namespace;
      if (!MAIN_NAMESPACES.has(namespace) && namespace !== DEF_NAMESPACE) {
        throw new Error(`unsupported runtime root namespace at ${leaf.key}: ${String(namespace)}`);
      }
      if (record.type !== 'function' && record.type !== 'property') {
        throw new Error(`root type must be function or property at ${leaf.key}`);
      }

      rows.push({
        key: leaf.key,
        runtimeName: record.name,
        kind: record.type,
        argumentsText: formatArguments(record.arguments, leaf.key),
        returnsText: formatReturns(record, leaf.key),
      });
    }
  }

  return rows.sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0);
}

module.exports = { projectNativeHelpPopupRows };
