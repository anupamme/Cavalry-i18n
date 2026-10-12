/**
 * [INPUT]: 依赖20项固定缓动身份与五个现有native菜单源键。
 * [OUTPUT]: 提供15项root已批准的三语显示文字与五项现有键引用。
 * [POS]: tools唯一补译源；只用于构建期显示投影，不注册官方catalog。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

const provenance = Object.freeze({
  schemaVersion: 1,
  source: 'Cavalry 2.8 built-in Magic Easing menu',
  reviewStatus: 'ROOT_APPROVED_DISPLAY_ONLY',
  approvedBy: 'root',
  approvalScope: '15 supplemental label translations; no live layout or full UI acceptance.',
  scope: 'display-only built-in menu labels',
  officialCatalogRegistration: false,
  officialPackStatistics: false,
  liveAcceptance: false,
});

const rows = [
  { identity: 'None', source: 'None', nativeKey: 'menu.anim.easingNone' },
  {
    identity: 'SlowIn', source: 'Slow In', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '缓入', zhHant: '緩入', japanese: 'スローイン' },
  },
  {
    identity: 'SlowOut', source: 'Slow Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '缓出', zhHant: '緩出', japanese: 'スローアウト' },
  },
  { identity: 'SlowInSlowOut', source: 'Slow In, Slow Out', nativeKey: 'menu.anim.easingSlowInOut' },
  {
    identity: 'VerySlowIn', source: 'Very Slow In', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '极慢缓入', zhHant: '極慢緩入', japanese: 'ベリースローイン' },
  },
  {
    identity: 'VerySlowOut', source: 'Very Slow Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '极慢缓出', zhHant: '極慢緩出', japanese: 'ベリースローアウト' },
  },
  { identity: 'VerySlowInVerySlowOut', source: 'Very Slow In, Very Slow Out', nativeKey: 'menu.anim.easingVerySlowInOut' },
  {
    identity: 'SpringIn', source: 'Spring In', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '弹簧缓入', zhHant: '彈簧緩入', japanese: 'スプリングイン' },
  },
  { identity: 'SpringOut', source: 'Spring Out', nativeKey: 'menu.anim.easingSpringOut' },
  {
    identity: 'SpringInSpringOut', source: 'Spring In, Spring Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '弹簧缓入缓出', zhHant: '彈簧緩入緩出', japanese: 'スプリングイン、スプリングアウト' },
  },
  {
    identity: 'SmallSpringIn', source: 'Small Spring In', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '小幅弹簧缓入', zhHant: '小幅彈簧緩入', japanese: 'スモールスプリングイン' },
  },
  {
    identity: 'SmallSpringOut', source: 'Small Spring Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '小幅弹簧缓出', zhHant: '小幅彈簧緩出', japanese: 'スモールスプリングアウト' },
  },
  {
    identity: 'SmallSpringInSmallSpringOut', source: 'Small Spring In, Small Spring Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '小幅弹簧缓入缓出', zhHant: '小幅彈簧緩入緩出', japanese: 'スモールスプリングイン、スモールスプリングアウト' },
  },
  {
    identity: 'AnticipateIn', source: 'Anticipate In', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '预备缓入', zhHant: '預備緩入', japanese: 'アンティシペートイン' },
  },
  {
    identity: 'OvershootOut', source: 'Overshoot Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '过冲缓出', zhHant: '過衝緩出', japanese: 'オーバーシュートアウト' },
  },
  {
    identity: 'AnticipateInOvershootOut', source: 'Anticipate In, Overshoot Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '预备缓入、过冲缓出', zhHant: '預備緩入、過衝緩出', japanese: 'アンティシペートイン、オーバーシュートアウト' },
  },
  {
    identity: 'BounceIn', source: 'Bounce In', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '弹跳缓入', zhHant: '彈跳緩入', japanese: 'バウンスイン' },
  },
  { identity: 'BounceOut', source: 'Bounce Out', nativeKey: 'menu.anim.easingBounceOut' },
  {
    identity: 'BounceInBounceOut', source: 'Bounce In, Bounce Out', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '弹跳缓入缓出', zhHant: '彈跳緩入緩出', japanese: 'バウンスイン、バウンスアウト' },
  },
  {
    identity: 'Custom', source: 'Custom', nativeKey: null,
    approval: 'ROOT_APPROVED_DISPLAY_ONLY',
    translations: { zhHans: '自定义', zhHant: '自訂', japanese: 'カスタム' },
  },
];

module.exports = { provenance, rows };
