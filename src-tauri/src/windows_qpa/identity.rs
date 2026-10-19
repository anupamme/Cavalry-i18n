/**
 * [INPUT]: 依赖 InstallLayout、QPA Policy 与 storage 的普通文件、PE、版本资源检查。
 * [OUTPUT]: 按编译profile提供Cavalry/Qt/x64身份与固定文件预检；native2.8绑定官方EXE摘要和Qt6.9.2。
 * [POS]: windows_qpa 的只读身份域；计划构建与执行共用同一套目标证明，绝不写入安装根。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::path::Path;

use crate::install::InstallLayout;

use super::{
    storage::{
        ensure_path_chain_has_no_reparse_points, product_version, snapshot_hash, validate_x64_pe,
        FileVersion,
    },
    Policy, QT_CORE_FILE_NAME, QWINDOWS_FILE_NAME,
};

pub(super) fn verify_target_files_with_generic(
    layout: &InstallLayout,
    proxy_source: &Path,
    generic_source: &Path,
    policy: &Policy,
    verify_versions: bool,
) -> Result<(), String> {
    ensure_path_chain_has_no_reparse_points(&layout.root)?;
    let proxy_parent = proxy_source
        .parent()
        .ok_or_else(|| "QPA proxy source has no parent.".to_string())?;
    ensure_path_chain_has_no_reparse_points(proxy_parent)?;
    validate_x64_pe(&layout.executable, "Cavalry.exe")?;
    let qt_core = layout.root.join(QT_CORE_FILE_NAME);
    validate_x64_pe(&qt_core, "Qt6Core.dll")?;
    validate_x64_pe(proxy_source, "QPA proxy source")?;
    validate_x64_pe(generic_source, "generic translation plugin")?;
    if snapshot_hash(
        &layout.root.join(QWINDOWS_FILE_NAME),
        "installed qwindows.dll",
    )?
    .is_some()
    {
        validate_x64_pe(
            &layout.root.join(QWINDOWS_FILE_NAME),
            "installed qwindows.dll",
        )?;
    }
    if verify_versions {
        verify_runtime_identity(layout, policy)?;
    }
    Ok(())
}

pub(super) fn verify_runtime_identity(
    layout: &InstallLayout,
    policy: &Policy,
) -> Result<(), String> {
    validate_x64_pe(&layout.executable, "Cavalry.exe")?;
    let qt_core = layout.root.join(QT_CORE_FILE_NAME);
    validate_x64_pe(&qt_core, "Qt6Core.dll")?;
    if cfg!(cavalry_native_windows)
        && snapshot_hash(&layout.executable, "native Cavalry executable")?.as_deref()
            != Some("bad89abf30c67b2d2fb3c9d0a26c3cfda9b738164e11bca050ac54ad0e2783a1")
    {
        return Err("Native Cavalry executable differs from the approved 2.8 binary".into());
    }
    let actual_cavalry = crate::windows_install::product_version_for_executable(&layout.executable)
        .or_else(|| {
            (cfg!(cavalry_native_windows)
                && snapshot_hash(&layout.executable, "native Cavalry executable")
                    .ok()
                    .flatten()
                    .as_deref()
                    == Some("bad89abf30c67b2d2fb3c9d0a26c3cfda9b738164e11bca050ac54ad0e2783a1"))
            .then(|| "2.8.0".into())
        })
        .unwrap_or_default();
    if actual_cavalry != policy.cavalry_version {
        return Err(format!(
            "Windows QPA requires Cavalry {}; the selected executable proves {}.",
            policy.cavalry_version,
            if actual_cavalry.is_empty() {
                "no supported release"
            } else {
                actual_cavalry.as_str()
            }
        ));
    }
    let expected = FileVersion {
        major: 6,
        minor: if cfg!(cavalry_native_windows) { 9 } else { 6 },
        patch: if cfg!(cavalry_native_windows) { 2 } else { 3 },
        build: 0,
    };
    let actual = product_version(&qt_core)?;
    if actual != expected || policy.qt_version != super::SUPPORTED_QT_VERSION {
        return Err(format!(
            "Windows QPA requires Qt {} (file version {expected}); found {actual}.",
            policy.qt_version
        ));
    }
    Ok(())
}
