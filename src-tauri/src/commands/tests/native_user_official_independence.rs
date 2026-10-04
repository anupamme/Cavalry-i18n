/**
 * [INPUT]: 依赖 native_user 的私有 profile/status纯投影、status shell、临时用户路径与隔离测试资源。
 * [OUTPUT]: 验证厂商来源 `official/unknown` 与 Absent/Known locale、资源可用性、pack状态分别投影，不触碰真实profile。
 * [POS]: commands/tests 的跨事实边界合同；签名结论由native_official独立测试，本文件证明来源字段不会覆写用户profile/资源事实。
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
    let resources = NativeResources {
        packs: [("zh-Hans".into(), resource_bytes)].into_iter().collect(),
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
        assert_eq!(official.installation_mode, "official");
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
