# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
workspace_probe.py: 启动已批准helper与副本内可选字体库；从Info.plist定位原生主程序，按回执精确PID清理。
verify_visible_text.py: 已有Vision单行包含目标且整行落ROI的断言；校正PNG边缘半像素误差并保留原框，不运行OCR。
audit_help_popups.py: 对既存popup PNG运行空expected OCR；绑定唯一CG窗及三像素几何，比较连续说明行。

命令分别见references/workspace-helper.md与references/evidence.md。
离线自测位于tools/native-display-tests，不随每次实机验收运行。
OCR退出0只表示结果已落盘；OCR精确不证明字形、完整UI或首帧。
启动器不证明UI、认证或首帧；清理不证明正常退出。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
