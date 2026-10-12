/**
 * [INPUT]: 依赖 apply_transaction.rs 的 NRT 构造器、终态、journal reader 与恢复退役入口。
 * [OUTPUT]: 提供 generic finalizer 拒绝 NRT 退役的隔离合同测试。
 * [POS]: macOS bundle journal 的回归测试；仅用临时 bundle 验证三种终态保留 journal 与备份。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

fn write(path: &Path, bytes: &[u8]) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, bytes).unwrap();
}

fn begin_native_transaction(
    state: &Path,
    app: &Path,
    source: &Path,
    destination: &Path,
) -> MacApplyTransaction {
    let executable = app.join("Contents/MacOS/Cavalry");
    let code_resources = app.join("Contents/_CodeSignature/CodeResources");
    write(&executable, b"vendor executable");
    write(destination, b"vendor runtime");
    write(&code_resources, b"vendor seal");
    write(source, b"native runtime");
    let preimages = MacApplyTransaction::capture_preimages(
        app,
        &[destination.to_path_buf(), code_resources.clone()],
    )
    .unwrap();

    MacApplyTransaction::begin_native_runtime_only_with_deferred_pairs_and_removals_guarded_by(
        NativeRuntimeIntent::ManagedRuntime,
        state,
        app,
        &[],
        &[],
        &[CopyPair {
            src: source.to_path_buf(),
            dst: destination.to_path_buf(),
        }],
        &[],
        &[],
        &[],
        std::slice::from_ref(&code_resources),
        &preimages,
        |_| Ok(()),
    )
    .unwrap()
}

#[test]
fn generic_finalizer_refuses_all_native_runtime_phases() {
    for terminal_phase in [
        JournalPhase::Restored,
        JournalPhase::RuntimeCommitted,
        JournalPhase::Committed,
    ] {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        let app = root.join("Cavalry.app");
        let state = root.join("state");
        let source = root.join("native-injector.dylib");
        let destination = app.join("Contents/Frameworks/native-injector.dylib");
        let mut transaction = begin_native_transaction(&state, &app, &source, &destination);

        if terminal_phase == JournalPhase::Restored {
            let rollback = transaction.rollback_with_cause("sentinel restore");
            assert!(rollback.contains("preimages were restored"), "{rollback}");
        } else {
            transaction.begin_signing().unwrap();
            transaction
                .verify_and_record_signing_postimages(|_| Ok(()))
                .unwrap();
            transaction.checkpoint_verified_bundle().unwrap();
            transaction.checkpoint_native_runtime_commit().unwrap();
            if terminal_phase == JournalPhase::Committed {
                transaction.manifest.phase = JournalPhase::Committed;
                write_manifest(&transaction.journal_dir, &transaction.manifest).unwrap();
            }
            transaction.active = false;
            std::mem::forget(transaction);
        }

        let journal = journal_root(&state);
        let manifest = read_manifest(&SecureDirectory::open(&journal).unwrap()).unwrap();
        assert_eq!(manifest.kind, JournalKind::NativeRuntimeOnly);
        assert_eq!(manifest.phase, terminal_phase);
        assert!(journal.join("backups/0.preimage").is_file());

        let error = finalize_recovered(&state, &app)
            .expect_err("generic finalizer must not retire NativeRuntimeOnly journals");
        assert!(error.contains("source-specific"), "{error}");
        assert!(error.contains("retained"), "{error}");
        assert!(journal.is_dir(), "canonical recovery journal was retired");
        assert!(journal.join("backups/0.preimage").is_file());
        assert_eq!(
            read_manifest(&SecureDirectory::open(&journal).unwrap())
                .unwrap()
                .phase,
            terminal_phase
        );
    }
}
