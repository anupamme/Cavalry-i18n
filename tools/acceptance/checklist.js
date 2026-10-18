#!/usr/bin/env node
/**
 * [INPUT]: 依赖schema2 case、source inventory与人工填写的整轮表单。
 * [OUTPUT]: 生成、记账、检查与收口整轮表；提供显式scope迁移与父场景修订入口。
 * [POS]: 离线验收入口；不执行产品，不替人工授予显示PASS。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { buildCatalog, sortCases } = require('./catalog.js');
const { migrateV1Run, amendV2ToolHelpRun } = require('./migration.js');
const {amendScenes,verifySceneScope}=require('./scene-scope.js');
const runsRoot = path.join(__dirname, 'runs');
const repoRoot = path.resolve(__dirname, '../..');
const escape = value => String(value).replaceAll('|', '&#124;').replace(/[\r\n]+/g, ' ');
function prepare({out, platform, candidate}) {
  out = path.resolve(out || path.join(runsRoot, new Date().toISOString().replace(/[:.]/g,'-')));
  const inRepo = !path.relative(repoRoot,out).startsWith('..');
  const inRuns = path.relative(runsRoot,out);
  if (inRepo && (inRuns === '' || inRuns.startsWith('..') || path.isAbsolute(inRuns))) throw new Error('仓库内副本只能放tools/acceptance/runs/<本轮编号>');
  if (!['macos','windows','release'].includes(platform) || !candidate || !out) {
    throw new Error('需要out、platform(macos/windows/release)、candidate');
  }
  const catalog = buildCatalog();
  const cases = sortCases(catalog.cases.filter(c => c.platform === platform || (platform !== 'release' && c.platform === 'shared')));
  const manifest = {...catalog, cases, platform, candidate, createdAt:new Date().toISOString()};
  const lines = ['# 整轮验收表', '', `平台：${platform}；候选：${escape(candidate)}`, '',
    '本轮只生成这一份整表。逐项填写；同一证据可引用多项。',
    'FAIL不得勾选。修复后在attempts.jsonl保留失败及修复复验记录，再更新本表。',
    'PASS/REUSE需证据；N/A需依据与说明，不等于通过。PENDING不得收口。',
    '详细预期、主项映射、源指纹见session.json。工具仅检查记录完整性。', ''];
  lines.push('## 44主项导航', '', '细项可关联多个主项；下面数量不相加，不代表验收次数。', '', '| 主项 | 范围 | 本轮关联细项 |', '| --- | --- | --- |');
  for (const master of catalog.masters) {
    const count=cases.filter(c=>c.masters.includes(master.id)).length;
    lines.push(`| ${master.id} ${escape(master.title)} | ${master.platform} | ${count || '另阶段交接'} |`);
  }
  let group;
  for (const c of cases) {
    const next = `${c.locale} / ${c.batch}`;
    if (next !== group) {
      lines.push('', `## ${next}`, '', '| 勾选 | ID | 检查项 | 结果 | 证据 | 说明 |', '| --- | --- | --- | --- | --- | --- |');
      group = next;
    }
    lines.push(`| [ ] | ${c.id} | ${escape(c.title)} | PENDING | | |`);
  }
  fs.mkdirSync(path.dirname(out), {recursive:true});
  fs.mkdirSync(out, {recursive:false});
  fs.writeFileSync(path.join(out,'session.json'), JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(out,'CHECKLIST.md'), lines.join('\n')+'\n');
  fs.writeFileSync(path.join(out,'attempts.jsonl'), '');
  return {cases:cases.length, out};
}
function check(out) {
  const manifest = JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  if (manifest.schema !== 2) return {complete:false,counts:{},errors:['schema 1须先执行显式 migrate；检查器不会静默改写旧表']};
  const attempts = fs.readFileSync(path.join(out,'attempts.jsonl'),'utf8').split('\n').filter(s=>s.trim()).map(s=>JSON.parse(s));
  const expected = new Set(manifest.cases.map(c=>c.id));
  const seen = new Set(), errors = [], counts = {};
  errors.push(...verifySceneScope(out,manifest));
  const current=buildCatalog();
  const selected=current.cases.filter(c=>c.platform===manifest.platform || (manifest.platform!=='release' && c.platform==='shared'));
  const canonical=items=>JSON.stringify([...items].sort((a,b)=>a.id.localeCompare(b.id)));
  if (!['macos','windows','release'].includes(manifest.platform) || canonical(selected)!==canonical(manifest.cases)) errors.push('目标目录或平台范围已变更，先对账，不得删项收口');
  if (JSON.stringify(current.pluginInventory)!==JSON.stringify(manifest.pluginInventory)) errors.push('插件source-key inventory已变化，先对账，不得删项收口');
  if (JSON.stringify(current.toolHelpInventory)!==JSON.stringify(manifest.toolHelpInventory)) errors.push('ToolHelp source-key inventory已变化，先对账，不得删项收口');
  if (JSON.stringify(current.sceneInventory)!==JSON.stringify(manifest.sceneInventory)) errors.push('场景观察索引已变化，先对账');
  if (JSON.stringify(current.sources)!==JSON.stringify(manifest.sources)) errors.push('目标源指纹已变化，须对账并生成新轮，复用未受影响证据');
  for (const a of attempts) {
    if (!expected.has(a.id) || !['FAIL','PASS','REUSE','N/A'].includes(a.result) || !a.evidence || !a.at || !a.candidate) errors.push('无效复验记录');
  }
  for (const line of fs.readFileSync(path.join(out,'CHECKLIST.md'),'utf8').split('\n')) {
    if (!/^\| \[[ xX]\]/.test(line)) continue;
    const [mark,id,,result,evidence,note] = line.split('|').slice(1,-1).map(s=>s.trim());
    if (!expected.has(id) || seen.has(id)) errors.push(`未知或重复项 ${id}`);
    seen.add(id); counts[result]=(counts[result]||0)+1;
    if (!['PENDING','FAIL','PASS','REUSE','N/A'].includes(result)) errors.push(`无效结果 ${id}`);
    const closed = ['PASS','REUSE','N/A'].includes(result);
    if ((mark.toLowerCase()==='[x]') !== closed) errors.push(`勾选与结果不符 ${id}`);
    if (closed && !evidence) errors.push(`缺证据 ${id}`);
    if (['REUSE','N/A'].includes(result) && !note) errors.push(`缺适用性说明 ${id}`);
    const history = attempts.filter(a=>a.id===id);
    if (result==='FAIL' && !history.some(a=>a.result==='FAIL')) errors.push(`失败未留档 ${id}`);
    if (['PASS','REUSE','N/A'].includes(result) && history.some(a=>a.result==='FAIL')) {
      const last=history.at(-1);
      if (result!=='PASS' || last.result!=='PASS' || !last.fix || !last.impact) errors.push(`缺修复、影响范围或通过复验 ${id}`);
    }
  }
  for (const id of expected) if (!seen.has(id)) errors.push(`漏项 ${id}`);
  return {complete:!errors.length && !counts.PENDING && !counts.FAIL, counts, errors};
}
// -- 单表记账与收口 ------------------------------------------
function record({out,id,result,evidence,note='',candidate,fix='',impact=''}) {
  if (!['FAIL','PASS','REUSE','N/A'].includes(result) || !evidence || !candidate) throw new Error('结果、证据和实际候选不能为空');
  if (['REUSE','N/A'].includes(result) && !note) throw new Error('复用或不适用需说明依据');
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  if (manifest.schema!==2) throw new Error('schema 1只读；先显式执行migrate，不在旧表记账');
  const target=manifest.cases.find(c=>c.id===id);
  if (!target) throw new Error('未知检查项');
  const historyFile=path.join(out,'attempts.jsonl');
  const history=fs.readFileSync(historyFile,'utf8').split('\n').filter(Boolean).map(s=>JSON.parse(s));
  if (history.some(a=>a.id===id && a.result==='FAIL') && ['PASS','REUSE','N/A'].includes(result)) {
    if (result!=='PASS' || !fix || !impact) throw new Error('失败项须修复、记录影响范围并实际复验PASS');
  }
  const file=path.join(out,'CHECKLIST.md');
  let found=0;
  const text=fs.readFileSync(file,'utf8').split('\n').map(line=>{
    if (!line.startsWith('| [') || line.split('|')[2]?.trim()!==id) return line;
    found++;
    return `| [${result==='FAIL'?' ':'x'}] | ${id} | ${escape(target.title)} | ${result} | ${escape(evidence)} | ${escape(note)} |`;
  }).join('\n');
  if (found!==1) throw new Error('表单缺项或重复，不能记账');
  fs.appendFileSync(historyFile,JSON.stringify({id,at:new Date().toISOString(),candidate,result,evidence,note,fix,impact})+'\n');
  fs.writeFileSync(file,text);
  // 新记录使旧交接账失效，必须重新收口。
  fs.rmSync(path.join(out,'HANDOFF.md'),{force:true});
  return {id,result};
}
function closeout(out) {
  const status=check(out);
  if (!status.complete) throw new Error(`不可收口：${JSON.stringify(status)}`);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'session.json'),'utf8'));
  const next=manifest.platform==='macos'?'Windows平台整轮验收':manifest.platform==='windows'?'三平台编译/产物及发布授权核对':'确认发布后实际下载证据';
  fs.writeFileSync(path.join(out,'HANDOFF.md'),[
    '# 本轮交接账', '', `平台：${manifest.platform}`, `起始候选：${manifest.candidate}`,
    `记录统计：${JSON.stringify(status.counts)}`, '',
    '本账表示表单已收齐，不自动证明证据真实或允许发布。',
    '修复后的候选、影响范围与复验记录见attempts.jsonl。',
    'N/A仍是不适用，不计作实际通过；REUSE需人工确认适用性。',
    `下一阶段：${next}。不继承本平台实机PASS。`,
    '交接整轮目录；截图、日志和填写副本不提交Git。',''
  ].join('\n'));
  return {complete:true,handoff:path.join(out,'HANDOFF.md')};
}
if (require.main===module) {
  try {
    const [command,...args]=process.argv.slice(2), options={};
    for (let i=0;i<args.length;i+=2) options[args[i].replace(/^--/,'')]=args[i+1];
    const result=command==='prepare' ? prepare(options) : command==='migrate' ? migrateV1Run(options.out) : command==='amend-scenes' ? amendScenes(options.out) : command==='amend-toolhelp' ? amendV2ToolHelpRun(options.out) : command==='check' ? check(options.out) : command==='record' ? record(options) : command==='closeout' ? closeout(options.out) : null;
    if (!result) throw new Error('prepare --out <新目录> --platform macos|windows|release --candidate <候选标识>；migrate --out <已有schema1目录>；amend-toolhelp --out <已有schema2目录>；amend-scenes --out <已有schema2目录>；record --out <本轮目录> --id <细项> --result PASS|FAIL|REUSE|N/A --candidate <实际候选> --evidence <证据>；check/closeout --out <本轮目录>');
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if (command==='check' && !result.complete) process.exitCode=1;
  } catch(error) { process.stderr.write(error.message+'\n'); process.exitCode=1; }
}
module.exports={prepare,check,record,closeout,migrateV1Run,amendV2ToolHelpRun,amendScenes};
