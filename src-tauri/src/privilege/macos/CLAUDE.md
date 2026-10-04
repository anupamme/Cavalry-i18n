# privilege/macos/
> L2 | 父级: ../CLAUDE.md

成员清单
mod.rs: macOS privilege 子模块边界；向上提供 bundle 系统操作、selected/all-Cavalry 进程准入与当前 OS 用户 home 解析。
apply_transaction.rs: macOS apply 的 durable transaction owner；以单次打开并经 F_GETPATH 绑定的 root、已固定的目录/节点 fd 执行 nofollow 备份、原子发布、CAS 恢复与 quarantine xattr 遍历；strict begin 统一验证 preimage，准备/发布前扫描 exact PID，首次安装按 wrapper→Info 发布 journal-aware gate；journal 依靠 0700 state root、schema/path/phase/plan、backup hash、nofollow 与 CAS 校验恢复，不访问 Keychain，旧 schema-6 `authenticationTag` 只为无提示迁移而读取后忽略；bundle create/rename 的 errno 权限类别跨安全回滚保留；Signing phase 精确覆盖 `CodeDirectory`、`CodeSignature`、`CodeRequirements` 三个外置组件，使 codesign 中断和后续失败都能 CAS 回滚完整签名副作用；成功 postimage 仍必须显式 verifier 证明。
bundle.rs: Cavalry.app签名与quarantine操作；只执行当前用户已获授权的直接命令，拒绝管理员shell fallback；通过status-only 5秒runner端口向Apple验证精确Developer-ID requirement，结果只采exit code；transaction签名语义不变，三个旧Switcher外置签名组件仍按自有regular-file路径识别兼容残留，目录内无关成员不受影响。
process.rs: 通过 libproc 读取原始 executable 路径；exact guard 仍按选中 canonical executable 限定，新增共享 profile guard 检查所有 `Cavalry`/旧 `CavalryLauncher` 候选的 canonical `*.app/Contents/MacOS` 与 `com.scenegroup.cavalry`，覆盖重命名/多版本副本、忽略可证实的不同 bundle ID、候选无法检查时 fail closed；只忽略 typed vanished PID，普通写入 admission 不发送 terminate。它是进程快照而非 OS launch lock。
user_profile.rs: 以 `getpwuid_r` 解析当前 real/effective uid 的 OS home，不信任 `HOME`、拒绝 uid 不一致与非空 `CFFIXED_USER_HOME`；只提供路径推导的受限基础，不声称证明 Qt TestMode 或 Cavalry 自身 profile 与其一致，也不直接读写用户文件。

法则: macOS JXA/系统调用只能存在于此目录；调用方只依赖 typed command runner 与结果；禁止临时 shell 提权。

变更日志
- 2026-08-09: 消除 codesign mutation→postimage 的恢复空窗；首次安装先发布 wrapper/Info gate 再第三次 exact-PID 扫描；filtered JSON 作为 observe-only generation postcondition；Committed/Restored canonical journal 原子退役后才清理，startup busy 不再永久 latch。
- 2026-08-09: strict apply 增加 exact preimage、双重进程扫描、显式签名 postimage、deferred replacement-before-removal 顺序、state 目录 fsync 门与真实子进程 phase matrix；候选 PID 不可检查、签名白名单外 drift、非 regular mode 与不确定 durability 均 fail closed。
- 2026-08-09: 登记 single-open root、fd-relative/CAS apply transaction、当时使用 HMAC 的 journal、quarantine preimage 与启动恢复职责；补齐 symlink/hardlink/TOCTOU fail-closed 边界。2026-09-02 因 ad-hoc 更新身份会触发 Keychain 密码框，保留 durable journal 与结构/CAS 校验，移除 HMAC/Keychain 依赖。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
