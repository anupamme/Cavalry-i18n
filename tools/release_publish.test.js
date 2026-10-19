#!/usr/bin/env node
/**
 * [INPUT]: release_publish.js、临时人工安装/updater dist/remote 资产、显式 release profile 与 test-only fake gh script
 * [OUTPUT]: 覆盖默认p12七项回读、阻断p13、2.8双feed/p12字节锁、private draft恢复与provenance失败关闭
 * [POS]: 幂等 GitHub Release draft-to-public 边界的离线对抗测试；绝不解析 PATH 或触碰真实 gh
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadConfig, metadataForTag } = require('./release_metadata');
const { assertLegacyManifest } = require('./create_legacy_updater_manifest');

const repoRoot = path.resolve(__dirname, '..');
const tag = 'cavalry-2.7.2-p12';
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim();
const createdAtUtc = spawnSync('git', ['show', '-s', '--format=%cI', commit], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim();
const title = 'Cavalry Language Switcher for Cavalry 2.7.2 (Patch 12)';

function fixture({
  profilePath = null,
  releaseTag = tag,
  releaseTitle = title,
  profileMetadata = null,
} = {}) {
  profileMetadata = profileMetadata || metadataForTag(loadConfig(profilePath), releaseTag);
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cavalry-release-publish-')));
  const dist = path.join(root, 'dist');
  const remote = path.join(root, 'remote');
  const profileManualAssets = [
    profileMetadata.RELEASE_ASSET_NAME_AARCH64,
    profileMetadata.RELEASE_ASSET_NAME_X64,
    profileMetadata.RELEASE_ASSET_NAME_WINDOWS_X64,
  ];
  const profileDistribution = [
    ...profileManualAssets,
    profileMetadata.RELEASE_UPDATER_MANIFEST_NAME,
    ...(profileMetadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME
      ? [profileMetadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME]
      : []),
    profileMetadata.RELEASE_UPDATER_ASSET_NAME_AARCH64,
    profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_AARCH64,
    profileMetadata.RELEASE_UPDATER_ASSET_NAME_X64,
    profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_X64,
    profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64,
  ];
  const profilePublicAssets = [
    ...profileManualAssets,
    profileMetadata.RELEASE_UPDATER_MANIFEST_NAME,
    ...(profileMetadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME
      ? [profileMetadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME]
      : []),
    profileMetadata.RELEASE_UPDATER_ASSET_NAME_AARCH64,
    profileMetadata.RELEASE_UPDATER_ASSET_NAME_X64,
    'SHA256SUMS',
  ];
  fs.mkdirSync(dist);
  fs.mkdirSync(remote);
  profileManualAssets.forEach((name, index) => fs.writeFileSync(path.join(dist, name), `manual-${index}\n`));
  fs.writeFileSync(path.join(dist, profileMetadata.RELEASE_UPDATER_ASSET_NAME_AARCH64), 'updater-arm\n');
  fs.writeFileSync(path.join(dist, profileMetadata.RELEASE_UPDATER_ASSET_NAME_X64), 'updater-intel\n');
  for (const [name, value] of [
    [profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_AARCH64, 'signature-arm'],
    [profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_X64, 'signature-intel'],
    [profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64, 'signature-windows'],
  ]) {
    fs.writeFileSync(path.join(dist, name), `${Buffer.from(value).toString('base64')}\n`);
  }
  if (profileMetadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME) {
    const legacyResult = spawnSync(process.execPath, [
      path.join(repoRoot, 'tools/create_legacy_updater_manifest.js'),
      '--output', path.join(dist, profileMetadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME),
    ], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(legacyResult.status, 0, legacyResult.stderr || legacyResult.stdout);
  }
  const updaterNotes = path.join(root, 'updater-notes.md');
  fs.writeFileSync(updaterNotes, 'Updater release fixture\n');
  const manifestResult = spawnSync(process.execPath, [
    path.join(repoRoot, 'tools/create_updater_manifest.js'),
    ...(profilePath ? ['--profile', profilePath] : []),
    '--tag', releaseTag,
    '--output', path.join(dist, profileMetadata.RELEASE_UPDATER_MANIFEST_NAME),
    '--notes', updaterNotes,
    '--pub-date', createdAtUtc,
    '--darwin-aarch64', path.join(dist, profileMetadata.RELEASE_UPDATER_ASSET_NAME_AARCH64),
    '--darwin-aarch64-signature', path.join(dist, profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_AARCH64),
    '--darwin-x86_64', path.join(dist, profileMetadata.RELEASE_UPDATER_ASSET_NAME_X64),
    '--darwin-x86_64-signature', path.join(dist, profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_X64),
    '--windows-x86_64', path.join(dist, profileMetadata.RELEASE_ASSET_NAME_WINDOWS_X64),
    '--windows-x86_64-signature', path.join(dist, profileMetadata.RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64),
  ], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(manifestResult.status, 0, manifestResult.stderr || manifestResult.stdout);
  fs.writeFileSync(path.join(dist, 'toolchain-evidence.json'), `${JSON.stringify({
    schemaVersion: 1,
    kind: 'ReleaseToolchainEvidence',
    releaseCommitSha: commit,
    createdAtUtc,
    records: [],
    uncoveredArtifacts: [],
  })}\n`);
  fs.writeFileSync(path.join(dist, 'CycloneDX.json'), `${JSON.stringify({
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    metadata: { component: { properties: [{ name: 'cavalry-i18n:release-commit', value: commit }] } },
    components: [{ name: 'fixture', version: '1.0.0', purl: 'pkg:npm/fixture@1.0.0' }],
  })}\n`);
  const notes = path.join(root, 'notes.md');
  fs.writeFileSync(notes, 'release notes\n');
  const log = path.join(root, 'gh.log');
  const remoteState = path.join(root, 'release-state.json');
  const fakeGh = path.join(root, 'fake-gh.js');
  fs.writeFileSync(fakeGh, `
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(args) + '\\n');
const mode = process.env.FAKE_GH_MODE;
const statePath = process.env.FAKE_GH_STATE;
const readState = () => fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
const writeState = (value) => fs.writeFileSync(statePath, JSON.stringify(value));
if (args[0] === 'release' && args[1] === 'view') {
  if (mode === 'unauthorized') { process.stderr.write('HTTP 401 Unauthorized'); process.exit(1); }
  const state = readState();
  if (state) {
    const names = fs.readdirSync(process.env.FAKE_GH_REMOTE).sort();
    if (mode === 'extra') names.push('unexpected.bin');
    process.stdout.write(JSON.stringify({
      assets: names.map((name) => ({name})), isDraft: state.isDraft, isPrerelease: false,
      name: process.env.FAKE_GH_TITLE, tagName: process.env.FAKE_GH_TAG,
      targetCommitish: 'main', body: fs.readFileSync(process.env.FAKE_GH_NOTES, 'utf8'),
    }));
    process.exit(0);
  }
  process.stderr.write('release not found');
  process.exit(1);
}
if (args[0] === 'api') {
  process.stderr.write(mode === 'unauthorized' ? 'HTTP/2.0 401 Unauthorized' : 'HTTP/2.0 404 Not Found');
  process.exit(1);
}
if (args[0] === 'release' && args[1] === 'download') {
  const name = args[args.indexOf('--pattern') + 1];
  const dir = args[args.indexOf('--dir') + 1];
  fs.copyFileSync(path.join(process.env.FAKE_GH_REMOTE, name), path.join(dir, name));
  process.exit(0);
}
if (args[0] === 'release' && args[1] === 'create') {
  if (!args.includes('--draft') || readState()) process.exit(3);
  writeState({isDraft: true});
  process.exit(0);
}
if (args[0] === 'release' && args[1] === 'upload') {
  if (mode === 'upload-fails') { process.stderr.write('simulated upload interruption'); process.exit(4); }
  for (const file of args.slice(3)) fs.copyFileSync(file, path.join(process.env.FAKE_GH_REMOTE, path.basename(file)));
  process.exit(0);
}
if (args[0] === 'release' && args[1] === 'edit') {
  const state = readState();
  if (!state || !args.includes('--draft=false')) process.exit(5);
  writeState({isDraft:false});
  process.exit(0);
}
process.stderr.write('unexpected fake gh invocation: ' + args.join(' '));
process.exit(2);
`);
  return {
    root,
    dist,
    remote,
    notes,
    log,
    remoteState,
    fakeGh,
    profilePath,
    tag: releaseTag,
    title: releaseTitle,
    metadata: profileMetadata,
    manualAssets: profileManualAssets,
    distribution: profileDistribution,
    publicAssets: profilePublicAssets,
  };
}

function fixture28() {
  const profilePath = path.join(repoRoot, 'release-2.8.config.json');
  const releaseTag = 'cavalry-2.8.0-p999';
  const profileMetadata = metadataForTag(loadConfig(profilePath), releaseTag);
  return fixture({ profilePath, releaseTag, releaseTitle: profileMetadata.RELEASE_TITLE, profileMetadata });
}

function run(f, mode, releaseCommit = commit) {
  return spawnSync(process.execPath, [
    path.join(repoRoot, 'tools/release_publish.js'),
    ...(f.profilePath ? ['--profile', f.profilePath] : []),
    '--tag', f.tag,
    '--release-commit', releaseCommit, '--dist', f.dist, '--notes', f.notes, '--title', f.title,
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      CAVALRY_I18N_TEST_GH_SCRIPT: f.fakeGh,
      CAVALRY_I18N_TEST_TAG_COMMIT_SHA: commit,
      RELEASE_ASSET_NAME_AARCH64: f.metadata.RELEASE_ASSET_NAME_AARCH64,
      RELEASE_ASSET_NAME_X64: f.metadata.RELEASE_ASSET_NAME_X64,
      RELEASE_ASSET_NAME_WINDOWS_X64: f.metadata.RELEASE_ASSET_NAME_WINDOWS_X64,
      RELEASE_UPDATER_MANIFEST_NAME: f.metadata.RELEASE_UPDATER_MANIFEST_NAME,
      RELEASE_UPDATER_LEGACY_MANIFEST_NAME: f.metadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME,
      RELEASE_UPDATER_DOWNLOAD_BASE_URL: f.metadata.RELEASE_UPDATER_DOWNLOAD_BASE_URL,
      RELEASE_UPDATER_ASSET_DOWNLOAD_BASE_URL: f.metadata.RELEASE_UPDATER_ASSET_DOWNLOAD_BASE_URL,
      RELEASE_UPDATER_ASSET_NAME_AARCH64: f.metadata.RELEASE_UPDATER_ASSET_NAME_AARCH64,
      RELEASE_UPDATER_SIGNATURE_NAME_AARCH64: f.metadata.RELEASE_UPDATER_SIGNATURE_NAME_AARCH64,
      RELEASE_UPDATER_ASSET_NAME_X64: f.metadata.RELEASE_UPDATER_ASSET_NAME_X64,
      RELEASE_UPDATER_SIGNATURE_NAME_X64: f.metadata.RELEASE_UPDATER_SIGNATURE_NAME_X64,
      RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64: f.metadata.RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64,
      FAKE_GH_MODE: mode,
      FAKE_GH_REMOTE: f.remote,
      FAKE_GH_STATE: f.remoteState,
      FAKE_GH_LOG: f.log,
      FAKE_GH_TITLE: f.title,
      FAKE_GH_TAG: f.tag,
      FAKE_GH_NOTES: f.notes,
    },
  });
}

function verifyProvenance(f) {
  return spawnSync(process.execPath, [
    path.join(repoRoot, 'tools/verify_release_provenance.js'), '--dist', f.dist,
    ...(f.profilePath ? ['--profile', f.profilePath] : []),
    ...f.distribution.flatMap((name) => ['--primary', name]),
  ], { cwd: repoRoot, encoding: 'utf8' });
}

test('frozen p12 refuses creation and permits exact public readback only', () => {
  const f = fixture();
  try {
    const missing = run(f, 'missing');
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /Frozen p12 release is missing/);
    const absentCalls = fs.readFileSync(f.log, 'utf8');
    assert.doesNotMatch(absentCalls, /"create"|"upload"|"edit"/);

    fs.writeFileSync(f.remoteState, JSON.stringify({ isDraft: true }));
    const draft = run(f, 'existing');
    assert.notEqual(draft.status, 0);
    assert.match(draft.stderr, /metadata .*conflicts with the requested release/);
    const draftCalls = fs.readFileSync(f.log, 'utf8');
    assert.doesNotMatch(draftCalls, /"create"|"upload"|"edit"/);

    for (const name of f.publicAssets) {
      fs.copyFileSync(path.join(f.dist, name), path.join(f.remote, name));
    }
    fs.writeFileSync(f.remoteState, JSON.stringify({ isDraft: false }));

    const repeated = run(f, 'existing');
    assert.equal(repeated.status, 0, repeated.stderr || repeated.stdout);
    assert.match(repeated.stdout, /no remote mutation performed/);
    assert.deepEqual(fs.readdirSync(f.remote).sort(), [...f.publicAssets].sort());
    const calls = fs.readFileSync(f.log, 'utf8');
    assert.match(calls, /"download"/);
    assert.doesNotMatch(calls, /"create"|"upload"|"edit"/);

    const provenancePath = path.join(f.dist, 'release-asset-provenance.json');
    const originalProvenance = fs.readFileSync(provenancePath);
    const provenance = JSON.parse(originalProvenance.toString('utf8'));
    provenance.releaseCommitSha = 'b'.repeat(40);
    fs.writeFileSync(provenancePath, `${JSON.stringify(provenance)}\n`);
    const mismatchedCommit = verifyProvenance(f);
    assert.notEqual(mismatchedCommit.status, 0);
    assert.match(mismatchedCommit.stderr, /SBOM does not semantically bind the release commit/);
    fs.writeFileSync(provenancePath, originalProvenance);

    const primaryPath = path.join(f.dist, f.manualAssets[0]);
    const primaryBytes = fs.readFileSync(primaryPath);
    fs.writeFileSync(primaryPath, 'post-seal tamper\n');
    const primaryTamper = run(f, 'existing');
    assert.notEqual(primaryTamper.status, 0);
    assert.match(primaryTamper.stderr, /conflicts with local bytes/);
    fs.writeFileSync(primaryPath, primaryBytes);
    fs.writeFileSync(path.join(f.remote, 'SHA256SUMS'), 'tampered\n');
    const tampered = run(f, 'existing');
    assert.notEqual(tampered.status, 0);
    assert.match(tampered.stderr, /conflicts with local bytes/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test('explicit 2.8 profile seals frozen p12 latest.json beside a separate tag-pinned feed', () => {
  const profileRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cavalry-release-profile-')));
  const profilePath = path.join(profileRoot, 'synthetic-release-profile.json');
  const profile = JSON.parse(fs.readFileSync(path.join(repoRoot, 'release-2.8.config.json'), 'utf8'));
  profile.releaseTitleTemplate = 'Synthetic updater release ${patch}';
  profile.assetNameTemplates = {
    aarch64: 'synthetic-arm-${patch}.dmg',
    x64: 'synthetic-intel-${patch}.dmg',
    windowsX64: 'synthetic-windows-${patch}.exe',
  };
  profile.updater.manifestAssetName = 'latest-synthetic-2.8.json';
  profile.updater.downloadBaseUrl = 'https://example.invalid/releases/latest/download';
  profile.updater.assetDownloadBaseUrlTemplate = 'https://example.invalid/releases/download/${tag}';
  profile.updater.macOSAssetNameTemplates = {
    aarch64: 'synthetic-arm-${patch}.app.tar.gz',
    x64: 'synthetic-intel-${patch}.app.tar.gz',
  };
  fs.writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`);

  const testTag = 'cavalry-2.8.0-p17';
  const testMetadata = metadataForTag(loadConfig(profilePath), testTag);
  const f = fixture({
    profilePath,
    releaseTag: testTag,
    releaseTitle: 'Synthetic updater release 17',
    profileMetadata: testMetadata,
  });
  try {
    assert.equal(f.distribution.length, 10);
    assert.equal(f.publicAssets.length, 8);
    const published = run(f, 'missing');
    assert.equal(published.status, 0, published.stderr || published.stdout);
    assert.deepEqual(fs.readdirSync(f.remote).sort(), [...f.publicAssets].sort());
    assertLegacyManifest(fs.readFileSync(path.join(f.remote, 'latest.json')));
    assert.deepEqual(
      fs.readFileSync(path.join(f.remote, 'latest.json')),
      fs.readFileSync(path.join(f.dist, 'latest.json'))
    );
    assert.equal(verifyProvenance(f).status, 0);

    const ghLog = fs.readFileSync(f.log, 'utf8');
    fs.writeFileSync(path.join(f.dist, 'latest.json'), 'mutable legacy feed\n');
    const tamperedLegacy = run(f, 'existing');
    assert.notEqual(tamperedLegacy.status, 0);
    assert.match(tamperedLegacy.stderr, /Frozen legacy updater feed is invalid/);
    assert.equal(fs.readFileSync(f.log, 'utf8'), ghLog, 'invalid legacy bytes must stop before remote access');
  } finally {
    fs.rmSync(f.root, { recursive: true, force: true });
    fs.rmSync(profileRoot, { recursive: true, force: true });
  }
});

test('default 2.7 publisher refuses any release tag after frozen p12', () => {
  const f = fixture({ releaseTag: 'cavalry-2.7.2-p13' });
  try {
    const refused = run(f, 'missing');
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /default 2\.7 updater feed is frozen at cavalry-2\.7\.2-p12/);
    assert.equal(fs.existsSync(f.log), false, 'frozen feed policy must stop before GitHub access');
  } finally {
    fs.rmSync(f.root, { recursive: true, force: true });
  }
});

test('upload interruption stays private and the next run safely completes the draft', () => {
  const f = fixture28();
  try {
    const interrupted = run(f, 'upload-fails');
    assert.notEqual(interrupted.status, 0);
    assert.match(interrupted.stderr, /simulated upload interruption/);
    assert.equal(JSON.parse(fs.readFileSync(f.remoteState, 'utf8')).isDraft, true);
    assert.doesNotMatch(fs.readFileSync(f.log, 'utf8'), /"edit"/);
    const recovered = run(f, 'existing');
    assert.equal(recovered.status, 0, recovered.stderr || recovered.stdout);
    assert.equal(JSON.parse(fs.readFileSync(f.remoteState, 'utf8')).isDraft, false);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test('remote auth failure, unexpected assets, public missing assets, and tag mismatch fail closed', () => {
  const unauthorized = fixture28();
  try {
    const result = run(unauthorized, 'unauthorized');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /refusing to treat the error as absence/);
    assert.doesNotMatch(fs.readFileSync(unauthorized.log, 'utf8'), /"create"/);
  } finally { fs.rmSync(unauthorized.root, { recursive: true, force: true }); }

  const extra = fixture28();
  try {
    assert.equal(run(extra, 'missing').status, 0);
    const result = run(extra, 'extra');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unexpected assets/);
  } finally { fs.rmSync(extra.root, { recursive: true, force: true }); }

  const incomplete = fixture28();
  try {
    assert.equal(run(incomplete, 'missing').status, 0);
    fs.unlinkSync(path.join(incomplete.remote, incomplete.metadata.RELEASE_UPDATER_MANIFEST_NAME));
    const result = run(incomplete, 'existing');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /public release is incomplete/);
    assert.doesNotMatch(result.stdout, /upload/);
  } finally { fs.rmSync(incomplete.root, { recursive: true, force: true }); }

  const mismatch = fixture28();
  try {
    const result = run(mismatch, 'missing', 'b'.repeat(40));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Tag .* resolves to/);
    assert.equal(fs.existsSync(mismatch.log), false);
  } finally { fs.rmSync(mismatch.root, { recursive: true, force: true }); }
});
