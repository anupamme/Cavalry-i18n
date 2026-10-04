#!/usr/bin/env node
/**
 * [INPUT]: 依赖 renderer/user-profile-text.js 与ui-text.js组合后的四语 userProfile copy、language-scope.js投影器与固定语言清单。
 * [OUTPUT]: 锁定共享范围通知、unset+English默认徽章/无障碍文案、矛盾状态Unknown隔离、legacy显示与默认语言不授予恢复能力。
 * [POS]: tools 的本地化与状态投影合同；不冒充浏览器排版、400×484 窗口或现场可见性验证。
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

test('user-profile preview notice stays compact and names the shared-profile blast radius', () => {
  const expected = {
    en: 'Development preview: language changes affect all Cavalry copies using this profile, including other versions. Translation coverage is incomplete.',
    'zh-Hans': '开发预览，翻译覆盖尚不完整。切换语言会影响此用户配置下的所有 Cavalry 副本，包括其他版本。',
    'zh-Hant': '開發預覽，翻譯覆蓋尚不完整。切換語言會影響此使用者設定檔下的所有 Cavalry 副本，包括其他版本。',
    ja_JP: '開発プレビューです。翻訳はまだ一部のみです。このユーザープロファイルの言語を変更すると、他のバージョンを含むすべてのCavalryコピーに影響します。',
  };
  const limits = { en: 145, 'zh-Hans': 55, 'zh-Hant': 60, ja_JP: 90 };

  for (const [locale, copy] of Object.entries(expected)) {
    assert.equal(notices[locale], copy, `${locale} notice must preserve both safety facts`);
    assert.ok(Array.from(copy).length <= limits[locale], `${locale} notice must fit the compact Activity slot`);
  }
});

test('unset user-profile locale projects the vendor-default English label without changing gates', () => {
  const expected = {
    en: ['English (default)', 'Current: English (default)'],
    'zh-Hans': ['英语（默认）', '当前: 英语（默认）'],
    'zh-Hant': ['英語（預設）', '目前: 英語（預設）'],
    ja_JP: ['英語（既定）', '現在: 英語（既定）'],
  };

  for (const [locale, [label, ariaLabel]] of Object.entries(expected)) {
    const controller = scopeFor(locale, {
      languageScope: 'userProfile', nativeLocaleState: 'unset', currentLang: 'en',
      nativeResourceAvailable: true, nativeEnglishRestoreAvailable: false,
    });
    const presentation = controller.currentLanguagePresentation('en', languages, 'unset');
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
