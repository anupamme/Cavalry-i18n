/**
 * [INPUT]: 依赖编译期manifest、冻结target及插件caption1/隐藏schema gap1常量。
 * [OUTPUT]: 验证资源补充375/总键10848；target基线仍锁补充373。
 * [POS]: commands的资源边界；不写App、profile或状态。
 * manifest自报digest不作审批；target摘要供baseline source复用。
 * status逐字绑定manifest，只核三份regular文件和长度，不读payload。
 * apply只读所选pack并验长度与SHA，不解析JSON value。
 * NativeResources完整读取仅供既有tests/smoke；状态digest不授予apply写许可。
 * host只核Info/main；catalog/schema源锁在构建期，hook ABI由加载映像门验证。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::context::resource_candidates;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

const TARGET_BYTES: &[u8] = include_bytes!("../../../tools/cavalry_native_target.json");
const COMPILED_MANIFEST: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/native_preview_manifest.json"));
pub(crate) const NATIVE_VERSION: &str = "2.8.0";
pub(crate) const PLUGIN_CAPTION_SUPPLEMENT_KEYS: usize = 1;
pub(crate) const BACKGROUND_RENDERING_GAP_KEYS: usize = 1;
const LANGUAGES: [&str; 3] = ["zh-Hans", "zh-Hant", "ja_JP"];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Manifest {
    schema_version: u32,
    kind: String,
    cavalry_version: String,
    target_sha256: String,
    input_sha256: String,
    #[serde(rename = "approvedUIKeys")]
    approved_ui_keys: usize,
    native_keys: usize,
    supplemental_keys: usize,
    complete: bool,
    packs: BTreeMap<String, PackMetadata>,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct PackMetadata {
    file: String,
    native_locale: String,
    sha256: String,
    bytes: usize,
    reviewed: usize,
    preserved: usize,
    vendor: usize,
    missing: usize,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Target {
    schema_version: u32,
    qt_version: String,
    cavalry_version: String,
    bundle_id: String,
    executable: String,
    executable_sha256: String,
    native_keys: usize,
    supplemental_keys: usize,
    vendor_japanese_keys: usize,
    catalogs: Vec<CatalogLock>,
    runtime_files: Vec<RuntimeLock>,
    source_files: Vec<SourceFileLock>,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CatalogLock {
    source: String,
    source_sha256: String,
    japanese: String,
    japanese_sha256: String,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeLock {
    path: String,
    sha256: String,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SourceFileLock {
    path: String,
    sha256: String,
}
#[cfg(test)]
#[derive(Debug)]
pub(crate) struct NativeResources {
    pub(crate) packs: BTreeMap<String, Vec<u8>>,
}
#[derive(Debug)]
pub(crate) struct NativeResourceDigests {
    pub(crate) packs: BTreeMap<String, String>,
}
pub(crate) fn preview_enabled() -> bool {
    !COMPILED_MANIFEST.is_empty()
}
fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
pub(crate) fn baseline_target_sha256() -> String {
    hash(TARGET_BYTES)
}

fn target() -> Result<Target, String> {
    let target: Target = serde_json::from_slice(TARGET_BYTES).map_err(|e| e.to_string())?;
    let mut paths = target
        .runtime_files
        .iter()
        .map(|lock| lock.path.as_str())
        .collect::<Vec<_>>();
    paths.sort();
    if target.schema_version != 1
        || target.qt_version != "6.9.2"
        || target.cavalry_version != NATIVE_VERSION
        || target.bundle_id != "com.scenegroup.cavalry"
        || target.executable != "Contents/MacOS/Cavalry"
        || target.native_keys != 10473
        || target.supplemental_keys != 373
        || target.source_files.len() != 1
        || target.source_files[0].path != "Definitions/nodeDefinitions.json"
        || target.source_files[0].sha256
            != "96c7ffbda8d8244a111b3ad3e60fe530eb919fe9f93cbdf3577e2e29ca11d48f"
        || target.vendor_japanese_keys != 390
        || target.catalogs.len() != 17
        || paths
            != [
                "Contents/Frameworks/QtCore.framework/Versions/A/QtCore",
                "Contents/Frameworks/libApi.dylib",
                "Contents/Frameworks/libCore.dylib",
            ]
    {
        return Err("native target contract differs".into());
    }
    Ok(target)
}

// -- 资源读取不跟随任何路径链symlink；manifest固定于同一编译候选 -----
fn regular_metadata(path: &Path) -> Result<fs::Metadata, String> {
    let root = Path::new("/");
    let relative = path
        .strip_prefix(root)
        .map_err(|_| "native paths must be absolute")?;
    crate::install::validate_no_symlink_components(root, relative)?;
    let metadata = fs::symlink_metadata(path).map_err(|e| e.to_string())?;
    if !metadata.is_file() || metadata.file_type().is_symlink() {
        return Err("native resource is not a regular file".into());
    }
    Ok(metadata)
}
fn regular_bytes(path: &Path) -> Result<Vec<u8>, String> {
    regular_metadata(path)?;
    fs::read(path).map_err(|e| e.to_string())
}
fn regular_file_size(path: &Path) -> Result<u64, String> {
    Ok(regular_metadata(path)?.len())
}
fn approved_manifest_at(root: &Path, compiled: &[u8]) -> Result<Manifest, String> {
    if compiled.is_empty() {
        return Err("native preview was not enabled at compile time".into());
    }
    let bytes = regular_bytes(&root.join("manifest.json"))?;
    if bytes != compiled {
        return Err("native manifest differs from the compiled approval".into());
    }
    let manifest: Manifest = serde_json::from_slice(&bytes).map_err(|e| e.to_string())?;
    let target = target()?;
    if manifest.schema_version != 1
        || manifest.kind != "development-preview"
        || manifest.cavalry_version != NATIVE_VERSION
        || manifest.target_sha256 != hash(TARGET_BYTES)
        || manifest.supplemental_keys
            != target.supplemental_keys
                + PLUGIN_CAPTION_SUPPLEMENT_KEYS
                + BACKGROUND_RENDERING_GAP_KEYS
        || manifest.native_keys
            != target.native_keys
                + target.supplemental_keys
                + PLUGIN_CAPTION_SUPPLEMENT_KEYS
                + BACKGROUND_RENDERING_GAP_KEYS
        || manifest.approved_ui_keys == 0
        || manifest.approved_ui_keys > manifest.native_keys
        || manifest.input_sha256.len() != 64
        || !manifest.input_sha256.bytes().all(|b| b.is_ascii_hexdigit())
        || manifest.packs.len() != LANGUAGES.len()
    {
        return Err("native manifest target/shape differs".into());
    }
    let mut complete = true;
    for language in LANGUAGES {
        let info = manifest
            .packs
            .get(language)
            .ok_or("native manifest lacks a product language")?;
        if info.file != format!("{language}.json")
            || info.native_locale != super::user_language::native_locale_for(language)?
            || info.reviewed + info.preserved + info.vendor + info.missing != manifest.native_keys
            || info.vendor
                != if language == "ja_JP" {
                    target.vendor_japanese_keys
                } else {
                    0
                }
            || info.bytes == 0
        {
            return Err("native payload metadata differs".into());
        }
        complete &= info.missing == 0;
    }
    if complete != manifest.complete {
        return Err("native coverage claim differs".into());
    }
    Ok(manifest)
}
fn load_approved_pack_at(
    root: &Path,
    manifest: &Manifest,
    language: &str,
) -> Result<Vec<u8>, String> {
    if !LANGUAGES.contains(&language) {
        return Err("native manifest lacks a product language".into());
    }
    let info = manifest
        .packs
        .get(language)
        .ok_or("native manifest lacks a product language")?;
    let bytes = regular_bytes(&root.join(&info.file))?;
    if bytes.len() != info.bytes || hash(&bytes) != info.sha256 {
        return Err("native payload digest differs".into());
    }
    Ok(bytes)
}
fn load_status_at(root: &Path, compiled: &[u8]) -> Result<NativeResourceDigests, String> {
    let manifest = approved_manifest_at(root, compiled)?;
    let mut packs = BTreeMap::new();
    for language in LANGUAGES {
        let info = manifest
            .packs
            .get(language)
            .ok_or("native manifest lacks a product language")?;
        if regular_file_size(&root.join(&info.file))? != info.bytes as u64 {
            return Err("native payload size differs".into());
        }
        packs.insert(language.into(), info.sha256.clone());
    }
    Ok(NativeResourceDigests { packs })
}
fn load_language_at(root: &Path, compiled: &[u8], language: &str) -> Result<Vec<u8>, String> {
    let manifest = approved_manifest_at(root, compiled)?;
    load_approved_pack_at(root, &manifest, language)
}
#[cfg(test)]
fn load_at(root: &Path, compiled: &[u8]) -> Result<NativeResources, String> {
    let manifest = approved_manifest_at(root, compiled)?;
    let mut packs = BTreeMap::new();
    for language in LANGUAGES {
        packs.insert(
            language.into(),
            load_approved_pack_at(root, &manifest, language)?,
        );
    }
    Ok(NativeResources { packs })
}
#[cfg(test)]
fn validate_pack(bytes: &[u8], locale: &str, keys: usize) -> Result<(), String> {
    let value: serde_json::Value = serde_json::from_slice(bytes).map_err(|e| e.to_string())?;
    let records = value.as_array().ok_or("native pack is not an array")?;
    if records.len() != 1 {
        return Err("native pack must contain one record".into());
    }
    let record = records[0]
        .as_object()
        .ok_or("native record is not an object")?;
    if record.len() != 3
        || record.get("type").and_then(|v| v.as_str()) != Some("strings")
        || record.get("language").and_then(|v| v.as_str()) != Some(locale)
    {
        return Err("native record shape/locale differs".into());
    }
    let rows = record
        .get("value")
        .and_then(|v| v.as_object())
        .ok_or("native pack lacks values")?;
    if rows.len() != keys
        || rows.iter().any(|(key, leaf)| {
            key.is_empty()
                || leaf.as_object().is_none_or(|fields| fields.len() != 1)
                || leaf
                    .get("UI-text")
                    .and_then(|v| v.as_str())
                    .is_none_or(|text| text.trim().is_empty())
        })
    {
        return Err("native display-only values differ".into());
    }
    Ok(())
}
fn resource_root(repo: &Path, resources: &Path) -> Result<PathBuf, String> {
    let candidates = resource_candidates(
        repo,
        resources,
        &[
            PathBuf::from("native-language-packs"),
            PathBuf::from("target/native-language-packs"),
        ],
        Path::new("src-tauri/target/native-language-packs"),
    );
    candidates
        .into_iter()
        .find(|p| fs::symlink_metadata(p).is_ok())
        .ok_or_else(|| "native resource bundle is unavailable".into())
}
#[cfg(test)]
pub(crate) fn load_resources(repo: &Path, resources: &Path) -> Result<NativeResources, String> {
    load_at(&resource_root(repo, resources)?, COMPILED_MANIFEST)
}
pub(crate) fn load_status_resources(
    repo: &Path,
    resources: &Path,
) -> Result<NativeResourceDigests, String> {
    load_status_at(&resource_root(repo, resources)?, COMPILED_MANIFEST)
}
pub(crate) fn load_language_resource(
    repo: &Path,
    resources: &Path,
    language: &str,
) -> Result<Vec<u8>, String> {
    load_language_at(
        &resource_root(repo, resources)?,
        COMPILED_MANIFEST,
        language,
    )
}

// -- 启动只看bundle显示身份，不用2.7旧JSON布局决定2.8是否存在 -----
pub(crate) fn observe_install(selection: &Path) -> Result<(PathBuf, String), String> {
    let app = crate::install::canonical_root_for_selection(selection)?;
    let info = plist::Value::from_reader(std::io::Cursor::new(regular_bytes(
        &app.join("Contents/Info.plist"),
    )?))
    .map_err(|e| e.to_string())?;
    let info = info
        .as_dictionary()
        .ok_or("native install lacks plist dictionary")?;
    if info
        .get("CFBundleIdentifier")
        .and_then(plist::Value::as_string)
        != Some("com.scenegroup.cavalry")
    {
        return Err("selected bundle is not Cavalry".into());
    }
    let version = info
        .get("CFBundleShortVersionString")
        .and_then(plist::Value::as_string)
        .filter(|s| !s.trim().is_empty())
        .ok_or("Cavalry lacks display version")?
        .to_string();
    let executable = info
        .get("CFBundleExecutable")
        .and_then(plist::Value::as_string)
        .ok_or("Cavalry lacks executable identity")?;
    if !matches!(executable, "Cavalry" | "CavalryLauncher") {
        return Err("Cavalry executable identity differs".into());
    }
    let executable = app.join("Contents/MacOS").join(executable);
    crate::install::validate_no_symlink_components(
        &app,
        executable
            .strip_prefix(&app)
            .map_err(|_| "Cavalry path differs")?,
    )?;
    if !fs::symlink_metadata(executable)
        .map_err(|e| e.to_string())?
        .is_file()
    {
        return Err("Cavalry executable is missing".into());
    }
    Ok((app, version))
}

// -- 写入前宿主证明：仅原厂2.8目标，拒绝旧wrapper/源漂移，不修补bundle --
pub(crate) fn verify_host(app: &Path) -> Result<(), String> {
    verify_host_with_target(app, &target()?)
}
fn verify_host_with_target(app: &Path, target: &Target) -> Result<(), String> {
    let plist_bytes = regular_bytes(&app.join("Contents/Info.plist"))?;
    let info =
        plist::Value::from_reader(std::io::Cursor::new(plist_bytes)).map_err(|e| e.to_string())?;
    let info = info
        .as_dictionary()
        .ok_or("native host lacks Info.plist dictionary")?;
    for (key, expected) in [
        ("CFBundleIdentifier", target.bundle_id.as_str()),
        (
            "CFBundleShortVersionString",
            target.cavalry_version.as_str(),
        ),
        ("CFBundleExecutable", "Cavalry"),
    ] {
        if info.get(key).and_then(plist::Value::as_string) != Some(expected) {
            return Err(format!("native host identity differs: {key}"));
        }
    }
    if hash(&regular_bytes(&app.join(&target.executable))?) != target.executable_sha256 {
        return Err("native host executable digest differs".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn preview_without_compile_time_approval_never_loads() {
        let root = tempfile::tempdir().unwrap();
        assert!(load_at(root.path(), &[]).is_err());
    }
    #[test]
    fn runtime_manifest_cannot_approve_itself_or_change_language_paths() {
        let root = tempfile::tempdir().unwrap();
        fs::write(root.path().join("manifest.json"), b"{}").unwrap();
        assert!(load_at(&root.path().canonicalize().unwrap(), b"different")
            .unwrap_err()
            .contains("compiled approval"));
        assert!(load_at(root.path(), b"{}").is_err());
    }
    #[test]
    fn display_pack_rejects_metadata_wrong_locale_and_foreign_fields() {
        let valid =
            br#"[{"type":"strings","language":"ja","value":{"key":{"UI-text":"\u5b8c\u4e86"}}}]"#;
        assert!(validate_pack(valid, "ja", 1).is_ok());
        assert!(validate_pack(valid, "zh-Hans", 1).is_err());
        assert!(validate_pack(valid, "ja", 2).is_err());
        let foreign = br#"[{"type":"strings","language":"ja","value":{"key":{"UI-text":"ok","id":"model"}}}]"#;
        assert!(validate_pack(foreign, "ja", 1).is_err());
    }
    #[test]
    fn manifest_and_payload_symlinks_are_not_native_resources() {
        let root = tempfile::tempdir().unwrap();
        fs::write(root.path().join("real.json"), b"{}").unwrap();
        std::os::unix::fs::symlink(
            root.path().join("real.json"),
            root.path().join("manifest.json"),
        )
        .unwrap();
        assert!(load_at(root.path(), b"{}").is_err());
    }
    fn approved_fixture() -> (tempfile::TempDir, Vec<u8>) {
        use serde_json::json;
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().canonicalize().unwrap();
        let mut manifest = json!({"schemaVersion":1,"kind":"development-preview","cavalryVersion":"2.8.0",
            "targetSha256":hash(TARGET_BYTES),"inputSha256":"a".repeat(64),"approvedUIKeys":1,
            "nativeKeys":10848,"supplementalKeys":375,"complete":false,"packs":{}});
        for language in LANGUAGES {
            let vendor = if language == "ja_JP" { 390 } else { 0 };
            let values = (0..1 + vendor)
                .map(|i| (format!("fixture.{i}"), json!({"UI-text":"fixture"})))
                .collect::<serde_json::Map<_, _>>();
            let locale = super::super::user_language::native_locale_for(language).unwrap();
            let bytes =
                serde_json::to_vec(&json!([{"type":"strings","language":locale,"value":values}]))
                    .unwrap();
            fs::write(root.join(format!("{language}.json")), &bytes).unwrap();
            manifest["packs"][language] = json!({"file":format!("{language}.json"),"nativeLocale":locale,
                "sha256":hash(&bytes),"bytes":bytes.len(),"reviewed":1,"preserved":0,"vendor":vendor,"missing":10847-vendor});
        }
        let bytes = serde_json::to_vec(&manifest).unwrap();
        fs::write(root.join("manifest.json"), &bytes).unwrap();
        (temp, bytes)
    }
    #[test]
    fn approved_three_language_payloads_load_and_any_payload_change_fails_closed() {
        let (temp, compiled) = approved_fixture();
        let root = temp.path().canonicalize().unwrap();
        assert_eq!(load_at(&root, &compiled).unwrap().packs.len(), 3);
        fs::write(root.join("zh-Hans.json"), b"changed").unwrap();
        assert!(load_at(&root, &compiled).unwrap_err().contains("digest"));
    }
    #[test]
    fn status_readiness_does_not_hash_an_unselected_same_size_payload() {
        let (temp, compiled) = approved_fixture();
        let root = temp.path().canonicalize().unwrap();
        let path = root.join("zh-Hans.json");
        let mut bytes = fs::read(&path).unwrap();
        bytes[0] = if bytes[0] == b' ' { b'!' } else { b' ' };
        fs::write(path, bytes).unwrap();
        let status = load_status_at(&root, &compiled).unwrap();
        let approved: serde_json::Value = serde_json::from_slice(&compiled).unwrap();
        assert_eq!(
            status.packs["zh-Hans"],
            approved["packs"]["zh-Hans"]["sha256"].as_str().unwrap()
        );
    }
    #[test]
    fn status_metadata_requires_three_regular_files_with_approved_sizes() {
        for failure in ["missing", "wrong-size", "symlink"] {
            let (temp, compiled) = approved_fixture();
            let root = temp.path().canonicalize().unwrap();
            let path = root.join("zh-Hans.json");
            match failure {
                "missing" => fs::remove_file(&path).unwrap(),
                "wrong-size" => {
                    let mut bytes = fs::read(&path).unwrap();
                    bytes.push(b' ');
                    fs::write(&path, bytes).unwrap();
                }
                "symlink" => {
                    fs::remove_file(&path).unwrap();
                    std::os::unix::fs::symlink(root.join("ja_JP.json"), &path).unwrap();
                }
                _ => unreachable!(),
            }
            assert!(
                load_status_at(&root, &compiled).is_err(),
                "status metadata must reject {failure} packs"
            );
        }
    }
    #[test]
    fn selected_language_load_does_not_require_an_unselected_pack() {
        let (temp, compiled) = approved_fixture();
        let root = temp.path().canonicalize().unwrap();
        fs::remove_file(root.join("zh-Hans.json")).unwrap();
        let selected = load_language_at(&root, &compiled, "ja_JP").unwrap();
        let approved: serde_json::Value = serde_json::from_slice(&compiled).unwrap();
        assert_eq!(
            hash(&selected),
            approved["packs"]["ja_JP"]["sha256"].as_str().unwrap()
        );
    }
    #[test]
    fn selected_language_load_rejects_its_own_digest_drift() {
        let (temp, compiled) = approved_fixture();
        let root = temp.path().canonicalize().unwrap();
        let path = root.join("ja_JP.json");
        let mut bytes = fs::read(&path).unwrap();
        bytes[0] = if bytes[0] == b' ' { b'!' } else { b' ' };
        fs::write(path, bytes).unwrap();
        assert!(load_language_at(&root, &compiled, "ja_JP")
            .unwrap_err()
            .contains("digest"));
    }
    #[test]
    fn rejected_selected_payload_never_reaches_profile_write() {
        let (resources, compiled) = approved_fixture();
        let resource_root = resources.path().canonicalize().unwrap();
        let path = resource_root.join("ja_JP.json");
        let mut bytes = fs::read(&path).unwrap();
        bytes[0] = if bytes[0] == b' ' { b'!' } else { b' ' };
        fs::write(path, bytes).unwrap();
        let selected = load_language_at(&resource_root, &compiled, "ja_JP").ok();

        let profile = tempfile::tempdir().unwrap();
        let root = profile.path().canonicalize().unwrap();
        let home = root.join("home");
        let state = root.join("state");
        fs::create_dir_all(home.join("Library/Preferences/Cavalry")).unwrap();
        fs::create_dir_all(&state).unwrap();
        let preferences = home.join("Library/Preferences/Cavalry/preferences.json");
        let before = br#"{"locale":{"varType":"string","value":"en-GB"}}"#;
        fs::write(&preferences, before).unwrap();
        let paths =
            super::super::user_language_files::UserLanguagePaths::for_user_dirs(&home, &state)
                .unwrap();

        let action = super::super::native_user::apply_profile(
            &paths,
            "ja_JP",
            selected.as_deref(),
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        );
        assert_eq!(
            action.error_code.as_deref(),
            Some("nativeResourceUnavailable")
        );
        assert_eq!(fs::read(preferences).unwrap(), before);
        assert!(!paths.strings().exists());
        assert!(!paths.receipt().exists());
    }
    #[test]
    fn one_pending_caption_keeps_an_honest_partial_pack_available() {
        let (temp, compiled) = approved_fixture();
        let root = temp.path().canonicalize().unwrap();
        let mut manifest: serde_json::Value = serde_json::from_slice(&compiled).unwrap();
        manifest["approvedUIKeys"] = serde_json::json!(10652);
        for language in LANGUAGES {
            let vendor = if language == "ja_JP" { 390 } else { 0 };
            let values = (0..10847)
                .map(|i| {
                    (
                        format!("fixture.{i}"),
                        serde_json::json!({"UI-text":"caption"}),
                    )
                })
                .collect::<serde_json::Map<_, _>>();
            let locale = super::super::user_language::native_locale_for(language).unwrap();
            let bytes = serde_json::to_vec(&serde_json::json!([
                {"type":"strings","language":locale,"value":values}
            ]))
            .unwrap();
            fs::write(root.join(format!("{language}.json")), &bytes).unwrap();
            let info = &mut manifest["packs"][language];
            info["sha256"] = serde_json::json!(hash(&bytes));
            info["bytes"] = serde_json::json!(bytes.len());
            info["reviewed"] = serde_json::json!(10652 - vendor);
            info["preserved"] = serde_json::json!(195);
            info["missing"] = serde_json::json!(1);
        }
        let partial = serde_json::to_vec(&manifest).unwrap();
        fs::write(root.join("manifest.json"), &partial).unwrap();
        assert_eq!(load_at(&root, &partial).unwrap().packs.len(), 3);
        manifest["complete"] = serde_json::json!(true);
        let false_claim = serde_json::to_vec(&manifest).unwrap();
        fs::write(root.join("manifest.json"), &false_claim).unwrap();
        assert!(load_at(&root, &false_claim)
            .unwrap_err()
            .contains("coverage"));
    }
    #[test]
    fn schema_supplement_count_is_explicit_and_cannot_masquerade_as_official_catalog() {
        let (temp, compiled) = approved_fixture();
        let root = temp.path().canonicalize().unwrap();
        let mut manifest: serde_json::Value = serde_json::from_slice(&compiled).unwrap();
        // -- 补充仍缺译的合成包：只改变来源分账，不伪造已显示或已审批 -----
        manifest["supplementalKeys"] = serde_json::json!(375);
        manifest["nativeKeys"] = serde_json::json!(10848);
        let bytes = serde_json::to_vec(&manifest).unwrap();
        fs::write(root.join("manifest.json"), &bytes).unwrap();
        assert!(
            load_at(&root, &bytes).is_ok(),
            "a source-bound supplement must have its own count"
        );
        for (field, value) in [
            ("supplementalKeys", 0),
            ("supplementalKeys", 9),
            ("supplementalKeys", 373),
            ("supplementalKeys", 374),
            ("nativeKeys", 10473),
            ("nativeKeys", 10847),
        ] {
            let mut drift = manifest.clone();
            drift[field] = serde_json::json!(value);
            let bytes = serde_json::to_vec(&drift).unwrap();
            fs::write(root.join("manifest.json"), &bytes).unwrap();
            assert!(
                load_at(&root, &bytes).is_err(),
                "source counts must not drift"
            );
        }
    }
    #[test]
    fn complete_claim_and_target_approval_cannot_drift_even_with_matching_manifest_bytes() {
        for field in ["complete", "targetSha256", "inputSha256"] {
            let (temp, compiled) = approved_fixture();
            let root = temp.path().canonicalize().unwrap();
            let mut value: serde_json::Value = serde_json::from_slice(&compiled).unwrap();
            value[field] = if field == "complete" {
                serde_json::json!(true)
            } else {
                serde_json::json!("wrong")
            };
            let changed = serde_json::to_vec(&value).unwrap();
            fs::write(root.join("manifest.json"), &changed).unwrap();
            assert!(load_at(&root, &changed).is_err());
        }
    }
    fn host_identity_fixture() -> (tempfile::TempDir, PathBuf, Target) {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().canonicalize().unwrap();
        let mut lock = target().unwrap();
        fs::create_dir_all(root.join("Contents/MacOS")).unwrap();
        let info = format!(
            r#"<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>{}</string><key>CFBundleShortVersionString</key><string>2.8.0</string><key>CFBundleExecutable</key><string>Cavalry</string></dict></plist>"#,
            lock.bundle_id
        );
        fs::write(root.join("Contents/Info.plist"), info).unwrap();
        fs::write(root.join(&lock.executable), b"main").unwrap();
        lock.executable_sha256 = hash(b"main");
        (temp, root, lock)
    }

    #[test]
    fn native_host_identity_does_not_read_build_catalogs_or_runtime_libraries() {
        let (_temp, root, lock) = host_identity_fixture();
        // 未创建库或catalog。构建锁不要求在每次动作重读这些文件。
        verify_host_with_target(&root, &lock).unwrap();
        assert!(!root.join("Contents/Frameworks").exists());
        assert!(!root.join("Contents/assets").exists());
    }

    #[test]
    fn native_host_identity_still_rejects_a_changed_main_executable() {
        let (_temp, root, lock) = host_identity_fixture();
        verify_host_with_target(&root, &lock).unwrap();
        fs::write(root.join(&lock.executable), b"foreign main").unwrap();
        assert!(verify_host_with_target(&root, &lock)
            .unwrap_err()
            .contains("executable digest"));
    }
    #[test]
    fn explicit_compile_approval_loads_the_generated_development_packs() {
        if COMPILED_MANIFEST.is_empty() {
            assert!(!preview_enabled());
            return;
        }
        let repo = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let temp = tempfile::tempdir().unwrap();
        let resource = temp.path().canonicalize().unwrap();
        assert_eq!(load_resources(repo, &resource).unwrap().packs.len(), 3);
    }
    #[test]
    fn native_discovery_reads_version_without_requiring_legacy_json_assets() {
        let temp = tempfile::tempdir().unwrap();
        let app = temp.path().canonicalize().unwrap().join("Cavalry.app");
        fs::create_dir_all(app.join("Contents/MacOS")).unwrap();
        fs::write(app.join("Contents/MacOS/Cavalry"), b"fixture").unwrap();
        for version in ["2.8.0", "2.7.2"] {
            fs::write(app.join("Contents/Info.plist"),format!(r#"<plist version="1.0"><dict><key>CFBundleIdentifier</key><string>com.scenegroup.cavalry</string><key>CFBundleShortVersionString</key><string>{version}</string><key>CFBundleExecutable</key><string>Cavalry</string></dict></plist>"#)).unwrap();
            assert_eq!(
                observe_install(&app).unwrap(),
                (app.clone(), version.into())
            );
            assert!(!app
                .join("Contents/assets/Definitions/appStrings.json")
                .exists());
        }
        fs::write(app.join("Contents/Info.plist"), b"invalid plist").unwrap();
        assert!(observe_install(&app).is_err());
    }
}
