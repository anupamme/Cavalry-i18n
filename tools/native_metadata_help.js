#!/usr/bin/env node
/**
 * [INPUT]: 依赖调用方提供的四份官方 MetaData 数组与 source-bound 三语说明审定，不读安装或翻译服务
 * [OUTPUT]: 提供稳定说明键、description-only投影、384非def根表与17def根表
 * [POS]: tools 的帮助构建期纯数据边界；保留机器字段和模板，独立于 UI ICU 门
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const METADATA_FILE_NAMES = Object.freeze([
  'api_function_metadata.json',
  'core_api_function_metadata.json',
  'gui_api_function_metadata.json',
  'widget_api_function_metadata.json',
]);
const METADATA_FILES = new Set(METADATA_FILE_NAMES);
const METADATA_LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const RUNTIME_ROOT_NAMESPACES = new Set([
  '@JS_CORE_API',
  '@JS_CTX',
  '@JS_GUI_API',
  '@JS_WIDGET_API',
]);
const DEF_SOURCE_NAMESPACE = '@JS_DEFORMER';
const ENTITY_COLLECTIONS = ['methods', 'properties'];
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;

function requireMetadataFile(file) {
  if (typeof file !== 'string' || !METADATA_FILES.has(file)) {
    throw new Error(`unsupported metadata file: ${String(file)}`);
  }
}

function requireRecord(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value;
}

function requireName(value, owner) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`metadata entity name must be non-empty for ${owner}`);
  }
  return value;
}

function escapePointer(value) {
  return value.replaceAll('~', '~0').replaceAll('/', '~1');
}

function pointer(parts) {
  return `/${parts.map(escapePointer).join('/')}`;
}

function requireUniqueNames(records, group) {
  const names = new Set();
  for (const record of records) {
    requireRecord(record, `metadata ${group} entity`);
    const name = requireName(record.name, group);
    if (names.has(name)) throw new Error(`duplicate metadata ${group} name: ${name}`);
    names.add(name);
  }
}

function collectMetadataDescriptions(file, document) {
  requireMetadataFile(file);
  if (!Array.isArray(document)) throw new Error('metadata document must be an array');

  const rows = [];
  const descriptionOwners = new WeakSet();
  const addDescription = (record, entityPath) => {
    if (!Object.hasOwn(record, 'description')) return;
    if (typeof record.description !== 'string' || !record.description.trim()) {
      throw new Error(`metadata description must be non-empty text at ${file}#${pointer(entityPath)}/description`);
    }

    const owner = `${file}#${pointer(entityPath)}`;
    descriptionOwners.add(record);
    rows.push({
      key: `${owner}/description`,
      owner,
      entityPath: [...entityPath],
      source: record.description,
    });
  };

  requireUniqueNames(document, 'entity');
  for (const entity of document) {
    const entityName = entity.name;
    addDescription(entity, [entityName]);

    for (const collection of ENTITY_COLLECTIONS) {
      if (!Object.hasOwn(entity, collection)) continue;
      const children = entity[collection];
      if (!Array.isArray(children)) throw new Error(`metadata ${collection} must be an array for ${entityName}`);
      requireUniqueNames(children, collection);
      for (const child of children) addDescription(child, [entityName, collection, child.name]);
    }
  }

  // -- 不认识的嵌套 description 不得静默漏掉或猜测身份 ------------------
  const findUnmapped = (value, path = []) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'description') {
        if (!descriptionOwners.has(value)) {
          throw new Error(`unmapped metadata description at ${file}#${pointer(path.concat(key))}`);
        }
        continue;
      }
      findUnmapped(child, path.concat(key));
    }
  };
  findUnmapped(document);

  rows.sort((left, right) => compare(left.key, right.key));
  return rows;
}

function inlineCodeTokens(value) {
  return [...value.matchAll(/`[^`]*`/g)].map(match => match[0]);
}

function angleBracketTemplates(value) {
  return [...value.matchAll(/<[A-Za-z][A-Za-z0-9_]*>/g)].map(match => match[0]);
}

function findClosingBrace(value, start) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') quote = character;
    else if (character === '{') depth += 1;
    else if (character === '}' && --depth === 0) return index;
  }
  return -1;
}

function splitObjectFields(value) {
  const fields = [];
  const closing = [];
  let quote = null;
  let escaped = false;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') quote = character;
    else if (character === '{') closing.push('}');
    else if (character === '[') closing.push(']');
    else if (character === '(') closing.push(')');
    else if (closing.at(-1) === character) closing.pop();
    else if (character === ',' && closing.length === 0) {
      fields.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  fields.push(value.slice(start).trim());
  return fields;
}

function isTechnicalObjectTemplate(value) {
  const body = value.slice(1, -1).trim();
  if (!body || /^[$\w]+\s*,\s*(?:plural|select|selectordinal|number|date|time)\b/i.test(body)) return false;

  // -- 只锁结构清晰的对象字段列表/字面量；普通花括号 prose 不套 ICU grammar --------
  const fields = splitObjectFields(body);
  if (fields.length < 2) return false;
  const fieldName = '[$A-Z_a-z][\\w$]*\\??';
  const shorthand = new RegExp(`^${fieldName}$`);
  const property = new RegExp(`^(?:"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|${fieldName})\\s*:\\s*\\S[\\s\\S]*$`);
  return fields.every(field => shorthand.test(field) || property.test(field));
}

function objectTemplates(value) {
  const withoutInlineCode = value.replace(/`[^`]*`/g, token => ' '.repeat(token.length));
  const templates = [];
  for (let index = 0; index < withoutInlineCode.length; index += 1) {
    if (withoutInlineCode[index] !== '{') continue;
    const end = findClosingBrace(withoutInlineCode, index);
    if (end < 0) continue;
    const token = value.slice(index, end + 1);
    if (isTechnicalObjectTemplate(token)) {
      templates.push(token);
      index = end;
    }
  }
  return templates;
}

function validateTechnicalTemplates(source, text, key) {
  const sourceCode = inlineCodeTokens(source);
  const targetCode = inlineCodeTokens(text);
  if (sourceCode.length !== (source.match(/`/g) || []).length / 2
      || targetCode.length !== (text.match(/`/g) || []).length / 2
      || JSON.stringify(sourceCode) !== JSON.stringify(targetCode)) {
    throw new Error(`inline code tokens differ for ${key}`);
  }
  if (JSON.stringify(angleBracketTemplates(source)) !== JSON.stringify(angleBracketTemplates(text))) {
    throw new Error(`angle-bracket templates differ for ${key}`);
  }
  if (JSON.stringify(objectTemplates(source)) !== JSON.stringify(objectTemplates(text))) {
    throw new Error(`object templates differ for ${key}`);
  }
}

function findEntity(document, entityPath, file, key) {
  let records = document;
  let record;
  let index = 0;
  while (index < entityPath.length) {
    const name = entityPath[index];
    record = records.find(candidate => candidate.name === name);
    if (!record) throw new Error(`metadata entity disappeared while projecting ${key}`);
    index += 1;
    if (index < entityPath.length) {
      const collection = entityPath[index];
      records = record[collection];
      if (!Array.isArray(records)) throw new Error(`metadata ${collection} disappeared while projecting ${key}`);
      index += 1;
    }
  }
  if (typeof record?.description !== 'string') throw new Error(`metadata description disappeared while projecting ${key}`);
  return record;
}

function projectMetadataHelp(file, source, reviews) {
  const entries = collectMetadataDescriptions(file, source);
  if (!Array.isArray(reviews)) throw new Error('reviews must be an array');

  const byKey = new Map(entries.map(entry => [entry.key, entry]));
  const reviewed = new Map();
  for (const review of reviews) {
    requireRecord(review, 'metadata review');
    const { key } = review;
    if (typeof key !== 'string' || !key.trim()) throw new Error('metadata review key must be non-empty');
    if (reviewed.has(key)) throw new Error(`duplicate metadata review key: ${key}`);
    const entry = byKey.get(key);
    if (!entry) throw new Error(`unknown metadata review key: ${key}`);
    if (review.source !== entry.source) throw new Error(`metadata review source differs for ${key}`);
    if (typeof review.text !== 'string' || !review.text.trim()) {
      throw new Error(`review text must be non-empty for ${key}`);
    }
    validateTechnicalTemplates(entry.source, review.text, key);
    reviewed.set(key, { entry, text: review.text });
  }

  const projected = structuredClone(source);
  for (const [key, review] of reviewed) {
    const record = findEntity(projected, review.entry.entityPath, file, key);
    record.description = review.text;
  }

  const missing = entries.filter(entry => !reviewed.has(entry.key)).map(({ key, source: text, owner }) => ({
    key,
    source: text,
    owner,
  }));
  return { file, document: projected, missing };
}

function requireExactKeys(value, expected, name) {
  requireRecord(value, name);
  const actual = Object.keys(value).sort(compare);
  const wanted = [...expected].sort(compare);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${name} must contain exactly: ${wanted.join(', ')}`);
  }
}

function metadataFileForReviewKey(key) {
  if (typeof key !== 'string' || !key.trim()) throw new Error('metadata review key must be non-empty');
  const file = METADATA_FILE_NAMES.find(candidate => key.startsWith(`${candidate}#/`));
  if (!file) throw new Error(`unsupported metadata review key: ${key}`);
  return file;
}

function buildRuntimeRootHelpTable({ metadataDocuments, reviewsByLocale }) {
  requireExactKeys(metadataDocuments, METADATA_FILE_NAMES, 'metadataDocuments');
  requireExactKeys(reviewsByLocale, METADATA_LOCALES, 'reviewsByLocale');

  const candidateRows = [];
  const defRows = [];
  const runtimeNames = new Set();
  const defRuntimeNames = new Set();
  const counts = {
    descriptionLeaves: 0,
    rootDescriptionLeaves: 0,
    candidateRoots: 0,
    excludedDefRoots: 0,
    nestedDescriptions: 0,
  };

  for (const file of METADATA_FILE_NAMES) {
    const source = metadataDocuments[file];
    const entries = collectMetadataDescriptions(file, source);
    const rootsByName = new Map(source.map(entity => [entity.name, entity]));
    counts.descriptionLeaves += entries.length;

    for (const entry of entries) {
      if (entry.entityPath.length !== 1) {
        counts.nestedDescriptions += 1;
        continue;
      }

      counts.rootDescriptionLeaves += 1;
      const entity = rootsByName.get(entry.entityPath[0]);
      const namespace = entity?.namespace;
      if (namespace === DEF_SOURCE_NAMESPACE) {
        counts.excludedDefRoots += 1;
        if (defRuntimeNames.has(entity.name)) {
          throw new Error(`duplicate runtime def name: ${entity.name}`);
        }
        defRuntimeNames.add(entity.name);
        defRows.push({
          key: entry.key,
          runtimeName: entity.name,
          sourceDescription: entry.source,
        });
        continue;
      }
      if (!RUNTIME_ROOT_NAMESPACES.has(namespace)) {
        throw new Error(`unsupported runtime root namespace at ${entry.key}: ${String(namespace)}`);
      }
      if (runtimeNames.has(entity.name)) {
        throw new Error(`duplicate runtime root name: ${entity.name}`);
      }
      runtimeNames.add(entity.name);
      candidateRows.push({
        key: entry.key,
        runtimeName: entity.name,
        sourceDescription: entry.source,
      });
    }
  }

  const translationsByKey = new Map(
    [...candidateRows, ...defRows].map(row => [row.key, {}]),
  );
  for (const locale of METADATA_LOCALES) {
    const reviews = reviewsByLocale[locale];
    if (!Array.isArray(reviews)) throw new Error(`reviews for ${locale} must be an array`);
    const reviewsByFile = new Map(METADATA_FILE_NAMES.map(file => [file, []]));
    for (const review of reviews) {
      requireRecord(review, `metadata review for ${locale}`);
      const file = metadataFileForReviewKey(review.key);
      reviewsByFile.get(file).push(review);
    }

    for (const file of METADATA_FILE_NAMES) {
      const projection = projectMetadataHelp(file, metadataDocuments[file], reviewsByFile.get(file));
      if (projection.missing.length > 0) {
        throw new Error(`missing approved metadata descriptions for ${locale}/${file}: ${projection.missing.length}`);
      }
      for (const review of reviewsByFile.get(file)) {
        const translation = translationsByKey.get(review.key);
        if (translation) translation[locale] = review.text;
      }
    }
  }

  candidateRows.sort((left, right) => compare(left.runtimeName, right.runtimeName));
  defRows.sort((left, right) => compare(left.runtimeName, right.runtimeName));
  const projectEntries = rows => rows.map(({ key, runtimeName, sourceDescription }) => {
    const translations = translationsByKey.get(key);
    if (!translations || METADATA_LOCALES.some(locale => !translations[locale])) {
      throw new Error(`missing runtime root translation: ${runtimeName}`);
    }
    return { runtimeName, sourceDescription, translations };
  });
  const entries = projectEntries(candidateRows);
  const defEntries = projectEntries(defRows);

  counts.candidateRoots = entries.length;
  return { entries, defEntries, counts };
}

module.exports = {
  METADATA_FILE_NAMES,
  METADATA_LOCALES,
  buildRuntimeRootHelpTable,
  collectMetadataDescriptions,
  projectMetadataHelp,
};
