#!/usr/bin/env python3
"""启动获准owned副本helper，并按回执PID清理测试进程。
[INPUT]: 依赖Info.plist、已批准helper与可选字体库。
[OUTPUT]: 输出原生主程序路径、启动回执和清理回执。
[POS]: 受限启动器；托管wrapper映射到Cavalry，不执行UI动作。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from __future__ import annotations

import argparse
import json
import os
import plistlib
import shlex
import signal
import subprocess
import sys
from pathlib import Path
from typing import Callable, Sequence, TextIO


ACTIVATION_ENV = "CAVALRY_I18N_FONT_WORKSPACE_TEST"
MANAGED_WRAPPER = "CavalryLauncher"
MANAGED_MAIN = "Cavalry"
PROTECTED_APP_ROOTS = tuple(Path(value).resolve() for value in ("/Applications", "/System/Applications"))
LAUNCH_FALSE_CREDIT = dict.fromkeys(("normalBundleLaunch", "authenticationTested", "normalFirstPaintPass",
    "fontMatrixPass", "editorPass", "helpBodyPass", "scriptExecuted", "windowResized",
    "fontRefreshCalled", "uiObserved"), False)

def _required_file(value: str | Path, label: str) -> Path:
    path = Path(value).expanduser()
    if not path.is_file(): raise ValueError(f"{label} is not a file: {path}")
    return path.resolve(strict=True)


def resolve_app_executable(value: str | Path) -> tuple[Path, Path]:
    raw_app = Path(value).expanduser()
    if not raw_app.is_dir(): raise ValueError(f"--app is not an App directory: {raw_app}")
    app = raw_app.resolve(strict=True)
    if any(app == root or root in app.parents for root in PROTECTED_APP_ROOTS):
        raise ValueError("--app must name an owned copy outside system App folders")

    try:
        info = plistlib.loads((app / "Contents" / "Info.plist").read_bytes())
    except (OSError, plistlib.InvalidFileException) as error:
        raise ValueError(f"Cannot read App Info.plist: {error}") from error
    name = info.get("CFBundleExecutable") if isinstance(info, dict) else None
    if (not isinstance(name, str) or not name or "\0" in name
            or Path(name).name != name):
        raise ValueError("Info.plist has no safe CFBundleExecutable name")

    macos = app / "Contents" / "MacOS"
    executable = macos / name
    # 托管副本的helper绑定原生Cavalry，不绑定包装器。
    if name == MANAGED_WRAPPER:
        executable = macos / MANAGED_MAIN
        if not _executable_file(executable):
            raise ValueError(f"Managed Cavalry main is missing or not executable: {executable}")
    if not _executable_file(executable):
        raise ValueError(f"App main executable is missing or not executable: {executable}")
    return app, executable.resolve(strict=True)

def _executable_file(path: Path) -> bool:
    return path.is_file() and os.access(path, os.X_OK)

def _output_path(value: str | Path, app: Path) -> Path:
    raw = Path(value).expanduser()
    if raw.exists(): raise ValueError(f"Refusing to overwrite receipt: {raw}")
    if not raw.parent.is_dir(): raise ValueError(f"Receipt parent directory does not exist: {raw.parent}")
    output = raw.parent.resolve(strict=True) / raw.name
    if output == app or app in output.parents:
        raise ValueError("Receipt must stay outside the App bundle")
    return output

def _reserve_receipt(output: Path) -> TextIO:
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    return os.fdopen(fd, "w", encoding="utf-8")

def _write_receipt(stream: TextIO, receipt: dict[str, object]) -> None:
    json.dump(receipt, stream, ensure_ascii=False, indent=2)
    stream.write("\n")
    stream.flush()

def _command_matches(command: str, executable: Path) -> bool:
    expected, value = str(executable), command.strip()
    if value == expected or value.startswith(expected + " "):
        return True
    try:
        return bool((arguments := shlex.split(value))) and arguments[0] == expected
    except ValueError:
        return False

def _running_pids(executable: Path) -> list[int]:
    output = subprocess.check_output(["ps", "-axo", "pid=,command="], text=True)
    matches = []
    for line in output.splitlines():
        fields = line.strip().split(maxsplit=1)
        if len(fields) == 2 and fields[0].isdigit() and int(fields[0]) > 0:
            if _command_matches(fields[1], executable): matches.append(int(fields[0]))
    return matches

def _pid_command(pid: int) -> str | None:
    result = subprocess.run(["ps", "-p", str(pid), "-o", "command="],
                            capture_output=True, text=True, check=False)
    return result.stdout.strip() or None if result.returncode == 0 else None


def launch(
    app_value: str | Path, helper_value: str | Path, activation_value: str,
    out_value: str | Path, injector_value: str | Path | None = None, *,
    running_pids: Callable[[Path], list[int]] = _running_pids,
    popen: Callable[..., object] = subprocess.Popen,
) -> dict[str, object]:
    app, executable = resolve_app_executable(app_value)
    helper = _required_file(helper_value, "--helper")
    injector = _required_file(injector_value, "--injector") if injector_value else None
    if injector is not None and app not in injector.parents:
        raise ValueError("--injector must be an already-deployed file inside --app")
    images = ([injector] if injector else []) + [helper]
    if any(":" in str(image) for image in images):
        raise ValueError("DYLD_INSERT_LIBRARIES cannot encode ':' in an image path")
    if not activation_value or any(char in activation_value for char in "\0\n\r"):
        raise ValueError("--activation must be a non-empty single-line value")
    output = _output_path(out_value, app)
    existing = running_pids(executable)
    if existing:
        raise RuntimeError("Selected App already has an exact-path process: "
                           + ",".join(map(str, existing)))

    env = os.environ.copy()
    env[ACTIVATION_ENV] = activation_value
    dyld_chain = f"{injector}:" if injector else ""
    dyld_chain += str(helper)
    env["DYLD_INSERT_LIBRARIES"] = dyld_chain
    receipt: dict[str, object] = {
        "mode": "workspace-helper-launch", "status": "process-start-requested",
        "appPath": str(app), "executable": str(executable),
        "helperPath": str(helper), "injectorPath": str(injector) if injector else None,
        "exactPid": None, "activationEnvironment": ACTIVATION_ENV,
        "activationValue": activation_value, "dyldInsertLibraries": dyld_chain,
        "vendorOutputCaptured": False, **LAUNCH_FALSE_CREDIT,
        "notVerified": ["helper admission/Qt/workspace", "font/Editor/Help surfaces",
                        "authentication/normal launch/first paint"],
    }
    with _reserve_receipt(output) as stream:
        try:
            process = popen(
                [str(executable)], env=env, stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL, start_new_session=True,
            )
        except OSError as error:
            receipt.update(status="launch-failed", error=str(error))
            _write_receipt(stream, receipt)
            raise RuntimeError(f"Native helper launch failed; receipt: {output}") from error
        receipt["exactPid"] = process.pid
        _write_receipt(stream, receipt)
    return receipt


def cleanup(
    app_value: str | Path, launch_receipt_value: str | Path, out_value: str | Path, *,
    pid_command: Callable[[int], str | None] = _pid_command,
    signal_process: Callable[[int, int], None] = os.kill,
) -> dict[str, object]:
    app, executable = resolve_app_executable(app_value)
    receipt_path = _required_file(launch_receipt_value, "--receipt")
    try:
        prior = json.loads(receipt_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"Cannot read launch receipt: {error}") from error
    pid = prior.get("exactPid") if isinstance(prior, dict) else None
    if (not isinstance(prior, dict) or prior.get("mode") != "workspace-helper-launch"
            or type(pid) is not int or pid <= 0 or prior.get("appPath") != str(app)
            or prior.get("executable") != str(executable)):
        raise ValueError("Receipt PID or executable does not match the selected App")

    output = _output_path(out_value, app)
    command = pid_command(pid)
    matches = command is not None and _command_matches(command, executable)
    status = "already-absent" if command is None else "pid-executable-mismatch"
    signal_sent, error_text = False, None
    with _reserve_receipt(output) as stream:
        if matches:
            try:
                signal_process(pid, signal.SIGTERM)
                signal_sent, status = True, "sigterm-sent"
            except ProcessLookupError:
                status = "vanished-before-signal"
            except OSError as error:
                status, error_text = "signal-failed", str(error)
        receipt: dict[str, object] = {
            "mode": "workspace-helper-cleanup", "status": status,
            "appPath": str(app), "executable": str(executable),
            "launchReceiptPath": str(receipt_path), "exactPid": pid,
            "processCommandMatched": bool(matches),
            "signal": "SIGTERM" if matches else None, "signalSent": signal_sent,
            "exitObserved": False, "normalLifecycleCredit": False,
            "error": error_text,
            "notVerified": ["process exit after SIGTERM", "normal application exit"],
        }
        _write_receipt(stream, receipt)
    return receipt

def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="启动或清理获准的工作区helper")
    commands = parser.add_subparsers(dest="command", required=True)
    start = commands.add_parser("launch")
    for option in ("app", "helper", "activation", "out"):
        start.add_argument(f"--{option}", required=True)
    start.add_argument("--injector")
    stop = commands.add_parser("cleanup")
    for option in ("app", "receipt", "out"):
        stop.add_argument(f"--{option}", required=True)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        receipt = (launch(args.app, args.helper, args.activation, args.out, args.injector)
                   if args.command == "launch" else cleanup(args.app, args.receipt, args.out))
    except (OSError, RuntimeError, ValueError) as error:
        print(f"workspace_probe: {error}", file=sys.stderr); return 2
    print(json.dumps(receipt, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
