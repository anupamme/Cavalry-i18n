/**
 * [INPUT]: 依赖 InstallLayout、CommandRunner、macOS exact-PID 控制与 Windows hash-safe PowerShell 编码。
 * [OUTPUT]: 提供 restart_commands、macOS native preview 的背景启动请求 open -g -n、typed 写入前 graceful close、两平台 canonical executable/PID 绑定，以及带 cwd/env/PID 的 Cavalry 重启。
 * [POS]: privilege 的跨平台重启适配器；原厂 native 启动不终止既有进程，-g只请求Launch Services不要前台激活，不保证Cavalry自身不主动激活；旧重启流程仍可在明确场景graceful close；macOS经libproc+NSRunningApplication有界等待，Windows固定当前Session的同一Process/SafeHandle。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{ffi::OsString, fmt, path::Path};

#[cfg(target_os = "windows")]
use super::windows::manifest::encode_powershell_command;
use super::{CommandRunner, RecordedCommand};
#[cfg(target_os = "windows")]
use crate::install::InstallLayout;

pub fn restart_commands(app_path: &Path) -> Vec<RecordedCommand> {
    #[cfg(target_os = "macos")]
    {
        return vec![RecordedCommand {
            program: "open".to_string(),
            args: vec!["-n".to_string(), app_path.to_string_lossy().to_string()],
        }];
    }

    #[cfg(target_os = "windows")]
    {
        let layout = InstallLayout::from_root(app_path);
        return vec![
            windows_close_command(&layout.executable),
            RecordedCommand {
                program: layout.executable.to_string_lossy().to_string(),
                args: Vec::new(),
            },
        ];
    }

    #[allow(unreachable_code)]
    Vec::new()
}

/// 只请求在后台启动已选中的原厂 app；`open -g`不约束应用自主激活窗口。
/// 调用方必须先完成宿主验证及共享进程准入；与 legacy restart 分开，避免关闭现有进程。
#[cfg(target_os = "macos")]
pub(crate) fn launch_cavalry_without_termination<R: CommandRunner>(
    app_path: &Path,
    runner: &mut R,
) -> Result<(), String> {
    let command = RecordedCommand {
        program: "open".to_string(),
        args: vec![
            "-g".to_string(),
            "-n".to_string(),
            app_path.to_string_lossy().to_string(),
        ],
    };
    runner.spawn_detached(&command.program, &command.args)
}

#[cfg(target_os = "windows")]
const WINDOWS_GRACEFUL_CLOSE_TIMEOUT_SECONDS: u64 = 15;
#[cfg(target_os = "windows")]
const WINDOWS_CAVALRY_STILL_RUNNING_EXIT_CODE: i32 = 45;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CloseCavalryError {
    StillRunning,
    Command(String),
}

impl fmt::Display for CloseCavalryError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::StillRunning => formatter.write_str(
                "Cavalry is still running. Save your work, close Cavalry, and try again. The Cavalry installation was not changed.",
            ),
            Self::Command(detail) => formatter.write_str(detail),
        }
    }
}

impl std::error::Error for CloseCavalryError {}

#[cfg(target_os = "windows")]
fn windows_graceful_close_script(executable: &Path) -> String {
    // 将路径编码为 UTF-16 Base64 数据，避免安装路径进入 PowerShell 语法。
    let encoded_target = encode_powershell_command(&executable.to_string_lossy());
    format!(
        r#"
$ErrorActionPreference = 'Stop'
$target = [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded_target}'))
try {{
  $target = [System.IO.Path]::GetFullPath($target)
}} catch {{
  [Console]::Error.WriteLine("Could not normalize the selected Cavalry executable path.")
  exit 1
}}
$windowOracleSource = @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class CavalryI18nWindowOracle
{{
    public delegate bool EnumWindowsProc(IntPtr window, IntPtr parameter);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool EnumWindows(EnumWindowsProc callback, IntPtr parameter);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr window);

    [DllImport("dwmapi.dll")]
    private static extern int DwmGetWindowAttribute(
        IntPtr window,
        uint attribute,
        out int value,
        int valueSize
    );

    public static bool HasVisibleWindow(uint targetProcessId)
    {{
        bool found = false;
        bool completed = EnumWindows(delegate(IntPtr window, IntPtr parameter)
        {{
            uint processId;
            GetWindowThreadProcessId(window, out processId);
            if (processId != targetProcessId || !IsWindowVisible(window))
            {{
                return true;
            }}
            int cloaked = 0;
            if (
                DwmGetWindowAttribute(window, 14, out cloaked, sizeof(int)) == 0 &&
                cloaked != 0
            )
            {{
                return true;
            }}
            found = true;
            return true;
        }}, IntPtr.Zero);
        if (!completed)
        {{
            throw new Win32Exception(Marshal.GetLastWin32Error());
        }}
        return found;
    }}
}}
'@
try {{
  Add-Type -TypeDefinition $windowOracleSource -ErrorAction Stop
}} catch {{
  [Console]::Error.WriteLine("Could not initialize the Cavalry visible-window oracle: $($_.Exception.Message)")
  exit 1
}}
function Test-ExactProcessPath {{
  param(
    [System.Diagnostics.Process]$Process,
    [Microsoft.Win32.SafeHandles.SafeProcessHandle]$ProcessHandle,
    [string]$ExpectedExecutable,
    [int]$ExpectedSessionId
  )
  if ($null -eq $ProcessHandle -or $ProcessHandle.IsClosed -or $ProcessHandle.IsInvalid) {{
    throw "The bound Cavalry process handle is not valid."
  }}
  if (-not [object]::ReferenceEquals($Process.SafeHandle, $ProcessHandle)) {{
    throw "Cavalry process $($Process.Id) no longer owns the bound process handle."
  }}
  $Process.Refresh()
  if ($Process.HasExited) {{
    return $false
  }}
  try {{
    $actualSessionId = [int]$Process.SessionId
  }} catch {{
    throw "Could not revalidate Cavalry process $($Process.Id) session: $($_.Exception.Message)"
  }}
  if ($actualSessionId -ne $ExpectedSessionId) {{
    [Console]::Error.WriteLine("Cavalry is running in another Windows session. Close it there and try again.")
    exit {WINDOWS_CAVALRY_STILL_RUNNING_EXIT_CODE}
  }}
  try {{
    $actualExecutable = [System.IO.Path]::GetFullPath([string]$Process.MainModule.FileName)
  }} catch {{
    throw "Could not revalidate Cavalry process $($Process.Id) executable path: $($_.Exception.Message)"
  }}
  if (-not [System.String]::Equals(
    $actualExecutable,
    $ExpectedExecutable,
    [System.StringComparison]::OrdinalIgnoreCase
  )) {{
    throw "Cavalry process $($Process.Id) executable path changed before close."
  }}
  return $true
}}
function Test-ExactWindowlessProcess {{
  param(
    [System.Diagnostics.Process]$Process,
    [Microsoft.Win32.SafeHandles.SafeProcessHandle]$ProcessHandle,
    [string]$ExpectedExecutable,
    [int]$ExpectedSessionId
  )
  if (-not (Test-ExactProcessPath $Process $ProcessHandle $ExpectedExecutable $ExpectedSessionId)) {{
    return $false
  }}
  try {{
    $hasVisibleWindow = [bool][CavalryI18nWindowOracle]::HasVisibleWindow([uint32]$Process.Id)
  }} catch {{
    throw "Could not inspect Cavalry process $($Process.Id) visible windows: $($_.Exception.Message)"
  }}
  if ($Process.MainWindowHandle -ne [IntPtr]::Zero -or $hasVisibleWindow) {{
    [Console]::Error.WriteLine("Cavalry still owns a visible window. Save your work, close Cavalry, and try again.")
    exit {WINDOWS_CAVALRY_STILL_RUNNING_EXIT_CODE}
  }}
  return $true
}}
function Stop-ExactWindowlessProcess {{
  param(
    [System.Diagnostics.Process]$Process,
    [Microsoft.Win32.SafeHandles.SafeProcessHandle]$ProcessHandle,
    [string]$ExpectedExecutable,
    [int]$ExpectedSessionId
  )
  if (-not (Test-ExactWindowlessProcess $Process $ProcessHandle $ExpectedExecutable $ExpectedSessionId)) {{
    return
  }}
  [System.Threading.Thread]::Sleep(100)
  if (-not (Test-ExactWindowlessProcess $Process $ProcessHandle $ExpectedExecutable $ExpectedSessionId)) {{
    return
  }}
  try {{
    $Process.Kill()
  }} catch {{
    $terminationError = $_.Exception.Message
    try {{
      $Process.Refresh()
      if ($Process.HasExited) {{
        return
      }}
    }} catch {{
      throw "Could not verify Cavalry process $($Process.Id) after scoped termination failed: $($_.Exception.Message)"
    }}
    throw "Could not terminate verified windowless Cavalry process $($Process.Id): $terminationError"
  }}
  if (-not $Process.WaitForExit(5000)) {{
    throw "Verified windowless Cavalry process $($Process.Id) did not exit after scoped termination."
  }}
}}
function Close-ExactCavalryProcess {{
  param(
    [System.Diagnostics.Process]$Process,
    [string]$ExpectedExecutable,
    [int]$ExpectedSessionId
  )
  $boundProcessHandle = $Process.SafeHandle
  if ($null -eq $boundProcessHandle -or $boundProcessHandle.IsClosed -or $boundProcessHandle.IsInvalid) {{
    throw "Could not bind the selected Cavalry process handle."
  }}
  if (-not (Test-ExactProcessPath $Process $boundProcessHandle $ExpectedExecutable $ExpectedSessionId)) {{
    return
  }}
  if (-not $Process.CloseMainWindow()) {{
    Stop-ExactWindowlessProcess $Process $boundProcessHandle $ExpectedExecutable $ExpectedSessionId
    return
  }}

  $deadline = [DateTime]::UtcNow.AddSeconds({WINDOWS_GRACEFUL_CLOSE_TIMEOUT_SECONDS})
  while ($true) {{
    $Process.Refresh()
    if ($Process.HasExited) {{
      return
    }}
    if ([DateTime]::UtcNow -ge $deadline) {{
      Stop-ExactWindowlessProcess $Process $boundProcessHandle $ExpectedExecutable $ExpectedSessionId
      return
    }}
    Start-Sleep -Milliseconds 100
  }}
}}
$currentSessionId = [int][System.Diagnostics.Process]::GetCurrentProcess().SessionId
$processCandidates = @()
try {{
  $processCandidates = @(Get-CimInstance Win32_Process -Filter "Name='Cavalry.exe'" -ErrorAction Stop)
}} catch {{
  [Console]::Error.WriteLine("Could not enumerate Cavalry processes safely: $($_.Exception.Message)")
  exit 1
}}
$matchingProcesses = @(
  foreach ($candidate in $processCandidates) {{
    if (-not $candidate.ExecutablePath) {{
      [Console]::Error.WriteLine("Could not verify Cavalry process $($candidate.ProcessId) executable path.")
      exit 1
    }}
    try {{
      $candidateExecutable = [System.IO.Path]::GetFullPath([string]$candidate.ExecutablePath)
    }} catch {{
      [Console]::Error.WriteLine("Could not normalize Cavalry process $($candidate.ProcessId) executable path: $($_.Exception.Message)")
      exit 1
    }}
    if ([System.String]::Equals(
      $candidateExecutable,
      $target,
      [System.StringComparison]::OrdinalIgnoreCase
    )) {{
      if ($null -eq $candidate.SessionId) {{
        [Console]::Error.WriteLine("Could not verify Cavalry process $($candidate.ProcessId) Windows session.")
        exit 1
      }}
      if ([int]$candidate.SessionId -ne $currentSessionId) {{
        [Console]::Error.WriteLine("Cavalry is running in another Windows session. Close it there and try again.")
        exit {WINDOWS_CAVALRY_STILL_RUNNING_EXIT_CODE}
      }}
      $candidate
    }}
  }}
)
if ($matchingProcesses.Count -eq 0) {{
  exit 0
}}

foreach ($candidate in $matchingProcesses) {{
  $process = $null
  try {{
    $process = Get-Process -Id ([int]$candidate.ProcessId) -ErrorAction Stop
  }} catch {{
    [Console]::Error.WriteLine("Could not obtain the selected Cavalry process $($candidate.ProcessId) for a graceful close: $($_.Exception.Message)")
    exit 1
  }}
  try {{
    Close-ExactCavalryProcess $process $target $currentSessionId
  }} catch {{
    [Console]::Error.WriteLine("Could not safely close the selected Cavalry process: $($_.Exception.Message)")
    exit 1
  }} finally {{
    if ($null -ne $process) {{
      $process.Dispose()
    }}
  }}
}}
exit 0
"#
    )
}

#[cfg(target_os = "windows")]
fn windows_close_command(executable: &Path) -> RecordedCommand {
    let script = windows_graceful_close_script(executable);
    RecordedCommand {
        program: "powershell.exe".to_string(),
        args: vec![
            "-NoLogo".to_string(),
            "-NoProfile".to_string(),
            "-NonInteractive".to_string(),
            "-EncodedCommand".to_string(),
            encode_powershell_command(&script),
        ],
    }
}

pub fn open_privacy_security<R: CommandRunner>(runner: &mut R) -> Result<(), String> {
    #[cfg(not(target_os = "macos"))]
    {
        let _ = runner;
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        runner.spawn_detached(
            "open",
            &[
                "x-apple.systempreferences:com.apple.preference.security?Privacy_AppBundles"
                    .to_string(),
            ],
        )
    }
}

pub fn restart_cavalry<R: CommandRunner>(app_path: &Path, runner: &mut R) -> Result<(), String> {
    restart_cavalry_with_environment(app_path, &[], runner)
}

/// 两平台在修改 bundle/JSON/QPA 前只关闭所选安装根的 Cavalry，并等待其自然退出；普通关闭不改变任何安装文件。
pub fn close_cavalry_before_modification<R: CommandRunner>(
    app_path: &Path,
    runner: &mut R,
) -> Result<(), CloseCavalryError> {
    #[cfg(target_os = "windows")]
    {
        let layout = InstallLayout::from_root(app_path);
        if layout.platform == crate::install::InstallPlatform::Windows {
            let command = windows_close_command(&layout.executable);
            let status = runner
                .run_captured(&command.program, &command.args)
                .map_err(CloseCavalryError::Command)?;
            return match status.exit_code {
                Some(0) => Ok(()),
                Some(WINDOWS_CAVALRY_STILL_RUNNING_EXIT_CODE) => {
                    Err(CloseCavalryError::StillRunning)
                }
                _ => Err(CloseCavalryError::Command(status.diagnostic_summary())),
            };
        }
    }
    #[cfg(target_os = "macos")]
    {
        return super::macos::process::close_exact_cavalry(app_path, runner);
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = (app_path, runner);
    }
    #[allow(unreachable_code)]
    Ok(())
}

pub fn restart_cavalry_with_environment<R: CommandRunner>(
    app_path: &Path,
    environment: &[(OsString, OsString)],
    runner: &mut R,
) -> Result<(), String> {
    restart_cavalry_with_environment_inner(app_path, environment, runner).map(|_| ())
}

pub fn restart_cavalry_with_environment_and_pid<R: CommandRunner>(
    app_path: &Path,
    environment: &[(OsString, OsString)],
    runner: &mut R,
) -> Result<u32, String> {
    restart_cavalry_with_environment_inner(app_path, environment, runner)?.ok_or_else(|| {
        "Windows restart runner did not report the spawned Cavalry process id.".to_string()
    })
}

fn restart_cavalry_with_environment_inner<R: CommandRunner>(
    app_path: &Path,
    environment: &[(OsString, OsString)],
    runner: &mut R,
) -> Result<Option<u32>, String> {
    let commands = restart_commands(app_path);
    #[cfg(target_os = "macos")]
    {
        let _ = environment;
        close_cavalry_before_modification(app_path, runner).map_err(|error| error.to_string())?;
        runner.spawn_detached(&commands[0].program, &commands[0].args)?;
        return Ok(None);
    }
    #[cfg(target_os = "windows")]
    {
        let layout = InstallLayout::from_root(app_path);
        runner.run(&commands[0].program, &commands[0].args)?;
        return runner.spawn_detached_in_with_env_and_pid(
            &commands[1].program,
            &commands[1].args,
            &layout.root,
            environment,
        );
    }
    #[allow(unreachable_code)]
    {
        let _ = environment;
        Err("Restart is not supported on this platform.".to_string())
    }
}

#[cfg(all(test, target_os = "windows"))]
mod tests {
    use super::*;
    use crate::privilege::CommandStatus;

    struct StatusRunner(CommandStatus);

    impl CommandRunner for StatusRunner {
        fn run(&mut self, _program: &str, _args: &[String]) -> Result<(), String> {
            panic!("typed close must inspect the captured exit code")
        }

        fn run_captured(
            &mut self,
            _program: &str,
            _args: &[String],
        ) -> Result<CommandStatus, String> {
            Ok(self.0.clone())
        }
    }

    #[test]
    fn visible_cavalry_exit_is_a_typed_retry() {
        let mut runner = StatusRunner(CommandStatus {
            exit_code: Some(WINDOWS_CAVALRY_STILL_RUNNING_EXIT_CODE),
            stdout: String::new(),
            stderr: "Cavalry still owns a visible window.".to_string(),
        });

        assert_eq!(
            close_cavalry_before_modification(Path::new(r"C:\Cavalry"), &mut runner),
            Err(CloseCavalryError::StillRunning)
        );
    }

    #[test]
    fn unrelated_close_failure_keeps_its_diagnostic() {
        let mut runner = StatusRunner(CommandStatus {
            exit_code: Some(1),
            stdout: String::new(),
            stderr: "fixture failure".to_string(),
        });

        let error =
            close_cavalry_before_modification(Path::new(r"C:\Cavalry"), &mut runner).unwrap_err();
        assert!(matches!(error, CloseCavalryError::Command(_)));
        assert!(error.to_string().contains("fixture failure"));
    }
}

#[cfg(all(test, target_os = "macos"))]
mod macos_launch_tests {
    use super::*;
    use crate::privilege::{RecordedCommand, RecordingRunner};

    #[derive(Default)]
    struct LaunchRecordingRunner {
        recorder: RecordingRunner,
        run_calls: usize,
        spawn_calls: usize,
    }

    impl CommandRunner for LaunchRecordingRunner {
        fn run(&mut self, program: &str, args: &[String]) -> Result<(), String> {
            self.run_calls += 1;
            self.recorder.run(program, args)
        }

        fn spawn_detached(&mut self, program: &str, args: &[String]) -> Result<(), String> {
            self.spawn_calls += 1;
            self.recorder.commands.push(RecordedCommand {
                program: program.to_string(),
                args: args.to_vec(),
            });
            Ok(())
        }
    }

    #[test]
    fn native_launch_requests_background_new_instance_without_termination() {
        let app_path = Path::new("/Applications/Cavalry Preview.app");
        let mut runner = LaunchRecordingRunner::default();

        launch_cavalry_without_termination(app_path, &mut runner).unwrap();

        assert_eq!(runner.spawn_calls, 1);
        assert_eq!(runner.run_calls, 0);
        assert_eq!(
            runner.recorder.commands,
            [RecordedCommand {
                program: "open".to_string(),
                args: vec![
                    "-g".to_string(),
                    "-n".to_string(),
                    app_path.to_string_lossy().to_string(),
                ],
            }]
        );
    }
}
