/**
 * [INPUT]: 依赖 privilege 的 runner/copy transaction、Windows Known Folder、旧 PowerShell copy fallback 与 same-EXE language transaction。
 * [OUTPUT]: 组织known_folders、manifest、admin_copy、language_transaction与native_profile；profile不借用安装提升权。
 * [POS]: privilege 的 Windows 平台分区；完整 Program Files 语言切换只在 same-EXE worker 内提升，旧 copy UAC 不承载 QPA。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
pub(crate) mod admin_copy;
pub(crate) mod known_folders;
pub(crate) mod language_transaction;
pub(crate) mod manifest;
pub(crate) mod native_profile;
