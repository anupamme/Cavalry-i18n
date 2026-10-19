/*
 * [INPUT]: 依赖x86_64 C ABI探针参数与隔离Timeline veneers。
 * [OUTPUT]: 提供closure在%rbx、真实返回标签和栈上传参的合成调用点。
 * [POS]: 仅供vendor-free链接合同；不调用Skia或Cavalry。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__x86_64__)
#error "Timeline observer probe requires x86_64."
#endif

.text
.p2align 4, 0x90
.globl _timelineOwnerProbeMeasure
_timelineOwnerProbeMeasure:
    pushq %rbx
    movq %rdi, %rbx
    movq %rsi, %rdi
    movq %rdx, %rsi
    movq %rcx, %rdx
    movq %r8, %rcx
    movq %r9, %r8
    movq 16(%rsp), %r9
    callq _timelineMeasureVeneer
.LtimelineOwnerProbeMeasureReturn:
    popq %rbx
    retq

.p2align 4, 0x90
.globl _timelineOwnerProbeDraw
_timelineOwnerProbeDraw:
    pushq %rbx
    movq %rdi, %rbx
    movq %rsi, %rdi
    movq %rdx, %rsi
    movq %rcx, %rdx
    movq %r8, %rcx
    movq %r9, %r8
    movq 16(%rsp), %r9
    callq _timelineDrawVeneer
.LtimelineOwnerProbeDrawReturn:
    popq %rbx
    retq

.p2align 4, 0x90
.globl _timelineOwnerProbeMeasureReturnAddress
_timelineOwnerProbeMeasureReturnAddress:
    leaq .LtimelineOwnerProbeMeasureReturn(%rip), %rax
    retq

.p2align 4, 0x90
.globl _timelineOwnerProbeDrawReturnAddress
_timelineOwnerProbeDrawReturnAddress:
    leaq .LtimelineOwnerProbeDrawReturn(%rip), %rax
    retq
