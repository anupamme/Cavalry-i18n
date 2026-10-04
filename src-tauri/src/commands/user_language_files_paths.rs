/**
 * [INPUT]: 依赖调用方解析出的 Cavalry home 与 Switcher state_dir；fixture 根仅由测试构造。
 * [OUTPUT]: 绑定固定 Preferences、Third-Party/Plugins/Cavalry-i18n/strings.json 与 receipt 路径，并区分只读/可写路径计划。
 * [POS]: user_language_files 的窄路径身份边界；不创建目录、不证明 writer closed，也不提供任意路径事务能力。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs,
    path::{Component, Path, PathBuf},
};

use super::storage::permission_error;

pub(super) const RECEIPT_FILE_NAME: &str = "native-user-language.json";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum PathLayout {
    Fixture,
    UserProfile,
}

#[derive(Debug, Clone)]
pub(crate) struct UserLanguagePaths {
    pub(super) profile_root: PathBuf,
    pub(super) state_root: PathBuf,
    pub(super) preferences: PathBuf,
    pub(super) strings: PathBuf,
    pub(super) receipt: PathBuf,
    pub(super) layout: PathLayout,
    pub(super) writable: bool,
}

impl UserLanguagePaths {
    /// 绑定已解析的真实用户目录；构造只验证路径，不创建目录或接管并发写入权。
    pub(crate) fn for_user_dirs(
        home_dir: &Path,
        state_dir: &Path,
    ) -> Result<UserLanguagePaths, String> {
        let profile_root = canonical_directory_root(home_dir, "Cavalry user home")?;
        let state_root = canonical_directory_root(state_dir, "Switcher state directory")?;
        Self::for_resolved_roots(profile_root, state_root, true)
    }

    /// 只读 status 路径解析；允许尚未创建的 state_dir，但不创建它或取得写权。
    pub(crate) fn for_user_dirs_read_only(
        home_dir: &Path,
        state_dir: &Path,
    ) -> Result<UserLanguagePaths, String> {
        let profile_root = canonical_directory_root(home_dir, "Cavalry user home")?;
        let state_root = planned_directory_root(state_dir, "Switcher state directory")?;
        Self::for_resolved_roots(profile_root, state_root, false)
    }

    fn for_resolved_roots(
        profile_root: PathBuf,
        state_root: PathBuf,
        writable: bool,
    ) -> Result<UserLanguagePaths, String> {
        let paths = UserLanguagePaths {
            preferences: profile_root.join("Library/Preferences/Cavalry/preferences.json"),
            strings: profile_root.join(
                "Library/Application Support/Cavalry/Third-Party/Plugins/Cavalry-i18n/strings.json",
            ),
            receipt: state_root.join(RECEIPT_FILE_NAME),
            profile_root,
            state_root,
            layout: PathLayout::UserProfile,
            writable,
        };
        validate_paths(&paths)?;
        Ok(paths)
    }

    #[cfg(test)]
    pub(crate) fn preferences(&self) -> &Path {
        &self.preferences
    }

    pub(crate) fn strings(&self) -> &Path {
        &self.strings
    }

    #[cfg(test)]
    pub(crate) fn receipt(&self) -> &Path {
        &self.receipt
    }
}

/// 测试专用路径绑定：使用 tempfile 布局，不触及真实 profile。
#[cfg(test)]
pub(crate) fn fixture_paths(root: &Path) -> Result<UserLanguagePaths, String> {
    let metadata = fs::symlink_metadata(root).map_err(|error| {
        permission_error(
            &format!("could not inspect fixture root {}", root.display()),
            error,
        )
    })?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(format!(
            "fixture root is not a real directory: {}",
            root.display()
        ));
    }
    let profile_root = fs::canonicalize(root)
        .map_err(|error| permission_error("could not resolve fixture root", error))?;
    let state_root = canonical_directory_root(&profile_root.join("state"), "fixture state")?;
    let paths = UserLanguagePaths {
        preferences: profile_root.join("profile/preferences.json"),
        strings: profile_root.join("profile/Plugins/Cavalry-i18n/strings.json"),
        receipt: state_root.join(RECEIPT_FILE_NAME),
        profile_root,
        state_root,
        layout: PathLayout::Fixture,
        writable: true,
    };
    validate_paths(&paths)?;
    Ok(paths)
}

pub(super) fn validate_paths(paths: &UserLanguagePaths) -> Result<(), String> {
    canonical_directory_root(&paths.profile_root, "Cavalry user home/fixture root")?;
    if paths.writable {
        canonical_directory_root(&paths.state_root, "Switcher state directory")?;
    } else {
        planned_directory_root(&paths.state_root, "Switcher state directory")?;
    }
    let (expected_preferences, expected_strings) = match paths.layout {
        PathLayout::Fixture => (
            paths.profile_root.join("profile/preferences.json"),
            paths
                .profile_root
                .join("profile/Plugins/Cavalry-i18n/strings.json"),
        ),
        PathLayout::UserProfile => (
            paths
                .profile_root
                .join("Library/Preferences/Cavalry/preferences.json"),
            paths.profile_root.join(
                "Library/Application Support/Cavalry/Third-Party/Plugins/Cavalry-i18n/strings.json",
            ),
        ),
    };
    if paths.preferences != expected_preferences
        || paths.strings != expected_strings
        || paths.receipt != paths.state_root.join(RECEIPT_FILE_NAME)
        || (paths.layout == PathLayout::Fixture
            && paths.state_root != paths.profile_root.join("state"))
    {
        return Err("user-language paths do not match their fixed profile layout".to_string());
    }
    for path in [&paths.preferences, &paths.strings] {
        validate_path(paths, path)?;
    }
    match fs::symlink_metadata(&paths.state_root) {
        Ok(_) => validate_path(paths, &paths.receipt)?,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound && !paths.writable => {}
        Err(error) => {
            return Err(permission_error(
                &format!(
                    "could not inspect Switcher state directory {}",
                    paths.state_root.display()
                ),
                error,
            ));
        }
    }
    Ok(())
}

pub(super) fn validate_mutation_paths(paths: &UserLanguagePaths) -> Result<(), String> {
    if !paths.writable {
        return Err("read-only user-language paths cannot mutate profile files".to_string());
    }
    validate_paths(paths)
}

pub(super) fn validate_path(paths: &UserLanguagePaths, path: &Path) -> Result<(), String> {
    if path == paths.receipt {
        let relative = path.strip_prefix(&paths.state_root).map_err(|_| {
            format!(
                "user-language receipt escaped its state directory: {}",
                path.display()
            )
        })?;
        return validate_path_components(&paths.state_root, relative);
    }
    let relative = path.strip_prefix(&paths.profile_root).map_err(|_| {
        format!(
            "user-language path is outside its profile/state roots: {}",
            path.display()
        )
    })?;
    let under_strings = paths.strings.strip_prefix(path).is_ok();
    let under_preferences = paths.preferences.strip_prefix(path).is_ok();
    if !under_strings && !under_preferences {
        return Err(format!(
            "user-language path is not part of the fixed profile layout: {}",
            path.display()
        ));
    }
    validate_path_components(&paths.profile_root, relative)
}

fn validate_path_components(root: &Path, relative: &Path) -> Result<(), String> {
    if relative.is_absolute() {
        return Err(format!(
            "refusing absolute user-language path {}",
            relative.display()
        ));
    }
    let mut current = root.to_path_buf();
    let components = relative.components().collect::<Vec<_>>();
    for (index, component) in components.iter().enumerate() {
        let Component::Normal(name) = component else {
            return Err(format!(
                "refusing unsafe user-language path {}",
                relative.display()
            ));
        };
        current.push(name);
        match fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                return Err(format!(
                    "refusing symlink user-language path {}",
                    current.display()
                ))
            }
            Ok(metadata) if index + 1 < components.len() && !metadata.is_dir() => {
                return Err(format!(
                    "refusing non-directory user-language path component {}",
                    current.display()
                ))
            }
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
            Err(error) => {
                return Err(permission_error(
                    &format!("could not inspect user-language path {}", current.display()),
                    error,
                ))
            }
        }
    }
    Ok(())
}

pub(super) fn reject_non_regular_destination(
    paths: &UserLanguagePaths,
    path: &Path,
) -> Result<(), String> {
    validate_path(paths, path)?;
    match fs::symlink_metadata(path) {
        Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_file() => Err(format!(
            "refusing symlink or non-regular user-language destination {}",
            path.display()
        )),
        Ok(_) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(permission_error(
            &format!("could not inspect {}", path.display()),
            error,
        )),
    }
}

pub(super) fn validate_relative_directory(relative: &str) -> Result<(), String> {
    if relative.is_empty()
        || Path::new(relative).is_absolute()
        || Path::new(relative)
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err(format!(
            "unsafe owned directory in user-language receipt: {relative:?}"
        ));
    }
    Ok(())
}

pub(super) fn canonical_directory_root(path: &Path, role: &str) -> Result<PathBuf, String> {
    if !path.is_absolute()
        || path.parent().is_none()
        || path.components().any(|component| {
            !matches!(
                component,
                std::path::Component::RootDir
                    | std::path::Component::Prefix(_)
                    | std::path::Component::Normal(_)
            )
        })
    {
        return Err(format!(
            "{role} path is not an absolute canonical directory: {}",
            path.display()
        ));
    }
    let metadata = fs::symlink_metadata(path).map_err(|error| {
        permission_error(
            &format!("could not inspect {role} {}", path.display()),
            error,
        )
    })?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(format!(
            "{role} is not a real directory: {}",
            path.display()
        ));
    }
    let canonical = fs::canonicalize(path).map_err(|error| {
        permission_error(
            &format!("could not resolve {role} {}", path.display()),
            error,
        )
    })?;
    if canonical != path {
        return Err(format!("{role} path is not canonical: {}", path.display()));
    }
    Ok(canonical)
}

pub(super) fn planned_directory_root(path: &Path, role: &str) -> Result<PathBuf, String> {
    if !path.is_absolute()
        || path.parent().is_none()
        || path.components().any(|component| {
            !matches!(
                component,
                std::path::Component::RootDir
                    | std::path::Component::Prefix(_)
                    | std::path::Component::Normal(_)
            )
        })
    {
        return Err(format!(
            "{role} path is not an absolute safe directory plan: {}",
            path.display()
        ));
    }
    let mut current = path;
    loop {
        match fs::symlink_metadata(current) {
            Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => {
                return Err(format!(
                    "{role} has a symlink or non-directory ancestor: {}",
                    current.display()
                ));
            }
            Ok(_) => {
                let canonical = fs::canonicalize(current).map_err(|error| {
                    permission_error(
                        &format!("could not resolve {role} ancestor {}", current.display()),
                        error,
                    )
                })?;
                if canonical != current {
                    return Err(format!(
                        "{role} has a noncanonical ancestor: {}",
                        current.display()
                    ));
                }
                return Ok(path.to_path_buf());
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                current = current.parent().ok_or_else(|| {
                    format!("{role} has no existing safe ancestor: {}", path.display())
                })?;
            }
            Err(error) => {
                return Err(permission_error(
                    &format!("could not inspect {role} {}", current.display()),
                    error,
                ))
            }
        }
    }
}
