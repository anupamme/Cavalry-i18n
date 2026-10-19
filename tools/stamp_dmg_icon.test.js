#!/usr/bin/env node
/**
 * [INPUT]: 依赖真实stamp_dmg_icon.sh与Node临时目录；fake系统命令只模拟已实证的EBUSY。
 * [OUTPUT]: 验证临时卷仅对16有界重试、保留诊断及卸载失败不删backing镜像。
 * [POS]: tools打包生命周期回归；不挂载真实卷，不代替真实DMG布局门。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const test = require('node:test');
// DMG producer只在macOS执行；Linux合同复用Bash，Windows不执行POSIX路径fixture。
const bashTest = process.platform === 'win32' ? test.skip : test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function fixture(mode) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmg-stamp-contract-'));
  for (const folder of ['tools', 'src-tauri/icons', 'bin', 'dist', 'temporary', 'volume']) fs.mkdirSync(path.join(dir, folder), { recursive: true });
  let script = fs.readFileSync(path.join(__dirname, 'stamp_dmg_icon.sh'), 'utf8');
  // 仅虚拟化系统挂载路径；卸载、重试、错误和清理均执行生产脚本。
  script = script.replaceAll('/usr/sbin/diskutil', 'diskutil');
  script = script.split('\n').map(line => line.startsWith('  mount_point=$(printf') ? '  mount_point="$FIXTURE_ROOT/volume"' : line).join('\n');
  fs.writeFileSync(path.join(dir, 'tools/stamp_dmg_icon.sh'), script);
  fs.copyFileSync(path.join(__dirname, 'dmg_volume_identity.js'), path.join(dir, 'tools/dmg_volume_identity.js'));
  fs.writeFileSync(path.join(dir, 'package.json'), '{"version":"1.1.1"}');
  fs.writeFileSync(path.join(dir, 'src-tauri/icons/icon.icns'), 'fixture icon');
  fs.writeFileSync(path.join(dir, 'dist/fixture_x64.dmg'), 'original image');
  const executable = (name, body) => fs.writeFileSync(path.join(dir, 'bin', name), '#!/bin/bash\nset -eu\n'+body+'\n', { mode: 0o755 });
  for (const name of ['sips', 'DeRez', 'Rez', 'SetFile']) executable(name, 'exit 0');
  executable('sleep', 'echo "sleep $*" >> "$FIXTURE_ROOT/calls"');
  executable('mktemp', `if [[ " $* " == *" -d "* ]]; then mkdir -p "$FIXTURE_ROOT/temporary/work"; echo "$FIXTURE_ROOT/temporary/work"; else touch "$FIXTURE_ROOT/temporary/resource"; echo "$FIXTURE_ROOT/temporary/resource"; fi`);
  executable('diskutil', `if [ "$1" = info ]; then if [ "$FAIL_MODE" = infoerror ]; then echo 'diskutil info failure' >&2; exit 7; fi; printf 'Mount Point: %s\\nVolume Name: Cavalry Switcher 1.1.1 x64\\n' "$FIXTURE_ROOT/volume"; fi`);
  executable('lsof', 'echo "holder fixture-process cwd $FIXTURE_ROOT/volume" >&2');
  executable('hdiutil', `
echo "$*" >> "$FIXTURE_ROOT/calls"
case "$1" in
  attach) printf '/dev/fixture Apple_HFS %s\\n' "$FIXTURE_ROOT/volume";;
  convert) while [ "$1" != -o ]; do shift; done; echo converted > "$2";;
  detach)
    [ "$FAIL_MODE" != infoerror ] || exit 0
    n=0; [ ! -f "$FIXTURE_ROOT/count" ] || n=$(cat "$FIXTURE_ROOT/count"); n=$((n+1)); echo "$n" > "$FIXTURE_ROOT/count"
    if [ "$FAIL_MODE" = other ]; then echo 'detach I/O failure' >&2; exit 5; fi
    if [ "$FAIL_MODE" = always ] || [ "$n" -le 2 ]; then
      [[ " $* " == *" -quiet "* ]] || echo 'hdiutil: Resource busy' >&2
      exit 16
    fi;;
esac`);
  const result = spawnSync('bash', [path.join(dir, 'tools/stamp_dmg_icon.sh'), path.join(dir, 'dist')], {
    encoding: 'utf8', env: { ...process.env, PATH: path.join(dir, 'bin')+path.delimiter+process.env.PATH, FIXTURE_ROOT:dir, FAIL_MODE:mode },
  });
  return { dir, result, calls:fs.readFileSync(path.join(dir, 'calls'), 'utf8'), image:fs.readFileSync(path.join(dir, 'dist/fixture_x64.dmg'), 'utf8') };
}
bashTest('DMG stamp waits only for EBUSY and completes after the holder releases', () => {
  const f = fixture('release');
  try {
    assert.equal(f.result.status, 0, f.result.stderr);
    assert.equal(f.calls.split('\n').filter(s=>s.startsWith('detach ')).length, 3);
    assert.match(f.calls, /sleep 2\nsleep 4|sleep 2[\s\S]*sleep 4/);
    assert.match(f.result.stderr, /Resource busy/);
    assert.equal(f.image, 'converted\n');
  } finally { fs.rmSync(f.dir,{recursive:true,force:true}); }
});
bashTest('persistent EBUSY preserves the backing image and reports its holder', () => {
  const f = fixture('always');
  try {
    assert.equal(f.result.status, 16);
    assert.match(f.result.stderr, /holder fixture-process/);
    assert.ok(fs.existsSync(path.join(f.dir, 'temporary/work/readwrite.dmg')));
    assert.equal(f.image, 'original image');
    assert.equal(f.calls.split('\n').filter(s=>s.startsWith('detach ')).length, 4, 'three operation attempts plus one cleanup attempt');
  } finally { fs.rmSync(f.dir,{recursive:true,force:true}); }
});
bashTest('non-EBUSY errors fail immediately without delay or final-image replacement', () => {
  const f = fixture('other');
  try {
    assert.equal(f.result.status, 5);
    assert.doesNotMatch(f.calls, /sleep /);
    assert.match(f.result.stderr, /detach I\/O failure/);
    assert.equal(f.image, 'original image');
  } finally { fs.rmSync(f.dir,{recursive:true,force:true}); }
});

bashTest('rename inspection failure still detaches the recorded mount before removing its backing', () => {
  const f = fixture('infoerror');
  try {
    assert.equal(f.result.status, 7);
    assert.match(f.result.stderr, /diskutil info failure/);
    assert.equal(f.calls.split('\n').filter(s=>s.startsWith('detach ')).length, 1);
    assert.equal(f.image, 'original image');
  } finally { fs.rmSync(f.dir,{recursive:true,force:true}); }
});
