/**
 * [INPUT]: 依赖remaining_global_ui_03单键revision与native语言包producer。
 * [OUTPUT]: 验证三语ASCII尾字节、UTF-8回读和历史摘要回退。
 * [POS]: MessageBar单键源合同；不运行App、不批准live或部署。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { test } = require('node:test');
const { nativeSourceIdentitySha256, resolveTranslations, renderNativePack } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const { LOCALES, hash, decisionRows, restoreMessageBarNoFurtherRevision } = require('./native_remaining_ui_contract');
const { entries, provenance } = require('../languages/native/remaining_global_ui_03');

const EXPECTED = Object.freeze({
  source: 'No further messages.',
  vendorJapanese: 'No further messages.',
  sourceIdentitySha256: '466227241944760da430cb7053216088d43a638d71adeade3d77c9bbd4f46430',
  previousDecisionSha256: 'c29731dbea989fd14d415b66abae8a4db7c3e486918b47f5ecfc9bd091586e92',
  currentDecisionSha256: '83c07582aad0989ae67d21a5a6e36fdc2a8401808022feae4ea1ab52e8229ce3',
  previous: {
    'zh-Hans': '没有更多消息。',
    'zh-Hant': '沒有更多訊息。',
    ja_JP: 'これ以上メッセージはありません。',
  },
  current: {
    'zh-Hans': '没有更多消息.',
    'zh-Hant': '沒有更多訊息.',
    ja_JP: 'これ以上メッセージはありません.',
  },
  afterDrop: {
    'zh-Hans': '没有更多消息',
    'zh-Hant': '沒有更多訊息',
    ja_JP: 'これ以上メッセージはありません',
  },
});

test('MessageBar no-further revision preserves history and emits valid no-punctuation text', () => {
  const row = entries.find(entry => entry.key === 'messageBar.noFurther');
  const revision = provenance.messageBarNoFurtherAsciiTailRevision;
  assert.ok(row);
  assert.equal(row.source, EXPECTED.source);
  assert.equal(row.vendorJapanese, EXPECTED.vendorJapanese);
  assert.deepEqual(row.fieldPath, ['messageBar.noFurther']);
  assert.equal(nativeSourceIdentitySha256(row), EXPECTED.sourceIdentitySha256);
  assert.equal(revision.revisionId, 'messagebar-no-further-ascii-tail-20261012-r1');
  assert.equal(revision.approvalState, 'approved-source-bound-single-key-revision');
  assert.equal(revision.key, row.key);
  assert.deepEqual(revision.locales, LOCALES);
  assert.equal(revision.changedKeys, 1);
  assert.equal(revision.changedLocaleSlots, 3);
  assert.equal(revision.sourceIdentitySha256, EXPECTED.sourceIdentitySha256);
  assert.equal(revision.previousDecisionSha256, EXPECTED.previousDecisionSha256);
  assert.equal(revision.currentDecisionSha256, EXPECTED.currentDecisionSha256);
  assert.equal(revision.historicalApprovalReceiptSha256, provenance.approvalReceiptSha256);
  assert.equal(provenance.emptyRegionPromptPunctuationRevision.currentDecisionSha256,
    EXPECTED.previousDecisionSha256);
  assert.equal(revision.sourceIdentityChanged, false);
  assert.equal(revision.vendorJapaneseChanged, false);
  assert.equal(revision.liveApproval, false);
  assert.equal(provenance.liveApproval, false);
  assert.deepEqual(revision.reasonAbiVersion, {
    cavalryVersion: '2.8.0',
    qtVersion: '6.9.2',
    bundleIdentifier: 'com.scenegroup.cavalry',
    architecture: 'arm64',
    extensionLayerUuid: '448DD50E-75F4-3F2D-A46B-2C9F00DF9408',
    extensionLayerSha256: '55c165bfa3f780f73e35a0b4e7cbd30929fe54de46c41424c74a239e2f9f4d15',
    symbol: 'MessageBar::getElidedMessage(std::string const&)',
    address: '0xa7f8e0',
    byteRule: 'size > 1 copies size - 1 bytes before searching for LF',
  });

  const previousEntries = restoreMessageBarNoFurtherRevision(structuredClone(entries), revision);
  assert.equal(hash(decisionRows(previousEntries)), revision.previousDecisionSha256);
  assert.equal(hash(decisionRows(entries)), revision.currentDecisionSha256);

  const decoder = new TextDecoder('utf-8', { fatal: true });
  const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');
  for (const locale of LOCALES) {
    const current = revision.translations[locale].current;
    const previous = revision.translations[locale].previous;
    assert.equal(current, EXPECTED.current[locale]);
    assert.equal(previous, EXPECTED.previous[locale]);
    assert.equal(revision.translations[locale].previousSha256, sha256(previous));
    assert.equal(revision.translations[locale].currentSha256, sha256(current));
    assert.equal(row.translations[locale].decision, 'translate');
    assert.equal(row.translations[locale].text, current);
    assert.equal(Buffer.from(current, 'utf8').at(-1), 0x2e);
    assert.equal(decoder.decode(Buffer.from(current, 'utf8').subarray(0, -1)), EXPECTED.afterDrop[locale]);
    assert.doesNotMatch(EXPECTED.afterDrop[locale], /[。.]$/u);
    assertNativeTranslationFormat(row.source, current);

    const oldBytes = Buffer.from(previous, 'utf8');
    assert.equal(oldBytes.at(-1), 0x82);
    assert.throws(() => decoder.decode(oldBytes.subarray(0, -1)), /encoded data|encoding/u);

    const reviews = entries.map(entry => ({ key: entry.key, source: entry.source, ...entry.translations[locale] }));
    const [record] = JSON.parse(renderNativePack(resolveTranslations(entries, locale, reviews)));
    assert.deepEqual(record.value[row.key], { 'UI-text': current }, locale);
  }
});
