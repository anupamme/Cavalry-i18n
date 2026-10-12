/**
 * [INPUT]: 依赖schema 1 manifest、固定受管槽与当前编译source政策。
 * [OUTPUT]: 验证baseline字段、路径、slot/inventory对应关系和原厂Absent槽。
 * [POS]: native_mac_vendor_baseline的合同与slot观察层；安全复核受管文件，不判断source身份。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    collections::BTreeMap,
    fs,
    path::{Component, Path},
};

use crate::native_mac_bundle_inventory::BundleObject;
use crate::{
    commands::{native_baseline_target_sha256, NATIVE_BASELINE_SOURCE_POLICY_ID},
    install::{self, LANG_MARKER_NAME},
    mac_runtime::{INJECTOR_DYLIB_NAME, WRAPPER_EXECUTABLE_NAME},
    privilege,
};

use super::{
    storage, BaselineManifest, BundleInventory, ManagedSlot, SlotRole, SlotState,
    REQUIRED_COPY_PATHS, SCHEMA_VERSION,
};

pub(super) fn validate_manifest(
    manifest: &BaselineManifest,
    root: &Path,
    expected_baseline_id: &str,
) -> Result<(), String> {
    if manifest.schema_version != SCHEMA_VERSION {
        return Err("Unsupported native baseline schema version.".to_string());
    }
    if manifest.baseline_id != expected_baseline_id {
        return Err("Native baseline manifest ID differs from caller expectation.".to_string());
    }
    if manifest.install_root != path_text(root, "Cavalry root")? {
        return Err("Native baseline belongs to another canonical bundle root.".to_string());
    }
    validate_hex_digest(&manifest.target_sha256, "target digest")?;
    validate_policy_id(&manifest.policy_id)?;
    if manifest.target_sha256 != native_baseline_target_sha256()
        || manifest.policy_id != NATIVE_BASELINE_SOURCE_POLICY_ID
    {
        return Err(
            "Native baseline target or policy differs from this compiled build.".to_string(),
        );
    }
    validate_inventory_text(&manifest.inventory)?;
    validate_manifest_shape(manifest)?;
    validate_slot_inventory(manifest)?;
    if super::manifest_id(manifest)? != expected_baseline_id {
        return Err("Native baseline manifest body does not match its expected ID.".to_string());
    }
    Ok(())
}

pub(super) fn validate_manifest_shape(manifest: &BaselineManifest) -> Result<(), String> {
    let specs = expected_slots(Path::new(&manifest.install_root))?;
    if manifest.slots.len() != specs.len() {
        return Err("Native baseline controlled slot set is incomplete.".to_string());
    }
    let mut blob_names = Vec::new();
    for (index, (slot, (path, role))) in manifest.slots.iter().zip(specs.iter()).enumerate() {
        if slot.relative_path != *path || slot.role != *role {
            return Err("Native baseline relative slot path or role drifted.".to_string());
        }
        match (&slot.role, &slot.preimage) {
            (
                SlotRole::RequiredCopy | SlotRole::OptionalSignatureCopyOrRemove,
                SlotState::Present { blob_name, .. },
            ) => {
                let expected = super::blob_name_for(index);
                if blob_name != &expected {
                    return Err("Native baseline blob path is not canonical.".to_string());
                }
                blob_names.push(blob_name.clone());
            }
            (SlotRole::RequiredCopy, SlotState::Absent) => {
                return Err("Required vendor baseline slot is absent.".to_string());
            }
            (
                SlotRole::OptionalSignatureCopyOrRemove
                | SlotRole::RemoveWhenAbsent
                | SlotRole::ObserveAbsentOnly,
                SlotState::Absent,
            ) => {}
            _ => return Err("Native baseline slot has an invalid preimage state.".to_string()),
        }
    }
    blob_names.sort();
    blob_names.dedup();
    let present_count = manifest
        .slots
        .iter()
        .filter(|slot| matches!(slot.preimage, SlotState::Present { .. }))
        .count();
    if blob_names.len() != present_count {
        return Err("Native baseline slots reuse a blob path.".to_string());
    }
    Ok(())
}

pub(super) fn validate_slot_inventory(manifest: &BaselineManifest) -> Result<(), String> {
    for slot in &manifest.slots {
        let relative = Path::new(&slot.relative_path);
        match (&slot.preimage, manifest.inventory.entries.get(relative)) {
            (
                SlotState::Present {
                    mode,
                    byte_len,
                    sha256,
                    ..
                },
                Some(BundleObject::RegularFile {
                    mode: inventory_mode,
                    byte_len: inventory_len,
                    sha256: inventory_sha,
                }),
            ) if mode == inventory_mode && byte_len == inventory_len && sha256 == inventory_sha => {
            }
            (SlotState::Absent, None) => {}
            _ => {
                return Err(format!(
                    "Native baseline controlled slot differs from its inventory: {}",
                    slot.relative_path
                ));
            }
        }
    }
    Ok(())
}

fn expected_slots(root: &Path) -> Result<Vec<(String, SlotRole)>, String> {
    let mut slots = REQUIRED_COPY_PATHS
        .iter()
        .map(|path| ((*path).to_string(), SlotRole::RequiredCopy))
        .collect::<Vec<_>>();
    for path in privilege::external_signature_component_paths(root) {
        let relative = path
            .strip_prefix(root)
            .map_err(|_| "External signature slot escaped the bundle root.".to_string())?;
        slots.push((
            path_text(relative, "signature slot")?,
            SlotRole::OptionalSignatureCopyOrRemove,
        ));
    }
    slots.push((
        format!("Contents/MacOS/{WRAPPER_EXECUTABLE_NAME}"),
        SlotRole::RemoveWhenAbsent,
    ));
    slots.push((
        format!("Contents/Frameworks/{INJECTOR_DYLIB_NAME}"),
        SlotRole::RemoveWhenAbsent,
    ));
    slots.push((
        format!("Contents/Resources/{LANG_MARKER_NAME}"),
        SlotRole::ObserveAbsentOnly,
    ));
    Ok(slots)
}

/// 原厂签名负责来源；备份只观察本工具将改写或要求缺席的固定槽。
/// 保留schema 1 inventory格式，旧整树manifest无需迁移。
pub(super) fn observe_stock_inventory(root: &Path) -> Result<BundleInventory, String> {
    let mut entries = BTreeMap::new();
    for (relative, _) in expected_slots(root)? {
        let relative = Path::new(&relative);
        install::validate_no_symlink_components(root, relative)?;
        let path = root.join(relative);
        let metadata = match fs::symlink_metadata(&path) {
            Ok(metadata) => metadata,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error.to_string()),
        };
        if !metadata.is_file() || metadata.file_type().is_symlink() {
            return Err(format!(
                "Native baseline slot is not a regular file: {}",
                path.display()
            ));
        }
        let digest = storage::digest_regular(&path, metadata.len())?;
        entries.insert(
            relative.to_path_buf(),
            BundleObject::RegularFile {
                mode: digest.mode,
                byte_len: digest.byte_len,
                sha256: digest.sha256,
            },
        );
    }
    Ok(BundleInventory { entries })
}

pub(super) fn observe_stock_slots(
    root: &Path,
    inventory: &BundleInventory,
) -> Result<Vec<ManagedSlot>, String> {
    let specs = expected_slots(root)?;
    let mut slots = Vec::with_capacity(specs.len());
    for (index, (relative_path, role)) in specs.into_iter().enumerate() {
        let relative = Path::new(&relative_path);
        install::validate_no_symlink_components(root, relative)
            .map_err(|error| format!("Native baseline slot path is unsafe: {error}"))?;
        let object = inventory.entries.get(relative);
        let preimage = match (role, object) {
            (
                SlotRole::RequiredCopy,
                Some(BundleObject::RegularFile {
                    mode,
                    byte_len,
                    sha256,
                }),
            )
            | (
                SlotRole::OptionalSignatureCopyOrRemove,
                Some(BundleObject::RegularFile {
                    mode,
                    byte_len,
                    sha256,
                }),
            ) => SlotState::Present {
                blob_name: super::blob_name_for(index),
                byte_len: *byte_len,
                sha256: sha256.clone(),
                mode: *mode,
            },
            (SlotRole::OptionalSignatureCopyOrRemove, None)
            | (SlotRole::RemoveWhenAbsent, None)
            | (SlotRole::ObserveAbsentOnly, None) => SlotState::Absent,
            (SlotRole::RequiredCopy, _) => {
                return Err(format!(
                    "Required stock vendor slot is missing or unsafe: {relative_path}"
                ));
            }
            (SlotRole::OptionalSignatureCopyOrRemove, Some(_)) => {
                return Err(format!(
                    "Optional signature slot is not a regular file: {relative_path}"
                ));
            }
            (SlotRole::RemoveWhenAbsent | SlotRole::ObserveAbsentOnly, Some(_)) => {
                return Err(format!(
                    "Switcher-owned runtime slot is not stock-absent: {relative_path}"
                ));
            }
        };
        slots.push(ManagedSlot {
            relative_path,
            role,
            preimage,
        });
    }
    Ok(slots)
}

pub(super) fn validate_inventory_text(inventory: &BundleInventory) -> Result<(), String> {
    for (relative, object) in &inventory.entries {
        validate_relative_path(relative)?;
        path_text(relative, "inventory path")?;
        if let BundleObject::Symlink { target, .. } = object {
            path_text(target, "symlink target")?;
        }
    }
    Ok(())
}

fn validate_relative_path(path: &Path) -> Result<(), String> {
    let raw = path
        .to_str()
        .ok_or_else(|| "Native baseline relative path is not UTF-8.".to_string())?;
    // Path::components会归一化中间`.`和重复`/`。
    // 先检查序列化文本，防止manifest藏入这些组件。
    if raw.is_empty() {
        return Ok(());
    }
    if path.is_absolute()
        || raw
            .split('/')
            .any(|part| part.is_empty() || matches!(part, "." | ".."))
        || path
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err(format!(
            "Native baseline contains an unsafe relative path: {}",
            path.display()
        ));
    }
    Ok(())
}

pub(super) fn path_text(path: &Path, label: &str) -> Result<String, String> {
    path.to_str()
        .map(str::to_string)
        .ok_or_else(|| format!("{label} is not UTF-8; native baseline encoding is unsupported."))
}

pub(super) fn validate_hex_digest(value: &str, label: &str) -> Result<(), String> {
    if value.len() != 64
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
    {
        return Err(format!("{label} must be a lowercase SHA-256 digest."));
    }
    Ok(())
}

pub(super) fn validate_policy_id(value: &str) -> Result<(), String> {
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))
    {
        return Err("Native source policy ID is invalid.".to_string());
    }
    Ok(())
}
