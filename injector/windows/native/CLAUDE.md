# native/
> L2 | 父级: ../CLAUDE.md

Windows2.8窄补充；native strings仍是翻译主干。固定帮助字体已在私人owned进程验证，正式部署/正常首帧/三语回归另验。此目录不编译旧generic显示翻译器。

成员清单
CMakeLists.txt: Qt6.9.2 x64 SDK构建native generic/QPA；既有producer仓外生成帮助、20缓动及100 Demo实际源表，六项隔离合同含401根Qt布局和Windows Alt字体准入；不携带Qt。
tool_help_font_policy.h: 只将Windows原厂Alt前缀映射至共享批准的Option/Alt组合做字体准入，显示原字节、其它owner与未知文字保持原路。
tool_help_font_contract_test.cpp: 三语Windows Alt组合的旧拒绝/新准入、源字节保全及未知文本/编码/长度反例；不抵实屏。
plugin.cpp: 仅接QPA显式语言的QGenericPlugin；不读环境、profile或认证，不包含验收helper。
runtime.h: 窄runtime安装与只读诊断边界。
title_adapter.h: 官方updateAppTitle的MSVC32字节string/帧/格式参数证明；共享标题策略只翻标签和真实空值，用户同名字保全。
help_adapter.h: 官方Windows四string/vector文档布局与main/def caller；共享审批选择，仅description投影，原对象和其它成员保全。
help_contract_test.cpp: Windows文档ABI、双caller三语分表、原像/opaque成员及单次异常传播；不启动宿主。
demo_adapter.h: MSVC optional/string的40/32字节ABI及内置Demo JS reader→runGuiScript返回点；同factory的importPreset和普通Script分支透传。
demo_contract_test.cpp: 隔离验证正确JS caller三语投影、两个相邻错误caller拒投、源漂移、nullopt和原异常单次透传，不执行示例。
welcome_adapter.h: 96字节Windows log_msg影子，复用三语Welcome/两精确节日后缀；未知producer不读取消息，原logger只调用一次。
welcome_contract_test.cpp: 合成验证九种Welcome投影、opaque/用户消息保全、坏指针未知caller及原异常单次传播，不抵实屏。
title_contract_test.cpp: 隔离帧fixture验证三语真实空值、同名用户数据、分隔符名称、dirty后缀与未知ABI；CTest运行，不接宿主。
viewport_snapshot.h: Windows分段blob从已证父帧读取完整名称；要求两个精确返回位与线程栈边界，片段字节不变。
runtime.cpp: 官方同根映像/导出准入、唯一locale及窄显示适配；ToolHelp复用共享字体门并仅补Windows Alt组合。Demo只在内置JS读取caller核动态canonical根、100文件实际源SHA与489位置后复用共享投影，不写脚本。Welcome先核spdlog直接返回点与启动producer再投影影子payload；Fast只在已证filter caller开启Unicode，排序及自定义缓动名透传；CAS限实际IAT。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
