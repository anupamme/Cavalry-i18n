// [INPUT]: 依赖fake spdlog ABI与共享原调用快照函数。
// [OUTPUT]: 捕获log_it_入口x0-x30、SP及调用前errno，不读消息指针。
// [POS]: vendor-free伪spdlog导出；用于验证原函数一次且不递归。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
.text
.p2align 2
.globl __ZN6spdlog6logger7log_it_ERKNS_7details7log_msgEbb
__ZN6spdlog6logger7log_it_ERKNS_7details7log_msgEbb:
    sub sp, sp, #256
    stp x0, x1, [sp, #0]
    stp x2, x3, [sp, #16]
    stp x4, x5, [sp, #32]
    stp x6, x7, [sp, #48]
    stp x8, x9, [sp, #64]
    stp x10, x11, [sp, #80]
    stp x12, x13, [sp, #96]
    stp x14, x15, [sp, #112]
    stp x16, x17, [sp, #128]
    stp x18, x19, [sp, #144]
    stp x20, x21, [sp, #160]
    stp x22, x23, [sp, #176]
    stp x24, x25, [sp, #192]
    stp x26, x27, [sp, #208]
    stp x28, x29, [sp, #224]
    str x30, [sp, #240]
    add x16, sp, #256
    str x16, [sp, #248]
    mov x0, sp
    mov x1, x16
    bl _welcomeFixtureRecordOriginal
    ldr x30, [sp, #240]
    add sp, sp, #256
    ret
