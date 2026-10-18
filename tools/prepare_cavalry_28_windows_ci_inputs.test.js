/**
 * [INPUT]: 依赖Windows CI输入准备器、冻结宿主target与Windows 2.8构建包装器。
 * [OUTPUT]: 验证MSI准入、admin提取、Qt输入和GITHUB_ENV边界，不运行PowerShell或下载制品。
 * [POS]: Windows CI输入准备器的跨平台静态合同；不模拟Windows或Cavalry执行。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const scriptPath = path.join(__dirname, 'prepare_cavalry_28_windows_ci_inputs.ps1');
const scriptBytes = fs.readFileSync(scriptPath);
const script = scriptBytes.toString('utf8').replace(/^\uFEFF/, '');
const target = JSON.parse(fs.readFileSync(path.join(__dirname, 'cavalry_native_windows_target.json'), 'utf8'));
const nativeBuilder = fs.readFileSync(path.join(__dirname, 'windows_native_build.js'), 'utf8');

test('PowerShell entry keeps the required Windows encoding and file header contract', () => {
  assert.deepEqual([...scriptBytes.subarray(0, 3)], [0xef, 0xbb, 0xbf], 'PowerShell source must use UTF-8 BOM');
  const crlfCount = (script.match(/\r\n/g) || []).length;
  const lfCount = (script.match(/\n/g) || []).length;
  assert.ok(crlfCount > 0, 'PowerShell source must use CRLF');
  assert.equal(lfCount, crlfCount, 'PowerShell source must not contain bare LF');
  assert.match(script, /^<#\r\n\[INPUT\]:/);
  assert.match(script, /\[OUTPUT\]:[\s\S]*\[POS\]:[\s\S]*\[PROTOCOL\]: 变更时更新此头部，然后检查 CLAUDE\.md/);
});

test('official MSI URL is accepted only by the existing frozen Windows 2.8 target hashes', () => {
  assert.equal(target.schemaVersion, 1);
  assert.equal(target.cavalryVersion, '2.8.0');
  assert.equal(target.qtVersion, '6.9.2');
  assert.equal(target.architecture, 'x86_64');
  assert.equal(target.msiSha256, '5409d19515665be1c3f27f247d5a31df36657048d1df448b1327a4eb8e04aaeb');
  assert.equal(Object.keys(target.files).length, 5);
  assert.ok(Object.hasOwn(target.files, 'Cavalry.exe'));
  assert.match(script, /cavalry_native_windows_target\.json/);
  assert.match(script, /Get-FileHash -LiteralPath \$msiPath -Algorithm SHA256/);
  assert.match(script, /\$actualMsiSha256 -cne \$target\.msiSha256\.ToLowerInvariant\(\)/);
  assert.match(script, /foreach \(\$entry in \$targetFiles\)/);
  assert.match(script, /\$actualFileSha256 -cne \$entry\.Value\.ToLowerInvariant\(\)/);
  assert.match(script, /https:\/\/cavalry\.studio\/downloads\/latest\/Cavalry\.msi/);
  assert.doesNotMatch(script, /cavalry_native_target\.json|sourceSha256|japaneseSha256/,
    'catalog source hashes stay owned by the existing native resource bundle');
});

test('the MSI runs administrative extraction only under runner temp, never product installation', () => {
  assert.match(script, /GITHUB_ACTIONS -ne 'true'[\s\S]*?RUNNER_TEMP and GITHUB_ENV are required/);
  assert.match(script, /\$inputRoot = Join-Path \$runnerTemp /);
  assert.match(script, /TARGETDIR="\{2\}"/);
  assert.match(script, /Start-Process -FilePath \$msiexec -ArgumentList \$msiArguments -Wait -PassThru/);
  assert.match(script, /if \(\$msiProcess\.ExitCode -ne 0\)/);
  assert.match(script, /Get-ChildItem -LiteralPath \$extractRoot -Filter 'Cavalry\.exe' -File -Recurse/);
  assert.match(script, /Join-Path \$matchingRoots\[0\] 'assets'/);
  assert.match(script, /Join-Path \$assetsRoot 'MetaData'/);
  assert.match(script, /Join-Path \$assetsRoot 'Presets'/);
  assert.doesNotMatch(script, /\/i(?:\s|\")/i, 'the helper must not run msiexec install mode');
  assert.doesNotMatch(script, /Program Files|APPDATA|LOCALAPPDATA|Cavalry\.exe['\"]?\s+\/|Start-Process[^\r\n]*Cavalry\.exe/);
  assert.ok(script.indexOf("GITHUB_ACTIONS -ne 'true'") < script.indexOf('Invoke-WebRequest'));
});

test('Qt input uses the pinned aqt closure and exports only validated native build paths', () => {
  assert.match(script, /version\('aqtinstall'\) == '3\.3\.0'/);
  assert.match(script, /'install-qt', 'windows', 'desktop', '6\.9\.2', 'win64_msvc2022_64'/);
  assert.match(script, /'--archives', 'qtbase'/);
  assert.match(script, /mkspecs\\qconfig\.pri/);
  assert.match(script, /QT_VERSION\\s\*=\\s\*6\\\.9\\\.2/);
  assert.match(script, /AppendAllText\(\$githubEnvPath, \$environmentLines, \[System\.Text\.UTF8Encoding\]::new\(\$false\)\)/);
  assert.match(script, /CAVALRY_NATIVE_ASSETS_ROOT=\$assetsRoot/);
  assert.match(script, /CAVALRY_QT_PREFIX=\$qtPrefix/);
  assert.ok(script.indexOf('if ($qtVersionLines.Count') < script.indexOf('AppendAllText('),
    'GitHub environment paths must be written after SDK verification');
  assert.match(nativeBuilder, /parentEnvironment\.CAVALRY_NATIVE_ASSETS_ROOT/);
  assert.match(nativeBuilder, /parentEnvironment\.CAVALRY_QT_PREFIX/);
  assert.match(nativeBuilder, /production native resource generation/);
});
