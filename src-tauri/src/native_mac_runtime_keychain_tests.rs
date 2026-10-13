/**
 * [INPUT]: 依赖NRT apply测试fixture、schema 1/2 baseline与owner模拟器。
 * [OUTPUT]: 验证旧baseline拒绝新写入及旧八槽owner英文恢复。
 * [POS]: NRT Keychain向后兼容合同；旧owner不拥有Extension，恢复保留原厂前像。
 * Fixture不证明厂商身份；本模块不启动App或读取用户profile。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

fn fixture_with_legacy_and_current_baselines() -> (
    baseline_tests::Fixture,
    VerifiedNativeVendorBaseline,
    VerifiedNativeVendorBaseline,
    PathBuf,
) {
    let f = baseline_tests::fixture(false);
    fs::write(f.app.join("Contents/Info.plist"), br#"<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>Cavalry</string><key>CFBundleIdentifier</key><string>com.scenegroup.cavalry</string></dict></plist>"#).unwrap();
    let legacy_id = baseline_tests::capture_schema_1_fixture(&f.app, &f.state)
        .baseline_id()
        .to_string();
    let current_id = baseline_tests::capture_fixture_baseline(&f.app, &f.state);
    let legacy = load_baseline(&f.app, &f.state, &legacy_id).unwrap();
    let current = load_baseline(&f.app, &f.state, &current_id).unwrap();
    let source = f.app.parent().unwrap().join("packaged-fixture.dylib");
    fs::write(&source, b"injector fixture").unwrap();
    (f, legacy, current, source)
}

#[test]
fn stock_install_refuses_a_schema_1_baseline_before_staging() {
    let (f, legacy_baseline, _current_baseline, source) =
        fixture_with_legacy_and_current_baselines();
    let before = inventory_bundle(&f.app).unwrap();
    let stage = f.app.parent().unwrap().join("legacy-stock-stage");
    let mut signer = Signer {
        app: f.app.clone(),
        ..Default::default()
    };

    let error = install_stock_native_runtime_with(
        &legacy_baseline,
        &f.app,
        &stage,
        &source,
        &mut signer,
        verify_fixture,
    )
    .unwrap_err();

    assert_eq!(error.message, LEGACY_EXTENSION_REINSTALL_MESSAGE);
    assert_eq!(inventory_bundle(&f.app).unwrap(), before);
    assert!(!stage.exists());
    assert!(!f.state.join("macos-apply-transaction").exists());
    assert!(signer.commands.is_empty());
}

#[test]
fn legacy_owner_8_slot_read_write_refusal_and_english_restore_preserve_vendor_extension() {
    for schema_version in [1, 2] {
        let (f, legacy_baseline, current_baseline, source) =
            fixture_with_legacy_and_current_baselines();
        let mut signer = Signer {
            app: f.app.clone(),
            ..Default::default()
        };
        let extension = f.app.join("Contents/Frameworks/libExtensionLayer.dylib");
        let vendor_extension = fs::read(&extension).unwrap();
        let vendor_extension_mode = fs::metadata(&extension).unwrap().permissions().mode() & 0o7777;
        install_stock_native_runtime_with(
            &current_baseline,
            &f.app,
            &f.app.parent().unwrap().join("install-stage"),
            &source,
            &mut signer,
            verify_fixture,
        )
        .unwrap();

        // 旧八槽运行时从未拥有Extension；恢复fixture的真实原厂前像。
        fs::write(&extension, &vendor_extension).unwrap();
        fs::set_permissions(
            &extension,
            fs::Permissions::from_mode(vendor_extension_mode),
        )
        .unwrap();
        assert_eq!(fs::read(&extension).unwrap(), vendor_extension);
        assert_eq!(
            fs::metadata(&extension).unwrap().permissions().mode() & 0o7777,
            vendor_extension_mode
        );

        let owner_path = f.state.join("native-runtime-owner.json");
        let mut owner: serde_json::Value =
            serde_json::from_slice(&fs::read(&owner_path).unwrap()).unwrap();
        owner["schemaVersion"] = schema_version.into();
        owner["baselineId"] = legacy_baseline.baseline_id().into();
        owner["slots"]
            .as_object_mut()
            .unwrap()
            .remove("Contents/Frameworks/libExtensionLayer.dylib");
        if schema_version == 1 {
            owner.as_object_mut().unwrap().remove("runtimeSourceSha256");
        }
        let mut old_bytes = serde_json::to_vec_pretty(&owner).unwrap();
        old_bytes.push(b'\n');
        fs::write(&owner_path, &old_bytes).unwrap();
        fs::set_permissions(&owner_path, fs::Permissions::from_mode(0o600)).unwrap();

        let loaded = privilege::load_owned_native_runtime_details(&f.state, &f.app, &mut signer)
            .unwrap()
            .unwrap();
        assert_eq!(loaded.baseline.baseline_id(), legacy_baseline.baseline_id());
        assert_eq!(loaded.preimage.bytes_hex, encode_test_hex(&old_bytes));
        assert_eq!(owner["slots"].as_object().unwrap().len(), 8);
        assert_eq!(loaded.source_sha256.is_some(), schema_version == 2);

        let app_before = inventory_bundle(&f.app).unwrap();
        let command_count = signer.commands.len();
        let stage = f.app.parent().unwrap().join("legacy-managed-update-stage");
        let error = install_managed_native_runtime_with(
            &legacy_baseline,
            &f.app,
            &stage,
            &source,
            &runtime_source_sha256(&source).unwrap(),
            &loaded.preimage,
            &mut signer,
            verify_managed_fixture,
        )
        .unwrap_err();
        assert_eq!(error.message, LEGACY_EXTENSION_REINSTALL_MESSAGE);
        assert_eq!(inventory_bundle(&f.app).unwrap(), app_before);
        assert_eq!(fs::read(&owner_path).unwrap(), old_bytes);
        assert!(!stage.exists());
        assert!(!f.state.join("macos-apply-transaction").exists());
        assert_eq!(signer.commands.len(), command_count);

        restore_native_runtime_vendor_with(
            &legacy_baseline,
            &f.app,
            &f.app.parent().unwrap().join("legacy-restore-stage"),
            &mut signer,
            verify_fixture,
        )
        .unwrap();
        assert!(!owner_path.exists());
        assert_eq!(fs::read(&extension).unwrap(), vendor_extension);
        assert_eq!(
            fs::metadata(&extension).unwrap().permissions().mode() & 0o7777,
            vendor_extension_mode
        );
        baseline_tests::verify_fixture_baseline(&legacy_baseline, &f.app).unwrap();
    }
}
