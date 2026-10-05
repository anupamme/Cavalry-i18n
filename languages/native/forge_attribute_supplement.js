/**
 * [INPUT]: 依赖2.8锁定Forge schema及Core生成式fallback，五项旧同owner候选与三项语境独立审阅。
 * [OUTPUT]: 提供八个精确nodeAttr显示键/三语审批，不伪造官方UI-text源或改写节点/字体/用户数据。
 * [POS]: native审批装配的独立schema补充域；producer校验definition/source身份，仍需实际TextRegistry消费验收。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 固定补充域与翻译决定分开；不恢复全局词面替换 -------------------
module.exports = {
  "provenance": {
    "cavalryVersion": "2.8.0",
    "sourceKind": "schema-bound Core generated fallback; not an official translation catalog",
    "definitionSource": "Definitions/nodeDefinitions.json",
    "definitionSha256": "96c7ffbda8d8244a111b3ad3e60fe530eb919fe9f93cbdf3577e2e29ca11d48f",
    "coreSha256": "8df2a434b5a6b73da691f7c8d0bba6fbb4c244dc0b388ea466ba8220c5ebeafb",
    "fallback": "prettifyAttrPath -> camelCaseToNatural; only eight exact ASCII root IDs",
    "approvedBy": "primary-agent",
    "independentSemanticReviewSha256": "2a999d529210d9f27a58a13414135f1e3f0e479496e5ed458e571c616bcf5e46",
    "candidateSha256": "c3b8089323f9be6f1fbd593edb926ae858625ce8e7bacc12e7f3ca53847e7730",
    "liveConsumerVerified": false
  },
  "entries": [
    {
      "key": "nodeAttr:forgeDynamicsShape.time",
      "source": "Time",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "time"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "时间"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "時間"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "時間"
        }
      }
    },
    {
      "key": "nodeAttr:forgeDynamicsShape.startFrame",
      "source": "Start Frame",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "startFrame"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "起始帧"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "起始幀"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "開始フレーム"
        }
      }
    },
    {
      "key": "nodeAttr:forgeDynamicsShape.gravity",
      "source": "Gravity",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "gravity"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "重力"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "重力"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "重力"
        }
      }
    },
    {
      "key": "nodeAttr:forgeDynamicsShape.groundFriction",
      "source": "Ground Friction",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "groundFriction"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "地面摩擦"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "地面摩擦"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "地面摩擦"
        }
      }
    },
    {
      "key": "nodeAttr:forgeDynamicsShape.groundBounce",
      "source": "Ground Bounce",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "groundBounce"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "地面弹跳"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "地面彈跳"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "地面バウンス"
        }
      }
    },
    {
      "key": "nodeAttr:forgeDynamicsShape.velocityIterations",
      "source": "Velocity Iterations",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "velocityIterations"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "速度迭代"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "速度迭代"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "速度反復"
        }
      }
    },
    {
      "key": "nodeAttr:forgeDynamicsShape.positionIterations",
      "source": "Position Iterations",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "positionIterations"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "位置迭代"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "位置迭代"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "位置反復"
        }
      }
    },
    {
      "key": "nodeAttr:forgeDynamicsShape.fields",
      "source": "Fields",
      "catalogId": "Definitions/nodeDefinitions.json#prettifyAttrPath",
      "fieldPath": [
        "attributes",
        "fields"
      ],
      "owner": "forgeDynamicsShape",
      "dontTranslate": false,
      "notes": [
        "Cavalry 2.8.0 Core fallback label produced by prettifyAttrPath for this nodeDefinitions attribute ID; not an official nodeStrings UI-text leaf."
      ],
      "translations": {
        "zh-Hans": {
          "decision": "translate",
          "text": "场"
        },
        "zh-Hant": {
          "decision": "translate",
          "text": "場"
        },
        "ja_JP": {
          "decision": "translate",
          "text": "フィールド"
        }
      }
    }
  ]
};
