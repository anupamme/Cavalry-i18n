/**
 * [INPUT]: 依赖native编译manifest/digest、fixed profile事务和privilege准入。
 * [OUTPUT]: 提供typed用户语言状态、English恢复、stock/managed启动与apply提交后的直接launch。
 * [POS]: status用编译digest比对receipt，不读payload，也不授权apply。
 * apply只读目标pack。file transaction负责pending恢复与写前像比较。
 * leaf不发布空恢复阶段；caller只报告自身实际准入。
 * hostless English继续要求Current-owned证明；独立Restart保留profile/NRT/owner准入。
 * apply提交后只复核原guard归属与writer guard，再复用不终止进程的启动器。
 * Official由原厂来源与profile语言共同投影。
 * apply_profile只向commands父域暴露，不进入renderer IPC。
 * manual ignored smoke只调内部profile入口，不调用自动restart。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{
    contract::{
        ActionPayload, NativeLocaleState, OperationPhase, OperationPhaseGuard, OperationReporter,
        StatusPayload, STATE_DURABILITY_PENDING_WARNING_CODE,
    },
    native_resources::{self, NativeResourceDigests},
    user_language_files::{
        self, CommitOutcome, LocaleObservation, ReceiptObservation, RestoreOutcome,
        UserLanguagePaths,
    },
};
use std::{fs, path::Path};
const WRITER_REFUSAL: &str = "nativeWriterStillRunning";
const WRITER_INSPECTION: &str = "nativeWriterInspectionFailed";

struct ProfileStatus {
    official_language: bool,
    current_lang: String,
    native_locale_state: NativeLocaleState,
    patch_status: String,
    reconciliation_required: bool,
    native_english_restore_available: bool,
}
fn unknown_profile() -> ProfileStatus {
    ProfileStatus {
        official_language: false,
        current_lang: "unknown".into(),
        native_locale_state: NativeLocaleState::Unrecognized,
        patch_status: "unknown".into(),
        reconciliation_required: true,
        native_english_restore_available: false,
    }
}
fn profile_projection(
    paths: &UserLanguagePaths,
    resources: Option<&NativeResourceDigests>,
) -> ProfileStatus {
    let Ok(observed) = user_language_files::read_profile_projection(paths) else {
        return unknown_profile();
    };
    let native_english_restore_available = match (&observed.locale, &observed.ownership) {
        (
            LocaleObservation::Known {
                product_language, ..
            },
            ReceiptObservation::Current { language, .. },
        ) => language == product_language && language != "en",
        _ => false,
    };
    let (current_lang, native_locale_state) = match observed.locale {
        LocaleObservation::Known {
            product_language, ..
        } => (product_language.to_string(), NativeLocaleState::Explicit),
        // 仅严格识别的缺键应用锁定 2.8 activeLocale→kSourceLocale=en-GB fallback，不看系统语言。
        LocaleObservation::Absent => ("en".into(), NativeLocaleState::Unset),
        LocaleObservation::Unknown => ("unknown".into(), NativeLocaleState::Unrecognized),
    };
    let (patch_status, reconciliation_required, official_language) = match observed.ownership {
        ReceiptObservation::None => match fs::symlink_metadata(paths.strings()) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (
                "notApplicable",
                false,
                matches!(current_lang.as_str(), "en" | "ja_JP"),
            ),
            _ => ("unknown", true, false),
        },
        ReceiptObservation::Current {
            language,
            active_strings_sha256,
        } => {
            let digest = resources.and_then(|r| r.packs.get(&language));
            (
                match digest {
                    Some(digest) if digest == &active_strings_sha256 => "current",
                    Some(_) => "updateAvailable",
                    None => "unknown",
                },
                false,
                false,
            )
        }
        ReceiptObservation::Drifted { .. } | ReceiptObservation::Pending { .. } => {
            ("unknown", true, false)
        }
    };
    ProfileStatus {
        official_language,
        current_lang,
        native_locale_state,
        patch_status: patch_status.into(),
        reconciliation_required,
        native_english_restore_available,
    }
}
#[cfg(target_os = "macos")]
pub(crate) fn project_status(
    status: StatusPayload,
    state_dir: &Path,
    repo: &Path,
    resources_dir: &Path,
) -> StatusPayload {
    let resources = native_resources::load_status_resources(repo, resources_dir).ok();
    let profile = crate::privilege::current_user_home()
        .and_then(|home| UserLanguagePaths::for_user_dirs_read_only(&home, state_dir))
        .map(|paths| profile_projection(&paths, resources.as_ref()))
        .unwrap_or_else(|_| unknown_profile());
    let projected = project_profile_status(status, &profile, resources.is_some());
    let runtime_owned = crate::privilege::has_native_runtime_owner_for_selection(
        state_dir,
        Path::new(&projected.app_path),
    );
    project_runtime_recovery_hint(projected, runtime_owned)
}

fn project_runtime_recovery_hint(mut status: StatusPayload, runtime_owned: bool) -> StatusPayload {
    // profile先恢复而bundle未完成时保留Restore重试，不授予hostless写App许可。
    if status.current_lang == "en" && runtime_owned {
        status.reconciliation_required = true;
    }
    status
}

fn project_profile_status(
    mut status: StatusPayload,
    profile: &ProfileStatus,
    resources_available: bool,
) -> StatusPayload {
    // -- 来源认证不等于翻译官方：两份只读事实共同准入徽章 ------------
    if status.installation_mode == "official" && !profile.official_language {
        status.installation_mode = "unknown".into();
    }
    status.language_scope = "userProfile".into();
    status.native_resource_available = resources_available;
    status.current_lang = profile.current_lang.clone();
    status.native_locale_state = Some(profile.native_locale_state);
    status.patch_status = profile.patch_status.clone();
    status.reconciliation_required = profile.reconciliation_required;
    status.native_english_restore_available = profile.native_english_restore_available;
    status.supported_version = native_resources::NATIVE_VERSION.into();
    status.version_compatibility =
        super::status::compatibility_for_target(&status.version, native_resources::NATIVE_VERSION)
            .into();
    status
}
pub(super) fn transaction_error(error: &str) -> ActionPayload {
    let code = if error == WRITER_REFUSAL {
        "cavalryStillRunning"
    } else if error == WRITER_INSPECTION {
        "installationVerificationFailed"
    } else if user_language_files::is_permission_denied(error) {
        "nativeUserLanguagePermissionDenied"
    } else {
        "nativeUserLanguageConflict"
    };
    let mut payload = ActionPayload::error_with_code(
        "Native user-language operation could not be completed.",
        code,
    );
    payload.reconciliation_required =
        code == "nativeUserLanguageConflict" || code == "nativeUserLanguagePermissionDenied";
    payload
}
pub(super) fn apply_profile<R: OperationReporter>(
    paths: &UserLanguagePaths,
    language: &str,
    bytes: Option<&[u8]>,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
    reporter: &R,
) -> ActionPayload {
    apply_profile_with_restore_policy(paths, language, bytes, false, writer_guard, reporter)
}

fn apply_owned_english_profile<R: OperationReporter>(
    paths: &UserLanguagePaths,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
    reporter: &R,
) -> ActionPayload {
    apply_profile_with_restore_policy(paths, "en", None, true, writer_guard, reporter)
}

fn apply_profile_with_restore_policy<R: OperationReporter>(
    paths: &UserLanguagePaths,
    language: &str,
    bytes: Option<&[u8]>,
    require_current_owned: bool,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
    reporter: &R,
) -> ActionPayload {
    if !super::context::is_supported_language(language) {
        return ActionPayload::error_with_code(
            "Unsupported native language action.",
            "unsupportedLanguage",
        );
    }
    if language != "en" && bytes.is_none() {
        return ActionPayload::error_with_code(
            "Native resource bundle is unavailable.",
            "nativeResourceUnavailable",
        );
    }
    if let Err(error) = writer_guard() {
        return transaction_error(&error);
    }
    // canonical文件事务负责回执验证、pending恢复与写前像比较。
    let mut apply_phase = OperationPhaseGuard::start(reporter, OperationPhase::ApplyTransaction);
    let outcome = if language == "en" {
        let restore = if require_current_owned {
            user_language_files::restore_owned_english_with_writer_guard(paths, writer_guard)
        } else {
            user_language_files::restore_english_with_writer_guard(paths, writer_guard)
        };
        restore.map(|outcome| match outcome {
            RestoreOutcome::Restored | RestoreOutcome::NothingToRestore => CommitOutcome::Committed,
            RestoreOutcome::RestoredWithWarning(detail) => {
                CommitOutcome::CommittedWithWarning(detail)
            }
        })
    } else {
        user_language_files::apply_with_writer_guard(
            paths,
            language,
            bytes.expect("admitted pack"),
            writer_guard,
        )
    };
    match outcome {
        Ok(CommitOutcome::Committed) => {
            apply_phase.completed();
            let mut payload = ActionPayload::ok_lang(language, None);
            payload.native_restore_only = require_current_owned;
            payload
        }
        Ok(CommitOutcome::CommittedWithWarning(_)) => {
            apply_phase.warning();
            let mut payload = ActionPayload::ok_lang(language, None)
                .with_warning_code(STATE_DURABILITY_PENDING_WARNING_CODE);
            payload.reconciliation_required = true;
            payload
        }
        Ok(CommitOutcome::PendingWithWarning(_)) => {
            apply_phase.warning();
            let mut payload = transaction_error("native transaction remains pending");
            payload.warning_code = Some(STATE_DURABILITY_PENDING_WARNING_CODE.into());
            payload
        }
        Err(error) => transaction_error(&error),
    }
}

pub(super) fn apply_english_with_host_probe<R: OperationReporter>(
    paths: &UserLanguagePaths,
    host_probe: impl FnOnce() -> Result<(), String>,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
    reporter: &R,
    verify_phase: &mut OperationPhaseGuard<R>,
) -> ActionPayload {
    if let Err(error) = writer_guard() {
        return transaction_error(&error);
    }
    if host_probe().is_ok() {
        verify_phase.completed();
        return apply_profile(paths, "en", None, writer_guard, reporter);
    }
    let projection = match user_language_files::read_profile_projection(paths) {
        Ok(projection) => projection,
        Err(error) => return transaction_error(&error),
    };
    let owned_current = matches!(
        (&projection.locale, &projection.ownership),
        (
            LocaleObservation::Known {
                product_language, ..
            },
            ReceiptObservation::Current { language, .. }
        ) if language == product_language && language != "en"
    );
    if !owned_current {
        return transaction_error(
            "a current Switcher-owned user-language image is required for restore-only",
        );
    }
    verify_phase.completed();
    apply_owned_english_profile(paths, writer_guard, reporter)
}

#[cfg(target_os = "macos")]
pub(super) fn writer_guard() -> Result<(), String> {
    crate::privilege::guard_all_cavalry_not_running().map_err(|error| match error {
        crate::privilege::CavalryProcessGuardError::StillRunning { .. } => WRITER_REFUSAL.into(),
        crate::privilege::CavalryProcessGuardError::Inspection(_) => WRITER_INSPECTION.into(),
    })
}
#[cfg(target_os = "macos")]
pub(super) fn launch_after_committed_apply<R: crate::privilege::CommandRunner>(
    operation: &crate::operation_lock::BundleOperationGuard,
    state_dir: &Path,
    app: &Path,
    runner: &mut R,
) -> Result<(), String> {
    launch_after_committed_apply_with_guards(
        state_dir,
        app,
        runner,
        |selected_state_dir| operation.require_state_dir(selected_state_dir),
        writer_guard,
    )
}

#[cfg(target_os = "macos")]
fn launch_after_committed_apply_with_guards<R: crate::privilege::CommandRunner>(
    state_dir: &Path,
    app: &Path,
    runner: &mut R,
    require_guard: impl FnOnce(&Path) -> Result<(), String>,
    writer_guard: impl FnOnce() -> Result<(), String>,
) -> Result<(), String> {
    require_guard(state_dir)?;
    writer_guard()?;
    crate::privilege::launch_cavalry_without_termination(app, runner)
}

#[cfg(target_os = "macos")]
pub(super) fn restart_profile_admission(paths: &UserLanguagePaths) -> Result<(), String> {
    let projection = user_language_files::read_profile_projection(paths).map_err(|error| {
        format!("native user-language profile needs reconciliation before restart: {error}")
    })?;
    match projection.ownership {
        ReceiptObservation::Current { .. } => Ok(()),
        ReceiptObservation::None => match fs::symlink_metadata(paths.strings()) {
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Ok(_) => Err(
                "Switcher strings namespace exists without an ownership receipt; restart refused"
                    .into(),
            ),
            Err(error) => Err(format!(
                "native user-language namespace needs reconciliation before restart: {error}"
            )),
        },
        ReceiptObservation::Drifted { .. } | ReceiptObservation::Pending { .. } => {
            Err("native user-language transaction needs reconciliation before restart".into())
        }
    }
}

fn with_restart_profile_admission(
    paths: &UserLanguagePaths,
    after_admission: impl FnOnce() -> Result<(), String>,
) -> Result<(), String> {
    restart_profile_admission(paths)?;
    after_admission()
}
#[cfg(test)]
fn apply_profile_only_inner<R: OperationReporter>(
    repo: &Path,
    state_dir: &Path,
    resources_dir: &Path,
    app: &Path,
    language: &str,
    reporter: R,
) -> ActionPayload {
    let mut verify_phase =
        OperationPhaseGuard::start(&reporter, OperationPhase::VerifyInstallation);
    if language == super::context::RESTORE_OFFICIAL_ACTION {
        return ActionPayload::error_with_code(
            "Native restore uses the fixed English action.",
            "unsupportedLanguage",
        );
    }
    if language == "en" {
        let paths = match crate::privilege::current_user_home()
            .and_then(|home| UserLanguagePaths::for_user_dirs(&home, state_dir))
        {
            Ok(paths) => paths,
            Err(error) => return transaction_error(&error),
        };
        return apply_english_with_host_probe(
            &paths,
            || native_resources::verify_host(app),
            &mut writer_guard,
            &reporter,
            &mut verify_phase,
        );
    }
    if let Err(error) = native_resources::verify_host(app) {
        return ActionPayload::error_with_code(&error, "installationVerificationFailed");
    }
    if let Err(error) = writer_guard() {
        return transaction_error(&error);
    }
    let paths = match crate::privilege::current_user_home()
        .and_then(|home| UserLanguagePaths::for_user_dirs(&home, state_dir))
    {
        Ok(paths) => paths,
        Err(error) => return transaction_error(&error),
    };
    let pack = match native_resources::load_language_resource(repo, resources_dir, language) {
        Ok(pack) => pack,
        Err(_) => {
            return ActionPayload::error_with_code(
                "Native resource bundle is unavailable.",
                "nativeResourceUnavailable",
            )
        }
    };
    verify_phase.completed();
    apply_profile(&paths, language, Some(&pack), &mut writer_guard, &reporter)
}
#[cfg(target_os = "macos")]
pub(crate) fn restart<R: crate::privilege::CommandRunner>(
    app: &Path,
    state_dir: &Path,
    runner: &mut R,
) -> Result<(), String> {
    let paths = crate::privilege::current_user_home()
        .and_then(|home| UserLanguagePaths::for_user_dirs_read_only(&home, state_dir))?;
    with_restart_profile_admission(&paths, || {
        writer_guard()?;
        crate::privilege::recover_native_runtime_transaction(state_dir, app, runner)?;
        if crate::privilege::load_owned_native_runtime(state_dir, app, runner)?.is_none() {
            native_resources::verify_host(app)?;
        }
        // 正常bundle入口；managed由中性wrapper加载字体。无test/locale覆盖或2.7状态同步。
        crate::privilege::launch_cavalry_without_termination(app, runner)
    })
}

#[cfg(test)]
#[path = "tests/native_user_restore_only.rs"]
mod restore_only_tests;

#[cfg(test)]
#[path = "tests/native_user_official_independence.rs"]
mod official_independence_tests;

#[cfg(all(test, target_os = "macos"))]
#[path = "tests/native_user_profile_apply_smoke.rs"]
mod manual_profile_apply_smoke;

#[cfg(test)]
#[path = "tests/native_user_contracts.rs"]
mod tests;
