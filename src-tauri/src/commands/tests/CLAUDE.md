# commands/tests/
> L2 | 父级: ../CLAUDE.md

成员清单
native_status_readonly_smoke.rs: status的人工ignored子模块；明确App/repo与native编译后，真实原厂验签、pack和OS profile一次组合投影，manifest独立断言10278/10473/complete/三语missing0而非从available猜完整性，要求默认locale Absent/无strings且前后摘要模式不变；用缺失临时state模拟首次运行，不创建它，不启动WK/Cavalry或验证真实Apply。
runtime.rs: 验证补丁回执跨源更新/安装绑定且观察零写入， Resources 与 `_up_` 候选顺序、macOS injector定位与显式legacy restart runner、Windows generic plugin 的 child-only 环境，以及 apply/restart 在失败前不 spawn 的边界；legacy runner合同绕开preview OS-home profile admission，原生准入由独立fixture测试覆盖。
user_language.rs: 纯 JSON Preferences.locale 投影合同；验证 native locale 映射、畸形 typed locale/unsupported language 零变更拒绝、缺失/原值前像、字段/metadata drift 下 test-only CAS rollback 与 fixed English helper；不接触文件系统、IPC 或真实 profile。
user_language_files.rs: 临时 profile 的事务/恢复合同；验证一次 receipt 记录原像与缺失目录意图、strings 先于 locale、同语言重应用保留首原像、absent 回滚、固定 en-GB、坏 receipt/IO 拒绝、prepublish drift 零写入、symlink 与 empty-only 清理；Unix 验证 durable path，Windows fixture fail-closed，明确不声称 OS CAS。
user_language_files_production.rs: 固定 production-layout 构造与只读 status projection 的 tempfile 合同；验证未知 locale 不泄露/不伪造 English、缺 state_dir 不创建、current/drift/pending + active SHA-256、合法 pack schema 与 typed PermissionDenied 分类，并证明 writer guard 在 resource commit 后、locale 原子发布前拒绝且 pending 后续可恢复；不触碰真实 profile 或 Cavalry。
native_user_restore_only.rs: hostless English restore 的fixture合同；只允许完整Current receipt/postimage授予能力，missing/unsupported host才产生nativeRestoreOnly，拒绝无回执/pending/corrupt及locale/strings/mode drift；另在strict restore最终guard#3删除receipt或替成pending时以解析时同一bytes+mode期望拒绝发布，profile零写且外部receipt状态留存；不接真实profile或启动Cavalry。
native_user_official_independence.rs: 临时profile投影合同；在Absent默认English与Known显式翻译两态下，比较installationMode official/unknown且验证locale、nativeResourceAvailable与patchStatus各守独立来源，不读取当前OS home、不运行codesign或Cavalry。

法则: 默认测试通过父级最小fixture和fake runner观察行为，不访问真实安装/GUI/UAC；只有明确ignored人工烟测可在显式路径授权下只读真实App/profile，不把未运行算pass。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
