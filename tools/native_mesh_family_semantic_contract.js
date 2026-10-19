/**
 * [INPUT]: 依赖六个root审定mesh-family owner显示行、封板source/notes与当前approved caption行。
 * [OUTPUT]: 提供共享混合模式、源绑定语义关系、界面标签引用及有限修订锚点断言。
 * [POS]: 构建期测试专属语义合同；只验证有限且可溯源的显示关系，不实现通用NLP或运行时逻辑。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const assert = require('node:assert/strict');
const LOCALES = Object.freeze(['zh-Hans', 'zh-Hant', 'ja_JP']);
const BLEND_MODE_INDEXES = Object.freeze(['1', '12', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '3']);

// -- root已批准显示输入中15个实际修订槽的精确回归锚点 ---------------------
const ROOT_APPROVED_REVISIONS = Object.freeze([
  ['attrInfo:meshDistribution.count', 'ja_JP', '使用するサブメッシュの最大数です。「すべて塗りつぶす」がオンの場合、この設定は無視されます。', '使用するサブメッシュの最大数です。「すべて使用」がオンの場合、この設定は無視されます。'],
  ['attrInfo:meshDistribution.count', 'zh-Hans', '使用的子网格最大数量。启用“全部填充”时，此设置会被忽略。', '使用的子网格最大数量。启用“全部使用”时，此设置会被忽略。'],
  ['attrInfo:meshDistribution.count', 'zh-Hant', '使用的子網格最大數量。啟用「全部填滿」時，此設定會被忽略。', '使用的子網格最大數量。啟用「全部使用」時，此設定會被忽略。'],
  ['attrInfo:randomDistribution.maxRelaxIterations', 'ja_JP', 'リラックス処理の最大反復回数です。値を大きくするとポイント間隔は均等になりますが、計算量が増えます。', 'リラックス処理の最大反復回数です。値を大きくするとポイント間隔がより均等になりますが、計算量が増えます。'],
  ['attrInfo:randomDistribution.shapeType', 'ja_JP', 'ポイントを散布する領域です。「サイズ」の矩形、または「サイズ」に内接する楕円を選びます。', 'ポイントを散布する領域です。「領域サイズ」で指定した矩形、またはその矩形に内接する楕円を選びます。'],
  ['attrInfo:randomDistribution.shapeType', 'zh-Hans', '点的散布区域：矩形（“大小”边框）或内切于“大小”边框的椭圆。', '点的散布区域：由“区域大小”定义的矩形，或内切于该矩形的椭圆。'],
  ['attrInfo:randomDistribution.shapeType', 'zh-Hant', '點的散布區域：矩形（「大小」邊框）或內切於「大小」邊框的橢圓。', '點的散布區域：由「區域大小」定義的矩形，或內切於該矩形的橢圓。'],
  ['nodeAttr:meshDistribution.fill', 'ja_JP', 'すべて塗りつぶす', 'すべて使用'],
  ['nodeAttr:meshDistribution.fill', 'zh-Hans', '全部填充', '全部使用'],
  ['nodeAttr:meshDistribution.fill', 'zh-Hant', '全部填滿', '全部使用'],
  ['nodeInfo:meshDistribution', 'ja_JP', '子メッシュの位置にポイントを分布します。', 'サブメッシュの位置にポイントを配置します。'],
  ['nodeInfo:pathField', 'ja_JP', 'シェイプにパスに沿って作用する力を加えます。', 'シェイプにパスに追従させる力を加えます。'],
  ['nodeInfo:pathField', 'zh-Hans', '对形状施加沿路径运动的力。', '对形状施加路径跟随力。'],
  ['nodeInfo:pathField', 'zh-Hant', '對形狀施加沿路徑運動的力。', '對形狀施加路徑追隨力。'],
  ['nodeInfo:randomDistribution', 'ja_JP', 'ポイントをランダムな位置に分布します。', 'ポイントをランダムな位置に配置します。'],
]);

// -- 仅保留封板官方说明明确给出的源义锚点 -----------------------------
const SOURCE_FACTS = Object.freeze([
  ['attrInfo:meshDistribution.count', 'Ignored when Fill All is on.', 'sub-mesh'],
  ['attrInfo:meshDistribution.fill', 'regardless of Count.', 'sub-mesh'],
  ['attrInfo:meshDistribution.ignoreEmptySubMeshes', 'rather than emitting a point', 'sub-mesh'],
  ['attrInfo:meshDistribution.inputShape', 'Each sub-mesh contributes one point', 'sub-mesh'],
  ['attrInfo:meshDistribution.keepAspectRatio', 'using the smaller axis', 'X and Y components'],
  ['attrInfo:meshDistribution.level', '0 is the root mesh', 'root mesh'],
  ['attrInfo:meshDistribution.useLevels', 'sample every sub-mesh in the hierarchy', 'nested mesh'],
  ['attrInfo:meshDistribution.scaleToFit', 'per-point scale', 'Bounding box'],
  ['attrInfo:meshShape.size', 'Set the size of the Shape.', 'width and height'],
  ['nodeAttr:meshShape.resolution', 'Size', 'number of grid subdivisions'],
  ['nodeAttr:meshShape.size', 'Size', 'overall width and height'],
  ['nodeAttr:meshShape.meshVertex.bindPath', 'Offset Path', 'used to move the vertex'],
  ['nodeAttr:meshShape.meshVertex.offsetPath', 'Bind Path', 'original, undeformed position'],
  ['attrInfo:meshShape.meshVertex.bindPosition', 'Set the starting position', 'original, undeformed location'],
  ['attrInfo:meshShape.meshVertex.offset', 'from its Bind Position', 'original, undeformed position'],
  ['attrInfo:pathField.captureForce', 'pulling bodies towards the path', 'attraction force'],
  ['attrInfo:pathField.flowForce', 'along the path tangent', 'direction of travel'],
  ['attrInfo:pathField.flowVariance', 'randomness to flow direction', 'procedural variation'],
  ['attrInfo:pathField.velocityDamping', 'Higher values create more stable but slower motion.', 'back-and-forth jittering motion'],
  ['nodeInfo:pathField', 'Apply path-following forces', 'defined curve/path'],
  ['attrInfo:randomDistribution.probability', '(0–1)', 'min/max band'],
  ['attrInfo:randomDistribution.keepShape', 'culled rather than clamped', 'removed entirely'],
  ['attrInfo:randomDistribution.relaxDistance', 'in pixels.', 'nudges points apart'],
  ['attrInfo:randomDistribution.size', 'in pixels.', 'randomly placed'],
  ['attrInfo:randomDistribution.maxRelaxIterations', 'more even spacing', 'processing time/resources'],
  ['attrInfo:randomDistribution.shapeType', 'Ellipse (inscribed in Size)', 'fit exactly within'],
  ['attrInfo:randomDistribution.seed', 'same point set.', 'reproducible'],
  ['nodeInfo:skslFilter', 'SkSL (based on GLSL)', 'shading languages'],
  ['attrInfo:skslFilter.code', 'SkSL code here.', 'programming source text'],
  ['attrInfo:skslFilter.padding', 'outside of the original Shape’s boundary', 'outer edge'],
  ['nodeAttrEnum:thirdPartyFilter.samplingQuality.2', 'Catmull-Rom', 'specific image-scaling algorithm'],
  ['nodeAttrEnum:thirdPartyFilter.samplingQuality.3', 'Mitchell', 'Mitchell-Netravali'],
]);

// -- 各locale只锚定能区分source含义的短语，不锁整份译文 --------------
const TEXT_FACTS = Object.freeze([
  { key: 'attrInfo:meshDistribution.fill', parts: {
    'zh-Hans': ['每个子网格', '不受', '数量', '限制'],
    'zh-Hant': ['每個子網格', '不受', '數量', '限制'],
    ja_JP: ['すべてのサブメッシュ', '数', '適用されません'],
  } },
  { key: 'attrInfo:meshDistribution.count', parts: {
    'zh-Hans': ['全部使用', '被忽略'],
    'zh-Hant': ['全部使用', '被忽略'],
    ja_JP: ['すべて使用', '無視されます'],
  } },
  { key: 'attrInfo:meshDistribution.keepAspectRatio', parts: {
    'zh-Hans': ['X、Y', '较小的值', '相同值'],
    'zh-Hant': ['X、Y', '較小的值', '相同值'],
    ja_JP: ['X と Y', '小さい方の値', '揃え'],
  } },
  { key: 'attrInfo:meshDistribution.level', parts: {
    'zh-Hans': ['0 表示根网格', '更深层级', '嵌套子网格'],
    'zh-Hant': ['0 表示根網格', '更深層級', '巢狀子網格'],
    ja_JP: ['0はルートメッシュ', 'それより深いレベル', 'ネストされたサブメッシュ'],
  } },
  { key: 'attrInfo:meshDistribution.useLevels', parts: {
    'zh-Hans': ['启用时', '所选', '关闭时', '所有子网格'],
    'zh-Hant': ['啟用時', '所選', '關閉時', '所有子網格'],
    ja_JP: ['オンにすると', '選択した', 'オフにすると', 'すべてのサブメッシュ'],
  } },
  { key: 'attrInfo:meshDistribution.scaleToFit', parts: {
    'zh-Hans': ['逐点缩放值', '边界框大小', '各单元格'],
    'zh-Hant': ['逐點縮放值', '邊界框大小', '各儲存格'],
    ja_JP: ['ポイントごとのスケール', 'バウンディングボックス', '各セル'],
  } },
  { key: 'attrInfo:meshDistribution.ignoreEmptySubMeshes', parts: {
    'zh-Hans': ['跳过', '没有几何', '而不是', '点'],
    'zh-Hant': ['略過', '沒有幾何', '而不是', '點'],
    ja_JP: ['スキップ', 'ジオメトリのない', 'ポイントを生成しません'],
  } },
  { key: 'attrInfo:meshDistribution.inputShape', parts: {
    'zh-Hans': ['每个子网格', '一个', '中心', '点'],
    'zh-Hant': ['每個子網格', '一個', '中心', '點'],
    ja_JP: ['各サブメッシュ', '1つ', 'ポイント', '中心'],
  } },
  { key: 'nodeAttr:meshShape.resolution', parts: {
    'zh-Hans': ['网格', '细分数'],
    'zh-Hant': ['網格', '細分數'],
    ja_JP: ['メッシュ', '分割数'],
  } },
  { key: 'nodeAttr:meshShape.size', parts: {
    'zh-Hans': ['尺寸'], 'zh-Hant': ['尺寸'], ja_JP: ['サイズ'],
  } },
  { key: 'attrInfo:meshShape.size', parts: {
    'zh-Hans': ['形状', '尺寸'], 'zh-Hant': ['形狀', '尺寸'], ja_JP: ['シェイプ', 'サイズ'],
  } },
  { key: 'nodeAttr:meshShape.meshVertex.bindPath', parts: {
    'zh-Hans': ['偏移'], 'zh-Hant': ['偏移'], ja_JP: ['オフセット'],
  } },
  { key: 'nodeAttr:meshShape.meshVertex.offsetPath', parts: {
    'zh-Hans': ['绑定'], 'zh-Hant': ['綁定'], ja_JP: ['バインド'],
  } },
  { key: 'attrInfo:meshShape.meshVertex.bindPosition', parts: {
    'zh-Hans': ['起始位置'], 'zh-Hant': ['起始位置'], ja_JP: ['開始位置'],
  } },
  { key: 'attrInfo:meshShape.meshVertex.offset', parts: {
    'zh-Hans': ['相对于绑定位置'], 'zh-Hant': ['相對於綁定位置'], ja_JP: ['バインド位置から'],
  } },
  { key: 'attrInfo:pathField.captureForce', parts: {
    'zh-Hans': ['拉向路径', '强度'], 'zh-Hant': ['拉向路徑', '強度'], ja_JP: ['引き寄せる', '力の強さ'],
  } },
  { key: 'attrInfo:pathField.flowForce', parts: {
    'zh-Hans': ['切线', '推动物体'], 'zh-Hant': ['切線', '推動物體'], ja_JP: ['接線方向', '物体を動かす'],
  } },
  { key: 'attrInfo:pathField.flowVariance', parts: {
    'zh-Hans': ['流动方向', '随机变化'], 'zh-Hant': ['流動方向', '隨機變化'], ja_JP: ['フロー方向', 'ばらつき'],
  } },
  { key: 'attrInfo:pathField.velocityDamping', parts: {
    'zh-Hans': ['抑制物体速度', '越稳定', '越慢'],
    'zh-Hant': ['抑制物體速度', '越穩定', '越慢'],
    ja_JP: ['速度を抑えて', '安定します', '遅くなります'],
  } },
  { key: 'attrInfo:randomDistribution.probability', parts: {
    'zh-Hans': ['启用', '每个点', '概率（0–1）', '阈值'],
    'zh-Hant': ['啟用', '每個點', '機率（0–1）', '閾值'],
    ja_JP: ['オンのとき', '各ポイント', '確率（0～1）', 'しきい値'],
  } },
  { key: 'attrInfo:randomDistribution.keepShape', parts: {
    'zh-Hans': ['边界形状外', '剔除', '钳制'],
    'zh-Hant': ['邊界形狀外', '剔除', '限制'],
    ja_JP: ['境界形状の外', 'クランプ', '除去'],
  } },
  { key: 'attrInfo:randomDistribution.relaxDistance', parts: {
    'zh-Hans': ['任意两点', '最小距离', '像素'],
    'zh-Hant': ['任意兩點', '最小距離', '像素'],
    ja_JP: ['任意の2ポイント間', '最小距離', 'ピクセル'],
  } },
  { key: 'attrInfo:randomDistribution.size', parts: {
    'zh-Hans': ['宽度和高度', '像素'],
    'zh-Hant': ['寬度和高度', '像素'],
    ja_JP: ['幅と高さ', 'ピクセル'],
  } },
  { key: 'attrInfo:randomDistribution.maxRelaxIterations', parts: {
    'zh-Hans': ['值越高', '点间距越均匀', '计算量'],
    'zh-Hant': ['值越高', '點間距越均勻', '計算量'],
    ja_JP: ['より均等', '計算量'],
  } },
  { key: 'attrInfo:randomDistribution.shapeType', parts: {
    'zh-Hans': ['区域大小', '矩形', '内切', '椭圆'],
    'zh-Hant': ['區域大小', '矩形', '內切', '橢圓'],
    ja_JP: ['領域サイズ', '矩形', '内接', '楕円'],
  } },
  { key: 'attrInfo:randomDistribution.seed', parts: {
    'zh-Hans': ['整数种子', '相同种子', '相同的点集'],
    'zh-Hant': ['整數種子', '相同種子', '相同的點集合'],
    ja_JP: ['整数シード', '同じシード', '同じポイント群'],
  } },
  { key: 'nodeInfo:skslFilter', parts: {
    'zh-Hans': ['SkSL', 'GLSL'], 'zh-Hant': ['SkSL', 'GLSL'], ja_JP: ['SkSL', 'GLSL'],
  } },
  { key: 'attrInfo:skslFilter.code', parts: {
    'zh-Hans': ['SkSL'], 'zh-Hant': ['SkSL'], ja_JP: ['SkSL'],
  } },
  { key: 'attrInfo:skslFilter.padding', parts: {
    'zh-Hans': ['像素超出', '边界', '扩展'],
    'zh-Hant': ['像素超出', '邊界', '擴展'],
    ja_JP: ['境界外にピクセル', '境界を拡張'],
  } },
]);

const CAPTION_EQUALITIES = Object.freeze([
  ['nodeAttr:meshShape.mesh', 'tool.mesh.name'],
  ['nodeAttr:randomDistribution.probability', 'nodeAttr:falloff.useProbability'],
  ['nodeAttr:skslFilter.padding', 'nodeAttr:distortionFilter.padding'],
  ['nodeAttr:skslFilter.padding', 'nodeAttr:rgbSplitFilter.viewPort'],
  ['nodeAttr:skslFilter.blendMode', 'nodeAttr:shape.blendMode'],
  ['nodeAttr:thirdPartyFilter.blendMode', 'nodeAttr:shape.blendMode'],
]);

const LITERAL_DIFFERENCES = Object.freeze([
  ['nodeAttr:meshShape.resolution', 'nodeAttr:meshShape.size'],
]);

function entryMap(entries) {
  return new Map(entries.map(row => [row.key, row]));
}

function moduleRowMap(modules) {
  return new Map(modules.flatMap(module => module.data.entries).map(row => [row.key, row]));
}

function assertMatchingDisplayPair(rows, leftKey, rightKey) {
  const left = rows.get(leftKey);
  const right = rows.get(rightKey);
  assert.ok(left, `source-bound display row exists: ${leftKey}`);
  assert.ok(right, `source-bound display row exists: ${rightKey}`);
  for (const field of ['source', 'notes', 'displayRole', 'dontTranslate']) {
    assert.deepEqual(left[field], right[field], `${leftKey}/${rightKey} same ${field}`);
  }
  for (const locale of LOCALES) {
    assert.equal(left.translations[locale].decision, right.translations[locale].decision, `${leftKey}/${rightKey} reviewed ${locale} decision pair`);
    assert.equal(left.translations[locale].text, right.translations[locale].text, `${leftKey}/${rightKey} reviewed ${locale} display pair`);
  }
}

function assertFiniteSemanticContracts(modules) {
  const rows = moduleRowMap(modules);
  assertMatchingDisplayPair(rows, 'nodeAttr:skslFilter.blendMode', 'nodeAttr:thirdPartyFilter.blendMode');
  for (const index of BLEND_MODE_INDEXES) {
    assertMatchingDisplayPair(rows, `nodeAttrEnum:skslFilter.blendMode.${index}`, `nodeAttrEnum:thirdPartyFilter.blendMode.${index}`);
  }
}

function assertSourceProjection(entries, sourceEntries) {
  const actual = entryMap(entries);
  const expected = entryMap(sourceEntries);
  assert.equal(actual.size, expected.size, 'candidate and sealed source have the same unique-key count');
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort(), 'candidate keys equal sealed 152-key source');
  for (const [key, source] of expected) {
    const row = actual.get(key);
    for (const field of ['catalogId', 'owner', 'fieldPath', 'source', 'notes', 'sourceRole', 'displayRole', 'dontTranslate', 'vendorJapanese', 'vendorJapaneseChanged']) {
      assert.ok(Object.hasOwn(source, field), `sealed source carries actual ${field}: ${key}`);
      assert.ok(Object.hasOwn(row, field), `candidate carries actual ${field}: ${key}`);
      assert.deepEqual(row[field], source[field], `${key} exact source-bound ${field}`);
    }
  }
}

function assertOfficialSourceFacts(sourceRows) {
  const rows = entryMap(sourceRows);
  for (const [key, sourceFragment, noteFragment] of SOURCE_FACTS) {
    const row = rows.get(key);
    assert.ok(row, `sealed source row exists: ${key}`);
    assert.ok(row.source.includes(sourceFragment), `${key} official source fact: ${sourceFragment}`);
    assert.ok(row.notes.some(note => note.includes(noteFragment)), `${key} official note fact: ${noteFragment}`);
  }
}

function assertLocalizedFacts(candidateRows) {
  const rows = entryMap(candidateRows);
  for (const fact of TEXT_FACTS) {
    const row = rows.get(fact.key);
    assert.ok(row, `candidate semantic row exists: ${fact.key}`);
    for (const locale of LOCALES) {
      const text = row.translations[locale].text;
      for (const fragment of fact.parts[locale]) {
        assert.ok(text.includes(fragment), `${fact.key}/${locale} keeps source-bound meaning fragment: ${fragment}`);
      }
    }
  }
}

function assertCaptionReferences(candidateRows, currentCaptionRows) {
  const candidate = entryMap(candidateRows);
  const captions = entryMap(currentCaptionRows);
  for (const [targetKey, referenceKey] of CAPTION_EQUALITIES) {
    const target = candidate.get(targetKey);
    const reference = captions.get(referenceKey);
    assert.ok(target, `candidate caption exists: ${targetKey}`);
    assert.ok(reference, `already-approved caption exists: ${referenceKey}`);
    for (const locale of LOCALES) {
      assert.equal(target.translations[locale].text, reference.translations[locale].text, `${targetKey}/${referenceKey} ${locale} approved label reference`);
    }
  }
  for (const [leftKey, rightKey] of LITERAL_DIFFERENCES) {
    const left = candidate.get(leftKey), right = candidate.get(rightKey);
    assert.ok(left && right, 'both Size source roles have visible labels');
    for (const locale of LOCALES) assert.notEqual(left.translations[locale].text, right.translations[locale].text, `${leftKey}/${rightKey} ${locale} grid count differs from overall dimensions`);
  }
  const subMeshFragments = { 'zh-Hans': '子网格', 'zh-Hant': '子網格', ja_JP: 'サブメッシュ' };
  const nodeName = candidate.get('nodeName:meshDistribution');
  assert.ok(nodeName, 'sub-mesh node display name exists');
  for (const locale of LOCALES) {
    const fragment = subMeshFragments[locale];
    assert.ok(nodeName.translations[locale].text.includes(fragment), `${locale} sub-mesh term follows current approved captions`);
    for (const key of ['nodeInfo:applyDistribution', 'nodeInfo:countSubMeshes']) {
      const row = captions.get(key);
      assert.ok(row && row.translations[locale].text.includes(fragment), `${key}/${locale} approved sub-mesh reference exists`);
    }
  }
  const tooltipReferences = [
    ['attrInfo:meshDistribution.count', 'nodeAttr:meshDistribution.fill'],
    ['attrInfo:meshDistribution.fill', 'nodeAttr:meshDistribution.count'],
    ['attrInfo:randomDistribution.probability', 'nodeAttr:randomDistribution.useProbability'],
    ['attrInfo:randomDistribution.probability', 'nodeAttr:randomDistribution.Threshold'],
    ['attrInfo:randomDistribution.relaxDistance', 'nodeAttr:randomDistribution.relaxMode'],
  ];
  for (const [tooltipKey, labelKey] of tooltipReferences) {
    const tooltip = candidate.get(tooltipKey), label = candidate.get(labelKey);
    assert.ok(tooltip && label, `source-bound tooltip and label exist: ${tooltipKey}/${labelKey}`);
    for (const locale of LOCALES) {
      assert.ok(tooltip.translations[locale].text.includes(label.translations[locale].text), `${tooltipKey}/${locale} quotes current ${labelKey} caption`);
    }
  }
}

function assertPaddingSourceBoundaries(sourceRows, currentCaptionRows) {
  const source = entryMap(sourceRows);
  const captions = entryMap(currentCaptionRows);
  const facts = [
    ['nodeAttr:skslFilter.padding', 'Padding', 'Shape’s edge'],
    ['nodeAttr:distortionFilter.padding', 'Padding', 'design term'],
    ['nodeAttr:rgbSplitFilter.viewPort', 'Padding', 'design term'],
    ['nodeAttr:accumulator.padding', 'Padding', 'between each accumulated step'],
    ['nodeAttr:textShape.backgroundPadding', 'Padding', 'extra empty space'],
    ['nodeAttr:renderQueueItem.padding', 'Padding', 'leading zeros'],
  ];
  for (const [key, sourceFragment, noteFragment] of facts) {
    const row = source.get(key) || captions.get(key);
    assert.ok(row, `padding source-bound role exists: ${key}`);
    assert.ok(row.source.includes(sourceFragment), `${key} source context remains distinct`);
    assert.ok(row.notes.some(note => note.includes(noteFragment)), `${key} note disambiguates its padding role`);
  }
}

function assertSamplingIdentity(candidateRows, sourceRows) {
  const candidate = entryMap(candidateRows), source = entryMap(sourceRows);
  const catmull = candidate.get('nodeAttrEnum:thirdPartyFilter.samplingQuality.2');
  const catmullSource = source.get('nodeAttrEnum:thirdPartyFilter.samplingQuality.2');
  const mitchell = candidate.get('nodeAttrEnum:thirdPartyFilter.samplingQuality.3');
  const mitchellSource = source.get('nodeAttrEnum:thirdPartyFilter.samplingQuality.3');
  assert.ok(catmull && mitchell, 'both sampling algorithms are present');
  assert.equal(catmullSource.dontTranslate, true, 'Catmull-Rom alone carries official DNT');
  assert.equal(mitchellSource.dontTranslate, false, 'Mitchell remains non-DNT despite technical identity');
  assert.equal(catmull.dontTranslate, true);
  assert.equal(mitchell.dontTranslate, false);
  for (const locale of LOCALES) {
    assert.equal(catmull.translations[locale].decision, 'preserve', `${locale} Catmull-Rom official DNT decision`);
    assert.equal(catmull.translations[locale].text, catmull.source, `${locale} Catmull-Rom exact source identity`);
    assert.equal(mitchell.translations[locale].text, 'Mitchell', `${locale} Mitchell technical spelling is preserved by this draft, not by DNT`);
    assert.notEqual(mitchell.translations[locale].text, catmull.translations[locale].text, `${locale} Mitchell is not conflated with Catmull-Rom`);
  }
}

function assertSourceBoundSemanticContracts({ candidateRows, sourceRows, currentCaptionRows }) {
  assertSourceProjection(candidateRows, sourceRows);
  assertOfficialSourceFacts(sourceRows);
  assertLocalizedFacts(candidateRows);
  assertCaptionReferences(candidateRows, currentCaptionRows);
  assertPaddingSourceBoundaries(sourceRows, currentCaptionRows);
  assertSamplingIdentity(candidateRows, sourceRows);
}

function assertRootApprovedRevisionAnchors(candidateRows, sourceRows) {
  assert.equal(ROOT_APPROVED_REVISIONS.length, 15, 'root-approved display revision fixture has the complete 15 changed slots');
  const candidate = entryMap(candidateRows), source = entryMap(sourceRows);
  for (const [key, locale, previousText, expectedText] of ROOT_APPROVED_REVISIONS) {
    const row = candidate.get(key), official = source.get(key);
    assert.ok(row && official, `root-approved revision row exists: ${key}`);
    for (const field of ['catalogId', 'owner', 'fieldPath', 'source', 'notes', 'sourceRole', 'displayRole', 'dontTranslate', 'vendorJapanese', 'vendorJapaneseChanged']) {
      assert.deepEqual(row[field], official[field], `${key} approved revision preserves source-bound ${field}`);
    }
    assert.equal(row.translations[locale].decision, 'translate', `${key}/${locale} approved revision is a translated display slot`);
    assert.equal(row.translations[locale].text, expectedText, `${key}/${locale} equals root-approved display text`);
    assert.notEqual(previousText, expectedText, `${key}/${locale} historical rollback fixture changes the approved value`);
  }
}

module.exports = {
  ROOT_APPROVED_REVISIONS,
  assertFiniteSemanticContracts,
  assertSourceBoundSemanticContracts,
  assertRootApprovedRevisionAnchors,
  assertPaddingSourceBoundaries,
};
