/**
 * [INPUT]: 依赖显式锁定的2.8原厂App、native-preview资源、OS用户profile与state；通过native_user生产owner和operation_lock执行。
 * [OUTPUT]: 提供默认ignored、一次只写一个明确语言的实际profile smoke；验证完整pack、receipt/pack SHA、固定English恢复、非locale偏好语义/mode及六个vendor文件零漂移。
 * [POS]: commands/tests 的真实用户文件动作合同；直接调用apply_inner，不经过会自动restart的公开command，不启动Cavalry、不声称真实UI切换已验证。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{apply_inner, profile_projection};
use crate::commands::{
    contract::NoopReporter,
    native_resources,
    user_language_files::{self, LocaleObservation, ReceiptObservation, UserLanguagePaths},
};
use sha2::{Digest, Sha256};
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
};

const APP_ENV: &str = "CAVALRY_I18N_NATIVE_APPLY_SMOKE_APP";
const REPO_ENV: &str = "CAVALRY_I18N_NATIVE_APPLY_SMOKE_REPO";
const STATE_ENV: &str = "CAVALRY_I18N_NATIVE_APPLY_SMOKE_STATE_DIR";
const LANGUAGE_ENV: &str = "CAVALRY_I18N_NATIVE_APPLY_SMOKE_LANGUAGE";
const VENDOR_FILES: [&str; 6] = [
    "Contents/Info.plist",
    "Contents/_CodeSignature/CodeResources",
    "Contents/MacOS/Cavalry",
    "Contents/Frameworks/libApi.dylib",
    "Contents/Frameworks/libCore.dylib",
    "Contents/Frameworks/QtCore.framework/Versions/A/QtCore",
];
const PRODUCT_LANGUAGES: [&str; 3] = ["zh-Hans", "zh-Hant", "ja_JP"];

fn required_env_path(name: &str) -> PathBuf {
    PathBuf::from(std::env::var_os(name).unwrap_or_else(|| panic!("set {name} explicitly")))
}

fn file_image(path: &Path) -> Option<(String, u32)> {
    let metadata = match fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return None,
        Err(error) => panic!("cannot inspect smoke file: {error}"),
    };
    assert!(metadata.is_file() && !metadata.file_type().is_symlink());
    Some((
        format!("{:x}", Sha256::digest(fs::read(path).unwrap())),
        metadata.permissions().mode() & 0o7777,
    ))
}

fn required_file_image(path: &Path) -> (String, u32) {
    file_image(path).expect("expected regular file is missing")
}

fn pack_sha(resources: &native_resources::NativeResources, language: &str) -> String {
    format!(
        "{:x}",
        Sha256::digest(
            resources
                .packs
                .get(language)
                .expect("approved pack missing")
        )
    )
}

fn assert_no_preimage_strings(paths: &UserLanguagePaths) {
    let receipt: serde_json::Value = serde_json::from_slice(&fs::read(paths.receipt()).unwrap())
        .expect("current ownership receipt must be valid JSON");
    let preimage = receipt
        .get("preimage")
        .and_then(serde_json::Value::as_object)
        .expect("receipt lacks its original profile image");
    assert!(
        preimage
            .get("strings")
            .is_none_or(serde_json::Value::is_null),
        "English restoration is allowed only when the recorded original strings image was absent"
    );
}

fn assert_clean_language_action_input(
    paths: &UserLanguagePaths,
    resources: &native_resources::NativeResources,
    language: &str,
    locale: &LocaleObservation,
    ownership: &ReceiptObservation,
) {
    assert!(!matches!(locale, LocaleObservation::Unknown));
    match (ownership, language) {
        (ReceiptObservation::None, "en") => {
            panic!("English smoke requires an active Switcher-owned translated profile")
        }
        (ReceiptObservation::None, _) => {
            assert!(
                file_image(paths.receipt()).is_none(),
                "unexpected receipt bytes"
            );
            assert!(
                file_image(paths.strings()).is_none(),
                "refusing unowned strings data"
            );
        }
        (
            ReceiptObservation::Current {
                language: active_language,
                active_strings_sha256,
            },
            _,
        ) => {
            assert!(
                PRODUCT_LANGUAGES.contains(&active_language.as_str()),
                "owned profile is not a supported translated language"
            );
            assert_eq!(
                active_strings_sha256,
                &pack_sha(resources, active_language),
                "current receipt is not bound to the locked pack"
            );
            assert_no_preimage_strings(paths);
        }
        (ReceiptObservation::Drifted { .. }, _) | (ReceiptObservation::Pending { .. }, _) => {
            panic!("refusing drifted or pending profile; inspect and recover it manually first")
        }
    }
}

#[test]
#[ignore = "writes one explicit real Cavalry user-profile action; never runs automatically"]
fn native_profile_apply_smoke_performs_one_action_without_restart() {
    assert!(
        native_resources::preview_enabled(),
        "requires explicit native-preview compilation"
    );

    let app_input = required_env_path(APP_ENV);
    assert_eq!(app_input.as_path(), Path::new("/Applications/Cavalry.app"));
    let app = fs::canonicalize(app_input).expect("explicit Cavalry.app must exist");
    assert_eq!(app.as_path(), Path::new("/Applications/Cavalry.app"));

    let repo = fs::canonicalize(required_env_path(REPO_ENV)).expect("repo must exist");
    let compiled_repo = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("crate must be under repo")
        .canonicalize()
        .expect("compiled repo must exist");
    assert_eq!(
        repo, compiled_repo,
        "repo selection differs from this test binary"
    );

    let home = crate::privilege::current_user_home()
        .and_then(|path| fs::canonicalize(path).map_err(|error| error.to_string()))
        .expect("OS user home must resolve canonically");
    let expected_state = fs::canonicalize(home.join(
        "Library/Application Support/com.daftai.cavalry-i18n.native-preview/native-2.8-preview",
    ))
    .expect("fixed native-preview state directory must exist canonically");
    let state_dir = fs::canonicalize(required_env_path(STATE_ENV))
        .expect("actual native-preview state directory must already exist");
    assert_eq!(
        state_dir, expected_state,
        "state must be the fixed native-preview OS path"
    );

    let language = std::env::var(LANGUAGE_ENV).expect("select exactly one product language");
    assert!(
        language == "en" || PRODUCT_LANGUAGES.contains(&language.as_str()),
        "language must be exactly en, zh-Hans, zh-Hant, or ja_JP"
    );

    // -- 资源完整性与目标宿主均在profile写入之前闭合 --------------------
    let manifest_path = repo.join("src-tauri/target/native-language-packs/manifest.json");
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(&manifest_path).expect("locked preview manifest missing"))
            .expect("preview manifest must be valid JSON");
    assert_eq!(manifest["kind"], "development-preview");
    assert_eq!(manifest["complete"], true);
    assert_eq!(manifest["approvedUIKeys"], 10278);
    assert_eq!(manifest["nativeKeys"], 10473);
    for product_language in PRODUCT_LANGUAGES {
        assert_eq!(manifest["packs"][product_language]["missing"], 0);
    }
    let resources = native_resources::load_resources(&repo, &repo)
        .expect("all three packs must match the compiled resource approval");
    assert_eq!(resources.packs.len(), 3);
    native_resources::verify_host(&app).expect("selected host must match the 2.8 target lock");

    let vendor_paths = VENDOR_FILES.map(|relative| app.join(relative));
    let vendor_before = vendor_paths
        .iter()
        .map(|path| required_file_image(path))
        .collect::<Vec<_>>();
    let manifest_before = required_file_image(&manifest_path);
    let pack_paths = PRODUCT_LANGUAGES.map(|product_language| {
        repo.join("src-tauri/target/native-language-packs")
            .join(format!("{product_language}.json"))
    });
    let packs_before = pack_paths
        .iter()
        .map(|path| required_file_image(path))
        .collect::<Vec<_>>();

    // -- 复用command事务锁；锁文件是持久边界，不触碰diagnostics ---------
    let _operation_guard = crate::operation_lock::try_begin_bundle_operation(&state_dir)
        .expect("another Switcher operation owns the bundle lock");
    let paths = UserLanguagePaths::for_user_dirs(&home, &state_dir)
        .expect("fixed OS profile/state paths must be writable and canonical");
    let before = user_language_files::read_profile_projection(&paths)
        .expect("refusing unreadable or malformed user profile");
    if let Err(error) = crate::privilege::guard_all_cavalry_not_running() {
        panic!("Cavalry process admission failed before profile mutation: {error:?}");
    }
    assert_clean_language_action_input(
        &paths,
        &resources,
        &language,
        &before.locale,
        &before.ownership,
    );
    // -- 只比较语义与mode，保全locale之外的用户字段，不输出原文 ----------
    let mut preferences_before: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    preferences_before.as_object_mut().unwrap().remove("locale");
    let preferences_mode = required_file_image(paths.preferences()).1;
    let diagnostics_path = state_dir.join("diagnostics.jsonl");
    let diagnostics_before = file_image(&diagnostics_path);

    // -- 唯一写入入口；不调用公开apply_language，也不restart/rollback ----
    let outcome = apply_inner(&repo, &state_dir, &repo, &app, &language, NoopReporter);
    let vendor_after = vendor_paths
        .iter()
        .map(|path| required_file_image(path))
        .collect::<Vec<_>>();
    assert_eq!(
        vendor_after, vendor_before,
        "vendor bundle bytes/modes changed"
    );
    assert_eq!(required_file_image(&manifest_path), manifest_before);
    assert_eq!(
        pack_paths
            .iter()
            .map(|path| required_file_image(path))
            .collect::<Vec<_>>(),
        packs_before
    );
    assert_eq!(file_image(&diagnostics_path), diagnostics_before);

    let mut preferences_after: serde_json::Value =
        serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
    preferences_after.as_object_mut().unwrap().remove("locale");
    assert!(
        preferences_after == preferences_before,
        "unrelated Preferences fields changed"
    );
    assert_eq!(required_file_image(paths.preferences()).1, preferences_mode);

    let after = user_language_files::read_profile_projection(&paths)
        .expect("read resulting profile without attempting repair");
    if !outcome.ok || outcome.warning_code.is_some() || outcome.reconciliation_required {
        let state = match &after.ownership {
            ReceiptObservation::None => "none".to_string(),
            ReceiptObservation::Current {
                language,
                active_strings_sha256,
            } => {
                format!("current:{language}:{active_strings_sha256}")
            }
            ReceiptObservation::Drifted { language } => format!("drifted:{language}"),
            ReceiptObservation::Pending { language } => format!("pending:{language:?}"),
        };
        eprintln!("ACTION NOT CLEAN; no retry/rollback was attempted; outcomeCode={:?}; ownership={state}", outcome.error_code);
        panic!("manual native apply did not complete cleanly; inspect the profile before any next action");
    }

    let status = profile_projection(&paths, Some(&resources));
    if language == "en" {
        assert!(matches!(
            after.locale,
            LocaleObservation::Known {
                product_language: "en",
                native_locale: "en-GB"
            }
        ));
        assert_eq!(after.ownership, ReceiptObservation::None);
        assert!(
            file_image(paths.strings()).is_none(),
            "owned translated strings were not removed"
        );
        assert!(
            file_image(paths.receipt()).is_none(),
            "completed English restore left a receipt"
        );
        let preferences: serde_json::Value =
            serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
        assert_eq!(preferences["locale"]["varType"], "string");
        assert_eq!(preferences["locale"]["value"], "en-GB");
        assert_eq!(status.current_lang, "en");
        assert_eq!(status.patch_status, "notApplicable");
        assert!(!status.native_english_restore_available);
    } else {
        let expected_sha = pack_sha(&resources, &language);
        assert!(matches!(
            &after.locale,
            LocaleObservation::Known { product_language, .. } if *product_language == language.as_str()
        ));
        assert!(matches!(
            &after.ownership,
            ReceiptObservation::Current { language: active, active_strings_sha256 }
                if active == &language && active_strings_sha256 == &expected_sha
        ));
        assert_eq!(
            file_image(paths.strings()).map(|image| image.0),
            Some(expected_sha)
        );
        assert!(file_image(paths.receipt()).is_some());
        assert_eq!(status.current_lang, language);
        assert_eq!(status.patch_status, "current");
        assert!(status.native_english_restore_available);
    }
    assert!(!status.reconciliation_required);
    eprintln!(
        "PASS: one explicit native user-profile action; language={language}; current={}; vendor6/packs/manifest unchanged; diagnostics unchanged; no Cavalry launch or restart",
        status.current_lang
    );
}
