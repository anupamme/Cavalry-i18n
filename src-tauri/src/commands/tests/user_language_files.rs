/**
 * [INPUT]: 依赖 user_language_files 的临时 profile fixture、typed locale 投影与耐久回执。
 * [OUTPUT]: 验证回执事务/恢复与drift拒绝；计数合同锁定apply仅显式验证新pending回执一次。
 * [POS]: commands/tests 的 transaction recovery 合同；real tempfile staging 只做预发布乐观比较，不证明 OS 原子 CAS；不访问真实 Cavalry、IPC、安装 bundle 或 profile。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::commands::user_language_files::{
    self, CommitOutcome, InterruptAfter, ReceiptObservation, RecoveryOutcome, RestoreOutcome,
};
use serde_json::{json, Value};
use std::{cell::Cell, fs};
use tempfile::TempDir;

struct Fixture {
    _temp: TempDir,
    paths: user_language_files::UserLanguagePaths,
}

impl Fixture {
    fn new(preferences: Value, strings: Option<&[u8]>) -> Self {
        let temp = tempfile::tempdir().unwrap();
        fs::create_dir_all(temp.path().join("profile")).unwrap();
        fs::create_dir_all(temp.path().join("state")).unwrap();
        fs::write(
            temp.path().join("profile/preferences.json"),
            serde_json::to_vec_pretty(&preferences).unwrap(),
        )
        .unwrap();
        if let Some(bytes) = strings {
            let plugin_dir = temp.path().join("profile/Plugins/Cavalry-i18n");
            fs::create_dir_all(&plugin_dir).unwrap();
            fs::write(plugin_dir.join("strings.json"), bytes).unwrap();
        }
        let paths = user_language_files::fixture_paths(temp.path()).unwrap();
        Self { _temp: temp, paths }
    }

    fn preferences(&self) -> Value {
        serde_json::from_slice(&fs::read(self.paths.preferences()).unwrap()).unwrap()
    }

    fn strings(&self) -> Option<Vec<u8>> {
        fs::read(self.paths.strings()).ok()
    }
}

fn typed_locale(value: &str) -> Value {
    json!({"varType": "string", "value": value})
}

fn synthetic_pack(product_language: &str, text: &str) -> Vec<u8> {
    let native_locale = match product_language {
        "zh-Hans" => "zh-Hans",
        "zh-Hant" => "zh-Hant",
        "ja_JP" => "ja",
        unsupported => panic!("unsupported synthetic fixture language: {unsupported}"),
    };
    serde_json::to_vec(&json!([{
        "type": "strings",
        "language": native_locale,
        "value": {"fixture.key": {"UI-text": text}}
    }]))
    .unwrap()
}

#[test]
#[cfg(unix)]
fn apply_revalidates_only_the_new_pending_receipt_explicitly() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    let mut writer_guard = || Ok(());
    user_language_files::apply_with_writer_guard(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "first generation"),
        &mut writer_guard,
    )
    .unwrap();

    user_language_files::reset_apply_explicit_receipt_validation_count();
    user_language_files::apply_with_writer_guard(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "second generation"),
        &mut writer_guard,
    )
    .unwrap();

    assert_eq!(
        user_language_files::apply_explicit_receipt_validation_count(),
        1,
        "only the newly constructed pending receipt needs an explicit validation"
    );
}

#[test]
#[cfg(unix)]
fn compact_receipts_roundtrip_legacy_pretty_read_and_guarded_english_restore() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    let pack = synthetic_pack("zh-Hans", "compact receipt");
    user_language_files::apply(&fixture.paths, "zh-Hans", &pack).unwrap();

    let compact_bytes = fs::read(fixture.paths.receipt()).unwrap();
    assert!(!compact_bytes.contains(&b'\n'));
    let receipt: Value = serde_json::from_slice(&compact_bytes).unwrap();
    assert_eq!(receipt["schemaVersion"], json!(1));
    assert_eq!(receipt["active"]["image"]["strings"]["bytes"], json!(pack));
    let roundtrip = serde_json::to_vec(&receipt).unwrap();
    assert_eq!(
        serde_json::from_slice::<Value>(&roundtrip).unwrap(),
        receipt
    );

    let legacy_pretty_bytes = serde_json::to_vec_pretty(&receipt).unwrap();
    assert!(legacy_pretty_bytes.contains(&b'\n'));
    assert!(legacy_pretty_bytes.len() > compact_bytes.len());
    fs::write(fixture.paths.receipt(), &legacy_pretty_bytes).unwrap();

    let projection = user_language_files::read_profile_projection(&fixture.paths).unwrap();
    assert!(matches!(
        projection.ownership,
        ReceiptObservation::Current { language, .. } if language == "zh-Hans"
    ));
    assert_eq!(
        fs::read(fixture.paths.receipt()).unwrap(),
        legacy_pretty_bytes
    );
    assert_eq!(
        serde_json::from_slice::<Value>(&fs::read(fixture.paths.receipt()).unwrap()).unwrap(),
        receipt
    );

    let receipt_path = fixture.paths.receipt().to_path_buf();
    let pending_observations = Cell::new(0);
    let mut writer_guard = || {
        if let Ok(bytes) = fs::read(&receipt_path) {
            let published: Value = serde_json::from_slice(&bytes).unwrap();
            if !published["pending"].is_null() {
                assert!(!bytes.contains(&b'\n'));
                assert_eq!(published["pending"]["action"], json!("restoreEnglish"));
                pending_observations.set(pending_observations.get() + 1);
            }
        }
        Ok(())
    };

    assert_eq!(
        user_language_files::restore_owned_english_with_writer_guard(
            &fixture.paths,
            &mut writer_guard,
        )
        .unwrap(),
        RestoreOutcome::Restored
    );
    assert!(
        pending_observations.get() > 0,
        "writer guard must observe the published compact pending receipt"
    );
    assert_eq!(fixture.preferences()["locale"], typed_locale("en-GB"));
    assert_eq!(fixture.strings(), None);
    assert!(!fixture.paths.receipt().exists());
}

#[test]
#[cfg(unix)]
fn rollback_restores_absent_locale_and_absent_resource_exactly() {
    let original_preferences = json!({"workspace": {"name": "keep"}});
    let fixture = Fixture::new(original_preferences.clone(), None);
    let plugin_dir = fixture.paths.strings().parent().unwrap().to_path_buf();
    let resource = synthetic_pack("zh-Hant", "native language pack");

    user_language_files::apply(&fixture.paths, "zh-Hant", &resource).unwrap();
    assert_eq!(fixture.preferences()["locale"], typed_locale("zh-Hant"));
    assert_eq!(fixture.strings().as_deref(), Some(resource.as_slice()));

    assert_eq!(
        user_language_files::rollback(&fixture.paths).unwrap(),
        RestoreOutcome::Restored
    );
    assert_eq!(fixture.preferences(), original_preferences);
    assert_eq!(fixture.strings(), None);
    assert!(
        !plugin_dir.exists(),
        "only the transaction-created empty leaf is removed"
    );
    assert!(!fixture.paths.receipt().exists());
}

#[test]
#[cfg(unix)]
fn restore_english_is_fixed_en_gb_and_restores_only_owned_resource_state() {
    let original_locale = json!({
        "varType": "string",
        "value": "fr-FR",
        "vendorMetadata": {"keep": "yes"}
    });
    let fixture = Fixture::new(
        json!({"locale": original_locale, "workspace": {"keep": 7}}),
        None,
    );
    user_language_files::apply(
        &fixture.paths,
        "ja_JP",
        &synthetic_pack("ja_JP", "translated"),
    )
    .unwrap();

    assert_eq!(
        user_language_files::restore_english(&fixture.paths).unwrap(),
        RestoreOutcome::Restored
    );
    assert_eq!(
        fixture.preferences()["locale"],
        json!({
            "varType": "string",
            "value": "en-GB",
            "vendorMetadata": {"keep": "yes"}
        })
    );
    assert_eq!(fixture.preferences()["workspace"]["keep"], 7);
    assert_eq!(fixture.strings(), None);
    assert!(!fixture.paths.receipt().exists());
}

#[test]
fn restore_english_without_receipt_sets_fixed_locale_when_namespace_is_absent() {
    let original = json!({
        "locale": typed_locale("pt-BR"),
        "workspace": {"keep": ["exact", 9]}
    });
    let fixture = Fixture::new(original, None);

    assert_eq!(
        user_language_files::restore_english(&fixture.paths).unwrap(),
        RestoreOutcome::Restored
    );
    assert_eq!(fixture.preferences()["locale"], typed_locale("en-GB"));
    assert_eq!(
        fixture.preferences()["workspace"],
        json!({"keep": ["exact", 9]})
    );
    assert_eq!(fixture.strings(), None);
    assert!(!fixture.paths.receipt().exists());
}

#[test]
fn restore_english_without_receipt_refuses_unowned_namespace_resource() {
    let original = json!({"locale": typed_locale("pt-BR"), "keep": true});
    let external_resource = b"not proven to belong to the Switcher";
    let fixture = Fixture::new(original.clone(), Some(external_resource));
    let preferences_before = fs::read(fixture.paths.preferences()).unwrap();

    assert!(user_language_files::restore_english(&fixture.paths).is_err());
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(
        fixture.strings().as_deref(),
        Some(external_resource.as_slice())
    );
    assert!(!fixture.paths.receipt().exists());
}

#[test]
fn first_apply_refuses_unowned_namespace_resource() {
    let original = json!({"locale": typed_locale("en-GB"), "keep": true});
    let external_resource = b"existing namespace file without ownership receipt";
    let fixture = Fixture::new(original.clone(), Some(external_resource));
    let preferences_before = fs::read(fixture.paths.preferences()).unwrap();

    assert!(user_language_files::apply(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "new pack")
    )
    .is_err());
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(
        fixture.strings().as_deref(),
        Some(external_resource.as_slice())
    );
    assert!(!fixture.paths.receipt().exists());
}

#[test]
fn apply_rejects_non_single_strings_pack_and_foreign_native_locale() {
    let invalid_packs: [&[u8]; 5] = [
        b"not JSON",
        br#"[{"type":"strings","language":"ja","value":{"key":{"UI-text":"text"}}}]"#,
        br#"[{"type":"nodeStrings","language":"zh-Hans","value":{"key":{"UI-text":"text"}}}]"#,
        br#"[{"type":"strings","language":"zh-Hans","value":{"key":{"UI-text":"text","notes":[]}}}]"#,
        br#"[{"type":"strings","language":"zh-Hans","value":{"key":{"UI-text":"text"}}},{"type":"strings","language":"zh-Hans","value":{"other":{"UI-text":"text"}}}]"#,
    ];
    for pack in invalid_packs {
        let original = json!({"locale": typed_locale("en-GB"), "keep": true});
        let fixture = Fixture::new(original.clone(), None);
        let preferences_before = fs::read(fixture.paths.preferences()).unwrap();

        assert!(user_language_files::apply(&fixture.paths, "zh-Hans", pack).is_err());
        assert_eq!(
            fs::read(fixture.paths.preferences()).unwrap(),
            preferences_before
        );
        assert_eq!(fixture.strings(), None);
        assert!(!fixture.paths.receipt().exists());
    }
}

#[test]
#[cfg(unix)]
fn locale_or_strings_drift_aborts_restore_without_partially_reverting_the_other_file() {
    for drift_locale in [true, false] {
        let fixture = Fixture::new(
            json!({"locale": typed_locale("fr-FR"), "workspace": {"keep": true}}),
            None,
        );
        user_language_files::apply(
            &fixture.paths,
            "zh-Hans",
            &synthetic_pack("zh-Hans", "owned pack"),
        )
        .unwrap();
        if drift_locale {
            let mut preferences = fixture.preferences();
            preferences["locale"]["value"] = json!("ja-JP");
            fs::write(
                fixture.paths.preferences(),
                serde_json::to_vec_pretty(&preferences).unwrap(),
            )
            .unwrap();
        } else {
            fs::write(fixture.paths.strings(), b"user's later edit").unwrap();
        }
        let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
        let strings_before = fixture.strings();

        assert!(user_language_files::rollback(&fixture.paths).is_err());
        assert_eq!(
            fs::read(fixture.paths.preferences()).unwrap(),
            preferences_before
        );
        assert_eq!(fixture.strings(), strings_before);
        assert!(
            fixture.paths.receipt().exists(),
            "conflict evidence remains available"
        );
    }
}

#[test]
#[cfg(unix)]
fn active_receipt_language_must_match_its_typed_locale_postimage() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    user_language_files::apply(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "owned pack"),
    )
    .unwrap();
    let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
    let strings_before = fixture.strings();
    let mut receipt: Value =
        serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
    receipt["active"]["language"] = json!("ja_JP");
    fs::write(
        fixture.paths.receipt(),
        serde_json::to_vec_pretty(&receipt).unwrap(),
    )
    .unwrap();
    let damaged_receipt = fs::read(fixture.paths.receipt()).unwrap();

    assert!(user_language_files::recover_interrupted(&fixture.paths).is_err());
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(fixture.strings(), strings_before);
    assert_eq!(fs::read(fixture.paths.receipt()).unwrap(), damaged_receipt);
}

#[test]
#[cfg(unix)]
fn mismatched_pending_language_is_rejected_before_locale_or_receipt_write() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    user_language_files::apply_with_interrupt(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "owned pack"),
        Some(InterruptAfter::ResourcePublish),
    )
    .unwrap_err();
    let mut receipt: Value =
        serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
    receipt["pending"]["language"] = json!("ja_JP");
    fs::write(
        fixture.paths.receipt(),
        serde_json::to_vec_pretty(&receipt).unwrap(),
    )
    .unwrap();
    let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
    let strings_before = fixture.strings();
    let damaged_receipt = fs::read(fixture.paths.receipt()).unwrap();

    assert!(user_language_files::recover_interrupted(&fixture.paths).is_err());
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(fixture.strings(), strings_before);
    assert_eq!(fs::read(fixture.paths.receipt()).unwrap(), damaged_receipt);
}

#[test]
#[cfg(unix)]
fn malformed_restore_action_is_rejected_without_replaying_its_after_image() {
    let fixture = Fixture::new(json!({"locale": typed_locale("fr-FR")}), None);
    user_language_files::apply(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "owned pack"),
    )
    .unwrap();
    let mut receipt: Value =
        serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
    let active = receipt["active"]["image"].clone();
    let preimage = receipt["preimage"].clone();
    receipt["pending"] = json!({
        "action": "restoreEnglish",
        "before": active,
        "after": preimage
    });
    fs::write(
        fixture.paths.receipt(),
        serde_json::to_vec_pretty(&receipt).unwrap(),
    )
    .unwrap();
    let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
    let strings_before = fixture.strings();
    let damaged_receipt = fs::read(fixture.paths.receipt()).unwrap();

    assert!(user_language_files::recover_interrupted(&fixture.paths).is_err());
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(fixture.strings(), strings_before);
    assert_eq!(fs::read(fixture.paths.receipt()).unwrap(), damaged_receipt);
}

#[test]
#[cfg(unix)]
fn restore_recovery_rejects_mid_transaction_locale_or_strings_drift_before_any_write() {
    for drift_locale in [true, false] {
        let fixture = Fixture::new(
            json!({"locale": typed_locale("fr-FR"), "workspace": {"keep": true}}),
            None,
        );
        user_language_files::apply(
            &fixture.paths,
            "zh-Hans",
            &synthetic_pack("zh-Hans", "owned pack"),
        )
        .unwrap();
        let mut receipt: Value =
            serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
        let active = receipt["active"]["image"].clone();
        let preimage = receipt["preimage"].clone();
        receipt["pending"] = json!({
            "action": "rollback",
            "before": active,
            "after": preimage
        });
        fs::write(
            fixture.paths.receipt(),
            serde_json::to_vec_pretty(&receipt).unwrap(),
        )
        .unwrap();

        // 模拟回滚已发布语言文件、尚未提交 locale 的持久化中间态。
        fs::remove_file(fixture.paths.strings()).unwrap();
        if drift_locale {
            let mut preferences = fixture.preferences();
            preferences["locale"]["value"] = json!("ja-JP");
            fs::write(
                fixture.paths.preferences(),
                serde_json::to_vec_pretty(&preferences).unwrap(),
            )
            .unwrap();
        } else {
            fs::write(fixture.paths.strings(), b"user edited during recovery").unwrap();
        }
        let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
        let strings_before = fixture.strings();
        let pending_receipt_before = fs::read(fixture.paths.receipt()).unwrap();

        assert!(user_language_files::recover_interrupted(&fixture.paths).is_err());
        assert_eq!(
            fs::read(fixture.paths.preferences()).unwrap(),
            preferences_before
        );
        assert_eq!(fixture.strings(), strings_before);
        assert_eq!(
            fs::read(fixture.paths.receipt()).unwrap(),
            pending_receipt_before
        );
    }
}

#[test]
#[cfg(unix)]
fn directory_creation_intent_is_durable_before_mkdir_and_rollback_removes_only_owned_paths() {
    let original = json!({"locale": typed_locale("fr-FR")});
    for interrupt in [
        InterruptAfter::DirectoryIntent,
        InterruptAfter::DirectoryCreate,
    ] {
        let fixture = Fixture::new(original.clone(), None);

        assert!(user_language_files::apply_with_interrupt(
            &fixture.paths,
            "zh-Hans",
            &synthetic_pack("zh-Hans", "owned pack"),
            Some(interrupt),
        )
        .is_err());

        let receipt: Value =
            serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
        assert_eq!(
            receipt["createdDirectories"],
            json!(["profile/Plugins", "profile/Plugins/Cavalry-i18n"]),
            "both absent directory paths must be durable before the first mkdir"
        );
        assert_eq!(fixture.preferences(), original);
        assert_eq!(fixture.strings(), None);
        let plugins = fixture.paths.strings().parent().unwrap().parent().unwrap();
        assert_eq!(
            plugins.exists(),
            interrupt == InterruptAfter::DirectoryCreate,
            "the second fault point occurs after only the first directory was created"
        );
        assert!(!fixture.paths.strings().parent().unwrap().exists());
        #[cfg(unix)]
        if interrupt == InterruptAfter::DirectoryCreate {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&plugins, fs::Permissions::from_mode(0o777)).unwrap();
        }

        user_language_files::recover_interrupted(&fixture.paths).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            for path in [plugins, fixture.paths.strings().parent().unwrap()] {
                assert_eq!(
                    fs::metadata(path).unwrap().permissions().mode() & 0o777,
                    0o700,
                    "recovery restores private mode on receipt-owned directories"
                );
            }
        }
        assert_eq!(
            user_language_files::rollback(&fixture.paths).unwrap(),
            RestoreOutcome::Restored
        );
        assert_eq!(fixture.preferences(), original);
        assert_eq!(fixture.strings(), None);
        assert!(!fixture.paths.strings().parent().unwrap().exists());
        assert!(!plugins.exists());
    }
}

#[cfg(unix)]
#[test]
fn pending_recovery_warning_is_not_dropped_or_reported_as_nothing_to_restore() {
    let original = json!({"locale": typed_locale("fr-FR")});
    let fixture = Fixture::new(original.clone(), None);
    assert!(matches!(
        user_language_files::apply_with_interrupt(
            &fixture.paths,
            "zh-Hans",
            &synthetic_pack("zh-Hans", "owned pack"),
            Some(InterruptAfter::RecoveryWarning),
        )
        .unwrap(),
        CommitOutcome::PendingWithWarning(_)
    ));
    let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
    let strings_before = fixture.strings();
    let pending_receipt_before = fs::read(fixture.paths.receipt()).unwrap();

    let restore_error = user_language_files::rollback_with_recovery_warning(&fixture.paths)
        .expect_err("a still-pending first apply is not an empty restore");
    assert!(
        restore_error.contains("unproven durability"),
        "{restore_error}"
    );
    assert!(restore_error.contains("remains pending"), "{restore_error}");
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(fixture.strings(), strings_before);
    assert_eq!(
        fs::read(fixture.paths.receipt()).unwrap(),
        pending_receipt_before
    );

    let apply_error = user_language_files::apply_with_interrupt(
        &fixture.paths,
        "ja_JP",
        &synthetic_pack("ja_JP", "new pack must not publish"),
        Some(InterruptAfter::RecoveryWarning),
    )
    .expect_err("a new apply must not be stacked on unresolved recovery");
    assert!(apply_error.contains("unproven durability"), "{apply_error}");
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        preferences_before
    );
    assert_eq!(fixture.strings(), strings_before);
    assert_eq!(
        fs::read(fixture.paths.receipt()).unwrap(),
        pending_receipt_before
    );
}

#[test]
fn non_file_receipt_target_or_parent_fails_before_fixture_mutation() {
    for block_parent in [false, true] {
        let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
        let state_dir = fixture._temp.path().join("state");
        if block_parent {
            fs::remove_dir(&state_dir).unwrap();
            fs::write(&state_dir, b"not a directory").unwrap();
        } else {
            fs::create_dir(fixture.paths.receipt()).unwrap();
        }
        let preferences_before = fs::read(fixture.paths.preferences()).unwrap();

        assert!(user_language_files::apply(
            &fixture.paths,
            "zh-Hans",
            &synthetic_pack("zh-Hans", "owned pack")
        )
        .is_err());
        assert_eq!(
            fs::read(fixture.paths.preferences()).unwrap(),
            preferences_before
        );
        assert_eq!(fixture.strings(), None);
    }
}

#[cfg(windows)]
#[test]
fn windows_fixture_fails_closed_when_directory_durability_is_unproven() {
    let original = json!({"locale": typed_locale("en-GB")});
    let fixture = Fixture::new(original.clone(), None);

    let error = user_language_files::apply(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "owned pack"),
    )
    .expect_err("Windows directory durability is not claimed by this fixture adapter");

    assert!(error.contains("durability is unproven"), "{error}");
    assert_eq!(fixture.preferences(), original);
    assert_eq!(fixture.strings(), None);
    if fixture.paths.receipt().is_file() {
        let receipt: Value =
            serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
        assert_eq!(receipt["pending"]["action"], json!("apply"));
        assert!(receipt.get("active").is_none());
    }
}

#[test]
fn staged_preferences_publish_preserves_unrelated_workspace_edit() {
    use user_language_files::storage::{
        publish_fixture_write, read_regular_image, stage_fixture_write,
    };
    use user_language_files::FileImage;

    let fixture = Fixture::new(
        json!({"locale": typed_locale("en-GB"), "workspace": {"theme": "dark"}}),
        None,
    );
    let before = read_regular_image(
        &fixture.paths,
        fixture.paths.preferences(),
        "Cavalry Preferences",
    )
    .unwrap();
    let mut desired_json: Value = serde_json::from_slice(&before.bytes).unwrap();
    desired_json["locale"]["value"] = json!("zh-Hans");
    let desired = FileImage {
        bytes: serde_json::to_vec_pretty(&desired_json).unwrap(),
        mode: before.mode,
    };
    let staged = stage_fixture_write(
        &fixture.paths,
        fixture.paths.preferences(),
        Some(&before),
        &desired,
    )
    .unwrap();

    let mut externally_updated = fixture.preferences();
    externally_updated["workspace"]["theme"] = json!("light");
    let external_bytes = serde_json::to_vec_pretty(&externally_updated).unwrap();
    fs::write(fixture.paths.preferences(), &external_bytes).unwrap();

    assert!(publish_fixture_write(&fixture.paths, staged).is_err());
    assert_eq!(
        fs::read(fixture.paths.preferences()).unwrap(),
        external_bytes
    );
    assert_eq!(fixture.preferences()["locale"], typed_locale("en-GB"));
    assert_eq!(fixture.preferences()["workspace"]["theme"], json!("light"));
    assert!(
        fs::read_dir(fixture.paths.preferences().parent().unwrap())
            .unwrap()
            .all(|entry| !entry
                .unwrap()
                .file_name()
                .to_string_lossy()
                .starts_with(".cavalry-i18n-user-language-")),
        "a rejected staged publish removes its temporary file"
    );
}

#[test]
fn staged_strings_publish_preserves_file_changed_after_preimage_check() {
    use user_language_files::storage::{
        publish_fixture_write, read_regular_image, stage_fixture_write,
    };
    use user_language_files::FileImage;

    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), Some(b"before"));
    let before =
        read_regular_image(&fixture.paths, fixture.paths.strings(), "strings.json").unwrap();
    let desired = FileImage {
        bytes: b"switcher pack".to_vec(),
        mode: before.mode,
    };
    let staged = stage_fixture_write(
        &fixture.paths,
        fixture.paths.strings(),
        Some(&before),
        &desired,
    )
    .unwrap();
    fs::write(fixture.paths.strings(), b"user edit after staging").unwrap();
    let external_bytes = fixture.strings().unwrap();

    assert!(publish_fixture_write(&fixture.paths, staged).is_err());
    assert_eq!(
        fixture.strings().as_deref(),
        Some(external_bytes.as_slice())
    );
}

#[test]
#[cfg(unix)]
fn rollback_removes_only_transaction_created_empty_directories() {
    #[cfg(unix)]
    use std::os::unix::fs::PermissionsExt;

    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    let plugins = fixture.paths.strings().parent().unwrap().parent().unwrap();
    fs::create_dir_all(plugins.join("SiblingPlugin")).unwrap();
    fs::write(plugins.join("SiblingPlugin/strings.json"), b"sibling").unwrap();
    #[cfg(unix)]
    let plugins_mode = fs::metadata(plugins).unwrap().permissions().mode() & 0o7777;

    user_language_files::apply(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "owned"),
    )
    .unwrap();
    let receipt: Value =
        serde_json::from_slice(&fs::read(fixture.paths.receipt()).unwrap()).unwrap();
    assert_eq!(
        receipt["createdDirectories"],
        json!(["profile/Plugins/Cavalry-i18n"]),
        "the pre-existing Plugins directory is never claimed for cleanup"
    );
    user_language_files::rollback(&fixture.paths).unwrap();

    assert!(!fixture.paths.strings().parent().unwrap().exists());
    assert_eq!(
        fs::read(plugins.join("SiblingPlugin/strings.json")).unwrap(),
        b"sibling"
    );
    assert!(plugins.is_dir());
    #[cfg(unix)]
    assert_eq!(
        fs::metadata(plugins).unwrap().permissions().mode() & 0o7777,
        plugins_mode,
        "pre-existing parent permissions are never changed"
    );
}

#[cfg(unix)]
#[test]
fn symlinked_switcher_directory_is_rejected_without_touching_its_target() {
    use std::os::unix::fs::symlink;

    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    let outside = fixture._temp.path().join("outside");
    fs::create_dir(&outside).unwrap();
    fs::write(outside.join("strings.json"), b"do not touch").unwrap();
    let plugins = fixture.paths.strings().parent().unwrap().parent().unwrap();
    fs::create_dir_all(plugins).unwrap();
    symlink(&outside, fixture.paths.strings().parent().unwrap()).unwrap();

    assert!(user_language_files::apply(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "overwrite")
    )
    .is_err());
    assert_eq!(
        fs::read(outside.join("strings.json")).unwrap(),
        b"do not touch"
    );
    assert_eq!(fixture.preferences()["locale"], typed_locale("en-GB"));
}

#[test]
#[cfg(unix)]
fn interruption_after_locale_publish_is_finalized_from_the_persisted_postimage() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    user_language_files::apply_with_interrupt(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "native pack"),
        Some(InterruptAfter::LocalePublish),
    )
    .unwrap_err();

    assert_eq!(fixture.preferences()["locale"], typed_locale("zh-Hans"));
    assert_eq!(
        user_language_files::recover_interrupted(&fixture.paths).unwrap(),
        RecoveryOutcome::Completed
    );
    assert_eq!(fixture.preferences()["locale"], typed_locale("zh-Hans"));
    assert_eq!(
        fixture.strings().as_deref(),
        Some(synthetic_pack("zh-Hans", "native pack").as_slice())
    );
    assert!(fixture.paths.receipt().exists());
}

#[test]
fn unsupported_languages_and_malformed_typed_locales_fail_before_any_write() {
    let malformed = json!({"locale": {"varType": "int", "value": 12}});
    for (preferences, language) in [
        (malformed, "zh-Hans"),
        (json!({"locale": typed_locale("en-GB")}), "xx"),
    ] {
        let fixture = Fixture::new(preferences.clone(), None);
        let before = fs::read(fixture.paths.preferences()).unwrap();
        assert!(user_language_files::apply(
            &fixture.paths,
            language,
            &synthetic_pack("zh-Hans", "pack")
        )
        .is_err());
        assert_eq!(fs::read(fixture.paths.preferences()).unwrap(), before);
        assert_eq!(fixture.strings(), None);
        assert!(!fixture.paths.receipt().exists());
    }
}

#[path = "user_language_files_production.rs"]
mod production_api;

#[path = "user_language_files_receipt_reuse.rs"]
mod receipt_reuse;
