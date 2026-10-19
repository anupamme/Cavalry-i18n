/*
 * [INPUT]: 依赖SysV x86_64 owner/key/document参数、精确PC门与原UI导入。
 * [OUTPUT]: 精确main/def caller进入dispatcher；未知caller原寄存器尾跳原UI导入。
 * [POS]: Help窄入口；不读用户文本，不改未知调用的参数或返回槽。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__x86_64__)
#error "Help description x86_64 veneer requires x86_64."
#endif
.text
.p2align 4, 0x90
.globl _nativeHelpDocumentationInterpose
_nativeHelpDocumentationInterpose:
    .cfi_startproc
    movq (%rsp), %r11
    movq _nativeHelpExpectedReturnPc(%rip), %r10
    cmpq %r10, %r11
    je L_help_x86_dispatch
    movq _nativeHelpExpectedDefReturnPc(%rip), %r10
    cmpq %r10, %r11
    je L_help_x86_dispatch
    jmp __ZN8TextEdit27addScriptDocumentationEntryERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKN7cavalry19ScriptDocumentationE
L_help_x86_dispatch:
    movq %r11, %rcx
    jmp _nativeHelpDocumentationDispatcher
    .cfi_endproc
