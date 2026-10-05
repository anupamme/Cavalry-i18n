/**
 * [INPUT]: 依赖 native_resources 的 canonical/no-symlink 且可读取显示版本的bundle观察，与 privilege 的固定厂商requirement限时OS验签边界。
 * [OUTPUT]: 对显式macOS native预览提供单一 `official` 或 fail-closed `unknown` 厂商来源事实；认证要求存在可显示版本的bundle，但不与supported版本比较，也不依赖语言pack、用户profile、baseline或journal。
 * [POS]: commands/status 的来源事实owner；本模块只证明Apple代码签名策略认证的原厂Cavalry bundle；最终Official徽章还由native_user核对内置语言与无Switcher覆盖，不表示版本兼容、翻译可用、恢复能力或写入授权。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{fs, io::Cursor, path::Path, time::Duration};

use crate::privilege::{self, CommandRunner, RealCommandRunner};

const SIGNATURE_TIMEOUT: Duration = Duration::from_secs(5);

pub(crate) fn vendor_origin(selected_app: &Path) -> &'static str {
    let mut runner = RealCommandRunner;
    vendor_origin_with_runner(selected_app, &mut runner)
}

fn vendor_origin_with_runner<R: CommandRunner>(
    selected_app: &Path,
    runner: &mut R,
) -> &'static str {
    if verify_vendor_installation(selected_app, runner).is_ok() {
        "official"
    } else {
        "unknown"
    }
}

fn verify_vendor_installation<R: CommandRunner>(
    selected_app: &Path,
    runner: &mut R,
) -> Result<(), String> {
    let (canonical_app, _display_version) = super::native_resources::observe_install(selected_app)?;
    if bundle_executable(&canonical_app)? != "Cavalry" {
        return Err("Selected Cavalry bundle is wrapped or has another executable.".into());
    }
    privilege::verify_official_vendor_signature(&canonical_app, SIGNATURE_TIMEOUT, runner)
}

fn bundle_executable(app: &Path) -> Result<String, String> {
    let info_path = app.join("Contents/Info.plist");
    let relative = info_path
        .strip_prefix(Path::new("/"))
        .map_err(|_| "Cavalry Info.plist path is not absolute")?;
    crate::install::validate_no_symlink_components(Path::new("/"), relative)?;
    let metadata = fs::symlink_metadata(&info_path).map_err(|error| error.to_string())?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err("Cavalry Info.plist is not a regular file.".into());
    }
    let info = plist::Value::from_reader(Cursor::new(
        fs::read(&info_path).map_err(|error| error.to_string())?,
    ))
    .map_err(|error| error.to_string())?;
    info.as_dictionary()
        .and_then(|dictionary| dictionary.get("CFBundleExecutable"))
        .and_then(plist::Value::as_string)
        .map(str::to_string)
        .ok_or_else(|| "Cavalry bundle executable identity is unavailable.".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::privilege::{CommandStatus, RecordedCommand};
    use sha2::{Digest, Sha256};
    use std::{
        fs,
        os::unix::fs::symlink,
        path::PathBuf,
        sync::atomic::{AtomicU64, Ordering},
    };

    const OFFICIAL_REQUIREMENT: &str = "=identifier \"com.scenegroup.cavalry\" and anchor apple generic and certificate 1[field.1.2.840.113635.100.6.2.6] and certificate leaf[field.1.2.840.113635.100.6.1.13] and certificate leaf[subject.OU] = \"TB4YVNQHVC\"";
    static FIXTURE_SEQUENCE: AtomicU64 = AtomicU64::new(0);

    #[derive(Clone)]
    enum ResultMode {
        Exit(Option<i32>),
        Error,
    }

    #[derive(Default)]
    struct FixtureRunner {
        result: Option<ResultMode>,
        commands: Vec<RecordedCommand>,
        timeout: Option<Duration>,
        status_timeout_calls: usize,
        run_calls: usize,
        capture_calls: usize,
        spawn_calls: usize,
    }

    impl CommandRunner for FixtureRunner {
        fn run(&mut self, _program: &str, _args: &[String]) -> Result<(), String> {
            self.run_calls += 1;
            Err("unexpected run call".into())
        }

        fn run_captured(
            &mut self,
            _program: &str,
            _args: &[String],
        ) -> Result<CommandStatus, String> {
            self.capture_calls += 1;
            Err("unexpected captured call".into())
        }

        fn run_status_timeout(
            &mut self,
            program: &str,
            args: &[String],
            timeout: Duration,
        ) -> Result<Option<i32>, String> {
            self.status_timeout_calls += 1;
            self.commands.push(RecordedCommand {
                program: program.to_string(),
                args: args.to_vec(),
            });
            self.timeout = Some(timeout);
            match self.result.clone().unwrap_or(ResultMode::Exit(Some(0))) {
                ResultMode::Exit(code) => Ok(code),
                ResultMode::Error => Err("fixture runner failure".into()),
            }
        }

        fn spawn_detached(&mut self, _program: &str, _args: &[String]) -> Result<(), String> {
            self.spawn_calls += 1;
            Err("unexpected spawn call".into())
        }
    }

    fn make_bundle(base: &Path, bundle_id: &str, version: &str, executable: &str) -> PathBuf {
        let app = base.join(format!(
            "Cavalry-{}-{}.app",
            std::process::id(),
            FIXTURE_SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let executable_path = app.join("Contents/MacOS").join(executable);
        fs::create_dir_all(executable_path.parent().unwrap()).unwrap();
        fs::write(&executable_path, b"identity fixture executable").unwrap();

        let mut info = plist::Dictionary::new();
        info.insert(
            "CFBundleIdentifier".into(),
            plist::Value::String(bundle_id.into()),
        );
        info.insert(
            "CFBundleShortVersionString".into(),
            plist::Value::String(version.into()),
        );
        info.insert(
            "CFBundleExecutable".into(),
            plist::Value::String(executable.into()),
        );
        plist::Value::Dictionary(info)
            .to_file_xml(app.join("Contents/Info.plist"))
            .unwrap();
        app
    }

    fn assert_single_codesign_call(runner: &FixtureRunner, app: &Path) {
        assert_eq!(runner.commands.len(), 1);
        assert_eq!(runner.status_timeout_calls, 1);
        assert_eq!(runner.capture_calls, 0);
        assert_eq!(runner.run_calls, 0);
        assert_eq!(runner.spawn_calls, 0);
        assert_eq!(runner.timeout, Some(Duration::from_secs(5)));
        assert_eq!(runner.commands[0].program, "/usr/bin/codesign");
        assert_eq!(
            runner.commands[0].args,
            [
                "--verify",
                "--deep",
                "--strict",
                "--all-architectures",
                "-R",
                OFFICIAL_REQUIREMENT,
                app.to_str().unwrap(),
            ]
        );
    }

    #[test]
    fn exact_os_evaluated_requirement_proves_vendor_origin_only() {
        let temp = tempfile::tempdir().unwrap();
        let app = make_bundle(temp.path(), "com.scenegroup.cavalry", "99.4.1", "Cavalry");
        let canonical = crate::install::canonical_root_for_selection(&app).unwrap();
        let mut runner = FixtureRunner::default();

        assert_eq!(vendor_origin_with_runner(&app, &mut runner), "official");
        assert_single_codesign_call(&runner, &canonical);
        // 认证只接收bundle身份与签名runner，不读取资源pack、用户profile或恢复状态。
    }

    #[test]
    fn failed_missing_or_timed_out_os_requirement_never_becomes_official() {
        let temp = tempfile::tempdir().unwrap();
        let app = make_bundle(temp.path(), "com.scenegroup.cavalry", "2.8.0", "Cavalry");
        for result in [
            ResultMode::Exit(Some(1)),
            ResultMode::Exit(None),
            ResultMode::Error,
        ] {
            let mut runner = FixtureRunner {
                result: Some(result),
                ..FixtureRunner::default()
            };
            assert_eq!(vendor_origin_with_runner(&app, &mut runner), "unknown");
            assert_single_codesign_call(
                &runner,
                &crate::install::canonical_root_for_selection(&app).unwrap(),
            );
        }
    }

    #[test]
    fn bundle_identity_symlink_and_switcher_wrapper_fail_before_signature_probe() {
        let temp = tempfile::tempdir().unwrap();
        let wrong_id = make_bundle(temp.path(), "not.cavalry", "2.8.0", "Cavalry");
        let mut wrong_id_runner = FixtureRunner::default();
        assert_eq!(
            vendor_origin_with_runner(&wrong_id, &mut wrong_id_runner),
            "unknown"
        );
        assert!(wrong_id_runner.commands.is_empty());

        let missing_identity =
            make_bundle(temp.path(), "com.scenegroup.cavalry", "2.8.0", "Cavalry");
        let mut info =
            plist::Value::from_file(missing_identity.join("Contents/Info.plist")).unwrap();
        info.as_dictionary_mut()
            .unwrap()
            .remove("CFBundleIdentifier");
        info.to_file_xml(missing_identity.join("Contents/Info.plist"))
            .unwrap();
        let mut missing_identity_runner = FixtureRunner::default();
        assert_eq!(
            vendor_origin_with_runner(&missing_identity, &mut missing_identity_runner),
            "unknown"
        );
        assert!(missing_identity_runner.commands.is_empty());

        let wrapper = make_bundle(
            temp.path(),
            "com.scenegroup.cavalry",
            "2.8.0",
            "CavalryLauncher",
        );
        let mut wrapper_runner = FixtureRunner::default();
        assert_eq!(
            vendor_origin_with_runner(&wrapper, &mut wrapper_runner),
            "unknown"
        );
        assert!(wrapper_runner.commands.is_empty());

        let app = make_bundle(temp.path(), "com.scenegroup.cavalry", "2.8.0", "Cavalry");
        let alias = temp.path().join("Symlink.app");
        symlink(&app, &alias).unwrap();
        let mut alias_runner = FixtureRunner::default();
        assert_eq!(
            vendor_origin_with_runner(&alias, &mut alias_runner),
            "unknown"
        );
        assert!(alias_runner.commands.is_empty());

        let executable_path = app.join("Contents/MacOS/Cavalry");
        fs::remove_file(&executable_path).unwrap();
        symlink(temp.path().join("outside-executable"), &executable_path).unwrap();
        let mut executable_runner = FixtureRunner::default();
        assert_eq!(
            vendor_origin_with_runner(&app, &mut executable_runner),
            "unknown"
        );
        assert!(executable_runner.commands.is_empty());
    }

    fn hash_bytes(path: &Path) -> String {
        let metadata = fs::symlink_metadata(path).unwrap();
        assert!(metadata.is_file() && !metadata.file_type().is_symlink());
        format!("{:x}", Sha256::digest(fs::read(path).unwrap()))
    }

    #[test]
    fn fixture_verification_does_not_write_bundle_or_any_state_path() {
        let temp = tempfile::tempdir().unwrap();
        let app = make_bundle(temp.path(), "com.scenegroup.cavalry", "2.8.0", "Cavalry");
        let info = app.join("Contents/Info.plist");
        let executable = app.join("Contents/MacOS/Cavalry");
        let before = [hash_bytes(&info), hash_bytes(&executable)];
        let state_path = temp.path().join("unprovided-switcher-state");
        assert!(!state_path.exists());
        let mut runner = FixtureRunner::default();

        assert_eq!(vendor_origin_with_runner(&app, &mut runner), "official");

        assert_eq!([hash_bytes(&info), hash_bytes(&executable)], before);
        assert!(!state_path.exists());
    }

    #[test]
    #[ignore = "requires an explicitly selected real vendor app; run only as manual read-only smoke"]
    fn opt_in_native_official_vendor_smoke_is_read_only() {
        let app = std::env::var_os("CAVALRY_I18N_NATIVE_OFFICIAL_SMOKE_APP")
            .expect("set CAVALRY_I18N_NATIVE_OFFICIAL_SMOKE_APP to an explicit Cavalry.app path");
        let app = PathBuf::from(app);
        let watched = [
            "Contents/Info.plist",
            "Contents/_CodeSignature/CodeResources",
            "Contents/MacOS/Cavalry",
            "Contents/Frameworks/libApi.dylib",
            "Contents/Frameworks/libCore.dylib",
            "Contents/Frameworks/QtCore.framework/Versions/A/QtCore",
        ]
        .map(|relative| app.join(relative));
        let before = watched
            .iter()
            .map(|path| hash_bytes(path))
            .collect::<Vec<_>>();
        let disposable_state = tempfile::tempdir().unwrap();
        let state_path = disposable_state.path().join("must-not-be-created");
        assert!(!state_path.exists());

        assert_eq!(vendor_origin(&app), "official");

        let after = watched
            .iter()
            .map(|path| hash_bytes(path))
            .collect::<Vec<_>>();
        assert_eq!(
            after, before,
            "vendor bundle identity files must be unchanged"
        );
        assert!(
            !state_path.exists(),
            "status verification has no state writer"
        );
        eprintln!("PASS: official signer verified; watched bundle hashes unchanged; no test state created");
    }
}
