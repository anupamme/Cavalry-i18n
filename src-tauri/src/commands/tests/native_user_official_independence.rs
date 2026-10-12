/**
 * [INPUT]: 依赖 native_user 的profile投影、approved digest map、status shell与临时用户路径。
 * [OUTPUT]: 验证Official来源与profile分离；digest新旧不改变恢复许可。
 * [POS]: commands/tests 的临时profile语义合同；签名由native_official独立测试，本文件不运行codesign、不读真实home，也不从徽章授予事务权限。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;
use serde_json::json;
use sha2::{Digest, Sha256};
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

#[test]
fn installation_source_does_not_overwrite_profile_locale_or_resource_projection() {
    let (unset_temp, unset_paths) = profile(None);
    let unset = profile_projection(&unset_paths, None);

    let (explicit_temp, explicit_paths) = profile(Some("en-GB"));
    let resource_bytes = pack();
    assert!(
        apply_profile(
            &explicit_paths,
            "zh-Hans",
            Some(&resource_bytes),
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        )
        .ok
    );
    let resources = NativeResourceDigests {
        packs: [(
            "zh-Hans".into(),
            format!("{:x}", Sha256::digest(resource_bytes)),
        )]
        .into_iter()
        .collect(),
    };
    let explicit = profile_projection(&explicit_paths, Some(&resources));

    let base_status = |root: &Path, installation_mode: &str| {
        let mut status = super::super::status::status_shell(root, root, Vec::new());
        status.version = "2.8.0".into();
        status.installation_mode = installation_mode.into();
        status
    };
    // `unknown`代表OS验签失败或结果不确定；验签由native_official负责，本fixture只证明投影互不覆盖。
    for (profile, resources_available, expected_lang, expected_locale, expected_patch) in [
        (
            &unset,
            false,
            "en",
            NativeLocaleState::Unset,
            "notApplicable",
        ),
        (
            &explicit,
            true,
            "zh-Hans",
            NativeLocaleState::Explicit,
            "current",
        ),
    ] {
        let official = project_profile_status(
            base_status(unset_temp.path(), "official"),
            profile,
            resources_available,
        );
        let unknown = project_profile_status(
            base_status(explicit_temp.path(), "unknown"),
            profile,
            resources_available,
        );
        for status in [&official, &unknown] {
            assert_eq!(status.current_lang, expected_lang);
            assert_eq!(status.native_locale_state, Some(expected_locale));
            assert_eq!(status.native_resource_available, resources_available);
            assert_eq!(status.patch_status, expected_patch);
            assert_eq!(status.language_scope, "userProfile");
        }
        assert_eq!(
            official.installation_mode,
            if expected_lang == "en" {
                "official"
            } else {
                "unknown"
            }
        );
        assert_eq!(unknown.installation_mode, "unknown");
        assert_eq!(
            official.native_resource_available,
            unknown.native_resource_available
        );
        assert_eq!(official.current_lang, unknown.current_lang);
        assert_eq!(official.native_locale_state, unknown.native_locale_state);
        assert_eq!(official.patch_status, unknown.patch_status);
    }
}

fn projected(paths: &UserLanguagePaths, vendor_origin: &str) -> StatusPayload {
    let root = paths.preferences().parent().unwrap();
    let mut status = super::super::status::status_shell(root, root, Vec::new());
    status.app_path = "/fixture/Cavalry.app".into();
    status.version = "2.8.0".into();
    status.installation_mode = vendor_origin.into();
    project_profile_status(status, &profile_projection(paths, None), false)
}

#[test]
fn builtin_english_and_vendor_japanese_can_be_official_without_preview_resources() {
    for locale in [None, Some("en-GB"), Some("ja")] {
        let (_temp, paths) = profile(locale);
        let status = projected(&paths, "official");
        assert_eq!(status.installation_mode, "official");
        assert!(!status.native_resource_available);
        assert!(!status.native_english_restore_available);
        assert_eq!(projected(&paths, "unknown").installation_mode, "unknown");
    }
}

#[test]
fn unowned_custom_or_unrecognized_language_and_external_strings_are_not_official() {
    for locale in [Some("zh-Hans"), Some("zh-Hant"), Some("private-locale")] {
        let (_temp, paths) = profile(locale);
        assert_eq!(projected(&paths, "official").installation_mode, "unknown");
    }
    for locale in [None, Some("en-GB"), Some("ja")] {
        let (_temp, paths) = profile(locale);
        fs::create_dir_all(paths.strings().parent().unwrap()).unwrap();
        fs::write(paths.strings(), pack()).unwrap();
        let status = projected(&paths, "official");
        assert_eq!(status.installation_mode, "unknown");
        assert!(status.reconciliation_required);
        assert!(!status.native_english_restore_available);
    }
}

#[test]
fn all_owned_languages_remain_nonofficial_when_resources_are_missing_or_updated() {
    for (language, native_locale) in [
        ("zh-Hans", "zh-Hans"),
        ("zh-Hant", "zh-Hant"),
        ("ja_JP", "ja"),
    ] {
        let (_temp, paths) = profile(None);
        let bytes = serde_json::to_vec(&json!([{"type":"strings","language":native_locale,"value":{"fixture":{"UI-text":"翻译"}}}])).unwrap();
        assert!(
            apply_profile(
                &paths,
                language,
                Some(&bytes),
                &mut || Ok(()),
                &super::super::contract::NoopReporter
            )
            .ok
        );
        let missing = projected(&paths, "official");
        assert_eq!(missing.installation_mode, "unknown");
        assert_eq!(missing.current_lang, language);
        assert!(missing.native_english_restore_available);
        assert!(!missing.reconciliation_required);
        let updated_bytes = bytes.iter().copied().chain([b' ']).collect::<Vec<_>>();
        let updated = NativeResourceDigests {
            packs: [(
                language.into(),
                format!("{:x}", Sha256::digest(updated_bytes)),
            )]
            .into_iter()
            .collect(),
        };
        let mut base = missing;
        base.installation_mode = "official".into();
        let updated =
            project_profile_status(base, &profile_projection(&paths, Some(&updated)), true);
        assert_eq!(updated.installation_mode, "unknown");
        assert_eq!(updated.patch_status, "updateAvailable");
        assert!(updated.native_english_restore_available);
    }
}

#[test]
fn drift_or_unreadable_profile_never_becomes_official_by_changing_locale_to_english() {
    let (_temp, paths) = profile(None);
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
    let mut preferences: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    preferences["locale"]["value"] = json!("en-GB");
    fs::write(
        paths.preferences(),
        serde_json::to_vec(&preferences).unwrap(),
    )
    .unwrap();
    let drift = projected(&paths, "official");
    assert_eq!(drift.current_lang, "en");
    assert_eq!(drift.installation_mode, "unknown");
    assert!(!drift.native_english_restore_available);
    fs::write(paths.preferences(), b"invalid").unwrap();
    let unreadable = projected(&paths, "official");
    assert_eq!(unreadable.current_lang, "unknown");
    assert_eq!(unreadable.installation_mode, "unknown");
}

#[test]
fn pending_and_corrupt_receipts_never_claim_official_even_with_default_english() {
    let (_temp, paths) = profile(None);
    let _ = user_language_files::apply_with_interrupt(
        &paths,
        "zh-Hans",
        &pack(),
        Some(user_language_files::InterruptAfter::ResourcePublish),
    );
    assert!(matches!(
        user_language_files::read_profile_projection(&paths)
            .unwrap()
            .ownership,
        ReceiptObservation::Pending { .. }
    ));
    let pending = projected(&paths, "official");
    assert_eq!(pending.current_lang, "en");
    assert_eq!(pending.installation_mode, "unknown");
    assert!(pending.reconciliation_required);
    assert!(!pending.native_english_restore_available);
    fs::write(paths.receipt(), b"invalid-receipt").unwrap();
    assert_eq!(projected(&paths, "official").installation_mode, "unknown");
}

#[test]
fn english_with_retained_runtime_owner_keeps_retry_without_hostless_authority() {
    let (_temp, paths) = profile(Some("en-GB"));
    let ordinary = project_runtime_recovery_hint(projected(&paths, "unknown"), false);
    assert!(!ordinary.reconciliation_required);
    let partial = project_runtime_recovery_hint(projected(&paths, "unknown"), true);
    assert!(partial.reconciliation_required);
    assert_eq!(partial.current_lang, "en");
    assert_eq!(partial.installation_mode, "unknown");
    assert!(!partial.native_english_restore_available);
    let (_temp, paths) = profile(Some("ja"));
    let japanese = project_runtime_recovery_hint(projected(&paths, "unknown"), true);
    assert_eq!(japanese.current_lang, "ja_JP");
    assert!(!japanese.reconciliation_required);
}
