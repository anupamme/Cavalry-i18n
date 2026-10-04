/**
 * [INPUT]: 依赖当前 OS uid/euid、getpwuid_r 的 NSS home 记录与可见的 CFFIXED_USER_HOME override。
 * [OUTPUT]: 提供不读取 HOME 字符串、不启动 shell 的 current_user_home()，用于推导当前用户级路径的受限基础目录。
 * [POS]: macOS 用户 profile 边界；只证明当前进程同一 OS 用户的绝对 home，不证明 Qt TestMode/应用自身路径策略一致，也不直接读写 Preferences 或 Plugins。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    ffi::{CStr, OsString},
    mem::MaybeUninit,
    os::unix::ffi::{OsStrExt, OsStringExt},
    path::PathBuf,
    ptr,
};

const MAX_PASSWD_BUFFER: usize = 1024 * 1024;

/// 从 OS 账户库解析 home，不采用可覆盖的 HOME；可见的 CFFIXED_USER_HOME 会让生产路径归属不确定，故拒绝。
pub(crate) fn current_user_home() -> Result<PathBuf, String> {
    let uid = unsafe { libc::getuid() };
    let effective_uid = unsafe { libc::geteuid() };
    if uid != effective_uid {
        return Err("Real and effective uid differ; user-profile routing is unsafe.".to_string());
    }
    let fixed_home_is_set =
        std::env::var_os("CFFIXED_USER_HOME").is_some_and(|value| !value.is_empty());
    if fixed_home_is_set {
        return Err(
            "CFFIXED_USER_HOME is set; the Cavalry user-profile path cannot be proven.".to_string(),
        );
    }

    let home = passwd_home(uid)?;
    validated_current_user_home(uid, effective_uid, Some(home.as_os_str().as_bytes()), false)
}

fn passwd_home(uid: libc::uid_t) -> Result<OsString, String> {
    let suggested = unsafe { libc::sysconf(libc::_SC_GETPW_R_SIZE_MAX) };
    let mut buffer_size = if suggested > 0 {
        (suggested as usize).min(MAX_PASSWD_BUFFER)
    } else {
        1024
    };

    for _ in 0..8 {
        let mut buffer = vec![0_u8; buffer_size];
        let mut record = MaybeUninit::<libc::passwd>::zeroed();
        let mut result = ptr::null_mut();
        let status = unsafe {
            libc::getpwuid_r(
                uid,
                record.as_mut_ptr(),
                buffer.as_mut_ptr().cast(),
                buffer.len(),
                &mut result,
            )
        };
        if status == libc::ERANGE {
            buffer_size = buffer_size
                .checked_mul(2)
                .filter(|size| *size <= MAX_PASSWD_BUFFER)
                .ok_or_else(|| {
                    "The OS account home record exceeds the supported bound.".to_string()
                })?;
            continue;
        }
        if status != 0 {
            return Err(format!(
                "Could not resolve the current OS account home with getpwuid_r: {} [errno={status}]",
                std::io::Error::from_raw_os_error(status)
            ));
        }
        if result.is_null() {
            return Err("The current OS account has no passwd record.".to_string());
        }

        let record = unsafe { record.assume_init() };
        if record.pw_dir.is_null() {
            return Err("The current OS account has no home directory.".to_string());
        }
        let bytes = unsafe { CStr::from_ptr(record.pw_dir) }.to_bytes().to_vec();
        return Ok(OsString::from_vec(bytes));
    }
    Err("The current OS account home lookup did not converge.".to_string())
}

fn validated_current_user_home(
    uid: libc::uid_t,
    effective_uid: libc::uid_t,
    home_bytes: Option<&[u8]>,
    fixed_home_is_set: bool,
) -> Result<PathBuf, String> {
    if uid != effective_uid {
        return Err("Real and effective uid differ; user-profile routing is unsafe.".to_string());
    }
    if fixed_home_is_set {
        return Err(
            "CFFIXED_USER_HOME is set; the Cavalry user-profile path cannot be proven.".to_string(),
        );
    }
    let bytes =
        home_bytes.ok_or_else(|| "The current OS account has no home directory.".to_string())?;
    if bytes.is_empty() {
        return Err("The current OS account home directory is empty.".to_string());
    }
    let home = PathBuf::from(OsString::from_vec(bytes.to_vec()));
    if !home.is_absolute() {
        return Err("The current OS account home directory is not absolute.".to_string());
    }
    Ok(home)
}

#[cfg(test)]
mod tests {
    use super::validated_current_user_home;
    use std::path::Path;

    #[test]
    fn accepts_only_same_uid_absolute_os_home() {
        let home = validated_current_user_home(501, 501, Some(b"/Users/fixture"), false).unwrap();
        assert_eq!(home, Path::new("/Users/fixture"));
    }

    #[test]
    fn rejects_uid_mismatch_fixed_home_missing_and_relative_home() {
        assert!(validated_current_user_home(501, 0, Some(b"/Users/fixture"), false).is_err());
        assert!(validated_current_user_home(501, 501, Some(b"/Users/fixture"), true).is_err());
        assert!(validated_current_user_home(501, 501, None, false).is_err());
        assert!(validated_current_user_home(501, 501, Some(b"Users/fixture"), false).is_err());
        assert!(validated_current_user_home(501, 501, Some(b""), false).is_err());
    }
}
