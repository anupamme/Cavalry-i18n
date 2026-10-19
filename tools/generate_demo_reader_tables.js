/**
 * [INPUT]: 依赖root批准的official_demo_scripts.js及100源/489位置；Windows显式CRLF源须逐字节还原批准LF身份。
 * [OUTPUT]: 生成有限文本表与实际源SHA/位置表；CRLF仅映射偏移，不修改文件或扩大译文范围。
 * [POS]: Demo读取候选的构建期投影器；不接运行时文件IO。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

function fail(message) { throw new Error(message); }

function readArguments(argv) {
  const values = Object.create(null);
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!['--source', '--presets-root', '--texts-out', '--files-out', '--source-line-endings'].includes(key) || !value || values[key]) {
      fail('用法: node generate_demo_reader_tables.js --source FILE --presets-root DIR --texts-out FILE --files-out FILE');
    }
    values[key] = value;
  }
  for (const key of ['--source', '--presets-root', '--texts-out', '--files-out']) {
    if (!values[key]) fail(`缺少参数: ${key}`);
  }
  if (values['--source-line-endings'] && values['--source-line-endings'] !== 'crlf') fail('只允许显式crlf源映射');
  return values;
}

// -- 仅当去除CRLF中的CR后完全等于批准源，才映射其文字位置到实际字节 ----
function bindOfficialSource(bytes, file, lineEndings) {
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  const rawSha = digest(bytes);
  if (bytes.length === file.bytes && rawSha === file.sha256) {
    return { approved: bytes, actualSha256: rawSha, actualBytes: bytes.length, offset: value => value };
  }
  if (lineEndings !== 'crlf') fail(`原厂示例身份不匹配: ${file.file}`);
  const normalized = Buffer.alloc(bytes.length);
  const offsets = [];
  let size = 0;
  for (let index = 0; index < bytes.length; ++index) {
    const rawBegin = index;
    if (bytes[index] === 13 && bytes[index + 1] === 10) ++index;
    offsets.push(rawBegin);
    normalized[size++] = bytes[index];
  }
  offsets.push(bytes.length);
  const approved = normalized.subarray(0, size);
  if (size !== file.bytes || digest(approved) !== file.sha256) fail(`CRLF源不能还原批准身份: ${file.file}`);
  return { approved, actualSha256: rawSha, actualBytes: bytes.length, offset: value => offsets[value] };
}

function cppString(value) {
  let escaped = 'u8"';
  for (const character of value) {
    const code = character.codePointAt(0);
    if (character === '\\') escaped += '\\\\';
    else if (character === '"') escaped += '\\"';
    else if (character === '\n') escaped += '\\n';
    else if (character === '\r') escaped += '\\r';
    else if (character === '\t') escaped += '\\t';
    else if (character === '\b') escaped += '\\b';
    else if (character === '\f') escaped += '\\f';
    else if (code < 0x20) escaped += `\\x${code.toString(16).padStart(2, '0')}""`;
    else escaped += character;
  }
  return `${escaped}"`;
}

function decodeStringLiteral(literal) {
  const quote = literal[0];
  if ((quote !== '"' && quote !== "'") || literal.length < 2 ||
      literal[literal.length - 1] !== quote) {
    fail('文字位置必须包含完整的JavaScript单双引号字面量');
  }
  let decoded = '';
  for (let index = 1; index < literal.length - 1; index++) {
    const current = literal[index];
    if (current !== '\\') {
      if (current === quote) fail('字符串字面量含未转义的结束引号');
      decoded += current;
      continue;
    }
    const escaped = literal[++index];
    if (escaped === undefined || index >= literal.length - 1) {
      fail('字符串字面量以反斜线结尾');
    }
    switch (escaped) {
      case '\\': decoded += '\\'; break;
      case "'": decoded += "'"; break;
      case '"': decoded += '"'; break;
      case 'n': decoded += '\n'; break;
      case 'r': decoded += '\r'; break;
      case 't': decoded += '\t'; break;
      case 'b': decoded += '\b'; break;
      case 'f': decoded += '\f'; break;
      case 'v': decoded += '\v'; break;
      case '0': decoded += '\0'; break;
      case '\n': break;
      case '\r': if (literal[index + 1] === '\n') index++; break;
      case 'x': {
        const hex = literal.slice(index + 1, index + 3);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) fail('无效的\\x转义');
        decoded += String.fromCharCode(parseInt(hex, 16));
        index += 2;
        break;
      }
      case 'u': {
        if (literal[index + 1] === '{') {
          const close = literal.indexOf('}', index + 2);
          const hex = close < 0 ? '' : literal.slice(index + 2, close);
          if (!/^[0-9a-fA-F]{1,6}$/.test(hex) || parseInt(hex, 16) > 0x10ffff) {
            fail('无效的\\u{}转义');
          }
          decoded += String.fromCodePoint(parseInt(hex, 16));
          index = close;
        } else {
          const hex = literal.slice(index + 1, index + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('无效的\\u转义');
          decoded += String.fromCharCode(parseInt(hex, 16));
          index += 4;
        }
        break;
      }
      default: decoded += escaped; break;
    }
  }
  return decoded;
}

function encodeStringLiteral(value, quote) {
  const escaped = value.replace(/[\\\u0000-\u001f]/g, character => {
    switch (character) {
      case '\\': return '\\\\';
      case '\0': return '\\0';
      case '\b': return '\\b';
      case '\t': return '\\t';
      case '\n': return '\\n';
      case '\v': return '\\v';
      case '\f': return '\\f';
      case '\r': return '\\r';
      default: return `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
    }
  }).replaceAll(quote, `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}

function main() {
  const args = readArguments(process.argv);
  const inputPath = path.resolve(args['--source']);
  const presetsRoot = fs.realpathSync(path.resolve(args['--presets-root']));
  const inputBytes = fs.readFileSync(inputPath);
  const inputSha = crypto.createHash('sha256').update(inputBytes).digest('hex');
  const catalog = require(inputPath);
  const provenance = catalog && catalog.provenance;
  if (!provenance || provenance.schemaVersion !== 1 ||
      provenance.approvalState !== 'root-approved-text-only' ||
      provenance.target !== 'Cavalry 2.8.0 official macOS Presets' ||
      provenance.sourceFiles !== 100 || provenance.displaySlots !== 489 ||
      provenance.uniqueSources !== 297 || provenance.translationSlots !== 891) {
    fail('Demo目录合同与批准的100源/489位置/297文本输入不符');
  }
  if (!Array.isArray(catalog.entries) || catalog.entries.length !== 297 ||
      !Array.isArray(catalog.sourceFiles) || catalog.sourceFiles.length !== 100) {
    fail('Demo源数组规模与批准合同不符');
  }

  const ids = new Map();
  const uniqueSources = new Set();
  for (const [index, entry] of catalog.entries.entries()) {
    if (!entry || typeof entry.id !== 'string' || ids.has(entry.id) ||
        typeof entry.source !== 'string' || !entry.source || !entry.translations) {
      fail(`源文本${index}缺少唯一id、原文或译文`);
    }
    const translations = ['zh-Hans', 'zh-Hant', 'ja_JP'].map(locale => entry.translations[locale]);
    if (translations.some(value => typeof value !== 'string' || value.length === 0)) {
      fail(`源文本${entry.id}缺少三语完整译文`);
    }
    if (uniqueSources.has(entry.source)) fail(`重复原文: ${entry.id}`);
    uniqueSources.add(entry.source);
    ids.set(entry.id, index);
  }

  const slots = [];
  const files = [];
  const seenPaths = new Set();
  for (const file of catalog.sourceFiles) {
    if (!file || typeof file.file !== 'string' || path.isAbsolute(file.file) ||
        file.file.includes('\\') || file.file.split('/').includes('..') ||
        file.file.split('/').includes('.') || seenPaths.has(file.file) ||
        !/^[0-9a-f]{64}$/.test(file.sha256) || !Number.isInteger(file.bytes) ||
        file.bytes <= 0 || !Array.isArray(file.slots)) {
      fail('源文件身份缺少安全相对路径、SHA、字节数或位置表');
    }
    seenPaths.add(file.file);
    const sourcePath = path.resolve(presetsRoot, file.file);
    if (!sourcePath.startsWith(`${presetsRoot}${path.sep}`)) fail('源路径越出官方Presets根目录');
    const canonicalSource = fs.realpathSync(sourcePath);
    if (!canonicalSource.startsWith(`${presetsRoot}${path.sep}`)) fail('源文件符号链接越出官方Presets根目录');
    const bytes = fs.readFileSync(canonicalSource);
    const bound = bindOfficialSource(bytes, file, args['--source-line-endings']);
    const fileSlots = [...file.slots].sort((left, right) => left.startUtf8 - right.startUtf8);
    let previousEnd = 0;
    for (const slot of fileSlots) {
      const textIndex = slot && ids.get(slot.id);
      const entry = Number.isInteger(textIndex) ? catalog.entries[textIndex] : null;
      const literal = Number.isInteger(slot.startUtf8) && Number.isInteger(slot.endUtf8) &&
        slot.startUtf8 >= 0 && slot.endUtf8 > slot.startUtf8 &&
        slot.endUtf8 <= file.bytes
        ? bound.approved.toString('utf8', slot.startUtf8, slot.endUtf8) : '';
      let decoded = null;
      if (literal) {
        try { decoded = decodeStringLiteral(literal); } catch { decoded = null; }
      }
      if (!entry || !Number.isInteger(slot.startUtf8) || !Number.isInteger(slot.endUtf8) ||
          slot.startUtf8 < previousEnd || slot.endUtf8 <= slot.startUtf8 ||
          slot.endUtf8 > file.bytes ||
          decoded !== entry.source ||
          typeof slot.role !== 'string' || slot.role.length === 0) {
        fail(`源文件${file.file}含越界、重叠或长度不匹配的位置`);
      }
      const actualLiteral = bytes.subarray(bound.offset(slot.startUtf8), bound.offset(slot.endUtf8));
      if (actualLiteral[0] !== literal.charCodeAt(0) || actualLiteral.at(-1) !== literal.charCodeAt(literal.length - 1)) {
        fail(`源文件${file.file}实际位置丢失字面量边界`);
      }
      slots.push({ start: bound.offset(slot.startUtf8), end: bound.offset(slot.endUtf8), textIndex,
        quote: literal[0] });
      previousEnd = slot.endUtf8;
    }
    files.push({ file: file.file, sha256: bound.actualSha256, bytes: bound.actualBytes,
      slotBegin: slots.length - fileSlots.length, slotCount: fileSlots.length });
  }
  if (slots.length !== 489 || seenPaths.size !== 100) fail('源位置或路径总数偏离批准值');

  const header = `// Generated from official_demo_scripts.js; input sha256=${inputSha}\n` +
    '// Fixed source-bound display data. No vendor JS source is embedded.\n';
  const textLines = catalog.entries.map(entry =>
    `    {${cppString(entry.source)}, ${cppString(entry.translations['zh-Hans'])}, ` +
    `${cppString(entry.translations['zh-Hant'])}, ${cppString(entry.translations.ja_JP)}},`);
  const slotLines = slots.map(slot => {
    const quote = slot.quote === "'" ? "'\\''" : "'\"'";
    return `    {${slot.start}u, ${slot.end}u, ${slot.textIndex}u, ${quote}},`;
  });
  const fileLines = [];
  for (const file of files) {
    fileLines.push(`    {${cppString(file.file)}, ${cppString(file.sha256)}, ${file.bytes}u, ` +
      `${file.slotBegin}u, ${file.slotCount}u},`);
  }
  fs.writeFileSync(path.resolve(args['--texts-out']),
    `${header}inline constexpr DemoReaderText kDemoReaderTexts[] = {\n${textLines.join('\n')}\n};\n`);
  fs.writeFileSync(path.resolve(args['--files-out']),
    `${header}inline constexpr DemoReaderSlot kDemoReaderSlots[] = {\n${slotLines.join('\n')}\n};\n` +
    `inline constexpr DemoReaderFile kDemoReaderFiles[] = {\n${fileLines.join('\n')}\n};\n`);
  process.stdout.write(JSON.stringify({ inputSha256: inputSha, textCount: textLines.length,
    fileCount: files.length, slotCount: slots.length }, null, 2) + '\n');
}

module.exports = { bindOfficialSource };
if (require.main === module) try { main(); } catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
