/*
 * [INPUT]: 依赖SysV x86_64非平凡返回hidden sret、入口返回PC与caller RBP。
 * [OUTPUT]: 保留sret和原参数；栈上传递RBP，调用后恢复原栈与返回PC。
 * [POS]: TextBlob结果的x86_64 ABI桥；owner准入仍由候选合同决定。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__x86_64__)
#error "Viewport Blob x86_64 veneer requires x86_64."
#endif
.text
.p2align 4, 0x90
.globl _viewportBlobVeneer
_viewportBlobVeneer:
    .cfi_startproc
    subq $24, %rsp
    .cfi_adjust_cfa_offset 24
    movq %rbp, 0(%rsp)
    movq 24(%rsp), %r9
    callq _viewportBlobDispatch
    addq $24, %rsp
    .cfi_adjust_cfa_offset -24
    retq
    .cfi_endproc
