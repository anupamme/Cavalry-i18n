#!/usr/bin/env python3
"""
[INPUT]: 依赖源码manifest producer、Timeline checker与Python临时目录。
[OUTPUT]: 验证无vendor的manifest生成、消费与漂移拒绝。
[POS]: x86 source-closure纯合同；不调用Clang、Cavalry或官方二进制。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import pathlib
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True

import check_timeline_owner_observer_x86_64 as timeline_checker
import native_source_manifest_x86_64 as source_manifest


class SourceManifestContractTest(unittest.TestCase):
    def make_fixture(self, root: pathlib.Path) -> tuple[pathlib.Path, pathlib.Path]:
        repository = root / "repo"
        for relative_root in source_manifest.RECURSIVE_INPUTS:
            directory = repository / relative_root
            directory.mkdir(parents=True, exist_ok=True)
            (directory / "fixture.txt").write_text(f"{relative_root}\n")
        for relative_file in source_manifest.EXPLICIT_INPUTS:
            path = repository / relative_file
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"fixture: {relative_file}\n")
        manifest = root / "build" / "native-source-manifest.json"
        source_manifest.write_source_manifest(repository, manifest)
        return repository, manifest

    def verify(self, root: pathlib.Path, repository: pathlib.Path,
               manifest: pathlib.Path) -> None:
        output = root / "verify"
        output.mkdir(parents=True, exist_ok=True)
        timeline_checker.check_source_identity(repository, output, manifest)

    def test_producer_manifest_is_consumed_without_vendor_inputs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            repository, manifest = self.make_fixture(root)
            cache = repository / "injector/native/__pycache__"
            cache.mkdir(parents=True, exist_ok=True)
            (cache / "fixture.cpython-312.pyc").write_bytes(b"generated cache")
            manifest.unlink()
            source_manifest.write_source_manifest(repository, manifest)
            self.verify(root, repository, manifest)
            self.assertTrue((root / "verify" / manifest.name).is_file())
            self.assertTrue((root / "verify" / "source-integrity.json").is_file())

    def test_content_mode_and_tree_closure_drift_fail(self) -> None:
        cases = (
            ("content", lambda repo: (repo / "injector/fixture.txt").write_text("changed\n")),
            ("added", lambda repo: (repo / "injector/unlisted.mm").write_text("new\n")),
            ("missing", lambda repo: (repo / "tools/native_metadata_reuse.js").unlink()),
            ("mode", lambda repo: (repo / "tools/generate_demo_reader_tables.js").chmod(0o755)),
        )
        for name, mutate in cases:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temporary:
                root = pathlib.Path(temporary)
                repository, manifest = self.make_fixture(root)
                mutate(repository)
                with self.assertRaises((timeline_checker.CheckError,
                                        source_manifest.SourceManifestError)):
                    self.verify(root, repository, manifest)


if __name__ == "__main__":
    unittest.main(verbosity=2)
