/**
 * [INPUT]: 依赖 InstallLayout、libproc 的进程路径探针、bundle Info.plist 身份与固定 JXA terminate 请求。
 * [OUTPUT]: 提供 selected executable exact-PID 与共享用户文件 all-Cavalry 只读 admission、显式重启场景下的 graceful close 与 transaction 内复核。
 * [POS]: macOS 进程边界；native user-file 写入要覆盖所有 Cavalry 副本/版本，先按原始 basename 缩小候选，再验证 canonical *.app/Contents/MacOS 路径和 bundle ID；无法检查的候选 fail closed、不同 bundle ID 忽略，仅 typed vanished PID 可忽略；普通 Switch/Restore 不关闭进程。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    ffi::{c_int, c_void, CStr, OsStr, OsString},
    fs,
    os::unix::ffi::OsStringExt,
    path::{Path, PathBuf},
    ptr, thread,
    time::{Duration, Instant},
};

use crate::install::InstallLayout;

use super::super::{restart::CloseCavalryError, CommandRunner};

const PROC_ALL_PIDS: u32 = 1;
const PROC_PIDPATHINFO_MAXSIZE: usize = 4096;
const CLOSE_TIMEOUT: Duration = Duration::from_secs(15);
const CLOSE_POLL_INTERVAL: Duration = Duration::from_millis(100);
const CAVALRY_BUNDLE_ID: &str = "com.scenegroup.cavalry";
const CAVALRY_EXECUTABLES: [&str; 2] = ["Cavalry", "CavalryLauncher"];

const TERMINATE_EXACT_PROCESS_JXA: &str = r#"
function run(argv) {
  if (argv.length !== 2 || !/^\d+$/.test(argv[0]) || argv[1].length === 0) {
    throw new Error("Expected one decimal process id and one executable path.");
  }
  const pid = Number(argv[0]);
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    throw new Error("Invalid process id.");
  }
  ObjC.import("AppKit");
  const app = $.NSRunningApplication.runningApplicationWithProcessIdentifier(pid);
  if (!app || app.terminated) {
    return "already-exited";
  }
  const executableUrl = app.executableURL;
  if (!executableUrl) {
    return "already-exited";
  }
  const actualPath = ObjC.unwrap(executableUrl.URLByResolvingSymlinksInPath.path);
  if (actualPath !== argv[1]) {
    throw new Error("Process identity changed before termination.");
  }
  const requested = app.terminate;
  if (!requested) {
    throw new Error("Cavalry refused the graceful termination request.");
  }
  return "requested";
}
"#;

#[link(name = "proc")]
extern "C" {
    fn proc_listpids(
        process_type: u32,
        type_info: u32,
        buffer: *mut c_void,
        buffer_size: c_int,
    ) -> c_int;
    fn proc_pidpath(pid: c_int, buffer: *mut c_void, buffer_size: u32) -> c_int;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum CavalryProcessGuardError {
    StillRunning { pids: Vec<u32> },
    Inspection(String),
}

/// 旧事务 seam 保留 exact-process 名称；共享 profile guard 复用同一 typed 结果，但不暗示仅选中安装会写入。
pub(crate) type ExactProcessGuardError = CavalryProcessGuardError;

impl std::fmt::Display for CavalryProcessGuardError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::StillRunning { pids } => write!(
                formatter,
                "Cavalry process ID(s) are still running: {}",
                pids.iter()
                    .map(u32::to_string)
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            Self::Inspection(detail) => formatter.write_str(detail),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum ProcessPathProbe {
    Exited,
    Path(PathBuf),
}

/// Durable mutation recheck: never signals; a live match or uninspectable PID fails closed.
pub(crate) fn guard_exact_cavalry_not_running(
    exact_executable: &Path,
) -> Result<(), ExactProcessGuardError> {
    let pids = matching_pids(exact_executable).map_err(ExactProcessGuardError::Inspection)?;
    if pids.is_empty() {
        Ok(())
    } else {
        Err(ExactProcessGuardError::StillRunning { pids })
    }
}

/// 共享 profile 的只读 admission 快照，不是 OS 启动锁；调用方仍须满足闭 writer 前提。
pub(crate) fn guard_all_cavalry_not_running() -> Result<(), CavalryProcessGuardError> {
    let pids = matching_cavalry_pids().map_err(CavalryProcessGuardError::Inspection)?;
    if pids.is_empty() {
        Ok(())
    } else {
        Err(CavalryProcessGuardError::StillRunning { pids })
    }
}

fn matching_cavalry_pids() -> Result<Vec<u32>, String> {
    matching_cavalry_pids_from(all_pids()?, process_path, read_bundle_identifier)
}

fn matching_cavalry_pids_from<I, F, B>(
    pids: I,
    mut process_path_for: F,
    mut bundle_identifier_for: B,
) -> Result<Vec<u32>, String>
where
    I: IntoIterator<Item = u32>,
    F: FnMut(u32) -> Result<ProcessPathProbe, String>,
    B: FnMut(&Path) -> Result<String, String>,
{
    let mut output = Vec::new();
    for pid in pids {
        let raw_path = match process_path_for(pid)? {
            ProcessPathProbe::Exited => continue,
            ProcessPathProbe::Path(path) => path,
        };
        if !is_cavalry_executable(&raw_path) {
            continue;
        }

        let executable = match fs::canonicalize(&raw_path) {
            Ok(path) => path,
            Err(error) => match process_path_for(pid)? {
                ProcessPathProbe::Exited => continue,
                ProcessPathProbe::Path(current_path) => {
                    return Err(format!(
                        "Could not resolve candidate Cavalry executable {} for live process {pid}: {error}. Current proc_pidpath is {}.",
                        raw_path.display(),
                        current_path.display()
                    ));
                }
            },
        };
        let app_root = cavalry_app_root(&executable).map_err(|error| {
            format!("Could not establish the Cavalry bundle for candidate process {pid}: {error}")
        })?;
        let bundle_id = bundle_identifier_for(&app_root).map_err(|error| {
            format!(
                "Could not inspect bundle identity for candidate process {pid} at {}: {error}",
                app_root.display()
            )
        })?;
        if bundle_id == CAVALRY_BUNDLE_ID {
            output.push(pid);
        }
    }
    output.sort_unstable();
    output.dedup();
    Ok(output)
}

fn is_cavalry_executable(path: &Path) -> bool {
    CAVALRY_EXECUTABLES
        .iter()
        .any(|name| path.file_name() == Some(OsStr::new(name)))
}

fn cavalry_app_root(executable: &Path) -> Result<PathBuf, String> {
    let macos = executable
        .parent()
        .ok_or_else(|| "executable has no parent directory".to_string())?;
    if macos.file_name() != Some(OsStr::new("MacOS")) {
        return Err(format!(
            "executable is not under *.app/Contents/MacOS: {}",
            executable.display()
        ));
    }
    let contents = macos
        .parent()
        .ok_or_else(|| "MacOS directory has no Contents parent".to_string())?;
    if contents.file_name() != Some(OsStr::new("Contents")) {
        return Err(format!(
            "executable is not under *.app/Contents/MacOS: {}",
            executable.display()
        ));
    }
    let app_root = contents
        .parent()
        .ok_or_else(|| "Contents directory has no app bundle parent".to_string())?;
    let app_name = app_root
        .file_name()
        .and_then(OsStr::to_str)
        .ok_or_else(|| "app bundle name is not valid UTF-8".to_string())?;
    if !app_name.ends_with(".app") || app_name.len() == ".app".len() {
        return Err(format!(
            "executable is not under a named *.app bundle: {}",
            executable.display()
        ));
    }
    Ok(app_root.to_path_buf())
}

fn read_bundle_identifier(app_root: &Path) -> Result<String, String> {
    let info_plist = app_root.join("Contents/Info.plist");
    let value = plist::Value::from_file(&info_plist)
        .map_err(|error| format!("could not parse {}: {error}", info_plist.display()))?;
    value
        .as_dictionary()
        .and_then(|dictionary| dictionary.get("CFBundleIdentifier"))
        .and_then(plist::Value::as_string)
        .map(str::to_string)
        .ok_or_else(|| format!("{} has no string CFBundleIdentifier", info_plist.display()))
}

/// Selected-install admission only; the durable writer rechecks exact PID before first mutation.
pub(crate) fn ensure_cavalry_not_running(app_path: &Path) -> Result<(), CloseCavalryError> {
    let layout = InstallLayout::from_root(app_path);
    let target = fs::canonicalize(&layout.executable).map_err(|error| {
        CloseCavalryError::Command(format!(
            "Could not resolve the selected Cavalry executable {} before the running-process check: {error}",
            layout.executable.display()
        ))
    })?;
    match guard_exact_cavalry_not_running(&target) {
        Ok(()) => Ok(()),
        Err(ExactProcessGuardError::StillRunning { .. }) => Err(CloseCavalryError::StillRunning),
        Err(ExactProcessGuardError::Inspection(detail)) => Err(CloseCavalryError::Command(detail)),
    }
}

pub(crate) fn close_exact_cavalry<R: CommandRunner>(
    app_path: &Path,
    runner: &mut R,
) -> Result<(), CloseCavalryError> {
    let layout = InstallLayout::from_root(app_path);
    let target = fs::canonicalize(&layout.executable).map_err(|error| {
        CloseCavalryError::Command(format!(
            "Could not resolve the selected Cavalry executable {} before shutdown: {error}",
            layout.executable.display()
        ))
    })?;

    let deadline = Instant::now() + CLOSE_TIMEOUT;
    close_exact_cavalry_with(
        &target,
        || matching_pids(&target),
        |pid, executable| {
            let command = termination_command(pid, executable);
            runner
                .run(&command.program, &command.args)
                .map_err(|error| {
                    format!(
                        "Could not request graceful shutdown for Cavalry process {pid}: {error}"
                    )
                })
        },
        || thread::sleep(CLOSE_POLL_INTERVAL),
        || Instant::now() >= deadline,
    )
}

fn close_exact_cavalry_with<M, T, S, E>(
    target: &Path,
    mut matching: M,
    mut terminate: T,
    mut sleep: S,
    mut expired: E,
) -> Result<(), CloseCavalryError>
where
    M: FnMut() -> Result<Vec<u32>, String>,
    T: FnMut(u32, &Path) -> Result<(), String>,
    S: FnMut(),
    E: FnMut() -> bool,
{
    let initial = matching().map_err(CloseCavalryError::Command)?;
    if initial.is_empty() {
        return Ok(());
    }
    for pid in initial {
        terminate(pid, target).map_err(CloseCavalryError::Command)?;
    }
    loop {
        let remaining = matching().map_err(CloseCavalryError::Command)?;
        if remaining.is_empty() {
            return Ok(());
        }
        if expired() {
            return Err(CloseCavalryError::StillRunning);
        }
        sleep();
    }
}

fn termination_command(pid: u32, target: &Path) -> crate::privilege::RecordedCommand {
    crate::privilege::RecordedCommand {
        program: "osascript".to_string(),
        args: vec![
            "-l".to_string(),
            "JavaScript".to_string(),
            "-e".to_string(),
            TERMINATE_EXACT_PROCESS_JXA.to_string(),
            pid.to_string(),
            target.to_string_lossy().to_string(),
        ],
    }
}

fn matching_pids(target: &Path) -> Result<Vec<u32>, String> {
    matching_pids_from(target, all_pids()?, process_path)
}

fn matching_pids_from<I, F>(
    target: &Path,
    pids: I,
    mut process_path_for: F,
) -> Result<Vec<u32>, String>
where
    I: IntoIterator<Item = u32>,
    F: FnMut(u32) -> Result<ProcessPathProbe, String>,
{
    let mut output = Vec::new();
    for pid in pids {
        let raw_path = match process_path_for(pid)? {
            ProcessPathProbe::Exited => continue,
            ProcessPathProbe::Path(path) => path,
        };
        if raw_path.file_name() != target.file_name() {
            continue;
        }
        let canonical = match fs::canonicalize(&raw_path) {
            Ok(path) => path,
            Err(error) => match process_path_for(pid)? {
                ProcessPathProbe::Exited => continue,
                ProcessPathProbe::Path(current_path) => {
                    return Err(format!(
                        "Could not resolve executable path {} for live process {pid}: {error}. Current proc_pidpath is {}.",
                        raw_path.display(),
                        current_path.display()
                    ));
                }
            },
        };
        if canonical == target {
            output.push(pid);
        }
    }
    output.sort_unstable();
    output.dedup();
    Ok(output)
}

fn all_pids() -> Result<Vec<u32>, String> {
    // libproc reports required bytes when called with a null buffer. Processes may
    // appear between calls, so reserve slack and retry boundedly on a full buffer.
    for _ in 0..4 {
        unsafe { *libc::__error() = 0 };
        let required = unsafe { proc_listpids(PROC_ALL_PIDS, 0, ptr::null_mut(), 0) };
        if required <= 0 {
            return Err(format!(
                "Could not size the macOS process inventory with libproc: {}",
                std::io::Error::last_os_error()
            ));
        }
        let slots = (required as usize / std::mem::size_of::<c_int>()).saturating_add(64);
        let mut pids = vec![0_i32; slots.max(64)];
        let buffer_size = pids
            .len()
            .checked_mul(std::mem::size_of::<c_int>())
            .and_then(|size| c_int::try_from(size).ok())
            .ok_or_else(|| "macOS process list is too large.".to_string())?;
        unsafe { *libc::__error() = 0 };
        let bytes = unsafe {
            proc_listpids(
                PROC_ALL_PIDS,
                0,
                pids.as_mut_ptr().cast::<c_void>(),
                buffer_size,
            )
        };
        if bytes <= 0 {
            return Err(format!(
                "Could not enumerate macOS processes with libproc: {}",
                std::io::Error::last_os_error()
            ));
        }
        if bytes < buffer_size {
            if bytes as usize % std::mem::size_of::<c_int>() != 0 {
                return Err("libproc returned a truncated macOS process inventory.".to_string());
            }
            let count = bytes as usize / std::mem::size_of::<c_int>();
            return Ok(pids
                .into_iter()
                .take(count)
                .filter_map(|pid| u32::try_from(pid).ok())
                .filter(|pid| *pid > 0)
                .collect());
        }
    }
    Err("macOS process list changed continuously during enumeration.".to_string())
}

fn process_path(pid: u32) -> Result<ProcessPathProbe, String> {
    let native_pid = c_int::try_from(pid)
        .map_err(|_| format!("macOS process ID is outside c_int range: {pid}"))?;
    let mut buffer = [0_u8; PROC_PIDPATHINFO_MAXSIZE];
    // SAFETY: macOS exposes thread-local errno through `__error`; clearing it lets a zero
    // proc_pidpath result distinguish ENOENT/ESRCH from permission/inspection failures.
    unsafe { *libc::__error() = 0 };
    let length = unsafe {
        proc_pidpath(
            native_pid,
            buffer.as_mut_ptr().cast::<c_void>(),
            buffer.len() as u32,
        )
    };
    if length <= 0 {
        let errno = unsafe { *libc::__error() };
        if proc_pidpath_errno_is_vanished(errno) || process_has_exited(native_pid) {
            return Ok(ProcessPathProbe::Exited);
        }
        return Err(format!(
            "Could not inspect executable path for live process {pid} with proc_pidpath: {} [errno={errno}]",
            std::io::Error::from_raw_os_error(errno)
        ));
    }
    let value = CStr::from_bytes_until_nul(&buffer).map_err(|error| {
        format!("proc_pidpath returned an unterminated path for process {pid}: {error}")
    })?;
    Ok(ProcessPathProbe::Path(PathBuf::from(OsString::from_vec(
        value.to_bytes().to_vec(),
    ))))
}

fn proc_pidpath_errno_is_vanished(errno: i32) -> bool {
    matches!(errno, libc::ENOENT | libc::ESRCH)
}

fn process_has_exited(pid: c_int) -> bool {
    // `kill(pid, 0)` performs no mutation. ESRCH is the only state accepted as a vanished process;
    // EPERM and every other error remain live/unknown and therefore fail closed above.
    if unsafe { libc::kill(pid, 0) } == 0 {
        return false;
    }
    std::io::Error::last_os_error().raw_os_error() == Some(libc::ESRCH)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jxa_accepts_only_a_decimal_pid_and_uses_ns_running_application() {
        assert!(TERMINATE_EXACT_PROCESS_JXA.contains("/^\\d+$/"));
        assert!(TERMINATE_EXACT_PROCESS_JXA.contains("runningApplicationWithProcessIdentifier"));
        assert!(TERMINATE_EXACT_PROCESS_JXA.contains("URLByResolvingSymlinksInPath"));
        assert!(TERMINATE_EXACT_PROCESS_JXA.contains("actualPath !== argv[1]"));
        assert!(!TERMINATE_EXACT_PROCESS_JXA.contains("tell application"));
        assert!(!TERMINATE_EXACT_PROCESS_JXA.contains("do shell script"));
    }

    #[test]
    fn current_process_path_is_available_through_libproc() {
        let ProcessPathProbe::Path(path) =
            process_path(std::process::id()).expect("current process path")
        else {
            panic!("current process unexpectedly disappeared")
        };
        assert!(path.is_absolute());
    }

    #[test]
    fn native_probe_finds_only_the_selected_running_executable() {
        let temp = tempfile::tempdir().unwrap();
        let executable = temp.path().join("Cavalry");
        fs::copy("/bin/sleep", &executable).unwrap();
        let target = fs::canonicalize(&executable).unwrap();
        let mut child = std::process::Command::new(&executable)
            .arg("3")
            .spawn()
            .unwrap();
        let pid = child.id();
        let deadline = Instant::now() + Duration::from_secs(2);
        while !matches!(process_path(pid), Ok(ProcessPathProbe::Path(path)) if path.file_name() == target.file_name())
            && Instant::now() < deadline
        {
            thread::sleep(Duration::from_millis(10));
        }
        let result = matching_pids(&target);
        let _ = child.kill();
        let _ = child.wait();
        assert_eq!(result.unwrap(), vec![pid]);
        assert!(matching_pids(&target).unwrap().is_empty());
    }

    #[test]
    fn multiple_cavalry_copies_match_only_the_selected_canonical_executable() {
        let temp = tempfile::tempdir().unwrap();
        let selected = temp
            .path()
            .join("Selected Cavalry.app/Contents/MacOS/Cavalry");
        let other = temp.path().join("Other Cavalry.app/Contents/MacOS/Cavalry");
        fs::create_dir_all(selected.parent().unwrap()).unwrap();
        fs::create_dir_all(other.parent().unwrap()).unwrap();
        fs::write(&selected, b"selected").unwrap();
        fs::write(&other, b"other").unwrap();
        let selected = fs::canonicalize(selected).unwrap();

        let matching = matching_pids_from(&selected, [41, 42, 43], |pid| {
            Ok(match pid {
                41 | 43 => ProcessPathProbe::Path(selected.clone()),
                42 => ProcessPathProbe::Path(other.clone()),
                _ => ProcessPathProbe::Exited,
            })
        })
        .unwrap();

        assert_eq!(matching, vec![41, 43]);
    }

    #[test]
    fn all_cavalry_copies_and_renamed_bundles_are_detected_by_bundle_identity() {
        let temp = tempfile::tempdir().unwrap();
        let first = write_test_bundle(temp.path(), "Cavalry 2.7.app", "Cavalry", CAVALRY_BUNDLE_ID);
        let renamed = write_test_bundle(
            temp.path(),
            "Renamed Cavalry 2.8.app",
            "Cavalry",
            CAVALRY_BUNDLE_ID,
        );
        let first = fs::canonicalize(first).unwrap();
        let renamed = fs::canonicalize(renamed).unwrap();
        let matching = matching_cavalry_pids_from(
            [61, 62],
            |pid| {
                Ok(ProcessPathProbe::Path(if pid == 61 {
                    first.clone()
                } else {
                    renamed.clone()
                }))
            },
            read_bundle_identifier,
        )
        .unwrap();
        assert_eq!(matching, vec![61, 62]);
    }

    #[test]
    fn old_launcher_wrapper_is_detected_without_relying_on_bundle_name() {
        let temp = tempfile::tempdir().unwrap();
        let launcher = write_test_bundle(
            temp.path(),
            "User Renamed.app",
            "CavalryLauncher",
            CAVALRY_BUNDLE_ID,
        );
        let launcher = fs::canonicalize(launcher).unwrap();
        let matching = matching_cavalry_pids_from(
            [71],
            |_| Ok(ProcessPathProbe::Path(launcher.clone())),
            read_bundle_identifier,
        )
        .unwrap();
        assert_eq!(matching, vec![71]);
    }

    #[test]
    fn unrelated_same_basename_bundle_and_unrelated_executable_are_ignored() {
        let temp = tempfile::tempdir().unwrap();
        let unrelated = write_test_bundle(
            temp.path(),
            "Some Other App.app",
            "Cavalry",
            "org.example.other-app",
        );
        let unrelated = fs::canonicalize(unrelated).unwrap();
        let other_name = temp
            .path()
            .join("Some Other App.app/Contents/MacOS/OtherApp");
        fs::write(&other_name, b"not a Cavalry executable").unwrap();
        let other_name = fs::canonicalize(other_name).unwrap();
        let matching = matching_cavalry_pids_from(
            [81, 82],
            |pid| {
                Ok(ProcessPathProbe::Path(if pid == 81 {
                    unrelated.clone()
                } else {
                    other_name.clone()
                }))
            },
            read_bundle_identifier,
        )
        .unwrap();
        assert!(matching.is_empty());
    }

    #[test]
    fn vanished_pid_is_ignored_and_live_candidate_inspection_failure_blocks() {
        assert!(matching_cavalry_pids_from(
            [91],
            |_| Ok(ProcessPathProbe::Exited),
            read_bundle_identifier,
        )
        .unwrap()
        .is_empty());
        let error = matching_cavalry_pids_from(
            [92],
            |_| Err("proc_pidpath denied live process".to_string()),
            read_bundle_identifier,
        )
        .unwrap_err();
        assert!(error.contains("denied live process"), "{error}");
    }

    #[test]
    fn uninspectable_candidate_bundle_and_non_bundle_candidate_fail_closed() {
        let temp = tempfile::tempdir().unwrap();
        let missing_info = temp.path().join("Incomplete.app/Contents/MacOS/Cavalry");
        fs::create_dir_all(missing_info.parent().unwrap()).unwrap();
        fs::write(&missing_info, b"executable fixture").unwrap();
        let missing_info = fs::canonicalize(missing_info).unwrap();
        let error = matching_cavalry_pids_from(
            [101],
            |_| Ok(ProcessPathProbe::Path(missing_info.clone())),
            read_bundle_identifier,
        )
        .unwrap_err();
        assert!(error.contains("candidate process 101"), "{error}");
        assert!(error.contains("Info.plist"), "{error}");
        let loose = temp.path().join("Loose/Cavalry");
        fs::create_dir_all(loose.parent().unwrap()).unwrap();
        fs::write(&loose, b"candidate fixture").unwrap();
        let loose = fs::canonicalize(loose).unwrap();
        let error = matching_cavalry_pids_from(
            [102],
            |_| Ok(ProcessPathProbe::Path(loose.clone())),
            read_bundle_identifier,
        )
        .unwrap_err();
        assert!(error.contains("*.app/Contents/MacOS"), "{error}");
    }

    #[test]
    fn vanished_process_is_ignored_but_probe_error_fails_closed() {
        let target = Path::new("/Applications/Cavalry.app/Contents/MacOS/Cavalry");
        assert!(
            matching_pids_from(target, [41], |_| Ok(ProcessPathProbe::Exited))
                .unwrap()
                .is_empty()
        );

        let error = matching_pids_from(target, [42], |_| {
            Err("proc_pidpath denied live process 42".to_string())
        })
        .unwrap_err();
        assert!(error.contains("denied live process 42"), "{error}");
    }

    #[test]
    fn proc_pidpath_vanished_errno_is_typed_exit_but_access_errors_fail_closed() {
        assert!(proc_pidpath_errno_is_vanished(libc::ENOENT));
        assert!(proc_pidpath_errno_is_vanished(libc::ESRCH));
        assert!(!proc_pidpath_errno_is_vanished(libc::EPERM));
        assert!(!proc_pidpath_errno_is_vanished(libc::EACCES));
        assert!(!proc_pidpath_errno_is_vanished(libc::EIO));
    }

    #[test]
    fn canonicalize_error_is_ignored_only_after_typed_exit() {
        let target = Path::new("/Applications/Cavalry.app/Contents/MacOS/Cavalry");
        let missing = PathBuf::from("/definitely/missing/Cavalry");
        let mut probes = vec![
            ProcessPathProbe::Path(missing.clone()),
            ProcessPathProbe::Path(missing),
        ]
        .into_iter();
        let error = matching_pids_from(target, [51], |_| Ok(probes.next().unwrap())).unwrap_err();
        assert!(error.contains("live process 51"), "{error}");

        let mut probes = vec![
            ProcessPathProbe::Path(PathBuf::from("/definitely/missing/Cavalry")),
            ProcessPathProbe::Exited,
        ]
        .into_iter();
        assert!(
            matching_pids_from(target, [52], |_| Ok(probes.next().unwrap()))
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn unrelated_live_process_with_unresolvable_path_does_not_block_cavalry() {
        let target = Path::new("/Applications/Cavalry.app/Contents/MacOS/Cavalry");
        let unrelated =
            PathBuf::from("/Library/Application Support/clash-verge-service/cores/verge-mihomo");
        let pids = matching_pids_from(target, [42], |_| {
            Ok(ProcessPathProbe::Path(unrelated.clone()))
        })
        .unwrap();
        assert!(pids.is_empty());
    }

    #[test]
    fn delayed_exit_waits_until_every_selected_pid_is_gone() {
        let target = Path::new("/Applications/Cavalry.app/Contents/MacOS/Cavalry");
        let mut inventories = vec![vec![101, 102], vec![102], Vec::new()].into_iter();
        let mut terminated = Vec::new();
        let mut sleeps = 0;

        close_exact_cavalry_with(
            target,
            || Ok(inventories.next().unwrap_or_default()),
            |pid, _| {
                terminated.push(pid);
                Ok(())
            },
            || sleeps += 1,
            || false,
        )
        .unwrap();

        assert_eq!(terminated, vec![101, 102]);
        assert_eq!(sleeps, 1);
    }

    #[test]
    fn save_dialog_timeout_returns_still_running_without_forcing_termination() {
        let target = Path::new("/Applications/Cavalry.app/Contents/MacOS/Cavalry");
        let mut termination_requests = 0;
        let error = close_exact_cavalry_with(
            target,
            || Ok(vec![77]),
            |_, _| {
                termination_requests += 1;
                Ok(())
            },
            || panic!("expired wait must not sleep again"),
            || true,
        )
        .unwrap_err();

        assert!(matches!(error, CloseCavalryError::StillRunning));
        assert_eq!(termination_requests, 1);
    }

    #[test]
    fn unsafe_bundle_characters_are_data_arguments_not_script_source() {
        let target =
            Path::new("/Applications/Cavalry \"copy\"; do shell script.app/Contents/MacOS/Cavalry");
        let command = termination_command(123, target);

        assert_eq!(command.program, "osascript");
        assert_eq!(command.args[3], TERMINATE_EXACT_PROCESS_JXA);
        assert_eq!(command.args[4], "123");
        assert_eq!(command.args[5], target.to_string_lossy());
        assert!(!command.args[3].contains(&target.to_string_lossy().to_string()));
    }

    fn write_test_bundle(
        root: &Path,
        app_name: &str,
        executable_name: &str,
        bundle_id: &str,
    ) -> PathBuf {
        let app_root = root.join(app_name);
        let executable = app_root.join("Contents/MacOS").join(executable_name);
        fs::create_dir_all(executable.parent().unwrap()).unwrap();
        fs::write(&executable, b"synthetic executable").unwrap();

        let mut info = plist::Dictionary::new();
        info.insert(
            "CFBundleIdentifier".to_string(),
            plist::Value::String(bundle_id.to_string()),
        );
        info.insert(
            "CFBundleExecutable".to_string(),
            plist::Value::String(executable_name.to_string()),
        );
        let mut file = fs::File::create(app_root.join("Contents/Info.plist")).unwrap();
        plist::to_writer_xml(&mut file, &plist::Value::Dictionary(info)).unwrap();
        executable
    }
}
