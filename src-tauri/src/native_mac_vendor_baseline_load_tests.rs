/**
 * [INPUT]: 依赖load_baseline、expected baseline ID与临时私有store。
 * [OUTPUT]: 验证root、target/policy、ID、blob、目录成员和旧整树manifest兼容。
 * [POS]: baseline load隔离合同；不把可伪造fixture解释为vendor证明。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{fs, os::unix::fs::PermissionsExt};

use serde_json::Value;

use super::super::{capture_inner, load_baseline, storage, BLOBS_DIRECTORY, MANIFEST_NAME};
use super::successful_verifier;
use super::{fixture, generation_path};

fn captured() -> (super::Fixture, String) {
    let fixture = fixture(false);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    (fixture, baseline.baseline_id().to_string())
}

fn edit_manifest(fixture: &super::Fixture, id: &str, edit: impl FnOnce(&mut Value)) {
    let path = generation_path(fixture, id).join(MANIFEST_NAME);
    let bytes = fs::read(&path).unwrap();
    let mut manifest: Value = serde_json::from_slice(&bytes).unwrap();
    edit(&mut manifest);
    let bytes = storage::json_bytes_bounded(&manifest, storage::MANIFEST_LIMIT).unwrap();
    fs::write(path, bytes).unwrap();
}

#[test]
fn load_requires_callers_expected_id_and_returns_same_verified_generation() {
    let (fixture, id) = captured();
    let loaded = load_baseline(&fixture.app, &fixture.state, &id).unwrap();
    assert_eq!(loaded.baseline_id(), id);
    assert!(load_baseline(&fixture.app, &fixture.state, &"0".repeat(64)).is_err());
}

#[test]
fn legacy_full_inventory_manifest_loads_without_rehashing_vendor_resources() {
    let fixture = fixture(false);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let mut legacy = baseline.manifest.clone();
    legacy.inventory = crate::native_mac_bundle_inventory::inventory_bundle(&fixture.app).unwrap();
    legacy.baseline_id = super::super::manifest_id(&legacy).unwrap();
    let old_generation = generation_path(&fixture, baseline.baseline_id());
    let generation = generation_path(&fixture, &legacy.baseline_id);
    fs::rename(&old_generation, &generation).unwrap();
    fs::remove_file(generation.join(MANIFEST_NAME)).unwrap();
    storage::write_json_bounded(
        &generation.join(MANIFEST_NAME),
        &legacy,
        storage::MANIFEST_LIMIT,
    )
    .unwrap();

    // 原有整树清单仍参与ID绑定；当前无关资源不再参与槽恢复准入。
    fs::write(
        fixture.app.join("Contents/Resources/vendor-resource.txt"),
        b"external edit",
    )
    .unwrap();
    let loaded = load_baseline(&fixture.app, &fixture.state, &legacy.baseline_id).unwrap();
    assert_eq!(loaded.baseline_id(), legacy.baseline_id);
    loaded
        .verify_restored_vendor_with(&fixture.app, successful_verifier())
        .unwrap();
    assert_eq!(loaded.manifest.inventory, legacy.inventory);
    assert_eq!(
        fs::read(fixture.app.join("Contents/Resources/vendor-resource.txt")).unwrap(),
        b"external edit"
    );
    // fixture许可不代表真实厂商签名；生产verifier仍决定修改后是否原厂。
}

#[test]
fn load_rejects_manifest_target_policy_root_id_and_relative_path_drift() {
    for edit in 0..5 {
        let (fixture, id) = captured();
        edit_manifest(&fixture, &id, |manifest| match edit {
            0 => manifest["targetSha256"] = Value::String("b".repeat(64)),
            1 => manifest["policyId"] = Value::String("other-policy".into()),
            2 => manifest["installRoot"] = Value::String("/another/Cavalry.app".into()),
            3 => manifest["baselineId"] = Value::String("0".repeat(64)),
            _ => {
                manifest["slots"][0]["relativePath"] =
                    Value::String("Contents/../Contents/Info.plist".into())
            }
        });
        assert!(
            load_baseline(&fixture.app, &fixture.state, &id).is_err(),
            "case {edit}"
        );
    }
}

#[test]
fn load_rejects_blob_content_and_mode_drift() {
    let (fixture, id) = captured();
    let blob = generation_path(&fixture, &id)
        .join(BLOBS_DIRECTORY)
        .join("slot-0.bin");
    let original = fs::read(&blob).unwrap();
    fs::write(&blob, b"x".repeat(original.len())).unwrap();
    assert!(load_baseline(&fixture.app, &fixture.state, &id).is_err());

    fs::write(&blob, original).unwrap();
    fs::set_permissions(&blob, fs::Permissions::from_mode(0o400)).unwrap();
    assert!(load_baseline(&fixture.app, &fixture.state, &id).is_err());
}

#[test]
fn load_rejects_extra_generation_or_blob_members() {
    let (fixture, id) = captured();
    let generation = generation_path(&fixture, &id);
    fs::write(generation.join("surprise"), b"unknown").unwrap();
    assert!(load_baseline(&fixture.app, &fixture.state, &id).is_err());

    fs::remove_file(generation.join("surprise")).unwrap();
    fs::write(
        generation.join(BLOBS_DIRECTORY).join("extra.bin"),
        b"unknown",
    )
    .unwrap();
    assert!(load_baseline(&fixture.app, &fixture.state, &id).is_err());
}

#[test]
fn load_rejects_another_canonical_bundle_root() {
    let (fixture, id) = captured();
    let other = fixture._temp.path().join("Other.app");
    fs::create_dir(&other).unwrap();
    let other = fs::canonicalize(other).unwrap();
    assert!(load_baseline(&other, &fixture.state, &id).is_err());
}
