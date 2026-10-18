/*
 * [INPUT]: 依赖OS Known Folder、ToolHelp进程快照、既有CommandRunner同用户SID探针与正常EXE启动能力。
 * [OUTPUT]: 解析独立Local/Roaming根；拒绝当前用户所有Cavalry配置写者；正常启动选定安装，不终止进程。
 * [POS]: Windows 2.8用户profile系统边界；不写安装目录、不部署旧QPA、不改全局环境或安全策略。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::privilege::CommandRunner;
use std::{
    fs,
    path::{Path, PathBuf},
    time::Duration,
};

pub(crate) fn user_roots() -> Result<(PathBuf, PathBuf), String> {
    use windows::{
        core::GUID,
        Win32::{
            System::Com::CoTaskMemFree,
            UI::Shell::{
                FOLDERID_LocalAppData, FOLDERID_RoamingAppData, SHGetKnownFolderPath,
                KF_FLAG_DEFAULT,
            },
        },
    };
    fn resolve(id: &GUID) -> Result<PathBuf, String> {
        let value = unsafe { SHGetKnownFolderPath(id, KF_FLAG_DEFAULT, None) }
            .map_err(|e| e.to_string())?;
        let decoded = unsafe { value.to_string() }.map_err(|e| e.to_string());
        unsafe { CoTaskMemFree(Some(value.0.cast())) };
        fs::canonicalize(PathBuf::from(decoded?)).map_err(|e| e.to_string())
    }
    Ok((
        resolve(&FOLDERID_LocalAppData)?,
        resolve(&FOLDERID_RoamingAppData)?,
    ))
}

pub(crate) fn guard_writers<R: CommandRunner>(runner: &mut R) -> Result<(), String> {
    // -- 无同名进程时直接采用OS快照，避免每次文件发布启动PowerShell -----
    if !has_cavalry_process()? {
        return Ok(());
    }
    // -- 只读同用户SID写者；查询失败不能当作没有进程 --------------------
    let script = r#"$ErrorActionPreference='Stop'; try {
      $sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
      foreach($p in @(Get-CimInstance Win32_Process -Filter "Name='Cavalry.exe'" -ErrorAction Stop)) {
        $owner=Invoke-CimMethod -InputObject $p -MethodName GetOwnerSid -ErrorAction Stop
        if($owner.ReturnValue -ne 0 -or [string]::IsNullOrEmpty($owner.Sid)) { exit 44 }
        if($owner.Sid -eq $sid) { exit 45 }
      }; exit 0
    } catch { exit 44 }"#;
    let args = [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]
    .map(String::from);
    match runner
        .run_status_timeout("powershell.exe", &args, Duration::from_secs(5))
        .map_err(|_| "nativeWriterInspectionFailed".to_string())?
    {
        Some(0) => Ok(()),
        Some(45) => Err("nativeWriterStillRunning".into()),
        _ => Err("nativeWriterInspectionFailed".into()),
    }
}

fn has_cavalry_process() -> Result<bool, String> {
    use windows::{
        core::{Owned, HRESULT},
        Win32::{
            Foundation::{ERROR_NO_MORE_FILES, HANDLE},
            System::Diagnostics::ToolHelp::{
                CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
                TH32CS_SNAPPROCESS,
            },
        },
    };
    let inspect = || -> windows::core::Result<bool> {
        let snapshot: Owned<HANDLE> =
            unsafe { Owned::new(CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)?) };
        let mut entry = PROCESSENTRY32W::default();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
        unsafe { Process32FirstW(*snapshot, &mut entry)? };
        loop {
            let end = entry
                .szExeFile
                .iter()
                .position(|c| *c == 0)
                .unwrap_or(entry.szExeFile.len());
            if String::from_utf16_lossy(&entry.szExeFile[..end]).eq_ignore_ascii_case("Cavalry.exe")
            {
                return Ok(true);
            }
            match unsafe { Process32NextW(*snapshot, &mut entry) } {
                Ok(()) => {}
                Err(error) if error.code() == HRESULT::from_win32(ERROR_NO_MORE_FILES.0) => {
                    return Ok(false)
                }
                Err(error) => return Err(error),
            }
        }
    };
    inspect().map_err(|_| "nativeWriterInspectionFailed".into())
}

pub(crate) fn launch<R: CommandRunner>(root: &Path, runner: &mut R) -> Result<(), String> {
    guard_writers(runner)?;
    let executable = root.join("Cavalry.exe");
    runner.spawn_detached_in(&executable.to_string_lossy(), &[], root)
}
