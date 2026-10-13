/**
 * [INPUT]: 依赖apply_transaction生产phase、测试期固定槽计数接点与NRT临时fixture。
 * [OUTPUT]: 锁定begin_signing和bundle checkpoint固定槽单读、指纹记录与错误保留。
 * [POS]: apply_transaction的窄回归合同；复用真实文件fixture，不访问真实App或profile。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

const CODE_RESOURCES: &str = "Contents/_CodeSignature/CodeResources";

fn native_fixture() -> (
    tempfile::TempDir,
    PathBuf,
    PathBuf,
    PathBuf,
    MacApplyTransaction,
) {
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("native-injector.dylib");
    let destination = app.join("Contents/Frameworks/native-injector.dylib");
    let transaction = native_runtime_transaction_tests::begin_native_runtime_transaction(
        &state,
        &app,
        &source,
        &destination,
    );
    (temp, app, state, destination, transaction)
}

fn code_resources_entry<'a>(
    transaction: &'a MacApplyTransaction,
    code_resources: &Path,
) -> &'a JournalEntry {
    transaction
        .manifest
        .entries
        .iter()
        .find(|entry| Path::new(&entry.destination) == code_resources)
        .expect("fixture contains the CodeResources signing slot")
}

#[test]
fn production_signing_and_checkpoint_read_fixed_slot_once_and_record_fingerprint() {
    let (_temp, app, _state, _destination, mut transaction) = native_fixture();
    let app = fs::canonicalize(app).unwrap();
    let code_resources = app.join(CODE_RESOURCES);
    let expected = fingerprint_regular_file(&code_resources).unwrap();

    watch_test_fingerprint_reads(&app, &code_resources);
    transaction.begin_signing().unwrap();
    let signing_reads = take_test_fingerprint_read_count();
    assert_eq!(
        code_resources_entry(&transaction, &code_resources).signing_preimage,
        Some(ExpectedFileState {
            fingerprint: Some(expected.clone()),
        })
    );

    transaction
        .verify_and_record_signing_postimages(|_| Ok(()))
        .unwrap();
    assert_eq!(
        code_resources_entry(&transaction, &code_resources).signing_postimage,
        Some(ExpectedFileState {
            fingerprint: Some(expected.clone()),
        })
    );

    watch_test_fingerprint_reads(&app, &code_resources);
    transaction.checkpoint_verified_bundle().unwrap();
    let checkpoint_reads = take_test_fingerprint_read_count();
    assert_eq!((signing_reads, checkpoint_reads), (1, 1));
    assert_eq!(transaction.manifest.phase, JournalPhase::BundleVerified);
    let entry = code_resources_entry(&transaction, &code_resources);
    assert_eq!(entry.verified_post, Some(expected));
    assert!(!entry.verified_post_absent);
}

#[test]
fn production_phases_preserve_validation_errors_after_one_fixed_slot_read() {
    let (_temp, app, _state, _destination, mut transaction) = native_fixture();
    let app = fs::canonicalize(app).unwrap();
    let code_resources = app.join(CODE_RESOURCES);

    watch_test_fingerprint_reads(&app, &code_resources);
    transaction.begin_signing().unwrap();
    let signing_reads = take_test_fingerprint_read_count();
    transaction
        .verify_and_record_signing_postimages(|_| Ok(()))
        .unwrap();

    fs::write(&code_resources, b"external signature drift").unwrap();
    watch_test_fingerprint_reads(&app, &code_resources);
    let error = transaction.checkpoint_verified_bundle().unwrap_err();
    let checkpoint_reads = take_test_fingerprint_read_count();
    assert_eq!((signing_reads, checkpoint_reads), (1, 1));
    assert_eq!(
        error,
        format!(
            "Signing side effect lacks a verified exact postimage at {}",
            code_resources.display()
        )
    );
    assert_eq!(transaction.manifest.phase, JournalPhase::Signing);
}

#[test]
fn production_begin_signing_preserves_preimage_error_after_one_fixed_slot_read() {
    let (_temp, app, _state, _destination, mut transaction) = native_fixture();
    let app = fs::canonicalize(app).unwrap();
    let code_resources = app.join(CODE_RESOURCES);
    fs::write(&code_resources, b"external preimage drift").unwrap();

    watch_test_fingerprint_reads(&app, &code_resources);
    let error = transaction.begin_signing().unwrap_err();
    assert_eq!(take_test_fingerprint_read_count(), 1);
    assert_eq!(
        error,
        format!(
            "{} no longer matches its journaled preimage",
            code_resources.display()
        )
    );
    assert_eq!(transaction.manifest.phase, JournalPhase::Applying);
}
