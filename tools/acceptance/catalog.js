/**
 * [INPUT]: 依赖场景、批准源表、帮助词表及插件实屏范围清单。
 * [OUTPUT]: 提供整轮case、插件/ToolHelp库存与场景观察库存。
 * [POS]: 离线验收目录；旧场景矩阵由legacySceneScope保留给显式迁移。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const masters = require('./masters.js');
const { rows, tri } = require('./scenarios.js');
const repo = path.resolve(__dirname, '../..');
const digest = value => createHash('sha256').update(value).digest('hex');
const pluginScopePath = 'tools/acceptance/plugin-acceptance-scope.json';
const TOOLHELP_SOURCE = 'injector/native/getpath_font_texts.inc';
const pluginRuleCounts = {
  REUSE_C3_REP_FIELD: 12,
  REUSE_C3_REP_NAME: 14,
  REUSE_C3_FINITE_PLUGIN: 21,
  REUSE_C3_CONDITION_HELP: 22,
};
function sortCases(cases) {
  const order=['shared','comparison','zh-Hans','zh-Hant','ja_JP','shell:en','shell:zh-Hans',
    'shell:zh-Hant','shell:ja_JP','platform','release'];
  return [...cases].sort((a,b)=>(a.batch==='17-closeout')-(b.batch==='17-closeout') ||
    order.indexOf(a.locale)-order.indexOf(b.locale) || a.batch.localeCompare(b.batch) || a.id.localeCompare(b.id));
}
function buildCatalog({includeLegacyCases = false, legacySceneScope = false} = {}) {
  const cases = [];
  const legacyCases = [];
  const legacySceneCases = [];
  const sceneInventory = [];
  const timelineParentCases = [];
  const sources = {};
  function source(file) {
    sources[file] = digest(fs.readFileSync(path.join(repo, file)));
    return require(path.join(repo, file));
  }
  // -- 稳定行为细项 ----------------------------------------
  for (const row of rows) for (const locale of row.locales) {
    cases.push({...row, platform: row.id === 'keychain' ? 'macos' : row.platform, id: `${row.id}:${locale}`, locale, expected: row.title,
      source: 'CAVALRY_2_8_MIGRATION_PLAN.md#5.2', key: row.id});
  }
  const scope = source(pluginScopePath);
  if (scope.schemaVersion!==1 || !Array.isArray(scope.approvedKeys) || !scope.authority?.length) {
    throw new Error('plugin acceptance scope is incomplete');
  }
  const pluginFiles = fs.readdirSync(path.join(repo, 'languages/native')).sort()
    .filter(name => /^plugins_.*\.js$/.test(name)).map(name => `languages/native/${name}`);
  const inventorySources = [...pluginFiles, 'languages/native/nodes_third_party_filter.js'];
  const approved = new Map();
  for (const item of scope.approvedKeys) {
    const id = `${item.source}\0${item.key}`;
    if (!pluginRuleCounts[item.rule] || approved.has(id)) throw new Error(`invalid plugin scope row ${item.source}/${item.key}`);
    const prefix=item.key.split(':',1)[0];
    if ((item.rule==='REUSE_C3_REP_FIELD' && prefix!=='nodeAttr') ||
        (item.rule==='REUSE_C3_REP_NAME' && prefix!=='nodeName') ||
        (item.rule==='REUSE_C3_CONDITION_HELP' && prefix!=='attrInfo') ||
        (item.rule==='REUSE_C3_FINITE_PLUGIN' && ![
          'languages/native/plugins_box_blur.js','languages/native/plugins_gaussian_blur.js',
          'languages/native/plugins_twist.js','languages/native/plugins_zoom_blur.js',
        ].includes(item.source))) throw new Error(`plugin scope rule is out of approved family: ${id.replace('\0','/')}`);
    approved.set(id, item.rule);
  }
  const ruleCounts = Object.fromEntries(Object.keys(pluginRuleCounts).map(rule => [rule, 0]));
  for (const rule of approved.values()) ruleCounts[rule]++;
  if (JSON.stringify(ruleCounts) !== JSON.stringify(pluginRuleCounts) ||
      JSON.stringify(scope.ruleCounts) !== JSON.stringify(pluginRuleCounts)) {
    throw new Error('plugin scope rule counts changed; review the approved scope');
  }
  const sourceEntries = new Map();
  const pluginInventory = [];
  for (const file of inventorySources) {
    const catalog = source(file);
    for (const entry of catalog.entries) {
      const pair = `${file}\0${entry.key}`;
      if (sourceEntries.has(pair)) throw new Error(`duplicate plugin source key ${file}/${entry.key}`);
      sourceEntries.set(pair, entry);
      const rule = approved.get(pair) || null;
      const hash = digest(`${file}\0${entry.key}`).slice(0, 16);
      pluginInventory.push({
        id: `plugin-${hash}`, source: file, sourceSha256: sources[file], key: entry.key,
        sourceEntry: entry, approvedRule: rule,
        caseIds: rule ? tri.map(locale => `key-${hash}:${locale}`) : [],
      });
    }
  }
  for (const id of approved.keys()) if (!sourceEntries.has(id)) throw new Error(`approved plugin source key missing: ${id.replace('\0','/')}`);
  if (approved.size !== 69) throw new Error('approved plugin scope count changed');

  function entryCase(file, batch, ids, entry, locale) {
    const translated = entry.translations[locale];
    const action = actionFor(entry.key);
    return {id: `key-${digest(`${file}\0${entry.key}`).slice(0,16)}:${locale}`,
      batch: typeof batch === 'function' ? batch(entry) : batch,
      masters: ids, platform: 'shared', locale, source: file, key: entry.key,
      title: `${entry.key}：${action}`, action,
      context: contexts.get(entry.key) || [],
      expected: typeof translated === 'string' ? translated : translated.text};
  }
  function entries(file, batch, ids, select = () => true) {
    for (const entry of source(file).entries.filter(select)) for (const locale of tri) {
      const item = entryCase(file, batch, ids, entry, locale);
      const isPluginSource = inventorySources.includes(file);
      if (includeLegacyCases && isPluginSource) legacyCases.push(item);
      if (!isPluginSource || approved.has(`${file}\0${entry.key}`)) cases.push(item);
    }
  }
  // -- 动作绑定既有目标；不把静态属性库存扩成新实屏矩阵 ------
  const contexts = new Map();
  const actions = source('tools/acceptance/plugin-actions.json');
  for (const plugin of actions.plugins) {
    for (const field of [...plugin.attributes, ...(plugin.inheritedUiFields || [])]) {
      for (const key of [field.labelKey, field.helpKey, ...(field.optionKeys || [])].filter(Boolean)) {
        const context = {plugin: plugin.type, owner: plugin.owner, field: field.id,
          conditions: field.conditions || {}, locations: field.uiLocations || (field.location ? [field.location] : []),
          restore: '保存进入前字段值；完成本面板后恢复，不把厂商默认值当用户原值'};
        contexts.set(key, [...(contexts.get(key) || []), context]);
      }
    }
  }
  function actionFor(key) {
    if (key.startsWith('nodeAttrEnum:')) return `展开选项→选择源索引${key.split('.').at(-1)}→读回选后值与字形→本组结束恢复原值`;
    if (key.startsWith('attrInfo:')) return '进入字段可见且可用的条件→真实悬停→读取popup全文并立即截图';
    if (key.startsWith('nodeInfo:')) return '悬停节点名称→读取实际说明全文并立即截图';
    if (key.startsWith('nodeAttr:')) return '在对应owner面板读取实际字段标签及字形；条件和页签见context';
    if (key.startsWith('nodeName:')) return '读取实际节点名称及面板父链；不以自定义图层名代默认名称';
    return '实际消费者全文、字形与所需动作';
  }
  // -- 正式词表逐键展开，不手抄翻译 --------------------------
  for (const name of fs.readdirSync(path.join(repo, 'languages/native')).sort()) {
    if (!/^plugins_.*\.js$/.test(name)) continue;
    const hidden = /erosion|polar_coordinates/.test(name);
    entries(`languages/native/${name}`, `05-plugin-${hidden ? 'hidden-' : ''}${name.slice(8,-3)}`, ['C-3','F-2']);
  }
  entries('languages/native/nodes_third_party_filter.js', '05-plugin-shared', ['C-3']);
  entries('languages/native/nodes_group_transform_null.js','05-group',['C-3'],e=>e.key.includes(':group'));
  const nullShapeFile='languages/native/nodes_group_transform_null.js';
  const nullShapeKeys=e=>e.key==='nodeAttr:null.shape' || e.key==='attrInfo:null.shape' || e.key.startsWith('nodeAttrEnum:null.shape.');
  for (const entry of source(nullShapeFile).entries.filter(nullShapeKeys)) for (const locale of tri) {
    const item=entryCase(nullShapeFile,'05-null-shape',['C-3'],entry,locale);
    legacySceneCases.push(item);
    sceneInventory.push({id:item.id,source:item.source,sourceSha256:sources[nullShapeFile],key:item.key,locale,
      text:item.expected,scope:'inventory-only',referenceCaseId:`null-shape-opacity:${locale}`});
    if (legacySceneScope) cases.push(item);
  }
  entries('languages/native/runtime_observed_supplement.js','05-inherited-opacity',['C-3'],e=>e.key==='nodeAttr:drawable.opacity');
  entries('languages/native/menus_file_edit_create_help.js','03-app-menu',['C-3'],e=>e.key==='menu.create.cogwheel');
  entries('languages/native/remaining_global_ui_06.js','03-app-tooltip',['C-3'],e=>e.key==='toolbox.tooltip.line');
  entries('languages/native/guides.js', e => `07-guide-${e.key.split('.')[1] || 'common'}`, ['C-3']);
  entries('languages/native/official_demo_menus.js', '10-demo-menu', ['C-3']);
  // -- 帮助审批域：旧语言源仅用于namespace，不冒2.8源全文 ------
  const approvedHelp = source('languages/native/metadata_reuse_manifest.js').approvals;
  const supplemental = source('languages/native/metadata_supplement.js').entries;
  const defKeys = new Set();
  const helpApi=source('tools/native_metadata_help.js');
  const approvedHelpText={};
  for (const locale of tri) {
    approvedHelpText[locale]=new Map();
    for (const file of helpApi.METADATA_FILE_NAMES) {
      for (const entry of helpApi.collectMetadataDescriptions(file,source(`languages/${locale}/MetaData/${file}`))) approvedHelpText[locale].set(entry.key,entry.source);
    }
  }
  for (const file of helpApi.METADATA_FILE_NAMES) {
    for (const item of source(`languages/en/MetaData/${file}`)) {
      if (item.namespace === '@JS_DEFORMER') defKeys.add(`${file}#/${item.name}/description`);
    }
  }
  for (const entry of [...approvedHelp, ...supplemental]) for (const locale of tri) {
    const nested = entry.key.split('#/')[1].split('/').length !== 2;
    const expected=entry.translations?.[locale]?.text || approvedHelpText[locale].get(entry.legacyKey || entry.key);
    if (!expected || (entry.translationSha256 && digest(expected)!==entry.translationSha256[locale])) throw new Error(`help approval mismatch ${locale}/${entry.key}`);
    cases.push({id:`help-${digest(entry.key).slice(0,16)}:${locale}`, locale,
      batch: nested ? '09-help-nested-scope' : defKeys.has(entry.key) ? '09-def-help' : '08-main-help',
      masters:['C-4'], platform:'shared', source:'languages/native/metadata_reuse_manifest.js + metadata_supplement.js',
      key:entry.key, title:`${entry.key}：${nested ? '当前根loader不可达范围复核；不得假勾显示PASS' : '实际同popup全文、原图、字形及清空'}`,
      expected,
      scoped: nested});
  }
  // -- ToolHelp源键保留库存；四种已批准工具动作仍由场景case验收 --
  const toolFile=TOOLHELP_SOURCE;
  const toolSource=fs.readFileSync(path.join(repo,toolFile),'utf8');
  sources[toolFile]=digest(toolSource);
  const lanes={ZhHans:'zh-Hans',ZhHant:'zh-Hant',JaJp:'ja_JP'};
  const toolEntries=new Map();
  for (const lane of toolSource.matchAll(/static constexpr TextEntry k(\w+)Entries\[\] = \{([\s\S]*?)\n\};/g)) {
    const locale=lanes[lane[1]];
    if (!locale) throw new Error(`unknown ToolHelp lane ${lane[1]}`);
    for (const item of lane[2].matchAll(/\/\/ \d+ ToolHelp: ([^\n]+)\n\s*\{native_getpath_font::Owner::ToolHelp, ("(?:[^"\\]|\\.)*")\}/g)) {
      const key=item[1].trim();
      const translations=toolEntries.get(key)||{};
      if (translations[locale]!==undefined) throw new Error(`duplicate ToolHelp source key ${locale}/${key}`);
      translations[locale]=JSON.parse(item[2]);
      toolEntries.set(key,translations);
    }
  }
  const toolHelpGroupByKey=new Map([
    ...['tool.transform.help.enableSnapping','tool.transform.shortcut.spaceClickDrag','tool.transform.help.pan',
      'tool.help.key.space','tool.transform.help.playStop','tool.transform.shortcut.holdS',
      'tool.transform.help.directLayerSelection','tool.transform.shortcut.sClickPath','tool.transform.help.insertKeyframe',
      'composite source=tool.shared.shortcut.drag; fixed prefix="Option/Alt + "',
      'composite source=tool.shared.shortcut.drag; fixed prefix="Shift + "',
      'composite source=tool.shared.shortcut.drag; fixed prefix="Cmd/Ctrl + "']
      .map(key=>[key,'tool-select']),
    ...['tool.editShape.help.bezierAngleSnap','tool.editShape.help.deleteBezierHandle','tool.editShape.help.disableSnapping',
      'tool.editShape.help.splitPathBezier','tool.editShape.help.splitPathCorner','tool.editShape.help.toggleTransformTool',
      'tool.editShape.shortcut.sClick','tool.editShape.shortcut.sDoubleClick','tool.editShape.shortcut.xClick']
      .map(key=>[key,'tool-editshape']),
    ...['tool.mesh.help.addEditBind','tool.mesh.help.createEdge','tool.mesh.help.disableSoftSelection',
      'tool.mesh.help.softSelectionSize'].map(key=>[key,'tool-mesh']),
    ...['tool.pivot.help.constrainAxis','tool.pivot.help.movePivotLayerMoves','tool.pivot.help.movePivotLayerStays',
      'tool.pivot.help.quickSetLayerMoves','tool.pivot.help.quickSetLayerStays','tool.pivot.help.toggleSnapping']
      .map(key=>[key,'tool-pivot']),
  ]);
  if (toolEntries.size!==66 || toolHelpGroupByKey.size!==31) throw new Error('ToolHelp source or approved group scope changed');
  const toolHelpInventory=[];
  for (const [key,translations] of toolEntries) {
    if (Object.keys(translations).sort().join('|')!==[...tri].sort().join('|')) throw new Error(`ToolHelp locale set changed: ${key}`);
    for (const locale of tri) {
      const id=`toolhelp-${digest(key).slice(0,16)}:${locale}`;
      const reference=toolHelpGroupByKey.get(key);
      toolHelpInventory.push({id,source:toolFile,sourceSha256:sources[toolFile],key,locale,
        text:translations[locale],scope:reference?'group-reference-only':'inventory-only',
        referenceCaseId:reference?`${reference}:${locale}`:null});
      if (includeLegacyCases) legacyCases.push({id,locale,batch:'03-toolhelp',masters:['F-2','F-3'],
        platform:'macos',source:toolFile,key,title:`固定自绘帮助 ${key}；同工具核文字、owner及键位`,expected:translations[locale]});
    }
  }
  // -- 六名称矩阵：180个细格保留索引，由15张整窗图负责实屏判定 --
  const timelineSource='.agents/skills/cavalry-native-display-check/references/surfaces.md';
  sources[timelineSource]=digest(fs.readFileSync(path.join(repo,timelineSource)));
  const timelineNames=['英文','简中','繁中','日文','混排','80字符长名'];
  const timelineStates=[['initial','初始'],['zoom','放大'],['horizontal-scroll','横滚'],
    ['narrow-crop','窄条裁切'],['vertical-scroll','竖滚']];
  const timelineSurfaces=['列表','时间条'];
  for (const locale of tri) for (const [stateId,state] of timelineStates) {
    const observationIds=[];
    for (const name of timelineNames) for (const surface of timelineSurfaces) {
      const key=`${name}/${state}/${surface}`;
      const id=`timeline-${digest(key).slice(0,16)}:${locale}`;
      const parentCaseId=`timeline-parent:${locale}:${stateId}`;
      const identityCaseId=`fixture:${locale}`,fullTextCaseId=`old-file:${locale}`;
      const expected='目标名称对应同一图层，完整处无缺字；裁切不越界，不以截图抵测量';
      const item={id,batch:'04-six-names',masters:['F-2'],platform:'shared',locale,key,
        source:timelineSource,title:key,expected};
      legacySceneCases.push(item);
      observationIds.push(id);
      sceneInventory.push({id,source:timelineSource,sourceSha256:sources[timelineSource],key,locale,
        nameClass:name,state,stateId,surface,expected,scope:'parent-image-observation',parentCaseId,
        identityCaseId,fullTextCaseId});
      if (legacySceneScope) cases.push(item);
    }
    const parent={id:`timeline-parent:${locale}:${stateId}`,batch:'04-six-names-parent',masters:['F-2'],
      platform:'shared',locale,key:stateId,source:timelineSource,
      title:`Timeline整窗图：${state}；同图核列表与时间条`,
      expected:'核六名身份、列表与时间条对应及可见字形。屏外不授字形信用。窄条裁切不得越界或污染邻条。身份与全文复用fixture及old-file锚点。截图不替代Measure/Draw证据。',
      observationIds,identityCaseId:`fixture:${locale}`,fullTextCaseId:`old-file:${locale}`,
      measureDrawCaseId:`measure-draw:${locale}`,surfaces:timelineSurfaces};
    timelineParentCases.push(parent);
    if (!legacySceneScope) cases.push(parent);
  }
  for (const locale of tri) for (const quality of ['Full','Low','Lowest']) for (const aa of ['Standard','Auto','Enhanced']) {
    const key=`${quality}/${aa}`;
    cases.push({id:`quality-${quality}-${aa}:${locale}`,locale,batch:'03-quality',masters:['F-2','F-3'],platform:'shared',key,
      source:'.agents/skills/cavalry-native-display-check/references/surfaces.md',title:`质量/AA ${key}`,
      expected:'先Full设置AA再切质量；读回值/enabled与实际文字。禁用的保留值不算生效；最后恢复'});
  }
  for (const file of ['tools/acceptance/masters.js','tools/acceptance/scenarios.js','tools/acceptance/catalog.js',
    '.agents/skills/cavalry-native-display-check/references/surfaces.md']) sources[file]=digest(fs.readFileSync(path.join(repo,file)));
  function validateCases(items) {
    const ids = new Set();
    for (const c of items) {
      if (ids.has(c.id)) throw new Error(`duplicate case ${c.id}`);
      ids.add(c.id);
      if (!c.expected) throw new Error(`missing expectation ${c.id}`);
      for (const id of c.masters) if (!masters.some(m=>m.id===id)) throw new Error(`unknown master ${id}`);
    }
  }
  validateCases(cases);
  const legacySceneIds=new Set(legacySceneCases.map(item=>item.id));
  const parentCaseIds=new Set(timelineParentCases.map(item=>item.id));
  const allLegacyCases = includeLegacyCases ? [
    ...cases.filter(c => !inventorySources.includes(c.source) && !legacySceneIds.has(c.id) && !parentCaseIds.has(c.id)),
    ...legacySceneCases,
    ...legacyCases,
  ] : null;
  if (allLegacyCases) validateCases(allLegacyCases);
  for (const master of masters) if (!cases.some(c=>c.masters.includes(master.id))) throw new Error(`unmapped ${master.id}`);
  const result = {schema:2, masters, cases, pluginInventory, toolHelpInventory, sceneInventory, sources};
  if (includeLegacyCases) result.legacyCases = allLegacyCases;
  return result;
}
module.exports = { buildCatalog, digest, sortCases };
