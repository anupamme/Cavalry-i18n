/**
 * [INPUT]: 依赖 cavalry_i18n_tauri::commands 的注册表与跨平台序列化 payload
 * [OUTPUT]: 对外提供 command 名称、权限动作、platform、Status 补丁回执状态/版本兼容/官方恢复能力/owned native English restore capability/受控nativeLocaleState与固定 false的旧macOS handoff hint、Action restore-only结果、About固定窗口尺寸与创建时原生交通灯配置/Windows main-owner生命周期、稳定errorCode、可组合warningCodes、Windows residue、Updater DTO与camelCase JSON shape contract tests
 * [POS]: src-tauri/tests 的 renderer API 守门，保持九命令和旧字段兼容，并显式暴露平台差异、Managed Legacy/版本只读字段、固定项目外链、可本土化错误、Windows runtime residue 与脱敏更新状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use cavalry_i18n_tauri::commands::{
    registered_command_names, ActionPayload, NativeLocaleState, StatusPayload, UpdatePayload,
};
use std::{fs, path::Path};

#[test]
fn registers_nine_commands_for_renderer_bridge() {
    assert_eq!(
        registered_command_names(),
        &[
            "get_status",
            "browse_app",
            "apply_language",
            "open_privacy_security",
            "open_project_link",
            "show_about",
            "restart_cavalry",
            "check_update",
            "install_update"
        ]
    );
}

#[test]
fn updater_commands_are_registered_in_the_rust_builder() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let lib_rs = fs::read_to_string(manifest_dir.join("src/lib.rs")).unwrap();

    assert!(lib_rs.contains("tauri_plugin_updater::Builder::new().build()"));
    assert!(lib_rs.contains("commands::check_update"));
    assert!(lib_rs.contains("commands::install_update"));
}

#[test]
fn macos_and_windows_about_entries_share_one_native_window_owner() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let lib_rs = fs::read_to_string(manifest_dir.join("src/lib.rs")).unwrap();
    let about_rs = fs::read_to_string(manifest_dir.join("src/about_window.rs")).unwrap();

    assert!(lib_rs.contains("fn build_macos_menu"));
    assert!(lib_rs.contains("app_menu.remove_at(0)?"));
    assert!(lib_rs.contains("MACOS_ABOUT_MENU_ID"));
    assert!(lib_rs.contains("about_window::show_about_window(app)"));
    assert!(lib_rs.contains("commands::show_about"));
    assert!(!lib_rs.contains("cavalryI18nShowAbout"));
    assert!(about_rs.contains("ABOUT_WINDOW_LABEL: &str = \"about\""));
    assert!(about_rs.contains("ABOUT_BODY_WIDTH: f64 = 288.0"));
    assert!(about_rs.contains("ABOUT_BODY_HEIGHT: f64 = 314.0"));
    assert!(about_rs.contains("ABOUT_TITLEBAR_HEIGHT: f64 = 40.0"));
    assert!(about_rs.contains("WINDOW_SHADOW_INSET: f64 = 10.0"));
    assert!(
        about_rs.contains("ABOUT_BODY_HEIGHT + ABOUT_TITLEBAR_HEIGHT + WINDOW_SHADOW_INSET * 2.0")
    );
    assert!(about_rs.contains("ABOUT_BODY_HEIGHT + ABOUT_TITLEBAR_HEIGHT;"));
    assert_eq!(
        314.0_f64 + 40.0,
        354.0,
        "macOS About content plus Overlay titlebar"
    );
    assert_eq!(
        314.0_f64 + 40.0 + 10.0 * 2.0,
        374.0,
        "Windows About plus compositor shadow inset"
    );
    assert!(about_rs.contains("WebviewUrl::App(\"about.html\".into())"));
    assert!(about_rs.contains(".initialization_script(ABOUT_PLATFORM_INIT_SCRIPT)"));
    assert!(about_rs.contains(".title_bar_style(tauri::TitleBarStyle::Overlay)"));
    assert!(about_rs.contains(".hidden_title(true)"));
    assert!(about_rs.contains(".traffic_light_position(tauri::LogicalPosition::new(13.0, 22.0))"));
    assert!(about_rs.contains(".transparent(true)"));
    assert!(about_rs.contains(".shadow(false)"));
    assert!(about_rs.contains("WINDOW_SHADOW_INSET: f64 = 10.0"));
    assert!(about_rs.contains("ABOUT_TITLEBAR_HEIGHT: f64 = 40.0"));
    assert!(about_rs.contains("fn position_over_main("));
    assert!(about_rs.contains(".outer_position()"));
    assert!(about_rs.contains(".outer_size()"));
    assert!(about_rs.contains(".current_monitor()"));
    assert!(about_rs.contains(".set_position(tauri::PhysicalPosition::new("));
    assert!(about_rs.contains(".visible(false)"));
    assert!(
        about_rs.contains(".owner(&main)"),
        "Windows About must be owned by main so closing main destroys it"
    );
    for option in [
        ".resizable(false)",
        ".maximizable(false)",
        ".minimizable(false)",
    ] {
        assert!(about_rs.contains(option), "About owner must set {option}");
    }
    assert!(about_rs.contains("builder.decorations(true)"));
    assert!(about_rs.contains(".decorations(false)"));
}

#[test]
fn updater_payload_is_camel_case_and_never_exposes_plugin_secrets() {
    let payload = UpdatePayload {
        current_version: "0.7.0".into(),
        version: Some("0.7.1".into()),
        notes: Some("Bug fixes".into()),
        pub_date: Some("2026-08-28T00:00:00.000Z".into()),
        available: true,
        error_code: None,
    };
    let value = serde_json::to_value(payload).unwrap();
    let object = value.as_object().unwrap();

    assert_eq!(object.len(), 6);
    assert_eq!(value["currentVersion"], "0.7.0");
    assert_eq!(value["version"], "0.7.1");
    assert_eq!(value["notes"], "Bug fixes");
    assert_eq!(value["pubDate"], "2026-08-28T00:00:00.000Z");
    assert_eq!(value["available"], true);
    assert_eq!(value["errorCode"], serde_json::Value::Null);
    assert!(value.get("url").is_none());
    assert!(value.get("signature").is_none());
    assert!(value.get("rawJson").is_none());
}

#[test]
fn command_payload_uses_renderer_compatible_camel_case() {
    let payload = ActionPayload {
        ok: true,
        count: None,
        current_lang: Some("zh-Hans".into()),
        warning: Some(
            "Language files were applied; cleanup residual remains at C:\\Temp\\backup".into(),
        ),
        permission_required: true,
        reconciliation_required: true,
        native_restore_only: false,
        error: None,
        error_code: Some("cavalryStillRunning".into()),
        warning_code: Some("restartFailed".into()),
        warning_codes: vec!["restartFailed".into(), "temporaryCleanupPending".into()],
    };
    let value = serde_json::to_value(payload).unwrap();
    assert_eq!(value["ok"], true);
    assert_eq!(value["currentLang"], "zh-Hans");
    assert_eq!(
        value["warning"],
        "Language files were applied; cleanup residual remains at C:\\Temp\\backup"
    );
    assert_eq!(value["permissionRequired"], true);
    assert_eq!(value["reconciliationRequired"], true);
    assert!(value.get("nativeRestoreOnly").is_none());
    assert_eq!(value["errorCode"], "cavalryStillRunning");
    assert_eq!(value["warningCode"], "restartFailed");
    assert_eq!(
        value["warningCodes"],
        serde_json::json!(["restartFailed", "temporaryCleanupPending"])
    );
    assert!(value.get("current_lang").is_none());
    assert!(value.get("permission_required").is_none());
    assert!(value.get("error_code").is_none());
    assert!(value.get("warning_codes").is_none());
}

fn status_payload(
    language_scope: &str,
    native_locale_state: Option<NativeLocaleState>,
) -> StatusPayload {
    StatusPayload {
        language_scope: language_scope.into(),
        native_resource_available: true,
        native_english_restore_available: false,
        app_management_granted: Some(true),
        app_path: "/Applications/Cavalry.app".into(),
        current_lang: "en".into(),
        patch_status: "notApplicable".into(),
        installation_mode: "official".into(),
        native_locale_state,
        macos_permission_handoff_required: false,
        official_recovery_available: true,
        default_app_candidates: Vec::new(),
        diagnostics: None,
        languages: Vec::new(),
        needs_extract: false,
        permission_action: "openPrivacy".into(),
        platform: "macos".into(),
        reconciliation_required: true,
        repo_root: "/repo".into(),
        supported_version: "2.7.2".into(),
        version: "2.3.4".into(),
        version_compatibility: "olderUnsupported".into(),
    }
}

#[test]
fn status_payload_keeps_permission_probe_and_omits_inactive_legacy_handoff_hint() {
    let payload = status_payload("installation", None);
    let value = serde_json::to_value(payload).unwrap();
    assert_eq!(value["appManagementGranted"], true);
    assert_eq!(value["permissionAction"], "openPrivacy");
    assert_eq!(value["platform"], "macos");
    assert_eq!(value["patchStatus"], "notApplicable");
    assert!(value.get("nativeEnglishRestoreAvailable").is_none());
    assert_eq!(value["languageScope"], "installation");
    assert_eq!(value["nativeResourceAvailable"], true);
    assert!(
        value.get("nativeLocaleState").is_none(),
        "legacy installation status must omit native-only locale observation"
    );
    assert!(value.get("native_locale_state").is_none());
    assert!(value.get("patch_status").is_none());
    assert_eq!(value["reconciliationRequired"], true);
    assert_eq!(value["installationMode"], "official");
    assert!(value.get("macosPermissionHandoffRequired").is_none());
    assert_eq!(value["officialRecoveryAvailable"], true);
    assert_eq!(value["supportedVersion"], "2.7.2");
    assert_eq!(value["versionCompatibility"], "olderUnsupported");
    assert!(value.get("app_management_granted").is_none());
}

#[test]
fn native_locale_state_is_camel_case_and_native_profile_only() {
    let payload = status_payload("userProfile", Some(NativeLocaleState::Unset));
    let value = serde_json::to_value(payload).unwrap();
    assert_eq!(value["nativeLocaleState"], "unset");
    assert!(value.get("native_locale_state").is_none());
}

#[test]
fn native_locale_state_has_only_controlled_camel_case_values() {
    assert_eq!(
        serde_json::to_value(NativeLocaleState::Unset).unwrap(),
        "unset"
    );
    assert_eq!(
        serde_json::to_value(NativeLocaleState::Explicit).unwrap(),
        "explicit"
    );
    assert_eq!(
        serde_json::to_value(NativeLocaleState::Unrecognized).unwrap(),
        "unrecognized"
    );
}
