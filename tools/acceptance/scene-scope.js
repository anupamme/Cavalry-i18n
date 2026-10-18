/**
 * [INPUT]: 依赖catalog的冻结场景展开、当前父场景和原整轮三文件。
 * [OUTPUT]: 显式归档Null/Timeline范围修订，并验证父链与全部历史。
 * [POS]: 离线表单范围纠偏；不删除观察索引，不授产品通过。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {buildCatalog,sortCases}=require('./catalog.js');
const {verifyMigrationProvenance,verifyScopeAmendment,scopeInternals:s}=require('./migration.js');
const DIR='scope-amendment-scenes-v1',KIND='scene-observations-to-parent-v1';
const fail=message=>{throw new Error(`拒绝场景范围修订：${message}`);};
const bytes=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
function baseErrors(out,manifest,sessionBytes) {
  return manifest.scopeAmendment?verifyScopeAmendment(out,manifest,{sessionBytes}):verifyMigrationProvenance(out,manifest,{sessionBytes});
}
function inventory(catalog) {return new Map((catalog.sceneInventory||[]).map(item=>[item.id,item]));}
function crosswalk(parent,next,state) {
  const cases=new Map(next.cases.map(item=>[item.id,item])),observations=inventory(next);
  return s.byId(parent.cases).map(item=>{
    const row=state.rows.get(item.id),history=state.byId.get(item.id)||[];
    if (cases.has(item.id)) {
      if (s.canonical(cases.get(item.id))!==s.canonical(item)) fail(`保留case变化：${item.id}`);
    } else {
      const target=observations.get(item.id);
      if (!['04-six-names','05-null-shape'].includes(item.batch) || !target ||
          target.source!==item.source || target.key!==item.key || target.locale!==item.locale) fail(`未知转出项：${item.id}`);
      // 本修订只纠正尚未记账的展开项，不能丢失结果或失败历史。
      if (row.result!=='PENDING' || history.length) fail(`转出项已有结果或历史：${item.id}`);
    }
    return {legacyId:item.id,source:item.source,key:item.key,locale:item.locale,
      target:{type:cases.has(item.id)?'case':'inventory',id:item.id},
      prior:{result:row.result,evidence:row.evidence,note:row.note,checked:row.mark.toLowerCase()==='[x]'},
      attemptIndexes:history.map(entry=>entry.index)};
  });
}
function verifySceneScope(out,manifest) {
  const binding=manifest.sceneScopeAmendment,errors=[];
  if (!binding) {
    if (fs.existsSync(path.join(out,DIR))) errors.push('场景范围归档存在但session缺绑定');
    return [...errors,...baseErrors(out,manifest,null)];
  }
  const error=message=>errors.push(`场景范围归档无效：${message}`);
  try {
    if (manifest.schema!==2 || binding.schema!==1 || binding.kind!==KIND) fail('修订身份不符');
    const read=(relative,expected,hash)=>{
      if (relative!==expected || !/^[a-f0-9]{64}$/.test(hash||'')) fail(`路径或SHA不符：${expected}`);
      const entry=s.readRegularFile(path.join(out,relative));
      if (s.sha(entry.bytes)!==hash) fail(`字节SHA不符：${expected}`);
      return entry.bytes;
    };
    for (const sub of ['', '/original','/output-initial']) {
      const stat=fs.lstatSync(path.join(out,DIR+sub));
      if (!stat.isDirectory() || stat.isSymbolicLink()) fail('归档目录不是普通目录');
    }
    if (Object.keys(binding.originals||{}).sort().join('|')!==[...s.RUN_FILES].sort().join('|')) fail('父原件不全');
    const originals=Object.fromEntries(s.RUN_FILES.map(name=>[name,read(binding.originals[name]?.path,
      `${DIR}/original/${name}`,binding.originals[name]?.sha256)]));
    const parent=JSON.parse(originals['session.json']);
    if (parent.sceneScopeAmendment || parent.schema!==2 || parent.platform!==manifest.platform || parent.candidate!==manifest.candidate) fail('父整轮身份不符');
    if (s.canonical(parent.scopeMigration)!==s.canonical(manifest.scopeMigration) ||
        s.canonical(parent.scopeAmendment)!==s.canonical(manifest.scopeAmendment)) fail('父链被改写');
    errors.push(...baseErrors(out,parent,originals['session.json']));
    const archived=s.readRegularFile(path.join(out,`${DIR}/receipt.json`)).bytes;
    if (binding.receipt?.path!==`${DIR}/receipt.json`) fail('receipt路径不符');
    const receipt=JSON.parse(archived);
    if (receipt.kind!==KIND || receipt.schema!==1 || !/^[a-f0-9]{64}$/.test(receipt.scriptSha256||'')) fail('receipt身份损坏');
    if (s.canonical(receipt.originals)!==s.canonical(binding.originals) ||
        s.canonical(receipt.crosswalk)!==s.canonical(binding.crosswalk)) fail('receipt绑定不符');
    const mappings=JSON.parse(read(binding.crosswalk?.path,`${DIR}/crosswalk.json`,binding.crosswalk?.sha256));
    const initial=Object.fromEntries(s.RUN_FILES.map(name=>[name,read(`${DIR}/output-initial/${name}`,
      `${DIR}/output-initial/${name}`,receipt.outputs?.[name])]));
    if (!initial['session.json'].equals(fs.readFileSync(path.join(out,'session.json')))) fail('当前session偏离初始修订身份');
    const parentAttempts=s.parseAttempts(originals['attempts.jsonl'].toString('utf8'));
    const parentState=s.parseChecklist(originals['CHECKLIST.md'].toString('utf8'),parent.cases,parentAttempts.map(a=>a.record));
    const expected=crosswalk(parent,manifest,parentState);
    const added=manifest.cases.filter(c=>!parent.cases.some(p=>p.id===c.id));
    if (added.length!==15 || added.some(c=>c.batch!=='04-six-names-parent')) fail('新增父场景集不符');
    if (s.canonical(mappings)!==s.canonical({schema:1,rows:expected,parentCases:added.map(c=>c.id)})) fail('crosswalk映射不符');
    if (!originals['attempts.jsonl'].equals(initial['attempts.jsonl'])) fail('既有attempts被改写');
    const state=s.parseChecklist(initial['CHECKLIST.md'].toString('utf8'),manifest.cases,parentAttempts.map(a=>a.record));
    for (const row of expected.filter(r=>r.target.type==='case')) {
      const before=parentState.rows.get(row.legacyId),after=state.rows.get(row.legacyId);
      if (s.canonical([before.result,before.evidence,before.note,before.mark])!==s.canonical([after.result,after.evidence,after.note,after.mark])) fail('保留结果被改写');
    }
    if (added.some(c=>state.rows.get(c.id)?.result!=='PENDING')) fail('父场景被自动授结果');
    const counts={before:parent.cases.length,after:manifest.cases.length,observations:expected.filter(r=>r.target.type==='inventory').length,parents:added.length,attempts:parentAttempts.length};
    if (s.canonical(counts)!==s.canonical(receipt.counts)) fail('receipt数量不符');
  } catch(cause) {error(cause.message);}
  return errors;
}
function amendScenes(out) {
  if (!out) fail('需要--out');
  out=path.resolve(out);
  const stat=fs.lstatSync(out);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('目标不是普通目录');
  if (fs.existsSync(path.join(out,DIR)) || fs.existsSync(path.join(out,'HANDOFF.md'))) fail('已有归档或交接账');
  const original=Object.fromEntries(s.RUN_FILES.map(name=>[name,s.readRegularFile(path.join(out,name))]));
  const parent=JSON.parse(original['session.json'].bytes);
  if (parent.schema!==2 || parent.sceneScopeAmendment) fail('只支持未修订的schema2');
  const errors=baseErrors(out,parent,original['session.json'].bytes);
  if (errors.length) fail(errors.join('；'));
  const current=buildCatalog(),legacy=buildCatalog({legacySceneScope:true});
  if (s.canonical(s.byId(s.selected(legacy.cases,parent.platform)))!==s.canonical(s.byId(parent.cases))) fail('父case不是冻结场景展开');
  for (const [file,hash] of Object.entries(legacy.sources)) if (file!=='tools/acceptance/catalog.js' && parent.sources?.[file]!==hash) fail(`父源漂移：${file}`);
  if (Object.keys(legacy.sources).length!==Object.keys(parent.sources||{}).length) fail('父源集合变化');
  for (const key of ['pluginInventory','toolHelpInventory']) if (s.canonical(parent[key])!==s.canonical(current[key])) fail(`${key}变化`);
  const attempts=s.parseAttempts(original['attempts.jsonl'].bytes.toString('utf8'));
  const state=s.parseChecklist(original['CHECKLIST.md'].bytes.toString('utf8'),parent.cases,attempts.map(a=>a.record));
  const next={...parent,...current,cases:sortCases(s.selected(current.cases,parent.platform)),sceneScopeAmendedAt:new Date().toISOString()};
  const rows=crosswalk(parent,next,state),newCases=next.cases.filter(c=>!state.rows.has(c.id));
  if (rows.filter(r=>r.target.type==='inventory').length!==195 || newCases.length!==15) fail('修订数量不是195观察项/15父场景');
  const mapping=bytes({schema:1,rows,parentCases:newCases.map(c=>c.id)});
  const binding={schema:1,kind:KIND,originals:Object.fromEntries(s.RUN_FILES.map(name=>[name,{path:`${DIR}/original/${name}`,sha256:s.sha(original[name].bytes)}])),
    crosswalk:{path:`${DIR}/crosswalk.json`,sha256:s.sha(mapping)},receipt:{path:`${DIR}/receipt.json`}};
  next.sceneScopeAmendment=binding;
  const lines=original['CHECKLIST.md'].bytes.toString('utf8').split(/\r?\n/).filter(line=>!/^\| \[[ xX]\]/.test(line) || next.cases.some(c=>c.id===line.split('|')[2]?.trim())).map(line=>{
    const master=next.masters.find(m=>line.startsWith(`| ${m.id} `));
    if (!master) return line;
    const count=next.cases.filter(c=>c.masters.includes(master.id)).length;
    return `| ${master.id} ${s.escapeCell(master.title)} | ${master.platform} | ${count || '另阶段交接'} |`;
  });
  lines.push('', '## Timeline父场景（观察索引留在session.sceneInventory）','', '| 勾选 | ID | 检查项 | 结果 | 证据 | 说明 |','| --- | --- | --- | --- | --- | --- |');
  for (const c of newCases) lines.push(`| [ ] | ${c.id} | ${s.escapeCell(c.title)} | PENDING | | |`);
  const output={'session.json':bytes(next),'CHECKLIST.md':Buffer.from(lines.join('\n')),'attempts.jsonl':original['attempts.jsonl'].bytes};
  const receipt={schema:1,kind:KIND,scriptSha256:s.sha(fs.readFileSync(__filename)),originals:binding.originals,crosswalk:binding.crosswalk,
    outputs:Object.fromEntries(s.RUN_FILES.map(name=>[name,s.sha(output[name])])),
    counts:{before:parent.cases.length,after:next.cases.length,observations:195,parents:newCases.length,attempts:attempts.length}};
  let created=false;
  try {
    fs.mkdirSync(path.join(out,DIR));created=true;
    fs.mkdirSync(path.join(out,DIR,'original'));fs.mkdirSync(path.join(out,DIR,'output-initial'));
    for (const name of s.RUN_FILES) {
      fs.writeFileSync(path.join(out,DIR,'original',name),original[name].bytes,{mode:original[name].mode});
      fs.writeFileSync(path.join(out,DIR,'output-initial',name),output[name],{mode:original[name].mode});
      if (s.sha(fs.readFileSync(path.join(out,DIR,'original',name)))!==binding.originals[name].sha256 ||
          s.sha(fs.readFileSync(path.join(out,DIR,'output-initial',name)))!==receipt.outputs[name]) fail('归档字节不符');
    }
    fs.writeFileSync(path.join(out,DIR,'crosswalk.json'),mapping);
    fs.writeFileSync(path.join(out,DIR,'receipt.json'),bytes(receipt));
    for (const name of s.RUN_FILES) fs.writeFileSync(path.join(out,name+'.scenes.tmp'),output[name],{mode:original[name].mode});
    for (const name of s.RUN_FILES) fs.renameSync(path.join(out,name+'.scenes.tmp'),path.join(out,name));
    const verify=verifySceneScope(out,next);
    if (verify.length) fail(verify.join('；'));
  } catch(cause) {
    for (const name of s.RUN_FILES) {
      fs.rmSync(path.join(out,name+'.scenes.tmp'),{force:true});
      if (created) fs.writeFileSync(path.join(out,name),original[name].bytes,{mode:original[name].mode});
    }
    if (created) fs.rmSync(path.join(out,DIR),{recursive:true,force:true});
    throw cause;
  }
  return {amended:true,out,...receipt.counts};
}
module.exports={amendScenes,verifySceneScope};
