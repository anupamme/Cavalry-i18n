<!--
[INPUT]: 依赖assets的固定CV场景、Sound脚本与expected清单。
[OUTPUT]: 规定场景复制、正常打开、脚本标准Run和内容加载判定。
[POS]: 可重复Scene与Script输入契约；不记录字体候选结果。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 可复用测试场景

## 复制后正常打开

默认用assets/timeline-six-names.cv及同名expected JSON。
模板含六个默认JavaScript Shape层，无外部素材。
复制到本轮自有工作区，不在模板上改名或保存视图。
用户授权正常App时，用LaunchServices打开场景副本：

```sh
open -a /path/to/authorized/Cavalry.app /path/to/owned/timeline-six-names.cv
```

helper只曝光工作区，不替代正常文件打开。
open、chooser Accepted和路径匹配只证明请求，不证明加载。
同一owned进程核预期名称、行数及场景树/目标画面。
长名须全文读回，只有前缀仍未验。
首次在该版本使用模板时保留完整加载证明。
后续复用同版本输入证明，仍核当前场景，不继承其他版本PASS。
正常实例未加载候选时只证明场景输入，不授字体PASS。
宽度、缩放和滚动由本批动作建立，不逐状态复制模板。

## 双隐藏插件场景

需要Erosion与Polar行时，复制`assets/hidden-plugin-pair.cv`。
场景来自Cavalry 2.8正常Save，含两个filter子节点与过滤槽连接。
读取同名expected JSON，核版本、composition、行顺序、nodeType和连接。
Erosion与Polar使用自定义`niceName`，不把它们算作默认节点名翻译。
expected只证明输入结构；仍须正常打开并验证本轮实际显示。
模板不含外部素材文件；不要保存覆盖模板。

## Sound空File脚本

先取得一个自有空Scene。不要清空或替换用户当前Scene。
复制`assets/sound-empty-file.js`脚本内容到Script编辑器。
使用App标准Run执行脚本，不调用私有API。
脚本只创建固定Rectangle与Sound节点，连接并选择Sound，再播放。
脚本不赋File、不保存、不序列化，也不导入场景。
读取同名expected核两节点、实际type、连接与File空值。
实际File与通知状态须从当前App界面单独验收。
expected的`notificationPass`不是输入声明，也不授通过。
不要新建Scene覆盖已有内容；不要把运行回执写入assets。

## 何时保存新模板

新建或改名动作用独立空白临时场景，不改六名模板。
确有重复价值且现有模板无法表达时，保存最小场景及expected清单。
清单列版本、composition、行数和名称，不是加载回执。
优先用正常Save格式；Recovery只作来源，不直接当最终资产。
只保存自有副本；未知改动不保存。替换模板前单独核结构与语义。
日志、原图、profile、Recovery、App、Qt和凭据不进入assets。
