/**
 * [INPUT]: sourceEntries接收SHA锁定的2.8 nodeDefinitions原始字节与调用方完整官方键集；行验证还须显式给出Forge补充集。
 * [OUTPUT]: 提供sourceEntries、validateGapDefinitions、validateGapEntries、固定365行投影及GAP_CATALOG_ID。
 * [POS]: 将已固定的Core fallback映射为resource-bundle源行；集合完整性由调用方证明，本模块不读文件/vendor、不审批或自行装配producer/registry/运行时。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const SOURCE_DEFINITIONS_SHA256 = '96c7ffbda8d8244a111b3ad3e60fe530eb919fe9f93cbdf3577e2e29ca11d48f';
const CORE_FALLBACK_SHA256 = '8df2a434b5a6b73da691f7c8d0bba6fbb4c244dc0b388ea466ba8220c5ebeafb';
const FIXED_GAP_COUNT = 365;
const FIXED_INHERITED_GAP_COUNT = 13;
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;
const VENDOR_NODE_TYPE = /^[A-Za-z0-9][A-Za-z0-9_]*$/;
const GAP_CATALOG_ID = 'schemaSupplement/nodeAttributes';
const GAP_SOURCE_NOTES = 'Cavalry 2.8 nodeDefinitions declares this Inspector attribute; English label is the verified Core fallback.';

function fail(message) {
  throw new Error('native schema gap sources ' + message);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

// -- 候选按owner、attributeId的Unicode码点顺序冻结；标签是实测Core输出 --------
const FIXED_GAP_LABELS = deepFreeze([
  ["addDivisions","strength","Strength"],
  ["applyFontSize","captureGroupIndices","Capture Group Indices"],
  ["applyFontSize","falloffs","Falloffs"],
  ["applyLayout","columnSpan","Column Span"],
  ["applyLayout","rowSpan","Row Span"],
  ["applyOpenType","captureGroupIndices","Capture Group Indices"],
  ["applyOpenType","falloffs","Falloffs"],
  ["applyTextFill","captureGroupIndices","Capture Group Indices"],
  ["applyTextFill","fillColor","Fill Color"],
  ["applyTextMaterial","captureGroupIndices","Capture Group Indices"],
  ["applyTypeface","captureGroupIndices","Capture Group Indices"],
  ["autoAnimate","groupByParent","Group By Parent"],
  ["autoAnimate","parentTimingMode","Parent Timing Mode"],
  ["autoAnimate","reverseParentOrder","Reverse Parent Order"],
  ["autoAnimate","reverseRotationAngle","Reverse Rotation Angle"],
  ["autoAnimate","timingMode","Timing Mode"],
  ["barChart","cornerRadius","Corner Radius"],
  ["barChart","series","Series"],
  ["bend","bendAngle","Bend Angle"],
  ["bend","direction","Direction"],
  ["bend","strength","Strength"],
  ["blendShader","alpha","Alpha"],
  ["bodySettingCollisionEvent","bounce","Bounce"],
  ["bodySettingCollisionEvent","density","Density"],
  ["bodySettingCollisionEvent","fadeChanges","Fade Changes"],
  ["bodySettingCollisionEvent","fadeTime","Fade Time"],
  ["bodySettingCollisionEvent","friction","Friction"],
  ["bodySettingCollisionEvent","gravityScale","Gravity Scale"],
  ["bodySettingCollisionEvent","killOnCollision","Kill On Collision"],
  ["bodySettingCollisionEvent","sensor","Sensor"],
  ["bodySettingCollisionEvent","setBounce","Set Bounce"],
  ["bodySettingCollisionEvent","setDensity","Set Density"],
  ["bodySettingCollisionEvent","setFriction","Set Friction"],
  ["bodySettingCollisionEvent","setGravityScale","Set Gravity Scale"],
  ["bodySettingCollisionEvent","setSensor","Set Sensor"],
  ["boundingBox","inputShapes","Input Shapes"],
  ["boundingBoxShape","cornerRounding","Corner Rounding"],
  ["boundingBoxShape","expand","Expand"],
  ["boundingBoxShape","inputShape","Input Shape"],
  ["boundingBoxShape","offset","Offset"],
  ["boundingBoxShape","shapeDepth","Shape Depth"],
  ["bridgeConstraint","pins","Pins"],
  ["bridgeConstraint","stretch","Stretch"],
  ["collisionModifier","logic","Logic"],
  ["collisionModifier","margin","Margin"],
  ["compositionReference","overrides","Overrides"],
  ["compositionReference","playAudio","Play Audio"],
  ["compositionReference","timeRemapping","Time Remapping"],
  ["conicalGradientShader","endCenter","End Center"],
  ["conicalGradientShader","offset","Offset"],
  ["connectShape","projectionTarget","Projection Target"],
  ["contrastingColor","inputColor","Input Color"],
  ["crtScanLines","lineMode","Line Mode"],
  ["crtScanLines","lineSize","Line Size"],
  ["crtScanLines","shadowMaskScale","Shadow Mask Scale"],
  ["dataModifier","customColor","Custom Color"],
  ["dataModifier","drawColor","Draw Color"],
  ["displacementUtility","customColor","Custom Color"],
  ["displacementUtility","drawColor","Draw Color"],
  ["displacementUtility","shapeType","Shape Type"],
  ["displacementUtility","size","Size"],
  ["distanceConstraint","horizontalAlignment","Horizontal Alignment"],
  ["distanceConstraint","verticalAlignment","Vertical Alignment"],
  ["distortionFilter","amplitude","Amplitude"],
  ["distortionFilter","directionMode","Direction Mode"],
  ["distortionFilter","invert","Invert"],
  ["distortionFilter","sampleMode","Sample Mode"],
  ["distributionEmitter","customColor","Custom Color"],
  ["distributionEmitter","drawColor","Draw Color"],
  ["distributionEmitter","initialDirection","Initial Direction"],
  ["distributionEmitter","initialSpeed","Initial Speed"],
  ["distributionEmitter","overrideLifespan","Override Lifespan"],
  ["ditheringFilter","black","Black"],
  ["ditheringFilter","blendMode","Blend Mode"],
  ["ditheringFilter","blue","Blue"],
  ["ditheringFilter","cyan","Cyan"],
  ["ditheringFilter","green","Green"],
  ["ditheringFilter","greyscaleMode","Greyscale Mode"],
  ["ditheringFilter","magenta","Magenta"],
  ["ditheringFilter","mode","Mode"],
  ["ditheringFilter","opacity","Opacity"],
  ["ditheringFilter","pattern","Pattern"],
  ["ditheringFilter","red","Red"],
  ["ditheringFilter","shader","Shader"],
  ["ditheringFilter","white","White"],
  ["ditheringFilter","yellow","Yellow"],
  ["dragField","force","Force"],
  ["editablePathArray","array","Array"],
  ["envilopeDistort","strength","Strength"],
  ["envilopeDistort","targetShape","Target Shape"],
  ["flattenShapeLayers","maintainTransforms","Maintain Transforms"],
  ["flowFieldModifier","customColor","Custom Color"],
  ["flowFieldModifier","drawColor","Draw Color"],
  ["flowFieldModifier","forceMagnitude","Force Magnitude"],
  ["flowFieldModifier","physicsMode","Physics Mode"],
  ["flowFieldModifier","showPreview","Show Preview"],
  ["flowFieldModifier","size","Size"],
  ["forceModifier","customColor","Custom Color"],
  ["forceModifier","drawColor","Draw Color"],
  ["forceModifier","mass","Mass"],
  ["forceModifier","overrideMass","Override Mass"],
  ["forceModifier","physicsMode","Physics Mode"],
  ["forgeBodyAuxiliary","collisionEvents","Collision Events"],
  ["forgeBodyAuxiliary","constraints","Constraints"],
  ["gammaCorrectionFilter","premultiply","Premultiply"],
  ["glowFilter","drawMode","Draw Mode"],
  ["glowFilter","intensityRGB","Intensity RGB"],
  ["glowFilter","mode","Mode"],
  ["goalModifier","customColor","Custom Color"],
  ["goalModifier","drawColor","Draw Color"],
  ["goalModifier","physicsMode","Physics Mode"],
  ["gradientFilter","alpha","Alpha"],
  ["gradientFilter","blendMode","Blend Mode"],
  ["gradientFilter","generator","Generator"],
  ["gradientFilter","gradientMode","Gradient Mode"],
  ["gradientFilter","premultiply","Premultiply"],
  ["gradientFilter","reverse","Reverse"],
  ["gradientFilter","screenSpace","Screen Space"],
  ["gradientFilter","tiling","Tiling"],
  ["gradientMapFilter","blendMode","Blend Mode"],
  ["gradientMapFilter","gradient","Gradient"],
  ["gradientMapFilter","greyscaleMode","Greyscale Mode"],
  ["grainFilter","highlightMultiplier","Highlight Multiplier"],
  ["grainFilter","midtoneMultiplier","Midtone Multiplier"],
  ["grainFilter","shadowMultiplier","Shadow Multiplier"],
  ["gridLayout","cellMargins","Cell Margins"],
  ["gridLayout","keepAspectRatio","Keep Aspect Ratio"],
  ["gridLayout","scaleMultiplier","Scale Multiplier"],
  ["gridLayout","scaleToFit","Scale To Fit"],
  ["gridLayoutGroup","drawExtents","Draw Extents"],
  ["halftoneFilter","black","Black"],
  ["halftoneFilter","blackGamma","Black Gamma"],
  ["halftoneFilter","blackTransform","Black Transform"],
  ["halftoneFilter","blendMode","Blend Mode"],
  ["halftoneFilter","contrast","Contrast"],
  ["halftoneFilter","cyan","Cyan"],
  ["halftoneFilter","cyanTransform","Cyan Transform"],
  ["halftoneFilter","magenta","Magenta"],
  ["halftoneFilter","magentaTransform","Magenta Transform"],
  ["halftoneFilter","opacity","Opacity"],
  ["halftoneFilter","pattern","Pattern"],
  ["halftoneFilter","rotation","Rotation"],
  ["halftoneFilter","sampleMode","Sample Mode"],
  ["halftoneFilter","useCMYK","Use CMYK"],
  ["halftoneFilter","yellow","Yellow"],
  ["halftoneFilter","yellowTransform","Yellow Transform"],
  ["halftoneLegacyFilter","rotation","Rotation"],
  ["imageModifier","imageIndexOffset","Image Index Offset"],
  ["imageModifier","scaleMode","Scale Mode"],
  ["imageModifier","sequenceMode","Sequence Mode"],
  ["imageSampler","time","Time"],
  ["imageToShapes","looping","Looping"],
  ["imageToShapes","time","Time"],
  ["invert","blendMode","Blend Mode"],
  ["javaScript","array","Array"],
  ["javaScript","expression","Expression"],
  ["javaScriptDeformer","array","Array"],
  ["javaScriptDeformer","expression","Expression"],
  ["javaScriptModifier","array","Array"],
  ["kitaokaFilter","bottomLayerMode","Bottom Layer Mode"],
  ["kitaokaFilter","midLayerMode","Mid Layer Mode"],
  ["kitaokaFilter","topLayerMode","Top Layer Mode"],
  ["lattice","controllers","Controllers"],
  ["layoutGroup","drawExtents","Draw Extents"],
  ["lengthContext","remapping","Remapping"],
  ["lineRectPatternGenerator","gapType","Gap Type"],
  ["magneticModifier","customColor","Custom Color"],
  ["magneticModifier","drawColor","Draw Color"],
  ["magneticModifier","forceMagnitude","Force Magnitude"],
  ["magneticModifier","physicsMode","Physics Mode"],
  ["measureText","typeface","Typeface"],
  ["meshBehaviour","direction","Direction"],
  ["mirrorFilter","blendMode","Blend Mode"],
  ["mirrorFilter","offset","Offset"],
  ["mirrorFilter","opacity","Opacity"],
  ["mirrorFilter","padding","Padding"],
  ["mirrorFilter","rotation","Rotation"],
  ["mirrorFilter","screenSpace","Screen Space"],
  ["mirrorFilter","tiling","Tiling"],
  ["multiPointGradientShader","alpha","Alpha"],
  ["noiseShader","alpha","Alpha"],
  ["noiseShader","cycles","Cycles"],
  ["noiseShader","gamma","Gamma"],
  ["normalizePathUtility","outerContours","Outer Contours"],
  ["oscillator","numberOfWaves","Number Of Waves"],
  ["particleDistribution","inputShape","Input Shape"],
  ["particleEmitter","customColor","Custom Color"],
  ["particleEmitter","directionType","Direction Type"],
  ["particleEmitter","drawColor","Draw Color"],
  ["particleEmitter","emitterType","Emitter Type"],
  ["particleEmitter","emitterVelocityStrength","Emitter Velocity Strength"],
  ["particleEmitter","initialDirection","Initial Direction"],
  ["particleEmitter","initialSpeed","Initial Speed"],
  ["particleEmitter","inputShape","Input Shape"],
  ["particleEmitter","normalAngle","Normal Angle"],
  ["particleEmitter","overrideLifespan","Override Lifespan"],
  ["particleEmitter","particlesPerPixel","Particles Per Pixel"],
  ["particleEmitter","perimeterMargin","Perimeter Margin"],
  ["particleEmitter","useEmitterVelocity","Use Emitter Velocity"],
  ["particleEmitter","usePathNormals","Use Path Normals"],
  ["particleModifier","affectId","Affect Id"],
  ["particleModifier","affectOnly","Affect Only"],
  ["particleShape","cacheFilePath","Cache File Path"],
  ["particleShape","colorMode","Color Mode"],
  ["particleShape","colorOverLifespan","Color Over Lifespan"],
  ["particleShape","dragForce","Drag Force"],
  ["particleShape","emitters","Emitters"],
  ["particleShape","fitToLifespan","Fit To Lifespan"],
  ["particleShape","fps","Fps"],
  ["particleShape","gradientMode","Gradient Mode"],
  ["particleShape","gravity","Gravity"],
  ["particleShape","imageBlendMode","Image Blend Mode"],
  ["particleShape","imageIndexOffset","Image Index Offset"],
  ["particleShape","imageQuality","Image Quality"],
  ["particleShape","inputShape","Input Shape"],
  ["particleShape","lifespan","Lifespan"],
  ["particleShape","loopSequence","Loop Sequence"],
  ["particleShape","mass","Mass"],
  ["particleShape","particleColor","Particle Color"],
  ["particleShape","particleRadius","Particle Radius"],
  ["particleShape","rotationOverLifespan","Rotation Over Lifespan"],
  ["particleShape","rotationScalar","Rotation Scalar"],
  ["particleShape","scaleMode","Scale Mode"],
  ["particleShape","scaleOverLifespan","Scale Over Lifespan"],
  ["particleShape","scaleStrength","Scale Strength"],
  ["particleShape","seed","Seed"],
  ["particleShape","sequenceMode","Sequence Mode"],
  ["particleShape","shapeStyle","Shape Style"],
  ["particleShape","startFrame","Start Frame"],
  ["particleShape","startRotation","Start Rotation"],
  ["particleShape","time","Time"],
  ["particleShape","timeStep","Time Step"],
  ["particleShape","turbulence","Turbulence"],
  ["particleShape","useCache","Use Cache"],
  ["particleShape","worldScale","World Scale"],
  ["pathModifier","captureForce","Capture Force"],
  ["pathModifier","captureGraph","Capture Graph"],
  ["pathModifier","captureMargin","Capture Margin"],
  ["pathModifier","customColor","Custom Color"],
  ["pathModifier","drawCaptureMarginIndicator","Draw Capture Margin Indicator"],
  ["pathModifier","drawColor","Draw Color"],
  ["pathModifier","drawFlowMarginIndicator","Draw Flow Margin Indicator"],
  ["pathModifier","flowForce","Flow Force"],
  ["pathModifier","flowGraph","Flow Graph"],
  ["pathModifier","flowMargin","Flow Margin"],
  ["pathModifier","flowVariance","Flow Variance"],
  ["pathModifier","physicsMode","Physics Mode"],
  ["patternShape","angle","Angle"],
  ["patternShape","count","Count"],
  ["patternShape","size","Size"],
  ["patternShape","useCompResolution","Use Comp Resolution"],
  ["patternShape","width","Width"],
  ["pieChart","innerRadius","Inner Radius"],
  ["pinConstraint","horizontalAlignment","Horizontal Alignment"],
  ["pinConstraint","verticalAlignment","Vertical Alignment"],
  ["pixelSortingFilter","opacity","Opacity"],
  ["planarCamera","inputGuides","Input Guides"],
  ["posterizeFilter","opacity","Opacity"],
  ["radialGradientShader","rotation","Rotation"],
  ["radialGradientShader","scale","Scale"],
  ["radius","inputShapes","Input Shapes"],
  ["randomDistribution","threshold","Threshold"],
  ["rangeFalloff","graph","Graph"],
  ["rangeFalloff","useGraph","Use Graph"],
  ["rayLine","bidirectional","Bidirectional"],
  ["rayLine","border","Border"],
  ["regexString","captureGroupIndices","Capture Group Indices"],
  ["renderAudioOnly","audioSampleRate","Audio Sample Rate"],
  ["renderGIF","alphaThreshold","Alpha Threshold"],
  ["renderMP4","audioSampleRate","Audio Sample Rate"],
  ["renderProRes","audioSampleRate","Audio Sample Rate"],
  ["renderQueueItem","canvaUpload","Canva Upload"],
  ["renderQueueItem","upload","Upload"],
  ["renderQueueItem","uploadPreset","Upload Preset"],
  ["renderQuicktime","audioFormat","Audio Format"],
  ["renderQuicktime","audioSampleRate","Audio Sample Rate"],
  ["renderQuicktime","codec","Codec"],
  ["renderQuicktime","jpegQuality","Jpeg Quality"],
  ["renderSpriteSheet","maximumSize","Maximum Size"],
  ["renderWebM","audioSampleRate","Audio Sample Rate"],
  ["resizeString","randomSeed","Random Seed"],
  ["rgbSplitFilter","baseLayer","Base Layer"],
  ["rgbSplitFilter","blendMode","Blend Mode"],
  ["rgbSplitFilter","opacity","Opacity"],
  ["ringRectPatternGenerator","gapType","Gap Type"],
  ["scrapeFilter","padding","Padding"],
  ["scrapeFilter","unlockOffset","Unlock Offset"],
  ["shape","multiStroke","Multi Stroke"],
  ["shapeGradientShader","rotation","Rotation"],
  ["shapeGradientShader","scale","Scale"],
  ["shuffleArray","seed","Seed"],
  ["shuffleString","indices","Indices"],
  ["shuffleString","keepPunctuation","Keep Punctuation"],
  ["shuffleString","mode","Mode"],
  ["shuffleString","shuffleType","Shuffle Type"],
  ["simpleValue2Solver","cacheFilePath","Cache File Path"],
  ["simpleValue2Solver","cacheOffset","Cache Offset"],
  ["simpleValue2Solver","useCache","Use Cache"],
  ["simpleValueSolver","cacheFilePath","Cache File Path"],
  ["simpleValueSolver","cacheOffset","Cache Offset"],
  ["simpleValueSolver","useCache","Use Cache"],
  ["skslFilter","inputs","Inputs"],
  ["sortArray","ascending","Ascending"],
  ["sortArray","secondArray","Second Array"],
  ["spacerItem","fixedSize","Fixed Size"],
  ["spacerItem","useFixedSize","Use Fixed Size"],
  ["speedModifier","customColor","Custom Color"],
  ["speedModifier","drawColor","Draw Color"],
  ["speedModifier","physicsMode","Physics Mode"],
  ["spreadsheet","excelSheet","Excel Sheet"],
  ["spreadsheetLookup","excelSheet","Excel Sheet"],
  ["spring","mass","Mass"],
  ["spring","speedLimit","Speed Limit"],
  ["squashAndStretch","strength","Strength"],
  ["stringFromAsset","asset","Asset"],
  ["stripesFilter","padding","Padding"],
  ["stripesFilter","rotation","Rotation"],
  ["stripesFilter","samplerOffset","Sampler Offset"],
  ["stripesFilter","samplerRotation","Sampler Rotation"],
  ["stripesFilter","unlockOffset","Unlock Offset"],
  ["strokeDuplicator","stroke","Stroke"],
  ["strokeMaterial","colorMode","Color Mode"],
  ["strokeMaterial","gradient","Gradient"],
  ["subBoundingBox","fixedSize","Fixed Size"],
  ["superEllipseShape","bezier","Bezier"],
  ["sweepGradientShader","rotation","Rotation"],
  ["testFft","inputPath","Input Path"],
  ["textArray","array","Array"],
  ["textTimecode","delimiter","Delimiter"],
  ["timeMarker","locked","Locked"],
  ["timeStepFilter","time","Time"],
  ["toonOutlines","deformers","Deformers"],
  ["toonOutlines","maximumDistance","Maximum Distance"],
  ["toonOutlines","minimumDistance","Minimum Distance"],
  ["toonOutlines","overlap","Overlap"],
  ["toonOutlines","seed","Seed"],
  ["toonOutlines","stroke","Stroke"],
  ["toonOutlines","strokeCount","Stroke Count"],
  ["toonOutlines","travel","Travel"],
  ["trails","useParticleColor","Use Particle Color"],
  ["travel","travel","Travel"],
  ["triToneFilter","blendMode","Blend Mode"],
  ["triToneFilter","opacity","Opacity"],
  ["typeShape","typeface","Typeface"],
  ["typeface","font","Font"],
  ["venetianBlinds","blendMode","Blend Mode"],
  ["venetianBlinds","blindColor","Blind Color"],
  ["venetianBlinds","distortion","Distortion"],
  ["vignetteFilter","vignetteShape","Vignette Shape"],
  ["visualModifier","blendMode","Blend Mode"],
  ["visualModifier","colorMode","Color Mode"],
  ["visualModifier","modifierColor","Modifier Color"],
  ["visualModifier","rotationScalar","Rotation Scalar"],
  ["visualModifier","scaleStrength","Scale Strength"],
  ["voronoiShader","level0Color","Level 0 Color"],
  ["voronoiShader","level1Color","Level 1 Color"],
  ["voronoiShader","level2Color","Level 2 Color"],
  ["voronoiShader","level3Color","Level 3 Color"],
  ["voronoiShader","level4Color","Level 4 Color"],
  ["voronoiShader","loopLength","Loop Length"],
  ["vortexModifier","customColor","Custom Color"],
  ["vortexModifier","drawColor","Draw Color"],
  ["vortexModifier","forceVelocity","Force Velocity"],
  ["vortexModifier","physicsMode","Physics Mode"],
  ["wave","adaptiveWaveCounts","Adaptive Wave Counts"],
]);

const FIXED_GAP_SOURCE_ROWS = deepFreeze(FIXED_GAP_LABELS.map(([owner, attributeId, source]) => ({
  key: `nodeAttr:${owner}.${attributeId}`,
  catalogId: GAP_CATALOG_ID,
  owner,
  fieldPath: ['attributes', attributeId, 'name'],
  source,
  vendorJapanese: null,
  dontTranslate: false,
  notes: [GAP_SOURCE_NOTES],
})));

function cloneGapRows(rows) {
  return rows.map(row => ({ ...row, fieldPath: [...row.fieldPath], notes: [...row.notes] }));
}

function assertFixedGapLabels() {
  if (FIXED_GAP_LABELS.length !== FIXED_GAP_COUNT) fail('fixed source row count differs');
  const identities = new Set();
  let previousOwner = '';
  let previousId = '';
  for (const row of FIXED_GAP_LABELS) {
    if (!Array.isArray(row) || row.length !== 3
        || row.some(value => typeof value !== 'string' || value.length === 0)) {
      fail('fixed source row must be a non-empty three-string tuple');
    }
    const [owner, attributeId] = row;
    if (!IDENTIFIER.test(owner)) fail('illegal fixed owner: ' + owner);
    if (!IDENTIFIER.test(attributeId) || attributeId.includes('.')) {
      fail('illegal fixed attribute ID: ' + attributeId);
    }
    if (owner < previousOwner || (owner === previousOwner && attributeId <= previousId)) {
      fail('fixed rows are not in canonical owner/ID order');
    }
    const identity = owner + '\0' + attributeId;
    if (identities.has(identity)) fail('duplicate fixed owner/attribute ID: ' + owner + '.' + attributeId);
    identities.add(identity);
    previousOwner = owner;
    previousId = attributeId;
  }
}

function indexDefinitions(definitions) {
  if (!Array.isArray(definitions)) fail('nodeDefinitions must be an array');
  const byType = new Map();
  for (const definition of definitions) {
    if (!isRecord(definition)) fail('definition record must be an object');
    if (!Object.hasOwn(definition, 'nodeType')) continue;
    const owner = definition.nodeType;
    if (typeof owner !== 'string' || !VENDOR_NODE_TYPE.test(owner)) fail('illegal nodeType owner');
    if (byType.has(owner)) fail('duplicate nodeType definition: ' + owner);
    byType.set(owner, definition);
  }
  return byType;
}

function ownerChain(owner, byType) {
  const chain = [];
  const seen = new Set();
  let current = owner;
  while (current) {
    if (seen.has(current)) fail('inheritance cycle at ' + current);
    seen.add(current);
    const definition = byType.get(current);
    if (!definition) fail('missing owner/parent definition: ' + current);
    chain.push([current, definition]);

    if (!Object.hasOwn(definition, 'superType') || definition.superType === null || definition.superType === '') break;
    const parent = definition.superType;
    if (typeof parent !== 'string' || !VENDOR_NODE_TYPE.test(parent)) fail('illegal parent owner for ' + current);
    if (!byType.has(parent)) fail('missing parent definition: ' + parent);
    current = parent;
  }
  return chain;
}

function attributeSchemaOwner(chain, attributeId) {
  for (const [owner, definition] of chain) {
    if (!Object.hasOwn(definition, 'attributes')) continue;
    if (!isRecord(definition.attributes)) fail('attributes must be an object');
    if (Object.hasOwn(definition.attributes, attributeId)) {
      const schema = definition.attributes[attributeId];
      if (!isRecord(schema) || typeof schema.type !== 'string' || schema.type.trim().length === 0) {
        fail('attribute schema invalid: ' + owner + '.' + attributeId);
      }
      return owner;
    }
  }
  return null;
}

function hasInspectorReference(ownerDefinition, attributeId) {
  if (!isRecord(ownerDefinition.UI)) return false;
  let found = false;
  const visiting = new WeakSet();

  function walk(value) {
    if (Array.isArray(value)) {
      if (visiting.has(value)) fail('cyclic Inspector layout');
      visiting.add(value);
      for (const child of value) walk(child);
      visiting.delete(value);
      return;
    }
    if (!isRecord(value)) return;
    if (visiting.has(value)) fail('cyclic Inspector layout');
    visiting.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (key === 'attributeOrder') {
        if (Array.isArray(child) && child.includes(attributeId)) found = true;
        continue;
      }
      walk(child);
    }
    visiting.delete(value);
  }

  walk(ownerDefinition.UI);
  return found;
}

function officialKeys(officialEntries) {
  if (!Array.isArray(officialEntries)) fail('official entries must be an array');
  const keys = new Set();
  for (const entry of officialEntries) {
    if (!isRecord(entry) || typeof entry.key !== 'string' || entry.key.length === 0) {
      fail('official entry lacks a key');
    }
    if (keys.has(entry.key)) fail('duplicate official key: ' + entry.key);
    keys.add(entry.key);
  }
  return keys;
}

function existingSupplementKeys(existingSupplementEntries) {
  if (!Array.isArray(existingSupplementEntries)) {
    fail('existing supplement entries must be provided as an array');
  }
  const keys = new Set();
  for (const entry of existingSupplementEntries) {
    if (!isRecord(entry) || typeof entry.key !== 'string' || entry.key.length === 0) {
      fail('existing supplement entry lacks a key');
    }
    if (keys.has(entry.key)) fail('duplicate existing supplement key: ' + entry.key);
    keys.add(entry.key);
  }
  return keys;
}

function validateGapDefinitions(definitions, officialEntries) {
  assertFixedGapLabels();
  const byType = indexDefinitions(definitions);
  const official = officialKeys(officialEntries);
  let inheritedCount = 0;

  for (const [owner, attributeId] of FIXED_GAP_LABELS) {
    const ownerDefinition = byType.get(owner);
    if (!ownerDefinition) fail('missing candidate owner: ' + owner);
    const chain = ownerChain(owner, byType);
    const schemaOwner = attributeSchemaOwner(chain, attributeId);
    if (!schemaOwner) {
      fail('attribute schema unresolved: ' + owner + '.' + attributeId);
    }
    if (schemaOwner !== owner) inheritedCount += 1;
    if (!hasInspectorReference(ownerDefinition, attributeId)) {
      fail('Inspector reference missing: ' + owner + '.' + attributeId);
    }

    const directKey = 'nodeAttr:' + owner + '.' + attributeId;
    if (official.has(directKey)) fail('official direct key collision: ' + directKey);
    for (const [parent] of chain.slice(1)) {
      const parentKey = 'nodeAttr:' + parent + '.' + attributeId;
      if (official.has(parentKey)) fail('official parent nodeAttr collision: ' + parentKey);
    }
  }

  if (inheritedCount !== FIXED_INHERITED_GAP_COUNT) {
    fail('inherited source row count differs: ' + inheritedCount);
  }
  return FIXED_GAP_LABELS;
}

function validateGapEntries(entries, officialEntries, options) {
  if (!isRecord(options) || !Array.isArray(options.existingSupplementEntries)) {
    fail('existing supplement entries must be provided explicitly');
  }
  const official = officialKeys(officialEntries);
  const supplements = existingSupplementKeys(options.existingSupplementEntries);
  if (!Array.isArray(entries) || entries.length !== FIXED_GAP_COUNT) {
    fail('requires exactly 365 source rows');
  }

  const keys = new Set();
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.key !== 'string' || entry.key.length === 0) {
      fail('gap source row shape invalid');
    }
    if (keys.has(entry.key)) fail('duplicate gap source key: ' + entry.key);
    keys.add(entry.key);
    if (official.has(entry.key)) fail('official gap key collision: ' + entry.key);
    if (supplements.has(entry.key)) fail('existing supplement collision: ' + entry.key);
  }

  for (let index = 0; index < FIXED_GAP_SOURCE_ROWS.length; index += 1) {
    const expected = FIXED_GAP_SOURCE_ROWS[index];
    if (!isDeepStrictEqual(entries[index], expected)) {
      fail('source row identity differs: ' + expected.key);
    }
  }
  return cloneGapRows(FIXED_GAP_SOURCE_ROWS);
}

function sourceEntries(rawNodeDefinitionsBytes, fullOfficialEntries) {
  if (!Buffer.isBuffer(rawNodeDefinitionsBytes) && !(rawNodeDefinitionsBytes instanceof Uint8Array)) {
    fail('nodeDefinitions input must be raw bytes');
  }
  const bytes = Buffer.from(rawNodeDefinitionsBytes);
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== SOURCE_DEFINITIONS_SHA256) fail('nodeDefinitions SHA-256 differs');

  let definitions;
  try { definitions = JSON.parse(bytes.toString('utf8')); }
  catch { fail('nodeDefinitions JSON is invalid'); }

  validateGapDefinitions(definitions, fullOfficialEntries);
  return cloneGapRows(FIXED_GAP_SOURCE_ROWS);
}

module.exports = {
  FIXED_GAP_LABELS,
  GAP_CATALOG_ID,
  FIXED_GAP_SOURCE_ROWS,
  SOURCE_DEFINITIONS_SHA256,
  CORE_FALLBACK_SHA256,
  sourceEntries,
  validateGapEntries,
  validateGapDefinitions,
};
