#!/usr/bin/env python3
"""
本机文件fixture上的workspace_probe合同测试。
[INPUT]: 依赖workspace_probe公开函数与标准库临时目录。
[OUTPUT]: 验证主程序映射、DYLD分隔符、receipt边界与exact-PID清理门。
[POS]: tools/native-display-tests的启动器合同；不启动App或访问Keychain。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from __future__ import annotations

import json
import plistlib
import signal
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, call, patch

import sys

SKILL_DIR = Path(__file__).resolve().parents[2] / ".agents/skills/cavalry-native-display-check"
sys.path.insert(0, str(SKILL_DIR / "scripts"))
import workspace_probe


class WorkspaceProbeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.app = self.root / "Owned Fixture.app"
        executable_name = "FixtureMain"
        executable = self.app / "Contents" / "MacOS" / executable_name
        executable.parent.mkdir(parents=True)
        executable.write_bytes(b"fixture executable")
        executable.chmod(0o755)
        info = self.app / "Contents" / "Info.plist"
        info.write_bytes(plistlib.dumps({"CFBundleExecutable": executable_name}))

        self.frameworks = self.app / "Contents" / "Frameworks"
        self.frameworks.mkdir()
        self.injector = self.frameworks / "font-injector.dylib"
        self.injector.write_bytes(b"fixture injector")
        self.helper = self.root / "approved-helper.dylib"
        self.helper.write_bytes(b"fixture helper")
        self.launch_out = self.root / "launch.json"
        self.cleanup_out = self.root / "cleanup.json"
        self.app_path, self.executable_path = workspace_probe.resolve_app_executable(
            self.app
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def launch_receipt(self, pid: int = 401) -> dict[str, object]:
        return {
            "mode": "workspace-helper-launch",
            "exactPid": pid,
            "appPath": str(self.app_path),
            "executable": str(self.executable_path),
        }

    def write_launch_receipt(self, receipt: dict[str, object]) -> Path:
        path = self.root / "launch-receipt.json"
        path.write_text(json.dumps(receipt), encoding="utf-8")
        return path

    def test_app_main_is_derived_from_info_plist(self) -> None:
        self.assertEqual(self.executable_path.name, "FixtureMain")
        self.assertTrue(self.executable_path.is_file())

    def test_managed_wrapper_launch_and_cleanup_target_cavalry_main(self) -> None:
        managed_app = self.root / "Managed Fixture.app"
        macos = managed_app / "Contents" / "MacOS"
        macos.mkdir(parents=True)
        wrapper = macos / "CavalryLauncher"
        main = macos / "Cavalry"
        wrapper.write_text("#!/bin/sh\nexec \"$SELF_DIR/Cavalry\" \"$@\"\n")
        main.write_bytes(b"managed main fixture")
        wrapper.chmod(0o755)
        main.chmod(0o755)
        (managed_app / "Contents" / "Info.plist").write_bytes(
            plistlib.dumps({"CFBundleExecutable": "CavalryLauncher"})
        )
        expected_main = main.resolve()

        running_pids = Mock(return_value=[])
        popen = Mock(return_value=SimpleNamespace(pid=409))
        launch_out = self.root / "managed-launch.json"
        cleanup_out = self.root / "managed-cleanup.json"
        launch_receipt = workspace_probe.launch(
            managed_app,
            self.helper,
            "fixture-activation",
            launch_out,
            running_pids=running_pids,
            popen=popen,
        )
        pid_command = Mock(return_value=str(expected_main))
        signal_process = Mock()
        cleanup_receipt = workspace_probe.cleanup(
            managed_app,
            launch_out,
            cleanup_out,
            pid_command=pid_command,
            signal_process=signal_process,
        )

        observed = {
            "processGuard": running_pids.call_args.args[0],
            "launchCommand": popen.call_args.args[0][0],
            "launchReceiptExecutable": launch_receipt["executable"],
            "cleanupReceiptExecutable": cleanup_receipt["executable"],
            "pidCheckPid": pid_command.call_args.args[0],
            "cleanupStatus": cleanup_receipt["status"],
            "signalCalls": signal_process.call_args_list,
        }
        expected = {
            "processGuard": expected_main,
            "launchCommand": str(expected_main),
            "launchReceiptExecutable": str(expected_main),
            "cleanupReceiptExecutable": str(expected_main),
            "pidCheckPid": 409,
            "cleanupStatus": "sigterm-sent",
            "signalCalls": [call(409, signal.SIGTERM)],
        }
        self.maxDiff = None
        self.assertEqual(observed, expected)

    def test_managed_wrapper_requires_executable_cavalry_main(self) -> None:
        managed_app = self.root / "Managed Without Main.app"
        wrapper = managed_app / "Contents" / "MacOS" / "CavalryLauncher"
        wrapper.parent.mkdir(parents=True)
        wrapper.write_text("#!/bin/sh\nexit 0\n")
        wrapper.chmod(0o755)
        (managed_app / "Contents" / "Info.plist").write_bytes(
            plistlib.dumps({"CFBundleExecutable": "CavalryLauncher"})
        )
        with self.assertRaisesRegex(ValueError, "Managed Cavalry main"):
            workspace_probe.resolve_app_executable(managed_app)

    def test_dyld_image_paths_reject_colon_before_launch(self) -> None:
        colon_app = self.root / "Cavalry:Fixture.app"
        executable = colon_app / "Contents" / "MacOS" / "FixtureMain"
        executable.parent.mkdir(parents=True)
        executable.write_bytes(b"fixture executable")
        executable.chmod(0o755)
        (colon_app / "Contents" / "Info.plist").write_bytes(
            plistlib.dumps({"CFBundleExecutable": "FixtureMain"})
        )
        injector = colon_app / "Contents" / "Frameworks" / "font-injector.dylib"
        injector.parent.mkdir()
        injector.write_bytes(b"fixture injector")
        colon_injector = self.app / "Contents" / "Frameworks" / "font:injector.dylib"
        colon_injector.write_bytes(b"fixture injector")
        colon_helper = self.root / "approved:helper.dylib"
        colon_helper.write_bytes(b"fixture helper")
        cases = (
            (colon_app, self.helper, injector),
            (self.app, self.helper, colon_injector),
            (self.app, colon_helper, None),
        )
        for index, (app, helper, library) in enumerate(cases):
            with self.subTest(app=app, helper=helper, injector=library):
                popen = Mock(return_value=SimpleNamespace(pid=410 + index))
                running_pids = Mock(return_value=[])
                receipt = self.root / f"colon-{index}.json"
                with self.assertRaisesRegex(ValueError, "DYLD_INSERT_LIBRARIES"):
                    workspace_probe.launch(
                        app,
                        helper,
                        "fixture-activation",
                        receipt,
                        library,
                        running_pids=running_pids,
                        popen=popen,
                    )
                running_pids.assert_not_called()
                popen.assert_not_called()
                self.assertFalse(receipt.exists())

    def test_app_under_protected_install_root_is_rejected(self) -> None:
        with patch.object(workspace_probe, "PROTECTED_APP_ROOTS", (self.root.resolve(),)):
            with self.assertRaisesRegex(ValueError, "outside system App folders"):
                workspace_probe.resolve_app_executable(self.app)

    def test_launch_sets_ordered_injector_helper_and_false_credit_fields(self) -> None:
        popen = Mock(return_value=SimpleNamespace(pid=402))
        receipt = workspace_probe.launch(
            self.app,
            self.helper,
            "fixture-activation",
            self.launch_out,
            self.injector,
            running_pids=Mock(return_value=[]),
            popen=popen,
        )

        args, kwargs = popen.call_args
        self.assertEqual(args[0], [str(self.executable_path)])
        self.assertEqual(
            kwargs["env"]["DYLD_INSERT_LIBRARIES"],
            f"{self.injector.resolve()}:{self.helper.resolve()}",
        )
        self.assertEqual(
            kwargs["env"][workspace_probe.ACTIVATION_ENV], "fixture-activation"
        )
        self.assertIs(kwargs["stdout"], subprocess.DEVNULL)
        self.assertIs(kwargs["stderr"], subprocess.DEVNULL)
        self.assertTrue(kwargs["start_new_session"])
        self.assertEqual(receipt["exactPid"], 402)
        self.assertFalse(receipt["normalBundleLaunch"])
        self.assertFalse(receipt["authenticationTested"])
        self.assertFalse(receipt["fontMatrixPass"])
        self.assertFalse(receipt["editorPass"])
        self.assertFalse(receipt["helpBodyPass"])
        self.assertFalse(receipt["scriptExecuted"])
        self.assertEqual(json.loads(self.launch_out.read_text()), receipt)

    def test_launch_uses_helper_only_when_injector_is_omitted(self) -> None:
        receipt = workspace_probe.launch(
            self.app,
            self.helper,
            "fixture-activation",
            self.launch_out,
            running_pids=Mock(return_value=[]),
            popen=Mock(return_value=SimpleNamespace(pid=403)),
        )
        self.assertEqual(receipt["dyldInsertLibraries"], str(self.helper.resolve()))
        self.assertIsNone(receipt["injectorPath"])

    def test_launch_refuses_existing_exact_process_without_signaling(self) -> None:
        popen = Mock()
        with self.assertRaisesRegex(RuntimeError, "already has an exact-path process"):
            workspace_probe.launch(
                self.app,
                self.helper,
                "fixture-activation",
                self.launch_out,
                running_pids=Mock(return_value=[404]),
                popen=popen,
            )
        popen.assert_not_called()
        self.assertFalse(self.launch_out.exists())

    def test_launch_rejects_injector_outside_selected_app(self) -> None:
        outside = self.root / "other-injector.dylib"
        outside.write_bytes(b"fixture")
        popen = Mock()
        with self.assertRaisesRegex(ValueError, "inside --app"):
            workspace_probe.launch(
                self.app,
                self.helper,
                "fixture-activation",
                self.launch_out,
                outside,
                running_pids=Mock(return_value=[]),
                popen=popen,
            )
        popen.assert_not_called()

    def test_launch_refuses_receipt_overwrite_before_spawning(self) -> None:
        self.launch_out.write_text("old receipt", encoding="utf-8")
        popen = Mock()
        with self.assertRaisesRegex(ValueError, "Refusing to overwrite"):
            workspace_probe.launch(
                self.app,
                self.helper,
                "fixture-activation",
                self.launch_out,
                running_pids=Mock(return_value=[]),
                popen=popen,
            )
        popen.assert_not_called()

    def test_launch_failure_records_no_normal_launch_credit(self) -> None:
        popen = Mock(side_effect=OSError("fixture launch failure"))
        with self.assertRaisesRegex(RuntimeError, "Native helper launch failed"):
            workspace_probe.launch(
                self.app,
                self.helper,
                "fixture-activation",
                self.launch_out,
                running_pids=Mock(return_value=[]),
                popen=popen,
            )
        receipt = json.loads(self.launch_out.read_text())
        self.assertEqual(receipt["status"], "launch-failed")
        self.assertFalse(receipt["normalBundleLaunch"])
        self.assertFalse(receipt["authenticationTested"])
        self.assertFalse(receipt["vendorOutputCaptured"])

    def test_cleanup_sends_sigterm_only_to_receipt_pid_and_matching_image(self) -> None:
        launch_receipt_path = self.write_launch_receipt(self.launch_receipt(405))
        signal_process = Mock()
        receipt = workspace_probe.cleanup(
            self.app,
            launch_receipt_path,
            self.cleanup_out,
            pid_command=Mock(return_value=str(self.executable_path)),
            signal_process=signal_process,
        )

        signal_process.assert_called_once_with(405, signal.SIGTERM)
        self.assertTrue(receipt["signalSent"])
        self.assertFalse(receipt["exitObserved"])
        self.assertFalse(receipt["normalLifecycleCredit"])
        self.assertEqual(json.loads(self.cleanup_out.read_text()), receipt)

    def test_cleanup_does_not_signal_when_receipt_pid_is_absent(self) -> None:
        launch_receipt_path = self.write_launch_receipt(self.launch_receipt(406))
        signal_process = Mock()
        receipt = workspace_probe.cleanup(
            self.app,
            launch_receipt_path,
            self.cleanup_out,
            pid_command=Mock(return_value=None),
            signal_process=signal_process,
        )
        signal_process.assert_not_called()
        self.assertEqual(receipt["status"], "already-absent")
        self.assertFalse(receipt["signalSent"])

    def test_cleanup_does_not_signal_pid_reused_for_another_image(self) -> None:
        launch_receipt_path = self.write_launch_receipt(self.launch_receipt(407))
        signal_process = Mock()
        receipt = workspace_probe.cleanup(
            self.app,
            launch_receipt_path,
            self.cleanup_out,
            pid_command=Mock(return_value="/other/App/Contents/MacOS/Other"),
            signal_process=signal_process,
        )
        signal_process.assert_not_called()
        self.assertEqual(receipt["status"], "pid-executable-mismatch")

    def test_cleanup_rejects_receipt_for_other_app(self) -> None:
        launch_receipt = self.launch_receipt(408)
        launch_receipt["executable"] = "/other/Cavalry"
        launch_receipt_path = self.write_launch_receipt(launch_receipt)
        signal_process = Mock()
        with self.assertRaisesRegex(ValueError, "does not match"):
            workspace_probe.cleanup(
                self.app,
                launch_receipt_path,
                self.cleanup_out,
                pid_command=Mock(return_value=str(self.executable_path)),
                signal_process=signal_process,
            )
        signal_process.assert_not_called()
        self.assertFalse(self.cleanup_out.exists())

    def test_command_match_rejects_executable_prefix_collision(self) -> None:
        self.assertFalse(
            workspace_probe._command_matches(
                f"{self.executable_path}-other", self.executable_path
            )
        )


if __name__ == "__main__":
    unittest.main()
