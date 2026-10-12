/**
 * [INPUT]: 依赖父模块临时 Fixture、native profile apply 和 storage 的测试读取计数。
 * [OUTPUT]: 锁定稳定 receipt 单次读取，并验证 locale/strings bytes/mode 漂移拒绝且保留用户改动。
 * [POS]: commands/tests/user_language_files 的窄回归；复用父级 fixture，不接真实 profile 或 App。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

#[test]
#[cfg(unix)]
fn stable_receipt_reapplication_reads_the_receipt_once() {
    let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
    let mut writer_guard = || Ok(());
    user_language_files::apply_with_writer_guard(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "first generation"),
        &mut writer_guard,
    )
    .unwrap();

    user_language_files::storage::reset_receipt_image_read_count();
    user_language_files::apply_with_writer_guard(
        &fixture.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "second generation"),
        &mut writer_guard,
    )
    .unwrap();

    assert_eq!(
        user_language_files::storage::receipt_image_read_count(),
        1,
        "a stable no-pending receipt reuses its already validated value"
    );
}

#[test]
#[cfg(unix)]
fn apply_rejects_active_locale_strings_bytes_and_mode_drift_without_overwriting_it() {
    use std::os::unix::fs::PermissionsExt;

    for drift in ["locale", "strings-bytes", "strings-mode"] {
        let fixture = Fixture::new(json!({"locale": typed_locale("en-GB")}), None);
        let mut writer_guard = || Ok(());
        user_language_files::apply_with_writer_guard(
            &fixture.paths,
            "zh-Hans",
            &synthetic_pack("zh-Hans", "owned generation"),
            &mut writer_guard,
        )
        .unwrap();

        match drift {
            "locale" => {
                let mut preferences = fixture.preferences();
                preferences["locale"] = typed_locale("fr-FR");
                fs::write(
                    fixture.paths.preferences(),
                    serde_json::to_vec_pretty(&preferences).unwrap(),
                )
                .unwrap();
            }
            "strings-bytes" => {
                fs::write(fixture.paths.strings(), b"user-edited strings").unwrap();
            }
            "strings-mode" => {
                let current_mode = fs::metadata(fixture.paths.strings())
                    .unwrap()
                    .permissions()
                    .mode()
                    & 0o7777;
                let drifted_mode = if current_mode == 0o644 { 0o600 } else { 0o644 };
                fs::set_permissions(
                    fixture.paths.strings(),
                    fs::Permissions::from_mode(drifted_mode),
                )
                .unwrap();
            }
            _ => unreachable!(),
        }

        let preferences_before = fs::read(fixture.paths.preferences()).unwrap();
        let strings_before = fs::read(fixture.paths.strings()).unwrap();
        let strings_mode_before = fs::metadata(fixture.paths.strings())
            .unwrap()
            .permissions()
            .mode()
            & 0o7777;
        let receipt_before = fs::read(fixture.paths.receipt()).unwrap();

        let error = user_language_files::apply_with_writer_guard(
            &fixture.paths,
            "ja_JP",
            &synthetic_pack("ja_JP", "must not replace user state"),
            &mut writer_guard,
        )
        .expect_err("active profile drift must block a new apply");

        assert!(error.contains("drifted"), "{error}");
        assert_eq!(
            fs::read(fixture.paths.preferences()).unwrap(),
            preferences_before
        );
        assert_eq!(fs::read(fixture.paths.strings()).unwrap(), strings_before);
        assert_eq!(
            fs::metadata(fixture.paths.strings())
                .unwrap()
                .permissions()
                .mode()
                & 0o7777,
            strings_mode_before
        );
        assert_eq!(fs::read(fixture.paths.receipt()).unwrap(), receipt_before);
    }
}
