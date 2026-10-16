#!/usr/bin/env python3
# [INPUT]: 依赖requirements-ci锁定的py7zr与Qt官方6.9.2 qtbase归档。
# [OUTPUT]: 将QtCore、QtGui、QtWidgets公开头文件归一到include前缀。
# [POS]: M78 macOS候选构建输入准备器；兼容include与framework头布局，不安装Qt运行库。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""Verify the pinned Qt 6.9.2 archive and extract only compile headers."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import tempfile
from pathlib import Path, PurePosixPath

EXPECTED_BYTES = 34_027_496
EXPECTED_SHA256 = "d2a2a80de2e049dab5521318cc359ce2a02d1f3bc5235804de158b7342201e11"
MODULES = ("QtCore", "QtGui", "QtWidgets")
FRAMEWORK_HEADERS = {
    module: f"lib/{module}.framework/Versions/A/Headers/" for module in MODULES
}
REQUIRED_HEADERS = (
    "QtCore/qglobal.h",
    "QtCore/qconfig.h",
    "QtCore/qregularexpression.h",
    "QtCore/qstring.h",
    "QtGui/qfontmetrics.h",
    "QtGui/qaction.h",
    "QtWidgets/qwidget.h",
    "QtWidgets/qlabel.h",
    "QtWidgets/qlayout.h",
    "QtWidgets/qtextedit.h",
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def module_header_members(names: list[str]) -> list[str]:
    include_members = []
    include_modules = set()
    for name in names:
        parts = PurePosixPath(name.replace("\\", "/")).parts
        for index in range(len(parts) - 1):
            if parts[index] == "include" and parts[index + 1] in MODULES:
                include_members.append(name)
                include_modules.add(parts[index + 1])
                break
    if include_modules == set(MODULES):
        return sorted(include_members)

    framework_members = []
    for name in names:
        normalized = name.replace("\\", "/")
        for module, prefix in FRAMEWORK_HEADERS.items():
            if not normalized.startswith(prefix):
                continue
            relative = normalized[len(prefix):]
            if relative and "/" not in relative and not relative.startswith("."):
                framework_members.append(name)
            break
    if framework_members:
        return sorted(framework_members)
    return []


def find_include_root(extracted: Path) -> Path:
    matches = [
        path.parent.parent
        for path in extracted.rglob("qglobal.h")
        if path.parent.name == "QtCore" and path.parent.parent.name == "include"
    ]
    unique = sorted(set(matches))
    if len(unique) != 1:
        raise ValueError(f"expected one QtCore include root; found {len(unique)}")
    return unique[0]


def module_header_sources(extracted: Path, members: list[str]) -> tuple[str, dict[str, Path]]:
    """映射已提取的成员；framework输入只接受Versions/A/Headers直系文件。"""
    if any(
        "include" in PurePosixPath(name.replace("\\", "/")).parts
        for name in members
    ):
        include_root = find_include_root(extracted)
        return "include", {module: include_root / module for module in MODULES}

    return "framework-versions-a", {
        module: extracted.joinpath(*PurePosixPath(prefix).parts)
        for module, prefix in FRAMEWORK_HEADERS.items()
    }


def copy_public_header_prefix(module_sources: dict[str, Path], output_path: Path) -> None:
    output_path.mkdir(parents=True)
    include_root = output_path / "include"
    include_root.mkdir()
    for module in MODULES:
        shutil.copytree(module_sources[module], include_root / module)


def extract_header_members(archive_path: Path, extracted: Path) -> list[str]:
    """从归档选择受支持布局的头文件成员，并保留原始成员路径供归一。"""
    try:
        import py7zr
    except ImportError as error:
        raise ValueError("py7zr must come from the hash-locked requirements-ci.txt") from error

    with py7zr.SevenZipFile(archive_path, mode="r") as package:
        file_names = [
            entry.filename
            for entry in package.list()
            if not entry.is_directory and not entry.is_symlink
        ]
        members = module_header_members(file_names)
        if not members:
            raise ValueError("Qt package contains no QtCore/QtGui/QtWidgets public header members")
        package.extract(path=extracted, targets=members)
    return members


def verify_qconfig(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="strict")
    for macro, value in (
        ("QT_VERSION_MAJOR", "6"),
        ("QT_VERSION_MINOR", "9"),
        ("QT_VERSION_PATCH", "2"),
    ):
        if not re.search(rf"^\s*#\s*define\s+{macro}\s+{value}\s*$", text, re.M):
            raise ValueError(f"Qt version macro mismatch: {macro}={value}")


def prepare_headers(archive_path: Path, output_path: Path) -> dict[str, object]:
    if archive_path.stat().st_size != EXPECTED_BYTES:
        raise ValueError("Qt 6.9.2 archive byte count differs from the approved pin")
    archive_sha256 = sha256_file(archive_path)
    if archive_sha256 != EXPECTED_SHA256:
        raise ValueError("Qt 6.9.2 archive SHA-256 differs from the approved pin")
    if output_path.exists() or output_path.is_symlink():
        raise ValueError(f"refusing to replace existing header prefix: {output_path}")

    with tempfile.TemporaryDirectory(prefix="cavalry-qt-692-") as temporary:
        extracted = Path(temporary)
        members = extract_header_members(archive_path, extracted)

        _, module_sources = module_header_sources(extracted, members)
        for module in MODULES:
            module_path = module_sources[module]
            if not module_path.is_dir() or module_path.is_symlink():
                raise ValueError(f"missing public Qt header module: {module}")
        for relative in REQUIRED_HEADERS:
            module, header = relative.split("/", 1)
            if not (module_sources[module] / header).is_file():
                raise ValueError(f"missing required public Qt header: {relative}")
        verify_qconfig(module_sources["QtCore"] / "qconfig.h")

        copy_public_header_prefix(module_sources, output_path)

    header_files = sorted(
        path for path in (output_path / "include").rglob("*") if path.is_file()
    )
    manifest = {
        "qtVersion": "6.9.2",
        "sourceArchiveBytes": EXPECTED_BYTES,
        "sourceArchiveSha256": archive_sha256,
        "modules": list(MODULES),
        "headerFileCount": len(header_files),
        "headerBytes": sum(path.stat().st_size for path in header_files),
        "requiredHeaders": list(REQUIRED_HEADERS),
        "runtimeLibrariesCopied": False,
    }
    (output_path / "headers-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()
    try:
        manifest = prepare_headers(arguments.archive, arguments.output)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
