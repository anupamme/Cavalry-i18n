/**
 * [INPUT]: 依赖schema 7 intent、精确bundle像、source SHA、旧owner像、baseline与CommandRunner。
 * [OUTPUT]: 提供live proof消费、NRT终态复验、owner发布、单份journal恢复与profile前像回调入口。
 * [POS]: apply_transaction的来源门。更新只接受精确旧owner或同事务新owner。
 * live commit复用同事务原厂/签名proof并复核固定槽。
 * NRT恢复不预读manifest；内核用同一份manifest验kind/schema/intent。
 * 仅有效App回滚phase执行profile回调；终态分支不执行。
 * Restored复核旧owner；第三态拒绝退役。schema 6 StateBound不经此终结器。
 * 终态核NRT固定槽和签名。不扫描未改写的原厂资源。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::{
    native_mac_vendor_baseline::load_baseline,
    privilege::{macos::bundle::ensure_bundle_signature, CommandRunner},
};

/// schema 7 记录操作意图。恢复时不得用当前调用动作推测中断事务来源。
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub(crate) enum NativeRuntimeIntent {
    ManagedRuntime,
    BoundManagedRuntime {
        #[serde(rename = "baselineId")]
        baseline_id: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        runtime_source_sha256: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        previous_owner_preimage: Option<super::native_runtime_owner::NativeRuntimeOwnerPreimage>,
    },
    VendorBaselineRestore {
        #[serde(rename = "baselineId")]
        baseline_id: String,
    },
}

impl NativeRuntimeIntent {
    pub(super) fn validate(&self) -> Result<(), String> {
        if let Self::VendorBaselineRestore { baseline_id }
        | Self::BoundManagedRuntime { baseline_id, .. } = self
        {
            let valid = baseline_id.len() == 64
                && baseline_id
                    .bytes()
                    .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte));
            if !valid {
                return Err(
                    "Native vendor restore baseline ID must be 64 lowercase hex characters.".into(),
                );
            }
        }
        if let Self::BoundManagedRuntime {
            runtime_source_sha256,
            previous_owner_preimage,
            ..
        } = self
        {
            if runtime_source_sha256
                .as_deref()
                .is_some_and(|hash| !is_sha256_hex(hash))
            {
                return Err("Native runtime source fingerprint must be lowercase SHA-256.".into());
            }
            if previous_owner_preimage.is_some() && runtime_source_sha256.is_none() {
                return Err("Managed runtime replacement requires a source fingerprint.".into());
            }
            if let Some(preimage) = previous_owner_preimage {
                super::native_runtime_owner::validate_owner_preimage_shape(preimage)?;
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum NativeRuntimeRecoveryOutcome {
    Committed,
    RolledBack,
}

impl MacApplyTransaction {
    /// 在两处退役边界复验调用方的固定runtime保全集合。
    /// 绑定intent在退役前发布固定槽归属；旧未绑定intent不授予启动许可。
    pub(crate) fn commit_native_managed_verified(
        self,
        proof: NativeRuntimePostimageProof,
    ) -> Result<CopyCompletion, String> {
        if self.manifest.kind != JournalKind::NativeRuntimeOnly
            || !matches!(
                self.manifest.native_runtime_intent,
                Some(
                    NativeRuntimeIntent::ManagedRuntime
                        | NativeRuntimeIntent::BoundManagedRuntime { .. }
                )
            )
        {
            return Err("Managed runtime postcondition requires its native intent.".into());
        }
        self.commit_native_runtime_with_postimage_proof(proof)
    }

    /// 消费同一事务的live vendor proof；独立恢复必须重新验源。
    pub(crate) fn commit_native_vendor_restore_verified(
        self,
        proof: NativeRuntimePostimageProof,
    ) -> Result<CopyCompletion, String> {
        if self.manifest.kind != JournalKind::NativeRuntimeOnly
            || !matches!(
                self.manifest.native_runtime_intent,
                Some(NativeRuntimeIntent::VendorBaselineRestore { .. })
            )
        {
            return Err("Vendor restore postimage proof requires its native intent.".into());
        }
        self.commit_native_runtime_with_postimage_proof(proof)
    }

    /// 只有持久化的 VendorBaselineRestore intent 能走此 live commit 门。
    pub(crate) fn commit_native_vendor_restore<R: CommandRunner>(
        self,
        runner: &mut R,
    ) -> Result<CopyCompletion, String> {
        self.commit_native_vendor_restore_with(|manifest, state_dir| {
            verify_vendor_baseline_restore(manifest, state_dir, runner)
        })
    }

    fn commit_native_vendor_restore_with<F>(self, verifier: F) -> Result<CopyCompletion, String>
    where
        F: FnMut(&JournalManifest, &Path) -> Result<(), String>,
    {
        if self.manifest.kind != JournalKind::NativeRuntimeOnly {
            return Err(
                "Native vendor restore commit requires a NativeRuntimeOnly journal.".into(),
            );
        }
        let intent = self
            .manifest
            .native_runtime_intent
            .as_ref()
            .ok_or_else(|| "Native vendor restore commit has no persisted intent.".to_string())?;
        intent.validate()?;
        if !matches!(intent, NativeRuntimeIntent::VendorBaselineRestore { .. }) {
            return Err("Managed runtime cannot use the vendor restore commit.".into());
        }
        self.commit_with_native_verifier(verifier)
    }
}

pub(crate) fn recover_native_runtime_guarded_with_before_restore<R, F>(
    state_dir: &Path,
    app: &Path,
    runner: &mut R,
    mut before_restore: F,
) -> Result<NativeRuntimeRecoveryOutcome, String>
where
    R: CommandRunner,
    F: FnMut() -> Result<(), String>,
{
    recover_native_runtime_pending_guarded(state_dir, app, &mut before_restore)?;
    finalize_native_runtime_recovered(state_dir, app, runner)
}

/// 终结调用方已执行 guarded recovery 的 NRT journal。
/// Restored 只证明本事务回到前像；它不证明 vendor restore 成功。
pub(crate) fn finalize_native_runtime_recovered<R: CommandRunner>(
    state_dir: &Path,
    app_path: &Path,
    runner: &mut R,
) -> Result<NativeRuntimeRecoveryOutcome, String> {
    finalize_native_runtime_recovered_with(state_dir, app_path, |manifest, state_dir| {
        if manifest.phase == JournalPhase::Restored {
            let app = Path::new(&manifest.install_root);
            return match manifest.native_runtime_intent.as_ref() {
                Some(NativeRuntimeIntent::BoundManagedRuntime {
                    baseline_id,
                    runtime_source_sha256,
                    previous_owner_preimage,
                }) => {
                    let baseline = load_baseline(app, state_dir, baseline_id)?;
                    if let Some(previous_owner_preimage) = previous_owner_preimage {
                        super::native_runtime_owner::verify_managed_update_rollback(
                            manifest,
                            previous_owner_preimage,
                            &baseline,
                            state_dir,
                            runner,
                        )
                    } else if runtime_source_sha256.is_some() {
                        super::native_runtime_owner::verify_stock_install_rollback(state_dir)?;
                        baseline.verify_restored_vendor(app, runner)
                    } else {
                        baseline.verify_restored_vendor(app, runner)
                    }
                }
                Some(NativeRuntimeIntent::VendorBaselineRestore { .. }) => {
                    super::native_runtime_owner::verify_managed_rollback(
                        manifest, state_dir, runner,
                    )
                }
                _ => ensure_bundle_signature(app, runner),
            };
        }
        match manifest.native_runtime_intent.as_ref() {
            Some(NativeRuntimeIntent::ManagedRuntime) => {
                ensure_bundle_signature(Path::new(&manifest.install_root), runner)
            }
            Some(NativeRuntimeIntent::BoundManagedRuntime { baseline_id, .. }) => {
                let app = Path::new(&manifest.install_root);
                ensure_bundle_signature(app, runner)?;
                load_baseline(app, state_dir, baseline_id)?;
                Ok(())
            }
            Some(NativeRuntimeIntent::VendorBaselineRestore { .. }) => {
                verify_vendor_baseline_restore(manifest, state_dir, runner)
            }
            None => Err("Native runtime journal has no persisted source intent.".into()),
        }
    })
}

fn verify_vendor_baseline_restore<R: CommandRunner>(
    manifest: &JournalManifest,
    state_dir: &Path,
    runner: &mut R,
) -> Result<(), String> {
    let Some(NativeRuntimeIntent::VendorBaselineRestore { baseline_id }) =
        manifest.native_runtime_intent.as_ref()
    else {
        return Err("Native vendor restore intent is missing.".into());
    };
    NativeRuntimeIntent::VendorBaselineRestore {
        baseline_id: baseline_id.clone(),
    }
    .validate()?;
    let app_path = Path::new(&manifest.install_root);
    let baseline = load_baseline(app_path, state_dir, baseline_id)?;
    baseline.verify_restored_vendor(app_path, runner)
}

fn finalize_native_runtime_recovered_with<F>(
    state_dir: &Path,
    app_path: &Path,
    mut verify_terminal_source: F,
) -> Result<NativeRuntimeRecoveryOutcome, String>
where
    F: FnMut(&JournalManifest, &Path) -> Result<(), String>,
{
    let root = journal_root(state_dir);
    let journal_dir = SecureDirectory::open(&root)?;
    let (manifest_bytes, manifest) = read_manifest_snapshot(&journal_dir)?;
    let bundle_root = validate_manifest(&journal_dir, &manifest, state_dir, app_path)?;
    require_native_terminal_manifest(&manifest)?;
    let state_root = SecureDirectory::open(state_dir)?;
    let outcome = match manifest.phase {
        JournalPhase::Restored => {
            verify_all_preimages(
                &manifest,
                TransactionRoots {
                    bundle: &bundle_root,
                    state: &state_root,
                },
            )?;
            verify_terminal_source(&manifest, state_dir)?;
            NativeRuntimeRecoveryOutcome::RolledBack
        }
        JournalPhase::RuntimeCommitted | JournalPhase::Committed => {
            verify_committed_postimages(
                &manifest,
                TransactionRoots {
                    bundle: &bundle_root,
                    state: &state_root,
                },
            )?;
            verify_terminal_source(&manifest, state_dir)?;
            NativeRuntimeRecoveryOutcome::Committed
        }
        _ => {
            return Err("Native runtime journal is not in a terminal recovery phase.".into());
        }
    };

    // 来源验完后重读canonical journal。
    // 只退役验证器检查过的耐久manifest与文件generation。
    let state_root = SecureDirectory::open(state_dir)?;
    let current_journal = SecureDirectory::open(&root)?;
    let (current_bytes, current_manifest) = read_manifest_snapshot(&current_journal)?;
    if current_bytes != manifest_bytes {
        return Err(
            "Native runtime journal changed during terminal source verification; backups were retained."
                .into(),
        );
    }
    let current_bundle =
        validate_manifest(&current_journal, &current_manifest, state_dir, app_path)?;
    require_native_terminal_manifest(&current_manifest)?;
    let roots = TransactionRoots {
        bundle: &current_bundle,
        state: &state_root,
    };
    match outcome {
        NativeRuntimeRecoveryOutcome::RolledBack => verify_all_preimages(&current_manifest, roots)?,
        NativeRuntimeRecoveryOutcome::Committed => {
            verify_committed_postimages(&current_manifest, roots)?
        }
    }
    if outcome == NativeRuntimeRecoveryOutcome::Committed {
        super::native_runtime_owner::publish_terminal_owner(
            &current_manifest,
            &state_root,
            &current_bundle,
        )?;
    }
    retire_and_cleanup_journal(&state_root, &current_manifest.operation_id, &root)
        .map_err(|(_, error)| error)?;
    Ok(outcome)
}

pub(super) fn require_native_terminal_manifest(manifest: &JournalManifest) -> Result<(), String> {
    if manifest.kind != JournalKind::NativeRuntimeOnly {
        return Err("Native terminal finalizer requires a NativeRuntimeOnly journal.".into());
    }
    if manifest.schema_version != NATIVE_RUNTIME_MANIFEST_SCHEMA {
        return Err("Native terminal finalizer requires schema 7.".into());
    }
    let intent = manifest
        .native_runtime_intent
        .as_ref()
        .ok_or_else(|| "Native runtime journal has no persisted source intent.".to_string())?;
    intent.validate()?;
    if manifest
        .entries
        .iter()
        .any(|entry| entry.scope == EntryScope::State)
    {
        return Err("NativeRuntimeOnly journal contains a state entry.".into());
    }
    super::native_runtime_owner::validate_journaled_update_preimages(manifest)?;
    super::validate_native_runtime_source_plan(manifest, Path::new(&manifest.install_root))?;
    Ok(())
}

#[cfg(test)]
#[path = "native_runtime_terminal_tests.rs"]
mod tests;
