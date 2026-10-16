"""
[INPUT]: 依赖官方2.8 x86映像、候选LLVM Bind表、窄适配器与vendor dyld_info/otool投影。
[OUTPUT]: 核验Popup调用窗、return PC、QtWidgets与Demo Core two-level绑定。
[POS]: 构建后静态ABI门；不启动Cavalry或授予实屏信用。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import sys

from x86_macho_contract import (
    cpp_byte_array, cpp_hex, cpp_string, macho_bytes_at, require, run,
    symbol_address, uuid_for_arch,
)
from macho_bindings import BindingRequirement, read_bindings, validate_bindings


def namespace_body(source: str, namespace: str) -> str:
    marker = f"namespace {namespace} {{"
    start = source.find(marker)
    require(start >= 0, f"ABI头缺少架构命名空间：{namespace}")
    start += len(marker)
    end = source.find("}  // namespace " + namespace, start)
    require(end >= 0, f"ABI头缺少架构命名空间结束：{namespace}")
    return source[start:end]


def show_lines(lines: list[str]) -> str:
    return "\n".join(lines) if lines else "<no matching output lines>"


def matching_lines(output: str, *needles: str) -> list[str]:
    return [line for line in output.splitlines()
            if any(needle in line for needle in needles)]


def main() -> None:
    require(len(sys.argv) == 4,
            "用法: check_help_popup_layout_x86_64.py FRAMEWORKS CANDIDATE OUT.json")
    frameworks, candidate, output = map(pathlib.Path, sys.argv[1:])
    frameworks, candidate, output = (
        frameworks.resolve(), candidate.resolve(), output.resolve())
    output.parent.mkdir(parents=True, exist_ok=True)
    native = pathlib.Path(__file__).resolve().parent
    abi_source = (native / "help_popup_layout_abi_contract.h").read_text()
    x86 = namespace_body(abi_source, "x86_64")
    adapter = (native / "help_popup_layout_adapter.mm").read_text()
    ui = frameworks / "libCavalryUI.dylib"
    widgets = frameworks / "QtWidgets.framework/Versions/A/QtWidgets"
    require(ui.is_file() and widgets.is_file() and candidate.is_file(),
            "缺少同bundle CavalryUI、QtWidgets或候选dylib")

    expected_ui_uuid = cpp_string(x86, "kCavalryUiUuid")
    expected_widgets_uuid = cpp_string(x86, "kQtWidgetsUuid")
    ui_uuid = uuid_for_arch(ui, "x86_64")
    widgets_uuid = uuid_for_arch(widgets, "x86_64")
    require(ui_uuid == expected_ui_uuid and widgets_uuid == expected_widgets_uuid,
            "官方x86 UI/QtWidgets UUID与合同不一致: "
            f"UI expected={expected_ui_uuid}, actual={ui_uuid}; "
            f"QtWidgets expected={expected_widgets_uuid}, actual={widgets_uuid}")

    symbols = {
        "documentationSetContent": symbol_address(
            ui, cpp_string(x86, "kDocumentationSetContentSymbol")),
        "qLayoutActivate": symbol_address(
            widgets, cpp_string(x86, "kQtLayoutActivateSymbol"), local=False),
    }
    expected_symbols = {
        "documentationSetContent": cpp_hex(
            x86, "kDocumentationSetContentOffset"),
        "qLayoutActivate": cpp_hex(x86, "kQtLayoutActivateOffset"),
    }
    require(symbols == expected_symbols,
            f"Popup/Qt导出符号偏移与合同不一致: expected={expected_symbols}, actual={symbols}")

    call_offset = cpp_hex(x86, "kActivateCallWindowOffset")
    call_bytes = cpp_byte_array(x86, "kActivateCallWindowBytes")
    actual_call = macho_bytes_at(ui, call_offset, len(call_bytes), output.parent)
    require(actual_call == call_bytes,
            "DocumentationPopup::setContent调用窗字节不匹配: "
            f"UI UUID={ui_uuid}, offset=0x{call_offset:X}, "
            f"expected={call_bytes.hex()}, actual={actual_call.hex()}")
    stub_offset = cpp_hex(x86, "kActivateImportStubOffset")
    stub_bytes = cpp_byte_array(x86, "kActivateImportStubBytes")
    actual_stub = macho_bytes_at(ui, stub_offset, len(stub_bytes), output.parent)
    require(actual_stub == stub_bytes,
            "QLayout::activate import stub字节不匹配: "
            f"UI UUID={ui_uuid}, offset=0x{stub_offset:X}, "
            f"expected={stub_bytes.hex()}, actual={actual_stub.hex()}")
    got = cpp_hex(x86, "kActivateGotOffset")
    displacement = int.from_bytes(actual_stub[2:6], "little", signed=True)
    actual_got = stub_offset + len(actual_stub) + displacement
    require(actual_stub[:2] == b"\xff\x25" and actual_got == got,
            "x86 QLayout stub没有指向固定QtWidgets GOT槽: "
            f"UI UUID={ui_uuid}, stub offset=0x{stub_offset:X}, "
            f"bytes={actual_stub.hex()}, computed GOT=0x{actual_got:X}, expected GOT=0x{got:X}")

    layout_symbol = cpp_string(x86, "kQtLayoutActivateSymbol")
    imports = run("dyld_info", "-arch", "x86_64", "-imports", str(ui))
    import_line = next((line for line in imports.splitlines()
                        if layout_symbol in line), "")
    relevant_import_lines = matching_lines(imports, layout_symbol, "(from QtWidgets)")
    require("(from QtWidgets)" in import_line,
            "官方UI没有从同bundle QtWidgets导入QLayout::activate: "
            f"expected symbol={layout_symbol} from QtWidgets; "
            f"selected line={import_line or '<none>'}; 相关imports:\n"
            f"{show_lines(relevant_import_lines)}")
    fixups = run("dyld_info", "-arch", "x86_64", "-fixups", str(ui))
    expected_fixup_slot = f"0x{got:08X}"
    relevant_fixup_lines = matching_lines(fixups, layout_symbol, expected_fixup_slot)
    require(re.search(
        rf"__got\s+{expected_fixup_slot}\s+bind\s+QtWidgets/"
        rf"{re.escape(layout_symbol)}\b",
        fixups) is not None,
            "UI QLayout::activate GOT fixup与固定槽不一致: "
            f"expected __got {expected_fixup_slot} bind QtWidgets/{layout_symbol}; "
            f"相关fixups:\n{show_lines(relevant_fixup_lines)}")

    adapter_check = (
        "namespace popup_abi = native_help_popup_layout::abi::x86_64;" in adapter and
        "macho::imageUuidEquals(ui, kPopupUiUuid)" in adapter and
        "imageAddress(ui, popup_abi::kActivateReturnOffset)" in adapter and
        "isExactActivationCaller(caller, expected)" in adapter and
        adapter.count("original(layout)") == 1 and
        "popup_abi::kActivateImportStubBytes" in adapter)
    require(adapter_check, "adapter未使用x86合同或原函数不是单次透传")

    exports = run("xcrun", "nm", "-arch", "x86_64", "-gU", str(candidate))
    interpose_symbol = "_nativeHelpLayoutActivateInterpose"
    matching_exports = matching_lines(exports, interpose_symbol)
    require(any(line.split() and line.split()[-1] ==
                interpose_symbol
                for line in exports.splitlines()),
            f"候选缺少布局interpose入口: symbol={interpose_symbol}; "
            f"相关nm行:\n{show_lines(matching_exports)}")
    demo_abi = (pathlib.Path(__file__).resolve().parent /
                "demo_reader_abi_contract.h").read_text()
    demo_symbol = cpp_string(demo_abi, "kTextFromFileSymbol")
    candidate_bindings = read_bindings(candidate, "x86_64")
    candidate_binding_errors = validate_bindings(
        candidate_bindings,
        [
            BindingRequirement(layout_symbol, "QtWidgets",
                               ("__interpose", "__got")),
            BindingRequirement(demo_symbol, "libCore",
                               ("__interpose", "__got")),
        ],
    )
    require(not candidate_binding_errors,
            "候选Popup/Demo two-level绑定失败:\n  - " +
            "\n  - ".join(candidate_binding_errors))

    receipt = {
        "status": "PASS_OFFICIAL_X86_DOCUMENTATION_POPUP_ABI",
        "scope": "static exact caller/source window and candidate two-level import",
        "officialImages": {
            "CavalryUI": {"sha256": hashlib.sha256(ui.read_bytes()).hexdigest(),
                           "uuid": ui_uuid},
            "QtWidgets": {"sha256": hashlib.sha256(widgets.read_bytes()).hexdigest(),
                          "uuid": widgets_uuid},
        },
        "symbols": {name: f"0x{address:x}" for name, address in symbols.items()},
        "caller": {
            "windowOffset": f"0x{call_offset:x}",
            "windowBytesSha256": hashlib.sha256(actual_call).hexdigest(),
            "callOffset": f"0x{cpp_hex(x86, 'kActivateCallOffset'):x}",
            "returnOffset": f"0x{cpp_hex(x86, 'kActivateReturnOffset'):x}",
        },
        "import": {
            "stubOffset": f"0x{stub_offset:x}",
            "stubBytesSha256": hashlib.sha256(actual_stub).hexdigest(),
            "gotOffset": f"0x{got:x}",
            "source": "QtWidgets",
            "candidateTwoLevelFixup": "PASS",
            "demoTextFromFileTwoLevelFixup": "PASS",
        },
        "layoutRuntimeAdmission": "EXACT_RETURN_PC_ONLY",
        "CavalryRuntimeOrDisplay": "NOT_RUN",
    }
    output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n",
                      encoding="utf-8")
    print("PASS: x86 DocumentationPopup source caller, import stub, and QtWidgets fixup")
    print(f"RECEIPT: {output}")


if __name__ == "__main__":
    main()
