#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_translation_format.js 的格式合同；输入合成原生消息与 HTML，不读 vendor bundle
 * [OUTPUT]: 锁定 ICU 语法/语义、非 ICU 占位符及标签属性序列，不评价译文质量或原厂运行时
 * [POS]: tools 的构建期 native 格式门合同，与目录投影测试分层，不调用 injector、Cavalry 或用户 profile
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

function validate(source, text) {
  return require('./native_translation_format.js').assertNativeTranslationFormat(source, text);
}

test('ICU plural, select, selectordinal, offset, nested arguments and explicit branches survive CJK reordering', () => {
  const source = '<b title="items">{0}</b>: {count, plural, offset:1 =0 {No items for {owner}} one {# item for {owner}} other {# items for {owner}}}; {mode, select, full {full mode} other {custom mode}}; {rank, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}';
  const text = '{rank, selectordinal, other {第 # 位} few {第 # 位} two {第 # 位} one {第 # 位}}；{mode, select, other {自定义模式} full {完整模式}}；{count, plural, offset:1 other {还有 # 项，归 {owner}} =0 {没有项目，归 {owner}} one {剩余 # 项，归 {owner}}}：<b title="items">{0}</b>';

  assert.doesNotThrow(() => validate(source, text));
});

test('malformed ICU source and target messages fail closed', () => {
  assert.throws(() => validate('{count, plural, one {one} other {many}', '{count, plural, one {一} other {多}}'), /source|ICU|message/i);
  assert.throws(() => validate('{count plural one {one} other {many}}', '{count, plural, one {一} other {多}}'), /source|ICU|message/i);
  assert.throws(() => validate('{count, plural, one {one} other {many}}', '{count, plural, one {一} other {多}'), /target|ICU|message/i);
});

test('plural and select require the source branch set including other', () => {
  assert.throws(() => validate('{count, plural, one {one} other {many}}', '{count, plural, one {一}}'), /other|ICU|message/i);
  assert.throws(() => validate('{mode, select, compact {compact} other {default}}', '{mode, select, compact {紧凑} full {完整} other {默认}}'), /selector|branch|format|ICU/i);
});

test('explicit numeric selectors and plural offsets are part of the format contract', () => {
  assert.throws(() => validate('{count, plural, =0 {none} other {# items}}', '{count, plural, other {# 项}}'), /selector|branch|format|ICU/i);
  assert.throws(() => validate('{count, plural, offset:1 other {# items}}', '{count, plural, other {# 项}}'), /offset|format|ICU/i);
});

test('each plural branch keeps its pound and nested argument semantics', () => {
  assert.throws(() => validate('{count, plural, one {# item for {owner}} other {# items for {owner}}}', '{count, plural, one {一个项目给 {owner}} other {# 个项目给 {owner}}}'), /branch|argument|pound|format|ICU/i);
});

test('numbered arguments cannot be added, removed, renumbered or retagged', () => {
  assert.throws(() => validate('Hello {0}', '你好'), /argument|format|ICU/i);
  assert.throws(() => validate('Hello {0}', '你好 {0} {1}'), /argument|format|ICU/i);
  assert.throws(() => validate('Hello {0} {1}', '你好 {1} {2}'), /argument|format|ICU/i);
  assert.throws(() => validate('Value: {value, number}', '值：{value, date}'), /argument|type|format|ICU/i);
});

test('quoted literal braces remain literal rather than becoming ICU arguments', () => {
  assert.doesNotThrow(() => validate("Use '{'key'}' in config", "在配置中使用 '{'键'}'"));
});

test('plain and quoted-literal source messages cannot gain a named ICU argument', () => {
  assert.throws(() => validate('Cavalry', 'Cavalry {brand}'), /argument|format|ICU/i);
  assert.throws(() => validate("Use '{'key'}'", "Use '{'key'}' {brand}"), /argument|format|ICU/i);
});

test('ordinary prose with non-ICU literal braces uses the plain-text path', () => {
  assert.doesNotThrow(() => validate('Write {left and right} literally.', '按字面写出 {左侧与右侧}。'));
});

test('legacy runtime placeholders stay byte-identical as a multiset outside ICU', () => {
  const source = 'Resolution {} {0} %1 %s ${name} {{template}}';
  const same = '分辨率 {} {0} %1 %s ${name} {{template}}';
  assert.doesNotThrow(() => validate(source, same));
  assert.throws(() => validate(source, '分辨率 {} {0} %1 ${name} {{template}}'), /placeholder|format/i);
  assert.throws(() => validate(source, '分辨率 {} {1} %1 %s ${name} {{template}}'), /placeholder|argument|format|ICU/i);
});

test('HTML tags and ordered attributes are compared independently from ICU parsing', () => {
  assert.throws(() => validate('<span class="notice">{0}</span><br>', '<span class="notice" role="note">{0}</span><br>'), /tag|attribute|markup|format/i);
  assert.throws(() => validate('<span class="notice">{0}</span><br>', '<span>{0}</span><br>'), /tag|attribute|markup|format/i);
  assert.throws(() => validate('<span class="notice">{0}</span><br>', '<span class="notice">{0}</span>'), /tag|markup|format/i);
  assert.throws(() => validate('<span id="x" class="notice">{0}</span>', '<span class="notice" id="x">{0}</span>'), /tag|attribute|markup|format/i);
});

test('HTML attribute values stay fixed while quote style may change', () => {
  for (const attribute of ['href="https://source.example/path"', 'id="source-id"', 'style="color: red"', 'src="source.png"']) {
    const [name, value] = attribute.split('=');
    const source = `<a ${attribute}>{0}</a>`;
    const changed = `<a ${name}="changed">{0}</a>`;
    assert.throws(() => validate(source, changed), /attribute|markup|format/i, `${name} must not drift`);
    assert.doesNotThrow(() => validate(source, `<a ${name}='${value.slice(1, -1)}'>{0}</a>`));
  }
});

test('Unicode prose and emoji do not perturb native format signatures', () => {
  assert.doesNotThrow(() => validate('Render {count, plural, one {# layer} other {# layers}} ✨', '✨ 渲染 {count, plural, one {# 个图层} other {# 个图层}}'));
});
