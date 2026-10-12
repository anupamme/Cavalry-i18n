/**
 * [INPUT]: 依赖native baseline核心、source fixture和隔离Unix bundle。
 * [OUTPUT]: 汇总基线合同；提供NRT终结器的fixture捕获与全树验证入口。
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
