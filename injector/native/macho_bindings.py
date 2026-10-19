"""
[INPUT]: 依赖 xcrun llvm-objdump 输出的 Mach-O Bind 与 Lazy bind 表。
[OUTPUT]: 提供精确 section、address、library、symbol 绑定记录及合同校验。
[POS]: native 候选的共享绑定读取器；不解码 Mach-O，也不检查 vendor 映像。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import pathlib
import re
import subprocess
from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class Binding:
    section: str
    address: int
    library: str
    symbol: str


@dataclass(frozen=True)
class BindingRequirement:
    symbol: str
    library: str
    sections: tuple[str, ...]


def parse_bind_table(output: str) -> tuple[Binding, ...]:
    """解析普通与lazy绑定；weak表没有dylib列，且不代表导入槽。"""
    rows: list[Binding] = []
    table: str | None = None
    for line in output.splitlines():
        label = line.strip()
        if label == "Bind table:":
            table = "bind"
            continue
        if label == "Lazy bind table:":
            table = "lazy"
            continue
        if label == "Weak bind table:":
            table = "weak"
            continue
        if not label:
            continue
        if label.startswith("segment "):
            continue
        if table is None or table == "weak":
            continue

        fields = label.split(maxsplit=6 if table == "bind" else 4)
        minimum = 7 if table == "bind" else 5
        if len(fields) < minimum:
            raise ValueError(f"malformed LLVM {table} row: {line}")
        if table == "bind":
            _, section, address_text, _kind, _addend, library, symbol = fields
        else:
            _, section, address_text, library, symbol = fields
        if re.fullmatch(r"0x[0-9a-fA-F]+", address_text) is None:
            raise ValueError(f"malformed LLVM binding address: {line}")
        rows.append(Binding(section, int(address_text, 16), library, symbol))
    return tuple(rows)


def read_bindings(binary: str | pathlib.Path, arch: str) -> tuple[Binding, ...]:
    if arch not in {"arm64", "x86_64"}:
        raise ValueError(f"unsupported Mach-O architecture: {arch}")
    result = subprocess.run(
        ["xcrun", "llvm-objdump", "--macho", f"--arch={arch}",
         "--bind", "--lazy-bind", str(pathlib.Path(binary))],
        check=True, capture_output=True, text=True,
    )
    return parse_bind_table(result.stdout)


def _describe(binding: Binding) -> str:
    return (f"{binding.section}@0x{binding.address:08x} "
            f"{binding.library}/{binding.symbol}")


def validate_bindings(
    bindings: Iterable[Binding], requirements: Iterable[BindingRequirement],
) -> list[str]:
    rows = tuple(bindings)
    errors: list[str] = []
    for requirement in requirements:
        matching = [row for row in rows if row.symbol == requirement.symbol]
        if not matching:
            slots = ", ".join(requirement.sections) or "a bind row"
            errors.append(
                f"{requirement.symbol}: missing {requirement.library} binding "
                f"({slots})")
            continue

        wrong_library = [row for row in matching
                         if row.library != requirement.library]
        if wrong_library:
            actual = "; ".join(_describe(row) for row in wrong_library)
            errors.append(
                f"{requirement.symbol}: expected library "
                f"{requirement.library}; found {actual}")
        for section in requirement.sections:
            section_rows = [row for row in matching if row.section == section]
            if not section_rows:
                actual = "; ".join(_describe(row) for row in matching)
                errors.append(
                    f"{requirement.symbol}: missing {section} slot from "
                    f"{requirement.library}; found {actual}")
    return errors


def validate_no_flat_namespace(bindings: Iterable[Binding]) -> list[str]:
    return [f"flat namespace binding: {_describe(row)}"
            for row in bindings if row.library == "flat-namespace"]
