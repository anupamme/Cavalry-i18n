// [INPUT]: 依赖已验main/def caller PC与UI two-level原导入。
// [OUTPUT]: 两个精确caller尾跳dispatcher；其它caller原ABI透明尾跳。
// [POS]: 窄入口只比较LR；未知caller不进入void dispatcher。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
.text
.p2align 2
.globl _nativeHelpDocumentationInterpose
_nativeHelpDocumentationInterpose:
    adrp x16, _nativeHelpExpectedReturnPc@PAGE
    add x16, x16, _nativeHelpExpectedReturnPc@PAGEOFF
    ldar x17, [x16]
    cmp x30, x17
    b.eq L_help_dispatch
    adrp x16, _nativeHelpExpectedDefReturnPc@PAGE
    add x16, x16, _nativeHelpExpectedDefReturnPc@PAGEOFF
    ldar x17, [x16]
    cmp x30, x17
    b.eq L_help_dispatch
    b L_help_passthrough
L_help_dispatch:
    b _nativeHelpDocumentationDispatcher
L_help_passthrough:
    b __ZN8TextEdit27addScriptDocumentationEntryERKNSt3__112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKN7cavalry19ScriptDocumentationE
