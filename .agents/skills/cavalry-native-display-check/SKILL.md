---
name: cavalry-native-display-check
description: 验收 Cavalry 2.8 macOS 原生文字、字体回退、提示和首绘，或按语言与场景合批复用验收脚本时使用；不用于翻译审校、Windows或发布验收。
---

<!--
[INPUT]: 依赖本轮候选、批准译文、测试场景与项目总账。
[OUTPUT]: 提供合批路线、可复用工具与分项验收方法。
[POS]: 项目级macOS显示验收入口；不参与产品构建。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

## 先规划，再执行

1. 从项目总账选本轮未完成项。先读[合批方法](references/batch-plan.md)。
2. 复用适用的已验结果。列齐本批脚本、场景和预期值，再启动。
3. 同语言、同场景且状态兼容时，共用一次会话。按需读下表，不通读全部参考。
4. 每项保留动作、实际消费和显示判定。按[结果记账](references/evidence.md#结果记账)回填总账；一批不等于一个PASS。

## 按任务读取

| 本轮需要 | 读取内容 |
| --- | --- |
| Timeline、Viewport质量/FPS、画布固定工具帮助 | [显示矩阵](references/surfaces.md) |
| 打开或保存可重复场景 | [场景方法](references/test-fixtures.md) |
| 已授权免登录工作区、启动与清理 | [helper方法](references/workspace-helper.md) |
| 菜单、属性、枚举、指南 | [控件动作](references/native-ui-actions.md) |
| 属性提示、节点说明、脚本帮助 | [帮助动作](references/help-actions.md) |
| Quick Add或Switcher备用入口 | [搜索与Switcher动作](references/search-switcher.md) |
| OCR判定、漏译、方框或旧证据复用 | [证据与定位](references/evidence.md)中的对应节 |

## 直接复用

`SKILL`指本次实际读取的技能目录；命令不依赖当前工作目录。

| 工具或资产 | 用途与边界 |
| --- | --- |
| `scripts/workspace_probe.py` | 启动已批准helper、按回执PID清理；不是GUI驱动。用法见helper方法。 |
| `scripts/verify_visible_text.py` | 对已有Vision行JSON做区域断言；不运行OCR。用法见证据与定位。 |
| `scripts/audit_help_popups.py` | 对已绑定popup PNG离线运行OCR并比较完整说明；退出0只表示采集完成。用法见证据与定位。 |
| `assets/timeline-six-names.cv`及expected JSON | 六类名称的只读模板；复制后打开。 |
| `assets/hidden-plugin-pair.cv`及expected JSON | Erosion与Polar正常Save输入；只核加载结构。 |
| `assets/sound-empty-file.js`及expected JSON | 自有空Scene中标准Run的Sound空File脚本；不保存、不证明通知通过。 |

只操作本轮获准App与自有场景。不缩小窗口避登录，不改凭据。
遇到阻塞先查私人历史的成功驱动；缺驱动时记缺口，不重造已证链路。
现场日志、原图和失败记录存私人会话；技能只保留稳定方法。
