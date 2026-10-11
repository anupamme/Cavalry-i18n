<!--
[INPUT]: 依赖获准owned副本、已批准helper和exact PID回执。
[OUTPUT]: 提供免登录工作区启动、进程清理与恢复归属方法。
[POS]: 固定UI测试入口辅助；不修改认证或字体。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 工作区helper

## 选择入口

正常App获准且可用时，按[场景方法](test-fixtures.md)打开副本。
免登录固定UI测试复用获准helper，不把登录另设为前置门。
helper只隐藏匹配Welcome并显示MainDock，不登录、不改凭据、不缩窗。
它不打开场景、Editor或帮助，不执行脚本，也不刷新字体。
show/raise/activateWindow不证明macOS前台、活动窗或输入焦点。
需要helper时先准备进程，再绑定CUA。
cua.getApp可自动普通启动；这种启动不携带外部helper或候选。

## 制品匹配与有限等待

获批helper绑定精确主程序、helper、三个Qt框架路径及activation。
activation是helper的公开测试标记，不是账号或密钥。
启动器把标记写入回执；不要传入秘密值。
子进程继承调用者环境；启动器不记录环境内容。
目标Qt为6.9.2；绑定输入变更后重新核验，不复用旧准入。
启动核activation和上述映像；每100毫秒等目标窗，最多100次。
它没有运行期无限轮询，不因此增加产品定时器。
同PID的HELPER_ADMITTED、QT_PROVENANCE_OK及WORKSPACE_EXPOSED才证明辅助动作。
Popen或回执只证明进程请求；显示项按[结果记账](evidence.md#结果记账)另判。

## 启动与清理

```sh
python3 "$SKILL/scripts/workspace_probe.py" launch \
  --app /path/to/owned/Cavalry.app \
  --helper /path/to/approved/font_workspace_test_helper.dylib \
  --activation '<value-bound-to-helper>' \
  --out /path/to/session/workspace-launch.json \
  --injector /path/to/owned/Cavalry.app/Contents/MacOS/libCavalryTranslatorInjector.dylib

python3 "$SKILL/scripts/workspace_probe.py" cleanup \
  --app /path/to/owned/Cavalry.app \
  --receipt /path/to/session/workspace-launch.json \
  --out /path/to/session/workspace-cleanup.json
```

injector须已部署在该副本内；省略时只加载helper。
外部候选需复用已批准的匹配启动器，不扩大本脚本边界。
脚本从Info.plist取CFBundleExecutable；CavalryLauncher映射到同目录Cavalry。
缺原生主程序即拒绝，不退回wrapper。
直接执行主程序，按injector:helper设DYLD；含冒号库路径拒绝。
不走open --env；丢弃厂商stdout/stderr，不读登录、Keychain或profile。
启动前只做一次同路径进程快照，不冒称OS launch lock。
回执存本机路径和PID；不扫描App或持续验哈希，不覆盖已有回执。
旧获批启动器可继续用，不强制迁移。
cleanup只核回执exact PID仍映射同一主程序后发SIGTERM。
PID消失或映像不匹配时不发信号，不找其他Cavalry进程。
它不等退出、不杀进程树；SIGTERM不算正常生命周期通过。

## 恢复弹窗归属

只读候选恢复目录session.json及其测试PID存活状态。
仅当PID已退出且PID和scene均属本轮时，移存该测试恢复目录。
保留session.json和来源回执，不批量清Recovery。
归属不明或进程仍运行时，不点Discard，不移存或删除。
事件、启动/清理回执和恢复前像留私人会话。
