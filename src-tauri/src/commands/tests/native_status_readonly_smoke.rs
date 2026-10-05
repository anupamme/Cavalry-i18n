/**
 * [INPUT]: 依赖status的真实native只读owner、10481键编译审批资源和OS home路径；App/repo须人工选择，manifest另验官方10473/补充8，不从available推导。
 * [OUTPUT]: 提供默认忽略的跨来源/资源/profile组合烟测，仅验证当前原厂默认英语状态；保留实际用户文件与bundle的字节/模式，不创建测试state。
 * [POS]: status的测试子模块；使用真实codesign与生产profile读取，但临时缺失state只模拟首次运行，不代验Tauri AppHandle、WK、Apply或真实翻译UI。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{native_status_for_paths, AppPaths};
use crate::commands::{contract::NativeLocaleState, native_resources, user_language_files};
use sha2::{Digest, Sha256};
use std::{fs, os::unix::fs::PermissionsExt, path::Path};

fn file_image(path: &Path) -> Option<(String, u32)> {
    match fs::symlink_metadata(path) {
        Ok(metadata) => {
            assert!(metadata.is_file() && !metadata.file_type().is_symlink());
            Some((
                format!("{:x}", Sha256::digest(fs::read(path).unwrap())),
                metadata.permissions().mode() & 0o7777,
            ))
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
        Err(error) => panic!("Could not read smoke file identity: {error}"),
    }
}

#[test]
#[ignore = "requires explicit native preview build and a real factory-default vendor app/profile"]
fn native_default_official_status_reads_actual_profile_without_writes() {
    assert!(
        native_resources::preview_enabled(),
        "build the explicit native preview first"
    );
    let app = std::env::var_os("CAVALRY_I18N_NATIVE_STATUS_SMOKE_APP")
        .expect("explicitly select CAVALRY_I18N_NATIVE_STATUS_SMOKE_APP");
    let repo = std::env::var_os("CAVALRY_I18N_NATIVE_STATUS_SMOKE_REPO")
        .expect("explicitly select CAVALRY_I18N_NATIVE_STATUS_SMOKE_REPO");
    let app = fs::canonicalize(app).unwrap();
    let repo = fs::canonicalize(repo).unwrap();
    // available只表示可加载；完整冻结包必须有自己独立的分母与零缺口证明。
    let manifest_path = repo.join("src-tauri/target/native-language-packs/manifest.json");
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(&manifest_path).unwrap()).unwrap();
    assert_eq!(manifest["complete"], true);
    assert_eq!(manifest["approvedUIKeys"], 10286);
    assert_eq!(manifest["nativeKeys"], 10481);
    assert_eq!(manifest["supplementalKeys"], 8);
    assert_eq!(
        manifest["nativeKeys"].as_u64().unwrap() - manifest["supplementalKeys"].as_u64().unwrap(),
        10473
    );
    for language in ["zh-Hans", "zh-Hant", "ja_JP"] {
        assert_eq!(manifest["packs"][language]["missing"], 0);
    }
    let before_manifest = file_image(&manifest_path);
    let temporary = tempfile::tempdir().unwrap();
    // macOS的temp目录可经/var别名返回；先规范化测试根，不放宽生产路径门。
    let state_dir = fs::canonicalize(temporary.path())
        .unwrap()
        .join("uncreated-first-run-state");
    let home = crate::privilege::current_user_home().unwrap();
    let user_paths =
        user_language_files::UserLanguagePaths::for_user_dirs_read_only(&home, &state_dir).unwrap();
    let preferences: serde_json::Value =
        serde_json::from_slice(&fs::read(user_paths.preferences()).unwrap()).unwrap();
    assert!(
        preferences.as_object().unwrap().get("locale").is_none(),
        "this smoke requires a factory-default absent locale; never rewrites it"
    );
    assert!(
        !user_paths.strings().exists(),
        "this smoke does not take ownership of existing strings"
    );
    assert!(!state_dir.exists());

    // -- 只保存摘要/模式，不输出偏好、账号或用户输入 --------------------
    let watched = [
        "Contents/Info.plist",
        "Contents/_CodeSignature/CodeResources",
        "Contents/MacOS/Cavalry",
        "Contents/Frameworks/libApi.dylib",
        "Contents/Frameworks/libCore.dylib",
        "Contents/Frameworks/QtCore.framework/Versions/A/QtCore",
    ]
    .map(|relative| app.join(relative));
    let before_bundle = watched
        .iter()
        .map(|path| file_image(path))
        .collect::<Vec<_>>();
    let before_profile = [
        file_image(user_paths.preferences()),
        file_image(user_paths.strings()),
        file_image(user_paths.receipt()),
    ];
    let paths = AppPaths {
        resource_dir: repo.clone(),
        repo_root: repo,
        state_dir: state_dir.clone(),
    };
    let status = native_status_for_paths(&paths, vec![app.clone()]).unwrap();

    // -- 用同一次真实组合投影证明事实轴不串扰 --------------------------
    assert_eq!(status.app_path, app.to_string_lossy());
    assert_eq!(status.version, "2.8.0");
    assert_eq!(status.version_compatibility, "supported");
    assert_eq!(status.installation_mode, "official");
    assert_eq!(status.language_scope, "userProfile");
    assert_eq!(status.current_lang, "en");
    assert_eq!(status.native_locale_state, Some(NativeLocaleState::Unset));
    assert!(status.native_resource_available);
    assert_eq!(status.patch_status, "notApplicable");
    assert!(!status.native_english_restore_available);
    assert!(!status.official_recovery_available);
    assert!(!status.reconciliation_required);
    assert!(!state_dir.exists());
    assert_eq!(file_image(&manifest_path), before_manifest);
    assert_eq!(
        watched
            .iter()
            .map(|path| file_image(path))
            .collect::<Vec<_>>(),
        before_bundle
    );
    assert_eq!(
        [
            file_image(user_paths.preferences()),
            file_image(user_paths.strings()),
            file_image(user_paths.receipt()),
        ],
        before_profile
    );
    eprintln!("PASS: actual vendor + compiled packs + OS profile => official/en/unset/userProfile/resources available; unchanged watched files; no state created; no WK or Cavalry launch");
}
