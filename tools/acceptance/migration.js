/**
 * [INPUT]: 依赖冻结schema1/2整轮副本、scope源指纹与人工状态记录。
 * [OUTPUT]: 归档原字节，写入scope crosswalk与可核验身份链。
 * [POS]: 离线迁移边界；inventory移出验收表前拒绝未解决FAIL。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {buildCatalog,sortCases} = require('./catalog.js');

// -- v1目录hash来自冻结macOS session3773，不接受其他来源 ----------------
const V1_CATALOG_SHA256 = '4804fda8dbdaf64e595108c8ce3865a45159479063010a9fb3de12223eb90c6d';
const SCOPE_SOURCE = 'tools/acceptance/plugin-acceptance-scope.json';
const MIGRATION_DIR = 'scope-migration-v2';
const AMENDMENT_DIR = 'scope-amendment-toolhelp-v1';
const TOOLHELP_SOURCE = 'injector/native/getpath_font_texts.inc';
const RUN_FILES = ['session.json','CHECKLIST.md','attempts.jsonl'];
const RESULTS = new Set(['PENDING','FAIL','PASS','REUSE','N/A']);
const ATTEMPT_RESULTS = new Set(['FAIL','PASS','REUSE','N/A']);
const sha = value => require('node:crypto').createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(normalize(value));
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort()
    .filter(key => value[key] !== undefined).map(key => [key,normalize(value[key])]));
  return value;
}
function escapeCell(value) { return String(value).replaceAll('|','&#124;').replace(/[\r\n]+/g,' '); }
function fail(message) { throw new Error(`拒绝schema1迁移：${message}`); }
function readRegularFile(file) {
  const stat=fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`不是普通文件：${path.basename(file)}`);
  return {bytes:fs.readFileSync(file),mode:stat.mode & 0o777};
}
function selected(items,platform) {
  return items.filter(item=>item.platform===platform || (platform!=='release' && item.platform==='shared'));
}
const byId = items => [...items].sort((a,b)=>a.id.localeCompare(b.id));
function checkSourceLineage(oldSources,currentSources) {
  if (!oldSources || typeof oldSources!=='object' || Array.isArray(oldSources)) fail('sources缺失');
  const oldKeys=Object.keys(oldSources).sort();
  const expectedKeys=Object.keys(currentSources).filter(key=>key!==SCOPE_SOURCE).sort();
  if (canonical(oldKeys)!==canonical(expectedKeys)) fail('v1源文件集合未知或已漂移');
  if (oldSources['tools/acceptance/catalog.js']!==V1_CATALOG_SHA256) fail('catalog.js不是冻结schema1版本');
  for (const key of expectedKeys) {
    if (key==='tools/acceptance/catalog.js') continue;
    if (oldSources[key]!==currentSources[key]) fail(`源指纹变化：${key}`);
  }
}
function parseChecklist(text,cases,attempts) {
  const expected=new Map(cases.map(item=>[item.id,item]));
  const rows=new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!/^\| \[[ xX]\]/.test(line)) continue;
    const fields=line.split('|').slice(1,-1).map(value=>value.trim());
    if (fields.length!==6) fail('CHECKLIST行列损坏');
    const [mark,id,title,result,evidence,note]=fields;
    const item=expected.get(id);
    if (!item || rows.has(id)) fail(`CHECKLIST包含未知或重复ID：${id}`);
    if (title!==escapeCell(item.title) || !RESULTS.has(result)) fail(`CHECKLIST目标或结果损坏：${id}`);
    const closed=['PASS','REUSE','N/A'].includes(result);
    if ((mark.toLowerCase()==='[x]')!==closed) fail(`CHECKLIST勾选与结果不符：${id}`);
    if (result!=='PENDING' && !evidence) fail(`结果缺证据：${id}`);
    if (['REUSE','N/A'].includes(result) && !note) fail(`复用或N/A缺说明：${id}`);
    rows.set(id,{mark,id,title,result,evidence,note,line});
  }
  for (const id of expected.keys()) if (!rows.has(id)) fail(`CHECKLIST漏项：${id}`);
  const byId=new Map();
  attempts.forEach((attempt,index)=>{
    if (!expected.has(attempt.id) || !ATTEMPT_RESULTS.has(attempt.result) ||
        !attempt.at || !attempt.candidate || !attempt.evidence) fail(`attempts记录损坏或未知：${attempt.id}`);
    const history=byId.get(attempt.id)||[];
    history.push({attempt,index}); byId.set(attempt.id,history);
  });
  for (const [id,row] of rows) {
    const history=byId.get(id)||[];
    if (row.result==='FAIL' && !history.some(entry=>entry.attempt.result==='FAIL')) fail(`FAIL没有历史记录：${id}`);
    if (['PASS','REUSE','N/A'].includes(row.result) && history.some(entry=>entry.attempt.result==='FAIL')) {
      const last=history.at(-1)?.attempt;
      if (row.result!=='PASS' || last?.result!=='PASS' || !last.fix || !last.impact) fail(`失败后状态被降级：${id}`);
    }
  }
  return {rows,byId};
}
function parseAttempts(text) {
  const rawLines=text.split(/\r?\n/).filter(line=>line.trim());
  const records=rawLines.map((line,index)=>{
    let record;
    try { record=JSON.parse(line); } catch { fail(`attempts.jsonl第${index+1}行不是JSON`); }
    return {line,record};
  });
  return records;
}
function validateSourceCases(legacyCases,inventory,toolHelpInventory) {
  const byPair=new Map(inventory.map(item=>[`${item.source}\0${item.key}`,item]));
  const byToolId=new Map(toolHelpInventory.map(item=>[item.id,item]));
  const ids=new Set();
  for (const item of legacyCases) {
    if (ids.has(item.id)) fail(`v1 catalog重复ID：${item.id}`);
    ids.add(item.id);
    if (item.source?.startsWith('languages/native/plugins_') || item.source==='languages/native/nodes_third_party_filter.js') {
      if (!byPair.has(`${item.source}\0${item.key}`)) fail(`插件case无法映射inventory：${item.id}`);
    }
    if (item.source===TOOLHELP_SOURCE) {
      const target=byToolId.get(item.id);
      if (!target || target.source!==item.source || target.key!==item.key || target.locale!==item.locale) {
        fail(`ToolHelp case无法映射inventory：${item.id}`);
      }
    }
  }
}
function verifyMigrationProvenance(out,manifest,{sessionBytes=null}={}) {
  const errors=[];
  const directory=path.join(out,MIGRATION_DIR);
  const hasDirectory=fs.existsSync(directory);
  const provenance=manifest.scopeMigration;
  const error=message=>errors.push(`迁移归档/身份链无效：${message}`);
  if (!provenance) {
    if (hasDirectory) error('session.json没有scopeMigration绑定');
    return errors;
  }
  if (manifest.schema!==2 || provenance.schema!==1 || provenance.kind!=='plugin-scope-v1-to-v2') error('schema或迁移类型不符');
  try {
    const dirStat=fs.lstatSync(directory);
    if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) { error('迁移目录不是普通目录'); return errors; }
    const readBound=(relative,expectedPath,expectedSha,label)=>{
      if (relative!==expectedPath || !/^[a-f0-9]{64}$/.test(expectedSha||'')) { error(`${label}路径或SHA绑定损坏`); return null; }
      const file=path.join(out,relative),stat=fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) { error(`${label}不是普通文件`); return null; }
      const bytes=fs.readFileSync(file);
      if (sha(bytes)!==expectedSha) error(`${label}SHA不符`);
      return bytes;
    };
    const expectedOriginals={},originalBytes={},initialOutputBytes={};
    if (!provenance.originals || Object.keys(provenance.originals).sort().join('|')!==[...RUN_FILES].sort().join('|')) error('原件清单不全');
    for (const name of RUN_FILES) {
      const item=provenance.originals?.[name];
      const expectedPath=`${MIGRATION_DIR}/original/${name}`;
      originalBytes[name]=readBound(item?.path,expectedPath,item?.sha256,`原件${name}`);
      expectedOriginals[name]={path:expectedPath,sha256:item?.sha256};
    }
    const expectedCrosswalkPath=`${MIGRATION_DIR}/crosswalk.json`;
    const crosswalkBytes=readBound(provenance.crosswalk?.path,expectedCrosswalkPath,
      provenance.crosswalk?.sha256,'crosswalk');
    const expectedReceiptPath=`${MIGRATION_DIR}/receipt.json`;
    let receiptBytes=null;
    if (provenance.receipt?.path!==expectedReceiptPath) error('receipt路径不符');
    else {
      const file=path.join(out,expectedReceiptPath),stat=fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) error('receipt不是普通文件');
      else receiptBytes=fs.readFileSync(file);
    }
    for (const relative of [`${MIGRATION_DIR}/original`,`${MIGRATION_DIR}/output-initial`]) {
      const stat=fs.lstatSync(path.join(out,relative));
      if (!stat.isDirectory() || stat.isSymbolicLink()) error(`迁移子目录损坏：${relative}`);
    }
    // Receipt自包含新输出hash，故manifest只绑定receipt固定路径。
    if (receiptBytes) {
      const receipt=JSON.parse(receiptBytes.toString('utf8'));
      if (receipt.schema!==1 || receipt.kind!=='plugin-scope-v1-to-v2' ||
          !/^[a-f0-9]{64}$/.test(receipt.migrationScriptSha256||'')) error('receipt身份字段损坏');
      if (canonical(receipt.originals)!==canonical(expectedOriginals)) error('receipt原件绑定与session不符');
      if (canonical(receipt.crosswalk)!==canonical({path:expectedCrosswalkPath,sha256:provenance.crosswalk?.sha256})) error('receipt crosswalk绑定与session不符');
      const outputHashes=receipt.outputs;
      if (!outputHashes || Object.keys(outputHashes).sort().join('|')!==[...RUN_FILES].sort().join('|')) error('迁移输出SHA清单不全');
      for (const name of RUN_FILES) {
        const outputPath=`${MIGRATION_DIR}/output-initial/${name}`;
        initialOutputBytes[name]=readBound(outputPath,outputPath,outputHashes?.[name],`迁移输出${name}`);
      }
      const liveManifest=sessionBytes || fs.readFileSync(path.join(out,'session.json'));
      if (sha(liveManifest)!==outputHashes?.['session.json']) error('当前session.json偏离迁移身份');
      if (crosswalkBytes) {
        const crosswalk=JSON.parse(crosswalkBytes.toString('utf8'));
        const rows=crosswalk.rows;
        const ids=new Set(),cases=new Map((manifest.cases||[]).map(item=>[item.id,item]));
        const inventory=new Map([...(manifest.pluginInventory||[]),...(manifest.toolHelpInventory||[])].map(item=>[item.id,item]));
        if (crosswalk.schema!==1 || !Array.isArray(rows) || rows.length!==receipt.counts?.oldCases) error('crosswalk行集损坏');
        const oldManifest=JSON.parse(originalBytes['session.json'].toString('utf8'));
        const oldAttempts=parseAttempts(originalBytes['attempts.jsonl'].toString('utf8'));
        if (oldManifest.schema!==1 || oldManifest.platform!==manifest.platform ||
            oldManifest.candidate!==manifest.candidate || !Array.isArray(oldManifest.cases)) error('原schema1身份与新表不符');
        const oldCases=new Map(oldManifest.cases.map(item=>[item.id,item]));
        if (oldCases.size!==oldManifest.cases.length) error('原schema1 case ID重复');
        const originalState=parseChecklist(originalBytes['CHECKLIST.md'].toString('utf8'),
          oldManifest.cases,oldAttempts.map(item=>item.record));
        let inventoryRows=0,caseRows=0;
        for (const row of rows||[]) {
          if (!row.legacyId || ids.has(row.legacyId) || !RESULTS.has(row.prior?.result) || !Array.isArray(row.attemptIndexes)) { error('crosswalk行损坏'); break; }
          ids.add(row.legacyId);
          const oldItem=oldCases.get(row.legacyId);
          const priorRow=originalState.rows.get(row.legacyId);
          const priorAttempts=originalState.byId.get(row.legacyId)||[];
          if (!oldItem || row.source!==oldItem.source || row.key!==oldItem.key || (row.locale||null)!==(oldItem.locale||null)) error(`crosswalk原case映射不符：${row.legacyId}`);
          if (!priorRow || canonical(row.prior)!==canonical({result:priorRow.result,evidence:priorRow.evidence,
              note:priorRow.note,checked:priorRow.mark.toLowerCase()==='[x]'})) error(`crosswalk原结果不符：${row.legacyId}`);
          if (canonical(row.attemptIndexes)!==canonical(priorAttempts.map(item=>item.index))) error(`crosswalk attempts索引不符：${row.legacyId}`);
          if (row.target?.type==='case') {
            caseRows++;
            const item=cases.get(row.target.id);
            if (!item || row.target.id!==row.legacyId || item.source!==row.source || item.key!==row.key) error(`case映射不符：${row.legacyId}`);
          } else if (row.target?.type==='inventory') {
            inventoryRows++;
            const item=inventory.get(row.target.id);
            if (!item || item.source!==row.source || item.key!==row.key ||
                (item.locale && item.locale!==(row.locale||null))) error(`inventory映射不符：${row.legacyId}`);
            if (priorAttempts.some(entry=>entry.attempt.result==='FAIL')) {
              const last=priorAttempts.at(-1)?.attempt;
              if (row.prior.result!=='PASS' || last?.result!=='PASS' || !last.fix || !last.impact) error(`inventory映射含未解决FAIL：${row.legacyId}`);
            }
          } else error(`未知crosswalk目标：${row.legacyId}`);
        }
        if (ids.size!==oldCases.size || [...oldCases.keys()].some(id=>!ids.has(id))) error('crosswalk未覆盖全部原case');
        if (caseRows!==receipt.counts?.retainedCases || inventoryRows!==receipt.counts?.inventoryOnlyCases) error('crosswalk数量与receipt不符');
        const initialManifest=JSON.parse(initialOutputBytes['session.json'].toString('utf8'));
        if (initialManifest.schema!==2 || initialManifest.platform!==manifest.platform ||
            initialManifest.candidate!==manifest.candidate || !Array.isArray(initialManifest.cases)) error('迁移输出不是对应schema2整表');
        const expectedRetained=[...rows].filter(row=>row.target?.type==='case').map(row=>row.target.id).sort();
        const actualRetained=initialManifest.cases.map(item=>item.id).sort();
        if (canonical(expectedRetained)!==canonical(actualRetained)) error('schema2迁移输出case集与crosswalk不符');
        const initialAttempts=parseAttempts(initialOutputBytes['attempts.jsonl'].toString('utf8'));
        const expectedAttemptLines=oldAttempts.filter(item=>expectedRetained.includes(item.record.id)).map(item=>item.line);
        if (oldAttempts.length!==receipt.counts?.attemptsBefore || initialAttempts.length!==receipt.counts?.attemptsRetained) error('迁移attempt数量与receipt不符');
        if (canonical(initialAttempts.map(item=>item.line))!==canonical(expectedAttemptLines)) error('schema2迁移输出未保留全部活动历史');
        const initialState=parseChecklist(initialOutputBytes['CHECKLIST.md'].toString('utf8'),
          initialManifest.cases,initialAttempts.map(item=>item.record));
        for (const row of rows.filter(item=>item.target?.type==='case')) {
          const before=originalState.rows.get(row.legacyId),after=initialState.rows.get(row.target.id);
          if (!before || !after || canonical([before.result,before.evidence,before.note,before.mark])!==
              canonical([after.result,after.evidence,after.note,after.mark])) error(`schema2迁移输出改写了原case：${row.legacyId}`);
        }
      }
    }
  } catch (cause) {
    error(cause.message||'档案读取失败');
  }
  return errors;
}
function verifyScopeAmendment(out,manifest,{sessionBytes=null}={}) {
  const errors=[],directory=path.join(out,AMENDMENT_DIR),provenance=manifest.scopeAmendment;
  const error=message=>errors.push(`scope amendment归档/身份链无效：${message}`);
  if (!provenance) {
    if (fs.existsSync(directory)) error('session.json没有scopeAmendment绑定');
    return errors;
  }
  if (manifest.schema!==2 || provenance.schema!==1 || provenance.kind!=='toolhelp-case-to-inventory-v1') {
    error('schema或amendment类型不符'); return errors;
  }
  try {
    const stat=fs.lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) { error('归档目录不是普通目录'); return errors; }
    const readBound=(relative,expectedPath,expectedSha,label)=>{
      if (relative!==expectedPath || !/^[a-f0-9]{64}$/.test(expectedSha||'')) { error(`${label}路径或SHA绑定损坏`); return null; }
      const file=path.join(out,relative),fileStat=fs.lstatSync(file);
      if (!fileStat.isFile() || fileStat.isSymbolicLink()) { error(`${label}不是普通文件`); return null; }
      const bytes=fs.readFileSync(file);
      if (sha(bytes)!==expectedSha) error(`${label}SHA不符`);
      return bytes;
    };
    const originals={},expectedOriginals={};
    if (!provenance.originals || Object.keys(provenance.originals).sort().join('|')!==[...RUN_FILES].sort().join('|')) error('父原件清单不全');
    for (const name of RUN_FILES) {
      const item=provenance.originals?.[name],relative=`${AMENDMENT_DIR}/original/${name}`;
      originals[name]=readBound(item?.path,relative,item?.sha256,`父原件${name}`);
      expectedOriginals[name]={path:relative,sha256:item?.sha256};
    }
    const crosswalkPath=`${AMENDMENT_DIR}/crosswalk.json`;
    const crosswalkBytes=readBound(provenance.crosswalk?.path,crosswalkPath,provenance.crosswalk?.sha256,'crosswalk');
    const receiptPath=`${AMENDMENT_DIR}/receipt.json`;
    let receiptBytes=null;
    if (provenance.receipt?.path!==receiptPath) error('receipt路径不符');
    else {
      const receiptStat=fs.lstatSync(path.join(out,receiptPath));
      if (!receiptStat.isFile() || receiptStat.isSymbolicLink()) error('receipt不是普通文件');
      else receiptBytes=fs.readFileSync(path.join(out,receiptPath));
    }
    for (const relative of [`${AMENDMENT_DIR}/original`,`${AMENDMENT_DIR}/output-initial`]) {
      const directoryStat=fs.lstatSync(path.join(out,relative));
      if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) error(`归档子目录损坏：${relative}`);
    }
    if (!originals['session.json'] || !originals['CHECKLIST.md'] || !originals['attempts.jsonl']) return errors;
    const parentManifest=JSON.parse(originals['session.json'].toString('utf8'));
    if (parentManifest.schema!==2 || parentManifest.platform!==manifest.platform || parentManifest.candidate!==manifest.candidate) error('父schema2身份与当前表不符');
    if (canonical(parentManifest.scopeMigration||null)!==canonical(manifest.scopeMigration||null)) error('父scopeMigration链被改写');
    const migrationErrors=verifyMigrationProvenance(out,parentManifest,{sessionBytes:originals['session.json']});
    errors.push(...migrationErrors);
    const parentMigrationSha=sha(Buffer.from(canonical(parentManifest.scopeMigration||null)));
    if (provenance.parentScopeMigrationSha256!==parentMigrationSha) error('父scopeMigration摘要不符');
    const parentCases=parentManifest.cases||[],parentAttempts=parseAttempts(originals['attempts.jsonl'].toString('utf8'));
    const parentState=parseChecklist(originals['CHECKLIST.md'].toString('utf8'),parentCases,parentAttempts.map(item=>item.record));
    if (receiptBytes) {
      const receipt=JSON.parse(receiptBytes.toString('utf8'));
      if (receipt.schema!==1 || receipt.kind!=='toolhelp-case-to-inventory-v1' ||
          !/^[a-f0-9]{64}$/.test(receipt.amendmentScriptSha256||'')) error('receipt身份字段损坏');
      if (canonical(receipt.originals)!==canonical(expectedOriginals) ||
          canonical(receipt.crosswalk)!==canonical({path:crosswalkPath,sha256:provenance.crosswalk?.sha256})) error('receipt父原件或crosswalk绑定与session不符');
      if (receipt.parentScopeMigrationSha256!==parentMigrationSha) error('receipt父scopeMigration摘要不符');
      const outputs=receipt.outputs;
      if (!outputs || Object.keys(outputs).sort().join('|')!==[...RUN_FILES].sort().join('|')) error('输出SHA清单不全');
      const initial={};
      for (const name of RUN_FILES) {
        const relative=`${AMENDMENT_DIR}/output-initial/${name}`;
        initial[name]=readBound(relative,relative,outputs?.[name],`amendment输出${name}`);
      }
      if (sha(sessionBytes || fs.readFileSync(path.join(out,'session.json')))!==outputs?.['session.json']) error('当前session偏离amendment身份');
      if (crosswalkBytes && initial['session.json'] && initial['CHECKLIST.md'] && initial['attempts.jsonl']) {
        const crosswalk=JSON.parse(crosswalkBytes.toString('utf8')),rows=crosswalk.rows;
        const ids=new Set(),currentCases=new Map((manifest.cases||[]).map(item=>[item.id,item]));
        const inventory=new Map((manifest.toolHelpInventory||[]).map(item=>[item.id,item]));
        if (crosswalk.schema!==1 || !Array.isArray(rows) || rows.length!==receipt.counts?.oldCases) error('crosswalk行集损坏');
        const parentById=new Map(parentCases.map(item=>[item.id,item]));
        if (parentById.size!==parentCases.length) error('父case ID重复');
        let retained=0,inventoryOnly=0;
        for (const row of rows||[]) {
          if (!row.legacyId || ids.has(row.legacyId) || !RESULTS.has(row.prior?.result) || !Array.isArray(row.attemptIndexes)) { error('crosswalk行损坏'); break; }
          ids.add(row.legacyId);
          const before=parentById.get(row.legacyId),prior=parentState.rows.get(row.legacyId),history=parentState.byId.get(row.legacyId)||[];
          if (!before || row.source!==before.source || row.key!==before.key || (row.locale||null)!==(before.locale||null)) error(`父case映射不符：${row.legacyId}`);
          if (!prior || canonical(row.prior)!==canonical({result:prior.result,evidence:prior.evidence,note:prior.note,checked:prior.mark.toLowerCase()==='[x]'})) error(`父结果映射不符：${row.legacyId}`);
          if (canonical(row.attemptIndexes)!==canonical(history.map(item=>item.index))) error(`父attempt索引不符：${row.legacyId}`);
          if (row.target?.type==='case') {
            retained++;
            const after=currentCases.get(row.target.id);
            if (!after || row.target.id!==row.legacyId || canonical(before)!==canonical(after)) error(`活动case映射不符：${row.legacyId}`);
          } else if (row.target?.type==='inventory') {
            inventoryOnly++;
            const target=inventory.get(row.target.id);
            if (before.source!==TOOLHELP_SOURCE || !target || target.id!==row.legacyId || target.source!==row.source ||
                target.key!==row.key || target.locale!==(row.locale||null)) error(`ToolHelp inventory映射不符：${row.legacyId}`);
            if (history.some(item=>item.attempt.result==='FAIL')) {
              const last=history.at(-1)?.attempt;
              if (row.prior.result!=='PASS' || last?.result!=='PASS' || !last.fix || !last.impact) error(`转出case含未解决FAIL：${row.legacyId}`);
            }
          } else error(`未知crosswalk目标：${row.legacyId}`);
        }
        if (ids.size!==parentById.size || [...parentById.keys()].some(id=>!ids.has(id))) error('crosswalk未覆盖父case');
        if (retained!==receipt.counts?.retainedCases || inventoryOnly!==receipt.counts?.inventoryOnlyCases) error('crosswalk数量与receipt不符');
        const initialManifest=JSON.parse(initial['session.json'].toString('utf8'));
        if (canonical(initialManifest.scopeAmendment)!==canonical(manifest.scopeAmendment) ||
            initialManifest.schema!==2 || initialManifest.platform!==manifest.platform || initialManifest.candidate!==manifest.candidate) error('初始输出身份不符');
        if (canonical(initialManifest.cases.map(item=>item.id).sort())!==canonical(rows.filter(row=>row.target?.type==='case').map(row=>row.target.id).sort())) error('输出case集与crosswalk不符');
        const initialAttempts=parseAttempts(initial['attempts.jsonl'].toString('utf8'));
        const retainedIds=new Set(rows.filter(row=>row.target?.type==='case').map(row=>row.target.id));
        const expectedAttempts=parentAttempts.filter(item=>retainedIds.has(item.record.id)).map(item=>item.line);
        if (parentAttempts.length!==receipt.counts?.attemptsBefore || initialAttempts.length!==receipt.counts?.attemptsRetained ||
            canonical(initialAttempts.map(item=>item.line))!==canonical(expectedAttempts)) error('输出attempt历史不符');
        const initialState=parseChecklist(initial['CHECKLIST.md'].toString('utf8'),initialManifest.cases,initialAttempts.map(item=>item.record));
        for (const row of rows.filter(item=>item.target?.type==='case')) {
          const before=parentState.rows.get(row.legacyId),after=initialState.rows.get(row.target.id);
          if (!before || !after || canonical([before.result,before.evidence,before.note,before.mark])!==canonical([after.result,after.evidence,after.note,after.mark])) error(`保留case状态被改写：${row.legacyId}`);
        }
      }
    }
  } catch (cause) { error(cause.message||'归档读取失败'); }
  return errors;
}
function amendV2ToolHelpRun(out) {
  if (!out) fail('需要--out <已有schema2目录>');
  out=path.resolve(out);
  const rootStat=fs.lstatSync(out);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail('目标不是普通目录');
  const originals=Object.fromEntries(RUN_FILES.map(name=>[name,readRegularFile(path.join(out,name))]));
  if (fs.existsSync(path.join(out,'HANDOFF.md'))) fail('已有HANDOFF；先保留历史交接并另建新轮');
  const amendmentDir=path.join(out,AMENDMENT_DIR);
  if (fs.existsSync(amendmentDir)) fail('ToolHelp scope amendment归档已存在');
  let parent,attemptRows;
  try {
    parent=JSON.parse(originals['session.json'].bytes.toString('utf8'));
    attemptRows=parseAttempts(originals['attempts.jsonl'].bytes.toString('utf8'));
  } catch (error) { if (error.message.startsWith('拒绝schema1迁移：')) throw error; fail('session.json或attempts.jsonl损坏'); }
  if (parent.schema!==2 || !['macos','windows','release'].includes(parent.platform) || parent.scopeAmendment) fail('只支持未做ToolHelp amendment的schema2目录');
  const catalog=buildCatalog({includeLegacyCases:true,legacySceneScope:true});
  const currentCases=sortCases(selected(catalog.cases,parent.platform));
  const oldToolHelp=selected(catalog.legacyCases.filter(item=>item.source===TOOLHELP_SOURCE),parent.platform);
  const expectedParent=sortCases([...currentCases,...oldToolHelp]);
  if (canonical(byId(expectedParent))!==canonical(byId(parent.cases||[]))) fail('schema2父case集不是已知ToolHelp展开版本');
  if (canonical(parent.pluginInventory)!==canonical(catalog.pluginInventory)) fail('插件inventory已变化，先对账');
  const oldSourceKeys=Object.keys(parent.sources||{}).sort(),newSourceKeys=Object.keys(catalog.sources).sort();
  if (canonical(oldSourceKeys)!==canonical(newSourceKeys)) fail('父schema2源文件集合未知');
  for (const source of newSourceKeys) if (source!=='tools/acceptance/catalog.js' && parent.sources[source]!==catalog.sources[source]) fail(`父schema2源指纹已漂移：${source}`);
  const lineageErrors=verifyMigrationProvenance(out,parent,{sessionBytes:originals['session.json'].bytes});
  if (lineageErrors.length) fail(`父scopeMigration链无效：${lineageErrors.join('；')}`);
  const oldAttempts=attemptRows.map(item=>item.record);
  const parsed=parseChecklist(originals['CHECKLIST.md'].bytes.toString('utf8'),parent.cases,oldAttempts);
  const nextIds=new Set(currentCases.map(item=>item.id)),toolInventory=new Map(catalog.toolHelpInventory.map(item=>[item.id,item]));
  const crosswalk=byId(parent.cases).map(item=>{
    const row=parsed.rows.get(item.id),history=parsed.byId.get(item.id)||[];
    if (!nextIds.has(item.id)) {
      if (item.source!==TOOLHELP_SOURCE || !toolInventory.has(item.id)) fail(`非ToolHelp case不得移出scope：${item.id}`);
      if (history.some(entry=>entry.attempt.result==='FAIL')) {
        const last=history.at(-1)?.attempt;
        if (row.result!=='PASS' || last?.result!=='PASS' || !last.fix || !last.impact) fail(`转入ToolHelp inventory的FAIL尚未实际修复并PASS：${item.id}`);
      }
    }
    const target=nextIds.has(item.id)?{type:'case',id:item.id}:{type:'inventory',id:toolInventory.get(item.id)?.id};
    return {source:item.source,key:item.key,locale:item.locale||null,legacyId:item.id,target,
      prior:{result:row.result,evidence:row.evidence,note:row.note,checked:row.mark.toLowerCase()==='[x]'},
      attemptIndexes:history.map(entry=>entry.index)};
  });
  const checklistLines=originals['CHECKLIST.md'].bytes.toString('utf8').split(/\r?\n/).filter(line=>{
    if (!/^\| \[[ xX]\]/.test(line)) return true;
    return nextIds.has(line.split('|')[2]?.trim());
  });
  const note='ToolHelp逐键原结果留在scope-amendment-toolhelp-v1/crosswalk.json及original/；inventory不产生逐键实屏信用。';
  const noteAt=checklistLines.findIndex(line=>line.startsWith('详细预期、主项映射'));
  checklistLines.splice(noteAt<0?checklistLines.length:noteAt+1,0,note);
  const activeAttempts=attemptRows.filter(item=>nextIds.has(item.record.id)).map(item=>item.line);
  const {legacyCases:_legacy,...catalogManifest}=catalog;
  const nextManifest={...parent,...catalogManifest,cases:currentCases,platform:parent.platform,candidate:parent.candidate,
    createdAt:parent.createdAt,schema:2,scopeAmendedAt:new Date().toISOString()};
  const crosswalkText=JSON.stringify({schema:1,rows:crosswalk},null,2)+'\n';
  const parentHashes=Object.fromEntries(RUN_FILES.map(name=>[name,sha(originals[name].bytes)]));
  const parentOriginals=Object.fromEntries(RUN_FILES.map(name=>[name,{path:`${AMENDMENT_DIR}/original/${name}`,sha256:parentHashes[name]}]));
  const parentScopeMigrationSha256=sha(Buffer.from(canonical(parent.scopeMigration||null)));
  const crosswalkBinding={path:`${AMENDMENT_DIR}/crosswalk.json`,sha256:sha(crosswalkText)};
  const outputs={
    'session.json':Buffer.from(JSON.stringify(nextManifest,null,2)+'\n'),
    'CHECKLIST.md':Buffer.from(checklistLines.join('\n')),
    'attempts.jsonl':Buffer.from(activeAttempts.length?`${activeAttempts.join('\n')}\n`:''),
  };
  const receipt={schema:1,kind:'toolhelp-case-to-inventory-v1',createdAt:new Date().toISOString(),
    amendmentScriptSha256:sha(fs.readFileSync(__filename)),originals:parentOriginals,crosswalk:crosswalkBinding,
    parentScopeMigrationSha256,outputs:Object.fromEntries(Object.entries(outputs).map(([name,bytes])=>[name,sha(bytes)])),
    counts:{oldCases:parent.cases.length,retainedCases:currentCases.length,inventoryOnlyCases:parent.cases.length-currentCases.length,
      attemptsBefore:attemptRows.length,attemptsRetained:activeAttempts.length}};
  nextManifest.scopeAmendment={schema:1,kind:'toolhelp-case-to-inventory-v1',originals:parentOriginals,
    crosswalk:crosswalkBinding,parentScopeMigrationSha256,receipt:{path:`${AMENDMENT_DIR}/receipt.json`}};
  outputs['session.json']=Buffer.from(JSON.stringify(nextManifest,null,2)+'\n');
  receipt.outputs=Object.fromEntries(Object.entries(outputs).map(([name,bytes])=>[name,sha(bytes)]));
  let ownsArchive=false;
  try {
    fs.mkdirSync(amendmentDir,{recursive:false}); ownsArchive=true;
    const originalDir=path.join(amendmentDir,'original'),initialDir=path.join(amendmentDir,'output-initial');
    fs.mkdirSync(originalDir); fs.mkdirSync(initialDir);
    for (const name of RUN_FILES) fs.writeFileSync(path.join(originalDir,name),originals[name].bytes,{mode:originals[name].mode});
    for (const name of RUN_FILES) if (sha(fs.readFileSync(path.join(originalDir,name)))!==parentHashes[name]) fail(`父原件归档校验失败：${name}`);
    for (const name of RUN_FILES) fs.writeFileSync(path.join(initialDir,name),outputs[name],{mode:originals[name].mode});
    for (const name of RUN_FILES) if (sha(fs.readFileSync(path.join(initialDir,name)))!==receipt.outputs[name]) fail(`新表快照校验失败：${name}`);
    fs.writeFileSync(path.join(amendmentDir,'crosswalk.json'),crosswalkText);
    fs.writeFileSync(path.join(amendmentDir,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
    for (const name of RUN_FILES) fs.writeFileSync(path.join(out,`${name}.toolhelp-scope.tmp`),outputs[name],{mode:originals[name].mode});
    for (const name of RUN_FILES) fs.renameSync(path.join(out,`${name}.toolhelp-scope.tmp`),path.join(out,name));
    for (const name of RUN_FILES) if (sha(fs.readFileSync(path.join(out,name)))!==receipt.outputs[name]) fail(`新表写入校验失败：${name}`);
  } catch (error) {
    for (const name of RUN_FILES) {
      const tmp=path.join(out,`${name}.toolhelp-scope.tmp`);
      if (fs.existsSync(tmp)) fs.rmSync(tmp,{force:true});
      if (fs.existsSync(path.join(amendmentDir,'original',name))) fs.writeFileSync(path.join(out,name),originals[name].bytes,{mode:originals[name].mode});
    }
    if (ownsArchive) fs.rmSync(amendmentDir,{recursive:true,force:true});
    throw error;
  }
  return {amended:true,out,schema:2,counts:receipt.counts,originalSha256:parentHashes,
    receipt:path.join(amendmentDir,'receipt.json'),crosswalk:path.join(amendmentDir,'crosswalk.json')};
}
function migrateV1Run(out) {
  if (!out) fail('需要--out <已有schema1目录>');
  out=path.resolve(out);
  const rootStat=fs.lstatSync(out);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail('目标不是普通目录');
  const sourceFiles=Object.fromEntries(RUN_FILES.map(name=>[name,readRegularFile(path.join(out,name))]));
  if (fs.existsSync(path.join(out,'HANDOFF.md'))) fail('已有HANDOFF；先保留历史交接并另建新轮');
  const migrationDir=path.join(out,'scope-migration-v2');
  if (fs.existsSync(migrationDir)) fail('迁移归档已存在');
  let oldManifest,oldAttempts;
  try {
    oldManifest=JSON.parse(sourceFiles['session.json'].bytes.toString('utf8'));
    oldAttempts=parseAttempts(sourceFiles['attempts.jsonl'].bytes.toString('utf8'));
  } catch (error) {
    if (error.message.startsWith('拒绝schema1迁移：')) throw error;
    fail('session.json或attempts.jsonl损坏');
  }
  if (oldManifest.schema!==1 || !['macos','windows','release'].includes(oldManifest.platform)) fail('只支持冻结的schema1平台表');
  const catalog=buildCatalog({includeLegacyCases:true,legacySceneScope:true});
  checkSourceLineage(oldManifest.sources,catalog.sources);
  if (canonical(oldManifest.masters)!==canonical(catalog.masters) || !Array.isArray(oldManifest.cases)) fail('主项清单或case结构已变化');
  const oldCases=selected(catalog.legacyCases,oldManifest.platform);
  if (canonical(byId(selected(oldManifest.cases||[],oldManifest.platform)))!==canonical(byId(oldManifest.cases)) ||
      canonical(byId(oldCases))!==canonical(byId(oldManifest.cases))) fail('schema1 case集不是冻结v1 catalog');
  validateSourceCases(oldCases,catalog.pluginInventory,catalog.toolHelpInventory);
  const parsed=parseChecklist(sourceFiles['CHECKLIST.md'].bytes.toString('utf8'),oldCases,oldAttempts.map(row=>row.record));
  const nextCases=sortCases(selected(catalog.cases,oldManifest.platform));
  const oldById=new Map(oldCases.map(item=>[item.id,item]));
  const nextIds=new Set(nextCases.map(item=>item.id));
  if ([...nextIds].some(id=>!oldById.has(id))) fail('schema2加入新case；迁移不得新增目标');
  const inventoryByPair=new Map(catalog.pluginInventory.map(item=>[`${item.source}\0${item.key}`,item]));
  const toolInventoryById=new Map(catalog.toolHelpInventory.map(item=>[item.id,item]));
  for (const item of oldCases) {
    if (nextIds.has(item.id)) continue;
    const row=parsed.rows.get(item.id),history=parsed.byId.get(item.id)||[];
    if (history.some(entry=>entry.attempt.result==='FAIL')) {
      const last=history.at(-1)?.attempt;
      if (row.result!=='PASS' || last?.result!=='PASS' || !last.fix || !last.impact) {
        fail(`转入inventory的FAIL尚未实际修复并PASS：${item.id}`);
      }
    }
  }
  const crosswalk=byId(oldCases).map(item=>{
    const row=parsed.rows.get(item.id);
    const target=nextIds.has(item.id) ? {type:'case',id:item.id} :
      {type:'inventory',id:item.source===TOOLHELP_SOURCE?toolInventoryById.get(item.id)?.id:
        inventoryByPair.get(`${item.source}\0${item.key}`)?.id};
    if (target.type==='inventory' && !target.id) fail(`没有inventory目标：${item.id}`);
    const attempts=(parsed.byId.get(item.id)||[]).map(entry=>entry.index);
    return {source:item.source,key:item.key,locale:item.locale||null,legacyId:item.id,target,
      prior:{result:row.result,evidence:row.evidence,note:row.note,checked:row.mark.toLowerCase()==='[x]'},attemptIndexes:attempts};
  });
  const retainedLines=sourceFiles['CHECKLIST.md'].bytes.toString('utf8').split(/\r?\n/).filter(line=>{
    if (!/^\| \[[ xX]\]/.test(line)) return true;
    const id=line.split('|')[2]?.trim();
    return nextIds.has(id);
  });
  const note='插件与ToolHelp源键库存不产生实屏case；移出行的原结果见scope-migration-v2/crosswalk.json及original/。';
  const noteAt=retainedLines.findIndex(line=>line.startsWith('详细预期、主项映射'));
  retainedLines.splice(noteAt<0?retainedLines.length:noteAt+1,0,note);
  const activeAttempts=oldAttempts.filter(row=>nextIds.has(row.record.id)).map(row=>row.line);
  const crosswalkText=JSON.stringify({schema:1,rows:crosswalk},null,2)+'\n';
  const {legacyCases:_legacyCases,...manifestCatalog}=catalog;
  const nextManifest={...manifestCatalog,cases:nextCases,platform:oldManifest.platform,candidate:oldManifest.candidate,
    createdAt:oldManifest.createdAt,migratedAt:new Date().toISOString(),schema:2};
  const outputs={
    'session.json':Buffer.from(JSON.stringify(nextManifest,null,2)+'\n'),
    'CHECKLIST.md':Buffer.from(retainedLines.join('\n')),
    'attempts.jsonl':Buffer.from(activeAttempts.length?`${activeAttempts.join('\n')}\n`:''),
  };
  const archiveHashes=Object.fromEntries(RUN_FILES.map(name=>[name,sha(sourceFiles[name].bytes)]));
  const handoff={schema:1,kind:'plugin-scope-v1-to-v2',createdAt:new Date().toISOString(),
    migrationScriptSha256:sha(fs.readFileSync(__filename)),
    originals:Object.fromEntries(RUN_FILES.map(name=>[name,{path:`${MIGRATION_DIR}/original/${name}`,sha256:archiveHashes[name]}])),
    crosswalk:{path:`${MIGRATION_DIR}/crosswalk.json`,sha256:sha(crosswalkText)},
    outputs:Object.fromEntries(Object.entries(outputs).map(([name,bytes])=>[name,sha(bytes)])),
    counts:{oldCases:oldCases.length,retainedCases:nextCases.length,inventoryOnlyCases:oldCases.length-nextCases.length,
      attemptsBefore:oldAttempts.length,attemptsRetained:activeAttempts.length}};
  const binding={schema:1,kind:'plugin-scope-v1-to-v2',
    originals:handoff.originals,crosswalk:handoff.crosswalk,receipt:{path:`${MIGRATION_DIR}/receipt.json`}};
  nextManifest.scopeMigration=binding;
  outputs['session.json']=Buffer.from(JSON.stringify(nextManifest,null,2)+'\n');
  handoff.outputs=Object.fromEntries(Object.entries(outputs).map(([name,bytes])=>[name,sha(bytes)]));
  let replaced=false;
  let ownsArchive=false;
  try {
    fs.mkdirSync(migrationDir,{recursive:false});
    ownsArchive=true;
    const originals=path.join(migrationDir,'original'); fs.mkdirSync(originals);
    const initialOutputs=path.join(migrationDir,'output-initial'); fs.mkdirSync(initialOutputs);
    for (const name of RUN_FILES) fs.writeFileSync(path.join(originals,name),sourceFiles[name].bytes,{mode:sourceFiles[name].mode});
    for (const name of RUN_FILES) if (sha(fs.readFileSync(path.join(originals,name)))!==archiveHashes[name]) fail(`原件归档校验失败：${name}`);
    for (const name of RUN_FILES) fs.writeFileSync(path.join(initialOutputs,name),outputs[name],{mode:sourceFiles[name].mode});
    for (const name of RUN_FILES) if (sha(fs.readFileSync(path.join(initialOutputs,name)))!==handoff.outputs[name]) fail(`新表归档校验失败：${name}`);
    fs.writeFileSync(path.join(migrationDir,'crosswalk.json'),crosswalkText);
    fs.writeFileSync(path.join(migrationDir,'receipt.json'),JSON.stringify(handoff,null,2)+'\n');
    for (const name of RUN_FILES) fs.writeFileSync(path.join(out,`${name}.scope-v2.tmp`),outputs[name],{mode:sourceFiles[name].mode});
    for (const name of RUN_FILES) fs.renameSync(path.join(out,`${name}.scope-v2.tmp`),path.join(out,name));
    for (const name of RUN_FILES) if (sha(fs.readFileSync(path.join(out,name)))!==sha(outputs[name])) fail(`新文件校验失败：${name}`);
    replaced=true;
  } catch (error) {
    for (const name of RUN_FILES) {
      const tmp=path.join(out,`${name}.scope-v2.tmp`);
      if (fs.existsSync(tmp)) fs.rmSync(tmp,{force:true});
      if (fs.existsSync(path.join(migrationDir,'original',name))) fs.writeFileSync(path.join(out,name),sourceFiles[name].bytes,{mode:sourceFiles[name].mode});
    }
    if (ownsArchive) fs.rmSync(migrationDir,{recursive:true,force:true});
    throw error;
  }
  return {migrated:true,out,schema:2,counts:handoff.counts,originalSha256:archiveHashes,
    receipt:path.join(migrationDir,'receipt.json'),crosswalk:path.join(migrationDir,'crosswalk.json'),replaced};
}
module.exports={migrateV1Run,amendV2ToolHelpRun,verifyMigrationProvenance,verifyScopeAmendment,V1_CATALOG_SHA256,
  scopeInternals:{RUN_FILES,sha,canonical,byId,selected,parseAttempts,parseChecklist,readRegularFile,escapeCell}};
