#!/usr/bin/env node
/**
 * [INPUT]: 依赖官方2.8 assets、Qt6.9.2 SDK、固定CMake与Windows MSVC工具链。
 * [OUTPUT]: 准备native packs/DLL，或按固定overlay生成并记录x64 NSIS包。
 * [POS]: Windows 2.8唯一生产构建包装器；不改变开发环境或旧injector路径。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const WINDOWS_PRODUCTION_CONFIGS = Object.freeze([
  'src-tauri/tauri.windows.conf.json',
  'src-tauri/tauri.native-production-2.8.conf.json',
  'src-tauri/tauri.native-windows-2.8.conf.json',
  'src-tauri/tauri.release-2.8.conf.json',
]);

const TARGET_TRIPLE = 'x86_64-pc-windows-msvc';
const NATIVE_PROFILE = 'production-2.8';
const NATIVE_BUILD_DIRECTORY = path.join('build', 'windows-native-28');
const NATIVE_RESOURCE_BUNDLE = path.join('tools', 'native_resource_bundle.js');
const WINDOWS_CMAKE_RESOLVER = path.join('tools', 'resolve_windows_cmake.js');
const WINDOWS_NSIS_PROVENANCE = path.join('tools', 'windows_nsis_provenance.js');
const TAURI_CLI = path.join('node_modules', '@tauri-apps', 'cli', 'tauri.js');
const UPDATER_ARTIFACTS_CONFIG = 'src-tauri/tauri.updater-artifacts.conf.json';
const NATIVE_BUILD_PROFILE_ENV = 'CAVALRY_I18N_NATIVE_BUILD_PROFILE';
const UPDATER_SIGNATURE_ENV = 'CAVALRY_I18N_EXPECT_UPDATER_SIGNATURE';

function fail(message) {
  throw new Error(`Windows native build: ${message}`);
}

function parseArgs(argv) {
  let stage = null;
  let updater = false;
  for (const argument of argv) {
    if (argument === '--prepare-only' || argument === '--package-only') {
      if (stage !== null) fail('only one stage option may be supplied.');
      stage = argument;
    } else if (argument === '--updater') {
      if (updater) fail('--updater may be supplied only once.');
      updater = true;
    } else {
      fail(`unknown option: ${argument}`);
    }
  }

  const options = {
    prepare: stage !== '--package-only',
    package: stage !== '--prepare-only',
    updater,
  };
  if (updater && !options.package) fail('--updater cannot combine with --prepare-only.');
  return options;
}

function childEnvironment(parentEnvironment, { production = false, updater = false } = {}) {
  const environment = { ...parentEnvironment };
  delete environment[NATIVE_BUILD_PROFILE_ENV];
  delete environment[UPDATER_SIGNATURE_ENV];
  if (production) environment[NATIVE_BUILD_PROFILE_ENV] = NATIVE_PROFILE;
  if (updater) environment[UPDATER_SIGNATURE_ENV] = '1';
  return environment;
}

function runProcess(spawn, command, args, { cwd, env, label, captureOutput = false }) {
  const result = spawn(command, args, {
    cwd,
    env,
    windowsHide: true,
    ...(captureOutput ? { encoding: 'utf8' } : { stdio: 'inherit' }),
  });
  if (result.error) fail(`${label} could not start: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    fail(`${label} failed${result.status === null ? ' after a signal' : ` with exit ${result.status}`}${detail ? `: ${detail}` : '.'}`);
  }
  return result;
}

function runNodeScript(context, relativeScript, args, env, label, captureOutput = false) {
  const scriptPath = path.join(context.repoRoot, relativeScript);
  return runProcess(
    context.spawn,
    context.nodeExecutable,
    [scriptPath, ...args],
    { cwd: context.repoRoot, env, label, captureOutput },
  );
}

function parseCmakeIdentity(stdout) {
  let identity;
  try {
    identity = JSON.parse(stdout);
  } catch (error) {
    fail(`CMake resolver returned invalid JSON: ${error.message}`);
  }
  if (!identity || typeof identity !== 'object'
      || typeof identity.executable !== 'string' || !identity.executable
      || typeof identity.ctest !== 'string' || !identity.ctest) {
    fail('CMake resolver returned an invalid identity.');
  }
  return identity;
}

function requireInputEnvironment(parentEnvironment) {
  const assetsRoot = parentEnvironment.CAVALRY_NATIVE_ASSETS_ROOT;
  const qtPrefix = parentEnvironment.CAVALRY_QT_PREFIX;
  if (typeof assetsRoot !== 'string' || !assetsRoot.trim()) {
    fail('CAVALRY_NATIVE_ASSETS_ROOT must point to the approved Cavalry 2.8 assets root.');
  }
  if (typeof qtPrefix !== 'string' || !qtPrefix.trim()) {
    fail('CAVALRY_QT_PREFIX must point to the selected Qt 6.9.2 msvc2022_64 SDK.');
  }
  return { assetsRoot: path.resolve(assetsRoot), qtPrefix: path.resolve(qtPrefix) };
}

function prepareNativeInputs(context) {
  const { assetsRoot, qtPrefix } = requireInputEnvironment(context.parentEnvironment);
  const preparationEnvironment = childEnvironment(context.parentEnvironment);

  runNodeScript(
    context,
    NATIVE_RESOURCE_BUNDLE,
    ['--assets-root', assetsRoot, '--profile', NATIVE_PROFILE],
    preparationEnvironment,
    'production native resource generation',
  );

  const resolver = runNodeScript(
    context,
    WINDOWS_CMAKE_RESOLVER,
    ['--ensure', '--print-json', '--platform', 'windows'],
    preparationEnvironment,
    'pinned Windows CMake resolution',
    true,
  );
  const cmake = parseCmakeIdentity(resolver.stdout || '');
  const buildDirectory = path.join(context.repoRoot, NATIVE_BUILD_DIRECTORY);
  const nativeSourceDirectory = path.join(context.repoRoot, 'injector', 'windows', 'native');
  const metadataDirectory = path.join(assetsRoot, 'MetaData');

  runProcess(
    context.spawn,
    cmake.executable,
    [
      '-S', nativeSourceDirectory,
      '-B', buildDirectory,
      '-G', 'Visual Studio 17 2022',
      '-A', 'x64',
      '-T', 'v143',
      `-DCMAKE_PREFIX_PATH=${qtPrefix}`,
      `-DCAVALRY_NATIVE_METADATA_DIR=${metadataDirectory}`,
    ],
    { cwd: context.repoRoot, env: preparationEnvironment, label: 'MSVC 2022 x64 CMake configure' },
  );
  runProcess(
    context.spawn,
    cmake.executable,
    ['--build', buildDirectory, '--config', 'Release', '--clean-first'],
    { cwd: context.repoRoot, env: preparationEnvironment, label: 'CMake Release build' },
  );
  runProcess(
    context.spawn,
    cmake.ctest,
    ['--test-dir', buildDirectory, '-C', 'Release', '--output-on-failure'],
    { cwd: context.repoRoot, env: preparationEnvironment, label: 'native Windows CTest suite' },
  );

  const outputs = [
    [path.join(buildDirectory, 'generic', 'cavalryi18n.dll'),
      path.join(context.repoRoot, 'injector', 'windows', 'generic', 'cavalryi18n.dll')],
    [path.join(buildDirectory, 'qpa', 'qwindows.dll'),
      path.join(context.repoRoot, 'injector', 'windows', 'qpa', 'qwindows.dll')],
  ];
  for (const [source, destination] of outputs) {
    try {
      context.fs.mkdirSync(path.dirname(destination), { recursive: true });
      context.fs.copyFileSync(source, destination);
    } catch (error) {
      fail(`could not publish the tested native DLL ${path.basename(source)}: ${error.message}`);
    }
  }
}

function packageNativeBuild(context, updater) {
  const ordinaryEnvironment = childEnvironment(context.parentEnvironment, { updater });
  const productionEnvironment = childEnvironment(context.parentEnvironment, { production: true, updater });

  runNodeScript(
    context,
    NATIVE_RESOURCE_BUNDLE,
    ['--check', '--profile', NATIVE_PROFILE],
    ordinaryEnvironment,
    'production native resource freshness check',
  );
  runNodeScript(
    context,
    WINDOWS_NSIS_PROVENANCE,
    ['--prepare'],
    ordinaryEnvironment,
    'Windows NSIS provenance prepare',
  );

  const tauriArguments = [
    'build', '--target', TARGET_TRIPLE,
    ...WINDOWS_PRODUCTION_CONFIGS.flatMap(config => ['--config', config]),
  ];
  if (updater) tauriArguments.push('--config', UPDATER_ARTIFACTS_CONFIG);
  runNodeScript(context, TAURI_CLI, tauriArguments, productionEnvironment, 'Tauri Windows Release package');

  runNodeScript(
    context,
    WINDOWS_NSIS_PROVENANCE,
    ['--record'],
    ordinaryEnvironment,
    'Windows NSIS provenance record',
  );
}

function runWindowsNativeBuild(argv = process.argv.slice(2), dependencies = {}) {
  const options = parseArgs(argv);
  const platform = dependencies.platform || process.platform;
  if (platform !== 'win32') fail('production packaging requires a Windows host.');

  const context = {
    repoRoot: path.resolve(dependencies.repoRoot || path.join(__dirname, '..')),
    fs: dependencies.fs || fs,
    spawn: dependencies.spawnSync || spawnSync,
    nodeExecutable: dependencies.nodeExecutable || process.execPath,
    parentEnvironment: dependencies.env || process.env,
  };
  if (options.prepare) prepareNativeInputs(context);
  if (options.package) packageNativeBuild(context, options.updater);
  return options;
}

if (require.main === module) {
  try {
    runWindowsNativeBuild();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  WINDOWS_PRODUCTION_CONFIGS,
  parseArgs,
  runWindowsNativeBuild,
};
