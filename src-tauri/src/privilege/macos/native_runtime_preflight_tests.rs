/**
 * [INPUT]: 依赖父测试模块的NRT终结fixture、journal映像和记录runner。
 * [OUTPUT]: 验证恢复前profile回调的四phase、终态跳过及拒绝回滚。
 * [POS]: macOS NRT恢复时序合同。复用终结器fixture，不复制vendor证明。
 * 仅访问临时bundle；不读取真实App、profile或凭据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;
use std::cell::Cell;

fn active_recovery_fixture(
    phase: JournalPhase,
) -> (
    crate::native_mac_vendor_baseline::tests::Fixture,
    PathBuf,
    PathBuf,
) {
    assert!(matches!(
        phase,
        JournalPhase::Prepared
            | JournalPhase::Applying
            | JournalPhase::Signing
            | JournalPhase::BundleVerified
    ));
    let fixture = fixture(false);
    let destination = fixture.app.join("Contents/Resources/profile-preflight.txt");
    let source = fixture
        ._temp
        .path()
        .join("profile-preflight-translated.txt");
    let code_resources = fixture.app.join("Contents/_CodeSignature/CodeResources");
    fs::write(&destination, b"official").unwrap();
    fs::write(&source, b"translated").unwrap();
    let preimages = MacApplyTransaction::capture_preimages(
        &fixture.app,
        &[destination.clone(), code_resources.clone()],
    )
    .unwrap();
    let pair = crate::patch::CopyPair {
        src: source,
        dst: destination.clone(),
    };
    let mut transaction =
        MacApplyTransaction::begin_native_runtime_only_with_deferred_pairs_and_removals_guarded(
            NativeRuntimeIntent::ManagedRuntime,
            &fixture.state,
            &fixture.app,
            &[],
            &[],
            std::slice::from_ref(&pair),
            &[],
            &[],
            &[],
            std::slice::from_ref(&code_resources),
            &preimages,
        )
        .unwrap();

    match phase {
        JournalPhase::Prepared => {
            fs::write(&destination, b"official").unwrap();
            transaction.manifest.phase = JournalPhase::Prepared;
            write_manifest(&transaction.journal_dir, &transaction.manifest).unwrap();
        }
        JournalPhase::Applying => {}
        JournalPhase::Signing => transaction.begin_signing().unwrap(),
        JournalPhase::BundleVerified => {
            transaction.begin_signing().unwrap();
            transaction
                .verify_and_record_signing_postimages(|_| Ok(()))
                .unwrap();
            transaction.checkpoint_verified_bundle().unwrap();
        }
        _ => unreachable!(),
    }

    let journal = journal_root(&fixture.state);
    transaction.active = false;
    drop(transaction);
    (fixture, destination, journal)
}

fn set_pending_phase(
    fixture: &crate::native_mac_vendor_baseline::tests::Fixture,
    phase: JournalPhase,
) -> PathBuf {
    let destination = fixture.app.join("Contents/Resources/profile-preflight.txt");
    let source = fixture
        ._temp
        .path()
        .join("profile-preflight-translated.txt");
    let code_resources = fixture.app.join("Contents/_CodeSignature/CodeResources");
    fs::write(&destination, b"official").unwrap();
    fs::write(&source, b"translated").unwrap();
    let preimages = MacApplyTransaction::capture_preimages(
        &fixture.app,
        &[destination.clone(), code_resources.clone()],
    )
    .unwrap();
    let pair = crate::patch::CopyPair {
        src: source,
        dst: destination,
    };
    let mut transaction =
        MacApplyTransaction::begin_native_runtime_only_with_deferred_pairs_and_removals_guarded(
            NativeRuntimeIntent::ManagedRuntime,
            &fixture.state,
            &fixture.app,
            &[],
            &[],
            std::slice::from_ref(&pair),
            &[],
            &[],
            &[],
            std::slice::from_ref(&code_resources),
            &preimages,
        )
        .unwrap();
    transaction.begin_signing().unwrap();
    transaction
        .verify_and_record_signing_postimages(|_| Ok(()))
        .unwrap();
    transaction.checkpoint_verified_bundle().unwrap();
    transaction.manifest.phase = phase;
    write_manifest(&transaction.journal_dir, &transaction.manifest).unwrap();
    let journal = journal_root(&fixture.state);
    transaction.active = false;
    drop(transaction);
    journal
}

#[test]
fn nrt_profile_preflight_is_skipped_without_a_pending_journal() {
    let fixture = fixture(false);
    let callback_calls = Cell::new(0);
    let mut runner = FixtureRunner;

    crate::privilege::recover_native_runtime_transaction_with_before_restore(
        &fixture.state,
        &fixture.app,
        &mut runner,
        || {
            callback_calls.set(callback_calls.get() + 1);
            Ok(())
        },
    )
    .unwrap();

    assert_eq!(callback_calls.get(), 0);
}

#[test]
fn nrt_profile_preflight_runs_once_for_each_valid_restore_phase() {
    for phase in [
        JournalPhase::Prepared,
        JournalPhase::Applying,
        JournalPhase::Signing,
        JournalPhase::BundleVerified,
    ] {
        let (fixture, destination, journal) = active_recovery_fixture(phase);
        let callback_calls = Cell::new(0);
        let mut runner = FixtureRunner;

        let result = crate::privilege::recover_native_runtime_transaction_with_before_restore(
            &fixture.state,
            &fixture.app,
            &mut runner,
            || {
                callback_calls.set(callback_calls.get() + 1);
                Ok(())
            },
        );

        assert!(result.is_ok(), "phase {phase:?}: {result:?}");
        assert_eq!(callback_calls.get(), 1, "phase {phase:?}");
        assert_eq!(
            fs::read(&destination).unwrap(),
            b"official",
            "phase {phase:?}"
        );
        assert!(!journal.exists(), "phase {phase:?}");
    }
}

#[test]
fn nrt_profile_preflight_is_skipped_for_terminal_phases() {
    for phase in [
        JournalPhase::RuntimeCommitted,
        JournalPhase::Committed,
        JournalPhase::Restored,
    ] {
        let fixture = fixture(false);
        let journal = terminal_transaction(
            &fixture.state,
            &fixture.app,
            NativeRuntimeIntent::ManagedRuntime,
            phase,
        );
        let callback_calls = Cell::new(0);
        let mut runner = FixtureRunner;

        let result = crate::privilege::recover_native_runtime_transaction_with_before_restore(
            &fixture.state,
            &fixture.app,
            &mut runner,
            || {
                callback_calls.set(callback_calls.get() + 1);
                Ok(())
            },
        );

        assert!(result.is_ok(), "phase {phase:?}: {result:?}");
        assert_eq!(callback_calls.get(), 0, "phase {phase:?}");
        assert!(!journal.exists(), "phase {phase:?}");
    }
}

#[test]
fn nrt_profile_preflight_skips_invalid_state_phases_and_keeps_journal() {
    for phase in [JournalPhase::StateCommitting, JournalPhase::StateCommitted] {
        let fixture = fixture(false);
        let journal = set_pending_phase(&fixture, phase);
        let destination = fixture.app.join("Contents/Resources/profile-preflight.txt");
        let callback_calls = Cell::new(0);
        let mut runner = FixtureRunner;

        let error = crate::privilege::recover_native_runtime_transaction_with_before_restore(
            &fixture.state,
            &fixture.app,
            &mut runner,
            || {
                callback_calls.set(callback_calls.get() + 1);
                Ok(())
            },
        )
        .unwrap_err();

        assert!(error.contains("state commit metadata"), "{error}");
        assert_eq!(callback_calls.get(), 0, "phase {phase:?}");
        assert_eq!(fs::read(destination).unwrap(), b"translated");
        assert_journal_and_backup_exist(&journal);
    }
}

#[test]
fn nrt_profile_preflight_error_is_preserved_before_app_rollback() {
    const SENTINEL: &str = "profile projection sentinel";
    let (fixture, destination, journal) = active_recovery_fixture(JournalPhase::Applying);
    let callback_calls = Cell::new(0);
    let before = fs::read(&destination).unwrap();
    let mut runner = FixtureRunner;

    let error = crate::privilege::recover_native_runtime_transaction_with_before_restore(
        &fixture.state,
        &fixture.app,
        &mut runner,
        || {
            callback_calls.set(callback_calls.get() + 1);
            Err(SENTINEL.to_string())
        },
    )
    .unwrap_err();

    assert_eq!(error, SENTINEL);
    assert_eq!(callback_calls.get(), 1);
    assert_eq!(fs::read(destination).unwrap(), before);
    assert_journal_and_backup_exist(&journal);
}

#[test]
fn nrt_profile_preflight_runs_after_current_state_validation() {
    let (fixture, destination, journal) = active_recovery_fixture(JournalPhase::Applying);
    fs::write(&destination, b"external drift").unwrap();
    let callback_calls = Cell::new(0);
    let mut runner = FixtureRunner;

    let error = crate::privilege::recover_native_runtime_transaction_with_before_restore(
        &fixture.state,
        &fixture.app,
        &mut runner,
        || {
            callback_calls.set(callback_calls.get() + 1);
            Ok(())
        },
    )
    .unwrap_err();

    assert!(error.contains("unknown destination drift"), "{error}");
    assert_eq!(callback_calls.get(), 0);
    assert_eq!(fs::read(destination).unwrap(), b"external drift");
    assert_journal_and_backup_exist(&journal);
}

#[test]
fn nrt_profile_preflight_rejects_schema6_without_changing_generic_recovery() {
    let fixture = fixture(false);
    let destination = fixture.app.join("Contents/Resources/profile-preflight.txt");
    let source = fixture
        ._temp
        .path()
        .join("profile-preflight-translated.txt");
    fs::write(&destination, b"official").unwrap();
    fs::write(&source, b"translated").unwrap();
    let pair = crate::patch::CopyPair {
        src: source,
        dst: destination.clone(),
    };
    let transaction = MacApplyTransaction::begin(&fixture.state, &fixture.app, &[pair]).unwrap();
    std::mem::forget(transaction);
    let journal = journal_root(&fixture.state);
    let callback_calls = Cell::new(0);
    let mut runner = FixtureRunner;

    let error = crate::privilege::recover_native_runtime_transaction_with_before_restore(
        &fixture.state,
        &fixture.app,
        &mut runner,
        || {
            callback_calls.set(callback_calls.get() + 1);
            Ok(())
        },
    )
    .unwrap_err();

    assert!(error.contains("NativeRuntimeOnly journal"), "{error}");
    assert_eq!(callback_calls.get(), 0);
    assert_eq!(fs::read(&destination).unwrap(), b"translated");
    assert_journal_and_backup_exist(&journal);

    crate::privilege::recover_macos_apply_transaction(&fixture.state, &fixture.app, &mut runner)
        .unwrap();
    assert_eq!(fs::read(destination).unwrap(), b"official");
    assert!(!journal.exists());
}
