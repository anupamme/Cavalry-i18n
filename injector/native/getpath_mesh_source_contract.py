"""
[INPUT]: 依赖冻结的81项基线表与remaining_global_ui_06四个Mesh键。
[OUTPUT]: 验证三语GetPath lane仅追加12项且旧行逐字节保留。
[POS]: 候选合同辅助器；不参与产品运行或文本投影。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re

BASELINE_SHA256 = "8b64f7893adf55ff938a27294596ce635983b5541aa5882cb06d98a25d1271f2"
SOURCE_RELATIVE = pathlib.Path("languages/native/remaining_global_ui_06.js")
KEYS = (
    "tool.mesh.help.addEditBind",
    "tool.mesh.help.createEdge",
    "tool.mesh.help.disableSoftSelection",
    "tool.mesh.help.softSelectionSize",
)
LANES = {
    "zh-Hans": "kZhHansEntries",
    "zh-Hant": "kZhHantEntries",
    "ja_JP": "kJaJpEntries",
}


def _lane_body(table: str, lane: str) -> str:
    marker = f"static constexpr TextEntry {lane}[] = {{\n"
    if table.count(marker) != 1:
        raise ValueError(f"GetPath lane marker must be unique: {lane}")
    start = table.index(marker) + len(marker)
    end = table.find("\n};", start)
    if end < 0:
        raise ValueError(f"GetPath lane close is missing: {lane}")
    return table[start:end]


def _row_count(body: str) -> int:
    return len(re.findall(
        r"\{native_getpath_font::Owner::(?:ToolHelp|ViewportStatus),", body))


def _approved_entries(root: pathlib.Path) -> dict[str, dict[str, object]]:
    rows = (root / SOURCE_RELATIVE).read_text(encoding="utf-8").splitlines()
    approved: dict[str, dict[str, object]] = {}
    for key in KEYS:
        matches = [json.loads(line.rstrip(",")) for line in rows
                   if f'"key":"{key}"' in line]
        if len(matches) != 1:
            raise ValueError(f"approved Mesh key must occur once: {key}")
        entry = matches[0]
        if (entry.get("catalogId") != "Definitions/Translation/appStrings" or
                entry.get("fieldPath") != [key]):
            raise ValueError(f"approved Mesh source identity differs: {key}")
        translations = entry.get("translations")
        if not isinstance(translations, dict):
            raise ValueError(f"approved Mesh translations are missing: {key}")
        for locale in LANES:
            translated = translations.get(locale)
            if (not isinstance(translated, dict) or
                    translated.get("decision") != "translate" or
                    not isinstance(translated.get("text"), str) or
                    not translated["text"]):
                raise ValueError(f"approved Mesh translation is missing: {locale}/{key}")
        approved[key] = entry
    return approved


def _mesh_tail(body: str) -> list[tuple[int, str, str, str]]:
    pattern = re.compile(
        r"(?m)^\s*//\s*(\d+) ToolHelp: ([^\r\n]+)\r?\n"
        r"\s*\{native_getpath_font::Owner::ToolHelp, \"([^\"\r\n]+)\"\},$")
    return [(int(index), key, "ToolHelp", text)
            for index, key, text in pattern.findall(body)]


def verify_mesh_getpath_contract(root: pathlib.Path,
                                 source: pathlib.Path) -> None:
    baseline_path = source / "getpath_font_texts.81.baseline.inc"
    baseline_bytes = baseline_path.read_bytes()
    if hashlib.sha256(baseline_bytes).hexdigest() != BASELINE_SHA256:
        raise ValueError("81项GetPath基线fixture摘要不匹配")
    baseline = baseline_bytes.decode("utf-8")
    current = (source / "getpath_font_texts.inc").read_text(encoding="utf-8")
    approved = _approved_entries(root)

    for locale, lane in LANES.items():
        old_body = _lane_body(baseline, lane)
        new_body = _lane_body(current, lane)
        if _row_count(old_body) != 27 or _row_count(new_body) != 31:
            raise ValueError(f"{locale} GetPath lane must grow from 27 to 31 rows")
        if not new_body.startswith(old_body):
            raise ValueError(f"{locale} GetPath lane changed one of its frozen 27 rows")
        if len(new_body) <= len(old_body):
            raise ValueError(f"{locale} Mesh ToolHelp tail is missing")
        expected = [
            (27 + index, key, "ToolHelp",
             approved[key]["translations"][locale]["text"])
            for index, key in enumerate(KEYS)
        ]
        actual = _mesh_tail(new_body[len(old_body):])
        if actual != expected:
            raise ValueError(f"{locale} Mesh GetPath tail differs from approved source")

    if _row_count(current) != 93:
        raise ValueError("GetPath must contain exactly 93 fixed locale rows")


def main() -> int:
    import sys
    if len(sys.argv) != 2:
        raise SystemExit("usage: getpath_mesh_source_contract.py <candidate-source-root>")
    root = pathlib.Path(sys.argv[1]).resolve()
    verify_mesh_getpath_contract(root, root / "injector/native")
    print("PASS: frozen 81 rows unchanged; 12 Mesh strings match approved source")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
