/**
 * [INPUT]: 依赖approved/staged source SHA、旧owner bytes与mode、typed baseline、中性计划、operation guard和签名端口。
 * [OUTPUT]: 提供stock首装、managed槽更新与原厂English恢复。
 * [POS]: macOS runtime窄writer。v3 owner以九槽NRT提交ExtensionLayer补丁。
 * 老八槽owner仍可恢复；新写入要求schema 2原厂Extension前像。
 * NRT同次提交wrapper、Info、injector与Extension；不写profile或locale。
 * Extension补丁只消费可信baseline字节与现有Keychain patcher。
 * NRT清quarantine后验三个nested对象与bundle后像。
 * live commit消费同事务proof并复核固定槽；独立恢复重新验源。
 * 原厂恢复暂存后只加载一次owner；baseline错配在App写前拒绝。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::Read,
    os::unix::fs::{OpenOptionsExt, PermissionsExt},
    path::Path,
};

use crate::{
    native_mac_runtime::build_native_mac_runtime_plan,
    native_mac_vendor_baseline::{
        VerifiedNativeVendorBaseline, LEGACY_EXTENSION_REINSTALL_MESSAGE,
    },
    operation_lock::BundleOperationGuard,
    patch::CopyPair,
    privilege::{
        self, CommandRunner, MacApplyTransaction, NativeRuntimeIntent, PostCommitWarning,
        PostCommitWarningCode,
    },
};

/// 只把真实begin事务PermissionDenied传给App Management。
#[derive(Debug)]
pub(crate) struct NativeRuntimeApplyError {
    pub(crate) message: String,
    pub(crate) permission_denied: bool,
}
impl From<String> for NativeRuntimeApplyError {
    fn from(message: String) -> Self {
        Self {
            message,
            permission_denied: false,
        }
    }
}
impl std::fmt::Display for NativeRuntimeApplyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.message.fmt(f)
    }
}
impl std::ops::Deref for NativeRuntimeApplyError {
    type Target = str;
    fn deref(&self) -> &str {
        &self.message
    }
}
impl NativeRuntimeApplyError {
    fn from_begin(error: privilege::MacApplyBeginError) -> Self {
        Self {
            permission_denied: error.is_permission_denied(),
            message: error.display(),
        }
    }
}

/// 消费调用方已持有的共享锁，不在内部另建锁或启动Cavalry。
pub(crate) fn install_stock_native_runtime<R: CommandRunner>(
    operation: &BundleOperationGuard,
    baseline: &VerifiedNativeVendorBaseline,
    app: &Path,
    staging: &Path,
    injector_source: &Path,
    expected_source_sha256: &str,
    runner: &mut R,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError> {
    operation.require_state_dir(baseline.state_dir())?;
    let source_sha256 = runtime_source_sha256(injector_source)?;
    if source_sha256 != expected_source_sha256 {
        return Err(String::from(
            "Staged runtime source SHA differs from approved embedded bytes.",
        )
        .into());
    }
    install_native_runtime_with(
        baseline,
        app,
        staging,
        injector_source,
        &source_sha256,
        None,
        runner,
        |b, p, _| b.verify_stock_preimage(p),
    )
}

fn install_stock_native_runtime_with<R, V>(
    baseline: &VerifiedNativeVendorBaseline,
    app: &Path,
    staging: &Path,
    injector_source: &Path,
    runner: &mut R,
    verify_preimage: V,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError>
where
    R: CommandRunner,
    V: FnMut(&VerifiedNativeVendorBaseline, &Path, &mut R) -> Result<(), String>,
{
    let source_sha256 = runtime_source_sha256(injector_source)?;
    install_native_runtime_with(
        baseline,
        app,
        staging,
        injector_source,
        &source_sha256,
        None,
        runner,
        verify_preimage,
    )
}

pub(crate) fn install_managed_native_runtime<R: CommandRunner>(
    operation: &BundleOperationGuard,
    baseline: &VerifiedNativeVendorBaseline,
    app: &Path,
    staging: &Path,
    injector_source: &Path,
    expected_source_sha256: &str,
    previous_owner_preimage: &privilege::NativeRuntimeOwnerPreimage,
    runner: &mut R,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError> {
    operation.require_state_dir(baseline.state_dir())?;
    let source_sha256 = runtime_source_sha256(injector_source)?;
    if source_sha256 != expected_source_sha256 {
        return Err(String::from(
            "Staged runtime source SHA differs from approved embedded bytes.",
        )
        .into());
    }
    install_managed_native_runtime_with(
        baseline,
        app,
        staging,
        injector_source,
        &source_sha256,
        previous_owner_preimage,
        runner,
        |_, _, _| Ok(()),
    )
}

fn install_managed_native_runtime_with<R, V>(
    baseline: &VerifiedNativeVendorBaseline,
    app: &Path,
    staging: &Path,
    injector_source: &Path,
    source_sha256: &str,
    previous_owner_preimage: &privilege::NativeRuntimeOwnerPreimage,
    runner: &mut R,
    verify_managed: V,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError>
where
    R: CommandRunner,
    V: FnMut(&VerifiedNativeVendorBaseline, &Path, &mut R) -> Result<(), String>,
{
    install_native_runtime_with(
        baseline,
        app,
        staging,
        injector_source,
        source_sha256,
        Some(previous_owner_preimage),
        runner,
        verify_managed,
    )
}

fn install_native_runtime_with<R, V>(
    baseline: &VerifiedNativeVendorBaseline,
    app: &Path,
    staging: &Path,
    injector_source: &Path,
    source_sha256: &str,
    previous_owner_preimage: Option<&privilege::NativeRuntimeOwnerPreimage>,
    runner: &mut R,
    mut verify_preimage: V,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError>
where
    R: CommandRunner,
    V: FnMut(&VerifiedNativeVendorBaseline, &Path, &mut R) -> Result<(), String>,
{
    if let Some(owner) = previous_owner_preimage {
        if !owner.includes_extension_slot(app)? {
            return Err(LEGACY_EXTENSION_REINSTALL_MESSAGE.to_string().into());
        }
    }
    let (extension_preimage, extension_mode) = baseline
        .read_extension_preimage()
        .map_err(NativeRuntimeApplyError::from)?;
    let owner_slot_preimages = if let Some(previous_owner) = previous_owner_preimage {
        Some(privilege::capture_owner_slot_preimages(
            app,
            previous_owner,
        )?)
    } else {
        privilege::ensure_native_runtime_owner_absent(baseline.state_dir())?;
        None
    };
    let (info, mode) = baseline.read_info_plist_preimage()?;
    let plan = build_native_mac_runtime_plan(
        app,
        staging,
        injector_source,
        &info,
        // baseline分开记录类型和权限；计划消费完整regular-file mode。
        mode | libc::S_IFREG as u32,
        baseline.state_dir(),
    )?;
    let owned_stage = plan
        .wrapper
        .src
        .parent()
        .expect("plan has a staging parent")
        .to_path_buf();
    let result = (|| {
        let extension_pair = stage_keychain_extension_patch(
            &owned_stage,
            &plan.injector.dst,
            extension_preimage,
            extension_mode,
        )?;
        let extension_target = extension_pair.dst.clone();
        let payload_pairs = [plan.injector.clone(), extension_pair.clone()];
        let launch_gate = [plan.wrapper, plan.info_plist];
        let mut signing_paths = vec![
            app.join("Contents/_CodeSignature/CodeResources"),
            app.join("Contents/MacOS/Cavalry"),
            plan.injector.dst.clone(),
            extension_pair.dst.clone(),
        ];
        signing_paths.extend(privilege::external_signature_component_paths(app));
        let mut destinations = signing_paths.clone();
        destinations.extend(launch_gate.iter().map(|pair| pair.dst.clone()));
        destinations.sort();
        destinations.dedup();
        // Stock只复核本次将改写的九槽；真实原厂来源由baseline捕获门证明。
        verify_preimage(baseline, app, runner)?;
        let preimages = match owner_slot_preimages {
            Some(preimages) => preimages,
            None => {
                privilege::ensure_native_runtime_owner_absent(baseline.state_dir())?;
                MacApplyTransaction::capture_preimages(app, &destinations)?
            }
        };
        let mut transaction =
        MacApplyTransaction::begin_native_runtime_only_with_deferred_pairs_and_removals_guarded(
            NativeRuntimeIntent::BoundManagedRuntime {
                baseline_id: baseline.baseline_id().into(),
                runtime_source_sha256: Some(source_sha256.into()),
                previous_owner_preimage: previous_owner_preimage.cloned(),
            },
            baseline.state_dir(),
            app,
            &[],
            &launch_gate,
            &payload_pairs,
            &[],
            &[],
            &[],
            &signing_paths,
            &preimages,
        )
        .map_err(NativeRuntimeApplyError::from_begin)?;
        let finish: Result<_, String> = (|| {
            transaction.begin_signing()?;
            let modified_code = [
                extension_target,
                app.join("Contents/MacOS/Cavalry"),
                plan.injector.dst.clone(),
            ];
            privilege::sign_native_runtime_nested_code(app, &modified_code, runner)?;
            privilege::sign_native_runtime_bundle(app, runner)?;
            privilege::clear_gatekeeper_quarantine(app, runner)?;
            let postimage_proof =
                transaction.verify_and_record_native_runtime_postimages(|pinned_app| {
                    privilege::verify_modified_nested_code(pinned_app, &modified_code, runner)?;
                    privilege::ensure_bundle_signature(pinned_app, runner)
                })?;
            transaction.authorize_deferred_commit()?;
            transaction.checkpoint_verified_bundle()?;
            transaction.checkpoint_native_runtime_commit()?;
            Ok(postimage_proof)
        })();
        let postimage_proof = match finish {
            Ok(proof) => proof,
            Err(error) => return Err(transaction.rollback_with_cause(error).into()),
        };
        transaction
            .commit_native_managed_verified(postimage_proof)
            .map(|completion| completion.warnings)
            .map_err(NativeRuntimeApplyError::from)
    })();
    cleanup_stage(&owned_stage, result)
}

fn runtime_source_sha256(path: &Path) -> Result<String, String> {
    let mut options = fs::OpenOptions::new();
    options.read(true).custom_flags(libc::O_NOFOLLOW);
    let mut file = options
        .open(path)
        .map_err(|error| format!("Could not securely open staged runtime source: {error}"))?;
    if !file
        .metadata()
        .map_err(|error| error.to_string())?
        .is_file()
    {
        return Err("Staged runtime source is not a regular file.".into());
    }
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let count = file.read(&mut buffer).map_err(|error| error.to_string())?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn stage_keychain_extension_patch(
    staging: &Path,
    injector_destination: &Path,
    vendor_preimage: Vec<u8>,
    vendor_mode: u32,
) -> Result<CopyPair, String> {
    if vendor_mode & !0o7777 != 0 {
        return Err("Verified ExtensionLayer permission mode is invalid.".into());
    }
    let (patched, report) =
        crate::keychain_patch::patch_keychain_query_attributes_owned(vendor_preimage)?;
    if report.patched_callsites == 0
        || report.already_patched_callsites != 0
        || report
            .details
            .iter()
            .any(|detail| detail.patched_callsites == 0 || detail.already_patched_callsites != 0)
    {
        return Err(
            "Verified ExtensionLayer preimage cannot derive one complete Keychain patch.".into(),
        );
    }
    let source = staging.join("libExtensionLayer.dylib");
    fs::write(&source, patched).map_err(|error| error.to_string())?;
    fs::set_permissions(&source, fs::Permissions::from_mode(vendor_mode & 0o7777))
        .map_err(|error| error.to_string())?;
    Ok(CopyPair {
        src: source,
        dst: injector_destination.with_file_name("libExtensionLayer.dylib"),
    })
}

fn cleanup_stage(
    stage: &Path,
    result: Result<Vec<PostCommitWarning>, NativeRuntimeApplyError>,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError> {
    match fs::remove_dir_all(stage) {
        Ok(()) => result,
        Err(error) => match result {
            Ok(mut warnings) => {
                warnings.push(PostCommitWarning::new(
                    PostCommitWarningCode::StagingCleanup,
                    [stage.to_path_buf()],
                    Some(error.to_string()),
                ));
                Ok(warnings)
            }
            Err(mut cause) => {
                cause.message = format!(
                    "{}; native runtime staging cleanup failed: {error}",
                    cause.message
                );
                Err(cause)
            }
        },
    }
}

/// 只消费此前验证的managed owner，不凭profile receipt恢复bundle。
pub(crate) fn restore_native_runtime_vendor<R: CommandRunner>(
    operation: &BundleOperationGuard,
    baseline: &VerifiedNativeVendorBaseline,
    app: &Path,
    staging: &Path,
    runner: &mut R,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError> {
    operation.require_state_dir(baseline.state_dir())?;
    restore_native_runtime_vendor_with(baseline, app, staging, runner, |b, p, r| {
        b.verify_restored_vendor(p, r)
    })
}

fn restore_native_runtime_vendor_with<R, V>(
    baseline: &VerifiedNativeVendorBaseline,
    app: &Path,
    staging: &Path,
    runner: &mut R,
    mut verify_vendor: V,
) -> Result<Vec<PostCommitWarning>, NativeRuntimeApplyError>
where
    R: CommandRunner,
    V: FnMut(&VerifiedNativeVendorBaseline, &Path, &mut R) -> Result<(), String>,
{
    use std::os::unix::fs::{DirBuilderExt, PermissionsExt};
    let plan = baseline.build_restore_plan(app)?;
    // 排他创建。失败时从不回收他人的已有目录。
    fs::DirBuilder::new()
        .mode(0o700)
        .create(staging)
        .map_err(|e| e.to_string())?;
    let result = (|| {
        let mut pairs = Vec::new();
        for (index, pair) in plan.pairs.iter().enumerate() {
            let source = staging.join(format!("{index}.vendor"));
            fs::copy(&pair.src, &source).map_err(|e| e.to_string())?;
            let mode = plan
                .modes
                .iter()
                .find(|m| m.destination == pair.dst)
                .expect("restore plan has mode")
                .unix_mode;
            fs::set_permissions(&source, fs::Permissions::from_mode(mode))
                .map_err(|e| e.to_string())?;
            pairs.push(crate::patch::CopyPair {
                src: source,
                dst: pair.dst.clone(),
            });
        }
        let mut destinations = pairs
            .iter()
            .map(|p| p.dst.clone())
            .chain(plan.removals.iter().cloned())
            .collect::<Vec<_>>();
        destinations.sort();
        destinations.dedup();
        let preimages = MacApplyTransaction::capture_preimages(app, &destinations)?;
        let owned = privilege::load_owned_native_runtime(baseline.state_dir(), app, runner)?
            .ok_or_else(|| "Native runtime owner disappeared before restore.".to_string())?;
        if owned.baseline_id() != baseline.baseline_id() {
            return Err("Native restore baseline differs from runtime owner."
                .to_string()
                .into());
        }
        let code_resources = app.join("Contents/_CodeSignature/CodeResources");
        let mut transaction = MacApplyTransaction::begin_native_runtime_only_with_deferred_pairs_and_removals_guarded(
            NativeRuntimeIntent::VendorBaselineRestore { baseline_id: baseline.baseline_id().into() },
            baseline.state_dir(), app, &[], &[], &pairs, &[], &plan.removals, &[], &[code_resources], &preimages,
        ).map_err(NativeRuntimeApplyError::from_begin)?;
        let finish: Result<_, String> = (|| {
            transaction.begin_signing()?;
            // 不重签原厂文件。实际原厂signature通过才记录CodeResources后像。
            let postimage_proof = transaction.verify_and_record_native_runtime_postimages(|p| {
                verify_vendor(baseline, p, runner)
            })?;
            transaction.authorize_deferred_commit()?;
            transaction.checkpoint_verified_bundle()?;
            transaction.checkpoint_native_runtime_commit()?;
            Ok(postimage_proof)
        })();
        let postimage_proof = match finish {
            Ok(proof) => proof,
            Err(error) => return Err(transaction.rollback_with_cause(error).into()),
        };
        transaction
            .commit_native_vendor_restore_verified(postimage_proof)
            .map(|completion| completion.warnings)
            .map_err(NativeRuntimeApplyError::from)
    })();
    cleanup_stage(staging, result)
}

#[cfg(test)]
#[path = "native_mac_runtime_apply_tests.rs"]
mod tests;
