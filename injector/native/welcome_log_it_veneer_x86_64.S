/*
 * [INPUT]: 依赖SysV x86_64 log_it_参数、精确PC门与spdlog旧导入桩。
 * [OUTPUT]: 精确Welcome caller进入dispatcher；未知caller原寄存器尾跳旧导入。
 * [POS]: Welcome窄入口；未知路径不读message、不依赖constructor状态。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__x86_64__)
#error "Welcome log_it_ x86_64 veneer requires x86_64."
#endif
.text
.p2align 4, 0x90
.globl _nativeWelcomeLogItVeneer
_nativeWelcomeLogItVeneer:
    .cfi_startproc
    movq (%rsp), %r11
    movq _nativeWelcomeLogItExpectedReturnPc(%rip), %r10
    cmpq %r10, %r11
    jne L_welcome_x86_passthrough
    movq %r11, %r8
    jmp _nativeWelcomeLogItDispatcher
L_welcome_x86_passthrough:
    jmp __ZN6spdlog6logger7log_it_ERKNS_7details7log_msgEbb
    .cfi_endproc
