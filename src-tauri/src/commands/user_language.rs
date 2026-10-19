/**
 * [INPUT]: 依赖产品语言码与 Cavalry Preferences 的 JSON `locale` typed value。
 * [OUTPUT]: 为 macOS user-language file owner 提供 native locale 映射与只改 locale.value 的纯投影；按精确写入值 CAS rollback/English helper 仅供测试。
 * [POS]: 用户 Preferences locale 的纯语义边界；只被文件事务投影消费，不接安装 marker、bundle patch、runtime/QPA 或 IPC 状态。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use serde_json::{Map, Value};

const LOCALE_KEY: &str = "locale";
const LOCALE_TYPE_KEY: &str = "varType";
const LOCALE_VALUE_KEY: &str = "value";

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct NativeLocaleChange {
    pub(crate) previous_locale: Option<Value>,
    pub(crate) written_locale: Value,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg(test)]
pub(crate) enum LocaleRestoreOutcome {
    Restored,
    UserChangePreserved,
}

pub(crate) fn native_locale_for(product_language: &str) -> Result<&'static str, String> {
    match product_language {
        "en" => Ok("en-GB"),
        "zh-Hans" => Ok("zh-Hans"),
        "zh-Hant" => Ok("zh-Hant"),
        "ja_JP" => Ok("ja"),
        unsupported => Err(format!("Unsupported product language: {unsupported}")),
    }
}

pub(crate) fn apply_native_language(
    preferences: &mut Value,
    product_language: &str,
) -> Result<NativeLocaleChange, String> {
    let native_locale = native_locale_for(product_language)?;
    let preferences = preferences_object_mut(preferences)?;
    let previous_locale = preferences.get(LOCALE_KEY).cloned();

    match preferences.get_mut(LOCALE_KEY) {
        Some(locale) => {
            let locale = locale
                .as_object_mut()
                .ok_or_else(|| "Cavalry Preferences locale is not a typed object.".to_string())?;
            if locale.get(LOCALE_TYPE_KEY).and_then(Value::as_str) != Some("string")
                || locale
                    .get(LOCALE_VALUE_KEY)
                    .and_then(Value::as_str)
                    .is_none()
            {
                return Err("Cavalry Preferences locale is not a typed string value.".to_string());
            }
            locale.insert(
                LOCALE_VALUE_KEY.to_string(),
                Value::String(native_locale.to_string()),
            );
        }
        None => {
            let mut locale = Map::new();
            locale.insert(
                LOCALE_TYPE_KEY.to_string(),
                Value::String("string".to_string()),
            );
            locale.insert(
                LOCALE_VALUE_KEY.to_string(),
                Value::String(native_locale.to_string()),
            );
            preferences.insert(LOCALE_KEY.to_string(), Value::Object(locale));
        }
    }

    let written_locale = preferences
        .get(LOCALE_KEY)
        .cloned()
        .ok_or_else(|| "Native locale projection did not produce a locale value.".to_string())?;
    Ok(NativeLocaleChange {
        previous_locale,
        written_locale,
    })
}

#[cfg(test)]
pub(crate) fn rollback_native_language_if_unchanged(
    preferences: &mut Value,
    change: &NativeLocaleChange,
) -> Result<LocaleRestoreOutcome, String> {
    let preferences = preferences_object_mut(preferences)?;
    if preferences.get(LOCALE_KEY) != Some(&change.written_locale) {
        return Ok(LocaleRestoreOutcome::UserChangePreserved);
    }

    match &change.previous_locale {
        Some(previous) => {
            preferences.insert(LOCALE_KEY.to_string(), previous.clone());
        }
        None => {
            preferences.remove(LOCALE_KEY);
        }
    }
    Ok(LocaleRestoreOutcome::Restored)
}

#[cfg(test)]
pub(crate) fn restore_english_if_unchanged(
    preferences: &mut Value,
    change: &NativeLocaleChange,
) -> Result<LocaleRestoreOutcome, String> {
    let preferences = preferences_object_mut(preferences)?;
    let Some(current_locale) = preferences.get(LOCALE_KEY) else {
        return Ok(LocaleRestoreOutcome::UserChangePreserved);
    };
    if current_locale != &change.written_locale {
        return Ok(LocaleRestoreOutcome::UserChangePreserved);
    }

    let english = native_locale_for("en")?;
    let mut english_locale = change.written_locale.clone();
    let locale = english_locale
        .as_object_mut()
        .ok_or_else(|| "Recorded Cavalry locale is not a typed object.".to_string())?;
    locale.insert(
        LOCALE_VALUE_KEY.to_string(),
        Value::String(english.to_string()),
    );
    preferences.insert(LOCALE_KEY.to_string(), english_locale);
    Ok(LocaleRestoreOutcome::Restored)
}

fn preferences_object_mut(preferences: &mut Value) -> Result<&mut Map<String, Value>, String> {
    preferences
        .as_object_mut()
        .ok_or_else(|| "Cavalry Preferences root is not a JSON object.".to_string())
}
