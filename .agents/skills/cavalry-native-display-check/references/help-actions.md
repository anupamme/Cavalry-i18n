<!--
[INPUT]: 依赖批准owner、帮助源、本批targets身份与唯一实际popup。
[OUTPUT]: 提供帮助消费、批次身份核验、geometry读回与原生截图顺序。
[POS]: 帮助动作参考；覆盖矩阵和OCR判据由其他参考持有。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 帮助动作

## 普通属性提示

复用[控件导航](native-ui-actions.md#创建插件与加载属性)，按owner和批准名定位属性行。
全名被省略时只接受唯一批准前缀候选。
前缀须以实际省略号结尾且至少3字符；全文仍以实际popup严格比较。
多个批准名共用前缀时，用实际tooltip完整标题消歧；不取首项。
富文本标题先由Qt解码；该属性仍只用于定位。
不要用HTML属性与plain正文硬比作定位门。
默认隐藏/禁用项先核厂商hiding/dimming与当前实际状态。
未出现popup的项记未消费，不当漏译，也不抵帮助通过。
发送标准MouseMove与ToolTip事件；属性toolTip只定位，不抵popup。
要求事件后出现唯一可见Qt::ToolTip窗，只读其显示QLabel。
按实际textFormat解码：RichText用QTextDocument，AutoText先由Qt判断，PlainText原样。
同时保留raw和显示文本；HTML与纯文本不等不构成漏译。
严格比较完整tip或完整label加换行与tip；不trim、不contains、不改批准值。
连续帮助逐条保存全文；旧popup只接纳本驱动上条已精确匹配的正文。
下条正常ToolTip事件自然替换，保存前后正文，不先隐藏或补写。
标准Qt事件不证明OS自然悬停等待链。

审原图前锁定本批targets.jsonl绝对路径与SHA、locale和exact PID；逐图核capture绑定，禁止混用旧批次。
Qt WId不等于CGWindowID；按exact PID和本次几何绑定原生popup。
popup不保证layer0；独立核其原PNG，不用名称库存代像素。
动作完成后先只读控件text、sizeHint和geometry，再从exact PID的既有CG窗取原图。
几何读回不穿插`QWidget::render`：Qt 6.9.2会在隐藏控件分支激活布局，必要时调整顶层尺寸；可见分支会派发待处理的移动/尺寸事件。见[Qt源码](https://github.com/qt/qtbase/blob/v6.9.2/src/widgets/kernel/qwidget.cpp#L5144-L5407)。
geometry证明控件分配尺寸；CG原图证明实际墨迹、裁切与重叠。两类证据都保留。
OCR与全文判定见[证据与定位](evidence.md#已有ocr的区域断言)。

## 节点说明

在唯一NodeRowWidget内找批准名称标签；说明可归RolloverLabel。
其toolTip须精确匹配批准名称、换行标记和说明，再发标准事件。
节点行toolTip为空不证明说明缺失。
复用上节实际popup全文、富文本解码和原生图像判定。

## 脚本帮助

按当前批准JavaScript Editor标签译值，用Qt标签事件打开编辑器。
核真实编辑控件；固定未执行文字只进入本轮空编辑区。
用QInputMethodEvent输入并读回消费；不发执行、保存或提交键。
OS事件完成不证明输入；空commit不删除已选文字。
向文字位置发hover，检查编辑器持有的实际Qt::ToolTip窗。
合成hover驱动须在同动作内把真实QCursor同步到该点。
厂商按全局指针定位popup；只发Qt事件会留下旧定位。
只同步批准文字点，不移动或缩放popup补救截屏。
不凭猜测的C++类名或事件返回值判断popup不存在。
同一可见popup须同时命中函数名和完整批准说明，不拼接多窗结果。
启动、输入、捕获连续执行，不用人工停顿耗尽测试期限。
清理仅删除本轮仍完整的未执行文字，不删已有脚本或改偏好。

Def实验帮助先按[实验性Def帮助](native-ui-actions.md#实验性def帮助)启用正常产品入口。
同一自有编辑器使用批准的17条注释fixture，不执行或保存脚本。
逐条读同一tooltip popup的完整正文，并保存对应exact-PID原生图。
批次结束恢复并读回厂商nodeDefinitions的完整默认表达式。

排版回归在同一popup做长→短→长，不反复切语言。
短正文够宽时单行，长正文超上限才自然换行。
核说明标签对齐首行；字体、行距与padding沿宿主。
记录各窗实际宽度，不把同宽或wordWrap开启当通过。

帮助按namespace、稳定name和英语源绑定；main/def同名不能混用。
384个main根、17个def根、111嵌套说明分别记覆盖；根样例不抵512叶。
脚本标签若来自已存名称，即使等于默认英文也保留原文。
验证默认名须用真正新建、未保存标签，不拿空正文推导来源。
需要核源接线时，从项目根按需复用现有工具：

```sh
node --test tools/native_metadata_help.test.js
node tools/build_native_help_description_table.js \
  --metadata-dir /path/to/official/MetaData --out /path/to/session/help-table.inc
```

生成表只证明源/译值配对；实际正文仍按本节消费判定。
新Qt调用适配遵循[驱动边界](native-ui-actions.md#复用驱动)。
