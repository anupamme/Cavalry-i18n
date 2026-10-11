#!/usr/bin/env python3
# [INPUT]: 依赖 assets 中的Timeline、双隐藏插件CV及Sound脚本和expected JSON。
# [OUTPUT]: 验证场景结构、Sound脚本API边界与预期；不运行App。
# [POS]: tools/native-display-tests的输入合同；不打开App或证明显示。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path
from typing import Any


SKILL_DIR = Path(__file__).resolve().parents[2] / ".agents/skills/cavalry-native-display-check"
ASSET_DIR = SKILL_DIR / "assets"
SCENE_PATH = ASSET_DIR / "timeline-six-names.cv"
EXPECTED_PATH = ASSET_DIR / "timeline-six-names.expected.json"
FILTER_PAIR_SCENE_PATH = ASSET_DIR / "hidden-plugin-pair.cv"
FILTER_PAIR_EXPECTED_PATH = ASSET_DIR / "hidden-plugin-pair.expected.json"
SOUND_SCRIPT_PATH = ASSET_DIR / "sound-empty-file.js"
SOUND_EXPECTED_PATH = ASSET_DIR / "sound-empty-file.expected.json"

LONG_NAME = "文字名称の長いテスト" * 8
EXPECTED_ROWS = [
    (0, "javaScriptShape#6", LONG_NAME),
    (1, "javaScriptShape#5", "Text Box 自定义33"),
    (2, "javaScriptShape#4", "変形テスト 2"),
    (3, "javaScriptShape#3", "圖層測試999"),
    (4, "javaScriptShape#2", "ASCII Control33"),
    (5, "javaScriptShape#1", "控制测试33"),
]

DEFAULT_ELLIPSE_EXPRESSION = (
    "function getPath() {\n"
    "    var path = new cavalry.Path()\n"
    "    path.addEllipse(0,0,200,200);\n"
    "    return path;\n"
    "}\n"
    "\n"
    "getPath();\n"
)

URL_PATTERN = re.compile(r"\b[a-z][a-z0-9+.-]*://", re.IGNORECASE)
ABSOLUTE_PATH_PATTERN = re.compile(
    r"(?<![\w:])/(?:[^/\s\"'<>]+(?:/[^\s\"'<>]*)*)?"
)
WINDOW_PATH_PATTERN = re.compile(r"(?<!\w)[A-Za-z]:\\|\\\\")


def _load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise AssertionError(f"{path.name} must contain a JSON object")
    return value


def _attribute_value(node: dict[str, Any], name: str) -> Any:
    return node.get("attributes", {}).get(name, {}).get("value")


def _strings(value: Any):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for key, item in value.items():
            yield from _strings(key)
            yield from _strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from _strings(item)


class TimelineSceneFixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.expected = _load_json(EXPECTED_PATH)
        cls.scene = _load_json(SCENE_PATH)
        cls.nodes = {node["nodeId"]: node for node in cls.scene.get("nodes", [])}

    def test_manifest_targets_scene_version_and_composition(self) -> None:
        self.assertEqual(self.expected["scene"], SCENE_PATH.name)
        self.assertEqual(self.expected["cavalryTarget"], "2.8")
        self.assertEqual(self.expected["sceneFileVersion"], self.scene["version"])
        self.assertEqual(self.expected["activeComposition"], self.scene["activeComp"])
        self.assertEqual(self.expected["activeComposition"], "compNode#1")
        self.assertEqual(
            self.expected["acceptanceStatus"],
            "input only; verify actual load and display for each candidate",
        )
        self.assertEqual(self.nodes["compNode#1"]["nodeType"], "compNode")

    def test_manifest_row_order_and_scene_nice_names_match(self) -> None:
        rows = self.expected["rows"]
        actual_rows = [(row["row"], row["nodeId"], row["name"]) for row in rows]
        self.assertEqual(actual_rows, EXPECTED_ROWS)
        self.assertEqual(self.expected["topLevelLayerCount"], 6)

        composition_meta = next(
            (
                item
                for item in self.scene.get("nodeMeta", [])
                if item.get("nodeId") == self.expected["activeComposition"]
            ),
            None,
        )
        self.assertIsNotNone(composition_meta, "active composition metadata is required")
        self.assertEqual(
            composition_meta["children"],
            [node_id for _, node_id, _ in EXPECTED_ROWS],
        )

        shape_ids = {
            node_id
            for node_id, node in self.nodes.items()
            if node["nodeType"] == "javaScriptShape"
        }
        self.assertEqual(shape_ids, {node_id for _, node_id, _ in EXPECTED_ROWS})
        for _, node_id, expected_name in EXPECTED_ROWS:
            self.assertEqual(_attribute_value(self.nodes[node_id], "niceName"), expected_name)

    def test_names_cover_six_unique_display_cases(self) -> None:
        names = [name for _, _, name in EXPECTED_ROWS]
        self.assertEqual(len(names), 6)
        self.assertEqual(len(set(names)), 6)
        self.assertIn("ASCII Control33", names)
        self.assertIn("控制测试33", names)
        self.assertIn("圖層測試999", names)
        self.assertIn("変形テスト 2", names)
        self.assertIn("Text Box 自定义33", names)
        self.assertTrue(all(name.isascii() for name in names if name == "ASCII Control33"))
        self.assertEqual(len(LONG_NAME), 80)
        self.assertIn(LONG_NAME, names)

    def test_scene_has_no_external_assets_paths_or_urls(self) -> None:
        self.assertEqual(self.expected["externalAssets"], [])
        self.assertIn(self.scene.get("externalAssets", []), ([], None))
        self.assertEqual(self.scene["referenceData"], {})

        for document in (self.expected, self.scene):
            for value in _strings(document):
                self.assertIsNone(URL_PATTERN.search(value), value)
                self.assertIsNone(ABSOLUTE_PATH_PATTERN.search(value), value)
                self.assertIsNone(WINDOW_PATH_PATTERN.search(value), value)

    def test_six_shapes_use_only_the_known_default_ellipse_expression(self) -> None:
        javascript_nodes = {
            node_id: node
            for node_id, node in self.nodes.items()
            if node["nodeType"] == "javaScript"
        }
        self.assertEqual(len(javascript_nodes), 6)

        for _, shape_id, _ in EXPECTED_ROWS:
            incoming = [
                edge
                for edge in self.scene["connections"]
                if edge["to"] == f"{shape_id}.generator"
            ]
            self.assertEqual(len(incoming), 1, shape_id)
            source_id = incoming[0]["from"].removesuffix(".id")
            self.assertIn(source_id, javascript_nodes)
            self.assertEqual(
                _attribute_value(javascript_nodes[source_id], "expression"),
                DEFAULT_ELLIPSE_EXPRESSION,
                source_id,
            )


class HiddenPluginPairFixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.expected = _load_json(FILTER_PAIR_EXPECTED_PATH)
        cls.scene = _load_json(FILTER_PAIR_SCENE_PATH)
        cls.nodes = {node["nodeId"]: node for node in cls.scene.get("nodes", [])}

    def test_manifest_version_and_composition_rows_match(self) -> None:
        self.assertEqual(self.expected["scene"], FILTER_PAIR_SCENE_PATH.name)
        self.assertEqual(self.expected["cavalryTarget"], "2.8")
        self.assertEqual(self.expected["sceneFileVersion"], self.scene["version"])
        self.assertEqual(
            self.expected["normalSaveSourceSha256"],
            hashlib.sha256(FILTER_PAIR_SCENE_PATH.read_bytes()).hexdigest(),
        )
        self.assertEqual(self.scene["resourceType"], self.expected["resourceType"])
        self.assertEqual(self.scene["activeComp"], self.expected["activeComposition"])

        composition = self.nodes[self.expected["activeComposition"]]
        self.assertEqual(composition["nodeType"], self.expected["compositionNodeType"])
        composition_meta = next(
            item for item in self.scene["nodeMeta"]
            if item.get("nodeId") == self.expected["activeComposition"]
        )
        expected_rows = self.expected["rows"]
        expected_ids = [row["nodeId"] for row in expected_rows]
        self.assertEqual(composition_meta["children"], self.expected["compositionChildren"])
        self.assertEqual(expected_ids, self.expected["compositionChildren"])
        self.assertEqual([row["row"] for row in expected_rows], list(range(len(expected_rows))))
        for row in expected_rows:
            node = self.nodes[row["nodeId"]]
            self.assertEqual(node["nodeType"], row["nodeType"])
            self.assertEqual(_attribute_value(node, "niceName"), row["niceName"])

    def test_compound_nodes_keep_custom_names_and_filter_id_edges(self) -> None:
        targets = self.expected["pluginNodes"]
        self.assertEqual(len(targets), 2)
        for target in targets:
            node = self.nodes[target["nodeId"]]
            self.assertEqual(node["nodeType"], target["nodeType"])
            self.assertEqual(node["version"], target["version"])
            self.assertEqual(_attribute_value(node, "niceName"), target["niceName"])
            self.assertTrue(target["niceNameIsCustom"])
            self.assertFalse(target["defaultNodeNameCredit"])

        filter_list = self.nodes["basicShape#1"]["attributes"]["filters"]["list"]
        self.assertEqual(filter_list, [{"varType": "nodeId"}, {"varType": "nodeId"}])
        expected_edges = {(edge["from"], edge["to"]) for edge in self.expected["connections"]}
        actual_edges = {
            (edge["from"], edge["to"])
            for edge in self.scene["connections"]
            if edge["to"].startswith("basicShape#1.filters.")
        }
        self.assertEqual(actual_edges, expected_edges)
        expected_slots = self.expected["filterSlots"]
        self.assertEqual(
            [(slot["index"], slot["nodeId"]) for slot in expected_slots],
            [
                (0, "sceneGroup::erosionFilter#1"),
                (1, "sceneGroup::rectToPolarFilter#1"),
            ],
        )
        slot_edges = {
            (f"{slot['nodeId']}.id", f"basicShape#1.filters.{slot['index']}")
            for slot in expected_slots
        }
        self.assertEqual(slot_edges, expected_edges)

    def test_scene_has_no_external_assets_or_paths(self) -> None:
        self.assertEqual(self.expected["externalAssets"], [])
        self.assertEqual(self.expected["externalAssetFiles"], [])
        self.assertIn(self.scene.get("externalAssets", []), ([], None))
        self.assertEqual(self.scene["referenceData"], {})
        self.assertTrue(self.expected["referenceDataEmpty"])

        internal_asset = self.nodes[self.expected["internalAssetContainer"]["nodeId"]]
        self.assertEqual(internal_asset["nodeType"], "asset")
        self.assertEqual(self.expected["internalAssetContainer"]["externalPathFields"], [])
        self.assertNotIn("path", internal_asset.get("attributes", {}))
        self.assertEqual(
            next(item["children"] for item in self.scene["nodeMeta"] if item["nodeId"] == "asset#1"),
            [self.expected["activeComposition"]],
        )

        for document in (self.expected, self.scene):
            for value in _strings(document):
                self.assertIsNone(URL_PATTERN.search(value), value)
                self.assertIsNone(ABSOLUTE_PATH_PATTERN.search(value), value)
                self.assertIsNone(WINDOW_PATH_PATTERN.search(value), value)


class SoundEmptyFileScriptFixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.expected = _load_json(SOUND_EXPECTED_PATH)
        cls.script = SOUND_SCRIPT_PATH.read_text(encoding="utf-8")

    def test_manifest_declares_only_the_fixed_input_structure(self) -> None:
        self.assertEqual(self.expected["script"], SOUND_SCRIPT_PATH.name)
        self.assertEqual(self.expected["cavalryTarget"], "2.8")
        self.assertEqual(self.expected["nodeCount"], 2)
        self.assertEqual(
            [(node["name"], node["nodeType"]) for node in self.expected["nodes"]],
            [
                ("Sound Notification Rectangle", "basicShape"),
                ("Sound Missing Audio", "sound"),
            ],
        )
        sound_node = self.expected["nodes"][1]
        self.assertEqual(
            sound_node["fileInput"],
            {"label": "File", "expected": "empty", "assignment": "none"},
        )
        self.assertEqual(
            self.expected["connections"],
            [
                {
                    "from": "Sound Missing Audio.id",
                    "to": "Sound Notification Rectangle.generator.dimensions.x",
                }
            ],
        )
        self.assertEqual(
            self.expected["typeReadback"]["expected"],
            {"rectangle": "basicShape", "sound": "sound"},
        )

    def test_notification_status_is_not_an_input_declaration(self) -> None:
        notification = self.expected["notificationPass"]
        self.assertFalse(notification["isInputDeclaration"])
        self.assertEqual(notification["status"], "not-asserted")

    def test_script_uses_only_the_fixed_public_api_calls(self) -> None:
        api_calls = re.findall(r"\bapi\.([A-Za-z_$][\w$]*)\s*\(", self.script)
        self.assertEqual(
            api_calls,
            [
                "primitive",
                "create",
                "connect",
                "select",
                "play",
                "getLayerType",
                "getLayerType",
            ],
        )
        self.assertIn(
            "api.connect(sound, 'id', rectangle, 'generator.dimensions.x')",
            self.script,
        )
        self.assertIn(
            "api.primitive('rectangle', 'Sound Notification Rectangle')",
            self.script,
        )
        self.assertIn("api.create('sound', 'Sound Missing Audio')", self.script)
        self.assertIn("api.select([sound])", self.script)
        self.assertIn("api.play()", self.script)
        self.assertIn("SOUND_EMPTY_FILE_TYPES|rectangle=", self.script)
        self.assertIn("api.getLayerType(rectangle)", self.script)
        self.assertIn("api.getLayerType(sound)", self.script)

    def test_script_never_saves_serializes_imports_or_sets_a_path(self) -> None:
        for forbidden in (
            "saveSceneAs",
            "serialise",
            "serialize",
            "JSON.stringify",
            "JSON.parse",
            "import(",
            "require(",
            "loadScene",
            "loadFile",
            ".file =",
        ):
            self.assertNotIn(forbidden, self.script)
        script_body = re.sub(r"\A/\*\*.*?\*/", "", self.script, flags=re.DOTALL)
        self.assertNotRegex(script_body, r"\b(?:File|file)\b")
        self.assertNotRegex(script_body, r"\bimport\b")
        for value in (script_body, self.expected):
            for text in _strings(value):
                self.assertIsNone(URL_PATTERN.search(text), text)
                self.assertIsNone(ABSOLUTE_PATH_PATTERN.search(text), text)
                self.assertIsNone(WINDOW_PATH_PATTERN.search(text), text)


if __name__ == "__main__":
    unittest.main()
