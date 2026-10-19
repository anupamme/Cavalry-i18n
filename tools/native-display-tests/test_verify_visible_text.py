#!/usr/bin/env python3
# [INPUT]: 依赖verify_visible_text的纯OCR行与ROI合同。
# [OUTPUT]: 断言单行ROI、PNG亚像素边缘与内部越界拒绝。
# [POS]: tools/native-display-tests的ROI合同；不读私档或运行App。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

from __future__ import annotations

import unittest

from pathlib import Path
import sys

SKILL_DIR = Path(__file__).resolve().parents[2] / ".agents/skills/cavalry-native-display-check"
sys.path.insert(0, str(SKILL_DIR / "scripts"))
from verify_visible_text import validate_ocr


SIZE = (1710, 1073)
ROI = (136, 632, 326, 676)
EXPECTED = "右键单击以添加着色器"


def _vision_row(text: str, left: float, top: float, right: float, bottom: float) -> dict[str, object]:
    width, height = SIZE
    return {
        "text": text,
        "confidence": 1.0,
        "x": left / width,
        "y": 1.0 - bottom / height,
        "width": (right - left) / width,
        "height": (bottom - top) / height,
    }


class VisibleTextTests(unittest.TestCase):
    def test_expected_row_inside_roi_passes(self) -> None:
        payload = {"expected": EXPECTED, "matched": True,
                   "rows": [_vision_row(EXPECTED, 160, 645, 290, 663)]}
        result = validate_ocr(payload, EXPECTED, ROI, SIZE)
        self.assertEqual(result["result"], "PASS")
        self.assertEqual(result["matchedRows"][0]["text"], EXPECTED)

    def test_other_pane_match_is_rejected(self) -> None:
        payload = {"expected": EXPECTED, "matched": True,
                   "rows": [_vision_row(EXPECTED, 800, 645, 930, 663)]}
        with self.assertRaisesRegex(ValueError, "no single OCR row"):
            validate_ocr(payload, EXPECTED, ROI, SIZE)

    def test_text_joined_across_rows_is_rejected(self) -> None:
        payload = {"expected": EXPECTED, "matched": True, "rows": [
            _vision_row("右键单击以添加", 160, 645, 230, 663),
            _vision_row("着色器", 230, 645, 290, 663),
        ]}
        with self.assertRaisesRegex(ValueError, "no single OCR row"):
            validate_ocr(payload, EXPECTED, ROI, SIZE)

    def test_different_ocr_expected_text_is_rejected(self) -> None:
        payload = {"expected": "different text", "rows": []}
        with self.assertRaisesRegex(ValueError, "does not match"):
            validate_ocr(payload, EXPECTED, ROI, SIZE)

    def test_empty_expected_text_is_rejected(self) -> None:
        payload = {"expected": "", "rows": []}
        with self.assertRaisesRegex(ValueError, "must not be empty"):
            validate_ocr(payload, "   ", ROI, SIZE)

    def test_png_left_subpixel_rounding_preserves_raw_box(self) -> None:
        payload = {"expected": EXPECTED,
                   "rows": [_vision_row(EXPECTED, -0.037, 645, 100, 663)]}
        result = validate_ocr(payload, EXPECTED, (0, 632, 120, 676), SIZE)
        hit = result["matchedRows"][0]
        self.assertEqual(hit["boxPixelsTopLeft"]["left"], 0.0)
        self.assertAlmostEqual(hit["rawBoxPixelsTopLeft"]["left"], -0.037)

    def test_png_right_bottom_subpixel_rounding_passes(self) -> None:
        width, height = SIZE
        payload = {"expected": EXPECTED,
                   "rows": [_vision_row(EXPECTED, 1600, 1050, width + 0.2, height + 0.2)]}
        result = validate_ocr(payload, EXPECTED, (1580, 1040, width, height), SIZE)
        hit = result["matchedRows"][0]["boxPixelsTopLeft"]
        self.assertEqual((hit["right"], hit["bottom"]), (width, height))

    def test_png_edge_beyond_half_pixel_is_rejected(self) -> None:
        payload = {"expected": EXPECTED,
                   "rows": [_vision_row(EXPECTED, -0.6, 645, 100, 663)]}
        with self.assertRaisesRegex(ValueError, "no single OCR row"):
            validate_ocr(payload, EXPECTED, (0, 632, 120, 676), SIZE)

    def test_whole_row_outside_png_within_half_pixel_is_rejected(self) -> None:
        payload = {"expected": EXPECTED,
                   "rows": [_vision_row(EXPECTED, -0.4, 645, -0.1, 663)]}
        with self.assertRaisesRegex(ValueError, "no single OCR row"):
            validate_ocr(payload, EXPECTED, (0, 632, 120, 676), SIZE)

    def test_internal_roi_subpixel_overrun_is_not_clipped(self) -> None:
        payload = {"expected": EXPECTED,
                   "rows": [_vision_row(EXPECTED, ROI[0] - 0.037, 645, 290, 663)]}
        with self.assertRaisesRegex(ValueError, "no single OCR row"):
            validate_ocr(payload, EXPECTED, ROI, SIZE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
