/**
 * [INPUT]: 依赖共享2.8资源/profile事务、operation_lock及平台facade；Windows production使用native_windows，Mac使用native_runtime，九命令保持。
 * [OUTPUT]: 保持九条稳定 Tauri command；native runtime在同一九命令API内将只读状态/signature探测卸载到blocking worker，独立投影厂商Official来源、userProfile范围与脱敏 nativeLocaleState（unset/explicit/unrecognized），并提交自有strings/typed locale；receipt证明的English restore-only成功不尝试启动不兼容宿主，耐久warning不启动Cavalry；native runtime成功apply只复用同一operation guard并用writer guard后直接launch，独立Restart仍保留完整native准入；macOS Switch/Restore 直接进入安全事务，仅将真实 typed PermissionDenied 投影为 App Management handoff，保护写事务 commit 后只清理交接层而不反向飞回已失效动作；其余 apply 四阶段、真实 commit oracle、Windows residue、Updater、固定项目链接与 About 保持既有 owner。
 * [POS]: renderer API facade；Official仅是编译期native runtime的厂商来源展示，不代表版本支持、资源可用、profile状态、恢复能力或写入许可；具体状态、快照、写入和平台运行时下沉至领域模块。native runtime自动apply提交后走专用launch leaf，独立Restart继续承担启动时准入，不扩IPC。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
mod apply;
mod context;
mod contract;
#[cfg(target_os = "macos")]
mod native_official;
#[cfg(any(target_os = "macos", target_os = "windows"))]
mod native_resources;
#[cfg(target_os = "macos")]
mod native_runtime;
#[cfg(target_os = "macos")]
mod native_runtime_source;
#[cfg(target_os = "windows")]
mod native_windows;
#[cfg(target_os = "windows")]
pub(crate) use native_windows::{
    enabled as windows_native_enabled,
    restore_for_uninstall as restore_native_windows_for_uninstall,
};
#[cfg(any(target_os = "macos", target_os = "windows"))]
mod native_user;
#[cfg(all(test, target_os = "macos"))]
pub(crate) use native_runtime::apply_disposable_profile;
mod patch_receipt;
mod restart;
mod snapshot;
mod status;
#[cfg(test)]
#[path = "commands/tests.rs"]
mod tests;
mod update;
#[cfg(any(test, target_os = "macos", target_os = "windows"))]
mod user_language;
#[cfg(any(test, target_os = "macos", target_os = "windows"))]
mod user_language_files;

use chrono::{SecondsFormat, Utc};
use std::path::PathBuf;

use crate::{operation_lock, privilege};

pub use apply::apply_language_inner;
pub(crate) use context::RESTORE_OFFICIAL_ACTION;
pub use contract::{
    ActionPayload, BrowsePayload, BundleDiagnostics, LanguageChoice, NativeLocaleState,
    OperationEvent, PermissionHandoffEvent, PermissionHandoffPayload, PermissionHandoffRequest,
    PermissionSourceRect, PermissionViewportSize, StatusPayload,
};
#[cfg(target_os = "macos")]
pub(crate) use native_official::{
    verify_native_baseline_source, VerifiedNativeVendorSource,
    NATIVE_SOURCE_POLICY as NATIVE_BASELINE_SOURCE_POLICY_ID,
};
#[cfg(target_os = "macos")]
pub(crate) use native_resources::baseline_target_sha256 as native_baseline_target_sha256;
pub use restart::restart_cavalry_inner;
#[cfg(test)]
pub use snapshot::extract_english_inner;
#[cfg(target_os = "windows")]
pub(crate) use snapshot::refresh_english_inner;
pub(crate) use update::UpdaterState;
pub use update::{UpdateEvent, UpdatePayload, UpdatePhase};

pub fn registered_command_names() -> &'static [&'static str] {
    &contract::COMMAND_NAMES
}

fn finalize_permission_handoff(payload: ActionPayload) -> ActionPayload {
    #[cfg(target_os = "macos")]
    if !payload.ok {
        crate::macos_permission_handoff::finish_app_management_handoff(false);
    }
    payload
}

fn complete_permission_handoff_after_commit() {
    #[cfg(target_os = "macos")]
    crate::macos_permission_handoff::finish_app_management_handoff(false);
}

fn should_restart_after_apply(applied: &ActionPayload, native_runtime: bool) -> bool {
    applied.ok
        && !applied.native_restore_only
        && !(native_runtime && applied.reconciliation_required)
}

#[tauri::command]
pub async fn get_status(app: tauri::AppHandle) -> Result<StatusPayload, String> {
    status::get_status_for_app(&app).await
}

#[tauri::command]
pub fn browse_app(app: tauri::AppHandle) -> Result<BrowsePayload, String> {
    status::browse_for_app(&app)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn apply_language(
    app: tauri::AppHandle,
    app_path: String,
    lang: String,
    on_event: tauri::ipc::Channel<OperationEvent>,
) -> ActionPayload {
    let progress = contract::TauriOperationReporter::new(on_event);
    // 锁冲突与非法语言都属于 admission；在任何业务阶段开始前直接返回。
    if !context::is_supported_apply_action(&lang) {
        return finalize_permission_handoff(ActionPayload::error_with_code(
            "Unsupported language pack.",
            "unsupportedLanguage",
        ));
    }
    let paths = context::AppPaths::for_app(&app);
    let diagnostics_state_dir = paths.state_dir.clone();
    let diagnostics_action = lang.clone();
    crate::diagnostics::record(
        &diagnostics_state_dir,
        "languageActionStarted",
        serde_json::json!({
            "action": diagnostics_action,
            "permissionAdmission": "realTransaction",
        }),
    );
    let guard = match operation_lock::try_begin_bundle_operation(&paths.state_dir) {
        Ok(guard) => guard,
        Err(error) => {
            crate::diagnostics::record(
                &diagnostics_state_dir,
                "languageActionFinished",
                serde_json::json!({
                    "action": diagnostics_action,
                    "ok": false,
                    "error": crate::diagnostics::sanitize_message(&error, &diagnostics_state_dir),
                    "errorCode": "operationBusy",
                }),
            );
            return finalize_permission_handoff(ActionPayload::error(&error.to_string()));
        }
    };
    let app_path = PathBuf::from(app_path);
    let now = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
    let worker_progress = progress.clone();
    let result =
        match tauri::async_runtime::spawn_blocking(move || -> Result<ActionPayload, String> {
            let _guard = guard;
            let mut runner = privilege::RealCommandRunner;
            #[cfg(any(target_os = "macos", target_os = "windows"))]
            let native_runtime_enabled = native_resources::native_runtime_enabled();
            #[cfg(not(any(target_os = "macos", target_os = "windows")))]
            let native_runtime_enabled = false;
            let mut legacy_apply = || {
                apply::apply_language_inner_with_reporter(
                    &paths.repo_root,
                    &paths.state_dir,
                    &paths.resource_dir,
                    &app_path,
                    &lang,
                    &mut runner,
                    &now,
                    worker_progress.clone(),
                )
            };
            #[cfg(target_os = "macos")]
            let applied_result = if native_runtime_enabled {
                Ok(native_runtime::apply(
                    &_guard,
                    &paths.repo_root,
                    &paths.state_dir,
                    &paths.resource_dir,
                    &app_path,
                    &lang,
                    worker_progress.clone(),
                    &mut runner,
                ))
            } else {
                legacy_apply()
            };
            #[cfg(target_os = "windows")]
            let applied_result = if native_runtime_enabled {
                Ok(native_windows::apply(
                    &_guard,
                    &paths.repo_root,
                    &paths.state_dir,
                    &paths.resource_dir,
                    &app_path,
                    &lang,
                    &worker_progress,
                    &mut runner,
                ))
            } else {
                legacy_apply()
            };
            #[cfg(not(any(target_os = "macos", target_os = "windows")))]
            let applied_result = legacy_apply();
            let applied = match applied_result {
                Ok(payload) => payload.into_renderer_contract(),
                Err(error) => return Err(error),
            };
            if !should_restart_after_apply(&applied, native_runtime_enabled) {
                return Ok(applied);
            }
            // 受保护写事务已提交，权限 oracle 已成立；先回收 handoff，再继续普通重启阶段。
            complete_permission_handoff_after_commit();

            let mut restart_phase = contract::OperationPhaseGuard::start(
                &worker_progress,
                contract::OperationPhase::RestartCavalry,
            );
            let restart_result = {
                #[cfg(target_os = "macos")]
                {
                    if native_runtime_enabled {
                        native_user::launch_after_committed_apply(
                            &_guard,
                            &paths.state_dir,
                            &app_path,
                            &mut runner,
                        )
                    } else {
                        restart::restart_cavalry_inner(
                            &paths.repo_root,
                            &paths.state_dir,
                            &paths.resource_dir,
                            &app_path,
                            &mut runner,
                        )
                    }
                }
                #[cfg(not(target_os = "macos"))]
                {
                    restart::restart_cavalry_inner(
                        &paths.repo_root,
                        &paths.state_dir,
                        &paths.resource_dir,
                        &app_path,
                        &mut runner,
                    )
                }
            };
            match restart_result {
                Ok(()) => {
                    restart_phase.completed();
                    Ok(applied)
                }
                Err(_) => {
                    // apply 已经提交；重启失败只能是可恢复 warning，不能回写为 apply error。
                    restart_phase.warning();
                    Ok(applied.with_warning_code(contract::RESTART_FAILED_WARNING_CODE))
                }
            }
        })
        .await
        {
            Ok(Ok(payload)) => payload,
            #[cfg(not(target_os = "macos"))]
            Ok(Err(error)) if status::is_app_management_error(&error) => {
                ActionPayload::permission_error(&error)
            }
            Ok(Err(error)) => ActionPayload::error(&error),
            Err(error) => ActionPayload::error(&format!("Language apply task failed: {error}")),
        };
    crate::diagnostics::record(
        &diagnostics_state_dir,
        "languageActionFinished",
        serde_json::json!({
            "action": diagnostics_action,
            "ok": result.ok,
            "permissionRequired": result.permission_required,
            "permissionDecision": if result.permission_required {
                "typedWriteDenied"
            } else if result.ok {
                "transactionCommitted"
            } else {
                "notPermissionRelated"
            },
            "errorCode": result.error_code,
            "error": result
                .error
                .as_deref()
                .map(|error| crate::diagnostics::sanitize_message(error, &diagnostics_state_dir)),
        }),
    );
    finalize_permission_handoff(result)
}

#[tauri::command]
pub async fn check_update(app: tauri::AppHandle) -> UpdatePayload {
    update::check_update_inner(app).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn install_update(
    app: tauri::AppHandle,
    on_event: tauri::ipc::Channel<UpdateEvent>,
) -> UpdatePayload {
    update::install_update_inner(app, update::TauriUpdateProgressReporter::new(on_event)).await
}

#[tauri::command]
pub fn open_privacy_security(
    app: tauri::AppHandle,
    request: PermissionHandoffRequest,
    on_event: tauri::ipc::Channel<PermissionHandoffEvent>,
) -> PermissionHandoffPayload {
    let state_dir = context::state_dir_for_app(&app);
    crate::diagnostics::record(
        &state_dir,
        "permissionSettingsRequested",
        serde_json::json!({ "permission": "appManagement" }),
    );
    if !request.is_valid() {
        crate::diagnostics::record(
            &state_dir,
            "permissionSettingsFinished",
            serde_json::json!({ "ok": false, "errorCode": "invalidPermissionHandoffRequest" }),
        );
        return PermissionHandoffPayload::error("invalidPermissionHandoffRequest");
    }
    #[cfg(target_os = "macos")]
    if crate::macos_permission_handoff::start_app_management_handoff(
        &app,
        request.source_rect,
        request.return_rect,
        request.viewport_css,
        on_event,
    )
    .is_err()
    {
        crate::diagnostics::record(
            &state_dir,
            "permissionSettingsFinished",
            serde_json::json!({ "ok": false, "errorCode": "permissionHandoffStartFailed" }),
        );
        return PermissionHandoffPayload::error("permissionHandoffStartFailed");
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (app, on_event);
    let mut runner = privilege::RealCommandRunner;
    if privilege::open_privacy_security(&mut runner).is_err() {
        #[cfg(target_os = "macos")]
        crate::macos_permission_handoff::finish_app_management_handoff(false);
        crate::diagnostics::record(
            &state_dir,
            "permissionSettingsFinished",
            serde_json::json!({ "ok": false, "errorCode": "permissionSettingsOpenFailed" }),
        );
        return PermissionHandoffPayload::error("permissionSettingsOpenFailed");
    }
    crate::diagnostics::record(
        &state_dir,
        "permissionSettingsFinished",
        serde_json::json!({ "ok": true }),
    );
    PermissionHandoffPayload::opened()
}

#[tauri::command(rename_all = "camelCase")]
pub fn open_project_link(link: String) -> ActionPayload {
    let Some(link) = privilege::ProjectLink::from_id(&link) else {
        return ActionPayload::error("Unsupported project link.");
    };
    let mut runner = privilege::RealCommandRunner;
    match privilege::open_project_link(link, &mut runner) {
        Ok(()) => ActionPayload::ok(),
        Err(error) => ActionPayload::error(&error),
    }
}

#[tauri::command]
pub async fn show_about(app: tauri::AppHandle) -> ActionPayload {
    match crate::about_window::show_about_window(&app) {
        Ok(()) => ActionPayload::ok(),
        Err(_) => {
            ActionPayload::error_with_code("About window could not be opened.", "aboutOpenFailed")
        }
    }
}

#[tauri::command(rename_all = "camelCase")]
pub async fn restart_cavalry(app: tauri::AppHandle, app_path: String) -> ActionPayload {
    let paths = context::AppPaths::for_app(&app);
    let app_path = PathBuf::from(app_path);
    let guard = match operation_lock::try_begin_bundle_operation(&paths.state_dir) {
        Ok(guard) => guard,
        Err(error) => return ActionPayload::error(&error),
    };
    match tauri::async_runtime::spawn_blocking(move || {
        let _guard = guard;
        let mut runner = privilege::RealCommandRunner;
        restart::restart_cavalry_inner(
            &paths.repo_root,
            &paths.state_dir,
            &paths.resource_dir,
            &app_path,
            &mut runner,
        )
    })
    .await
    {
        Ok(Ok(())) => ActionPayload::ok(),
        Ok(Err(error)) => ActionPayload::error(&error),
        Err(error) => ActionPayload::error(&format!("Cavalry restart task failed: {error}")),
    }
}

#[cfg(target_os = "macos")]
#[cfg(test)]
pub(crate) use crate::mac_runtime::injector_source_candidates;
#[cfg(all(test, target_os = "macos"))]
pub(crate) use crate::operation_lock::acquire_bundle_file_lock;
#[cfg(test)]
pub(crate) use crate::operation_lock::{try_begin_bundle_operation, BUSY_ERROR};
#[cfg(all(test, target_os = "windows"))]
pub(crate) use apply::build_windows_language_pairs;
#[cfg(test)]
pub(crate) use apply::marker_guarded_transaction_pairs;
#[cfg(test)]
pub(crate) use context::resource_candidates;
#[cfg(test)]
pub(crate) use contract::COMMAND_NAMES;
#[cfg(test)]
pub(crate) use restart::restart_cavalry_guarded;
#[cfg(all(test, target_os = "windows"))]
pub(crate) use restart::restart_cavalry_inner_with_qpa_inspector;
#[cfg(all(test, target_os = "windows"))]
pub(crate) use status::is_app_management_error;
#[cfg(test)]
pub(crate) use status::{status_for_paths, sync_state_with_bundle};
