#!/usr/bin/env node
/**
 * [INPUT]: 既有production原生包producer、官方assets及冻结17 catalog目标。
 * [OUTPUT]: 为Windows DLL生成三语pack长度/摘要与官方相对catalog表；不生成或改写安装资源。
 * [POS]: Windows启动降噪的构建期来源绑定；复用批准译文和生产完整度验证，不接Mac runtime。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const fs=require('node:fs');
const {buildFromAssetRoot,validateResourceProfile}=require('./native_resource_bundle');
const target=require('./cavalry_native_target.json');
const languages=['zh-Hans','zh-Hant','ja_JP'];
function renderGuard(bundle,catalogs){
  validateResourceProfile(bundle.manifest,'production-2.8');
  const ids=catalogs.map(row=>row.id);
  if(ids.length!==17 || new Set(ids).size!==17 || ids.some(id=>
    typeof id!=='string' || !/^[A-Za-z0-9 /-]+$/.test(id) || id.startsWith('/') || id.includes('..')))
    throw new Error('expected the 17 canonical official catalogs');
  const packs=languages.map(language=>{
    const proof=bundle.manifest.packs[language];
    const locale=language==='ja_JP'?'ja':language;
    if(proof.nativeLocale!==locale || !/^[a-f0-9]{64}$/.test(proof.sha256) ||
       !Number.isSafeInteger(proof.bytes) || proof.bytes<1 || proof.bytes>4*1024*1024)
      throw new Error('invalid approved pack proof');
    return `    {${JSON.stringify(language)},${JSON.stringify(locale)},${JSON.stringify(proof.sha256)},${proof.bytes}}`;
  });
  return '// Generated from the complete approved native bundle; do not edit.\n'+
    'inline constexpr PackProof kApprovedPacks[]={\n'+packs.join(',\n')+'\n};\n'+
    'inline constexpr std::string_view kOfficialCatalogs[]={\n'+ids.map(id=>'    '+JSON.stringify(id)).join(',\n')+'\n};\n';
}
if(require.main===module){
  try{
    const args=process.argv.slice(2);
    if(args.length!==4 || args[0]!=='--assets-root' || args[2]!=='--out')throw new Error('use --assets-root <official assets> --out <generated include>');
    const bundle=buildFromAssetRoot(args[1],'production-2.8');
    fs.writeFileSync(args[3],renderGuard(bundle,target.catalogs));
  }catch(error){console.error(`[windows-catalog-warning] ${error.message}`);process.exitCode=1;}
}
module.exports={renderGuard};
