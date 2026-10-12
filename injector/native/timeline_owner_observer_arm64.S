/*
 * [INPUT]: 依赖目标Skia入口的原ABI寄存器；closure在x19、调用者return PC在x30。
 * [OUTPUT]: 将x19/x30复制到x6/x7，再tail-branch到typed C dispatcher；不改x0–x5/v0/v1。
 * [POS]: 两个精确Skia符号的arm64入口veneer；不读内存、不配对调用、不碰x29。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
.text
.p2align 2
.globl _timelineMeasureVeneer
_timelineMeasureVeneer:
    mov x6, x19
    mov x7, x30
    b _timelineMeasureDispatch

.p2align 2
.globl _timelineDrawVeneer
_timelineDrawVeneer:
    mov x6, x19
    mov x7, x30
    b _timelineDrawDispatch
