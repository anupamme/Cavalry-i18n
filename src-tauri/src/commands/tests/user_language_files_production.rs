/**
 * [INPUT]: 依赖父级 user_language_files tests 的 tempfile fixture、locale 与合成 native pack helper。
 * [OUTPUT]: 验证固定生产路径/只读 projection、typed permission 分类、合法资源约束与 writer guard 发布边界。
 * [POS]: commands/tests 的生产 API fixture 合同；不触碰真实 profile、Cavalry、IPC 或 app bundle。
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
