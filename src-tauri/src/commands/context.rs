/**
 * [INPUT]: 依赖 Tauri AppHandle、detect 的语言目录扫描与共享 runtime_paths。
 * [OUTPUT]: 提供应用路径上下文、资源候选、语言源定位和单调 staging nonce；preview使用native-2.8-preview状态子域；production使用native-2.8状态子域；Cavalry Preferences profile路径保持共享。
 * [POS]: commands 的运行环境解析层；业务动作只接收已经归一化的 repo/state/resource 路径。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
};

use tauri::Manager;

use crate::runtime_paths;

use super::contract::LanguageChoice;

/// Shipped language manifest. Do not derive selectable packs from resource
/// directory names: unexpected directories are not product language packs.
pub(crate) const LANGUAGE_MANIFEST: [(&str, &str); 4] = [
    ("en", "English"),
    ("zh-Hans", "简体中文"),
    ("zh-Hant", "繁體中文"),
    ("ja_JP", "日本語"),
];
pub(crate) const RESTORE_OFFICIAL_ACTION: &str = "restore-official";

pub(crate) fn is_supported_apply_action(code: &str) -> bool {
    is_supported_language(code) || code == RESTORE_OFFICIAL_ACTION
}

static STAGING_COUNTER: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone)]
pub(crate) struct AppPaths {
    pub(crate) repo_root: PathBuf,
    pub(crate) state_dir: PathBuf,
    pub(crate) resource_dir: PathBuf,
}

impl AppPaths {
    pub(crate) fn for_app(app: &tauri::AppHandle) -> Self {
        Self {
            repo_root: repo_root(),
            state_dir: state_dir_for_app(app),
            resource_dir: resource_dir_for_app(app),
        }
    }
}

pub(crate) fn repo_root() -> PathBuf {
    runtime_paths::repo_root()
}

pub(crate) fn state_dir_for_app(app: &tauri::AppHandle) -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        let _ = app;
        return runtime_paths::current_windows_state_dir();
    }
    #[cfg(not(target_os = "windows"))]
    {
        let base = runtime_paths::resolve_state_dir(app.path().app_data_dir().ok());
        #[cfg(target_os = "macos")]
        {
            return state_dir_for_native_mode(
                &base,
                super::native_resources::preview_enabled(),
                super::native_resources::production_enabled(),
            );
        }
        #[cfg(not(target_os = "macos"))]
        base
    }
}

#[cfg(target_os = "macos")]
fn state_dir_for_native_mode(base: &Path, preview: bool, production: bool) -> PathBuf {
    if preview {
        base.join("native-2.8-preview")
    } else if production {
        base.join("native-2.8")
    } else {
        base.to_path_buf()
    }
}

pub(crate) fn resource_dir_for_app(app: &tauri::AppHandle) -> PathBuf {
    app.path().resource_dir().unwrap_or_else(|_| repo_root())
}

pub(crate) fn is_supported_language(code: &str) -> bool {
    LANGUAGE_MANIFEST.iter().any(|(value, _)| *value == code)
}

fn runtime_resource_roots(resource_dir: &Path) -> Vec<PathBuf> {
    let mut candidates = vec![resource_dir.to_path_buf(), resource_dir.join("_up_")];
    if let Some(parent) = resource_dir.parent() {
        candidates.push(parent.to_path_buf());
    }
    candidates.dedup();
    candidates
}

pub(crate) fn resource_candidates(
    repo_root: &Path,
    resource_dir: &Path,
    resource_suffixes: &[PathBuf],
    repo_suffix: &Path,
) -> Vec<PathBuf> {
    let mut candidates = runtime_resource_roots(resource_dir)
        .into_iter()
        .flat_map(|root| {
            resource_suffixes
                .iter()
                .map(move |suffix| root.join(suffix))
        })
        .collect::<Vec<_>>();
    candidates.push(repo_root.join(repo_suffix));
    candidates.dedup();
    candidates
}

pub(crate) fn language_root_candidates(repo_root: &Path, resource_dir: &Path) -> Vec<PathBuf> {
    resource_candidates(
        repo_root,
        resource_dir,
        &[PathBuf::from("languages")],
        Path::new("languages"),
    )
}

pub(crate) fn language_choices_from_roots(_roots: &[PathBuf]) -> Vec<LanguageChoice> {
    LANGUAGE_MANIFEST
        .iter()
        .map(|(value, label)| LanguageChoice {
            value: (*value).to_string(),
            label: (*label).to_string(),
        })
        .collect()
}

pub(crate) fn language_source_dir(repo_root: &Path, resource_dir: &Path, lang: &str) -> PathBuf {
    language_root_candidates(repo_root, resource_dir)
        .into_iter()
        .map(|root| root.join(lang))
        .find(|candidate| candidate.exists())
        .unwrap_or_else(|| repo_root.join("languages").join(lang))
}

pub(crate) fn next_staging_nonce() -> u64 {
    STAGING_COUNTER.fetch_add(1, Ordering::Relaxed)
}

#[cfg(all(test, target_os = "macos"))]
mod native_state_scope_tests {
    use super::state_dir_for_native_mode;
    use std::path::Path;

    #[test]
    fn production_and_preview_state_roots_do_not_reuse_the_legacy_state_document() {
        let base = Path::new("/tmp/switcher-state");
        let legacy = state_dir_for_native_mode(base, false, false);
        let preview = state_dir_for_native_mode(base, true, false);
        let production = state_dir_for_native_mode(base, false, true);
        assert_eq!(legacy, base);
        assert_eq!(preview, base.join("native-2.8-preview"));
        assert_eq!(production, base.join("native-2.8"));
        assert_ne!(legacy, production);
        assert_ne!(preview, production);
    }
}
