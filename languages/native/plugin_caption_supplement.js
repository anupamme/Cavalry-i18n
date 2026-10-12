/**
 * [INPUT]: 依赖SHA锁定的Directional Blur amount source及root批准复用的Blur Amount三语caption。
 * [OUTPUT]: 提供一个caption-only三语决定，不提供单位、说明或渲染行为结论。
 * [POS]: native审批registry中的独立插件补充；不修改六键官方Directional Blur catalog。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const provenance = Object.freeze({
  cavalryVersion: '2.8.0',
  approvedBy: 'primary-agent',
  approvalScope: 'caption-only; reuses the approved Blur Amount translations; no units, help, or behavior claim',
  sourceDefinitionSha256: '1cab672a44cd4dbe9595e4ac2eef90e681f46ee4816d4d1af527edb92937d4bd',
  reusedApprovedKey: 'nodeAttr:sceneGroup::directionalBlurFilter.blurAmount',
  liveConsumerVerified: false,
});

const entries = [{
  key: 'nodeAttr:sceneGroup::directionalBlurFilter.amount',
  catalogId: 'pluginCaptionSupplement/Plugins/Directional Blur Filter/definitions.json',
  owner: 'sceneGroup::directionalBlurFilter',
  fieldPath: ['attributes', 'amount'],
  source: 'Amount',
  vendorJapanese: null,
  dontTranslate: false,
  notes: ['Cavalry 2.8.0 Directional Blur definition declares the Inspector attribute amount; Amount is a caption-only fallback, with no units, help, or behavior claim.'],
  translations: {
    'zh-Hans': { decision: 'translate', text: '模糊量' },
    'zh-Hant': { decision: 'translate', text: '模糊量' },
    ja_JP: { decision: 'translate', text: 'ぼかし量' },
  },
}];

module.exports = { provenance, entries };
