/**
 * [INPUT]: 依赖approved/staged source SHA、runtime owner、baseline与fixture签名端口。
 * [OUTPUT]: 验证runtime写入、签名顺序、回滚和owner重放合同。
 * [POS]: NRT writer主测试集；Keychain兼容合同由keychain子模块隔离。
 * Fixture只验槽或模拟codesign，不证明厂商；ignored smoke不启动App。
 * coordinator烟测先核编译期候选，再复制原厂副本。
 * writer耗时子测试分离baseline、stock写入、严格验签与vendor恢复，不调用整树审计。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;
use crate::{
    native_mac_bundle_inventory::inventory_bundle,
    native_mac_vendor_baseline::{load_baseline, tests as baseline_tests},
};
use std::{
    ffi::CString,
    fs,
    os::unix::{ffi::OsStrExt, fs::PermissionsExt},
    path::{Path, PathBuf},
};

fn encode_test_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

// 仅模拟 codesign 命令端口；返回成功不构成真实厂商签名证明。
#[derive(Default)]
struct Signer {
    app: PathBuf,
    fail_verify: bool,
    drift_vendor: bool,
    late_vendor_drift_at: Option<usize>,
    signature_verifications: usize,
    nested_verifications: usize,
    bundle_verifications: usize,
    signature_writes: usize,
    assert_quarantine_cleared_before_verify: bool,
    commands: Vec<(String, Vec<String>)>,
}

impl CommandRunner for Signer {
    fn run(&mut self, program: &str, args: &[String]) -> Result<(), String> {
        self.commands.push((program.into(), args.to_vec()));
        let is_verify =
            program == "codesign" && args.first().map(String::as_str) == Some("--verify");
        if is_verify {
            self.signature_verifications += 1;
            if args.iter().any(|arg| arg == "--deep") {
                self.bundle_verifications += 1;
            } else {
                self.nested_verifications += 1;
            }
            if self.assert_quarantine_cleared_before_verify {
                assert!(!test_quarantine_present(&self.app));
            }
            if self.late_vendor_drift_at == Some(self.signature_verifications) {
                fs::write(
                    self.app.join("Contents/Resources/vendor-resource.txt"),
                    b"late external drift",
                )
                .unwrap();
            }
        }
        if program == "codesign" && args.first().map(String::as_str) == Some("--force") {
            self.signature_writes += 1;
            let target = Path::new(args.last().unwrap());
            if target == self.app {
                fs::write(
                    self.app.join("Contents/_CodeSignature/CodeResources"),
                    b"managed fixture seal",
                )
                .unwrap();
                if self.drift_vendor {
                    fs::write(
                        self.app.join("Contents/Resources/vendor-resource.txt"),
                        b"external drift",
                    )
                    .unwrap();
                }
            } else {
                let mut bytes = fs::read(target).unwrap();
                bytes.extend_from_slice(b" fixture code signature");
                fs::write(target, bytes).unwrap();
            }
        }
        if self.fail_verify
            && program == "codesign"
            && args.first().map(String::as_str) == Some("--verify")
        {
            return Err("fixture signing verification failed".into());
        }
        Ok(())
    }

    fn spawn_detached(&mut self, _: &str, _: &[String]) -> Result<(), String> {
        panic!("runtime installation must not launch an app")
    }
}

fn set_test_quarantine(path: &Path, value: &[u8]) {
    let path = CString::new(path.as_os_str().as_bytes()).unwrap();
    let name = CString::new("com.apple.quarantine").unwrap();
    let result = unsafe {
        libc::setxattr(
            path.as_ptr(),
            name.as_ptr(),
            value.as_ptr().cast(),
            value.len(),
            0,
            0,
        )
    };
    assert_eq!(
        result,
        0,
        "could not set fixture quarantine: {}",
        std::io::Error::last_os_error()
    );
}

fn test_quarantine_present(path: &Path) -> bool {
    let path = CString::new(path.as_os_str().as_bytes()).unwrap();
    let name = CString::new("com.apple.quarantine").unwrap();
    let length =
        unsafe { libc::getxattr(path.as_ptr(), name.as_ptr(), std::ptr::null_mut(), 0, 0, 0) };
    if length >= 0 {
        return true;
    }
    let error = std::io::Error::last_os_error();
    assert_eq!(
        error.raw_os_error(),
        Some(libc::ENOATTR),
        "xattr read failed: {error}"
    );
    false
}

fn fixture() -> (
    baseline_tests::Fixture,
    VerifiedNativeVendorBaseline,
    PathBuf,
) {
    let fixture = baseline_tests::fixture(false);
    fs::write(fixture.app.join("Contents/Info.plist"), br#"<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>Cavalry</string><key>CFBundleIdentifier</key><string>com.scenegroup.cavalry</string></dict></plist>"#).unwrap();
    let id = baseline_tests::capture_fixture_baseline(&fixture.app, &fixture.state);
    let baseline = load_baseline(&fixture.app, &fixture.state, &id).unwrap();
    let source = fixture.app.parent().unwrap().join("packaged-fixture.dylib");
    fs::write(&source, b"injector fixture").unwrap();
    (fixture, baseline, source)
}

#[path = "native_mac_runtime_keychain_tests.rs"]
mod keychain;
#[path = "native_mac_runtime_apply_timing_tests.rs"]
mod timing_smoke;

fn verify_fixture<R: CommandRunner>(
    b: &VerifiedNativeVendorBaseline,
    app: &Path,
    _: &mut R,
) -> Result<(), String> {
    // Fixture slot equality is not an Apple code-signature proof.
    baseline_tests::verify_fixture_baseline(b, app)
}

fn verify_managed_fixture<R: CommandRunner>(
    _: &VerifiedNativeVendorBaseline,
    _: &Path,
    _: &mut R,
) -> Result<(), String> {
    // 受管准入由生产owner槽门验证；fixture签名端口不充当厂商证明。
    Ok(())
}

fn assert_extension_is_fully_patched(app: &Path) {
    let extension = fs::read(app.join("Contents/Frameworks/libExtensionLayer.dylib")).unwrap();
    let (_, report) = crate::keychain_patch::patch_keychain_query_attributes_owned(extension)
        .expect("managed ExtensionLayer remains a valid Mach-O after signing");
    assert_eq!(report.patched_callsites, 0);
    assert!(report.already_patched_callsites > 0);
    assert!(report
        .details
        .iter()
        .all(|detail| { detail.patched_callsites == 0 && detail.already_patched_callsites > 0 }));
}

#[test]
fn stock_plan_installs_through_native_journal_without_profile_or_state_commit() {
    let (f, baseline, source) = fixture();
    set_test_quarantine(&f.app, b"fixture-quarantine");
    fs::set_permissions(&source, fs::Permissions::from_mode(0o755)).unwrap();
    fs::write(f.state.join("state.json"), b"unrelated state document").unwrap();
    let main_before = fs::read(f.app.join("Contents/MacOS/Cavalry")).unwrap();
    let stage = f.app.parent().unwrap().join("runtime-stage");
    let mut signer = Signer {
        app: f.app.clone(),
        assert_quarantine_cleared_before_verify: true,
        ..Default::default()
    };
    let warnings = install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &stage,
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap();
    assert!(warnings.is_empty());
    assert_eq!(signer.signature_writes, 4);
    assert_eq!(signer.nested_verifications, 3);
    assert_eq!(signer.bundle_verifications, 1);
    assert_eq!(signer.signature_verifications, 4);
    let last_sign = signer
        .commands
        .iter()
        .rposition(|(program, args)| {
            program == "codesign" && args.first().map(String::as_str) == Some("--force")
        })
        .unwrap();
    let first_verify = signer
        .commands
        .iter()
        .position(|(program, args)| {
            program == "codesign" && args.first().map(String::as_str) == Some("--verify")
        })
        .unwrap();
    assert!(
        last_sign < first_verify,
        "final verification must follow all four signature writes"
    );
    assert!(!test_quarantine_present(&f.app));
    let owned = privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    assert_eq!(owned.baseline_id(), baseline.baseline_id());
    assert!(privilege::has_native_runtime_owner_for_selection(
        &f.state, &f.app
    ));
    let owner: serde_json::Value =
        serde_json::from_slice(&fs::read(f.state.join("native-runtime-owner.json")).unwrap())
            .unwrap();
    assert_eq!(owner["schemaVersion"], 3);
    assert_eq!(
        owner["runtimeSourceSha256"],
        format!("{:x}", Sha256::digest(b"injector fixture"))
    );
    assert_eq!(owner["slots"].as_object().unwrap().len(), 9);
    assert_eq!(owner["baselineId"], baseline.baseline_id());
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert_eq!(
        fs::read(f.state.join("state.json")).unwrap(),
        b"unrelated state document"
    );
    assert_ne!(
        fs::read(f.app.join("Contents/MacOS/Cavalry")).unwrap(),
        main_before
    );
    assert_extension_is_fully_patched(&f.app);
    assert_eq!(
        fs::metadata(f.app.join("Contents/Frameworks/libExtensionLayer.dylib"))
            .unwrap()
            .permissions()
            .mode()
            & 0o7777,
        0o755
    );
    let wrapper = f.app.join("Contents/MacOS/CavalryLauncher");
    assert_eq!(
        fs::metadata(&wrapper).unwrap().permissions().mode() & 0o7777,
        0o755
    );
    assert!(fs::read_to_string(wrapper).unwrap().contains(
        &baseline
            .state_dir()
            .join("macos-apply-transaction")
            .to_string_lossy()
            .to_string()
    ));
    let info = plist::Value::from_reader(std::io::Cursor::new(
        fs::read(f.app.join("Contents/Info.plist")).unwrap(),
    ))
    .unwrap();
    assert_eq!(
        info.as_dictionary().unwrap()["CFBundleExecutable"].as_string(),
        Some("CavalryLauncher")
    );
    let injector = f
        .app
        .join("Contents/Frameworks/libCavalryTranslatorInjector.dylib");
    assert_eq!(
        fs::read(&injector).unwrap(),
        b"injector fixture fixture code signature"
    );
    assert_eq!(
        fs::metadata(&injector).unwrap().permissions().mode() & 0o7777,
        0o755
    );
    let verified_owner = privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    assert_eq!(verified_owner.baseline_id(), baseline.baseline_id());
    assert!(!f
        .app
        .join("Contents/Resources/cavalry-i18n-lang.txt")
        .exists());
    // quarantine走既有fd-bound实现；只断言本owner应发出的实际签名命令。
    assert!(signer.commands.iter().any(|(program, args)| {
        program == "codesign"
            && args.iter().any(|arg| arg == "--deep")
            && args.last() == Some(&f.app.to_string_lossy().to_string())
    }));
}

#[test]
fn stock_slot_preimage_rejection_precedes_staging_and_bundle_mutation() {
    let (f, baseline, source) = fixture();
    let before = inventory_bundle(&f.app).unwrap();
    let stage = f.app.parent().unwrap().join("runtime-stage");
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };
    let error = install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &stage,
        &source,
        &mut signer,
        |_, _, _| Err("slot preimage refused".into()),
    )
    .unwrap_err();
    assert_eq!(error.message, "slot preimage refused");
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert!(signer.commands.is_empty());
}

#[test]
fn stock_install_rejects_a_caller_hash_that_does_not_match_staged_source() {
    let (f, baseline, source) = fixture();
    let operation = crate::operation_lock::try_begin_bundle_operation(&f.state).unwrap();
    let before = inventory_bundle(&f.app).unwrap();
    let stage = f.app.parent().unwrap().join("runtime-stage");
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };

    let error = install_stock_native_runtime(
        &operation,
        &baseline,
        &f.app,
        &stage,
        &source,
        &"0".repeat(64),
        &mut signer,
    )
    .unwrap_err();

    assert!(
        error.contains("Staged runtime source SHA differs"),
        "{error}"
    );
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert!(signer.commands.is_empty());
}

#[test]
fn stock_signing_failure_rolls_back_exact_bundle_and_keeps_recovery_journal() {
    let (f, baseline, source) = fixture();
    let before = inventory_bundle(&f.app).unwrap();
    let stage = f.app.parent().unwrap().join("runtime-stage");
    let mut signer = Signer {
        app: f.app.clone(),
        fail_verify: true,
        ..Default::default()
    };
    let error = install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &stage,
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap_err();
    assert!(
        error.contains("fixture signing verification failed"),
        "{error}"
    );
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert!(f.state.join("macos-apply-transaction").exists());
    assert!(!stage.exists());
    baseline_tests::verify_fixture_baseline(&baseline, &f.app).unwrap();
}

#[test]
fn stock_install_preserves_unowned_vendor_changes_without_claiming_source_proof() {
    let (f, baseline, source) = fixture();
    let stage = f.app.parent().unwrap().join("runtime-stage");
    let mut signer = Signer {
        app: f.app.clone(),
        drift_vendor: true,
        ..Default::default()
    };
    let warnings = install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &stage,
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap();
    assert!(warnings.is_empty());
    assert_eq!(
        fs::read(f.app.join("Contents/Resources/vendor-resource.txt")).unwrap(),
        b"external drift"
    );
    assert!(f.app.join("Contents/MacOS/CavalryLauncher").exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert!(f.state.join("native-runtime-owner.json").exists());
    assert!(signer.commands.iter().any(|(program, args)| {
        program == "codesign" && args.first().map(String::as_str) == Some("--verify")
    }));
}

#[test]
fn managed_admission_ignores_unowned_vendor_changes() {
    for drift in ["resource", "mode", "unknown"] {
        let (f, _, mut signer) = installed_fixture();
        match drift {
            "resource" => fs::write(
                f.app.join("Contents/Resources/vendor-resource.txt"),
                b"changed resource",
            )
            .unwrap(),
            "mode" => fs::set_permissions(
                f.app.join("Contents/Resources/vendor-resource.txt"),
                fs::Permissions::from_mode(0o700),
            )
            .unwrap(),
            _ => fs::write(
                f.app.join("Contents/Resources/unknown.txt"),
                b"unknown member",
            )
            .unwrap(),
        }
        assert!(
            privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
                .unwrap()
                .is_some(),
            "{drift}"
        );
        match drift {
            "resource" => assert_eq!(
                fs::read(f.app.join("Contents/Resources/vendor-resource.txt")).unwrap(),
                b"changed resource"
            ),
            "mode" => assert_eq!(
                fs::metadata(f.app.join("Contents/Resources/vendor-resource.txt"))
                    .unwrap()
                    .permissions()
                    .mode()
                    & 0o7777,
                0o700
            ),
            _ => assert_eq!(
                fs::read(f.app.join("Contents/Resources/unknown.txt")).unwrap(),
                b"unknown member"
            ),
        }
    }
}

#[test]
fn stock_slot_preimage_rejection_removes_only_its_fresh_staging() {
    let (f, baseline, source) = fixture();
    let before = inventory_bundle(&f.app).unwrap();
    let stage = f.app.parent().unwrap().join("runtime-stage");
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };
    let mut calls = 0;
    let error = install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &stage,
        &source,
        &mut signer,
        |_, _, _| {
            calls += 1;
            Err("stock slot preimage refused".into())
        },
    )
    .unwrap_err();
    assert_eq!(calls, 1);
    assert_eq!(error.message, "stock slot preimage refused");
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
}

#[test]
fn stock_install_never_removes_an_existing_unowned_stage() {
    let (f, baseline, source) = fixture();
    let stage = f.app.parent().unwrap().join("runtime-stage");
    fs::create_dir(&stage).unwrap();
    fs::write(stage.join("unowned.txt"), b"keep this").unwrap();
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };
    assert!(install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &stage,
        &source,
        &mut signer,
        verify_fixture
    )
    .is_err());
    assert_eq!(fs::read(stage.join("unowned.txt")).unwrap(), b"keep this");
    assert!(!f.state.join("macos-apply-transaction").exists());
}

#[test]
fn stock_final_proof_preserves_unowned_vendor_changes() {
    for verification in [1, 3] {
        let (f, baseline, source) = fixture();
        let stage = f.app.parent().unwrap().join("runtime-stage");
        let mut signer = Signer {
            app: f.app.clone(),
            late_vendor_drift_at: Some(verification),
            ..Default::default()
        };
        let warnings = install_stock_native_runtime_with(
            &baseline,
            &f.app,
            &stage,
            &source,
            &mut signer,
            verify_fixture,
        )
        .unwrap();
        assert!(warnings.is_empty());
        assert_eq!(signer.bundle_verifications, 1);
        assert_eq!(signer.nested_verifications, 3);
        assert_eq!(signer.signature_verifications, 4);
        assert!(!f.state.join("macos-apply-transaction").exists());
        assert!(f.state.join("native-runtime-owner.json").exists());
        assert!(f.app.join("Contents/MacOS/CavalryLauncher").exists());
        assert!(!stage.exists());
        assert_eq!(
            fs::read(f.app.join("Contents/Resources/vendor-resource.txt")).unwrap(),
            b"late external drift"
        );
    }
}

fn installed_fixture() -> (
    baseline_tests::Fixture,
    VerifiedNativeVendorBaseline,
    Signer,
) {
    let (f, baseline, source) = fixture();
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };
    install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &f.app.parent().unwrap().join("install-stage"),
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap();
    (f, baseline, signer)
}

fn install_managed_fixture_update(
    f: &baseline_tests::Fixture,
    baseline: &VerifiedNativeVendorBaseline,
    signer: &mut Signer,
    source_bytes: &[u8],
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError> {
    let owned = privilege::load_owned_native_runtime_details(&f.state, &f.app, signer)
        .unwrap()
        .expect("managed fixture owner");
    install_managed_fixture_update_with_owner(f, baseline, signer, source_bytes, &owned.preimage)
}

fn install_managed_fixture_update_with_owner(
    f: &baseline_tests::Fixture,
    baseline: &VerifiedNativeVendorBaseline,
    signer: &mut Signer,
    source_bytes: &[u8],
    previous_owner_preimage: &privilege::NativeRuntimeOwnerPreimage,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError> {
    let source = f
        .app
        .parent()
        .unwrap()
        .join("packaged-fixture-update.dylib");
    fs::write(&source, source_bytes).unwrap();
    let source_sha256 = runtime_source_sha256(&source).unwrap();
    let stage = f.app.parent().unwrap().join("managed-update-stage");
    install_managed_native_runtime_with(
        baseline,
        &f.app,
        &stage,
        &source,
        &source_sha256,
        previous_owner_preimage,
        signer,
        verify_managed_fixture,
    )
}

#[test]
fn managed_update_publishes_new_source_hash_and_keeps_the_same_baseline_owner() {
    let (f, baseline, mut signer) = installed_fixture();
    let old_owner = fs::read(f.state.join("native-runtime-owner.json")).unwrap();
    let new_source = b"approved injector fixture B";
    install_managed_fixture_update(&f, &baseline, &mut signer, new_source).unwrap();

    let owner: serde_json::Value =
        serde_json::from_slice(&fs::read(f.state.join("native-runtime-owner.json")).unwrap())
            .unwrap();
    assert_eq!(owner["schemaVersion"], 3);
    assert_eq!(
        owner["runtimeSourceSha256"],
        format!("{:x}", Sha256::digest(new_source))
    );
    assert_eq!(
        fs::metadata(f.state.join("native-runtime-owner.json"))
            .unwrap()
            .permissions()
            .mode()
            & 0o7777,
        0o600
    );
    assert_eq!(owner["baselineId"], baseline.baseline_id());
    assert!(owner["operationId"].as_str().is_some());
    assert_ne!(
        serde_json::from_slice::<serde_json::Value>(&old_owner).unwrap()["operationId"],
        owner["operationId"]
    );
    assert_eq!(
        fs::read(
            f.app
                .join("Contents/Frameworks/libCavalryTranslatorInjector.dylib")
        )
        .unwrap(),
        b"approved injector fixture B fixture code signature"
    );
    let loaded = privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    assert_eq!(loaded.baseline.baseline_id(), baseline.baseline_id());
    let expected_sha256 = format!("{:x}", Sha256::digest(new_source));
    assert_eq!(
        loaded.source_sha256.as_deref(),
        Some(expected_sha256.as_str())
    );
    assert!(!f.state.join("macos-apply-transaction").exists());
}

#[test]
fn managed_update_rejects_owner_changed_after_its_read_only_snapshot() {
    let (f, baseline, mut signer) = installed_fixture();
    let owned = privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    let owner_path = f.state.join("native-runtime-owner.json");
    fs::write(&owner_path, b"foreign owner state").unwrap();
    fs::set_permissions(&owner_path, fs::Permissions::from_mode(0o600)).unwrap();
    let source = f.app.parent().unwrap().join("changed-owner-source.dylib");
    fs::write(&source, b"new approved bytes").unwrap();
    let source_sha256 = runtime_source_sha256(&source).unwrap();
    let before = inventory_bundle(&f.app).unwrap();
    let stage = f.app.parent().unwrap().join("managed-update-stage");

    let error = install_managed_native_runtime_with(
        &baseline,
        &f.app,
        &stage,
        &source,
        &source_sha256,
        &owned.preimage,
        &mut signer,
        verify_managed_fixture,
    )
    .unwrap_err();

    assert!(
        error.contains("owner changed before the NRT journal began"),
        "{error}"
    );
    assert_eq!(fs::read(owner_path).unwrap(), b"foreign owner state");
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
}

#[test]
fn managed_update_rejects_a_caller_hash_that_does_not_match_staged_source() {
    let (f, baseline, mut signer) = installed_fixture();
    let owned = privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    let prior_command_count = signer.commands.len();
    let operation = crate::operation_lock::try_begin_bundle_operation(&f.state).unwrap();
    let owner_path = f.state.join("native-runtime-owner.json");
    let prior_owner = fs::read(&owner_path).unwrap();
    let before = inventory_bundle(&f.app).unwrap();
    let source = f
        .app
        .parent()
        .unwrap()
        .join("managed-source-mismatch.dylib");
    fs::write(&source, b"approved source bytes").unwrap();
    let stage = f.app.parent().unwrap().join("managed-mismatch-stage");

    let error = install_managed_native_runtime(
        &operation,
        &baseline,
        &f.app,
        &stage,
        &source,
        &"0".repeat(64),
        &owned.preimage,
        &mut signer,
    )
    .unwrap_err();

    assert!(
        error.contains("Staged runtime source SHA differs"),
        "{error}"
    );
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert_eq!(fs::read(owner_path).unwrap(), prior_owner);
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert_eq!(signer.commands.len(), prior_command_count);
}

#[test]
fn managed_signing_failure_rolls_back_bundle_and_preserves_the_exact_prior_owner() {
    let (f, baseline, mut signer) = installed_fixture();
    let owner_path = f.state.join("native-runtime-owner.json");
    let owned = privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    let prior_owner = fs::read(&owner_path).unwrap();
    let prior_mode = fs::metadata(&owner_path).unwrap().permissions().mode() & 0o7777;
    let before = inventory_bundle(&f.app).unwrap();
    signer.fail_verify = true;

    let error = install_managed_fixture_update_with_owner(
        &f,
        &baseline,
        &mut signer,
        b"update bytes",
        &owned.preimage,
    )
    .unwrap_err();

    assert!(
        error.contains("fixture signing verification failed"),
        "{error}"
    );
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert_eq!(fs::read(&owner_path).unwrap(), prior_owner);
    assert_eq!(
        fs::metadata(&owner_path).unwrap().permissions().mode() & 0o7777,
        prior_mode
    );
    assert!(f.state.join("macos-apply-transaction").exists());
    signer.fail_verify = false;
    privilege::recover_native_runtime_transaction(&f.state, &f.app, &mut signer).unwrap();
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert_eq!(fs::read(&owner_path).unwrap(), prior_owner);
}

#[test]
fn managed_owner_sync_failure_keeps_journal_and_exact_new_owner_replays_idempotently() {
    let (f, baseline, mut signer) = installed_fixture();
    let old_source_sha =
        privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
            .unwrap()
            .unwrap()
            .source_sha256
            .unwrap();
    privilege::fail_next_native_runtime_owner_directory_sync_for_test();

    let error = install_managed_fixture_update(&f, &baseline, &mut signer, b"sync retry bytes")
        .unwrap_err();

    assert!(
        error.contains("simulated native owner directory sync failure"),
        "{error}"
    );
    let journal = f.state.join("macos-apply-transaction");
    assert!(journal.is_dir());
    let owner_path = f.state.join("native-runtime-owner.json");
    let published: serde_json::Value =
        serde_json::from_slice(&fs::read(&owner_path).unwrap()).unwrap();
    assert_eq!(
        published["runtimeSourceSha256"],
        format!("{:x}", Sha256::digest(b"sync retry bytes"))
    );
    assert_ne!(published["runtimeSourceSha256"], old_source_sha);
    let exact_new_owner = fs::read(&owner_path).unwrap();
    let mut third_owner = published.clone();
    third_owner["runtimeSourceSha256"] = "0".repeat(64).into();
    let mut third_owner_bytes = serde_json::to_vec_pretty(&third_owner).unwrap();
    third_owner_bytes.push(b'\n');
    fs::write(&owner_path, &third_owner_bytes).unwrap();
    fs::set_permissions(&owner_path, fs::Permissions::from_mode(0o600)).unwrap();
    let error =
        privilege::recover_native_runtime_transaction(&f.state, &f.app, &mut signer).unwrap_err();
    assert!(error.contains("old or new image"), "{error}");
    assert!(journal.is_dir());
    assert_eq!(fs::read(&owner_path).unwrap(), third_owner_bytes);

    fs::write(&owner_path, &exact_new_owner).unwrap();
    fs::set_permissions(&owner_path, fs::Permissions::from_mode(0o600)).unwrap();
    privilege::recover_native_runtime_transaction(&f.state, &f.app, &mut signer).unwrap();

    assert!(!journal.exists());
    let loaded = privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    let expected_sha256 = format!("{:x}", Sha256::digest(b"sync retry bytes"));
    assert_eq!(
        loaded.source_sha256.as_deref(),
        Some(expected_sha256.as_str())
    );
}

#[test]
fn owned_admission_requires_exact_slots_and_no_canonical_journal() {
    let (f, baseline, mut signer) = installed_fixture();
    let owned = privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
        .unwrap()
        .unwrap();
    let approved_source_sha = format!("{:x}", Sha256::digest(b"injector fixture"));
    assert_eq!(
        owned.source_sha256.as_deref(),
        Some(approved_source_sha.as_str())
    );
    assert_eq!(owned.baseline.baseline_id(), baseline.baseline_id());
    let journal = f.state.join("macos-apply-transaction");
    fs::create_dir(&journal).unwrap();
    assert!(
        privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
            .unwrap_err()
            .contains("reconciliation")
    );
    fs::remove_dir(journal).unwrap();
    let injector = f
        .app
        .join("Contents/Frameworks/libCavalryTranslatorInjector.dylib");
    fs::write(&injector, b"different runtime").unwrap();
    assert!(
        privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
            .unwrap_err()
            .contains("owned slot drifted")
    );
    assert_eq!(fs::read(injector).unwrap(), b"different runtime");
}

#[test]
fn owned_admission_rejects_missing_extra_and_absent_required_slots() {
    let (f, _, mut signer) = installed_fixture();
    let path = f.state.join("native-runtime-owner.json");
    let original = fs::read(&path).unwrap();
    let owner: serde_json::Value = serde_json::from_slice(&original).unwrap();
    for kind in ["missing", "extra", "absent", "baseline", "root"] {
        let mut changed = owner.clone();
        match kind {
            "missing" => {
                changed["slots"]
                    .as_object_mut()
                    .unwrap()
                    .remove("Contents/MacOS/Cavalry");
            }
            "extra" => {
                changed["slots"]["Contents/Resources/extra"] =
                    serde_json::json!({"fingerprint":null});
            }
            "absent" => {
                changed["slots"]["Contents/MacOS/Cavalry"]["fingerprint"] = serde_json::Value::Null;
            }
            "baseline" => {
                changed["baselineId"] = "a".repeat(64).into();
            }
            "root" => {
                changed["installRoot"] = "/another/Cavalry.app".into();
            }
            _ => unreachable!(),
        }
        fs::write(&path, serde_json::to_vec(&changed).unwrap()).unwrap();
        assert!(
            privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer).is_err(),
            "{kind}"
        );
        assert_eq!(
            privilege::has_native_runtime_owner_for_selection(&f.state, &f.app),
            kind == "baseline"
        );
        assert_eq!(
            fs::read(&path).unwrap(),
            serde_json::to_vec(&changed).unwrap()
        );
    }
    fs::write(&path, &original).unwrap();
    assert!(
        privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
            .unwrap()
            .is_some()
    );
}

#[test]
fn committed_bound_recovery_publishes_owner_before_retiring_journal() {
    let (f, baseline, source) = fixture();
    let info = f.app.join("Contents/Info.plist");
    let expected_postimage = std::rc::Rc::new(std::cell::RefCell::new(None));
    let saved_postimage = expected_postimage.clone();
    let drift_path = info.clone();
    privilege::MacApplyTransaction::set_before_native_runtime_retire_hook_for_test(move || {
        let before = fs::read(&drift_path).unwrap();
        let mut drifted = before.clone();
        drifted.extend_from_slice(b" late fixed-slot drift");
        *saved_postimage.borrow_mut() = Some(before);
        fs::write(drift_path, drifted).unwrap();
    });
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };
    let error = install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &f.app.parent().unwrap().join("install-stage"),
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap_err();
    assert!(error.contains("blocks backup retirement"), "{error}");
    assert_eq!(signer.bundle_verifications, 1);
    let expected_postimage = expected_postimage
        .borrow_mut()
        .take()
        .expect("Committed retirement hook must drift a fixed slot");
    fs::write(info, expected_postimage).unwrap();
    assert!(f.state.join("macos-apply-transaction").exists());
    assert!(!f.state.join("native-runtime-owner.json").exists());
    privilege::recover_native_runtime_transaction(&f.state, &f.app, &mut signer).unwrap();
    assert!(!f.state.join("macos-apply-transaction").exists());
    let owner = fs::read(f.state.join("native-runtime-owner.json")).unwrap();
    privilege::recover_native_runtime_transaction(&f.state, &f.app, &mut signer).unwrap();
    assert_eq!(
        fs::read(f.state.join("native-runtime-owner.json")).unwrap(),
        owner
    );
    assert!(
        privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
            .unwrap()
            .is_some()
    );
}

#[test]
fn stock_install_refuses_conflicting_owner_without_touching_unknown_record() {
    let (f, baseline, source) = fixture();
    fs::write(f.state.join("native-runtime-owner.json"), b"unknown owner").unwrap();
    fs::set_permissions(
        f.state.join("native-runtime-owner.json"),
        fs::Permissions::from_mode(0o600),
    )
    .unwrap();
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };
    let error = install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &f.app.parent().unwrap().join("install-stage"),
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap_err();
    assert!(error.contains("refuses an existing owner"), "{error}");
    assert_eq!(
        fs::read(f.state.join("native-runtime-owner.json")).unwrap(),
        b"unknown owner"
    );
    assert!(!f.state.join("macos-apply-transaction").exists());
}

#[test]
fn native_vendor_restore_returns_exact_tree_and_revokes_only_bundle_owner() {
    let (f, baseline, mut signer) = installed_fixture();
    install_managed_fixture_update(
        &f,
        &baseline,
        &mut signer,
        b"runtime source before exact English restoration",
    )
    .unwrap();
    fs::write(f.state.join("state.json"), b"unrelated state").unwrap();
    let stage = f.app.parent().unwrap().join("restore-stage");
    let warnings =
        restore_native_runtime_vendor_with(&baseline, &f.app, &stage, &mut signer, verify_fixture)
            .unwrap();
    assert!(warnings.is_empty());
    assert!(!stage.exists());
    assert!(!f.state.join("native-runtime-owner.json").exists());
    assert!(!privilege::has_native_runtime_owner_for_selection(
        &f.state, &f.app
    ));
    assert!(!f.state.join("macos-apply-transaction").exists());
    baseline_tests::verify_fixture_baseline(&baseline, &f.app).unwrap();
    assert_eq!(
        fs::read(f.state.join("state.json")).unwrap(),
        b"unrelated state"
    );
    assert!(
        privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
            .unwrap()
            .is_none()
    );
}

#[test]
fn vendor_restore_verifies_managed_owner_once_before_app_write() {
    let (f, baseline, mut signer) = installed_fixture();
    install_managed_fixture_update(
        &f,
        &baseline,
        &mut signer,
        b"runtime source before owner verification count",
    )
    .unwrap();
    let verifications_before = signer.bundle_verifications;
    let stage = f.app.parent().unwrap().join("restore-stage");

    restore_native_runtime_vendor_with(&baseline, &f.app, &stage, &mut signer, verify_fixture)
        .unwrap();

    assert_eq!(
        signer.bundle_verifications - verifications_before,
        1,
        "restore must verify the managed owner once before writing the App"
    );
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert!(!f.state.join("native-runtime-owner.json").exists());
}

#[test]
fn vendor_restore_rejects_baseline_mismatch_before_app_write() {
    let (f, baseline, source) = fixture();
    let info = f.app.join("Contents/Info.plist");
    let original_info = fs::read(&info).unwrap();
    let mut alternate_info = original_info.clone();
    alternate_info.extend_from_slice(b" alternate vendor preimage");
    fs::write(&info, alternate_info).unwrap();
    let alternate_id = baseline_tests::capture_fixture_baseline(&f.app, &f.state);
    let alternate_baseline = load_baseline(&f.app, &f.state, &alternate_id).unwrap();
    assert_ne!(alternate_baseline.baseline_id(), baseline.baseline_id());
    fs::write(&info, original_info).unwrap();

    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };
    install_stock_native_runtime_with(
        &baseline,
        &f.app,
        &f.app.parent().unwrap().join("install-stage"),
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap();

    let app_before = inventory_bundle(&f.app).unwrap();
    let owner_before = fs::read(f.state.join("native-runtime-owner.json")).unwrap();
    let command_count_before_restore = signer.commands.len();
    let stage = f.app.parent().unwrap().join("restore-stage");
    let error = restore_native_runtime_vendor_with(
        &alternate_baseline,
        &f.app,
        &stage,
        &mut signer,
        verify_fixture,
    )
    .unwrap_err();

    assert!(
        error.contains("Native restore baseline differs from runtime owner."),
        "{error}"
    );
    assert_eq!(inventory_bundle(&f.app).unwrap(), app_before);
    assert_eq!(
        fs::read(f.state.join("native-runtime-owner.json")).unwrap(),
        owner_before
    );
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert!(!stage.exists());
    assert!(!signer.commands[command_count_before_restore..]
        .iter()
        .any(|(program, args)| {
            program == "codesign" && args.first().map(String::as_str) == Some("--force")
        }));
}

#[test]
fn failed_vendor_source_verification_rolls_back_managed_tree_and_keeps_owner() {
    let (f, baseline, mut signer) = installed_fixture();
    let before = inventory_bundle(&f.app).unwrap();
    let owner = fs::read(f.state.join("native-runtime-owner.json")).unwrap();
    let stage = f.app.parent().unwrap().join("restore-stage");
    let error =
        restore_native_runtime_vendor_with(&baseline, &f.app, &stage, &mut signer, |_, _, _| {
            Err("vendor source rejected".into())
        })
        .unwrap_err();
    assert!(error.contains("vendor source rejected"));
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert_eq!(
        fs::read(f.state.join("native-runtime-owner.json")).unwrap(),
        owner
    );
    assert!(!stage.exists());
    privilege::recover_native_runtime_transaction(&f.state, &f.app, &mut signer).unwrap();
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert!(
        privilege::load_owned_native_runtime(&f.state, &f.app, &mut signer)
            .unwrap()
            .is_some()
    );
}

#[test]
#[ignore = "requires explicit official source and approved injector; mutates only a temporary copy"]
fn stock_official_copy_installs_native_runtime_with_real_signing_smoke() {
    use crate::{
        native_mac_bundle_inventory::BundleObject, native_mac_vendor_baseline::capture_or_reuse,
        operation_lock::try_begin_bundle_operation, privilege::RealCommandRunner,
    };
    use sha2::{Digest, Sha256};
    use std::{env, os::unix::fs::symlink};

    let source = fs::canonicalize(
        env::var_os("CAVALRY_I18N_NATIVE_STOCK_SMOKE_SOURCE")
            .expect("set official read-only source"),
    )
    .unwrap();
    let injector = fs::canonicalize(
        env::var_os("CAVALRY_I18N_NATIVE_STOCK_SMOKE_INJECTOR")
            .expect("set approved candidate path"),
    )
    .unwrap();
    let expected_injector_sha = env::var("CAVALRY_I18N_NATIVE_STOCK_SMOKE_INJECTOR_SHA256")
        .expect("set frozen candidate SHA-256");
    let injector_bytes = fs::read(&injector).unwrap();
    assert_eq!(
        format!("{:x}", Sha256::digest(&injector_bytes)),
        expected_injector_sha
    );
    let coordinator_smoke = env::var("CAVALRY_I18N_NATIVE_COORDINATOR_SMOKE").as_deref() == Ok("1");
    if coordinator_smoke {
        // -- 编译期候选先准入，避免错误构建模式下复制与验整包。
        let compiled = include_bytes!(concat!(
            std::env!("OUT_DIR"),
            "/native_runtime_injector.dylib"
        ));
        assert!(
            compiled.as_slice() == injector_bytes.as_slice(),
            "coordinator smoke requires native-preview compilation with the same approved injector"
        );
    }
    let source_before = inventory_bundle(&source).unwrap();
    let temp = tempfile::Builder::new()
        .prefix("cavalry-native-stock-install-")
        .tempdir()
        .unwrap();
    let app = temp.path().join("Cavalry.app");
    fs::create_dir(&app).unwrap();
    // 只复制显式官方输入。保留原相对链接、对象类型与权限，不改源App。
    for (relative, object) in &source_before.entries {
        let destination = app.join(relative);
        match object {
            BundleObject::Directory { mode } => {
                fs::create_dir_all(&destination).unwrap();
                fs::set_permissions(&destination, fs::Permissions::from_mode(*mode)).unwrap();
            }
            BundleObject::RegularFile { mode, .. } => {
                fs::copy(source.join(relative), &destination).unwrap();
                fs::set_permissions(&destination, fs::Permissions::from_mode(*mode)).unwrap();
            }
            BundleObject::Symlink { target, .. } => symlink(target, &destination).unwrap(),
        }
    }
    let app = fs::canonicalize(app).unwrap();
    assert_eq!(inventory_bundle(&app).unwrap(), source_before);
    let state = temp.path().join("state");
    fs::create_dir(&state).unwrap();
    let state = fs::canonicalize(state).unwrap();
    let operation = try_begin_bundle_operation(&state).unwrap();
    let mut runner = RealCommandRunner;
    let baseline = capture_or_reuse(&app, &state, &mut runner).unwrap();
    let baseline_id = baseline.baseline_id().to_string();
    let main_before = fs::read(app.join("Contents/MacOS/Cavalry")).unwrap();
    let stage = temp.path().join("runtime-stage");
    let disposable_home = fs::canonicalize(temp.path()).unwrap().join("home");
    let warnings = if coordinator_smoke {
        fs::create_dir_all(disposable_home.join("Library/Preferences/Cavalry")).unwrap();
        fs::write(disposable_home.join("Library/Preferences/Cavalry/preferences.json"), br#"{"unrelated":{"varType":"int","value":37},"locale":{"varType":"string","value":"en-GB"}}"#).unwrap();
        let repo = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        for language in ["zh-Hans", "zh-Hant", "ja_JP"] {
            let result = crate::commands::apply_disposable_profile(
                &operation,
                repo,
                &state,
                &app,
                &disposable_home,
                language,
                &mut runner,
                &expected_injector_sha,
            );
            assert!(
                result.ok && !result.reconciliation_required && result.warning.is_none(),
                "{language}: {result:?}"
            );
            assert_eq!(result.current_lang.as_deref(), Some(language));
            let preferences: serde_json::Value = serde_json::from_slice(
                &fs::read(disposable_home.join("Library/Preferences/Cavalry/preferences.json"))
                    .unwrap(),
            )
            .unwrap();
            assert_eq!(preferences["unrelated"]["value"], 37);
        }
        Vec::new()
    } else {
        install_stock_native_runtime(
            &operation,
            &baseline,
            &app,
            &stage,
            &injector,
            &expected_injector_sha,
            &mut runner,
        )
        .unwrap()
    };
    assert!(warnings.is_empty(), "{warnings:?}");
    assert!(!stage.exists());
    assert!(!state.join("macos-apply-transaction").exists());
    assert!(!state.join("state.json").exists());
    assert!(!app
        .join("Contents/Resources/cavalry-i18n-lang.txt")
        .exists());
    let main_after = fs::read(app.join("Contents/MacOS/Cavalry")).unwrap();
    assert_ne!(
        main_after, main_before,
        "stock main must enter the existing ad-hoc runtime path"
    );
    let owned = privilege::load_owned_native_runtime(&state, &app, &mut runner)
        .unwrap()
        .expect("managed runtime owner must pass its fixed-slot gate");
    assert_eq!(owned.baseline_id(), baseline_id);
    privilege::ensure_bundle_signature(&app, &mut runner).unwrap();
    let info = plist::Value::from_reader(std::io::Cursor::new(
        fs::read(app.join("Contents/Info.plist")).unwrap(),
    ))
    .unwrap();
    assert_eq!(
        info.as_dictionary().unwrap()["CFBundleExecutable"].as_string(),
        Some("CavalryLauncher")
    );
    assert_eq!(fs::read(&injector).unwrap(), injector_bytes);
    assert_eq!(inventory_bundle(&source).unwrap(), source_before);
    if coordinator_smoke {
        let repo = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let result = crate::commands::apply_disposable_profile(
            &operation,
            repo,
            &state,
            &app,
            &disposable_home,
            "restore-official",
            &mut runner,
            &expected_injector_sha,
        );
        assert!(
            result.ok && !result.reconciliation_required && result.warning.is_none(),
            "{result:?}"
        );
        assert!(!state.join("native-runtime-owner.json").exists());
        assert!(!state.join("macos-apply-transaction").exists());
        baseline.verify_restored_vendor(&app, &mut runner).unwrap();
        assert_eq!(inventory_bundle(&app).unwrap(), source_before);
        assert_eq!(
            fs::read(app.join("Contents/MacOS/Cavalry")).unwrap(),
            main_before
        );
        let preferences: serde_json::Value = serde_json::from_slice(
            &fs::read(disposable_home.join("Library/Preferences/Cavalry/preferences.json"))
                .unwrap(),
        )
        .unwrap();
        assert_eq!(preferences["locale"]["value"], "en-GB");
        assert_eq!(preferences["unrelated"]["value"], 37);
    }
    let receipt = serde_json::json!({
        "kind": if coordinator_smoke { "nativeCoordinatorInstallReapplyRestoreSmoke" } else { "stockNativeRuntimeInstallSmoke" },
        "baselineId": baseline_id,
        "sourceObjectCount": source_before.entries.len(),
        "injectorSourceSha256": expected_injector_sha,
        "mainBeforeSha256": format!("{:x}", Sha256::digest(&main_before)),
        "mainAfterSha256": format!("{:x}", Sha256::digest(&main_after)),
        "sourceInventoryExact": true,
        "runtimeUnownedInventoryExact": true,
        "realSigningAndDeepStrictVerification": true,
        "stageRemoved": true,
        "canonicalJournalRetired": true,
        "appLaunched": false,
        "profileAccessed": coordinator_smoke,
        "profileKind": if coordinator_smoke { "disposableFixedLayout" } else { "notAccessed" },
        "realUserProfileAccessed": false,
        "formalCoordinatorConnected": coordinator_smoke,
        "guiCommandInvoked": false,
        "publicCommandFacadeInvoked": false,
        "vendorRestoreExact": coordinator_smoke,
        "threeLanguageReapplyCommitted": coordinator_smoke,
    });
    drop(operation);
    drop(baseline);
    let temp_path = temp.path().to_path_buf();
    temp.close().unwrap();
    assert!(!temp_path.exists());
    println!("NATIVE_STOCK_SMOKE_RECEIPT={receipt}");
}
