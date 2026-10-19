/**
 * [INPUT]: 依赖native baseline核心、source fixture和隔离Unix bundle。
 * [OUTPUT]: 汇总schema 1/2基线合同；提供NRT终结器的fixture捕获与全树验证入口。
 * [POS]: baseline测试地图；所有普通合同只使用临时目录，不证明vendor真实性。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
};

use crate::commands::{native_baseline_target_sha256, VerifiedNativeVendorSource};

pub(crate) struct Fixture {
    pub(crate) _temp: tempfile::TempDir,
    pub(crate) app: PathBuf,
    pub(crate) state: PathBuf,
}

pub(crate) fn fixture(with_signature_components: bool) -> Fixture {
    let temp = tempfile::tempdir().unwrap();
    let app = temp.path().join("Cavalry.app");
    let state = temp.path().join("state");
    for directory in [
        "Contents/MacOS",
        "Contents/Frameworks",
        "Contents/Resources",
        "Contents/_CodeSignature",
    ] {
        fs::create_dir_all(app.join(directory)).unwrap();
    }
    fs::create_dir_all(&state).unwrap();
    fs::write(
        app.join("Contents/Info.plist"),
        b"<plist>fixture-info</plist>",
    )
    .unwrap();
    let main = app.join("Contents/MacOS/Cavalry");
    fs::write(&main, vec![0x5a; 256 * 1024]).unwrap();
    fs::set_permissions(&main, fs::Permissions::from_mode(0o755)).unwrap();
    fs::write(
        app.join("Contents/_CodeSignature/CodeResources"),
        b"vendor-seal-fixture",
    )
    .unwrap();
    let extension = app.join("Contents/Frameworks/libExtensionLayer.dylib");
    fs::write(
        &extension,
        crate::keychain_patch::build_synthetic_keychain_dylib(None, true),
    )
    .unwrap();
    fs::set_permissions(&extension, fs::Permissions::from_mode(0o755)).unwrap();
    fs::write(
        app.join("Contents/Resources/vendor-resource.txt"),
        b"not backed up",
    )
    .unwrap();
    if with_signature_components {
        for path in crate::privilege::external_signature_component_paths(&app) {
            fs::write(path, b"external-signature-fixture").unwrap();
        }
    }
    Fixture {
        _temp: temp,
        app: fs::canonicalize(app).unwrap(),
        state: fs::canonicalize(state).unwrap(),
    }
}

pub(crate) fn source_for(app: &Path) -> VerifiedNativeVendorSource {
    VerifiedNativeVendorSource::fixture(app, &native_baseline_target_sha256())
}

pub(crate) fn successful_verifier(
) -> impl FnMut(&Path) -> Result<VerifiedNativeVendorSource, String> {
    |app| Ok(source_for(app))
}

/// 仅fixture消费；source许可不证明真实厂商身份。
pub(crate) fn capture_fixture_baseline(app: &Path, state: &Path) -> String {
    super::capture_inner(state, app, successful_verifier())
        .unwrap()
        .baseline_id()
        .to_string()
}

/// 按旧schema 1槽集构造真实的九项固定槽fixture，不从schema 2 manifest降版。
pub(crate) fn capture_schema_1_fixture(
    app: &Path,
    state: &Path,
) -> super::VerifiedNativeVendorBaseline {
    let root = super::validate_canonical_app(app).unwrap();
    let state = super::validate_state_root(state, &root).unwrap();
    let inventory = super::contract::observe_stock_inventory(&root, 1).unwrap();
    let slots = super::contract::observe_stock_slots(&root, &inventory, 1).unwrap();
    let mut manifest = super::BaselineManifest {
        schema_version: 1,
        baseline_id: String::new(),
        install_root: super::contract::path_text(&root, "Cavalry root").unwrap(),
        target_sha256: native_baseline_target_sha256(),
        policy_id: crate::commands::NATIVE_BASELINE_SOURCE_POLICY_ID.to_string(),
        inventory,
        slots,
    };
    super::contract::validate_manifest_shape(&manifest).unwrap();
    super::contract::validate_slot_inventory(&manifest).unwrap();
    manifest.baseline_id = super::manifest_id(&manifest).unwrap();

    let store = super::ensure_store_root(&state, &root).unwrap();
    let mut staging = super::StagingGeneration::create(&store).unwrap();
    super::stage_blobs(&root, &manifest, &staging.path).unwrap();
    super::storage::write_json_bounded(
        &staging.path.join(super::MANIFEST_NAME),
        &manifest,
        super::storage::MANIFEST_LIMIT,
    )
    .unwrap();
    super::storage::sync_directory(&staging.path.join(super::BLOBS_DIRECTORY)).unwrap();
    super::storage::sync_directory(&staging.path).unwrap();
    super::verify_capture_after(&root, &manifest, &mut successful_verifier()).unwrap();
    let generation = super::generation_path(&state, &manifest.baseline_id);
    super::storage::publish_exclusive(&staging.path, &generation).unwrap();
    staging.mark_published();
    super::storage::sync_directory(&store).unwrap();
    super::load_at(&root, &state, &manifest.baseline_id).unwrap()
}

/// 复用真实固定槽/存储验证，只替换fixture的source来源。
pub(crate) fn verify_fixture_baseline(
    baseline: &super::VerifiedNativeVendorBaseline,
    app: &Path,
) -> Result<(), String> {
    baseline.verify_restored_vendor_with(app, successful_verifier())
}

pub(crate) fn generation_path(fixture: &Fixture, baseline_id: &str) -> PathBuf {
    fixture.state.join(super::STORE_DIRECTORY).join(baseline_id)
}

#[path = "native_mac_vendor_baseline_capture_tests.rs"]
mod capture;
#[path = "native_mac_vendor_baseline_load_tests.rs"]
mod load;
#[path = "native_mac_vendor_baseline_plan_tests.rs"]
mod plan;
#[path = "native_mac_vendor_baseline_smoke_tests.rs"]
mod smoke;
