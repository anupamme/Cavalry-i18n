/**
 * [INPUT]: 依赖 runner、CopyPair、macOS fd/renameatx_np、codesign/xattr/AppleScript、libproc 与 NSS 用户记录。
 * [OUTPUT]: 组织 apply transaction、bundle 签名/隔离属性、exact-PID/all-Cavalry 进程控制和 OS 用户 home 解析四个 macOS 子域。
 * [POS]: privilege 的 macOS 平台分区；不把 fd-bound recovery、JXA、bundle identity 进程准入或 profile 路径解析细节泄漏给命令编排。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
pub(crate) mod apply_transaction;
pub(crate) mod bundle;
pub(crate) mod process;
pub(crate) mod user_profile;
