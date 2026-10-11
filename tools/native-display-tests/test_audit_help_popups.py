#!/usr/bin/env python3
# [INPUT]: 依赖离线帮助OCR比较器及合成popup绑定数据。
# [OUTPUT]: 核验连续行全文、CG几何容差、OCR误识与来源漂移分流。
# [POS]: tools/native-display-tests的标准库合同；不读私档、不运行App。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

from __future__ import annotations

import sys
import unittest
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parents[2] / ".agents/skills/cavalry-native-display-check"
sys.path.insert(0, str(SKILL_DIR / "scripts"))
from audit_help_popups import (  # noqa: E402
    capture_binding_status,
    classify_pixel_result,
    exact_description_span,
    select_observed_heading,
)


class HelpPopupAuditTests(unittest.TestCase):
    @staticmethod
    def bound_capture() -> tuple[dict, dict, str]:
        digest = "a" * 64
        bounds = {"X": 495, "Y": 748, "Width": 290, "Height": 84}
        target = {
            "exactPid": 77,
            "popupReadback": [{"windowType": "ToolTip", "targetNameMatched": True}],
        }
        capture = {
            "popupIndex": 1,
            "binding": {
                "unique": True,
                "exactPid": 77,
                "mainCGWindowId": 20,
                "qtWinIdUsedAsCGWindowId": False,
                "qtPopupRect": {"X": 494, "Y": 746, "Width": 291, "Height": 83},
                "matches": [{"kCGWindowNumber": 99, "kCGWindowOwnerPID": 77,
                             "kCGWindowBounds": bounds.copy()}],
            },
            "capture": {
                "exactPid": 77,
                "cgWindow": {"kCGWindowNumber": 99, "kCGWindowOwnerPID": 77,
                              "kCGWindowBounds": bounds.copy()},
                "qtWinIdUsedAsCGWindowId": False,
                "exitCode": 0,
                "imageSha256": digest,
            },
        }
        return target, capture, digest

    def test_exact_pid_cg_and_image_hash_bind_the_popup(self) -> None:
        target, capture, digest = self.bound_capture()
        okay, status, details = capture_binding_status(
            target, capture, digest, digest,
            source_sha_stable=True, tool_sha_stable=True)
        self.assertTrue(okay)
        self.assertEqual(status, "BOUND")
        self.assertEqual(details["cgWindowId"], 99)
        self.assertEqual(details["qtPopupRectEdgeDeltasPx"],
                         {"left": 1.0, "top": 2.0, "right": 0.0, "bottom": 3.0})
        self.assertTrue(details["actualBoundsMatchUniqueRow"])

    def test_main_window_id_cannot_bind_as_popup(self) -> None:
        target, capture, digest = self.bound_capture()
        capture["binding"]["mainCGWindowId"] = 99
        okay, status, _ = capture_binding_status(
            target, capture, digest, digest,
            source_sha_stable=True, tool_sha_stable=True)
        self.assertFalse(okay)
        self.assertEqual(status, "REVIEW-MISSING-BINDING")

    def test_actual_and_unique_match_bounds_must_agree(self) -> None:
        target, capture, digest = self.bound_capture()
        capture["binding"]["matches"][0]["kCGWindowBounds"]["X"] = 496
        okay, _, details = capture_binding_status(
            target, capture, digest, digest,
            source_sha_stable=True, tool_sha_stable=True)
        self.assertFalse(okay)
        self.assertFalse(details["actualBoundsMatchUniqueRow"])

    def test_qt_popup_rect_edges_must_be_within_three_pixels(self) -> None:
        target, capture, digest = self.bound_capture()
        capture["binding"]["qtPopupRect"]["X"] = 490
        okay, _, details = capture_binding_status(
            target, capture, digest, digest,
            source_sha_stable=True, tool_sha_stable=True)
        self.assertFalse(okay)
        self.assertFalse(details["qtPopupRectWithin3px"])

    def test_popup_index_must_be_positive_integer_not_boolean(self) -> None:
        for invalid_index in (True, 0, -1):
            with self.subTest(popupIndex=invalid_index):
                target, capture, digest = self.bound_capture()
                capture["popupIndex"] = invalid_index
                okay, status, _ = capture_binding_status(
                    target, capture, digest, digest,
                    source_sha_stable=True, tool_sha_stable=True)
                self.assertFalse(okay)
                self.assertEqual(status, "REVIEW-MISSING-BINDING")

    def test_complete_multiline_description_matches_exactly(self) -> None:
        expected = "完整正文第一行。完整正文第二行。"
        rows = [
            {"text": "说明： "},
            {"text": "完整正文第一行。 "},
            {"text": "完整正文第二行。"},
        ]
        result = exact_description_span(rows, expected, "说明： ")
        self.assertTrue(result["exactSingleSpan"])
        self.assertEqual(result["labelRowsAdjusted"][0]["action"],
                         "remove-exact-observed-heading")

    def test_body_blank_row_breaks_description_span(self) -> None:
        result = exact_description_span(
            [{"text": "A"}, {"text": "   "}, {"text": "B"}], "AB", "")
        self.assertFalse(result["exactSingleSpan"])
        self.assertEqual(result["exactSpanCount"], 0)

    def test_genuinely_missing_words_need_review(self) -> None:
        expected = "支持 rectangular 与 circular 类型。"
        rows = [{"text": "说明： 支持类型。"}]
        result = exact_description_span(rows, expected, "说明： ")
        status = classify_pixel_result("BOUND", "OBSERVED-UNIQUE",
                                       result["exactSingleSpan"], True)
        self.assertFalse(result["exactSingleSpan"])
        self.assertEqual(status, "REVIEW-OCR-MISMATCH")

    def test_ocr_misrecognition_is_review_not_product_failure(self) -> None:
        expected = "类型 rectangular 与 circular。"
        rows = [{"text": "说明： 类型 rectar 与 circular。"}]
        result = exact_description_span(rows, expected, "说明： ")
        self.assertEqual(classify_pixel_result(
            "BOUND", "OBSERVED-UNIQUE", result["exactSingleSpan"], True),
            "REVIEW-OCR-MISMATCH")

    def test_heading_uses_exact_observed_label_not_body_keyword(self) -> None:
        marker, state = select_observed_heading([
            {"class": "QLabel", "visibleText": "正文提到说明，但这不是标题"},
        ])
        self.assertEqual((marker, state), ("", "MISSING-HEADING"))
        marker, state = select_observed_heading([
            {"class": "QLabel", "visibleText": "说明： "},
        ])
        self.assertEqual((marker, state), ("说明： ", "OBSERVED-UNIQUE"))

    def test_body_keyword_is_preserved_after_heading_is_removed(self) -> None:
        expected = "正文明确提到说明：但这段仍属于正文。"
        result = exact_description_span(
            [{"text": "说明： "}, {"text": expected}], expected, "说明： ")
        self.assertTrue(result["exactSingleSpan"])
        self.assertEqual(result["labelRowsAdjusted"][0]["row"], 1)

    def test_missing_capture_identity_is_unbound(self) -> None:
        okay, status, _ = capture_binding_status(
            {"exactPid": 77}, None, "a" * 64, "a" * 64,
            source_sha_stable=True, tool_sha_stable=True)
        self.assertFalse(okay)
        self.assertEqual(status, "REVIEW-MISSING-CAPTURE")

    def test_missing_popup_binding_is_not_pixel_credit(self) -> None:
        okay, status, _ = capture_binding_status(
            {"exactPid": 77}, {"capture": {}}, "a" * 64, "a" * 64,
            source_sha_stable=True, tool_sha_stable=True)
        self.assertFalse(okay)
        self.assertEqual(status, "REVIEW-MISSING-BINDING")

    def test_targets_sha_drift_requires_review(self) -> None:
        okay, status, _ = capture_binding_status(
            {"exactPid": 77}, None, "a" * 64, "a" * 64,
            source_sha_stable=False, tool_sha_stable=True)
        self.assertFalse(okay)
        self.assertEqual(status, "REVIEW-SOURCE-SHA-DRIFT")

    def test_ocr_tool_sha_drift_requires_review(self) -> None:
        okay, status, _ = capture_binding_status(
            {"exactPid": 77}, None, "a" * 64, "a" * 64,
            source_sha_stable=True, tool_sha_stable=False)
        self.assertFalse(okay)
        self.assertEqual(status, "REVIEW-OCR-TOOL-SHA-DRIFT")


if __name__ == "__main__":
    unittest.main(verbosity=2)
