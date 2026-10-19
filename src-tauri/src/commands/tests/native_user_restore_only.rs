/**
 * [INPUT]: 依赖 native_user 的受限 host-probe seam、固定用户路径、事务 owner 与 fake writer guard。
 * [OUTPUT]: 验证宿主不可用时仅 Current owned postimage 可恢复英文、能力投影精确、失败零写入且有效宿主保留普通路径。
 * [POS]: commands/tests 的 native restore-only fixture；全部文件位于 tempfile，不启动 Cavalry、不访问真实用户目录。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;
use serde_json::json;
use std::fs;

fn profile(locale: Option<&str>) -> (tempfile::TempDir, UserLanguagePaths) {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let home = root.join("home");
    let state = root.join("state");
    fs::create_dir_all(home.join("Library/Preferences/Cavalry")).unwrap();
    fs::create_dir(&state).unwrap();
    let mut preferences = json!({"unrelated":{"varType":"int","value":37}});
    if let Some(locale) = locale {
        preferences["locale"] = json!({"varType":"string","value":locale});
    }
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

fn apply_english_with_host_probe<R: OperationReporter>(
    paths: &UserLanguagePaths,
    host_probe: impl FnOnce() -> Result<(), String>,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
    reporter: &R,
) -> ActionPayload {
    let mut verify_phase = OperationPhaseGuard::start(reporter, OperationPhase::VerifyInstallation);
    super::apply_english_with_host_probe(
        paths,
        host_probe,
        writer_guard,
        reporter,
        &mut verify_phase,
    )
}

#[test]
fn hostless_english_restore_requires_strong_current_ownership() {
    for host_error in [
        "host missing",
        "host version differs",
        "host identity unknown",
    ] {
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
        let status = profile_projection(&paths, None);
        assert!(status.native_english_restore_available);

        let preferences_before = fs::read(paths.preferences()).unwrap();
        let strings_before = fs::read(paths.strings()).unwrap();
        let mut host_checks = 0;
        let payload = apply_english_with_host_probe(
            &paths,
            || {
                host_checks += 1;
                Err(host_error.into())
            },
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        );

        assert_eq!(
            host_checks, 1,
            "the read-only host check must precede fallback"
        );
        assert!(
            payload.ok,
            "owned profile restore should survive {host_error}"
        );
        assert!(payload.native_restore_only);
        let action = serde_json::to_value(&payload).unwrap();
        assert_eq!(action["nativeRestoreOnly"], true);
        assert!(action.get("warningCodes").is_none());
        let preferences: serde_json::Value =
            serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
        assert_eq!(preferences["locale"]["value"], "en-GB");
        assert_eq!(preferences["unrelated"]["value"], 37);
        assert_ne!(preferences_before, fs::read(paths.preferences()).unwrap());
        assert!(
            !paths.strings().exists(),
            "only the owned namespace is removed"
        );
        assert!(
            !paths.receipt().exists(),
            "committed restore consumes its receipt"
        );
        assert_ne!(
            strings_before,
            fs::read(paths.strings()).unwrap_or_default()
        );
    }
}

#[test]
fn hostless_restore_rejects_unowned_pending_corrupt_and_drifted_profiles_without_writes() {
    let (_temp, paths) = profile(Some("ja"));
    assert!(!profile_projection(&paths, None).native_english_restore_available);
    let before = fs::read(paths.preferences()).unwrap();
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host missing".into()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(
        !payload.ok,
        "a typed locale alone does not prove Switcher ownership"
    );
    assert!(!payload.native_restore_only);
    assert_eq!(fs::read(paths.preferences()).unwrap(), before);
    assert!(!paths.strings().exists());
    assert!(!paths.receipt().exists());

    let (_temp, paths) = profile(Some("en-GB"));
    fs::create_dir_all(paths.strings().parent().unwrap()).unwrap();
    fs::write(paths.strings(), b"unowned namespace residue").unwrap();
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host missing".into()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(!payload.ok, "unreceipted strings cannot be claimed");
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert!(!paths.receipt().exists());

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
    assert!(matches!(
        user_language_files::read_profile_projection(&paths)
            .unwrap()
            .ownership,
        ReceiptObservation::Current { .. }
    ));
    let metadata = fs::metadata(paths.strings()).unwrap();
    let mut mode = metadata.permissions();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let original_mode = mode.mode() & 0o777;
        mode.set_mode(if original_mode == 0o600 { 0o644 } else { 0o600 });
    }
    fs::set_permissions(paths.strings(), mode).unwrap();
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let receipt_before = fs::read(paths.receipt()).unwrap();
    assert!(!profile_projection(&paths, None).native_english_restore_available);
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host upgraded".into()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(!payload.ok, "mode drift invalidates the saved postimage");
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), receipt_before);

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
    fs::write(paths.strings(), b"changed owned namespace").unwrap();
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let receipt_before = fs::read(paths.receipt()).unwrap();
    assert!(!profile_projection(&paths, None).native_english_restore_available);
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host missing".into()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(
        !payload.ok,
        "strings bytes drift invalidates the active postimage"
    );
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), receipt_before);

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
    let preferences: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    let mut changed = preferences;
    changed["locale"]["value"] = serde_json::Value::String("ja".into());
    fs::write(paths.preferences(), serde_json::to_vec(&changed).unwrap()).unwrap();
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let receipt_before = fs::read(paths.receipt()).unwrap();
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host unknown".into()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(!payload.ok, "typed locale drift cannot be overwritten");
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), receipt_before);

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
    assert!(user_language_files::apply_with_interrupt(
        &paths,
        "zh-Hans",
        &pack(),
        Some(user_language_files::InterruptAfter::ResourcePublish),
    )
    .is_err());
    assert!(!profile_projection(&paths, None).native_english_restore_available);
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let receipt_before = fs::read(paths.receipt()).unwrap();
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host unknown".into()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(!payload.ok, "pending is not a clean active postimage");
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), receipt_before);

    let (_temp, paths) = profile(Some("en-GB"));
    fs::create_dir_all(paths.receipt().parent().unwrap()).unwrap();
    fs::write(paths.receipt(), b"not a receipt").unwrap();
    assert!(!profile_projection(&paths, None).native_english_restore_available);
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let receipt_before = fs::read(paths.receipt()).unwrap();
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host missing".into()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(!payload.ok, "corrupt receipt cannot grant ownership");
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), receipt_before);
}

#[test]
fn writer_guard_precedes_hostless_admission_and_valid_host_keeps_existing_restore() {
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
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let receipt_before = fs::read(paths.receipt()).unwrap();
    let mut host_checks = 0;
    let payload = apply_english_with_host_probe(
        &paths,
        || {
            host_checks += 1;
            Err("host missing".into())
        },
        &mut || Err(WRITER_REFUSAL.into()),
        &super::super::contract::NoopReporter,
    );
    assert_eq!(
        host_checks, 0,
        "writer admission must precede host/profile work"
    );
    assert!(!payload.ok);
    assert_eq!(payload.error_code.as_deref(), Some("cavalryStillRunning"));
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), receipt_before);

    let (_temp, paths) = profile(Some("ja"));
    let payload = apply_english_with_host_probe(
        &paths,
        || Ok(()),
        &mut || Ok(()),
        &super::super::contract::NoopReporter,
    );
    assert!(
        payload.ok,
        "a verified host retains the existing no-receipt restore"
    );
    assert!(!payload.native_restore_only);
    let preferences: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    assert_eq!(preferences["locale"]["value"], "en-GB");
}

#[test]
fn receipt_change_after_initial_ownership_proof_cannot_authorize_hostless_restore() {
    // 缺失回执竞态：模拟第二次writer guard时，外部状态已撤走所有权证据。
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
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let mut guards = 0;
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host removed".into()),
        &mut || {
            guards += 1;
            if guards == 2 {
                fs::remove_file(paths.receipt()).map_err(|error| error.to_string())?;
            }
            Ok(())
        },
        &super::super::contract::NoopReporter,
    );
    assert_eq!(guards, 2);
    assert!(!payload.ok, "missing receipt after proof must fail closed");
    assert!(!payload.native_restore_only);
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert!(
        !paths.receipt().exists(),
        "the fixture's external change remains visible"
    );

    // Pending回执竞态：即使首个观察为Current，后续guard也不能把新pending恢复成授权。
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
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let active_receipt = fs::read(paths.receipt()).unwrap();
    assert!(user_language_files::apply_with_interrupt(
        &paths,
        "zh-Hans",
        &pack(),
        Some(user_language_files::InterruptAfter::ResourcePublish),
    )
    .is_err());
    let pending_receipt = fs::read(paths.receipt()).unwrap();
    assert!(matches!(
        user_language_files::read_profile_projection(&paths)
            .unwrap()
            .ownership,
        ReceiptObservation::Pending { .. }
    ));
    fs::write(paths.preferences(), &preferences_before).unwrap();
    fs::write(paths.strings(), &strings_before).unwrap();
    fs::write(paths.receipt(), &active_receipt).unwrap();

    let mut guards = 0;
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host unavailable".into()),
        &mut || {
            guards += 1;
            if guards == 2 {
                fs::write(paths.receipt(), &pending_receipt).map_err(|error| error.to_string())?;
            }
            Ok(())
        },
        &super::super::contract::NoopReporter,
    );
    assert_eq!(guards, 2);
    assert!(
        !payload.ok,
        "new pending journal cannot authorize restore-only"
    );
    assert!(!payload.native_restore_only);
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), pending_receipt);
}

#[test]
fn final_owned_restore_receipt_removal_fails_before_profile_write() {
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
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let mut guards = 0;
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host unavailable".into()),
        &mut || {
            guards += 1;
            if guards == 3 {
                fs::remove_file(paths.receipt()).map_err(|error| error.to_string())?;
            }
            Ok(())
        },
        &super::super::contract::NoopReporter,
    );

    assert!(
        !payload.ok,
        "the final receipt publish must compare its parsed preimage"
    );
    assert!(!payload.native_restore_only);
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert!(
        !paths.receipt().exists(),
        "do not recreate externally removed proof"
    );
}

#[test]
fn final_owned_restore_keeps_external_pending_receipt_and_profile_unchanged() {
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
    let preferences_before = fs::read(paths.preferences()).unwrap();
    let strings_before = fs::read(paths.strings()).unwrap();
    let active_receipt = fs::read(paths.receipt()).unwrap();
    assert!(user_language_files::apply_with_interrupt(
        &paths,
        "zh-Hans",
        &pack(),
        Some(user_language_files::InterruptAfter::ResourcePublish),
    )
    .is_err());
    let pending_receipt = fs::read(paths.receipt()).unwrap();
    fs::write(paths.preferences(), &preferences_before).unwrap();
    fs::write(paths.strings(), &strings_before).unwrap();
    fs::write(paths.receipt(), &active_receipt).unwrap();

    let mut guards = 0;
    let payload = apply_english_with_host_probe(
        &paths,
        || Err("host unavailable".into()),
        &mut || {
            guards += 1;
            if guards == 3 {
                fs::write(paths.receipt(), &pending_receipt).map_err(|error| error.to_string())?;
            }
            Ok(())
        },
        &super::super::contract::NoopReporter,
    );

    assert!(
        !payload.ok,
        "a changed pending journal must not be overwritten"
    );
    assert!(!payload.native_restore_only);
    assert_eq!(fs::read(paths.preferences()).unwrap(), preferences_before);
    assert_eq!(fs::read(paths.strings()).unwrap(), strings_before);
    assert_eq!(fs::read(paths.receipt()).unwrap(), pending_receipt);
}

#[test]
fn restore_only_outcome_skips_the_restart_command_gate() {
    let mut payload = ActionPayload::ok_lang("en", None);
    payload.native_restore_only = true;
    let mut launch_attempts = 0;
    if crate::commands::should_restart_after_apply(&payload, true) {
        launch_attempts += 1;
    }
    assert_eq!(
        launch_attempts, 0,
        "restore-only has no restart phase or runner call"
    );
    assert!(!crate::commands::should_restart_after_apply(
        &payload, false
    ));

    payload.native_restore_only = false;
    assert!(crate::commands::should_restart_after_apply(&payload, true));
    payload.reconciliation_required = true;
    assert!(!crate::commands::should_restart_after_apply(&payload, true));
}
