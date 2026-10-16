/**
 * [INPUT]: 依赖 detect/state/status 同步、snapshot English 真相投影、platform_runtime.restart、native_user独立Restart准入、共享operation_lock与CommandRunner。
 * [OUTPUT]: 提供restart_cavalry_inner与内部legacy owner；独立native runtime Restart先只读检查profile，再复核stock/managed宿主与NRT终态后启动，不同步2.7状态；native apply自动启动不调用本模块，legacy apply与Restart仍同步revision并按已证明现实投影stale marker。
 * [POS]: commands的重启编排层；独立Restart保留完整native准入，apply提交后由native_user专用leaf复用同一operation guard与writer admission；Windows QPA/plugin/诊断marker和平台启动落在各自owner。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::path::Path;

use crate::{detect, platform_runtime, privilege::CommandRunner};

use super::{
    snapshot::project_proven_english_state,
    status::{read_state_for_mutation, sync_state_with_bundle},
};

pub fn restart_cavalry_inner<R: CommandRunner>(
    repo_root: &Path,
    state_dir: &Path,
    resource_dir: &Path,
    app_path: &Path,
    runner: &mut R,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    if super::native_resources::native_runtime_enabled() {
        return super::native_user::restart(app_path, state_dir, runner);
    }
    restart_cavalry_legacy_inner(repo_root, state_dir, resource_dir, app_path, runner)
}

pub(super) fn restart_cavalry_legacy_inner<R: CommandRunner>(
    repo_root: &Path,
    state_dir: &Path,
    resource_dir: &Path,
    app_path: &Path,
    runner: &mut R,
) -> Result<(), String> {
    let app_path = detect::resolve_verified_install(app_path)
        .map_err(|error| error.to_string())?
        .root;
    let version = detect::read_bundle_version(&app_path).unwrap_or_default();
    let immutable_revision =
        detect::read_bundle_revision_for_write(&app_path).map_err(|error| error.to_string())?;
    let state = sync_state_with_bundle(
        state_dir,
        read_state_for_mutation(state_dir)?,
        &app_path,
        &version,
        &immutable_revision,
    )?;
    let state = project_proven_english_state(repo_root, resource_dir, &app_path, state);
    platform_runtime::restart(
        repo_root,
        state_dir,
        resource_dir,
        &app_path,
        &state,
        runner,
    )
}

#[cfg(all(test, target_os = "windows"))]
pub(crate) fn restart_cavalry_inner_with_qpa_inspector<R, F>(
    repo_root: &Path,
    state_dir: &Path,
    resource_dir: &Path,
    app_path: &Path,
    runner: &mut R,
    inspect_qpa: F,
) -> Result<(), String>
where
    R: CommandRunner,
    F: Fn(&crate::install::InstallLayout) -> Result<crate::windows_qpa::QpaInspection, String>,
{
    let app_path = detect::resolve_verified_install(app_path)
        .map_err(|error| error.to_string())?
        .root;
    let version = detect::read_bundle_version(&app_path).unwrap_or_default();
    let immutable_revision =
        detect::read_bundle_revision_for_write(&app_path).map_err(|error| error.to_string())?;
    let state = sync_state_with_bundle(
        state_dir,
        read_state_for_mutation(state_dir)?,
        &app_path,
        &version,
        &immutable_revision,
    )?;
    let state = project_proven_english_state(repo_root, resource_dir, &app_path, state);
    platform_runtime::restart_with_qpa_inspector(
        repo_root,
        state_dir,
        resource_dir,
        &app_path,
        &state,
        runner,
        inspect_qpa,
    )
}

#[cfg(test)]
pub(crate) fn restart_cavalry_guarded<R: CommandRunner>(
    repo_root: &Path,
    state_dir: &Path,
    resource_dir: &Path,
    app_path: &Path,
    runner: &mut R,
) -> super::contract::ActionPayload {
    if app_path.as_os_str().is_empty() {
        return super::contract::ActionPayload::error("Select a Cavalry installation first.");
    }
    let _guard = match crate::operation_lock::try_begin_bundle_operation(state_dir) {
        Ok(guard) => guard,
        Err(error) => return super::contract::ActionPayload::error(&error),
    };
    match restart_cavalry_inner(repo_root, state_dir, resource_dir, app_path, runner) {
        Ok(()) => super::contract::ActionPayload::ok(),
        Err(error) => super::contract::ActionPayload::error(&error),
    }
}
