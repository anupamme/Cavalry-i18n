"""
[INPUT]: 依赖macOS lipo、dwarfdump、nm与Mach-O x86_64 slice。
[OUTPUT]: 提供隔离x86合同的UUID、符号与机器码读取。
[POS]: 只供仓外静态检查使用，不参与候选运行或产品接线。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import pathlib
import re
import struct
import subprocess
import tempfile


def run(*command: str) -> str:
    result = subprocess.run(command, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"命令失败：{' '.join(command)}\n{result.stderr}")
    return result.stdout


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def uuid_for_arch(image: pathlib.Path, architecture: str) -> str:
    dump = run("xcrun", "dwarfdump", "--uuid", str(image))
    matches = re.findall(
        rf"^UUID: ([0-9A-Fa-f-]+) \({re.escape(architecture)}\)",
        dump, re.MULTILINE)
    require(len(matches) == 1, f"{image.name}缺少唯一{architecture} UUID")
    return matches[0].upper()


def symbol_address(
    image: pathlib.Path, symbol: str, *, architecture: str = "x86_64",
    local: bool = True,
) -> int:
    mode = "-a" if local else "-gU"
    rows = [line.split() for line in run(
        "xcrun", "nm", "-arch", architecture, mode, str(image)
    ).splitlines() if line.split() and line.split()[-1] == symbol]
    require(len(rows) == 1,
            f"{image.name}缺少唯一符号 {symbol}: {len(rows)} rows")
    return int(rows[0][0], 16)


def macho_bytes_at(
    image: pathlib.Path, offset: int, length: int, workdir: pathlib.Path,
    *, architecture: str = "x86_64",
) -> bytes:
    architectures = run("xcrun", "lipo", "-archs", str(image)).split()
    require(architecture in architectures,
            f"映像缺少{architecture} slice：{image.name}")
    with tempfile.TemporaryDirectory(prefix="x86-macho.", dir=workdir) as temp:
        selected = image
        if len(architectures) > 1:
            selected = pathlib.Path(temp) / image.name
            run("xcrun", "lipo", "-thin", architecture, "-output",
                str(selected), str(image))
        file_size = selected.stat().st_size
        with selected.open("rb") as stream:
            header = stream.read(32)
            require(len(header) == 32, f"Mach-O头不完整：{image.name}")
            magic, cpu_type = struct.unpack_from("<II", header)
            require(magic == 0xFEEDFACF and cpu_type == 0x01000007,
                    f"Mach-O x86_64 slice格式不匹配：{image.name}")
            command_count = struct.unpack_from("<I", header, 16)[0]
            cursor = 32
            text_segment = None
            for _ in range(command_count):
                stream.seek(cursor)
                command_header = stream.read(8)
                require(len(command_header) == 8,
                        f"Mach-O load command不完整：{image.name}")
                command, command_size = struct.unpack("<II", command_header)
                require(command_size >= 8 and cursor + command_size <= file_size,
                        f"Mach-O load command越界：{image.name}")
                if command == 0x19 and command_size >= 72:
                    stream.seek(cursor + 8)
                    name = stream.read(16).split(b"\0", 1)[0]
                    vm_address, vm_size, file_offset, file_bytes = struct.unpack(
                        "<QQQQ", stream.read(32))
                    if name == b"__TEXT":
                        text_segment = (vm_address, vm_size,
                                        file_offset, file_bytes)
                cursor += command_size
            require(text_segment is not None and
                    text_segment[0] == 0 and text_segment[2] == 0,
                    "x86_64 __TEXT必须从Mach-O偏移0映射")
            require(offset >= 0 and length > 0 and
                    offset + length <= text_segment[1] and
                    offset + length <= text_segment[3] and
                    offset + length <= file_size,
                    f"机器码窗超出{image.name} __TEXT")
            stream.seek(offset)
            data = stream.read(length)
            require(len(data) == length, f"机器码读取不完整：{image.name}")
            return data


def cpp_hex(source: str, name: str) -> int:
    match = re.search(
        rf"{re.escape(name)}\s*=\s*(0x[0-9a-fA-F]+|[0-9]+)", source)
    require(match is not None, f"合同缺少固定偏移：{name}")
    return int(match.group(1), 0)


def cpp_string(source: str, name: str) -> str:
    match = re.search(
        rf'{re.escape(name)}\[\]\s*=\s*"([^"]+)"', source)
    require(match is not None, f"合同缺少固定字符串：{name}")
    return match.group(1)


def cpp_byte_array(source: str, name: str) -> bytes:
    match = re.search(
        rf"{re.escape(name)}\s*=\s*\{{([^}}]+)\}}", source, re.DOTALL)
    require(match is not None, f"合同缺少字节窗：{name}")
    return bytes(int(value, 16) for value in
                 re.findall(r"0x([0-9a-fA-F]{2})", match.group(1)))
