# commands/tests/
> L2 | 父级: ../CLAUDE.md

成员清单
native_status_readonly_smoke.rs: status的人工ignored子模块；明确App/repo与native编译后组合真实原厂验签、pack和OS profile，manifest必须绑定当前target字节SHA、从target导出official/supplemental/source数量、approvedUIKeys限于源范围，并先解析三语missing后推导complete以接受诚实partial；内存manifest合同覆盖missing=1与complete=false并拒绝后语类型错误/虚假完整；人工烟测仍要求默认locale Absent/无strings且前后摘要模式不变，缺失临时state不创建，不启动WK/Cavalry或验证Apply。
native_user_profile_apply_smoke.rs: tempfile合同证明旧owned pack可升级且陈旧strings观察拒绝；人工ignored单动作将manifest的target SHA与当前target字节绑定、由官方/补充分账导出源总键数，并由三语missing推导complete（允许当前partial）；保留真实App/OS home/fixed state、显式授权、process admission、production operation lock及`apply_inner`写入owner；检查receipt/pack SHA、English恢复、非locale语义/mode与vendor六文件/pack/manifest/diagnostics不变。旧包只按原像ownership准入；失败不自动回滚/重试，不启动Cavalry，不冒称UI验收。
runtime.rs: 验证补丁回执跨源更新/安装绑定且观察零写入， Resources 与 `_up_` 候选顺序、macOS injector定位与显式legacy restart runner、Windows generic plugin 的 child-only 环境，以及 apply/restart 在失败前不 spawn 的边界；legacy runner合同绕开preview OS-home profile admission，原生准入由独立fixture测试覆盖。
user_language.rs: 纯 JSON Preferences.locale 投影合同；验证 native locale 映射、畸形 typed locale/unsupported language 零变更拒绝、缺失/原值前像、字段/metadata drift 下 test-only CAS rollback 与 fixed English helper；不接触文件系统、IPC 或真实 profile。
user_language_files.rs: 临时 profile 的事务/恢复合同；验证一次 receipt 记录原像与缺失目录意图、strings 先于 locale、同语言重应用保留首原像、absent 回滚、固定 en-GB、坏 receipt/IO 拒绝、prepublish drift 零写入、symlink 与 empty-only 清理；Unix 验证 durable path，Windows fixture fail-closed，明确不声称 OS CAS。
user_language_files_production.rs: 固定 production-layout 构造与只读 status projection 的 tempfile 合同；验证未知 locale 不泄露/不伪造 English、缺 state_dir 不创建、current/drift/pending + active SHA-256、合法 pack schema 与 typed PermissionDenied 分类，并证明 writer guard 在 resource commit 后、locale 原子发布前拒绝且 pending 后续可恢复；不触碰真实 profile 或 Cavalry。新增两个macOS ignored POSIX拒权路径；独立子模块核真实子进程中断与恢复。
user_language_files_process_recovery.rs: macOS ignored子进程合同；production apply在资源与pending发布后由父进程SIGKILL，新进程重试并验证profile收敛；不伪造pending，不触碰真实profile、TCC或Cavalry。
native_user_restore_only.rs: hostless English restore 的fixture合同；只允许完整Current receipt/postimage授予能力，missing/unsupported host才产生nativeRestoreOnly，拒绝无回执/pending/corrupt及locale/strings/mode drift；另在strict restore最终guard#3删除receipt或替成pending时以解析时同一bytes+mode期望拒绝发布，profile零写且外部receipt状态留存；不接真实profile或启动Cavalry。
native_user_official_independence.rs: tempfile双门合同；厂商来源与无Switcher覆盖的内置en/ja共同准入Official，自有三语/旧pack/资源缺失或更新/外部strings/未知locale/漂移/pending/损坏不冒官方，locale/资源/强owned恢复能力不被徽章改写；不读真实home、不运行codesign或Cavalry。

法则: 默认测试通过父级最小fixture和fake runner观察行为，不访问真实安装/GUI/UAC；只有明确ignored人工烟测可在显式路径授权下访问真实App/profile；status烟测只读，native单动作烟测会写用户profile但不写App、不启动/重启，不把未运行算pass。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
