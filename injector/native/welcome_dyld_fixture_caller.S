// [INPUT]: 依赖早期constructor及fake spdlog导入。
// [OUTPUT]: 以坏message和寄存器哨兵调用log_it_，并捕获caller栈状态。
// [POS]: 早期producer；保存LR与x19-x28，回返后恢复调用者状态。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
.text
.p2align 2
.globl _welcomeFixtureTriggerEarlyLog
_welcomeFixtureTriggerEarlyLog:
    adrp x16, _welcomeFixtureExpectedFramePointer@GOTPAGE
    ldr x16, [x16, _welcomeFixtureExpectedFramePointer@GOTPAGEOFF]
    str x29, [x16]
    stp x19, x20, [sp, #-96]!
    stp x21, x22, [sp, #16]
    stp x23, x24, [sp, #32]
    stp x25, x26, [sp, #48]
    stp x27, x28, [sp, #64]
    str x30, [sp, #80]
    adrp x16, _welcomeFixtureExpectedCallStackPointer@GOTPAGE
    ldr x16, [x16, _welcomeFixtureExpectedCallStackPointer@GOTPAGEOFF]
    mov x17, sp
    str x17, [x16]

    mov x0, #0x1234
    mov x1, #1
    mov x2, #1
    mov x3, #0
    mov x4, #0x1004
    mov x5, #0x1005
    mov x6, #0x1006
    mov x7, #0x1007
    mov x8, #0x1008
    mov x9, #0x1009
    mov x10, #0x100a
    mov x11, #0x100b
    mov x12, #0x100c
    mov x13, #0x100d
    mov x14, #0x100e
    mov x15, #0x100f
    mov x19, #0x1919
    mov x20, #0x2020
    mov x21, #0x2121
    mov x22, #0x2222
    mov x23, #0x2323
    mov x24, #0x2424
    mov x25, #0x2525
    mov x26, #0x2626
    mov x27, #0x2727
    mov x28, #0x2828
    bl __ZN6spdlog6logger7log_it_ERKNS_7details7log_msgEbb
.globl _welcomeFixtureOriginalReturn
_welcomeFixtureOriginalReturn:
    ldp x19, x20, [sp, #0]
    ldp x21, x22, [sp, #16]
    ldp x23, x24, [sp, #32]
    ldp x25, x26, [sp, #48]
    ldp x27, x28, [sp, #64]
    ldr x30, [sp, #80]
    add sp, sp, #96
    ret
