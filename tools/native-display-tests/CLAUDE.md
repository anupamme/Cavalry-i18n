# native-display-tests/
> L2 | 父级: ../CLAUDE.md

成员清单
test_workspace_probe.py: 标准库mock合同；核技能启动器映像、回执与精确PID清理，不启动App。
test_verify_visible_text.py: 标准库ROI合同；核单行包含、坐标和边缘舍入，不运行OCR。
test_audit_help_popups.py: 标准库合同；核连续popup全文、OCR误识、marker、SHA/PID/CG身份与三像素几何。
test_scene_fixture.py: 标准库场景合同；核CV结构及Sound脚本API边界、预期结构，不打开App。

手动维护验证（从项目根运行）：
```sh
python3 -B -m unittest discover -s tools/native-display-tests -p 'test_*.py'
```
这些测试不在test:contracts自动发现范围内。普通显示验收无需重跑。
依赖方向为测试→技能脚本/资产；产品与技能执行不依赖本目录。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
