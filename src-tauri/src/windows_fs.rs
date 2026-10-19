/**
 * [INPUT]: 依赖 Windows 普通目录句柄、BACKUP_SEMANTICS 与 FlushFileBuffers。
 * [OUTPUT]: 提供安装 journal 和用户语言事务共用的目录耐久同步；拒绝重解析目录，保留真实 OS 错误。
 * [POS]: Windows 文件系统窄原语；从现有 journal 提取，不承载路径授权、事务或失败降级。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs, io,
    os::windows::fs::{MetadataExt, OpenOptionsExt},
    path::Path,
};
use windows::Win32::Storage::FileSystem::{
    FILE_ATTRIBUTE_REPARSE_POINT, FILE_FLAG_BACKUP_SEMANTICS, FILE_SHARE_DELETE, FILE_SHARE_READ,
    FILE_SHARE_WRITE,
};

pub(crate) fn sync_directory(path: &Path) -> io::Result<()> {
    let metadata = fs::symlink_metadata(path)?;
    if !metadata.is_dir() || metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT.0 != 0 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "cannot sync a non-directory or reparse point",
        ));
    }
    fs::OpenOptions::new()
        .read(true)
        .write(true)
        .share_mode((FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE).0)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS.0)
        .open(path)?
        .sync_all()
}
