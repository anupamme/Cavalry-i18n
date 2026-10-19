/**
 * [INPUT]: 依赖场景范围修订器、冻结展开和临时表单。
 * [OUTPUT]: 验证父场景不自动通过、原件保全与错误结果拒绝。
 * [POS]: 离线合同测试；不读真实runs、不运行Cavalry。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {buildCatalog,sortCases}=require('./catalog.js');
const {prepare,record,check,amendScenes}=require('./checklist.js');
const {verifySceneScope}=require('./scene-scope.js');
const DIR='scope-amendment-scenes-v1';
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'scene-scope-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'run');prepare({out,platform:'macos',candidate:'fixture'});
  const catalog=buildCatalog({legacySceneScope:true});
  const manifest={...catalog,cases:sortCases(catalog.cases.filter(c=>['macos','shared'].includes(c.platform))),platform:'macos',candidate:'fixture'};
  fs.writeFileSync(path.join(out,'session.json'),JSON.stringify(manifest,null,2)+'\n');
  const escape=s=>s.replaceAll('|','&#124;').replace(/[\r\n]+/g,' ');
  fs.writeFileSync(path.join(out,'CHECKLIST.md'),['# fixture','',...manifest.cases.map(c=>`| [ ] | ${c.id} | ${escape(c.title)} | PENDING | | |`),''].join('\n'));
  return {out,manifest};
}
test('显式修订保留三原件与全部attempt，不自动给父场景通过',t=>{
  const {out,manifest}=fixture(t),id=manifest.cases.find(c=>c.batch==='00-offline').id;
  record({out,id,result:'REUSE',candidate:'historical-fixture',evidence:'receipt',note:'同范围fixture'});
  const originals=Object.fromEntries(['session.json','CHECKLIST.md','attempts.jsonl'].map(n=>[n,fs.readFileSync(path.join(out,n))]));
  assert.ok(check(out).errors.length);
  assert.deepEqual(amendScenes(out),{amended:true,out,before:2810,after:2630,observations:195,parents:15,attempts:1});
  const next=JSON.parse(fs.readFileSync(path.join(out,'session.json')));
  assert.equal(next.sceneInventory.length,195);
  assert.equal(next.cases.filter(c=>c.batch==='04-six-names-parent').length,15);
  for(const name of Object.keys(originals)) assert.ok(originals[name].equals(fs.readFileSync(path.join(out,DIR,'original',name))));
  assert.ok(originals['attempts.jsonl'].equals(fs.readFileSync(path.join(out,'attempts.jsonl'))));
  assert.deepEqual(verifySceneScope(out,next),[]);
  assert.equal(check(out).errors.length,0);
  assert.equal(check(out).counts.REUSE,1);
  assert.equal(check(out).counts.PENDING,2629);
  assert.throws(()=>amendScenes(out),/已有归档/);
});
test('转库存项有FAIL或已填结果均拒绝，原表不变',t=>{
  for(const result of ['FAIL','PASS']) {
    const {out,manifest}=fixture(t),id=manifest.cases.find(c=>c.batch==='05-null-shape').id;
    record({out,id,result,candidate:'fixture',evidence:'fixture'});
    const before=fs.readFileSync(path.join(out,'session.json'));
    assert.throws(()=>amendScenes(out),/已有结果或历史/);
    assert.ok(before.equals(fs.readFileSync(path.join(out,'session.json'))));
    assert.equal(fs.existsSync(path.join(out,DIR)),false);
  }
});
test('归档改字节与丢绑定均被识别',t=>{
  const {out}=fixture(t);amendScenes(out);
  const file=path.join(out,'session.json'),next=JSON.parse(fs.readFileSync(file));
  fs.appendFileSync(path.join(out,DIR,'original','attempts.jsonl'),' ');
  assert.ok(verifySceneScope(out,next).some(e=>e.includes('SHA')));
  delete next.sceneScopeAmendment;fs.writeFileSync(file,JSON.stringify(next));
  assert.ok(check(out).errors.some(e=>e.includes('缺绑定')));
});
