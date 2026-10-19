"""
[INPUT]: 依赖 LLVM Bind/Lazy bind 格式与候选绑定合同。
[OUTPUT]: 验证列解析、精确库名、slot、flat反例及多合同汇总。
[POS]: macho_bindings.py 的离线单元测试；不调用 xcrun 或构建工具。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import unittest
from unittest.mock import patch

from macho_bindings import (
    Binding, BindingRequirement, parse_bind_table, validate_bindings,
    read_bindings, validate_no_flat_namespace,
)


POPUP = "__ZN7QLayout8activateEv"
DEMO = (
    "__ZN7cavalry12textFromFileERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE"
)


class MachoBindingsTest(unittest.TestCase):
    @patch("macho_bindings.subprocess.run")
    def test_runner_requests_regular_and_lazy_bind_tables(self, run) -> None:
        run.return_value.stdout = """\
Bind table:
segment section address type addend dylib symbol
__DATA_CONST __interpose 0x00001000 pointer 0 QtWidgets popup_symbol
Lazy bind table:
segment section address dylib symbol
__DATA __la_symbol_ptr 0x00002000 QtWidgets lazy_symbol
"""
        rows = read_bindings("candidate.dylib", "arm64")
        self.assertEqual(
            run.call_args.args[0],
            ["xcrun", "llvm-objdump", "--macho", "--arch=arm64", "--bind",
             "--lazy-bind", "candidate.dylib"],
        )
        self.assertEqual([row.symbol for row in rows],
                         ["popup_symbol", "lazy_symbol"])

    def test_parse_regular_and_lazy_tables_without_column_spacing_assumptions(self) -> None:
        output = """\
candidate.dylib:

Bind table:
segment  section            address    type       addend dylib            symbol
__DATA_CONST __interpose 0x00065250 pointer 0 QtWidgets __ZN7QLayout8activateEv
__DATA_CONST   __got      0x0004E070 pointer 0 QtWidgets __ZN7QLayout8activateEv

Lazy bind table:
segment section address dylib symbol
__DATA __la_symbol_ptr 0x00066108 QtWidgets __ZN7QLayout8activateEv

Weak bind table:
segment section address type addend symbol
__DATA_CONST __got 0x0004E0E8 pointer 0 __Zweak_only
"""
        rows = parse_bind_table(output)
        self.assertEqual(
            rows,
            (
                Binding("__interpose", 0x65250, "QtWidgets", POPUP),
                Binding("__got", 0x4E070, "QtWidgets", POPUP),
                Binding("__la_symbol_ptr", 0x66108, "QtWidgets", POPUP),
            ),
        )
        self.assertEqual(
            validate_bindings(
                rows, [BindingRequirement(POPUP, "QtWidgets",
                                          ("__interpose", "__got"))]),
            [],
        )

    def test_lazy_only_symbol_satisfies_import_requirement(self) -> None:
        rows = parse_bind_table("""\
Lazy bind table:
segment section address dylib symbol
__DATA __la_symbol_ptr 0x00003000 QtCore _qVersion
""")
        self.assertEqual(
            validate_bindings(rows, [BindingRequirement("_qVersion", "QtCore", ())]),
            [],
        )

    def test_wrong_library_missing_slot_and_flat_namespace_are_rejected(self) -> None:
        rows = parse_bind_table("""\
Bind table:
segment section address type addend dylib symbol
__DATA_CONST __interpose 0x00065210 pointer 0 flat-namespace __ZN7QLayout8activateEv
__DATA_CONST __interpose 0x00065120 pointer 0 QtWidgets __ZN7QWidget9addActionEP7QAction
""")
        errors = validate_bindings(
            rows,
            [
                BindingRequirement(POPUP, "QtWidgets", ("__interpose", "__got")),
                BindingRequirement("__ZN7QWidget9addActionEP7QAction",
                                   "QtWidgets", ("__interpose", "__got")),
            ],
        )
        self.assertEqual(len(errors), 3)
        self.assertTrue(any("flat-namespace" in error for error in errors))
        self.assertTrue(any("__got slot" in error for error in errors))
        self.assertTrue(any("addAction" in error and "__got slot" in error
                            for error in errors))
        self.assertEqual(len(validate_no_flat_namespace(rows)), 1)

    def test_symbol_matching_is_exact(self) -> None:
        rows = (Binding("__got", 0x1000, "QtWidgets", POPUP + "_unexpected"),)
        errors = validate_bindings(
            rows, [BindingRequirement(POPUP, "QtWidgets", ("__got",))])
        self.assertEqual(len(errors), 1)
        self.assertIn("missing QtWidgets binding", errors[0])

    def test_x86_popup_gate_allows_unrelated_flat_binding(self) -> None:
        rows = (
            Binding("__interpose", 0x2000, "QtWidgets", POPUP),
            Binding("__got", 0x3000, "QtWidgets", POPUP),
            Binding("__got", 0x4000, "flat-namespace", "unrelated_symbol"),
        )
        self.assertEqual(
            validate_bindings(rows, [BindingRequirement(
                POPUP, "QtWidgets", ("__interpose", "__got"))]),
            [],
        )

    def test_demo_text_from_file_requires_both_libcore_slots(self) -> None:
        old_candidate = parse_bind_table(f"""\
Bind table:
segment section address type addend dylib symbol
__DATA_CONST __interpose 0x00065210 pointer 0 flat-namespace {DEMO}
__DATA_CONST __got 0x0004E488 pointer 0 flat-namespace {DEMO}
Lazy bind table:
segment section address dylib symbol
__DATA __la_symbol_ptr 0x00066150 flat-namespace {DEMO}
""")
        requirement = BindingRequirement(DEMO, "libCore", ("__interpose", "__got"))
        self.assertTrue(validate_bindings(old_candidate, [requirement]))

        linked_candidate = (
            Binding("__interpose", 0x65210, "libCore", DEMO),
            Binding("__got", 0x4E488, "libCore", DEMO),
            Binding("__la_symbol_ptr", 0x66150, "libCore", DEMO),
        )
        self.assertEqual(validate_bindings(linked_candidate, [requirement]), [])

    def test_malformed_bind_row_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "malformed LLVM bind row"):
            parse_bind_table("Bind table:\n__DATA_CONST __got 0x1000")


if __name__ == "__main__":
    unittest.main()
