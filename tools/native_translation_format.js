#!/usr/bin/env node
/**
 * [INPUT]: 依赖 FormatJS ICU parser 的 AST 能力与调用方给出的原生英文源/译文；不推断语言或译文质量
 * [OUTPUT]: 对外提供 assertNativeTranslationFormat，约束 ICU 参数/分支、旧运行时 token 与 HTML 标签属性结构
 * [POS]: tools 的构建期格式边界；供 native 包生成流程调用，与 native_language_pack.js 的键投影及运行时分离
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const { TYPE, parse } = require('@formatjs/icu-messageformat-parser');

const ICU_PARSE_OPTIONS = Object.freeze({ ignoreTag: true });
const NON_ICU_BRACE_TOKEN = /\{\}|\{\{[^{}]+\}\}|\$\{[^{}]+\}/g;
const RUNTIME_PLACEHOLDER = /\{\}|\{[0-9]+\}|%[0-9]+|%[sdif]|\$\{[^{}]+\}|\{\{[^{}]+\}\}/g;
const ICU_ARGUMENT_START = /\{\s*(?:[0-9]+|[A-Za-z_][A-Za-z0-9_.-]*)\s*(?:,|\})/;
const ICU_TRUNCATED_ARGUMENT = /\{\s*(?:[0-9]+|[A-Za-z_][A-Za-z0-9_.-]*)\s*$/;
const ICU_CONTROL_HINT = /\{\s*[A-Za-z_][A-Za-z0-9_.-]*\s+(?:plural|select|selectordinal)\b/;

function maskLegacyBraceTokens(message) {
  return message.replace(NON_ICU_BRACE_TOKEN, 'native-format-token');
}

function parseMessage(message, side) {
  try {
    return parse(maskHtmlTags(maskLegacyBraceTokens(message)), ICU_PARSE_OPTIONS);
  } catch (error) {
    throw new Error(`native translation ${side} has invalid ICU syntax: ${error.message}`);
  }
}

function looksLikeIcu(message) {
  return ICU_ARGUMENT_START.test(message) || ICU_TRUNCATED_ARGUMENT.test(message) || ICU_CONTROL_HINT.test(message);
}

function containsIcuArgument(elements) {
  return elements.some((element) => {
    if (element.type === TYPE.argument || element.type === TYPE.number || element.type === TYPE.date || element.type === TYPE.time || element.type === TYPE.select || element.type === TYPE.plural) {
      return true;
    }
    return element.type === TYPE.tag && containsIcuArgument(element.children);
  });
}

function semanticStyle(style) {
  if (Array.isArray(style)) return style.map(semanticStyle);
  if (style && typeof style === 'object') {
    return Object.fromEntries(Object.entries(style)
      .filter(([key]) => key !== 'location')
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, value]) => [key, semanticStyle(value)]));
  }
  return style ?? null;
}

function addCount(counts, value) {
  const key = JSON.stringify(value);
  counts.set(key, (counts.get(key) || 0) + 1);
}

function sortedCounts(counts) {
  return [...counts].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
}

function semanticSignature(elements) {
  const argumentsFound = new Map();
  const controls = [];
  let pounds = 0;

  for (const element of elements) {
    switch (element.type) {
      case TYPE.literal:
        break;
      case TYPE.argument:
      case TYPE.number:
      case TYPE.date:
      case TYPE.time:
        addCount(argumentsFound, {
          name: element.value,
          type: TYPE[element.type],
          style: semanticStyle(element.style),
        });
        break;
      case TYPE.pound:
        pounds += 1;
        break;
      case TYPE.select:
      case TYPE.plural: {
        const branches = Object.keys(element.options).sort().map((selector) => [
          selector,
          semanticSignature(element.options[selector].value),
        ]);
        controls.push({
          type: TYPE[element.type],
          name: element.value,
          pluralType: element.type === TYPE.plural ? element.pluralType : null,
          offset: element.type === TYPE.plural ? element.offset : null,
          branches,
        });
        break;
      }
      case TYPE.tag:
        controls.push(...semanticSignature(element.children).controls);
        break;
      default:
        throw new Error(`unsupported ICU AST node type: ${element.type}`);
    }
  }

  controls.sort((left, right) => {
    const leftKey = JSON.stringify(left);
    const rightKey = JSON.stringify(right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  return { arguments: sortedCounts(argumentsFound), pounds, controls };
}

function runtimePlaceholders(message) {
  return [...message.matchAll(RUNTIME_PLACEHOLDER)].map(([token]) => token).sort();
}

function readTagAttributes(rawAttributes) {
  const attributes = [];
  let cursor = 0;

  while (cursor < rawAttributes.length) {
    while (/\s|\//.test(rawAttributes[cursor] || '')) cursor += 1;
    if (cursor >= rawAttributes.length) break;

    const start = cursor;
    while (cursor < rawAttributes.length && !/[\s=/>]/.test(rawAttributes[cursor])) cursor += 1;
    if (start === cursor) {
      cursor += 1;
      continue;
    }
    const name = rawAttributes.slice(start, cursor);
    let value = null;
    while (/\s/.test(rawAttributes[cursor] || '')) cursor += 1;

    if (rawAttributes[cursor] === '=') {
      cursor += 1;
      while (/\s/.test(rawAttributes[cursor] || '')) cursor += 1;
      const quote = rawAttributes[cursor] === '"' || rawAttributes[cursor] === "'" ? rawAttributes[cursor] : null;
      if (quote) {
        cursor += 1;
        const valueStart = cursor;
        while (cursor < rawAttributes.length && rawAttributes[cursor] !== quote) cursor += 1;
        value = rawAttributes.slice(valueStart, cursor);
        if (cursor < rawAttributes.length) cursor += 1;
      } else {
        const valueStart = cursor;
        while (cursor < rawAttributes.length && !/[\s>]/.test(rawAttributes[cursor])) cursor += 1;
        value = rawAttributes.slice(valueStart, cursor);
      }
    }
    attributes.push([name, value]);
  }

  return attributes;
}

function scanHtmlTags(message) {
  const sequence = [];
  const spans = [];
  let cursor = 0;

  while (cursor < message.length) {
    const opening = message.indexOf('<', cursor);
    if (opening < 0) break;
    let position = opening + 1;
    const closing = message[position] === '/';
    if (closing) position += 1;
    if (!/[A-Za-z]/.test(message[position] || '')) {
      cursor = opening + 1;
      continue;
    }

    const nameStart = position;
    while (/[A-Za-z0-9:-]/.test(message[position] || '')) position += 1;
    const name = message.slice(nameStart, position);
    let quote = null;
    while (position < message.length) {
      const character = message[position];
      if (quote) {
        if (character === quote) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        break;
      }
      position += 1;
    }
    if (position >= message.length) break;

    const rawAttributes = message.slice(nameStart + name.length, position);
    const selfClosing = /\/\s*$/.test(rawAttributes);
    sequence.push({
      closing,
      name,
      attributes: readTagAttributes(rawAttributes.replace(/\/\s*$/, '')),
      selfClosing,
    });
    spans.push([opening, position + 1]);
    cursor = position + 1;
  }

  return { sequence, spans };
}

function htmlTagSequence(message) {
  return scanHtmlTags(message).sequence;
}

function maskHtmlTags(message) {
  const { spans } = scanHtmlTags(message);
  let result = '';
  let cursor = 0;
  for (const [start, end] of spans) {
    result += `${message.slice(cursor, start)}native-html-tag`;
    cursor = end;
  }
  return result + message.slice(cursor);
}

function requireSame(label, source, target) {
  if (JSON.stringify(source) !== JSON.stringify(target)) {
    throw new Error(`native translation ${label} format does not match its source`);
  }
}

function assertNativeTranslationFormat(source, text) {
  if (typeof source !== 'string' || typeof text !== 'string') {
    throw new TypeError('native translation source and text must be strings');
  }

  requireSame('runtime placeholder', runtimePlaceholders(source), runtimePlaceholders(text));
  requireSame('HTML tag/attribute', htmlTagSequence(source), htmlTagSequence(text));

  const parseableSource = maskHtmlTags(maskLegacyBraceTokens(source));
  let sourceAst;
  try {
    sourceAst = parse(parseableSource, ICU_PARSE_OPTIONS);
  } catch (error) {
    if (looksLikeIcu(parseableSource)) {
      throw new Error(`native translation source has invalid ICU syntax: ${error.message}`);
    }
    return true;
  }

  const sourceHasIcuArgument = containsIcuArgument(sourceAst);
  let targetAst;
  try {
    targetAst = parseMessage(text, 'target');
  } catch (error) {
    if (sourceHasIcuArgument || looksLikeIcu(maskLegacyBraceTokens(text))) throw error;
    return true;
  }
  requireSame('ICU argument/branch', semanticSignature(sourceAst), semanticSignature(targetAst));
  return true;
}

module.exports = { assertNativeTranslationFormat };
