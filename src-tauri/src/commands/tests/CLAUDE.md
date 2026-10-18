# commands/tests/
> L2 | 父级: ../CLAUDE.md

成员清单
native_windows_runtime_reconciliation.rs: Windows native English复用marker/QPA残留检查，隔离验证Restore协调、拒Official及hostless许可不扩张，不读真实profile。
native_windows_paths.rs: 任意根发现/零写规划；已验选择持久化、同路径重试耐久写/保存失败、缺状态卸载保持owned profile原字节、宿主移除幂等恢复，以及Current/drift/pending/未知namespace原生Restart准入。
user_language_files_windows.rs: Windows临时Local/Roaming分离根合同；复用共享事务验证三语commit、English恢复、资源发布后中断恢复与未知strings保护，不触碰真实profile。
native_status_readonly_smoke.rs: status的人工ignored子模块；明确App/repo与native编译后组合真实原厂验签、pack和OS profile，manifest绑定target原字节SHA；source总量为target官方10473+补充373及独立插件caption1，approvedUIKeys限于源范围；先解析三语missing再推导complete以接受诚实partial；人工烟测只读默认profile，不启动WK/Cavalry或验证Apply。
native_user_profile_apply_smoke.rs: tempfile合同证明旧owned pack升级及陈旧strings拒绝；人工ignored单动作校验target原字节SHA、schema补充373、插件caption1与三语missing；full NativeResources只作烟测前置，status投影用approved digest map；保留真实App/profile/operation lock动作边界，不启动Cavalry。
runtime.rs: 验证补丁回执跨源更新/安装绑定且观察零写入， Resources 与 `_up_` 候选顺序、macOS injector定位与显式legacy restart runner、Windows generic plugin 的 child-only 环境，以及 apply/restart 在失败前不 spawn 的边界；legacy runner合同绕开preview OS-home profile admission，原生准入由独立fixture测试覆盖。
user_language.rs: 纯 JSON Preferences.locale 投影合同；验证 native locale 映射、畸形 typed locale/unsupported language 零变更拒绝、缺失/原值前像、字段/metadata drift 下 test-only CAS rollback 与 fixed English helper；不接触文件系统、IPC 或真实 profile。
user_language_files.rs: 临时profile事务/恢复合同；覆盖compact/legacy receipt、pending recovery warning不被清除、原像与drift拒绝、固定en-GB和guard边界；保留显式新pending receipt验证合同；只用fixture，不接真实profile或App。
user_language_files_receipt_reuse.rs: 复用父模块Fixture；稳定apply断言receipt image恰读一次，ready闭包只运行一次且早于新pending receipt发布，writer拒绝时不调用；active locale/strings bytes/mode漂移均拒绝并保留改动；pending warning由父模块覆盖；只用临时profile。
user_language_files_production.rs: 固定 production-layout 构造与只读 status projection 的 tempfile 合同；验证未知 locale 不泄露/不伪造 English、缺 state_dir 不创建、current/drift/pending + active SHA-256、合法 pack schema 与 typed PermissionDenied 分类，并证明 writer guard 在 resource commit 后、locale 原子发布前拒绝且 pending 后续可恢复；不触碰真实 profile 或 Cavalry。新增两个macOS ignored POSIX拒权路径；独立子模块核真实子进程中断与恢复。
user_language_files_process_recovery.rs: 跨平台ignored子进程合同；production apply在资源/pending发布与locale提交前由父进程终止本轮精确子PID，新进程重试收敛；Windows独立Local/Roaming根与真实TerminateProcess，macOS为SIGKILL；不伪造pending，不触碰真实profile、TCC或Cavalry。
native_user_contracts.rs: native_user隔离合同；锁定默认语言、approved digest map投影、English恢复和独立Restart准入；补English资源删除后writer拒绝与生产重试；tempfile profile验证可见locale后的定向目录fsync warning、pending reconciliation与生产apply重试；错根与writer拒绝均不spawn。
native_user_restore_only.rs: hostless English restore 的fixture合同；只允许完整Current receipt/postimage授予能力，missing/unsupported host才产生nativeRestoreOnly，拒绝无回执/pending/corrupt及locale/strings/mode drift；另在strict restore最终guard#3删除receipt或替成pending时以解析时同一bytes+mode期望拒绝发布，profile零写且外部receipt状态留存；不接真实profile或启动Cavalry。
native_user_official_independence.rs: tempfile双门合同；厂商来源与无Switcher覆盖共同准入Official；Current-owned非英语profile仅在pack Current时比对runtime source；覆盖source-only更新、一致源、缺失/v1 owner、候选缺失、坏owner/错root、drift保留和English恢复能力；不读真实home、不运行codesign或Cavalry。

法则: 默认测试通过父级最小fixture和fake runner观察行为，不访问真实安装/GUI/UAC；只有明确ignored人工烟测可在显式路径授权下访问真实App/profile；status烟测只读，native单动作烟测会写用户profile但不写App、不启动/重启，不把未运行算pass。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
