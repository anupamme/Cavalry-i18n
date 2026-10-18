/**
 * [INPUT]: 依赖编译期仓库位置、CAVALRY_I18N_STATE_DIR 覆盖、Windows APPDATA 与系统临时目录。
 * [OUTPUT]: 提供repo/state fallback、Windows当前用户根及无AppHandle的原生模式子域解析，供GUI/CLI/卸载共用。
 * [POS]: src-tauri/src 的运行路径真相源；GUI command 与无 WebView 启动入口不得各自推导同一 state 路径。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    env,
    path::{Path, PathBuf},
};

#[cfg(any(target_os = "windows", test))]
const APP_DATA_DIRECTORY: &str = "com.daftai.cavalry-i18n";

pub(crate) fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap_or_else(|| Path::new(env!("CARGO_MANIFEST_DIR")))
        .to_path_buf()
}

pub(crate) fn resolve_state_dir(app_data_dir: Option<PathBuf>) -> PathBuf {
    env::var_os("CAVALRY_I18N_STATE_DIR")
        .map(PathBuf::from)
        .or(app_data_dir)
        .unwrap_or_else(|| env::temp_dir().join("cavalry-i18n-tauri-state"))
}

pub(crate) fn state_dir_for_native_mode(base: &Path, preview: bool, production: bool) -> PathBuf {
    if preview {
        base.join("native-2.8-preview")
    } else if production {
        base.join("native-2.8")
    } else {
        base.to_path_buf()
    }
}

#[cfg(target_os = "windows")]
pub(crate) fn current_windows_state_dir() -> PathBuf {
    let app_data_dir = env::var_os("APPDATA")
        .map(PathBuf::from)
        .map(|root| root.join(APP_DATA_DIRECTORY));
    resolve_state_dir(app_data_dir)
}

#[cfg(test)]
mod tests {
    use super::{state_dir_for_native_mode, APP_DATA_DIRECTORY};
    use std::path::Path;

    #[test]
    fn native_state_domains_are_shared_without_an_app_handle() {
        let base = Path::new("fixture-state");
        assert_eq!(state_dir_for_native_mode(base, false, false), base);
        assert_eq!(
            state_dir_for_native_mode(base, false, true),
            base.join("native-2.8")
        );
        assert_eq!(
            state_dir_for_native_mode(base, true, false),
            base.join("native-2.8-preview")
        );
    }

    #[test]
    fn windows_state_directory_matches_tauri_identifier() {
        let config: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        assert_eq!(config["identifier"], APP_DATA_DIRECTORY);
    }
}
