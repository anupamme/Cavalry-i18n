<!--
[INPUT]: 依赖原生候选文字表、viewport.settings.showFPS 与既有验收方法。
[OUTPUT]: 提供 Timeline、Viewport、FPS及固定工具帮助的三语检查矩阵。
[POS]: 验收细节参考；所有矩阵都是待执行要求，不是当前 PASS 声明。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 自绘文字检查矩阵

## Timeline 名称

每种目标语言都检查 Timeline 列表名称和时间条名称。
同一名称必须在测量和绘制路径使用同一字体回退。

| 语言 | 六类名称样本 | 视图状态 | 测量 | 绘制 |
| --- | --- | --- | --- | --- |
| 简体中文（zh-Hans） | 英文、简中、繁中、日文、混排、80 字符长名 | 五种状态 | 必验 | 必验 |
| 繁体中文（zh-Hant） | 同一组六类名称 | 五种状态 | 必验 | 必验 |
| 日文（ja_JP） | 同一组六类名称 | 五种状态 | 必验 | 必验 |

五种状态：初始视图、放大、水平滚动、缩小窄条裁切、垂直滚动。
每语记录五张整窗图。两种名称表面都要可见并逐张核对。

通过判据：

- 名称逐字正确。CJK 字符不显示方框或缺字。
- 列表名称与时间条名称属于同一图层。
- 缩放和滚动不改变名称与图层的对应关系。
- 窄条裁切不越过当前时间条，也不污染相邻时间条。
- 测量与绘制均走当前候选的同一字体回退规则。
- 截图只证明绘制结果。没有测量路径证据时，测量项标为未验。

测量接线从现有 [`timeline_font_adapter.inc`](../../../../injector/native/timeline_font_adapter.inc)
和 [`timeline_owner_observer_contract.h`](../../../../injector/native/timeline_owner_observer_contract.h) 核对。
它们固定 Measure/Draw caller，并共用完整名称与字体选择。
沿用对应候选现存的 measure/draw 调用回执；未取得则记未验。
五种实屏状态另验宽度与裁切，不用静态接线冒充实测。
不要为这项证据新增生产日志或常驻检查。

## Viewport 名称与质量

用自有临时场景中的 CJK、混排和长名称检查实际 Viewport 名称。
只判定原生 owner 下的显示，不改写对象名、模型值或搜索值。

| 语言 | Viewport 名称 | 质量文字 |
| --- | --- | --- |
| 简体中文（zh-Hans） | 检查当前候选覆盖的 exact 名称 | 检查受影响的质量状态 |
| 繁体中文（zh-Hant） | 检查当前候选覆盖的 exact 名称 | 检查受影响的质量状态 |
| 日文（ja_JP） | 检查当前候选覆盖的 exact 名称 | 检查受影响的质量状态 |

质量与抗锯齿控件有九种组合，不等于九种实际状态文字。
已证空场景只显示下列四种；其他场景须按实际输出判定。
Full搭配Standard或Auto都显示Full。
Full搭配Enhanced显示Full + MSAA。
Low显示No Anti-aliasing。
Lowest显示No Anti-aliasing, Shaders or Filters。
Low和Lowest都会禁用抗锯齿控件。

逐项选择时，先在Full下选择抗锯齿，再切换质量。
每次记录控件当前值、启用状态和视口实际文字。
Low或Lowest下保留的抗锯齿值不证明该值已生效。
Auto选项不证明视口显示AutoMSAA后缀。
只把原图可见的文字记为已观察状态。
未出现的文字记未观察，不记PASS或全局N/A。
保留产品批准的九项目标表，不按四种显示状态删目标。

恢复时先选Full，再恢复原抗锯齿值，最后恢复原质量值。
核对两项实际读回；截图只证明视口文字。

通过判据：文字与当前 locale 一致，无方框，且属于目标 Viewport。
只检查本次受影响的状态；不要为无关状态增加常驻检测。

## FPS 动态文字

FPS只在启用显示开关且正在播放时出现。
先打开`viewport.settings.tooltip`对应的视口设置。
读回`viewport.settings.showFPS`实际勾选状态。
读取器没有候选时，先核实际原生弹层。
可用批准标签同一行的勾选像素证明已开启。
该方法不从缺少绿勾推导关闭。
若未勾选，通过正常UI启用，再核勾选结果。
退出测试前恢复本轮改变的开关状态。
随后播放自有测试场景，核时间码前进或真实播放状态。
键鼠投递成功不证明播放已消费。
没有显示FPS时，先核开关与播放，不先改字体。

三语分别检查`viewport.fps`前缀和动态数值。
前缀遵循批准译文；数值保持原厂格式。
该文字直绘owner不同于质量文字的缓存owner。
质量文字通过不抵FPS通过，也不抵首次可见帧。

## Transform 与 Edit Shape 固定帮助

以下 source key 各有简中、繁中和日文 lane。
按本次 owner 变更检查对应组；改动共享字体回退时检查两组。

| 工具 | 九个固定 source key |
| --- | --- |
| Transform | `tool.transform.help.enableSnapping`、`tool.transform.shortcut.spaceClickDrag`、`tool.transform.help.pan`、`tool.help.key.space`、`tool.transform.help.playStop`、`tool.transform.shortcut.holdS`、`tool.transform.help.directLayerSelection`、`tool.transform.shortcut.sClickPath`、`tool.transform.help.insertKeyframe` |
| Edit Shape | `tool.editShape.help.bezierAngleSnap`、`tool.editShape.help.deleteBezierHandle`、`tool.editShape.help.disableSnapping`、`tool.editShape.help.splitPathBezier`、`tool.editShape.help.splitPathCorner`、`tool.editShape.help.toggleTransformTool`、`tool.editShape.shortcut.sClick`、`tool.editShape.shortcut.sDoubleClick`、`tool.editShape.shortcut.xClick` |

每个受影响工具都检查三语固定帮助。核对文本、owner 与键位 token。
`Space`、`S`、`X` 等键位保持原样。未知 caller 必须显示原厂文本。
当前 key 与译文以 [`getpath_font_texts.inc`](../../../../injector/native/getpath_font_texts.inc) 为准。
