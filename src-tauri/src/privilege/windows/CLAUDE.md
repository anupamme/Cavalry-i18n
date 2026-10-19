# privilege/windows/
## Recovery boundary (2026-08-26)

language_transaction persists entry destination/preimage/postimage/backup/permission and phase data before mutation. Program Files recovery is a distinct same-EXE RunAs action invoked only inside the next user-triggered language operation; startup never probes it. QPA intermediate/final hashes are declared before first write, and rollback recreates only preimage-proven original directories. A published `journal.state` remains authoritative over an uncommitted differing `.tmp`; hash drift, reparse paths, and rollback uncertainty remain typed action errors.

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
> L2 | 父级: ../CLAUDE.md

成员清单
native_profile.rs: 独立OS KnownFolder解析Local/Roaming；ToolHelp无Cavalry快路不启动辅助进程，有同名进程才用既有SID探针确认共享写者；正常启动选定EXE。
mod.rs: 组合KnownFolder、旧copy、Program Files事务与native_profile边界。
admin_copy.rs: direct 权限失败后的受限 UAC retry；只接受 OS-known Program Files 内的目标，保留 UAC consent 并隐藏提升 PowerShell worker，精确映射 0/42/43/44 事务结果。
known_folders.rs: Windows Known Folder 与 reparse-point 验证；拒绝基于进程环境变量推导授权根，也拒绝目标链重解析点。
manifest.rs: hash-locked PowerShell loader、copy manifest 与 cleanup；source/manifest/script 均校验摘要并以 FileShare.None 保持复制时的来源一致性。
language_transaction/: Program Files 单次 UAC 语言事务；父进程在用户动作锁内以固定 apply/recovery transport 启动 same-EXE worker，worker 重解 OS Known Folder，并在 durable journal 内恢复或提交 JSON、generic、QPA 与 final marker。

法则: 提升授权来自 OS Known Folder，不来自调用方字符串；完整语言切换只走 same-EXE worker，旧 PowerShell copy 不得承载 QPA 或跨文件语言事务。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
