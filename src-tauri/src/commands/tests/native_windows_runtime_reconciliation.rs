/**
 * [INPUT]: Windows native状态投影与现有marker/QPA只读残留检查，隔离tempfile安装根。
 * [OUTPUT]: 验证默认English残留保留Restore/拒Official、无hostless许可、缺安装/干净根和非English边界。
 * [POS]: native_user Windows回归合同；不读取或修改真实用户profile，不启动宿主。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

fn english() -> ProfileStatus {
    ProfileStatus {
        official_language: true,
        current_lang: "en".into(),
        native_locale_state: NativeLocaleState::Unset,
        patch_status: "notApplicable".into(),
        reconciliation_required: false,
        native_english_restore_available: false,
    }
}

#[test]
fn native_english_residue_keeps_reconciliation_without_hostless_authority() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path();
    fs::write(root.join("Cavalry.exe"), b"fixture").unwrap();
    let generic = root.join(crate::windows_qpa::GENERIC_PLUGIN_RELATIVE_PATH);
    fs::create_dir_all(generic.parent().unwrap()).unwrap();
    fs::write(&generic, b"unknown generic retained").unwrap();
    let mut profile = english();
    reconcile_windows_runtime(&mut profile, root);
    assert!(profile.reconciliation_required);
    assert!(!profile.official_language);
    assert!(!profile.native_english_restore_available);
    assert_eq!(profile.current_lang, "en");
    assert_eq!(fs::read(generic).unwrap(), b"unknown generic retained");
}

#[test]
fn native_english_marker_only_also_keeps_reconciliation() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("Cavalry.exe"), b"fixture").unwrap();
    let layout = crate::install::InstallLayout::from_selection(temp.path()).unwrap();
    fs::write(&layout.language_marker, b"pending:zh-Hant").unwrap();
    let mut profile = english();
    reconcile_windows_runtime(&mut profile, temp.path());
    assert!(profile.reconciliation_required);
    assert!(!profile.official_language);
    assert!(!profile.native_english_restore_available);
}

#[test]
fn native_missing_selection_and_non_english_do_not_acquire_recovery_authority() {
    let mut profile = english();
    reconcile_windows_runtime(&mut profile, Path::new(""));
    assert!(!profile.reconciliation_required);
    assert!(profile.official_language);
    let temp = tempfile::tempdir().unwrap();
    let generic = temp
        .path()
        .join(crate::windows_qpa::GENERIC_PLUGIN_RELATIVE_PATH);
    fs::create_dir_all(generic.parent().unwrap()).unwrap();
    fs::write(generic, b"retained").unwrap();
    profile.current_lang = "zh-Hant".into();
    reconcile_windows_runtime(&mut profile, temp.path());
    assert!(!profile.reconciliation_required);
    assert!(!profile.native_english_restore_available);
}
