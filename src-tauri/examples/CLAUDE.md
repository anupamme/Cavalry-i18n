# examples/
> L2 | 父级: ../CLAUDE.md

成员清单
native_status_apphandle_smoke.rs: macOS显式人工只读烟测，用build-only真实AppHandle调用一次生产get_status；不运行GUI事件循环、不创建窗口/WebView，隔离并清理Switcher诊断状态，前后守住原厂bundle与实际OS profile字节/模式。不是IPC、徽章DOM或语言切换验收。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
