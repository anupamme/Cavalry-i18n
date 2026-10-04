# commands/tests/
> L2 | 父级: ../CLAUDE.md

成员清单
runtime.rs: 验证补丁回执跨源更新/安装绑定且观察零写入， Resources 与 `_up_` 候选顺序、macOS injector定位与显式legacy restart runner、Windows generic plugin 的 child-only 环境，以及 apply/restart 在失败前不 spawn 的边界；legacy runner合同绕开preview OS-home profile admission，原生准入由独立fixture测试覆盖。
user_language.rs: 纯 JSON Preferences.locale 投影合同；验证 native locale 映射、畸形 typed locale/unsupported language 零变更拒绝、缺失/原值前像、字段/metadata drift 下 test-only CAS rollback 与 fixed English helper；不接触文件系统、IPC 或真实 profile。
user_language_files.rs: 临时 profile 的事务/恢复合同；验证一次 receipt 记录原像与缺失目录意图、strings 先于 locale、同语言重应用保留首原像、absent 回滚、固定 en-GB、坏 receipt/IO 拒绝、prepublish drift 零写入、symlink 与 empty-only 清理；Unix 验证 durable path，Windows fixture fail-closed，明确不声称 OS CAS。
user_language_files_production.rs: 固定 production-layout 构造与只读 status projection 的 tempfile 合同；验证未知 locale 不泄露/不伪造 English、缺 state_dir 不创建、current/drift/pending + active SHA-256、合法 pack schema 与 typed PermissionDenied 分类，并证明 writer guard 在 resource commit 后、locale 原子发布前拒绝且 pending 后续可恢复；不触碰真实 profile 或 Cavalry。
native_user_restore_only.rs: hostless English restore 的fixture合同；只允许完整Current receipt/postimage授予能力，missing/unsupported host才产生nativeRestoreOnly，拒绝无回执/pending/corrupt及locale/strings/mode drift；另在strict restore最终guard#3删除receipt或替成pending时以解析时同一bytes+mode期望拒绝发布，profile零写且外部receipt状态留存；不接真实profile或启动Cavalry。
native_user_official_independence.rs: 临时profile投影合同；在Absent默认English与Known显式翻译两态下，比较installationMode official/unknown且验证locale、nativeResourceAvailable与patchStatus各守独立来源，不读取当前OS home、不运行codesign或Cavalry。

法则: 测试通过父级最小 fixture 和 fake runner 观察行为；不得访问真实 Cavalry 安装、GUI 或 UAC。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
