/**
 * [INPUT]: 依赖native_user的profile投影、编译digest map、事务与启动准入。
 * [OUTPUT]: 锁定语言投影、digest更新及恢复/启动准入，并验证生产apply的目录fsync warning重试。
 * 验证English资源删除后的拒写与生产重试。
 * [POS]: native_user的隔离合同。使用临时profile与定向fsync故障缝，不触碰真实用户数据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;
fn profile(locale: Option<&str>) -> (tempfile::TempDir, UserLanguagePaths) {
    let mut preferences = json!({"unrelated":{"varType":"int","value":37}});
    if let Some(locale) = locale {
        preferences["locale"] = json!({"varType":"string","value":locale});
    }
    profile_with_preferences(preferences)
}
fn profile_with_preferences(
    preferences: serde_json::Value,
) -> (tempfile::TempDir, UserLanguagePaths) {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let home = root.join("home");
    let state = root.join("state");
    fs::create_dir_all(home.join("Library/Preferences/Cavalry")).unwrap();
    fs::create_dir(&state).unwrap();
    fs::write(
        home.join("Library/Preferences/Cavalry/preferences.json"),
        serde_json::to_vec(&preferences).unwrap(),
    )
    .unwrap();
    (
        temp,
        UserLanguagePaths::for_user_dirs(&home, &state).unwrap(),
    )
}
fn pack() -> Vec<u8> {
    serde_json::to_vec(
        &json!([{"type":"strings","language":"zh-Hans","value":{"fixture":{"UI-text":"中文"}}}]),
    )
    .unwrap()
}
#[test]
fn native_status_uses_vendor_default_only_for_absent_locale() {
    let (_temp, paths) = profile(Some("private-unknown-locale"));
    let status = profile_projection(&paths, None);
    assert_eq!(status.current_lang, "unknown");
    assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
    assert!(!status.native_english_restore_available);

    let (_temp, paths) = profile(None);
    let status = profile_projection(&paths, None);
    assert_eq!(status.current_lang, "en");
    assert_eq!(status.native_locale_state, NativeLocaleState::Unset);
    assert_eq!(status.patch_status, "notApplicable");
    assert!(!status.reconciliation_required);
    assert!(!status.native_english_restore_available);
    assert!(!paths.receipt().exists());

    for preferences in [
        json!({"locale": null}),
        json!({"locale": {"varType": "int", "value": 7}}),
        json!({"locale": {"varType": "string", "value": "fr-FR"}}),
    ] {
        let (_temp, paths) = profile_with_preferences(preferences);
        let status = profile_projection(&paths, None);
        assert_eq!(status.current_lang, "unknown");
        assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
        assert!(!status.native_english_restore_available);
    }

    let (_temp, paths) = profile(Some("en-GB"));
    let status = profile_projection(&paths, None);
    assert_eq!(status.current_lang, "en");
    assert_eq!(status.native_locale_state, NativeLocaleState::Explicit);
    assert!(
        !status.native_english_restore_available,
        "an explicit original locale is not a Switcher-owned restore receipt"
    );

    let (_temp, paths) = profile(None);
    fs::write(paths.preferences(), b"{invalid-json").unwrap();
    let status = profile_projection(&paths, None);
    assert_eq!(status.current_lang, "unknown");
    assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
    assert_eq!(status.patch_status, "unknown");
    assert!(status.reconciliation_required);
    assert!(!status.native_english_restore_available);

    let (_temp, paths) = profile(None);
    fs::remove_file(paths.preferences()).unwrap();
    let status = profile_projection(&paths, None);
    assert_eq!(status.current_lang, "unknown");
    assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
    assert_eq!(status.patch_status, "unknown");
    assert!(status.reconciliation_required);
    assert!(!status.native_english_restore_available);
}

#[test]
fn native_apply_publishes_resource_and_typed_locale_without_bundle_state() {
    let (_temp, paths) = profile(Some("en-GB"));
    let payload = apply_profile(
        &paths,
        "zh-Hans",
        Some(&pack()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(payload.ok);
    assert_eq!(payload.current_lang.as_deref(), Some("zh-Hans"));
    let preferences: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    assert_eq!(preferences["locale"]["value"], "zh-Hans");
    assert_eq!(preferences["unrelated"]["value"], 37);
    assert!(paths.receipt().exists());
}

#[cfg(unix)]
#[test]
fn native_apply_retries_visible_locale_after_directory_sync_warning() {
    let (_temp, paths) = profile(Some("en-GB"));
    let preferences_parent = paths.preferences().parent().unwrap().to_path_buf();
    let bytes = pack();
    user_language_files::storage::fail_next_directory_sync_for(&preferences_parent);

    let first = apply_profile(
        &paths,
        "zh-Hans",
        Some(&bytes),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );

    assert!(first.ok);
    assert_eq!(first.current_lang.as_deref(), Some("zh-Hans"));
    assert_eq!(
        first.warning_code.as_deref(),
        Some("stateDurabilityPending")
    );
    assert_eq!(
        first.warning_codes,
        vec!["stateDurabilityPending".to_string()]
    );
    assert!(first.reconciliation_required);
    assert!(first.error_code.is_none());
    assert_eq!(fs::read(paths.strings()).unwrap(), bytes);

    let preferences: Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    assert_eq!(preferences["locale"]["varType"], "string");
    assert_eq!(preferences["locale"]["value"], "zh-Hans");
    assert_eq!(preferences["unrelated"]["value"], 37);

    let pending: Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    assert!(pending["active"].is_null());
    assert_eq!(pending["pending"]["action"], "apply");
    assert_eq!(pending["pending"]["after"]["locale"]["value"], "zh-Hans");
    let projected = profile_projection(&paths, None);
    assert_eq!(projected.current_lang, "zh-Hans");
    assert!(projected.reconciliation_required);

    let retry = apply_profile(
        &paths,
        "zh-Hans",
        Some(&bytes),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(retry.ok);
    assert_eq!(retry.current_lang.as_deref(), Some("zh-Hans"));
    assert!(retry.warning_code.is_none());
    assert!(retry.warning_codes.is_empty());
    assert!(!retry.reconciliation_required);
    assert_eq!(fs::read(paths.strings()).unwrap(), bytes);

    let completed: Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    assert!(completed["pending"].is_null());
    assert_eq!(completed["active"]["language"], "zh-Hans");
}

#[test]
fn english_restore_does_not_require_native_payload() {
    let (_temp, paths) = profile(Some("ja"));
    let payload = apply_profile(
        &paths,
        "en",
        None,
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(payload.ok);
    assert_eq!(profile_projection(&paths, None).current_lang, "en");
    assert!(!paths.strings().exists());
}

#[test]
fn english_restore_retries_after_writer_refusal_between_resource_and_locale_publish() {
    let (_temp, paths) = profile(Some("en-GB"));
    let reporter = super::super::contract::NoopReporter;
    let applied = apply_profile(&paths, "zh-Hans", Some(&pack()), &mut || Ok(()), &reporter);
    assert!(applied.ok);

    let mut refuse_after_resource_publish = || {
        if !paths.strings().exists() {
            let preferences: Value =
                serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
            if preferences["locale"]["value"] == "zh-Hans" {
                return Err("fixture writer refusal after resource publish".into());
            }
        }
        Ok(())
    };
    let failed = apply_profile(
        &paths,
        "en",
        None,
        &mut refuse_after_resource_publish,
        &reporter,
    );

    assert!(!failed.ok);
    assert_eq!(
        failed.error_code.as_deref(),
        Some("nativeUserLanguageConflict")
    );
    assert!(failed.reconciliation_required);
    assert!(!paths.strings().exists());

    let preferences: Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    assert_eq!(preferences["locale"]["value"], "zh-Hans");
    assert_eq!(preferences["unrelated"]["value"], 37);

    let receipt: Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    assert_eq!(receipt["active"]["language"], "zh-Hans");
    assert_eq!(
        receipt["pending"]["action"], "restoreEnglish",
        "the canonical restore receipt must remain pending after the locale write is refused"
    );
    assert_eq!(
        receipt["pending"]["before"], receipt["active"]["image"],
        "restore pending preimage must match the committed active image"
    );
    assert_eq!(
        receipt["pending"]["after"]["locale"],
        json!({"varType": "string", "value": "en-GB"})
    );
    assert!(receipt["pending"]["after"].get("strings").is_none());
    assert!(receipt["pending"].get("language").is_none());

    let retried = apply_profile(&paths, "en", None, &mut || Ok(()), &reporter);
    assert!(retried.ok);
    assert_eq!(retried.current_lang.as_deref(), Some("en"));
    assert_eq!(retried.error_code, None);
    assert!(!retried.reconciliation_required);

    let preferences: Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    assert_eq!(
        preferences["locale"],
        json!({"varType": "string", "value": "en-GB"})
    );
    assert_eq!(preferences["unrelated"]["value"], 37);
    assert!(!paths.strings().exists());
    assert!(!paths.receipt().exists());
}

#[test]
fn running_writer_and_missing_pack_are_distinct_admission_failures() {
    let (_temp, paths) = profile(Some("en-GB"));
    let payload = apply_profile(
        &paths,
        "zh-Hans",
        None,
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert_eq!(
        payload.error_code.as_deref(),
        Some("nativeResourceUnavailable")
    );
    let payload = apply_profile(
        &paths,
        "zh-Hans",
        Some(&pack()),
        &mut || Err(WRITER_REFUSAL.into()),
        &super::super::contract::NoopReporter,
    );
    assert_eq!(payload.error_code.as_deref(), Some("cavalryStillRunning"));
    assert!(!paths.receipt().exists());
    assert!(!paths.strings().exists());
}
#[test]
fn active_pack_version_and_drift_are_separate_status_facts() {
    let (_temp, paths) = profile(Some("en-GB"));
    assert!(
        apply_profile(
            &paths,
            "zh-Hans",
            Some(&pack()),
            &mut || Ok(()),
            &super::super::contract::NoopReporter
        )
        .ok
    );
    let resources = NativeResourceDigests {
        packs: [("zh-Hans".into(), format!("{:x}", Sha256::digest(pack())))]
            .into_iter()
            .collect(),
    };
    assert_eq!(
        profile_projection(&paths, Some(&resources)).patch_status,
        "current"
    );
    let changed = NativeResourceDigests {
        packs: [(
            "zh-Hans".into(),
            format!("{:x}", Sha256::digest(b"changed")),
        )]
        .into_iter()
        .collect(),
    };
    assert_eq!(
        profile_projection(&paths, Some(&changed)).patch_status,
        "updateAvailable"
    );
    fs::write(paths.strings(), b"user modified").unwrap();
    let status = profile_projection(&paths, Some(&resources));
    assert_eq!(status.patch_status, "unknown");
    assert!(status.reconciliation_required);
    let result = apply_profile(
        &paths,
        "en",
        None,
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert_eq!(
        result.error_code.as_deref(),
        Some("nativeUserLanguageConflict")
    );
    assert_eq!(fs::read(paths.strings()).unwrap(), b"user modified");
}

#[test]
fn empty_receipt_cannot_report_restore_english_success() {
    let (_temp, paths) = profile(Some("en-GB"));
    assert!(
        apply_profile(
            &paths,
            "zh-Hans",
            Some(&pack()),
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        )
        .ok
    );

    let mut receipt: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
    receipt["active"] = serde_json::Value::Null;
    receipt["pending"] = serde_json::Value::Null;
    fs::write(paths.receipt(), serde_json::to_vec(&receipt).unwrap()).unwrap();
    let before_preferences = fs::read(paths.preferences()).unwrap();
    let before_strings = fs::read(paths.strings()).unwrap();
    let status = profile_projection(&paths, None);
    let payload = apply_profile(
        &paths,
        "en",
        None,
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );

    assert_eq!(status.current_lang, "unknown");
    assert!(status.reconciliation_required);
    assert!(
        !payload.ok,
        "invalid empty ownership receipt is not English success"
    );
    assert_eq!(
        payload.error_code.as_deref(),
        Some("nativeUserLanguageConflict")
    );
    assert_eq!(fs::read(paths.preferences()).unwrap(), before_preferences);
    assert_eq!(fs::read(paths.strings()).unwrap(), before_strings);
}

#[test]
fn restart_does_not_launch_while_profile_receipt_is_pending() {
    use crate::privilege::{CommandRunner, RecordingRunner};

    let (_temp, paths) = profile(Some("en-GB"));
    let pending = user_language_files::apply_with_interrupt(
        &paths,
        "zh-Hans",
        &pack(),
        Some(user_language_files::InterruptAfter::DirectoryIntent),
    );
    assert!(pending.is_err());

    let mut runner = RecordingRunner::default();
    let result = with_restart_profile_admission(&paths, || {
        runner.spawn_detached("open", &["-n".into(), "/Applications/Cavalry.app".into()])
    });

    assert!(
        result.is_err(),
        "pending receipt must block standalone restart"
    );
    assert!(
        runner.commands.is_empty(),
        "refusal must happen before launch"
    );
    assert!(
        paths.receipt().exists(),
        "restart must preserve pending evidence"
    );
    assert!(!paths.strings().exists(), "restart admission is read-only");
}

#[test]
fn restart_refuses_drift_corruption_and_unowned_strings_residue() {
    use crate::privilege::{CommandRunner, RecordingRunner};

    let (_temp, paths) = profile(Some("en-GB"));
    assert!(
        apply_profile(
            &paths,
            "zh-Hans",
            Some(&pack()),
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        )
        .ok
    );
    let mut preferences: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    preferences["locale"]["value"] = serde_json::Value::String("ja".into());
    fs::write(
        paths.preferences(),
        serde_json::to_vec(&preferences).unwrap(),
    )
    .unwrap();
    let mut runner = RecordingRunner::default();
    let result =
        with_restart_profile_admission(&paths, || runner.spawn_detached("open", &["-n".into()]));
    assert!(result.is_err());
    assert!(runner.commands.is_empty());

    let (_temp, paths) = profile(Some("en-GB"));
    fs::create_dir_all(paths.receipt().parent().unwrap()).unwrap();
    fs::write(paths.receipt(), b"{").unwrap();
    let mut runner = RecordingRunner::default();
    let result =
        with_restart_profile_admission(&paths, || runner.spawn_detached("open", &["-n".into()]));
    assert!(result.is_err());
    assert!(runner.commands.is_empty());

    let (_temp, paths) = profile(Some("en-GB"));
    fs::create_dir_all(paths.strings().parent().unwrap()).unwrap();
    fs::write(paths.strings(), b"unowned namespace residue").unwrap();
    let mut runner = RecordingRunner::default();
    let result =
        with_restart_profile_admission(&paths, || runner.spawn_detached("open", &["-n".into()]));
    assert!(result.is_err());
    assert!(runner.commands.is_empty());
}

#[test]
fn restart_allows_current_receipt_or_clean_unowned_profile() {
    use crate::privilege::{CommandRunner, RecordingRunner};

    let (_temp, paths) = profile(Some("en-GB"));
    assert!(
        apply_profile(
            &paths,
            "zh-Hans",
            Some(&pack()),
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        )
        .ok
    );
    let mut runner = RecordingRunner::default();
    with_restart_profile_admission(&paths, || runner.spawn_detached("open", &["-n".into()]))
        .unwrap();
    assert_eq!(runner.commands.len(), 1);

    let (_temp, paths) = profile(Some("en-GB"));
    let mut runner = RecordingRunner::default();
    with_restart_profile_admission(&paths, || runner.spawn_detached("open", &["-n".into()]))
        .unwrap();
    assert_eq!(runner.commands.len(), 1);
    assert!(!paths.receipt().exists());
    assert!(!paths.strings().exists());
}

#[cfg(target_os = "macos")]
#[test]
fn committed_apply_launch_skips_restart_profile_and_host_revalidation() {
    use crate::privilege::{CommandRunner, RecordedCommand, RecordingRunner};

    let (temp, paths) = profile(Some("en-GB"));
    assert!(
        apply_profile(
            &paths,
            "zh-Hans",
            Some(&pack()),
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        )
        .ok
    );
    fs::write(
        paths.strings(),
        b"outside writer changed profile after commit",
    )
    .unwrap();

    let state_dir = paths.receipt().parent().unwrap();
    let app = temp.path().join("missing/Cavalry.app");
    let mut old_restart_runner = RecordingRunner::default();
    let old_restart = with_restart_profile_admission(&paths, || {
        old_restart_runner.spawn_detached(
            "open",
            &["-g".into(), "-n".into(), app.to_string_lossy().into_owned()],
        )
    });
    assert!(old_restart.is_err(), "standalone Restart must detect drift");
    assert!(old_restart_runner.commands.is_empty());

    let expected_state_dir = fs::canonicalize(state_dir).unwrap();
    let mut runner = RecordingRunner::default();
    let mut guard_checks = 0;
    let mut writer_guard_calls = 0;
    launch_after_committed_apply_with_guards(
        state_dir,
        &app,
        &mut runner,
        |selected_state_dir| {
            guard_checks += 1;
            assert_eq!(
                fs::canonicalize(selected_state_dir).unwrap(),
                expected_state_dir
            );
            Ok(())
        },
        || {
            writer_guard_calls += 1;
            Ok(())
        },
    )
    .unwrap();

    assert_eq!(guard_checks, 1);
    assert_eq!(writer_guard_calls, 1);
    assert_eq!(
        runner.commands,
        [RecordedCommand {
            program: "open".into(),
            args: vec!["-g".into(), "-n".into(), app.to_string_lossy().into_owned()],
        }],
        "automatic launch must only spawn the existing background launch command"
    );
}

#[cfg(target_os = "macos")]
#[test]
fn committed_apply_launch_rejects_wrong_guard_root_and_writer_before_spawn() {
    use crate::privilege::RecordingRunner;

    let temp = tempfile::tempdir().unwrap();
    let first_state = temp.path().join("first-state");
    let second_state = temp.path().join("second-state");
    fs::create_dir(&first_state).unwrap();
    fs::create_dir(&second_state).unwrap();
    let app = temp.path().join("missing/Cavalry.app");
    let expected_state = fs::canonicalize(&first_state).unwrap();
    let mut wrong_root_runner = RecordingRunner::default();
    let mut guard_checks = 0;
    let mut writer_guard_calls = 0;
    let wrong_root = launch_after_committed_apply_with_guards(
        &second_state,
        &app,
        &mut wrong_root_runner,
        |selected_state_dir| {
            guard_checks += 1;
            if fs::canonicalize(selected_state_dir).ok().as_deref()
                == Some(expected_state.as_path())
            {
                Ok(())
            } else {
                Err("Native runtime operation guard belongs to another state directory.".into())
            }
        },
        || {
            writer_guard_calls += 1;
            Ok(())
        },
    );
    assert!(wrong_root.is_err());
    assert_eq!(guard_checks, 1);
    assert_eq!(
        writer_guard_calls, 0,
        "wrong root must stop before writer guard"
    );
    assert!(wrong_root_runner.commands.is_empty());

    let expected_second_state = fs::canonicalize(&second_state).unwrap();
    let mut runner = RecordingRunner::default();
    let mut writer_guard_calls = 0;
    let writer_refusal = launch_after_committed_apply_with_guards(
        &second_state,
        &app,
        &mut runner,
        |selected_state_dir| {
            assert_eq!(
                fs::canonicalize(selected_state_dir).unwrap(),
                expected_second_state
            );
            Ok(())
        },
        || {
            writer_guard_calls += 1;
            Err("nativeWriterStillRunning".into())
        },
    );
    assert_eq!(writer_refusal.unwrap_err(), "nativeWriterStillRunning");
    assert_eq!(writer_guard_calls, 1);
    assert!(runner.commands.is_empty());
}
