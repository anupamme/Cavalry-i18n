# assets/
> L2 | 父级: ../CLAUDE.md

成员清单
timeline-six-names.cv: Cavalry 2.8正常Save格式的六层场景；固定中日英文、混排与长名；无外部素材。
timeline-six-names.expected.json: 固定场景的合成顺序、图层名称与结构预期；不是任何候选的PASS。
hidden-plugin-pair.cv: Cavalry 2.8正常Save的Erosion/Polar双filter场景；保留comp子项和两条过滤边。
hidden-plugin-pair.expected.json: 列composition、四行、compound nodeType、版本、自定义niceName和过滤边；不授默认名或显示PASS。
sound-empty-file.js: 固定创建Rectangle与Sound、连接并选择Sound、播放并读取两项真实type；不保存Scene。
sound-empty-file.expected.json: 声明两节点、名称、type、连接与空File预期；notificationPass状态固定not-asserted，不授通知实屏信用。

依赖边界:
复制到临时目录再打开，禁止覆盖固定输入。
Timeline场景包含六个默认圆形JavaScript Shape。
双插件场景只含自有CV内部节点，不含外部素材文件。
双插件自定义niceName不是默认nodeName翻译目标。
默认表达式只创建圆形Path，不访问文件或网络。
Sound脚本只在自有空Scene中通过标准Run执行；File保持未赋值。
Sound expected只声明输入结构；实际通知须由单独显示证据验收。
JSON不支持注释；结构说明留在本地图与离线合同测试。
现场截图和运行回执不进入本目录。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
