#!/usr/bin/env node
/**
 * [INPUT]: 依赖调用方提供的旧 English/目标 JSON surfaces、已提取 TS context/source/translation 与新版 mapped entries
 * [OUTPUT]: 对外提供精确文本候选索引；逐条保留 single/ambiguous/none 及旧语义路径出处，不产生审校决策
 * [POS]: tools 的只读旧译复用器；按对象身份与真实翻译 schema 提名候选，machine/model/user 值不会成为来源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const MACHINE_FIELDS = new Set([
  'type', 'id', 'nodeType', 'layerType', 'author', 'namespace', 'language', 'version', 'uuid',
  'signature', 'apiSignature', 'functionSignature', 'script', 'default', 'defaultFont', 'fontFamily',
  'fontName', 'enumValues', 'triggers', 'attrs',
]);
const INACTIVE_TS_STATES = new Set(['unfinished', 'obsolete', 'vanished', 'inactive', 'untranslated']);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be a non-empty string`);
  return value;
}

function escapePointer(value) {
  return String(value).replaceAll('~', '~0').replaceAll('/', '~1');
}

function pointer(path) {
  return `/${path.map(escapePointer).join('/')}`;
}

function pathNames(path) {
  // -- 语义身份只作寻址，不当作机器字段过滤 --------------------------------
  // `nodeType=shape` 是数组记录身份，不是 JSON key；不能据此跳过整棵子树。
  return path.filter(segment => !String(segment).includes('=')).map(String);
}

function isMachinePath(id, path) {
  const names = pathNames(path);
  if (names.some(name => MACHINE_FIELDS.has(name))) return true;
  if (names.includes('attrs')) return true;
  if (/\/MetaData\//i.test(id) && names.length > 0 && !names.includes('description')) return true;
  if (/Definitions\/(?:nodeDefinitions|systemPresets|[^/]+Definitions)\.json$/i.test(id)
      && (names.includes('default') || names.includes('font') || names.includes('fontFamily') || names.includes('fontName'))) return true;
  return false;
}

function hasPath(path, name) {
  return pathNames(path).includes(name);
}

function endsWith(path, name) {
  return pathNames(path).at(-1) === name;
}

function jsonRole(id, path) {
  const normalized = id.replaceAll('\\', '/');
  const names = pathNames(path);
  const file = normalized.split('/').at(-1);
  if (file === 'appStrings.json') return { sourceRole: 'global-ui' };
  if (file === 'nodeStrings.json' || (/\/plugins\//i.test(normalized) && !/Definitions\.json$/i.test(file))) {
    if (hasPath(path, 'nodeInfo')) return { sourceRole: 'node-info' };
    if (hasPath(path, 'layerInfo')) return { sourceRole: 'layer-info' };
    if (endsWith(path, 'niceName')) return { sourceRole: 'legacy-node-name', displayOnly: true };
    if (hasPath(path, 'enums')) return { sourceRole: 'enum-label' };
    if (hasPath(path, 'attributes')) {
      const attributeDepth = names.length - names.lastIndexOf('attributes') - 1;
      // -- 属性叶按已知旧形态分层 -----------------------------------------------
      // 直接叶是名称，二元组另拆名称/说明；更深字段可能是用户值或模型值。
      return attributeDepth === 1 ? { sourceRole: 'attribute-label' } : null;
    }
    if (hasPath(path, 'tabs')) return { sourceRole: 'tab-label' };
    if (hasPath(path, 'presets')) return { sourceRole: 'preset-label' };
    if (hasPath(path, 'notifications')) return { sourceRole: 'notification-text' };
    return null;
  }
  if (/\/Definitions\/nodeDefinitions\.json$/i.test(normalized)) {
    if (endsWith(path, 'niceName')) return { sourceRole: 'legacy-node-name', displayOnly: true };
    if (endsWith(path, 'placeholder')) return { sourceRole: 'legacy-placeholder', displayOnly: true };
    if (hasPath(path, 'buttons') && endsWith(path, 'name')) return { sourceRole: 'legacy-button-label', displayOnly: true };
    return null;
  }
  if (/\/Definitions\/systemPresets\.json$/i.test(normalized)) {
    return endsWith(path, 'name') ? { sourceRole: 'legacy-preset-name', displayOnly: true } : null;
  }
  if (/\/model_display_translations\.json$/i.test(normalized)) {
    return endsWith(path, 'translation') ? { sourceRole: 'model-display', displayOnly: true } : null;
  }
  if (/\/MetaData\//i.test(normalized)) {
    return endsWith(path, 'description') ? { sourceRole: 'api-description', displayOnly: true } : null;
  }
  if (/\/Learn\/Guides\/strings\.json$/i.test(normalized)) {
    return hasPath(path, 'value') ? { sourceRole: 'guide-ui' } : null;
  }
  if (/\/Learn\/Guides\/guides\.json$/i.test(normalized)) return null;
  if (/\/onboarding\.json$/i.test(normalized) && endsWith(path, 'title')) return { sourceRole: 'onboarding-title' };
  if (/\/tips\.json$/i.test(normalized) && (endsWith(path, 'title') || endsWith(path, 'text'))) {
    return { sourceRole: `tip-${names.at(-1)}` };
  }
  return null;
}

function candidateOrigin(origin) {
  return {
    ...origin,
    writeback: false,
  };
}

function indexCandidate(index, locale, source, translation, origin) {
  if (typeof source !== 'string' || !source.trim()
      || typeof translation !== 'string' || !translation.trim() || source === translation) return;
  if (!index.has(locale)) index.set(locale, new Map());
  const bySource = index.get(locale);
  if (!bySource.has(source)) bySource.set(source, new Map());
  const byTranslation = bySource.get(source);
  if (!byTranslation.has(translation)) byTranslation.set(translation, []);
  byTranslation.get(translation).push(candidateOrigin(origin));
}

function recordIdentity(value, surfaceId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const nested = value.value && typeof value.value === 'object' && !Array.isArray(value.value) ? value.value : null;
  const records = nested ? [nested, value] : [value];
  for (const record of records) {
    if (typeof record.nodeType === 'string' && record.nodeType) return `nodeType=${record.nodeType}`;
    if (typeof record.author === 'string' && record.author && typeof record.layerType === 'string' && record.layerType) {
      return `author=${record.author}::layerType=${record.layerType}`;
    }
    if (typeof record.layerType === 'string' && record.layerType) return `layerType=${record.layerType}`;
    if (typeof record.id === 'string' && record.id) return `id=${record.id}`;
    if (typeof record.script === 'string' && record.script) return `script=${record.script}`;
    if (typeof record.slug === 'string' && record.slug) return `slug=${record.slug}`;
    if (/\/MetaData\//i.test(surfaceId) && typeof record.name === 'string' && record.name) {
      const namespace = typeof record.namespace === 'string' && record.namespace ? `namespace=${record.namespace}::` : '';
      return `${namespace}name=${record.name}`;
    }
    if (/\/model_display_translations\.json$/i.test(surfaceId)
        && typeof record.source === 'string' && record.source) return `source=${record.source}`;
    // -- 全局 strings 只有固定 schema wrapper；节点/图层必须用领域身份 --------
    // nodeStrings 不能只靠共享 type 值配对，否则不同 owner 会错位。
    if (record.type === 'strings' && /(?:^|\/)(?:appStrings|Learn\/Guides\/strings)\.json$/i.test(surfaceId)) {
      return 'type=strings';
    }
  }
  return null;
}

function uniqueArrayMap(values, surfaceId) {
  const result = new Map();
  const ambiguous = new Set();
  const add = (value, prefix = []) => {
    const identity = recordIdentity(value, surfaceId);
    if (!identity || ambiguous.has(identity)) return;
    if (result.has(identity)) {
      result.delete(identity);
      ambiguous.add(identity);
      return;
    }
    result.set(identity, {
      value,
      pathSuffix: [...prefix, ...(identity === 'type=strings' ? [] : [identity])],
    });
  };
  for (const value of values) {
    if (['nodeStrings', 'layerStrings'].includes(value?.type) && Array.isArray(value.values)) {
      // -- 旧资产既有 value 单体也有 values 实体组 -------------------------------
      // 拍平只依据每个实体自己的稳定 owner，不读取数组序号作身份。
      for (const entity of value.values) add(entity, ['values']);
    } else {
      add(value);
    }
  }
  return result;
}

function tupleRole(path, index) {
  if (!hasPath(path, 'attributes') || path.length < 2) return null;
  if (index === 0) return { field: 'name', sourceRole: 'attribute-label' };
  if (index === 1) return { field: 'tooltip', sourceRole: 'attribute-info' };
  return null;
}

function collectJsonPairs(index, surface) {
  const walk = (english, target, path) => {
    if (isMachinePath(surface.id, path)) return;
    if (typeof english === 'string' && typeof target === 'string') {
      const role = jsonRole(surface.id, path);
      if (!role) return;
      indexCandidate(index, surface.locale, english, target, {
        kind: 'json', id: surface.id, locale: surface.locale, path: pointer(path),
        sourceRole: role.sourceRole, ...(role.displayOnly ? { displayOnly: true } : {}),
      });
      return;
    }
    if (Array.isArray(english) && Array.isArray(target)) {
      if (jsonRole(surface.id, path)?.sourceRole === 'attribute-label'
          && english.every(value => typeof value === 'string')
          && target.every(value => typeof value === 'string') && english.length === target.length
          && english.length > 0 && english.length <= 2) {
        for (let i = 0; i < english.length; i += 1) {
          const role = tupleRole(path, i);
          if (role && !isMachinePath(surface.id, [...path, role.field])) {
            indexCandidate(index, surface.locale, english[i], target[i], {
              kind: 'json', id: surface.id, locale: surface.locale, path: pointer([...path, role.field]),
              sourceRole: role.sourceRole,
            });
          }
        }
        return;
      }
      const enById = uniqueArrayMap(english, surface.id);
      const targetById = uniqueArrayMap(target, surface.id);
      for (const identity of [...enById.keys()].filter(key => targetById.has(key)).sort(compare)) {
        const englishEntry = enById.get(identity);
        const targetEntry = targetById.get(identity);
        walk(englishEntry.value, targetEntry.value, [...path, ...englishEntry.pathSuffix]);
      }
      return;
    }
    if (!english || !target || typeof english !== 'object' || typeof target !== 'object'
        || Array.isArray(english) || Array.isArray(target)) return;
    const common = Object.keys(english).filter(key => Object.hasOwn(target, key)).sort(compare);
    for (const key of common) walk(english[key], target[key], [...path, key]);
  };
  walk(surface.english, surface.target, []);
}

function collectTsEntries(index, entries) {
  for (const entry of entries) {
    requireString(entry.locale, 'TS locale');
    requireString(entry.context, 'TS context');
    if (typeof entry.source !== 'string' || typeof entry.translation !== 'string') {
      throw new Error('TS entry requires source and translation strings');
    }
    if (INACTIVE_TS_STATES.has(String(entry.status || '').toLowerCase()) || entry.plural === true) continue;
    indexCandidate(index, entry.locale, entry.source, entry.translation, {
      kind: 'ts', ...(entry.id ? { id: entry.id } : {}), locale: entry.locale,
      context: entry.context, sourceRole: 'compiled-ui',
    });
  }
}

function mappedRole(entry) {
  if (typeof entry.sourceRole === 'string' && entry.sourceRole) return entry.sourceRole;
  const path = Array.isArray(entry.fieldPath) ? entry.fieldPath.map(String) : [];
  if (path.includes('niceName')) return 'node-name';
  if (path.includes('layerInfo')) return 'layer-info';
  if (path.includes('nodeInfo')) return 'node-info';
  if (path.includes('tabs')) return 'tab-label';
  if (path.includes('presets')) return 'preset-label';
  if (path.includes('notifications')) return 'notification-text';
  if (path.includes('enums')) return 'enum-label';
  if (path.includes('attributes')) return path.some(part => ['tooltip', 'help', 'info'].includes(part))
    ? 'attribute-info' : 'attribute-label';
  if (path.includes('info') && path.includes('tooltip')) return 'node-info';
  if (path.includes('info') && path.includes('name')) return 'node-name';
  return 'global-ui';
}

function compareOrigins(a, b) {
  return compare(a.kind, b.kind) || compare(a.id || '', b.id || '') || compare(a.path || '', b.path || '')
    || compare(a.context || '', b.context || '') || compare(a.sourceRole || '', b.sourceRole || '');
}

function candidatesFor(index, locale, source) {
  const translations = index.get(locale)?.get(source);
  if (!translations) return { kind: 'no-existing-candidate', candidates: [] };
  const candidates = [...translations].map(([translation, origins]) => ({
    translation,
    origins: [...origins].sort(compareOrigins),
  })).sort((a, b) => compare(a.translation, b.translation));
  return {
    kind: candidates.length === 1 ? 'exact-single-candidate' : 'exact-ambiguous',
    candidates,
  };
}

function buildTranslationCandidates(input) {
  if (!input || typeof input !== 'object') throw new Error('candidate input must be an object');
  const { jsonSurfaces, tsEntries, mappedEntries } = input;
  if (!Array.isArray(jsonSurfaces)) throw new Error('jsonSurfaces must be an array');
  if (!Array.isArray(tsEntries)) throw new Error('tsEntries must be an array');
  if (!Array.isArray(mappedEntries)) throw new Error('mappedEntries must be an array');

  const index = new Map();
  const seenSurfaces = new Set();
  for (const surface of jsonSurfaces) {
    const id = requireString(surface?.id, 'JSON surface id');
    const locale = requireString(surface?.locale, 'JSON target locale');
    if (!Object.hasOwn(surface, 'english') || !Object.hasOwn(surface, 'target')) {
      throw new Error(`JSON surface requires english and target trees: ${id}`);
    }
    const identity = `${locale}\u0000${id}`;
    if (seenSurfaces.has(identity)) throw new Error(`duplicate JSON surface: ${id} (${locale})`);
    seenSurfaces.add(identity);
    collectJsonPairs(index, surface);
  }
  collectTsEntries(index, tsEntries);

  const seenKeys = new Set();
  const locales = [...new Set([
    ...jsonSurfaces.map(surface => surface.locale),
    ...tsEntries.map(entry => entry.locale),
  ])].sort(compare);
  const rows = mappedEntries.map(entry => {
    const key = requireString(entry?.key, 'mapped registry key');
    const source = requireString(entry?.source, `mapped source for ${key}`);
    if (seenKeys.has(key)) throw new Error(`duplicate mapped registry key: ${key}`);
    seenKeys.add(key);
    const row = { key, source, sourceRole: mappedRole(entry) };
    if (typeof entry.catalogId === 'string') row.catalogId = entry.catalogId;
    if (Array.isArray(entry.fieldPath)) row.fieldPath = [...entry.fieldPath];
    if (Array.isArray(entry.notes)) row.notes = [...entry.notes];
    if (typeof entry.owner === 'string') row.owner = entry.owner;
    if (typeof entry.dontTranslate === 'boolean') row.dontTranslate = entry.dontTranslate;
    if (typeof entry.vendorJapanese === 'string') row.vendorJapanese = entry.vendorJapanese;
    row.locales = Object.fromEntries(locales.map(locale => [locale, candidatesFor(index, locale, source)]));
    return row;
  }).sort((a, b) => compare(a.key, b.key));
  return { rows };
}

module.exports = { buildTranslationCandidates };
