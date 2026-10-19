---
name: cavalry-native-display-check
description: 验收 Cavalry 2.8 macOS 原生文字、字体、提示和首帧，按语言与场景复用成功驱动；不用于翻译审校、Windows或发布验收。
---

<!--
[INPUT]: 依赖统一验收流程、当前总账与本轮候选。
[OUTPUT]: 路由macOS显示动作、合批与证据判定。
[POS]: 显示验收技能入口；流程与表单由验收工具持有。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

## 先复用，再补验

整轮沿用[统一入口](../../../tools/acceptance/README.md)和[SOP](../../../docs/acceptance-workflow.md)，不另建流程。
已有表继续填写；局部补验不强制新建整轮表。

1. 对照总账与适用证据，只补未完成或受影响项。
2. 按[合批方法](references/batch-plan.md)备齐驱动、输入和预期，再启动。
3. 同语、同场景、兼容状态共用会话；动作后等实际后态，不重复派发。
4. 采完立即收尾，再离线审图，按[结果记账](references/evidence.md#结果记账)逐项回填。

驱动先查[接续索引](../../../tools/acceptance/DRIVERS.md)和私人历史，不重造成功动作。
`SKILL`指本次读取的技能目录；工具用法随对应参考按需读取。
只操作获准App与自有场景；现场结果留私人会话。

## 按任务读取

| 本轮需要 | 读取内容 |
| --- | --- |
| Timeline、Viewport质量/FPS、画布固定工具帮助 | [显示矩阵](references/surfaces.md) |
| 打开或保存可重复场景 | [场景方法](references/test-fixtures.md) |
| 已授权免登录工作区、启动与清理 | [helper方法](references/workspace-helper.md) |
| 菜单、属性、枚举、指南 | [控件动作](references/native-ui-actions.md) |
| 属性提示、节点说明、脚本帮助 | [帮助动作](references/help-actions.md) |
| Quick Add或Switcher备用入口 | [搜索与Switcher动作](references/search-switcher.md) |
| OCR、漏译、方框、旧证据复用 | [证据与定位](references/evidence.md)对应节 |
