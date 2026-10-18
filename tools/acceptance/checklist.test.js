/**
 * [INPUT]: 依赖schema2目录、两类source inventory与临时目录。
 * [OUTPUT]: 验证实屏边界、scope链、失败闭环与归档完整性。
 * [POS]: 验收工具自测；不启动Cavalry，不改真实整轮表。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {prepare,check,closeout,migrateV1Run,amendV2ToolHelpRun,amendScenes}=require('./checklist.js');
const {buildCatalog,digest}=require('./catalog.js');
const {V1_CATALOG_SHA256}=require('./migration.js');
test('Python双平台编排离线自测',()=>{
  const {spawnSync}=require('node:child_process');
  const python=process.env.PYTHON || (process.platform==='win32'?'python':'python3');
  const result=spawnSync(python,['-m','unittest','discover','-s',__dirname,'-p','test_run_flow.py'],{encoding:'utf8'});
  assert.equal(result.status,0,result.error?.message || result.stderr);
});
test('44主项有映射；帮助分离384主域和17def域',()=>{
  const c=buildCatalog(); assert.equal(c.masters.length,44);
  assert.deepEqual(c.cases.filter(x=>x.id.startsWith('target-apply:')).map(x=>x.locale), ['zh-Hans','zh-Hant','ja_JP']);
  assert.equal(c.cases.filter(x=>x.id.startsWith('target-english:')).length,1);
  const axis=c.pluginInventory.find(x=>x.key==='nodeAttrEnum:sceneGroup::rippleFilter.displacementAxis.0');
  assert.equal(axis.approvedRule,null);
  assert.deepEqual(axis.caseIds,[]);
  assert.equal(c.cases.filter(x=>x.batch==='03-toolhelp').length,0);
  assert.equal(c.toolHelpInventory.length,198);
  assert.equal(c.cases.filter(x=>x.batch==='05-group').length,18);
  assert.equal(c.cases.filter(x=>x.batch==='03-app-menu' || x.batch==='03-app-tooltip').length,6);
  assert.equal(c.cases.filter(x=>x.batch==='09-def-help').length,51);
  assert.equal(c.cases.filter(x=>x.batch==='08-main-help').length,1152);
  assert.ok(c.cases.filter(x=>x.id.startsWith('help-')).every(x=>!x.expected.startsWith('批准译文SHA256=')));
  assert.ok(c.cases.find(x=>x.key==='api_function_metadata.json#/replaceAsset/description' && x.locale==='zh-Hans').expected);
});
test('ToolHelp库存保持稳定ID；仅四个已批准动作引用93项，不新增实屏case',()=>{
  const current=buildCatalog(),legacy=buildCatalog({includeLegacyCases:true});
  const inventory=current.toolHelpInventory;
  assert.equal(inventory.length,198);
  assert.equal(new Set(inventory.map(item=>item.id)).size,198);
  assert.equal(new Set(inventory.map(item=>item.key)).size,66);
  assert.equal(inventory.filter(item=>item.scope==='group-reference-only').length,93);
  assert.equal(inventory.filter(item=>item.scope==='inventory-only').length,105);
  for(const item of inventory) {
    assert.equal(item.id,`toolhelp-${digest(item.key).slice(0,16)}:${item.locale}`);
    assert.ok(!('result' in item) && !('evidence' in item));
    if(item.referenceCaseId) assert.ok(current.cases.some(row=>row.id===item.referenceCaseId));
  }
  assert.equal(current.cases.filter(item=>item.batch==='03-toolhelp').length,0);
  assert.equal(legacy.legacyCases.filter(item=>item.batch==='03-toolhelp').length,198);
  for(const key of ['tool-select','tool-editshape','tool-mesh','tool-pivot']) {
    assert.equal(current.cases.filter(item=>item.id.startsWith(`${key}:`)).length,3);
  }
});
test('Timeline细格保留为观察索引；15张整窗父图承接矩阵，Null细项只留库存',()=>{
  const current=buildCatalog(),oldSchema2=buildCatalog({legacySceneScope:true});
  assert.equal(current.sceneInventory.length,195);
  const timeline=current.sceneInventory.filter(item=>item.scope==='parent-image-observation');
  const nullRows=current.sceneInventory.filter(item=>item.scope==='inventory-only');
  assert.equal(timeline.length,180);
  assert.equal(nullRows.length,15);
  assert.ok(current.sceneInventory.every(item=>!('result' in item) && !('evidence' in item)));
  const parents=current.cases.filter(item=>item.batch==='04-six-names-parent');
  assert.equal(parents.length,15);
  for(const parent of parents) {
    assert.equal(parent.observationIds.length,12);
    assert.deepEqual(parent.surfaces,['列表','时间条']);
    assert.equal(parent.identityCaseId,`fixture:${parent.locale}`);
    assert.equal(parent.fullTextCaseId,`old-file:${parent.locale}`);
    assert.equal(parent.measureDrawCaseId,`measure-draw:${parent.locale}`);
    assert.match(parent.expected,/屏外不授字形信用/);
    assert.match(parent.expected,/裁切不得越界/);
    assert.ok(parent.observationIds.every(id=>timeline.some(item=>item.id===id && item.parentCaseId===parent.id)));
  }
  assert.ok(nullRows.every(item=>item.referenceCaseId===`null-shape-opacity:${item.locale}`));
  assert.equal(current.cases.filter(item=>item.batch==='05-null-shape').length,0);
  assert.equal(oldSchema2.cases.filter(item=>item.batch==='05-null-shape').length,15);
  assert.equal(oldSchema2.cases.filter(item=>item.batch==='04-six-names').length,195);
  assert.equal(current.cases.filter(item=>item.batch==='04-six-names').length,15);
  assert.equal(current.cases.filter(item=>item.batch==='04-six-names-parent').length,15);
  assert.deepEqual(
    oldSchema2.cases.filter(item=>item.batch==='04-six-names' || item.batch==='05-null-shape').sort((a,b)=>a.id.localeCompare(b.id)),
    buildCatalog({includeLegacyCases:true}).legacyCases.filter(item=>item.batch==='04-six-names' || item.batch==='05-null-shape').sort((a,b)=>a.id.localeCompare(b.id)));
});
test('插件源键inventory完整，实屏case仅由批准清单产生',()=>{
  const current=buildCatalog(),legacy=buildCatalog({includeLegacyCases:true}),oldSchema2=buildCatalog({legacySceneScope:true});
  assert.equal(current.pluginInventory.length,324);
  const approved=current.pluginInventory.filter(item=>item.approvedRule);
  assert.equal(approved.length,69);
  assert.equal(approved.reduce((sum,item)=>sum+item.caseIds.length,0),207);
  assert.equal(current.pluginInventory.filter(item=>!item.approvedRule).length,255);
  assert.deepEqual(Object.fromEntries(['REUSE_C3_REP_FIELD','REUSE_C3_REP_NAME','REUSE_C3_FINITE_PLUGIN','REUSE_C3_CONDITION_HELP']
    .map(rule=>[rule,approved.filter(item=>item.approvedRule===rule).length])),
    {REUSE_C3_REP_FIELD:12,REUSE_C3_REP_NAME:14,REUSE_C3_FINITE_PLUGIN:21,REUSE_C3_CONDITION_HELP:22});
  assert.ok(current.pluginInventory.every(item=>item.sourceEntry.translations['zh-Hans'] &&
    item.sourceEntry.translations['zh-Hant'] && item.sourceEntry.translations.ja_JP));
  assert.ok(current.pluginInventory.every(item=>!('result' in item) && !('evidence' in item)));
  for(const item of current.pluginInventory) {
    assert.equal(item.id,`plugin-${digest(`${item.source}\0${item.key}`).slice(0,16)}`);
    assert.deepEqual(item.caseIds,item.approvedRule?
      ['zh-Hans','zh-Hant','ja_JP'].map(locale=>`key-${item.id.slice(7)}:${locale}`):[]);
    assert.ok(item.caseIds.every(id=>current.cases.some(c=>c.id===id)));
  }
  assert.equal(current.cases.length,2643);
  assert.equal(legacy.legacyCases.length,3786);
  assert.equal(oldSchema2.cases.length,2823);
  assert.equal(oldSchema2.cases.filter(c=>c.platform==='macos'||c.platform==='shared').length,2810);
  assert.equal(legacy.legacyCases.filter(c=>c.platform==='macos'||c.platform==='shared').length,3773);
  assert.equal(legacy.legacyCases.filter(c=>c.platform==='windows'||c.platform==='shared').length,3573);
  assert.equal(legacy.legacyCases.filter(c=>c.platform==='windows').length,7);
  assert.equal(legacy.legacyCases.filter(c=>c.platform==='release').length,6);
  assert.equal(legacy.legacyCases.length-legacy.legacyCases.filter(c=>c.platform==='macos'||c.platform==='shared').length,13);
  assert.equal(current.cases.filter(c=>c.platform==='macos'||c.platform==='shared').length,2630);
  assert.equal(legacy.legacyCases.filter(c=>c.platform==='macos'||c.platform==='shared').length-
    current.cases.filter(c=>c.platform==='macos'||c.platform==='shared').length,1143);
  for(const batch of ['05-plugin-panel','05-group','05-group-and-null','05-inherited-opacity']) {
    assert.equal(current.cases.filter(c=>c.batch===batch).length,legacy.legacyCases.filter(c=>c.batch===batch).length,batch);
  }
  assert.equal(current.cases.filter(c=>c.batch==='05-null-shape').length,0);
  assert.equal(legacy.legacyCases.filter(c=>c.batch==='05-null-shape').length,15);
  assert.equal(legacy.legacyCases.filter(c=>c.batch==='03-toolhelp').length,198);
  assert.equal(current.cases.filter(c=>c.batch==='03-toolhelp').length,0);
  for(const batch of ['08-main-help','09-def-help']) {
    assert.equal(current.cases.filter(c=>c.batch===batch).length,legacy.legacyCases.filter(c=>c.batch===batch).length,batch);
  }
  assert.equal(current.cases.filter(c=>c.batch==='04-six-names').length,15);
  assert.equal(current.cases.filter(c=>c.batch==='04-six-names-parent').length,15);
  assert.equal(legacy.legacyCases.filter(c=>c.batch==='04-six-names').length,195);
  for(const prefix of ['07-guide','08','09','10-demo-menu','13-switcher','14-transactions','15-package']) {
    const count=items=>items.filter(c=>c.batch===prefix||c.batch.startsWith(`${prefix}-`)).length;
    assert.equal(count(current.cases),count(legacy.legacyCases),prefix);
  }
});
test('整轮单表、禁止覆盖、平台分离、初始不可完成',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'run'); prepare({out,platform:'macos',candidate:'fixture'});
  assert.deepEqual(fs.readdirSync(out).sort(),['CHECKLIST.md','attempts.jsonl','session.json']);
  assert.throws(()=>prepare({out,platform:'macos',candidate:'fixture'}));
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'session.json')));
  assert.ok(manifest.cases.every(x=>['shared','macos'].includes(x.platform)));
  assert.equal(check(out).complete,false); assert.equal(check(out).errors.length,0);
  const file=path.join(out,'CHECKLIST.md'), id=manifest.cases[0].id;
  let text=fs.readFileSync(file,'utf8');
  text=text.replace(`| [ ] | ${id} |`,`| [x] | ${id} |`).replace('| PENDING | | |','| PASS | screenshot.png | |');
  fs.writeFileSync(file,text);
  fs.writeFileSync(path.join(out,'attempts.jsonl'),JSON.stringify({id,result:'FAIL',at:'t1',candidate:'fixture',evidence:'failure.png'})+'\n');
  assert.ok(check(out).errors.some(x=>x.includes('缺修复')));
  fs.appendFileSync(path.join(out,'attempts.jsonl'),JSON.stringify({id,result:'PASS',at:'t2',candidate:'fixed',evidence:'pass.png',fix:'修改对应显示路径',impact:'重验此路径三语'})+'\n');
  assert.equal(check(out).errors.length,0);
  fs.writeFileSync(file,text.split('\n').filter(line=>!line.includes(`| ${id} |`)).join('\n'));
  assert.ok(check(out).errors.some(x=>x.includes('漏项')));
});

test('失败→修复→复验→收口可走通；新失败撤销交接',t=>{
  const {record,closeout}=require('./checklist.js');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-flow-'));
  const out=path.join(root,'run');
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  prepare({out,platform:'release',candidate:'fixture-only'});
  const targets=JSON.parse(fs.readFileSync(path.join(out,'session.json'))).cases;
  for(const target of targets.slice(1)) record({out,id:target.id,result:'PASS',candidate:'fixture-only',evidence:'fixture-only'});
  assert.throws(()=>closeout(out));
  const base={out,id:targets[0].id,candidate:'fixture',evidence:'fixture-only'};
  record({...base,result:'FAIL'});
  assert.throws(()=>record({...base,result:'PASS'}),/修复/);
  assert.throws(()=>record({...base,result:'REUSE',note:'不能绕过失败'}),/实际复验/);
  assert.throws(()=>record({...base,result:'N/A',note:'不能绕过失败'}),/实际复验/);
  record({...base,result:'PASS',fix:'夹具修复',impact:'夹具复验'});
  assert.equal(check(out).complete,true);
  assert.ok(fs.existsSync(closeout(out).handoff));
  record({...base,result:'FAIL'});
  assert.equal(fs.existsSync(path.join(out,'HANDOFF.md')),false);
  assert.throws(()=>closeout(out));
});

test('Windows不包含macOS包项，发布不混入GUI矩阵',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-platform-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const platform of ['windows','release']) {
   const out=path.join(root,platform); prepare({out,platform,candidate:'fixture'});
   const m=JSON.parse(fs.readFileSync(path.join(out,'session.json')));
   assert.ok(m.cases.every(c=>c.platform!== 'macos'));
   if(platform==='release') assert.ok(m.cases.every(c=>c.platform==='release'));
   else assert.ok(m.cases.some(c=>c.platform==='windows'));
 }
});

test('删改冻结目标或混入其他平台不能收口',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-scope-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const out=path.join(root,'run');prepare({out,platform:'release',candidate:'fixture'});
 const file=path.join(out,'session.json');
 const m=JSON.parse(fs.readFileSync(file));m.cases=m.cases.slice(1);
 fs.writeFileSync(file,JSON.stringify(m));
 assert.ok(check(out).errors.some(e=>e.includes('目标目录')));
 m.cases.push(buildCatalog().cases.find(c=>c.platform==='macos'));
 fs.writeFileSync(file,JSON.stringify(m));
 assert.ok(check(out).errors.some(e=>e.includes('平台范围')));
});

function seedV1Run(out,{activeFail=true,inventoryFail=false,inventoryResolved=false,toolHelpFail=false}={}) {
  const catalog=buildCatalog({includeLegacyCases:true});
  const cases=catalog.legacyCases.filter(c=>c.platform==='macos'||c.platform==='shared');
  const sources={...catalog.sources};
  delete sources['tools/acceptance/plugin-acceptance-scope.json'];
  sources['tools/acceptance/catalog.js']=V1_CATALOG_SHA256;
  const manifest={schema:1,masters:catalog.masters,cases,sources,platform:'macos',candidate:'old-candidate',createdAt:'2026-10-01T00:00:00.000Z'};
  const pluginCase=cases.find(c=>c.source==='languages/native/nodes_third_party_filter.js');
  const toolHelpCase=cases.find(c=>c.batch==='03-toolhelp');
  const activeCase=cases.find(c=>!c.source.startsWith('languages/native/plugins_') && c.source!=='languages/native/nodes_third_party_filter.js');
  const failing=new Set([...(activeFail?[activeCase.id]:[]),...(inventoryFail?[pluginCase.id]:[]),...(toolHelpFail?[toolHelpCase.id]:[])]);
  const resolved=new Set(inventoryResolved?[pluginCase.id]:[]);
  const escape=value=>String(value).replaceAll('|','&#124;').replace(/[\r\n]+/g,' ');
  const lines=['# 整轮验收表','','平台：macos；候选：old-candidate','','本轮只生成这一份整表。逐项填写；同一证据可引用多项。',
    'FAIL不得勾选。修复后在attempts.jsonl保留失败及修复复验记录，再更新本表。',
    'PASS/REUSE需证据；N/A需依据与说明，不等于通过。PENDING不得收口。',
    '详细预期、主项映射、源指纹见session.json。工具仅检查记录完整性。','',
    '## 44主项导航','','| 主项 | 范围 | 本轮关联细项 |','| --- | --- | --- |'];
  for(const master of catalog.masters) lines.push(`| ${master.id} ${escape(master.title)} | ${master.platform} | 1 |`);
  lines.push('','## shared / fixture','','| 勾选 | ID | 检查项 | 结果 | 证据 | 说明 |','| --- | --- | --- | --- | --- | --- |');
  for(const item of cases) {
    const result=failing.has(item.id)?'FAIL':resolved.has(item.id)?'PASS':'PENDING';
    lines.push(`| [${result==='PASS'?'x':' '}] | ${item.id} | ${escape(item.title)} | ${result} | ${result==='PENDING'?'':'evidence/${result.toLowerCase()}.png'} | |`);
  }
  const attempts=[];
  for(const id of failing) attempts.push({id,at:'2026-10-01T00:01:00.000Z',candidate:'old-candidate',result:'FAIL',evidence:'evidence/fail.png'});
  for(const id of resolved) {
    attempts.push({id,at:'2026-10-01T00:02:00.000Z',candidate:'fixed-candidate',result:'FAIL',evidence:'evidence/fail.png'});
    attempts.push({id,at:'2026-10-01T00:03:00.000Z',candidate:'fixed-candidate',result:'PASS',evidence:'evidence/pass.png',fix:'夹具修复',impact:'实屏范围复验'});
  }
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'session.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(out,'CHECKLIST.md'),lines.join('\n')+'\n');
  fs.writeFileSync(path.join(out,'attempts.jsonl'),attempts.length?attempts.map(item=>JSON.stringify(item)).join('\n')+'\n':'');
  return {pluginCase,activeCase,toolHelpCase};
}
function seedPreAmendV2(out,{toolHelpFail=false}={}) {
  const {toolHelpCase}=seedV1Run(out,{activeFail:false});
  migrateV1Run(out);
  const migration=path.join(out,'scope-migration-v2');
  const original=JSON.parse(fs.readFileSync(path.join(migration,'original','session.json'),'utf8'));
  const parent=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  const oldToolHelp=original.cases.filter(item=>item.batch==='03-toolhelp');
  parent.cases.sort((a,b)=>a.id.localeCompare(b.id));
  parent.cases.push(...oldToolHelp);
  parent.cases.sort((a,b)=>a.id.localeCompare(b.id));
  delete parent.toolHelpInventory;
  const crosswalkFile=path.join(migration,'crosswalk.json');
  const crosswalk=JSON.parse(fs.readFileSync(crosswalkFile,'utf8'));
  let retained=0,inventoryOnly=0;
  for(const row of crosswalk.rows) {
    if(row.source==='injector/native/getpath_font_texts.inc') { row.target={type:'case',id:row.legacyId}; retained++; }
    else if(row.target.type==='case') retained++;
    else inventoryOnly++;
  }
  const crosswalkBytes=Buffer.from(JSON.stringify(crosswalk,null,2)+'\n');
  const receiptFile=path.join(migration,'receipt.json');
  const receipt=JSON.parse(fs.readFileSync(receiptFile,'utf8'));
  receipt.crosswalk.sha256=digest(crosswalkBytes);
  receipt.counts.retainedCases=retained;
  receipt.counts.inventoryOnlyCases=inventoryOnly;
  parent.scopeMigration.crosswalk.sha256=receipt.crosswalk.sha256;
  const ids=new Set(parent.cases.map(item=>item.id));
  let checklist=fs.readFileSync(path.join(migration,'original','CHECKLIST.md'),'utf8').split(/\r?\n/)
    .filter(line=>!/^\| \[[ xX]\]/.test(line)||ids.has(line.split('|')[2]?.trim()));
  const attempts=fs.readFileSync(path.join(migration,'original','attempts.jsonl'),'utf8').split(/\r?\n/).filter(Boolean)
    .filter(line=>ids.has(JSON.parse(line).id));
  let liveChecklist=[...checklist],liveAttempts=[...attempts];
  if(toolHelpFail) {
    const rowIndex=liveChecklist.findIndex(line=>line.startsWith(`| [ ] | ${toolHelpCase.id} |`));
    liveChecklist[rowIndex]=liveChecklist[rowIndex].replace('| PENDING | | |','| FAIL | evidence/fail.png | |');
    liveAttempts.push(JSON.stringify({id:toolHelpCase.id,at:'2026-10-02T00:00:00.000Z',candidate:'old-candidate',result:'FAIL',evidence:'evidence/fail.png'}));
  }
  const initialOutputs={
    'session.json':Buffer.from(JSON.stringify(parent,null,2)+'\n'),
    'CHECKLIST.md':Buffer.from(checklist.join('\n')),
    'attempts.jsonl':Buffer.from(attempts.length?`${attempts.join('\n')}\n`:''),
  };
  receipt.outputs=Object.fromEntries(Object.entries(initialOutputs).map(([name,bytes])=>[name,digest(bytes)]));
  const liveOutputs={...initialOutputs,'CHECKLIST.md':Buffer.from(liveChecklist.join('\n')),
    'attempts.jsonl':Buffer.from(liveAttempts.length?`${liveAttempts.join('\n')}\n`:'' )};
  for(const [name,bytes] of Object.entries(initialOutputs)) fs.writeFileSync(path.join(migration,'output-initial',name),bytes);
  for(const [name,bytes] of Object.entries(liveOutputs)) fs.writeFileSync(path.join(out,name),bytes);
  fs.writeFileSync(crosswalkFile,crosswalkBytes);
  fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n');
  return {toolHelpCase};
}
test('schema1迁移保存原字节、失败历史与ToolHelp inventory crosswalk，不自动勾选',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-migrate-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'v1');
  const {pluginCase,activeCase}=seedV1Run(out,{inventoryResolved:true});
  const toolHelpCase=buildCatalog({includeLegacyCases:true}).legacyCases.find(item=>item.batch==='03-toolhelp');
  const original=Object.fromEntries(['session.json','CHECKLIST.md','attempts.jsonl'].map(name=>[name,fs.readFileSync(path.join(out,name))]));
  const result=migrateV1Run(out);
  assert.equal(result.counts.oldCases,3773);
  assert.equal(result.counts.retainedCases,2810);
  assert.equal(result.counts.inventoryOnlyCases,963);
  for(const [name,bytes] of Object.entries(original)) assert.deepEqual(fs.readFileSync(path.join(out,'scope-migration-v2','original',name)),bytes);
  const receipt=JSON.parse(fs.readFileSync(result.receipt,'utf8'));
  for(const [name,bytes] of Object.entries(original)) assert.equal(receipt.originals[name].sha256,digest(bytes));
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  assert.equal(manifest.schema,2);
  assert.equal(manifest.cases.length,2810);
  assert.equal(manifest.toolHelpInventory.length,198);
  assert.equal('legacyCases' in manifest,false);
  const table=fs.readFileSync(path.join(out,'CHECKLIST.md'),'utf8');
  assert.match(table,new RegExp(`\\| \\[ \\] \\| ${activeCase.id} \\|`));
  assert.doesNotMatch(table,new RegExp(`\\| ${pluginCase.id} \\|`));
  assert.doesNotMatch(table,/^\| \[x\] /m);
  const crosswalk=JSON.parse(fs.readFileSync(result.crosswalk,'utf8')).rows;
  const removed=crosswalk.find(row=>row.legacyId===pluginCase.id);
  assert.equal(removed.target.type,'inventory');
  assert.equal(removed.prior.result,'PASS');
  assert.deepEqual(removed.attemptIndexes,[1,2]);
  const retained=crosswalk.find(row=>row.legacyId===activeCase.id);
  assert.equal(retained.target.type,'case');
  assert.equal(retained.prior.result,'FAIL');
  const movedToolHelp=crosswalk.find(row=>row.legacyId===toolHelpCase.id);
  assert.equal(movedToolHelp.target.type,'inventory');
  assert.equal(movedToolHelp.target.id,toolHelpCase.id);
  assert.equal(movedToolHelp.prior.result,'PENDING');
  amendScenes(out);
  const amended=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  assert.equal(amended.cases.length,2630);
  assert.equal(amended.sceneInventory.length,195);
  const migratedCheck=check(out);
  assert.deepEqual(migratedCheck.errors,[]);
  assert.equal(migratedCheck.complete,false);
  assert.deepEqual(fs.readFileSync(path.join(out,'scope-migration-v2','original','attempts.jsonl')),original['attempts.jsonl']);
  require('./checklist.js').record({out,id:activeCase.id,result:'PASS',candidate:'fixed-candidate',evidence:'evidence/pass.png',fix:'夹具修复',impact:'目标路径复验'});
  assert.deepEqual(check(out).errors,[]);
});
test('迁移拒绝未解决的inventory FAIL，且不触碰三份原件',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-migrate-unresolved-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'v1');seedV1Run(out,{activeFail:false,inventoryFail:true});
  const originals=Object.fromEntries(['session.json','CHECKLIST.md','attempts.jsonl'].map(name=>[name,fs.readFileSync(path.join(out,name))]));
  assert.throws(()=>migrateV1Run(out),/转入inventory的FAIL尚未实际修复并PASS/);
  for(const [name,bytes] of Object.entries(originals)) assert.deepEqual(fs.readFileSync(path.join(out,name)),bytes);
  assert.equal(fs.existsSync(path.join(out,'scope-migration-v2')),false);
});
test('迁移后删除或篡改archive及schema2初始输出会阻止收口',t=>{
  for(const damaged of ['crosswalk','original','output']) {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),`acceptance-migrate-integrity-${damaged}-`));
    try {
      const out=path.join(root,'v1');seedV1Run(out,{activeFail:false});
      const checklist=path.join(out,'CHECKLIST.md');
      const sceneIds=new Set(buildCatalog().sceneInventory.map(item=>item.id));
      fs.writeFileSync(checklist,fs.readFileSync(checklist,'utf8').split('\n').map(line=>{
        const id=line.split('|')[2]?.trim();
        return line.startsWith('| [ ] |') && !sceneIds.has(id)?
          line.replace('| [ ] |','| [x] |').replace(/\| PENDING \|[^|]*\| \|$/,'| PASS | evidence/pass.png | |'):line;
      }).join('\n'));
      const result=migrateV1Run(out);
      amendScenes(out);
      const parentCases=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8')).cases
        .filter(item=>item.batch==='04-six-names-parent');
      const {record}=require('./checklist.js');
      for(const item of parentCases) record({out,id:item.id,result:'PASS',candidate:'fixture',evidence:'evidence/pass.png'});
      const closed=check(out);
      assert.equal(closed.complete,true,JSON.stringify(closed));
      closeout(out);
      const target=damaged==='crosswalk'?result.crosswalk:damaged==='original'?
        path.join(out,'scope-migration-v2','original','session.json'):
        path.join(out,'scope-migration-v2','output-initial','CHECKLIST.md');
      if(damaged==='original') fs.rmSync(target); else fs.appendFileSync(target,' ');
      assert.ok(check(out).errors.some(error=>error.includes('迁移归档/身份链无效')));
      assert.throws(()=>closeout(out),/不可收口/);
    } finally { fs.rmSync(root,{recursive:true,force:true}); }
  }
});
test('schema2 ToolHelp amendment只移出198项，保留父迁移链与原结果',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-toolhelp-amend-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'v2'),{toolHelpCase}=seedPreAmendV2(out);
  const beforeSession=fs.readFileSync(path.join(out,'session.json'));
  const beforeChecklist=fs.readFileSync(path.join(out,'CHECKLIST.md'));
  const beforeAttempts=fs.readFileSync(path.join(out,'attempts.jsonl'));
  const parent=JSON.parse(beforeSession.toString('utf8'));
  const oldMigrationCrosswalk=fs.readFileSync(path.join(out,'scope-migration-v2','crosswalk.json'));
  const result=amendV2ToolHelpRun(out);
  assert.deepEqual(result.counts,{oldCases:3008,retainedCases:2810,inventoryOnlyCases:198,attemptsBefore:0,attemptsRetained:0});
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  assert.equal(manifest.toolHelpInventory.length,198);
  assert.equal(manifest.cases.length,2810);
  assert.deepEqual(manifest.scopeMigration,parent.scopeMigration);
  assert.equal(fs.readFileSync(path.join(out,'scope-migration-v2','crosswalk.json')).compare(oldMigrationCrosswalk),0);
  assert.deepEqual(fs.readFileSync(path.join(out,'scope-amendment-toolhelp-v1','original','session.json')),beforeSession);
  assert.deepEqual(fs.readFileSync(path.join(out,'scope-amendment-toolhelp-v1','original','CHECKLIST.md')),beforeChecklist);
  assert.deepEqual(fs.readFileSync(path.join(out,'scope-amendment-toolhelp-v1','original','attempts.jsonl')),beforeAttempts);
  const row=JSON.parse(fs.readFileSync(result.crosswalk,'utf8')).rows.find(item=>item.legacyId===toolHelpCase.id);
  assert.equal(row.target.type,'inventory');
  assert.equal(row.target.id,toolHelpCase.id);
  assert.equal(row.prior.result,'PENDING');
  amendScenes(out);
  assert.equal(JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8')).cases.length,2630);
  assert.deepEqual(check(out).errors,[]);
  assert.equal(check(out).complete,false);
});
test('ToolHelp FAIL移入inventory前必须先真实修复并PASS',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-toolhelp-fail-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'v2');seedPreAmendV2(out,{toolHelpFail:true});
  const original=Object.fromEntries(['session.json','CHECKLIST.md','attempts.jsonl'].map(name=>[name,fs.readFileSync(path.join(out,name))]));
  assert.throws(()=>amendV2ToolHelpRun(out),/转入ToolHelp inventory的FAIL尚未实际修复并PASS/);
  for(const [name,bytes] of Object.entries(original)) assert.deepEqual(fs.readFileSync(path.join(out,name)),bytes);
  assert.equal(fs.existsSync(path.join(out,'scope-amendment-toolhelp-v1')),false);
});
test('ToolHelp amendment归档与crosswalk损坏会阻止检查',t=>{
  for(const damaged of ['crosswalk','original','output']) {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),`acceptance-toolhelp-integrity-${damaged}-`));
    try {
      const out=path.join(root,'v2');seedPreAmendV2(out);amendV2ToolHelpRun(out);amendScenes(out);
      const target=damaged==='crosswalk'?path.join(out,'scope-amendment-toolhelp-v1','crosswalk.json'):
        damaged==='original'?path.join(out,'scope-amendment-toolhelp-v1','original','session.json'):
        path.join(out,'scope-amendment-toolhelp-v1','output-initial','CHECKLIST.md');
      if(damaged==='original') fs.rmSync(target); else fs.appendFileSync(target,' ');
      assert.ok(check(out).errors.some(error=>error.includes('scope amendment归档/身份链无效')));
    } finally { fs.rmSync(root,{recursive:true,force:true}); }
  }
});
test('旧schema2删除ToolHelp amendment绑定仍阻止检查',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-toolhelp-fresh-binding-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'v2');
  seedPreAmendV2(out);
  amendV2ToolHelpRun(out);
  amendScenes(out);
  const amended=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  delete amended.scopeAmendment;
  fs.writeFileSync(path.join(out,'session.json'),JSON.stringify(amended,null,2)+'\n');
  const status=check(out);
  assert.ok(status.errors.some(error=>error.includes('父链被改写')),JSON.stringify(status.errors));
});
test('schema1检查与记账都要求显式迁移',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-schema1-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const out=path.join(root,'old');fs.mkdirSync(out);
  fs.writeFileSync(path.join(out,'session.json'),JSON.stringify({schema:1,cases:[]}));
  fs.writeFileSync(path.join(out,'CHECKLIST.md'),'');fs.writeFileSync(path.join(out,'attempts.jsonl'),'');
  assert.match(check(out).errors[0],/显式 migrate/);
  assert.throws(()=>require('./checklist.js').record({out,id:'x',result:'FAIL',candidate:'x',evidence:'evidence/x.png'}),/显式执行migrate/);
});
test('迁移拒绝未知source、损坏attempt、降级FAIL和非冻结catalog',t=>{
  for(const corrupt of ['source','attempt','attempt-unknown','failure-downgrade','catalog','checklist']) {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),`acceptance-migrate-${corrupt}-`));
    try {
      const out=path.join(root,'v1'),{pluginCase}=seedV1Run(out);
      if(corrupt==='source') {
        const file=path.join(out,'session.json'),m=JSON.parse(fs.readFileSync(file));m.sources['mystery.js']='0'.repeat(64);fs.writeFileSync(file,JSON.stringify(m));
      } else if(corrupt==='catalog') {
        const file=path.join(out,'session.json'),m=JSON.parse(fs.readFileSync(file));m.sources['tools/acceptance/catalog.js']='0'.repeat(64);fs.writeFileSync(file,JSON.stringify(m));
      } else if(corrupt==='attempt') fs.writeFileSync(path.join(out,'attempts.jsonl'),'{broken json}\n');
      else if(corrupt==='attempt-unknown') fs.writeFileSync(path.join(out,'attempts.jsonl'),JSON.stringify({id:'unknown:row',result:'FAIL',at:'t',candidate:'fixture',evidence:'evidence/fail.png'})+'\n');
      else if(corrupt==='failure-downgrade') {
        const file=path.join(out,'CHECKLIST.md');
        const lines=fs.readFileSync(file,'utf8').split('\n');
        const row=lines.findIndex(line=>line.startsWith(`| [ ] | ${pluginCase.id} |`));
        lines[row]=lines[row].replace('| [ ] |','| [x] |').replace('| FAIL |','| PASS |');
        fs.writeFileSync(file,lines.join('\n'));
      } else fs.writeFileSync(path.join(out,'CHECKLIST.md'),fs.readFileSync(path.join(out,'CHECKLIST.md'),'utf8').replace(/\| \[ \] \| [^|]+ \|[^\n]*\n/,'') );
      assert.throws(()=>migrateV1Run(out),/拒绝schema1迁移/);
      assert.equal(fs.existsSync(path.join(out,'scope-migration-v2')),false);
    } finally { fs.rmSync(root,{recursive:true,force:true}); }
  }
});
