<!--
[INPUT]: 依赖44项主账、schema2验收源与平台动作计划。
[OUTPUT]: 提供整轮建表、记账、复验、收口和平台入口。
[POS]: 离线验收工具总入口；不启动Cavalry，不替人工授予PASS。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Cavalry 2.8 整轮验收工具

这里是统一入口。规则、目标目录和脚本纳入版本控制。
`runs/` 存每轮填写表与证据；`local/` 存私人方案和历史驱动索引。
这两个目录已被 `.gitignore` 排除，不提交、不推送。

## 开始一轮

Python编排入口：`python3 tools/acceptance/run_flow.py <动作计划.json> --check`。
普通计划实跑使用`--out tools/acceptance/runs/<本轮编号>/capture-<批次>`。
计划声明`profileHandback`时，不得直接实跑此通用入口。
该字段要求平台入口承担整批PID收尾和配置回交；通用入口拒绝绕过。
macOS同语helper计划使用已绑定的本地入口：

```sh
python3 tools/acceptance/local/adapters/run_owned_flow.py <动作计划.json> --check
python3 tools/acceptance/local/adapters/run_owned_flow.py <动作计划.json> --out tools/acceptance/runs/<本轮编号>/capture-<批次>
```

该入口先内存快照偏好和布局，批末关闭owned PID后精确回交。
正常Apply/Restore必须走产品事务，不使用原字节回交。
Windows须绑定自己的生命周期入口，不能运行此macOS适配器。
Windows将`python3`替换为`python`，计划必须提供Windows对应操作。
平台动作接线尚在整合；不能把编排器自测当成双平台实跑通过。
动作计划与实跑结果均放本地忽略目录，不混入填写表的模板。
计划可声明每步`cleanup`与`cleanup_timeout`。
失败、超时或人工中断后仍执行该收尾命令。
共享PID的合批必须接好末尾关闭，不留进程等待离线审图。
清理只用本轮exact PID；强制清理不算正常退出通过。

```sh
node tools/acceptance/checklist.js prepare --platform macos --candidate '<源码SHA+制品SHA+资源版本>'
```

新表使用schema2。`session.json`保留完整插件与ToolHelp source-key inventory。
插件inventory保存324个源键、源文本、三语决策、源指纹和稳定ID。
ToolHelp inventory保存66键×3语种、源文本、源指纹和原稳定ID。
两类inventory都没有PASS、FAIL、N/A或证据字段。
只有`plugin-acceptance-scope.json`批准的69个键生成实屏case。
规则限于12字段、14名称、21个有限插件项和22个条件帮助键。
有限插件项只来自Twist、Box Blur、Gaussian Blur和Zoom Blur。
Group、Null、继承opacity、插件面板、帮助、Guide和Timeline沿既有范围。
ToolHelp沿四种已批准动作case验收：Select、Edit Shape、Mesh与Pivot各三语。
93个ToolHelp源项只标记所属组引用；105个未观测源项只保留inventory。
组case的结果不复制给源项；ToolHelp inventory不增加逐键case。

schema1整轮表需要一次显式范围迁移。先检查目标目录，再执行：

```sh
node tools/acceptance/checklist.js migrate --out '<已有schema1整轮目录>'
```

迁移只接受冻结v1目录、未收口表和有效历史。
迁移保存三份原件字节及SHA256到`scope-migration-v2/original/`。
`receipt.json`记录原件、新表和迁移脚本的SHA256。
`crosswalk.json`逐项记录旧结果、证据、attempt索引及schema2去向。
迁移时的新表快照保存在`scope-migration-v2/output-initial/`。
后续记账可以修改活动表；原始schema2快照仍供收口核验。
带FAIL历史的inventory行须先真实修复并PASS。
原FAIL留在crosswalk与归档attempts，不转N/A。
迁移不会新增case或自动勾选。
源指纹未知、case变更、历史损坏或已有交接账时，命令拒绝运行。
不要对正式整轮目录执行迁移测试；测试只用临时目录。

已有schema2整轮若仍展开旧ToolHelp行，先备份并审阅目录，再显式执行一次scope amendment：

```sh
node tools/acceptance/checklist.js amend-toolhelp --out '<已有schema2整轮目录>'
```

该命令只接受已知ToolHelp展开scope和一致源指纹。
它保存父schema2三份原件，并保留既有`scope-migration-v2/`原件。
`scope-amendment-toolhelp-v1/`保存父字节、旧ID crosswalk与新输出SHA。
父`scopeMigration`链按归档父session核验，不与amend后的session混比。
待转行如有未解决FAIL，命令拒绝且不触碰表单。
命令只修改明确指定的副本。先用临时目录验证，再选择正式表。

旧冻结全平台case有3786项。macOS表选择3773项。
其余13项属于Windows和发布平台。
场景修订前schema2全平台有2823项，macOS有2810项。
当前全平台有2643项，macOS有2630项。
765个插件细项与198个ToolHelp源项移入inventory/crosswalk。
两类合计963项；它们不记N/A或PASS。

命令打印本轮目录。默认创建 `tools/acceptance/runs/<时间>/`。
**开始完整流程时只创建一份整表，不是每一项创建一份。**
同一轮一直填写该目录的 `CHECKLIST.md`。
需要自定义编号时使用 `--out tools/acceptance/runs/<本轮编号>`。
Windows 使用 `--platform windows`；发布阶段使用 `--platform release`。

## 检查、修复、复验

详细路线见 [SOP](../../docs/acceptance-workflow.md)。
每个细项都有稳定 ID、预期与主账映射。
帮助预期保存批准全文，并核对批准摘要；不让验收人对着摘要猜译文。
同一语言、场景和状态的细项共享动作与证据，不逐项重新启动。
可直接编辑整表；推荐用以下入口同步保留记录：

```sh
node tools/acceptance/checklist.js record --out '<本轮目录>' --id '<细项ID>' --result FAIL --candidate '<实际候选>' --evidence 'evidence/fail.png' --note '实际失败表现'
node tools/acceptance/checklist.js record --out '<本轮目录>' --id '<细项ID>' --result PASS --candidate '<修复候选>' --evidence 'evidence/pass.png' --fix '根因及修复提交' --impact '受影响项与复验结果'
node tools/acceptance/checklist.js check --out '<本轮目录>'
```

`FAIL` 不勾选；修复后实际复验 `PASS` 才勾选。
没有失败历史的首次 `PASS` 不需要 `--fix` 和 `--impact`。
复用旧证据使用 `REUSE`，用 `--note` 说明适用关系。
不适用使用 `N/A`，用证据与说明记录范围裁决；不能假称通过。
失败项不能改成 `REUSE` 或 `N/A` 绕过复验。
目标目录变化时先对账，新轮复用未受影响证据，不全量重测。

## 收口与交接

```sh
node tools/acceptance/checklist.js closeout --out '<本轮目录>'
```

缺项、待验、失败、缺证据或缺修复记录时拒绝收口。
成功时写出 `HANDOFF.md`。追加结果会撤销旧交接账。
交接整个本轮目录；Windows 不继承 macOS 实机 PASS。
表单检查器不上传、不发布、不启动 Cavalry。
Python编排器只执行动作计划明确指定的命令。

## 文件归属

| 文件 | 用途 |
| --- | --- |
| `CHECKLIST.md` | 一份整轮表，各细项逐项检查与打勾 |
| `session.json` | 固定目标、预期、候选、源指纹和44主项映射 |
| `attempts.jsonl` | 按时间追加失败、修复与复验记录 |
| `HANDOFF.md` | 记录完整后生成的阶段交接账 |
| `evidence/` | 验收人保存原图、录像和日志；按需创建 |

工具自测：`npm run test:acceptance:workflow`。
Python编排自测：`python3 -m unittest discover -s tools/acceptance -p 'test_*.py'`。
检查器只检查人工记录，不代替实屏审查。
44主项已有映射；历史细项无遗漏与GUI驱动整合仍须逐项核实。
历史驱动复用边界见 [驱动接续](DRIVERS.md)。

Windows接手包入口见[Windows接手说明](local/handoff_windows/README.md)。
Windows另建一次平台整表，不复制Mac结果或证据。
包内源码差异与公开工具须按manifest SHA核验。
共享Python编排只执行计划命令；Windows动作驱动仍须单独实现。
Windows剩余任务、逐case入口与读回要求见[接手任务单](local/handoff_windows/HANDOFF-TASKS.md)。
截至2026-10-17，40/44已完成；只保留G-3、D-6、G-5、G-6。
线上38932098058的双架构macOS产物不重跑，也不转成Windows PASS。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## 已有表的场景范围纠偏

新轮macOS表包含2630个case。
原2810表先显式修订，不另复制一份整表：

```sh
node tools/acceptance/checklist.js amend-scenes --out '<本轮目录>'
```

180个Timeline细格保留为观察索引。
每语五个父场景共用原15张整窗图。
逐名身份、全文与测量沿既有锚点。
屏外不是N/A，也不授字形信用。
Null误加的15个属性观察只保留库存。
原Null页签与Opacity验收项保持不变。

修订只接受尚未填写的195行。
它保留三原件、逐项映射与全部历史。
15个新父场景仍须逐项引用适用证据。
旧schema1先执行migrate，再执行amend-scenes。
旧ToolHelp展开表先执行amend-toolhelp。
修订不启动GUI，不授PASS，不自动发布。
