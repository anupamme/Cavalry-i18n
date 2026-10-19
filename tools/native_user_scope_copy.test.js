#!/usr/bin/env node
/**
 * [INPUT]: 依赖 renderer/user-profile-text.js 与ui-text.js组合后的四语 userProfile copy、language-scope.js投影器与固定语言清单。
 * [OUTPUT]: 锁定正式版共享范围通知、统一English徽章/无障碍文案、矛盾状态Unknown隔离、legacy显示与默认语言不授予恢复能力。
 * [POS]: tools 的本地化与状态投影合同；不冒充浏览器排版、400×556 窗口或现场可见性验证。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const profileTextSource = fs.readFileSync(path.join(__dirname, '../renderer/user-profile-text.js'), 'utf8');
const uiTextSource = fs.readFileSync(path.join(__dirname, '../renderer/ui-text.js'), 'utf8');
const translations = vm.runInNewContext(`${profileTextSource}\n${uiTextSource}\nUI_TEXT`, {});
const notices = Object.fromEntries(['en', 'zh-Hans', 'zh-Hant', 'ja_JP'].map(locale => [
  locale, translations[locale].nativeUserProfileScopeNotice,
]));
const languageScopeSource = fs.readFileSync(path.join(__dirname, '../renderer/language-scope.js'), 'utf8');
const languages = [
  { value: 'en', label: 'English' },
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'ja_JP', label: '日本語' },
];

function scopeFor(locale, status) {
  const context = { window: {} };
  vm.runInNewContext(languageScopeSource, context);
  const text = (key, params = {}) => (translations[locale][key] || key)
    .replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
  const controller = context.window.createLanguageScopeController({ text });
  controller.configure(status);
  return controller;
}

test('production user-profile notices describe shared settings without development-preview claims', () => {
  const expected = {
    en: ['Shared language setting', 'Language changes affect all Cavalry copies using this user profile.'],
    'zh-Hans': ['共享语言设置', '切换语言会影响使用此用户配置的所有 Cavalry 副本。'],
    'zh-Hant': ['共享語言設定', '切換語言會影響使用此使用者設定檔的所有 Cavalry 副本。'],
    ja_JP: ['共有言語設定', 'このユーザープロファイルを使用するすべての Cavalry に言語変更が適用されます。'],
  };
  const limits = { en: 90, 'zh-Hans': 55, 'zh-Hant': 60, ja_JP: 90 };
  for (const [locale, [title, notice]] of Object.entries(expected)) {
    assert.equal(translations[locale].nativeUserProfileScopeTitle, title, `${locale} production title`);
    assert.equal(notices[locale], notice, `${locale} shared-profile scope remains explicit`);
    assert.ok(Array.from(notice).length <= limits[locale], `${locale} compact Activity slot`);
    const controller = scopeFor(locale, { languageScope: 'userProfile', nativeResourceAvailable: true });
    assert.equal(controller.startupStatusKey(false), 'nativeUserProfileScopeNotice');
  }
});

test('production resource failures retain recovery guidance and do not promise unconditional restore', () => {
  const expected = {
    en: [
      'Native translation resources are unavailable or do not match this build. Language switching is unavailable. Use Restore English if available.',
      'The shared language state may need recovery. Native translation resources are unavailable or do not match this build, so language switching is unavailable. Use Restore English if available. Do not remove recovery records.',
    ],
    'zh-Hans': [
      '原生翻译资源不可用或与此构建不匹配，暂时无法切换语言。若「恢复英文」可用，请用它恢复。',
      '共享语言状态可能需要恢复。原生翻译资源不可用或与此构建不匹配，暂时无法切换语言。若「恢复英文」可用，请用它恢复。请勿删除恢复记录。',
    ],
    'zh-Hant': [
      '原生翻譯資源無法使用，或與此建置不相符，暫時無法切換語言。若「還原英文」可用，請用它還原。',
      '共享語言狀態可能需要還原。原生翻譯資源無法使用，或與此建置不相符，暫時無法切換語言。若「還原英文」可用，請用它還原。請勿刪除還原記錄。',
    ],
    ja_JP: [
      'ネイティブ翻訳リソースを利用できないか、このビルドと一致しないため、言語を切り替えられません。「英語に戻す」が利用できる場合は、この操作で復旧してください。',
      '共有言語状態の復旧が必要な可能性があります。ネイティブ翻訳リソースを利用できないか、このビルドと一致しないため、言語を切り替えられません。「英語に戻す」が利用できる場合は、この操作で復旧してください。復旧記録は削除しないでください。',
    ],
  };
  for (const [locale, [unavailable, recovery]] of Object.entries(expected)) {
    assert.equal(translations[locale].nativeResourceUnavailable, unavailable);
    assert.equal(translations[locale].nativeUserProfileResourcesUnavailableRecovery, recovery);
    const controller = scopeFor(locale, {
      languageScope: 'userProfile', nativeResourceAvailable: false, nativeEnglishRestoreAvailable: false,
    });
    assert.equal(controller.startupStatusKey(false), 'nativeResourceUnavailable');
    assert.equal(controller.startupStatusKey(true), 'nativeUserProfileResourcesUnavailableRecovery');
    assert.equal(controller.canSwitch(), false);
    assert.equal(controller.hostlessRestoreAvailable(''), false);
  }
});

test('unset user-profile locale projects the same English label as explicit English without changing gates', () => {
  const expected = {
    en: ['English', 'Current: English'],
    'zh-Hans': ['English', '当前: English'],
    'zh-Hant': ['English', '目前: English'],
    ja_JP: ['English', '現在: English'],
  };

  for (const [locale, [label, ariaLabel]] of Object.entries(expected)) {
    const controller = scopeFor(locale, {
      languageScope: 'userProfile', nativeLocaleState: 'unset', currentLang: 'en',
      nativeResourceAvailable: true, nativeEnglishRestoreAvailable: false,
    });
    const presentation = controller.currentLanguagePresentation('en', languages, 'unset');
    const explicit = scopeFor(locale, { languageScope: 'userProfile', nativeLocaleState: 'explicit' });
    assert.equal(presentation.label, explicit.currentLanguagePresentation('en', languages, 'explicit').label);
    assert.equal(presentation.label, label, `${locale} unset badge`);
    assert.equal(presentation.ariaLabel, ariaLabel, `${locale} unset aria label`);
    assert.equal(controller.canSwitch(), true, `${locale} keeps existing resource switch gate`);
    assert.equal(controller.hostlessRestoreAvailable(''), false, `${locale} unset locale grants no owned restore`);
    assert.equal(controller.restoreIsNeeded('', 'en', false), false, `${locale} default English does not invent hostless restore`);

    for (const inconsistentCurrentLang of ['unknown', 'zh-Hans']) {
      assert.equal(
        controller.currentLanguagePresentation(inconsistentCurrentLang, languages, 'unset').label,
        translations[locale].unknownLanguage,
        `${locale} unset state cannot disguise a non-default current-language value`
      );
    }
  }
});

test('only explicit recognized user-profile locales keep language labels; missing or unrecognized state stays Unknown', () => {
  const cases = [
    ['en', 'en', 'English'],
    ['zh-Hans', 'zh-Hans', '简体中文'],
    ['zh-Hant', 'zh-Hant', '繁體中文'],
    ['ja_JP', 'ja_JP', '日本語'],
  ];
  for (const [uiLocale, currentLang, label] of cases) {
    const explicit = scopeFor(uiLocale, { languageScope: 'userProfile', nativeLocaleState: 'explicit' });
    assert.equal(explicit.currentLanguagePresentation(currentLang, languages, 'explicit').label, label);

    const unrecognized = scopeFor(uiLocale, { languageScope: 'userProfile', nativeLocaleState: 'unrecognized' });
    assert.equal(unrecognized.currentLanguagePresentation(currentLang, languages, 'unrecognized').label,
      translations[uiLocale].unknownLanguage, 'unrecognized locale must not trust a forged product code');

    const missing = scopeFor(uiLocale, { languageScope: 'userProfile' });
    assert.equal(missing.currentLanguagePresentation(currentLang, languages, '').label,
      translations[uiLocale].unknownLanguage, 'missing locale-state metadata must fail closed');
  }
});

test('explicit English and legacy installation projection are unchanged', () => {
  const userProfile = scopeFor('en', {
    languageScope: 'userProfile', nativeLocaleState: 'explicit', currentLang: 'en',
    nativeEnglishRestoreAvailable: false,
  });
  const explicit = userProfile.currentLanguagePresentation('en', languages, 'explicit');
  assert.equal(explicit.label, 'English');
  assert.equal(explicit.ariaLabel, 'Current: English');

  const legacy = scopeFor('en', { languageScope: 'installation' });
  const legacyEnglish = legacy.currentLanguagePresentation('en', languages, '');
  assert.equal(legacyEnglish.label, 'English');
  assert.equal(legacyEnglish.ariaLabel, 'Current: English');
  const legacyUnknown = legacy.currentLanguagePresentation('unknown', languages, 'unset');
  assert.equal(legacyUnknown.label, 'Unknown');
  assert.equal(legacyUnknown.ariaLabel, 'Current: Unknown');
});
