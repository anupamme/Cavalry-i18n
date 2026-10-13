#!/usr/bin/env node
/**
 * [INPUT]: 依赖所选 release profile、release-asset-provenance.json、CycloneDX SBOM、toolchain evidence 与分发资产
 * [OUTPUT]: 校验 profile tag、供应链 sidecar、分发字节及 updater manifest；双feed时逐字节锁定 p12 legacy manifest
 * [POS]: GitHub Release 上传前的最终本地 provenance 守门器；默认 2.7 检查保持不变
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadConfig, metadataForTag } = require('./release_metadata');
const { verifyManifestClosure } = require('./create_updater_manifest');
const { assertLegacyManifest } = require('./create_legacy_updater_manifest');

const args = process.argv.slice(2);
function fail(message) { throw new Error(message); }
function optionValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail(`${name} requires a value.`);
  return value;
}
function repeated(name) {
  const result = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) fail(`${name} requires a value.`);
    result.push(value);
  }
  return result;
}
function info(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 1) fail(`Invalid regular file: ${file}`);
  return {
    name: path.basename(file),
    bytes: stat.size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  };
}
function same(left, right) {
  return left && right && left.name === right.name && left.bytes === right.bytes && left.sha256 === right.sha256;
}
function exactKeys(value, keys, label) {
  const actual = value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value).sort()
    : [];
  if (JSON.stringify(actual) !== JSON.stringify([...keys].sort())) {
    fail(`${label} has missing or unexpected fields.`);
  }
}

function expectedAssetNames(metadata) {
  return [
    metadata.RELEASE_ASSET_NAME_AARCH64,
    metadata.RELEASE_ASSET_NAME_X64,
    metadata.RELEASE_ASSET_NAME_WINDOWS_X64,
    metadata.RELEASE_UPDATER_MANIFEST_NAME,
    metadata.RELEASE_UPDATER_ASSET_NAME_AARCH64,
    metadata.RELEASE_UPDATER_SIGNATURE_NAME_AARCH64,
    metadata.RELEASE_UPDATER_ASSET_NAME_X64,
    metadata.RELEASE_UPDATER_SIGNATURE_NAME_X64,
    metadata.RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64,
    ...(metadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME
      ? [metadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME]
      : []),
  ];
}

function main() {
  if (args.includes('--check-schema')) {
    const schema = JSON.parse(fs.readFileSync(
      path.join(process.cwd(), 'tools/schemas/release_asset_provenance.schema.json'),
      'utf8'
    ));
    if (schema.title !== 'ReleaseAssetProvenance' || schema.properties?.schemaVersion?.const !== 5) {
      fail('ReleaseAssetProvenance schema v5 is required.');
    }
    console.log('[verify-release-provenance] OK: schema v5 present');
    return;
  }

  const dist = path.resolve(optionValue('--dist') || 'dist');
  const provenanceFile = path.join(dist, 'release-asset-provenance.json');
  const sbomFile = path.join(dist, 'CycloneDX.json');
  const toolchainFile = path.join(dist, 'toolchain-evidence.json');
  const provenance = JSON.parse(fs.readFileSync(provenanceFile, 'utf8'));

  exactKeys(
    provenance,
    ['schemaVersion', 'kind', 'tag', 'releaseCommitSha', 'createdAtUtc', 'assets', 'supplyChain', 'signing'],
    'Provenance'
  );
  const profilePath = optionValue('--profile');
  const releaseConfig = loadConfig(profilePath);
  if (
    provenance.schemaVersion !== 5 ||
    provenance.kind !== 'ReleaseAssetProvenance' ||
    !/^[a-f0-9]{40}$/.test(provenance.releaseCommitSha) ||
    !Number.isFinite(Date.parse(provenance.createdAtUtc))
  ) {
    fail('Provenance identity fields are invalid.');
  }
  let metadata;
  try { metadata = metadataForTag(releaseConfig, provenance.tag); } catch (error) { fail(error.message); }

  exactKeys(provenance.signing, ['macos', 'windows', 'updater'], 'Provenance signing');
  if (
    provenance.signing.macos !== 'ad-hoc' ||
    provenance.signing.windows !== 'unsigned' ||
    provenance.signing.updater !== 'ed25519'
  ) {
    fail('Provenance signing declaration is invalid.');
  }
  exactKeys(provenance.supplyChain, ['sbom', 'toolchainEvidence'], 'Provenance supplyChain');
  if (
    !same(provenance.supplyChain.sbom, info(sbomFile)) ||
    !same(provenance.supplyChain.toolchainEvidence, info(toolchainFile))
  ) {
    fail('Provenance supply-chain identities mismatch.');
  }

  const sbom = JSON.parse(fs.readFileSync(sbomFile, 'utf8'));
  const sbomCommit = sbom.metadata?.component?.properties
    ?.find((entry) => entry?.name === 'cavalry-i18n:release-commit')?.value;
  if (
    sbom.bomFormat !== 'CycloneDX' ||
    sbom.specVersion !== '1.5' ||
    sbomCommit !== provenance.releaseCommitSha ||
    !Array.isArray(sbom.components) ||
    sbom.components.length < 1
  ) {
    fail('SBOM does not semantically bind the release commit or has no components.');
  }
  const toolchain = JSON.parse(fs.readFileSync(toolchainFile, 'utf8'));
  if (
    toolchain.schemaVersion !== 1 ||
    toolchain.kind !== 'ReleaseToolchainEvidence' ||
    toolchain.releaseCommitSha !== provenance.releaseCommitSha
  ) {
    fail('Toolchain evidence does not semantically bind the release commit.');
  }

  const expectedNames = expectedAssetNames(metadata);
  if (!Array.isArray(provenance.assets) || provenance.assets.length !== expectedNames.length) {
    fail(`Provenance must bind exactly ${expectedNames.length} distribution assets.`);
  }
  const assets = new Map();
  for (const asset of provenance.assets) {
    if (!asset || typeof asset.name !== 'string' || path.basename(asset.name) !== asset.name || assets.has(asset.name)) {
      fail('Provenance contains an invalid or duplicate distribution asset.');
    }
    if (!same(asset, info(path.join(dist, asset.name)))) {
      fail(`Provenance distribution asset mismatch: ${asset.name}`);
    }
    assets.set(asset.name, asset);
  }
  if (expectedNames.some((name) => !assets.has(name))) {
    fail('Provenance distribution asset set does not match release metadata.');
  }

  verifyManifestClosure({
    manifestPath: path.join(dist, metadata.RELEASE_UPDATER_MANIFEST_NAME),
    metadata,
    artifacts: {
      'darwin-aarch64': path.join(dist, metadata.RELEASE_UPDATER_ASSET_NAME_AARCH64),
      'darwin-x86_64': path.join(dist, metadata.RELEASE_UPDATER_ASSET_NAME_X64),
      'windows-x86_64': path.join(dist, metadata.RELEASE_ASSET_NAME_WINDOWS_X64),
    },
    signatures: {
      'darwin-aarch64': path.join(dist, metadata.RELEASE_UPDATER_SIGNATURE_NAME_AARCH64),
      'darwin-x86_64': path.join(dist, metadata.RELEASE_UPDATER_SIGNATURE_NAME_X64),
      'windows-x86_64': path.join(dist, metadata.RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64),
    },
  });

  if (metadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME) {
    try {
      assertLegacyManifest(fs.readFileSync(path.join(dist, metadata.RELEASE_UPDATER_LEGACY_MANIFEST_NAME)));
    } catch (error) {
      fail(`Frozen legacy updater feed is invalid: ${error.message}`);
    }
  }

  const requested = repeated('--primary');
  if (requested.length) {
    const requestedSet = new Set(requested);
    if (requestedSet.size !== expectedNames.length || expectedNames.some((name) => !requestedSet.has(name))) {
      fail('Provenance primary asset set does not match required assets.');
    }
  }
  console.log(
    `[verify-release-provenance] OK: ${provenance.tag} binds SBOM, toolchain and ${expectedNames.length} distribution assets`
  );
}

try {
  main();
} catch (error) {
  console.error(`[verify-release-provenance] ${error.message}`);
  process.exit(1);
}
