#!/usr/bin/env node
/**
 * [INPUT]: 依赖固定的 Cavalry 2.7.2-p12 原始 updater manifest 与固定历史清单离线变换器
 * [OUTPUT]: 锁定原始字节、三条 tag-pinned 下载 URL、签名身份、历史清单语义及 CLI 文件边界
 * [POS]: tools 的 legacy updater 纯合同；证明历史发布清单可冻结复现，不签名、不联网、不下载或改写原始文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

// -- 历史字节锁独立于当前发行元数据。
const repoRoot = path.resolve(__dirname, '..');
const helperPath = path.join(__dirname, 'create_legacy_updater_manifest.js');
const fixturePath = path.join(__dirname, 'fixtures', 'legacy-p12-updater-manifest.json');
const SOURCE_SIZE = 2521;
const SOURCE_SHA256 = '8bfe5ff0eaf7d353e5e2773c89e2f0c15b7de7648becbcfce290931296abfa1c';
const OUTPUT_SIZE = 2554;
const OUTPUT_SHA256 = '3f2b6f013e1a0494c8822e0f9828e330830c36706d602c5beeeccffb94be07f7';
const TAG = 'cavalry-2.7.2-p12';
const REPO_RELEASES = 'https://github.com/daftAI2026/Cavalry-i18n/releases';
const ASSETS = Object.freeze({
  'darwin-aarch64': 'Cavalry.Language.Switcher_Cavalry-2.7.2-p12_aarch64.app.tar.gz',
  'darwin-x86_64': 'Cavalry.Language.Switcher_Cavalry-2.7.2-p12_x64.app.tar.gz',
  'windows-x86_64': 'Cavalry.Language.Switcher_Cavalry-2.7.2-p12_windows-x64-setup.exe',
});
const SIGNATURE_SHA256 = Object.freeze({
  'darwin-aarch64': '3d259687bc314502ff6da7d653e37b199e1f34bd44531a9be3c6c0aa725feb24',
  'darwin-x86_64': '45c150d6b1bdb5b02269f5d440e0e67cee45017dc67471cff796aa1500f83e4f',
  'windows-x86_64': 'fef2cd52197ff63c600f70e8d05a4907c9ab58e4e0c460f56eec29dad59154c9',
});
const URL_PAIRS = Object.freeze(Object.fromEntries(
  Object.entries(ASSETS).map(([platform, asset]) => [
    platform,
    Object.freeze({
      source: `${REPO_RELEASES}/latest/download/${asset}`,
      expected: `${REPO_RELEASES}/download/${TAG}/${asset}`,
    }),
  ])
));

const integrationReady = fs.existsSync(helperPath) && fs.existsSync(fixturePath);

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readPinnedSource() {
  const stat = fs.lstatSync(fixturePath);
  assert.equal(stat.isSymbolicLink(), false, '默认源文件不得为符号链接');
  assert.equal(stat.isFile(), true, '默认源必须是普通文件');
  const bytes = fs.readFileSync(fixturePath);
  assert.equal(bytes.byteLength, SOURCE_SIZE, '原始文件长度漂移');
  assert.equal(sha256(bytes), SOURCE_SHA256, '原始文件摘要漂移');
  return bytes;
}

function expectedOutput(source) {
  let text = source.toString('utf8');
  assert.deepEqual(Buffer.from(text, 'utf8'), source, '固定源必须是严格 UTF-8');
  for (const pair of Object.values(URL_PAIRS)) {
    assert.equal(text.split(pair.source).length - 1, 1, `原始 URL 必须且只能出现一次：${pair.source}`);
    text = text.replace(pair.source, pair.expected);
  }
  const bytes = Buffer.from(text, 'utf8');
  assert.equal(bytes.byteLength, OUTPUT_SIZE, '固定输出长度漂移');
  assert.equal(sha256(bytes), OUTPUT_SHA256, '固定输出摘要漂移');
  return bytes;
}

function api() {
  return require(helperPath);
}

function mutateParsed(bytes, mutate) {
  const value = JSON.parse(bytes.toString('utf8'));
  mutate(value);
  return Buffer.from(JSON.stringify(value, null, 2) + '\n', 'utf8');
}

// -- CLI 验证只写隔离目录，不将guard描述为通用安全沙箱。
function temporaryDirectory(prefix = 'cavalry-legacy-manifest-') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return fs.realpathSync(directory);
}

function writeNetworkGuard(directory) {
  const guardPath = path.join(directory, 'network-guard.cjs');
  fs.writeFileSync(guardPath, [
    "'use strict';",
    "const Module = require('node:module');",
    "const fs = require('node:fs');",
    "const path = require('node:path');",
    "const blocked = new Set(['http', 'node:http', 'https', 'node:https', 'net', 'node:net', 'tls', 'node:tls', 'dgram', 'node:dgram', 'child_process', 'node:child_process']);",
    'const load = Module._load;',
    "Module._load = function (request, parent, isMain) { if (blocked.has(request)) throw new Error('NETWORK_GUARD_BLOCKED:' + request); if (path.basename(request) === 'package.json') throw new Error('PACKAGE_GUARD_BLOCKED:' + request); return load.call(this, request, parent, isMain); };",
    "const protectedPackage = path.resolve(process.cwd(), 'package.json');",
    "const checkRead = (target) => { if (path.resolve(String(target)) === protectedPackage) throw new Error('PACKAGE_GUARD_BLOCKED:' + target); };",
    'const readFileSync = fs.readFileSync.bind(fs);',
    "fs.readFileSync = (target, ...args) => { checkRead(target); return readFileSync(target, ...args); };",
    'const openSync = fs.openSync.bind(fs);',
    "fs.openSync = (target, ...args) => { checkRead(target); return openSync(target, ...args); };",
    'const readFile = fs.readFile.bind(fs);',
    "fs.readFile = (target, ...args) => { checkRead(target); return readFile(target, ...args); };",
    'const readPromise = fs.promises.readFile.bind(fs.promises);',
    "fs.promises.readFile = (target, ...args) => { checkRead(target); return readPromise(target, ...args); };",
    "globalThis.fetch = () => { throw new Error('NETWORK_GUARD_BLOCKED:fetch'); };",
    '',
  ].join('\n'));
  return guardPath;
}

function runCli(scriptPath, args, options = {}) {
  const nodeArgs = [];
  if (options.networkGuard) nodeArgs.push('--require', options.networkGuard);
  nodeArgs.push(scriptPath, ...args);
  return spawnSync(process.execPath, nodeArgs, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
  });
}

function assertCliFailure(result, label) {
  assert.notEqual(result.status, 0, `${label} 必须失败`);
  assert.ok(String(result.stderr || '').trim().length > 0, `${label} 必须返回可核验的非空错误`);
}

// -- 缺实现先 RED；完整输入/输出与实际 CLI 不允许空验收。
test('正式 helper 与固定历史 fixture 必须存在', () => {
  assert.ok(fs.existsSync(helperPath), 'RED: tools/create_legacy_updater_manifest.js 尚未实现');
  assert.ok(fs.existsSync(fixturePath), 'RED: tools/fixtures/legacy-p12-updater-manifest.json 尚未固定');
});

test('原始 fixture 身份、完整 URL 投影与冻结输出摘要固定', { skip: !integrationReady }, () => {
  const original = readPinnedSource();
  const expected = expectedOutput(original);
  const { renderLegacyManifest } = api();
  const inputBefore = Buffer.from(original);
  const rendered = renderLegacyManifest(original);
  assert.ok(Buffer.isBuffer(rendered), 'renderLegacyManifest 必须返回 Buffer');
  assert.deepEqual(rendered, expected, '除三条 tag-pinned URL 外不得改变任何原始字节');
  assert.deepEqual(original, inputBefore, '变换不得修改调用方输入 Buffer');
  const parsed = JSON.parse(rendered.toString('utf8'));
  assert.deepEqual(Object.keys(parsed.platforms), Object.keys(ASSETS));
  for (const [platform, pair] of Object.entries(URL_PAIRS)) {
    assert.equal(parsed.platforms[platform].url, pair.expected);
    assert.match(parsed.platforms[platform].url, new RegExp(`/download/${TAG}/`));
    assert.doesNotMatch(parsed.platforms[platform].url, /\/latest\/|\?/);
  }
});

test('render 仅接受固定 Buffer 源，拒绝输入格式或任一字节漂移', { skip: !integrationReady }, () => {
  const original = readPinnedSource();
  const { renderLegacyManifest } = api();
  assert.throws(() => renderLegacyManifest(original.toString('utf8')));
  assert.throws(() => renderLegacyManifest(Uint8Array.from(original)));
  const sourceText = original.toString('utf8');
  const drifted = [
    ['版本变更', Buffer.from(sourceText.replace('"version": "1.0.6"', '"version": "1.0.7"'))],
    ['额外字段', mutateParsed(original, (value) => { value.unreviewed = true; })],
    ['重复键', Buffer.from(sourceText.replace('"version": "1.0.6",', '"version": "1.0.6",\n  "version": "1.0.6",'))],
    ['空白重排', Buffer.from(`${JSON.stringify(JSON.parse(sourceText), null, 4)}\n`)],
    ['CRLF', Buffer.from(sourceText.replace(/\n/g, '\r\n'))],
    ['UTF-8 BOM', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), original])],
    ['非法 UTF-8', Buffer.concat([original.subarray(0, 32), Buffer.from([0xff]), original.subarray(33)])],
  ];
  for (const [label, bytes] of drifted) {
    assert.equal(bytes.equals(original), false, `${label} mutant 必须确实改变源字节`);
    assert.throws(() => renderLegacyManifest(bytes), label);
  }
});

test('assert 返回历史清单解析值并保留三个原签名指纹', { skip: !integrationReady }, () => {
  const original = readPinnedSource();
  const frozenBytes = expectedOutput(original);
  const { renderLegacyManifest, assertLegacyManifest } = api();
  const sourceBefore = Buffer.from(original);
  const outputBefore = Buffer.from(frozenBytes);
  assert.deepEqual(renderLegacyManifest(original), frozenBytes, '重复渲染必须确定');
  assert.throws(() => assertLegacyManifest(frozenBytes.toString('utf8')));
  assert.throws(() => assertLegacyManifest(Uint8Array.from(frozenBytes)));
  const parsed = assertLegacyManifest(frozenBytes);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), JSON.parse(frozenBytes.toString('utf8')));
  assert.deepEqual(original, sourceBefore, 'render 不得改写源 Buffer');
  assert.deepEqual(frozenBytes, outputBefore, 'assert 不得改写输入 Buffer');
  assert.equal(parsed.version, '1.0.6');
  assert.equal(parsed.pub_date, '2026-09-28T23:30:37.000Z');
  assert.equal(typeof parsed.notes, 'string');
  assert.deepEqual(Object.keys(parsed.platforms), Object.keys(ASSETS));
  for (const [platform, expectedFingerprint] of Object.entries(SIGNATURE_SHA256)) {
    const platformRecord = parsed.platforms[platform];
    assert.deepEqual(Object.keys(platformRecord), ['signature', 'url']);
    assert.equal(sha256(Buffer.from(platformRecord.signature, 'base64')), expectedFingerprint, `${platform} 签名原字节漂移`);
    assert.equal(platformRecord.url, URL_PAIRS[platform].expected);
  }
  parsed.platforms['darwin-aarch64'].url = '修改后的调用方副本';
  const reparsed = assertLegacyManifest(frozenBytes);
  assert.equal(reparsed.platforms['darwin-aarch64'].url, URL_PAIRS['darwin-aarch64'].expected);
  assert.deepEqual(frozenBytes, outputBefore, '修改解析副本不得改写原 Buffer');
});

test('assert 拒绝输出字段、平台集合、标签 URL 或原始格式任一漂移', { skip: !integrationReady }, () => {
  const frozen = expectedOutput(readPinnedSource());
  const { assertLegacyManifest } = api();
  const duplicateKey = frozen.toString('utf8').replace('"version": "1.0.6",', '"version": "1.0.6",\n  "version": "1.0.6",');
  const wrongSignature = mutateParsed(frozen, (value) => {
    const record = value.platforms['darwin-aarch64'];
    record.signature = `${record.signature[0] === 'A' ? 'B' : 'A'}${record.signature.slice(1)}`;
  });
  const wrongTag = Buffer.from(frozen.toString('utf8').replace(`/download/${TAG}/`, '/download/cavalry-2.7.2-p11/'));
  const latestAlias = Buffer.from(frozen.toString('utf8').replace(`/download/${TAG}/`, '/latest/download/'));
  const withQuery = Buffer.from(frozen.toString('utf8').replace('.app.tar.gz"', '.app.tar.gz?download=1"'));
  const drifted = [
    ['签名', wrongSignature],
    ['更新说明', mutateParsed(frozen, (value) => { value.notes += '\n未经审阅'; })],
    ['版本', mutateParsed(frozen, (value) => { value.version = '1.0.7'; })],
    ['发布日期', mutateParsed(frozen, (value) => { value.pub_date = '2026-10-03T00:00:00.000Z'; })],
    ['额外平台', mutateParsed(frozen, (value) => { value.platforms['linux-x86_64'] = { url: 'x', signature: 'x' }; })],
    ['缺失平台', mutateParsed(frozen, (value) => { delete value.platforms['windows-x86_64']; })],
    ['错误 tag', wrongTag],
    ['latest 别名', latestAlias],
    ['查询参数', withQuery],
    ['重复键', Buffer.from(duplicateKey)],
    ['空白变化', Buffer.from(` ${frozen.toString('utf8')}`)],
  ];
  for (const [label, bytes] of drifted) assert.throws(() => assertLegacyManifest(bytes), label);
});

test('CLI 仅从默认只读源生成 latest.json，且同字节重跑不覆盖', { skip: !integrationReady }, () => {
  const root = temporaryDirectory();
  try {
    const guard = writeNetworkGuard(root);
    const output = path.join(root, 'latest.json');
    const expected = expectedOutput(readPinnedSource());
    const first = runCli(helperPath, ['--output', output], { networkGuard: guard });
    assert.equal(first.status, 0, first.stderr);
    assert.deepEqual(fs.readFileSync(output), expected);
    const fixedTime = new Date('2001-01-01T00:00:00.000Z');
    fs.utimesSync(output, fixedTime, fixedTime);
    const before = fs.statSync(output, { bigint: true });
    const second = runCli(helperPath, ['--output', output], { networkGuard: guard });
    assert.equal(second.status, 0, second.stderr);
    const after = fs.statSync(output, { bigint: true });
    assert.deepEqual(fs.readFileSync(output), expected);
    assert.equal(after.ino, before.ino, '同内容幂等必须复用已存在文件');
    assert.equal(after.mtimeNs, before.mtimeNs, '同内容幂等不得重新写入文件');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CLI 拒绝不同内容覆盖，并拒绝错误文件名、未知参数与重复参数', { skip: !integrationReady }, () => {
  const root = temporaryDirectory();
  try {
    const output = path.join(root, 'latest.json');
    const prior = Buffer.from('由调用方持有的原始内容\n');
    fs.writeFileSync(output, prior);
    const before = fs.statSync(output, { bigint: true });
    const conflict = runCli(helperPath, ['--output', output]);
    assertCliFailure(conflict, '不同内容目标');
    const after = fs.statSync(output, { bigint: true });
    assert.deepEqual(fs.readFileSync(output), prior, '拒绝冲突时必须保留既有内容');
    assert.equal(after.ino, before.ino);
    assert.equal(after.mtimeNs, before.mtimeNs);

    const cases = [
      ['缺少输出参数', []],
      ['缺少输出路径', ['--output']],
      ['错误文件名', ['--output', path.join(root, 'not-latest.json')]],
      ['source 开关', ['--source', fixturePath, '--output', path.join(root, 'new-source.json')]],
      ['tag 开关', ['--tag', TAG, '--output', path.join(root, 'new-tag.json')]],
      ['config 开关', ['--config', 'release.config.json', '--output', path.join(root, 'new-config.json')]],
      ['notes 开关', ['--notes', 'notes.md', '--output', path.join(root, 'new-notes.json')]],
      ['日期开关', ['--pub-date', '2026-10-03T00:00:00.000Z', '--output', path.join(root, 'new-date.json')]],
      ['重复 output', ['--output', path.join(root, 'first.json'), '--output', path.join(root, 'latest.json')]],
    ];
    for (const [label, args] of cases) assertCliFailure(runCli(helperPath, args), label);
    for (const name of ['not-latest.json', 'new-source.json', 'new-tag.json', 'new-config.json', 'new-notes.json', 'new-date.json', 'first.json']) {
      assert.equal(fs.existsSync(path.join(root, name)), false, `${name} 不应被创建`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CLI 拒绝默认源的非 latest.json 文件名，保持原文字节', { skip: !integrationReady }, () => {
  const before = readPinnedSource();
  const result = runCli(helperPath, ['--output', fixturePath]);
  assertCliFailure(result, '源文件名称不满足输出合同');
  assert.match(result.stderr, /output must be named latest\.json/);
  assert.deepEqual(fs.readFileSync(fixturePath), before, '默认源必须保持原样');
});

test('CLI 拒绝输出文件或父目录符号链接', { skip: process.platform === 'win32' || !integrationReady }, () => {
  const root = temporaryDirectory();
  try {
    const target = path.join(root, 'target.json');
    const outputLink = path.join(root, 'latest.json');
    const targetBytes = Buffer.from('链接目标不可覆盖');
    fs.writeFileSync(target, targetBytes);
    fs.symlinkSync(target, outputLink);
    assertCliFailure(runCli(helperPath, ['--output', outputLink]), '输出文件符号链接');
    assert.equal(fs.lstatSync(outputLink).isSymbolicLink(), true);
    assert.deepEqual(fs.readFileSync(target), targetBytes);

    const realParent = path.join(root, 'real-parent');
    const linkedParent = path.join(root, 'linked-parent');
    fs.mkdirSync(realParent);
    fs.symlinkSync(realParent, linkedParent, 'dir');
    assertCliFailure(runCli(helperPath, ['--output', path.join(linkedParent, 'latest.json')]), '输出父目录符号链接');
    assert.equal(fs.existsSync(path.join(realParent, 'latest.json')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('默认源符号链接在隔离 tools 树中被拒绝，不动仓库 fixture', { skip: process.platform === 'win32' || !integrationReady }, () => {
  const root = temporaryDirectory();
  try {
    const isolatedTools = path.join(root, 'tools');
    const isolatedFixtures = path.join(isolatedTools, 'fixtures');
    const outside = path.join(root, 'outside');
    fs.mkdirSync(isolatedFixtures, { recursive: true });
    fs.mkdirSync(outside, { recursive: true });
    fs.copyFileSync(helperPath, path.join(isolatedTools, path.basename(helperPath)));
    const isolatedSource = path.join(isolatedFixtures, 'legacy-p12-updater-manifest.json');
    const actualSource = path.join(outside, 'source.json');
    fs.writeFileSync(actualSource, readPinnedSource());
    fs.symlinkSync(actualSource, isolatedSource);
    const output = path.join(root, 'latest.json');
    const result = runCli(path.join(isolatedTools, path.basename(helperPath)), ['--output', output], { cwd: root });
    assertCliFailure(result, '默认源符号链接');
    assert.equal(fs.existsSync(output), false, '拒绝源链接时不得产出清单');
    assert.equal(fs.lstatSync(isolatedSource).isSymbolicLink(), true);
    assert.deepEqual(fs.readFileSync(actualSource), readPinnedSource(), '隔离测试不得改源内容');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
