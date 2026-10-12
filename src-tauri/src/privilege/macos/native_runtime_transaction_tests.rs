/**
 * [INPUT]: 依赖 apply_transaction.rs 的私有 journal 阶段、严格构造器、验证器和恢复入口。
 * [OUTPUT]: 锁定state-bound兼容、bundle-only terminal、验源一次、deferred proof门、漂移拒绝与crash recovery。
 * [POS]: NRT事务只用fixture；不调用Cavalry，不写真实profile。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

fn write(path: &Path, bytes: &[u8]) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, bytes).unwrap();
}

fn advance_to_bundle_verified(transaction: &mut MacApplyTransaction) {
    transaction.begin_signing().unwrap();
    transaction
        .verify_and_record_signing_postimages(|_| Ok(()))
        .unwrap();
    transaction.checkpoint_verified_bundle().unwrap();
}

fn advance_to_bundle_verified_with_proof(
    transaction: &mut MacApplyTransaction,
) -> NativeRuntimePostimageProof {
    transaction.begin_signing().unwrap();
    let proof = transaction
        .verify_and_record_native_runtime_postimages(|_| Ok(()))
        .unwrap();
    transaction.checkpoint_verified_bundle().unwrap();
    proof
}

fn begin_native_runtime_transaction(
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
    let mut guard_calls = 0;
    let transaction =
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
            |exact| {
                guard_calls += 1;
                assert_eq!(exact, executable.as_path());
                Ok(())
            },
        )
        .unwrap();
    assert_eq!(guard_calls, 3);
    transaction
}

#[test]
fn native_runtime_only_commit_never_reads_or_writes_state_document() {
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("native-injector.dylib");
    let destination = app.join("Contents/Frameworks/native-injector.dylib");
    let original_state = b"state is not a commit oracle";
    let original_previous = b"previous state remains byte-identical";
    write(&state.join("state.json"), original_state);
    write(&state.join("state.json.prev"), original_previous);

    let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
    assert_eq!(transaction.manifest.kind, JournalKind::NativeRuntimeOnly);
    assert_eq!(
        transaction.manifest.schema_version,
        NATIVE_RUNTIME_MANIFEST_SCHEMA
    );
    assert_eq!(
        serde_json::to_value(&transaction.manifest).unwrap()["kind"],
        "nativeRuntimeOnly"
    );
    assert!(transaction
        .manifest
        .entries
        .iter()
        .all(|entry| entry.scope == EntryScope::Bundle));
    assert!(transaction.manifest.state_temporary_paths.is_empty());

    advance_to_bundle_verified(&mut transaction);
    assert!(transaction
        .begin_state_commit()
        .unwrap_err()
        .contains("cannot begin"));
    assert!(transaction
        .checkpoint_state_commit()
        .unwrap_err()
        .contains("cannot commit state.json"));
    transaction.checkpoint_native_runtime_commit().unwrap();
    assert_eq!(transaction.manifest.phase, JournalPhase::RuntimeCommitted);
    assert_eq!(fs::read(state.join("state.json")).unwrap(), original_state);
    assert_eq!(
        fs::read(state.join("state.json.prev")).unwrap(),
        original_previous
    );
    transaction.commit().unwrap();
    assert_eq!(fs::read(destination).unwrap(), b"native runtime");
    assert_eq!(fs::read(state.join("state.json")).unwrap(), original_state);
    assert_eq!(
        fs::read(state.join("state.json.prev")).unwrap(),
        original_previous
    );
}

#[test]
fn native_runtime_terminal_rechecks_payload_and_signature_postimages() {
    for mutate_signature in [false, true] {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        let app = root.join("Cavalry.app");
        let state = root.join("state");
        let source = root.join("native-injector.dylib");
        let destination = app.join("Contents/Frameworks/native-injector.dylib");
        let code_resources = app.join("Contents/_CodeSignature/CodeResources");
        let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
        advance_to_bundle_verified(&mut transaction);

        let drifted = if mutate_signature {
            &code_resources
        } else {
            &destination
        };
        write(drifted, b"external writer changed a verified postimage");
        let error = transaction.checkpoint_native_runtime_commit().unwrap_err();
        assert!(error.contains("postimage drifted"), "{error}");
        assert_eq!(transaction.manifest.phase, JournalPhase::BundleVerified);
        assert_eq!(
            read_manifest(&transaction.journal_dir).unwrap().phase,
            JournalPhase::BundleVerified
        );
        transaction.active = false;
        std::mem::forget(transaction);

        let recovery_error = recover_pending(&state, &app).unwrap_err();
        assert!(
            recovery_error.contains("unknown destination drift"),
            "{recovery_error}"
        );
        assert_eq!(
            fs::read(drifted).unwrap(),
            b"external writer changed a verified postimage"
        );
        assert!(journal_root(&state).exists());
    }
}

#[test]
fn native_runtime_rejects_a_state_directory_copy_before_creating_journal() {
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let executable = app.join("Contents/MacOS/Cavalry");
    let code_resources = app.join("Contents/_CodeSignature/CodeResources");
    let source = root.join("native-injector.dylib");
    let destination = state.join("state.json");
    write(&executable, b"vendor executable");
    write(&code_resources, b"vendor seal");
    write(&source, b"native runtime");
    let mut preimages =
        MacApplyTransaction::capture_preimages(&app, std::slice::from_ref(&code_resources))
            .unwrap();
    preimages.push(MacBundlePreimageConstraint {
        destination: destination.clone(),
        expected: ExpectedFileState { fingerprint: None },
    });
    let mut guard_calls = 0;
    let result =
        MacApplyTransaction::begin_native_runtime_only_with_deferred_pairs_and_removals_guarded_by(
            NativeRuntimeIntent::ManagedRuntime,
            &state,
            &app,
            &[],
            &[],
            &[CopyPair {
                src: source,
                dst: destination.clone(),
            }],
            &[],
            &[],
            &[],
            std::slice::from_ref(&code_resources),
            &preimages,
            |_| {
                guard_calls += 1;
                Ok(())
            },
        );
    let error = match result {
        Err(error) => error.display(),
        Ok(transaction) => {
            drop(transaction);
            panic!("NativeRuntimeOnly accepted a state-directory copy destination");
        }
    };

    assert!(error.contains("outside selected Cavalry bundle"), "{error}");
    assert_eq!(guard_calls, 0);
    assert!(!state.exists());
    assert!(!destination.exists());
    assert!(!journal_root(&state).exists());
}

#[test]
fn native_runtime_requires_exact_code_resources_signing_slot_before_journaling() {
    for wrong_signature_side_effect in [None, Some("Contents/_CodeSignature/CodeSignature")] {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        let app = root.join("Cavalry.app");
        let state = root.join("state");
        let executable = app.join("Contents/MacOS/Cavalry");
        let code_resources = app.join("Contents/_CodeSignature/CodeResources");
        let wrong_signature = app.join("Contents/_CodeSignature/CodeSignature");
        let source = root.join("native-injector.dylib");
        let destination = app.join("Contents/Frameworks/native-injector.dylib");
        write(&executable, b"vendor executable");
        write(&code_resources, b"vendor seal");
        write(&wrong_signature, b"vendor signature");
        write(&source, b"native runtime");
        write(&destination, b"vendor runtime");
        let preimages = MacApplyTransaction::capture_preimages(
            &app,
            &[destination.clone(), code_resources, wrong_signature.clone()],
        )
        .unwrap();
        let wrong_side_effects = wrong_signature_side_effect
            .as_ref()
            .map(|_| vec![wrong_signature])
            .unwrap_or_default();
        let mut guard_calls = 0;
        let result = MacApplyTransaction::begin_native_runtime_only_with_deferred_pairs_and_removals_guarded_by(
            NativeRuntimeIntent::ManagedRuntime,
            &state,
            &app,
            &[],
            &[],
            &[CopyPair {
                src: source,
                dst: destination.clone(),
            }],
            &[],
            &[],
            &[],
            &wrong_side_effects,
            &preimages,
            |_| {
                guard_calls += 1;
                Ok(())
            },
        );
        let error = match result {
            Err(error) => error.display(),
            Ok(transaction) => {
                drop(transaction);
                panic!("NativeRuntimeOnly accepted an incomplete signing side-effect set");
            }
        };

        assert!(error.contains("requires CodeResources"), "{error}");
        assert_eq!(guard_calls, 0);
        assert!(!state.exists());
        assert!(!journal_root(&state).exists());
        assert_eq!(fs::read(&destination).unwrap(), b"vendor runtime");
    }
}

#[test]
fn native_runtime_never_reaches_bundle_verified_without_a_successful_nonempty_signature_postimage()
{
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("native-injector.dylib");
    let destination = app.join("Contents/Frameworks/native-injector.dylib");
    let code_resources = app.join("Contents/_CodeSignature/CodeResources");
    let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
    transaction.begin_signing().unwrap();
    let mut verifier_calls = 0;
    let error = transaction
        .verify_and_record_signing_postimages(|_| {
            verifier_calls += 1;
            Err("simulated signature rejection".to_string())
        })
        .unwrap_err();
    assert!(error.contains("simulated signature rejection"), "{error}");
    assert_eq!(verifier_calls, 1);
    let checkpoint_error = transaction.checkpoint_verified_bundle().unwrap_err();
    assert!(
        checkpoint_error.contains("Signing side effect lacks a verified exact postimage"),
        "{checkpoint_error}"
    );
    assert_eq!(transaction.manifest.phase, JournalPhase::Signing);
    transaction.active = false;
    std::mem::forget(transaction);
    assert!(recover_pending(&state, &app).unwrap());
    assert_eq!(fs::read(code_resources).unwrap(), b"vendor seal");

    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("native-injector.dylib");
    let destination = app.join("Contents/Frameworks/native-injector.dylib");
    let code_resources = app.join("Contents/_CodeSignature/CodeResources");
    let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
    transaction.begin_signing().unwrap();
    fs::remove_file(&code_resources).unwrap();
    transaction
        .verify_and_record_signing_postimages(|_| Ok(()))
        .unwrap();
    let checkpoint_error = transaction.checkpoint_verified_bundle().unwrap_err();
    assert!(
        checkpoint_error.contains("no verified non-empty CodeResources signing postimage"),
        "{checkpoint_error}"
    );
    assert_eq!(transaction.manifest.phase, JournalPhase::Signing);
    transaction.active = false;
    std::mem::forget(transaction);
    assert!(recover_pending(&state, &app).unwrap());
    assert_eq!(fs::read(code_resources).unwrap(), b"vendor seal");
}

#[test]
fn native_runtime_crash_recovery_retains_journal_for_source_specific_finalizer() {
    for terminal_phase in [
        None,
        Some(JournalPhase::RuntimeCommitted),
        Some(JournalPhase::Committed),
    ] {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        let app = root.join("Cavalry.app");
        let state = root.join("state");
        let source = root.join("native-injector.dylib");
        let destination = app.join("Contents/Frameworks/native-injector.dylib");
        let original_state = b"corrupt-but-owned-state-bytes";
        write(&state.join("state.json"), original_state);
        let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
        advance_to_bundle_verified(&mut transaction);
        if terminal_phase.is_some() {
            transaction.checkpoint_native_runtime_commit().unwrap();
        }
        if terminal_phase == Some(JournalPhase::Committed) {
            transaction.manifest.phase = JournalPhase::Committed;
            write_manifest(&transaction.journal_dir, &transaction.manifest).unwrap();
        }
        transaction.active = false;
        std::mem::forget(transaction);

        let committed = terminal_phase.is_some();
        assert_eq!(
            pending_requires_bundle_restore(&state, &app).unwrap(),
            !committed
        );
        assert_eq!(recover_pending(&state, &app).unwrap(), !committed);
        if committed {
            assert_eq!(fs::read(&destination).unwrap(), b"native runtime");
        } else {
            assert_eq!(fs::read(&destination).unwrap(), b"vendor runtime");
        }
        let expected_phase = terminal_phase.unwrap_or(JournalPhase::Restored);
        let error = finalize_recovered(&state, &app).unwrap_err();
        assert!(error.contains("source-specific"), "{error}");
        assert!(error.contains("retained"), "{error}");
        let journal = journal_root(&state);
        assert!(journal.is_dir());
        assert!(journal.join("backups/0.preimage").is_file());
        assert_eq!(
            read_manifest(&SecureDirectory::open(&journal).unwrap())
                .unwrap()
                .phase,
            expected_phase
        );
        assert_eq!(fs::read(state.join("state.json")).unwrap(), original_state);
    }
}

#[test]
fn native_runtime_terminal_commit_refuses_drift_and_keeps_backups() {
    for mutate_signature in [false, true] {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        let app = root.join("Cavalry.app");
        let state = root.join("state");
        let source = root.join("native-injector.dylib");
        let destination = app.join("Contents/Frameworks/native-injector.dylib");
        let code_resources = app.join("Contents/_CodeSignature/CodeResources");
        let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
        advance_to_bundle_verified(&mut transaction);
        transaction.checkpoint_native_runtime_commit().unwrap();
        let drifted = if mutate_signature {
            &code_resources
        } else {
            &destination
        };
        write(drifted, b"external writer changed committed bytes");

        let error = transaction.commit().unwrap_err();
        assert!(error.contains("backups were retained"), "{error}");
        assert_eq!(
            read_manifest(&SecureDirectory::open(&journal_root(&state)).unwrap())
                .unwrap()
                .phase,
            JournalPhase::RuntimeCommitted
        );
        assert!(journal_root(&state).join("backups/0.preimage").exists());
        assert_eq!(
            fs::read(drifted).unwrap(),
            b"external writer changed committed bytes"
        );
        let recovery_error = recover_pending(&state, &app).unwrap_err();
        assert!(
            recovery_error.contains("postimage drifted"),
            "{recovery_error}"
        );
        assert!(journal_root(&state).exists());
    }
}

#[test]
fn native_runtime_source_verifier_runs_once_on_successful_commit() {
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("native-injector.dylib");
    let destination = app.join("Contents/Frameworks/native-injector.dylib");
    let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
    let mut source_verifications = 0;
    transaction.begin_signing().unwrap();
    let proof = transaction
        .verify_and_record_native_runtime_postimages(|pinned_app| {
            source_verifications += 1;
            assert_eq!(
                fs::read(pinned_app.join("Contents/Frameworks/native-injector.dylib"))
                    .map_err(|error| error.to_string())?,
                b"native runtime"
            );
            Ok(())
        })
        .unwrap();
    transaction.checkpoint_verified_bundle().unwrap();
    transaction.checkpoint_native_runtime_commit().unwrap();

    transaction.commit_native_managed_verified(proof).unwrap();

    assert_eq!(source_verifications, 1);
    assert!(!journal_root(&state).exists());
}

#[test]
fn native_runtime_postimage_proof_rejects_unpublished_deferred_app_writes() {
    for deferred_removal in [false, true] {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        let app = root.join("Cavalry.app");
        let state = root.join("state");
        let source = root.join("native-injector.dylib");
        let destination = app.join("Contents/Frameworks/native-injector.dylib");
        let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
        if deferred_removal {
            transaction
                .deferred_removal_destinations
                .insert(app.join("Contents/Frameworks/retired-injector.dylib"));
        } else {
            transaction
                .deferred_pair_destinations
                .insert(app.join("Contents/Frameworks/pending-injector.dylib"));
        }
        transaction.begin_signing().unwrap();

        let mut verifier_calls = 0;
        let error = match transaction.verify_and_record_native_runtime_postimages(|_| {
            verifier_calls += 1;
            Ok(())
        }) {
            Err(error) => error,
            Ok(_) => panic!("NRT issued a proof while deferred App writes remained"),
        };

        assert!(error.contains("deferred App writes"), "{error}");
        assert_eq!(verifier_calls, 0);
    }
}

#[test]
fn native_runtime_cleanup_rechecks_fixed_slot_after_committed_record_and_retains_backup() {
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("native-injector.dylib");
    let destination = app.join("Contents/Frameworks/native-injector.dylib");
    let drifted = destination.clone();
    let transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
    let mut transaction = transaction;
    let mut source_verifications = 0;
    transaction.begin_signing().unwrap();
    let proof = transaction
        .verify_and_record_native_runtime_postimages(|_| {
            source_verifications += 1;
            Ok(())
        })
        .unwrap();
    transaction.checkpoint_verified_bundle().unwrap();
    transaction.checkpoint_native_runtime_commit().unwrap();
    let drift_path = drifted.clone();
    BEFORE_NATIVE_RUNTIME_RETIRE.with(|slot| {
        *slot.borrow_mut() = Some(Box::new(move || {
            fs::write(drift_path, b"late fixed-slot drift").unwrap();
        }));
    });

    let error = transaction
        .commit_native_managed_verified(proof)
        .unwrap_err();
    assert!(error.contains("blocks backup retirement"), "{error}");
    assert_eq!(source_verifications, 1);
    let journal = journal_root(&state);
    assert!(journal.exists());
    assert_eq!(
        read_manifest(&SecureDirectory::open(&journal).unwrap())
            .unwrap()
            .phase,
        JournalPhase::Committed
    );
    assert!(journal.join("backups/0.preimage").exists());
    assert_eq!(fs::read(&drifted).unwrap(), b"late fixed-slot drift");
    let recovery_error = recover_pending(&state, &app).unwrap_err();
    assert!(
        recovery_error.contains("postimage drifted"),
        "{recovery_error}"
    );
    assert_eq!(fs::read(&drifted).unwrap(), b"late fixed-slot drift");
    assert!(journal.exists());
}

#[test]
fn native_runtime_postimage_proof_is_bound_to_its_operation_and_bundle() {
    let issuer_temp = tempfile::tempdir().unwrap();
    let issuer_root = fs::canonicalize(issuer_temp.path()).unwrap();
    let issuer_app = issuer_root.join("Cavalry.app");
    let issuer_state = issuer_root.join("state");
    let issuer_source = issuer_root.join("native-injector.dylib");
    let issuer_destination = issuer_app.join("Contents/Frameworks/native-injector.dylib");
    let mut issuer = begin_native_runtime_transaction(
        &issuer_state,
        &issuer_app,
        &issuer_source,
        &issuer_destination,
    );
    let proof = advance_to_bundle_verified_with_proof(&mut issuer);
    issuer.checkpoint_native_runtime_commit().unwrap();
    issuer.active = false;
    drop(issuer);

    let recipient_temp = tempfile::tempdir().unwrap();
    let recipient_root = fs::canonicalize(recipient_temp.path()).unwrap();
    let recipient_app = recipient_root.join("Cavalry.app");
    let recipient_state = recipient_root.join("state");
    let recipient_source = recipient_root.join("native-injector.dylib");
    let recipient_destination = recipient_app.join("Contents/Frameworks/native-injector.dylib");
    let mut recipient = begin_native_runtime_transaction(
        &recipient_state,
        &recipient_app,
        &recipient_source,
        &recipient_destination,
    );
    advance_to_bundle_verified(&mut recipient);
    recipient.checkpoint_native_runtime_commit().unwrap();
    let journal = journal_root(&recipient_state);

    let error = recipient.commit_native_managed_verified(proof).unwrap_err();
    assert!(
        error.contains("does not match this committed operation"),
        "{error}"
    );
    assert_eq!(
        read_manifest(&SecureDirectory::open(&journal).unwrap())
            .unwrap()
            .phase,
        JournalPhase::RuntimeCommitted
    );
    assert!(journal.join("backups/0.preimage").exists());
}

#[test]
fn native_runtime_manifest_rejects_state_entries_and_state_terminal_phases() {
    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("native-injector.dylib");
    let destination = app.join("Contents/Frameworks/native-injector.dylib");
    let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
    let mut state_entry = transaction.manifest.entries[0].clone();
    state_entry.destination = transaction.manifest.state_path.clone();
    state_entry.scope = EntryScope::State;
    transaction.manifest.entries.push(state_entry);
    write_manifest(&transaction.journal_dir, &transaction.manifest).unwrap();
    transaction.active = false;
    std::mem::forget(transaction);

    let error = recover_pending(&state, &app).unwrap_err();
    assert!(error.contains("must not contain state entries"), "{error}");
    assert_eq!(fs::read(&destination).unwrap(), b"native runtime");
    assert!(journal_root(&state).exists());

    for phase in [JournalPhase::StateCommitting, JournalPhase::StateCommitted] {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        let app = root.join("Cavalry.app");
        let state = root.join("state");
        let source = root.join("native-injector.dylib");
        let destination = app.join("Contents/Frameworks/native-injector.dylib");
        let mut transaction = begin_native_runtime_transaction(&state, &app, &source, &destination);
        transaction.manifest.phase = phase;
        write_manifest(&transaction.journal_dir, &transaction.manifest).unwrap();
        transaction.active = false;
        std::mem::forget(transaction);

        let error = recover_pending(&state, &app).unwrap_err();
        assert!(
            error.contains("must not contain state commit metadata"),
            "{phase:?}: {error}"
        );
        assert_eq!(fs::read(&destination).unwrap(), b"native runtime");
        assert!(journal_root(&state).exists());
    }

    let temp = tempfile::tempdir().unwrap();
    let root = fs::canonicalize(temp.path()).unwrap();
    let app = root.join("Cavalry.app");
    let state = root.join("state");
    let source = root.join("translated.json");
    let destination = app.join("Contents/assets/appStrings.json");
    write(&destination, b"official");
    write(&source, b"translated");
    let mut transaction = MacApplyTransaction::begin(
        &state,
        &app,
        &[CopyPair {
            src: source,
            dst: destination.clone(),
        }],
    )
    .unwrap();
    transaction.manifest.phase = JournalPhase::RuntimeCommitted;
    write_manifest(&transaction.journal_dir, &transaction.manifest).unwrap();
    transaction.active = false;
    std::mem::forget(transaction);

    let error = recover_pending(&state, &app).unwrap_err();
    assert!(error.contains("native runtime terminal phase"), "{error}");
    assert_eq!(fs::read(destination).unwrap(), b"translated");
    assert!(journal_root(&state).exists());
}
