/**
 * [INPUT]: 依赖官方 2.8 app catalog 源/notes、项目宝玉 Skill 指导的 AGY 出稿与 Grok 独立审稿
 * [OUTPUT]: 提供 45 条 AI 工作室复用审校与 AI 用量完整域的源绑定三语审定输入，不直接部署用户文件
 * [POS]: languages/native 的 AI 工作室剩余 26 条与 AI 用量 19 条；不把旧候选自动当作批准
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 * 本轮图形语境有限修订经非作者验回/root审定；冻结源与历史批准仍保全。
 */
'use strict';

// -- 源绑定输入：审校译文，不改变官方机器身份 -------------------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "catalogPath": "Definitions/Translation/appStrings_en-GB.source.json",
    "sourceSha256": "464f0d291cd7aac46dba9552ab08debf4302cbd36b7b8d9d49f692085004e82e",
    "sourcePairsSha256": "15adb4bc74cd59ac731aebfb5dc73f84f70dfc1a8ee2a303c035bbedb5741339",
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "independentReviewProvider": "Grok CLI",
    "approvedBy": "primary-agent",
    "reviewScope": "Source/context/terminology/format; no live layout or full UI acceptance."
  },
  entries: [
    { key: "aiCredits.button.upgradeForMore", source: "Upgrade for more",
      notes: ["Button on the toast shown when the user has hit (100% of) their AI credit limit.", "A crown icon is drawn to the left of this text by the button itself - do not add one."],
      translations: { "zh-Hans": {"decision": "translate", "text": "升级获取更多"},
        "zh-Hant": {"decision": "translate", "text": "升級取得更多"},
        ja_JP: {"decision": "translate", "text": "アップグレードしてさらに利用"} }
    },
    { key: "aiCredits.button.upgradePlan", source: "Upgrade your plan",
      notes: ["Button on a toast shown when an AI generation is rate-limited (cooldown) or refused for lacking sufficient credits.", "A crown icon is drawn to the left of this text by the button itself - do not add one."],
      translations: { "zh-Hans": {"decision": "translate", "text": "升级方案"},
        "zh-Hant": {"decision": "translate", "text": "升級方案"},
        ja_JP: {"decision": "translate", "text": "プランをアップグレード"} }
    },
    { key: "aiCredits.time.hours", source: "{0, plural, one {# hour} other {# hours}}",
      notes: ["A length of time, used inside a message telling the user how long until their AI limit refreshes.", "placeholder0 - a whole number of hours.", "Example - \"2 hours\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "{0, plural, one {# 小时} other {# 小时}}"},
        "zh-Hant": {"decision": "translate", "text": "{0, plural, one {# 小時} other {# 小時}}"},
        ja_JP: {"decision": "translate", "text": "{0, plural, one {# 時間} other {# 時間}}"} }
    },
    { key: "aiCredits.toast.cooldown", source: "You can generate again in {0}.",
      notes: ["Toast shown after an AI generation is rate-limited.", "placeholder0 - the wait time, e.g. \"30 seconds\" or \"2 minutes\".", "Example - \"You can generate again in 30 seconds.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你可以在 {0} 后再次生成。"},
        "zh-Hant": {"decision": "translate", "text": "你可以在 {0} 後再次生成。"},
        ja_JP: {"decision": "translate", "text": "{0} 後に再度生成できます。"} }
    },
    { key: "aiCredits.toast.cooldownUpgrade", source: "You can generate again in {0}. To skip the wait, upgrade your plan.",
      notes: ["Toast shown after an AI generation is rate-limited, for an account that can upgrade to remove the wait.", "placeholder0 - the wait time, e.g. \"30 seconds\" or \"2 minutes\".", "Example - \"You can generate again in 2 minutes. To skip the wait, upgrade your plan.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你可以在 {0} 后再次生成。若要跳过等待，请升级方案。"},
        "zh-Hant": {"decision": "translate", "text": "你可以在 {0} 後再次生成。若要略過等待，請升級方案。"},
        ja_JP: {"decision": "translate", "text": "{0} 後に再度生成できます。待ち時間をスキップするには、プランをアップグレードしてください。"} }
    },
    { key: "aiCredits.toast.insufficient", source: "You do not have enough credits remaining to perform this operation. There will be a short wait between each use.",
      notes: ["Toast shown when an AI generation is refused for lacking sufficient credits."],
      translations: { "zh-Hans": {"decision": "translate", "text": "你的剩余额度不足以执行此操作。每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你的剩餘額度不足以執行此操作。每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "この操作を実行するためのクレジット残量が不足しています。各使用の間に短い待ち時間が発生します。"} }
    },
    { key: "aiCredits.toast.limit.day", source: "You’ve used all of your plan’s daily AI usage limit. Until it resets in {0}, there will be a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 100% of their AI credit limit, for a daily reset.", "placeholder0 - the time until the limit resets, e.g. \"2 hours\".", "Example - \"You’ve used all of your plan’s daily AI usage limit. Until it resets in 2 hours, there will be a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已用完方案的每日 AI 使用限额。限额将在 {0} 后重置。重置前，每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已用完方案的每日 AI 使用上限。上限將在 {0} 後重設。重設前，每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの1日の AI 使用上限に達しました。{0} 後にリセットされるまで、各使用の間に短い待ち時間が発生します。"} }
    },
    { key: "aiCredits.toast.limit.fallback", source: "You’ve used all of your plan’s AI usage limit. There will be a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 100% of their AI credit limit and no reset time is known."],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已用完方案的 AI 使用限额。每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已用完方案的 AI 使用上限。每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの AI 使用上限に達しました。各使用の間に短い待ち時間が発生します。"} }
    },
    { key: "aiCredits.toast.limit.month", source: "You’ve used all of your plan’s monthly AI usage limit. Until it resets on {0}, there will be a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 100% of their AI credit limit, for a monthly reset.", "placeholder0 - the date the limit resets, e.g. \"18/08/2026\".", "Example - \"You’ve used all of your plan’s monthly AI usage limit. Until it resets on 18/08/2026, there will be a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已用完方案的每月 AI 使用限额。限额将于 {0} 重置。在此之前，每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已用完方案的每月 AI 使用上限。上限將於 {0} 重設。在此之前，每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの月間 AI 使用上限に達しました。{0} にリセットされるまで、各使用の間に短い待ち時間が発生します。"} }
    },
    { key: "aiCredits.toast.limit.week", source: "You’ve used all of your plan’s weekly AI usage limit. Until it resets on {0}, there will be a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 100% of their AI credit limit, for a weekly reset.", "placeholder0 - the date the limit resets, e.g. \"18/08/2026\".", "Example - \"You’ve used all of your plan’s weekly AI usage limit. Until it resets on 18/08/2026, there will be a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已用完方案的每周 AI 使用限额。限额将于 {0} 重置。在此之前，每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已用完方案的每週 AI 使用上限。上限將於 {0} 重設。在此之前，每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの週間 AI 使用上限に達しました。{0} にリセットされるまで、各使用の間に短い待ち時間が発生します。"} }
    },
    { key: "aiCredits.toast.limit.year", source: "You’ve used all of your plan’s yearly AI usage limit. Until it resets on {0}, there will be a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 100% of their AI credit limit, for a yearly reset.", "placeholder0 - the date the limit resets, e.g. \"18/08/2026\".", "Example - \"You’ve used all of your plan’s yearly AI usage limit. Until it resets on 18/08/2026, there will be a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已用完方案的每年 AI 使用限额。限额将于 {0} 重置。在此之前，每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已用完方案的每年 AI 使用上限。上限將於 {0} 重設。在此之前，每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの年間 AI 使用上限に達しました。{0} にリセットされるまで、各使用の間に短い待ち時間が発生します。"} }
    },
    { key: "aiCredits.toast.title", source: "Canva AI",
      notes: ["Title shown on every AI credit toast."],
      translations: { "zh-Hans": {"decision": "preserve", "text": "Canva AI"},
        "zh-Hant": {"decision": "preserve", "text": "Canva AI"},
        ja_JP: {"decision": "preserve", "text": "Canva AI"} }
    },
    { key: "aiCredits.toast.upgradeComplete", source: "You’ve unlocked higher monthly AI usage with Canva Business. Enjoy!",
      notes: ["Body of the toast shown once a plan upgrade completes."],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已通过 Canva Business 解锁更高的每月 AI 使用限额。尽情使用吧！"},
        "zh-Hant": {"decision": "translate", "text": "你已透過 Canva Business 解鎖更高的每月 AI 使用上限。盡情使用吧！"},
        ja_JP: {"decision": "translate", "text": "Canva Business で、より多くの月間 AI 使用枠が解放されました。ぜひご活用ください！"} }
    },
    { key: "aiCredits.toast.upgradeCompleteTitle", source: "Upgrade complete",
      notes: ["Title of the toast shown once a plan upgrade completes."],
      translations: { "zh-Hans": {"decision": "translate", "text": "升级完成"},
        "zh-Hant": {"decision": "translate", "text": "升級完成"},
        ja_JP: {"decision": "translate", "text": "アップグレード完了"} }
    },
    { key: "aiCredits.toast.warning90.day", source: "You’ve passed {0}% of your plan’s daily AI usage limit. It refreshes in {1}. You can keep creating if you reach the limit, with a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 90% of their daily AI credit limit.", "placeholder0 - the warning threshold reached, as a whole percentage (always 90).", "placeholder1 - the time until the limit refreshes, e.g. \"2 hours\".", "Example - \"You’ve passed 90% of your plan’s daily AI usage limit. It refreshes in 2 hours. You can keep creating if you reach the limit, with a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已超过方案每日 AI 使用限额的 {0}%。限额将在 {1} 后重置。达到限额后你仍可继续创作，但每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已超過方案每日 AI 使用上限的 {0}%。上限將在 {1} 後重設。達到上限後你仍可繼續創作，但每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの1日の AI 使用上限の {0}% を超えました。{1} 後にリセットされます。上限に達しても、各使用の間に短い待ち時間を挟むことで作成を続けることができます。"} }
    },
    { key: "aiCredits.toast.warning90.fallback", source: "You’ve passed {0}% of your plan’s AI usage limit. You can keep creating if you reach the limit, with a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 90% of their AI credit limit and no reset time is known.", "placeholder0 - the warning threshold reached, as a whole percentage (always 90).", "Example - \"You’ve passed 90% of your plan’s AI usage limit. You can keep creating if you reach the limit, with a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已超过方案 AI 使用限额的 {0}%。达到限额后你仍可继续创作，但每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已超過方案 AI 使用上限的 {0}%。達到上限後你仍可繼續創作，但每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの AI 使用上限の {0}% を超えました。上限に達しても、各使用の間に短い待ち時間を挟むことで作成を続けることができます。"} }
    },
    { key: "aiCredits.toast.warning90.month", source: "You’ve passed {0}% of your plan’s monthly AI usage limit. It refreshes on {1}. You can keep creating if you reach the limit, with a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 90% of their monthly AI credit limit.", "placeholder0 - the warning threshold reached, as a whole percentage (always 90).", "placeholder1 - the date the limit refreshes, e.g. \"18/08/2026\".", "Example - \"You’ve passed 90% of your plan’s monthly AI usage limit. It refreshes on 18/08/2026. You can keep creating if you reach the limit, with a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已超过方案每月 AI 使用限额的 {0}%。限额将于 {1} 重置。达到限额后你仍可继续创作，但每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已超過方案每月 AI 使用上限的 {0}%。上限將於 {1} 重設。達到上限後你仍可繼續創作，但每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの月間 AI 使用上限の {0}% を超えました。{1} にリセットされます。上限に達しても、各使用の間に短い待ち時間を挟むことで作成を続けることができます。"} }
    },
    { key: "aiCredits.toast.warning90.week", source: "You’ve passed {0}% of your plan’s weekly AI usage limit. It refreshes on {1}. You can keep creating if you reach the limit, with a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 90% of their weekly AI credit limit.", "placeholder0 - the warning threshold reached, as a whole percentage (always 90).", "placeholder1 - the date the limit refreshes, e.g. \"18/08/2026\".", "Example - \"You’ve passed 90% of your plan’s weekly AI usage limit. It refreshes on 18/08/2026. You can keep creating if you reach the limit, with a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已超过方案每周 AI 使用限额的 {0}%。限额将于 {1} 重置。达到限额后你仍可继续创作，但每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已超過方案每週 AI 使用上限的 {0}%。上限將於 {1} 重設。達到上限後你仍可繼續創作，但每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの週間 AI 使用上限の {0}% を超えました。{1} にリセットされます。上限に達しても、各使用の間に短い待ち時間を挟むことで作成を続けることができます。"} }
    },
    { key: "aiCredits.toast.warning90.year", source: "You’ve passed {0}% of your plan’s yearly AI usage limit. It refreshes on {1}. You can keep creating if you reach the limit, with a short wait between each use.",
      notes: ["Toast shown when the signed-in user reaches 90% of their yearly AI credit limit.", "placeholder0 - the warning threshold reached, as a whole percentage (always 90).", "placeholder1 - the date the limit refreshes, e.g. \"18/08/2026\".", "Example - \"You’ve passed 90% of your plan’s yearly AI usage limit. It refreshes on 18/08/2026. You can keep creating if you reach the limit, with a short wait between each use.\""],
      translations: { "zh-Hans": {"decision": "translate", "text": "你已超过方案每年 AI 使用限额的 {0}%。限额将于 {1} 重置。达到限额后你仍可继续创作，但每次使用之间需要短暂等待。"},
        "zh-Hant": {"decision": "translate", "text": "你已超過方案每年 AI 使用上限的 {0}%。上限將於 {1} 重設。達到上限後你仍可繼續創作，但每次使用之間需要短暫等待。"},
        ja_JP: {"decision": "translate", "text": "プランの年間 AI 使用上限の {0}% を超えました。{1} にリセットされます。上限に達しても、各使用の間に短い待ち時間を挟むことで作成を続けることができます。"} }
    },
    { key: "aiStudio.brief.colourMode.monochrome", source: "Monochrome",
      notes: ["AI Studio Brief section. Item in the colours dropdown; single-colour scheme."],
      translations: { "zh-Hans": {"decision": "translate", "text": "单色"},
        "zh-Hant": {"decision": "translate", "text": "單色"},
        ja_JP: {"decision": "translate", "text": "モノクロ"} }
    },
    { key: "aiStudio.brief.coloursLabel", source: "Colours",
      notes: ["AI Studio Brief section. Label above the colours dropdown."],
      translations: { "zh-Hans": {"decision": "translate", "text": "颜色"},
        "zh-Hant": {"decision": "translate", "text": "顏色"},
        ja_JP: {"decision": "translate", "text": "カラー"} }
    },
    { key: "aiStudio.brief.custom", source: "Custom…",
      notes: ["AI Studio Brief section. Last item in a dropdown; picking it reveals a text field for a freeform value."],
      translations: { "zh-Hans": {"decision": "translate", "text": "自定义…"},
        "zh-Hant": {"decision": "translate", "text": "自訂…"},
        ja_JP: {"decision": "translate", "text": "カスタム…"} }
    },
    { key: "aiStudio.brief.detail.balanced", source: "Balanced",
      notes: ["AI Studio Brief section. Item in the detail dropdown; a middling level of detail."],
      translations: { "zh-Hans": {"decision": "translate", "text": "平衡"},
        "zh-Hant": {"decision": "translate", "text": "平衡"},
        ja_JP: {"decision": "translate", "text": "バランス"} }
    },
    { key: "aiStudio.brief.detailLabel", source: "Detail",
      notes: ["AI Studio Brief section. Label above the level-of-detail dropdown."],
      translations: { "zh-Hans": {"decision": "translate", "text": "细节"},
        "zh-Hant": {"decision": "translate", "text": "細節"},
        ja_JP: {"decision": "translate", "text": "ディテール"} }
    },
    { key: "aiStudio.brief.style.flat", source: "Flat",
      notes: ["AI Studio Brief section. Item in the style dropdown; flat colour, no shading."],
      translations: { "zh-Hans": {"decision": "translate", "text": "扁平"},
        "zh-Hant": {"decision": "translate", "text": "扁平"},
        ja_JP: {"decision": "translate", "text": "フラット"} }
    },
    { key: "aiStudio.brief.style.geometric", source: "Geometric",
      notes: ["AI Studio Brief section. Item in the style dropdown; built from simple geometric shapes."],
      translations: { "zh-Hans": {"decision": "translate", "text": "几何"},
        "zh-Hant": {"decision": "translate", "text": "幾何"},
        ja_JP: {"decision": "translate", "text": "ジオメトリック"} }
    },
    { key: "aiStudio.brief.styleLabel", source: "Style",
      notes: ["AI Studio Brief section. Label above the style dropdown."],
      translations: { "zh-Hans": {"decision": "translate", "text": "样式"},
        "zh-Hant": {"decision": "translate", "text": "樣式"},
        ja_JP: {"decision": "translate", "text": "スタイル"} }
    },
    { key: "aiStudio.brief.subject.character", source: "Character",
      notes: ["AI Studio Brief section. Item in the subject dropdown; a character or creature."],
      translations: { "zh-Hans": {"decision": "translate", "text": "角色"},
        "zh-Hant": {"decision": "translate", "text": "角色"},
        ja_JP: {"decision": "translate", "text": "キャラクター"} }
    },
    { key: "aiStudio.brief.subject.illustration", source: "Illustration",
      notes: ["AI Studio Brief section. Item in the subject dropdown; a general illustration."],
      translations: { "zh-Hans": {"decision": "translate", "text": "插画"},
        "zh-Hant": {"decision": "translate", "text": "插畫"},
        ja_JP: {"decision": "translate", "text": "イラストレーション"} }
    },
    { key: "aiStudio.generate", source: "Generate",
      notes: ["AI Studio button. Starts a generation using the current model and brief."],
      translations: { "zh-Hans": {"decision": "translate", "text": "生成"},
        "zh-Hant": {"decision": "translate", "text": "生成"},
        ja_JP: {"decision": "translate", "text": "生成する"} }
    },
    { key: "aiStudio.imageToLayers.generate", source: "Generate",
      notes: ["AI Studio Image to Layers panel. The primary action button. \"Generate\" is a verb."],
      translations: { "zh-Hans": {"decision": "translate", "text": "生成"},
        "zh-Hant": {"decision": "translate", "text": "生成"},
        ja_JP: {"decision": "translate", "text": "生成する"} }
    },
    { key: "aiStudio.imageToLayers.groupSourceFallback", source: "Image",
      notes: ["A generic stand-in for the name of an image, used when the real file name is not available. It is substituted into a group name, giving \"Image layers\"."],
      translations: { "zh-Hans": {"decision": "translate", "text": "图像"},
        "zh-Hant": {"decision": "translate", "text": "影像"},
        ja_JP: {"decision": "translate", "text": "画像"} }
    },
    { key: "aiStudio.output.importAsset", source: "Import",
      notes: ["AI Studio Results section, output mode for video/image results. Imports the file as a project asset only."],
      translations: { "zh-Hans": {"decision": "translate", "text": "导入"},
        "zh-Hant": {"decision": "translate", "text": "匯入"},
        ja_JP: {"decision": "translate", "text": "インポート"} }
    },
    { key: "aiStudio.output.separateLayers", source: "Separate Layers",
      notes: ["AI Studio Results section. Default item in the output-mode dropdown; imports each shape in the generation as its own layer."],
      translations: { "zh-Hans": {"decision": "translate", "text": "分离图层"},
        "zh-Hant": {"decision": "translate", "text": "分離圖層"},
        ja_JP: {"decision": "translate", "text": "レイヤーを分離"} }
    },
    { key: "aiStudio.presets.confirmDelete", source: "Delete this preset?",
      notes: ["AI Studio presets manager. Confirmation shown before a preset row is deleted."],
      translations: { "zh-Hans": {"decision": "translate", "text": "删除此预设？"},
        "zh-Hant": {"decision": "translate", "text": "刪除此預設？"},
        ja_JP: {"decision": "translate", "text": "このプリセットを削除しますか？"} }
    },
    { key: "aiStudio.presets.manage", source: "Manage Presets…",
      notes: ["AI Studio presets menu. Opens the rename/delete list of saved presets; disabled when there are none."],
      translations: { "zh-Hans": {"decision": "translate", "text": "管理预设…"},
        "zh-Hant": {"decision": "translate", "text": "管理預設…"},
        ja_JP: {"decision": "translate", "text": "プリセットを管理…"} }
    },
    { key: "aiStudio.presets.nameTitle", source: "Preset Name",
      notes: ["AI Studio presets menu. Title and label of the dialog asking for a new preset’s name."],
      translations: { "zh-Hans": {"decision": "translate", "text": "预设名称"},
        "zh-Hant": {"decision": "translate", "text": "預設名稱"},
        ja_JP: {"decision": "translate", "text": "プリセット名"} }
    },
    { key: "aiStudio.presets.save", source: "Save Preset…",
      notes: ["AI Studio presets menu. Saves the current brief as a new named preset."],
      translations: { "zh-Hans": {"decision": "translate", "text": "保存预设…"},
        "zh-Hant": {"decision": "translate", "text": "儲存預設…"},
        ja_JP: {"decision": "translate", "text": "プリセットを保存…"} }
    },
    { key: "aiStudio.preview.backdrop.black", source: "Black",
      notes: ["AI Studio video preview, backdrop shown behind transparent regions."],
      translations: { "zh-Hans": {"decision": "translate", "text": "黑色"},
        "zh-Hant": {"decision": "translate", "text": "黑色"},
        ja_JP: {"decision": "translate", "text": "黒"} }
    },
    { key: "aiStudio.preview.backdrop.red", source: "Red",
      notes: ["AI Studio video preview, backdrop shown behind transparent regions."],
      translations: { "zh-Hans": {"decision": "translate", "text": "红色"},
        "zh-Hant": {"decision": "translate", "text": "紅色"},
        ja_JP: {"decision": "translate", "text": "赤"} }
    },
    { key: "aiStudio.remove.keep", source: "Remove",
      notes: ["AI Studio results gallery. Button in the remove-result confirmation; removes the result from the gallery and scene, keeps the cached file."],
      translations: { "zh-Hans": {"decision": "translate", "text": "移除"},
        "zh-Hant": {"decision": "translate", "text": "移除"},
        ja_JP: {"decision": "translate", "text": "削除"} }
    },
    { key: "aiStudio.results.remove", source: "Remove",
      notes: ["AI Studio Results section. Context-menu item on a finished or failed result tile; deletes the tile. Disabled while the generation is in progress."],
      translations: { "zh-Hans": {"decision": "translate", "text": "移除"},
        "zh-Hant": {"decision": "translate", "text": "移除"},
        ja_JP: {"decision": "translate", "text": "削除"} }
    },
    { key: "aiStudio.results.retry", source: "Retry",
      notes: ["AI Studio Results section. Button on a failed tile; re-runs the same generation request."],
      translations: { "zh-Hans": {"decision": "translate", "text": "重试"},
        "zh-Hant": {"decision": "translate", "text": "重試"},
        ja_JP: {"decision": "translate", "text": "再試行"} }
    },
    { key: "aiStudio.results.showAll", source: "Show All",
      notes: ["Appears next to a check box that toggles whether all results are shown."],
      translations: { "zh-Hans": {"decision": "translate", "text": "全部显示"},
        "zh-Hant": {"decision": "translate", "text": "全部顯示"},
        ja_JP: {"decision": "translate", "text": "すべて表示"} }
    },
    { key: "aiStudio.source.imageLabel", source: "Image",
      notes: ["AI Studio Image to Layers panel. Label for the source-image combo."],
      translations: { "zh-Hans": {"decision": "translate", "text": "图像"},
        "zh-Hant": {"decision": "translate", "text": "影像"},
        ja_JP: {"decision": "translate", "text": "画像"} }
    },
  ],
};

// -- 图形语境复审：历史谱系不覆盖，本轮有限修订独立绑定 ------------
module.exports.provenance.graphicsReaudit = {
  "approvalReceiptSha256": "b90444cdeeec13611234814135f5c7c4107a884fb0004eff7c44365f629f0607",
  "approvedBy": "primary-agent",
  "approvalState": "approved-source-bound-graphics-repairs",
  "fullReviewScope": "global",
  "fullReviewLedgerSha256": "1ec986f939ca6d1ba3ddb272e7a61a923d9502dd25e3b1d70ca44e8db0abefe2",
  "fullReviewKeys": 1541,
  "fullReviewSlots": 4623,
  "changedLocaleSlots": 2,
  "deltaReviewReceiptSha256s": [
    "4881bb6837e2df77e833387666d23f8e3b69a442a77d2372ff0032c71459eed2",
    "7f96dbc98837f48b1f7ea4379fb690343ad44a2a5904029be019916bed6b0b56",
    "80cd3e4ca80bcb3dc107d8ed4952820aeafe07d674681f33c12aabe8aacc4d04",
    "dfa112a7a39533ee2526fb5ffa7a1dcf6206fb69ec3cc80601db70c137eec420"
  ],
  "sourceIdentityChanged": false,
  "officialVendorChanged": false,
  "liveApproval": false
};
