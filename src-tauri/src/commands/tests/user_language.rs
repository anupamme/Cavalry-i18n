/**
 * [INPUT]: 依赖纯用户 locale 投影模块与 serde_json 值。
 * [OUTPUT]: 固定产品语言码映射、typed locale 单键变更与 schema 拒绝、缺键/完整前像回滚、精确 CAS 漂移保护及固定 English 投影。
 * [POS]: commands/tests 的无副作用数据合同；不读写磁盘、不连接 IPC、不探测或启动 Cavalry。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::commands::user_language::{
    apply_native_language, native_locale_for, restore_english_if_unchanged,
    rollback_native_language_if_unchanged, LocaleRestoreOutcome,
};
use serde_json::{json, Value};

#[test]
fn product_language_codes_map_to_native_locale_tags() {
    for (product, native) in [
        ("en", "en-GB"),
        ("zh-Hans", "zh-Hans"),
        ("zh-Hant", "zh-Hant"),
        ("ja_JP", "ja"),
    ] {
        assert_eq!(native_locale_for(product).unwrap(), native, "{product}");
    }
    assert!(native_locale_for("unknown").is_err());
}

#[test]
fn applying_language_changes_only_the_typed_locale_value() {
    let original_locale = json!({
        "varType": "string",
        "value": "fr-FR",
        "vendorMetadata": {"keep": true}
    });
    let mut preferences = json!({
        "locale": original_locale,
        "cavalryVersion": {"varType": "string", "value": "2.8.0"},
        "workspace": {"theme": "dark", "custom": [1, 2, 3]}
    });
    let unrelated_before = json!({
        "cavalryVersion": preferences["cavalryVersion"],
        "workspace": preferences["workspace"]
    });

    let change = apply_native_language(&mut preferences, "ja_JP").unwrap();

    assert_eq!(
        preferences["locale"],
        json!({
            "varType": "string",
            "value": "ja",
            "vendorMetadata": {"keep": true}
        })
    );
    assert_eq!(
        json!({
            "cavalryVersion": preferences["cavalryVersion"],
            "workspace": preferences["workspace"]
        }),
        unrelated_before
    );
    assert_eq!(change.previous_locale, Some(original_locale));
    assert_eq!(change.written_locale, preferences["locale"]);
}

#[test]
fn rollback_restores_the_exact_typed_locale_preimage() {
    let original_locale = json!({
        "varType": "string",
        "value": "fr-FR",
        "vendorMetadata": "preserve exactly"
    });
    let mut preferences = json!({"locale": original_locale});
    let change = apply_native_language(&mut preferences, "zh-Hans").unwrap();

    assert_eq!(
        rollback_native_language_if_unchanged(&mut preferences, &change).unwrap(),
        LocaleRestoreOutcome::Restored
    );
    assert_eq!(preferences["locale"], original_locale);
}

#[test]
fn rollback_removes_locale_when_its_preimage_had_no_key() {
    let mut preferences = json!({"workspace": {"name": "user data"}});
    let change = apply_native_language(&mut preferences, "zh-Hans").unwrap();
    assert_eq!(change.previous_locale, None);

    assert_eq!(
        rollback_native_language_if_unchanged(&mut preferences, &change).unwrap(),
        LocaleRestoreOutcome::Restored
    );
    assert!(preferences.get("locale").is_none());
    assert_eq!(preferences["workspace"]["name"], "user data");
}

#[test]
fn restore_english_uses_native_english_not_the_saved_locale() {
    let mut preferences = json!({
        "locale": {
            "varType": "string",
            "value": "fr-FR",
            "vendorMetadata": {"preserve": true}
        },
        "workspace": {"name": "keep"}
    });
    let change = apply_native_language(&mut preferences, "zh-Hans").unwrap();

    assert_eq!(
        restore_english_if_unchanged(&mut preferences, &change).unwrap(),
        LocaleRestoreOutcome::Restored
    );
    assert_eq!(
        preferences["locale"],
        json!({
            "varType": "string",
            "value": "en-GB",
            "vendorMetadata": {"preserve": true}
        })
    );
    assert_ne!(
        preferences["locale"]["value"],
        change.previous_locale.unwrap()["value"]
    );
    assert_eq!(preferences["workspace"]["name"], "keep");
}

#[test]
fn restore_english_without_a_locale_preimage_still_sets_native_english() {
    let mut preferences = json!({"workspace": {"name": "keep"}});
    let change = apply_native_language(&mut preferences, "zh-Hans").unwrap();
    assert_eq!(change.previous_locale, None);

    assert_eq!(
        restore_english_if_unchanged(&mut preferences, &change).unwrap(),
        LocaleRestoreOutcome::Restored
    );
    assert_eq!(
        preferences["locale"],
        json!({"varType": "string", "value": "en-GB"})
    );
    assert_eq!(preferences["workspace"]["name"], "keep");
}

#[derive(Clone, Copy)]
enum LocaleDrift {
    ValueChanged,
    MetadataOnly,
    Removed,
    Malformed,
}

impl LocaleDrift {
    fn name(self) -> &'static str {
        match self {
            Self::ValueChanged => "value changed",
            Self::MetadataOnly => "metadata changed only",
            Self::Removed => "locale key removed",
            Self::Malformed => "locale became malformed",
        }
    }

    fn apply(self, preferences: &mut Value) {
        match self {
            Self::ValueChanged => {
                preferences["locale"]["value"] = json!("ja-JP");
            }
            Self::MetadataOnly => {
                preferences["locale"]["vendorMetadata"]["userEdited"] = json!(true);
            }
            Self::Removed => {
                preferences.as_object_mut().unwrap().remove("locale");
            }
            Self::Malformed => {
                preferences["locale"] = json!(["user", "data"]);
            }
        }
    }
}

#[test]
fn locale_drift_is_preserved_by_rollback_and_english_restore() {
    for drift in [
        LocaleDrift::ValueChanged,
        LocaleDrift::MetadataOnly,
        LocaleDrift::Removed,
        LocaleDrift::Malformed,
    ] {
        let initial = json!({
            "locale": {
                "varType": "string",
                "value": "fr-FR",
                "vendorMetadata": {"vendor": true}
            },
            "workspace": {"name": "keep"}
        });

        let mut rollback_preferences = initial.clone();
        let rollback_change = apply_native_language(&mut rollback_preferences, "zh-Hans").unwrap();
        drift.apply(&mut rollback_preferences);
        let rollback_before = rollback_preferences.clone();
        assert_eq!(
            rollback_native_language_if_unchanged(&mut rollback_preferences, &rollback_change)
                .unwrap(),
            LocaleRestoreOutcome::UserChangePreserved,
            "rollback: {}",
            drift.name()
        );
        assert_eq!(
            rollback_preferences,
            rollback_before,
            "rollback: {}",
            drift.name()
        );

        let mut english_preferences = initial.clone();
        let english_change = apply_native_language(&mut english_preferences, "zh-Hans").unwrap();
        drift.apply(&mut english_preferences);
        let english_before = english_preferences.clone();
        assert_eq!(
            restore_english_if_unchanged(&mut english_preferences, &english_change).unwrap(),
            LocaleRestoreOutcome::UserChangePreserved,
            "Restore English: {}",
            drift.name()
        );
        assert_eq!(
            english_preferences,
            english_before,
            "Restore English: {}",
            drift.name()
        );
    }
}

#[test]
fn malformed_preferences_roots_are_rejected_without_mutation() {
    for mut preferences in [Value::Null, json!([{"locale": "en-GB"}])] {
        let before = preferences.clone();
        assert!(apply_native_language(&mut preferences, "ja_JP").is_err());
        assert_eq!(preferences, before);
    }
}

#[test]
fn malformed_typed_locales_are_rejected_without_mutation() {
    for (label, locale) in [
        ("scalar", json!("en-GB")),
        ("null", Value::Null),
        ("array", json!([])),
        ("missing varType", json!({"value": "en-GB"})),
        ("missing value", json!({"varType": "string"})),
        ("wrong varType", json!({"varType": "integer", "value": 4})),
        ("non-string value", json!({"varType": "string", "value": 4})),
    ] {
        let mut preferences = json!({
            "locale": locale,
            "workspace": {"name": "keep"}
        });
        let before = preferences.clone();
        assert!(
            apply_native_language(&mut preferences, "ja_JP").is_err(),
            "accepted malformed locale: {label}"
        );
        assert_eq!(preferences, before, "mutated malformed locale: {label}");
    }
}

#[test]
fn unsupported_language_is_rejected_without_mutation() {
    let mut preferences = json!({
        "locale": {"varType": "string", "value": "fr-FR"},
        "workspace": {"name": "keep"}
    });
    let before = preferences.clone();

    assert!(apply_native_language(&mut preferences, "unsupported").is_err());
    assert_eq!(preferences, before);
}
