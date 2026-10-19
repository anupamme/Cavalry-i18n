/**
 * [INPUT]: 依赖operation guard、bounded owner source hint、2.8 bundle观察、approved runtime/pack与profile事务。
 * [OUTPUT]: 协调同源profile快路、stock首装、managed制品更新与English双owner恢复。
 * [POS]: 显式native预览动作编排。匹配hint只准profile事务，不准App完整性结论或bundle写。
 * 同源profile快路由native_user报告真实恢复检查；canonical回调只在新receipt写前启动Apply。
 * NRT仅在实际回写App前预读profile；判定使用恢复器同份manifest。
 * stock、runtime更新和English恢复保留App写前profile准入。
 * English、源不匹配、坏hint与非2.8候选保留原完整owner准入。
 * 独立restart保留独立准入。source SHA绑定嵌入字节与staging实读。不自动启动Cavalry。
 * staging dylib 使用bundle安装模式0755；0700父目录隔离暂存内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::Write,
    os::unix::fs::{DirBuilderExt, OpenOptionsExt, PermissionsExt},
    path::Path,
};

use super::{
    contract::{self, ActionPayload, OperationPhase, OperationPhaseGuard, OperationReporter},
    native_resources, native_user,
    user_language_files::{self, UserLanguagePaths},
};
use crate::{
    native_mac_runtime_apply::{self, NativeRuntimeApplyError},
    native_mac_vendor_baseline,
    operation_lock::BundleOperationGuard,
    privilege::{self, CommandRunner, PostCommitWarning},
};

fn native_action_language(action: &str) -> &str {
    if action == super::context::RESTORE_OFFICIAL_ACTION {
        "en"
    } else {
        action
    }
}

fn runtime_candidate_needs_install(owner_sha256: Option<&str>, candidate_sha256: &str) -> bool {
    owner_sha256 != Some(candidate_sha256)
}

fn profile_facade_admission_required(
    language: &str,
    has_managed_owner: bool,
    has_runtime_candidate: bool,
) -> bool {
    language == "en" || !has_managed_owner || has_runtime_candidate
}

pub(super) fn apply<R: OperationReporter, C: CommandRunner>(
    operation: &BundleOperationGuard,
    repo: &Path,
    state: &Path,
    resources: &Path,
    app: &Path,
    language: &str,
    reporter: R,
    runner: &mut C,
) -> ActionPayload {
    let paths = match privilege::current_user_home()
        .and_then(|home| UserLanguagePaths::for_user_dirs(&home, state))
    {
        Ok(paths) => paths,
        Err(error) => return native_user::transaction_error(&error),
    };
    apply_with_paths(
        operation, repo, state, resources, app, language, &paths, reporter, runner,
    )
}

fn apply_with_paths<R: OperationReporter, C: CommandRunner>(
    operation: &BundleOperationGuard,
    repo: &Path,
    state: &Path,
    resources: &Path,
    app: &Path,
    language: &str,
    paths: &UserLanguagePaths,
    reporter: R,
    runner: &mut C,
) -> ActionPayload {
    apply_with_paths_using_loaders(
        operation,
        repo,
        state,
        resources,
        app,
        language,
        paths,
        super::native_runtime_source::approved_runtime_bytes,
        native_resources::load_language_resource,
        reporter,
        runner,
    )
}

/// 生产包装器固定使用编译期approved source与manifest核验pack；闭包只隔离fixture读入。
fn apply_with_paths_using_loaders<'source, R, C, RuntimeLoader, PackLoader>(
    operation: &BundleOperationGuard,
    repo: &Path,
    state: &Path,
    resources: &Path,
    app: &Path,
    language: &str,
    paths: &UserLanguagePaths,
    runtime_loader: RuntimeLoader,
    pack_loader: PackLoader,
    reporter: R,
    runner: &mut C,
) -> ActionPayload
where
    R: OperationReporter,
    C: CommandRunner,
    RuntimeLoader: FnOnce() -> Result<&'source [u8], String>,
    PackLoader: FnOnce(&Path, &Path, &str) -> Result<Vec<u8>, String>,
{
    let language = native_action_language(language);
    let mut runtime_loader = Some(runtime_loader);
    let mut pack_loader = Some(pack_loader);
    let mut verify = OperationPhaseGuard::start(&reporter, OperationPhase::VerifyInstallation);
    if !super::context::is_supported_language(language) {
        return ActionPayload::error_with_code(
            "Unsupported native language action.",
            "unsupportedLanguage",
        );
    }
    if let Err(error) = operation
        .require_state_dir(state)
        .and_then(|_| native_user::writer_guard())
    {
        return native_user::transaction_error(&error);
    }
    let mut profile_error = None;
    let recovery = privilege::recover_native_runtime_transaction_with_before_restore(
        state,
        app,
        runner,
        || {
            user_language_files::read_profile_projection(paths)
                .map(|_| ())
                .map_err(|error| {
                    profile_error = Some(error.clone());
                    error
                })
        },
    );
    if let Err(error) = recovery {
        return match profile_error {
            Some(error) => native_user::transaction_error(&error),
            None => runtime_error(error.into()),
        };
    }

    // 同源hint只缩短profile-only动作；源、owner或宿主不吻合时沿用原完整准入顺序。
    let mut hinted_source = None;
    if language != "en" {
        if let Ok(hint) = privilege::native_runtime_owner_hint_for_selection(state, app) {
            if hint.owned {
                if let Some(owner_sha256) = hint.source_sha256.as_deref() {
                    let load_source = runtime_loader
                        .take()
                        .expect("runtime loader is consumed at most once");
                    let source = load_source();
                    let source_matches = source
                        .as_ref()
                        .is_ok_and(|bytes| format!("{:x}", Sha256::digest(bytes)) == owner_sha256);
                    hinted_source = Some(source);
                    if source_matches
                        && matches!(
                            native_resources::observe_install(app),
                            Ok((_canonical_app, version))
                                if version == native_resources::NATIVE_VERSION
                        )
                    {
                        let load_pack = pack_loader
                            .take()
                            .expect("pack loader is consumed at most once");
                        let pack = match load_pack(repo, resources, language) {
                            Ok(pack) => pack,
                            Err(error) => {
                                return ActionPayload::error_with_code(
                                    &error,
                                    "nativeResourceUnavailable",
                                )
                            }
                        };
                        verify.completed();
                        // 用户profile恢复阶段覆盖真实receipt检查；新事务只在首次receipt写前开始。
                        return native_user::apply_profile(
                            paths,
                            language,
                            Some(&pack),
                            &mut native_user::writer_guard,
                            &reporter,
                        );
                    }
                }
            }
        }
    }

    let managed = match privilege::load_owned_native_runtime_details(state, app, runner) {
        Ok(managed) => managed,
        Err(error) if language == "en" => {
            // 无可信bundle许可时，只恢复Current-owned profile，不改bundle或launch。
            return native_user::apply_english_with_host_probe(
                &paths,
                || Err(error),
                &mut native_user::writer_guard,
                &reporter,
                &mut verify,
            );
        }
        Err(error) => return runtime_error(error.into()),
    };
    if managed.is_none() {
        if let Err(error) = native_resources::verify_host(app) {
            if language == "en" {
                return native_user::apply_english_with_host_probe(
                    &paths,
                    || Err(error),
                    &mut native_user::writer_guard,
                    &reporter,
                    &mut verify,
                );
            }
            return ActionPayload::error_with_code(&error, "installationVerificationFailed");
        }
    }
    // 已受管动作也先读取经过build gate核验的嵌入制品。
    // owner缺SHA或制品变化时，只更新Switcher自有runtime槽。
    let runtime_candidate = if language == "en" {
        None
    } else {
        let source = hinted_source.unwrap_or_else(|| {
            let load_source = runtime_loader
                .take()
                .expect("runtime loader is consumed at most once");
            load_source()
        });
        match source {
            Ok(bytes) => {
                let source_sha256 = format!("{:x}", Sha256::digest(bytes));
                let owner_sha256 = managed
                    .as_ref()
                    .and_then(|owner| owner.source_sha256.as_deref());
                let needs_install = runtime_candidate_needs_install(owner_sha256, &source_sha256);
                needs_install.then_some((bytes, source_sha256))
            }
            Err(error) => {
                return ActionPayload::error_with_code(&error, "nativeResourceUnavailable")
            }
        }
    };
    let pack = if language == "en" {
        None
    } else {
        let load_pack = pack_loader
            .take()
            .expect("pack loader is consumed at most once");
        match load_pack(repo, resources, language) {
            Ok(pack) => Some(pack),
            Err(error) => {
                return ActionPayload::error_with_code(&error, "nativeResourceUnavailable")
            }
        }
    };
    verify.completed();
    let mut baseline_phase = OperationPhaseGuard::start(&reporter, OperationPhase::EnsureBaseline);
    if profile_facade_admission_required(language, managed.is_some(), runtime_candidate.is_some()) {
        match user_language_files::recover_with_writer_guard(&paths, &mut native_user::writer_guard)
        {
            Ok(
                user_language_files::RecoveryOutcome::NothingPending
                | user_language_files::RecoveryOutcome::Completed,
            ) => {}
            Ok(_) => {
                return native_user::transaction_error(
                    "native profile recovery durability remains unproven",
                )
            }
            Err(error) => return native_user::transaction_error(&error),
        }
        if let Err(error) = native_user::restart_profile_admission(&paths) {
            return native_user::transaction_error(&error);
        }
    }
    let mut previous_owner_preimage = None;
    let baseline = match managed {
        Some(owner) => {
            previous_owner_preimage = Some(owner.preimage);
            Some(owner.baseline)
        }
        None if language != "en" => {
            match native_mac_vendor_baseline::capture_or_reuse(app, state, runner) {
                Ok(baseline) => Some(baseline),
                Err(error) => return runtime_error(error.into()),
            }
        }
        None => None,
    };
    baseline_phase.completed();
    let mut apply_phase = OperationPhaseGuard::start(&reporter, OperationPhase::ApplyTransaction);
    let mut warnings = Vec::new();
    let mut runtime_committed = false;
    if let Some((bytes, expected_source_sha256)) = runtime_candidate {
        let result = with_embedded_runtime_source(
            state,
            bytes,
            &expected_source_sha256,
            |source, staging, staged_source_sha256| {
                let baseline = baseline.as_ref().expect("non-English runtime baseline");
                match previous_owner_preimage.as_ref() {
                    Some(previous_owner_preimage) => {
                        native_mac_runtime_apply::install_managed_native_runtime(
                            operation,
                            baseline,
                            app,
                            staging,
                            source,
                            staged_source_sha256,
                            previous_owner_preimage,
                            runner,
                        )
                    }
                    None => native_mac_runtime_apply::install_stock_native_runtime(
                        operation,
                        baseline,
                        app,
                        staging,
                        source,
                        staged_source_sha256,
                        runner,
                    ),
                }
            },
        );
        match result {
            Ok(value) => {
                warnings = value;
                runtime_committed = true;
            }
            Err(error) => return runtime_error(error),
        }
    }
    let mut payload = native_user::apply_profile(
        &paths,
        language,
        pack.as_deref(),
        &mut native_user::writer_guard,
        &contract::NoopReporter,
    );
    if !payload.ok || payload.reconciliation_required {
        if runtime_committed {
            payload.reconciliation_required = true;
            payload.error = Some("Native runtime installed; user language transaction did not complete. Retry after reconciliation; Cavalry was not launched.".into());
        }
        return payload;
    }
    if language == "en" {
        if let Some(baseline) = baseline {
            let staging = state.join(format!(
                "native-vendor-restore-{}-{}",
                std::process::id(),
                super::context::next_staging_nonce()
            ));
            match native_mac_runtime_apply::restore_native_runtime_vendor(
                operation, &baseline, app, &staging, runner,
            ) {
                Ok(value) => warnings.extend(value),
                Err(error) => {
                    let mut failure = runtime_error(error);
                    failure.current_lang = Some("en".into());
                    failure.reconciliation_required = true;
                    failure.error = Some("User language restored to English; native bundle restore did not complete. Retry Restore English; Cavalry was not launched.".into());
                    return failure;
                }
            }
        }
    }
    payload.reconciliation_required = warnings
        .iter()
        .any(|warning| warning.code == privilege::PostCommitWarningCode::TransactionBackupCleanup);
    payload.warning = contract::renderer_warning_for_copy(&warnings, "direct");
    if warnings.is_empty() {
        apply_phase.completed();
    } else {
        apply_phase.warning();
    }
    payload
}

fn runtime_error(error: NativeRuntimeApplyError) -> ActionPayload {
    if error.permission_denied {
        ActionPayload::permission_error(&error.message)
    } else {
        ActionPayload::error_with_code(&error.message, "installationVerificationFailed")
    }
}

/// 只把编译时已嵌入bytes写入本次排他stage。运行时不读环境或历史/tmp制品。
fn with_embedded_runtime_source(
    state: &Path,
    bytes: &[u8],
    expected_source_sha256: &str,
    install: impl FnOnce(&Path, &Path, &str) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError>,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError> {
    let root = state.join(format!(
        "native-runtime-source-{}-{}",
        std::process::id(),
        super::context::next_staging_nonce()
    ));
    fs::DirBuilder::new()
        .mode(0o700)
        .create(&root)
        .map_err(|e| e.to_string())?;
    let result = (|| {
        let source = root.join("approved-injector.dylib");
        let mut file = fs::OpenOptions::new()
            .create_new(true)
            .write(true)
            .mode(0o755)
            .open(&source)
            .map_err(|e| e.to_string())?;
        file.set_permissions(fs::Permissions::from_mode(0o755))
            .map_err(|e| e.to_string())?;
        file.write_all(bytes)
            .and_then(|_| file.sync_all())
            .map_err(|e| e.to_string())?;
        drop(file);
        let staged_bytes = fs::read(&source).map_err(|e| e.to_string())?;
        let staged_source_sha256 = format!("{:x}", Sha256::digest(&staged_bytes));
        if staged_source_sha256 != expected_source_sha256 {
            return Err(
                String::from("Embedded runtime stage differs from approved source bytes.").into(),
            );
        }
        install(&source, &root.join("runtime-plan"), &staged_source_sha256)
    })();
    match fs::remove_dir_all(&root) {
        Ok(()) => result,
        Err(error) => match result {
            Ok(mut warnings) => {
                warnings.push(privilege::PostCommitWarning::new(
                    privilege::PostCommitWarningCode::StagingCleanup,
                    [root],
                    Some(error.to_string()),
                ));
                Ok(warnings)
            }
            Err(mut cause) => {
                cause.message =
                    format!("{}; runtime source cleanup failed: {error}", cause.message);
                Err(cause)
            }
        },
    }
}

#[cfg(test)]
pub(crate) fn apply_disposable_profile<C: CommandRunner>(
    operation: &BundleOperationGuard,
    repo: &Path,
    state: &Path,
    app: &Path,
    home: &Path,
    language: &str,
    runner: &mut C,
    expected_injector_sha: &str,
) -> ActionPayload {
    use sha2::{Digest, Sha256};
    assert_eq!(
        format!(
            "{:x}",
            Sha256::digest(super::native_runtime_source::approved_runtime_bytes().unwrap())
        ),
        expected_injector_sha
    );
    let paths = UserLanguagePaths::for_user_dirs(home, state).unwrap();
    apply_with_paths(
        operation,
        repo,
        state,
        repo,
        app,
        language,
        &paths,
        contract::NoopReporter,
        runner,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renderer_official_restore_uses_the_same_english_dual_owner_path() {
        assert_eq!(
            native_action_language(super::super::context::RESTORE_OFFICIAL_ACTION),
            "en"
        );
        for language in ["en", "zh-Hans", "zh-Hant", "ja_JP"] {
            assert_eq!(native_action_language(language), language);
        }
        assert!(!super::super::context::is_supported_language(
            native_action_language("unknown-action")
        ));
    }

    #[test]
    fn managed_runtime_only_skips_when_approved_source_hash_matches_verified_owner() {
        let sha_a = format!("{:x}", Sha256::digest(b"source A"));
        let sha_b = format!("{:x}", Sha256::digest(b"source B"));
        assert!(!runtime_candidate_needs_install(Some(&sha_a), &sha_a));
        assert!(runtime_candidate_needs_install(Some(&sha_a), &sha_b));
        assert!(runtime_candidate_needs_install(None, &sha_a));
    }

    #[test]
    fn profile_facade_admission_tracks_app_mutation_boundaries() {
        assert!(profile_facade_admission_required("zh-Hans", false, true));
        assert!(profile_facade_admission_required("zh-Hant", true, true));
        assert!(profile_facade_admission_required("en", true, false));
        assert!(!profile_facade_admission_required("ja_JP", true, false));
    }

    #[test]
    fn embedded_source_stage_is_exact_and_removed_after_success_or_failure() {
        let temp = tempfile::tempdir().unwrap();
        let state = temp.path().canonicalize().unwrap();
        let before = fs::read_dir(&state).unwrap().count();
        let expected = format!("{:x}", Sha256::digest(b"frozen bytes"));
        for succeeds in [true, false] {
            let result = with_embedded_runtime_source(
                &state,
                b"frozen bytes",
                &expected,
                |source, staging, staged_sha| {
                    let staged_bytes = fs::read(source).unwrap();
                    assert_eq!(staged_bytes, b"frozen bytes");
                    assert_eq!(staged_sha, format!("{:x}", Sha256::digest(&staged_bytes)));
                    assert_eq!(
                        fs::metadata(source).unwrap().permissions().mode() & 0o7777,
                        0o755
                    );
                    assert_eq!(
                        fs::metadata(source.parent().unwrap())
                            .unwrap()
                            .permissions()
                            .mode()
                            & 0o7777,
                        0o700
                    );
                    assert_eq!(staged_sha, expected);
                    assert!(source.starts_with(&state));
                    assert!(!staging.exists());
                    if succeeds {
                        Ok(Vec::new())
                    } else {
                        Err("fixture install refused".to_string().into())
                    }
                },
            );
            assert_eq!(result.is_ok(), succeeds);
            assert_eq!(fs::read_dir(&state).unwrap().count(), before);
        }
        let wrong_sha = "0".repeat(64);
        let mismatch =
            with_embedded_runtime_source(&state, b"frozen bytes", &wrong_sha, |_, _, _| {
                panic!("a mismatched source must not reach the runtime writer")
            })
            .unwrap_err();
        assert!(mismatch.contains("differs from approved source bytes"));
        assert_eq!(fs::read_dir(&state).unwrap().count(), before);
    }
}

#[cfg(test)]
#[path = "native_runtime_profile_route_tests.rs"]
mod profile_route_tests;
