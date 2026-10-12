/**
 * [INPUT]: 依赖固定 Cavalry user-home/state 路径、Preferences 与 Switcher 专属 strings、typed locale 投影及调用方提供的 closed-writer guard。
 * [OUTPUT]: 事务化应用合法 native UI-text pack、固定 en-GB restore、严格Current-owned hostless restore-only入口、pending 恢复与只读 profile projection；测试 fixture 仅用于隔离验证。
 * [POS]: commands/user_language 的受限 profile 文件 owner；apply复用首次验证且无pending的receipt，只有pending恢复路径再读回磁盘。
 * 事务比较active前像并保留hostless English的bytes+mode发布期望；path binding不证明writer closed，生产facade持锁并在每个写边界提供guard。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;

#[path = "user_language_files_paths.rs"]
mod paths;
#[path = "user_language_files_receipt.rs"]
mod receipt;
#[path = "user_language_files_storage.rs"]
pub(crate) mod storage;
#[cfg(test)]
pub(crate) use self::paths::fixture_paths;
use self::paths::validate_mutation_paths;
pub(crate) use self::paths::UserLanguagePaths;
use self::receipt::{
    project_locale, validate_native_pack, validate_receipt, UserProfileProjection,
};
pub(crate) use self::receipt::{LocaleObservation, ReceiptObservation};
pub(crate) use self::storage::is_permission_denied;
use self::storage::{
    cleanup_owned_empty_directories, default_private_file_mode, ensure_strings_parent,
    plan_strings_directories, read_optional_image, read_receipt, read_receipt_with_image,
    read_regular_image, remove_receipt, sync_directory_for, write_or_remove_image, write_receipt,
    write_receipt_exact,
};

const RECEIPT_SCHEMA_VERSION: u32 = 1;

#[cfg(test)]
std::thread_local! {
    static APPLY_EXPLICIT_RECEIPT_VALIDATION_COUNT: std::cell::Cell<usize> =
        std::cell::Cell::new(0);
}

#[cfg(test)]
pub(crate) fn reset_apply_explicit_receipt_validation_count() {
    APPLY_EXPLICIT_RECEIPT_VALIDATION_COUNT.with(|count| count.set(0));
}

#[cfg(test)]
pub(crate) fn apply_explicit_receipt_validation_count() -> usize {
    APPLY_EXPLICIT_RECEIPT_VALIDATION_COUNT.with(std::cell::Cell::get)
}

fn validate_apply_receipt(paths: &UserLanguagePaths, receipt: &Receipt) -> Result<(), String> {
    #[cfg(test)]
    APPLY_EXPLICIT_RECEIPT_VALIDATION_COUNT.with(|count| count.set(count.get() + 1));
    validate_receipt(paths, receipt)
}

pub(crate) fn read_profile_projection(
    paths: &UserLanguagePaths,
) -> Result<UserProfileProjection, String> {
    receipt::read_profile_projection(paths)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum CommitOutcome {
    Committed,
    CommittedWithWarning(String),
    PendingWithWarning(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RestoreOutcome {
    Restored,
    RestoredWithWarning(String),
    NothingToRestore,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RecoveryOutcome {
    NothingPending,
    Completed,
    CompletedWithWarning(String),
    PendingWithWarning(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum InterruptAfter {
    DirectoryIntent,
    DirectoryCreate,
    ResourcePublish,
    LocalePublish,
    RecoveryWarning,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Receipt {
    schema_version: u32,
    preferences_path: String,
    strings_path: String,
    preimage: UserImage,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    active: Option<ActiveImage>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pending: Option<PendingTransition>,
    /// 首份 durable 回执记录首个 mkdir 前规划的缺失目录，不追认既有目录。
    #[serde(default)]
    created_directories: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ActiveImage {
    language: String,
    image: UserImage,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct PendingTransition {
    action: TransitionAction,
    before: UserImage,
    after: UserImage,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    language: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
enum TransitionAction {
    Apply,
    Rollback,
    RestoreEnglish,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct UserImage {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    locale: Option<Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    strings: Option<FileImage>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FileImage {
    pub(crate) bytes: Vec<u8>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) mode: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FileCommit {
    Durable,
    VisibleButDurabilityUnproven(String),
}

#[cfg(test)]
pub(crate) fn apply(
    paths: &UserLanguagePaths,
    product_language: &str,
    strings_json: &[u8],
) -> Result<CommitOutcome, String> {
    let mut allow_closed_writer = || Ok(());
    apply_inner(
        paths,
        product_language,
        strings_json,
        &mut allow_closed_writer,
        None,
    )
}

#[cfg(test)]
pub(crate) fn apply_with_interrupt(
    paths: &UserLanguagePaths,
    product_language: &str,
    strings_json: &[u8],
    interrupt_after: Option<InterruptAfter>,
) -> Result<CommitOutcome, String> {
    let mut allow_closed_writer = || Ok(());
    apply_inner(
        paths,
        product_language,
        strings_json,
        &mut allow_closed_writer,
        interrupt_after,
    )
}

/// Production apply requires the facade's exact-PID/no-writer check at every publish boundary.
pub(crate) fn apply_with_writer_guard(
    paths: &UserLanguagePaths,
    product_language: &str,
    strings_json: &[u8],
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<CommitOutcome, String> {
    apply_inner(paths, product_language, strings_json, writer_guard, None)
}

fn apply_inner(
    paths: &UserLanguagePaths,
    product_language: &str,
    strings_json: &[u8],
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
    interrupt_after: Option<InterruptAfter>,
) -> Result<CommitOutcome, String> {
    validate_mutation_paths(paths)?;
    if product_language == "en" {
        return Err("English is a fixed restore action, not a user language pack apply.".into());
    }
    validate_native_pack(product_language, strings_json)?;

    let existing = match read_receipt(paths)? {
        Some(receipt) if receipt.pending.is_none() => Some(receipt),
        Some(mut receipt) => {
            let recovery_injection = (interrupt_after == Some(InterruptAfter::RecoveryWarning))
                .then_some(InterruptAfter::RecoveryWarning);
            resume_pending_before_next_action(
                paths,
                &mut receipt,
                recovery_injection,
                "apply",
                writer_guard,
            )?
        }
        None => None,
    };

    let preference_image = read_regular_image(paths, &paths.preferences, "Cavalry Preferences")?;
    let preferences = parse_preferences(paths, &preference_image.bytes)?;
    let before_locale = locale_value(&preferences)?;
    let after_locale = project_locale(before_locale.as_ref(), product_language)?;
    let before = UserImage {
        locale: before_locale,
        strings: read_optional_image(paths, &paths.strings)?,
    };
    if existing.is_none() && before.strings.is_some() {
        return Err(
            "Switcher strings.json exists without a valid ownership receipt; preserving it".into(),
        );
    }
    let desired_strings = FileImage {
        bytes: strings_json.to_vec(),
        mode: before
            .strings
            .as_ref()
            .and_then(|image| image.mode)
            .or_else(default_private_file_mode),
    };
    let after = UserImage {
        locale: after_locale,
        strings: Some(desired_strings),
    };
    // 先只读规划目录归属，再与原始前像和 pending 一起写入首份耐久回执。
    let planned_directories = plan_strings_directories(paths)?;

    let mut receipt = match existing {
        Some(receipt) => {
            let active = receipt.active.as_ref().ok_or_else(|| {
                "user-language receipt has no committed active generation".to_string()
            })?;
            if before != active.image {
                return Err(
                    "user-owned locale or strings.json drifted after the last Switcher write; preserving both".to_string(),
                );
            }
            receipt
        }
        None => Receipt {
            schema_version: RECEIPT_SCHEMA_VERSION,
            preferences_path: path_identity(&paths.preferences),
            strings_path: path_identity(&paths.strings),
            preimage: before.clone(),
            active: None,
            pending: None,
            created_directories: Vec::new(),
        },
    };

    if receipt.active.is_none() && receipt.pending.is_some() {
        return Err("user-language receipt remained pending after recovery".to_string());
    }
    for directory in planned_directories {
        if !receipt.created_directories.contains(&directory) {
            receipt.created_directories.push(directory);
        }
    }

    receipt.pending = Some(PendingTransition {
        action: TransitionAction::Apply,
        before,
        after,
        language: Some(product_language.to_string()),
    });
    validate_apply_receipt(paths, &receipt)?;
    writer_guard()?;
    require_durable(
        "user-language preimage receipt",
        write_receipt(paths, &receipt)?,
    )?;
    if interrupt_after == Some(InterruptAfter::DirectoryIntent) {
        return Err(
            "simulated process interruption before Switcher directory creation".to_string(),
        );
    }

    complete_pending(paths, &mut receipt, interrupt_after, writer_guard)
}

#[cfg(test)]
pub(crate) fn rollback(paths: &UserLanguagePaths) -> Result<RestoreOutcome, String> {
    let mut allow_closed_writer = || Ok(());
    restore(
        paths,
        TransitionAction::Rollback,
        None,
        false,
        &mut allow_closed_writer,
    )
}

#[cfg(test)]
pub(crate) fn restore_english(paths: &UserLanguagePaths) -> Result<RestoreOutcome, String> {
    let mut allow_closed_writer = || Ok(());
    restore(
        paths,
        TransitionAction::RestoreEnglish,
        None,
        false,
        &mut allow_closed_writer,
    )
}

pub(crate) fn restore_english_with_writer_guard(
    paths: &UserLanguagePaths,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<RestoreOutcome, String> {
    restore(
        paths,
        TransitionAction::RestoreEnglish,
        None,
        false,
        writer_guard,
    )
}

/// 仅从已证明的 active postimage 恢复；不接纳缺失或 pending 回执作为宿主外授权。
pub(crate) fn restore_owned_english_with_writer_guard(
    paths: &UserLanguagePaths,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<RestoreOutcome, String> {
    restore(
        paths,
        TransitionAction::RestoreEnglish,
        None,
        true,
        writer_guard,
    )
}

/// 限定故障 seam：证明 pending 回执且无 active 时，恢复警告不会被折叠成无操作。
#[cfg(test)]
pub(crate) fn rollback_with_recovery_warning(
    paths: &UserLanguagePaths,
) -> Result<RestoreOutcome, String> {
    let mut allow_closed_writer = || Ok(());
    restore(
        paths,
        TransitionAction::Rollback,
        Some(InterruptAfter::RecoveryWarning),
        false,
        &mut allow_closed_writer,
    )
}

fn restore(
    paths: &UserLanguagePaths,
    action: TransitionAction,
    recovery_interrupt: Option<InterruptAfter>,
    require_current_owned: bool,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<RestoreOutcome, String> {
    validate_mutation_paths(paths)?;
    let Some((mut receipt, receipt_image)) = read_receipt_with_image(paths)? else {
        if require_current_owned {
            return Err("owned user-language receipt is required for restore-only".to_string());
        }
        return match action {
            TransitionAction::Rollback => Ok(RestoreOutcome::NothingToRestore),
            TransitionAction::RestoreEnglish => {
                restore_english_without_receipt(paths, writer_guard)
            }
            TransitionAction::Apply => Err("apply is not a restore action".to_string()),
        };
    };
    validate_receipt(paths, &receipt)?;
    if receipt.pending.is_some() {
        if require_current_owned {
            return Err("pending user-language receipt cannot authorize restore-only".to_string());
        }
        let Some(recovered) = resume_pending_before_next_action(
            paths,
            &mut receipt,
            recovery_interrupt,
            "restore",
            writer_guard,
        )?
        else {
            return Ok(RestoreOutcome::NothingToRestore);
        };
        receipt = recovered;
    }
    let Some(active) = receipt.active.clone() else {
        if require_current_owned {
            return Err("active user-language image is required for restore-only".to_string());
        }
        return Ok(RestoreOutcome::NothingToRestore);
    };
    let current = read_user_image(paths)?;
    if current != active.image {
        return Err(
            "user-owned locale or strings.json changed after the Switcher write; preserving both and retaining the receipt".to_string(),
        );
    }

    let after = match action {
        TransitionAction::Rollback => receipt.preimage.clone(),
        TransitionAction::RestoreEnglish => UserImage {
            locale: project_locale(active.image.locale.as_ref(), "en")?,
            strings: receipt.preimage.strings.clone(),
        },
        TransitionAction::Apply => {
            return Err("apply is not a restore action".to_string());
        }
    };

    receipt.pending = Some(PendingTransition {
        action,
        before: active.image,
        after,
        language: None,
    });
    validate_receipt(paths, &receipt)?;
    writer_guard()?;
    let receipt_commit = if require_current_owned {
        write_receipt_exact(paths, &receipt_image, &receipt, writer_guard)?
    } else {
        write_receipt(paths, &receipt)?
    };
    require_durable("user-language restore receipt", receipt_commit)?;
    match complete_pending(paths, &mut receipt, None, writer_guard)? {
        CommitOutcome::Committed => Ok(RestoreOutcome::Restored),
        CommitOutcome::CommittedWithWarning(warning) => {
            Ok(RestoreOutcome::RestoredWithWarning(warning))
        }
        CommitOutcome::PendingWithWarning(warning) => Err(format!(
            "user-language restore remains pending with unproven durability: {warning}"
        )),
    }
}

fn restore_english_without_receipt(
    paths: &UserLanguagePaths,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<RestoreOutcome, String> {
    if read_optional_image(paths, &paths.strings)?.is_some() {
        return Err(
            "Switcher strings.json exists without a valid ownership receipt; preserving it".into(),
        );
    }
    let preferences = read_preferences(paths)?;
    let before = locale_value(&preferences)?;
    let after = project_locale(before.as_ref(), "en")?;
    writer_guard()?;
    match write_locale(paths, &before, &after, writer_guard)? {
        FileCommit::Durable => Ok(RestoreOutcome::Restored),
        FileCommit::VisibleButDurabilityUnproven(detail) => {
            Ok(RestoreOutcome::RestoredWithWarning(format!(
                "Preferences.locale is visible but its directory durability is unproven: {detail}"
            )))
        }
    }
}

#[cfg(test)]
pub(crate) fn recover_interrupted(paths: &UserLanguagePaths) -> Result<RecoveryOutcome, String> {
    let mut allow_closed_writer = || Ok(());
    recover_with_writer_guard(paths, &mut allow_closed_writer)
}

pub(crate) fn recover_with_writer_guard(
    paths: &UserLanguagePaths,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<RecoveryOutcome, String> {
    validate_mutation_paths(paths)?;
    let Some(mut receipt) = read_receipt(paths)? else {
        return Ok(RecoveryOutcome::NothingPending);
    };
    validate_receipt(paths, &receipt)?;
    if receipt.pending.is_none() {
        return Ok(RecoveryOutcome::NothingPending);
    }
    let warning = recover_pending_inner(paths, &mut receipt, None, writer_guard)?;
    let recovered = read_receipt(paths)?;
    if recovered
        .as_ref()
        .is_some_and(|receipt| receipt.pending.is_some())
    {
        return Ok(RecoveryOutcome::PendingWithWarning(warning.unwrap_or_else(
            || "durable receipt remains pending after recovery attempt".to_string(),
        )));
    }
    match warning {
        Some(warning) => Ok(RecoveryOutcome::CompletedWithWarning(warning)),
        None => Ok(RecoveryOutcome::Completed),
    }
}

fn recover_pending_inner(
    paths: &UserLanguagePaths,
    receipt: &mut Receipt,
    interrupt_after: Option<InterruptAfter>,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<Option<String>, String> {
    if receipt.pending.is_none() {
        return Ok(None);
    }
    match complete_pending(paths, receipt, interrupt_after, writer_guard)? {
        CommitOutcome::Committed => Ok(None),
        CommitOutcome::CommittedWithWarning(warning) => Ok(Some(warning)),
        CommitOutcome::PendingWithWarning(warning) => Ok(Some(warning)),
    }
}

/// 恢复旧事务并核对持久回执；任何警告或残留 pending 都禁止开始下一动作。
fn resume_pending_before_next_action(
    paths: &UserLanguagePaths,
    receipt: &mut Receipt,
    interrupt_after: Option<InterruptAfter>,
    next_action: &str,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<Option<Receipt>, String> {
    let warning = recover_pending_inner(paths, receipt, interrupt_after, writer_guard)?;
    let recovered = read_receipt(paths)?;
    let remains_pending = recovered
        .as_ref()
        .is_some_and(|receipt| receipt.pending.is_some());
    if let Some(warning) = warning {
        return Err(format!(
            "previous user-language recovery has unproven durability{}; no new {next_action} started: {warning}",
            if remains_pending { " and remains pending" } else { "" }
        ));
    }
    if remains_pending {
        return Err(format!(
            "previous user-language transaction remains pending; no new {next_action} started"
        ));
    }
    Ok(recovered)
}

fn complete_pending(
    paths: &UserLanguagePaths,
    receipt: &mut Receipt,
    interrupt_after: Option<InterruptAfter>,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<CommitOutcome, String> {
    let pending = receipt
        .pending
        .clone()
        .ok_or_else(|| "user-language transaction has no pending image".to_string())?;
    if interrupt_after == Some(InterruptAfter::RecoveryWarning) {
        return Ok(CommitOutcome::PendingWithWarning(
            "simulated durability uncertainty; persisted pending receipt retained".to_string(),
        ));
    }
    let mut warning = None;

    // Check both owned surfaces before the first write. A drifted peer must not leave a
    // half-reverted or half-applied transaction merely because the other surface still matches.
    let current = read_user_image(paths)?;
    if current.strings != pending.before.strings && current.strings != pending.after.strings {
        return Err(
            "user-owned strings.json matches neither transaction preimage nor postimage; preserving it".to_string(),
        );
    }
    if current.locale != pending.before.locale && current.locale != pending.after.locale {
        return Err(
            "Cavalry Preferences.locale matches neither transaction preimage nor postimage; preserving it".to_string(),
        );
    }

    if pending.after.strings.is_some() {
        ensure_strings_parent(
            paths,
            &receipt.created_directories,
            interrupt_after == Some(InterruptAfter::DirectoryCreate),
            writer_guard,
        )?;
    }

    let current_strings = current.strings;
    if current_strings != pending.after.strings {
        if current_strings != pending.before.strings {
            return Err(
                "user-owned strings.json matches neither transaction preimage nor postimage; preserving it".to_string(),
            );
        }
        match write_or_remove_image(
            paths,
            &paths.strings,
            pending.before.strings.as_ref(),
            pending.after.strings.as_ref(),
            writer_guard,
        )? {
            FileCommit::Durable => {}
            FileCommit::VisibleButDurabilityUnproven(detail) => {
                return Err(format!(
                    "strings.json is visible but its directory durability is unproven: {detail}"
                ));
            }
        }
    }
    if let Some(detail) = sync_directory_for(&paths.strings)? {
        return Err(format!(
            "strings.json is visible but its directory durability is unproven: {detail}"
        ));
    }
    if interrupt_after == Some(InterruptAfter::ResourcePublish) {
        return Err("simulated process interruption after resource publication".to_string());
    }

    let current_locale = read_locale(paths)?;
    if current_locale != pending.after.locale {
        if current_locale != pending.before.locale {
            return Err(
                "Cavalry Preferences.locale matches neither transaction preimage nor postimage; preserving it".to_string(),
            );
        }
        match write_locale(
            paths,
            &pending.before.locale,
            &pending.after.locale,
            writer_guard,
        )? {
            FileCommit::Durable => {}
            FileCommit::VisibleButDurabilityUnproven(detail) => {
                return Ok(CommitOutcome::CommittedWithWarning(format!(
                    "Preferences.locale is visible but its directory durability is unproven: {detail}"
                )));
            }
        }
    } else if let Some(detail) = sync_directory_for(&paths.preferences)? {
        return Ok(CommitOutcome::CommittedWithWarning(format!(
            "Preferences.locale is visible but its directory durability is unproven: {detail}"
        )));
    }
    if interrupt_after == Some(InterruptAfter::LocalePublish) {
        return Err("simulated process interruption after locale publication".to_string());
    }

    match pending.action {
        TransitionAction::Apply => {
            let language = pending
                .language
                .clone()
                .ok_or_else(|| "apply receipt is missing its product language".to_string())?;
            receipt.active = Some(ActiveImage {
                language,
                image: pending.after,
            });
            receipt.pending = None;
            validate_receipt(paths, receipt)?;
            match write_receipt(paths, receipt)? {
                FileCommit::Durable => {}
                FileCommit::VisibleButDurabilityUnproven(detail) => {
                    warning = Some(format!("active receipt durability is unproven: {detail}"));
                }
            }
        }
        TransitionAction::Rollback | TransitionAction::RestoreEnglish => {
            if let Some(detail) =
                cleanup_owned_empty_directories(paths, &receipt.created_directories, writer_guard)?
            {
                return Ok(CommitOutcome::CommittedWithWarning(detail));
            }
            match remove_receipt(paths)? {
                FileCommit::Durable => {}
                FileCommit::VisibleButDurabilityUnproven(detail) => {
                    warning = Some(format!(
                        "restored receipt removal durability is unproven: {detail}"
                    ));
                }
            }
        }
    }

    Ok(match warning {
        Some(warning) => CommitOutcome::CommittedWithWarning(warning),
        None => CommitOutcome::Committed,
    })
}

fn read_preferences(paths: &UserLanguagePaths) -> Result<Value, String> {
    let bytes = read_regular_image(paths, &paths.preferences, "Cavalry Preferences")?.bytes;
    parse_preferences(paths, &bytes)
}

fn parse_preferences(paths: &UserLanguagePaths, bytes: &[u8]) -> Result<Value, String> {
    serde_json::from_slice(bytes).map_err(|error| {
        format!(
            "Cavalry Preferences {} is invalid JSON: {error}",
            paths.preferences.display()
        )
    })
}

fn read_locale(paths: &UserLanguagePaths) -> Result<Option<Value>, String> {
    let preferences = read_preferences(paths)?;
    locale_value(&preferences)
}

fn locale_value(preferences: &Value) -> Result<Option<Value>, String> {
    preferences
        .as_object()
        .map(|object| object.get("locale").cloned())
        .ok_or_else(|| "Cavalry Preferences root is not a JSON object".to_string())
}

fn read_user_image(paths: &UserLanguagePaths) -> Result<UserImage, String> {
    Ok(UserImage {
        locale: read_locale(paths)?,
        strings: read_optional_image(paths, &paths.strings)?,
    })
}

fn write_locale(
    paths: &UserLanguagePaths,
    expected: &Option<Value>,
    desired: &Option<Value>,
    writer_guard: &mut dyn FnMut() -> Result<(), String>,
) -> Result<FileCommit, String> {
    let original_image = read_regular_image(paths, &paths.preferences, "Cavalry Preferences")?;
    let mut preferences: Value = serde_json::from_slice(&original_image.bytes)
        .map_err(|error| format!("Cavalry Preferences is invalid JSON: {error}"))?;
    let object = preferences
        .as_object_mut()
        .ok_or_else(|| "Cavalry Preferences root is not a JSON object".to_string())?;
    if object.get("locale") != expected.as_ref() {
        return Err(
            "Cavalry Preferences.locale changed before atomic update; preserving it".to_string(),
        );
    }
    match desired {
        Some(locale) => {
            object.insert("locale".to_string(), locale.clone());
        }
        None => {
            object.remove("locale");
        }
    }
    let bytes = serde_json::to_vec_pretty(&preferences)
        .map_err(|error| format!("could not encode Cavalry Preferences: {error}"))?;
    write_or_remove_image(
        paths,
        &paths.preferences,
        Some(&original_image),
        Some(&FileImage {
            bytes,
            mode: original_image.mode,
        }),
        writer_guard,
    )
}

fn require_durable(role: &str, commit: FileCommit) -> Result<(), String> {
    match commit {
        FileCommit::Durable => Ok(()),
        FileCommit::VisibleButDurabilityUnproven(detail) => Err(format!(
            "{role} is visible but durability is unproven: {detail}"
        )),
    }
}

pub(super) fn path_identity(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}
