/**
 * [INPUT]: 依赖只读版本兼容枚举、安装版本与 supportedVersion，以及受控 renderer locale。
 * [OUTPUT]: 对外提供兼容状态文案路由、精确 Cavalry 2.7.2→新版 2.8.0 切换器的 legacyRelease 入口门与四语下载按钮标签。
 * [POS]: renderer 版本提示策略；兼容结论仍由后端提供，本层只在明确 2.8.0 切换器与 2.7.2 安装冲突时指向固定旧版发行页，不推断版本或持有 URL。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
(() => {
  const STATUS_KEYS = Object.freeze({
    olderUnsupported: 'olderVersionUnsupported',
    newerUnsupported: 'newerVersionUnsupported',
    unknownUnsupported: 'unknownVersionUnsupported',
  });
  const LEGACY_RELEASE_LABELS = Object.freeze({
    en: 'Download p12 for Cavalry 2.7.2',
    'zh-Hans': '下载 2.7.2 对应的 p12',
    'zh-Hant': '下載 2.7.2 對應的 p12',
    ja_JP: 'Cavalry 2.7.2 用の p12 をダウンロード',
  });

  function shouldOfferLegacyRelease(status = {}) {
    return status.versionCompatibility === 'olderUnsupported' &&
      status.version === '2.7.2' && status.supportedVersion === '2.8.0';
  }

  window.cavalryVersionGuidance = Object.freeze({
    statusKey: (compatibility) => Object.hasOwn(STATUS_KEYS, compatibility) ? STATUS_KEYS[compatibility] : null,
    shouldOfferLegacyRelease,
    buttonLabel: (locale) => LEGACY_RELEASE_LABELS[locale] || LEGACY_RELEASE_LABELS.en,
  });
})();
