/**
 * [INPUT]: 依赖native_runtime实际编排、owner hint、2.8 bundle观察、共享bundle锁测试串行器与临时fixture。
 * [OUTPUT]: 证明同源hint只准profile快路；成功按Verify/Ensure/Apply排序，早期拒绝止于Ensure。
 * [POS]: native_runtime路由合同；全局guard测试共享串行器；缺baseline和Extension的fixture只证明profile成功，不证明App完整性。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;
use crate::{
    commands::{
        contract::OperationState,
        user_language_files::{self, LocaleObservation, ReceiptObservation},
    },
    operation_lock,
    privilege::{self, RecordingRunner},
};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    fs,
    path::PathBuf,
    sync::{Arc, Mutex},
};

const SOURCE_BYTES: &[u8] = b"approved native runtime fixture";
const PROFILE_PACK: &[u8] =
    br#"[{"type":"strings","language":"zh-Hans","value":{"fixture":{"UI-text":"fixture"}}}]"#;
#[derive(Clone, Default)]
struct RecordingReporter(Arc<Mutex<Vec<(String, String)>>>);

impl OperationReporter for RecordingReporter {
    fn report(&self, phase: OperationPhase, state: OperationState) {
        self.0
            .lock()
            .unwrap()
            .push((phase.as_str().into(), state.as_str().into()));
    }
}

struct Fixture {
    _temp: tempfile::TempDir,
    root: PathBuf,
    state: PathBuf,
    app: PathBuf,
    paths: UserLanguagePaths,
}

impl Fixture {
    fn new(version: &str) -> Self {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().canonicalize().unwrap();
        let state = root.join("state");
        fs::create_dir(&state).unwrap();
        let app = root.join("Cavalry.app");
        fs::create_dir_all(app.join("Contents/MacOS")).unwrap();
        fs::write(app.join("Contents/MacOS/Cavalry"), b"fixture executable").unwrap();
        let info = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.scenegroup.cavalry</string>
<key>CFBundleShortVersionString</key><string>{version}</string>
<key>CFBundleExecutable</key><string>Cavalry</string>
</dict></plist>"#
        );
        fs::write(app.join("Contents/Info.plist"), info).unwrap();
        let app = app.canonicalize().unwrap();
        let paths = user_language_files::fixture_paths(&root).unwrap();
        fs::create_dir_all(paths.preferences().parent().unwrap()).unwrap();
        fs::write(
            paths.preferences(),
            br#"{"locale":{"varType":"string","value":"en-GB"},"fixture":"keep"}"#,
        )
        .unwrap();
        Self {
            _temp: temp,
            root,
            state,
            app,
            paths,
        }
    }

    fn write_owner(&self, source_sha256: &str) {
        let mut slots = BTreeMap::new();
        let mut paths = vec![
            self.app.join("Contents/Info.plist"),
            self.app.join("Contents/_CodeSignature/CodeResources"),
            self.app.join("Contents/MacOS/Cavalry"),
            self.app.join("Contents/MacOS/CavalryLauncher"),
            self.app
                .join("Contents/Frameworks/libCavalryTranslatorInjector.dylib"),
            self.app.join("Contents/Frameworks/libExtensionLayer.dylib"),
        ];
        paths.extend(privilege::external_signature_component_paths(&self.app));
        paths.sort();
        for path in paths {
            let relative = path.strip_prefix(&self.app).unwrap().to_string_lossy();
            slots.insert(
                relative.to_string(),
                json!({
                    "fingerprint": {
                        "sha256": "c".repeat(64),
                        "mode": (libc::S_IFREG as u32 | 0o755),
                    }
                }),
            );
        }
        let owner = json!({
            "schemaVersion": 3,
            "installRoot": self.app.to_string_lossy(),
            "baselineId": "a".repeat(64),
            "operationId": "same-source-profile-fixture",
            "runtimeSourceSha256": source_sha256,
            "slots": slots,
        });
        let path = self.state.join("native-runtime-owner.json");
        fs::write(&path, serde_json::to_vec(&owner).unwrap()).unwrap();
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o600)).unwrap();
    }

    fn apply_with(
        &self,
        language: &str,
        source: Result<&[u8], String>,
    ) -> (
        ActionPayload,
        usize,
        usize,
        RecordingReporter,
        RecordingRunner,
    ) {
        let operation = operation_lock::try_begin_bundle_operation(&self.state).unwrap();
        let mut source_reads = 0;
        let mut pack_reads = 0;
        let reporter = RecordingReporter::default();
        let mut runner = RecordingRunner::default();
        let payload = apply_with_paths_using_loaders(
            &operation,
            &self.root,
            &self.state,
            &self.root,
            &self.app,
            language,
            &self.paths,
            || {
                source_reads += 1;
                source.clone()
            },
            |_repo, _resources, selected| {
                pack_reads += 1;
                assert_eq!(selected, language);
                Ok(PROFILE_PACK.to_vec())
            },
            reporter.clone(),
            &mut runner,
        );
        drop(operation);
        (payload, source_reads, pack_reads, reporter, runner)
    }
}

fn digest(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn assert_profile_recovery_failure(reporter: &RecordingReporter) {
    assert_eq!(
        reporter.0.lock().unwrap().clone(),
        [
            ("verifyInstallation".into(), "running".into()),
            ("verifyInstallation".into(), "completed".into()),
            ("ensureBaseline".into(), "running".into()),
            ("ensureBaseline".into(), "error".into()),
        ]
    );
}

#[test]
fn matching_bounded_owner_hint_applies_profile_without_baseline_or_extension() {
    let _serial = operation_lock::lock_bundle_operation_tests();
    let fixture = Fixture::new(native_resources::NATIVE_VERSION);
    let source_sha256 = digest(SOURCE_BYTES);
    fixture.write_owner(&source_sha256);
    let app_before = fs::read(fixture.app.join("Contents/Info.plist")).unwrap();
    let executable_before = fs::read(fixture.app.join("Contents/MacOS/Cavalry")).unwrap();
    assert!(!fixture
        .app
        .join("Contents/Frameworks/libExtensionLayer.dylib")
        .exists());
    assert!(!fixture.state.join("native-vendor-baselines").exists());

    let (payload, source_reads, pack_reads, reporter, runner) =
        fixture.apply_with("zh-Hans", Ok(SOURCE_BYTES));

    assert!(payload.ok, "profile fast path failed: {payload:?}");
    assert_eq!(payload.current_lang.as_deref(), Some("zh-Hans"));
    assert_eq!(source_reads, 1);
    assert_eq!(pack_reads, 1);
    assert!(runner.commands.is_empty(), "profile route ran OS commands");
    assert_eq!(
        fs::read(fixture.app.join("Contents/Info.plist")).unwrap(),
        app_before
    );
    assert_eq!(
        fs::read(fixture.app.join("Contents/MacOS/Cavalry")).unwrap(),
        executable_before
    );
    assert!(!fixture
        .app
        .join("Contents/Frameworks/libExtensionLayer.dylib")
        .exists());
    let projection = user_language_files::read_profile_projection(&fixture.paths).unwrap();
    assert!(matches!(projection.locale, LocaleObservation::Known { .. }));
    assert!(matches!(
        projection.ownership,
        ReceiptObservation::Current { .. }
    ));
    let events = reporter.0.lock().unwrap().clone();
    assert_eq!(
        events,
        [
            ("verifyInstallation".into(), "running".into()),
            ("verifyInstallation".into(), "completed".into()),
            ("ensureBaseline".into(), "running".into()),
            ("ensureBaseline".into(), "completed".into()),
            ("applyTransaction".into(), "running".into()),
            ("applyTransaction".into(), "completed".into()),
        ]
    );
}

#[test]
fn same_source_route_still_rejects_a_corrupt_user_receipt() {
    let _serial = operation_lock::lock_bundle_operation_tests();
    let fixture = Fixture::new(native_resources::NATIVE_VERSION);
    fixture.write_owner(&digest(SOURCE_BYTES));
    fs::write(fixture.paths.receipt(), b"not a receipt").unwrap();

    let (payload, source_reads, pack_reads, reporter, runner) =
        fixture.apply_with("zh-Hans", Ok(SOURCE_BYTES));

    assert!(!payload.ok);
    assert_eq!(
        payload.error_code.as_deref(),
        Some("nativeUserLanguageConflict")
    );
    assert_eq!(source_reads, 1);
    assert_eq!(pack_reads, 1);
    assert!(runner.commands.is_empty());
    assert_eq!(fs::read(fixture.paths.receipt()).unwrap(), b"not a receipt");
    assert_profile_recovery_failure(&reporter);

    let drifted = Fixture::new(native_resources::NATIVE_VERSION);
    drifted.write_owner(&digest(SOURCE_BYTES));
    user_language_files::apply(&drifted.paths, "zh-Hans", PROFILE_PACK).unwrap();
    let preferences_before = fs::read(drifted.paths.preferences()).unwrap();
    let mut preferences: serde_json::Value = serde_json::from_slice(&preferences_before).unwrap();
    preferences["locale"]["value"] = json!("fr");
    fs::write(
        drifted.paths.preferences(),
        serde_json::to_vec(&preferences).unwrap(),
    )
    .unwrap();
    let changed_preferences = fs::read(drifted.paths.preferences()).unwrap();
    let (payload, _, _, reporter, _) = drifted.apply_with("zh-Hans", Ok(SOURCE_BYTES));
    assert!(!payload.ok);
    assert_eq!(
        payload.error_code.as_deref(),
        Some("nativeUserLanguageConflict")
    );
    assert_eq!(
        fs::read(drifted.paths.preferences()).unwrap(),
        changed_preferences
    );
    assert_profile_recovery_failure(&reporter);
}

#[test]
fn english_mismatch_bad_hint_wrong_version_and_missing_candidate_keep_full_admission() {
    let _serial = operation_lock::lock_bundle_operation_tests();
    let source_sha256 = digest(SOURCE_BYTES);

    let english = Fixture::new(native_resources::NATIVE_VERSION);
    english.write_owner(&source_sha256);
    let (payload, source_reads, pack_reads, _, _) = english.apply_with("en", Ok(SOURCE_BYTES));
    assert!(!payload.ok);
    assert_eq!((source_reads, pack_reads), (0, 0));

    let mismatch = Fixture::new(native_resources::NATIVE_VERSION);
    mismatch.write_owner(&digest(b"older approved source"));
    let (payload, source_reads, pack_reads, _, _) =
        mismatch.apply_with("zh-Hans", Ok(SOURCE_BYTES));
    assert!(!payload.ok);
    assert_eq!((source_reads, pack_reads), (1, 0));

    let bad_hint = Fixture::new(native_resources::NATIVE_VERSION);
    fs::write(
        bad_hint.state.join("native-runtime-owner.json"),
        b"not owner JSON",
    )
    .unwrap();
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(
        bad_hint.state.join("native-runtime-owner.json"),
        fs::Permissions::from_mode(0o600),
    )
    .unwrap();
    let (payload, source_reads, pack_reads, _, _) =
        bad_hint.apply_with("zh-Hans", Ok(SOURCE_BYTES));
    assert!(!payload.ok);
    assert_eq!((source_reads, pack_reads), (0, 0));

    let wrong_version = Fixture::new("2.9.0");
    wrong_version.write_owner(&source_sha256);
    let (payload, source_reads, pack_reads, _, _) =
        wrong_version.apply_with("zh-Hans", Ok(SOURCE_BYTES));
    assert!(!payload.ok);
    assert_eq!((source_reads, pack_reads), (1, 0));

    let unknown_owner = Fixture::new(native_resources::NATIVE_VERSION);
    let (payload, source_reads, pack_reads, _, _) =
        unknown_owner.apply_with("zh-Hans", Ok(SOURCE_BYTES));
    assert!(!payload.ok);
    assert_eq!((source_reads, pack_reads), (0, 0));

    let missing_candidate = Fixture::new(native_resources::NATIVE_VERSION);
    missing_candidate.write_owner(&source_sha256);
    let (payload, source_reads, pack_reads, _, _) =
        missing_candidate.apply_with("zh-Hans", Err("approved source unavailable".into()));
    assert!(!payload.ok);
    assert_eq!(
        payload.error_code.as_deref(),
        Some("installationVerificationFailed")
    );
    assert_eq!((source_reads, pack_reads), (1, 0));
}

#[test]
fn malformed_nrt_journal_blocks_same_source_profile_routing() {
    let _serial = operation_lock::lock_bundle_operation_tests();
    let fixture = Fixture::new(native_resources::NATIVE_VERSION);
    fixture.write_owner(&digest(SOURCE_BYTES));
    let journal = fixture.state.join("macos-apply-transaction");
    fs::create_dir(&journal).unwrap();
    fs::write(journal.join("manifest.json"), b"{}").unwrap();

    let (payload, source_reads, pack_reads, _, _) = fixture.apply_with("zh-Hans", Ok(SOURCE_BYTES));

    assert!(!payload.ok);
    assert_eq!((source_reads, pack_reads), (0, 0));
    assert!(!fixture.paths.receipt().exists());
}
