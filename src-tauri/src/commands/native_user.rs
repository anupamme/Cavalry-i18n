/**
 * [INPUT]: 依赖 native_resources 的编译审批/宿主证明、fixed user paths 的耐久事务与 privilege 的同用户路径/all-Cavalry准入。
 * [OUTPUT]: 提供 2.8开发预览的用户语言状态及脱敏 nativeLocaleState（仅锁定原厂fallback确认的Absent投影en+unset，不看系统语言；Known=explicit；Unknown/null/错误typed/读取失败仍为unknown+unrecognized）、receipt强证明的English恢复能力、四阶段应用和原厂正常启动；无法验证兼容宿主时仅允许自有Current profile完成English restore-only，不尝试launch；独立launch前仍拒绝pending/drift/损坏回执及无回执资源残留。
 * [POS]: commands 的macOS native-first编排owner；资源完整性与profile所有权分开证明，纯profile→Status投影不覆盖安装来源事实，宿主探测只读，restore-only只修改自有用户状态，普通启动仍先验证宿主；进程guard仅快照，不承诺OS启动锁或任意外部writer隔离。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{
    contract::{
        ActionPayload, NativeLocaleState, OperationPhase, OperationPhaseGuard, OperationReporter,
        StatusPayload, STATE_DURABILITY_PENDING_WARNING_CODE,
    },
    native_resources::{self, NativeResources},
    user_language_files::{
        self, CommitOutcome, LocaleObservation, ReceiptObservation, RestoreOutcome,
        UserLanguagePaths,
    },
};
use sha2::{Digest, Sha256};
use std::{fs, path::Path};
const WRITER_REFUSAL: &str = "nativeWriterStillRunning";
const WRITER_INSPECTION: &str = "nativeWriterInspectionFailed";

struct ProfileStatus {
    current_lang: String,
    native_locale_state: NativeLocaleState,
    patch_status: String,
    reconciliation_required: bool,
    native_english_restore_available: bool,
}
fn unknown_profile() -> ProfileStatus {
    ProfileStatus {
        current_lang: "unknown".into(),
        native_locale_state: NativeLocaleState::Unrecognized,
        patch_status: "unknown".into(),
        reconciliation_required: true,
        native_english_restore_available: false,
    }
}
fn profile_projection(
    paths: &UserLanguagePaths,
    resources: Option<&NativeResources>,
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
    let (patch_status, reconciliation_required) = match observed.ownership {
        ReceiptObservation::None => match fs::symlink_metadata(paths.strings()) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => ("notApplicable", false),
            _ => ("unknown", true),
        },
        ReceiptObservation::Current {
            language,
            active_strings_sha256,
        } => {
            let digest = resources
                .and_then(|r| r.packs.get(&language))
                .map(|bytes| format!("{:x}", Sha256::digest(bytes)));
            (
                match digest {
                    Some(digest) if digest == active_strings_sha256 => "current",
                    Some(_) => "updateAvailable",
                    None => "unknown",
                },
                false,
            )
        }
        ReceiptObservation::Drifted { .. } | ReceiptObservation::Pending { .. } => {
            ("unknown", true)
        }
    };
    ProfileStatus {
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
    let resources = native_resources::load_resources(repo, resources_dir).ok();
    let profile = crate::privilege::current_user_home()
        .and_then(|home| UserLanguagePaths::for_user_dirs_read_only(&home, state_dir))
        .map(|paths| profile_projection(&paths, resources.as_ref()))
        .unwrap_or_else(|_| unknown_profile());
    project_profile_status(status, &profile, resources.is_some())
}

fn project_profile_status(
    mut status: StatusPayload,
    profile: &ProfileStatus,
    resources_available: bool,
) -> StatusPayload {
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
fn transaction_error(error: &str) -> ActionPayload {
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
fn apply_profile<R: OperationReporter>(
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
    let mut recovery_phase = OperationPhaseGuard::start(reporter, OperationPhase::EnsureBaseline);
    // 只检查有效回执/typed当前值；首次前像由实际文件事务在首个profile写入前耐久记录。
    if let Err(error) = user_language_files::read_profile_projection(paths) {
        return transaction_error(&error);
    }
    recovery_phase.completed();
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

fn apply_english_with_host_probe<R: OperationReporter>(
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
fn writer_guard() -> Result<(), String> {
    crate::privilege::guard_all_cavalry_not_running().map_err(|error| match error {
        crate::privilege::CavalryProcessGuardError::StillRunning { .. } => WRITER_REFUSAL.into(),
        crate::privilege::CavalryProcessGuardError::Inspection(_) => WRITER_INSPECTION.into(),
    })
}
#[cfg(target_os = "macos")]
fn restart_profile_admission(paths: &UserLanguagePaths) -> Result<(), String> {
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
#[cfg(target_os = "macos")]
pub(crate) fn apply_inner<R: OperationReporter>(
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
    let resources = match native_resources::load_resources(repo, resources_dir) {
        Ok(resources) => Some(resources),
        Err(_) => {
            return ActionPayload::error_with_code(
                "Native resource bundle is unavailable.",
                "nativeResourceUnavailable",
            )
        }
    };
    verify_phase.completed();
    apply_profile(
        &paths,
        language,
        resources
            .as_ref()
            .and_then(|r| r.packs.get(language))
            .map(Vec::as_slice),
        &mut writer_guard,
        &reporter,
    )
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
        native_resources::verify_host(app)?;
        writer_guard()?;
        // 原厂正常启动，无--test/自定义locale/environment；不经过2.7 wrapper/DYLD/state同步。
        crate::privilege::launch_cavalry_without_termination(app, runner)
    })
}

#[cfg(test)]
#[path = "tests/native_user_restore_only.rs"]
mod restore_only_tests;

#[cfg(test)]
#[path = "tests/native_user_official_independence.rs"]
mod official_independence_tests;

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::fs;
    fn profile(locale: Option<&str>) -> (tempfile::TempDir, UserLanguagePaths) {
        let mut preferences = json!({"unrelated":{"varType":"int","value":37}});
        if let Some(locale) = locale {
            preferences["locale"] = json!({"varType":"string","value":locale});
        }
        profile_with_preferences(preferences)
    }
    fn profile_with_preferences(
        preferences: serde_json::Value,
    ) -> (tempfile::TempDir, UserLanguagePaths) {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().canonicalize().unwrap();
        let home = root.join("home");
        let state = root.join("state");
        fs::create_dir_all(home.join("Library/Preferences/Cavalry")).unwrap();
        fs::create_dir(&state).unwrap();
        fs::write(
            home.join("Library/Preferences/Cavalry/preferences.json"),
            serde_json::to_vec(&preferences).unwrap(),
        )
        .unwrap();
        (
            temp,
            UserLanguagePaths::for_user_dirs(&home, &state).unwrap(),
        )
    }
    fn pack() -> Vec<u8> {
        serde_json::to_vec(&json!([{"type":"strings","language":"zh-Hans","value":{"fixture":{"UI-text":"中文"}}}])).unwrap()
    }
    #[test]
    fn native_status_uses_vendor_default_only_for_absent_locale() {
        let (_temp, paths) = profile(Some("private-unknown-locale"));
        let status = profile_projection(&paths, None);
        assert_eq!(status.current_lang, "unknown");
        assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
        assert!(!status.native_english_restore_available);

        let (_temp, paths) = profile(None);
        let status = profile_projection(&paths, None);
        assert_eq!(status.current_lang, "en");
        assert_eq!(status.native_locale_state, NativeLocaleState::Unset);
        assert_eq!(status.patch_status, "notApplicable");
        assert!(!status.reconciliation_required);
        assert!(!status.native_english_restore_available);
        assert!(!paths.receipt().exists());

        for preferences in [
            json!({"locale": null}),
            json!({"locale": {"varType": "int", "value": 7}}),
            json!({"locale": {"varType": "string", "value": "fr-FR"}}),
        ] {
            let (_temp, paths) = profile_with_preferences(preferences);
            let status = profile_projection(&paths, None);
            assert_eq!(status.current_lang, "unknown");
            assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
            assert!(!status.native_english_restore_available);
        }

        let (_temp, paths) = profile(Some("en-GB"));
        let status = profile_projection(&paths, None);
        assert_eq!(status.current_lang, "en");
        assert_eq!(status.native_locale_state, NativeLocaleState::Explicit);
        assert!(
            !status.native_english_restore_available,
            "an explicit original locale is not a Switcher-owned restore receipt"
        );

        let (_temp, paths) = profile(None);
        fs::write(paths.preferences(), b"{invalid-json").unwrap();
        let status = profile_projection(&paths, None);
        assert_eq!(status.current_lang, "unknown");
        assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
        assert_eq!(status.patch_status, "unknown");
        assert!(status.reconciliation_required);
        assert!(!status.native_english_restore_available);

        let (_temp, paths) = profile(None);
        fs::remove_file(paths.preferences()).unwrap();
        let status = profile_projection(&paths, None);
        assert_eq!(status.current_lang, "unknown");
        assert_eq!(status.native_locale_state, NativeLocaleState::Unrecognized);
        assert_eq!(status.patch_status, "unknown");
        assert!(status.reconciliation_required);
        assert!(!status.native_english_restore_available);
    }

    #[test]
    fn native_apply_publishes_resource_and_typed_locale_without_bundle_state() {
        let (_temp, paths) = profile(Some("en-GB"));
        let payload = apply_profile(
            &paths,
            "zh-Hans",
            Some(&pack()),
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        );
        assert!(payload.ok);
        assert_eq!(payload.current_lang.as_deref(), Some("zh-Hans"));
        let preferences: serde_json::Value =
            serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
        assert_eq!(preferences["locale"]["value"], "zh-Hans");
        assert_eq!(preferences["unrelated"]["value"], 37);
        assert!(paths.receipt().exists());
    }
    #[test]
    fn english_restore_does_not_require_native_payload() {
        let (_temp, paths) = profile(Some("ja"));
        let payload = apply_profile(
            &paths,
            "en",
            None,
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        );
        assert!(payload.ok);
        assert_eq!(profile_projection(&paths, None).current_lang, "en");
        assert!(!paths.strings().exists());
    }
    #[test]
    fn running_writer_and_missing_pack_are_distinct_admission_failures() {
        let (_temp, paths) = profile(Some("en-GB"));
        let payload = apply_profile(
            &paths,
            "zh-Hans",
            None,
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        );
        assert_eq!(
            payload.error_code.as_deref(),
            Some("nativeResourceUnavailable")
        );
        let payload = apply_profile(
            &paths,
            "zh-Hans",
            Some(&pack()),
            &mut || Err(WRITER_REFUSAL.into()),
            &super::super::contract::NoopReporter,
        );
        assert_eq!(payload.error_code.as_deref(), Some("cavalryStillRunning"));
        assert!(!paths.receipt().exists());
        assert!(!paths.strings().exists());
    }
    #[test]
    fn active_pack_version_and_drift_are_separate_status_facts() {
        let (_temp, paths) = profile(Some("en-GB"));
        assert!(
            apply_profile(
                &paths,
                "zh-Hans",
                Some(&pack()),
                &mut || Ok(()),
                &super::super::contract::NoopReporter
            )
            .ok
        );
        let resources = NativeResources {
            packs: [("zh-Hans".into(), pack())].into_iter().collect(),
        };
        assert_eq!(
            profile_projection(&paths, Some(&resources)).patch_status,
            "current"
        );
        let changed = NativeResources {
            packs: [("zh-Hans".into(), b"changed".to_vec())]
                .into_iter()
                .collect(),
        };
        assert_eq!(
            profile_projection(&paths, Some(&changed)).patch_status,
            "updateAvailable"
        );
        fs::write(paths.strings(), b"user modified").unwrap();
        let status = profile_projection(&paths, Some(&resources));
        assert_eq!(status.patch_status, "unknown");
        assert!(status.reconciliation_required);
        let result = apply_profile(
            &paths,
            "en",
            None,
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        );
        assert_eq!(
            result.error_code.as_deref(),
            Some("nativeUserLanguageConflict")
        );
        assert_eq!(fs::read(paths.strings()).unwrap(), b"user modified");
    }

    #[test]
    fn empty_receipt_cannot_report_restore_english_success() {
        let (_temp, paths) = profile(Some("en-GB"));
        assert!(
            apply_profile(
                &paths,
                "zh-Hans",
                Some(&pack()),
                &mut || Ok(()),
                &super::super::contract::NoopReporter,
            )
            .ok
        );

        let mut receipt: serde_json::Value =
            serde_json::from_slice(&fs::read(paths.receipt()).unwrap()).unwrap();
        receipt["active"] = serde_json::Value::Null;
        receipt["pending"] = serde_json::Value::Null;
        fs::write(paths.receipt(), serde_json::to_vec(&receipt).unwrap()).unwrap();
        let before_preferences = fs::read(paths.preferences()).unwrap();
        let before_strings = fs::read(paths.strings()).unwrap();
        let status = profile_projection(&paths, None);
        let payload = apply_profile(
            &paths,
            "en",
            None,
            &mut || Ok(()),
            &super::super::contract::NoopReporter,
        );

        assert_eq!(status.current_lang, "unknown");
        assert!(status.reconciliation_required);
        assert!(
            !payload.ok,
            "invalid empty ownership receipt is not English success"
        );
        assert_eq!(
            payload.error_code.as_deref(),
            Some("nativeUserLanguageConflict")
        );
        assert_eq!(fs::read(paths.preferences()).unwrap(), before_preferences);
        assert_eq!(fs::read(paths.strings()).unwrap(), before_strings);
    }

    #[test]
    fn restart_does_not_launch_while_profile_receipt_is_pending() {
        use crate::privilege::{CommandRunner, RecordingRunner};

        let (_temp, paths) = profile(Some("en-GB"));
        let pending = user_language_files::apply_with_interrupt(
            &paths,
            "zh-Hans",
            &pack(),
            Some(user_language_files::InterruptAfter::DirectoryIntent),
        );
        assert!(pending.is_err());

        let mut runner = RecordingRunner::default();
        let result = with_restart_profile_admission(&paths, || {
            runner.spawn_detached("open", &["-n".into(), "/Applications/Cavalry.app".into()])
        });

        assert!(
            result.is_err(),
            "pending receipt must block standalone restart"
        );
        assert!(
            runner.commands.is_empty(),
            "refusal must happen before launch"
        );
        assert!(
            paths.receipt().exists(),
            "restart must preserve pending evidence"
        );
        assert!(!paths.strings().exists(), "restart admission is read-only");
    }

    #[test]
    fn restart_refuses_drift_corruption_and_unowned_strings_residue() {
        use crate::privilege::{CommandRunner, RecordingRunner};

        let (_temp, paths) = profile(Some("en-GB"));
        assert!(
            apply_profile(
                &paths,
                "zh-Hans",
                Some(&pack()),
                &mut || Ok(()),
                &super::super::contract::NoopReporter,
            )
            .ok
        );
        let mut preferences: serde_json::Value =
            serde_json::from_slice(&fs::read(paths.preferences()).unwrap()).unwrap();
        preferences["locale"]["value"] = serde_json::Value::String("ja".into());
        fs::write(
            paths.preferences(),
            serde_json::to_vec(&preferences).unwrap(),
        )
        .unwrap();
        let mut runner = RecordingRunner::default();
        let result = with_restart_profile_admission(&paths, || {
            runner.spawn_detached("open", &["-n".into()])
        });
        assert!(result.is_err());
        assert!(runner.commands.is_empty());

        let (_temp, paths) = profile(Some("en-GB"));
        fs::create_dir_all(paths.receipt().parent().unwrap()).unwrap();
        fs::write(paths.receipt(), b"{").unwrap();
        let mut runner = RecordingRunner::default();
        let result = with_restart_profile_admission(&paths, || {
            runner.spawn_detached("open", &["-n".into()])
        });
        assert!(result.is_err());
        assert!(runner.commands.is_empty());

        let (_temp, paths) = profile(Some("en-GB"));
        fs::create_dir_all(paths.strings().parent().unwrap()).unwrap();
        fs::write(paths.strings(), b"unowned namespace residue").unwrap();
        let mut runner = RecordingRunner::default();
        let result = with_restart_profile_admission(&paths, || {
            runner.spawn_detached("open", &["-n".into()])
        });
        assert!(result.is_err());
        assert!(runner.commands.is_empty());
    }

    #[test]
    fn restart_allows_current_receipt_or_clean_unowned_profile() {
        use crate::privilege::{CommandRunner, RecordingRunner};

        let (_temp, paths) = profile(Some("en-GB"));
        assert!(
            apply_profile(
                &paths,
                "zh-Hans",
                Some(&pack()),
                &mut || Ok(()),
                &super::super::contract::NoopReporter,
            )
            .ok
        );
        let mut runner = RecordingRunner::default();
        with_restart_profile_admission(&paths, || runner.spawn_detached("open", &["-n".into()]))
            .unwrap();
        assert_eq!(runner.commands.len(), 1);

        let (_temp, paths) = profile(Some("en-GB"));
        let mut runner = RecordingRunner::default();
        with_restart_profile_admission(&paths, || runner.spawn_detached("open", &["-n".into()]))
            .unwrap();
        assert_eq!(runner.commands.len(), 1);
        assert!(!paths.receipt().exists());
        assert!(!paths.strings().exists());
    }
}
