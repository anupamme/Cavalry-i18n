/*
 * [INPUT]: 依赖x0-x3参数、x8结果槽、x29调用者帧与x30返回地址。
 * [OUTPUT]: 保留x0-x3/x8；将x30交给x4，将x29交给x5。
 * [POS]: 离线arm64 TextBlob veneer；尾跳固定dispatcher。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
.text
.globl _viewportBlobVeneer
.p2align 2
_viewportBlobVeneer:
    mov x4, x30
    mov x5, x29
    b _viewportBlobDispatch
