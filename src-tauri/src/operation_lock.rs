/**
 * [INPUT]: 依赖 state 目录、原子标志与 macOS flock/Windows exclusive file handle。
 * [OUTPUT]: 提供共享operation guard与busy错误；Mac和Windows原生writer均复核同一canonical state根。
 * [POS]: src-tauri/src 的 bundle operation 单飞边界；GUI extract/apply/restart 与 Windows headless launch 共享同一跨进程锁语义。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs,
    path::Path,
    sync::atomic::{AtomicBool, Ordering},
};

#[cfg(target_os = "macos")]
use std::os::fd::AsRawFd;
#[cfg(target_os = "windows")]
use std::os::windows::fs::OpenOptionsExt;

static BUNDLE_OPERATION_IN_PROGRESS: AtomicBool = AtomicBool::new(false);
pub(crate) const BUSY_ERROR: &str =
    "Another Cavalry language operation is already running. Wait for it to finish and try again.";
const BUNDLE_LOCK_FILE_NAME: &str = ".cavalry-i18n-bundle.lock";

pub(crate) struct BundleOperationGuard {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    lock_file: Option<fs::File>,
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    state_root: Option<std::path::PathBuf>,
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
impl BundleOperationGuard {
    pub(crate) fn require_state_dir(&self, state_dir: &Path) -> Result<(), String> {
        require_locked_state_root(self.state_root.as_deref(), state_dir)
    }
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
fn require_locked_state_root(locked: Option<&Path>, state_dir: &Path) -> Result<(), String> {
    let selected = fs::canonicalize(state_dir).map_err(|error| error.to_string())?;
    if locked != Some(selected.as_path()) {
        return Err("Native runtime operation guard belongs to another state directory.".into());
    }
    Ok(())
}

impl Drop for BundleOperationGuard {
    fn drop(&mut self) {
        #[cfg(target_os = "macos")]
        if let Some(file) = &self.lock_file {
            // SAFETY: fd 属于 guard 持有且仍存活的 File。
            unsafe {
                libc::flock(file.as_raw_fd(), libc::LOCK_UN);
            }
        }
        #[cfg(target_os = "windows")]
        {
            let _ = self.lock_file.take();
        }
        BUNDLE_OPERATION_IN_PROGRESS.store(false, Ordering::Release);
    }
}

#[cfg(target_os = "macos")]
pub(crate) fn acquire_bundle_file_lock(state_dir: &Path) -> Result<fs::File, String> {
    fs::create_dir_all(state_dir).map_err(|error| {
        format!(
            "Could not create bundle operation lock directory {}: {error}",
            state_dir.display()
        )
    })?;
    let lock_path = state_dir.join(BUNDLE_LOCK_FILE_NAME);
    // 锁文件必须持久保留；删除它会让两个进程锁住不同 inode，破坏单飞语义。
    let file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(&lock_path)
        .map_err(|error| format!("Could not open bundle operation lock: {error}"))?;
    // SAFETY: flock 只读取 file 拥有的有效描述符。
    if unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) } == 0 {
        return Ok(file);
    }
    let error = std::io::Error::last_os_error();
    if error.raw_os_error() == Some(libc::EWOULDBLOCK) {
        Err(BUSY_ERROR.to_string())
    } else {
        Err(format!(
            "Could not acquire bundle operation lock {}: {error}",
            lock_path.display()
        ))
    }
}

#[cfg(target_os = "windows")]
pub(crate) fn acquire_bundle_file_lock(state_dir: &Path) -> Result<fs::File, String> {
    fs::create_dir_all(state_dir).map_err(|error| {
        format!(
            "Could not create bundle operation lock directory {}: {error}",
            state_dir.display()
        )
    })?;
    let lock_path = state_dir.join(BUNDLE_LOCK_FILE_NAME);
    fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .share_mode(0)
        .open(&lock_path)
        .map_err(|error| {
            if matches!(error.raw_os_error(), Some(32) | Some(33)) {
                BUSY_ERROR.to_string()
            } else {
                format!(
                    "Could not acquire bundle operation lock {}: {error}",
                    lock_path.display()
                )
            }
        })
}

pub(crate) fn try_begin_bundle_operation(state_dir: &Path) -> Result<BundleOperationGuard, String> {
    BUNDLE_OPERATION_IN_PROGRESS
        .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
        .map_err(|_| BUSY_ERROR.to_string())?;
    let guard = BundleOperationGuard {
        #[cfg(any(target_os = "macos", target_os = "windows"))]
        lock_file: None,
        #[cfg(any(target_os = "macos", target_os = "windows"))]
        state_root: None,
    };
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        let mut guard = guard;
        guard.lock_file = Some(acquire_bundle_file_lock(state_dir)?);
        #[cfg(any(target_os = "macos", target_os = "windows"))]
        {
            guard.state_root =
                Some(fs::canonicalize(state_dir).map_err(|error| error.to_string())?);
        }
        return Ok(guard);
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = state_dir;
        Ok(guard)
    }
}

#[cfg(all(test, target_os = "macos"))]
mod native_binding_tests {
    use super::*;

    #[test]
    fn native_runtime_guard_requires_the_selected_canonical_state_root() {
        let temp = tempfile::tempdir().unwrap();
        let first = temp.path().join("first");
        let second = temp.path().join("second");
        fs::create_dir(&first).unwrap();
        fs::create_dir(&second).unwrap();
        let canonical = fs::canonicalize(&first).unwrap();
        assert!(require_locked_state_root(Some(&canonical), &first).is_ok());
        assert!(require_locked_state_root(Some(&canonical), &second).is_err());
        assert!(require_locked_state_root(None, &first).is_err());
    }
}
