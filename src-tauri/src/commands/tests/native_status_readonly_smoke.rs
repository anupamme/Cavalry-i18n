/**
 * [INPUT]: 依赖status的真实native只读owner、编译审批资源、target绑定manifest与OS home路径；App/repo须人工选择，三语missing均先解析后推导coverage。
 * [OUTPUT]: 组合烟测以target原字节SHA、target源数及独立插件caption数验证诚实partial；保留实际用户文件与bundle，不创建测试state。
 * [POS]: status的测试子模块；使用真实codesign与生产profile读取，但临时缺失state只模拟首次运行，不代验Tauri AppHandle、WK、Apply或真实翻译UI；另有不读profile的manifest preflight合同。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{native_status_for_paths, AppPaths};
use crate::commands::{contract::NativeLocaleState, native_resources, user_language_files};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{fs, os::unix::fs::PermissionsExt, path::Path};

const PRODUCT_LANGUAGES: [&str; 3] = ["zh-Hans", "zh-Hant", "ja_JP"];
const TARGET_BYTES: &[u8] = include_bytes!("../../../../tools/cavalry_native_target.json");

#[derive(Debug, PartialEq, Eq)]
struct NativeManifestCoverage {
    source_keys: u64,
    missing_counts: [u64; 3],
    complete: bool,
}

fn native_manifest_coverage(
    manifest: &Value,
    target_bytes: &[u8],
) -> Result<NativeManifestCoverage, String> {
    let target: Value = serde_json::from_slice(target_bytes)
        .map_err(|error| format!("native target lock is invalid JSON: {error}"))?;
    let official_keys = target["nativeKeys"]
        .as_u64()
        .ok_or_else(|| "target official key count is not an unsigned integer".to_string())?;
    let supplemental_keys = target["supplementalKeys"]
        .as_u64()
        .ok_or_else(|| "target supplemental key count is not an unsigned integer".to_string())?;
    let source_keys = official_keys
        .checked_add(supplemental_keys)
        .and_then(|count| {
            count.checked_add(native_resources::PLUGIN_CAPTION_SUPPLEMENT_KEYS as u64)
        })
        .ok_or_else(|| "locked source key count overflowed".to_string())?;
    let expected_target_sha = format!("{:x}", Sha256::digest(target_bytes));
    if manifest["targetSha256"].as_str() != Some(expected_target_sha.as_str()) {
        return Err("resource manifest is not bound to the current target bytes".into());
    }
    let manifest_source_keys = manifest["nativeKeys"]
        .as_u64()
        .ok_or_else(|| "manifest source key count is not an unsigned integer".to_string())?;
    let manifest_supplemental_keys = manifest["supplementalKeys"]
        .as_u64()
        .ok_or_else(|| "manifest supplemental key count is not an unsigned integer".to_string())?;
    if manifest_source_keys != source_keys
        || manifest_supplemental_keys
            != supplemental_keys + native_resources::PLUGIN_CAPTION_SUPPLEMENT_KEYS as u64
        || manifest_source_keys.checked_sub(manifest_supplemental_keys) != Some(official_keys)
    {
        return Err("manifest official/supplemental source counts differ from the target".into());
    }
    let approved_keys = manifest["approvedUIKeys"]
        .as_u64()
        .ok_or_else(|| "approved UI key count is not an unsigned integer".to_string())?;
    if approved_keys == 0 || approved_keys > source_keys {
        return Err("approved UI key count is outside the locked source range".into());
    }

    // -- 先独立解析三语，再计算coverage，避免首语missing使all短路 ------
    let missing_values =
        PRODUCT_LANGUAGES.map(|language| manifest["packs"][language]["missing"].as_u64());
    let missing_counts = [
        missing_values[0]
            .ok_or_else(|| "zh-Hans missing count is not an unsigned integer".to_string())?,
        missing_values[1]
            .ok_or_else(|| "zh-Hant missing count is not an unsigned integer".to_string())?,
        missing_values[2]
            .ok_or_else(|| "ja_JP missing count is not an unsigned integer".to_string())?,
    ];
    if missing_counts.iter().any(|missing| *missing > source_keys) {
        return Err("a locale missing count exceeds the locked source count".into());
    }
    let complete = missing_counts.iter().all(|missing| *missing == 0);
    let claimed_complete = manifest["complete"]
        .as_bool()
        .ok_or_else(|| "manifest complete flag is not a boolean".to_string())?;
    if claimed_complete != complete {
        return Err("manifest complete claim differs from all locale missing counts".into());
    }
    Ok(NativeManifestCoverage {
        source_keys,
        missing_counts,
        complete,
    })
}

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
fn native_manifest_preflight_accepts_partial_and_parses_all_missing_counts() {
    let target: Value = serde_json::from_slice(TARGET_BYTES).unwrap();
    let official_keys = target["nativeKeys"].as_u64().unwrap();
    let supplemental_keys = target["supplementalKeys"].as_u64().unwrap();
    let source_keys = official_keys
        .checked_add(supplemental_keys)
        .and_then(|count| {
            count.checked_add(native_resources::PLUGIN_CAPTION_SUPPLEMENT_KEYS as u64)
        })
        .unwrap();
    let mut manifest = serde_json::json!({
        "targetSha256": format!("{:x}", Sha256::digest(TARGET_BYTES)),
        "nativeKeys": source_keys,
        "supplementalKeys": supplemental_keys + native_resources::PLUGIN_CAPTION_SUPPLEMENT_KEYS as u64,
        "approvedUIKeys": source_keys - 1,
        "complete": false,
        "packs": {
            "zh-Hans": {"missing": 1},
            "zh-Hant": {"missing": 1},
            "ja_JP": {"missing": 1}
        }
    });
    let coverage = native_manifest_coverage(&manifest, TARGET_BYTES).unwrap();
    assert_eq!(coverage.source_keys, source_keys);
    assert_eq!(coverage.missing_counts, [1, 1, 1]);
    assert!(!coverage.complete);

    let mut false_complete = manifest.clone();
    false_complete["complete"] = serde_json::json!(true);
    assert!(native_manifest_coverage(&false_complete, TARGET_BYTES)
        .unwrap_err()
        .contains("complete claim"));

    // Hans缺口会令错误的all闭包立即为false；后两语仍必须先完成类型验证。
    manifest["packs"]["zh-Hant"]["missing"] = serde_json::json!("1");
    assert!(native_manifest_coverage(&manifest, TARGET_BYTES)
        .unwrap_err()
        .contains("zh-Hant missing"));
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
    // -- 当前target绑定与coverage独立核验；资源可用不等于完整 -------
    let manifest_path = repo.join("src-tauri/target/native-language-packs/manifest.json");
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(&manifest_path).unwrap()).unwrap();
    let _coverage = native_manifest_coverage(&manifest, TARGET_BYTES)
        .expect("manifest must match current target and honestly derived three-language coverage");
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
