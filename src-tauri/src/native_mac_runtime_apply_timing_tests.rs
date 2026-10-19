/**
 * [INPUT]: 依赖显式官方2.8源、approved injector路径与SHA-256环境变量。
 * [OUTPUT]: 记录baseline捕获、stock写入、严格验签和原厂恢复耗时。
 * [POS]: native runtime writer的显式ignored烟测；只操作临时APFS克隆，不启动App或访问profile。
 * 本测试不额外调用inventory_bundle；baseline沿用生产捕获与来源校验。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::{install_stock_native_runtime, restore_native_runtime_vendor};
use crate::native_mac_vendor_baseline::capture_or_reuse;
use crate::operation_lock::try_begin_bundle_operation;
use crate::privilege::{self, CommandRunner, CommandStatus, RealCommandRunner};
use sha2::{Digest, Sha256};
use std::{
    env, fs,
    time::{Duration, Instant},
};
type CapturedResult = Result<CommandStatus, String>;
type TimedStatus = Result<Option<i32>, String>;
struct TimedRunner {
    inner: RealCommandRunner,
    stage: &'static str,
}
macro_rules! log_command {
    ($runner:expr, $program:expr, $started:expr, $ok:expr) => {
        println!("{}", serde_json::json!({"event":"systemCommand","stage":$runner.stage,"program":$program,"elapsedMs":$started.elapsed().as_millis() as u64,"ok":$ok}));
    };
}
impl CommandRunner for TimedRunner {
    fn run(&mut self, program: &str, args: &[String]) -> Result<(), String> {
        let started = Instant::now();
        let result = self.inner.run(program, args);
        log_command!(self, program, started, result.is_ok());
        result
    }

    fn run_captured(&mut self, program: &str, args: &[String]) -> CapturedResult {
        let started = Instant::now();
        let result = self.inner.run_captured(program, args);
        let ok = result
            .as_ref()
            .is_ok_and(|status| status.exit_code == Some(0));
        log_command!(self, program, started, ok);
        result
    }

    fn run_status_timeout(
        &mut self,
        program: &str,
        args: &[String],
        timeout: Duration,
    ) -> TimedStatus {
        let started = Instant::now();
        let result = self.inner.run_status_timeout(program, args, timeout);
        let ok = result.as_ref().is_ok_and(|status| *status == Some(0));
        log_command!(self, program, started, ok);
        result
    }

    fn spawn_detached(&mut self, _: &str, _: &[String]) -> Result<(), String> {
        Err("Timing smoke must not launch Cavalry.".into())
    }
}

macro_rules! timed_stage {
    ($name:expr, $run:expr) => {{
        let started = Instant::now();
        let result = $run;
        println!("{}", serde_json::json!({"event":"writerStage","stage":$name,"elapsedMs":started.elapsed().as_millis() as u64,"ok":result.is_ok()}));
        result
    }};
}

#[test]
#[ignore = "requires explicit official source and approved injector; mutates only a temporary APFS clone"]
fn stock_runtime_writer_timing_smoke_on_temporary_clone() {
    let source = fs::canonicalize(
        env::var_os("CAVALRY_I18N_NATIVE_STOCK_SMOKE_SOURCE")
            .expect("set explicit read-only official source"),
    )
    .unwrap();
    let injector = fs::canonicalize(
        env::var_os("CAVALRY_I18N_NATIVE_STOCK_SMOKE_INJECTOR")
            .expect("set explicit approved injector"),
    )
    .unwrap();
    let expected_sha = env::var("CAVALRY_I18N_NATIVE_STOCK_SMOKE_INJECTOR_SHA256")
        .expect("set approved injector SHA-256");
    assert_eq!(
        format!("{:x}", Sha256::digest(fs::read(&injector).unwrap())),
        expected_sha
    );

    let temp = tempfile::Builder::new()
        .prefix("cavalry-nrt-writer-timing-")
        .tempdir()
        .unwrap();
    let app = temp.path().join("Cavalry.app");
    let mut runner = TimedRunner {
        inner: RealCommandRunner,
        stage: "temporaryClone",
    };
    timed_stage!(
        "temporaryApfsClone",
        runner.run(
            "/bin/cp",
            &[
                "-cR".into(),
                source.to_string_lossy().into_owned(),
                app.to_string_lossy().into_owned()
            ]
        )
    )
    .unwrap();
    let app = fs::canonicalize(app).unwrap();
    let state = temp.path().join("state");
    fs::create_dir(&state).unwrap();
    let state = fs::canonicalize(state).unwrap();
    let operation = try_begin_bundle_operation(&state).unwrap();

    runner.stage = "baselineCapture";
    let baseline = timed_stage!(
        "baselineCapture",
        capture_or_reuse(&app, &state, &mut runner)
    )
    .unwrap();
    let baseline_id = baseline.baseline_id().to_string();

    runner.stage = "stockInstall";
    let stage = temp.path().join("runtime-stage");
    let warnings = timed_stage!(
        "stockRuntimeInstall",
        install_stock_native_runtime(
            &operation,
            &baseline,
            &app,
            &stage,
            &injector,
            &expected_sha,
            &mut runner,
        )
    )
    .unwrap();
    assert!(
        warnings.is_empty() && !stage.exists(),
        "install warnings={warnings:?}, stageExists={}",
        stage.exists()
    );

    runner.stage = "ownerAndStrictSignature";
    timed_stage!(
        "ownerAndStrictSignature",
        (|| {
            let owned = privilege::load_owned_native_runtime(&state, &app, &mut runner)?
                .ok_or_else(|| "NRT owner was not published.".to_string())?;
            let owner: serde_json::Value = serde_json::from_slice(
                &fs::read(state.join("native-runtime-owner.json")).map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())?;
            if owned.baseline_id() != baseline_id
                || owner["schemaVersion"] != 3
                || owner["slots"].as_object().map(|v| v.len()) != Some(9)
            {
                return Err(String::from("NRT owner is not schema 3 with nine slots."));
            }
            privilege::ensure_bundle_signature(&app, &mut runner)?;
            Ok(())
        })()
    )
    .unwrap();

    runner.stage = "vendorRestore";
    let restore_stage = temp.path().join("restore-stage");
    let warnings = timed_stage!(
        "vendorRestore",
        restore_native_runtime_vendor(&operation, &baseline, &app, &restore_stage, &mut runner,)
    )
    .unwrap();
    assert!(
        warnings.is_empty()
            && !restore_stage.exists()
            && !state.join("native-runtime-owner.json").exists()
            && !state.join("macos-apply-transaction").exists(),
        "restore warnings={warnings:?}"
    );
    println!(
        "{}",
        serde_json::json!({
            "event": "writerTimingReceipt",
            "baselineId": baseline_id,
            "injectorSha256": expected_sha,
            "ownerSchemaVersion": 3,
            "ownerSlotCount": 9,
            "strictSignatureAfterInstall": true,
            "vendorRestoreVerified": true,
            "appLaunched": false,
            "profileAccessed": false,
            "inventoryBundleCalled": false,
        })
    );
}
