/**
 * [INPUT]: 依赖共享profile事务、父模块pack helper与Windows临时Local/Roaming布局。
 * [OUTPUT]: 验证分离根的真实提交/恢复、首个资源发布后的中断恢复与未知内容保护。
 * [POS]: Windows适配差异合同；复用生产事务，不触碰真实用户配置或宿主。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{synthetic_pack, typed_locale};
use crate::commands::user_language_files::{
    self, CommitOutcome, InterruptAfter, ReceiptObservation, RestoreOutcome, UserLanguagePaths,
};
use serde_json::{json, Value};
use std::{fs, path::PathBuf};

struct Profile {
    _temp: tempfile::TempDir,
    local: PathBuf,
    roaming: PathBuf,
    paths: UserLanguagePaths,
}

impl Profile {
    fn new() -> Self {
        let temp = tempfile::tempdir().unwrap();
        for relative in ["Local/Cavalry", "Roaming", "Switcher"] {
            fs::create_dir_all(temp.path().join(relative)).unwrap();
        }
        let local = fs::canonicalize(temp.path().join("Local")).unwrap();
        let roaming = fs::canonicalize(temp.path().join("Roaming")).unwrap();
        let state = fs::canonicalize(temp.path().join("Switcher")).unwrap();
        fs::write(
            local.join("Cavalry/preferences.json"),
            serde_json::to_vec(&json!({
                "locale": typed_locale("en-GB"), "keep": {"scene": "user scene", "number": 42}
            }))
            .unwrap(),
        )
        .unwrap();
        let paths = UserLanguagePaths::for_windows_dirs(&local, &roaming, &state, true).unwrap();
        Self {
            _temp: temp,
            local,
            roaming,
            paths,
        }
    }

    fn preferences(&self) -> Value {
        serde_json::from_slice(&fs::read(self.paths.preferences()).unwrap()).unwrap()
    }
}

#[test]
fn windows_split_roots_commit_switch_and_restore() {
    let p = Profile::new();
    assert!(p.paths.preferences().starts_with(&p.local));
    assert!(p.paths.strings().starts_with(&p.roaming));
    let mut closed_writer = || Ok(());
    for language in ["zh-Hans", "zh-Hant", "ja_JP"] {
        let pack = synthetic_pack(language, "native display");
        assert_eq!(
            user_language_files::apply_with_writer_guard(
                &p.paths,
                language,
                &pack,
                &mut closed_writer
            )
            .unwrap(),
            CommitOutcome::Committed
        );
        assert_eq!(
            p.preferences()["locale"]["value"],
            if language == "ja_JP" { "ja" } else { language }
        );
        assert_eq!(fs::read(p.paths.strings()).unwrap(), pack);
        assert!(matches!(
            user_language_files::read_profile_projection(&p.paths)
                .unwrap()
                .ownership,
            ReceiptObservation::Current { .. }
        ));
    }
    assert_eq!(
        user_language_files::restore_english_with_writer_guard(&p.paths, &mut closed_writer)
            .unwrap(),
        RestoreOutcome::Restored
    );
    assert_eq!(p.preferences()["locale"], typed_locale("en-GB"));
    assert_eq!(
        p.preferences()["keep"],
        json!({"scene": "user scene", "number": 42})
    );
    assert!(!p.paths.strings().exists());
    assert!(!p.paths.receipt().exists());
}

#[test]
fn windows_resource_interruption_reuses_shared_recovery() {
    let p = Profile::new();
    let pack = synthetic_pack("zh-Hans", "native display");
    assert!(user_language_files::apply_with_interrupt(
        &p.paths,
        "zh-Hans",
        &pack,
        Some(InterruptAfter::ResourcePublish)
    )
    .is_err());
    assert_eq!(p.preferences()["locale"], typed_locale("en-GB"));
    assert!(matches!(
        user_language_files::read_profile_projection(&p.paths)
            .unwrap()
            .ownership,
        ReceiptObservation::Pending { .. }
    ));
    let mut closed_writer = || Ok(());
    assert_eq!(
        user_language_files::apply_with_writer_guard(
            &p.paths,
            "zh-Hans",
            &pack,
            &mut closed_writer
        )
        .unwrap(),
        CommitOutcome::Committed
    );
    assert_eq!(p.preferences()["locale"], typed_locale("zh-Hans"));
}

#[test]
fn windows_unknown_strings_are_preserved() {
    let p = Profile::new();
    fs::create_dir_all(p.paths.strings().parent().unwrap()).unwrap();
    fs::write(p.paths.strings(), b"external user file").unwrap();
    let before = fs::read(p.paths.preferences()).unwrap();
    let mut closed_writer = || Ok(());
    assert!(user_language_files::apply_with_writer_guard(
        &p.paths,
        "zh-Hans",
        &synthetic_pack("zh-Hans", "display"),
        &mut closed_writer
    )
    .is_err());
    assert_eq!(fs::read(p.paths.strings()).unwrap(), b"external user file");
    assert_eq!(fs::read(p.paths.preferences()).unwrap(), before);
}
