/**
 * [INPUT]: 依赖受控state目录、固定baseline manifest和bundle受管文件路径。
 * [OUTPUT]: 提供有界JSON I/O、nofollow文件摘要/复制、私有目录校验和排他发布。
 * [POS]: native_mac_vendor_baseline 的文件系统适配器；不判断原厂身份，不生成typed能力。
 * 所有内容流式读写。manifest读取上限后多读一个字节以发现并发增长。
 * 私有目录固定0700，manifest与blob固定0600。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    ffi::CString,
    fs::{self, DirBuilder, File, OpenOptions},
    io::{self, Read, Write},
    os::unix::{
        ffi::OsStrExt,
        fs::{DirBuilderExt, MetadataExt, OpenOptionsExt},
    },
    path::Path,
};

pub(super) const PRIVATE_DIRECTORY_MODE: u32 = 0o700;
pub(super) const PRIVATE_FILE_MODE: u32 = 0o600;
pub(super) const MANIFEST_LIMIT: u64 = 64 * 1024 * 1024;
const HASH_BUFFER_BYTES: usize = 64 * 1024;
const RENAME_EXCL: libc::c_uint = 0x0000_0004;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct FileDigest {
    pub(super) mode: u32,
    pub(super) byte_len: u64,
    pub(super) sha256: String,
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

// ---- 有界manifest序列化 ----------------------------------------------------

pub(super) fn json_bytes_bounded<T: Serialize>(value: &T, limit: u64) -> Result<Vec<u8>, String> {
    let mut writer = BoundedWriter::new(Vec::new(), limit);
    serde_json::to_writer(&mut writer, value)
        .map_err(|error| format!("Could not serialize bounded native baseline JSON: {error}"))?;
    Ok(writer.into_inner())
}

pub(super) fn write_json_bounded<T: Serialize>(
    path: &Path,
    value: &T,
    limit: u64,
) -> Result<(), String> {
    let mut file = create_private_file(path)?;
    let mut writer = BoundedWriter::new(&mut file, limit);
    serde_json::to_writer(&mut writer, value)
        .map_err(|error| format!("Could not write bounded native baseline JSON: {error}"))?;
    writer
        .flush()
        .map_err(|error| format!("Could not flush native baseline manifest: {error}"))?;
    file.sync_all()
        .map_err(|error| format!("Could not sync native baseline manifest: {error}"))?;
    validate_file_mode(path, PRIVATE_FILE_MODE)?;
    Ok(())
}

struct BoundedWriter<W> {
    inner: W,
    written: u64,
    limit: u64,
}

impl<W> BoundedWriter<W> {
    fn new(inner: W, limit: u64) -> Self {
        Self {
            inner,
            written: 0,
            limit,
        }
    }

    fn into_inner(self) -> W {
        self.inner
    }
}

impl<W: Write> Write for BoundedWriter<W> {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        let requested = u64::try_from(bytes.len())
            .map_err(|_| io::Error::new(io::ErrorKind::InvalidData, "JSON write overflow"))?;
        if self
            .written
            .checked_add(requested)
            .map_or(true, |total| total > self.limit)
        {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "native baseline JSON exceeds its byte limit",
            ));
        }
        let count = self.inner.write(bytes)?;
        self.written = self
            .written
            .checked_add(u64::try_from(count).map_err(|_| {
                io::Error::new(io::ErrorKind::InvalidData, "JSON write count overflow")
            })?)
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "JSON size overflow"))?;
        Ok(count)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.inner.flush()
    }
}

// ---- 文件安全观察与流式复制 -----------------------------------------------

pub(super) fn read_bounded_regular(path: &Path, limit: u64) -> Result<(Vec<u8>, u32), String> {
    let before = lstat(path)?;
    if before.file_type().is_symlink() || !before.is_file() {
        return Err(format!(
            "Expected a regular nofollow file: {}",
            path.display()
        ));
    }
    if before.size() > limit {
        return Err(format!(
            "File exceeds the {limit} byte limit: {}",
            path.display()
        ));
    }
    let mut file = open_regular_nofollow(path)?;
    let opened = file
        .metadata()
        .map_err(|error| format!("Could not inspect opened file {}: {error}", path.display()))?;
    require_same(path, &before, &opened, "open")?;
    let read_limit = limit
        .checked_add(1)
        .ok_or_else(|| "File read limit overflowed.".to_string())?;
    let mut bytes = Vec::new();
    Read::by_ref(&mut file)
        .take(read_limit)
        .read_to_end(&mut bytes)
        .map_err(|error| format!("Could not read bounded file {}: {error}", path.display()))?;
    if u64::try_from(bytes.len()).map_err(|_| "File length overflowed.".to_string())? > limit {
        return Err(format!(
            "File grew past its {limit} byte limit: {}",
            path.display()
        ));
    }
    let after_open = file
        .metadata()
        .map_err(|error| format!("Could not recheck opened file {}: {error}", path.display()))?;
    let after_path = lstat(path)?;
    require_same(path, &before, &after_open, "read")?;
    require_same(path, &before, &after_path, "path recheck")?;
    if u64::try_from(bytes.len()).ok() != Some(before.size()) {
        return Err(format!(
            "File size changed while reading: {}",
            path.display()
        ));
    }
    Ok((bytes, permission_mode(&before)))
}

pub(super) fn digest_regular(path: &Path, expected_byte_len: u64) -> Result<FileDigest, String> {
    let before = lstat(path)?;
    if before.file_type().is_symlink() || !before.is_file() {
        return Err(format!(
            "Expected a regular nofollow file: {}",
            path.display()
        ));
    }
    if before.size() != expected_byte_len {
        return Err(format!(
            "File size differs from its expected bound: {}",
            path.display()
        ));
    }
    let mut file = open_regular_nofollow(path)?;
    let opened = file
        .metadata()
        .map_err(|error| format!("Could not inspect opened file {}: {error}", path.display()))?;
    require_same(path, &before, &opened, "open")?;
    let (byte_len, sha256) = copy_stream_bounded(&mut file, &mut io::sink(), expected_byte_len)
        .map_err(|error| format!("Could not hash bounded file {}: {error}", path.display()))?;
    let after_open = file
        .metadata()
        .map_err(|error| format!("Could not recheck opened file {}: {error}", path.display()))?;
    let after_path = lstat(path)?;
    require_same(path, &before, &after_open, "hash")?;
    require_same(path, &before, &after_path, "path recheck")?;
    if byte_len != before.size() || byte_len != expected_byte_len {
        return Err(format!(
            "File size changed while hashing: {}",
            path.display()
        ));
    }
    Ok(FileDigest {
        mode: permission_mode(&before),
        byte_len,
        sha256,
    })
}

pub(super) fn copy_regular_nofollow(
    source: &Path,
    destination: &Path,
    expected: &FileDigest,
) -> Result<FileDigest, String> {
    let before = lstat(source)?;
    if before.file_type().is_symlink() || !before.is_file() {
        return Err(format!(
            "Expected a regular nofollow source: {}",
            source.display()
        ));
    }
    if permission_mode(&before) != expected.mode || before.size() != expected.byte_len {
        return Err(format!(
            "Source mode or size drifted before copy: {}",
            source.display()
        ));
    }
    let mut input = open_regular_nofollow(source)?;
    let opened = input.metadata().map_err(|error| {
        format!(
            "Could not inspect opened source {}: {error}",
            source.display()
        )
    })?;
    require_same(source, &before, &opened, "copy open")?;
    let mut output = create_private_file(destination)?;
    let (byte_len, sha256) = copy_stream_bounded(&mut input, &mut output, expected.byte_len)
        .map_err(|error| {
            format!(
                "Could not copy bounded source {}: {error}",
                source.display()
            )
        })?;
    let digest = FileDigest {
        mode: expected.mode,
        byte_len,
        sha256,
    };
    if &digest != expected {
        return Err(format!(
            "Source bytes drifted during copy: {}",
            source.display()
        ));
    }
    let after_open = input.metadata().map_err(|error| {
        format!(
            "Could not recheck opened source {}: {error}",
            source.display()
        )
    })?;
    let after_path = lstat(source)?;
    require_same(source, &before, &after_open, "copy read")?;
    require_same(source, &before, &after_path, "copy path recheck")?;
    output.sync_all().map_err(|error| {
        format!(
            "Could not sync private blob {}: {error}",
            destination.display()
        )
    })?;
    validate_file_mode(destination, PRIVATE_FILE_MODE)?;
    Ok(digest)
}

fn copy_stream_bounded<R: Read, W: Write>(
    input: &mut R,
    output: &mut W,
    expected_byte_len: u64,
) -> Result<(u64, String), String> {
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; HASH_BUFFER_BYTES];
    let mut byte_len = 0u64;
    while byte_len < expected_byte_len {
        let remaining = expected_byte_len - byte_len;
        let capacity = usize::try_from(remaining.min(HASH_BUFFER_BYTES as u64))
            .map_err(|_| "Bounded read size overflowed.".to_string())?;
        let read = input
            .read(&mut buffer[..capacity])
            .map_err(|error| format!("Could not read bounded stream: {error}"))?;
        if read == 0 {
            return Err("Stream ended before its expected byte length.".to_string());
        }
        output
            .write_all(&buffer[..read])
            .map_err(|error| format!("Could not write bounded stream: {error}"))?;
        byte_len = byte_len
            .checked_add(
                u64::try_from(read).map_err(|_| "File byte count overflowed.".to_string())?,
            )
            .ok_or_else(|| "File byte count overflowed.".to_string())?;
        hasher.update(&buffer[..read]);
    }
    let mut extra = [0u8; 1];
    if input
        .read(&mut extra)
        .map_err(|error| format!("Could not check bounded stream end: {error}"))?
        != 0
    {
        return Err("Stream grew past its expected byte length.".to_string());
    }
    Ok((byte_len, format!("{:x}", hasher.finalize())))
}

// ---- 私有存储几何 ----------------------------------------------------------

pub(super) fn create_private_directory(path: &Path) -> Result<(), String> {
    let mut builder = DirBuilder::new();
    builder.mode(PRIVATE_DIRECTORY_MODE);
    builder.create(path).map_err(|error| {
        format!(
            "Could not create private directory {}: {error}",
            path.display()
        )
    })?;
    validate_directory_mode(path, PRIVATE_DIRECTORY_MODE)
}

pub(super) fn validate_directory_mode(path: &Path, expected_mode: u32) -> Result<(), String> {
    let metadata = lstat(path)?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(format!("Expected a real directory: {}", path.display()));
    }
    if permission_mode(&metadata) != expected_mode {
        return Err(format!(
            "Private directory mode drifted at {}: expected {:o}, found {:o}",
            path.display(),
            expected_mode,
            permission_mode(&metadata)
        ));
    }
    Ok(())
}

pub(super) fn validate_file_mode(path: &Path, expected_mode: u32) -> Result<(), String> {
    let metadata = lstat(path)?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err(format!(
            "Expected a regular private file: {}",
            path.display()
        ));
    }
    if permission_mode(&metadata) != expected_mode {
        return Err(format!(
            "Private file mode drifted at {}: expected {:o}, found {:o}",
            path.display(),
            expected_mode,
            permission_mode(&metadata)
        ));
    }
    Ok(())
}

pub(super) fn exact_directory_members(path: &Path, expected: &[String]) -> Result<(), String> {
    let mut found = Vec::new();
    for item in fs::read_dir(path).map_err(|error| {
        format!(
            "Could not list private directory {}: {error}",
            path.display()
        )
    })? {
        let entry =
            item.map_err(|error| format!("Could not read private directory entry: {error}"))?;
        let name = entry.file_name();
        let text = name
            .to_str()
            .ok_or_else(|| format!("Private path is not UTF-8 under {}", path.display()))?;
        let metadata = fs::symlink_metadata(entry.path()).map_err(|error| {
            format!(
                "Could not inspect private member {}: {error}",
                entry.path().display()
            )
        })?;
        if metadata.file_type().is_symlink() {
            return Err(format!(
                "Private storage contains a symlink: {}",
                entry.path().display()
            ));
        }
        found.push(text.to_string());
    }
    found.sort();
    let mut expected = expected.to_vec();
    expected.sort();
    if found != expected {
        return Err(format!(
            "Private directory member set drifted: {}",
            path.display()
        ));
    }
    Ok(())
}

pub(super) fn sync_directory(path: &Path) -> Result<(), String> {
    let file = OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOFOLLOW | libc::O_DIRECTORY | libc::O_CLOEXEC)
        .open(path)
        .map_err(|error| {
            format!(
                "Could not open directory for sync {}: {error}",
                path.display()
            )
        })?;
    file.sync_all()
        .map_err(|error| format!("Could not sync directory {}: {error}", path.display()))
}

pub(super) fn publish_exclusive(source: &Path, destination: &Path) -> Result<(), String> {
    let source = c_path(source)?;
    let destination = c_path(destination)?;
    // RENAME_EXCL拒绝替换已存在的目录，包括空目录。
    let status = unsafe {
        renameatx_np(
            libc::AT_FDCWD,
            source.as_ptr(),
            libc::AT_FDCWD,
            destination.as_ptr(),
            RENAME_EXCL,
        )
    };
    if status != 0 {
        return Err(format!(
            "Could not publish immutable native baseline without replacement: {}",
            io::Error::last_os_error()
        ));
    }
    Ok(())
}

fn create_private_file(path: &Path) -> Result<File, String> {
    OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(PRIVATE_FILE_MODE)
        .custom_flags(libc::O_NOFOLLOW | libc::O_CLOEXEC)
        .open(path)
        .map_err(|error| format!("Could not create private file {}: {error}", path.display()))
}

fn open_regular_nofollow(path: &Path) -> Result<File, String> {
    OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK | libc::O_CLOEXEC)
        .open(path)
        .map_err(|error| {
            format!(
                "Could not open file without following links {}: {error}",
                path.display()
            )
        })
}

fn lstat(path: &Path) -> Result<fs::Metadata, String> {
    fs::symlink_metadata(path)
        .map_err(|error| format!("Could not inspect path {}: {error}", path.display()))
}

fn require_same(
    path: &Path,
    before: &fs::Metadata,
    after: &fs::Metadata,
    operation: &str,
) -> Result<(), String> {
    if MetadataStamp::from(before) != MetadataStamp::from(after) {
        return Err(format!(
            "File changed during {operation}: {}",
            path.display()
        ));
    }
    Ok(())
}

fn permission_mode(metadata: &fs::Metadata) -> u32 {
    metadata.mode() & 0o7777
}

fn c_path(path: &Path) -> Result<CString, String> {
    CString::new(path.as_os_str().as_bytes())
        .map_err(|_| format!("Native baseline path contains NUL: {}", path.display()))
}

unsafe extern "C" {
    fn renameatx_np(
        olddirfd: libc::c_int,
        oldpath: *const libc::c_char,
        newdirfd: libc::c_int,
        newpath: *const libc::c_char,
        flags: libc::c_uint,
    ) -> libc::c_int;
}

#[cfg(test)]
#[path = "native_mac_vendor_baseline_storage_tests.rs"]
mod tests;
