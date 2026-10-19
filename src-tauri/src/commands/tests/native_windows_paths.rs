/**
 * [INPUT]: 依赖Windows原生路径facade、共享bundle锁测试串行器与临时任意安装根。
 * [OUTPUT]: 任意根发现/零写规划；选择持久化、同选择重试耐久写及写失败；缺目标卸载零profile写入与宿主缺失幂等恢复。
 * [POS]: Windows接线差异合同；锁用例与其他global bundle guard测试串行，只用临时目录。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

#[test]
fn arbitrary_root_and_executable_selection_share_native_layout() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().join("任意盘目录 with spaces").join("Host 2.8");
    fs::create_dir_all(&root).unwrap();
    fs::write(
        root.join("Cavalry.exe"),
        b"discovery fixture, not a verified vendor binary",
    )
    .unwrap();
    let directory = native_layout(&root).unwrap();
    let executable = native_layout(&root.join("Cavalry.exe")).unwrap();
    assert_eq!(directory, executable);
    assert!(!directory.assets_root.exists());
    assert!(
        verify_host(&root).is_err(),
        "discovery must not grant write admission"
    );
    assert_eq!(vendor_origin(&root), "unknown");
}

#[test]
fn absent_state_plan_is_canonical_without_creating_directories() {
    let temp = tempfile::tempdir().unwrap();
    let planned = temp.path().join("missing").join("native-2.8");
    let actual = canonical_state_plan(&planned).unwrap();
    assert_eq!(
        actual,
        fs::canonicalize(temp.path())
            .unwrap()
            .join("missing/native-2.8")
    );
    assert!(!planned.exists());
}

#[test]
fn verified_auto_selection_is_durable_without_legacy_revision() {
    let _serial = crate::operation_lock::lock_bundle_operation_tests();
    let temp = tempfile::tempdir().unwrap();
    let state = temp.path().join("state");
    let host = temp.path().join("自动发现 host");
    fs::create_dir_all(&host).unwrap();
    let guard = crate::operation_lock::try_begin_bundle_operation(&state).unwrap();
    guard.require_state_dir(&state).unwrap();
    super::super::status::persist_native_selection(&state, &host, "2.8.0").unwrap();
    let saved = crate::state::read_state_strict(&state).unwrap();
    assert_eq!(Path::new(&saved.app_path), host);
    assert_eq!(saved.cavalry_version, "2.8.0");
    assert!(saved.cavalry_revision.is_empty());
    let first_generation = crate::state::read_state_document(&state)
        .unwrap()
        .generation;
    assert_eq!(
        super::super::status::persist_native_selection(&state, &host, "2.8.0").unwrap(),
        saved
    );
    assert!(
        crate::state::read_state_document(&state)
            .unwrap()
            .generation
            > first_generation,
        "同路径重试必须再次走耐久写入，不能跳过先前可能失败的目录同步"
    );
}

#[test]
fn selection_write_failure_is_not_reported_as_success() {
    let temp = tempfile::tempdir().unwrap();
    let state = temp.path().join("state");
    fs::create_dir_all(state.join("state.json")).unwrap();
    assert!(super::super::status::persist_native_selection(&state, temp.path(), "2.8.0").is_err());
}

#[test]
fn uninstall_missing_empty_or_corrupt_selection_never_touches_profile() {
    for kind in ["missing", "empty", "corrupt"] {
        let temp = tempfile::tempdir().unwrap();
        let state = temp.path().join("state");
        fs::create_dir_all(&state).unwrap();
        let paths = owned_profile(temp.path());
        let files = [paths.preferences(), paths.strings(), paths.receipt()];
        let before: Vec<_> = files.iter().map(|p| fs::read(p).unwrap()).collect();
        if kind == "empty" {
            crate::state::write_state(&state, &crate::state::State::default()).unwrap();
        } else if kind == "corrupt" {
            fs::write(state.join("state.json"), b"not json").unwrap();
        }
        let result = restore_from_saved_state(
            &state,
            || {
                super::super::user_language_files::restore_owned_english_with_writer_guard(
                    &paths,
                    &mut || Ok(()),
                )
                .map(|_| ())
            },
            |_| panic!("runtime must not run without a target"),
        );
        assert!(result.is_err(), "{kind}");
        let after: Vec<_> = files.iter().map(|p| fs::read(p).unwrap()).collect();
        assert_eq!(after, before, "{kind}");
    }
}

fn owned_profile(root: &Path) -> UserLanguagePaths {
    fs::create_dir_all(root.join("profile")).unwrap();
    fs::create_dir_all(root.join("state")).unwrap();
    let paths = super::super::user_language_files::fixture_paths(root).unwrap();
    fs::write(
        paths.preferences(),
        br#"{"locale":{"varType":"string","value":"en-GB"},"keep":42}"#,
    )
    .unwrap();
    let pack = br#"[{"type":"strings","language":"zh-Hans","value":{"fixture.key":{"UI-text":"fixture display"}}}]"#;
    super::super::user_language_files::apply(&paths, "zh-Hans", pack).unwrap();
    paths
}

#[test]
fn native_restart_admission_keeps_owned_drift_pending_and_unknown_guards() {
    let temp = tempfile::tempdir().unwrap();
    let paths = owned_profile(temp.path());
    native_user::restart_profile_admission(&paths).unwrap();
    let strings = fs::read(paths.strings()).unwrap();
    fs::write(paths.strings(), b"drift").unwrap();
    assert!(native_user::restart_profile_admission(&paths).is_err());
    fs::write(paths.strings(), &strings).unwrap();
    let receipt = fs::read(paths.receipt()).unwrap();
    fs::remove_file(paths.receipt()).unwrap();
    assert!(native_user::restart_profile_admission(&paths).is_err());
    fs::write(paths.receipt(), receipt).unwrap();
    let pending = super::super::user_language_files::apply_with_interrupt(
        &paths,
        "zh-Hans",
        &strings,
        Some(super::super::user_language_files::InterruptAfter::ResourcePublish),
    );
    assert!(pending.is_err());
    assert!(native_user::restart_profile_admission(&paths).is_err());
}

#[test]
fn uninstall_removed_host_restores_profile_idempotently_without_runtime() {
    let temp = tempfile::tempdir().unwrap();
    let state = temp.path().join("state");
    crate::state::write_state(
        &state,
        &crate::state::State {
            app_path: temp
                .path()
                .join("removed host")
                .to_string_lossy()
                .into_owned(),
            cavalry_version: "2.8.0".into(),
            ..Default::default()
        },
    )
    .unwrap();
    let calls = std::cell::Cell::new(0);
    for _ in 0..2 {
        restore_from_saved_state(
            &state,
            || {
                calls.set(calls.get() + 1);
                Ok(())
            },
            |_| panic!("removed host has no runtime to restore"),
        )
        .unwrap();
    }
    assert_eq!(calls.get(), 2);
}

#[test]
fn uninstall_runtime_only_follows_successful_profile_restore() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().join("host");
    fs::create_dir_all(&root).unwrap();
    fs::write(root.join("Cavalry.exe"), b"fixture").unwrap();
    let state = temp.path().join("state");
    crate::state::write_state(
        &state,
        &crate::state::State {
            app_path: root.to_string_lossy().into_owned(),
            ..Default::default()
        },
    )
    .unwrap();
    let order = std::cell::RefCell::new(Vec::new());
    restore_from_saved_state(
        &state,
        || {
            order.borrow_mut().push("profile");
            Ok(())
        },
        |actual| {
            assert_eq!(actual, root);
            order.borrow_mut().push("runtime");
            Ok(())
        },
    )
    .unwrap();
    assert_eq!(*order.borrow(), ["profile", "runtime"]);
    assert!(restore_from_saved_state(
        &state,
        || Err("profile refused".into()),
        |_| panic!("failed profile must not reach runtime")
    )
    .is_err());
}
