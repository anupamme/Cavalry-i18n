/**
 * [INPUT]: 依赖native_mac_bundle_inventory与临时Unix文件系统fixture。
 * [OUTPUT]: 证明对象类型、hash/mode、symlink、安全打开和精确资源边界合同。
 * [POS]: 文件清单模块的隔离合同；不访问Cavalry.app、用户profile或签名工具。
 * regular→FIFO替换必须非阻塞失败，不能生成对象记录。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs,
    os::unix::{ffi::OsStrExt, fs::PermissionsExt, net::UnixListener},
    path::{Path, PathBuf},
    sync::mpsc,
    thread,
    time::Duration,
};

use super::{
    inventory_bundle, inventory_with_limits, BundleInventory, BundleObject, InventoryBuilder,
    InventoryLimits,
};

fn canonical(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap()
}

fn inventory(path: &Path) -> BundleInventory {
    inventory_bundle(&canonical(path)).unwrap()
}

fn object<'a>(inventory: &'a BundleInventory, path: &str) -> &'a BundleObject {
    inventory.entries.get(Path::new(path)).unwrap()
}

fn builder(root: &Path) -> InventoryBuilder<'_> {
    InventoryBuilder {
        root,
        root_stamp: super::validate_canonical_root(root).unwrap(),
        limits: InventoryLimits::default(),
        total_bytes: 0,
        entries: Default::default(),
    }
}

#[test]
fn regular_file_records_mode_length_and_sha256() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("payload.bin"), b"data").unwrap();
    fs::set_permissions(
        temp.path().join("payload.bin"),
        fs::Permissions::from_mode(0o640),
    )
    .unwrap();

    let result = inventory(temp.path());
    assert!(matches!(
        object(&result, "payload.bin"),
        BundleObject::RegularFile {
            mode: 0o640,
            byte_len: 4,
            sha256,
        } if sha256 == "3a6eb0790f39ac87c94f3856b2dd2c5d110e6811602261a9a923d3bb23adc8b7"
    ));
}

#[test]
fn regular_content_change_changes_inventory() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("payload.bin"), b"data").unwrap();
    let before = inventory(temp.path());
    fs::write(temp.path().join("payload.bin"), b"else").unwrap();
    assert_ne!(before, inventory(temp.path()));
}

#[test]
fn regular_mode_change_changes_inventory() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("payload.bin");
    fs::write(&path, b"same bytes").unwrap();
    let before = inventory(temp.path());
    fs::set_permissions(&path, fs::Permissions::from_mode(0o600)).unwrap();
    assert_ne!(before, inventory(temp.path()));
}

#[test]
fn directory_mode_change_changes_inventory() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("nested");
    fs::create_dir(&path).unwrap();
    let before = inventory(temp.path());
    fs::set_permissions(&path, fs::Permissions::from_mode(0o700)).unwrap();
    assert_ne!(before, inventory(temp.path()));
}

#[test]
fn additions_and_removals_change_inventory() {
    let temp = tempfile::tempdir().unwrap();
    let baseline = inventory(temp.path());
    let added = temp.path().join("new-file");
    fs::write(&added, b"new").unwrap();
    assert_ne!(baseline, inventory(temp.path()));
    fs::remove_file(added).unwrap();
    assert_eq!(baseline, inventory(temp.path()));
}

#[test]
fn directory_and_file_replacement_changes_typed_inventory() {
    let temp = tempfile::tempdir().unwrap();
    let directory_path = temp.path().join("directory-slot");
    let file_path = temp.path().join("file-slot");
    fs::create_dir(&directory_path).unwrap();
    fs::write(&file_path, b"file").unwrap();
    let before = inventory(temp.path());

    fs::remove_dir(&directory_path).unwrap();
    fs::write(&directory_path, b"now-file").unwrap();
    fs::remove_file(&file_path).unwrap();
    fs::create_dir(&file_path).unwrap();
    let after = inventory(temp.path());

    assert_ne!(before, after);
    assert!(matches!(
        object(&after, "directory-slot"),
        BundleObject::RegularFile { .. }
    ));
    assert!(matches!(
        object(&after, "file-slot"),
        BundleObject::Directory { .. }
    ));
}

#[test]
fn directory_symlink_is_recorded_without_traversing_external_target() {
    use std::os::unix::fs::symlink;

    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().join("bundle");
    let outside = temp.path().join("outside");
    fs::create_dir(&root).unwrap();
    fs::create_dir(&outside).unwrap();
    fs::write(outside.join("secret"), b"outside").unwrap();
    symlink(&outside, root.join("external-directory")).unwrap();

    let result = inventory(&root);
    assert!(matches!(
        object(&result, "external-directory"),
        BundleObject::Symlink { target, .. } if target == &outside
    ));
    assert!(!result
        .entries
        .contains_key(Path::new("external-directory/secret")));
}

#[test]
fn broken_symlink_is_recorded_with_its_unresolved_target() {
    use std::os::unix::fs::symlink;

    let temp = tempfile::tempdir().unwrap();
    let target = PathBuf::from("missing/target");
    symlink(&target, temp.path().join("broken-link")).unwrap();

    let result = inventory(temp.path());
    assert!(matches!(
        object(&result, "broken-link"),
        BundleObject::Symlink { target: found, .. } if found == &target
    ));
}

#[test]
fn symlink_root_is_rejected() {
    use std::os::unix::fs::symlink;

    let temp = tempfile::tempdir().unwrap();
    let real_root = temp.path().join("real-bundle");
    fs::create_dir(&real_root).unwrap();
    let linked_root = temp.path().join("linked-bundle");
    symlink(&real_root, &linked_root).unwrap();

    assert!(inventory_bundle(&linked_root).is_err());
}

#[test]
fn non_regular_special_file_is_rejected() {
    let temp = tempfile::tempdir().unwrap();
    let socket_path = temp.path().join("local-socket");
    let listener = UnixListener::bind(&socket_path).unwrap();
    let error = inventory_bundle(&canonical(temp.path())).unwrap_err();
    drop(listener);
    assert!(error.contains("special"), "{error}");
}

#[test]
fn object_count_limit_is_enforced() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("one"), b"1").unwrap();
    let limits = InventoryLimits {
        max_objects: 1,
        max_total_bytes: 100,
        max_depth: 10,
    };
    assert!(inventory_with_limits(&canonical(temp.path()), limits).is_err());
}

#[test]
fn total_byte_limit_is_enforced() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("too-large"), b"four").unwrap();
    let limits = InventoryLimits {
        max_objects: 10,
        max_total_bytes: 3,
        max_depth: 10,
    };
    assert!(inventory_with_limits(&canonical(temp.path()), limits).is_err());
}

#[test]
fn exact_object_limit_is_allowed() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("one"), b"1").unwrap();
    let limits = InventoryLimits {
        max_objects: 2,
        max_total_bytes: 1,
        max_depth: 1,
    };
    let result = inventory_with_limits(&canonical(temp.path()), limits).unwrap();
    assert_eq!(result.entries.len(), 2);
}

#[test]
fn exact_total_byte_limit_is_allowed() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("payload"), b"data").unwrap();
    let limits = InventoryLimits {
        max_objects: 10,
        max_total_bytes: 4,
        max_depth: 10,
    };
    let result = inventory_with_limits(&canonical(temp.path()), limits).unwrap();
    assert!(matches!(
        object(&result, "payload"),
        BundleObject::RegularFile { byte_len: 4, .. }
    ));
}

#[test]
fn exact_depth_limit_is_allowed() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("depth-one"), b"ok").unwrap();
    let limits = InventoryLimits {
        max_objects: 10,
        max_total_bytes: 2,
        max_depth: 1,
    };
    let result = inventory_with_limits(&canonical(temp.path()), limits).unwrap();
    assert!(result.entries.contains_key(Path::new("depth-one")));
}

#[test]
fn depth_limit_is_enforced() {
    let temp = tempfile::tempdir().unwrap();
    let nested = temp.path().join("one").join("two");
    fs::create_dir_all(&nested).unwrap();
    let limits = InventoryLimits {
        max_objects: 10,
        max_total_bytes: 100,
        max_depth: 1,
    };
    assert!(inventory_with_limits(&canonical(temp.path()), limits).is_err());
}

#[test]
fn symlink_target_bytes_count_against_exact_total_byte_limit() {
    use std::os::unix::fs::symlink;

    let temp = tempfile::tempdir().unwrap();
    let target = PathBuf::from("missing");
    symlink(&target, temp.path().join("link")).unwrap();
    let target_bytes = target.as_os_str().as_bytes().len() as u64;
    let exact = InventoryLimits {
        max_objects: 2,
        max_total_bytes: target_bytes,
        max_depth: 1,
    };
    let result = inventory_with_limits(&canonical(temp.path()), exact).unwrap();
    assert!(matches!(
        object(&result, "link"),
        BundleObject::Symlink { .. }
    ));

    let too_small = InventoryLimits {
        max_total_bytes: target_bytes - 1,
        ..exact
    };
    assert!(inventory_with_limits(&canonical(temp.path()), too_small).is_err());
}

#[test]
fn replacement_regular_file_fails_metadata_identity_recheck() {
    let temp = tempfile::tempdir().unwrap();
    let root = canonical(temp.path());
    let path = root.join("victim");
    let old_path = root.join("old-victim");
    fs::write(&path, b"original").unwrap();
    let old_metadata = fs::symlink_metadata(&path).unwrap();
    fs::rename(&path, &old_path).unwrap();
    fs::write(&path, b"replacement").unwrap();

    let mut scan = builder(&root);
    let error = scan
        .record_regular_file(Path::new("victim"), &path, &old_metadata)
        .unwrap_err();
    assert!(error.contains("identity or metadata changed"), "{error}");
    assert!(scan.entries.is_empty());
}

#[test]
fn regular_to_fifo_race_fails_without_blocking_or_recording() {
    use std::ffi::CString;

    let temp = tempfile::tempdir().unwrap();
    let root = canonical(temp.path());
    let path = root.join("victim");
    let old_path = root.join("old-victim");
    fs::write(&path, b"original").unwrap();
    let old_metadata = fs::symlink_metadata(&path).unwrap();
    fs::rename(&path, &old_path).unwrap();
    let c_path = CString::new(path.as_os_str().as_bytes()).unwrap();
    let result = unsafe { libc::mkfifo(c_path.as_ptr(), 0o600) };
    assert_eq!(result, 0, "{}", std::io::Error::last_os_error());

    let root_for_worker = root.clone();
    let path_for_worker = path.clone();
    let (sender, receiver) = mpsc::channel();
    let worker = thread::spawn(move || {
        let mut scan = builder(&root_for_worker);
        let result = scan.record_regular_file(Path::new("victim"), &path_for_worker, &old_metadata);
        sender.send((result, scan.entries.is_empty())).unwrap();
    });
    let (result, inventory_empty) = receiver
        .recv_timeout(Duration::from_secs(5))
        .expect("O_NONBLOCK must prevent FIFO open from waiting for a writer");
    worker.join().unwrap();
    let error = result.unwrap_err();
    assert!(error.contains("special object"), "{error}");
    assert!(inventory_empty);
}

#[test]
fn stable_bundle_has_equal_repeated_inventories() {
    let temp = tempfile::tempdir().unwrap();
    fs::create_dir(temp.path().join("nested")).unwrap();
    fs::write(temp.path().join("nested/file"), b"stable").unwrap();
    let first = inventory(temp.path());
    let second = inventory(temp.path());
    assert_eq!(first, second);
}
