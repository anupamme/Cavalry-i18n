/**
 * [INPUT]: 依赖 native_mac_runtime 计划生成器与 mac_runtime 的 Info.plist 改写。
 * [OUTPUT]: 验证 CopyPair 槽、Info mode、中性 wrapper 与 journal fail-closed。
 * 另验路径转义、state override 与输入拒绝边界。
 * [POS]: 仅创建临时 bundle fixture，不启动 Cavalry、不读 profile、不签名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{fs, path::Path, process::Command};

use super::build_native_mac_runtime_plan;

const TRUSTED_INFO: &[u8] = br#"<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>Cavalry</string><key>CFBundleIdentifier</key><string>com.scenegroup.cavalry</string></dict></plist>"#;

fn fixture(temp: &tempfile::TempDir, state_dir: &Path) -> super::NativeMacRuntimePlan {
    let app = temp.path().join("Cavalry.app");
    let staging = temp.path().join("native-runtime-stage");
    let injector = temp.path().join("packaged-injector.dylib");
    fs::create_dir_all(app.join("Contents/MacOS")).unwrap();
    fs::create_dir_all(app.join("Contents/Frameworks")).unwrap();
    fs::write(&injector, b"temporary fixture dylib").unwrap();
    build_native_mac_runtime_plan(&app, &staging, &injector, TRUSTED_INFO, 0o100640, state_dir)
        .unwrap()
}

#[test]
fn plan_uses_the_existing_bundle_slots_and_preserves_baseline_info_mode() {
    use std::os::unix::fs::PermissionsExt;

    let temp = tempfile::tempdir().unwrap();
    let state = temp.path().join("actual-native-state");
    let plan = fixture(&temp, &state);
    let app = fs::canonicalize(temp.path().join("Cavalry.app")).unwrap();

    assert_eq!(plan.wrapper.dst, app.join("Contents/MacOS/CavalryLauncher"));
    assert_eq!(plan.info_plist.dst, app.join("Contents/Info.plist"));
    assert_eq!(
        plan.injector.dst,
        app.join("Contents/Frameworks/libCavalryTranslatorInjector.dylib")
    );
    assert_eq!(
        plan.injector.src,
        temp.path().join("packaged-injector.dylib")
    );
    assert_eq!(
        fs::metadata(&plan.wrapper.src)
            .unwrap()
            .permissions()
            .mode()
            & 0o7777,
        0o755
    );
    assert_eq!(
        fs::metadata(&plan.info_plist.src)
            .unwrap()
            .permissions()
            .mode()
            & 0o7777,
        0o640
    );
    let wrapped = plist::Value::from_reader(std::io::Cursor::new(
        fs::read(&plan.info_plist.src).unwrap(),
    ))
    .unwrap();
    let dictionary = wrapped.as_dictionary().unwrap();
    assert_eq!(
        dictionary
            .get("CFBundleIdentifier")
            .and_then(plist::Value::as_string),
        Some("com.scenegroup.cavalry")
    );
    assert_eq!(
        dictionary
            .get("CFBundleExecutable")
            .and_then(plist::Value::as_string),
        Some("CavalryLauncher")
    );
}

#[test]
fn wrapper_is_locale_neutral_and_checks_the_callers_exact_native_state() {
    let temp = tempfile::tempdir().unwrap();
    let state = temp.path().join("native-2.8-preview");
    let plan = fixture(&temp, &state);
    let script = fs::read_to_string(&plan.wrapper.src).unwrap();
    let journal = state.join("macos-apply-transaction");

    assert!(script.contains("TRANSACTION_JOURNAL='"));
    assert!(script.contains(&journal.to_string_lossy().replace('\'', "'\\''")));
    assert!(script.contains("[ -e \"$TRANSACTION_JOURNAL\" ] || [ -L \"$TRANSACTION_JOURNAL\" ]"));
    assert!(script.contains("exit 75"));
    assert!(script.contains("DYLD_INSERT_LIBRARIES"));
    assert!(script.contains("export DYLD_INSERT_LIBRARIES=\"$INJECTOR_PATH:$EXTERNAL_DYLD\""));
    assert!(script.contains("libCavalryTranslatorInjector.dylib"));
    assert!(script.contains("exec \"$SELF_DIR/Cavalry\" \"$@\""));
    for forbidden in [
        "CAVALRY_I18N_LANG",
        "cavalry-i18n-lang.txt",
        "LANG_FILE",
        "CAVALRY_I18N_STATE_DIR",
        "profile.json",
    ] {
        assert!(
            !script.contains(forbidden),
            "unexpected {forbidden} in wrapper"
        );
    }
    let syntax = Command::new("/bin/sh")
        .arg("-n")
        .arg(&plan.wrapper.src)
        .status()
        .unwrap();
    assert!(syntax.success());

    let function_start = script.find("strip_owned_injector() {").unwrap();
    let function_body = &script[function_start..];
    let function_end = function_body.find("\n}\nEXTERNAL_DYLD=").unwrap() + 2;
    let function = &function_body[..function_end];
    let own = "/fixture/Frameworks/libCavalryTranslatorInjector.dylib";
    let invocation =
        format!("INJECTOR_PATH='{own}'\n{function}\nstrip_owned_injector \"$INPUT_VALUE\"");
    let incoming = format!("/external/A::{own}:/external/A:");
    let stripped = Command::new("/bin/sh")
        .arg("-c")
        .arg(invocation)
        .env("INPUT_VALUE", incoming)
        .output()
        .unwrap();
    assert!(stripped.status.success());
    assert_eq!(stripped.stdout, b"/external/A::/external/A:");
}

#[cfg(unix)]
#[test]
fn wrapper_uses_literal_journal_path_and_cannot_be_bypassed_by_state_override() {
    use std::os::unix::fs::PermissionsExt;

    let temp = tempfile::tempdir().unwrap();
    let sentinel = temp.path().join("injected");
    let state = Path::new(&format!(
        "{}/state'; touch {}; #/nested",
        temp.path().display(),
        sentinel.display()
    ))
    .to_path_buf();
    fs::create_dir_all(state.join("macos-apply-transaction")).unwrap();

    let app = temp.path().join("Cavalry.app");
    let executable_dir = app.join("Contents/MacOS");
    let staging = temp.path().join("native-runtime-stage");
    let injector = temp.path().join("packaged-injector.dylib");
    fs::create_dir_all(&executable_dir).unwrap();
    fs::create_dir_all(app.join("Contents/Frameworks")).unwrap();
    fs::write(&injector, b"temporary fixture dylib").unwrap();
    let plan =
        build_native_mac_runtime_plan(&app, &staging, &injector, TRUSTED_INFO, 0o100644, &state)
            .unwrap();
    let wrapper = executable_dir.join("CavalryLauncher");
    fs::copy(&plan.wrapper.src, &wrapper).unwrap();
    fs::set_permissions(&wrapper, fs::Permissions::from_mode(0o755)).unwrap();
    let vendor_launcher = executable_dir.join("Cavalry");
    fs::write(&vendor_launcher, b"#!/bin/sh\nexit 0\n").unwrap();
    fs::set_permissions(&vendor_launcher, fs::Permissions::from_mode(0o755)).unwrap();

    let alternate_state = temp.path().join("override-state");
    let result = Command::new(&wrapper)
        .env("CAVALRY_I18N_STATE_DIR", &alternate_state)
        .output()
        .unwrap();
    assert_eq!(result.status.code(), Some(75));
    assert!(!sentinel.exists(), "journal path executed shell input");
}

#[test]
fn builder_rejects_relative_or_control_character_state_paths() {
    let temp = tempfile::tempdir().unwrap();
    let app = temp.path().join("Cavalry.app");
    let staging = temp.path().join("stage-relative-check");
    let injector = temp.path().join("injector.dylib");
    fs::create_dir_all(app.join("Contents/MacOS")).unwrap();
    fs::write(&injector, b"temporary fixture dylib").unwrap();

    assert!(build_native_mac_runtime_plan(
        &app,
        &staging,
        &injector,
        TRUSTED_INFO,
        0o100644,
        Path::new("relative/state")
    )
    .is_err());
    assert!(build_native_mac_runtime_plan(
        &app,
        &staging,
        &injector,
        TRUSTED_INFO,
        0o100644,
        Path::new("/")
    )
    .is_err());
    let control_path = temp.path().join("state\nwith-newline");
    assert!(build_native_mac_runtime_plan(
        &app,
        &staging,
        &injector,
        TRUSTED_INFO,
        0o100644,
        &control_path
    )
    .is_err());
    let missing_parent = temp.path().join("missing-staging-parent");
    let missing_stage = missing_parent.join("stage");
    assert!(build_native_mac_runtime_plan(
        &app,
        &missing_stage,
        &injector,
        TRUSTED_INFO,
        0o100644,
        &temp.path().join("state")
    )
    .is_err());
    assert!(!missing_parent.exists());
    assert!(!staging.exists());
}

#[test]
fn builder_rejects_colon_bundle_paths_before_staging() {
    let temp = tempfile::tempdir().unwrap();
    let app = temp.path().join("Cavalry:alternate.app");
    let staging = temp.path().join("stage-colon-check");
    let injector = temp.path().join("injector.dylib");
    let state = temp.path().join("state");
    fs::write(&injector, b"temporary fixture dylib").unwrap();

    assert!(build_native_mac_runtime_plan(
        &app,
        &staging,
        &injector,
        TRUSTED_INFO,
        0o100644,
        &state
    )
    .is_err());
    assert!(!staging.exists());
}

#[cfg(unix)]
#[test]
fn staging_parent_symlink_cannot_redirect_sources_into_the_bundle() {
    use std::os::unix::fs::symlink;

    let temp = tempfile::tempdir().unwrap();
    let app = temp.path().join("Cavalry.app");
    let inside_parent = app.join("Contents/Resources/native-stage");
    let parent_alias = temp.path().join("staging-parent-alias");
    let staging = parent_alias.join("generated");
    let injector = temp.path().join("injector.dylib");
    let state = temp.path().join("state");
    fs::create_dir_all(app.join("Contents/MacOS")).unwrap();
    fs::create_dir_all(&inside_parent).unwrap();
    symlink(&inside_parent, &parent_alias).unwrap();
    fs::write(&injector, b"temporary fixture dylib").unwrap();

    let result =
        build_native_mac_runtime_plan(&app, &staging, &injector, TRUSTED_INFO, 0o100644, &state);

    assert!(result.is_err());
    assert!(!inside_parent.join("generated").exists());
}
