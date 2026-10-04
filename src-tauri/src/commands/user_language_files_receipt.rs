/**
 * [INPUT]: 依赖固定 UserLanguagePaths、typed locale 映像及受限 native UI-text pack。
 * [OUTPUT]: 验证回执路径/目录所有权/动作、非空事务状态、语言到 typed locale/postimage 与 pack 的关系；投影 locale 和 owned current/drift/pending/none，并为 current 提供 active strings SHA-256。
 * [POS]: 文件事务的语义验证边界；不执行文件写入、不解析通用路径、不把未知 locale 推断为 English，也不暴露前像/路径/原始未知值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::fs;

use super::paths::validate_relative_directory;
use super::{
    path_identity, read_user_image, Receipt, TransitionAction, UserImage, UserLanguagePaths,
    RECEIPT_SCHEMA_VERSION,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum LocaleObservation {
    Absent,
    Known {
        product_language: &'static str,
        native_locale: &'static str,
    },
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ReceiptObservation {
    None,
    Current {
        language: String,
        active_strings_sha256: String,
    },
    Drifted {
        language: String,
    },
    Pending {
        language: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UserProfileProjection {
    pub(crate) locale: LocaleObservation,
    pub(crate) ownership: ReceiptObservation,
}

pub(crate) fn read_profile_projection(
    paths: &UserLanguagePaths,
) -> Result<UserProfileProjection, String> {
    super::paths::validate_paths(paths)?;
    let receipt = read_projection_receipt(paths)?;
    let current = read_user_image(paths)?;
    let locale = observe_locale(current.locale.as_ref());
    let ownership = match receipt {
        None => ReceiptObservation::None,
        Some(receipt) => match receipt.pending {
            Some(pending) => ReceiptObservation::Pending {
                language: pending
                    .language
                    .or_else(|| receipt.active.map(|active| active.language)),
            },
            None => match receipt.active {
                Some(active) if current == active.image => {
                    let strings = active.image.strings.as_ref().ok_or_else(|| {
                        "validated active user-language receipt lost its strings image".to_string()
                    })?;
                    ReceiptObservation::Current {
                        language: active.language,
                        active_strings_sha256: format!("{:x}", Sha256::digest(&strings.bytes)),
                    }
                }
                Some(active) => ReceiptObservation::Drifted {
                    language: active.language,
                },
                None => ReceiptObservation::None,
            },
        },
    };
    Ok(UserProfileProjection { locale, ownership })
}

fn read_projection_receipt(paths: &UserLanguagePaths) -> Result<Option<Receipt>, String> {
    match fs::symlink_metadata(&paths.state_root) {
        Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => Err(format!(
            "Switcher state root is not a real directory: {}",
            paths.state_root.display()
        )),
        Ok(_) => super::storage::read_receipt(paths),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound && !paths.writable => Ok(None),
        Err(error) => Err(super::storage::permission_error(
            &format!(
                "could not inspect Switcher state directory {}",
                paths.state_root.display()
            ),
            error,
        )),
    }
}

fn observe_locale(locale: Option<&Value>) -> LocaleObservation {
    let Some(locale) = locale else {
        return LocaleObservation::Absent;
    };
    let Some(object) = locale.as_object() else {
        return LocaleObservation::Unknown;
    };
    if object.get("varType").and_then(Value::as_str) != Some("string") {
        return LocaleObservation::Unknown;
    }
    let Some(native_locale) = object.get("value").and_then(Value::as_str) else {
        return LocaleObservation::Unknown;
    };
    let (product_language, native_locale) = match native_locale {
        "en-GB" => ("en", "en-GB"),
        "zh-Hans" => ("zh-Hans", "zh-Hans"),
        "zh-Hant" => ("zh-Hant", "zh-Hant"),
        "ja" => ("ja_JP", "ja"),
        _ => return LocaleObservation::Unknown,
    };
    LocaleObservation::Known {
        product_language,
        native_locale,
    }
}

/// 应用共享的原生资源闭包：仅允许单条目标语言 strings 记录中的 UI-text。
pub(super) fn validate_native_pack(product_language: &str, bytes: &[u8]) -> Result<(), String> {
    let native_locale = super::super::user_language::native_locale_for(product_language)?;
    if product_language == "en" {
        return Err("English is a restore action, not a user language pack".to_string());
    }
    let document: Value = serde_json::from_slice(bytes)
        .map_err(|error| format!("native language pack is invalid JSON: {error}"))?;
    let records = document
        .as_array()
        .filter(|records| records.len() == 1)
        .ok_or_else(|| {
            "native language pack must contain exactly one strings record".to_string()
        })?;
    let record = records[0]
        .as_object()
        .filter(|record| record.len() == 3)
        .ok_or_else(|| "native language pack record has an invalid shape".to_string())?;
    if record.get("type").and_then(Value::as_str) != Some("strings") {
        return Err("native language pack record type must be strings".to_string());
    }
    if record.get("language").and_then(Value::as_str) != Some(native_locale) {
        return Err(format!(
            "native language pack locale does not match target {product_language}"
        ));
    }
    let values = record
        .get("value")
        .and_then(Value::as_object)
        .filter(|values| !values.is_empty())
        .ok_or_else(|| "native strings value must contain UI-text entries".to_string())?;
    for (key, leaf) in values {
        let leaf = leaf
            .as_object()
            .filter(|leaf| leaf.len() == 1)
            .ok_or_else(|| format!("native string {key:?} must contain only UI-text"))?;
        leaf.get("UI-text")
            .and_then(Value::as_str)
            .filter(|text| !text.trim().is_empty())
            .ok_or_else(|| format!("native string {key:?} has invalid UI-text"))?;
    }
    Ok(())
}

pub(super) fn validate_receipt(paths: &UserLanguagePaths, receipt: &Receipt) -> Result<(), String> {
    if receipt.schema_version != RECEIPT_SCHEMA_VERSION {
        return Err(format!(
            "unsupported user-language receipt schema {}",
            receipt.schema_version
        ));
    }
    if receipt.preferences_path != path_identity(&paths.preferences)
        || receipt.strings_path != path_identity(&paths.strings)
    {
        return Err("user-language receipt is bound to different profile paths".to_string());
    }
    if receipt.active.is_none() && receipt.pending.is_none() {
        return Err(
            "user-language receipt has neither an active image nor a pending transition".into(),
        );
    }
    let mut allowed_directories = Vec::new();
    let mut directory = paths
        .strings
        .parent()
        .ok_or_else(|| "strings.json has no parent directory".to_string())?;
    loop {
        if directory == paths.profile_root {
            break;
        }
        directory
            .strip_prefix(&paths.profile_root)
            .map_err(|_| "strings.json parent escaped its resolved profile root".to_string())?;
        allowed_directories.push(directory.to_path_buf());
        directory = directory
            .parent()
            .ok_or_else(|| "strings.json parent escaped its profile root".to_string())?;
    }
    allowed_directories.reverse();
    let mut previous_owned_index = None;
    for directory in &receipt.created_directories {
        validate_relative_directory(directory)?;
        let directory_path = paths.profile_root.join(directory);
        let Some(owned_index) = allowed_directories
            .iter()
            .position(|allowed| directory_path == *allowed)
        else {
            return Err(format!(
                "user-language receipt claims a directory outside its owned plugin path: {directory:?}"
            ));
        };
        if previous_owned_index.is_some_and(|previous| owned_index <= previous) {
            return Err(
                "user-language receipt has duplicate or out-of-order owned directories".to_string(),
            );
        }
        previous_owned_index = Some(owned_index);
    }
    validate_locale_preimage(receipt.preimage.locale.as_ref(), "preimage")?;
    if receipt.preimage.strings.is_some() {
        return Err(
            "user-language receipt cannot claim an unproven preexisting strings resource".into(),
        );
    }
    if let Some(active) = &receipt.active {
        let native_locale = native_locale_for_active(&active.language)?;
        if active.image.strings.is_none()
            || !locale_matches_native(active.image.locale.as_ref(), native_locale)
        {
            return Err(
                "active user-language receipt has an invalid language/locale/strings postimage"
                    .to_string(),
            );
        }
        validate_locale_preimage(active.image.locale.as_ref(), "active postimage")?;
        if let Some(strings) = &active.image.strings {
            validate_native_pack(&active.language, &strings.bytes)?;
        }
    }
    if let Some(pending) = &receipt.pending {
        validate_locale_preimage(pending.before.locale.as_ref(), "pending before image")?;
        validate_locale_preimage(pending.after.locale.as_ref(), "pending after image")?;
        match pending.action {
            TransitionAction::Apply => {
                let language = pending.language.as_deref().ok_or_else(|| {
                    "pending user-language apply is missing its language".to_string()
                })?;
                let native_locale = native_locale_for_active(language)?;
                let expected_before = receipt
                    .active
                    .as_ref()
                    .map(|active| &active.image)
                    .unwrap_or(&receipt.preimage);
                let expected_locale = project_locale(pending.before.locale.as_ref(), language)?;
                if pending.before != *expected_before
                    || pending.after.locale != expected_locale
                    || pending.after.strings.is_none()
                    || !locale_matches_native(pending.after.locale.as_ref(), native_locale)
                {
                    return Err(
                        "pending apply does not match its language projection or recorded preimage"
                            .to_string(),
                    );
                }
                let strings = pending.after.strings.as_ref().ok_or_else(|| {
                    "pending apply is missing its Switcher strings postimage".to_string()
                })?;
                validate_native_pack(language, &strings.bytes)?;
            }
            TransitionAction::Rollback => {
                let active = receipt.active.as_ref().ok_or_else(|| {
                    "pending rollback has no committed active postimage".to_string()
                })?;
                if pending.language.is_some()
                    || pending.before != active.image
                    || pending.after != receipt.preimage
                {
                    return Err(
                        "pending rollback does not match its active image and original preimage"
                            .to_string(),
                    );
                }
            }
            TransitionAction::RestoreEnglish => {
                let active = receipt.active.as_ref().ok_or_else(|| {
                    "pending English restore has no committed active postimage".to_string()
                })?;
                let expected_locale = project_locale(active.image.locale.as_ref(), "en")?;
                let expected_after = UserImage {
                    locale: expected_locale,
                    strings: receipt.preimage.strings.clone(),
                };
                if pending.language.is_some()
                    || pending.before != active.image
                    || pending.after != expected_after
                {
                    return Err(
                        "pending English restore does not match the fixed en-GB projection and original resource"
                            .to_string(),
                    );
                }
            }
        }
    }
    Ok(())
}

fn validate_locale_preimage(locale: Option<&Value>, role: &str) -> Result<(), String> {
    let Some(locale) = locale else {
        return Ok(());
    };
    let valid_typed_string = locale
        .as_object()
        .map(|object| {
            object.get("varType").and_then(Value::as_str) == Some("string")
                && object.get("value").and_then(Value::as_str).is_some()
        })
        .unwrap_or(false);
    if !valid_typed_string {
        return Err(format!(
            "user-language receipt {role} locale is not a typed string"
        ));
    }
    Ok(())
}

fn native_locale_for_active(language: &str) -> Result<&'static str, String> {
    if language == "en" {
        return Err("English is a restore action, not an active user language pack".to_string());
    }
    super::super::user_language::native_locale_for(language)
}

fn locale_matches_native(locale: Option<&Value>, native_locale: &str) -> bool {
    locale
        .and_then(Value::as_object)
        .map(|object| {
            object.get("varType").and_then(Value::as_str) == Some("string")
                && object.get("value").and_then(Value::as_str) == Some(native_locale)
        })
        .unwrap_or(false)
}

pub(super) fn project_locale(
    locale: Option<&Value>,
    language: &str,
) -> Result<Option<Value>, String> {
    let mut preferences = Value::Object(serde_json::Map::new());
    if let Some(locale) = locale {
        preferences
            .as_object_mut()
            .ok_or_else(|| "internal preference projection is not an object".to_string())?
            .insert("locale".to_string(), locale.clone());
    }
    let change = super::super::user_language::apply_native_language(&mut preferences, language)?;
    Ok(Some(change.written_locale))
}
