#!/usr/bin/env node
/**
 * [INPUT]: 依赖 renderer/path-display.js 的无依赖路径与候选摘要投影及user-profile-text→ui-text字典加载顺序；使用轻量 DOM stub，不启动 Tauri、不访问本机安装候选。
 * [OUTPUT]: 验证缺失安装时的结构化候选摘要逐路径复用截断、保留完整无障碍路径列表，并与普通提示/真实单路径投影隔离。
 * [POS]: tools 的纯 Node 组件合同；锁定 app.js 通过既有 PathDisplay 投影默认候选，不把本地路径拼入文案或修改窗口几何。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../renderer/path-display.js'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '../renderer/app.js'), 'utf8');
const profileTextSource = fs.readFileSync(path.join(__dirname, '../renderer/user-profile-text.js'), 'utf8');
const textSource = fs.readFileSync(path.join(__dirname, '../renderer/ui-text.js'), 'utf8');
const stylesSource = fs.readFileSync(path.join(__dirname, '../renderer/styles.css'), 'utf8');

class Element {
  constructor() {
    this.dataset = {};
    this.attributes = new Map();
    this.textContent = '';
  }

  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
}

function createDisplay() {
  const window = {};
  vm.runInNewContext(source, { window });
  const root = new Element();
  const prefix = new Element();
  const leaf = new Element();
  return { display: window.createPathDisplay({ root, prefix, leaf }), root, prefix, leaf };
}

test('default install candidates use the path projection without losing full accessible paths', () => {
  const { display, root, prefix, leaf } = createDisplay();
  assert.equal(typeof display.setCandidates, 'function', 'PathDisplay must accept structured install candidates');

  const candidates = [
    '/Applications/Cavalry.app',
    '/Users/this-is-a-long-name/Applications/Cavalry.app',
  ];
  display.setCandidates('Tried:', candidates);

  assert.equal(root.dataset.display, 'message');
  assert.equal(prefix.textContent, 'Tried: /Applications/Cavalry.app · /Users/…/Cavalry.app');
  assert.equal(leaf.textContent, '', 'candidate summaries remain one compact row');
  assert.equal(root.getAttribute('aria-label'), `Tried:\n${candidates.join('\n')}`);
  assert.equal(root.getAttribute('title'), null, 'full candidates must not create a native tooltip');

  display.setCandidates('Tried:', [String.raw`C:\Program Files\Cavalry\Cavalry.exe`]);
  assert.equal(prefix.textContent, String.raw`Tried: C:\Program Files\Cavalry`);
  assert.equal(root.getAttribute('aria-label'), `Tried:\n${String.raw`C:\Program Files\Cavalry`}`,
    'candidate accessibility follows the same installation-location projection as a selected Windows executable');
});

test('message and selected-install path projection keep their existing behavior', () => {
  const { display, root, prefix, leaf } = createDisplay();
  display.setMessage('Choose a Cavalry installation to continue.');
  assert.equal(root.dataset.display, 'message');
  assert.equal(prefix.textContent, 'Choose a Cavalry installation to continue.');
  assert.equal(root.getAttribute('aria-label'), 'Choose a Cavalry installation to continue.');

  display.setPath('/Applications/Cavalry.app');
  assert.equal(root.dataset.display, 'path');
  assert.equal(prefix.textContent, '/Applications');
  assert.equal(leaf.textContent, '/Cavalry.app');
  assert.equal(root.getAttribute('aria-label'), '/Applications/Cavalry.app');
});

test('app wiring keeps candidate data separate from the localized label', () => {
  assert.match(appSource, /pathDisplay\.setCandidates\(t\('appPathFallback'\), bootstrapState\.defaultAppCandidates\)/);
  assert.doesNotMatch(appSource, /defaultAppCandidates\.join\(/, 'candidate paths must not be embedded in a localized sentence');

  const text = vm.runInNewContext(`${profileTextSource}\n${textSource}; UI_TEXT`, {});
  for (const locale of ['en', 'zh-Hans', 'zh-Hant', 'ja_JP']) {
    assert.ok(text[locale].appPathFallback, `${locale} has a localized candidate label`);
    assert.doesNotMatch(text[locale].appPathFallback, /\n|\{candidates\}/,
      `${locale} copy must not carry path layout or interpolation semantics`);
  }
});

test('long candidate labels cannot expand the fixed content grid', () => {
  assert.match(stylesSource, /\.content > section:first-child\s*\{[^}]*min-width:\s*0;/,
    'the installation grid item must shrink before the one-line candidate summary overflows its window');
});
