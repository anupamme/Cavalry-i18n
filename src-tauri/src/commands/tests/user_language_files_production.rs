/**
 * [INPUT]: 依赖父级 tempfile/pack helper、生产 user-language transaction 与 NoopReporter。
 * [OUTPUT]: 验证固定路径/只读 projection、合法资源、writer guard与typed拒权；macOS ignored探针核实真实拒权和pending重试恢复。
 * [POS]: commands/tests 的 production-path合同。
 * 拒权探针只调用临时profile的生产事务。
 * 独立macOS子模块核真实进程中断与恢复。
 * 不触碰真实profile、Cavalry、IPC或app bundle。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{synthetic_pack, typed_locale, Fixture};
use crate::commands::user_language_files::{
    self, CommitOutcome, InterruptAfter, LocaleObservation, ReceiptObservation, RecoveryOutcome,
    RestoreOutcome,
};
use serde_json::{json, Value};
use sha2::Digest;
use std::fs;
#[cfg(target_os = "macos")]
use std::{
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
};

#[cfg(target_os = "macos")]
struct RestoreDirectoryMode {
    path: PathBuf,
    mode: u32,
    armed: bool,
}

#[cfg(target_os = "macos")]
impl RestoreDirectoryMode {
    fn without_write_bits(path: &Path) -> Self {
        let mode = fs::symlink_metadata(path).unwrap().permissions().mode() & 0o7777;
        let guard = Self {
            path: path.to_path_buf(),
            mode,
            armed: true,
        };
        fs::set_permissions(path, fs::Permissions::from_mode(mode & !0o222)).unwrap();
        assert_eq!(
            fs::symlink_metadata(path).unwrap().permissions().mode() & 0o222,
            0
        );
        guard
    }

    fn restore(&mut self) -> std::io::Result<()> {
        fs::set_permissions(&self.path, fs::Permissions::from_mode(self.mode))?;
        self.armed = false;
        Ok(())
    }
}

#[cfg(target_os = "macos")]
impl Drop for RestoreDirectoryMode {
    fn drop(&mut self) {
        if self.armed {
            let _ = fs::set_permissions(&self.path, fs::Permissions::from_mode(self.mode));
        }
    }
}

#[test]
fn production_paths_bind_only_cavalry_user_files_and_state_receipt() {
    let temp = tempfile::tempdir().unwrap();
    let home = temp.path().join("home");
    let state = temp.path().join("state");
    fs::create_dir_all(&home).unwrap();
    fs::create_dir_all(&state).unwrap();
    let home = fs::canonicalize(home).unwrap();
    let state = fs::canonicalize(state).unwrap();

    let paths = user_language_files::UserLanguagePaths::for_user_dirs(&home, &state).unwrap();

    assert_eq!(
        paths.preferences(),
        home.join("Library/Preferences/Cavalry/preferences.json")
    );
    assert_eq!(
        paths.strings(),
        home.join(
            "Library/Application Support/Cavalry/Third-Party/Plugins/Cavalry-i18n/strings.json"
        )
    );
    assert_eq!(paths.receipt(), state.join("native-user-language.json"));
    assert!(!paths.preferences().exists());
    assert!(!paths.strings().exists());
    assert!(!paths.receipt().exists());
}

#[test]
fn production_paths_reject_symlink_and_missing_roots_without_creating_them() {
    let temp = tempfile::tempdir().unwrap();
    let home = temp.path().join("home");
    let state = temp.path().join("state");
    fs::create_dir_all(&home).unwrap();
    fs::create_dir_all(&state).unwrap();
    let home = fs::canonicalize(home).unwrap();
    let state = fs::canonicalize(state).unwrap();

    #[cfg(unix)]
    {
        use std::os::unix::fs::symlink;
        let alias = temp.path().join("home-alias");
        symlink(&home, &alias).unwrap();
        assert!(user_language_files::UserLanguagePaths::for_user_dirs(&alias, &state).is_err());
    }
    let missing_state = temp.path().join("not-created");
    assert!(user_language_files::UserLanguagePaths::for_user_dirs(&home, &missing_state).is_err());
    assert!(!missing_state.exists());
    assert!(
        user_language_files::UserLanguagePaths::for_user_dirs(&home.join(".."), &state).is_err()
    );
}

#[test]
fn permission_handoff_classification_requires_a_typed_permission_denied_io_error() {
    use user_language_files::storage::permission_error;

    let denied = permission_error(
        "native profile read",
        std::io::Error::from(std::io::ErrorKind::PermissionDenied),
    );
    let unavailable = permission_error(
        "native profile read",
        std::io::Error::from(std::io::ErrorKind::NotFound),
    );

    assert!(user_language_files::is_permission_denied(&denied));
    assert!(!user_language_files::is_permission_denied(&unavailable));
    assert!(!user_language_files::is_permission_denied(
        "permission denied by policy"
    ));
}

#[test]
#[cfg(target_os = "macos")]
#[ignore = "requires explicit macOS non-root POSIX permission execution"]
fn macos_nonroot_profile_apply_reports_real_state_directory_permission_denied() {
    use crate::commands::{contract::NoopReporter, native_user};
    use std::{fs::OpenOptions, io::ErrorKind};

    assert_ne!(
        unsafe { libc::geteuid() },
        0,
        "run this ignored test as a non-root macOS user so POSIX DAC can deny writes"
    );

    let temporary = tempfile::tempdir().unwrap();
    let home = temporary.path().join("home");
    let state = temporary.path().join("state");
    let preferences = home.join("Library/Preferences/Cavalry/preferences.json");
    fs::create_dir_all(preferences.parent().unwrap()).unwrap();
    fs::create_dir_all(&state).unwrap();
    let original_preferences = br#"{"locale":{"varType":"string","value":"en-GB"},"keep":true}"#;
    fs::write(&preferences, original_preferences).unwrap();

    let home = fs::canonicalize(home).unwrap();
    let state = fs::canonicalize(state).unwrap();
    let paths = user_language_files::UserLanguagePaths::for_user_dirs(&home, &state).unwrap();
    let mut restore_mode = RestoreDirectoryMode::without_write_bits(&state);

    let probe = state.join("os-permission-denied-probe");
    let os_error = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&probe)
        .expect_err("the mode-restricted tempfile directory must reject a real OS write");
    assert_eq!(os_error.kind(), ErrorKind::PermissionDenied);
    assert!(!probe.exists());

    let pack = synthetic_pack("zh-Hans", "临时拒权探针");
    let mut writer_guard = || Ok(());
    let action = native_user::apply_profile(
        &paths,
        "zh-Hans",
        Some(&pack),
        &mut writer_guard,
        &NoopReporter,
    );

    restore_mode.restore().unwrap();
    assert_eq!(
        fs::symlink_metadata(&state).unwrap().permissions().mode() & 0o7777,
        restore_mode.mode
    );

    assert!(!action.ok, "OS-denied transaction must not report success");
    assert_eq!(
        action.error_code.as_deref(),
        Some("nativeUserLanguagePermissionDenied")
    );
    assert!(
        !action.permission_required,
        "do not simulate App Management handoff"
    );
    assert!(action.reconciliation_required);
    assert_eq!(fs::read(&preferences).unwrap(), original_preferences);
    assert!(!paths.strings().exists(), "resource publish must not start");
    assert!(!paths.strings().parent().unwrap().exists());
    assert!(
        !paths.receipt().exists(),
        "pending receipt must not publish"
    );
    assert!(fs::read_dir(&state).unwrap().next().is_none());
}

#[test]
#[cfg(target_os = "macos")]
#[ignore = "requires explicit macOS non-root POSIX permission execution"]
fn macos_nonroot_profile_apply_recovers_pending_after_real_preferences_permission_denied() {
    use crate::commands::{contract::NoopReporter, native_user};
    use std::{fs::OpenOptions, io::ErrorKind};

    assert_ne!(
        unsafe { libc::geteuid() },
        0,
        "run this ignored test as a non-root macOS user so POSIX DAC can deny writes"
    );

    let temporary = tempfile::tempdir().unwrap();
    let home = temporary.path().join("home");
    let state = temporary.path().join("state");
    let preferences = home.join("Library/Preferences/Cavalry/preferences.json");
    let preferences_parent = preferences.parent().unwrap().to_path_buf();
    fs::create_dir_all(&preferences_parent).unwrap();
    fs::create_dir_all(&state).unwrap();
    let original_preferences = json!({
        "locale": typed_locale("en-GB"),
        "workspace": {"preserve": true},
        "keep": 42
    });
    let original_preferences_bytes = serde_json::to_vec(&original_preferences).unwrap();
    fs::write(&preferences, &original_preferences_bytes).unwrap();

    let home = fs::canonicalize(home).unwrap();
    let state = fs::canonicalize(state).unwrap();
    let paths = user_language_files::UserLanguagePaths::for_user_dirs(&home, &state).unwrap();
    let mut restore_mode = RestoreDirectoryMode::without_write_bits(&preferences_parent);

    let probe = preferences_parent.join("os-permission-denied-probe");
    let os_error = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&probe)
        .expect_err("the mode-restricted tempfile directory must reject a real OS write");
    assert_eq!(os_error.kind(), ErrorKind::PermissionDenied);
    assert!(!probe.exists());

    let pack = synthetic_pack("zh-Hans", "临时恢复探针");
    let mut writer_guard = || Ok(());
    let denied = native_user::apply_profile(
        &paths,
        "zh-Hans",
        Some(&pack),
        &mut writer_guard,
        &NoopReporter,
    );

    restore_mode.restore().unwrap();
    assert_eq!(
        fs::symlink_metadata(&preferences_parent)
            .unwrap()
            .permissions()
            .mode()
            & 0o7777,
        restore_mode.mode
    );

    assert!(!denied.ok, "OS-denied transaction must not report success");
    assert_eq!(
        denied.error_code.as_deref(),
        Some("nativeUserLanguagePermissionDenied")
    );
    assert!(!denied.permission_required);
    assert!(denied.reconciliation_required);
    assert_eq!(fs::read(&preferences).unwrap(), original_preferences_bytes);
    assert_eq!(fs::read(paths.strings()).unwrap(), pack);

    let pending: Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    assert_eq!(pending["pending"]["action"], "apply");
    assert_eq!(pending["pending"]["language"], "zh-Hans");
    assert_eq!(
        pending["pending"]["before"]["locale"],
        typed_locale("en-GB")
    );
    assert_eq!(
        pending["pending"]["after"]["locale"],
        typed_locale("zh-Hans")
    );

    let mut retry_writer_guard = || Ok(());
    let retried = native_user::apply_profile(
        &paths,
        "zh-Hans",
        Some(&pack),
        &mut retry_writer_guard,
        &NoopReporter,
    );

    assert!(
        retried.ok,
        "the next production apply must recover pending state"
    );
    assert_eq!(retried.current_lang.as_deref(), Some("zh-Hans"));
    assert_eq!(retried.error_code, None);
    let recovered_preferences: Value =
        serde_json::from_slice(&fs::read(&preferences).unwrap()).unwrap();
    assert_eq!(recovered_preferences["locale"], typed_locale("zh-Hans"));
    assert_eq!(recovered_preferences["workspace"]["preserve"], true);
    assert_eq!(recovered_preferences["keep"], 42);
    assert_eq!(fs::read(paths.strings()).unwrap(), pack);

    let recovered: Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    assert!(recovered.get("pending").is_none());
    assert_eq!(recovered["active"]["language"], "zh-Hans");
}

#[test]
fn readonly_paths_project_missing_state_without_creating_it_and_reject_writes() {
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let home = root.join("home");
    let state = root.join("state-not-created");
    let preferences = home.join("Library/Preferences/Cavalry/preferences.json");
    fs::create_dir_all(preferences.parent().unwrap()).unwrap();
    fs::write(
        &preferences,
        br#"{"locale":{"varType":"string","value":"ja"},"keep":true}"#,
    )
    .unwrap();
    let home = fs::canonicalize(home).unwrap();
    let paths =
        user_language_files::UserLanguagePaths::for_user_dirs_read_only(&home, &state).unwrap();

    let projection = user_language_files::read_profile_projection(&paths).unwrap();
    assert_eq!(
        projection.locale,
        LocaleObservation::Known {
            product_language: "ja_JP",
            native_locale: "ja"
        }
    );
    assert_eq!(projection.ownership, ReceiptObservation::None);
    assert!(
        !state.exists(),
        "status projection must not create state_dir"
    );

    assert!(
        user_language_files::apply(&paths, "zh-Hans", &synthetic_pack("zh-Hans", "简体")).is_err()
    );
    assert_eq!(
        fs::read(&preferences).unwrap(),
        br#"{"locale":{"varType":"string","value":"ja"},"keep":true}"#
    );
    assert!(!state.exists());
}

#[test]
fn read_only_projection_separates_unknown_locale_from_ownership() {
    let fixture = Fixture::new(json!({"locale": typed_locale("pt-BR")}), None);
    let projection = user_language_files::read_profile_projection(&fixture.paths).unwrap();

    assert_eq!(projection.locale, LocaleObservation::Unknown);
    assert_eq!(projection.ownership, ReceiptObservation::None);
}

#[test]
fn read_only_projection_reports_current_drift_and_pending_with_native_product_locale() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    let pack = synthetic_pack("ja_JP", "日本語");
    user_language_files::apply(&fixture.paths, "ja_JP", &pack).unwrap();
    assert_eq!(
        user_language_files::read_profile_projection(&fixture.paths)
            .unwrap()
            .ownership,
        ReceiptObservation::Current {
            language: "ja_JP".to_string(),
            active_strings_sha256: format!("{:x}", sha2::Sha256::digest(&pack))
        }
    );
    assert_eq!(
        user_language_files::read_profile_projection(&fixture.paths)
            .unwrap()
            .locale,
        LocaleObservation::Known {
            product_language: "ja_JP",
            native_locale: "ja"
        }
    );

    fs::write(fixture.paths.strings(), b"later external edit").unwrap();
    assert_eq!(
        user_language_files::read_profile_projection(&fixture.paths)
            .unwrap()
            .ownership,
        ReceiptObservation::Drifted {
            language: "ja_JP".to_string()
        }
    );

    let pending_fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    assert!(user_language_files::apply_with_interrupt(
        &pending_fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "简体"),
        Some(InterruptAfter::ResourcePublish),
    )
    .is_err());
    assert_eq!(
        user_language_files::read_profile_projection(&pending_fixture.paths)
            .unwrap()
            .ownership,
        ReceiptObservation::Pending {
            language: Some("zh-Hans".to_string())
        }
    );
}

#[test]
#[cfg(unix)]
fn durable_preimage_precedes_resource_and_locale_is_the_last_enable_write() {
    let original_preferences = json!({
        "locale": typed_locale("fr-FR"),
        "workspace": {"keep": [1, 2, 3]}
    });
    let fixture = Fixture::new(original_preferences.clone(), None);
    let resource =
        br#"[{"type":"strings","language":"zh-Hans","value":{"about.title":{"UI-text":"probe"}}}]"#;

    assert!(user_language_files::apply_with_interrupt(
        &fixture.paths,
        "zh-Hans",
        resource,
        Some(InterruptAfter::ResourcePublish),
    )
    .is_err());

    let receipt: Value =
        serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
    assert_eq!(receipt["preimage"]["locale"], typed_locale("fr-FR"));
    assert_eq!(fixture.strings().as_deref(), Some(resource.as_slice()));
    assert_eq!(fixture.preferences(), original_preferences);

    assert_eq!(
        user_language_files::recover_interrupted(&fixture.paths).unwrap(),
        RecoveryOutcome::Completed
    );
    assert_eq!(fixture.preferences()["locale"], typed_locale("zh-Hans"));
    assert_eq!(fixture.strings().as_deref(), Some(resource.as_slice()));
}

#[test]
#[cfg(unix)]
fn writer_guard_refuses_final_locale_after_resource_publish_and_pending_recovery_resumes() {
    let original_preferences = json!({
        "locale": typed_locale("en-GB"),
        "workspace": {"preserve": true}
    });
    let fixture = Fixture::new(original_preferences.clone(), None);
    let pack = synthetic_pack("zh-Hans", "简体 UI");
    let mut guard = || {
        let staged_locale_file = fs::read_dir(fixture.paths.preferences().parent().unwrap())
            .unwrap()
            .filter_map(Result::ok)
            .any(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .starts_with(".cavalry-i18n-user-language-")
            });
        if fixture.strings().is_some()
            && fixture.preferences()["locale"] == typed_locale("en-GB")
            && staged_locale_file
        {
            Err("Cavalry candidate appeared before locale publish".to_string())
        } else {
            Ok(())
        }
    };

    let error =
        user_language_files::apply_with_writer_guard(&fixture.paths, "zh-Hans", &pack, &mut guard)
            .unwrap_err();
    assert!(error.contains("Cavalry candidate appeared"));
    assert_eq!(fixture.preferences(), original_preferences);
    assert_eq!(fixture.strings().as_deref(), Some(pack.as_slice()));
    assert!(!fs::read_dir(fixture.paths.preferences().parent().unwrap())
        .unwrap()
        .filter_map(Result::ok)
        .any(|entry| entry
            .file_name()
            .to_string_lossy()
            .starts_with(".cavalry-i18n-user-language-")));
    let pending: Value =
        serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
    assert_eq!(pending["pending"]["action"], "apply");

    let mut closed_writer = || Ok(());
    assert_eq!(
        user_language_files::recover_with_writer_guard(&fixture.paths, &mut closed_writer).unwrap(),
        RecoveryOutcome::Completed
    );
    assert_eq!(fixture.preferences()["locale"], typed_locale("zh-Hans"));
    assert_eq!(fixture.strings().as_deref(), Some(pack.as_slice()));
}

#[test]
fn first_writer_guard_denial_precedes_any_durable_or_profile_mutation() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
    let mut guard = || Err("Cavalry is running".to_string());

    assert!(user_language_files::apply_with_writer_guard(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "简体"),
        &mut guard,
    )
    .is_err());
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(fixture.strings(), None);
    assert!(!fixture.paths.receipt().exists());
}

#[test]
fn no_receipt_english_restore_runs_writer_guard_before_locale_write() {
    let fixture = Fixture::new(
        json!({"locale": typed_locale("pt-BR"), "workspace": {"keep": 42}}),
        None,
    );
    let before = fs::read(fixture.paths.preferences()).unwrap();
    let mut guard = || Err("Cavalry is running".to_string());

    assert!(
        user_language_files::restore_english_with_writer_guard(&fixture.paths, &mut guard).is_err()
    );
    assert_eq!(fs::read(fixture.paths.preferences()).unwrap(), before);
    assert_eq!(fixture.strings(), None);
    assert!(!fixture.paths.receipt().exists());
}

#[test]
#[cfg(unix)]
fn same_language_reapplication_keeps_the_first_locale_preimage_and_owned_generation() {
    let original_locale = json!({
        "varType": "string",
        "value": "fr-FR",
        "vendorMetadata": {"doNotLose": true}
    });
    let fixture = Fixture::new(
        json!({"locale": original_locale, "unrelated": {"keep": true}}),
        None,
    );
    let first_resource = synthetic_pack("ja_JP", "first native pack");
    let second_resource = synthetic_pack("ja_JP", "updated native pack");

    assert_eq!(
        user_language_files::apply(&fixture.paths, "ja_JP", &first_resource).unwrap(),
        CommitOutcome::Committed
    );
    user_language_files::apply(&fixture.paths, "ja_JP", &second_resource).unwrap();

    let receipt: Value =
        serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
    assert_eq!(
        receipt["preimage"]["locale"],
        json!({
            "varType": "string",
            "value": "fr-FR",
            "vendorMetadata": {"doNotLose": true}
        })
    );
    assert!(receipt["preimage"].get("strings").is_none());
    assert_eq!(fixture.preferences()["locale"]["value"], "ja");
    assert_eq!(
        fixture.preferences()["locale"]["vendorMetadata"]["doNotLose"],
        true
    );
    assert_eq!(fixture.preferences()["unrelated"]["keep"], true);
    assert_eq!(
        fixture.strings().as_deref(),
        Some(second_resource.as_slice())
    );

    assert_eq!(
        user_language_files::rollback(&fixture.paths).unwrap(),
        RestoreOutcome::Restored
    );
    assert_eq!(
        fixture.preferences()["locale"],
        json!({
            "varType": "string",
            "value": "fr-FR",
            "vendorMetadata": {"doNotLose": true}
        })
    );
    assert_eq!(fixture.strings(), None);
}

#[cfg(target_os = "macos")]
#[path = "user_language_files_process_recovery.rs"]
mod process_recovery;
