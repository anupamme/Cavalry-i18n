/*
 * [INPUT]: 依赖GetPath入口的arm64 x30返回PC与x29调用者帧。
 * [OUTPUT]: 保留x0-x4、s0/s1并尾跳到C dispatcher。
 * [POS]: 无建栈薄入口；不创建新调用帧，不改浮点参数。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
.text
.p2align 2
.globl _getPathFontVeneer
_getPathFontVeneer:
    mov x5, x30
    mov x6, x29
    b _getPathFontDispatch
