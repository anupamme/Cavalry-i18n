// [INPUT]: 依赖固定Welcome veneer及其测试记录器。
// [OUTPUT]: 提供不同LR的未知与精确synthetic caller。
// [POS]: 仅供vendor-free arm64 ABI合同；不调用产品日志系统。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
.text
.p2align 2
.globl _welcomeProbeUnknown
_welcomeProbeUnknown:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    bl _nativeWelcomeLogItVeneer
.globl _welcomeProbeUnknownReturn
_welcomeProbeUnknownReturn:
    ldp x29, x30, [sp], #16
    ret

.p2align 2
.globl _welcomeProbeExact
_welcomeProbeExact:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    bl _nativeWelcomeLogItVeneer
.globl _welcomeProbeExactReturn
_welcomeProbeExactReturn:
    ldp x29, x30, [sp], #16
    ret
