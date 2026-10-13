/**
 * [INPUT]: 依赖schema 1/2 typed baseline、受管CopyPair plan与隔离Unix store。
 * [OUTPUT]: 验证Extension原像、旧/新恢复槽、签名槽与原始mode。
 * [POS]: baseline恢复计划合同；fixture source只测校验逻辑，不证明vendor真实性。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{cell::Cell, collections::BTreeSet, fs, os::unix::fs::PermissionsExt};

use super::super::{capture_inner, NativeVendorRestorePlan};
use super::{capture_schema_1_fixture, fixture, generation_path, source_for, successful_verifier};

fn plan_for(with_signature_components: bool) -> (super::Fixture, NativeVendorRestorePlan) {
    let fixture = fixture(with_signature_components);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let plan = baseline.build_restore_plan(&fixture.app).unwrap();
    (fixture, plan)
}

#[test]
fn restore_plan_only_copies_managed_slots_and_removes_absent_owned_slots() {
    let (fixture, plan) = plan_for(false);
    let destinations = plan
        .pairs
        .iter()
        .map(|pair| {
            pair.dst
                .strip_prefix(&fixture.app)
                .unwrap()
                .to_string_lossy()
                .into_owned()
        })
        .collect::<BTreeSet<_>>();
    assert_eq!(
        destinations,
        [
            "Contents/Info.plist",
            "Contents/MacOS/Cavalry",
            "Contents/_CodeSignature/CodeResources",
            "Contents/Frameworks/libExtensionLayer.dylib",
        ]
        .into_iter()
        .map(str::to_string)
        .collect()
    );
    assert_eq!(plan.modes.len(), 4);
    let removals = plan
        .removals
        .iter()
        .map(|path| {
            path.strip_prefix(&fixture.app)
                .unwrap()
                .to_string_lossy()
                .into_owned()
        })
        .collect::<BTreeSet<_>>();
    assert_eq!(removals.len(), 5);
    assert!(removals.contains("Contents/MacOS/CavalryLauncher"));
    assert!(removals.contains("Contents/Frameworks/libCavalryTranslatorInjector.dylib"));
    assert!(removals.contains("Contents/_CodeSignature/CodeDirectory"));
    assert!(removals.contains("Contents/_CodeSignature/CodeSignature"));
    assert!(removals.contains("Contents/_CodeSignature/CodeRequirements"));
    assert!(!removals.contains("Contents/Resources/cavalry-i18n-lang.txt"));
    assert!(!destinations.contains("Contents/Resources/vendor-resource.txt"));
}

#[test]
fn schema_1_restore_plan_never_claims_extension_layer() {
    let fixture = fixture(false);
    let baseline = capture_schema_1_fixture(&fixture.app, &fixture.state);
    let plan = baseline.build_restore_plan(&fixture.app).unwrap();
    let extension = fixture
        .app
        .join("Contents/Frameworks/libExtensionLayer.dylib");

    assert_eq!(baseline.manifest.schema_version, 1);
    assert!(plan.pairs.iter().all(|pair| pair.dst != extension));
    assert!(plan.removals.iter().all(|path| path != &extension));
    assert!(plan.modes.iter().all(|mode| mode.destination != extension));
}

#[test]
fn present_optional_signature_components_are_copied_with_original_modes() {
    let (fixture, plan) = plan_for(true);
    assert_eq!(plan.pairs.len(), 7);
    assert_eq!(plan.modes.len(), 7);
    assert_eq!(plan.removals.len(), 2);
    let main_mode = plan
        .modes
        .iter()
        .find(|mode| mode.destination == fixture.app.join("Contents/MacOS/Cavalry"))
        .unwrap()
        .unix_mode;
    assert_eq!(main_mode, 0o755);
    let extension_mode = plan
        .modes
        .iter()
        .find(|mode| {
            mode.destination
                == fixture
                    .app
                    .join("Contents/Frameworks/libExtensionLayer.dylib")
        })
        .unwrap()
        .unix_mode;
    assert_eq!(extension_mode & 0o7777, 0o755);
}

#[test]
fn info_preimage_rechecks_blob_bytes_and_mode_on_each_read() {
    let fixture = fixture(false);
    let info = fixture.app.join("Contents/Info.plist");
    fs::set_permissions(&info, fs::Permissions::from_mode(0o640)).unwrap();
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();

    let (bytes, mode) = baseline.read_info_plist_preimage().unwrap();
    assert_eq!(bytes, b"<plist>fixture-info</plist>");
    assert_eq!(mode, 0o640);

    let blob = generation_path(&fixture, baseline.baseline_id()).join("blobs/slot-0.bin");
    fs::write(&blob, b"changed info bytes").unwrap();
    assert!(baseline.read_info_plist_preimage().is_err());
}

#[test]
fn restored_vendor_verification_rejects_stock_slot_drift_before_source_proof() {
    let fixture = fixture(false);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let source_calls = Cell::new(0usize);
    let info = fixture.app.join("Contents/Info.plist");
    let original_info = fs::read(&info).unwrap();

    fs::write(&info, b"changed stock slot").unwrap();
    let drift = baseline.verify_restored_vendor_with(&fixture.app, |path| {
        source_calls.set(source_calls.get() + 1);
        Ok(source_for(path))
    });
    assert!(drift.is_err());
    assert_eq!(
        source_calls.get(),
        0,
        "stock slot mismatch must fail before source proof"
    );

    fs::write(&info, original_info).unwrap();
    let source_failure = baseline.verify_restored_vendor_with(&fixture.app, |_path| {
        Err("fixed vendor source verification failed".into())
    });
    assert!(source_failure.is_err());

    let wrong_source = baseline.verify_restored_vendor_with(&fixture.app, |path| {
        Ok(crate::commands::VerifiedNativeVendorSource::fixture(
            path,
            &"c".repeat(64),
        ))
    });
    assert!(wrong_source.is_err());
}

#[test]
fn unowned_vendor_changes_do_not_block_restored_vendor_source_proof() {
    let fixture = fixture(false);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let resource = fixture.app.join("Contents/Resources/vendor-resource.txt");
    fs::write(&resource, b"unowned resource changed").unwrap();
    let unknown = fixture.app.join("Contents/Resources/unowned.txt");
    fs::write(&unknown, b"unowned member").unwrap();
    let source_calls = Cell::new(0usize);

    baseline
        .verify_restored_vendor_with(&fixture.app, |path| {
            source_calls.set(source_calls.get() + 1);
            Ok(source_for(path))
        })
        .unwrap();

    assert_eq!(source_calls.get(), 1);
    assert_eq!(fs::read(resource).unwrap(), b"unowned resource changed");
    assert_eq!(fs::read(unknown).unwrap(), b"unowned member");
}

#[test]
fn restore_plan_rejects_another_app_and_raw_store_drift() {
    let fixture = fixture(false);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let other = fixture._temp.path().join("Other.app");
    fs::create_dir(&other).unwrap();
    let other = fs::canonicalize(other).unwrap();
    assert!(baseline.build_restore_plan(&other).is_err());

    let extra = generation_path(&fixture, baseline.baseline_id()).join("unexpected");
    fs::write(extra, b"unknown").unwrap();
    assert!(baseline.build_restore_plan(&fixture.app).is_err());
}

#[test]
fn marker_absence_never_grants_removal_authority() {
    let (fixture, plan) = plan_for(false);
    assert!(plan
        .removals
        .iter()
        .all(|path| path != &fixture.app.join("Contents/Resources/cavalry-i18n-lang.txt")));
    assert!(plan
        .pairs
        .iter()
        .all(|pair| pair.dst != fixture.app.join("Contents/Resources/cavalry-i18n-lang.txt")));
}

#[test]
fn restore_plan_sources_are_private_verified_blobs() {
    let (fixture, plan) = plan_for(false);
    for pair in plan.pairs {
        assert!(pair
            .src
            .starts_with(fixture.state.join("native-vendor-baselines")));
        assert!(pair.src.is_file());
        assert!(pair.dst.starts_with(&fixture.app));
    }
}
