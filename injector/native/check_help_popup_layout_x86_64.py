"""
[INPUT]: 依赖官方2.8 x86 CavalryUI/QtWidgets、候选导入与窄布局适配器。
[OUTPUT]: 核验DocumentationPopup唯一调用窗、return PC和two-level导入。
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


def namespace_body(source: str, namespace: str) -> str:
    marker = f"namespace {namespace} {{"
    start = source.find(marker)
    require(start >= 0, f"ABI头缺少架构命名空间：{namespace}")
    start += len(marker)
    end = source.find("}  // namespace " + namespace, start)
    require(end >= 0, f"ABI头缺少架构命名空间结束：{namespace}")
    return source[start:end]


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
            "官方x86 UI/QtWidgets UUID与合同不一致")

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
            f"Popup/Qt导出符号偏移与合同不一致：{symbols}")

    call_offset = cpp_hex(x86, "kActivateCallWindowOffset")
    call_bytes = cpp_byte_array(x86, "kActivateCallWindowBytes")
    actual_call = macho_bytes_at(ui, call_offset, len(call_bytes), output.parent)
    require(actual_call == call_bytes, "DocumentationPopup::setContent调用窗字节不匹配")
    stub_offset = cpp_hex(x86, "kActivateImportStubOffset")
    stub_bytes = cpp_byte_array(x86, "kActivateImportStubBytes")
    actual_stub = macho_bytes_at(ui, stub_offset, len(stub_bytes), output.parent)
    require(actual_stub == stub_bytes, "QLayout::activate import stub字节不匹配")
    got = cpp_hex(x86, "kActivateGotOffset")
    displacement = int.from_bytes(actual_stub[2:6], "little", signed=True)
    require(actual_stub[:2] == b"\xff\x25" and
            stub_offset + len(actual_stub) + displacement == got,
            "x86 QLayout stub没有指向固定QtWidgets GOT槽")

    imports = run("dyld_info", "-arch", "x86_64", "-imports", str(ui))
    import_line = next((line for line in imports.splitlines()
                        if cpp_string(x86, "kQtLayoutActivateSymbol") in line), "")
    require("(from QtWidgets)" in import_line,
            "官方UI没有从同bundle QtWidgets导入QLayout::activate")
    fixups = run("dyld_info", "-arch", "x86_64", "-fixups", str(ui))
    require(re.search(
        rf"__got\s+0x{got:08X}\s+bind\s+QtWidgets/"
        rf"{re.escape(cpp_string(x86, 'kQtLayoutActivateSymbol'))}\b",
        fixups) is not None,
            "UI QLayout::activate GOT fixup与固定槽不一致")

    adapter_check = (
        "namespace popup_abi = native_help_popup_layout::abi::x86_64;" in adapter and
        "macho::imageUuidEquals(ui, kPopupUiUuid)" in adapter and
        "imageAddress(ui, popup_abi::kActivateReturnOffset)" in adapter and
        "isExactActivationCaller(caller, expected)" in adapter and
        adapter.count("original(layout)") == 1 and
        "popup_abi::kActivateImportStubBytes" in adapter)
    require(adapter_check, "adapter未使用x86合同或原函数不是单次透传")

    exports = run("xcrun", "nm", "-arch", "x86_64", "-gU", str(candidate))
    require(any(line.split() and line.split()[-1] ==
                "_nativeHelpLayoutActivateInterpose"
                for line in exports.splitlines()), "候选缺少布局interpose入口")
    candidate_fixups = run("dyld_info", "-arch", "x86_64", "-fixups",
                           str(candidate))
    popup_fixup_lines = [
        line for line in candidate_fixups.splitlines()
        if "__ZN7QLayout8activateEv" in line
    ]
    require(
        any("__interpose" in line and "QtWidgets/" in line and
            "<flat-namespace>/" not in line for line in popup_fixup_lines) and
        any("__got" in line and "QtWidgets/" in line and
            "<flat-namespace>/" not in line for line in popup_fixup_lines),
            "候选缺少QtWidgets two-level QLayout导入或保持flat namespace")

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
