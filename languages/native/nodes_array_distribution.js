/**
 * [INPUT]: 依赖官方2.8 Array Distribution四叶source/notes、AGY完整草稿、Grok全12值终稿与Luna独立审校。
 * [OUTPUT]: 提供完整4键三语审定显示输入，保留手工坐标列表、长度决定副本数与序列索引语义。
 * [POS]: languages/native的数据列表分布域；只投影显示文字，不改变Array模型身份或推断网格算法。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';

// -- 官方源身份与审定显示分离，四叶完整装配 --------------------------
module.exports = {
  provenance: {
    "cavalryVersion": "2.8.0",
    "qtVersion": "6.9.2",
    "bundleIdentifier": "com.scenegroup.cavalry",
    "catalogPath": "Definitions/Translation/nodeStrings_en-GB.source.json",
    "sourceSha256": "d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0",
    "vendorJapanesePath": "Definitions/Translation/nodeStrings_ja-JP.translation.json",
    "vendorJapaneseSha256": "7dc7377c54bb28ea7badcee124f8e5097f8d86f9694a37cc08c1c9b7800fc439",
    "sourcePairsSha256": "393ea3b4d8ae888086514a6c475601f2f09029c7ba88dddcdbcf153f686f154a",
    "sourceIdentityAndNotesSha256": "17cf6095ca95d0b1f2bfcdb0ebbfbc4e1d7cc14de1d8db74ab69bcf53e4feb5b",
    "skillPath": ".agents/skills/baoyu-translate/SKILL.md",
    "skillCommit": "1567581c26ec29f4216c6e6835415bf30343b0e3",
    "skillVersion": "1.117.3",
    "mode": "refined",
    "draftProvider": "AGY CLI",
    "draftModel": "gemini-3.8-flash-high",
    "draftExecutionMode": "accept-edits",
    "draftConversationId": "85b04bde-ffd1-4d03-8eba-acab9aa7a7fa",
    "draftExitCode": 0,
    "independentReviewProvider": "Grok CLI",
    "independentReviewSessionId": "01a100ba-e4bd-7091-b324-e9dffc3f7d74",
    "independentReviewStatus": "Complete end_turn pass review; all 4 keys and 12 values. Root subsequently clarified manual entry from source notes and natural Japanese placement.",
    "sourceContextReview": "GPT-6 Luna Max independently reviewed all 4/12; root adopted manual-entry clarity and Japanese grammar, retained standard index terms.",
    "revisionProvider": "primary-agent",
    "approvedBy": "primary-agent",
    "approvalState": "approved-source-bound-display-input",
    "scope": "Complete arrayDistribution owner, 4 display leaves; manual X/Y positions, list length determines duplicate count, sequence index and data-list name; no grid/model/live claims."
  },
  entries: [
    { key: "attrInfo:arrayDistribution.array", source: "Explicit list of (X, Y) positions, one per duplicate. The list’s length sets the duplicate count.",
      catalogId: "Definitions/Translation/nodeStrings", owner: "arrayDistribution", fieldPath: ["attributes","array","tooltip"], displayRole: "attribute-info",
      dontTranslate: false, vendorJapanese: "Explicit list of (X, Y) positions, one per duplicate. The list’s length sets the duplicate count.", notes: ["\"Explicit list\" means a manually entered set of values."],
      translations: {"ja_JP":{"decision":"translate","text":"複製ごとに (X, Y) 座標を1組ずつ手動で指定するリストです。リストの長さで複製数が決まります。"},"zh-Hans":{"decision":"translate","text":"手动列出每个副本的 (X, Y) 位置；列表长度决定副本数量。"},"zh-Hant":{"decision":"translate","text":"手動列出每個副本的 (X, Y) 位置；清單長度決定副本數量。"}} },
    { key: "nodeAttr:arrayDistribution.array", source: "Position",
      catalogId: "Definitions/Translation/nodeStrings", owner: "arrayDistribution", fieldPath: ["attributes","array","name"], displayRole: "attribute-label",
      dontTranslate: false, vendorJapanese: "Position", notes: ["As in \"set the Position for each entry in the list\" — an X/Y coordinate."],
      translations: {"ja_JP":{"decision":"translate","text":"位置"},"zh-Hans":{"decision":"translate","text":"位置"},"zh-Hant":{"decision":"translate","text":"位置"}} },
    { key: "nodeInfo:arrayDistribution", source: "Distribute points by specifying positions for each index.",
      catalogId: "Definitions/Translation/nodeStrings", owner: "arrayDistribution", fieldPath: ["info","tooltip"], displayRole: "node-info",
      dontTranslate: false, vendorJapanese: "Distribute points by specifying positions for each index.", notes: ["\"Index\" here is a duplicate’s position number in its sequence."],
      translations: {"ja_JP":{"decision":"translate","text":"各インデックスに位置を指定してポイントを配置します。"},"zh-Hans":{"decision":"translate","text":"通过为每个索引指定位置来分布点。"},"zh-Hant":{"decision":"translate","text":"透過為每個索引指定位置來分佈點。"}} },
    { key: "nodeName:arrayDistribution", source: "Array",
      catalogId: "Definitions/Translation/nodeStrings", owner: "arrayDistribution", fieldPath: ["info","name"], displayRole: "node-name",
      dontTranslate: false, vendorJapanese: "Array", notes: ["The name of a behaviour that places duplicates at an explicit list of positions, a programming/data term (a list of values)."],
      translations: {"ja_JP":{"decision":"translate","text":"配列"},"zh-Hans":{"decision":"translate","text":"数组"},"zh-Hant":{"decision":"translate","text":"陣列"}} },
  ],
};
