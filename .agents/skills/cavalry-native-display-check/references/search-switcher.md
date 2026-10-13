<!--
[INPUT]: 依赖Quick Add owner、只读API、查询快照与真实Switcher AX树。
[OUTPUT]: 提供查询保全、节点类型读回和Switcher备用动作方法。
[POS]: 独立入口参考；不成为通用控件树扫描器。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 搜索与Switcher

## Quick Add

用当前批准Add Layers Popover菜单进入；AX无候选不证明候选不存在。
复用宿主Qt核FastQuickAddWindow下的实际搜索框和view。
非主顶层窗的父链仍可含MainDock；不限制为顶层窗口。
空值布尔和placeholder足够找owner，不读用户查询证明为空。
模型根行数不是屏内行数；QHeaderView继承item view，fixture按真实类型断言。
库存不授搜索、创建或隐藏插件消费信用。
固定搜索分别验本地名、English别名和无匹配；复用Fast CJK规范化反例。
隐藏节点与无匹配分开断言；英文查询先观察，不预设别名支持。
请求source key不是实际model identity；不因过滤失败改无关字体。
固定输入须读回实际消费；QLineEdit.setText不发textEdited。
清空前保留`heldQuery`并采同owner原生图；清空图另存，不覆盖查询原图。
先保存查询行数与屏内值，再用同控件实际删除键清空并读回。
清空后读回失败不抹掉查询原件；下一查询重新取得当前owner。
`role=256`只读QVariant元类型时，不授节点type；对象值与节点身份另证。
窗口关闭可中断标准事件；节点创建以同owner实际节点读回为准。
不可见、销毁、替换和子控件隐藏分开记。
无可读owner记NO-OBSERVATION，不判过滤失败。
复用私人`run_language.py`与配对host/client；不把它们打包进产品。
按host的canonical会话规则创建批次子目录；启动env与client指向同一目录。
根模板目录不是实际会话；超时先核接线，不重复改成功候选。
源准入每批缓存一次；查询前快照与清空后截图分账。
新Qt调用遵循[驱动边界](native-ui-actions.md#复用驱动)。

## 创建后的精确类型

显示名称和Fast role元类型不证明创建了正确节点。
在自有空场景中，先记录零行及零选中。
标准选择后，核同一SceneTree新增一行、单选及唯一节点面板。
双击保留完整按下/释放序列；动作返回不证明创建。
同PID选中唯一新节点后，复用固定只读API样例。
用`api.getSelection()`核单选，再用`api.getLayerType(id)`读原值。
以空场景变化、唯一节点面板和API返回建立因果链。
公开行角色没有UUID时，不猜字段或新增UUID必验门。
类型返回值按官方源比对；不把niceName当type，不猜命名空间格式。

标准Run会保存全部脚本tab和整个Preferences文件。
运行前在内存保存该文件字节与mode，保持Cavalry写者独占。
只替换当前可见编辑器，模板不接受任意脚本参数。
从唯一可见可写TextEdit取最近WindowBase。
同一WindowBase中绑定批准Run按钮和只读QTextEdit Console。
C++派生类名不保证出现在Qt元类；不要猜JavaScriptWindow元类。
UTF-8按钮文案用`QString::fromUtf8`，全选复用平台SelectAll绑定。
向Run发送标准鼠标按下和释放，不调用私有slot。
只读Console基线后的本次token行，不读历史全文。
每PID只Run一次；超时视为已可能执行，不重放。
确认该写者退出且没有其他Cavalry写者后，恢复原文件字节与mode。
恢复记录归档失败不阻断已退场写者的偏好回交。

私人查找键：`fast_node_type_readback.mm`、
`request_type_readback.py`、`run_root_type_readback.py`。
只读API消费不证明保存重开、正常退出或启动首帧。

## Switcher AX备用入口

操作真实Tauri/WK，不用fixture bridge替代。
按exact PID读本次AX树，取得可用按钮后才开始动作。
同进程名并存时，System Events引用可按名称错绑。
用AXUIElementCreateApplication建立PID句柄。
再用AXUIElementGetPid及CGWindow owner核回同PID。
AX树初次不含WebArea时，有限等待其就绪。
不把空树或其他App的英文按钮判成该副本语言失败。
窗口出现不证明bootstrap完成；不复用历史序号。
对语言combobox执行其实际AXPress。
选项可暴露为AXStaticText：文字在description，name/value为空。
当前语言有更新时description含同源徽章，按本次描述选项。
分别执行Switch或Update，普通Switch直接执行；Restore English仍确认。
读取真实Outcome和新进程结果；先保护临时恢复记录再退出副本。
当前语言按实际安装卡片内的精确文字核对。
WK可展开徽章包装层；不强求独立AXGroup。
后台WK的AX树已更新，不保证CG画面已绘制。
动作前激活精确副本；终态后再采同PID原图。
若原图仍是旧帧，保留旧图，不重发业务动作。
激活后补采并独立判图，不将AX匹配直接判像素通过。
运行写者拒绝须核typed错误、Activity及profile字节/mode不变。
这只覆盖实际操作，不从AX动作返回推导产品事务成功。

## Switcher界面语言

目标语言Select只改Cavalry语言，不是Switcher界面语言。
在系统Language & Region中，为获准Switcher选择应用专属语言。
先退出该副本，再保存语言；不改全局语言列表。
系统询问重新启动时，选不重启，再正常打开精确App路径。
同identifier的旧副本会让系统显示旧名称；按实际PID与App路径验收。
等设置sheet关闭且单键读回匹配，再启动副本。
等真实WebArea就绪，再合批验主窗、About和本批动作。
测试后经同一设置恢复原值；原键不存在时删除临时应用行。
读回单键及实际窗口；不从启动参数或源码四语存在推导显示通过。
