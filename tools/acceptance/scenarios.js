/**
 * [INPUT]: 依赖44项原合同、已验场景与平台边界。
 * [OUTPUT]: 提供按场景排序的细项；语言与状态由catalog展开。
 * [POS]: 只定义行为判据，不启动App或保存历史PASS。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const rows = [];
function add(batch, masters, locales, platform, definitions) {
  for (const [id, title] of definitions) rows.push({id, batch, masters: masters.split(','), locales, platform, title});
}
const tri = ['zh-Hans', 'zh-Hant', 'ja_JP'];
const shell = ['shell:en', 'shell:zh-Hans', 'shell:zh-Hant', 'shell:ja_JP'];
add('00-offline', 'A-1,A-2,B-1,B-2,B-3,B-4,B-5,G-1,G-2', ['shared'], 'shared', [
 ['vendor','官方2.8/Qt/架构/catalog来源与当前资源绑定'],
 ['translation','原4319/剩余5959及补充源审校；厂商日语13修订/377保留'],
 ['format','ICU/占位符/HTML/模型/API/字体身份保全'],
 ['producer','完整三语producer、缺额重复键、确定性摘要及陈旧资源拒绝'],
 ['demo-ast','100官方脚本三语源位置与AST同构；不冒实跑'],
 ['help-approval','512帮助审批；401根与111 nested各守范围'],
 ['legacy-feed','p12字节/URL/原签名保持；不运行2.7客户端'],
 ['isolation','preview/production标识与state分离；不复制owner']]);
add('01-contracts', 'D-1,D-2,D-3,E-1,E-2,E-3,E-4,E-5', ['shared'], 'shared', [
 ['ordering','资源先写、locale最后；pending与receipt终态'],
 ['preimage','首次前像、同语重应用、无关偏好保留'],
 ['drift-contract','symlink、字节/mode漂移、坏receipt与pending的准入反例'],
 ['directory','empty-only目录清理、固定OS home与hostless恢复'],
 ['writers-contract','全部写者准入、受控launch-only、无恢复证据不授能力'],
 ['bridge','九命令及camelCase bridge；版本/资源/语言/补丁/恢复状态分离'],
 ['official-contract','Official来源、限时回收与异步status；不授notarization'],
 ['state-fixture','默认/显式/Unknown及六态fixture，无横向溢出，不代真实后端']]);
add('02-normal-start', 'A-5,C-3,D-4,F-4', tri, 'shared', [
 ['first-visible','正常产品首次可见文字正确；不先刷新/开菜单；helper不抵正常首帧'],
 ['welcome','Welcome固定生产者实际消息及字形，不翻译用户日志'],
 ['loaded','本轮PID、locale及实际runtime/资源；仅一次输入绑定'],
 ['persist','正常退出与重开后locale和已验内容持久；复用本次必要重开']]);
add('03-blank-workspace', 'C-3,F-2,F-3', tri, 'shared', [
 ['graph','Graph已证空态完整文字和字形'],
 ['snippet','Snippet空提示全文、无乱码；布局按当前已定范围'],
 ['messagebar','MessageBar空队列完整UTF-8，未知日志保持原文'],
 ['tool-select','Select/Transform固定帮助、组合提示及键位token'],
 ['tool-editshape','Edit Shape九固定帮助及正确owner'],
 ['tool-mesh','Mesh四固定帮助及字形'],
 ['tool-pivot','Pivot批准固定帮助及字形'],
 ['tool-restore','工具、质量、AA、FPS及视图恢复原值']]);
add('04-six-names', 'F-2,F-3', tri, 'shared', [
 ['fixture','六名自有场景实际加载，行数/顺序/身份一致'],
 ['measure-draw','Measure/Draw同一字体回退；调用证据与图像分账，非性能采样'],
 ['viewport-name','Viewport名称/CJK/混排/长名，不把操作柄遮挡判缺字'],
 ['old-file','正常打开自有旧工程，六名全文及未选中长条可读'],
 ['fps','启用FPS并真实播放：前缀/数值/字形/时间推进，结束恢复开关']]);
add('05-plugin-panel', 'C-3', tri, 'shared', [
 ['conditional','22条件帮助逐源展开后进入实际条件；Spherise Lighting/Bump/页签及Ripple Linear'],
 ['restore-fields','各插件完成标签→枚举→提示→nodeInfo后恢复原字段、条件与页签'],
 ['hidden-fixture','同一hidden-plugin-pair工程核Erosion/Polar type/连接/字段；自定义名不当默认名']]);
add('05-group-and-null', 'C-3', tri, 'shared', [
 ['group-modes','先正常创建再分组；Group两枚举实际选择与读回，最后恢复原mode'],
 ['null-shape-opacity','Null shape与继承Opacity可见角色；只验既有范围，结束恢复字段']]);
add('06-search', 'C-3,F-2', tri, 'shared', [
 ['fast-local','Fast本地名查询、可见结果、heldQuery原图及同owner清空'],
 ['fast-original','Fast英文原文查询按实际结果记录，不预设别名支持'],
 ['fast-hidden','Fast隐藏节点与无匹配分别核结果，不互相代替'],
 ['classic','Classic查询、模型总行/未隐藏行/可见行分账'],
 ['fast-create','Fast标准创建后的新增行、单选与实际type因果链'],
 ['classic-create','Classic标准双击创建及实际type，不能借Fast结果'],
 ['query-preserve','查询实际值不翻译；固定Run每PID一次的限制及缓冲恢复保留']]);
add('07-guide', 'C-3,F-3', tri, 'shared', [
 ['ui-route','UI Guide完整已定页面及真实目标，最后返回chooser'],
 ['animation-route','Animation关键帧/时间/数值→动态正文→Easing→Done'],
 ['connection-route','Connection真实端口拖动/连接后态/正文推进'],
 ['behaviour-route','Behaviour批准Noise等动作按教学步骤连续推进'],
 ['render-route','Render Manager/Current Composition/后续页/Done；不冒实际导出'],
 ['setup-names','在各Guide实际工程核七setup名称，不另切语单验'],
 ['reset','条件触发Reset→完整文字→Cancel→恢复布局；不存在条件须记录依据'],
 ['firstlaunch-scope','98键逐项归属；当前profile FirstLaunch与普通路径分开，不重置用户状态']]);
add('08-help', 'C-4,F-2', tri, 'shared', [
 ['popup-layout','同popup长→短→长：全文/字形/裁切/标签首行对齐'],
 ['buffer','固定literal输入→真实hover→全文/PNG→清除；不执行任意脚本']]);
add('09-def-experimental', 'C-4', tri, 'shared', [
 ['def-lifecycle','实验开关正常启用/重启，17根注释帮助不Run，结束还原表达式/开关并核回']]);
add('10-demo', 'C-3,F-2,F-3', tri, 'shared', [
 ['clouds','Clouds Shader正常菜单打开；合成/图层显示名、身份及画面'],
 ['bridge-demo','Bridge Constraint从Dynamics打开，核合成/图层/身份与画面'],
 ['demo-scope','100菜单与两示例实跑分账；脚本297源词/489位置离线检查不抵100实跑']]);
add('11-save', 'C-3,F-3', tri, 'shared', [
 ['save-caption','Save Scene真实面板标题/字形与Cancel；可搭已有实际保存动作'],
 ['save-as-caption','Save as .cv独立入口标题/字形/Cancel；不冒保存PASS']]);
add('12-normal-workload', 'F-4', ['comparison'], 'shared', [
 ['startup-clock','译后与stock同主机/场景的普通新进程启动；同源时钟/首次可读帧'],
 ['menu-clock','真实鼠标首次/再次菜单；首次测量须早于其他菜单操作'],
 ['search-cost','已有搜索动作期间CPU/RSS/IO与正常显示'],
 ['edit-reopen','自有工程Create/Save/Quit/Reopen与资源观察；不借标题Cancel抵保存'],
 ['playback-cost','同场景同负载播放/停止/时间推进与资源观察'],
 ['visible-intervals','同一播放录像离线计算可见更新间隔；保留OCR缺失，不冒内部render时延'],
 ['comparison-scope','不新增三语×全负载性能全排列；8秒非硬门槛，helper/调试器段排除']]);
add('13-switcher', 'D-4,E-2,E-4,E-7', shell, 'shared', [
 ['main','路径/语言/补丁徽章/资源禁用/按钮/下拉实际显示'],
 ['footer','文字左图标右、上下10pt、Medium字重、等可见图标间距、小红书hover红'],
 ['about','Twitter/X与小红书关注+图标，固定链接/失败反馈'],
 ['resize','真实连续快速拖动与缩放，内容不抖/裁切；平台窗口控件'],
 ['switch','壳文案与普通Switch单次提交、恢复进度行、动画/Activity；复用目标语言事务，不作四壳语×三目标语全排列'],
 ['restore-cancel','Restore确认Cancel不改变状态'],
 ['restore-success','真实Restore成功/终态与实际英语，不借fixture代事务'],
 ['writer-error','写者运行拒绝typed错误/Activity，profile不变'],
 ['read-error','读取拒权typed错误/Activity与保全；权限恢复后的正常路径']]);
add('02-language-transaction', 'A-5,D-4,E-7', tri, 'shared', [
 ['target-apply','真实Switcher应用本目标语言，核事务回执、实际locale与自动启动；直接接本语显示批次，不另切一次']]);
add('14-transactions', 'D-1,D-3,D-4,D-5,E-1,E-3,E-5,E-6', ['platform'], 'shared', [
 ['target-english','真实Restore English事务及实际英语；复用生命周期恢复动作，不借实验回滚'],
 ['target-handback','正常切回本轮约定语言，核实际locale并回交原偏好/布局；不得固定改为某语言'],
 ['stock-status','首次Apply前真实English(default)+Official与准确目标；只读不写'],
 ['reapply','同语重应用、当前有更新状态与普通升级入口'],
 ['retention','正常切语/退出/重开不改无关偏好与布局'],
 ['write-denial','目录写拒权后资源/pending、UI错误，恢复权限后普通Switch收敛'],
 ['drift-live','实际漂移冲突及Unknown，保留外来字节；撤销漂移再正常恢复'],
 ['interruption','真实writer中断，新进程恢复且locale最后提交'],
 ['durability','合成fsync warning及生产重试；明示合成不冒硬盘故障'],
 ['hostless','缺宿主时owned English恢复且不启动宿主'],
 ['keychain','macOS固定owned槽/baseline/journal及恢复；不读凭据或重认证']]);
add('15-package', 'F-5,G-1,G-4,D-5', ['platform'], 'macos', [
 ['arm-build','ARM完整runtime/App/DMG及标准成品门'],
 ['intel-build','Intel完整runtime/App/DMG及成品门；实机未验非阻断'],
 ['install','实际DMG复制安装、脱离镜像后正常启动'],
 ['production-owner','正常Apply建立production owner；不移植preview receipt'],
 ['uninstall-keep','移除Switcher后Cavalry翻译/六固定文件/偏好保持'],
 ['reinstall-restore','同版本重装→正常English恢复→厂商固定槽与owner终态'],
 ['updater-scope','首版bootstrap无跨版本升级；下一版独立补验，不以重装冒领'],
 ['handback','正常退出、自有副本清理、偏好/workspace原字节mode回交']]);
add('15-windows', 'D-6,G-5', ['platform'], 'windows', [
 ['windows-build','2.8 Windows实现与真实x64成品，不继承2.7 QPA准入'],
 ['replace','Windows用户文件替换/目录耐久/中断新进程恢复'],
 ['process','Windows真实进程准入，精确PID与目标路径'],
 ['install-roots','自定义可写目录与Program Files授权事务分别验'],
 ['launch-paths','桌面/开始菜单/直接EXE/固定入口实际加载当前runtime'],
 ['installer','NSIS安装/同版重装/移除保留翻译/显式恢复与app-data边界'],
 ['windows-handback','结束进程及恢复用户配置，自有工件清理']]);
add('16-release', 'G-3,G-6', ['release'], 'release', [
 ['ci','同SHA源码门和ARM/Intel/Windows生产构建真实结果'],
 ['versions','版本/tag/三平台资产命名与实际目标2.8一致'],
 ['signatures','包身份与updater签名验证；不冒Developer ID/notarized'],
 ['authorize','公开发行授权与发布状态核对'],
 ['feeds','发布后实际下载统一latest.json，核三平台新包与不支持宿主的p12入口'],
 ['downloads','发行资产下载/签名/内容读回，不用配置存在代发布成功']]);
add('17-closeout', 'H-1,H-2,H-3,H-4', ['shared'], 'shared', [
 ['freeze','冻结源码/译文检查点及输入身份，旧检查点不重做'],
 ['archive','成功驱动/最小依赖/原话/原始失败/经验归档，证据逐项可追溯'],
 ['cleanup','批末删除过期自有派生；保留有效前像、成功脚本与未闭证据']]);
add('00-decisions', 'A-3,A-4,B-6,C-1,C-2,C-5,F-1', ['shared'], 'shared', [
 ['architecture-decision','复用native-first及默认locale裁决；无变更不重做历史探针'],
 ['blend-decision','复用Destination Over单变量语义实证，不扩透明Alpha或多层'],
 ['historical-probes','历史两键/安装版小样作为来源；当前消费者由场景覆盖，不独立再跑'],
 ['restart-decision','沿Apply→重启；无新需求不新增热刷新/sidecar测试'],
 ['owner-inventory','固定漏译/自绘owner与键的分类，受影响位置归所属场景']]);
module.exports = { rows, tri };
