#!/usr/bin/env node
/**
 * [INPUT]: 依赖已发行 p12 manifest 的固定原文字节和 Node fs/path/crypto；不依赖当前包版本或新平台发行配置。
 * [OUTPUT]: 提供 renderLegacyManifest、assertLegacyManifest 与只生成固定 latest.json 的离线 CLI，仅将三条旧 URL 固定到 p12 tag。
 * [POS]: tools 的旧客户端 feed 冻结边界；保留原版本/说明/日期/签名，尚未接入 production publisher，不重验 archive 签名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// -- 精确原文锁使字段、重复键及格式漂移都在 JSON 解析前失败。
const ORIGINAL_SHA256 = '8bfe5ff0eaf7d353e5e2773c89e2f0c15b7de7648becbcfce290931296abfa1c';
const FROZEN_SHA256 = '3f2b6f013e1a0494c8822e0f9828e330830c36706d602c5beeeccffb94be07f7';
const ORIGINAL_BYTES = 2521;
const FROZEN_BYTES = 2554;
const ORIGINAL_BASE = 'https://github.com/daftAI2026/Cavalry-i18n/releases/latest/download/';
const FROZEN_BASE = 'https://github.com/daftAI2026/Cavalry-i18n/releases/download/cavalry-2.7.2-p12/';
const FIXTURE = path.join(__dirname, 'fixtures/legacy-p12-updater-manifest.json');
const NOFOLLOW = fs.constants.O_NOFOLLOW || 0;

function assertLockedBytes(bytes, length, sha256, label) {
  if (!Buffer.isBuffer(bytes)) throw new TypeError(`${label} must be a Buffer.`);
  if (bytes.length !== length || crypto.createHash('sha256').update(bytes).digest('hex') !== sha256) {
    throw new Error(`${label} does not match the fixed p12 byte lock.`);
  }
}

function assertLegacyManifest(bytes) {
  assertLockedBytes(bytes, FROZEN_BYTES, FROZEN_SHA256, 'Frozen legacy manifest');
  return JSON.parse(bytes.toString('utf8'));
}

function renderLegacyManifest(original) {
  assertLockedBytes(original, ORIGINAL_BYTES, ORIGINAL_SHA256, 'Original p12 manifest');
  const manifest = JSON.parse(original.toString('utf8'));
  let text = original.toString('utf8');
  for (const platform of Object.values(manifest.platforms)) {
    const quotedUrl = JSON.stringify(platform.url);
    if (!platform.url.startsWith(ORIGINAL_BASE) || text.split(quotedUrl).length !== 2) {
      throw new Error('Original p12 manifest must contain each locked URL exactly once.');
    }
    const fixedUrl = FROZEN_BASE + platform.url.slice(ORIGINAL_BASE.length);
    text = text.replace(quotedUrl, JSON.stringify(fixedUrl));
  }
  const frozen = Buffer.from(text, 'utf8');
  assertLegacyManifest(frozen);
  return frozen;
}

// -- CLI 只读固定 source；输出新建或同字节幂等，不覆盖已有异内容。
function assertRealParent(file, label) {
  const parent = path.dirname(file);
  if (!fs.lstatSync(parent).isDirectory() || fs.realpathSync(parent) !== parent) {
    throw new Error(`${label} parent must be a real canonical directory, not a symlink.`);
  }
}

function readRegularFile(file, length, label) {
  assertRealParent(file, label);
  const before = fs.lstatSync(file);
  if (!before.isFile() || before.isSymbolicLink() || before.size !== length) {
    throw new Error(`${label} must be a regular non-symlink file of ${length} bytes.`);
  }
  const fd = fs.openSync(file, fs.constants.O_RDONLY | NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== length) {
      throw new Error(`${label} changed while opening.`);
    }
    return fs.readFileSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function main(args) {
  if (args.length !== 2 || args[0] !== '--output' || !args[1] || args[1].startsWith('--')) {
    throw new Error('Usage: node tools/create_legacy_updater_manifest.js --output <canonical-dir>/latest.json');
  }
  const output = path.resolve(args[1]);
  if (path.basename(output) !== 'latest.json') throw new Error('Legacy manifest output must be named latest.json.');
  const frozen = renderLegacyManifest(readRegularFile(FIXTURE, ORIGINAL_BYTES, 'Original p12 fixture'));
  assertRealParent(output, 'Legacy manifest output');
  try {
    fs.lstatSync(output);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // O_EXCL 防止检查后出现的文件被覆盖；中断生成物仍须重新通过字节锁。
    const fd = fs.openSync(output, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | NOFOLLOW, 0o644);
    try {
      fs.writeFileSync(fd, frozen);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  }
  assertLegacyManifest(readRegularFile(output, FROZEN_BYTES, 'Existing legacy manifest output'));
  console.log(`[legacy-updater-manifest] OK: frozen p12 manifest at ${output}; archive signatures not reverified`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) {
    console.error(`[legacy-updater-manifest] ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { renderLegacyManifest, assertLegacyManifest };
