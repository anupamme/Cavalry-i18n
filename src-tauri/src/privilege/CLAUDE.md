# privilege/
> L2 | 父级: ../CLAUDE.md

成员清单
copy_transaction.rs: 跨平台 direct copy 事务核心；以 typed CopyFailure、CopyDiagnostic 与 PostCommitWarning 记录权限拒绝、回滚、恢复残留和提交后清理，允许事务补充回滚说明但不丢失原始失败类别，不靠错误字符串反向解析控制流。
external_link.rs: 固定项目外链适配器；只把 twitter/repository/license/reportIssue/legacyRelease 枚举映射为编译期 HTTPS 地址（含唯一 X 关注链接），并经 CommandRunner 调用平台默认浏览器，renderer 永远不能传入任意 URL；2.7.2入口固定p12历史tag，不跟随latest。
keychain.rs: Keychain query patch 的受控 privilege 编排；只暴露已拥有字节缓冲与补丁报告。
restart.rs: 受控进程关闭/重启边界；native preview 专用 launch-only helper 用 `open -g -n <verified app>` 请求后台启动新实例，单测锁定参数/原路径且run=0、不先终止；`-g`不保证Cavalry自身不激活窗口，外层仍需遵守前台所有权；宿主验证及all-Cavalry snapshot admission不变。legacy `restart_commands` 与显式 graceful close/osascript 原样保留，集成合同继续锁定`open -n`；Windows从首次复核到退出固定当前Session的同一Process/SafeHandle，先精确匹配executable并优雅关闭，跨会话实例或exact-PID任意可见顶层窗口立即返回typed StillRunning，仅在绝对路径一致且两次窗口oracle均证明无可见窗口时单进程收尾，拒绝PID复用、名称批量与进程树终止，同时保留cwd/env并返回真实PID。
runner.rs: CommandRunner抽象及真实/记录实现；普通run/capture语义保持不变，status-only deadline端口供窄只读探针使用，Real runner超时后kill并wait其直接子进程；Windows captured helper统一附加`CREATE_NO_WINDOW`。
tests.rs: privilege owner unit tests；验证 direct rollback、typed cleanup warning、Windows apply 退出状态与用户动作内 Program Files recovery 必经 same-EXE launcher。
macos/: macOS durable apply transaction、bundle维护、用户home解析与exact-PID/all-Cavalry适配器；承担fd-bound copy/restore、首次launch gate、codesign、quarantine与Privacy & Security入口；NRT恢复用同一manifest验证来源，只在App回滚前调用profile callback；status复用schema/root绑定的只读owner source hint，不读journal、App槽或签名；bundle.rs另提供固定Apple Developer-ID requirement的5秒status-only验签，唯一读取exit code且超时kill/wait当前子进程；签名来源与版本/资源/profile分离，失败只留unknown，脚本重签的三个自有外置组件仍按路径进入兼容清理与恢复范围。
windows/: Windows Known Folder/UAC 适配器；Program Files apply 与用户动作内 journal recovery 都使用 same-EXE、hash-locked transport，受保护根禁止未提权 fallback；旧 PowerShell manifest 仅保留兼容 copy fallback。

法则: facade 不包含平台业务；事务失败优先恢复，已提交后的清理残留只能以稳定结构化诊断向上报告。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
