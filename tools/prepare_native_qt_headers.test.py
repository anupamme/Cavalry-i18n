#!/usr/bin/env python3
# [INPUT]: 依赖prepare_native_qt_headers的Qt归档路径选择与前缀归一函数。
# [OUTPUT]: 验证framework头映射、旧include输入及私有目录排除。
# [POS]: 纯路径合同加可选py7zr合成归档；不读网络、运行库或真实App。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""Contract tests for the pinned Qt header-layout adapter."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from prepare_native_qt_headers import (
    FRAMEWORK_HEADERS,
    MODULES,
    copy_public_header_prefix,
    extract_header_members,
    module_header_members,
    module_header_sources,
)


class QtHeaderLayoutContractTests(unittest.TestCase):
    def test_framework_member_mapping_normalizes_only_public_paths(self) -> None:
        names = []
        for module, prefix in FRAMEWORK_HEADERS.items():
            names.extend(
                (
                    f"{prefix}public_header.h",
                    f"{prefix}._AppleDouble",
                    f"{prefix}.DS_Store",
                    f"{prefix}6.9.2/{module}/private/internal_p.h",
                )
            )
        names.append("lib/QtCore.framework/Versions/A/QtCore")
        members = module_header_members(names)
        expected = [
            f"{FRAMEWORK_HEADERS[module]}public_header.h" for module in MODULES
        ]
        self.assertEqual(members, expected)

        with tempfile.TemporaryDirectory() as temporary:
            extracted = Path(temporary) / "extracted"
            for member in members:
                path = extracted / member
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("fixture bytes\n", encoding="utf-8")
            layout, sources = module_header_sources(extracted, members)
            output = Path(temporary) / "normalized"
            copy_public_header_prefix(sources, output)
            self.assertEqual(layout, "framework-versions-a")
            for module in MODULES:
                self.assertTrue(
                    (output / "include" / module / "public_header.h").is_file()
                )

    def test_framework_archive_extracts_public_headers_only(self) -> None:
        try:
            import py7zr
        except ImportError:
            self.skipTest("run with hash-locked requirements-ci.txt for 7z fixture")

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "source"
            archive = root / "qtbase-fixture.7z"
            names = []
            for module, prefix in FRAMEWORK_HEADERS.items():
                names.extend(
                    (
                        f"{prefix}public_header.h",
                        f"{prefix}._AppleDouble",
                    f"{prefix}.DS_Store",
                        f"{prefix}6.9.2/{module}/private/internal_p.h",
                    )
                )
            runtime = "lib/QtCore.framework/Versions/A/QtCore"
            names.append(runtime)

            for name in names:
                path = source / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("fixture bytes\n", encoding="utf-8")
            with py7zr.SevenZipFile(archive, mode="w") as package:
                for path in source.rglob("*"):
                    if path.is_file():
                        package.write(path, path.relative_to(source).as_posix())

            extracted = root / "extracted"
            extracted.mkdir()
            members = extract_header_members(archive, extracted)
            expected = [
                f"{FRAMEWORK_HEADERS[module]}public_header.h" for module in MODULES
            ]
            self.assertEqual(members, expected)
            self.assertFalse(any("/private/" in member for member in members))
            self.assertNotIn(runtime, members)

            layout, sources = module_header_sources(extracted, members)
            output = root / "normalized"
            copy_public_header_prefix(sources, output)

            self.assertEqual(layout, "framework-versions-a")
            for module in MODULES:
                self.assertEqual(
                    (output / "include" / module / "public_header.h").read_text(
                        encoding="utf-8"
                    ),
                    "fixture bytes\n",
                )
            self.assertEqual(
                {path.name for path in (output / "include").iterdir()}, set(MODULES)
            )

    def test_legacy_include_layout_remains_supported(self) -> None:
        names = [f"sdk/include/{module}/public_header.h" for module in MODULES]
        members = module_header_members(names)

        with tempfile.TemporaryDirectory() as temporary:
            extracted = Path(temporary) / "extract"
            for member in members:
                path = extracted / member
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("legacy header\n", encoding="utf-8")
            qglobal = extracted / "sdk/include/QtCore/qglobal.h"
            qglobal.write_text("legacy core header\n", encoding="utf-8")
            members.append("sdk/include/QtCore/qglobal.h")

            layout, sources = module_header_sources(extracted, members)
            output = Path(temporary) / "normalized"
            copy_public_header_prefix(sources, output)

            self.assertEqual(layout, "include")
            self.assertTrue((output / "include/QtCore/qglobal.h").is_file())
            self.assertTrue((output / "include/QtGui/public_header.h").is_file())
            self.assertTrue((output / "include/QtWidgets/public_header.h").is_file())


if __name__ == "__main__":
    unittest.main()
