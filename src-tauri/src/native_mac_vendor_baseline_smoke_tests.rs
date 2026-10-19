/**
 * [INPUT]: 依赖显式只读官方bundle路径、临时state目录与真实固定source verifier。
 * [OUTPUT]: 复核官方baseline capture、expected-ID load、整树恢复验证和无bundle改写。
 * [POS]: 默认忽略的人工只读smoke；不访问profile、不安装、不启动Cavalry、不签名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{env, fs};

use crate::{
    commands::native_baseline_target_sha256,
    native_mac_bundle_inventory::inventory_bundle,
    native_mac_vendor_baseline::{capture_or_reuse, load_baseline},
    privilege::RealCommandRunner,
};

#[test]
#[ignore = "requires an explicit read-only official Cavalry 2.8.0 bundle path"]
fn read_only_official_bundle_capture_load_and_verify_smoke() {
    let selected = env::var_os("CAVALRY_I18N_NATIVE_VENDOR_SMOKE_APP")
        .expect("set CAVALRY_I18N_NATIVE_VENDOR_SMOKE_APP to a read-only official bundle");
    let app = fs::canonicalize(selected).unwrap();
    let state_temp = tempfile::tempdir().unwrap();
    let state = fs::canonicalize(state_temp.path()).unwrap();
    let before = inventory_bundle(&app).unwrap();
    let mut runner = RealCommandRunner;

    let captured = capture_or_reuse(&app, &state, &mut runner).unwrap();
    assert_eq!(
        captured.manifest.target_sha256,
        native_baseline_target_sha256()
    );
    let loaded = load_baseline(&app, &state, captured.baseline_id()).unwrap();
    assert_eq!(loaded.baseline_id(), captured.baseline_id());
    loaded.verify_restored_vendor(&app, &mut runner).unwrap();

    assert_eq!(inventory_bundle(&app).unwrap(), before);
}
