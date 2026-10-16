// [INPUT]: 依赖log_it_的x0-x3、精确返回PC与dyld原导入桩。
// [OUTPUT]: 精确Welcome caller进入dispatcher；未知caller原寄存器尾跳原导出。
// [POS]: 窄arm64 interpose入口；未知caller不读message且不等构造器。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
.text
.p2align 2
.globl _nativeWelcomeLogItVeneer
_nativeWelcomeLogItVeneer:
#ifdef WELCOME_LOG_IT_FIXTURE
    // -- 仅fixture标记进入次数；不改参数、栈或errno -------------------------
    adrp x16, _welcomeFixtureVeneerEntryCount@GOTPAGE
    ldr x16, [x16, _welcomeFixtureVeneerEntryCount@GOTPAGEOFF]
    ldr x17, [x16]
    add x17, x17, #1
    str x17, [x16]
#endif
    adrp x16, _nativeWelcomeLogItExpectedReturnPc@PAGE
    add x16, x16, _nativeWelcomeLogItExpectedReturnPc@PAGEOFF
    ldar x17, [x16]
    cmp x30, x17
    b.eq L_welcome_dispatch

    // -- dyld排除interposer自身的导入绑定；这里直达旧实现，不读全局门 --
    b __ZN6spdlog6logger7log_it_ERKNS_7details7log_msgEbb

L_welcome_dispatch:
    mov x4, x30
    b _nativeWelcomeLogItDispatcher
