/**
 * [INPUT]: 依赖 std::process::Command、Windows CommandExt、路径与环境变量类型；被发现、权限复制、签名和重启边界注入执行器。
 * [OUTPUT]: 提供 CommandRunner、RealCommandRunner、RecordingRunner、CommandStatus、RecordedCommand 与无控制台 captured command 构造器；状态型只读探针可请求有界 deadline，真实 runner 超时后回收其直接子进程。
 * [POS]: privilege 的进程执行适配器；业务事务只依赖此抽象，Windows 控制台辅助程序统一以 CREATE_NO_WINDOW 运行；状态探针不暴露stdout/stderr，也不改变现有命令语义。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    ffi::OsString,
    path::Path,
    process::{Child, Command, Stdio},
    thread,
    time::{Duration, Instant},
};

#[cfg(windows)]
const WINDOWS_CREATE_NO_WINDOW: u32 = 0x08000000;

pub(crate) fn captured_command(program: &str) -> Command {
    #[allow(unused_mut)]
    let mut command = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(WINDOWS_CREATE_NO_WINDOW);
    }
    command
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecordedCommand {
    pub program: String,
    pub args: Vec<String>,
}

/// 告诉调用方已等待进程的结构化结果；非零 exit code 保留 stdout/stderr，避免把未捕获的终端输出误作诊断。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CommandStatus {
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

impl CommandStatus {
    pub(crate) fn success() -> Self {
        Self {
            exit_code: Some(0),
            stdout: String::new(),
            stderr: String::new(),
        }
    }

    pub(crate) fn diagnostic_summary(&self) -> String {
        format!(
            "Captured stdout: {} | Captured stderr: {}",
            if self.stdout.trim().is_empty() {
                "<empty>"
            } else {
                self.stdout.trim()
            },
            if self.stderr.trim().is_empty() {
                "<empty>"
            } else {
                self.stderr.trim()
            }
        )
    }
}

pub trait CommandRunner {
    fn run(&mut self, program: &str, args: &[String]) -> Result<(), String>;

    fn run_captured(&mut self, program: &str, args: &[String]) -> Result<CommandStatus, String> {
        self.run(program, args)?;
        Ok(CommandStatus::success())
    }

    /// Fixture适配器可立即返回；真实runner负责强制执行期限。
    fn run_status_timeout(
        &mut self,
        program: &str,
        args: &[String],
        _timeout: Duration,
    ) -> Result<Option<i32>, String> {
        self.run_captured(program, args)
            .map(|status| status.exit_code)
    }

    fn spawn_detached(&mut self, program: &str, args: &[String]) -> Result<(), String> {
        self.run(program, args)
    }

    fn spawn_detached_in(
        &mut self,
        program: &str,
        args: &[String],
        _working_directory: &Path,
    ) -> Result<(), String> {
        self.spawn_detached(program, args)
    }

    fn spawn_detached_in_with_env(
        &mut self,
        program: &str,
        args: &[String],
        working_directory: &Path,
        environment: &[(OsString, OsString)],
    ) -> Result<(), String> {
        let _ = environment;
        self.spawn_detached_in(program, args, working_directory)
    }

    fn spawn_detached_in_with_env_and_pid(
        &mut self,
        program: &str,
        args: &[String],
        working_directory: &Path,
        environment: &[(OsString, OsString)],
    ) -> Result<Option<u32>, String> {
        self.spawn_detached_in_with_env(program, args, working_directory, environment)?;
        Ok(None)
    }
}

#[derive(Default)]
pub struct RealCommandRunner;

impl CommandRunner for RealCommandRunner {
    fn run(&mut self, program: &str, args: &[String]) -> Result<(), String> {
        let status = self.run_captured(program, args)?;
        if status.exit_code == Some(0) {
            return Ok(());
        }
        let diagnostic = if status.stderr.trim().is_empty() {
            status.stdout.trim()
        } else {
            status.stderr.trim()
        };
        if diagnostic.is_empty() {
            Err(format!(
                "{program} ended without a successful exit code: {:?}",
                status.exit_code
            ))
        } else {
            Err(diagnostic.to_string())
        }
    }

    fn run_captured(&mut self, program: &str, args: &[String]) -> Result<CommandStatus, String> {
        let output = captured_command(program)
            .args(args)
            .output()
            .map_err(|error| error.to_string())?;
        Ok(CommandStatus {
            exit_code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }

    fn run_status_timeout(
        &mut self,
        program: &str,
        args: &[String],
        timeout: Duration,
    ) -> Result<Option<i32>, String> {
        let deadline = Instant::now()
            .checked_add(timeout)
            .ok_or_else(|| "Command deadline is out of range.".to_string())?;
        let mut child = captured_command(program)
            .args(args)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| format!("Could not start bounded command: {error}"))?;

        loop {
            match child.try_wait() {
                Ok(Some(status)) => return Ok(status.code()),
                Ok(None) => {
                    let now = Instant::now();
                    if now >= deadline {
                        if kill_and_reap(&mut child).is_err() {
                            return Err("Command timed out and could not be reaped.".into());
                        }
                        return Err("Command exceeded its deadline.".into());
                    }
                    thread::sleep(
                        deadline
                            .saturating_duration_since(now)
                            .min(Duration::from_millis(10)),
                    );
                }
                Err(_) => {
                    let _ = kill_and_reap(&mut child);
                    return Err("Could not inspect bounded command status.".into());
                }
            }
        }
    }

    fn spawn_detached(&mut self, program: &str, args: &[String]) -> Result<(), String> {
        Command::new(program)
            .args(args)
            .spawn()
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    fn spawn_detached_in(
        &mut self,
        program: &str,
        args: &[String],
        working_directory: &Path,
    ) -> Result<(), String> {
        Command::new(program)
            .args(args)
            .current_dir(working_directory)
            .spawn()
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    fn spawn_detached_in_with_env(
        &mut self,
        program: &str,
        args: &[String],
        working_directory: &Path,
        environment: &[(OsString, OsString)],
    ) -> Result<(), String> {
        Command::new(program)
            .args(args)
            .current_dir(working_directory)
            .envs(environment.iter().map(|(key, value)| (key, value)))
            .spawn()
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    fn spawn_detached_in_with_env_and_pid(
        &mut self,
        program: &str,
        args: &[String],
        working_directory: &Path,
        environment: &[(OsString, OsString)],
    ) -> Result<Option<u32>, String> {
        Command::new(program)
            .args(args)
            .current_dir(working_directory)
            .envs(environment.iter().map(|(key, value)| (key, value)))
            .spawn()
            .map(|child| Some(child.id()))
            .map_err(|error| error.to_string())
    }
}

fn kill_and_reap(child: &mut Child) -> Result<(), String> {
    let _ = child.kill();
    child
        .wait()
        .map(|_| ())
        .map_err(|_| "Could not reap bounded command.".to_string())
}

#[derive(Default)]
pub struct RecordingRunner {
    pub commands: Vec<RecordedCommand>,
}

impl CommandRunner for RecordingRunner {
    fn run(&mut self, program: &str, args: &[String]) -> Result<(), String> {
        self.commands.push(RecordedCommand {
            program: program.to_string(),
            args: args.to_vec(),
        });
        Ok(())
    }

    fn run_captured(&mut self, program: &str, args: &[String]) -> Result<CommandStatus, String> {
        self.commands.push(RecordedCommand {
            program: program.to_string(),
            args: args.to_vec(),
        });
        let mut status = CommandStatus::success();
        let managed_bundle = recording_bundle_uses_managed_launcher(args);
        if program == "codesign" && args.iter().any(|arg| arg == "-dv") {
            status.stderr = if managed_bundle {
                "TeamIdentifier=not set\nCDHash=abcdef0123456789".to_string()
            } else {
                "TeamIdentifier=TB4YVNQHVC\nCDHash=0123456789abcdef".to_string()
            };
        } else if program == "codesign" && args.iter().any(|arg| arg == "-dr") {
            status.stderr = if managed_bundle {
                "designated => cdhash H\"abcdef0123456789\"".to_string()
            } else {
                "designated => anchor apple generic and identifier \"com.scenegroup.cavalry\" and certificate leaf[subject.OU] = TB4YVNQHVC".to_string()
            };
        }
        Ok(status)
    }
}

fn recording_bundle_uses_managed_launcher(args: &[String]) -> bool {
    let Some(path) = args.last() else {
        return false;
    };
    plist::Value::from_file(Path::new(path).join("Contents/Info.plist"))
        .ok()
        .and_then(|value| {
            value
                .as_dictionary()
                .and_then(|dictionary| dictionary.get("CFBundleExecutable"))
                .and_then(plist::Value::as_string)
                .map(str::to_string)
        })
        .as_deref()
        == Some(crate::mac_runtime::WRAPPER_EXECUTABLE_NAME)
}

pub(crate) fn is_permission_error(detail: &str) -> bool {
    let lower = detail.to_ascii_lowercase();
    lower.contains("operation not permitted")
        || lower.contains("permission denied")
        || lower.contains("access is denied")
        || lower.contains("os error 5")
        || lower.contains("eacces")
        || lower.contains("eperm")
}

#[cfg(test)]
mod status_timeout_tests {
    use super::{CommandRunner, CommandStatus, RealCommandRunner};
    use std::time::{Duration, Instant};

    struct MisleadingStatusRunner;

    impl CommandRunner for MisleadingStatusRunner {
        fn run(&mut self, _program: &str, _args: &[String]) -> Result<(), String> {
            panic!("status-only fixture must not use run")
        }

        fn run_captured(
            &mut self,
            _program: &str,
            _args: &[String],
        ) -> Result<CommandStatus, String> {
            Ok(CommandStatus {
                exit_code: Some(1),
                stdout: "TeamIdentifier=TB4YVNQHVC".into(),
                stderr: "designated => anchor apple generic".into(),
            })
        }
    }

    #[test]
    fn status_timeout_port_returns_exit_status_not_captured_claims() {
        let mut runner = MisleadingStatusRunner;
        assert_eq!(
            runner
                .run_status_timeout("/usr/bin/codesign", &[], Duration::from_secs(5))
                .unwrap(),
            Some(1)
        );
    }

    #[cfg(unix)]
    #[test]
    fn real_status_timeout_reports_success_and_nonzero_codes() {
        let mut runner = RealCommandRunner;
        assert_eq!(
            runner
                .run_status_timeout("/usr/bin/true", &[], Duration::from_secs(1))
                .unwrap(),
            Some(0)
        );
        assert_eq!(
            runner
                .run_status_timeout("/usr/bin/false", &[], Duration::from_secs(1))
                .unwrap(),
            Some(1)
        );
    }

    #[cfg(unix)]
    #[test]
    fn real_status_timeout_kills_and_reaps_direct_sleep_child() {
        let mut runner = RealCommandRunner;
        let args = vec!["2".to_string()];
        let started = Instant::now();
        let error = runner
            .run_status_timeout("/bin/sleep", &args, Duration::from_millis(20))
            .unwrap_err();
        assert!(error.contains("deadline"), "{error}");
        assert!(started.elapsed() < Duration::from_secs(2));
    }
}

#[cfg(all(test, windows))]
mod tests {
    use super::captured_command;

    #[test]
    fn captured_commands_do_not_have_a_windows_console() {
        let script = concat!(
            "$signature='[DllImport(\"kernel32.dll\")] public static extern ",
            "System.IntPtr GetConsoleWindow();'; ",
            "Add-Type -MemberDefinition $signature -Name NativeConsole ",
            "-Namespace CavalryI18n; ",
            "[CavalryI18n.NativeConsole]::GetConsoleWindow().ToInt64()"
        );
        let output = captured_command("powershell.exe")
            .args([
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script,
            ])
            .output()
            .unwrap();

        assert!(output.status.success());
        assert_eq!(String::from_utf8_lossy(&output.stdout).trim(), "0");
    }
}
