"""
[INPUT]: 依赖384/17 source-bound表、arm64候选与同bundle Extension/UI二进制。
[OUTPUT]: 核验main/def caller、完整veneer指令与分支地址。
[POS]: 帮助后置静态门；按目标符号截取，不授予live消费者信用。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import sys

from check_candidate_contract import (
    bytes_at, cpp_byte_array, cpp_hex, cpp_string,
    compiled_function_instructions, compiled_function_lines,
    disassembly_bytes, require, run, source_instructions,
)


def main() -> None:
    require(len(sys.argv) == 5,
            "用法: check_help_description_contract.py ROOT OUT FRAMEWORKS CANDIDATE")
    root, out, frameworks, candidate = map(pathlib.Path, sys.argv[1:])
    source = root / "injector/native"
    header = (source / "help_description_abi_contract.h").read_text()
    runtime = (source / "help_description_runtime.inc").read_text()
    adapter = (source / "help_description_adapter.inc").read_text()
    table = out / "help-description-table.inc"
    receipt = json.loads((out / "help-description-table.inc.receipt.json").read_text())
    require(hashlib.sha256(table.read_bytes()).hexdigest() ==
            receipt["output"]["sha256"], "帮助表与构建回执摘要不一致")
    require(receipt["output"]["runtimeRootEntries"] == 384 and
            receipt["output"]["runtimeDefEntries"] == 17 and
            receipt["boundary"]["namespaceTablesSeparated"] is True and
            receipt["boundary"]["defRootsProjected"] == 17 and
            receipt["counts"]["reviewedDescriptions"] == 512 and
            receipt["counts"]["excludedDefRoots"] == 17 and
            receipt["counts"]["nestedDescriptions"] == 111,
            "帮助384根/512审批分母不一致")
    table_text = table.read_text()
    require("kApprovedRuntimeRootHelp[]" in table_text and
            "kApprovedRuntimeDefHelp[]" in table_text and
            "kApprovedRuntimeRootHelpCount" in table_text and
            "kApprovedRuntimeDefHelpCount" in table_text,
            "384 main与17 def必须写入独立runtime表")

    for filename, uuid_name, sha_name in (
        ("libExtensionLayer.dylib", "kExtensionUuid", "kExtensionSha256"),
        ("libCavalryUI.dylib", "kCavalryUiUuid", "kCavalryUiSha256"),
    ):
        image = frameworks / filename
        require(hashlib.sha256(image.read_bytes()).hexdigest() ==
                cpp_string(header, sha_name), f"{filename}原厂SHA不一致")
        uuid = cpp_string(header, uuid_name)
        require(re.search(rf"^UUID: {re.escape(uuid)} \(arm64\)(?:\s|$)",
                          run("xcrun", "dwarfdump", "--uuid", str(image)),
                          re.MULTILINE) is not None,
                f"{filename}arm64 UUID不一致")

    def image_bytes(filename: str, symbol: str) -> dict[int, bytes]:
        return disassembly_bytes(run("xcrun", "llvm-objdump", "--macho",
                                     "--arch=arm64", "--disassemble-symbols=" + symbol,
                                     str(frameworks / filename)))

    extension = image_bytes("libExtensionLayer.dylib",
                           "__ZN7cavalry24addCompletionsToTextEditEP8TextEditP3Api")
    def_extension = image_bytes("libExtensionLayer.dylib",
                               cpp_string(header, "kDefCallerSymbol"))
    ui = image_bytes("libCavalryUI.dylib", cpp_string(header, "kEntrySymbol"))
    # __stubs不在默认__text反汇编内。otool以32-bit数值打印，转回little-endian字节。
    stub_dump = run("xcrun", "otool", "-arch", "arm64", "-s", "__TEXT", "__stubs",
                    str(frameworks / "libExtensionLayer.dylib"))
    stub_bytes = {}
    for line in stub_dump.splitlines():
        row = re.match(r"^([0-9a-fA-F]{16})\s+((?:[0-9a-fA-F]{8}\s*)+)$", line)
        if row:
            start = int(row.group(1), 16)
            for index, word in enumerate(row.group(2).split()):
                stub_bytes[start + 4 * index] = int(word, 16).to_bytes(4, "little")
    for instructions, offset_name, bytes_name in (
        (extension, "kExtensionCallerOffset", "kCallerBranchBytes"),
        (def_extension, "kDefCallerConditionOffset", "kDefCallerConditionBytes"),
        (def_extension, "kDefCallerOffset", "kDefCallerBranchBytes"),
        (stub_bytes, "kExtensionStubOffset", "kImportStubBytes"),
        (ui, "kCavalryUiEntryOffset", "kCalleeEntryBytes"),
    ):
        expected = cpp_byte_array(header, bytes_name)
        require(bytes_at(instructions, cpp_hex(header, offset_name), len(expected)) ==
                expected, f"帮助机器码不一致: {offset_name}")

    symbol = cpp_string(header, "kEntrySymbol")
    dependencies = run("xcrun", "otool", "-L", str(candidate))
    fixups = run("dyld_info", "-arch", "arm64", "-fixups", str(candidate))
    rows = [line for line in fixups.splitlines() if symbol in line]
    require("@rpath/libCavalryUI.dylib" in dependencies and rows and
            all(f"bind  libCavalryUI/{symbol}" in line for line in rows) and
            any("__interpose" in line for line in rows) and
            any("__got" in line for line in rows) and
            "flat-namespace" not in fixups,
            "帮助原目标与interpose缺少UI two-level绑定")
    veneer = (source / "help_description_veneer.S").read_text()
    source_ops = source_instructions(veneer, "_nativeHelpDocumentationInterpose")
    expected_ops = [
        "adrp x16, _nativeHelpExpectedReturnPc@PAGE",
        "add x16, x16, _nativeHelpExpectedReturnPc@PAGEOFF",
        "ldar x17, [x16]", "cmp x30, x17", "b.eq L_help_dispatch",
        "adrp x16, _nativeHelpExpectedDefReturnPc@PAGE",
        "add x16, x16, _nativeHelpExpectedDefReturnPc@PAGEOFF",
        "ldar x17, [x16]", "cmp x30, x17", "b.eq L_help_dispatch",
        "b L_help_passthrough", "L_help_dispatch:",
        "b _nativeHelpDocumentationDispatcher", "L_help_passthrough:",
        "b " + symbol,
    ]
    require(source_ops == expected_ops,
            "帮助veneer只准main/def精确LR分流与原导入尾跳")
    veneer_disasm = run("xcrun", "otool", "-arch", "arm64", "-tvV", "-p",
                         "_nativeHelpDocumentationInterpose", str(candidate))
    veneer_symbol = "_nativeHelpDocumentationInterpose"
    veneer_body = compiled_function_lines(veneer_disasm, veneer_symbol)
    ops = compiled_function_instructions(veneer_disasm, veneer_symbol)
    require(len(ops) == 13 and
            re.match(r"adrp x16,", ops[0]) and
            re.match(r"add x16, x16,", ops[1]) and
            ops[2] == "ldar x17, [x16]" and
            ops[3] == "cmp x30, x17" and
            re.match(r"b\.eq ", ops[4]) and
            re.match(r"adrp x16,", ops[5]) and
            re.match(r"add x16, x16,", ops[6]) and
            ops[7] == "ldar x17, [x16]" and
            ops[8] == "cmp x30, x17" and
            re.match(r"b\.eq ", ops[9]) and
            ops[10].startswith("b ") and
            ops[11].startswith("b ") and "_nativeHelpDocumentationDispatcher" in ops[11] and
            ops[12].startswith("b ") and "symbol stub for: " + symbol in ops[12],
            f"编译帮助veneer未透明尾跳原UI two-level stub: {ops}")
    # 两个精确LR都进入dispatcher；其余LR经一条直接分支到原导入尾跳。
    address_rows = re.findall(
        r"^\s*([0-9a-fA-F]+)\s+(.*)$", "\n".join(veneer_body), re.MULTILINE)
    require(len(address_rows) == 13 and
            all(int(re.search(r"0x([0-9a-fA-F]+)", ops[index]).group(1), 16) ==
                int(address_rows[11][0], 16) for index in (4, 9)) and
            int(re.search(r"0x([0-9a-fA-F]+)", ops[10]).group(1), 16) ==
            int(address_rows[12][0], 16),
            "main/def精确LR分支或未知LR原导入边界错误")
    symbol_details = run("xcrun", "nm", "-m", str(candidate))
    require(any("private external" in line and
                line.endswith("_nativeHelpDocumentationDispatcher")
                for line in symbol_details.splitlines()),
            "void dispatcher必须隐藏，不能成为公共未知caller入口")
    exports = run("xcrun", "nm", "-gU", str(candidate))
    require("_nativeHelpDocumentationInterpose" in exports,
            "候选缺少帮助注册入口")
    require("__builtin_return_address(0)" in runtime and
            "kExtensionReturnOffset" in runtime and
            "kDefReturnOffset" in runtime and
            "gLocale" in runtime and
            "nativeHelpExpectedReturnPc.store(ready ?" in runtime and
            "nativeHelpExpectedDefReturnPc.store(ready ?" in runtime and
            "callerReturnPc == expectedMainReturnPc" in adapter and
            "callerReturnPc == expectedDefReturnPc" in adapter,
            "帮助入口必须复用唯一locale并限制精确main/def caller")
    require("kApprovedRuntimeDefHelp" in runtime and
            "kApprovedRuntimeRootHelp" in runtime and
            "expectedDefReturnPc" in adapter,
            "dispatcher必须按caller将384/17项路由到独立表")
    require(all(token not in runtime + adapter for token in (
        "getenv(", "Paint", "QTextEdit", "::write(", "memcpy(")),
        "帮助适配不得扫描绘制、写诊断或浅拷贝C++对象")
    report = {
        "scope": "static arm64 candidate only; no live hover or app launch",
        "runtimeRoots": 384,
        "runtimeDefRoots": 17,
        "sourceBoundApprovedDescriptions": 512,
        "excludedDefRoots": 17,
        "nestedDescriptionsOutsideCaller": 111,
        "tableSha256": receipt["output"]["sha256"],
        "twoLevelUiOriginal": True,
        "callerReturnOffsets": {
            "main": hex(cpp_hex(header, "kExtensionReturnOffset")),
            "def": hex(cpp_hex(header, "kDefReturnOffset")),
        },
        "defConditionalOffset": hex(cpp_hex(header, "kDefCallerConditionOffset")),
        "calleeSymbol": symbol,
        "calleeOffset": hex(cpp_hex(header, "kCavalryUiEntryOffset")),
        "unknownCallerTailForward": True,
        "twoCallerTableRouting": True,
        "defCallerConditionBytes": cpp_byte_array(header, "kDefCallerConditionBytes").hex(),
        "defCallerBranchBytes": cpp_byte_array(header, "kDefCallerBranchBytes").hex(),
        "compiledVeneerInstructions": ops,
        "dispatcherHidden": True,
        "globalVendorReturnTypeProven": False,
        "liveAcceptance": False,
    }
    (out / "help-description-abi-proof.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print("PASS: 384 main + 17 def source-bound help roots, exact two-caller arm64 and UI two-level ABI")


if __name__ == "__main__":
    main()
