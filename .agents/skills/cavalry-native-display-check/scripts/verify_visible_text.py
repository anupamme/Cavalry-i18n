#!/usr/bin/env python3
# [INPUT]: 依赖OCR JSON、预期文字、PNG截图与左上原点像素ROI。
# [OUTPUT]: 输出ROI内单行命中；PNG边缘半像素舍入分列原框。
# [POS]: 通用离线显示断言；不运行OCR、不抓屏、不操作App。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

from __future__ import annotations

import argparse
import json
import math
import pathlib
import struct
import sys
from typing import Any


def _normalize(text: str) -> str:
    return "".join(text.split())


def _png_size(path: pathlib.Path) -> tuple[int, int]:
    with path.open("rb") as image:
        header = image.read(24)
    if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError("image is not a valid PNG")
    width, height = struct.unpack(">II", header[16:24])
    if width <= 0 or height <= 0:
        raise ValueError("PNG has invalid dimensions")
    return width, height


def _validate_roi(roi: tuple[int, int, int, int], size: tuple[int, int]) -> None:
    left, top, right, bottom = roi
    width, height = size
    if left < 0 or top < 0 or right <= left or bottom <= top:
        raise ValueError("ROI must be a non-empty left,top,right,bottom pixel box")
    if right > width or bottom > height:
        raise ValueError("ROI extends outside the PNG")


def _pixel_box(row: dict[str, Any], size: tuple[int, int]) -> dict[str, float] | None:
    try:
        x, y, width, height = (float(row[key]) for key in ("x", "y", "width", "height"))
    except (KeyError, TypeError, ValueError):
        return None
    if not all(math.isfinite(value) for value in (x, y, width, height)) or width <= 0 or height <= 0:
        return None

    image_width, image_height = size
    # -- Vision以左下为原点；CLI的ROI以左上为原点 -----------------------
    return {
        "left": x * image_width,
        "top": (1.0 - y - height) * image_height,
        "right": (x + width) * image_width,
        "bottom": (1.0 - y) * image_height,
    }


def validate_ocr(
    payload: dict[str, Any],
    expected: str,
    roi: tuple[int, int, int, int],
    size: tuple[int, int],
) -> dict[str, Any]:
    _validate_roi(roi, size)
    normalized_expected = _normalize(expected)
    if not normalized_expected:
        raise ValueError("expected text must not be empty")
    if payload.get("expected") != expected:
        raise ValueError("expected text does not match the OCR request")
    rows = payload.get("rows")
    if not isinstance(rows, list):
        raise ValueError("OCR JSON rows must be an array")

    left, top, right, bottom = roi
    hits = []
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("text"), str):
            continue
        if normalized_expected not in _normalize(row["text"]):
            continue
        box = _pixel_box(row, size)
        if box is None:
            continue
        # -- 只校正PNG边缘的亚像素误差；内部ROI仍严格包含 -----------
        raw_box = box
        image_width, image_height = size
        if (box["left"] < -0.5 or box["top"] < -0.5
                or box["right"] > image_width + 0.5
                or box["bottom"] > image_height + 0.5):
            continue
        box = {
            "left": max(0.0, box["left"]),
            "top": max(0.0, box["top"]),
            "right": min(float(image_width), box["right"]),
            "bottom": min(float(image_height), box["bottom"]),
        }
        if box["right"] <= box["left"] or box["bottom"] <= box["top"]:
            continue
        if (box["left"] >= left - 1e-6 and box["top"] >= top - 1e-6
                and box["right"] <= right + 1e-6 and box["bottom"] <= bottom + 1e-6):
            hit = {
                "text": row["text"],
                "confidence": row.get("confidence"),
                "boxPixelsTopLeft": box,
            }
            if box != raw_box:
                hit["rawBoxPixelsTopLeft"] = raw_box
            hits.append(hit)
    if not hits:
        raise ValueError("no single OCR row matches expected text wholly inside ROI")

    return {
        "result": "PASS",
        "expected": expected,
        "imageSize": {"width": size[0], "height": size[1]},
        "roiPixelsTopLeft": {"left": left, "top": top, "right": right, "bottom": bottom},
        "matchedRows": hits,
        "wholeImageJoinedMatchedIgnored": payload.get("matched"),
    }


def _image_path(ocr_path: pathlib.Path, payload: dict[str, Any]) -> pathlib.Path:
    value = payload.get("image")
    if not isinstance(value, str) or not value:
        raise ValueError("OCR JSON image path is missing")
    path = pathlib.Path(value)
    return (path if path.is_absolute() else ocr_path.parent / path).resolve()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check one OCR row inside a screenshot ROI.")
    parser.add_argument("--ocr", required=True, type=pathlib.Path, help="Vision OCR JSON")
    parser.add_argument("--expected", required=True, help="Expected text for this OCR request")
    parser.add_argument("--roi", required=True, nargs=4, type=int,
                        metavar=("LEFT", "TOP", "RIGHT", "BOTTOM"),
                        help="Screenshot pixel box with top-left origin")
    args = parser.parse_args(argv)
    roi = tuple(args.roi)
    size = None
    result: dict[str, Any]
    try:
        ocr_path = args.ocr.resolve()
        payload = json.loads(ocr_path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("OCR JSON root must be an object")
        image = _image_path(ocr_path, payload)
        size = _png_size(image)
        result = validate_ocr(payload, args.expected, roi, size)
        result["image"] = str(image)
        result["ocrJson"] = str(ocr_path)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        result = {
            "result": "FAIL",
            "expected": args.expected,
            "imageSize": ({"width": size[0], "height": size[1]} if size else None),
            "roiPixelsTopLeft": {"left": roi[0], "top": roi[1], "right": roi[2], "bottom": roi[3]},
            "matchedRows": [],
            "reason": str(error),
        }
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
