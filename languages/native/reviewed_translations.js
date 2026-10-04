/**
 * [INPUT]: 依赖官方 2.8 app catalog 的原生键/源/notes、项目级宝玉 Skill 指导的 AGY 初稿与 Grok 独立校验
 * [OUTPUT]: 提供九条 AI Studio 的源绑定三语审定决策及来源，不输出用户可直接部署的语言包
 * [POS]: languages/native 的首批补译输入；与旧 overlay 分离，由构建期投影生成显示包，厂商日语优先规则不变
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 已审输入：源文与身份不随译文改写 --------------------------------
module.exports = {
  "provenance": {
    "cavalryVersion": "2.8.0",
    "catalogPath": "Definitions/Translation/appStrings_en-GB.source.json",
    "sourceSha256": "464f0d291cd7aac46dba9552ab08debf4302cbd36b7b8d9d49f692085004e82e",
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "independentReviewProvider": "Grok CLI",
    "approvedBy": "primary-agent",
    "reviewScope": "Source/context/terminology/format only; no live layout or full UI acceptance."
  },
  "entries": [
    {
      "key": "aiStudio.brief.subjectLabel",
      "source": "Subject",
      "notes": [
        "AI Studio Brief section. Label above the subject-type dropdown."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "主体"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "主體"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "被写体"
        }
      }
    },
    {
      "key": "aiStudio.brief.transparentLabel",
      "source": "Transparent background",
      "notes": [
        "AI Studio Brief section. Label beside the transparent-background toggle."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "透明背景"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "透明背景"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "透明な背景"
        }
      }
    },
    {
      "key": "aiStudio.brief.whatLabel",
      "source": "What would you like to make?",
      "notes": [
        "AI Studio Brief section. Label above the free-text subject description field."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "想制作什么？"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "想製作什麼？"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "何を作成しますか？"
        }
      }
    },
    {
      "key": "aiStudio.modelLabel",
      "source": "Model",
      "notes": [
        "AI Studio panel. Label beside the generation model dropdown in the top bar."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "模型"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "模型"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "モデル"
        }
      }
    },
    {
      "key": "aiStudio.prompt.sectionTitle",
      "source": "Prompt",
      "notes": [
        "AI Studio panel. Title of the collapsible section holding the assembled/editable prompt."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "提示词"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "提示詞"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "プロンプト"
        }
      }
    },
    {
      "key": "aiStudio.results.sectionTitle",
      "source": "Results",
      "notes": [
        "AI Studio panel. Heading above the results grid."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "结果"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "結果"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "結果"
        }
      }
    },
    {
      "key": "aiStudio.source.videoLabel",
      "source": "Video",
      "notes": [
        "AI Studio Background Removal. Label for the source-video combo."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "视频"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "影片"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "ビデオ"
        }
      }
    },
    {
      "key": "aiStudio.results.emptyHint",
      "source": "Generated artwork will appear here.",
      "notes": [
        "AI Studio Results section. Placeholder text shown in the results area before any generation has completed."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "生成的作品将显示在此处。"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "生成的作品將顯示在此處。"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "生成されたアートワークはここに表示されます。"
        }
      }
    },
    {
      "key": "aiStudio.generateNeedsSubject",
      "source": "Describe what you would like to make first.",
      "notes": [
        "AI Studio panel. Tooltip on the Generate button when it is disabled because the subject text field is empty."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "请先描述想制作的内容。"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "請先描述想製作的內容。"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "まず作成したい内容を説明してください。"
        }
      }
    }
  ]
};
