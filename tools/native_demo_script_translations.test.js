/**
 * [INPUT]: 依赖官方示例文字审批与100源文件的精确位置表
 * [OUTPUT]: 验证297源891值、100文件489位置、DNT符号及registry域隔离
 * [POS]: 离线数据合同；不加载厂商脚本，不证明Cavalry engine或字体行为
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { provenance, entries, sourceFiles } = require('../languages/native/official_demo_scripts');
const { APPROVED_MODULES } = require('../languages/native/approved_modules');

test('official script translations form a complete separate text domain', () => {
  assert.equal(provenance.approvalState, 'root-approved-text-only');
  assert.equal(provenance.liveApproval, false);
  assert.equal(provenance.runtimeIntegration, false);
  assert.equal(entries.length, 297);
  assert.equal(new Set(entries.map(r => r.id)).size, 297);
  assert.equal(new Set(entries.map(r => r.source)).size, 297);
  assert.ok(!APPROVED_MODULES.includes('official_demo_scripts'));
  for (const row of entries) {
    assert.deepEqual(Object.keys(row).sort(), ['id', 'source', 'translations']);
    assert.deepEqual(Object.keys(row.translations).sort(), ['ja_JP', 'zh-Hans', 'zh-Hant']);
    for (const text of Object.values(row.translations)) assert.ok(text.trim(), row.id);
  }
  assert.deepEqual(entries.find(r => r.id === 'text-068').translations,
    { 'zh-Hans': 'F', 'zh-Hant': 'F', ja_JP: 'F' });
  assert.ok(provenance.preserved['text-068']);
  assert.ok(!provenance.preserved['text-240']);
});

test('source positions use UTF-8 bytes and cover every approved source without overlaps', () => {
  assert.equal(sourceFiles.length, 100);
  assert.equal(new Set(sourceFiles.map(f => f.file)).size, 100);
  const ids = new Set(entries.map(r => r.id));
  const used = new Set(); let slots = 0;
  for (const file of sourceFiles) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(file.bytes) && file.bytes > 0);
    assert.match(file.file, /^[^/]+\/[^/]+\.js$/);
    assert.ok(!file.file.includes('..'));
    let last = 0;
    for (const slot of [...file.slots].sort((a, b) => a.startUtf8 - b.startUtf8)) {
      assert.ok(ids.has(slot.id)); used.add(slot.id); slots += 1;
      assert.ok(Number.isSafeInteger(slot.startUtf8) && slot.startUtf8 >= last);
      assert.ok(Number.isSafeInteger(slot.endUtf8) && slot.endUtf8 > slot.startUtf8);
      assert.ok(slot.endUtf8 <= file.bytes); last = slot.endUtf8;
      assert.ok(['composition', 'layer', 'notes', 'text', 'layer-prefix'].includes(slot.role));
    }
  }
  assert.equal(slots, 489); assert.equal(used.size, 297);
});

test('source Notes retain emphasis and paragraph structure after approved meaning corrections', () => {
  const notes = new Set(sourceFiles.flatMap(f => f.slots.filter(s => s.role === 'notes').map(s => s.id)));
  for (const row of entries.filter(r => notes.has(r.id))) {
    for (const text of Object.values(row.translations)) {
      assert.equal((text.match(/\*\*/g) || []).length, (row.source.match(/\*\*/g) || []).length, row.id);
      assert.equal((text.match(/\n\n/g) || []).length, (row.source.match(/\n\n/g) || []).length, row.id);
    }
  }
  for (const row of entries) {
    assert.ok(!row.translations['zh-Hant'].includes('關鍵影格'), row.id);
    assert.ok(!row.translations.ja_JP.includes('太阳'), row.id);
  }
});
