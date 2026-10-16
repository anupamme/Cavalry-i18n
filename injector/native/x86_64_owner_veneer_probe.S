/*
 * [INPUT]: 依赖隔离x86_64 veneer声明与SysV寄存器/栈布局。
 * [OUTPUT]: 构造GetPath、Blob、Help、Welcome调用及真实return-PC标签。
 * [POS]: vendor-free ABI探针；不调用Cavalry、不证明官方caller偏移。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__x86_64__)
#error "Owner veneer probe requires x86_64."
#endif
.text
.p2align 4, 0x90
.globl _probeGetPath
_probeGetPath:
    pushq %rbp
    movq %rsp, %rbp
    movq %rbp, _gProbeCallerFrame(%rip)
    callq _getPathFontVeneer
.LprobeGetPathReturn:
    popq %rbp
    retq

.globl _probeGetPathReturnAddress
_probeGetPathReturnAddress:
    leaq .LprobeGetPathReturn(%rip), %rax
    retq

.p2align 4, 0x90
.globl _probeViewportBlob
_probeViewportBlob:
    pushq %rbp
    movq %rsp, %rbp
    movq %rbp, _gProbeCallerFrame(%rip)
    callq _viewportBlobVeneer
.LprobeViewportBlobReturn:
    popq %rbp
    retq

.globl _probeViewportBlobReturnAddress
_probeViewportBlobReturnAddress:
    leaq .LprobeViewportBlobReturn(%rip), %rax
    retq

.p2align 4, 0x90
.globl _probeHelpMain
_probeHelpMain:
    callq _nativeHelpDocumentationInterpose
.LprobeHelpMainReturn:
    retq

.globl _probeHelpDef
_probeHelpDef:
    callq _nativeHelpDocumentationInterpose
.LprobeHelpDefReturn:
    retq

.globl _probeHelpMainReturnAddress
_probeHelpMainReturnAddress:
    leaq .LprobeHelpMainReturn(%rip), %rax
    retq

.globl _probeHelpDefReturnAddress
_probeHelpDefReturnAddress:
    leaq .LprobeHelpDefReturn(%rip), %rax
    retq

.p2align 4, 0x90
.globl _probeWelcome
_probeWelcome:
    callq _nativeWelcomeLogItVeneer
.LprobeWelcomeReturn:
    retq

.globl _probeWelcomeReturnAddress
_probeWelcomeReturnAddress:
    leaq .LprobeWelcomeReturn(%rip), %rax
    retq
