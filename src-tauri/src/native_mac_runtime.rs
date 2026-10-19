/**
 * [INPUT]: 复用 mac_runtime 的 Info.plist 改写与 runtime 槽。
 * 接收调用方 Info bytes/mode、injector 源、bundle、staging 与真实 state_dir。
 * [OUTPUT]: 生成中性 launcher、Info.plist、injector 三个 CopyPair。
 * [POS]: macOS中性文件计划层；stock首装与managed槽更新调用它。
 * 不决定来源、managed所有权或命令准入。
 * wrapper 检查同一 state_dir 的 apply journal。
 * canonicalize 只检查 bundle 与 staging 几何，不证明身份或签名。
 * 本模块保留外部 DYLD 项，只剥自身 injector。
 * 本模块不读 marker/profile，不设语言变量，不决定 locale，也不签名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs,
    os::unix::ffi::OsStrExt,
    os::unix::fs::{DirBuilderExt, PermissionsExt},
    path::{Component, Path},
};

use crate::{
    mac_runtime::{build_wrapped_info_plist, INJECTOR_DYLIB_NAME, WRAPPER_EXECUTABLE_NAME},
    patch::CopyPair,
};

const NATIVE_APPLY_JOURNAL_DIRECTORY: &str = "macos-apply-transaction";

const NEUTRAL_WRAPPER_TEMPLATE: &str = r#"#!/bin/sh
set -eu
SELF_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
APP_ROOT="$(CDPATH= cd -- "$SELF_DIR/.." && pwd)"
INJECTOR_PATH="$APP_ROOT/Frameworks/@INJECTOR_NAME@"
TRANSACTION_JOURNAL=@JOURNAL_PATH@
case "$INJECTOR_PATH" in
  *:*)
    echo "Cavalry runtime injector path cannot contain a colon." >&2
    exit 74
    ;;
esac

# Native runtime 事务必须先完成，再启动 bundle launcher。
if [ -e "$TRANSACTION_JOURNAL" ] || [ -L "$TRANSACTION_JOURNAL" ]; then
  echo "Cavalry native runtime update is still in progress; reopen Cavalry Language Switcher after the transaction is sealed." >&2
  exit 75
fi
if [ ! -f "$INJECTOR_PATH" ]; then
  echo "Cavalry native runtime injector is missing; reopen Cavalry Language Switcher to repair it." >&2
  exit 74
fi

# 按原顺序保留调用方 DYLD 项。只移除此 wrapper 的 injector 路径。
strip_owned_injector() {
  value="${1-}"
  result=""
  first="1"
  while :; do
    case "$value" in
      *:*)
        entry="${value%%:*}"
        value="${value#*:}"
        more="1"
        ;;
      *)
        entry="$value"
        value=""
        more="0"
        ;;
    esac
    if [ "$entry" != "$INJECTOR_PATH" ]; then
      if [ "$first" = "0" ]; then
        result="$result:"
      fi
      result="$result$entry"
      first="0"
    fi
    [ "$more" = "1" ] || break
  done
  printf '%s' "$result"
}
EXTERNAL_DYLD="$(strip_owned_injector "${DYLD_INSERT_LIBRARIES-}")"
if [ -n "$EXTERNAL_DYLD" ]; then
  export DYLD_INSERT_LIBRARIES="$INJECTOR_PATH:$EXTERNAL_DYLD"
else
  export DYLD_INSERT_LIBRARIES="$INJECTOR_PATH"
fi
exec "$SELF_DIR/Cavalry" "$@"
"#;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct NativeMacRuntimePlan {
    pub(crate) wrapper: CopyPair,
    pub(crate) info_plist: CopyPair,
    pub(crate) injector: CopyPair,
}

/// 按已选安装与 baseline owner 的输入生成 staged copy pairs。
pub(crate) fn build_native_mac_runtime_plan(
    app_path: &Path,
    staging_dir: &Path,
    injector_source_path: &Path,
    baseline_info_plist_bytes: &[u8],
    baseline_info_mode: u32,
    state_dir: &Path,
) -> Result<NativeMacRuntimePlan, String> {
    validate_absolute_path("selected Cavalry bundle", app_path)?;
    validate_dyld_bundle_path(app_path)?;
    validate_absolute_path("native runtime staging directory", staging_dir)?;
    validate_absolute_path("packaged injector source", injector_source_path)?;
    validate_absolute_path("native state directory", state_dir)?;

    let canonical_app_path = fs::canonicalize(app_path)
        .map_err(|error| format!("Could not resolve selected Cavalry bundle path: {error}"))?;
    if !fs::metadata(&canonical_app_path)
        .map_err(|error| format!("Could not inspect selected Cavalry bundle: {error}"))?
        .is_dir()
    {
        return Err("Selected Cavalry bundle path is not a directory.".to_string());
    }
    validate_dyld_bundle_path(&canonical_app_path)?;

    let staging_leaf = staging_dir
        .file_name()
        .ok_or_else(|| "Native runtime staging path has no final component.".to_string())?;
    let staging_parent = staging_dir
        .parent()
        .ok_or_else(|| "Native runtime staging path has no parent directory.".to_string())?;
    let canonical_staging_parent = fs::canonicalize(staging_parent)
        .map_err(|error| format!("Native runtime staging parent must already exist: {error}"))?;
    if !fs::metadata(&canonical_staging_parent)
        .map_err(|error| format!("Could not inspect native runtime staging parent: {error}"))?
        .is_dir()
    {
        return Err("Native runtime staging parent is not a directory.".to_string());
    }
    let resolved_staging_dir = canonical_staging_parent.join(staging_leaf);
    if resolved_staging_dir.starts_with(&canonical_app_path)
        || canonical_app_path.starts_with(&resolved_staging_dir)
    {
        return Err("Native runtime staging must stay outside the Cavalry bundle.".to_string());
    }
    match fs::symlink_metadata(&resolved_staging_dir) {
        Ok(_) => {
            return Err("Native runtime staging path must not exist before planning.".to_string());
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => {
            return Err(format!(
                "Could not inspect native runtime staging path: {error}"
            ));
        }
    }
    if state_dir == Path::new("/") {
        return Err("Native state directory cannot be the filesystem root.".to_string());
    }
    if state_dir
        .file_name()
        .is_some_and(|name| name == NATIVE_APPLY_JOURNAL_DIRECTORY)
    {
        return Err("Native state directory cannot be the journal directory itself.".to_string());
    }
    if state_dir.starts_with(&canonical_app_path) || canonical_app_path.starts_with(state_dir) {
        return Err(
            "Native state directory must stay outside the Cavalry bundle path.".to_string(),
        );
    }
    if baseline_info_mode & 0o170000 != 0o100000 {
        return Err("Caller Info.plist mode does not describe a regular file.".to_string());
    }

    let injector_metadata = fs::symlink_metadata(injector_source_path)
        .map_err(|error| format!("Could not inspect packaged injector source: {error}"))?;
    if injector_metadata.file_type().is_symlink() || !injector_metadata.is_file() {
        return Err("Packaged injector source is not a regular non-symlink file.".to_string());
    }

    let wrapper = build_neutral_wrapper(state_dir)?;
    let info_plist = build_wrapped_info_plist(baseline_info_plist_bytes)?;

    let mut staging_builder = fs::DirBuilder::new();
    staging_builder.mode(0o700);
    staging_builder
        .create(&resolved_staging_dir)
        .map_err(|error| {
            format!("Could not create fresh native runtime staging directory: {error}")
        })?;

    let result = (|| {
        let wrapper_source = resolved_staging_dir.join(WRAPPER_EXECUTABLE_NAME);
        fs::write(&wrapper_source, wrapper)
            .map_err(|error| format!("Could not stage native Cavalry launcher: {error}"))?;
        fs::set_permissions(&wrapper_source, fs::Permissions::from_mode(0o755))
            .map_err(|error| format!("Could not set native launcher mode: {error}"))?;

        let info_source = resolved_staging_dir.join("Info.plist");
        fs::write(&info_source, info_plist)
            .map_err(|error| format!("Could not stage native Info.plist: {error}"))?;
        fs::set_permissions(&info_source, fs::Permissions::from_mode(baseline_info_mode))
            .map_err(|error| format!("Could not preserve caller Info.plist mode: {error}"))?;

        Ok(NativeMacRuntimePlan {
            wrapper: CopyPair {
                src: wrapper_source,
                dst: canonical_app_path
                    .join("Contents/MacOS")
                    .join(WRAPPER_EXECUTABLE_NAME),
            },
            info_plist: CopyPair {
                src: info_source,
                dst: canonical_app_path.join("Contents/Info.plist"),
            },
            injector: CopyPair {
                src: injector_source_path.to_path_buf(),
                dst: canonical_app_path
                    .join("Contents/Frameworks")
                    .join(INJECTOR_DYLIB_NAME),
            },
        })
    })();
    if let Err(cause) = &result {
        if let Err(error) = fs::remove_dir_all(&resolved_staging_dir) {
            return Err(format!(
                "{cause}; incomplete runtime staging cleanup failed: {error}"
            ));
        }
    }
    result
}

fn build_neutral_wrapper(state_dir: &Path) -> Result<String, String> {
    let journal_path = state_dir.join(NATIVE_APPLY_JOURNAL_DIRECTORY);
    let quoted_journal_path = shell_quote_absolute_path(&journal_path)?;
    Ok(NEUTRAL_WRAPPER_TEMPLATE
        .replace("@INJECTOR_NAME@", INJECTOR_DYLIB_NAME)
        .replace("@JOURNAL_PATH@", &quoted_journal_path))
}

fn shell_quote_absolute_path(path: &Path) -> Result<String, String> {
    validate_absolute_path("native journal path", path)?;
    let value = path.to_str().ok_or_else(|| {
        "Native journal path cannot be represented as UTF-8 shell text.".to_string()
    })?;
    if value.chars().any(char::is_control) || value.contains('\0') {
        return Err("Native journal path contains a shell control character.".to_string());
    }
    Ok(format!("'{}'", value.replace('\'', "'\\''")))
}

fn validate_absolute_path(label: &str, path: &Path) -> Result<(), String> {
    if !path.is_absolute()
        || path
            .components()
            .any(|component| matches!(component, Component::CurDir | Component::ParentDir))
    {
        return Err(format!("{label} must be an absolute normalized path."));
    }
    Ok(())
}

fn validate_dyld_bundle_path(app_path: &Path) -> Result<(), String> {
    if app_path.as_os_str().as_bytes().contains(&b':') {
        return Err(
            "Cavalry bundle path contains a colon and cannot form a DYLD library entry."
                .to_string(),
        );
    }
    Ok(())
}

#[cfg(test)]
#[path = "native_mac_runtime_tests.rs"]
mod tests;
