// [INPUT]: 依赖帮助veneer与固定的合成callee、dispatcher。
// [OUTPUT]: 记录未知caller入口ABI，并探测main/def精确LR与两个未知LR。
// [POS]: native帮助veneer的arm64寄存器探针；不加载Qt或Cavalry。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
.text
.p2align 2

.globl _nativeHelpProbeUnknownA
_nativeHelpProbeUnknownA:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    bl L_help_prepare_unknown
    adr x12, L_help_probe_unknown_a_return
    adrp x16, _nativeHelpProbeExpectedLr@PAGE
    str x12, [x16, _nativeHelpProbeExpectedLr@PAGEOFF]
    bl _nativeHelpDocumentationInterpose
L_help_probe_unknown_a_return:
    adrp x16, _nativeHelpUnknownReturnX0@PAGE
    str x0, [x16, _nativeHelpUnknownReturnX0@PAGEOFF]
    adrp x16, _nativeHelpUnknownReturnV0@PAGE
    str q0, [x16, _nativeHelpUnknownReturnV0@PAGEOFF]
    mov x0, #0
    ldp x29, x30, [sp], #16
    ret

.globl _nativeHelpProbeUnknownB
_nativeHelpProbeUnknownB:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    bl L_help_prepare_unknown
    adr x12, L_help_probe_unknown_b_return
    adrp x16, _nativeHelpProbeExpectedLr@PAGE
    str x12, [x16, _nativeHelpProbeExpectedLr@PAGEOFF]
    bl _nativeHelpDocumentationInterpose
L_help_probe_unknown_b_return:
    adrp x16, _nativeHelpUnknownReturnX0@PAGE
    str x0, [x16, _nativeHelpUnknownReturnX0@PAGEOFF]
    adrp x16, _nativeHelpUnknownReturnV0@PAGE
    str q0, [x16, _nativeHelpUnknownReturnV0@PAGEOFF]
    mov x0, #0
    ldp x29, x30, [sp], #16
    ret

.p2align 2
L_help_prepare_unknown:
    mov x9, #0
    adrp x16, _nativeHelpExpectedReturnPc@PAGE
    str x9, [x16, _nativeHelpExpectedReturnPc@PAGEOFF]
    adrp x16, _nativeHelpExpectedDefReturnPc@PAGE
    str x9, [x16, _nativeHelpExpectedDefReturnPc@PAGEOFF]

    mov x9, sp
    adrp x16, _nativeHelpProbeExpectedSp@PAGE
    str x9, [x16, _nativeHelpProbeExpectedSp@PAGEOFF]
    mov x9, x29
    adrp x16, _nativeHelpProbeExpectedFp@PAGE
    str x9, [x16, _nativeHelpProbeExpectedFp@PAGEOFF]

    adrp x16, _nativeHelpInputGprs@PAGE
    add x16, x16, _nativeHelpInputGprs@PAGEOFF
    ldp x0, x1, [x16, #0]
    ldp x2, x3, [x16, #16]
    ldp x4, x5, [x16, #32]
    ldp x6, x7, [x16, #48]
    adrp x8, _nativeHelpIndirectResultBuffer@PAGE
    add x8, x8, _nativeHelpIndirectResultBuffer@PAGEOFF

    adrp x16, _nativeHelpInputVectors@PAGE
    add x16, x16, _nativeHelpInputVectors@PAGEOFF
    ldr q0, [x16, #0]
    ldr q1, [x16, #16]
    ldr q2, [x16, #32]
    ldr q3, [x16, #48]
    ldr q4, [x16, #64]
    ldr q5, [x16, #80]
    ldr q6, [x16, #96]
    ldr q7, [x16, #112]
    ret

.globl _nativeHelpProbeExactMain
_nativeHelpProbeExactMain:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    adr x9, L_help_probe_exact_main_return
    adrp x16, _nativeHelpExpectedReturnPc@PAGE
    str x9, [x16, _nativeHelpExpectedReturnPc@PAGEOFF]
    mov x9, #0
    adrp x16, _nativeHelpExpectedDefReturnPc@PAGE
    str x9, [x16, _nativeHelpExpectedDefReturnPc@PAGEOFF]
    movz x0, #0x3456
    movk x0, #0x1234, lsl #16
    movk x0, #0xdef0, lsl #32
    movk x0, #0x9abc, lsl #48
    adr x30, L_help_probe_exact_main_return
    b _nativeHelpDocumentationInterpose
L_help_probe_exact_main_return:
    adrp x16, _nativeHelpExactMainReturnX0@PAGE
    str x0, [x16, _nativeHelpExactMainReturnX0@PAGEOFF]
    adrp x16, _nativeHelpExactMainReturnV0@PAGE
    str q0, [x16, _nativeHelpExactMainReturnV0@PAGEOFF]
    mov x0, #0
    ldp x29, x30, [sp], #16
    ret

.globl _nativeHelpProbeExactDef
_nativeHelpProbeExactDef:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    adr x9, L_help_probe_exact_def_return
    adrp x16, _nativeHelpExpectedReturnPc@PAGE
    str xzr, [x16, _nativeHelpExpectedReturnPc@PAGEOFF]
    adrp x16, _nativeHelpExpectedDefReturnPc@PAGE
    str x9, [x16, _nativeHelpExpectedDefReturnPc@PAGEOFF]
    movz x0, #0x3456
    movk x0, #0x1234, lsl #16
    movk x0, #0xdef0, lsl #32
    movk x0, #0x9abc, lsl #48
    adr x30, L_help_probe_exact_def_return
    b _nativeHelpDocumentationInterpose
L_help_probe_exact_def_return:
    adrp x16, _nativeHelpExactDefReturnX0@PAGE
    str x0, [x16, _nativeHelpExactDefReturnX0@PAGEOFF]
    adrp x16, _nativeHelpExactDefReturnV0@PAGE
    str q0, [x16, _nativeHelpExactDefReturnV0@PAGEOFF]
    mov x0, #0
    ldp x29, x30, [sp], #16
    ret

.p2align 2
.globl _nativeHelpDocumentationDispatcher
_nativeHelpDocumentationDispatcher:
    adrp x16, _nativeHelpDispatcherCallCount@PAGE
    ldr x9, [x16, _nativeHelpDispatcherCallCount@PAGEOFF]
    add x9, x9, #1
    str x9, [x16, _nativeHelpDispatcherCallCount@PAGEOFF]
    movz x0, #0x3210
    movk x0, #0x7654, lsl #16
    movk x0, #0xba98, lsl #32
    movk x0, #0xfedc, lsl #48
    adrp x16, _nativeHelpDispatcherReturnVector@PAGE
    add x16, x16, _nativeHelpDispatcherReturnVector@PAGEOFF
    ldr q0, [x16]
    ret

.p2align 2
.globl __ZN8TextEdit27addScriptDocumentationEntryERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKN7cavalry19ScriptDocumentationE
__ZN8TextEdit27addScriptDocumentationEntryERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKN7cavalry19ScriptDocumentationE:
    adrp x16, _nativeHelpOriginalCallCount@PAGE
    ldr x9, [x16, _nativeHelpOriginalCallCount@PAGEOFF]
    add x9, x9, #1
    str x9, [x16, _nativeHelpOriginalCallCount@PAGEOFF]

    adrp x16, _nativeHelpEntryGprs@PAGE
    add x16, x16, _nativeHelpEntryGprs@PAGEOFF
    stp x0, x1, [x16, #0]
    stp x2, x3, [x16, #16]
    stp x4, x5, [x16, #32]
    stp x6, x7, [x16, #48]
    str x8, [x16, #64]

    adrp x16, _nativeHelpEntryVectors@PAGE
    add x16, x16, _nativeHelpEntryVectors@PAGEOFF
    str q0, [x16, #0]
    str q1, [x16, #16]
    str q2, [x16, #32]
    str q3, [x16, #48]
    str q4, [x16, #64]
    str q5, [x16, #80]
    str q6, [x16, #96]
    str q7, [x16, #112]

    mov x9, sp
    adrp x16, _nativeHelpEntrySp@PAGE
    str x9, [x16, _nativeHelpEntrySp@PAGEOFF]
    mov x9, x29
    adrp x16, _nativeHelpEntryFp@PAGE
    str x9, [x16, _nativeHelpEntryFp@PAGEOFF]
    mov x9, x30
    adrp x16, _nativeHelpEntryLr@PAGE
    str x9, [x16, _nativeHelpEntryLr@PAGEOFF]

    movz x16, #0x5678
    movk x16, #0x1234, lsl #16
    movk x16, #0xf00d, lsl #32
    movk x16, #0x0bad, lsl #48
    str x16, [x8, #0]
    movz x16, #0xf00d
    movk x16, #0xcafe, lsl #16
    movk x16, #0x4321, lsl #32
    movk x16, #0x8765, lsl #48
    str x16, [x8, #8]

    movz x0, #0xdef0
    movk x0, #0x9abc, lsl #16
    movk x0, #0x5678, lsl #32
    movk x0, #0x1234, lsl #48
    adrp x16, _nativeHelpOriginalReturnVector@PAGE
    add x16, x16, _nativeHelpOriginalReturnVector@PAGEOFF
    ldr q0, [x16]
    ret

.section __DATA,__data
.p2align 3
.globl _nativeHelpExpectedReturnPc
_nativeHelpExpectedReturnPc:
    .quad 0
.globl _nativeHelpExpectedDefReturnPc
_nativeHelpExpectedDefReturnPc:
    .quad 0
.globl _nativeHelpOriginalCallCount
_nativeHelpOriginalCallCount:
    .quad 0
.globl _nativeHelpDispatcherCallCount
_nativeHelpDispatcherCallCount:
    .quad 0
.globl _nativeHelpInputGprs
_nativeHelpInputGprs:
    .quad 0x0102030405060708, 0x1112131415161718
    .quad 0x2122232425262728, 0x3132333435363738
    .quad 0x4142434445464748, 0x5152535455565758
    .quad 0x6162636465666768, 0x7172737475767778
.globl _nativeHelpInputVectors
_nativeHelpInputVectors:
    .quad 0x0123456789abcdef, 0xfedcba9876543210
    .quad 0x1023456789abcdef, 0xefdcba9876543210
    .quad 0x2023456789abcdef, 0xdfdcba9876543210
    .quad 0x3023456789abcdef, 0xcfdcba9876543210
    .quad 0x4023456789abcdef, 0xbfdcba9876543210
    .quad 0x5023456789abcdef, 0xafdcba9876543210
    .quad 0x6023456789abcdef, 0x9fdcba9876543210
    .quad 0x7023456789abcdef, 0x8fdcba9876543210
.globl _nativeHelpOriginalReturnVector
_nativeHelpOriginalReturnVector:
    .quad 0xaabbccddeeff0011, 0x2233445566778899
.globl _nativeHelpDispatcherReturnVector
_nativeHelpDispatcherReturnVector:
    .quad 0x55aa55aa55aa55aa, 0xaa55aa55aa55aa55

.p2align 3
.globl _nativeHelpEntryGprs
_nativeHelpEntryGprs:
    .quad 0, 0, 0, 0, 0, 0, 0, 0, 0
.p2align 4
.globl _nativeHelpEntryVectors
_nativeHelpEntryVectors:
    .quad 0, 0, 0, 0, 0, 0, 0, 0
    .quad 0, 0, 0, 0, 0, 0, 0, 0
.globl _nativeHelpEntrySp
_nativeHelpEntrySp:
    .quad 0
.globl _nativeHelpEntryFp
_nativeHelpEntryFp:
    .quad 0
.globl _nativeHelpEntryLr
_nativeHelpEntryLr:
    .quad 0
.globl _nativeHelpProbeExpectedSp
_nativeHelpProbeExpectedSp:
    .quad 0
.globl _nativeHelpProbeExpectedFp
_nativeHelpProbeExpectedFp:
    .quad 0
.globl _nativeHelpProbeExpectedLr
_nativeHelpProbeExpectedLr:
    .quad 0
.globl _nativeHelpUnknownReturnX0
_nativeHelpUnknownReturnX0:
    .quad 0
.p2align 4
.globl _nativeHelpUnknownReturnV0
_nativeHelpUnknownReturnV0:
    .quad 0, 0
.globl _nativeHelpExactMainReturnX0
_nativeHelpExactMainReturnX0:
    .quad 0
.p2align 4
.globl _nativeHelpExactMainReturnV0
_nativeHelpExactMainReturnV0:
    .quad 0, 0
.globl _nativeHelpExactDefReturnX0
_nativeHelpExactDefReturnX0:
    .quad 0
.p2align 4
.globl _nativeHelpExactDefReturnV0
_nativeHelpExactDefReturnV0:
    .quad 0, 0
.globl _nativeHelpIndirectResultBuffer
_nativeHelpIndirectResultBuffer:
    .quad 0, 0
