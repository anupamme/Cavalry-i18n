/**
 * [INPUT]: 依赖显式native-preview编译、Tauri build-only AppHandle、生产get_status、真实OS home、当前target与人工指定的原厂App；仅locale/strings/receipt全Absent可运行，插件caption1另计入source分母。
 * [OUTPUT]: 人工验证一次真实状态投影与bundle/profile前后摘要，输出有限回执并清理自有state；默认不自动运行。
 * [POS]: examples的只读CLI烟测，不调用product run、不进入GUI事件循环、不建窗口/WebView、不注册写命令，不代验IPC、徽章DOM或Switch/Restore。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#[cfg(target_os = "macos")]
fn main() {
    use cavalry_i18n_tauri::{commands, install};
    use sha2::{Digest, Sha256};
    use std::{
        fs,
        os::unix::{ffi::OsStringExt, fs::PermissionsExt},
        path::Path,
    };
    use tauri::Manager;

    const PLUGIN_CAPTION_SUPPLEMENT_KEYS: u64 = 1;

    // -- 固定只读目标：不使用临时HOME冒充OS用户隔离 --------------------
    let app_path = fs::canonicalize(
        std::env::var_os("CAVALRY_I18N_NATIVE_STATUS_SMOKE_APP")
            .expect("explicitly select CAVALRY_I18N_NATIVE_STATUS_SMOKE_APP"),
    )
    .unwrap();
    assert_eq!(app_path, Path::new("/Applications/Cavalry.app"));
    // OS账户路径与生产owner同源；不开放private API，也不采用HOME覆盖。
    assert_eq!(unsafe { libc::getuid() }, unsafe { libc::geteuid() });
    assert!(!std::env::var_os("CFFIXED_USER_HOME").is_some_and(|value| !value.is_empty()));
    let home = unsafe {
        let account = libc::getpwuid(libc::geteuid());
        assert!(!account.is_null() && !(*account).pw_dir.is_null());
        std::path::PathBuf::from(std::ffi::OsString::from_vec(
            std::ffi::CStr::from_ptr((*account).pw_dir)
                .to_bytes()
                .to_vec(),
        ))
    };
    let preferences = home.join("Library/Preferences/Cavalry/preferences.json");
    let strings = home
        .join("Library/Application Support/Cavalry/Third-Party/Plugins/Cavalry-i18n/strings.json");
    let actual_receipt = home.join("Library/Application Support/com.daftai.cavalry-i18n.native-preview/native-2.8-preview/native-user-language.json");
    // test仅避免与依赖lib重复嵌入Info.plist；配置/真实Wry runtime不换成mock。
    let mut context = tauri::generate_context!(test = true);
    assert_eq!(
        context.config().identifier,
        "com.daftai.cavalry-i18n.native-preview"
    );
    install::validate_no_symlink_components(Path::new("/"), preferences.strip_prefix("/").unwrap())
        .unwrap();
    let profile: serde_json::Value =
        serde_json::from_slice(&fs::read(&preferences).unwrap()).unwrap();
    assert!(profile.as_object().unwrap().get("locale").is_none());
    assert!(!strings.exists() && !actual_receipt.exists());

    let image = |path: &Path| -> Option<(String, u32)> {
        install::validate_no_symlink_components(Path::new("/"), path.strip_prefix("/").unwrap())
            .unwrap();
        match fs::symlink_metadata(path) {
            Ok(metadata) => {
                assert!(metadata.is_file() && !metadata.file_type().is_symlink());
                Some((
                    format!("{:x}", Sha256::digest(fs::read(path).unwrap())),
                    metadata.permissions().mode() & 0o7777,
                ))
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
            Err(error) => panic!("could not inspect watched file: {error}"),
        }
    };
    let mut watched = [
        "Contents/Info.plist",
        "Contents/_CodeSignature/CodeResources",
        "Contents/MacOS/Cavalry",
        "Contents/Frameworks/libApi.dylib",
        "Contents/Frameworks/libCore.dylib",
        "Contents/Frameworks/QtCore.framework/Versions/A/QtCore",
    ]
    .map(|relative| app_path.join(relative))
    .to_vec();
    watched.extend([preferences, strings, actual_receipt]);
    let manifest_path =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("target/native-language-packs/manifest.json");
    image(&manifest_path).expect("native preview manifest must exist");
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(&manifest_path).unwrap()).unwrap();
    // -- 当前target决定源分母；首装状态探针不要求所有caption已译完 ------
    let target_bytes = include_bytes!("../../tools/cavalry_native_target.json");
    let target: serde_json::Value = serde_json::from_slice(target_bytes).unwrap();
    let supplemental_keys =
        target["supplementalKeys"].as_u64().unwrap() + PLUGIN_CAPTION_SUPPLEMENT_KEYS;
    let source_keys = target["nativeKeys"].as_u64().unwrap() + supplemental_keys;
    assert_eq!(
        manifest["targetSha256"],
        format!("{:x}", Sha256::digest(target_bytes))
    );
    assert_eq!(manifest["nativeKeys"], source_keys);
    assert_eq!(manifest["supplementalKeys"], supplemental_keys);
    let approved_keys = manifest["approvedUIKeys"].as_u64().unwrap();
    assert!(approved_keys > 0 && approved_keys <= source_keys);
    let missing_counts = ["zh-Hans", "zh-Hant", "ja_JP"].map(|language| {
        let missing = manifest["packs"][language]["missing"].as_u64().unwrap();
        assert!(missing <= source_keys);
        missing
    });
    let complete = missing_counts.iter().all(|missing| *missing == 0);
    assert_eq!(manifest["complete"], complete);
    watched.push(manifest_path);
    let before = watched.iter().map(|path| image(path)).collect::<Vec<_>>();

    // -- 最短装配：build不执行setup/run；绝不创建WebView ----------------
    let temporary = tempfile::tempdir().unwrap();
    let state_root = fs::canonicalize(temporary.path()).unwrap();
    std::env::set_var("CAVALRY_I18N_STATE_DIR", &state_root);
    context.config_mut().app.windows.clear();
    context.config_mut().app.tray_icon = None;
    context.config_mut().plugins.0.clear();
    let app = tauri::Builder::default()
        .enable_macos_default_menu(false)
        .build(context)
        .unwrap();
    assert!(app.webview_windows().is_empty());
    let status =
        tauri::async_runtime::block_on(commands::get_status(app.handle().clone())).unwrap();
    assert!(app.webview_windows().is_empty());
    assert_eq!(status.app_path, app_path.to_string_lossy());
    assert_eq!(status.version, "2.8.0");
    assert_eq!(status.supported_version, "2.8.0");
    assert_eq!(status.version_compatibility, "supported");
    assert_eq!(status.installation_mode, "official");
    assert_eq!(status.language_scope, "userProfile");
    assert_eq!(status.current_lang, "en");
    assert_eq!(
        status.native_locale_state,
        Some(commands::NativeLocaleState::Unset)
    );
    assert!(status.native_resource_available);
    assert!(!status.native_english_restore_available && !status.reconciliation_required);
    assert_eq!(
        watched.iter().map(|path| image(path)).collect::<Vec<_>>(),
        before
    );

    // -- 生产只读命令仍记录diagnostics，限于自有临时state ----------------
    let state = state_root.join("native-2.8-preview");
    let diagnostics = fs::read(state.join("diagnostics.jsonl")).unwrap();
    let records = String::from_utf8(diagnostics.clone())
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str::<serde_json::Value>(line).unwrap())
        .collect::<Vec<_>>();
    assert_eq!(records.len(), 1);
    assert_eq!(records[0]["event"], "statusProjectionFinished");
    assert_eq!(records[0]["details"]["ok"], true);
    assert_eq!(fs::read_dir(&state).unwrap().count(), 1);
    assert_eq!(fs::read_dir(&state_root).unwrap().count(), 1);
    drop(app);
    temporary.close().unwrap();
    assert!(!state_root.exists());
    println!(
        "{}",
        serde_json::json!({
            "pass": true, "actualAppHandle": true, "actualProductionStatus": true,
            "actualProfileRead": true, "currentLang": status.current_lang,
            "nativeLocaleState": status.native_locale_state, "installationMode": status.installation_mode,
            "nativeResourceAvailable": status.native_resource_available,
            "nativeSourceKeys": source_keys, "approvedUIKeys": approved_keys,
            "resourceComplete": complete,
        "managedWebviewWindows": 0, "guiEventLoopRun": false, "ipcTested": false,
            "rendererTested": false, "languageSwitchTested": false,
            "watchedFileCount": watched.len(), "watchedFilesUnchanged": true,
            "diagnosticRecords": records.len(), "diagnosticsSha256": format!("{:x}", Sha256::digest(&diagnostics)),
            "temporaryStateRemoved": true, "pid": std::process::id()
        })
    );
}

#[cfg(not(target_os = "macos"))]
fn main() {
    panic!("this manual native-preview smoke is macOS-only");
}
