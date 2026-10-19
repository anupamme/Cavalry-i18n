#!/usr/bin/env node
/**
 * [INPUT]: 依赖默认 release.config.json 或显式 release profile、package.json 与 GitHub tag 环境变量
 * [OUTPUT]: 对外提供 profile-aware tag/资产元数据与 GitHub Actions 环境变量写入能力；默认 profile 保持 2.7 协议
 * [POS]: tools 的发布协议守门器；显式 profile 扩展发行，不改变默认 2.7 配置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const args = process.argv.slice(2);
const DEFAULT_PROFILE = 'release.config.json';
const RELEASE_ASSET_TEMPLATE_KEYS = Object.freeze(['aarch64', 'windowsX64', 'x64']);
const UPDATER_MACOS_ASSET_TEMPLATE_KEYS = Object.freeze(['aarch64', 'x64']);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Release profile ${field} must be a non-empty string.`);
  }
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

function loadConfig(profilePath = null) {
  const selectedPath = profilePath || optionValue('--profile') || DEFAULT_PROFILE;
  const resolvedProfilePath = path.resolve(rootDir, selectedPath);
  const defaultProfile = resolvedProfilePath === path.resolve(rootDir, DEFAULT_PROFILE);
  const config = JSON.parse(fs.readFileSync(resolvedProfilePath, 'utf8'));
  for (const field of [
    'targetCavalryVersion',
    'releaseTagPrefix',
    'releaseTagPattern',
    'releaseTitleTemplate',
  ]) {
    requireString(config[field], field);
  }
  if (!config.assetNameTemplates || typeof config.assetNameTemplates !== 'object') {
    throw new Error('Release profile assetNameTemplates must be an object.');
  }
  const assetTemplateKeys = Object.keys(config.assetNameTemplates).sort();
  if (assetTemplateKeys.join(',') !== RELEASE_ASSET_TEMPLATE_KEYS.join(',')) {
    throw new Error(
      'Release profile must define exactly aarch64, x64, and windowsX64 assets; x86/i686 releases are unsupported.'
    );
  }
  for (const field of RELEASE_ASSET_TEMPLATE_KEYS) {
    requireString(config.assetNameTemplates[field], `assetNameTemplates.${field}`);
  }
  if (!config.updater || typeof config.updater !== 'object') {
    throw new Error('Release profile updater must be an object.');
  }
  requireString(config.updater.manifestAssetName, 'updater.manifestAssetName');
  requireString(config.updater.downloadBaseUrl, 'updater.downloadBaseUrl');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(config.updater.manifestAssetName)) {
    throw new Error('Release profile updater.manifestAssetName must be a safe JSON asset name.');
  }
  if (defaultProfile && config.updater.manifestAssetName !== 'latest.json') {
    throw new Error('Default release.config.json updater.manifestAssetName must remain latest.json.');
  }
  let downloadBaseUrl;
  try {
    downloadBaseUrl = new URL(config.updater.downloadBaseUrl);
  } catch {
    throw new Error('Release profile updater.downloadBaseUrl must be a valid HTTPS URL.');
  }
  if (downloadBaseUrl.protocol !== 'https:' || downloadBaseUrl.search || downloadBaseUrl.hash) {
    throw new Error('Release profile updater.downloadBaseUrl must be an HTTPS URL without query or fragment.');
  }
  config.updater.downloadBaseUrl = downloadBaseUrl.toString().replace(/\/$/, '');
  if (config.updater.assetDownloadBaseUrlTemplate !== undefined) {
    requireString(config.updater.assetDownloadBaseUrlTemplate, 'updater.assetDownloadBaseUrlTemplate');
    const template = config.updater.assetDownloadBaseUrlTemplate;
    if (template.split('${tag}').length !== 2) {
      throw new Error('Release profile updater.assetDownloadBaseUrlTemplate must contain ${tag} exactly once.');
    }
    const sampleTag = `${config.releaseTagPrefix}1`;
    let assetBaseUrl;
    try { assetBaseUrl = new URL(template.replace('${tag}', sampleTag)); } catch {
      throw new Error('Release profile updater.assetDownloadBaseUrlTemplate must produce a valid HTTPS URL.');
    }
    if (assetBaseUrl.protocol !== 'https:' || assetBaseUrl.search || assetBaseUrl.hash) {
      throw new Error('Release profile updater.assetDownloadBaseUrlTemplate must produce HTTPS without query or fragment.');
    }
    config.updater.assetDownloadBaseUrlTemplate = assetBaseUrl.toString()
      .replace(sampleTag, '${tag}')
      .replace(/\/$/, '');
  }
  if (config.updater.legacyManifestAssetName !== undefined) {
    requireString(config.updater.legacyManifestAssetName, 'updater.legacyManifestAssetName');
    if (
      defaultProfile ||
      config.updater.legacyManifestAssetName !== 'latest.json' ||
      config.updater.legacyManifestAssetName === config.updater.manifestAssetName ||
      !config.updater.assetDownloadBaseUrlTemplate
    ) {
      throw new Error('Only an explicit profile may add frozen latest.json beside a tag-pinned updater feed.');
    }
  }
  if (!config.updater.macOSAssetNameTemplates || typeof config.updater.macOSAssetNameTemplates !== 'object') {
    throw new Error('Release profile updater.macOSAssetNameTemplates must be an object.');
  }
  const updaterTemplateKeys = Object.keys(config.updater.macOSAssetNameTemplates).sort();
  if (updaterTemplateKeys.join(',') !== UPDATER_MACOS_ASSET_TEMPLATE_KEYS.join(',')) {
    throw new Error('Release profile updater.macOSAssetNameTemplates must define exactly aarch64 and x64.');
  }
  for (const field of UPDATER_MACOS_ASSET_TEMPLATE_KEYS) {
    requireString(config.updater.macOSAssetNameTemplates[field], `updater.macOSAssetNameTemplates.${field}`);
  }
  return config;
}

function renderTemplate(template, patch) {
  return template.replaceAll('${patch}', patch);
}

function resolveTag() {
  return optionValue('--tag') || process.env.GITHUB_REF_NAME || '';
}

function metadataForTag(config, tag) {
  if (!new RegExp(config.releaseTagPattern).test(tag)) {
    throw new Error(`Release tag "${tag}" does not match ${config.releaseTagPattern}.`);
  }
  const patch = tag.slice(config.releaseTagPrefix.length);
  if (!/^[0-9]+$/.test(patch)) {
    throw new Error(`Release tag "${tag}" must end with a numeric patch id.`);
  }
  const windowsAsset = renderTemplate(config.assetNameTemplates.windowsX64, patch);
  const updaterAarch64Asset = renderTemplate(config.updater.macOSAssetNameTemplates.aarch64, patch);
  const updaterX64Asset = renderTemplate(config.updater.macOSAssetNameTemplates.x64, patch);
  const updaterAssetBaseUrl = config.updater.assetDownloadBaseUrlTemplate
    ? config.updater.assetDownloadBaseUrlTemplate.replace('${tag}', tag).replace(/\/$/, '')
    : config.updater.downloadBaseUrl;
  return {
    RELEASE_TAG: tag,
    RELEASE_PATCH: patch,
    TARGET_CAVALRY_VERSION: config.targetCavalryVersion,
    INTERNAL_APP_VERSION: readJson('package.json').version,
    RELEASE_TITLE: renderTemplate(config.releaseTitleTemplate, patch),
    RELEASE_ASSET_NAME_AARCH64: renderTemplate(config.assetNameTemplates.aarch64, patch),
    RELEASE_ASSET_NAME_X64: renderTemplate(config.assetNameTemplates.x64, patch),
    RELEASE_ASSET_NAME_WINDOWS_X64: windowsAsset,
    RELEASE_UPDATER_MANIFEST_NAME: config.updater.manifestAssetName,
    RELEASE_UPDATER_LEGACY_MANIFEST_NAME: config.updater.legacyManifestAssetName || '',
    RELEASE_UPDATER_DOWNLOAD_BASE_URL: config.updater.downloadBaseUrl,
    RELEASE_UPDATER_ASSET_DOWNLOAD_BASE_URL: updaterAssetBaseUrl,
    RELEASE_UPDATER_ASSET_NAME_AARCH64: updaterAarch64Asset,
    RELEASE_UPDATER_ASSET_NAME_X64: updaterX64Asset,
    RELEASE_UPDATER_SIGNATURE_NAME_AARCH64: `${updaterAarch64Asset}.sig`,
    RELEASE_UPDATER_SIGNATURE_NAME_X64: `${updaterX64Asset}.sig`,
    RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64: `${windowsAsset}.sig`,
  };
}

function writeGithubEnv(metadata) {
  const lines = Object.entries(metadata).map(([key, value]) => `${key}=${value}`);
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `${lines.join('\n')}\n`);
  }
  console.log(lines.join('\n'));
}

function checkProtocol(config, profilePath = DEFAULT_PROFILE) {
  const sampleTag = `${config.releaseTagPrefix}1`;
  const sample = metadataForTag(config, sampleTag);
  if (path.resolve(rootDir, profilePath) !== path.resolve(rootDir, DEFAULT_PROFILE)) {
    if (
      sample.RELEASE_UPDATER_MANIFEST_NAME !== config.updater.manifestAssetName ||
      sample.RELEASE_UPDATER_ASSET_DOWNLOAD_BASE_URL !== (
        config.updater.assetDownloadBaseUrlTemplate
          ? config.updater.assetDownloadBaseUrlTemplate.replace('${tag}', sampleTag).replace(/\/$/, '')
          : config.updater.downloadBaseUrl
      )
    ) {
      throw new Error('Explicit release profile does not produce its declared updater metadata.');
    }
    if (config.updater.legacyManifestAssetName && sample.RELEASE_UPDATER_LEGACY_MANIFEST_NAME !== 'latest.json') {
      throw new Error('Explicit dual-feed profile must preserve the fixed legacy latest.json name.');
    }
    if (new RegExp(config.releaseTagPattern).test('v0.1.11')) {
      throw new Error('releaseTagPattern must reject internal SemVer tags.');
    }
    return;
  }
  if (sample.RELEASE_TITLE !== 'Cavalry Language Switcher for Cavalry 2.7.2 patch 1') {
    throw new Error('releaseTitleTemplate does not render the frozen title contract.');
  }
  if (sample.RELEASE_ASSET_NAME_AARCH64 !== 'Cavalry.Language.Switcher_Cavalry-2.7.2-p1_aarch64.dmg') {
    throw new Error('assetNameTemplates.aarch64 does not render the frozen asset contract.');
  }
  if (sample.RELEASE_ASSET_NAME_X64 !== 'Cavalry.Language.Switcher_Cavalry-2.7.2-p1_x64.dmg') {
    throw new Error('assetNameTemplates.x64 does not render the frozen asset contract.');
  }
  if (
    sample.RELEASE_ASSET_NAME_WINDOWS_X64 !==
    'Cavalry.Language.Switcher_Cavalry-2.7.2-p1_windows-x64-setup.exe'
  ) {
    throw new Error('assetNameTemplates.windowsX64 does not render the frozen asset contract.');
  }
  if (
    sample.RELEASE_UPDATER_ASSET_NAME_AARCH64 !==
    'Cavalry.Language.Switcher_Cavalry-2.7.2-p1_aarch64.app.tar.gz' ||
    sample.RELEASE_UPDATER_ASSET_NAME_X64 !==
    'Cavalry.Language.Switcher_Cavalry-2.7.2-p1_x64.app.tar.gz'
  ) {
    throw new Error('updater.macOSAssetNameTemplates do not render the frozen updater asset contract.');
  }
  if (
    sample.RELEASE_UPDATER_SIGNATURE_NAME_AARCH64 !== `${sample.RELEASE_UPDATER_ASSET_NAME_AARCH64}.sig` ||
    sample.RELEASE_UPDATER_SIGNATURE_NAME_X64 !== `${sample.RELEASE_UPDATER_ASSET_NAME_X64}.sig` ||
    sample.RELEASE_UPDATER_SIGNATURE_NAME_WINDOWS_X64 !== `${sample.RELEASE_ASSET_NAME_WINDOWS_X64}.sig`
  ) {
    throw new Error('Updater signature names must derive from their exact signed artifact names.');
  }
  if (
    sample.RELEASE_UPDATER_MANIFEST_NAME !== 'latest.json' ||
    sample.RELEASE_UPDATER_ASSET_DOWNLOAD_BASE_URL !== config.updater.downloadBaseUrl ||
    sample.RELEASE_UPDATER_LEGACY_MANIFEST_NAME !== ''
  ) {
    throw new Error('Default release.config.json must preserve the frozen 2.7 updater feed contract.');
  }
  if (new RegExp(config.releaseTagPattern).test('v0.1.11')) {
    throw new Error('releaseTagPattern must reject internal SemVer tags.');
  }
}

function main() {
  const profilePath = optionValue('--profile') || DEFAULT_PROFILE;
  const config = loadConfig(profilePath);
  if (args.includes('--check')) {
    checkProtocol(config, profilePath);
    const explicitTag = optionValue('--tag');
    if (explicitTag) metadataForTag(config, explicitTag);
    console.log('[release-metadata] OK: release protocol is stable');
    return;
  }

  const tag = resolveTag();
  if (!tag) {
    throw new Error('No release tag found. Pass --tag or run under a tag-triggered GitHub Action.');
  }
  const metadata = metadataForTag(config, tag);
  if (args.includes('--github-env')) {
    writeGithubEnv(metadata);
    return;
  }
  console.log(JSON.stringify(metadata, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[release-metadata] ${error.message}`);
    process.exit(1);
  }
}

module.exports = { loadConfig, metadataForTag };
