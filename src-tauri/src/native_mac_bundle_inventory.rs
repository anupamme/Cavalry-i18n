/**
 * [INPUT]: 依赖canonical bundle root、install.rs相对路径安全门与sha2流式摘要。
 * [OUTPUT]: 返回可序列化的相对路径清单；记录对象类型、Unix mode、字节数和普通文件SHA-256。
 * [POS]: macOS独立验收清单；生产baseline只消费序列化类型，不遍历整树。
 * 普通文件以O_NOFOLLOW|O_NONBLOCK打开并校验lstat/fstat身份。
 * 固定限制为250000对象、64 GiB和128层；root计入对象数。
 * 普通路径遍历和前后复验不构成fd-relative快照，也不消除同UID TOCTOU。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    fs::{self, File, OpenOptions},
    io::Read,
    os::unix::{
        ffi::OsStrExt,
        fs::{MetadataExt, OpenOptionsExt},
    },
    path::{Component, Path, PathBuf},
};

const MAX_OBJECTS: usize = 250_000;
const MAX_TOTAL_BYTES: u64 = 64 * 1024 * 1024 * 1024;
const MAX_DEPTH: usize = 128;
const HASH_BUFFER_BYTES: usize = 64 * 1024;

#[derive(Debug, Clone, Copy)]
pub(crate) struct InventoryLimits {
    pub(crate) max_objects: usize,
    pub(crate) max_total_bytes: u64,
    pub(crate) max_depth: usize,
}

impl Default for InventoryLimits {
    fn default() -> Self {
        Self {
            max_objects: MAX_OBJECTS,
            max_total_bytes: MAX_TOTAL_BYTES,
            max_depth: MAX_DEPTH,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub(crate) enum BundleObject {
    Directory {
        mode: u32,
    },
    RegularFile {
        mode: u32,
        byte_len: u64,
        sha256: String,
    },
    Symlink {
        mode: u32,
        target: PathBuf,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct BundleInventory {
    pub(crate) entries: BTreeMap<PathBuf, BundleObject>,
}

pub(crate) fn inventory_bundle(root: &Path) -> Result<BundleInventory, String> {
    inventory_with_limits(root, InventoryLimits::default())
}

pub(crate) fn inventory_with_limits(
    root: &Path,
    limits: InventoryLimits,
) -> Result<BundleInventory, String> {
    let root_stamp = validate_canonical_root(root)?;
    let mut builder = InventoryBuilder {
        root,
        root_stamp,
        limits,
        total_bytes: 0,
        entries: BTreeMap::new(),
    };
    builder.scan_directory(Path::new(""), 0)?;
    Ok(BundleInventory {
        entries: builder.entries,
    })
}

struct InventoryBuilder<'a> {
    root: &'a Path,
    root_stamp: MetadataStamp,
    limits: InventoryLimits,
    total_bytes: u64,
    entries: BTreeMap<PathBuf, BundleObject>,
}

impl InventoryBuilder<'_> {
    fn scan_directory(&mut self, relative: &Path, depth: usize) -> Result<(), String> {
        self.check_depth(relative, depth)?;
        self.check_object_capacity(relative)?;
        self.validate_parent(relative)?;
        let path = self.root.join(relative);
        let before_path = lstat(&path)?;
        if before_path.file_type().is_symlink() || !before_path.is_dir() {
            return Err(format!(
                "Bundle directory changed type during inventory: {}",
                path.display()
            ));
        }
        if relative.as_os_str().is_empty() && MetadataStamp::from(&before_path) != self.root_stamp {
            return Err("Bundle inventory root changed after canonical validation.".to_string());
        }

        let directory = open_directory_nofollow(&path)?;
        let opened = directory
            .metadata()
            .map_err(|error| format!("Could not inspect opened bundle directory: {error}"))?;
        require_same_object(&path, &before_path, &opened, "directory open")?;
        self.record_object(
            relative,
            BundleObject::Directory {
                mode: permission_mode(&before_path),
            },
        )?;

        // 逐项遍历，不先把目录名复制到无界向量。
        let entries = fs::read_dir(&path).map_err(|error| {
            format!(
                "Could not read bundle directory {}: {error}",
                path.display()
            )
        })?;
        for entry in entries {
            let entry = entry.map_err(|error| {
                format!(
                    "Could not read bundle directory entry {}: {error}",
                    path.display()
                )
            })?;
            let name = entry.file_name();
            if !is_single_normal_component(&name) {
                return Err(format!(
                    "Bundle contains an invalid path component under {}.",
                    path.display()
                ));
            }
            let child_relative = relative.join(name);
            let child_depth = depth
                .checked_add(1)
                .ok_or_else(|| "Bundle inventory depth overflowed.".to_string())?;
            self.scan_object(&child_relative, child_depth)?;
        }

        let after_open = directory
            .metadata()
            .map_err(|error| format!("Could not recheck opened bundle directory: {error}"))?;
        let after_path = lstat(&path)?;
        require_same_object(&path, &before_path, &after_open, "directory traversal")?;
        require_same_object(&path, &before_path, &after_path, "directory path recheck")?;
        self.validate_parent(relative)?;
        Ok(())
    }

    fn scan_object(&mut self, relative: &Path, depth: usize) -> Result<(), String> {
        self.check_depth(relative, depth)?;
        self.check_object_capacity(relative)?;
        self.validate_parent(relative)?;
        let path = self.root.join(relative);
        let metadata = lstat(&path)?;
        let file_type = metadata.file_type();
        if file_type.is_symlink() {
            return self.record_symlink(relative, &path, &metadata);
        }
        if metadata.is_dir() {
            return self.scan_directory(relative, depth);
        }
        if metadata.is_file() {
            return self.record_regular_file(relative, &path, &metadata);
        }
        Err(format!(
            "Bundle contains a special non-regular object: {}",
            path.display()
        ))
    }

    fn record_regular_file(
        &mut self,
        relative: &Path,
        path: &Path,
        before_path: &fs::Metadata,
    ) -> Result<(), String> {
        let remaining_bytes = self.limits.max_total_bytes.saturating_sub(self.total_bytes);
        if before_path.size() > remaining_bytes {
            return Err(format!(
                "Bundle inventory exceeds the {} byte limit at {}.",
                self.limits.max_total_bytes,
                path.display()
            ));
        }
        let mut file = open_regular_nofollow_nonblocking(path)?;
        let opened = file.metadata().map_err(|error| {
            format!(
                "Could not inspect opened bundle file {}: {error}",
                path.display()
            )
        })?;
        if !opened.is_file() {
            return Err(format!(
                "Bundle file changed to a special object before open completed: {}",
                path.display()
            ));
        }
        require_same_object(path, before_path, &opened, "regular file open")?;

        let mut hasher = Sha256::new();
        let mut buffer = [0u8; HASH_BUFFER_BYTES];
        let mut byte_len = 0u64;
        loop {
            let read = file.read(&mut buffer).map_err(|error| {
                format!("Could not hash bundle file {}: {error}", path.display())
            })?;
            if read == 0 {
                break;
            }
            let chunk_len = u64::try_from(read)
                .map_err(|_| "Bundle inventory byte count overflowed.".to_string())?;
            self.account_bytes(chunk_len, path)?;
            byte_len = byte_len
                .checked_add(chunk_len)
                .ok_or_else(|| "Bundle file byte count overflowed.".to_string())?;
            hasher.update(&buffer[..read]);
        }

        let after_open = file.metadata().map_err(|error| {
            format!(
                "Could not recheck opened bundle file {}: {error}",
                path.display()
            )
        })?;
        let after_path = lstat(path)?;
        require_same_object(path, before_path, &after_open, "regular file read")?;
        require_same_object(path, before_path, &after_path, "regular file path recheck")?;
        if byte_len != before_path.size() {
            return Err(format!(
                "Bundle file size changed while hashing: {}",
                path.display()
            ));
        }
        self.validate_parent(relative)?;
        self.record_object(
            relative,
            BundleObject::RegularFile {
                mode: permission_mode(before_path),
                byte_len,
                sha256: format!("{:x}", hasher.finalize()),
            },
        )
    }

    fn record_symlink(
        &mut self,
        relative: &Path,
        path: &Path,
        before_path: &fs::Metadata,
    ) -> Result<(), String> {
        let target = fs::read_link(path).map_err(|error| {
            format!("Could not read bundle symlink {}: {error}", path.display())
        })?;
        let after_path = lstat(path)?;
        if !after_path.file_type().is_symlink() {
            return Err(format!("Bundle symlink changed type: {}", path.display()));
        }
        require_same_object(path, before_path, &after_path, "symlink target read")?;
        let target_len = u64::try_from(target.as_os_str().as_bytes().len())
            .map_err(|_| "Bundle symlink target length overflowed.".to_string())?;
        self.account_bytes(target_len, path)?;
        self.validate_parent(relative)?;
        self.record_object(
            relative,
            BundleObject::Symlink {
                mode: permission_mode(before_path),
                target,
            },
        )
    }

    fn record_object(&mut self, relative: &Path, object: BundleObject) -> Result<(), String> {
        self.check_object_capacity(relative)?;
        if self.entries.contains_key(relative) {
            return Err(format!(
                "Bundle inventory found a duplicate relative path: {}",
                relative.display()
            ));
        }
        self.entries.insert(relative.to_path_buf(), object);
        Ok(())
    }

    fn check_object_capacity(&self, relative: &Path) -> Result<(), String> {
        if self.entries.len() >= self.limits.max_objects {
            return Err(format!(
                "Bundle inventory exceeds the {} object limit at {}.",
                self.limits.max_objects,
                relative.display()
            ));
        }
        Ok(())
    }

    fn account_bytes(&mut self, amount: u64, path: &Path) -> Result<(), String> {
        let total = self
            .total_bytes
            .checked_add(amount)
            .ok_or_else(|| "Bundle inventory byte count overflowed.".to_string())?;
        if total > self.limits.max_total_bytes {
            return Err(format!(
                "Bundle inventory exceeds the {} byte limit at {}.",
                self.limits.max_total_bytes,
                path.display()
            ));
        }
        self.total_bytes = total;
        Ok(())
    }

    fn check_depth(&self, relative: &Path, depth: usize) -> Result<(), String> {
        if depth > self.limits.max_depth {
            return Err(format!(
                "Bundle inventory exceeds the {} directory depth limit at {}.",
                self.limits.max_depth,
                relative.display()
            ));
        }
        Ok(())
    }

    fn validate_parent(&self, relative: &Path) -> Result<(), String> {
        if relative.as_os_str().is_empty() {
            return Ok(());
        }
        let parent = relative.parent().unwrap_or_else(|| Path::new(""));
        crate::install::validate_no_symlink_directory_components(self.root, parent)
            .map_err(|error| format!("Bundle path parent failed no-symlink validation: {error}"))
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct MetadataStamp {
    dev: u64,
    ino: u64,
    mode: u32,
    size: u64,
    mtime: i64,
    mtime_nsec: i64,
    ctime: i64,
    ctime_nsec: i64,
}

impl From<&fs::Metadata> for MetadataStamp {
    fn from(metadata: &fs::Metadata) -> Self {
        Self {
            dev: metadata.dev(),
            ino: metadata.ino(),
            mode: metadata.mode(),
            size: metadata.size(),
            mtime: metadata.mtime(),
            mtime_nsec: metadata.mtime_nsec(),
            ctime: metadata.ctime(),
            ctime_nsec: metadata.ctime_nsec(),
        }
    }
}

fn validate_canonical_root(root: &Path) -> Result<MetadataStamp, String> {
    if !root.is_absolute() {
        return Err("Bundle inventory root must be an absolute canonical path.".to_string());
    }
    let metadata = lstat(root)?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err("Bundle inventory root must be a real non-symlink directory.".to_string());
    }
    let canonical = fs::canonicalize(root)
        .map_err(|error| format!("Could not canonicalize bundle inventory root: {error}"))?;
    if canonical != root {
        return Err("Bundle inventory root is not already canonical.".to_string());
    }
    let directory = open_directory_nofollow(root)?;
    let opened = directory
        .metadata()
        .map_err(|error| format!("Could not inspect opened bundle root: {error}"))?;
    require_same_object(root, &metadata, &opened, "root open")?;
    Ok(MetadataStamp::from(&metadata))
}

fn lstat(path: &Path) -> Result<fs::Metadata, String> {
    fs::symlink_metadata(path).map_err(|error| {
        format!(
            "Could not inspect bundle object {}: {error}",
            path.display()
        )
    })
}

fn require_same_object(
    path: &Path,
    expected: &fs::Metadata,
    actual: &fs::Metadata,
    operation: &str,
) -> Result<(), String> {
    if MetadataStamp::from(expected) != MetadataStamp::from(actual) {
        return Err(format!(
            "Bundle object identity or metadata changed during {operation}: {}",
            path.display()
        ));
    }
    Ok(())
}

fn open_directory_nofollow(path: &Path) -> Result<File, String> {
    OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOFOLLOW | libc::O_DIRECTORY | libc::O_CLOEXEC)
        .open(path)
        .map_err(|error| {
            format!(
                "Could not open bundle directory without following links {}: {error}",
                path.display()
            )
        })
}

fn open_regular_nofollow_nonblocking(path: &Path) -> Result<File, String> {
    OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK | libc::O_CLOEXEC)
        .open(path)
        .map_err(|error| {
            format!(
                "Could not open bundle file without following links {}: {error}",
                path.display()
            )
        })
}

fn permission_mode(metadata: &fs::Metadata) -> u32 {
    metadata.mode() & 0o7777
}

fn is_single_normal_component(name: &std::ffi::OsStr) -> bool {
    let mut components = Path::new(name).components();
    matches!(components.next(), Some(Component::Normal(_))) && components.next().is_none()
}

#[cfg(test)]
#[path = "native_mac_bundle_inventory_tests.rs"]
mod tests;
