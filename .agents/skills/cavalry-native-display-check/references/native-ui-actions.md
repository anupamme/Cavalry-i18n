<!--
[INPUT]: 依赖批准显示键、宿主Qt驱动、控件库存与原生窗口图。
[OUTPUT]: 提供控件动作、条件字段消费、数值编辑与Guide正文方法。
[POS]: 固定控件动作参考；帮助正文和搜索另行路由。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 固定控件动作

## 复用驱动

CUA走不通时先查私人文档成功驱动；PID只证明进程归属。
旧Qt驱动复用意图和公开接口，不把6.6.3二进制注入6.9.2宿主。
新调用先核host导入与同App Qt导出；头文件声明不证明导出。
dynamic_lookup只延迟解析，不补符号。缺getter标未读，不伪造空值。
新事件适配先在独立fixture核通道，再验厂商控件身份与消费。
构建后核客户端实际解析路径和已加载库的监听目录。
制品目录名不证明监听目录；旧库可仍监听旧session。
错投请求保留原件，不重放到新目录。
复用宿主Qt，不装第二套runtime；测试监听有截止，不进产品。
不读密码或任意输入，不刷新字体或补写译文。
脚本只用[获准固定只读样例](search-switcher.md#创建后的精确类型)；帮助hover不执行脚本。

## Settings质量与抗锯齿

按批准标签在同一可见Settings窗口定位唯一质量和抗锯齿组合框。
核同窗标签、三项批准选项及唯一组合框共同绑定字段。
选项动作复用下文[枚举与复选框](#枚举与复选框)。
组合顺序、禁用语义和恢复按[质量矩阵](surfaces.md#viewport-名称与质量)。
动作后读回两字段；像素结果独立判定。

私人查找键：`quality-probe/native_ui_quality_settings_probe.mm`、
`quality-probe/request.py`、`run_quality_matrix.py`。
这些文件不随技能分发；按当前host和session核验后复用。

## Tool菜单动作

在唯一MainDock子树内绑定唯一QMenuBar和批准Tool菜单。
用菜单栏QAction持有的QMenu与menuAction反向引用核所有权。
QMenu弹出窗口不是MainDock；不要要求它的window等于MainDock。
只触发唯一批准叶动作`tool.editShape.name`或`tool.select.name`。
动作触发只证明Qt收到触发，不证明工具像素或帮助已消费。
另核工具图标或帮助原图，不用动作回执代替。
动作前读取Select checked；仅初态为true且回交后仍为true才记恢复。
不满足时记handback，不记恢复。

私人查找键：`native_ui_tool_action_probe.mm`、
`tool-action-probe/request.py`、`run_tool_actions.py`。
这些文件不随技能分发；按当前host和session核验后复用。

## 成功驱动的查找键

以下是私人历史中的源文件名，不是本技能随附命令。
按任务名查私人文档，取同一记录内的源、请求表、构建入口和runner。
核当前App/Qt匹配后复用；找不到完整依赖就记驱动缺口，不猜命令。

| 目标 | 历史查找键 |
| --- | --- |
| Twist枚举与属性提示合批 | native_ui_twist_enum_probe.mm、native_ui_twist_tooltip_batch_probe.mm、run-combined-language.root.py |
| 节点说明 | native_ui_twist_node_info_tooltip_probe.mm、native_ui_boxblur_node_info_tooltip_probe.mm、run-node-tooltip.root.py |
| 同语跨插件帮助与枚举 | native_ui_multi_plugin_help_batch_probe.mm、native_ui_multi_plugin_enum_batch_probe.mm、run_language.py |
| Spherise实际tab换页 | native_ui_spherise_tab_probe.mm、request_tab.py |
| 条件bool与数值字段 | native_ui_disabled_help_bool_controls.mm、numeric_field_actions.inc |
| FPS显示开关与播放 | native_ui_viewport_fps_probe.mm |
| 六名Timeline | native_ui_timeline_matrix_probe.mm、native_ui_fixed_fixture_open_probe.mm |
| Quick Add查询 | native_ui_fast_search_probe.mm |
| getLayerType根帮助 | native_ui_get_layer_type_probe.mm |
| Guide选择页与正文 | native_ui_guide_probe_run03.mm、run_guide_roles.root.py |

这些键用于找方法，不保证历史驱动已覆盖本轮目标。
厂商App、Qt和编译测试库不进入技能资产。

## 创建插件与加载属性

1. 按exact PID读当前菜单，用批准menu.create和menu.create.effects值进入Effects。
2. 按稳定type对应的批准叶名唯一匹配可用项，不递归整棵Create菜单。
3. 先核实际新节点，再执行后续依赖选择的动作。
4. 执行menu.edit.title下的menu.comp.showInAttrEditor项。
5. 菜单含U+200C时只接受原名或该前缀加原名；不猜历史索引。
6. 助记符只按批准值剥除；读取当前Header内可见启用的GroupButton。
7. 用宿主Qt发送真实鼠标按下/释放，再读实际面板。
8. 同快照核NodeRowWidget名称和AttrControlRow字段位于同一AttributeEditorTreeWidget父链。

type、key和父链共同绑定owner；显示同名不证明身份。
属性批准owner是源域，插件owner是模型身份；分别核源，不互比。
同名不唯一则停止，不取第一个。
菜单动作已发送不证明节点已创建。
后续菜单禁用时保留结果，先核当前场景。
厂商定义hide:true时，默认菜单缺项不是漏译；用获准旧场景另验，不改定义。
只扫批准可见标签，不读用户输入或任意参数值。
名称和首字段不抵全部字段、tab或tooltip。

## 实验性Def帮助

Def实验选项经正常Preferences界面切换；更改后重启Cavalry才生效。
切换前读回原状态；结束后经同一界面恢复、重启并核读回。
偏好恢复未读回时，不记清理完成。
实验选项控件是自绘CheckBox；不要假定QCheckBox或QAbstractButton。
按批准标签定位同父CheckBox，发送标准鼠标事件并读回实际状态。
原生窗口图按exact PID匹配；不要只保留CG layer 0。
首次检查Create菜单为空时，先经正常UI打开Create子菜单，再读批准项。
菜单初始化前的空库存不证明Def节点不存在；不加固定等待。
以唯一批准Def type创建节点；用厂商nodeDefinitions的完整默认表达式。
不要用占位文本替代厂商默认表达式。
保留创建时的完整编辑器文本；17个批准Def方法只加入未执行注释fixture。
逐条核同一真实tooltip popup的完整正文与对应原生PNG。
批次结束后恢复完整默认文本并精确读回；禁止Run或Save。

## Show Selected备用路径

双击或拖入后未加载UI时，按当前清单走Show Selected一次。
需要前台时，在同一exact PID动作中激活并调用菜单；CUA不是唯一入口。
[厂商文档](https://cavalry.studio/docs/user-interface/menus/window-menu/attribute-editor/)说明此按钮清空面板并加载所选Layer。
分开记录selection、UI加载、目标结果可见。
点击后仍旧时保留失败，停止盲点；后续独立样例用新空场景。
停靠面板可不属于Qt顶层窗；沿可见树定位，再核父链。
图标像按钮不证明C++类型；按Header与批准tooltip核真实元类。
点击后至少读目标面板和字段，不用sendEvent布尔值证明消费。

## Render Manager入口

先核当前File菜单的Render Manager项及快捷键。
macOS 2.8已验默认快捷键为Option+B，可按exact PID发送正常键盘事件。
不改窗口大小；用该PID的CG窗口与原图确认面板已打开。
采集须包含浮动窗，不能只取layer 0主窗。
请求超时不证明面板未出现；先核已有窗口图，不重复打开。
关闭面板后，先核目标状态，再进入下一项。

## 停靠面板与空提示

空提示被停靠布局裁切时，先经Cavalry实际停靠菜单取消停靠。
核真实菜单项、单次选择和同PID的新浮窗，再判全文。
Qt context事件须发给已证事件接收者；不等同OS右击。
脱离后标题结构可变；旧标签库存为空不证明面板消失。
用实际CG窗口绑定原图，不改字体或最小宽度迎合测试。
私人查找键：`snippet_context_menu_host.mm`、`request.py`、`host_mouse.root.py`。

## 枚举与复选框

宿主自绘CheckBox不等于Qt `QCheckBox`；先读真实控件库存与父链。
按实际元类型选择事件接收者，不凭外观推断控件类。
条件消费须前后读取依赖子字段的`enabled`状态。
事件已发送或库存已见不单独授PASS。

按唯一owner、批准字段和真实QComboBox定位。
帮助扫查滚出节点标题时，先正常滚回同树标题，再定位枚举。
条件隐藏枚举先经正常UI切换其前置模式，再验选项。
记录原模式与原索引；结束后恢复两者，不改厂商定义。
只读其批准选项，按当前QStyle箭头区域展开。
读取真实view、viewport和popup几何，用model索引的visualRect定位选项。
先移入选项中心，再按下/释放；不以setCurrentIndex或发信号代替点击。
Qt6.9.2打开后短暂屏蔽释放；MouseMove移距大于9可解除该门。
依据：[Qt6.9.2枚举事件实现](https://github.com/qt/qtbase/blob/v6.9.2/src/widgets/widgets/qcombobox.cpp#L770-L803)。
不加等待重试；动作后核批准值、实际索引和popup关闭。
同进程切各项并恢复默认；展开与选后图像分别判定。
QCheckBox按当前QStyle指示器区域点击，不假定整行中心可点。
依据：[QStyle区域定义](https://doc.qt.io/qt-6/qstyle.html#SubElement-enum)。
核实际checked变化，不用setChecked或缩窄fixture迎合错误坐标。

## NumericField数值编辑

先核同一属性行内唯一QLineEdit及真实元类。
宿主NumericField默认只读是拖动模式，不是字段禁用。
向该NumericField发送标准双击；读回可编辑后再提交。
不用setReadOnly、setText或setValue跳过宿主事件。
Return后控件会回到只读；恢复原值时同样先进入编辑。
保存原文本和数值；读回实际值与依赖行enabled变化。
Restore沿同一控件及原始快照，不套用Apply的默认值前提。
异常时先尝试恢复，再清理自有测试进程。

## 厂商tab实际换页

Spherise标签是RolloverLabel，事件接收者是其父AttributeTabWidget。
在唯一NodeRowWidget同树内按批准tab名定位，向接收者发送标准鼠标事件。
点击后核两页专属字段的出现/消失，再采原图；事件返回值不授消费。
回交原页并再次核字段，别用固定屏幕坐标或旧布局截图证明换页。

## 可见tab备用证据

QTabBar读取能力不证明厂商tab采用该类型。
qobject_cast后不再限定元类名；库存为空先看该owner已有原PNG。
源与显示链未变时，在实际tab条ROI断言批准名。
不造控件给读取器通过；图像不授新Qt读回或tab点击信用。
工具及图像判据见[证据与定位](evidence.md)。

## Guide选择页与正文

从批准Help入口打开选择页；读回后再点唯一OptionWidget。
选择页标签使用QLabel；正文使用QTextBrowser。
正文须属于唯一可见OnboardingGuideView。
用宿主Qt解析批准HTML，再比较实际正文全文。
固定图片占位符须同时核U+FFFC与图片片段位置。
示例场景名称另验，不用默认合成名替代。
需要验示例名时，复用已证非空场景再首次进入指南。
空场景可沿用默认合成名；正文通过不证明示例名出现。
这是已验测试前提，不断言厂商所有场景分支。
采浮窗前激活exact PID，再取其layer 8原生图。
Qt winId不替代CG窗口ID；仅主窗图不证明浮窗文字。
切入其他场景前核指南已关闭；Escape不证明关闭。
先验节点，再验指南，避免指南新增属性树打断节点定位。
