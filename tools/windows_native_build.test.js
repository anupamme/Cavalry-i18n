/**
 * [INPUT]: 依赖windows_native_build的固定生产overlay和注入式Node子进程。
 * [OUTPUT]: 验证准备/打包阶段、Release命令、tag签名环境与production隔离。
 * [POS]: Windows 2.8构建包装器的vendor-free合同；不下载工具或启动Tauri。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  WINDOWS_PRODUCTION_CONFIGS,
  parseArgs,
  runWindowsNativeBuild,
} = require('./windows_native_build');

const TARGET = 'x86_64-pc-windows-msvc';
const IDENTITY = {
  schemaVersion: 1,
  kind: 'WindowsCMakeToolchainIdentity',
  platform: 'windows-x86_64',
  architecture: 'x86_64',
  version: '4.4.3',
  executable: 'C:/pinned/cmake.exe',
  ctest: 'C:/pinned/ctest.exe',
};

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'windows-native-build-'));
  for (const relative of [
    'tools',
    'src-tauri',
    'injector/windows/native',
  ]) {
    fs.mkdirSync(path.join(root, relative), { recursive: true });
  }
  return root;
}

function fakeSpawn(repoRoot, calls, { failAt } = {}) {
  return (command, args, options) => {
    calls.push({
      command,
      args: [...args],
      cwd: options.cwd,
      env: { ...options.env },
      stdio: options.stdio,
      encoding: options.encoding,
    });
    if (failAt === calls.length) {
      return { status: 1, stdout: '', stderr: 'fixture failure' };
    }
    if (args[0] && args[0].endsWith('resolve_windows_cmake.js')) {
      return { status: 0, stdout: `${JSON.stringify(IDENTITY)}\n`, stderr: '' };
    }
    if (args.includes('--build')) {
      const output = path.join(repoRoot, 'build/windows-native-28');
      fs.mkdirSync(path.join(output, 'generic'), { recursive: true });
      fs.mkdirSync(path.join(output, 'qpa'), { recursive: true });
      fs.writeFileSync(path.join(output, 'generic/cavalryi18n.dll'), 'native-generic');
      fs.writeFileSync(path.join(output, 'qpa/qwindows.dll'), 'native-qpa');
    }
    return { status: 0, stdout: '', stderr: '' };
  };
}

function commandIndex(calls, script, tail) {
  return calls.findIndex(call => call.args[0]?.endsWith(script)
    && call.args.slice(1).join(' ') === tail.join(' '));
}

test('production overlay order is exported as a dependency-free constant', () => {
  assert.deepEqual(WINDOWS_PRODUCTION_CONFIGS, [
    'src-tauri/tauri.windows.conf.json',
    'src-tauri/tauri.native-production-2.8.conf.json',
    'src-tauri/tauri.native-windows-2.8.conf.json',
    'src-tauri/tauri.release-2.8.conf.json',
  ]);
  assert.equal(Object.isFrozen(WINDOWS_PRODUCTION_CONFIGS), true);
});

test('CLI accepts only the production stages actually consumed by CI and tags', () => {
  assert.deepEqual(parseArgs([]), { prepare: true, package: true, updater: false });
  assert.deepEqual(parseArgs(['--prepare-only']), { prepare: true, package: false, updater: false });
  assert.deepEqual(parseArgs(['--package-only']), { prepare: false, package: true, updater: false });
  assert.deepEqual(parseArgs(['--package-only', '--updater']), { prepare: false, package: true, updater: true });
  assert.throws(() => parseArgs(['--prepare-only', '--updater']), /cannot combine/);
  assert.throws(() => parseArgs(['--prepare-only', '--package-only']), /only one stage/);
  assert.throws(() => parseArgs(['--unexpected']), /unknown option/);
});

test('prepare-only generates production packs, builds/tests x64 MSVC Release, then copies both DLLs', () => {
  const repoRoot = makeRepo();
  const calls = [];
  const env = {
    CAVALRY_NATIVE_ASSETS_ROOT: path.join(repoRoot, 'official', 'assets'),
    CAVALRY_QT_PREFIX: path.join(repoRoot, 'Qt', '6.9.2', 'msvc2022_64'),
    CAVALRY_I18N_NATIVE_BUILD_PROFILE: 'debug-parent-value',
    CAVALRY_I18N_EXPECT_UPDATER_SIGNATURE: '1',
  };
  const parentEnvBefore = { ...env };
  try {
    assert.equal(fs.existsSync(path.join(repoRoot, 'injector/windows/generic')), false);
    assert.equal(fs.existsSync(path.join(repoRoot, 'injector/windows/qpa')), false);
    runWindowsNativeBuild(['--prepare-only'], {
      repoRoot,
      platform: 'win32',
      env,
      spawnSync: fakeSpawn(repoRoot, calls),
    });

    assert.deepEqual(env, parentEnvBefore, 'wrapper must not mutate its parent environment');
    assert.match(calls[0].args.join(' '), /native_resource_bundle\.js --assets-root .* --profile production-2\.8/);
    assert.deepEqual(calls[1].args.slice(1), [
      '--ensure', '--print-json', '--platform', 'windows',
    ]);
    assert.equal(calls[1].encoding, 'utf8', 'only the resolver output is captured as machine JSON');
    assert.equal(calls[1].stdio, undefined);
    assert.ok(calls.filter((_, index) => index !== 1).every(call => call.stdio === 'inherit'),
      'build and test output must stream to the CI log');
    const configure = calls[2];
    assert.equal(configure.command, IDENTITY.executable);
    assert.deepEqual(configure.args, [
      '-S', path.join(repoRoot, 'injector/windows/native'),
      '-B', path.join(repoRoot, 'build/windows-native-28'),
      '-G', 'Visual Studio 17 2022', '-A', 'x64', '-T', 'v143',
      `-DCMAKE_PREFIX_PATH=${path.join(repoRoot, 'Qt/6.9.2/msvc2022_64')}`,
      `-DCAVALRY_NATIVE_METADATA_DIR=${path.join(repoRoot, 'official/assets/MetaData')}`,
    ]);
    assert.deepEqual(calls[3].args, [
      '--build', path.join(repoRoot, 'build/windows-native-28'), '--config', 'Release', '--clean-first',
    ]);
    assert.equal(calls[4].command, IDENTITY.ctest);
    assert.equal(calls[4].stdio, 'inherit');
    assert.deepEqual(calls[4].args, [
      '--test-dir', path.join(repoRoot, 'build/windows-native-28'), '-C', 'Release', '--output-on-failure',
    ]);
    assert.equal(calls.length, 5, 'prepare-only must not enter provenance or Tauri packaging');
    assert.equal(calls.some(call => call.env.CAVALRY_I18N_NATIVE_BUILD_PROFILE), false);
    assert.equal(fs.readFileSync(path.join(repoRoot, 'injector/windows/generic/cavalryi18n.dll'), 'utf8'), 'native-generic');
    assert.equal(fs.readFileSync(path.join(repoRoot, 'injector/windows/qpa/qwindows.dll'), 'utf8'), 'native-qpa');
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('default mode prepares before packaging; only the Tauri child receives production mode', () => {
  const repoRoot = makeRepo();
  const calls = [];
  const env = {
    PATH: 'toolchain-path',
    CAVALRY_NATIVE_ASSETS_ROOT: path.join(repoRoot, 'official', 'assets'),
    CAVALRY_QT_PREFIX: path.join(repoRoot, 'Qt', '6.9.2', 'msvc2022_64'),
    TAURI_SIGNING_PRIVATE_KEY: 'kept-secret',
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: 'kept-password',
    CAVALRY_I18N_NATIVE_BUILD_PROFILE: 'debug-parent-value',
    CAVALRY_I18N_EXPECT_UPDATER_SIGNATURE: '1',
  };
  try {
    runWindowsNativeBuild([], {
      repoRoot,
      platform: 'win32',
      env,
      spawnSync: fakeSpawn(repoRoot, calls),
    });

    const resourceCheck = calls.findIndex(call => call.args[0]?.endsWith('native_resource_bundle.js')
      && call.args.includes('--check'));
    const provenancePrepare = commandIndex(calls, 'windows_nsis_provenance.js', ['--prepare']);
    const tauri = calls.findIndex(call => call.args[0]?.endsWith('tauri.js'));
    const provenanceRecord = commandIndex(calls, 'windows_nsis_provenance.js', ['--record']);
    assert.ok(resourceCheck >= 0 && resourceCheck < provenancePrepare);
    assert.ok(provenancePrepare < tauri && tauri < provenanceRecord);
    assert.deepEqual(calls[tauri].args.slice(1), [
      'build', '--target', TARGET,
      ...WINDOWS_PRODUCTION_CONFIGS.flatMap(config => ['--config', config]),
    ]);
    assert.equal(calls[tauri].stdio, 'inherit', 'Tauri progress must stream to the CI log');
    assert.equal(calls[tauri].env.CAVALRY_I18N_NATIVE_BUILD_PROFILE, 'production-2.8');
    assert.equal(calls[tauri].env.CAVALRY_I18N_EXPECT_UPDATER_SIGNATURE, undefined);
    assert.equal(calls[tauri].env.TAURI_SIGNING_PRIVATE_KEY, env.TAURI_SIGNING_PRIVATE_KEY);
    assert.equal(calls[provenancePrepare].env.CAVALRY_I18N_NATIVE_BUILD_PROFILE, undefined);
    assert.equal(calls[provenancePrepare].env.CAVALRY_I18N_EXPECT_UPDATER_SIGNATURE, undefined);
    assert.deepEqual(env.CAVALRY_I18N_NATIVE_BUILD_PROFILE, 'debug-parent-value');
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('package-only updater preserves secrets and appends only updater-artifacts overlay', () => {
  const repoRoot = makeRepo();
  const calls = [];
  const env = {
    PATH: 'toolchain-path',
    TAURI_SIGNING_PRIVATE_KEY: 'private-key',
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: 'private-key-password',
  };
  try {
    runWindowsNativeBuild(['--package-only', '--updater'], {
      repoRoot,
      platform: 'win32',
      env,
      spawnSync: fakeSpawn(repoRoot, calls),
    });

    assert.equal(calls.some(call => call.args[0]?.endsWith('resolve_windows_cmake.js')), false);
    assert.equal(calls.some(call => call.args.includes('--build')), false);
    const provenancePrepare = commandIndex(calls, 'windows_nsis_provenance.js', ['--prepare']);
    const tauri = calls.find(call => call.args[0]?.endsWith('tauri.js'));
    assert.equal(provenancePrepare, 1, 'resource freshness check precedes provenance prepare');
    assert.ok(tauri);
    assert.deepEqual(tauri.args.slice(1), [
      'build', '--target', TARGET,
      ...WINDOWS_PRODUCTION_CONFIGS.flatMap(config => ['--config', config]),
      '--config', 'src-tauri/tauri.updater-artifacts.conf.json',
    ]);
    assert.equal(tauri.env.CAVALRY_I18N_NATIVE_BUILD_PROFILE, 'production-2.8');
    assert.equal(tauri.env.CAVALRY_I18N_EXPECT_UPDATER_SIGNATURE, '1');
    assert.equal(tauri.env.TAURI_SIGNING_PRIVATE_KEY, env.TAURI_SIGNING_PRIVATE_KEY);
    assert.equal(tauri.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD, env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD);
    assert.equal(calls[provenancePrepare].env.CAVALRY_I18N_EXPECT_UPDATER_SIGNATURE, '1');
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('failed CMake build stops before CTest and DLL publication', () => {
  const repoRoot = makeRepo();
  const calls = [];
  try {
    assert.throws(() => runWindowsNativeBuild(['--prepare-only'], {
      repoRoot,
      platform: 'win32',
      env: {
        CAVALRY_NATIVE_ASSETS_ROOT: path.join(repoRoot, 'official/assets'),
        CAVALRY_QT_PREFIX: path.join(repoRoot, 'Qt/6.9.2/msvc2022_64'),
      },
      spawnSync: fakeSpawn(repoRoot, calls, { failAt: 4 }),
    }), /CMake Release build failed/);
    assert.equal(calls.length, 4);
    assert.equal(fs.existsSync(path.join(repoRoot, 'injector/windows/generic/cavalryi18n.dll')), false);
    assert.equal(fs.existsSync(path.join(repoRoot, 'injector/windows/qpa/qwindows.dll')), false);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('package-only rejects an invalid CMake identity only when preparation requests it', () => {
  const repoRoot = makeRepo();
  const calls = [];
  try {
    assert.throws(() => runWindowsNativeBuild(['--prepare-only'], {
      repoRoot,
      platform: 'win32',
      env: {
        CAVALRY_NATIVE_ASSETS_ROOT: path.join(repoRoot, 'official/assets'),
        CAVALRY_QT_PREFIX: path.join(repoRoot, 'Qt/6.9.2/msvc2022_64'),
      },
      spawnSync(command, args, options) {
        calls.push({ command, args, options });
        if (args[0]?.endsWith('resolve_windows_cmake.js')) {
          return { status: 0, stdout: '{"executable":"cmake.exe"}\n', stderr: '' };
        }
        return { status: 0, stdout: '', stderr: '' };
      },
    }), /CMake resolver returned an invalid identity/);
    assert.equal(calls.length, 2);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('the wrapper refuses to run a Windows package on another host', () => {
  assert.throws(() => runWindowsNativeBuild([], {
    platform: 'darwin',
    env: {},
    repoRoot: process.cwd(),
    spawnSync() { throw new Error('must not spawn'); },
  }), /requires a Windows host/);
});
