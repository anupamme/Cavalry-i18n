#!/usr/bin/env python3
"""[INPUT]: 依赖目标JSONL、既存popup PNG与Vision OCR工具；核查来源和图像SHA。
[OUTPUT]: 保存OCR原文、CG几何绑定与连续行说明比较。
[POS]: 离线帮助截图审计器；不启动App、不改图、不把OCR结果判作UI通过。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
import pathlib
import subprocess
import sys
import time
from typing import Any


# -- 这些heading均来自已观察的popup QLabel，不接受正文关键词 -----------------
OBSERVED_DESCRIPTION_HEADINGS = frozenset({"说明： ", "說明： ", "説明: "})


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def compact(text: str) -> str:
    """移除空白；保留每个文字和标点。"""
    return "".join(text.split())


def load_rows(path: pathlib.Path) -> tuple[bytes, list[tuple[bytes, dict[str, Any]]]]:
    raw = path.read_bytes()
    rows: list[tuple[bytes, dict[str, Any]]] = []
    for line_no, line in enumerate(raw.splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"targets JSONL第{line_no}行未完整写入") from exc
        if not isinstance(row, dict):
            raise ValueError(f"targets JSONL第{line_no}行不是对象")
        rows.append((line, row))
    return raw, rows


def _resolve_image(target_path: pathlib.Path, value: Any) -> pathlib.Path | None:
    if not isinstance(value, str) or not value:
        return None
    candidate = pathlib.Path(value)
    if not candidate.is_absolute():
        candidate = target_path.parent / candidate
    return candidate.expanduser().absolute()


def capture_records(
    target_path: pathlib.Path,
    target_rows: list[tuple[bytes, dict[str, Any]]],
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for target_line, target in target_rows:
        source_sha = sha256_bytes(target_line)
        captures = target.get("captures")
        if not isinstance(captures, list) or not captures:
            records.append({"targetLine": target_line, "target": target,
                            "targetLineSha256": source_sha, "capture": None,
                            "image": None, "missingCapture": True})
            continue
        for capture in captures:
            if not isinstance(capture, dict):
                capture = {}
            capture_payload = capture.get("capture")
            image_value = capture_payload.get("image") if isinstance(capture_payload, dict) else None
            records.append({"targetLine": target_line, "target": target,
                            "targetLineSha256": source_sha, "capture": capture,
                            "image": _resolve_image(target_path, image_value),
                            "missingCapture": False})
    return records


def select_observed_heading(labels: Any) -> tuple[str, str]:
    if not isinstance(labels, list):
        return "", "MISSING-HEADING-LABELS"
    observed: list[str] = []
    for label in labels:
        if not isinstance(label, dict) or label.get("class") != "QLabel":
            continue
        text = label.get("visibleText")
        if isinstance(text, str) and text in OBSERVED_DESCRIPTION_HEADINGS:
            observed.append(text)
    if len(observed) == 1:
        return observed[0], "OBSERVED-UNIQUE"
    if not observed:
        return "", "MISSING-HEADING"
    return "", "AMBIGUOUS-HEADING"


def exact_description_span(rows: Any, expected: str, marker: str) -> dict[str, Any]:
    """比较连续OCR行；只移除观察到的独立heading，正文空行会截断匹配。"""
    if not isinstance(rows, list) or not isinstance(expected, str):
        return {"exactSpanCount": 0, "exactSpans": [], "exactSingleSpan": False,
                "normalization": "remove-whitespace-only within consecutive OCR rows; preserve words and punctuation"}

    expected_folded = compact(expected)
    marker_folded = compact(marker)
    texts: list[tuple[int, str, str]] = []
    marker_adjustment: dict[str, Any] | None = None
    for source_index, row in enumerate(rows, 1):
        if not isinstance(row, dict) or not isinstance(row.get("text"), str):
            texts.append((source_index, "", ""))
            continue
        raw_text = row["text"]
        folded = compact(raw_text)
        if (marker_adjustment is None and marker_folded
                and not expected_folded.startswith(marker_folded)):
            if folded == marker_folded:
                marker_adjustment = {"row": source_index, "action": "remove-exact-observed-heading"}
                continue
            if folded.startswith(marker_folded):
                marker_adjustment = {"row": source_index, "action": "strip-exact-observed-heading-prefix"}
                folded = folded[len(marker_folded):]
                if not folded:
                    continue
        texts.append((source_index, folded, raw_text))

    hits: list[dict[str, Any]] = []
    for start in range(len(texts)):
        if not texts[start][1]:
            continue
        merged = ""
        for end in range(start, len(texts)):
            if not texts[end][1]:
                break
            merged += texts[end][1]
            if merged == expected_folded:
                hits.append({"startRow": texts[start][0],
                             "endRow": texts[end][0],
                             "rawRows": [item[2] for item in texts[start:end + 1]]})
            if len(merged) > len(expected_folded):
                break
    return {
        "expectedWhitespaceFolded": expected_folded,
        "observedDescriptionLabel": marker,
        "labelRowsAdjusted": [marker_adjustment] if marker_adjustment else [],
        "exactSpanCount": len(hits),
        "exactSpans": hits,
        "exactSingleSpan": len(hits) == 1,
        "normalization": "remove-whitespace-only within consecutive OCR rows; preserve words and punctuation",
    }


def _popup_rect_alignment(qt_rect: Any, cg_bounds: Any) -> tuple[bool, dict[str, float]]:
    """核Qt popupRect与同一CG窗口的四边距离，容差为三像素。"""
    if not isinstance(qt_rect, dict) or not isinstance(cg_bounds, dict):
        return False, {}
    try:
        rectangles = []
        for rect in (qt_rect, cg_bounds):
            values = [rect[key] for key in ("X", "Y", "Width", "Height")]
            if any(isinstance(value, bool) or not isinstance(value, (int, float))
                   or not math.isfinite(value) for value in values):
                return False, {}
            x, y, width, height = map(float, values)
            rectangles.append((x, y, x + width, y + height))
    except (KeyError, TypeError, ValueError, OverflowError):
        return False, {}
    edge_deltas = {
        edge: abs(qt_value - cg_value)
        for edge, qt_value, cg_value in zip(
            ("left", "top", "right", "bottom"), rectangles[0], rectangles[1])
    }
    return all(delta <= 3 for delta in edge_deltas.values()), edge_deltas


def capture_binding_status(
    target: dict[str, Any],
    capture: Any,
    image_sha_before: str | None,
    image_sha_after: str | None,
    *,
    source_sha_stable: bool,
    tool_sha_stable: bool,
    popup: dict[str, Any] | None = None,
) -> tuple[bool, str, dict[str, Any]]:
    target_pid = target.get("exactPid")
    if not source_sha_stable:
        return False, "REVIEW-SOURCE-SHA-DRIFT", {}
    if not tool_sha_stable:
        return False, "REVIEW-OCR-TOOL-SHA-DRIFT", {}
    if not isinstance(capture, dict):
        return False, "REVIEW-MISSING-CAPTURE", {}
    payload = capture.get("capture")
    binding = capture.get("binding")
    if not isinstance(payload, dict) or not isinstance(binding, dict):
        return False, "REVIEW-MISSING-BINDING", {}
    cg_window = payload.get("cgWindow")
    popup = popup if isinstance(popup, dict) else _popup_for(target, capture)
    matches = binding.get("matches")
    actual_cg_id = cg_window.get("kCGWindowNumber") if isinstance(cg_window, dict) else None
    main_cg_id = binding.get("mainCGWindowId")
    matching_row = (matches[0] if isinstance(matches, list) and len(matches) == 1
                    and isinstance(matches[0], dict) else {})
    actual_bounds = cg_window.get("kCGWindowBounds") if isinstance(cg_window, dict) else None
    matched_bounds = matching_row.get("kCGWindowBounds")
    popup_geometry_ok, popup_edge_deltas = _popup_rect_alignment(
        binding.get("qtPopupRect"), actual_bounds)
    reasons = {
        "exactPid": target_pid,
        "bindingPid": binding.get("exactPid"),
        "capturePid": payload.get("exactPid"),
        "cgWindowId": actual_cg_id,
        "cgWindowLayer": cg_window.get("kCGWindowLayer") if isinstance(cg_window, dict) else None,
        "cgWindowBounds": actual_bounds,
        "bindingMainCgWindowId": main_cg_id,
        "qtPopupRect": binding.get("qtPopupRect"),
        "cgOwnerPid": cg_window.get("kCGWindowOwnerPID") if isinstance(cg_window, dict) else None,
        "uniqueBindingMatchCount": len(matches) if isinstance(matches, list) else 0,
        "qtWinIdUsedAsCgWindowId": binding.get("qtWinIdUsedAsCGWindowId"),
        "captureQtWinIdUsedAsCgWindowId": payload.get("qtWinIdUsedAsCGWindowId"),
        "captureExitCode": payload.get("exitCode"),
        "captureImageSha256": payload.get("imageSha256"),
        "imageSha256Before": image_sha_before,
        "imageSha256After": image_sha_after,
        "matchedCgWindowId": matching_row.get("kCGWindowNumber"),
        "matchedCgOwnerPid": matching_row.get("kCGWindowOwnerPID"),
        "matchedCgWindowBounds": matched_bounds,
        "actualBoundsMatchUniqueRow": actual_bounds == matched_bounds,
        "qtPopupRectEdgeDeltasPx": popup_edge_deltas,
        "qtPopupRectWithin3px": popup_geometry_ok,
        "popupWindowType": popup.get("windowType"),
        "popupTargetNameMatched": popup.get("targetNameMatched"),
    }
    pid_is_int = isinstance(target_pid, int) and not isinstance(target_pid, bool)
    main_cg_id_is_int = isinstance(main_cg_id, int) and not isinstance(main_cg_id, bool)
    unique_match = isinstance(matches, list) and len(matches) == 1
    okay = bool(
        pid_is_int
        and unique_match
        and binding.get("unique") is True
        and binding.get("exactPid") == target_pid
        and payload.get("exactPid") == target_pid
        and isinstance(cg_window, dict)
        and cg_window.get("kCGWindowOwnerPID") == target_pid
        and isinstance(actual_cg_id, int)
        and not isinstance(actual_cg_id, bool)
        and main_cg_id_is_int
        and actual_cg_id != main_cg_id
        and matching_row.get("kCGWindowNumber") == actual_cg_id
        and matching_row.get("kCGWindowOwnerPID") == target_pid
        and actual_bounds == matched_bounds
        and popup_geometry_ok
    )
    okay = bool(okay and binding.get("qtWinIdUsedAsCGWindowId") is False
                and payload.get("qtWinIdUsedAsCGWindowId") is False
                and payload.get("exitCode") == 0
                and popup.get("windowType") == "ToolTip"
                and popup.get("targetNameMatched") is True
                and image_sha_before is not None
                and image_sha_before == image_sha_after
                and image_sha_before == payload.get("imageSha256"))
    return okay, "BOUND" if okay else "REVIEW-MISSING-BINDING", reasons


def classify_pixel_result(binding_status: str, heading_status: str,
                          exact_single_span: bool, tool_output_valid: bool) -> str:
    if binding_status != "BOUND":
        return binding_status if binding_status.startswith("REVIEW-") else "REVIEW-MISSING-BINDING"
    if not tool_output_valid:
        return "REVIEW-OCR-OUTPUT"
    if heading_status != "OBSERVED-UNIQUE":
        return "REVIEW-HEADING"
    if exact_single_span:
        return "OCR-EXACT"
    return "REVIEW-OCR-MISMATCH"


def _load_ocr_output(stdout: str, image: pathlib.Path) -> tuple[dict[str, Any] | None, list[dict[str, Any]], bool]:
    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return None, [], False
    if not isinstance(payload, dict) or payload.get("expected") != "" or payload.get("image") != str(image):
        return payload if isinstance(payload, dict) else None, [], False
    rows = payload.get("rows")
    valid = (isinstance(rows, list)
             and all(isinstance(row, dict) and isinstance(row.get("text"), str) for row in rows))
    return payload, rows if isinstance(rows, list) else [], valid


def _popup_for(target: dict[str, Any], capture: Any) -> dict[str, Any]:
    if not isinstance(capture, dict):
        return {}
    index = capture.get("popupIndex")
    popups = target.get("popupReadback")
    if (not isinstance(index, int) or isinstance(index, bool) or index <= 0
            or not isinstance(popups, list)):
        return {}
    position = index - 1
    return popups[position] if 0 <= position < len(popups) and isinstance(popups[position], dict) else {}


def _jsonl(path: pathlib.Path, rows: list[dict[str, Any]]) -> None:
    path.write_text("".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n"
                             for row in rows), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="对既存popup PNG运行OCR并保存逐项证据；OCR差异只需人工复核，不是产品PASS/FAIL。")
    parser.add_argument("--targets", required=True, type=pathlib.Path,
                        help="包含popupReadback/captures的目标JSONL")
    parser.add_argument("--ocr-tool", required=True, type=pathlib.Path,
                        help="接受PNG路径和空expected参数的离线OCR命令")
    parser.add_argument("--out", required=True, type=pathlib.Path,
                        help="尚不存在的输出目录")
    parser.add_argument("--limit", type=int, help="只处理前N个capture记录")
    args = parser.parse_args(argv)

    targets_input = args.targets.expanduser()
    tool_input = args.ocr_tool.expanduser()
    if not targets_input.is_file() or targets_input.is_symlink():
        raise ValueError("targets输入必须是普通文件")
    if not tool_input.is_file() or tool_input.is_symlink():
        raise ValueError("OCR工具必须是普通文件")
    target_path = targets_input.absolute()
    tool_path = tool_input.absolute()
    if args.limit is not None and args.limit < 1:
        raise ValueError("limit必须为正数")
    if args.out.exists() or args.out.is_symlink():
        raise ValueError("输出目录已存在；拒绝覆盖原始OCR")

    raw_targets, target_rows = load_rows(target_path)
    records = capture_records(target_path, target_rows)
    if args.limit is not None:
        records = records[:args.limit]
    args.out.mkdir(parents=True)

    runner_path = pathlib.Path(__file__).resolve()
    target_sha_before = sha256_bytes(raw_targets)
    tool_sha_before = sha256_file(tool_path)
    source_snapshot = {
        "targetsPath": str(target_path),
        "targetsSha256Before": target_sha_before,
        "runnerPath": str(runner_path),
        "runnerSha256": sha256_file(runner_path),
        "targetRowCount": len(target_rows),
        "ocrToolPath": str(tool_path),
        "ocrToolSha256Before": tool_sha_before,
        "expectedArgumentSentToVision": "",
        "visionMatchedFieldUsed": False,
        "createdAtEpoch": time.time(),
        "selectedCaptureCount": len(records),
    }
    (args.out / "source-snapshot.json").write_text(
        json.dumps(source_snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    command_rows: list[dict[str, Any]] = []
    raw_rows: list[dict[str, Any]] = []
    comparisons: list[dict[str, Any]] = []
    for ordinal, item in enumerate(records, 1):
        target = item["target"]
        capture = item["capture"]
        image = item["image"]
        target_sha = item["targetLineSha256"]
        identity = {
            "ordinal": ordinal,
            "targetsJsonlSha256": target_sha_before,
            "targetSourceLineSha256": target_sha,
            "targetSourceLineRaw": item["targetLine"].decode("utf-8", errors="replace"),
            "key": target.get("key"),
            "locale": target.get("locale"),
            "runtimeName": target.get("runtimeName"),
            "exactPid": target.get("exactPid"),
            "ocrToolSha256": tool_sha_before,
        }
        if item["missingCapture"]:
            command_rows.append({**identity, "expectedArgument": "", "exitCode": None,
                                 "error": "target has no capture record"})
            comparisons.append({**identity, "pixelStatus": "REVIEW-MISSING-CAPTURE"})
            continue
        popup = _popup_for(target, capture)
        labels = popup.get("labels", [])
        marker, heading_status = select_observed_heading(labels)
        expected = target.get("approvedDescription", "")
        image_before = (sha256_file(image) if image is not None and image.is_file()
                        and not image.is_symlink() else None)
        argv_tool = [str(tool_path), str(image), ""] if image is not None else []
        command = {**identity, "popupIndex": capture.get("popupIndex") if isinstance(capture, dict) else None,
                   "expectedArgument": "", "imagePath": str(image) if image else None,
                   "imageSha256Before": image_before, "argv": argv_tool}
        if image_before is None:
            command.update(exitCode=None, error="PNG missing, symlinked, or not a regular file")
            command_rows.append(command)
            comparisons.append({**identity, "popupIndex": command["popupIndex"],
                                "imageSha256": None, "captureBinding": {},
                                "pixelStatus": "REVIEW-MISSING-IMAGE"})
            continue

        try:
            process = subprocess.run(argv_tool, capture_output=True,
                                     timeout=90, check=False)
            stdout_bytes, stderr_bytes = process.stdout, process.stderr
            exit_code = process.returncode
        except (OSError, subprocess.TimeoutExpired) as exc:
            stdout_bytes = getattr(exc, "stdout", b"") or b""
            stderr_bytes = getattr(exc, "stderr", b"") or str(exc).encode("utf-8")
            if isinstance(stdout_bytes, str):
                stdout_bytes = stdout_bytes.encode("utf-8")
            if isinstance(stderr_bytes, str):
                stderr_bytes = stderr_bytes.encode("utf-8")
            exit_code = None
        stdout = stdout_bytes.decode("utf-8", errors="replace")
        stderr = stderr_bytes.decode("utf-8", errors="replace")
        image_after = sha256_file(image) if image.is_file() and not image.is_symlink() else None
        command.update(exitCode=exit_code, stderr=stderr,
                       rawStdoutBytes=len(stdout_bytes),
                       imageSha256After=image_after, imageUnchanged=image_before == image_after)
        command_rows.append(command)
        raw_rows.append({**identity, "popupIndex": command["popupIndex"],
                         "stdoutVerbatim": stdout, "stderrVerbatim": stderr,
                         "stdoutBase64": base64.b64encode(stdout_bytes).decode("ascii"),
                         "stderrBase64": base64.b64encode(stderr_bytes).decode("ascii"),
                         "toolExitCode": exit_code})

        payload, ocr_rows, tool_output_valid = _load_ocr_output(stdout, image)
        comparison = exact_description_span(ocr_rows, expected, marker)
        binding_ok, binding_status, binding_details = capture_binding_status(
            target, capture, image_before, image_after,
            source_sha_stable=True, tool_sha_stable=True, popup=popup)
        binding_details.update(targetsJsonlSha256=target_sha_before,
                               targetSourceLineSha256=target_sha,
                               ocrToolSha256=tool_sha_before)
        widget_exact = any(isinstance(label, dict)
                           and label.get("visibleText") == expected for label in labels)
        pixel_status = classify_pixel_result(binding_status, heading_status,
                                            comparison["exactSingleSpan"],
                                            tool_output_valid and exit_code in (0, 1))
        if exit_code not in (0, 1):
            pixel_status = "REVIEW-OCR-TOOL-EXIT"
        comparisons.append({**identity, "popupIndex": command["popupIndex"],
                            "expectedDescription": expected,
                            "widgetExactSeparateCredit": widget_exact,
                            "headingStatus": heading_status,
                            "captureBoundToExactPidAndPopup": binding_ok,
                            "captureBinding": binding_details,
                            "imageSha256": image_before,
                            "toolExitCode": exit_code,
                            "ocrRows": ocr_rows,
                            "comparison": comparison,
                            "pixelStatus": pixel_status,
                            "toolMatchedFieldIgnored": True})

    target_sha_after = sha256_file(target_path)
    tool_sha_after = sha256_file(tool_path)
    source_stable = target_sha_before == target_sha_after
    tool_stable = tool_sha_before == tool_sha_after
    for result in comparisons:
        if not source_stable:
            result["captureBoundToExactPidAndPopup"] = False
            result["pixelStatus"] = "REVIEW-SOURCE-SHA-DRIFT"
        elif not tool_stable:
            result["captureBoundToExactPidAndPopup"] = False
            result["pixelStatus"] = "REVIEW-OCR-TOOL-SHA-DRIFT"
    source_snapshot.update(targetsSha256After=target_sha_after,
                           targetsUnchanged=source_stable,
                           ocrToolSha256After=tool_sha_after,
                           ocrToolUnchanged=tool_stable)
    (args.out / "source-snapshot.json").write_text(
        json.dumps(source_snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    _jsonl(args.out / "vision-commands.jsonl", command_rows)
    _jsonl(args.out / "vision-raw.jsonl", raw_rows)
    _jsonl(args.out / "pixel-results.jsonl", comparisons)
    summary = {
        "collectionComplete": True,
        "selectedCaptures": len(records),
        "visionOutputs": len(raw_rows),
        "ocrExactBoundRows": sum(row.get("pixelStatus") == "OCR-EXACT" for row in comparisons),
        "reviewRequired": sum(str(row.get("pixelStatus", "")).startswith("REVIEW-")
                               for row in comparisons),
        "ocrMismatchReview": sum(row.get("pixelStatus") == "REVIEW-OCR-MISMATCH"
                                  for row in comparisons),
        "targetsUnchanged": source_stable,
        "ocrToolUnchanged": tool_stable,
        "statusNote": "Exit 0 means records were written; OCR exactness is not a UI pass and mismatches require image review.",
    }
    (args.out / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print(f"audit_help_popups: {error}", file=sys.stderr)
        raise SystemExit(2)
