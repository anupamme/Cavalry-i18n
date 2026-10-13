/**
 * [INPUT]: 依赖native source许可、macOS bundle清单和调用方既有state目录。
 * [OUTPUT]: 建立schema 1/2固定槽备份，生成恢复计划并验证原厂恢复。
 * [POS]: macOS原厂preimage真相层；由NRT来源终结器消费；不签名、不改bundle、不提交profile状态。
 * 捕获在暂存或复用核回后验原厂签名一次。
 * 固定槽前后像绑定该证明。不读取整树文件。
 * schema 2额外保存ExtensionLayer原像；schema 1仍按旧槽恢复。
 * 新manifest只存固定槽摘要；旧整树manifest仍可读取。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
};

use crate::{
    commands::{
        native_baseline_target_sha256, verify_native_baseline_source, VerifiedNativeVendorSource,
        NATIVE_BASELINE_SOURCE_POLICY_ID,
    },
    patch::CopyPair,
    privilege::CommandRunner,
};

use super::native_mac_bundle_inventory::BundleInventory;

#[path = "native_mac_vendor_baseline_contract.rs"]
mod contract;
#[path = "native_mac_vendor_baseline_storage.rs"]
mod storage;

const STORE_DIRECTORY: &str = "native-vendor-baselines";
const MANIFEST_NAME: &str = "baseline.json";
const BLOBS_DIRECTORY: &str = "blobs";
const SCHEMA_VERSION: u32 = 2;
const MAX_INFO_BYTES: u64 = 16 * 1024 * 1024;
const MAX_EXTENSION_BYTES: u64 = 256 * 1024 * 1024;
pub(crate) const NRT_EXTENSION_PATH: &str = "Contents/Frameworks/libExtensionLayer.dylib";
pub(crate) const LEGACY_EXTENSION_REINSTALL_MESSAGE: &str = "This native runtime predates the ExtensionLayer slot. Restore English, then recapture the official stock baseline before installing the native runtime.";
const SCHEMA_1_REQUIRED_COPY_PATHS: [&str; 3] = [
    "Contents/Info.plist",
    "Contents/MacOS/Cavalry",
    "Contents/_CodeSignature/CodeResources",
];
const SCHEMA_2_REQUIRED_COPY_PATHS: [&str; 4] = [
    "Contents/Info.plist",
    "Contents/MacOS/Cavalry",
    "Contents/_CodeSignature/CodeResources",
    NRT_EXTENSION_PATH,
];
static TEMP_SEQUENCE: AtomicU64 = AtomicU64::new(0);

// ---- Schema 1 数据合同 -----------------------------------------------------

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
enum SlotRole {
    RequiredCopy,
    OptionalSignatureCopyOrRemove,
    RemoveWhenAbsent,
    ObserveAbsentOnly,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(tag = "state", rename_all = "camelCase", deny_unknown_fields)]
enum SlotState {
    Present {
        blob_name: String,
        byte_len: u64,
        sha256: String,
        mode: u32,
    },
    Absent,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ManagedSlot {
    relative_path: String,
    role: SlotRole,
    preimage: SlotState,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct BaselineManifest {
    schema_version: u32,
    baseline_id: String,
    install_root: String,
    target_sha256: String,
    policy_id: String,
    inventory: BundleInventory,
    slots: Vec<ManagedSlot>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestMaterial<'a> {
    schema_version: u32,
    install_root: &'a str,
    target_sha256: &'a str,
    policy_id: &'a str,
    inventory: &'a BundleInventory,
    slots: &'a [ManagedSlot],
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct NativeVendorRestoreMode {
    pub(crate) destination: PathBuf,
    pub(crate) unix_mode: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct NativeVendorRestorePlan {
    pub(crate) pairs: Vec<CopyPair>,
    pub(crate) modes: Vec<NativeVendorRestoreMode>,
    pub(crate) removals: Vec<PathBuf>,
}

/// 私有字段确保baseline能力只从真实capture或expected-ID load产生。
#[derive(Debug, Clone)]
pub(crate) struct VerifiedNativeVendorBaseline {
    install_root: PathBuf,
    state_root: PathBuf,
    manifest: BaselineManifest,
}

impl VerifiedNativeVendorBaseline {
    pub(crate) fn baseline_id(&self) -> &str {
        &self.manifest.baseline_id
    }

    pub(crate) fn state_dir(&self) -> &Path {
        &self.state_root
    }

    pub(crate) fn has_extension_preimage(&self) -> bool {
        self.manifest.schema_version == 2
    }

    /// 每次读取都重验原始Info blob的bytes、blob mode与manifest绑定mode。
    pub(crate) fn read_info_plist_preimage(&self) -> Result<(Vec<u8>, u32), String> {
        let current = load_at(&self.install_root, &self.state_root, self.baseline_id())?;
        let slot = current
            .manifest
            .slots
            .iter()
            .find(|slot| slot.relative_path == SCHEMA_1_REQUIRED_COPY_PATHS[0])
            .ok_or_else(|| "Native baseline Info.plist slot is missing.".to_string())?;
        let SlotState::Present {
            blob_name,
            byte_len,
            sha256,
            mode,
        } = &slot.preimage
        else {
            return Err("Native baseline Info.plist preimage is absent.".to_string());
        };
        if *byte_len > MAX_INFO_BYTES {
            return Err("Native baseline Info.plist exceeds its read limit.".to_string());
        }
        let blob_path = current.blob_path(blob_name);
        let (bytes, blob_mode) = storage::read_bounded_regular(&blob_path, MAX_INFO_BYTES)?;
        if blob_mode != storage::PRIVATE_FILE_MODE
            || u64::try_from(bytes.len()).ok() != Some(*byte_len)
            || sha256_bytes(&bytes) != *sha256
        {
            return Err("Native baseline Info.plist blob failed exact verification.".to_string());
        }
        Ok((bytes, *mode))
    }

    /// 只允许schema 2提供ExtensionLayer原像及原权限mode。
    pub(crate) fn read_extension_preimage(&self) -> Result<(Vec<u8>, u32), String> {
        if !self.has_extension_preimage() {
            return Err(LEGACY_EXTENSION_REINSTALL_MESSAGE.into());
        }
        let slot = self
            .manifest
            .slots
            .iter()
            .find(|slot| slot.relative_path == NRT_EXTENSION_PATH)
            .ok_or_else(|| "Native baseline ExtensionLayer slot is missing.".to_string())?;
        let SlotState::Present {
            blob_name,
            byte_len,
            sha256,
            mode,
        } = &slot.preimage
        else {
            return Err("Native baseline ExtensionLayer preimage is absent.".to_string());
        };
        if *byte_len > MAX_EXTENSION_BYTES {
            return Err("Native baseline ExtensionLayer exceeds its read limit.".into());
        }
        let (bytes, blob_mode) =
            storage::read_bounded_regular(&self.blob_path(blob_name), MAX_EXTENSION_BYTES)?;
        if blob_mode != storage::PRIVATE_FILE_MODE
            || u64::try_from(bytes.len()).ok() != Some(*byte_len)
            || sha256_bytes(&bytes) != *sha256
        {
            return Err("Native baseline ExtensionLayer blob failed exact verification.".into());
        }
        Ok((bytes, *mode))
    }

    /// 只生成受管槽CopyPair、目標mode與移除列表；本函數不改寫bundle。
    pub(crate) fn build_restore_plan(
        &self,
        app_path: &Path,
    ) -> Result<NativeVendorRestorePlan, String> {
        let root = validate_canonical_app(app_path)?;
        if root != self.install_root {
            return Err("Native baseline belongs to another Cavalry installation.".to_string());
        }
        let stored = load_at(&root, &self.state_root, self.baseline_id())?;
        if stored.manifest != self.manifest {
            return Err("Native baseline changed after typed verification.".to_string());
        }

        let mut pairs = Vec::new();
        let mut modes = Vec::new();
        let mut removals = Vec::new();
        for slot in &stored.manifest.slots {
            let destination = root.join(Path::new(&slot.relative_path));
            match (&slot.role, &slot.preimage) {
                (
                    SlotRole::RequiredCopy | SlotRole::OptionalSignatureCopyOrRemove,
                    SlotState::Present {
                        blob_name, mode, ..
                    },
                ) => {
                    pairs.push(CopyPair {
                        src: stored.blob_path(blob_name),
                        dst: destination.clone(),
                    });
                    modes.push(NativeVendorRestoreMode {
                        destination,
                        unix_mode: *mode,
                    });
                }
                (
                    SlotRole::OptionalSignatureCopyOrRemove | SlotRole::RemoveWhenAbsent,
                    SlotState::Absent,
                ) => {
                    removals.push(destination);
                }
                (SlotRole::ObserveAbsentOnly, SlotState::Absent) => {}
                _ => return Err("Native baseline slot role/state is invalid.".to_string()),
            }
        }
        Ok(NativeVendorRestorePlan {
            pairs,
            modes,
            removals,
        })
    }

    /// 固定槽回到前像且Apple原厂签名通过，才确认恢复完成。
    pub(crate) fn verify_restored_vendor<R: CommandRunner>(
        &self,
        app_path: &Path,
        runner: &mut R,
    ) -> Result<(), String> {
        self.verify_restored_vendor_with(app_path, |app| verify_native_baseline_source(app, runner))
    }

    fn verify_restored_vendor_with<F>(&self, app_path: &Path, mut verifier: F) -> Result<(), String>
    where
        F: FnMut(&Path) -> Result<VerifiedNativeVendorSource, String>,
    {
        self.verify_stock_preimage(app_path)?;
        let source = verifier(app_path)?;
        validate_source(
            &source,
            &self.install_root,
            &self.manifest.target_sha256,
            &self.manifest.policy_id,
        )
    }

    /// 只比较manifest版本对应的原厂固定槽；调用方另负责来源认证。
    pub(crate) fn verify_stock_preimage(&self, app_path: &Path) -> Result<(), String> {
        let root = validate_canonical_app(app_path)?;
        if root != self.install_root {
            return Err("Restored Cavalry root does not match its native baseline.".to_string());
        }
        let stored = load_at(&root, &self.state_root, self.baseline_id())?;
        let inventory = contract::observe_stock_inventory(&root, stored.manifest.schema_version)?;
        let slots =
            contract::observe_stock_slots(&root, &inventory, stored.manifest.schema_version)?;
        if slots != stored.manifest.slots {
            return Err("Restored Cavalry slots differ from the native baseline.".to_string());
        }
        Ok(())
    }
}

// ---- 捕获与加载 ------------------------------------------------------------

/// 此入口在暂存或复用核对后验真实来源，再允许发布baseline。
pub(crate) fn capture_or_reuse<R: CommandRunner>(
    app_path: &Path,
    state_dir: &Path,
    runner: &mut R,
) -> Result<VerifiedNativeVendorBaseline, String> {
    capture_inner(state_dir, app_path, |app| {
        verify_native_baseline_source(app, runner)
    })
}

/// 加载必须使用调用方expected ID；manifest不能自我授权。
pub(crate) fn load_baseline(
    app_path: &Path,
    state_dir: &Path,
    expected_baseline_id: &str,
) -> Result<VerifiedNativeVendorBaseline, String> {
    let root = validate_canonical_app(app_path)?;
    let state = validate_state_root(state_dir, &root)?;
    load_at(&root, &state, expected_baseline_id)
}

fn capture_inner<F>(
    state_dir: &Path,
    app_path: &Path,
    mut verifier: F,
) -> Result<VerifiedNativeVendorBaseline, String>
where
    F: FnMut(&Path) -> Result<VerifiedNativeVendorSource, String>,
{
    let root = validate_canonical_app(app_path)?;
    let state = validate_state_root(state_dir, &root)?;
    let inventory_before = contract::observe_stock_inventory(&root, SCHEMA_VERSION)?;
    contract::validate_inventory_text(&inventory_before)?;
    let slots = contract::observe_stock_slots(&root, &inventory_before, SCHEMA_VERSION)?;
    let mut manifest = BaselineManifest {
        schema_version: SCHEMA_VERSION,
        baseline_id: String::new(),
        install_root: contract::path_text(&root, "Cavalry root")?,
        target_sha256: native_baseline_target_sha256(),
        policy_id: NATIVE_BASELINE_SOURCE_POLICY_ID.to_string(),
        inventory: inventory_before,
        slots,
    };
    contract::validate_manifest_shape(&manifest)?;
    contract::validate_slot_inventory(&manifest)?;
    manifest.baseline_id = manifest_id(&manifest)?;
    let generation = generation_path(&state, &manifest.baseline_id);

    if path_exists_nofollow(&generation)? {
        let existing = load_at(&root, &state, &manifest.baseline_id)?;
        if existing.manifest != manifest {
            return Err(
                "Existing native baseline generation does not match this source.".to_string(),
            );
        }
        verify_capture_after(&root, &manifest, &mut verifier)?;
        return Ok(existing);
    }

    let store_root = ensure_store_root(&state, &root)?;
    let mut staging = StagingGeneration::create(&store_root)?;
    stage_blobs(&root, &manifest, &staging.path)?;
    storage::write_json_bounded(
        &staging.path.join(MANIFEST_NAME),
        &manifest,
        storage::MANIFEST_LIMIT,
    )?;
    storage::sync_directory(&staging.path.join(BLOBS_DIRECTORY))?;
    storage::sync_directory(&staging.path)?;

    verify_capture_after(&root, &manifest, &mut verifier)?;
    validate_state_root(&state, &root)?;
    match storage::publish_exclusive(&staging.path, &generation) {
        Ok(()) => staging.mark_published(),
        Err(error) if path_exists_nofollow(&generation)? => {
            let existing = load_at(&root, &state, &manifest.baseline_id)?;
            if existing.manifest != manifest {
                return Err(error);
            }
            storage::sync_directory(&store_root)?;
            return Ok(existing);
        }
        Err(error) => return Err(error),
    }
    storage::sync_directory(&store_root)?;
    load_at(&root, &state, &manifest.baseline_id)
}

fn verify_capture_after<F>(
    root: &Path,
    manifest: &BaselineManifest,
    verifier: &mut F,
) -> Result<(), String>
where
    F: FnMut(&Path) -> Result<VerifiedNativeVendorSource, String>,
{
    let source_after = verifier(root)?;
    validate_source(
        &source_after,
        root,
        &manifest.target_sha256,
        &manifest.policy_id,
    )?;
    let inventory_after = contract::observe_stock_inventory(root, manifest.schema_version)?;
    if contract::observe_stock_slots(root, &inventory_after, manifest.schema_version)?
        != manifest.slots
    {
        return Err("Cavalry slots changed during native baseline capture.".to_string());
    }
    Ok(())
}

fn load_at(
    root: &Path,
    state: &Path,
    expected_baseline_id: &str,
) -> Result<VerifiedNativeVendorBaseline, String> {
    contract::validate_hex_digest(expected_baseline_id, "expected baseline ID")?;
    let canonical_root = validate_canonical_app(root)?;
    let canonical_state = validate_state_root(state, &canonical_root)?;
    let store_root = state_store_path(&canonical_state);
    storage::validate_directory_mode(&store_root, storage::PRIVATE_DIRECTORY_MODE)?;
    let generation = generation_path(&canonical_state, expected_baseline_id);
    storage::validate_directory_mode(&generation, storage::PRIVATE_DIRECTORY_MODE)?;
    storage::exact_directory_members(
        &generation,
        &[MANIFEST_NAME.to_string(), BLOBS_DIRECTORY.to_string()],
    )?;
    let blobs_dir = generation.join(BLOBS_DIRECTORY);
    storage::validate_directory_mode(&blobs_dir, storage::PRIVATE_DIRECTORY_MODE)?;
    let manifest_path = generation.join(MANIFEST_NAME);
    storage::validate_file_mode(&manifest_path, storage::PRIVATE_FILE_MODE)?;
    let (bytes, _) = storage::read_bounded_regular(&manifest_path, storage::MANIFEST_LIMIT)?;
    let manifest: BaselineManifest = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Native baseline manifest is invalid: {error}"))?;
    contract::validate_manifest(&manifest, &canonical_root, expected_baseline_id)?;

    let expected_blobs = manifest
        .slots
        .iter()
        .filter_map(|slot| match &slot.preimage {
            SlotState::Present { blob_name, .. } => Some(blob_name.clone()),
            SlotState::Absent => None,
        })
        .collect::<Vec<_>>();
    storage::exact_directory_members(&blobs_dir, &expected_blobs)?;
    for slot in &manifest.slots {
        if let SlotState::Present {
            blob_name,
            byte_len,
            sha256,
            ..
        } = &slot.preimage
        {
            let path = blobs_dir.join(blob_name);
            storage::validate_file_mode(&path, storage::PRIVATE_FILE_MODE)?;
            let digest = storage::digest_regular(&path, *byte_len)?;
            if digest.byte_len != *byte_len || digest.sha256 != *sha256 {
                return Err(format!(
                    "Native baseline blob failed digest validation: {blob_name}"
                ));
            }
        }
    }
    Ok(VerifiedNativeVendorBaseline {
        install_root: canonical_root,
        state_root: canonical_state,
        manifest,
    })
}

fn stage_blobs(root: &Path, manifest: &BaselineManifest, staging: &Path) -> Result<(), String> {
    let blobs_dir = staging.join(BLOBS_DIRECTORY);
    storage::create_private_directory(&blobs_dir)?;
    for slot in &manifest.slots {
        if let SlotState::Present {
            blob_name,
            byte_len,
            sha256,
            mode,
        } = &slot.preimage
        {
            let expected = storage::FileDigest {
                mode: *mode,
                byte_len: *byte_len,
                sha256: sha256.clone(),
            };
            storage::copy_regular_nofollow(
                &root.join(Path::new(&slot.relative_path)),
                &blobs_dir.join(blob_name),
                &expected,
            )?;
        }
    }
    storage::sync_directory(&blobs_dir)
}

// ---- 规范路径与source绑定 --------------------------------------------------

fn validate_source(
    source: &VerifiedNativeVendorSource,
    expected_root: &Path,
    expected_target: &str,
    expected_policy: &str,
) -> Result<(), String> {
    if source.canonical_app().as_os_str() != expected_root.as_os_str() {
        return Err("Native source proof is bound to another bundle root.".to_string());
    }
    contract::validate_hex_digest(source.target_sha256(), "source target digest")?;
    contract::validate_policy_id(source.policy_id())?;
    if source.target_sha256() != expected_target || source.policy_id() != expected_policy {
        return Err("Native source proof target or policy changed during capture.".to_string());
    }
    Ok(())
}

fn validate_canonical_app(app: &Path) -> Result<PathBuf, String> {
    if !app.is_absolute() {
        return Err("Cavalry bundle path must be absolute.".to_string());
    }
    let metadata = fs::symlink_metadata(app)
        .map_err(|error| format!("Could not inspect Cavalry bundle root: {error}"))?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err("Cavalry bundle root must be a real directory, not a symlink.".to_string());
    }
    let canonical = fs::canonicalize(app)
        .map_err(|error| format!("Could not canonicalize Cavalry bundle root: {error}"))?;
    if canonical.as_os_str() != app.as_os_str() {
        return Err("Cavalry bundle path must already be canonical.".to_string());
    }
    contract::path_text(&canonical, "Cavalry root")?;
    Ok(canonical)
}

fn validate_state_root(state: &Path, app: &Path) -> Result<PathBuf, String> {
    if !state.is_absolute() {
        return Err("Native baseline state root must be absolute.".to_string());
    }
    let metadata = fs::symlink_metadata(state)
        .map_err(|error| format!("Native baseline state root must already exist: {error}"))?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err("Native baseline state root must be a real directory.".to_string());
    }
    let canonical = fs::canonicalize(state)
        .map_err(|error| format!("Could not canonicalize native baseline state root: {error}"))?;
    if canonical.as_os_str() != state.as_os_str() {
        return Err("Native baseline state root must already be canonical.".to_string());
    }
    if canonical.starts_with(app) || app.starts_with(&canonical) {
        return Err(
            "Native baseline state root must stay outside and beside the bundle tree.".to_string(),
        );
    }
    contract::path_text(&canonical, "native state root")?;
    Ok(canonical)
}

// ---- ID与不可变generation布局 ---------------------------------------------

fn manifest_id(manifest: &BaselineManifest) -> Result<String, String> {
    let material = ManifestMaterial {
        schema_version: manifest.schema_version,
        install_root: &manifest.install_root,
        target_sha256: &manifest.target_sha256,
        policy_id: &manifest.policy_id,
        inventory: &manifest.inventory,
        slots: &manifest.slots,
    };
    let bytes = storage::json_bytes_bounded(&material, storage::MANIFEST_LIMIT)?;
    Ok(sha256_bytes(&bytes))
}

fn sha256_bytes(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn blob_name_for(slot_index: usize) -> String {
    format!("slot-{slot_index}.bin")
}

fn state_store_path(state: &Path) -> PathBuf {
    state.join(STORE_DIRECTORY)
}

fn generation_path(state: &Path, baseline_id: &str) -> PathBuf {
    state_store_path(state).join(baseline_id)
}

fn path_exists_nofollow(path: &Path) -> Result<bool, String> {
    match fs::symlink_metadata(path) {
        Ok(_) => Ok(true),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(error) => Err(format!(
            "Could not inspect baseline path {}: {error}",
            path.display()
        )),
    }
}

fn ensure_store_root(state: &Path, app: &Path) -> Result<PathBuf, String> {
    validate_state_root(state, app)?;
    let store = state_store_path(state);
    if path_exists_nofollow(&store)? {
        storage::validate_directory_mode(&store, storage::PRIVATE_DIRECTORY_MODE)?;
    } else {
        storage::create_private_directory(&store)?;
        storage::sync_directory(state)?;
    }
    Ok(store)
}

struct StagingGeneration {
    path: PathBuf,
    published: bool,
}

impl StagingGeneration {
    fn create(store_root: &Path) -> Result<Self, String> {
        for _ in 0..32 {
            let sequence = TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed);
            let path = store_root.join(format!(".staging-{}-{sequence}", std::process::id()));
            match storage::create_private_directory(&path) {
                Ok(()) => {
                    return Ok(Self {
                        path,
                        published: false,
                    })
                }
                Err(_) if path_exists_nofollow(&path).unwrap_or(false) => continue,
                Err(error) => return Err(error),
            }
        }
        Err("Could not allocate a unique native baseline staging directory.".to_string())
    }

    fn mark_published(&mut self) {
        self.published = true;
    }
}

impl Drop for StagingGeneration {
    fn drop(&mut self) {
        if !self.published {
            let _ = fs::remove_dir_all(&self.path);
        }
    }
}

impl VerifiedNativeVendorBaseline {
    fn blob_path(&self, blob_name: &str) -> PathBuf {
        generation_path(&self.state_root, &self.manifest.baseline_id)
            .join(BLOBS_DIRECTORY)
            .join(blob_name)
    }
}

#[cfg(test)]
#[path = "native_mac_vendor_baseline_tests.rs"]
pub(crate) mod tests;
