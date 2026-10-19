"""
[INPUT]: 依赖冻结93项表、213项前像SHA、44个直接键与固定前缀。
[OUTPUT]: 核对旧前缀、40条批准行及每语4条派生组合行。
[POS]: GetPath文本的source-bound合同；不参与运行时投影。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import pathlib
import re
import sys
from collections import defaultdict

BASELINE_SHA256 = "45f03bfedb747a729d2a71f7f2f3b021c14046d2f72c524c2494f6d1f30e2147"
BASELINE_213_LANES_SHA256 = "785452552f4d75f34f27c9d4f465583483fb9dabc932ce243932d6ab55e61224"
SOURCE_RELATIVE = pathlib.Path("languages/native/remaining_global_ui_06.js")
BASELINE_NAME = "getpath_font_texts.93.baseline.inc"
LANES = {
    "zh-Hans": "kZhHansEntries",
    "zh-Hant": "kZhHantEntries",
    "ja_JP": "kJaJpEntries",
}
DIRECT_KEYS = (
    "tool.camera.help.dolly", "tool.camera.help.orbit", "tool.camera.help.trackXY",
    "tool.forgeDynamics.help.goBackToStart", "tool.forgeDynamics.help.moveInputShapes",
    "tool.help.key.click", "tool.help.key.doubleClick",
    "tool.knife.help.cutAction", "tool.knife.help.label",
    "tool.pen.help.bezierAngleSnap", "tool.pen.help.clearPath", "tool.pen.help.createAsMask",
    "tool.pen.help.disableSnapping", "tool.pen.help.startNewContour", "tool.pen.help.startNewShape",
    "tool.pen.help.straightLine",
    "tool.pencil.help.clearPath", "tool.pencil.help.createAsMask", "tool.pencil.help.newShape",
    "tool.pivot.help.constrainAxis", "tool.pivot.help.movePivotLayerMoves",
    "tool.pivot.help.movePivotLayerStays", "tool.pivot.help.quickSetLayerMoves",
    "tool.pivot.help.quickSetLayerStays", "tool.pivot.help.toggleSnapping",
    "tool.shared.help.constrainProportions", "tool.shared.help.createFromCentre",
    "tool.shared.help.snap90", "tool.shared.shortcut.drag",
    "tool.skeleton.help.rotateBone", "tool.skeleton.help.select",
    "tool.skeleton.help.startFinishBone", "tool.skeleton.help.stretchBone",
    "tool.skeleton.shortcut.clickBone", "tool.skeleton.shortcut.clickHandle",
    "tool.skeleton.shortcut.clickHandleDrag",
    "tool.strokeWidth.help.addPoint", "tool.strokeWidth.help.positionOnly",
    "tool.strokeWidth.help.removePoint", "tool.strokeWidth.help.typeWidth",
    "tool.strokeWidth.help.widthOnly",
    "tool.tracking.help.addTracker", "tool.tracking.help.newKeyframe",
    "tool.tracking.help.removeTracker",
)
PRESERVE_KEYS = {
    "tool.help.key.delete": "Delete",
    "tool.help.key.space": "Space",
}
KNOWN_DUPLICATE_GROUPS = {
    frozenset(("tool.pen.help.clearPath", "tool.pencil.help.clearPath")),
    frozenset(("tool.pen.help.createAsMask", "tool.pencil.help.createAsMask")),
}
KNOWN_EXISTING_MATCHES = {
    "tool.pen.help.bezierAngleSnap": "tool.editShape.help.bezierAngleSnap",
    "tool.pen.help.disableSnapping": "tool.editShape.help.disableSnapping",
}
SUFFIX_KEY = "tool.skeleton.shortcut.clickHandleDragSuffix"
COMPOSITE_ROWS = (
    ("tool.shared.shortcut.drag", "Option/Alt + "),
    ("tool.shared.shortcut.drag", "Shift + "),
    ("tool.shared.shortcut.drag", "Cmd/Ctrl + "),
    (SUFFIX_KEY, "Option/Alt + "),
)
COMPOSITE_SOURCE_TEXTS = {
    "tool.shared.shortcut.drag": "Drag",
    SUFFIX_KEY: "click handle + drag",
}
COMPOSITE_BLOCK = re.compile(
    r'(?m)^    // 7[1-4] ToolHelp: composite source=[A-Za-z0-9_.]+; '
    r'fixed prefix="(?:\\.|[^"\\])*"\n'
    r'    \{native_getpath_font::Owner::ToolHelp, "(?:\\.|[^"\\])*"\},(?:\n|$)'
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _catalog(root: pathlib.Path) -> tuple[dict[str, dict], dict[str, int], dict[str, str]]:
    path = root / SOURCE_RELATIVE
    records: dict[str, dict] = {}
    lines: dict[str, int] = {}
    raw_lines: dict[str, str] = {}
    for line_number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        candidate = raw.strip().rstrip(",")
        if not candidate.startswith("{"):
            continue
        try:
            entry = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        key = entry.get("key")
        if key:
            records[key] = entry
            lines[key] = line_number
            raw_lines[key] = raw
    return records, lines, raw_lines


def _lane_body(table: str, lane: str) -> str:
    marker = f"static constexpr TextEntry {lane}[] = {{\n"
    require(table.count(marker) == 1, f"lane marker must be unique: {lane}")
    start = table.index(marker) + len(marker)
    end = table.find("\n};", start)
    require(end >= 0, f"lane close is missing: {lane}")
    return table[start:end]


def _pre_composite_lane_bytes(table: str) -> tuple[bytes, int]:
    chunks: list[str] = []
    removed = 0
    for lane in LANES.values():
        marker = f"static constexpr TextEntry {lane}[] = {{\n"
        body = _lane_body(table, lane)
        legacy_body, count = COMPOSITE_BLOCK.subn("", body)
        removed += count
        legacy_body = legacy_body.rstrip("\n")
        chunks.append(marker + legacy_body + "\n};\n")
    return "".join(chunks).encode("utf-8"), removed


def _rows(body: str, lane: str) -> list[dict[str, object]]:
    pattern = re.compile(
        r"(?m)^\s*//\s*(\d+)\s+(ToolHelp|ViewportStatus):\s*([^\r\n]+)\r?\n"
        r'\s*\{native_getpath_font::Owner::(ToolHelp|ViewportStatus),\s*("(?:\\.|[^"\\])*")\},$'
    )
    matches = list(pattern.finditer(body))
    parsed: list[dict[str, object]] = []
    for match in matches:
        descriptor = match.group(3)
        composite = re.fullmatch(
            r'composite source=([A-Za-z0-9_.]+); fixed prefix=("(?:\\.|[^"\\])*")',
            descriptor,
        )
        if composite:
            keys = [composite.group(1)]
            prefix = ast.literal_eval(composite.group(2))
        else:
            keys = [part.strip() for part in descriptor.split(" + ")]
            prefix = None
        owner = match.group(4)
        require(match.group(2) == owner, f"owner/comment mismatch in {lane}: {keys}")
        row: dict[str, object] = {
            "index": int(match.group(1)),
            "owner": owner,
            "keys": keys,
            "text": ast.literal_eval(match.group(5)),
        }
        if composite:
            row["compositePrefix"] = prefix
        parsed.append(row)
    return parsed


def _approved(root: pathlib.Path) -> tuple[dict[str, dict], dict[str, int], dict[str, str]]:
    records, lines, raw_lines = _catalog(root)
    require(len(DIRECT_KEYS) == 44 and len(set(DIRECT_KEYS)) == 44,
            "direct-key manifest must contain 44 unique keys")
    require(set(DIRECT_KEYS).isdisjoint(PRESERVE_KEYS), "preserve key entered translate set")
    for key in (*DIRECT_KEYS, *PRESERVE_KEYS, SUFFIX_KEY):
        require(key in records, f"approved source key is missing: {key}")
    for key in (*DIRECT_KEYS, SUFFIX_KEY):
        entry = records[key]
        require(entry.get("catalogId") == "Definitions/Translation/appStrings" and
                entry.get("fieldPath") == [key], f"source identity differs: {key}")
        for locale in LANES:
            item = entry.get("translations", {}).get(locale, {})
            value = item.get("text")
            require(item.get("decision") == "translate" and isinstance(value, str) and value,
                    f"approved translation missing: {locale}/{key}")
            require(value in raw_lines[key], f"translation is not literal UTF-8 source text: {locale}/{key}")
    for key, source in PRESERVE_KEYS.items():
        entry = records[key]
        require(entry.get("source") == source, f"preserve source differs: {key}")
        require(all(entry.get("translations", {}).get(locale, {}).get("decision") == "preserve" and
                    entry.get("translations", {}).get(locale, {}).get("text") == source
                    for locale in LANES), f"preserve decision differs: {key}")
    for key, source in COMPOSITE_SOURCE_TEXTS.items():
        require(records[key].get("source") == source,
                f"fixed composite source text differs: {key}")
    return records, lines, raw_lines


def verify_toolhelp_source_contract(
    root: pathlib.Path, source: pathlib.Path, table_path: pathlib.Path | None = None
) -> dict[str, object]:
    root = root.resolve()
    source = source.resolve()
    baseline_path = source / BASELINE_NAME
    baseline_bytes = baseline_path.read_bytes()
    require(_sha256(baseline_bytes) == BASELINE_SHA256,
            "frozen 93-row GetPath baseline SHA-256 differs")
    baseline = baseline_bytes.decode("utf-8")
    target_path = table_path.resolve() if table_path else source / "getpath_font_texts.inc"
    target = target_path.read_text(encoding="utf-8")
    pre_composite, composite_blocks = _pre_composite_lane_bytes(target)
    require(composite_blocks in (0, 12),
            f"expected no composite rows or 12 appended rows; found {composite_blocks}")
    require(_sha256(pre_composite) == BASELINE_213_LANES_SHA256,
            "pre-composite 213-row lane bytes differ")
    records, source_lines, _ = _approved(root)

    baseline_rows: dict[str, dict[str, list[dict[str, object]]]] = {}
    current_rows: dict[str, dict[str, list[dict[str, object]]]] = {}
    for locale, lane in LANES.items():
        old_body = _lane_body(baseline, lane)
        new_body = _lane_body(target, lane)
        old_rows = _rows(old_body, lane)
        new_rows = _rows(new_body, lane)
        require(len(old_rows) == 31, f"baseline lane must hold 31 entries: {locale}")
        if not new_body.startswith(old_body):
            raise ValueError(f"first 31 bytes/rows changed in {locale} lane")
        if len(new_rows) != 75:
            raise ValueError(f"{locale} lane must contain 75 rows; found {len(new_rows)}")
        require([row["index"] for row in new_rows] == list(range(75)),
                f"{locale} row indexes must be contiguous 0..74")
        baseline_rows[locale] = {"rows": old_rows}
        current_rows[locale] = {"rows": new_rows}
        space = old_rows[3]
        require(space["owner"] == "ToolHelp" and space["keys"] == ["tool.help.key.space"] and
                space["text"] == "Space", f"preserved Space baseline row differs: {locale}")

    # A hit counts only when all three owner-specific baseline strings match.
    baseline_tuples: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    hans_rows = baseline_rows["zh-Hans"]["rows"]
    for row_index, hans in enumerate(hans_rows):
        other = [baseline_rows[locale]["rows"][row_index] for locale in ("zh-Hant", "ja_JP")]
        require(all(item["index"] == row_index and item["owner"] == hans["owner"] for item in other),
                f"baseline lane order/owner differs at row {row_index}")
        if hans["owner"] == "ToolHelp":
            triple = (str(hans["text"]), str(other[0]["text"]), str(other[1]["text"]))
            baseline_tuples[triple].append(str(hans["keys"][0]))

    grouped: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    for key in DIRECT_KEYS:
        triple = tuple(records[key]["translations"][locale]["text"] for locale in LANES)
        grouped[triple].append(key)
    require(len(grouped) == 42, f"expected 42 unique triples; found {len(grouped)}")
    duplicate_groups = {frozenset(keys) for keys in grouped.values() if len(keys) > 1}
    require(duplicate_groups == KNOWN_DUPLICATE_GROUPS,
            f"direct-key duplicate groups differ: {sorted(map(sorted, duplicate_groups))}")

    existing_matches: dict[str, str] = {}
    expected_new: list[tuple[tuple[str, str, str], list[str]]] = []
    for triple, keys in grouped.items():
        hits = baseline_tuples.get(triple, [])
        if hits:
            require(len(keys) == 1, f"duplicate candidate group already present: {keys}")
            expected_key = KNOWN_EXISTING_MATCHES.get(keys[0])
            require(len(hits) == 1 and hits[0] == expected_key,
                    f"unexpected existing 93-row match: {keys} -> {hits}")
            existing_matches[keys[0]] = hits[0]
        else:
            expected_new.append((triple, sorted(keys, key=source_lines.get)))
    require(existing_matches == KNOWN_EXISTING_MATCHES,
            f"exact 93-row matches differ: {existing_matches}")
    expected_new.sort(key=lambda item: min(source_lines[key] for key in item[1]))
    require(len(expected_new) == 40, f"expected 40 missing triples; found {len(expected_new)}")

    for locale in LANES:
        tail = current_rows[locale]["rows"][31:]
        require(len(tail) == 44, f"{locale} tail must contain 44 new rows")
        expected_text_index = list(LANES).index(locale)
        for index, (row, (triple, keys)) in enumerate(zip(tail[:40], expected_new)):
            require(row["index"] == 31 + index and row["owner"] == "ToolHelp",
                    f"new row owner/index differs: {locale}/{31 + index}")
            require(row["keys"] == keys, f"source keys differ in {locale}/{31 + index}: {row['keys']}")
            require(row["text"] == triple[expected_text_index],
                    f"approved UTF-8 translation differs: {locale}/{keys}")
        require(all(row["text"] not in PRESERVE_KEYS.values() for row in tail),
                f"preserved key text entered new {locale} rows")

        for offset, (source_key, prefix) in enumerate(COMPOSITE_ROWS):
            entry = records[source_key]
            source_text = prefix + entry["source"]
            require(source_text not in {
                str(item["text"]) for item in baseline_rows[locale]["rows"]
            }, f"composite source unexpectedly exists in 93-row baseline: {source_text}")
            expected_text = prefix + entry["translations"][locale]["text"]
            row = tail[40 + offset]
            require(row["index"] == 71 + offset and row["owner"] == "ToolHelp" and
                    row["keys"] == [source_key] and row.get("compositePrefix") == prefix,
                    f"composite source/prefix/order differs: {locale}/{71 + offset}")
            require(row["text"] == expected_text,
                    f"composite text differs from fixed prefix plus approved fragment: {locale}/{source_key}")

    suffix = records[SUFFIX_KEY]
    suffix_triple = tuple(suffix["translations"][locale]["text"] for locale in LANES)
    require(suffix_triple not in {triple for triple, _ in expected_new},
            "Skeleton suffix must not be registered as a standalone full string")
    require(records["tool.help.key.space"]["translations"]["zh-Hans"]["text"] == "Space",
            "Space preserve value changed")
    return {
        "baselineSha256": BASELINE_SHA256,
        "preserved213LaneSha256": BASELINE_213_LANES_SHA256,
        "preserved213ByteExact": True,
        "currentTableSha256": _sha256(target_path.read_bytes()),
        "directTranslatedKeys": len(DIRECT_KEYS),
        "uniqueTriples": len(grouped),
        "existingExactMatches": existing_matches,
        "newRowsPerLocale": 40,
        "compositeRowsPerLocale": 4,
        "compositeKinds": 4,
        "totalNewSlots": 132,
        "deletePreserved": True,
        "spaceAlreadyInBaseline": True,
        "skeletonSuffixExcluded": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate appended fixed ToolHelp source rows.")
    parser.add_argument("repo_root", type=pathlib.Path)
    parser.add_argument("source_dir", type=pathlib.Path)
    parser.add_argument("--table", type=pathlib.Path,
                        help="optional isolated table fixture for the expected RED check")
    args = parser.parse_args()
    try:
        result = verify_toolhelp_source_contract(args.repo_root, args.source_dir, args.table)
    except (OSError, ValueError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print("PASS: frozen 93 rows, 40 approved ToolHelp rows, and four fixed-prefix composites per locale")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
