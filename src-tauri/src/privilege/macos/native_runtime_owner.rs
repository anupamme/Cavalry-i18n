/**
 * [INPUT]: 依赖NRT精确postimage、固定baseline、旧owner bytes/mode和fd-relative存储。
 * [OUTPUT]: 读取v1/v2/v3 owner、发布或撤销八槽/九槽归属，并提供只读source hint。
 * [POS]: apply_transaction的耐久owner投影；hint供status和同源profile判路。
 * Hint只核owner schema、字段形状与bundle root，不授App写入或恢复权。
 * Hint不读journal、App槽或签名。完整runtime准入仍核owner版本对应槽与签名。
 * v1/v2仍按八槽读取与恢复；v3把ExtensionLayer纳入九槽归属。
 * 先原子发布owner，再退役journal。比较旧像不是OS CAS；第三态保留journal。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;
use std::collections::BTreeMap;

use crate::native_mac_vendor_baseline::NRT_EXTENSION_PATH;
use crate::native_mac_vendor_baseline::{load_baseline, VerifiedNativeVendorBaseline};

const OWNER_NAME: &str = "native-runtime-owner.json";
const OWNER_LIMIT: u64 = 64 * 1024;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RuntimeOwner {
    schema_version: u32,
    install_root: String,
    baseline_id: String,
    operation_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    runtime_source_sha256: Option<String>,
    slots: BTreeMap<String, ExpectedFileState>,
}

/// NRT intent keeps the exact prior owner image needed by managed replacement recovery.
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct NativeRuntimeOwnerPreimage {
    pub(crate) bytes_hex: String,
    pub(crate) mode: u32,
}

impl NativeRuntimeOwnerPreimage {
    fn from_image(bytes: &[u8], mode: u32) -> Result<Self, String> {
        if bytes.len() as u64 > OWNER_LIMIT
            || mode & 0o7777 != 0o600
            || mode & libc::S_IFMT as u32 != libc::S_IFREG as u32
        {
            return Err("Native runtime owner preimage has an invalid mode or size.".into());
        }
        Ok(Self {
            bytes_hex: encode_hex(bytes),
            mode,
        })
    }

    fn bytes(&self) -> Result<Vec<u8>, String> {
        if self.mode & 0o7777 != 0o600
            || self.mode & libc::S_IFMT as u32 != libc::S_IFREG as u32
            || self.bytes_hex.len() > OWNER_LIMIT as usize * 2
            || self.bytes_hex.len() % 2 != 0
        {
            return Err("Native runtime owner preimage has an invalid mode or size.".into());
        }
        let bytes = decode_hex(&self.bytes_hex)
            .map_err(|error| format!("Native runtime owner preimage is invalid: {error}"))?;
        if bytes.len() as u64 > OWNER_LIMIT {
            return Err("Native runtime owner preimage exceeds its fixed size limit.".into());
        }
        Ok(bytes)
    }

    pub(crate) fn includes_extension_slot(&self, app: &Path) -> Result<bool, String> {
        Ok(owner_from_preimage(self, app)?.schema_version == 3)
    }
}

#[derive(Debug)]
pub(crate) struct LoadedNativeRuntimeOwner {
    pub(crate) baseline: VerifiedNativeVendorBaseline,
    pub(crate) source_sha256: Option<String>,
    pub(crate) preimage: NativeRuntimeOwnerPreimage,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct NativeRuntimeOwnerHint {
    pub(crate) owned: bool,
    pub(crate) source_sha256: Option<String>,
}

fn controlled_paths(app: &Path, schema_version: u32) -> Vec<PathBuf> {
    let mut paths = vec![
        app.join("Contents/Info.plist"),
        app.join("Contents/_CodeSignature/CodeResources"),
        app.join("Contents/MacOS/Cavalry"),
        app.join("Contents/MacOS/CavalryLauncher"),
        app.join("Contents/Frameworks/libCavalryTranslatorInjector.dylib"),
    ];
    if schema_version == 3 {
        paths.push(app.join(NRT_EXTENSION_PATH));
    }
    paths.extend(super::super::bundle::external_signature_component_paths(
        app,
    ));
    paths.sort();
    paths
}

fn read_owner_preimage(
    state: &SecureDirectory,
) -> Result<Option<NativeRuntimeOwnerPreimage>, String> {
    let Some(mut opened) = state.open_regular_relative(Path::new(OWNER_NAME))? else {
        return Ok(None);
    };
    if opened.mode & 0o7777 != 0o600 {
        return Err("Native runtime owner must have private file mode.".into());
    }
    let mut bytes = Vec::new();
    Read::by_ref(&mut opened.file)
        .take(OWNER_LIMIT + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| error.to_string())?;
    if bytes.len() as u64 > OWNER_LIMIT {
        return Err("Native runtime owner exceeds its fixed size limit.".into());
    }
    NativeRuntimeOwnerPreimage::from_image(&bytes, opened.mode).map(Some)
}

fn owner_from_preimage(
    preimage: &NativeRuntimeOwnerPreimage,
    app: &Path,
) -> Result<RuntimeOwner, String> {
    let bytes = preimage.bytes()?;
    let owner: RuntimeOwner = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Native runtime owner preimage is invalid: {error}"))?;
    validate_owner(&owner, app)?;
    Ok(owner)
}

fn read_owner(state: &SecureDirectory, app: &Path) -> Result<Option<RuntimeOwner>, String> {
    read_owner_preimage(state)?
        .as_ref()
        .map(|preimage| owner_from_preimage(preimage, app))
        .transpose()
}

fn validate_owner(owner: &RuntimeOwner, app: &Path) -> Result<(), String> {
    if owner.install_root != path_string(app)? {
        return Err("Native runtime owner belongs to another schema or bundle root.".into());
    }
    match (owner.schema_version, owner.runtime_source_sha256.as_deref()) {
        (1, None) => {}
        (2, Some(hash)) if is_sha256_hex(hash) => {}
        (3, Some(hash)) if is_sha256_hex(hash) => {}
        _ => return Err("Native runtime owner has an invalid source fingerprint schema.".into()),
    }
    if owner.operation_id.is_empty()
        || owner.operation_id.len() > 128
        || !owner
            .operation_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.'))
    {
        return Err("Native runtime owner has an invalid operation ID.".into());
    }
    NativeRuntimeIntent::BoundManagedRuntime {
        baseline_id: owner.baseline_id.clone(),
        runtime_source_sha256: owner.runtime_source_sha256.clone(),
        previous_owner_preimage: None,
    }
    .validate()?;
    let expected = controlled_paths(app, owner.schema_version)
        .into_iter()
        .map(|path| {
            path.strip_prefix(app)
                .map_err(|error| error.to_string())
                .and_then(path_string)
        })
        .collect::<Result<Vec<_>, _>>()?;
    if owner.slots.keys().collect::<Vec<_>>() != expected.iter().collect::<Vec<_>>() {
        return Err(format!(
            "Native runtime owner must contain exactly the fixed {} slots.",
            if owner.schema_version == 3 { 9 } else { 8 }
        ));
    }
    for (path, state) in &owner.slots {
        if let Some(fingerprint) = &state.fingerprint {
            if fingerprint.sha256.len() != 64
                || !fingerprint
                    .sha256
                    .bytes()
                    .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
                || fingerprint.mode & libc::S_IFMT as u32 != libc::S_IFREG as u32
            {
                return Err("Native runtime owner contains an invalid fingerprint.".into());
            }
        } else if !path.ends_with("CodeDirectory")
            && !path.ends_with("CodeRequirements")
            && !path.ends_with("CodeSignature")
        {
            return Err("Native runtime required slot is absent.".into());
        }
    }
    Ok(())
}

pub(crate) fn validate_owner_preimage_shape(
    preimage: &NativeRuntimeOwnerPreimage,
) -> Result<(), String> {
    let bytes = preimage.bytes()?;
    let owner: RuntimeOwner = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Native runtime owner preimage is invalid: {error}"))?;
    match (owner.schema_version, owner.runtime_source_sha256.as_deref()) {
        (1, None) => {}
        (2, Some(hash)) if is_sha256_hex(hash) => {}
        (3, Some(hash)) if is_sha256_hex(hash) => {}
        _ => return Err("Native runtime owner preimage has an invalid source schema.".into()),
    }
    if owner.baseline_id.len() != 64 || !is_sha256_hex(&owner.baseline_id) {
        return Err("Native runtime owner preimage has an invalid baseline ID.".into());
    }
    Ok(())
}

pub(crate) fn validate_owner_preimage_binding(
    preimage: &NativeRuntimeOwnerPreimage,
    app: &Path,
    baseline_id: &str,
) -> Result<(), String> {
    validate_owner_preimage_shape(preimage)?;
    let owner = owner_from_preimage(preimage, app)?;
    if owner.baseline_id != baseline_id {
        return Err("Managed runtime replacement changes its vendor baseline owner.".into());
    }
    Ok(())
}

fn path_string(path: &Path) -> Result<String, String> {
    path.to_str()
        .map(str::to_string)
        .ok_or_else(|| "Native runtime path is not UTF-8.".into())
}

fn verify_slots(owner: &RuntimeOwner, app: &SecureDirectory) -> Result<(), String> {
    validate_owner(owner, &app.path)?;
    for (relative, expected) in &owner.slots {
        let current = match app.open_regular_relative(Path::new(relative))? {
            Some(mut opened) => Some(fingerprint_open_file(&mut opened.file, opened.mode)?),
            None => None,
        };
        if current != expected.fingerprint {
            return Err(format!("Native runtime owned slot drifted: {relative}"));
        }
    }
    Ok(())
}

/// 只读owner摘要供status及profile判路；不授权App写入或恢复。
pub(crate) fn native_runtime_owner_hint_for_selection(
    state_dir: &Path,
    app: &Path,
) -> Result<NativeRuntimeOwnerHint, String> {
    let state = SecureDirectory::open(state_dir)?;
    let Some(preimage) = read_owner_preimage(&state)? else {
        return Ok(NativeRuntimeOwnerHint {
            owned: false,
            source_sha256: None,
        });
    };
    let bundle = SecureDirectory::open(app)?;
    let owner = owner_from_preimage(&preimage, &bundle.path)?;
    Ok(NativeRuntimeOwnerHint {
        owned: true,
        source_sha256: owner.runtime_source_sha256,
    })
}

/// 只读恢复提示，不授予bundle写入许可。不读取journal或整树摘要。
pub(crate) fn has_native_runtime_owner_for_selection(state: &Path, app: &Path) -> bool {
    native_runtime_owner_hint_for_selection(state, app)
        .map(|hint| hint.owned)
        .unwrap_or(false)
}

/// 调用方持共享operation guard。此函数不写文件，不自动修复中断事务。
pub(crate) fn load_owned_native_runtime<R: crate::privilege::CommandRunner>(
    state_dir: &Path,
    app: &Path,
    runner: &mut R,
) -> Result<Option<VerifiedNativeVendorBaseline>, String> {
    Ok(load_owned_native_runtime_details(state_dir, app, runner)?.map(|owned| owned.baseline))
}

pub(crate) fn load_owned_native_runtime_details<R: crate::privilege::CommandRunner>(
    state_dir: &Path,
    app: &Path,
    runner: &mut R,
) -> Result<Option<LoadedNativeRuntimeOwner>, String> {
    let state = SecureDirectory::open(state_dir)?;
    if state
        .open_node_leaf(
            &CString::new(JOURNAL_DIRECTORY).unwrap(),
            &journal_root(state_dir),
        )?
        .is_some()
    {
        return Err("Native runtime journal needs reconciliation before admission.".into());
    }
    let Some(preimage) = read_owner_preimage(&state)? else {
        return Ok(None);
    };
    let bundle = SecureDirectory::open(app)?;
    let owner = owner_from_preimage(&preimage, &bundle.path)?;
    verify_slots(&owner, &bundle)?;
    let baseline = load_baseline(&bundle.path, &state.path, &owner.baseline_id)?;
    crate::privilege::ensure_bundle_signature(&bundle.path, runner)?;
    Ok(Some(LoadedNativeRuntimeOwner {
        baseline,
        source_sha256: owner.runtime_source_sha256,
        preimage,
    }))
}

pub(crate) fn ensure_native_runtime_owner_absent(state_dir: &Path) -> Result<(), String> {
    let state = SecureDirectory::open(state_dir)?;
    if read_owner_preimage(&state)?.is_some() {
        return Err("Stock native runtime install refuses an existing owner.".into());
    }
    Ok(())
}

pub(super) fn verify_owner_for_intent(
    state: &SecureDirectory,
    app: &Path,
    intent: Option<&NativeRuntimeIntent>,
) -> Result<(), String> {
    let Some(NativeRuntimeIntent::BoundManagedRuntime {
        baseline_id,
        runtime_source_sha256: Some(_),
        previous_owner_preimage,
    }) = intent
    else {
        return Ok(());
    };
    let current = read_owner_preimage(state)?;
    if let Some(expected) = previous_owner_preimage {
        validate_owner_preimage_binding(expected, app, baseline_id)?;
        if current.as_ref() != Some(expected) {
            return Err("Managed runtime owner changed before the NRT journal began.".into());
        }
    } else if current.is_some() {
        return Err("Stock native runtime install refuses an existing owner.".into());
    }
    Ok(())
}

pub(crate) fn capture_owner_slot_preimages(
    app: &Path,
    preimage: &NativeRuntimeOwnerPreimage,
) -> Result<Vec<MacBundlePreimageConstraint>, String> {
    let bundle = SecureDirectory::open(app)?;
    let owner = owner_from_preimage(preimage, &bundle.path)?;
    let paths = controlled_paths(&bundle.path, owner.schema_version);
    let constraints = MacApplyTransaction::capture_preimages(&bundle.path, &paths)?;
    let expected_paths = owner.slots.keys().cloned().collect::<Vec<_>>();
    let actual_paths = constraints
        .iter()
        .map(|constraint| {
            constraint
                .destination
                .strip_prefix(&bundle.path)
                .map(path_string)
                .map_err(|error| error.to_string())?
        })
        .collect::<Result<Vec<_>, _>>()?;
    if actual_paths != expected_paths {
        return Err(format!(
            "Native runtime owner preimage does not cover the fixed {} slots.",
            if owner.schema_version == 3 { 9 } else { 8 }
        ));
    }
    for constraint in &constraints {
        let relative = path_string(
            constraint
                .destination
                .strip_prefix(&bundle.path)
                .map_err(|error| error.to_string())?,
        )?;
        if owner.slots.get(&relative) != Some(&constraint.expected) {
            return Err(format!("Native runtime owned slot drifted: {relative}"));
        }
    }
    Ok(constraints)
}

pub(super) fn validate_journaled_update_preimages(
    manifest: &JournalManifest,
) -> Result<(), String> {
    let Some(NativeRuntimeIntent::BoundManagedRuntime {
        baseline_id,
        previous_owner_preimage: Some(previous_owner),
        ..
    }) = manifest.native_runtime_intent.as_ref()
    else {
        return Ok(());
    };
    let app = Path::new(&manifest.install_root);
    validate_owner_preimage_binding(previous_owner, app, baseline_id)?;
    let owner = owner_from_preimage(previous_owner, app)?;
    let expected_paths = controlled_paths(app, owner.schema_version)
        .into_iter()
        .map(|path| {
            let relative = path.strip_prefix(app).map_err(|error| error.to_string())?;
            path_string(relative)
        })
        .collect::<Result<Vec<_>, _>>()?;
    let bundle_entries = manifest
        .entries
        .iter()
        .filter(|entry| entry.scope == EntryScope::Bundle)
        .collect::<Vec<_>>();
    let actual_paths = bundle_entries
        .iter()
        .map(|entry| {
            Path::new(&entry.destination)
                .strip_prefix(app)
                .map_err(|error| error.to_string())
                .and_then(path_string)
        })
        .collect::<Result<Vec<_>, _>>()?;
    if actual_paths.len() != expected_paths.len()
        || actual_paths
            .iter()
            .any(|path| !expected_paths.contains(path))
    {
        return Err(format!(
            "Managed runtime replacement journal must cover exactly the fixed {} slots.",
            if owner.schema_version == 3 { 9 } else { 8 }
        ));
    }
    for relative in expected_paths {
        let entry = bundle_entries
            .iter()
            .find(|entry| Path::new(&entry.destination) == app.join(&relative))
            .ok_or_else(|| format!("Managed runtime journal omitted slot {relative}."))?;
        let original = ExpectedFileState {
            fingerprint: original_fingerprint(entry)?,
        };
        if owner.slots.get(&relative) != Some(&original) {
            return Err(format!(
                "Managed runtime journal preimage differs from old owner at {relative}."
            ));
        }
    }
    Ok(())
}

pub(super) fn publish_terminal_owner(
    manifest: &JournalManifest,
    state: &SecureDirectory,
    bundle: &SecureDirectory,
) -> Result<(), String> {
    match manifest.native_runtime_intent.as_ref() {
        Some(NativeRuntimeIntent::BoundManagedRuntime {
            baseline_id,
            runtime_source_sha256,
            previous_owner_preimage,
        }) => {
            let app = Path::new(&manifest.install_root);
            let mut slots = BTreeMap::new();
            for entry in &manifest.entries {
                if entry.scope != EntryScope::Bundle
                    || (entry.verified_post.is_none() && !entry.verified_post_absent)
                {
                    return Err("Native runtime owner requires verified bundle postimages.".into());
                }
                let relative = Path::new(&entry.destination)
                    .strip_prefix(app)
                    .map_err(|error| error.to_string())?;
                slots.insert(
                    path_string(relative)?,
                    ExpectedFileState {
                        fingerprint: entry.verified_post.clone(),
                    },
                );
            }
            let contains_extension = slots.contains_key(NRT_EXTENSION_PATH);
            let schema_version = match (runtime_source_sha256.is_some(), contains_extension) {
                (true, true) => 3,
                (true, false) => 2,
                (false, false) => 1,
                (false, true) => {
                    return Err(
                        "Native runtime ExtensionLayer owner requires a source fingerprint.".into(),
                    )
                }
            };
            let owner = RuntimeOwner {
                schema_version,
                install_root: manifest.install_root.clone(),
                baseline_id: baseline_id.clone(),
                operation_id: manifest.operation_id.clone(),
                runtime_source_sha256: runtime_source_sha256.clone(),
                slots,
            };
            verify_slots(&owner, bundle)?;
            let current_preimage = read_owner_preimage(state)?;
            match (previous_owner_preimage, current_preimage.as_ref()) {
                (Some(expected_old), Some(current)) if expected_old == current => {
                    // Atomic rename makes the published owner all-old or all-new.
                    // This is not an OS compare-and-swap against external writers.
                    write_durable_json(state, OWNER_NAME, &owner)?;
                }
                (Some(_), Some(current)) if owner_matches_preimage(&owner, current, app)? => {
                    return state.sync();
                }
                (Some(_), _) => {
                    return Err(
                        "Managed runtime owner differs from the journaled old or new image; journal retained.".into(),
                    );
                }
                (None, None) => write_durable_json(state, OWNER_NAME, &owner)?,
                (None, Some(current)) if owner_matches_preimage(&owner, current, app)? => {
                    return state.sync();
                }
                (None, Some(_)) => {
                    return Err(
                        "Another native runtime owner already exists; journal retained.".into(),
                    );
                }
            }
            Ok(())
        }
        Some(NativeRuntimeIntent::VendorBaselineRestore { baseline_id }) => {
            if let Some(owner) = read_owner(state, Path::new(&manifest.install_root))? {
                validate_owner(&owner, Path::new(&manifest.install_root))?;
                if owner.baseline_id != *baseline_id {
                    return Err("Vendor restore cannot remove another baseline owner.".into());
                }
                state.unlink_regular_or_absent(&state.path.join(OWNER_NAME))?;
                state.sync()?;
            }
            Ok(())
        }
        // 旧未绑定的隔离候选不建立managed身份。
        Some(NativeRuntimeIntent::ManagedRuntime) => Ok(()),
        None => Err("Native runtime terminal owner has no source intent.".into()),
    }
}

/// 原厂恢复回滚时，核对之前的managed归属，不撤销它。
pub(super) fn verify_managed_rollback<R: crate::privilege::CommandRunner>(
    manifest: &JournalManifest,
    state_dir: &Path,
    runner: &mut R,
) -> Result<(), String> {
    let state = SecureDirectory::open(state_dir)?;
    let owner = read_owner(&state, Path::new(&manifest.install_root))?
        .ok_or_else(|| "Managed rollback has no prior owner.".to_string())?;
    let Some(NativeRuntimeIntent::VendorBaselineRestore { baseline_id }) =
        manifest.native_runtime_intent.as_ref()
    else {
        return Err("Managed rollback requires a vendor restore intent.".into());
    };
    if owner.baseline_id != *baseline_id {
        return Err("Managed rollback belongs to another baseline owner.".into());
    }
    let app = SecureDirectory::open(Path::new(&manifest.install_root))?;
    verify_slots(&owner, &app)?;
    crate::privilege::ensure_bundle_signature(&app.path, runner)?;
    load_baseline(&app.path, state_dir, baseline_id)?;
    Ok(())
}

fn owner_matches_preimage(
    expected: &RuntimeOwner,
    preimage: &NativeRuntimeOwnerPreimage,
    app: &Path,
) -> Result<bool, String> {
    owner_from_preimage(preimage, app)?;
    let mut expected_bytes =
        serde_json::to_vec_pretty(expected).map_err(|error| error.to_string())?;
    expected_bytes.push(b'\n');
    Ok(preimage.mode & 0o7777 == 0o600 && preimage.bytes()? == expected_bytes)
}

pub(super) fn verify_stock_install_rollback(state_dir: &Path) -> Result<(), String> {
    let state = SecureDirectory::open(state_dir)?;
    if read_owner_preimage(&state)?.is_some() {
        return Err("Stock runtime rollback unexpectedly has a managed owner.".into());
    }
    Ok(())
}

pub(super) fn verify_managed_update_rollback<R: crate::privilege::CommandRunner>(
    manifest: &JournalManifest,
    previous_owner_preimage: &NativeRuntimeOwnerPreimage,
    baseline: &VerifiedNativeVendorBaseline,
    state_dir: &Path,
    runner: &mut R,
) -> Result<(), String> {
    let app_path = Path::new(&manifest.install_root);
    let baseline_id = match manifest.native_runtime_intent.as_ref() {
        Some(NativeRuntimeIntent::BoundManagedRuntime { baseline_id, .. }) => baseline_id,
        _ => return Err("Managed update rollback requires a bound runtime intent.".into()),
    };
    validate_owner_preimage_binding(previous_owner_preimage, app_path, baseline_id)?;
    let state = SecureDirectory::open(state_dir)?;
    if read_owner_preimage(&state)?.as_ref() != Some(previous_owner_preimage) {
        return Err("Managed update rollback owner differs from its exact prior image.".into());
    }
    let app = SecureDirectory::open(app_path)?;
    let previous_owner = owner_from_preimage(previous_owner_preimage, &app.path)?;
    verify_slots(&previous_owner, &app)?;
    crate::privilege::ensure_bundle_signature(&app.path, runner)?;
    if baseline.baseline_id() != baseline_id {
        return Err("Managed rollback belongs to another baseline.".into());
    }
    Ok(())
}

#[cfg(test)]
mod hint_tests {
    use super::*;
    use std::{fs, os::unix::fs::PermissionsExt};

    fn fixture() -> (tempfile::TempDir, PathBuf, PathBuf) {
        let temp = tempfile::tempdir().unwrap();
        let app = temp.path().join("Cavalry.app");
        let state = temp.path().join("state");
        fs::create_dir(&app).unwrap();
        fs::create_dir(&state).unwrap();
        let app = app.canonicalize().unwrap();
        let state = state.canonicalize().unwrap();
        (temp, app, state)
    }

    fn valid_owner(app: &Path, schema_version: u32) -> RuntimeOwner {
        let source_sha256 = (schema_version >= 2).then(|| "b".repeat(64));
        let slots = controlled_paths(app, schema_version)
            .into_iter()
            .map(|path| {
                let relative = path_string(path.strip_prefix(app).unwrap()).unwrap();
                (
                    relative,
                    ExpectedFileState {
                        fingerprint: Some(FileFingerprint {
                            sha256: "c".repeat(64),
                            mode: libc::S_IFREG as u32 | 0o755,
                        }),
                    },
                )
            })
            .collect();
        RuntimeOwner {
            schema_version,
            install_root: app.to_string_lossy().into_owned(),
            baseline_id: "a".repeat(64),
            operation_id: "fixture-owner".into(),
            runtime_source_sha256: source_sha256,
            slots,
        }
    }

    fn write_owner(state: &Path, owner: &RuntimeOwner) {
        let path = state.join(OWNER_NAME);
        fs::write(&path, serde_json::to_vec(owner).unwrap()).unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o600)).unwrap();
    }

    #[test]
    fn owner_hint_accepts_v1_v2_and_v3_without_reading_runtime_slots() {
        for (schema_version, source_sha256) in [
            (1, None),
            (2, Some("b".repeat(64))),
            (3, Some("b".repeat(64))),
        ] {
            let (_temp, app, state) = fixture();
            write_owner(&state, &valid_owner(&app, schema_version));

            let hint = native_runtime_owner_hint_for_selection(&state, &app).unwrap();

            assert!(hint.owned);
            assert_eq!(hint.source_sha256.as_deref(), source_sha256.as_deref());
        }
    }

    #[test]
    fn owner_hint_distinguishes_absence_from_invalid_or_wrong_root_owner() {
        let (_temp, app, state) = fixture();
        assert_eq!(
            native_runtime_owner_hint_for_selection(&state, &app).unwrap(),
            NativeRuntimeOwnerHint {
                owned: false,
                source_sha256: None,
            }
        );

        fs::write(state.join(OWNER_NAME), b"not-json").unwrap();
        fs::set_permissions(state.join(OWNER_NAME), fs::Permissions::from_mode(0o600)).unwrap();
        assert!(native_runtime_owner_hint_for_selection(&state, &app).is_err());

        let mut bad_schema = valid_owner(&app, 2);
        bad_schema.schema_version = 1;
        write_owner(&state, &bad_schema);
        assert!(native_runtime_owner_hint_for_selection(&state, &app).is_err());

        let wrong_root = tempdir_app_for_wrong_root(&app);
        write_owner(&state, &wrong_root);
        assert!(native_runtime_owner_hint_for_selection(&state, &app).is_err());
    }

    fn tempdir_app_for_wrong_root(app: &Path) -> RuntimeOwner {
        let mut owner = valid_owner(app, 2);
        owner.install_root = app
            .with_extension("other.app")
            .to_string_lossy()
            .into_owned();
        owner
    }
}
