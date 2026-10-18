/**
 * [INPUT]: Demo producer源绑定器与合成UTF-8/LF/CRLF原像。
 * [OUTPUT]: 锁默认拒绝、显式精确换行映射和非换行漂移拒绝，未知源不得获得投影。
 * [POS]: 跨平台源字节合同；不运行宿主，不借合成数据证明官方实屏。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { bindOfficialSource } = require('./generate_demo_reader_tables.js');
const sha = value => createHash('sha256').update(value).digest('hex');
const source = Buffer.from('// fixture\nconst label="名稱"\nconst body="line\\ntext";\n');
const file = { file: 'Fixture.js', bytes: source.length, sha256: sha(source) };
test('default exact bytes preserve every approved offset', () => {
  const bound = bindOfficialSource(source, file);
  assert.equal(bound.actualSha256, file.sha256);
  for (let i=0; i<=source.length; ++i) assert.equal(bound.offset(i),i);
});
test('CRLF requires explicit mode and maps UTF-8 slots against actual bytes', () => {
  const raw = Buffer.from(source.toString().replaceAll('\n','\r\n'));
  assert.throws(() => bindOfficialSource(raw,file), /身份不匹配/);
  const bound = bindOfficialSource(raw,file,'crlf');
  assert.deepEqual(bound.approved,source);assert.equal(bound.actualBytes,raw.length);assert.equal(bound.actualSha256,sha(raw));
  for (const literal of ['"名稱"','"line\\ntext"']) {
    const token=Buffer.from(literal),start=source.indexOf(token);
    assert.deepEqual(raw.subarray(bound.offset(start),bound.offset(start+token.length)),token);
  }
  assert.equal(bound.offset(source.length),raw.length);
});
test('source edits, standalone CR, BOM and changed length still fail closed', () => {
  const raw=Buffer.from(source.toString().replaceAll('\n','\r\n'));
  for (const drift of [Buffer.concat([raw,Buffer.from(' ')]),Buffer.concat([Buffer.from([239,187,191]),raw]),Buffer.from(raw.toString().replace('fixture','changed')),Buffer.from(source.toString().replace('\n','\r'))]) {
    assert.throws(() => bindOfficialSource(drift,file,'crlf'),/不能还原批准身份/);
  }
});
