/**
 * [INPUT]: 依赖共享2.8 profile/resource状态与平台只读发现；Windows native沿现有发现链，不依赖旧QPA ACTIVE；Mac来源验签独立。
 * [OUTPUT]: 提供卸载到blocking worker的启动期只读安装观察；显式macOS native runtime另独立投影厂商Official来源、typed profile/receipt语言、脱敏nativeLocaleState（Absent按已锁2.8原厂fallback为en+unset；Known为explicit；Unknown/错误输入为unknown+unrecognized）、资源可用性及强Current-owned postimage限定的nativeEnglishRestoreAvailable；厂商来源要求可显示bundle身份及固定OS验签，最终Official还须native_user证明内置语言且无Switcher覆盖；资源/兼容性/恢复许可独立，不由徽章授权，其余默认2.7路径不变；四态版本兼容、补丁状态、当前语言、安装选择及Windows残留提示仍各守自身证明边界。status不探测journal、英文快照、进程或写权限，事务证明和收敛留给用户触发的Switch/Restore。
 * [POS]: commands 的状态与安装选择owner；启动投影只读，Browse保留原保存语义，Windows Apply持锁复用同一持久化owner；人工烟测不启动GUI。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::path::{Path, PathBuf};

use crate::{
    detect,
    install::InstallLayout,
    state::{self, State},
};

#[cfg(target_os = "macos")]
use crate::privilege;

use super::{
    context::{language_choices_from_roots, language_root_candidates, AppPaths},
    contract::{BrowsePayload, StatusPayload},
};

#[cfg(all(test, target_os = "macos"))]
#[path = "tests/native_status_readonly_smoke.rs"]
mod native_status_readonly_smoke;

fn platform_name() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        return "windows";
    }
    #[cfg(target_os = "macos")]
    {
        return "macos";
    }
    #[allow(unreachable_code)]
    "unknown"
}

fn version_triplet(version: &str) -> Option<(u64, u64, u64)> {
    let core = version.split(['-', '+']).next()?;
    let mut parts = core.split('.');
    let triplet = (
        parts.next()?.parse().ok()?,
        parts.next()?.parse().ok()?,
        parts.next()?.parse().ok()?,
    );
    parts.next().is_none().then_some(triplet)
}

fn version_compatibility(version: &str) -> &'static str {
    compatibility_for_target(version, detect::SUPPORTED_CAVALRY_VERSION)
}
pub(crate) fn compatibility_for_target(version: &str, supported_version: &str) -> &'static str {
    if version == supported_version {
        return "supported";
    }
    match (version_triplet(version), version_triplet(supported_version)) {
        (Some(actual), Some(supported)) if actual < supported => "olderUnsupported",
        (Some(actual), Some(supported)) if actual > supported => "newerUnsupported",
        _ => "unknownUnsupported",
    }
}

pub(crate) fn sync_state_with_bundle(
    state_dir: &Path,
    state: State,
    app_path: &Path,
    version: &str,
    immutable_revision: &str,
) -> Result<State, String> {
    let next = project_state_with_bundle(
        state_dir,
        state.clone(),
        app_path,
        version,
        immutable_revision,
    );
    if next == state {
        Ok(state)
    } else {
        persist_selected_state(state_dir, &next)
    }
}

fn persist_selected_state(state_dir: &Path, next: &State) -> Result<State, String> {
    let outcome = state::write_state_outcome(state_dir, next)?;
    if let Some(warning) = outcome.warning() {
        return Err(format!(
            "Application state changed, but its directory durability could not be confirmed: {warning}. Retry before continuing."
        ));
    }
    Ok(outcome.into_state())
}

/// 用户动作持锁且验证宿主后保存选择；只读自动发现不制造控制状态。
#[cfg(target_os = "windows")]
pub(super) fn persist_native_selection(
    state_dir: &Path,
    app_path: &Path,
    version: &str,
) -> Result<State, String> {
    // 同一选择重试也须完成既有耐久写，不能把上次post-rename warning当作成功。
    read_state_for_mutation(state_dir)?;
    persist_selected_state(
        state_dir,
        &State {
            app_path: app_path.to_string_lossy().into_owned(),
            cavalry_version: version.into(),
            ..State::default()
        },
    )
}

/// Mutation callers must not silently continue after control-state recovery.  The typed state
/// layer has already promoted the last-known-good generation when this returns a diagnostic; we
/// surface that fact and require one retry so no bundle mutation shares a turn with state repair
/// or a post-rename durability warning.
pub(crate) fn read_state_for_mutation(state_dir: &Path) -> Result<State, String> {
    let report =
        state::read_state_for_control_report(state_dir).map_err(|error| error.to_string())?;
    if let Some(diagnostic) = report.recovery_diagnostic.as_deref() {
        let durability = report
            .recovery_warning()
            .map(|warning| format!(" Durability warning: {warning}"))
            .unwrap_or_default();
        return Err(format!(
            "Durable application state was recovered before this operation: {diagnostic}.{durability} Retry the operation after reviewing the recovered selection."
        ));
    }
    Ok(report.state)
}

pub(crate) fn project_state_with_bundle(
    state_dir: &Path,
    state: State,
    app_path: &Path,
    version: &str,
    immutable_revision: &str,
) -> State {
    if app_path.as_os_str().is_empty() {
        return state;
    }
    let app_path = InstallLayout::from_selection(app_path)
        .map(|layout| layout.root)
        .unwrap_or_else(|_| app_path.to_path_buf());
    let app_path_text = app_path.to_string_lossy().to_string();
    let same_app = state.app_path == app_path_text;
    let same_revision = same_app
        && !immutable_revision.is_empty()
        && !state.cavalry_revision.is_empty()
        && state.cavalry_revision == immutable_revision;
    let legacy_same_version = same_app
        && state.cavalry_revision.is_empty()
        && !version.is_empty()
        && state.cavalry_version == version;
    let default_lang = if same_revision || legacy_same_version {
        state.current_lang.as_str()
    } else {
        "en"
    };
    let preserve_unproven_snapshot_revision =
        state.english_snapshot_provenance.is_none() && state_dir.join("en").is_dir();
    let next = state::normalize(State {
        app_path: app_path_text,
        cavalry_version: version.to_string(),
        cavalry_revision: if immutable_revision.is_empty() || preserve_unproven_snapshot_revision {
            state.cavalry_revision.clone()
        } else {
            immutable_revision.to_string()
        },
        current_lang: detect::read_installed_language(&app_path, default_lang),
        last_patched_at: state.last_patched_at.clone(),
        applied_patch: if same_revision {
            state.applied_patch.clone()
        } else {
            None
        },
        english_snapshot_provenance: state.english_snapshot_provenance.clone(),
    });
    next
}

fn observed_state(
    state_dir: &Path,
    candidates: impl IntoIterator<Item = PathBuf>,
) -> Result<(PathBuf, State, String), String> {
    let existing_state = read_state_projection(state_dir);
    let discovered = detect::find_cavalry_app_from_candidates(&existing_state.app_path, candidates);
    let app_path = if discovered.as_os_str().is_empty() {
        discovered
    } else {
        detect::resolve_install(&discovered)
            .map_err(|error| format!("Selected Cavalry installation could not be read: {error}"))?
            .root
    };
    let version = if app_path.as_os_str().is_empty() {
        String::new()
    } else {
        detect::read_bundle_version(&app_path)
            .map_err(|error| format!("Could not read selected Cavalry display version: {error}"))?
    };
    let mut observed = existing_state;
    // marker 是启动期唯一可信且足够便宜的语言事实。缺失 marker 表示未观察到本工具
    // 的翻译，不应让旧 state 把厂商重装后的 English 继续投影成历史语言。
    observed.current_lang = detect::read_installed_language(&app_path, "en");
    Ok((app_path, observed, version))
}

fn read_state_projection(state_dir: &Path) -> State {
    match state::read_state_with_recovery(state_dir) {
        Ok(report) => report.document.state,
        // state 只是启动发现的提示，不是安装本身。损坏或缺失时回到默认发现，真实写入
        // 仍会在用户动作内用严格控制面读取拒绝不确定状态。
        Err(_) => State::default(),
    }
}

pub(super) fn marker_reconciliation_required(app_path: &Path, current_lang: &str) -> bool {
    if app_path.as_os_str().is_empty() || current_lang != "en" {
        return false;
    }
    let Ok(layout) = InstallLayout::from_selection(app_path) else {
        return false;
    };
    match std::fs::read_to_string(&layout.language_marker) {
        Ok(marker) => marker.trim() != "en",
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => false,
        // 无法读取 final marker 时不能把安装声明为干净 English。
        Err(_) => true,
    }
}

#[cfg(target_os = "windows")]
pub(super) fn windows_runtime_reconciliation_required(app_path: &Path, current_lang: &str) -> bool {
    windows_runtime_reconciliation_required_with_inspector(
        app_path,
        current_lang,
        crate::windows_qpa::inspect,
    )
}

#[cfg(target_os = "windows")]
fn windows_runtime_reconciliation_required_with_inspector<F>(
    app_path: &Path,
    current_lang: &str,
    inspect_qpa: F,
) -> bool
where
    F: FnOnce(&InstallLayout) -> Result<crate::windows_qpa::QpaInspection, String>,
{
    if app_path.as_os_str().is_empty() || current_lang != "en" {
        return false;
    }
    let Ok(layout) = InstallLayout::from_selection(app_path) else {
        return false;
    };
    let generic = layout
        .root
        .join(crate::windows_qpa::GENERIC_PLUGIN_RELATIVE_PATH);
    match std::fs::symlink_metadata(generic) {
        Ok(_) => return true,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        // 无法证明自有 generic 已清理时保留 Restore 入口；真实事务仍会做 hash/ACL
        // fail-closed 验证，状态投影本身不写安装目录。
        Err(_) => return true,
    }
    match inspect_qpa(&layout) {
        Ok(inspection) => {
            inspection.state == crate::windows_qpa::QpaDeploymentState::Active
                || (inspection.state == crate::windows_qpa::QpaDeploymentState::Recover
                    && inspection.phase.is_some())
        }
        // 只读检查失败不能等价于“已清理”；开放 Restore 让后端事务给出真实裁决。
        Err(_) => true,
    }
}

// ---------- 已应用版本不是语言 marker ----------
// 回执只投影成功应用的版本，不替代用户操作内的安装完整性/权限准入。
fn patch_status_for_paths(
    repo_root: &Path,
    state_dir: &Path,
    resource_dir: &Path,
    app_path: &Path,
    state: &State,
) -> &'static str {
    if app_path.as_os_str().is_empty() || state.current_lang == "en" {
        return "notApplicable";
    }
    let Some(receipt) = state.applied_patch.as_ref() else {
        return "unknown";
    };
    let Ok(revision) = detect::read_bundle_revision(app_path) else {
        return "unknown";
    };
    if super::patch_receipt::load_source(
        state_dir,
        receipt,
        app_path,
        &revision,
        &state.current_lang,
    )
    .is_err()
    {
        return "unknown";
    }
    match super::patch_receipt::desired_generation(
        repo_root,
        resource_dir,
        app_path,
        &state.current_lang,
    ) {
        Ok(generation) if generation == receipt.generation => "current",
        Ok(_) => "updateAvailable",
        Err(_) => "unknown",
    }
}

pub(crate) fn status_for_paths(
    repo_root: &Path,
    state_dir: &Path,
    resource_dir: &Path,
    candidates: Vec<PathBuf>,
) -> Result<StatusPayload, String> {
    let (app_path, state, version) = observed_state(state_dir, candidates.iter().cloned())?;
    let compatibility = version_compatibility(&version);
    let reconciliation_required = marker_reconciliation_required(&app_path, &state.current_lang);
    #[cfg(target_os = "windows")]
    let reconciliation_required = reconciliation_required
        || windows_runtime_reconciliation_required(&app_path, &state.current_lang);
    let mut status = status_shell(repo_root, resource_dir, candidates);
    status.app_path = app_path.to_string_lossy().to_string();
    status.current_lang = state.current_lang.clone();
    status.patch_status =
        patch_status_for_paths(repo_root, state_dir, resource_dir, &app_path, &state).into();
    status.reconciliation_required = reconciliation_required;
    status.version = version;
    status.version_compatibility = compatibility.into();
    Ok(status)
}

pub(super) fn status_shell(
    repo_root: &Path,
    resource_dir: &Path,
    candidates: Vec<PathBuf>,
) -> StatusPayload {
    StatusPayload {
        app_management_granted: None,
        app_path: String::new(),
        current_lang: "en".into(),
        language_scope: "installation".into(),
        native_resource_available: true,
        native_locale_state: None,
        native_english_restore_available: false,
        patch_status: "notApplicable".into(),
        installation_mode: "unknown".into(),
        macos_permission_handoff_required: false,
        official_recovery_available: false,
        default_app_candidates: candidates
            .into_iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect(),
        diagnostics: None,
        languages: language_choices_from_roots(&language_root_candidates(repo_root, resource_dir)),
        needs_extract: false,
        permission_action: "none".into(),
        platform: platform_name().into(),
        reconciliation_required: false,
        repo_root: repo_root.to_string_lossy().to_string(),
        supported_version: detect::SUPPORTED_CAVALRY_VERSION.into(),
        version: String::new(),
        version_compatibility: "unknownUnsupported".into(),
    }
}
#[cfg(any(target_os = "macos", target_os = "windows"))]
fn native_status_for_paths(
    paths: &AppPaths,
    candidates: Vec<PathBuf>,
) -> Result<StatusPayload, String> {
    let saved = read_state_projection(&paths.state_dir);
    let installation = (!saved.app_path.trim().is_empty())
        .then(|| PathBuf::from(saved.app_path))
        .into_iter()
        .chain(candidates.iter().cloned())
        .find_map(|path| super::native_resources::observe_install(&path).ok());
    let mut status = status_shell(&paths.repo_root, &paths.resource_dir, candidates);
    if let Some((app, version)) = installation {
        #[cfg(target_os = "macos")]
        {
            status.installation_mode = super::native_official::vendor_origin(&app).into();
        }
        #[cfg(target_os = "windows")]
        {
            status.installation_mode = super::native_windows::vendor_origin(&app).into();
        }
        status.app_path = app.to_string_lossy().to_string();
        status.version = version;
    }
    Ok(super::native_user::project_status(
        status,
        &paths.state_dir,
        &paths.repo_root,
        &paths.resource_dir,
    ))
}

pub(crate) async fn get_status_for_app(app: &tauri::AppHandle) -> Result<StatusPayload, String> {
    let paths = AppPaths::for_app(app);
    tauri::async_runtime::spawn_blocking(move || get_status_for_paths(paths))
        .await
        .map_err(|_| "Status projection worker could not be joined.".to_string())?
}

fn get_status_for_paths(paths: AppPaths) -> Result<StatusPayload, String> {
    let candidates = detect::default_app_candidates();
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    let native_runtime = super::native_resources::native_runtime_enabled();
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let native_runtime = false;
    let legacy_status = || {
        status_for_paths(
            &paths.repo_root,
            &paths.state_dir,
            &paths.resource_dir,
            candidates.clone(),
        )
    };
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    let result = if native_runtime {
        native_status_for_paths(&paths, candidates.clone())
    } else {
        legacy_status()
    };
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let result = {
        let _ = native_runtime;
        legacy_status()
    };
    record_status_diagnostics(&paths, &result);
    result
}

fn record_status_diagnostics(paths: &AppPaths, result: &Result<StatusPayload, String>) {
    let details = match result {
        Ok(payload) => {
            let final_reason = if payload.app_path.is_empty() {
                "installationMissing"
            } else if payload.version_compatibility != "supported" {
                payload.version_compatibility.as_str()
            } else {
                "installationObserved"
            };
            serde_json::json!({
                "ok": true,
                "finalReason": final_reason,
                "appFound": !payload.app_path.is_empty(),
                "version": payload.version,
                "versionCompatibility": payload.version_compatibility,
                "currentLanguage": payload.current_lang,
                "reconciliationRequired": payload.reconciliation_required,
                "proofBoundary": "deferredToLanguageAction",
            })
        }
        Err(error) => serde_json::json!({
            "ok": false,
            "finalReason": "statusProjectionError",
            "error": crate::diagnostics::sanitize_message(error, &paths.state_dir),
        }),
    };
    crate::diagnostics::record(&paths.state_dir, "statusProjectionFinished", details);
}

pub(crate) fn browse_for_app(app: &tauri::AppHandle) -> Result<BrowsePayload, String> {
    let Some(selection) = pick_cavalry_install() else {
        return Ok(canceled_browse());
    };
    let state_dir = super::context::state_dir_for_app(app);
    let _guard = crate::operation_lock::try_begin_bundle_operation(&state_dir)?;
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    if super::native_resources::native_runtime_enabled() {
        let (path, version) = super::native_resources::observe_install(&selection)?;
        read_state_for_mutation(&state_dir)?;
        persist_selected_state(
            &state_dir,
            &State {
                app_path: path.to_string_lossy().to_string(),
                cavalry_version: version.clone(),
                ..State::default()
            },
        )?;
        return Ok(BrowsePayload {
            canceled: false,
            app_path: path.to_string_lossy().to_string(),
            version,
        });
    }
    #[cfg(target_os = "macos")]
    if privilege::pending_macos_apply_install_root(&state_dir)?.is_some() {
        return Err(
            "A pending macOS language transaction must be recovered before changing the selected installation."
                .to_string(),
        );
    }
    let layout = detect::resolve_install(&selection).map_err(|error| error.to_string())?;
    let path = layout.root;
    let version = detect::read_bundle_version(&path).unwrap_or_default();
    if version_compatibility(&version) != "supported" {
        let previous = read_state_for_mutation(&state_dir)?;
        let next = State {
            app_path: path.to_string_lossy().to_string(),
            cavalry_version: version.clone(),
            cavalry_revision: String::new(),
            current_lang: detect::read_installed_language(&path, "en"),
            last_patched_at: previous.last_patched_at,
            applied_patch: None,
            english_snapshot_provenance: None,
        };
        persist_selected_state(&state_dir, &next)?;
        return Ok(BrowsePayload {
            canceled: false,
            app_path: path.to_string_lossy().to_string(),
            version,
        });
    }
    let immutable_revision =
        detect::read_bundle_revision_for_write(&path).map_err(|error| error.to_string())?;
    let previous = read_state_for_mutation(&state_dir)?;
    sync_state_with_bundle(&state_dir, previous, &path, &version, &immutable_revision)?;
    Ok(BrowsePayload {
        canceled: false,
        app_path: path.to_string_lossy().to_string(),
        version,
    })
}

fn canceled_browse() -> BrowsePayload {
    BrowsePayload {
        canceled: true,
        app_path: String::new(),
        version: String::new(),
    }
}

fn pick_cavalry_install() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        return rfd::FileDialog::new()
            .set_title("Select Cavalry.app")
            .set_directory("/Applications")
            .add_filter("Applications", &["app"])
            .pick_file();
    }
    #[cfg(target_os = "windows")]
    {
        let initial_directory = detect::default_app_candidates()
            .into_iter()
            .find(|candidate| candidate.exists())
            .unwrap_or_else(|| {
                std::env::var_os("ProgramW6432")
                    .map(PathBuf::from)
                    .unwrap_or_default()
            });
        return rfd::FileDialog::new()
            .set_title("Select Cavalry.exe")
            .set_directory(initial_directory)
            .add_filter("Cavalry executable", &["exe"])
            .pick_file();
    }
    #[allow(unreachable_code)]
    None
}

#[cfg(not(target_os = "macos"))]
pub(crate) fn is_app_management_error(error: &str) -> bool {
    let lower = error.to_ascii_lowercase();
    if lower.contains("outside windows known program files roots")
        || lower.contains("administrator retry is available only for installations under the os-known program files folders")
    {
        return false;
    }
    lower.contains("not authorized to send apple events")
        || lower.contains("app management")
        || lower.contains("administrator copy failed")
        || lower.contains("operation was canceled by the user")
        || lower.contains("operation was cancelled by the user")
        || lower.contains("error 1223")
        || ((lower.contains("operation not permitted") || lower.contains("privacy"))
            && (error.contains(".app") || error.contains("/Applications/")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_compatibility_preserves_user_direction() {
        assert_eq!(version_compatibility("2.7.2"), "supported");
        assert_eq!(version_compatibility("2.7.1"), "olderUnsupported");
        assert_eq!(version_compatibility("2.7.3"), "newerUnsupported");
        assert_eq!(version_compatibility("unknown"), "unknownUnsupported");
    }

    #[cfg(target_os = "windows")]
    fn qpa_inspection(
        state: crate::windows_qpa::QpaDeploymentState,
        phase: Option<crate::windows_qpa::QpaManifestPhase>,
    ) -> Result<crate::windows_qpa::QpaInspection, String> {
        Ok(crate::windows_qpa::QpaInspection {
            state,
            phase,
            current_qwindows_sha256: None,
            detail: "fixture".to_string(),
        })
    }

    #[test]
    fn unfinished_marker_keeps_restore_available_on_every_platform() {
        let temp = tempfile::tempdir().unwrap();
        let app = temp.path().join("Cavalry.app");
        let marker = InstallLayout::from_root(&app).language_marker;
        std::fs::create_dir_all(marker.parent().unwrap()).unwrap();

        assert!(!marker_reconciliation_required(&app, "en"));

        std::fs::write(&marker, b"en\n").unwrap();
        assert!(!marker_reconciliation_required(&app, "en"));

        for unfinished in ["pending\n", "unsupported\n", "\n"] {
            std::fs::write(&marker, unfinished).unwrap();
            assert!(marker_reconciliation_required(&app, "en"));
        }

        std::fs::write(&marker, b"zh-Hans\n").unwrap();
        assert!(!marker_reconciliation_required(&app, "zh-Hans"));
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn english_status_keeps_restore_available_for_managed_runtime_residue() {
        let temp = tempfile::tempdir().unwrap();
        let app = temp.path().join("Cavalry");
        let generic = app.join(crate::windows_qpa::GENERIC_PLUGIN_RELATIVE_PATH);
        std::fs::create_dir_all(generic.parent().unwrap()).unwrap();
        std::fs::write(&generic, b"managed generic fixture").unwrap();
        let before = std::fs::read(&generic).unwrap();

        assert!(windows_runtime_reconciliation_required_with_inspector(
            &app,
            "en",
            |_| panic!("generic residue is sufficient; QPA inspection must stay bounded"),
        ));
        assert_eq!(std::fs::read(&generic).unwrap(), before);

        std::fs::remove_file(&generic).unwrap();
        assert!(windows_runtime_reconciliation_required_with_inspector(
            &app,
            "en",
            |_| qpa_inspection(
                crate::windows_qpa::QpaDeploymentState::Recover,
                Some(crate::windows_qpa::QpaManifestPhase::Active),
            ),
        ));
        assert!(windows_runtime_reconciliation_required_with_inspector(
            &app,
            "en",
            |_| qpa_inspection(
                crate::windows_qpa::QpaDeploymentState::Active,
                Some(crate::windows_qpa::QpaManifestPhase::Active),
            ),
        ));
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn status_does_not_probe_runtime_when_language_already_exposes_restore() {
        let temp = tempfile::tempdir().unwrap();
        assert!(!windows_runtime_reconciliation_required_with_inspector(
            temp.path(),
            "zh-Hans",
            |_| panic!("translated marker already enables Restore"),
        ));
    }
}

#[cfg(test)]
mod patch_receipt_selection_tests {
    use super::*;

    #[test]
    fn selecting_a_different_installation_or_revision_drops_the_previous_receipt() {
        let temp = tempfile::tempdir().unwrap();
        let a = temp.path().join("A.app");
        let b = temp.path().join("B.app");
        for app in [&a, &b] {
            std::fs::create_dir_all(app.join("Contents/Resources")).unwrap();
        }
        // 与生产安装选择使用同一规范路径，Windows 不保留 fs::canonicalize 的 verbatim 前缀。
        let a = crate::install::canonical_root_for_selection(&a).unwrap();
        let b = crate::install::canonical_root_for_selection(&b).unwrap();
        let original = State {
            app_path: a.to_string_lossy().to_string(),
            cavalry_revision: "revision-a".into(),
            applied_patch: Some(state::AppliedPatchReceipt {
                install_root: a.to_string_lossy().to_string(),
                cavalry_revision: "revision-a".into(),
                language: "zh-Hans".into(),
                generation: "a".repeat(64),
            }),
            ..State::default()
        };
        let same =
            project_state_with_bundle(temp.path(), original.clone(), &a, "2.7.2", "revision-a");
        assert_eq!(same.applied_patch, original.applied_patch);
        let other =
            project_state_with_bundle(temp.path(), original.clone(), &b, "2.7.2", "revision-a");
        assert!(other.applied_patch.is_none());
        let replaced = project_state_with_bundle(temp.path(), original, &a, "2.7.2", "revision-b");
        assert!(replaced.applied_patch.is_none());
    }
}
