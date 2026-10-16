/*
 * [INPUT]: 依赖Skia原参数寄存器、$_46 closure在%rbx及入口栈顶返回PC。
 * [OUTPUT]: 将closure/PC压入dispatcher参数栈，原参数与float结果保持不变。
 * [POS]: 单独的x86_64 observer veneer；只作离线合同，不接完整候选。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__x86_64__)
#error "Timeline observer veneer requires x86_64."
#endif

.text
.p2align 4, 0x90
.globl _timelineMeasureVeneer
_timelineMeasureVeneer:
    .cfi_startproc
    /* x86_64函数入口rsp%16为8；24字节区域同时留两参数和对齐槽。 */
    subq $24, %rsp
    .cfi_adjust_cfa_offset 24
    movq %rbx, 0(%rsp)
    movq 24(%rsp), %rax
    movq %rax, 8(%rsp)
    callq _timelineMeasureDispatch
    addq $24, %rsp
    .cfi_adjust_cfa_offset -24
    retq
    .cfi_endproc

.p2align 4, 0x90
.globl _timelineDrawVeneer
_timelineDrawVeneer:
    .cfi_startproc
    subq $24, %rsp
    .cfi_adjust_cfa_offset 24
    movq %rbx, 0(%rsp)
    movq 24(%rsp), %rax
    movq %rax, 8(%rsp)
    callq _timelineDrawDispatch
    addq $24, %rsp
    .cfi_adjust_cfa_offset -24
    retq
    .cfi_endproc
