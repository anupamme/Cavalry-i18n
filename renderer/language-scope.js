/**
 * [INPUT]: 依赖 ui-text 提供的四语文案，以及业务层传入的状态、Dialog 和事务回调。
 * [OUTPUT]: 提供 installation/userProfile 控制门、unset+English默认与Unknown徽章、仅Restore确认、owned-English hostless Restore准入、恢复阶段文案与固定错误文案。
 * [POS]: renderer 的语言范围策略层；用户级设置覆盖同一用户配置中的所有 Cavalry 副本，appPath 仍由业务层作为重启目标。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
(() => {
  const PROFILE_ERRORS = Object.freeze({
    nativeUserLanguageConflict: 'nativeUserLanguageConflict',
    nativeResourceUnavailable: 'nativeResourceUnavailable',
    nativeUserLanguagePermissionDenied: 'nativeUserLanguagePermissionDenied',
  });

  function createLanguageScopeController({ text }) {
    let scope = 'installation';
    let nativeResourceAvailable = true;
    let nativeEnglishRestoreAvailable = false;
    let unsupportedHost = false;

    function configure(status = {}) {
      scope = status.languageScope === 'userProfile' ? 'userProfile' : 'installation';
      nativeResourceAvailable = scope === 'installation' || status.nativeResourceAvailable === true;
      nativeEnglishRestoreAvailable = scope === 'userProfile' && status.nativeEnglishRestoreAvailable === true;
      unsupportedHost = status.versionCompatibility !== 'supported';
    }

    function isUserProfile() { return scope === 'userProfile'; }
    function canSwitch() { return !isUserProfile() || nativeResourceAvailable; }
    function hostlessRestoreAvailable(appPath) {
      return isUserProfile() && nativeEnglishRestoreAvailable && (!appPath || unsupportedHost);
    }
    function languageLabel(code, languages = []) {
      if (code === 'restore-official') return text('restore');
      if (code === 'unknown') return text('unknownLanguage');
      const match = languages.find((language) => language.value === code);
      return match ? match.label : code === 'en' ? 'English' : text('unknownLanguage');
    }
    function currentLanguagePresentation(code, languages = [], nativeLocaleState = '') {
      const defaultEnglish = isUserProfile() && nativeLocaleState === 'unset' && code === 'en';
      const explicit = !isUserProfile() || nativeLocaleState === 'explicit';
      const language = defaultEnglish
        ? text('nativeLocaleEnglishDefault')
        : explicit ? languageLabel(code, languages) : text('unknownLanguage');
      return {
        label: language,
        ariaLabel: `${text('current')}: ${language}`,
      };
    }
    function applyLabelKey(currentLang, selectedLang) {
      return selectedLang && selectedLang === currentLang ? 'updateLanguagePatch' : 'apply';
    }
    function restoreIsNeeded(appPath, currentLang, reconciliationRequired) {
      return hostlessRestoreAvailable(appPath)
        || Boolean(appPath) && (currentLang !== 'en' || reconciliationRequired);
    }
    function isRestoreAction(action) {
      return action === 'restore-official' || action === 'en';
    }
    function languageOptions(languages, currentLang, patchStatus) {
      const currentLanguageCanUpdate = patchStatus === 'updateAvailable' || patchStatus === 'unknown';
      return languages.filter((language) => language.value !== 'en').map((language) => {
        const isCurrentLanguage = language.value === currentLang;
        return {
          ...language,
          disabled: !canSwitch() || (isCurrentLanguage && patchStatus === 'current'),
          badge: isCurrentLanguage && currentLanguageCanUpdate
            ? {
                label: text('patchUpdateBadge'),
                kind: 'green-subtle',
                ariaLabel: text('languageOptionUpdateAria', { language: language.label }),
              }
            : null,
          ariaLabel: isCurrentLanguage && currentLanguageCanUpdate
            ? text('languageOptionUpdateAria', { language: language.label })
            : language.label,
        };
      });
    }
    function startupStatusKey(reconciliationRequired) {
      if (!isUserProfile()) return null;
      if (!nativeResourceAvailable) {
        return reconciliationRequired
          ? 'nativeUserProfileResourcesUnavailableRecovery'
          : 'nativeResourceUnavailable';
      }
      return reconciliationRequired
        ? 'nativeUserProfileReconciliation'
        : 'nativeUserProfileScopeNotice';
    }
    function phaseTitleKey(phase, phaseState, fallback, restoring = false) {
      if (isUserProfile() && restoring && phase === 'applyTransaction') {
        return `phaseApplyEnglishRestore${phaseState[0].toUpperCase()}${phaseState.slice(1)}Title`;
      }
      if (isUserProfile() && restoring && phase === 'verifyInstallation') {
        return `phaseVerifyEnglishRestore${phaseState[0].toUpperCase()}${phaseState.slice(1)}Title`;
      }
      if (isUserProfile() && phase === 'ensureBaseline') {
        return `phaseEnsureRecoveryUserProfile${phaseState[0].toUpperCase()}${phaseState.slice(1)}Title`;
      }
      return fallback;
    }
    function failureTextKey(errorCode) {
      return PROFILE_ERRORS[errorCode] || null;
    }
    function runningTextKey() {
      return isUserProfile() ? 'cavalryStillRunningUserProfile' : 'cavalryStillRunning';
    }
    function showConfirmation(action, nextLanguage, handlers) {
      if (!isUserProfile() || action !== 'restore' || nextLanguage !== 'en') return false;
      handlers.showModal({
        title: text('nativeUserProfileRestoreConfirmTitle'),
        body: text('nativeUserProfileRestoreConfirmBody'),
        primary: text('restore'),
        secondary: text('cancel'),
        onPrimary: () => {
          handlers.closeModal();
          void handlers.runApply('en').catch(handlers.onFailure);
        },
        onSecondary: handlers.closeModal,
      });
      return true;
    }

    return Object.freeze({
      configure,
      isUserProfile,
      canSwitch,
      hostlessRestoreAvailable,
      languageLabel,
      currentLanguagePresentation,
      applyLabelKey,
      restoreIsNeeded,
      isRestoreAction,
      languageOptions,
      startupStatusKey,
      phaseTitleKey,
      failureTextKey,
      runningTextKey,
      showConfirmation,
    });
  }

  window.createLanguageScopeController = createLanguageScopeController;
})();
