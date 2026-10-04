/**
 * [INPUT]: 依赖显式native审批registry、源身份/格式校验与单语言真实投影producer。
 * [OUTPUT]: 提供完整分区摘要守门及有限真实修订assertion，供两段剩余UI测试共用。
 * [POS]: tools 的纯测试共享合同，不注册测试、不读私账或App、不进入产品运行时；避免后半入库回归重复断言。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { resolveTranslations, renderNativePack, nativeSourceIdentitySha256 } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const LOCALES = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sorted = rows => [...rows].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
const identity = row => [row.key, row.catalogId, row.owner ?? null, row.fieldPath,
  row.source, row.notes, row.dontTranslate === true, row.vendorJapanese ?? null,
  row.sourceRole, row.displayRole];
const decisionRows = rows => sorted(rows).map(row => [row.key,
  ...LOCALES.map(locale => [row.translations[locale].decision, row.translations[locale].text])]);

// -- 完整源绑定合同与有限旧值回退共用，不放宽门 -----------------
function assertAdditionalPartition(scope) {
  const { entries, provenance } = require(`../languages/native/${scope.module}.js`);
  const rows = sorted(entries);
  assert.ok(require('../languages/native/approved_modules').APPROVED_MODULES.includes(scope.module));
  assert.equal(rows.length, scope.keys);
  assert.equal(new Set(rows.map(row => row.key)).size, scope.keys);
  assert.equal(hash(rows.map(row => row.key)), scope.keyset);
  assert.equal(hash(rows.map(row => [row.key, row.source])), scope.pairs);
  assert.equal(hash(rows.map(identity)), scope.identity);
  assert.equal(hash(decisionRows(rows)), scope.decisions);
  assert.equal(provenance.approvedBy, 'primary-agent');
  assert.equal(provenance.approvalState, 'approved-source-bound-display-input');
  assert.equal(provenance.independentFullReviewKeys, scope.keys);
  assert.equal(provenance.independentFullReviewSlots, scope.keys * 3);
  assert.equal(provenance.unresolvedFindingKeys, 0);
  assert.equal(provenance.liveApproval, false);
  for (const locale of LOCALES) {
    for (const row of rows) {
      const value = row.translations[locale];
      assert.equal(value.decision === 'preserve', value.text === row.source);
      if (row.dontTranslate) assert.equal(value.text, row.source);
      if (locale === 'ja_JP' && !row.dontTranslate && row.vendorJapanese !== row.source) {
        assert.equal(value.text, row.vendorJapanese);
      }
      assertNativeTranslationFormat(row.source, value.text);
    }
    const reviews = rows.map(row => ({ key: row.key, source: row.source, ...row.translations[locale] }));
    const resolved = resolveTranslations(rows, locale, reviews);
    assert.equal(resolved.rows.filter(row => row.status === 'missing').length, 0);
    assert.equal(Object.keys(JSON.parse(renderNativePack(resolved))[0].value).length, scope.keys);
  }
}

function assertFiniteRepairs(rows, repairs) {
  const byKey = new Map(rows.map(row => [row.key, row]));
  for (const [key, locale, , after, sourceSha256] of repairs) {
    const row = byKey.get(key);
    assert.ok(row, key);
    assert.equal(nativeSourceIdentitySha256(row), sourceSha256, key);
    assert.equal(row.translations[locale].text, after, `${key}/${locale}`);
  }
}

module.exports = { LOCALES, hash, sorted, identity, decisionRows, assertAdditionalPartition, assertFiniteRepairs };
