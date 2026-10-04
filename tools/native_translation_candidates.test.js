#!/usr/bin/env node
/**
 * [INPUT]: 依赖 native_translation_candidates.js 的旧 JSON/TS 候选索引接口；使用合成 surfaces 与已提取 TS 记录
 * [OUTPUT]: 验证语义路径、候选出处/歧义、nodeStrings/plugin 属性 tuple 边界、机器值隔离与确定性；不批准译文
 * [POS]: tools 的旧译复用合同，区分候选证据与审校决策，不解析 XML、不读真实 Cavalry 或用户 profile
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const api = () => require('./native_translation_candidates.js');
const surface = (id, locale, english, target) => ({ id, locale, english, target });
const mapped = (key, source, extra = {}) => ({ key, source, ...extra });

function appSurface(locale, translation) {
  return surface(
    'languages/en/appStrings.json', locale,
    [{ type: 'strings', language: 'en', value: { 'menu.open': 'Open' } }],
    [{ type: 'strings', language: locale, value: { 'menu.open': translation } }],
  );
}

function lookup(result, key, locale) {
  return result.rows.find(row => row.key === key).locales[locale];
}

test('JSON candidates align by semantic registry path and preserve traceable roles', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [appSurface('zh-Hans', '打开')],
    tsEntries: [],
    mappedEntries: [mapped('menu.open', 'Open', { sourceRole: 'global-ui' })],
  });

  assert.deepEqual(lookup(result, 'menu.open', 'zh-Hans'), {
    kind: 'exact-single-candidate',
    candidates: [{
      translation: '打开',
      origins: [{
        kind: 'json', id: 'languages/en/appStrings.json', locale: 'zh-Hans',
        path: '/value/menu.open', sourceRole: 'global-ui', writeback: false,
      }],
    }],
  });
});

test('legacy node labels, nodeInfo and attribute tuple roles remain distinguishable', () => {
  const english = [{ type: 'nodeStrings', value: {
    nodeType: 'group', niceName: 'Group',
    nodeInfo: 'Collect layers.',
    attributes: { groupMode: ['Blend Mode', 'Choose how layers combine.'], falloffs: 'Falloffs' },
  } }];
  const target = [{ type: 'nodeStrings', value: {
    nodeType: 'group', niceName: '组',
    nodeInfo: '收集图层。',
    attributes: { groupMode: ['混合模式', '选择图层的组合方式。'], falloffs: '衰减' },
  } }];
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/nodeStrings.json', 'zh-Hans', english, target)],
    tsEntries: [],
    mappedEntries: [
      mapped('nodeName:group', 'Group'),
      mapped('nodeInfo:group', 'Collect layers.'),
      mapped('nodeAttr:group.groupMode', 'Blend Mode'),
      mapped('attrInfo:group.groupMode', 'Choose how layers combine.'),
      mapped('nodeAttr:group.falloffs', 'Falloffs'),
    ],
  });

  const niceName = lookup(result, 'nodeName:group', 'zh-Hans').candidates[0].origins[0];
  assert.equal(niceName.sourceRole, 'legacy-node-name');
  assert.equal(niceName.displayOnly, true);
  assert.equal(niceName.writeback, false);
  assert.equal(lookup(result, 'nodeInfo:group', 'zh-Hans').candidates[0].origins[0].sourceRole, 'node-info');
  assert.equal(lookup(result, 'nodeAttr:group.groupMode', 'zh-Hans').candidates[0].origins[0].sourceRole, 'attribute-label');
  assert.equal(lookup(result, 'attrInfo:group.groupMode', 'zh-Hans').candidates[0].origins[0].sourceRole, 'attribute-info');
  assert.equal(lookup(result, 'nodeAttr:group.falloffs', 'zh-Hans').candidates[0].origins[0].sourceRole, 'attribute-label');
});

test('entity arrays align by stable identity after reordering, never by array position', () => {
  const english = [
    { type: 'nodeStrings', value: { nodeType: 'shape', niceName: 'Shape' } },
    { type: 'nodeStrings', value: { nodeType: 'group', niceName: 'Group' } },
  ];
  const target = [
    { type: 'nodeStrings', value: { nodeType: 'group', niceName: '组' } },
    { type: 'nodeStrings', value: { nodeType: 'shape', niceName: '形状' } },
  ];
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/nodeStrings.json', 'zh-Hans', english, target)],
    tsEntries: [], mappedEntries: [mapped('nodeName:shape', 'Shape')],
  });

  const candidate = lookup(result, 'nodeName:shape', 'zh-Hans').candidates[0];
  assert.equal(candidate.translation, '形状');
  assert.match(candidate.origins[0].path, /nodeType=shape/);
});

test('unidentifiable or changed entity arrays are skipped instead of positionally paired', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/nodeStrings.json', 'zh-Hans',
      [{ type: 'nodeStrings', value: { niceName: 'Old' } }],
      [{ type: 'nodeStrings', value: { niceName: '错误配对' } }])],
    tsEntries: [], mappedEntries: [mapped('nodeName:new', 'Old')],
  });

  assert.equal(lookup(result, 'nodeName:new', 'zh-Hans').kind, 'no-existing-candidate');
});

test('one unidentified or duplicate owner cannot suppress independently aligned siblings', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/nodeStrings.json', 'zh-Hans', [
      { type: 'nodeStrings', value: { nodeType: 'shape', niceName: 'Shape' } },
      { type: 'nodeStrings', value: { nodeType: 'duplicate', niceName: 'Duplicate A' } },
      { type: 'nodeStrings', value: { nodeType: 'duplicate', niceName: 'Duplicate B' } },
      { type: 'nodeStrings', values: [
        { nodeType: 'group', niceName: 'Group' }, { niceName: 'No stable owner' },
      ] },
    ], [
      { type: 'nodeStrings', values: [
        { nodeType: 'group', niceName: '组' }, { niceName: '错误数组位置配对' },
      ] },
      { type: 'nodeStrings', value: { nodeType: 'duplicate', niceName: '重复 A' } },
      { type: 'nodeStrings', value: { nodeType: 'shape', niceName: '形状' } },
      { type: 'nodeStrings', value: { nodeType: 'duplicate', niceName: '重复 B' } },
    ])],
    tsEntries: [],
    mappedEntries: [
      mapped('nodeName:shape', 'Shape'), mapped('nodeName:group', 'Group'),
      mapped('nodeName:duplicateA', 'Duplicate A'),
      mapped('nodeName:unknown', 'No stable owner'),
    ],
  });

  assert.equal(lookup(result, 'nodeName:shape', 'zh-Hans').candidates[0].translation, '形状');
  assert.equal(lookup(result, 'nodeName:group', 'zh-Hans').candidates[0].translation, '组');
  assert.equal(lookup(result, 'nodeName:duplicateA', 'zh-Hans').kind, 'no-existing-candidate');
  assert.equal(lookup(result, 'nodeName:unknown', 'zh-Hans').kind, 'no-existing-candidate');
});

test('machine identity, API signature, default/font and enum identity values are not indexed', () => {
  const english = [{
    type: 'nodeStrings', value: {
      nodeType: 'group', niceName: 'Group',
      enums: { mode: { '0': 'Artboard' } },
    },
  }];
  const translated = [{
    type: 'nodeStrings', value: {
      nodeType: 'group', niceName: '组',
      enums: { mode: { '0': '画板' } },
    },
  }];
  const definitionsEnglish = [{ nodeType: 'fontLayer', signature: 'addFont(QString)', defaultFont: 'Arial', enumValues: { machine_enum_0: 'InternalEnum' }, attributes: { color: { default: 'Blue' } } }];
  const definitionsTarget = [{ nodeType: 'fontLayer', signature: 'addFont(字符串)', defaultFont: '黑体', enumValues: { machine_enum_0: '内部枚举' }, attributes: { color: { default: '蓝色' } } }];
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [
      surface('languages/en/nodeStrings.json', 'zh-Hans', english, translated),
      surface('languages/en/Definitions/nodeDefinitions.json', 'zh-Hans', definitionsEnglish, definitionsTarget),
    ],
    tsEntries: [],
    mappedEntries: [
      mapped('nodeName:group', 'group'),
      mapped('nodeName:fontLayer', 'fontLayer'),
      mapped('nodeInfo:fontLayer', 'addFont(QString)'),
      mapped('attrInfo:fontLayer.color', 'Blue'),
      mapped('nodeAttrEnum:fontLayer.color.InternalEnum', 'InternalEnum'),
    ],
  });

  for (const row of result.rows) assert.equal(row.locales['zh-Hans'].kind, 'no-existing-candidate');
});

test('attribute tuples are reused only from nodeStrings or plugin translations, never model definitions', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [
      surface('languages/en/nodeStrings.json', 'zh-Hans', [{ type: 'nodeStrings', value: {
        nodeType: 'group', attributes: { opacity: ['Opacity', 'Controls opacity.'] },
      } }], [{ type: 'nodeStrings', value: {
        nodeType: 'group', attributes: { opacity: ['不透明度', '控制不透明度。'] },
      } }]),
      surface('languages/en/plugins/blurFilter.json', 'zh-Hans', [{ type: 'layerStrings', value: {
        author: 'sceneGroup', layerType: 'blur', attributes: { radius: ['Radius', 'Sets blur radius.'] },
      } }], [{ type: 'layerStrings', value: {
        author: 'sceneGroup', layerType: 'blur', attributes: { radius: ['半径', '设置模糊半径。'] },
      } }]),
      surface('languages/en/Definitions/nodeDefinitions.json', 'zh-Hans', [
        { nodeType: 'fontLayer', attributes: { color: ['Blue', 'Choose a blue value.'] } },
      ], [
        { nodeType: 'fontLayer', attributes: { color: ['蓝色', '选择蓝色值。'] } },
      ]),
    ],
    tsEntries: [],
    mappedEntries: [
      mapped('nodeAttr:group.opacity', 'Opacity'),
      mapped('attrInfo:group.opacity', 'Controls opacity.'),
      mapped('nodeAttr:sceneGroup::blur.radius', 'Radius'),
      mapped('attrInfo:sceneGroup::blur.radius', 'Sets blur radius.'),
      mapped('model.defaultColor', 'Blue'),
    ],
  });

  assert.equal(lookup(result, 'nodeAttr:group.opacity', 'zh-Hans').candidates[0].translation, '不透明度');
  assert.equal(lookup(result, 'attrInfo:group.opacity', 'zh-Hans').candidates[0].translation, '控制不透明度。');
  assert.equal(lookup(result, 'nodeAttr:sceneGroup::blur.radius', 'zh-Hans').candidates[0].translation, '半径');
  assert.equal(lookup(result, 'attrInfo:sceneGroup::blur.radius', 'zh-Hans').candidates[0].translation, '设置模糊半径。');
  assert.equal(lookup(result, 'model.defaultColor', 'zh-Hans').kind, 'no-existing-candidate');
});

test('API metadata aligns by namespace/name but exposes descriptions only', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/MetaData/api_function_metadata.json', 'zh-Hans', [
      { name: 'translate', namespace: '@JS_POINT', type: 'function', signature: 'translate(QString)', description: 'Translates a point.' },
      { name: 'translate', namespace: '@JS_VECTOR', type: 'function', signature: 'translate(QString)', description: 'Translates a vector.' },
    ], [
      { name: 'translate', namespace: '@JS_VECTOR', type: 'function', signature: 'translate(字符串)', description: '转换向量。' },
      { name: 'translate', namespace: '@JS_POINT', type: 'function', signature: 'translate(字符串)', description: '转换点。' },
    ])],
    tsEntries: [],
    mappedEntries: [
      mapped('api.point', 'Translates a point.'),
      mapped('api.vector', 'Translates a vector.'),
      mapped('api.signature', 'translate(QString)'),
      mapped('api.functionName', 'translate'),
    ],
  });

  const candidate = lookup(result, 'api.point', 'zh-Hans').candidates[0];
  assert.equal(candidate.translation, '转换点。');
  assert.equal(candidate.origins[0].sourceRole, 'api-description');
  assert.match(candidate.origins[0].path, /namespace=@JS_POINT::name=translate/);
  assert.equal(lookup(result, 'api.vector', 'zh-Hans').candidates[0].translation, '转换向量。');
  assert.equal(lookup(result, 'api.signature', 'zh-Hans').kind, 'no-existing-candidate');
  assert.equal(lookup(result, 'api.functionName', 'zh-Hans').kind, 'no-existing-candidate');
});

test('legacy system preset names are display-only while embedded preset data stays excluded', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/Definitions/systemPresets.json', 'zh-Hans', [
      { id: 'preset-a', name: 'Export Still', attrs: { fileName: 'output.png' } },
      { id: 'preset-b', name: 'Export Video', attrs: { codec: 'h264' } },
    ], [
      { id: 'preset-b', name: '导出视频', attrs: { codec: 'h264-翻译误写' } },
      { id: 'preset-a', name: '导出静帧', attrs: { fileName: '输出.png' } },
    ])],
    tsEntries: [],
    mappedEntries: [mapped('preset.still', 'Export Still'), mapped('preset.data', 'output.png')],
  });
  const candidate = lookup(result, 'preset.still', 'zh-Hans').candidates[0];
  assert.equal(candidate.translation, '导出静帧');
  assert.equal(candidate.origins[0].sourceRole, 'legacy-preset-name');
  assert.equal(candidate.origins[0].displayOnly, true);
  assert.equal(lookup(result, 'preset.data', 'zh-Hans').kind, 'no-existing-candidate');
});

test('legacy model display translations are explicit display-only candidates', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('tools/model_display_translations.json', 'zh-Hans', {
      entries: [{ source: 'Atomic', translation: 'Atomic' }],
    }, {
      entries: [{ source: 'Atomic', translation: '原子' }],
    })],
    tsEntries: [], mappedEntries: [mapped('nodeCategory.atomic', 'Atomic')],
  });
  const candidate = lookup(result, 'nodeCategory.atomic', 'zh-Hans').candidates[0];
  assert.equal(candidate.translation, '原子');
  assert.equal(candidate.origins[0].sourceRole, 'model-display');
  assert.equal(candidate.origins[0].displayOnly, true);
  assert.equal(candidate.origins[0].writeback, false);
  assert.equal(candidate.origins[0].path, '/entries/source=Atomic/translation');
});

test('untyped attribute values, guide references/scripts and unstable content arrays are not guessed as UI copy', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [
      surface('languages/en/nodeStrings.json', 'zh-Hans', [{ type: 'nodeStrings', value: {
        nodeType: 'shape', attributes: { opacity: { currentValue: '30', userExpression: 'input.opacity' } },
      } }], [{ type: 'nodeStrings', value: {
        nodeType: 'shape', attributes: { opacity: { currentValue: '三十', userExpression: '输入.opacity' } },
      } }]),
      surface('languages/en/Learn/Guides/guides.json', 'zh-Hans', {
        guides: [{ id: 'intro', validationFailScript: 'createShape()', steps: [{ titleKey: 'guide.title' }] }],
      }, {
        guides: [{ id: 'intro', validationFailScript: '创建形状()', steps: [{ titleKey: '导览.标题' }] }],
      }),
      surface('languages/en/tips.json', 'zh-Hans', [{ title: 'Save your work' }], [{ title: '保存作品' }]),
    ],
    tsEntries: [],
    mappedEntries: [
      mapped('user.value', '30'), mapped('user.expression', 'input.opacity'),
      mapped('guide.script', 'createShape()'), mapped('guide.key', 'guide.title'),
      mapped('tip.title', 'Save your work'),
    ],
  });

  for (const row of result.rows) assert.equal(row.locales['zh-Hans'].kind, 'no-existing-candidate');
});

test('enum display labels remain candidates while enum identifiers remain path identity only', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/nodeStrings.json', 'zh-Hans',
      [{ type: 'nodeStrings', value: { nodeType: 'curvesFilter', enums: { rgb: { RGB: 'RGB' } } } }],
      [{ type: 'nodeStrings', value: { nodeType: 'curvesFilter', enums: { rgb: { RGB: 'RGB显示' } } } }])],
    tsEntries: [], mappedEntries: [mapped('nodeAttrEnum:curvesFilter.rgb.0', 'RGB')],
  });

  const origin = lookup(result, 'nodeAttrEnum:curvesFilter.rgb.0', 'zh-Hans').candidates[0].origins[0];
  assert.equal(lookup(result, 'nodeAttrEnum:curvesFilter.rgb.0', 'zh-Hans').candidates[0].translation, 'RGB显示');
  assert.equal(origin.sourceRole, 'enum-label');
  assert.match(origin.path, /enums\/rgb\/RGB$/);
});

test('same-source conflicts across JSON paths retain every distinct translation and origin', () => {
  const first = appSurface('zh-Hans', '打开');
  const second = surface('languages/en/nodeStrings.json', 'zh-Hans',
    [{ type: 'nodeStrings', value: { nodeType: 'shape', nodeInfo: 'Open' } }],
    [{ type: 'nodeStrings', value: { nodeType: 'shape', nodeInfo: '开启' } }]);
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [second, first], tsEntries: [], mappedEntries: [mapped('menu.open', 'Open')],
  });
  const candidate = lookup(result, 'menu.open', 'zh-Hans');

  assert.equal(candidate.kind, 'exact-ambiguous');
  assert.deepEqual(candidate.candidates.map(row => row.translation), ['开启', '打开']);
  assert.equal(candidate.candidates.reduce((sum, row) => sum + row.origins.length, 0), 2);
});

test('TS candidates preserve same-source context conflicts and merge origins only for identical translations', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [],
    tsEntries: [
      { locale: 'zh-Hans', context: 'FileMenu', source: 'Open', translation: '打开' },
      { locale: 'zh-Hans', context: 'Dialog', source: 'Open', translation: '开启' },
      { locale: 'zh-Hans', context: 'Toolbar', source: 'Open', translation: '打开' },
    ],
    mappedEntries: [mapped('menu.open', 'Open')],
  });
  const candidates = lookup(result, 'menu.open', 'zh-Hans');

  assert.equal(candidates.kind, 'exact-ambiguous');
  assert.deepEqual(candidates.candidates.map(row => row.translation), ['开启', '打开']);
  const open = candidates.candidates.find(row => row.translation === '打开');
  assert.deepEqual(open.origins.map(origin => origin.context), ['FileMenu', 'Toolbar']);
});

test('empty, untranslated and inactive TS entries do not count as reusable candidates', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [],
    tsEntries: [
      { locale: 'zh-Hans', context: 'Empty', source: 'Save', translation: '' },
      { locale: 'zh-Hans', context: 'Copy', source: 'Save', translation: 'Save' },
      { locale: 'zh-Hans', context: 'Unfinished', source: 'Save', translation: '保存', status: 'unfinished' },
      { locale: 'zh-Hans', context: 'Obsolete', source: 'Save', translation: '儲存', status: 'obsolete' },
      { locale: 'zh-Hans', context: 'Untranslated', source: 'Save', translation: 'Speichern', status: 'untranslated' },
      { locale: 'zh-Hans', context: 'Plural', source: 'Save %n files', translation: '保存 %n 个文件', plural: true },
    ],
    mappedEntries: [mapped('menu.save', 'Save')],
  });

  assert.equal(lookup(result, 'menu.save', 'zh-Hans').kind, 'no-existing-candidate');
});

test('candidate records are not approvals or writeback instructions', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [appSurface('zh-Hans', '打开')], tsEntries: [], mappedEntries: [mapped('menu.open', 'Open')],
  });
  const row = result.rows[0];

  assert.equal(row.locales['zh-Hans'].candidates[0].translation, '打开');
  assert.equal(Object.hasOwn(row, 'decision'), false);
  assert.equal(Object.hasOwn(row, 'approved'), false);
  assert.equal(Object.hasOwn(row.locales['zh-Hans'], 'text'), false);
  assert.equal(Object.hasOwn(row.locales['zh-Hans'].candidates[0], 'writeback'), false);
});

test('mapped catalog metadata is preserved as metadata, never applied to candidate text', () => {
  const inputEntry = mapped('menu.open', 'Open', {
    catalogId: 'appStrings', fieldPath: ['menu', 'open'], owner: 'menu',
    notes: ['context needed'], dontTranslate: false, vendorJapanese: '開く',
  });
  const snapshot = JSON.stringify(inputEntry);
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [appSurface('zh-Hans', '打开')], tsEntries: [], mappedEntries: [inputEntry],
  });
  const row = result.rows[0];

  assert.equal(row.catalogId, 'appStrings');
  assert.deepEqual(row.fieldPath, ['menu', 'open']);
  assert.equal(row.owner, 'menu');
  assert.deepEqual(row.notes, ['context needed']);
  assert.equal(row.dontTranslate, false);
  assert.equal(row.vendorJapanese, '開く');
  assert.equal(row.locales['zh-Hans'].candidates[0].translation, '打开');
  assert.equal(JSON.stringify(inputEntry), snapshot);
});

test('empty candidates are explicit and no normalized/source-similarity fallback is guessed', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [appSurface('zh-Hans', '打开')], tsEntries: [], mappedEntries: [mapped('menu.open', ' Open ')],
  });

  assert.deepEqual(lookup(result, 'menu.open', 'zh-Hans'), { kind: 'no-existing-candidate', candidates: [] });
});

test('candidate origin pointers use semantic entity identities rather than record indices', () => {
  const result = api().buildTranslationCandidates({
    jsonSurfaces: [surface('languages/en/nodeStrings.json', 'zh-Hans',
      [{ type: 'nodeStrings', value: { nodeType: 'shape', niceName: 'Shape' } }],
      [{ type: 'nodeStrings', value: { nodeType: 'shape', niceName: '形状' } }])],
    tsEntries: [], mappedEntries: [mapped('nodeName:shape', 'Shape')],
  });

  const path = lookup(result, 'nodeName:shape', 'zh-Hans').candidates[0].origins[0].path;
  assert.equal(path, '/nodeType=shape/value/niceName');
  assert.doesNotMatch(path, /^\/\d+/);
});

test('inputs are immutable and reordered equivalent inputs produce deeply identical output', () => {
  const first = appSurface('zh-Hans', '打开');
  const second = surface('languages/en/onboarding.json', 'zh-Hans', { body: 'Open' }, { body: '开启' });
  const ts = [
    { locale: 'ja_JP', context: 'Menu', source: 'Save', translation: '保存' },
    { locale: 'zh-Hant', context: 'Menu', source: 'Save', translation: '儲存' },
  ];
  const entries = [mapped('menu.open', 'Open'), mapped('menu.save', 'Save')];
  const snapshot = JSON.stringify({ first, second, ts, entries });
  const input = { jsonSurfaces: [first, second], tsEntries: ts, mappedEntries: entries };

  const forward = api().buildTranslationCandidates(input);
  const reverse = api().buildTranslationCandidates({
    jsonSurfaces: [second, first], tsEntries: [...ts].reverse(), mappedEntries: [...entries].reverse(),
  });
  assert.deepEqual(forward, reverse);
  assert.equal(JSON.stringify({ first, second, ts, entries }), snapshot);
});

test('invalid input and duplicate new registry keys fail closed', () => {
  assert.throws(() => api().buildTranslationCandidates({}), /jsonSurfaces/);
  assert.throws(() => api().buildTranslationCandidates({
    jsonSurfaces: [], tsEntries: [], mappedEntries: [mapped('same', 'A'), mapped('same', 'B')],
  }), /duplicate.*same/);
});
