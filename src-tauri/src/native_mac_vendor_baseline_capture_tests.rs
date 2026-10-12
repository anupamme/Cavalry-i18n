/**
 * [INPUT]: 依赖capture_inner、source fixture与临时原厂bundle。
 * [OUTPUT]: 验证暂存后单次source proof、stock前后像与不可变发布。
 * [POS]: baseline capture隔离合同；不访问真实Cavalry、profile或codesign。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    cell::Cell,
    collections::BTreeMap,
    ffi::{CString, OsString},
    fs,
    os::unix::{
        ffi::{OsStrExt, OsStringExt},
        fs::PermissionsExt,
    },
    path::{Path, PathBuf},
};

use super::{fixture, generation_path, source_for, successful_verifier};
use crate::commands::VerifiedNativeVendorSource;
use crate::native_mac_bundle_inventory::{BundleInventory, BundleObject};

use super::super::{capture_inner, STORE_DIRECTORY};

#[test]
fn capture_publishes_verified_immutable_generation() {
    let fixture = fixture(false);
    let calls = Cell::new(0usize);
    let baseline = capture_inner(&fixture.state, &fixture.app, |path| {
        calls.set(calls.get() + 1);
        Ok(source_for(path))
    })
    .unwrap();

    assert_eq!(
        calls.get(),
        1,
        "staged stock slots need one actual source proof, not two"
    );
    assert_eq!(baseline.baseline_id().len(), 64);
    assert!(generation_path(&fixture, baseline.baseline_id()).is_dir());
}

#[test]
fn wrong_source_timeout_and_target_publish_nothing() {
    let fixture = fixture(false);
    let other = fixture._temp.path().join("Other.app");
    fs::create_dir(&other).unwrap();
    let other = fs::canonicalize(other).unwrap();
    assert!(capture_inner(&fixture.state, &fixture.app, |_path| {
        Ok(source_for(&other))
    })
    .is_err());
    assert_eq!(
        fs::read_dir(fixture.state.join(STORE_DIRECTORY))
            .unwrap()
            .count(),
        0
    );

    assert!(capture_inner(&fixture.state, &fixture.app, |_path| {
        Err("fixed source verification deadline expired".into())
    })
    .is_err());
    assert_eq!(
        fs::read_dir(fixture.state.join(STORE_DIRECTORY))
            .unwrap()
            .count(),
        0
    );

    assert!(capture_inner(&fixture.state, &fixture.app, |path| {
        Ok(VerifiedNativeVendorSource::fixture(path, &"b".repeat(64)))
    })
    .is_err());
    assert_eq!(
        fs::read_dir(fixture.state.join(STORE_DIRECTORY))
            .unwrap()
            .count(),
        0
    );
}

#[test]
fn after_source_failure_discards_only_its_staging_generation() {
    let fixture = fixture(false);
    let calls = Cell::new(0usize);
    let result = capture_inner(&fixture.state, &fixture.app, |_path| {
        calls.set(calls.get() + 1);
        Err("staged source proof timed out".into())
    });

    assert!(result.is_err());
    assert_eq!(calls.get(), 1);
    let store = fixture.state.join(STORE_DIRECTORY);
    assert_eq!(fs::read_dir(store).unwrap().count(), 0);
}

#[test]
fn stock_slot_drift_during_source_proof_prevents_publish() {
    let fixture = fixture(false);
    let calls = Cell::new(0usize);
    let result = capture_inner(&fixture.state, &fixture.app, |path| {
        calls.set(calls.get() + 1);
        fs::write(path.join("Contents/Info.plist"), b"changed stock slot").unwrap();
        Ok(source_for(path))
    });

    assert!(result.is_err());
    assert_eq!(calls.get(), 1);
    assert_eq!(
        fs::read_dir(fixture.state.join(STORE_DIRECTORY))
            .unwrap()
            .count(),
        0
    );
}

#[test]
fn fixture_source_acceptance_does_not_claim_unowned_resource_integrity() {
    let fixture = fixture(false);
    let calls = Cell::new(0usize);
    let result = capture_inner(&fixture.state, &fixture.app, |path| {
        calls.set(calls.get() + 1);
        fs::write(path.join("Contents/Resources/late-file"), b"unowned drift").unwrap();
        Ok(source_for(path))
    });

    assert!(result.is_ok());
    assert_eq!(
        calls.get(),
        1,
        "fixture source proof is bound by stock pre/post slots"
    );
    assert_eq!(
        fs::read(fixture.app.join("Contents/Resources/late-file")).unwrap(),
        b"unowned drift"
    );
}

#[test]
fn capture_reuse_verifies_source_once_and_rejects_new_source_failure() {
    let fixture = fixture(false);
    let first = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let manifest_path = generation_path(&fixture, first.baseline_id()).join("baseline.json");
    let original_manifest = fs::read(&manifest_path).unwrap();
    let calls = Cell::new(0usize);
    let reused = capture_inner(&fixture.state, &fixture.app, |path| {
        calls.set(calls.get() + 1);
        Ok(source_for(path))
    })
    .unwrap();
    assert_eq!(reused.baseline_id(), first.baseline_id());
    assert_eq!(calls.get(), 1, "reuse still authenticates this App once");

    assert!(capture_inner(&fixture.state, &fixture.app, |_path| {
        Err("current source proof failed".into())
    })
    .is_err());
    assert_eq!(fs::read(manifest_path).unwrap(), original_manifest);
    assert_eq!(
        fs::read_dir(fixture.state.join(STORE_DIRECTORY))
            .unwrap()
            .count(),
        1
    );
}

#[test]
fn capture_and_restore_verification_ignore_unowned_special_objects() {
    let fixture = fixture(false);
    let socket_path = fixture
        .app
        .join("Contents/Resources/unowned-runtime.socket");
    create_fifo(&socket_path);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();

    baseline
        .verify_restored_vendor_with(&fixture.app, successful_verifier())
        .unwrap();
    assert!(socket_path.exists());
}

fn create_fifo(path: &Path) {
    let path = CString::new(path.as_os_str().as_bytes()).unwrap();
    // SAFETY: FIFO路径位于当前测试独有的临时bundle内。
    let result = unsafe { libc::mkfifo(path.as_ptr(), 0o600) };
    assert_eq!(result, 0, "{}", std::io::Error::last_os_error());
}

#[test]
fn baseline_backs_up_only_three_required_preimages_not_the_whole_bundle() {
    let fixture = fixture(false);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let blobs = generation_path(&fixture, baseline.baseline_id()).join("blobs");

    assert_eq!(fs::read_dir(blobs).unwrap().count(), 3);
    assert!(fixture
        .app
        .join("Contents/Resources/vendor-resource.txt")
        .is_file());
}

#[test]
fn preexisting_empty_generation_is_never_replaced() {
    let fixture = fixture(false);
    let baseline = capture_inner(&fixture.state, &fixture.app, successful_verifier()).unwrap();
    let generation = generation_path(&fixture, baseline.baseline_id());
    fs::remove_dir_all(&generation).unwrap();
    fs::create_dir(&generation).unwrap();
    fs::set_permissions(&generation, fs::Permissions::from_mode(0o700)).unwrap();

    assert!(capture_inner(&fixture.state, &fixture.app, successful_verifier()).is_err());
    assert_eq!(fs::read_dir(&generation).unwrap().count(), 0);
}

#[test]
fn wrapper_injector_and_old_marker_must_be_absent() {
    for relative in [
        "Contents/MacOS/CavalryLauncher",
        "Contents/Frameworks/libCavalryTranslatorInjector.dylib",
        "Contents/Resources/cavalry-i18n-lang.txt",
    ] {
        let fixture = fixture(false);
        fs::write(fixture.app.join(relative), b"owned-slot-residue").unwrap();
        assert!(
            capture_inner(&fixture.state, &fixture.app, successful_verifier()).is_err(),
            "{relative}"
        );
        assert!(!fixture.state.join(STORE_DIRECTORY).exists());
    }
}

#[test]
fn optional_signature_component_must_be_a_regular_file_when_present() {
    let fixture = fixture(false);
    let slot = fixture.app.join("Contents/_CodeSignature/CodeDirectory");
    std::os::unix::fs::symlink(Path::new("CodeResources"), slot).unwrap();
    assert!(capture_inner(&fixture.state, &fixture.app, successful_verifier()).is_err());
    assert!(!fixture.state.join(STORE_DIRECTORY).exists());
}

#[test]
fn state_symlink_ancestor_and_bundle_child_are_rejected_before_source_proof() {
    let fixture = fixture(false);
    let linked_state = fixture._temp.path().join("linked-state");
    std::os::unix::fs::symlink(&fixture.state, &linked_state).unwrap();
    let calls = Cell::new(0usize);
    assert!(capture_inner(&linked_state, &fixture.app, |path| {
        calls.set(calls.get() + 1);
        Ok(source_for(path))
    })
    .is_err());
    assert_eq!(calls.get(), 0);

    assert!(capture_inner(fixture._temp.path(), &fixture.app, |_path| {
        Err("should not call source".into())
    })
    .is_err());
    let child = fixture.app.join("Contents/state");
    fs::create_dir(&child).unwrap();
    assert!(capture_inner(&child, &fixture.app, |_path| {
        Err("should not call source".into())
    })
    .is_err());
}

#[test]
fn lexical_dot_components_are_rejected_even_when_path_equality_normalizes_them() {
    let fixture = fixture(false);
    let app_alias = PathBuf::from(format!("{}/.", fixture.app.display()));
    let calls = Cell::new(0usize);
    assert!(capture_inner(&fixture.state, &app_alias, |path| {
        calls.set(calls.get() + 1);
        Ok(source_for(path))
    })
    .is_err());
    assert_eq!(calls.get(), 0);

    let state_alias = PathBuf::from(format!("{}/.", fixture.state.display()));
    assert!(capture_inner(&state_alias, &fixture.app, |path| {
        calls.set(calls.get() + 1);
        Ok(source_for(path))
    })
    .is_err());
    assert_eq!(calls.get(), 0);
}

#[test]
fn non_utf8_inventory_paths_and_symlink_targets_fail_closed() {
    let mut invalid_path_entries = BTreeMap::new();
    invalid_path_entries.insert(
        PathBuf::from(OsString::from_vec(b"bad-\xff-name".to_vec())),
        BundleObject::Directory { mode: 0o755 },
    );
    let invalid_path_inventory = BundleInventory {
        entries: invalid_path_entries,
    };
    assert!(super::super::contract::validate_inventory_text(&invalid_path_inventory).is_err());

    let mut invalid_target_entries = BTreeMap::new();
    invalid_target_entries.insert(
        PathBuf::from("valid-link"),
        BundleObject::Symlink {
            mode: 0o777,
            target: PathBuf::from(OsString::from_vec(b"bad-\xfe-target".to_vec())),
        },
    );
    let invalid_target_inventory = BundleInventory {
        entries: invalid_target_entries,
    };
    assert!(super::super::contract::validate_inventory_text(&invalid_target_inventory).is_err());

    let mut dot_path_entries = BTreeMap::new();
    dot_path_entries.insert(
        PathBuf::from("Contents/./Info.plist"),
        BundleObject::Directory { mode: 0o755 },
    );
    let dot_path_inventory = BundleInventory {
        entries: dot_path_entries,
    };
    assert!(super::super::contract::validate_inventory_text(&dot_path_inventory).is_err());

    let empty_root_inventory = BundleInventory {
        entries: BTreeMap::from([(PathBuf::new(), BundleObject::Directory { mode: 0o755 })]),
    };
    assert!(super::super::contract::validate_inventory_text(&empty_root_inventory).is_ok());
}

#[test]
fn app_root_symlink_is_rejected_before_source_proof() {
    let fixture = fixture(false);
    let alias = fixture._temp.path().join("Cavalry-alias.app");
    std::os::unix::fs::symlink(&fixture.app, &alias).unwrap();
    let calls = Cell::new(0usize);
    assert!(capture_inner(&fixture.state, &alias, |path| {
        calls.set(calls.get() + 1);
        Ok(source_for(path))
    })
    .is_err());
    assert_eq!(calls.get(), 0);
}
