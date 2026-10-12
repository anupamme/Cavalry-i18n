# injector/native/
> L2 | 父级: ../CLAUDE.md

本目录保存 Cavalry 2.8 macOS arm64 字体、FPS、标题、帮助、Guide、Fast、Easing与Mesh提示候选组件。
GetPath每语lane由27→31→71项；保留旧81+Mesh12槽，再追加120个ToolHelp槽。
本目录候选均不进入2.7发布链。
帮助说明、帮助布局、Guide正文与Fast C1适配已加入单一候选源。
main与def两条已证caller各读独立source-bound表。
未知caller由arm64 veneer透明尾跳原导入。
字体适配只消费同bundle四个已验映像。
标题另依赖fmt10，帮助依赖CavalryUI，布局依赖同bundle Qt 6.9.2。
Guide正文只接精确Keep going caller/source；ABI门在构造时核对QtWidgets与Extension。
Easing只投影精确20个预设显示标签；回调捕获的枚举身份保持原值。

成员清单
native_font_candidate.mm: 从主可执行定位Frameworks；接通getter、FPS、字体、标题、帮助、Guide正文与Easing显示hook。
candidate_contract_test.cpp: 验证FPS双返回点、prefix、旧owner、字体覆盖、标题回退与71项GetPath lane。
guide_body_abi_contract.h: 锁定唯一Guide正文caller、尾跳callee、双映像UUID与Qt setter符号。
guide_body_policy.h: 仅把精确Keep going source映射到三语固定短文案；英文与未知输入透传。
guide_body_runtime.inc: 复用同TU gLocale；ABI失败只关投影，未知caller单次调用Qt原setter。
guide_body_contract_test.cpp: 验证Guide caller/source/locale门、单次调用与异常传播。
easing_menu_abi_contract.h: 锁定addEasingMenu的addAction调用窗、Extension与Qt 6.9.2导出。
easing_menu_policy.h: 仅按完整源标签选择三语预设显示文本；拒绝歧义与未知输入。
easing_menu_runtime.inc: 同TU复用gLocale；精确caller才改QAction显示文本，再单次调用原addAction。
easing_menu_contract_test.cpp: vendor-free验证20项表形状、精确匹配、短路、单次转发与异常。
candidate_static_contract_test.py: 用合成反汇编锁定目标符号边界，并拒绝混合FAT UUID。
check_candidate_contract.py: 核GetPath来源与Mesh前缀、FPS调用字节、ABI、QtCore 6.9.2及two-level fixup。
build_candidate.sh: 生成说明/布局与20项Easing表；直链同bundle Qt，核Guide与Easing纯合同。
README.md: 说明字体/FPS/标题/帮助/Guide/Fast/Easing边界；每制品独立回归，实机分项见项目总账。
fast_search_unicode_adapter.mm: 以可执行路径定位同bundle；仅固定Fast C1调用改Unicode选项。
fast_search_unicode_abi_contract.h: 锁定Qt 6.9.2符号、Extension UUID、调用字节、正则与选项。
fast_search_unicode_policy.h: 短路校验caller、原选项与pattern；保留单次原C1透传。
fast_search_unicode_contract_test.cpp: 验证短路、选项、原调用与异常传播；不证明产品加载。
native_image_paths.h: 规范主可执行路径并比较已加载映像路径；生产门和纯合同测试共用。
getpath_font_abi.h: 声明七参 GetPath 原型；保留 x0-x4、s0/s1 及原异常语义。
getpath_font_abi_contract.h: 锁定 GetPath与FPS调用窗、两个owner返回点、字体 factory与Skia ABI。
getpath_font_adapter.inc: 用唯一gLocale选固定lane或FPS前缀，再调用共享字体核心。
getpath_font_policy.h: 定义缓存/FPS owner、71项lane、512字节上限与exactText门。
getpath_font_texts.inc: 保存213条固定UI文本；三语lane各71行，保留旧93行前缀并追加40行ToolHelp。
getpath_font_texts.81.baseline.inc: 冻结原81条三语lane；新合同逐字节核对旧行前缀。
getpath_font_texts.93.baseline.inc: 冻结扩表前93槽和原31行lane；ToolHelp源合同按固定SHA核前缀。
getpath_mesh_source_contract.py: 核原81槽与四条Mesh源行仍在前缀；不放宽Mesh键或顺序。
getpath_toolhelp_source_contract.py: 核44个批准源键、2个旧命中、2组去重与每语40个精确新行。
getpath_font_veneer.S: 精确三指令 veneer；保存 x30/x29 并尾跳 dispatcher。
getpath_owner_adapter.h: 单读帧记录；分别验证Core→FPS与Core→cache→producer链。
native_locale_abi_contract.h: 锁定 activeLocale 入口、Extension 调用窗、stub 与 GOT 偏移。
native_locale_adapter.inc: 直接绑定原 getter并核对Extension GOT目标；同bundle路径由共享路径helper提供。
native_locale_snapshot.h: 保存唯一 native locale 快照；原 getter 只调用一次且异常向上传播。
help_description_abi_contract.h: 锁Cavalry 2.8 arm64 main/def caller条件与call字节、同一callee及四string/vector布局；仅+0x00语义已证。
help_description_policy.h: 将裸name、精确英文源和三语locale映射到独立main/def表视图。
help_description_adapter.inc: 按精确LR选表；source匹配时只复制description并单次转发。
help_description_runtime.inc: 验证双caller机器码并发布两返回PC；复用同一gLocale与原导入。
help_description_veneer.S: 仅比较LR；main/def进入dispatcher，其它caller保寄存器与返回槽尾跳原UI导入。
check_help_description_contract.py: 按帮助入口符号截取13条指令；核双caller分支地址与two-level接线。
help_description_contract_test.cpp: 无Qt/vendor合同；测分表、同名异源、locale、shadow与异常透传。
help_description_veneer_contract_test.cpp: 直链真实veneer；测两未知LR透传及main/def精确LR分流。
help_description_veneer_probe.S: 合成callee记录x0-x8、v0-v7、sp/x29/x30和原返回寄存器。
help_popup_layout_abi_contract.h: 锁定DocumentationPopup唯一activate调用窗、return PC与QtWidgets导出。
help_popup_layout_policy.h: 识别四行结构及401项上限；只激活未显式隐藏的参数/返回行布局。
help_popup_layout_adapter.mm: 仅在精确setContent caller前改布局；未知调用单次透传。
help_popup_layout_contract_test.cpp: 用同bundleQt离线测401项上限、QLabel绘制行界、枚举词完整性与未知结构。
help_popup_layout_sequence_test.inc: 三语核长短参数/返回切换、fresh行几何及隐藏行恢复。
check_help_popup_layout_contract.py: 核精确caller、401表、arm64/Qt绑定及字体/内容/padding/事件泵边界。
title_format_policy.h: 按原生目录键投影Project/Scene标签；同时要求24字节源对象为空及借用指针/文本精确。
title_format_abi_contract.h: 锁定Gui::updateAppTitle到fmt10的调用、frame偏移、24字节源对象与libc++空tag。
title_format_adapter.inc: 复用唯一gLocale与fmt原函数；fmt前快照源对象，原调用后只适配精确LR/format/descriptor。
shared_verified_text_fallback.inc: CoreText首选；仅覆盖拒绝后用三语固定PostScript名创建候选；复用8槽与单次RAII锁。
skia_original_bindings.inc: 直接绑定四个 Skia 原函数并核对已验入口；未知链不准字体替换。
timeline_font_adapter.inc: 验证 Timeline caller 后把完整名称交给共享字体核心。
timeline_mixed_span_utf16.h: 把共享 UTF-8 首缺 scalar 映射为 UTF-16 range。
timeline_owner_observer_abi.h: 声明 Measure/Draw 原 ABI、veneer 与 typed dispatcher。
timeline_owner_observer_arm64.S: 将 closure/return PC 送入两个 Timeline dispatcher，不改原参数。
timeline_owner_observer_contract.h: 锁定 Timeline caller、closure 字段与 arm64 调用窗。
timeline_system_fallback_contract.h: 锁定8个字体槽、factory seed、PostScript上限与 setSize ABI。
timeline_system_fallback_mixed_span_coretext.h: 将已验证缺字位置映射为 CoreText CFRange。
timeline_system_fallback_policy.h: 定义共享字体 key、locale gate、owner/字号门与纯策略。
verified_text_selection.h: 保存三语固定PostScript名并有界选候选；全串覆盖失败才继续，解析错误即停。
viewport_blob_abi.h: 声明 TextBlob 非平凡结果槽及原函数/dispatcher ABI。
viewport_blob_veneer.S: 保留 x0-x3/x8，并传递调用者 x29/x30。
viewport_font_adapter.inc: 验证 Viewport owner 后把完整名称交给共享字体核心。
viewport_owner_snapshot.h: 单读并核验线程栈帧记录；复制有限完整的Viewport名称容器。

依赖边界:
复用父目录 Mach-O 解析器与 2.7 UTF-8 字形纯策略。
本目录不读取产品语言状态，不写运行诊断，不扫描字体候选。
默认发布链不消费本目录。
显式native/debug可编译嵌入已验候选。
preview协调器部署该字节，现场加载另验。
本目录自身不签名、安装或启动App。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
