/**
 * [INPUT]: 依赖父级 typed-locale/pack helper、production native_user apply 与 tempfile 根目录。
 * [OUTPUT]: 通过真实子进程 kill 验证 pending profile 在全新生产子进程中恢复。
 * [POS]: production profile 合同的跨平台 OS-interruption 子模块；Windows使用独立Local/Roaming根，只写tempfile，不伪造pending或接触真实home。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{synthetic_pack, typed_locale};
use crate::commands::{contract::NoopReporter, native_user, user_language_files};
use serde_json::{json, Value};
#[cfg(target_os = "macos")]
use std::os::unix::process::ExitStatusExt;
use std::{
    fs::{self, OpenOptions},
    io::{self, Write},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    thread,
    time::{Duration, Instant},
};

const ROOT_ENV: &str = "CAVALRY_I18N_TEST_PROCESS_RECOVERY_ROOT";
const MODE_ENV: &str = "CAVALRY_I18N_TEST_PROCESS_RECOVERY_MODE";
const READY_FILE: &str = "process-recovery-ready";
const LANGUAGE: &str = "zh-Hans";

struct ChildGuard(Child);

impl ChildGuard {
    fn id(&self) -> u32 {
        self.0.id()
    }

    fn try_wait(&mut self) -> io::Result<Option<std::process::ExitStatus>> {
        self.0.try_wait()
    }

    fn kill_wait(&mut self) -> io::Result<std::process::ExitStatus> {
        self.0.kill()?;
        self.0.wait()
    }

    fn wait(&mut self, timeout: Duration) -> io::Result<std::process::ExitStatus> {
        let deadline = Instant::now() + timeout;
        loop {
            if self.try_wait()?.is_some() {
                return self.0.wait();
            }
            if Instant::now() >= deadline {
                return Err(io::ErrorKind::TimedOut.into());
            }
            thread::sleep(Duration::from_millis(20));
        }
    }
}

impl Drop for ChildGuard {
    fn drop(&mut self) {
        if !matches!(self.0.try_wait(), Ok(Some(_))) {
            let _ = self.0.kill();
        }
        let _ = self.0.wait();
    }
}

fn child_context() -> Option<(PathBuf, String)> {
    match (std::env::var_os(ROOT_ENV), std::env::var_os(MODE_ENV)) {
        (None, None) => None,
        (Some(root), Some(mode)) => Some((root.into(), mode.into_string().unwrap())),
        _ => panic!("process-recovery child requires both root and mode"),
    }
}

fn paths_at(root: &Path) -> user_language_files::UserLanguagePaths {
    let root = fs::canonicalize(root).expect("resolve explicit tempfile root");
    let home = root.join("home");
    let state = root.join("state");
    assert_eq!(fs::canonicalize(&home).unwrap(), home);
    assert_eq!(fs::canonicalize(&state).unwrap(), state);
    #[cfg(target_os = "macos")]
    let paths = user_language_files::UserLanguagePaths::for_user_dirs(&home, &state).unwrap();
    #[cfg(target_os = "windows")]
    let paths = user_language_files::UserLanguagePaths::for_windows_dirs(
        &home.join("Local"),
        &home.join("Roaming"),
        &state,
        true,
    )
    .unwrap();
    assert!(paths.preferences().starts_with(&root));
    assert!(paths.strings().starts_with(&root));
    assert!(paths.receipt().starts_with(&root));
    paths
}

fn stages_for_pid(parent: &Path, pid: u32) -> Vec<PathBuf> {
    let prefix = format!(".cavalry-i18n-user-language-{pid}-");
    fs::read_dir(parent)
        .unwrap()
        .map(|entry| entry.unwrap())
        .filter_map(|entry| {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            (name.starts_with(&prefix) && name.ends_with(".tmp")).then(|| entry.path())
        })
        .collect()
}

fn park_boundary_ready(paths: &user_language_files::UserLanguagePaths, pack: &[u8]) -> bool {
    let Ok(receipt_bytes) = fs::read(paths.receipt()) else {
        return false;
    };
    let Ok(receipt) = serde_json::from_slice::<Value>(&receipt_bytes) else {
        return false;
    };
    let Ok(preferences_bytes) = fs::read(paths.preferences()) else {
        return false;
    };
    let Ok(preferences) = serde_json::from_slice::<Value>(&preferences_bytes) else {
        return false;
    };
    receipt["pending"]["action"] == json!("apply")
        && receipt["pending"]["language"] == json!(LANGUAGE)
        && receipt["pending"]["before"]["locale"] == typed_locale("en-GB")
        && receipt["pending"]["after"]["strings"]["bytes"] == json!(pack)
        && receipt.get("active").is_none()
        && preferences["locale"] == typed_locale("en-GB")
        && fs::read(paths.strings()).ok().as_deref() == Some(pack)
        && stages_for_pid(paths.preferences().parent().unwrap(), std::process::id()).len() == 1
}

fn child_apply(root: &Path, mode: &str) {
    assert!(matches!(mode, "park" | "recover"), "invalid child mode");
    let root = fs::canonicalize(root).unwrap();
    let paths = paths_at(&root);
    let pack = synthetic_pack(LANGUAGE, "真实子进程恢复探针");
    let ready = root.join(READY_FILE);
    let mut guard = || {
        if mode == "park" && park_boundary_ready(&paths, &pack) {
            let mut marker = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&ready)
                .unwrap();
            writeln!(marker, "{}", std::process::id()).unwrap();
            marker.sync_all().unwrap();
            loop {
                thread::park();
            }
        }
        Ok(())
    };
    let action =
        native_user::apply_profile(&paths, LANGUAGE, Some(&pack), &mut guard, &NoopReporter);
    assert_eq!(mode, "recover", "park child escaped the writer guard");
    assert!(action.ok, "production apply failed");
    assert_eq!(action.current_lang.as_deref(), Some(LANGUAGE));
}

fn spawn_self(root: &Path, mode: &str) -> ChildGuard {
    let module = module_path!();
    let prefix = format!("{}::", env!("CARGO_CRATE_NAME"));
    let module = module.strip_prefix(&prefix).unwrap_or(module);
    let test = format!("{module}::process_recovery_after_real_child_kill");
    let child = Command::new(std::env::current_exe().unwrap())
        .arg(test)
        .arg("--exact")
        .arg("--ignored")
        .arg("--nocapture")
        .env_clear()
        .env(ROOT_ENV, root)
        .env(MODE_ENV, mode)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .expect("spawn exact ignored test in a fresh process");
    ChildGuard(child)
}

#[test]
#[ignore = "requires an explicit owned subprocess kill/recovery run"]
fn process_recovery_after_real_child_kill() {
    if let Some((root, mode)) = child_context() {
        child_apply(&root, &mode);
        return;
    }
    let temporary = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temporary.path()).unwrap();
    #[cfg(target_os = "macos")]
    let preferences = root.join("home/Library/Preferences/Cavalry/preferences.json");
    #[cfg(target_os = "windows")]
    let preferences = root.join("home/Local/Cavalry/preferences.json");
    #[cfg(target_os = "windows")]
    fs::create_dir_all(root.join("home/Roaming")).unwrap();
    fs::create_dir_all(preferences.parent().unwrap()).unwrap();
    fs::create_dir_all(root.join("state")).unwrap();
    let original =
        json!({"locale": typed_locale("en-GB"), "workspace": {"preserve": true}, "keep": 42});
    let original_bytes = serde_json::to_vec_pretty(&original).unwrap();
    fs::write(&preferences, &original_bytes).unwrap();
    let paths = paths_at(&root);
    let pack = synthetic_pack(LANGUAGE, "真实子进程恢复探针");

    let mut interrupted = spawn_self(&root, "park");
    let pid = interrupted.id();
    let ready = root.join(READY_FILE);
    let deadline = Instant::now() + Duration::from_secs(15);
    loop {
        if fs::read_to_string(&ready)
            .ok()
            .and_then(|v| v.trim().parse::<u32>().ok())
            == Some(pid)
        {
            break;
        }
        if let Some(status) = interrupted.try_wait().unwrap() {
            panic!("park child exited before boundary marker: {status}");
        }
        assert!(Instant::now() < deadline, "park child readiness timed out");
        thread::sleep(Duration::from_millis(20));
    }
    let stages = stages_for_pid(paths.preferences().parent().unwrap(), pid);
    assert_eq!(stages.len(), 1, "boundary requires one staged locale image");
    let stage = stages[0].clone();
    let staged_bytes = fs::read(&stage).unwrap();
    let staged: Value = serde_json::from_slice(&staged_bytes).unwrap();
    assert_eq!(staged["locale"], typed_locale(LANGUAGE));
    let status = interrupted
        .kill_wait()
        .expect("kill and reap only the owned child");
    #[cfg(target_os = "macos")]
    assert_eq!(status.signal(), Some(libc::SIGKILL));
    #[cfg(target_os = "windows")]
    assert_eq!(
        status.code(),
        Some(1),
        "owned Rust child.kill TerminateProcess exit code"
    );
    eprintln!(
        "owned park child {pid}: interrupted ({status}); pending and old locale checked next"
    );

    assert_eq!(fs::read(&preferences).unwrap(), original_bytes);
    assert_eq!(fs::read(paths.strings()).unwrap(), pack);
    assert_eq!(fs::read(&stage).unwrap(), staged_bytes);
    let pending: Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    assert_eq!(pending["pending"]["language"], json!(LANGUAGE));
    assert_eq!(
        pending["pending"]["before"]["locale"],
        typed_locale("en-GB")
    );
    assert_eq!(
        pending["pending"]["after"]["locale"],
        typed_locale(LANGUAGE)
    );
    assert_eq!(pending["pending"]["after"]["strings"]["bytes"], json!(pack));
    assert!(pending.get("active").is_none());

    let mut recovery = spawn_self(&root, "recover");
    eprintln!(
        "fresh recovery child {}: production apply retry",
        recovery.id()
    );
    assert!(recovery.wait(Duration::from_secs(30)).unwrap().success());
    let final_preferences: Value =
        serde_json::from_slice(&fs::read(&preferences).unwrap()).unwrap();
    assert_eq!(final_preferences["locale"], typed_locale(LANGUAGE));
    assert_eq!(final_preferences["workspace"], original["workspace"]);
    assert_eq!(final_preferences["keep"], original["keep"]);
    assert_eq!(fs::read(paths.strings()).unwrap(), pack);
    let receipt: Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    assert_eq!(receipt["active"]["language"], json!(LANGUAGE));
    assert_eq!(receipt["preimage"]["locale"], typed_locale("en-GB"));
    assert_eq!(receipt["active"]["image"]["strings"]["bytes"], json!(pack));
    assert!(receipt.get("pending").is_none());
    assert!(
        stage.exists(),
        "kill leaves an orphan stage; recovery does not clean it"
    );
    assert_eq!(fs::read(&stage).unwrap(), staged_bytes);
}
