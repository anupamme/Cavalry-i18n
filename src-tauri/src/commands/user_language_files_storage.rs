/**
 * [INPUT]: 依赖固定 UserLanguagePaths、完整 bytes+mode 前像、调用方 writer guard 与平台原子替换原语。
 * [OUTPUT]: 提供 symlink/non-file 拒绝、暂存发布和真实 PermissionDenied 标签、receipt bytes+mode 精确读取/发布、Unix 文件/目录同步及 receipt-owned 空目录清理；cfg(test) 计 receipt image 读取并按指定目录注入一次同步失败；Windows 目录耐久未知时 fail closed。
 * 普通与guarded pending回执均使用紧凑JSON；reader仍接受旧prettyJSON。
 * [POS]: user_language_files 的固定布局文件适配器；hostless pending receipt复用初次解析的原始FileImage作预发布期望，guard在stage与publish边界复查，但比对到rename仍有TOCTOU，不能宣称OS CAS/跨进程安全，也不是通用事务API。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::{Component, Path},
    sync::atomic::{AtomicU64, Ordering},
};

#[cfg(test)]
use std::path::PathBuf;

#[cfg(unix)]
use std::os::unix::fs::{DirBuilderExt, OpenOptionsExt, PermissionsExt};

#[cfg(windows)]
use windows::{
    core::HSTRING,
    Win32::Storage::FileSystem::{MoveFileExW, ReplaceFileW, MOVEFILE_WRITE_THROUGH},
};

use super::paths::{
    reject_non_regular_destination, validate_mutation_paths, validate_path,
    validate_relative_directory,
};
use super::{validate_receipt, FileCommit, FileImage, Receipt, UserLanguagePaths};

static TEMP_SEQUENCE: AtomicU64 = AtomicU64::new(0);

#[cfg(test)]
std::thread_local! {
    static RECEIPT_IMAGE_READ_COUNT: std::cell::Cell<usize> =
        std::cell::Cell::new(0);
    static DIRECTORY_SYNC_FAILURE_PATH: std::cell::RefCell<Option<PathBuf>> =
        std::cell::RefCell::new(None);
}

#[cfg(test)]
pub(crate) fn reset_receipt_image_read_count() {
    RECEIPT_IMAGE_READ_COUNT.with(|count| count.set(0));
}

#[cfg(test)]
pub(crate) fn receipt_image_read_count() -> usize {
    RECEIPT_IMAGE_READ_COUNT.with(std::cell::Cell::get)
}

#[cfg(test)]
pub(crate) fn fail_next_directory_sync_for(path: &Path) {
    DIRECTORY_SYNC_FAILURE_PATH.with(|failure_path| {
        *failure_path.borrow_mut() = Some(path.to_path_buf());
    });
}

#[cfg(test)]
fn take_directory_sync_failure(path: &Path) -> bool {
    DIRECTORY_SYNC_FAILURE_PATH.with(|failure_path| {
        let mut failure_path = failure_path.borrow_mut();
        if failure_path.as_deref() == Some(path) {
            failure_path.take();
            true
        } else {
            false
        }
    })
}

pub(crate) const NATIVE_PERMISSION_DENIED_PREFIX: &str = "nativeUserLanguagePermissionDenied: ";

pub(crate) fn is_permission_denied(error: &str) -> bool {
    error.starts_with(NATIVE_PERMISSION_DENIED_PREFIX)
}

pub(crate) fn permission_error(role: &str, error: std::io::Error) -> String {
    let permission_prefix = if error.kind() == std::io::ErrorKind::PermissionDenied {
        NATIVE_PERMISSION_DENIED_PREFIX
    } else {
        ""
    };
    format!("{permission_prefix}{role}: {error}")
}

pub(crate) fn read_optional_image(
    paths: &UserLanguagePaths,
    path: &Path,
) -> Result<Option<FileImage>, String> {
    validate_path(paths, path)?;
    match fs::symlink_metadata(path) {
        Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_file() => Err(format!(
            "refusing symlink or non-regular user-language file {}",
            path.display()
        )),
        Ok(metadata) => {
            let bytes = fs::read(path).map_err(|error| {
                permission_error(&format!("could not read {}", path.display()), error)
            })?;
            Ok(Some(FileImage {
                bytes,
                mode: file_mode(&metadata),
            }))
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(permission_error(
            &format!("could not inspect {}", path.display()),
            error,
        )),
    }
}
pub(crate) fn read_regular_image(
    paths: &UserLanguagePaths,
    path: &Path,
    role: &str,
) -> Result<FileImage, String> {
    read_optional_image(paths, path)?.ok_or_else(|| {
        format!(
            "{role} file is missing or not a regular file: {}",
            path.display()
        )
    })
}
pub(super) fn write_or_remove_image(
    paths: &UserLanguagePaths,
    path: &Path,
    expected_current: Option<&FileImage>,
    image: Option<&FileImage>,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<FileCommit, String> {
    validate_mutation_paths(paths)?;
    match image {
        Some(image) => {
            let staged = stage_file(
                paths,
                path,
                &image.bytes,
                image.mode,
                FileExpectation::Exact(expected_current.cloned()),
                Some(&mut *writer_guard),
            )?;
            publish_staged_file(paths, staged, Some(&mut *writer_guard))
        }
        None => remove_file_durably(paths, path, expected_current, Some(writer_guard)),
    }
}

#[derive(Debug)]
pub(crate) struct StagedFixtureWrite {
    destination: std::path::PathBuf,
    temporary: std::path::PathBuf,
    expectation: FileExpectation,
}

#[derive(Debug)]
enum FileExpectation {
    Any,
    Exact(Option<FileImage>),
}

/// 测试专用的两阶段写入入口，用于在真实 staging 与 publish 之间注入外部修改。
#[cfg(test)]
pub(crate) fn stage_fixture_write(
    paths: &UserLanguagePaths,
    destination: &Path,
    expected_current: Option<&FileImage>,
    desired: &FileImage,
) -> Result<StagedFixtureWrite, String> {
    stage_file(
        paths,
        destination,
        &desired.bytes,
        desired.mode,
        FileExpectation::Exact(expected_current.cloned()),
        None,
    )
}

/// 测试专用发布入口；生产行为始终通过同一窄路径直接 stage 后 publish。
#[cfg(test)]
pub(crate) fn publish_fixture_write(
    paths: &UserLanguagePaths,
    staged: StagedFixtureWrite,
) -> Result<FileCommit, String> {
    publish_staged_file(paths, staged, None)
}

fn write_file_atomically(
    paths: &UserLanguagePaths,
    destination: &Path,
    bytes: &[u8],
    mode: Option<u32>,
) -> Result<FileCommit, String> {
    let staged = stage_file(paths, destination, bytes, mode, FileExpectation::Any, None)?;
    publish_staged_file(paths, staged, None)
}

fn stage_file(
    paths: &UserLanguagePaths,
    destination: &Path,
    bytes: &[u8],
    mode: Option<u32>,
    expectation: FileExpectation,
    mut writer_guard: Option<&mut dyn FnMut() -> Result<(), String>>,
) -> Result<StagedFixtureWrite, String> {
    validate_mutation_paths(paths)?;
    if let Some(guard) = writer_guard.as_mut() {
        (**guard)()?;
    }
    validate_path(paths, destination)?;
    let parent = destination.parent().ok_or_else(|| {
        format!(
            "user-language file has no parent: {}",
            destination.display()
        )
    })?;
    let parent_metadata = fs::symlink_metadata(parent).map_err(|error| {
        permission_error(
            &format!("could not inspect parent {}", parent.display()),
            error,
        )
    })?;
    if parent_metadata.file_type().is_symlink() || !parent_metadata.is_dir() {
        return Err(format!(
            "refusing unsafe user-language parent {}",
            parent.display()
        ));
    }
    reject_non_regular_destination(paths, destination)?;

    let nonce = TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    let temporary = parent.join(format!(
        ".cavalry-i18n-user-language-{}-{nonce}.tmp",
        std::process::id()
    ));
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    options.mode(mode.unwrap_or(0o600) & 0o7777);
    let mut file = options.open(&temporary).map_err(|error| {
        permission_error(
            &format!(
                "could not create user-language staging file {}",
                temporary.display()
            ),
            error,
        )
    })?;
    let write_result = file.write_all(bytes).and_then(|_| {
        #[cfg(unix)]
        if let Some(mode) = mode {
            fs::set_permissions(&temporary, fs::Permissions::from_mode(mode & 0o7777))?;
        }
        file.sync_all()
    });
    if let Err(error) = write_result {
        drop(file);
        let _ = fs::remove_file(&temporary);
        return Err(permission_error(
            "could not sync user-language staging file",
            error,
        ));
    }
    drop(file);

    Ok(StagedFixtureWrite {
        destination: destination.to_path_buf(),
        temporary,
        expectation,
    })
}

fn publish_staged_file(
    paths: &UserLanguagePaths,
    staged: StagedFixtureWrite,
    mut writer_guard: Option<&mut dyn FnMut() -> Result<(), String>>,
) -> Result<FileCommit, String> {
    validate_mutation_paths(paths)?;
    let StagedFixtureWrite {
        destination,
        temporary,
        expectation,
    } = staged;
    let result = (|| {
        validate_path(paths, &destination)?;
        let parent = destination.parent().ok_or_else(|| {
            format!(
                "user-language file has no parent: {}",
                destination.display()
            )
        })?;
        let parent_metadata = fs::symlink_metadata(parent).map_err(|error| {
            permission_error(
                &format!("could not inspect parent {}", parent.display()),
                error,
            )
        })?;
        if parent_metadata.file_type().is_symlink() || !parent_metadata.is_dir() {
            return Err(format!(
                "refusing unsafe user-language parent {}",
                parent.display()
            ));
        }
        if let FileExpectation::Exact(expected_current) = &expectation {
            let latest = read_optional_image(paths, &destination)?;
            if &latest != expected_current {
                return Err(format!(
                    "user-language file changed after staging; preserving {}",
                    destination.display()
                ));
            }
        }
        reject_non_regular_destination(paths, &destination)?;
        if let Some(guard) = writer_guard.as_mut() {
            (**guard)()?;
        }
        atomic_replace(&temporary, &destination).map_err(|error| {
            permission_error(
                &format!("could not atomically publish {}", destination.display()),
                error,
            )
        })?;
        match sync_directory(parent) {
            Ok(()) => Ok(FileCommit::Durable),
            Err(error) => Ok(FileCommit::VisibleButDurabilityUnproven(format!(
                "{}: {error}",
                parent.display()
            ))),
        }
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

fn remove_file_durably(
    paths: &UserLanguagePaths,
    path: &Path,
    expected_current: Option<&FileImage>,
    mut writer_guard: Option<&mut dyn FnMut() -> Result<(), String>>,
) -> Result<FileCommit, String> {
    validate_mutation_paths(paths)?;
    validate_path(paths, path)?;
    let current = read_optional_image(paths, path)?;
    if current.as_ref() != expected_current {
        return Err(format!(
            "user-language file changed before removal; preserving {}",
            path.display()
        ));
    }
    let Some(_) = current else {
        return Ok(FileCommit::Durable);
    };
    let parent = path
        .parent()
        .ok_or_else(|| format!("user-language file has no parent: {}", path.display()))?;
    if let Some(guard) = writer_guard.as_mut() {
        (**guard)()?;
    }
    fs::remove_file(path).map_err(|error| {
        permission_error(
            &format!("could not remove owned file {}", path.display()),
            error,
        )
    })?;
    match sync_directory(parent) {
        Ok(()) => Ok(FileCommit::Durable),
        Err(error) => Ok(FileCommit::VisibleButDurabilityUnproven(format!(
            "{}: {error}",
            parent.display()
        ))),
    }
}
fn atomic_replace(source: &Path, destination: &Path) -> std::io::Result<()> {
    #[cfg(windows)]
    {
        use windows::Win32::Storage::FileSystem::REPLACE_FILE_FLAGS;
        let has_destination = fs::symlink_metadata(destination).is_ok();
        let source_arg = HSTRING::from(source.to_string_lossy().to_string());
        let destination_arg = HSTRING::from(destination.to_string_lossy().to_string());
        if has_destination {
            unsafe {
                ReplaceFileW(
                    &destination_arg,
                    &source_arg,
                    None,
                    REPLACE_FILE_FLAGS(0),
                    None,
                    None,
                )
            }
            .map_err(|error| std::io::Error::other(error.to_string()))
        } else {
            unsafe { MoveFileExW(&source_arg, &destination_arg, MOVEFILE_WRITE_THROUGH) }
                .map_err(|error| std::io::Error::other(error.to_string()))
        }
    }
    #[cfg(not(windows))]
    {
        fs::rename(source, destination)
    }
}
pub(super) fn write_receipt(
    paths: &UserLanguagePaths,
    receipt: &Receipt,
) -> Result<FileCommit, String> {
    let bytes = serde_json::to_vec(receipt)
        .map_err(|error| format!("could not encode user-language receipt: {error}"))?;
    write_file_atomically(paths, &paths.receipt, &bytes, private_file_mode())
}
/// 仅允许由同次解析所得 receipt 原像派生的 pending 替换状态文件。
pub(super) fn write_receipt_exact(
    paths: &UserLanguagePaths,
    expected: &FileImage,
    receipt: &Receipt,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<FileCommit, String> {
    let bytes = serde_json::to_vec(receipt)
        .map_err(|error| format!("could not encode user-language receipt: {error}"))?;
    let image = FileImage {
        bytes,
        mode: private_file_mode(),
    };
    write_or_remove_image(
        paths,
        &paths.receipt,
        Some(expected),
        Some(&image),
        writer_guard,
    )
}
/// 返回同一次读取解析出的回执与完整字节/模式前像，供受限恢复发布复核。
pub(super) fn read_receipt_with_image(
    paths: &UserLanguagePaths,
) -> Result<Option<(Receipt, FileImage)>, String> {
    #[cfg(test)]
    RECEIPT_IMAGE_READ_COUNT.with(|count| count.set(count.get() + 1));
    let Some(image) = read_optional_image(paths, &paths.receipt)? else {
        return Ok(None);
    };
    let receipt: Receipt = serde_json::from_slice(&image.bytes)
        .map_err(|error| format!("user-language receipt is corrupt: {error}"))?;
    validate_receipt(paths, &receipt)?;
    Ok(Some((receipt, image)))
}
pub(super) fn read_receipt(paths: &UserLanguagePaths) -> Result<Option<Receipt>, String> {
    Ok(read_receipt_with_image(paths)?.map(|(receipt, _)| receipt))
}
pub(super) fn plan_strings_directories(paths: &UserLanguagePaths) -> Result<Vec<String>, String> {
    let parent = paths
        .strings
        .parent()
        .ok_or_else(|| "strings.json has no parent directory".to_string())?;
    let relative = parent
        .strip_prefix(&paths.profile_root)
        .map_err(|_| "strings.json parent is outside the fixture root".to_string())?;
    let mut current = paths.profile_root.clone();
    let mut planned = Vec::new();
    for component in relative.components() {
        let Component::Normal(name) = component else {
            return Err("unsafe Switcher plugin directory path".to_string());
        };
        current.push(name);
        match fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => {
                return Err(format!(
                    "refusing unsafe Switcher plugin directory {}",
                    current.display()
                ));
            }
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                planned.push(relative_prefix(&paths.profile_root, &current)?);
            }
            Err(error) => {
                return Err(permission_error(
                    &format!(
                        "could not inspect Switcher plugin directory {}",
                        current.display()
                    ),
                    error,
                ))
            }
        }
    }
    Ok(planned)
}
pub(super) fn ensure_strings_parent(
    paths: &UserLanguagePaths,
    owned_directories: &[String],
    interrupt_after_first_create: bool,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<(), String> {
    validate_mutation_paths(paths)?;
    let parent = paths
        .strings
        .parent()
        .ok_or_else(|| "strings.json has no parent directory".to_string())?;
    let relative = parent
        .strip_prefix(&paths.profile_root)
        .map_err(|_| "strings.json parent is outside the fixture root".to_string())?;
    let mut current = paths.profile_root.clone();
    let mut directories = Vec::new();
    let mut missing = Vec::new();
    for component in relative.components() {
        let Component::Normal(name) = component else {
            return Err("unsafe Switcher plugin directory path".to_string());
        };
        current.push(name);
        let identity = relative_prefix(&paths.profile_root, &current)?;
        let is_owned = owned_directories.iter().any(|owned| owned == &identity);
        match fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => {
                return Err(format!(
                    "refusing unsafe Switcher plugin directory {}",
                    current.display()
                ));
            }
            Ok(_) => directories.push((current.clone(), identity.clone(), is_owned, true)),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound && is_owned => {
                directories.push((current.clone(), identity.clone(), is_owned, false));
                missing.push(current.clone());
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Err(format!(
                    "missing Switcher parent was not recorded as transaction-owned: {}",
                    current.display()
                ));
            }
            Err(error) => {
                return Err(permission_error(
                    &format!(
                        "could not inspect Switcher plugin directory {}",
                        current.display()
                    ),
                    error,
                ))
            }
        }
    }
    for owned in owned_directories {
        validate_relative_directory(owned)?;
        if !directories
            .iter()
            .any(|(_, identity, is_owned, _)| identity == owned && *is_owned)
        {
            return Err(format!(
                "transaction-owned directory is not a Switcher parent: {owned:?}"
            ));
        }
    }

    #[cfg(unix)]
    for (path, _, is_owned, was_present) in &directories {
        if *is_owned && *was_present {
            writer_guard()?;
            let metadata = fs::symlink_metadata(path).map_err(|error| {
                permission_error(
                    &format!(
                        "could not recheck transaction-owned directory {}",
                        path.display()
                    ),
                    error,
                )
            })?;
            if metadata.file_type().is_symlink() || !metadata.is_dir() {
                return Err(format!(
                    "refusing changed transaction-owned directory {}",
                    path.display()
                ));
            }
            fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|error| {
                permission_error(
                    &format!(
                        "could not protect transaction-owned directory {}",
                        path.display()
                    ),
                    error,
                )
            })?;
            sync_directory(path).map_err(|error| {
                permission_error(
                    &format!(
                        "could not durably protect transaction-owned directory {}",
                        path.display()
                    ),
                    error,
                )
            })?;
        }
    }

    let mut created_count = 0;
    for path in missing {
        writer_guard()?;
        let mut builder = fs::DirBuilder::new();
        #[cfg(unix)]
        builder.mode(0o700);
        match builder.create(&path) {
            Ok(()) => {
                sync_directory(&path).map_err(|error| {
                    permission_error(
                        &format!(
                            "could not durably protect owned directory {}",
                            path.display()
                        ),
                        error,
                    )
                })?;
                let parent = path
                    .parent()
                    .ok_or_else(|| "created directory has no parent".to_string())?;
                sync_directory(parent).map_err(|error| {
                    permission_error(
                        &format!("could not durably create directory {}", path.display()),
                        error,
                    )
                })?;
                created_count += 1;
                if interrupt_after_first_create && created_count == 1 {
                    return Err(
                        "simulated process interruption after Switcher directory creation"
                            .to_string(),
                    );
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                return Err(format!(
                    "Switcher directory changed after ownership planning: {}",
                    path.display()
                ));
            }
            Err(error) => {
                return Err(permission_error(
                    &format!(
                        "could not create Switcher plugin directory {}",
                        path.display()
                    ),
                    error,
                ));
            }
        }
    }
    Ok(())
}
pub(super) fn cleanup_owned_empty_directories(
    paths: &UserLanguagePaths,
    directories: &[String],
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<Option<String>, String> {
    validate_mutation_paths(paths)?;
    for relative in directories.iter().rev() {
        validate_relative_directory(relative)?;
        let path = paths.profile_root.join(relative);
        validate_path(paths, &path)?;
        writer_guard()?;
        match fs::remove_dir(&path) {
            Ok(()) => {
                if let Some(parent) = path.parent() {
                    if let Err(error) = sync_directory(parent) {
                        return Ok(Some(format!(
                            "owned directory removal is visible but durability is unproven at {}: {error}",
                            parent.display()
                        )));
                    }
                }
            }
            Err(error)
                if matches!(
                    error.kind(),
                    std::io::ErrorKind::NotFound | std::io::ErrorKind::DirectoryNotEmpty
                ) => {}
            Err(error) => {
                return Err(permission_error(
                    &format!("could not remove owned empty directory {}", path.display()),
                    error,
                ))
            }
        }
    }
    Ok(None)
}
pub(super) fn remove_receipt(paths: &UserLanguagePaths) -> Result<FileCommit, String> {
    validate_mutation_paths(paths)?;
    let current = read_optional_image(paths, &paths.receipt)?;
    remove_file_durably(paths, &paths.receipt, current.as_ref(), None)
}
pub(super) fn sync_directory_for(path: &Path) -> Result<Option<String>, String> {
    match fs::symlink_metadata(path) {
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => {
            return Err(permission_error(
                &format!("could not inspect {}", path.display()),
                error,
            ))
        }
        Ok(_) => {}
    }
    let parent = path.parent().ok_or_else(|| {
        format!(
            "path has no parent for durability check: {}",
            path.display()
        )
    })?;
    match sync_directory(parent) {
        Ok(()) => Ok(None),
        Err(error) => Ok(Some(format!("{}: {error}", parent.display()))),
    }
}
fn relative_prefix(root: &Path, path: &Path) -> Result<String, String> {
    let relative = path
        .strip_prefix(root)
        .map_err(|_| format!("owned directory escaped fixture root: {}", path.display()))?;
    Ok(relative.to_string_lossy().into_owned())
}
fn file_mode(metadata: &fs::Metadata) -> Option<u32> {
    #[cfg(unix)]
    {
        Some(metadata.permissions().mode() & 0o7777)
    }
    #[cfg(not(unix))]
    {
        let _ = metadata;
        None
    }
}
pub(super) fn default_private_file_mode() -> Option<u32> {
    #[cfg(unix)]
    {
        Some(0o600)
    }
    #[cfg(not(unix))]
    {
        None
    }
}
fn private_file_mode() -> Option<u32> {
    default_private_file_mode()
}
fn sync_directory(path: &Path) -> std::io::Result<()> {
    #[cfg(test)]
    if take_directory_sync_failure(path) {
        return Err(std::io::Error::other(
            "injected directory sync failure for native profile contract",
        ));
    }

    #[cfg(unix)]
    {
        File::open(path)?.sync_all()
    }
    #[cfg(windows)]
    {
        let _ = path;
        Err(std::io::Error::other(
            "Windows directory durability is unproven in the fixture adapter",
        ))
    }
    #[cfg(all(not(unix), not(windows)))]
    {
        let _ = path;
        Err(std::io::Error::other(
            "directory durability is unsupported in the fixture adapter",
        ))
    }
}
