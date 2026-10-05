<!--
[INPUT]: 依赖现行2.7.2架构、官方2.8.0来源、冻结三语源、用户profile生产事务、真实首屏/恢复及独立副本字体canary证据；WK fixture与无窗口AppHandle各守边界，不合成IPC联动通过
[OUTPUT]: 给出本分支的 2.8 迁移决策、TDD顺序、原4319键质量冻结、10278正式键与剩余0键的接续边界；不宣称产品已经支持2.8
[POS]: feat/cavalry-2.8.0 的实施方案入口；调查工具与原始证据不进入产品运行时
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Cavalry 2.8.0 本地化迁移方案

更新：2026-10-05
状态：**整体迁移未完成；逐项办事表以§5.2为当前唯一进度入口。** 原生显示源已全部闭合：77模块、10278审批键、剩0；每语10473叶（含195自动DNT），34厂商源/身份未改。原4319质量冻结后新增5959键，390厂商日语仅13核证纠错/377保留。512帮助译文已审但consumer未接，Destination Over仍有1项厂商源行为冲突待实测。

当前代码与离线验收：显式macOS开发预览已接用户事务、状态与四语UI；新装Absent locale按核证的en-GB fallback显示默认英语，异常仍Unknown；Official使用固定厂商Apple Developer ID requirement，只认证来源、不授予写入/恢复权。整仓Node717项通过；native与默认路径全量Rust各370通过/0失败，6个显式人工门在默认全量运行中ignored；另手动真实原厂来源与真实status组合只读smoke各1项通过，六文件前后摘要未变。四语徽章Chromium headless fixture 6项与系统WKWebView fixture 6项均通过；WK审查用prohibited激活策略，记录1个内部隐藏TUINSWindow、0可见/key/main及无自身激活事件，原厂/profile六监视文件前后不变。真实WebKit渲染不等于Tauri AppHandle/实际后端联动或Cavalry UI。测试用PathBuf归入cfg(test)后，两配置全量复验与真实只读smoke均零编译warning；格式/生产编译检查通过。

完整冻结包历史生产owner动作5/5、四语原厂首屏/正常退出各4/4；随后另一次Hans Apply成功，合计6次成功用户事务。当前typed locale为zh-Hans，自有strings/receipt存在；English恢复曾因实验副本仍运行被writer guard拒绝，未写profile，不能沿用§16的历史English终态。原厂安装未改。独立ad-hoc副本的Hans工具提示字体canary已观察8条CJK/1条ASCII路径与可读截图，但后台门失败；视口状态、时间轴、动态属性、搜索/字体身份均须分别验收。完整catalog仍0/51，Switcher IPC未验收。默认2.7发布、版本号与共享feed不变；Windows暂停，不推送或发布。全session私人检查点已本地commit；新实验与明确剩余项见§18，不能把字体小样计入完整UI通过。
本文件按用户要求放在产品分支；过程证据与临时队列留在会话级 stage 或私有历史文档库。公开构建、测试和发布不得依赖这些路径，也不打包调查脚本。

> 下文早期阶段的数量、RED、构建与实跑记录属于各自历史检查点；当前键与离线验收状态以上方状态为准。完整键资源已闭合，不代表真实 UI、独立帮助 consumer 或发行已完成。

## 1. 目标和边界

- 保持 Switcher 的英文、简体、繁体、日语体验；能翻译的用户可见界面、提示、帮助、动态消息和自绘文案都要纳入清单。
- 以2.8原生架构为主干，复用已有译文、术语和真实验证经验；原厂390个实译日语叶默认优先。维护者允许针对确证错误逐键查证后纠正，当前仅13项经独审/root批准的源绑定例外，其余377原样；剩余内容按相同语境标准审校旧译或补译。
- 性能目标是减少补丁带来的额外工作；不为同一原生表面再跑通用翻译、全控件遍历或逐帧扫描。
- 保留可靠备份和恢复；更新错误的版本/路径/受管态要求，而不是通过关闭安全检查来“兼容”。
- 不翻 API/type/id、机器协议、脚本、路径、字体族/样式或用户输入。不禁止用户输入中文/日文名称，也不假定新版创建的默认层名必定是英文。
- 本次 macOS 输入是原厂 2.8.0 universal DMG、Qt 6.9.2；用户提供的 Windows MSI 已完成资源、PE 与安装表静态专项：ProductVersion 2.8.0 / x64、Qt 6.9.2。Windows 实机行为不能借 macOS 结果宣布通过。

### 1.1 分别发行与更新隔离

已确认：2.7.2用户继续使用最后一个完整历史版本，新版专做2.8，不建立长期双版本安装路由。当前历史入口固定到[2.7.2 p12](https://github.com/daftAI2026/Cavalry-i18n/releases/tag/cavalry-2.7.2-p12)。2.8目标UI只在发现2.7.2时给出下载入口；默认旧版UI/安装事务不变。

不能仅靠新UI阻止旧客户端升级：[已发布p12配置](https://raw.githubusercontent.com/daftAI2026/Cavalry-i18n/cavalry-2.7.2-p12/src-tauri/tauri.conf.json)读取共享`releases/latest/download/latest.json`，p12 manifest中的三平台archive URL也走移动latest。最低复杂度方案是每个未来2.8正式Release同时携带冻结的legacy `latest.json`（保留p12的1.0.6/notes/原签名，三个archive URL固定p12 tag）与独立`latest-2.8.json`（新客户端endpoint，archive固定各自2.8 tag）；固定历史CTA、不同公钥或prerelease不能代替通道隔离。旧feed离线producer已完成（§11）；双feed生产接线、旧p11/p12实收合同、原包签名证明与release exact-readback尚未完成，不得发布2.8或改共享manifest。开发预览check/install updater已禁用，不改变旧发布版本的行为。

## 2. 总体路线：原生加载 + 最小接线 + 实证缺口

~~~text
旧 JSON / TS / 显示词库 + 原厂部分日语 + 术语规则
                     ↓ 以稳定键、角色和英语源审校
2.8 app / node / guide / plugin 原生 translation catalog
                     ↓ 原厂 TextLoader / TextRegistry
          原生显示读取与逐键 English fallback
                     +
       原生 locale 的可靠激活 / 重启接线
                     +
       独立脚本帮助等非 catalog 表面的处理
                     +
       仅对 live 证实的缺口保留窄范围 runtime 补充
~~~

**已决定的方向：**不用旧“字符串替换 + 全量 Qt 事件修补”继续承载所有 2.8 翻译。
**当前优先接线：**原生用户语言文件 + typed locale + 正常重启。全局、节点和指南的限域实测已支持该路线；最小安装级桥接仍保留为针对具体缺口的候选，不再作为开工前提。完整 plugin、三语覆盖与副本影响须继续验证。

不是重建通用 i18n 框架，也不是让新旧两套全量引擎长期并行。

### 2.1 第一性原理：先找必要机制，不提前淘汰路线

目标需要四件事：译文进入 registry、有效 locale 改变、需要的状态落盘、启动后消费者读取正确显示值。任一步“尚未验证”都应对应一个实验或替代接线，不写成“做不了”。

| 保留的候选路线 | 必要机制 | 下一项最小实验 |
|---|---|---|
| 原生资源 + 偏好 + 重启 | 按真实 varType/value schema 写 locale，原厂启动读取并加载 catalog | 隔离副本读回偏好、重启并观察少量中文键 |
| 最小内部 API 接线 | 在厂商已有启动调用边界接收真实 Api*，设 locale 后原样放行 | 验证跨映像接缝、线程/生命周期、保存结果；不带回全量翻译 hook |
| 原生用户插件语言入口 | 用户 strings.json 把本地语言资源交给同一 registry，可能无需改 app bundle | 不装同 locale 的核心 target sidecar，验证中文 app 键仍保留、英文缺键回退 |

三条均保留为可检验方案；选择依据是实际覆盖、重启持久化、恢复复杂度与性能，不因接口未文档化或无返回值先下否定结论。插件路线若当前格式不直接满足，就明确缺哪一段接线并继续验证，而不是凭目录名作结论。

### 2.2 推荐职责和依赖裁剪

当前建议是 **用户级 native-first + 实证驱动的窄补充**。“自有”是Switcher生成和管理的包，不是另造源文或修改厂商源目录；“当前语言”是用户本次选择的语言。原生主干以2.8原生键/源文生成该语言的`strings.json`；旧JSON/TS是复用审校来源，厂商日语默认原样投影，确证纠错须精确命中独立批准登记，不另起全量运行时。一次性生成/校验在构建期完成，显示期由厂商查表。多语常驻是否更好以实际启动成本比较，不预建通用插件系统。

| 现有能力 | 2.8 职责 | 依赖决策 |
|---|---|---|
| Tauri 壳、单一 bridge、Rust apply/status/state | 继续承载选择、用户文件事务、状态和恢复 | 复用，不更换壳或增加常驻服务 |
| 旧三语 JSON/TS、术语、原厂部分日语 | 经 owner/显示角色/格式审校后投影 native 键 | 已由原生承担的条目不再双重进入全量 injector 表 |
| 原生 TextLoader/TextRegistry、typed locale | 用户包显示主干与重启激活 | 纯资源主干不需要 Qt SDK、bundle baseline、重签或 QPA ACTIVE |
| Fast 搜索、Timeline 字体等实测缺口 | 对应 owner/callsite 的限定补充 | 需要时才引入 6.9.2 构建和逐架构 ABI 证明 |
| macOS launcher/DYLD/重签/Keychain，Windows generic/QPA | 若窄补充的实际部署确实需要才进入闭包 | 原生层可零注入；完整产品目前不能承诺零注入。重新选择最小部署接线，不直接搬旧成品 |
| 既有 English snapshot、official baseline、QPA 备份 | 继续负责旧受管安装或真实 bundle 修改的恢复 | 不冒领共享用户文件，也不成为用户包事务的错误前置门 |

实现接缝优先在现有 `commands/apply.rs`、`commands/status.rs`、`commands/context.rs`、`state.rs` 与平台路径解析处，明确“选定安装资源”和“共享用户有效语言”的不同作用域。renderer 仍用产品语言码；`ja_JP → ja` 的小样映射须单独固定，不能把 native tag 直接塞给现有 UI manifest。若引入状态字段，Rust contract、bridge 与 renderer 测试同改，保持现有命令边界，不另开直接 invoke。

构建依赖随最终闭包调整 `src-tauri/build.rs`、Tauri 平台 resources、`package.json` 和 `tools/cavalry_qt_target.json`；纯 native 生成不应强制构建旧 injector，但若保留搜索/字体补充，Qt/签名/打包证明必须服务这些实际工件，不能只删 DLL 或改一个版本常量。暂不改现行支持范围或发布配置。

## 3. 原生架构成熟度与接口判断

| 层 | 已核实的资源/静态机制（不是 live PASS） | 尚缺证据 |
|---|---|---|
| 资源组织 | 17 个源 catalog；app/node/guide/14 插件按 locale 分文件；UI-text 与说明/结构分离 | 自定义中文的实际加载与全入口覆盖 |
| 运行时查表 | registry 按 locale:key 存储；目标缺键或空字符串回退 en-GB；同语言同键后写覆盖 | 缓存、旧控件刷新和首绘行为 |
| 激活 | activeLocale/setActiveLocale 读写 Preferences.locale；GUI 的 locale 回调重载 app/node | 官方语言 UI、外部自动化调用及完整热切换 |
| 对外接口 | 官方脚本 API 有 setCavalryPreference；2.8 实现经 preference 命令写值/通知，GUI 监听 locale 后重载核心 catalog | App 内调用的 live 效果、同步持久化与全部表面刷新 |
| 译文内容 | 10 个目标 locale 资源存在；日语指南/插件已有部分实译 | 主应用和节点日语仍等于英文；资源存在不是完整语言支持 |
| 全表面 | 原生 UI-text 可形成明确键级迁移清单 | 脚本帮助、动态错误、自绘、搜索/字体仍需各自验收 |

判断：**底层本地化基础已经落地，值得优先利用；不能据此宣布第三方语言包和完整热切换已经是官方支持能力。**

官方通用偏好接口：[API Module](https://cavalry.studio/docs/tech-info/scripting/api-module/)。文档没有明确承诺 locale 的专用切换协议，内部 C++ 导出也不是稳定的外部 API。

已经追到的静态接线是：GuiJSApi 的公开 setter → preference/set 命令 → Preferences::setValue → CallbackManager::onPreferenceChanged → Gui::setupGui 注册的 locale 监听 → reloadCoreStrings。这里的公开接口在 Cavalry 内部 JavaScript Editor 运行，**不是 Switcher 能直接调用的外部 IPC**。自动部署后如何激活，应先验证闭程序后的单键偏好更新 + 原生重启读取；若确需 App 内接线，再选择最小且可达的机制，不为调用接口新增常驻服务或要求启用 MCP。

**偏好保存与启动读取的静态链已闭合：**ExtensionLayer 的 savePreferencesNow → PathManager.preferencesFile → Core.savePreferencesToFile → serializePreferences 遍历偏好 map，单项使用 varType/value。VarString 的类型名为 string；启动时 DesktopApp → initializePreferences → deserializePreferences 按注册的 Var 类型解码并写入偏好，随后 defaults 只补缺失键，不覆盖有效的 locale。预期单项形如：

~~~json
{ "locale": { "varType": "string", "value": "zh-Hans" } }
~~~

这不是整份文件，也不是已运行成功的样本。保留其余偏好及 cavalryVersion，不写裸字符串 locale。类型注册检查不是固定 locale 标签名单。

原生正常退出及 PreferencesWindow 析构有 savePreferencesNow 调用点，因此闭程序后单键更新 + 重启是目前成本最低的首个小样，不应先要求注入才能试它。运行中外部改文件可能被内存偏好在退出时覆盖；需要 App 内改值时再用命令/回调/保存路径。原生保存没有状态返回不阻碍方案：以文件读回、正常退出、重启后语言保持及真实界面证明结果；具体内部调用时点在小样中验证。

内部桥接也不以“必须有全局 getApi 导出”为前提：沿厂商已有启动函数的真实调用边界接收 Api* 是保留的对象来源候选，需证明接缝、启动次序、线程和生命周期，而不是猜对象偏移或增加轮询。具体候选见 3.2，不能只在核心 reload 前改值而遗漏更早的加载。

静态路径进一步确认：loader 原样拼接 locale，未见固定语言名单或大小写规范化；因此 zh-Hans/zh-Hant 对应文件名在这一层可达。appStrings 校验没有完整覆盖键/格式，缺失或非字符串 UI-text 会跳过；我们自己的生成/构建校验须补齐，不能把英文 fallback 当成翻译完成。

### 3.1 语言状态的所有权

**2026-10-05厂商默认规则复核：**锁定2.8.0 `libApi` arm64的`activeLocale`查询`Preferences::findValue(locale, kSourceLocale)`，缺键分支使用已核对数据重定位/字符串字节的`en-GB`，不依赖系统语言。`libCore::defaultPreferences`不注册`locale`；新配置没有该显式键是正常默认状态，不是损坏。当前Status仅将已解析JSON中的确实缺键投影为`currentLang=en`、`nativeLocaleState=unset`，四语徽章标明默认；显式受支持值为`explicit`，畸形/不受支持值、读错与观测不足仍`unknown/unrecognized`。只读观察不写偏好或receipt、不改变owned English Restore门。原厂`PreferencesWindow::setupGeneralPreferences`与通用`addPreference`完整静态构建中未注册语言控件，后台精确PID的初始/放大窗口观察也未见该项；此处不声称穷尽全应用入口或已完成列表全底CUA。

原生 locale 来自用户 Preferences；路径构造不含安装目录或版本。安装包中的 catalog 和现行 Switcher marker 则属于选定安装。两者不能混为一种真相。

路径构造支持用户级作用域的判断，但两个实际副本是否解析到同一文件、同时运行如何保存，仍以实际路径和双副本测试为准，不从静态代码直接宣称跨副本实测通过。

- 若采用原生共享偏好：Switcher 要区分“有效 locale”和“选定安装有哪些已部署资源”，不能仅看旧 marker 显示成功。
- 若需要安装级独立语言：先证明启动前、插件/指南后续加载、偏好保存过程中能维持独立 locale；无法证明时不得用私有调用假装隔离。
- 官方恢复需分别处理 bundle 文件和共享 locale，不能恢复某个安装时静默覆盖用户后来修改的其他偏好。
- 如由 Switcher 管理该偏好，只保存 locale 原先有/无和值；恢复“无键”仍为无键，不覆盖整份 Preferences 或无关用户设置。共享键发生后续变化时不得盲目回写旧值。
- Switcher 未改过偏好时，恢复不得擅自改它；确实改过时，只有当前值仍为我们写入值才恢复先前状态，保留用户后来调整的语言。
- 四份脚本 MetaData 暂无 locale 文件分区消费证明。若仍使用单语 overlay，不能承诺外部改 locale 后所有帮助也即时跟随。

### 3.2 启动顺序与最小 bridge 接缝

已按 macOS arm64 重新提取的顺序：QApplication 构造 → DesktopApp 初始化偏好 → Gui/Playback 构造 → loadPlugins(Api*) → registerAppComponents → registerNodesSetup(Api*) → 用户 strings.json → Guides 加载 → reloadCoreStrings → newScene/setupStyle/Gui::setupGui → start/显式 processEvents/exec。

只在首次 reloadCoreStrings 前改 locale，已经晚于用户词库和指南加载，不能据此保证一致。main → Framework 的 loadPlugins(Api*)、Framework → ExtensionLayer 的 registerAppComponents(Api*) 是已见的跨映像 symbol-stub 接缝，可接收真实 Api*，在原厂 loader 取 locale 前设置再 call-through。registerNodesSetup 的 ExtensionLayer 内 caller 则为 direct BL，不能假定普通符号 interpose 能拦到。

仍需验证具体 interpose 可达性；同映像 direct BL 与跨映像 symbol stub 不同，找到函数地址不等于已有 hook。调用顺序先于 setupGui/主循环也不等于已经证明所有首绘时序。进程内设置仍可能被原生退出保存写回共享偏好，不将它伪称安装级隔离。

### 3.3 用户语言包路线：不能被“后写覆盖”误判

用户第三方插件目录的递归扫描精确读取 strings.json，交给原生 TextLoader；type:strings 的 value 可向同一 registry 写全局显示键。每条 record 的可选 language 字符串会临时设置 registry locale，处理该条后还原；作用域先于 strings/nodeStrings/layerStrings 分发，因此可试一个文件装多语记录，不必只依赖加载时的当前语言。它与包内 Definitions/Translation 的 target sidecar 是两个真实入口，后者不是任意外置用户路径。

~~~json
[
  { "type": "strings", "language": "zh-Hans", "value": { "about.byline": { "UI-text": "简体接线探针" } } },
  { "type": "strings", "language": "zh-Hant", "value": { "about.byline": { "UI-text": "繁體接線探針" } } },
  { "type": "strings", "language": "ja", "value": { "about.byline": { "UI-text": "日本語の接続テスト" } } }
]
~~~

以上是研究小样 schema，不是批准的产品译文。strings 分支不要求 layer author；layerStrings 应保持真实命名空间/结构与 author，不能扩大成批量写模型身份。nodeStrings 的同 nodeType 多语言、guide 键及 layerStrings 各加少量独立观测，再扩全量。

关键反例已静态复核：插件先注册 zh-Hans 的 app 键；不放 appStrings_zh-Hans/nodeStrings_zh-Hans target 文件；后续核心 reload 不清 registry，只把源文本加载到独立 en-GB 分区。因此英文源不会覆盖先前中文键，查找仍先中文、缺键才英文。若同 locale target sidecar 存在，后加载的同键会覆盖，二者不能无规则混装。

所以“用户目录语言包 + 原生 locale + 重启，不改 bundle”应作为早期小样候选，与包内 catalog 路线并行比较。它可能减少重签/注入成本，但实际 GUI 消费、节点/指南/插件键、独立脚本帮助和用户级作用域仍分项验证，不提前宣称全覆盖。

日语另有碰撞：原厂 ja-JP 核心 target 文件虽为英文，却真实存在，会覆盖先加载的同语言用户值。保留独立有效日语 tag（如待验证的 ja）、更晚原生加载接线或包内 ja-JP 增强三种处理；复用原厂译文不要求部署标签也完全相同。Switcher 的 ja_JP、厂商 ja-JP 与用户语言包试验 tag 分层映射，最终方案确定后固定一种。

### 3.4 用户语言包的最小所有权与恢复契约

现有 AppliedPatchReceipt、English snapshot 和 macOS bundle journal 都绑定选定安装；不能把用户偏好/插件目录塞进 bundle 相对路径，也不能声称现有 English baseline 已备份它们。

- 用独立用户 scope 回执记录实际解析的 Preferences/插件路径；locale 保存原 key 的存在性、完整 typed JSON 值及本次写入值，语言文件记录确切路径、原先 absent 或 preimage、写入 postimage。可复用现有状态耐久提交能力，不重造任意文件事务框架。
- 只写 Switcher 专属目录/strings.json；不覆盖其他插件，不备份整个 Plugins 或整份 Preferences。重应用保留最初恢复前像，不把当前译文当原厂状态。
- 用户后来改过 locale 或语言文件时保留其修改并报告，不强行恢复。只有当前仍匹配我们的 postimage 才还原旧值/删自有文件；只在目录已经为空时移除自建目录，不递归删除用户内容。
- 写共享 profile 前需其使用者退出；初版可以明确要求当前用户所有 Cavalry 实例关闭，不以“选定副本已退出”代替证明，也不自动强杀无关副本。小样只操作已隔离 profile，不要求先实现生产进程管理。
- 顺序是记录前像 → 发布资源 → 最后写 typed locale 启用 → 重启读回；中断恢复按实际 postimage 处理。状态分列“安装资源已部署”与“用户有效语言/用户包”，不能只看旧 marker/current_lang。

共享用户包可能被不同版本/副本读取，双副本与 2.7.2 共存回归属于集成门。English 的恢复范围和卸载是否保留翻译须沿既有用户语义明确，不让恢复一个安装时无声改变其他副本。

失败回滚/撤销实验与用户明确的 **Restore English** 不是同一动作：前者恢复原 typed locale（包括原先无键）；后者应按固定产品契约激活英文并清理自有语言资源。若提供“恢复此前语言”，应另用准确文案。两者都只处理本次拥有的键/文件，保护后续用户改动，不把本轮实验回退误称为产品 English 恢复验收。

本轮最小文件事务已完成隔离合同：原像/pending/原先缺失目录意图在首份耐久回执合并发布，资源先于locale；typed locale/动作关系损坏、IO非文件拒绝、首层mkdir/资源/locale中断、重应用首次前像、absent/file恢复、固定en-GB、无关偏好更新、symlink和暂存后drift均有fixture验证。恢复warning/残留pending不能冒作NothingToRestore，也不堆新事务。apply/restore共享限域恢复守卫，owner与paths/receipt/storage各自不超过800行，未增加通用事务框架。

用户locale纯投影与文件事务现已进入显式macOS开发预览facade，纯JSON rollback/手动recovery seam仍仅 `cfg(test)`；默认2.7发布路径未切换。成功矩阵当前仅macOS/Unix的fixture；Windows目录耐久未知即fail closed，有独立条件测试但本机未运行，交叉编译环境缺MinGW，不作Windows编译/耐久证明。预发布完整文件比较仍有read→rename的TOCTOU，依赖闭writer且期间无外部FS改写；目录意图不提供任意并发目录创建的所有权证明。预览已绑定OS home/fixed路径、资源/宿主身份与all-Cavalry快照并接apply/status/bridge；真实normal-profile/Qt TestMode路径、共享版本共存、真实失败恢复/English/卸载及Windows耐久仍是集成门，不能以fixture代验。

### 3.5 原生键族和真实消费者

第三方 definitions 与 strings.json 是独立递归扫描；后者没有“节点定义注册成功”前置条件。2.8 `strings` 分支直接注册全局键、不要求 author；第三方模式的 `nodeStrings` validator 仍要求 author，`layerStrings` 也有 author/type 校验。安装版探针已记录缺 author 的 nodeStrings 被拒绝，不能把核心 catalog wrapper 原样复制到用户目录。2.7.2 的第三方 strings 分支仍要求 author 并添加 author:: 前缀，不能把新合同回套到旧版。共享目录的旧加载/报错边界仍须共存 fixture 验证。

| 原生数据 | registry 键族 | 已见静态 UI 消费者 |
|---|---|---|
| strings | 原全局 key | app 控件、OnboardingManager.resolveText |
| nodeStrings info | nodeName:类型 / nodeInfo:类型 | Create 菜单、Fast/Classic Quick Add、节点行说明 |
| nodeStrings attributes | nodeAttr:类型.属性 / attrInfo:类型.属性 | AttrControlRow.bindAttr |
| nodeStrings enums | nodeAttrEnum:类型.属性.枚举短键 | acEnum.onBind |
| layerStrings | 以 author::layerType 作为类型，复用上述键族 | 相同节点/属性/枚举消费链 |
| tabs / presets | 共用 nodeTab:类型.ID，不另造 preset 前缀 | AttributeTabWidget / NodeRowWidget 上下文 QAction |
| curvesFilter 直文本枚举 | nodeAttrEnum:curvesFilter.属性.0；厂商内部非数字键经 strtol 落在 index 0 | enumName / acEnum.onBind 静态消费 |
| notifications | 类型.十进制index，无前缀 | 已证明 loader/store；具体 UI 消费待追验 |

以上新增键追踪绑定官方 libCore SHA-256 `8df2a434b5a6b73da691f7c8d0bba6fbb4c244dc0b388ea466ba8220c5ebeafb`。`setTabName` 与 `setPresetName` 共用 keyForTab，重复 owner/ID 会真碰撞；直文本 enum 与数值 0 也可能碰撞，因此生成器统一检测全局键冲突，不靠族名制造命名空间。当前官方 439 个 node owner 都是裸 nodeType，没有 author；Spherise 采用 layer 的真实 compound owner。这些是静态投影证明，不是新增族 live PASS。

Getter 还会沿 NodeDefinition 的父定义回退。加载器和消费者已存在，仍不把每个 source 叶算作已验证的可见点；只向真实显示 registry 投影，不写回模型定义或用户值。

用户包首选把上述确定的 registry 键投影到 `type=strings` 的全局 value map，保留 `{ "UI-text": "译文" }` 值，而不是伪造插件 author 或绕过 validator。`nodeName:group`、`nodeInfo:group`、`nodeAttr:group.groupMode`、`nodeAttrEnum:group.groupMode.1` 已由真实安装版消费者显示；尚未逐族/逐 owner 覆盖的键仍进验证清单。

### 3.6 已完成的第一条原生实机链

macOS arm64、原厂 2.8 的临时副本，未安装 injector、未更改/重签 bundle：在专属用户目录放无 definitions 的 strings.json，以 typed locale=zh-Hans 启用，实际 About 显示“关于 Cavalry〔原生探针〕”，File/New Scene 显示“新建场景〔原生探针〕”。正常 Cmd-Q 后原生保存的 locale 仍为 typed zh-Hans；同一 profile 独立重启，File 菜单中文仍存在，再正常退出读回一致。

这是两条全局键的 scoped live 结果，不是全三语/节点/插件/指南/热刷新/性能或生产事务 PASS。界面由 CUA 截图/AX 观察，归档为观察记录，不冒充像素摘要与自动化 full UI gate。临时 profile 的路径和用户写入隔离已观测；测试限制了网络及真实用户树写入，但启动仍报告 offline grace，因此 **账号/Keychain 的完整隔离未获证明**，不能借此宣布登录通过。不会将临时账号/缓存文件归档为证据。

### 3.7 安装版、实际用户目录的续验

用户授权后直接运行 `/Applications/Cavalry.app` 2.8，未改 bundle、未重签、未装 injector。闭程序时仅增加 Switcher 专属语言文件和 locale；观察到：

- zh-Hans：File 菜单、Fast 的 Group 名称/说明，以及创建 Group 后的 groupMode 属性标签与已选枚举均显示探针译文。
- 正常退出后 zh-Hans typed 值保留；闭程序改为独立 `ja` 标签并重启，File 菜单显示日语，Getting Started 选择页的标题、一个条目和 Done 按钮显示日语，其余未提供键仍为英文。
- 所有 Cavalry writer 退出后按本次 postimage 恢复：原 locale 本来无键，恢复为无键；删除确切自有 strings.json 和空自有目录，保留退出后其余偏好。主程序、Api/Core/ExtensionLayer 和 Info.plist 前后摘要一致。

这使独立 ja 标签成为已验证的接线候选，但不是原厂 390 条日语及全部 plugin 已迁移成功。第一轮安装路径控制工具误启普通 profile 实例，英文观察排除；隔离 nodeStrings 的 author 拒绝日志保留。退出后读取已退出 App 的 AX 会由工具再次启动 App，因此退出验收使用 exact PID/文件读回，不把观察工具再启动归为产品 bug。以上是限域 CUA 观察，不是 PNG/full UI gate、性能或正式 Switcher 事务证明。

### 3.8 当前已审资源的安装版 CUA 续验

本轮仅采集 CUA AX/截图，不使用 Cava CLI。先以正常保存保留原未命名场景，再闭程序发布 Switcher 专属 `strings.json`、最后更新 typed locale；资源源自当前已审 919 键、原生 dontTranslate 和厂商实译日语，未部署尚在审稿的译文。

- 简体菜单栏/File 菜单实际中文；Create/文字创建后，Text Shape 名称、页签、排版与路径属性出现已审中文。字体 Lato/Regular 与文本值 Cavalry 保持原值。
- 实点三种组合确认：宽/高均 Auto 时孤词和缩小适配都禁用；关 Auto Width、保留 Auto Height 时孤词启用且缩小适配禁用；反过来时孤词禁用、缩小适配启用。这是当前 `avoidOrphans` 条件的实机证据，不只是静态定义推断。
- 正常退出读回 zh-Hans、独立重启菜单中文仍在；繁体启动/File 菜单和退出读回 zh-Hant；日语正常退出/独立重启后菜单日语，Getting Started 选择页显示厂商原文「さらにチェック」「完了」等。包生成时 390 个厂商实译叶逐字比较通过；该指南页不代验全部 390 个控件。
- CUA 实见 English 残留：Shape 的 Reverse Contours/Set First Point、Zoom 及百分比菜单、21 个 Tool 命令、视口抗锯齿三选项、字体辅助按钮/连接占位提示/Opacity。它们现已对齐 42 app 原生键加 `nodeAttr:drawable.opacity`；Zoom 的 8 个数值与 OpenType 共 9 个 DNT 应保留，英文 Zoom 前缀由现成标题键补齐，不能盲翻百分比。不是无 native 接口，也不是故意保留所有这些英文。
- Scene Tree 的中文新节点名正常，但 Time Editor 和画布操纵器的名字有 CJK 方框，显示字体缺口仍开放。装饰线弹窗、完整 tooltip/布局、搜索语义、性能和生产 apply/status 仍待验。CUA 一度只露出应用菜单，后续 fresh AX 与独立重启均露出全部日语菜单；不据此估计启动延迟。
- 所有 writer 正常退出后，先核对本次 locale/自有文件 postimage，再恢复原 locale absent、删除确切自有文件和空目录；兄弟插件列表、主程序/Api/Core/ExtensionLayer/Info.plist 摘要不变，保留退出后其余最新偏好。随后正常打开回到原英文状态。这是实验回退，不是产品 Restore English/事务容灾通过。

观察及回执为会话级过程证据，不是自动化 PNG/full-UI gate 或账号/Keychain 隔离证明；过程曾出现未请求的 MCP 脚本授权弹窗，已通过 CUA 拒绝，没有借验证扩大访问权限。

## 4. 翻译资源迁移

### 4.1 原生 catalog：10,473 个显示叶，非完整 UI 分母

- app：3,362；node：6,715；guide：98；plugin：298。
- 生成器读取官方 17 对 source/JA 目录的 smoke：10,473 mapped、0 unmapped、0 全局键碰撞；从初始未映射 166 叶追完 tabs/presets/直文本枚举/通知的规则。390 厂商日语均可选择，214 source dontTranslate 原文保留。未提供旧审定输入时的 missing 数不是新增补译工作量，更不是完整屏幕分母。
- 这是路径叶数量，不是唯一句子数量，也不是“所有英文都必须改”的任务数。
- 候选索引优先使用 catalog 家族 + 所属 owner + 显示键/角色 + 英语源；源 notes 作审校上下文，不写入身份数据。
- ja_JP 是现行项目约定，厂商来源使用 ja-JP；资源来源与最终有效 locale 分别建立明确映射，不把下划线代码直接当原生文件名，也不把用户语言包试验 ja 标签混为厂商资源标签。
- 中文原生文件名暂用待验证的 zh-Hans / zh-Hant，不能先假定 loader 会规范化其他标签或区域回退。
- 原生有 ICU 复数规则：app 源含 72 个 plural 文案，十种目标资源中的对应值目前都仍是英文；node 源未检出该模式。校验必须覆盖参数编号、=n 分支、other 分支、嵌套花括号及 #，不能只复用旧 {0}/%s 正则。至少验 0/1/2/较大值；有小数语义的表面另验小数。

### 4.2 复用不是整份旧文件复制

第一轮按英语源索引得到简体 7,874、繁体 7,813、日语 7,855 个精确唯一候选，**均未批准部署**。同一句英文的 owner、词性、动作/名词和上下文可能不同。

第一轮为了保护身份排除了 name/niceName；第二轮从明确旧显示角色补回各语言 35 个叶候选，给各语言另 9 个原先无候选的 native 叶提供参考。初始“无候选”计数不是最终待翻清单，不能机械据此安排工作量。

- 旧 nodeDefinitions 三语各有 47 个字符串差异：25 个显示候选，18 个 travel 身份/引用，1 个枚举数据、3 个默认 Blue。
- 只把真实显示文案转入新 UI-text 候选；禁止把旧 definitions 数组或身份引用整体覆盖新版。
- systemPresets 从 10 条 name 改为 29 条 nameId；10 个旧名和 19 个 curves preset 显示名应落在新 catalog，保留新版 ID/结构。
- 数据引用已核对：29 个 preset nameId、10 个按钮 ID、9 个 placeholderId 引用（6 个唯一键）都能找到 app catalog 对应键；436 个 node catalog 类型与 definitions 对上，54 个 definition-only 与 3 个 catalog-only 类型留可见性分类，不自动算漏译。
- niceName/UI-text 可翻显示；模型 type/id、引用和实际用户输入必须保留。以消费者职责定边界，不以字段名一刀切。
- 未变化的结构文件不做无意义写入；新 Ripple/Twist 的结构 definitions 也不因有英文 type 就需要翻译。

### 4.2.1 全量复用与补译队列（不是九条样例范围）

最新纯索引直接读取正式 `languages/{en,zh-Hans,zh-Hant,ja_JP}` 各 38 份 JSON、显示词库和三份 TS（11,528 条）；不用 `output/json-surfaces/draft` 派生草稿作为真相。下面是全量候选归类，**尚未扣除已审输入，不是剩余待翻数或通过率**。剔除 214 个 dontTranslate、日语再剔除 390 个厂商实译后：

| 语言 | 显示路径 | 精确单一旧候选 | 精确歧义 | 无精确候选 |
|---|---:|---:|---:|---:|
| zh-Hans | 10,259 | 7,740 | 70 | 2,449 |
| zh-Hant | 10,259 | 7,680 | 130 | 2,449 |
| ja_JP（不含原厂390） | 9,869 | 7,419 | 88 | 2,362 |

候选不等于批准。没有精确候选的组包括仅有规范化近似的资源，需要人工语境审校或 AGY 补译，不能模糊匹配后自动写入。此前调查脚本按英语源得出的数字仅保留为历史参考；曾用 output/draft 的 smoke 计数作废，当前由正式源与相同纯函数重算。

这些是 key 路径，不是唯一句子；全目录 10,473 路径为 6,659 个唯一英语文本，但不能因此合并不同 owner 的显示键。新索引按源角色/实体配对保留出处，机器/字体/用户值不作为候选。每条最后都有复用、补译、厂商采用或合理原文保留的明确归属。

执行顺序是整组语义域，而非零星例子：AI Studio 138 叶（112 无旧候选，首批9+后续103；其余26旧译审校）及 AI Credits 19 → Canva Preflight/Upload 与相关资产流程 → 主菜单/工具/属性/偏好/Graph/Playback/Viewport/Scene Tree/Time Editor/项目资产 → 按 nodeType 完整节点组 → Guides/14插件中文。实际原生域全部在范围内；已有旧候选优先审校复用，不无谓重译。

独立队列维护 MetaData 的 512 个 description（旧译复用决策含 477 个同键同源叶和 1 个 replaceAsset 跨文件迁移，另有 34 个新说明经 AGY/宝玉 Skill、Grok 与主代理审定）；这不等于 native UI-text 包含帮助。四文件×三语的 12 个完整 stage 投影已核对为仅改 description、其余机器字段不变；消费者已定位补全缓存→hover→popup静态链，尚无用户级帮助读取路径或live验收。ICU 72、HTML/entities 181、常规参数/实际换行专项与各批次同时校验，不以排除格式复杂条目缩小交付。

### 4.2.2 当前审定进度不是翻译上限

目前 **2,204个正式审定UI键**（2,169 translate、35 registry preserve），包含app622、node1,582：AI工作室138、用量19、Canva/素材71、menu.*源键352，另42个现场观察后对齐的app键；节点完整域1,581叶覆盖49个owner，另drawable不透明度1叶。此前十owner201键、六owner200键保留，新增mesh-family六完整owner/152键分别装配，当前显式UI模块为44，不将模块数误作审稿轮次。菜单四批无重叠、现场遗漏按catalog身份另补，不代表全菜单/全界面完成；独立脚本帮助512条不计入UI registry，也尚未部署其消费接缝。

全部17对官方catalog只读重算为10,473个原生键、0未映射、审定输入0重复。中文各有2,169审定译值、236最终保留值，missing各8,068；日语有2,169审定译值、236最终保留值与390厂商原值，missing7,678。236=214官方dontTranslate+35 registry preserve−13重合，不能直接相加。missing是缺语境审定输入而非都需从零补译；旧候选与英文fallback不作已翻。manifest仍complete:false，不能完整发行；编译/自绘、动态消息、输入/字体、部署/布局/性能各自验收。

Array Distribution完整4叶已入库 `nodes_array_distribution.js`。AGY按完整项目Skill出12值草稿，Grok实际end_turn审查全部4键/12值，Luna独立核对后由主代理明确手动坐标列表说明并修正日语点配置语法；完整owner/source/notes/身份、格式/投影与12个真实译值反向变异合同先RED后GREEN。只翻显示值，列表长度决定副本数，index保持序列含义、Array保持数据列表而非网格；不增加文档中单独描述的Add按钮，不修改模型身份。该批曾推进到1,551键离线派生资源及debug包，详见§10历史记录；仍不构成Cavalry live验收。

第23批201键由HSV Material Behaviour5、Apply Distribution16、Count Sub Meshes10、Apply Layout9、Chop Path16、Sub Mesh68、Bevel15、Boolean3、Color Material5、Stroke Material54组成。Grok实际额度中止后，按维护者授权由Luna Max修订、两份独立全域审校及主代理核验审定，不伪造Grok终态或AGY追加审稿通过。完整source/notes/roles、603三语决策与Alpha技术保留绑定审批；Stagger引用复用Auto Animate当前词，通用宽度渐变与双端渐细分开，Travel为空间移动，Replace Missing仅限未设置对应填充/描边。正式合同首先9项缺模块RED，入库后9 GREEN；全201正向基线后拒绝30摘要变异、58有限反例及39真实旧译回退。独审曾证明宽松词同现/否定词表会接受反向文案，现以source-notes绑定已审短caption，不构造通用自然语言解析器；其他有效改译仍须重新审定。注册与离线投影不等于真实部署或现场显示。

第24批200键由Apply Character Spacing8、Falloff45、Path Split47、4-Point Warp43、Bar Chart13、Dithering44六个完整owner组成。AGY完整V3经Grok全域83项建议、Luna独立600值审校及主代理全源/notes/600值/83裁决核验后审定；80采纳、2统计Nominal建议驳回、1中文相机HTML句式部分修订，不机械接受provider等级。定类/類別按官方categorical语境与直接教学词表保留，引文范围经主代理收窄，不借其他资料为同义词背书。Bayer为官方DNT，2.5D为非DNT技术保留。六正式合同先6缺模块RED/0skip后6GREEN/0skip，36源/notes/角色/译值摘要破坏与63有限单槽反例都先过完整baseline再拒绝；默认不保留stage/env/skip旁路，沿当前Kerning/Character Spacing/Camera和本域caption引用，不新增runtime抽象或通用NLP。注册只改变构建显示输入，不改模型/算法，不代表真实部署或live。

新增mesh-family六完整owner为meshDistribution26、meshShape26、pathField22、randomDistribution26、skslFilter26、thirdPartyFilter26。152源身份与456三语槽经两份独立全域审校、主代理裁定18槽修订及独立差分复核后审批；Catmull-Rom按官方DNT保留，Mitchell按算法专名保留，不伪造官方DNT。正式默认合同先真实缺六模块RED，再显式登记后53/53 GREEN、0 skip；有限语义门先接受完整已审基线，再拒绝15旧译回退和21单槽反例，并核对54枚举配对。合同绑定源/notes/显示角色及本域caption，不引入通用NLP或运行时判断，不依赖临时stage、provider或私库。

### 4.2.3 节点全量队列：按完整 owner 处理，不只补名称

当前官方 node source 的 6,715 个叶对应 439 个稳定 nodeType owner；节点队列包含属性标签 2,576、枚举 2,204、属性说明 971、节点说明 379、节点名称 431、页签 86、预设 52 和通知 16。名称缺席的 owner 不因此删掉属性域，通知目前有 loader/store 静态证据，真实显示仍须验收。

队列分成 67 个完整 owner 批次：64 批不超过 100 个键；applyOpenType 161、autoAnimate 128、textShape 103 三个较大 owner 保持完整。优先 Group/Transform/Null 58 → Shape 100 → Text Shape 103 → 基础形状与线条 78，随后遍历其余 owner。批次大小用于语境一致性和审校，不是可翻译范围上限，也不要求大 owner 的最终代码文件超过 800 行。

先扣除 55 个 dontTranslate（此 node catalog 没有厂商实译日语）后，旧译候选分类为：

| 语言 | 单一精确候选 | 歧义候选 | 无精确候选 |
|---|---:|---:|---:|
| zh-Hans | 5,599 | 55 | 1,006 |
| zh-Hant | 5,570 | 84 | 1,006 |
| ja_JP | 5,602 | 75 | 983 |

三语均无精确候选的 983 个键只是旧资源索引缺口，**不是已证明的 2.8 新增条目数、从零翻译数或已审补译数**。候选保留原角色、TS context、显示专用来源和歧义；旧模型值只作显示审校参考，禁止反写 definitions。

主代理已核对 67 批的每个 key/source/notes/owner/fieldPath、文件摘要及 owner 不跨批，合计 6,715 键、439 owner、0 重复/未映射。node 源 SHA-256 为 `d5c9d9e133d9e2fe7574c453aaa4f56803e7988f4314d2158562cb35c67cbec0`，node 源/日语原始文件对摘要为 `20286fd8e7921c7ae7fe99d9029c7368324511f19dc78da8cb85c8889489c294`。这份队列是会话级调查输入，不是已审译文或构建依赖；正式审定后才进入 `languages/native`，再跑离线生成/格式合同和真实源对照。

其中 Group/Transform/Null 的完整 58 键已通过 AGY 3.8 Flash 执行模式初稿、Grok/Luna 独立审稿及主代理修订，入库 `nodes_group_transform_null.js`。先写三个合同并确认缺数据的 RED，后验证全部 owner/路径身份、三语格式、tooltip 与属性/枚举标签一致、2.5D 明确保留和全部 638 UI 键的混合 catalog round-trip 后 GREEN。候选中的繁中「限製」已被 AGY 正确改成「限制」，Transform 日语按当前几何角色取「トランスフォーム」而非跨角色旧候选「変形」；主代理另纠正共用变换、Custom Color 地区术语及 JA 限制开关语义。只是这一完整节点组的入库证明，不是其余 436 owner 或实机完成。

后续 Shape / Text Shape / 基础形状三个完整域共 281 键已进入 `nodes_shape.js`、`nodes_text_shape.js`、`nodes_basic_primitives.js`。先新增六个合同确认缺数据的 RED，再入库并验证完整 owner/源/notes/路径、格式与代码保留、标签引用及全部 919 键混合投影后 GREEN。AGY 使用项目完整宝玉 Skill 出三语初稿，Grok 读取实际草稿核对全部键，Luna 做源语境审查，主代理修订并逐项裁定，不把 CLI exit/SUCCESS 当回执。Shape 的 Luna 协审收到部分主代理语境说明，不宣称全盲；Text/基础形状初稿的独立审查与最终知晓裁定后的协审分开记录。该批结束时节点覆盖15/439 owner；当前总进度以前面的汇总为准。

Accumulator/Render Queue Item 的完整 100 键新增四个合同先 RED 后通过，入库 `nodes_accumulator_renderqueue.js`；AGY/宝玉 Skill 实际初稿、Grok 正常模式 24-turn end_turn、Luna 语境协审、主代理逐项修订，52 个三语目标值改变。区分累加间隔与帧号补零位数、Solo 不译成独奏、every Nth frame 不误成空隔 N 帧、帧率标签保留 FPS、保持路径/时间码/HTML 标签互指；CPU/GPU/JSON/Canva 明确 preserve。该批结束时节点正式累计439叶、17 owner，整体UI 1,019 = 1,007 translate + 12显式preserve。该历史停点的17 catalog只读重算为中文1,231 已决策 / 9,242 missing，日语 1,621 已决策 / 8,852 missing；新增两条 DNT 已在原 214 内，未双计。这个 missing 是尚未审定的原生源键，不是必须从零翻译数；前面 5,243 复用池余量为 339 节点时的历史快照，新增组后需重新排除重合。

OpenType完整161键现已入库 `nodes_apply_opentype.js`：AGY初稿、Grok两份实际end_turn、Luna Max独立源语境审查和主代理语义修订闭环。先RED锁定aalt“访问替代字形”而非全选、基字相对位置及两字母，不把Indic、petite/small caps、数学上下标、Add/Overlay混为一谈；繁体Vattu再以回归守住“變體”。它只翻显示特性名，不改字体/feature tag/预设身份。

Auto-Animate完整128键现已入库 `nodes_auto_animate.js`：重新取得有效AGY128行三语稿，Grok实审128键/384译值后由主代理修订。相机Zoom与几何Scale在中文区分为变焦/缩放；Slide From不限定入场，进度0→100和100→0的方向保留；六条单项说明和总进度说明引用当前控制模式译名。日语统一プログレス且Precise保留精密，不把入口/出口误成时间线In/Out Point，不添加源未声明的角度/循环次数或Bend百分比。

现场遗漏43键现已入库 `runtime_observed_supplement.js`：42个app键加drawable不透明度，实际Grok正常审稿和主代理修订通过；Auto保留Recommended限定词，Set First Point是设定操作，Tracking是运动跟踪，九个DNT不翻。先前缺key的AGY稿只做暂存机械格式修复，不增加生产容错parser。

三域48项离线合同已通过并纳入默认 `test:contracts`/`check:app`；新增332个正式审定键使总数从1,019推进到1,351，不把草稿/CLI状态码/审稿当实机验收。节点当前完整覆盖19/439 owner，drawable仅限1叶，不冒称该owner整域已翻。

原厂源错误采用有出处的 **target-only** 纠正：`arcShape.radius` 标签/notes 是 Outer Radius，英语 tooltip 却写 inner radius；按当前定义和 [Arc 官方文档](https://cavalry.studio/docs/nodes/shapes/basic-shape/arc/) 将三语说明改为外半径。`textShape.lineStyle` 源/notes 错写背景形状重叠，但当前 `fontStyle` 控件及 [Text Shape 官方文档](https://cavalry.studio/docs/nodes/shapes/text-shape/) 指向下划线/删除线跨词间空格的 Through/Gaps。后续无预算/轮次上限的正常 Grok 复核又发现 `avoidOrphans` 源把 Text Box Size 截断并只写含混的 Auto；主代理核对当前 `dimming: autoWidth == true`，目标说明明确指向“自动宽度”而非自动高度。三处保留原英语 source、稳定键/notes/摘要，在 `provenance.sourceCorrections` 记录理由/出处并由测试锁定，不借纠错修改模型身份。

同次正常 Grok 复核还辨明 Text Shape 的 Resize 字符串操作不等于几何缩放：当前 `resizeString` 继承 `stringOperator`、参数控制字符串长度，三语说明改为字符串缩短。语义合同先 RED 再修订通过；先前协审“未发现阻塞”不能覆盖后续新证据。段落空行/单换行、Background 输出对象及 app 对齐按钮消费者的源/文档差异留待实机，不凭猜测扩写译文或宣布覆盖。

该批还明确 Typeface 不等于 Glyph、Track Matte 不等于 Mask；混合模式 Plus Lighter/Darker 保留颜色相加语义，星形 Sides 是尖角数，Path Push 是路径法线偏移。两种中文和日语沿项目术语修订，Alpha / 2.5D 为新增两个显式保留值。Grok 的取消/空响应或错误键数不计作完整审稿；后续正常复核只交代审查方法和证据，不设置轮次、预算或问题数量上限。

后续复用专项重新以现有 collector 展开全部 17 对 catalog 和 node 的 4 个 `values` 组，主代理只读重算确认：同 owner、同语义显示角色/字段、英语精确相等且旧三语唯一的节点候选为 5,557；其中 3,798 同路径，1,759 经旧 scalar/tuple/name/info 的纯 schema 适配恢复。格式检查 0 失败，但这只是候选、不是批准。排除该池内 53 个 dontTranslate 及与已审 339 节点叶重合的 261 个键后，仍有 5,243 条待逐项审定；其余源变化、身份歧义或缺旧路径走单独补译/审查。

复用审计按原始路径闭合：5,557 候选 + 174 同身份源已变 + 973 无旧同身份路径 + 11 个歧义原始叶 = 6,715。其中四组 `*Help` / typed tooltip 同 owner 的语义归一化会折叠不同原始键，全部排除；故语义身份数为 6,711，不可反过来删掉 registry 的四个叶。候选中 424 行三语全等英文也不能自动视为合理原文保留。早期脚本漏读 `values` 得到的 810 / 1,047 / 902 数全部作废；节点候选池不能冒充全域复用或完成数。

### 4.2.4 Sound 新版整域与 legacy 范围分离

新版 `sound` 完整65键经AGY按项目宝玉Skill出稿、Grok真实end_turn全195译值审查、Luna Max语义核对及主代理修订后进入 `nodes_sound.js`，首轮显式审批17批累计1,416 UI键。Grok的16项意见逐项裁决：素材窗口/素材术语对齐，文件时长与byte长度消歧，最低值归零不混时间起点，分析阈值不混播放削波；归一化明确输出0-1，不宣称改播放波形。Mel/Bark/RMS每语3项明确preserve，不把英文同值伪计作翻译。8项默认离线合同保护源/notes/65键身份、11枚举索引、三语数值关系、8个真实反向变异、当前标签引用和显示投影模型身份。当前数据审批与debug资源生成不是Sound音频或Cavalry live验收。

官方 `soundLegacy` 的完整48键现经AGY/宝玉Skill、Grok实际end_turn全144译值审查、Luna Max核对及主代理审定进入独立模块，显式审批18批累计1,464 UI键。六项结构化审查意见已裁决；摘要误写七条不制造第七项。46 translate + 2 preserve（Mel/Bark）每语保持明确归属，最大dB只指连接素材中观察到的最大值，旧场景分析修正前限定保留；不套新版独有控制或宣称运行行为相同。7项默认合同锁定身份/引用、三语21个关系与7个真实反向变异；相同源/notes的新版Sound也先RED后将频段单独选择与中文音量阈值消歧（5个显示值），不把编辑选择译成物理拆频。该阶段停在18批/1,464；后续RGB Split审批如下，不把历史进度改写为当前总数。[Sound 官方说明](https://cavalry.studio/docs/nodes/behaviours/sound/)

RGB Split完整35键现经AGY/宝玉Skill、Grok实际end_turn全105值、Luna核对及主代理修订进入第19批，累计1,499键。两条日语命名比较模式修订，加上相加与次数消歧，共改6个显示值；Plus不变成Plus Lighter/Darker。Repetition Distance的锁定notes与官方首末距离说明不同，保留中性距离译名，不添加相邻/首末算法；RGB位置偏移、半径、边界Padding与One/Two/Zero预设身份受12项合同及11个真实反向变异保护。来源/完整身份与原稿语义先RED后正式Green；仍非现场显示证明。该阶段停在19批/1,499；后续Slit Scan审批如下，不将历史计数冒称当前总数。[RGB Split 官方说明](https://cavalry.studio/docs/nodes/effects/filters/rgb-split-filter/)

Slit Scan完整48键经AGY/宝玉Skill、Grok实际end_turn全144值及Luna全域核对，由主代理审定进入第20批，累计1,547键；这是 Array Distribution 加入前的历史停点。两套Plus三语相加/加算及日语比较模式共修正10值；双selector共享17模式保留独立键，Replace仅在基础列表。Grok两项“往复扫描”建议未采纳：官方上半帧速度反向、上下趋向/远离中心不证明单一路径重复往复，保留镜像扫描标签而不添加算法；Glow Size遵锁定源大小/扩散说明，不把文档强度表述写成新控制。10项默认合同绑定完整源/notes/身份与三语显式决策，原草稿10槽差异真实RED、审定后正式Green，含8个反向译值变异及格式/决策/notes负例。随后完整 Array Distribution 4叶进入第21批，把正式UI审定总数推进到1,551、完整节点owner推进到24；其本轮状态与包证据见§4.2.2和§10。仍未部署到Cavalry现场回验，不把离线合同或打包等同live。[Slit Scan 官方说明](https://cavalry.studio/docs/nodes/effects/filters/slit-scan-filter/)

后续第22批 Align/Distortion Filter/Glow Filter 完整100键（6/47/47）已由主代理审定并加入显式 registry。内容合同保护对齐的正负方向、HSV Value/Alpha 身份、Glow 半径与强度及预览透明度边界；新增18项默认 Node 合同18/18通过、0 skip。该批之后 UI registry 为1,651键、三个完整 owner 令节点完整 owner 数达27；合同通过只证明离线源/格式/投影，不证明界面 live。



### 4.3 原厂日语

390 个实质差异叶：指南 92、插件 298；app/node 日语仍与英文相同。

其中 323 个精确单候选、4 个精确歧义、25 个规范化候选、38 个暂无旧候选。327 个精确候选叶中，101 个原厂值等于至少一个旧候选，226 个不同；**不同不自动意味着原厂错或旧译错**。

维护者最初决定390个实译叶默认以厂商为准，不按旧术语偏好润色；2026-10-04进一步允许对具体疑点一手查证，确认不对才修正。全域复审后13项确证错误已完成非作者研究复核、root批准、最终差分验回和源绑定正式应用，其余377值仍原样保留；独立有限登记和精确metadata绑定共同守门，原厂bytes/source/notes/vendorJapanese不改。31个HTML、9个通用占位符、24个含源数字的机械检查仍只是格式证据，来源选择或离线纠错都不能宣称full UI PASS。

### 4.4 独立脚本帮助：512 个递归 description 叶

官方 2.8 四份 MetaData 共含 512 个递归 `description` 叶（220/165/92/35）。它们属于脚本编辑器补全/hover 文档，不是 native UI-text registry 的一部分；当前 native `strings.json` schema 不承载 MetaData。旧 `CORE_MAP` 是安装级文件 overlay 路线，不能推导出用户级 native 资源已接入帮助。

- 旧译复用清单覆盖 477 个同键、同文件、同语义路径和同英语源叶；另有 1 个 `replaceAsset` 从 `gui` 到 `api` 的跨文件迁移，以及 34 个新说明。477 个旧投影本身不是 2.8 全量覆盖证明。
- 四份文件分别投影到 zh-Hans、zh-Hant、ja_JP 的 12 个完整 stage 结果已核验：仅 `description` 变化，移除该字段后其余机器字段与官方输入一致。这只证明离线投影的结构保真，不证明帮助已进入 UI 资源包或在补全/hover 中显示。
- `native_metadata_help.js` 按实体名称而非数组位置对齐，并保留反引号、角括号、可选字段和嵌套对象模板；模板、签名、参数名、类型、返回类型和代码都不翻译、不套 ICU。
- macOS arm64 静态链已定位为 `getDocumentation` 从 `assetsDirectory/MetaData` 读取四份表，`addCompletionsToTextEdit` 在函数静态初始化中建立 `ScriptDocumentation` 缓存，随后 `handleHoverEvent` 查表并交给 `DocumentationPopup::setContent`。popup 的固定标签本地化不能证明 description 正文也走 UI registry；现有证据未证明用户级 MetaData 搜索路径、typed locale 到 loader 的数据流或缓存重载。默认assets根已追到应用executable派生路径而非profile；未穷尽导出全局的所有写入者，不能断言全产品绝无override。
- 这是实际帮助消费链的静态证明，不是完整运行时调用图或 Cavalry live 验收。先证明真实读取路径与语言选择，再决定是否需要窄的 consumer 接入；帮助仍独立于 UI-text 包，不猜 bridge、不把 2.7 安装级 `CORE_MAP` 宣称为 2.8 用户级支持。任何文件部署都须另证 locale、所有权、恢复和写入边界。
- 旧说明关联的机器字段有 16 项参数结构变化：两条 setGradient* 为真实新参数签名，其余 14 项为 null 占位清理；说明语义可复用时，投影仍必须保留新版参数结构而不是覆盖旧文档。
- 只处理自然语言 description，不复制三份冗余译文，也不预建第二套文档引擎。
- 后续固定Node24.20.0对实际四份锁定2.8源再次作三语内存投影：各512说明/0缺口，description以外结构与source bytes不变；不写安装资源、不把投影当consumer通过。静态查得真实跨库`TextEdit::addScriptDocumentationEntry`接缝，doc复制/lifetime、唯一name+source绑定及locale来源仍待证；插件、MetaData overlay、内部窄适配均保留比较，不凭缺少公开override接口先验淘汰内部路线。

### 4.5 compiled、动态与自绘

旧提取器新增 351 个源，其中 20 个与 native 源精确重合，331 个不精确重合。**331 不是已确认漏译数。**

按真实调用点/显示位置区分：操作标签、用户错误、MessageBar、脚本提示、日志、MCP 机器协议与提取噪声。只有真实显示缺口才进入补充译文；不会修改 whitelist 来隐藏漏翻，也不翻用户脚本输出。

## 5. 实施顺序与验收条件

### 5.1 测试先行的实施约定

- 每个行为先写可观察的测试，运行失败，再做最小实现并运行通过；不以源码正则或编译通过替代行为证明。
- `tools/native_language_pack.test.js` 现有 40 个离线行为合同：strings 首轮 20 + dontTranslate 2；node/layer 新增 12 先失败再实现；随后 tabs/presets/直文本 enum/notification 与碰撞边界再先失败后通过。覆盖实体/字段稳定对齐、真实插件 owner、未知未来叶台账、厂商优先、源绑定、模型身份不改与确定性单语言包装。官方全部当前源叶可投影不等于所有消费者已 live。
- 未知未来显示族仍显式记账、不猜键。`native_translation_format.test.js` 13 个行为合同已 GREEN，使用构建期固定 FormatJS parser，保护 ICU 参数/分支/offset/逐分支 #、旧占位符和 HTML 技术属性；17 对官方源/日语全部值的机械 smoke 通过，仍不替代厂商 0/1/2/大值求值与 live。
- 全量队列编排 7 项、旧译候选 21 项、metadata help 8 项、显式复用 7 项已 GREEN。独立审查发现并按 RED→GREEN 修复：模型 definitions 的字符串数组不得误当属性标签候选；帮助对象模板不得丢 optional 或嵌套外层字段。
- `commands/user_language.rs` 的纯内存 JSON 编辑先 RED 再 GREEN，并补畸形结构/metadata 变更边界，共 10 个合同；只改 typed locale.value，保存完整前像或 absent，投影比较保护后续用户更改，普通回滚与固定 en-GB 的 Restore English 分开。原会话隔离阶段的文件事务在cfg(test)消费该纯投影，19项macOS/Unix fixture验证资源先发布/locale后提交、写盘失败与中断恢复；该阶段两模块未接生产IPC或真实profile；当前显式macOS接线见§10，不借旧bundle/QPA门阻止纯用户路径。
- 项目级翻译技能位于 `.agents/skills/baoyu-translate/`，保留固定上游与完整 references/scripts；项目偏好仍在 `.baoyu-skills/baoyu-translate/EXTEND.md`，沿四语词表及项目资源边界执行。AGY 初稿也实际使用该 skill：完整正文、refined流程、EXTEND、术语表与翻译规范已内联提供，避免无交互 CLI 的文件读取许可妨碍加载。Grok CLI 独立核对，主代理最终审定。按维护者反馈，后续 AGY 翻译/修订使用 `--mode accept-edits --model gemini-3.8-flash-high --effort high`，不再用 Plan mode 承担翻译；本轮模型通过 CLI models/运行日志核对，不靠默认名称猜测。九条首批与后续完整 AI/Canva、`menu.*` 源键和 17 个节点 owner 共 1,019 个 UI 键已有三语源绑定数据；已完成的前批补译门曾为 27/27、Node 合同 429/429；当前累加/渲染新增四个合同通过，字体复核新增语义合同仍因缺模块为预期 RED。此次完整 Node 运行 436 项为 434 PASS / 2 缺字体模块 RED；Auto-Animate/现场遗漏的独立新 TDD 尚需随数据闭环，不把工作中 RED 冒称整库通过，syntax/版本/发布协议检查通过；这些是离线证据而非实机 UI PASS。新增帮助 34 条及旧说明显式审批 478 条也通过投影合同。`menu.*` 已按四个源域批次覆盖 352/352，不能推导为真实菜单全部完成，下一步继续节点等完整 owner，不留“样例已翻=全部完成”的口子。两平台 Tauri resources 已以先 RED 后 GREEN 的合同明确只映射现行四语 runtime 子目录，不把新增 native 构建期审定数据打包；未作真实打包证明。同步修正两项 Rust 配置合同后，完整 Rust 单测 184 项及默认集成合同通过；4 项显式 live/signature 测试仍 ignored。CLI exit/SUCCESS 不是译文回执：空响应或 resume 携带旧 structured_output 时，必须找到当前完整译文并验证全部 key/源/语种/格式后才可入库。

用户级接线保持现有 9-command facade 和 operation lock，新增独立用户回执/只读 Status 投影；不把安装 `currentLang`、`patchStatus`、marker 或 `State.applied_patch` 改成用户语言成功证明。native apply 内部分流，不穿旧 bundle baseline/QPA；Restart 作为提交后独立启动步骤。后续 Rust DTO、bridge 白名单归一化与 renderer 当前语言/漂移状态测试同步推进；具体字段待实施时定稿，不先堆新接口。

截至原会话失败停点，上述补译链为1,019键，字体缺模块等RED和429/436项门均是历史阶段；本轮三批已闭环至1,351键，当时默认Node450/450、完整Rust313通过/4显式手工门未运行且零警告；当前显式macOS预览接线增量见§10。历史失败保留在私有接手账本；当前工作包状态以§5.2及前述汇总为准，不把旧RED当当前状态。

### 5.1.1 用户文件事务与生产接线的最小 TDD

在独立用户事务 owner 中使用临时 profile/合成包，保留 `user_language.rs` 的纯投影职责，不先抽通用 FS 框架：

1. 首装包先发布、typed locale 最后提交；精确前像/postimage、路径回执与其他偏好/兄弟插件不变。
2. 日语映射和重应用；保留首次恢复前像，不把上一轮译文当原厂状态。
3. 原文件 absent/存在、locale absent/完整 typed object 的准确恢复。
4. 发布资源后失败与进程中断；按 durable journal 和实际 postimage 收敛，rename 后 fsync 失败报告已可见但耐久未证明。
5. locale/自有文件任一出现后续修改，恢复整笔停止并全部保留、显式报告冲突，不做隐式半恢复。
6. 首次写入前及提交前复核共享 profile 写者；初版要求当前用户所有 Cavalry 实例退出，不只检查所选副本，也不强杀。
7. fake restart 只在提交后调用；失败保留已提交语言并报告需重启，不倒退文件事务。

已有 `operation_lock` 可串行化 Switcher，但不能证明 Cavalry 已退出。参考现有 per-file 暂存/同步/替换原则；`state.rs` 回执绑定安装，不直接拿来管理用户文件，其 Windows 先删后 rename 的 fallback 也不是用户文件原子覆盖证明。Windows 如需覆盖已有文件，采用已验证的原生替换语义，不能因此引入 QPA/Program Files 的整套前置门。§3.4 已扩为31项文件事务合同；macOS显式预览已接fixed路径/all-Cavalry快照和launch-only，跨平台耐久、实际路径/共享副本与真实失败恢复仍待验，不拿fixture通过代验。

### 5.2 整个2.8迁移的逐项办事表

核对日期：2026-10-05。`[x]`只表示该行明确限定的完成条件已达到；代码/fixture、历史小样、当前完整live、正式发行分账，不互相冒领。无权重依据，不给整个迁移编造百分比。后续每完成一项，在同次代码/文档检查点勾选并保留证据范围。

#### A 厂商调查与架构裁决

- [x] 核对macOS 2.8.0/Qt 6.9.2官方来源、universal资源及17对catalog；Windows MSI/x64/Qt资源与安装表完成静态调查（非Windows实机）。
- [x] 梳理TextLoader/TextRegistry、稳定键族、English fallback、typed locale保存/启动读取及实际加载次序；明确用户目录与安装bundle是不同scope。
- [x] 选择用户级native-first主干，保留仅针对live缺口的窄补充；不搬旧全量Qt翻译hook，不另造常驻服务。
- [x] 核证新装合法JSON的locale Absent按厂商en-GB默认；General Preferences该builder不注册语言控件，未声称穷尽全App入口。
- [ ] 完整验证实际消费者、normal profile/Qt路径、双副本共享与2.7.2共存；静态机制不能代验这些项。

#### B 三语翻译与资源闭合

- [x] 原4319键全域图形语境复审，62键88槽修订、非作者差分复核与质量冻结。
- [x] 剩余5959键按完整owner分区审校/裁定/准入，18/18闭合；合计77模块10278审批键，缺键/额外键/重复键均0。
- [x] 厂商日语390叶逐键边界：仅13条核证误译修正，377原样；英语source和模型/API/字体/机器身份保全。
- [x] 三语ICU/占位符/HTML/源绑定合同、确定性producer及完整资源摘要核对；每语10473显示叶（含195自动DNT），只生成一次本轮完整pack。
- [x] 512条MetaData帮助description完成复用/补译审批和结构保护；此项仅译文，不代表部署。
- [ ] Destination Over厂商notes与标准操作数方向冲突做隔离行为实验；caption无缺口，源疑问仍开放。

#### C 原生加载与真实消费者

- [x] 历史两键原生探针，不改bundle；中文显示、正常退出保存、重启读回成立（限域观察）。
- [x] 历史安装版三语菜单、Group/Text Shape部分节点、指南与重启持久化及实验回退；字体/模型值保留，见§3.7–3.8。
- [ ] 当前完整冻结包三语代表catalog矩阵（3×17，本轮0/51）、全部键族/插件/指南和布局/tooltip验收；当前三语同10个首屏键已显示，仍不抵扣完整catalog。
- [ ] 512条帮助的实际consumer接线和三语实际显示；不得塞进UI-text或先改原厂MetaData假装接完。
- [ ] 需要时验证热刷新、sidecar/公开setter/最小bridge对照；仅在具体缺口证明必要后实现。

#### D 用户文件事务与恢复

- [x] 用户scope的typed locale/专属strings/独立receipt事务接进显式macOS preview；资源先、locale最后，旧bundle baseline与QPA不进入此路径。
- [x] tempfile合同覆盖首次前像、重应用、pending/中断收敛、无关偏好保留、symlink/字节与mode漂移拒绝及empty-only目录清理；乐观比较不冒称OS CAS。
- [x] fixed OS home、全部Cavalry写者快照准入、受控launch-only、hostless Current-owned English恢复代码与隔离合同；缺receipt/pending/坏证据不授予能力。
- [ ] 真实Switcher完整Switch/同语言重应用/Restore English，退出重启持久化；生产owner历史5动作加后续Hans Apply共6次成功、四语原厂启动/正常退出已过，尚缺同一实际IPC/renderer/Activity链，不用这些分段结果冒领整行。
- [ ] 真实中断/权限失败/漂移保留/耐久warning与恢复；登录/Keychain、共享副本/旧版影响及卸载保留/恢复语义。
- [ ] Windows用户文件替换/目录耐久/真实进程准入与恢复（Windows实施暂停）。

#### E Switcher状态与UI

- [x] 九命令/单一bridge沿用，版本兼容、资源、用户有效语言、补丁状态和恢复能力分离；2.7.2历史下载入口/预览updater禁用已接。
- [x] 默认英语/显式语言/异常Unknown三态接入四语文案；拆独立userProfile copy并保持四语各189键逐字等价与加载/打包顺序合同。
- [x] Official来源只读验签/5秒期限/子进程回收/异步status、失败unknown及来源不覆盖语言/资源合同；实际原厂验签smoke已通过，不证明notarization。
- [x] 新状态徽章Chromium headless与系统WKWebView fixture各6/6，CSS viewport 400×484/无横溢出；WK非激活、仅内部hidden窗口、六监视文件未变。整仓Node717、native与默认Rust各370/0失败（各6明确人工ignored）；两种fixture均不证明真实后端联动。
- [x] 当前真实原厂App/OS默认profile/已审批完整pack经生产native status owner组合只读烟测；原owner烟测以临时未创建state模拟首次运行；新增build-only真实AppHandle调用生产get_status一次，默认profile/完整pack/Official投影通过，10监视文件不变、隔离diagnostics已清理；两者均不代验IPC/WK或Apply。
- [ ] 新默认英语+Official在当前真实Tauri/WK与实际只读后端的联动复验；standalone WK fixture与build-only真实AppHandle只读烟测分别已过，但尚未连成同一IPC/WebView路径，不抵扣原生窗口或真实启动行为。
- [ ] 完整产品四语文案/错误/Activity/恢复终态与真实后端联动；去掉预览限制必须有对应事实，不为外观删安全提示。

#### F 缺口、首绘与性能

- [x] 历史现场漏译已对齐原生owner/key，并登记Time Editor/画布中文名称CJK方框；不是一律保留英文。
- [ ] 对当前完整包排查compiled/动态/自绘/字体/搜索语义与新旧场景，确认必要补充的精确owner/callsite；首屏已证画布CJK方框与英文Welcome，arm64帮助Path的Lato无CJK链已静态绑定，工具帮助仅副本canary修复、其余动态属性/时间轴/搜索及产品部署仍缺证。
- [ ] 修复确证缺口，若需注入按Qt 6.9.2逐架构ABI重新证明，不扩大为全局绘制hook。
- [ ] 同机原厂基线与译后冷启动、菜单首开、Quick Add、创建/保存/重开、Timeline播放的CPU/内存/IO/帧时延及首绘对照。
- [ ] macOS arm64与Intel runtime各自验收；现有Intel静态slice核对不能抵扣实机。

#### G 构建、更新隔离与发行

- [x] 原生资源与显式debug预览构建通路、编译期审批陈旧拒绝及native预览独立identifier/state；默认旧发布资源排除native构建期源。
- [x] 固定p12旧feed离线producer与字节/URL/原签名保留合同完成；只生成工件，不意味着旧客户端通道已隔离。
- [ ] 独立2.8生产profile/endpoint与冻结legacy feed接进publisher/CI，旧p11/p12实际接收合同及两个feed exact-readback；固定p12三平台真实archive签名已3/3通过（§17），不代验生产接线。
- [ ] 正式macOS包及安装/更新/恢复/卸载验收；只在源与消费者闭合后做必要打包，不反复出中间包。
- [ ] Windows 2.8实施/实机/installer验收（暂停，不借macOS结果宣布完成）。
- [ ] 最终版本/发行资产、签名身份与公开Release闭环；没有凭据和验证不得声称Developer ID/notarized，未经授权不push/tag/release。

#### H 连续性与现场治理

- [x] 翻译冻结Git检查点`32033c3`，精确index树379项验证；未混入当时未验收的runtime/Official。
- [x] 过期ignored构建/cache历史限域5.79GiB清理，本轮又清理已提交检查点导出与闭合阶段bytecode；当前有效target/packs/证据/失败日志/私有前像保留。
- [x] 本轮preview源码/UI检查点`5c6df86`与独立旧feed检查点`944a0f0`已commit；68文件跨层预览整体保全，工作树当时干净，未push。
- [x] 回顾整个session的决策/原话/失败/纠正/经验并本地提交私人账本；最新`684923a6`汇合前序全session复盘、WK六态/四RED、帮助边界、AppHandle只读和原厂后台基线。共享私库有他人脏修改，故使用临时隔离clone，未push/未同步共享目录，绝不冒称已远端落盘；本轮5动作/4首屏另追加，不重复打包。

当前顺序：B全键已闭合；先保存验收代码检查点，同时做全程复盘，然后推进C/D真实消费者与恢复，按证据进入F/G。用户“不抢前台”与“不丢场景”的限制优先；不重复已知自激活启动，不以复盘停主线。

### 5.3 从最小探针逐步扩展验证

初始探针只要求安全隔离、一条可见中文加载链与读回/重启结果。以下 fallback、热刷新、双副本、输入回归等逐步扩展，不全作为第一条链的开工门槛。

1. 在官方工作副本中提供少数无模型副作用的中文键，例如 about.title、menu.file.newScene、menuSearch.noResults；不先导入整套旧译文。
2. 分别验证“目标键存在”“目标缺键但源有”“目标文件不存在”“目标 JSON 不合法”；观察实际原生加载，不伪造 fallback。
3. 首先闭程序写 typed locale，再观察原生重启读取；之后单独测公开 setCavalryPreference("locale", ...) 的命令/回调及保存。原厂 JA 的 app/node 仍全英文，不能拿“核心 UI 没变日文”判接线失败；应观察已有日语的指南/插件、实际 locale，或用第 1 项少量中文键给核心 UI 建立明确变化。三种候选部署/接线分别实测，不要求最简单的偏好路线先安装 bridge。
4. 检查已存在菜单/窗口、新窗口、插件、指南是否一致；存在 reloadCoreStrings 不代表全 UI 已自动刷新。
5. 检查真实 Preferences/工作区路径。独立只读探针实际链接厂商 Qt 6.9.2：单独 HOME 不改变 Foundation / Qt 偏好和 AppData 路径；HOME + CFFIXED_USER_HOME + TMPDIR 可将第一用户候选移到专属 profile，QtTestMode 再追加 .qttest。系统级 AppData 与 bundle 资源候选仍存在。此探针使用 Qt 6.6.3 公开头文件，不是 Cavalry 启动、私有 ABI、Keychain/账号或完整 profile 隔离验收；仍须核实 2.8 PathManager 的实际使用及运行副作用，不足时改用临时系统用户/VM。
6. 用两个独立副本验证共享 locale 的影响；必要时使用用户已授权的 /Applications 2.8，以明确写入集和前像保护其用户设置，不把真实登录态当作隔离证明。已安装版的小样不代验双副本/旧版共存。
7. 保存/重开含中文、日文、Control、Regular 等用户名称的场景；type/id/字体查找身份与用户实际值不被翻译修改。原生默认层名如合法本地化应单独记录，不要求强制英文。

现有 2.7.2 Qt 6.6.3 acceptance driver 不能直接作为 2.8 Qt 6.9.2 合格驱动；复用测试意图和隔离机制，重新验证构建/ABI。

### 5.4 不靠旧 hook 数量决定新 hook 数量

逐项用“未加载补充 injector 的原生 2.8”作对照：

- Fast/Classic：本地语言查找、英文回退、说明、类别、No Results、排序与实际创建分别验；不改查询实际值，不合并两套算法。
- Fast 已有 registry 名称/说明消费与独立创建身份，但搜索规范化使用 9 字节 `[\s\-_\W]` / NoPatternOption；厂商 Qt 6.9.2 的下层探针把 CJK 查询规范化为空。安装版续验又观察到 `Group` 查询漏掉已中文化的 Group，`组` 查询虽将它列第一，却仍显示 3D Matrix/4-Point Warp/Accumulator 等无关节点。这是限定小样中的英文别名与中文过滤缺口，不是完整算法定性。优先补查完整标题、说明、旧别名、无匹配与排序；只修 Fast 的局部策略。Classic 没发现同一 \W 路径，分开验收。参考 [Qt QRegularExpression](https://doc.qt.io/archives/qt-6.9/qregularexpression.html)。
- 时间轴 CJK：安装版原生创建的中文默认 Group 名在 Scene Tree/Attribute Editor 正常，Time Editor clip 标题却显示方框；该点字体缺口已观察。条件保留 measure/draw 一致的窄字体适配，按新 Qt/二进制重验；不全局改字体或回写名称。
- tool help / 空态自绘：键是否抵达自绘消费者，首绘是否正确；不扩大为全局 drawText。
- MessageBar/错误：厂商消息与用户脚本内容分离；确需补充时保持 append-time，不扫完整历史文档。
- MessageBar 的已见 textForKey 调用只处理空队列 noFurther；常规消息路径显示原 LogMessage，log popout/sink 另有 QTextEdit.append。固定 UI 已 keyed 不等于动态消息已全原生化，更不能因此翻译任意日志或用户输出。
- 脚本帮助：补全/hover/富文本与原生 locale 一致性。
- 输入/IME/字体：只翻 placeholder 与确定的显示副本，不回写查询、模型或字体值。

## 6. 现有注入、备份和安全：复用能力，退出旧形态

现行 macOS 链是 keyed JSON overlay + launcher/DYLD + Qt translator/窄私有适配 + Keychain patch + re-sign。2.8 应按实际需要拆掉不再承担职责的部分，不能只改版本常量装旧成品。

- 现行 official baseline 备份映射资产与 7 个 runtime 路径，不是复制整个约 1 GB app。继续使用路径级 preimage、原权限、缺失记录和 durable journal。
- 本次事务 preimage 保护实际修改的路径；完整 vendor baseline 是受管所有权、升级/官方恢复能力的依据。隔离 catalog 小样不因此需要复制整包或装齐旧 injector，生产恢复仍按最终实际契约提供可验证基线。
- 新增中文 catalog 的“原来不存在”必须进入恢复记录；若增强厂商 ja-JP，保存其原厂 preimage，不恢复成我们的英语或旧日语。
- 主程序/签名/ExtensionLayer 等确有修改的路径仍可还原；Keychain 的 2.8 内存 parser 检查通过，不等于真实登录通过，更不要求无条件打所有旧补丁。
- marker 保留时表达事务/资源所有权；有效 locale 另有原生来源。保留最终提交顺序，不能把半安装资源报告为已切换成功。
- 保留选定根、revision、恢复前像和真实运行/权限边界；不用旧 P 版历史哈希猜 wrapper/injector 所有权。
- 现行代码已取消 journal 的 Keychain/HMAC 依赖、仅遇真实 PermissionDenied 才进入 App Management；不重新引入密码弹窗或预探测权限门。
- 2.7.2 专用旧路径和“合法受管态必须装旧 wrapper/NOP”的唯一门要换成 2.8 实际能力，不保留它们阻止原生部署。
- 私有 ABI 门只服务仍需的私有 hook；保留未重验门是为了不调用错误 ABI，不是用来否决已验证的纯原生资源路线。
- bundle 内文件修改的 seal/签名影响需按新路径实测。不能因采用 catalog 就宣称无需重签，也不能因重签就宣称所有旧注入必需。
- Windows QPA 没有 ABI 稳定承诺；若原生路线不需 QPA delegate，应让它退出，不为“保留旧架构”重装它。若仍需，则获取真实 2.8 vendor DLL 后证明新合同。

### 6.1 Windows 2.8 静态专项与迁移边界

MSI 默认 `ProgramFiles64Folder\\Cavalry`、支持选择 INSTALLDIR，有桌面/开始菜单快捷方式及 major-upgrade/downgrade 表。静态表不证明实际升级行为。新 vendor qwindows 的 SHA-256 为 `f80153ee381ad1437148f785aa4f952b29d285729185e952866e141f96b13b86`，Qt Core/Gui/Widgets/QPA 均为 x64、VERSIONINFO 6.9.2.0；旧 2.7.2 QPA/generic 成品不能当作 2.8 支持证据。

17 份源 catalog、17 份 ja-JP target 与 4 份 MetaData 均与 macOS 对应文件逐字节一致，所以译文和生成校验可以共享。原生 Api 的 locale/setter/core reload 与 Preferences 静态接缝也已见；用户插件完整行为、真实偏好保存和加载次序仍需 Windows live。

Api.dll 的 preferencesDir 使用 QStandardPaths enum 16，再追加 Cavalry/preferences.json。Qt 6.9.2 源码与厂商 [User Preferences](https://cavalry.studio/docs/tech-info/user-preferences/) 指向 Local AppData，不是 Roaming；真实选定路径仍须观测。用户包根与偏好根分开解析，不从一个 `%APPDATA%` 字符串推两个位置。[Qt 6.9.2 Windows 路径实现](https://raw.githubusercontent.com/qt/qtbase/v6.9.2/src/corelib/io/qstandardpaths_win.cpp)

Windows 后续顺序：可丢弃 x64 VM 核实 MSI/OS 来源与落点 → 闭程序 typed locale + 自有 strings 全局键小样/正常退出重启 → 扩节点/指南/plugin/恢复 → 仅给实测缺口重建 6.9.2 的窄补充。官方语言 UI 和公开 setter 单独验，不作为首个小样前置条件。用户资源路线不以旧 QPA ACTIVE 作为成功门；真正需要 Program Files 写入时复用现有同 EXE UAC 事务。MSI 升级可能替换 exe/QPA 而遗留旧未列名注入文件，这是待实测推断；不得把 2.7.2 vendor QPA 备份恢复进 2.8 Qt 6.9.2。

## 7. 性能验证

不承诺未经测量的“绝对最优”；以同机原厂 2.8、同场景、同语言动作对照。

- 原生 keyed 查表由厂商实现承担；不在显示热路径反复读文件、hash、parse JSON、遍历全树或写诊断。
- 删除已被 native 接管的通用翻译与 event-filter 工作；静态 interpose 不随 QTranslator 安装失败自动消失，按最终链接闭包裁剪。
- 需要补充时只做限定 owner/调用点的显示处理；缓存仅在内容/语言改变时失效。
- 测量冷启动、菜单首开/重开、Quick Add 输入、创建/保存/重开、Timeline 播放；记录 CPU/内存/IO 和帧时延原始分布，避免用单次截图或 CI 绿替代性能结论。
- 以首绘无英文闪烁、正常播放无补丁诊断落盘、同负载无明显新增热路径成本为验收意图；数值阈值依据基线测量制定，不凭空写漂亮预算。

## 8. 最终交付条件

- 原生主干、独立帮助、真实 runtime 缺口各有台账与处理归属；刻意保留的品牌/机器值有合理边界，而不是藏漏译。
- 三语都有 session-scoped live 证据；macOS 两架构、Windows x64分别验，不互相借结论。
- 新功能主路径、新旧场景、输入/字体/搜索/保存、首绘与性能通过。
- 新版本/同语言更新/官方恢复/中断恢复/权限失败/卸载语义通过。
- 打包、installer/updater 与公开发布单独验；本文件不产生 release 资格。
- 修改业务代码后同步 L3→L2→L1；本方案不把“计划采用的架构”写成现行代码事实。

## 9. 依据与当前未完成项

现行代码事实入口：CLAUDE.md、src-tauri/src/patch.rs、mac_runtime.rs、mac_official.rs、platform_runtime.rs、commands/apply.rs、injector/、languages/、tools/translation-whitelist.json。

官方一手资料：
- [2.8 Release Notes](https://cavalry.studio/docs/tech-info/release-notes/2.8/2-8-0-release-notes/)
- [API Module](https://cavalry.studio/docs/tech-info/scripting/api-module/)
- [User Preferences](https://cavalry.studio/docs/tech-info/user-preferences/)
- [Qt QPA](https://doc.qt.io/archives/qt-6.9/qpa.html)

私有证据名称：cavalry-2.8.0-investigation-2026-10-02；含第一轮 audit、第二轮 supplement、原厂摘要/反汇编、三位 Luna Max 分工与 Grok 独立审稿。它们是可追溯调研依据，不是运行时或构建输入。

安装核对：用户自行安装后的 /Applications/Cavalry.app 已为 2.8.0，主程序 SHA-256 与只读 DMG 的主程序一致。该位置不再是先前的已汉化 2.7.2；调查尚未对其写补丁，不能将用户安装行为算作迁移实现。后续小样使用专属副本/profile。

**未完成：用户包的完整三语/键族/layer/plugin/guide 步骤覆盖，sidecar/公开 setter/最小 bridge 的 live 对照、热刷新、副本/旧版影响、搜索/字体修复及动态表面、性能、登录/生产事务恢复以及 Windows 2.8 实机验证。Windows MSI 静态专项已完成，不能代验 Windows runtime。**
调查足以决定 native-first 方向和细化任务；尚不足以宣布生产适配完成，或把最小桥接/所有旧注入预先全部删掉。

## 10. macOS开发预览接线（非正式2.8支持）

以下为2204键/44模块的历史离线停点，不代验当前10278键/77模块。该轮显式UI审批装配44模块，复用官方17对catalog摘要锁及三语producer。payload按字节数/SHA与单语言schema核验，manifest逐字绑定编译审批；tracked审批/producer/lock变动必须重建。安装发现只读观察Info/executable，不沿旧JSON存在门；路径截断保持400×484布局。该历史2204-key manifest为1187B、SHA-256 `2c83eb45182accf629253dfffe1403ec5a44e87bd9db087aa12f1e163d578817`，input摘要`6094e715e5413980308252ba11b51828bdd0bc38411cdbadf0077d6e53ad6827`，complete:false；中文reviewed2,169/preserved236/missing8,068，日语同reviewed/preserved另vendor390/missing7,678。四资源精确回读及独立路径链检查通过，唯一资源根为Resources/target/native-language-packs；三payload简体243857B/`efe4d88734b8ccc236489526c79598dbb5ef29b4929df90abd96dc17d2680ae4`、繁体244138B/`40a47ee1839899177979511753eed9531d18e41d68d00b4ebef55193e8eed8a3`、日文341303B/`8b41bd46b4148d7d6612a30d1cb6c329337d38ee37ebcd79e0c860c59bb40996`。默认Node619/619、0 skip；默认与native全量Rust各360/0失败/4显式live ignored/0 warning。legacy runner fixture直接验证commands内部legacy helper，生产native分流与OS-home路径门未放宽；不以真实profile读写让旧fixture变绿。unsigneddebug build exit0、preview identifier隔离、旧languages/injector缺席，但未启动App，不证明WebView/Cavalry live或发行；512脚本帮助不在用户包中。

此前2,052键默认Node566/566/0skip、check:app exit0、native Rust41 pass/0 fail/0 ignored/17 test binary summaries/0 warning；unsigneddebug build exit0，四资源按字节精确匹配fresh producer。manifest1187B/SHA `1354f60e2e02f59fb2f2162c31b36e38d39d2f531287c7db0b6f5d0fa80a522f`；三payload简体227741B/`6c55c32d77f6b87977f9a81de0854f1a37edfb9d935b4da47abdbe943a5f9bb1`、繁体227994B/`a39a19666755749222be4b03788acb25f7a5214978e08274daa57ab57ff183b4`、日文322476B/`34e871e6697f556e238ece8d7f47c2e4ba00ee82d15cbc5069de9800e4908ead`。preview identifier隔离，旧languages/injector/DLL/dylib资源缺席；complete:false、新包未启动，不能称当前WebView、Cavalry live或发行。

现有九命令与单一renderer bridge复用，不引入安装bridge/服务。Status明确installation/userProfile及资源可用性，已解析Absent显示`en+unset`、显式Known与异常Unknown分流；用户scope对全部共享配置副本生效，写前需自行保存/退出所有Cavalry。自有strings先发布，typed locale最后提交，耐久warning/pending不自动启动，独立restart IPC也只读检查回执/namespace并拒绝pending、drift或不确定所有权；固定English恢复不依赖新payload、不回滚整份Preferences；已接基于有效Current回执/typed locale/完整自有activeimage的无宿主英文恢复，以及严格nativeEnglishRestoreAvailable/nativeRestoreOnly投影；无法验证兼容宿主时只恢复自有用户状态、不启动，普通验证成功宿主仍照常启动。缺失/pending/损坏/漂移证据不授予权限。严格恢复的pending发布绑定首次解析所得同份receipt原始bytes+mode；最终writer guard后外部删除或pending替换会拒绝发布、保留外部回执且不改Preferences/strings，两个实际RED回归修复后通过。比较到rename仍有TOCTOU，不称OS原子CAS或跨进程排他。旧2.7 baseline不进入新scope，也不因预览被覆盖。

~~~sh
# 仅macOS开发；必须明示原厂2.8资产输入，不自动使用Applications或译后来源
npm run build:native-resources -- --assets-root "$OFFICIAL_APP/Contents/assets"
# 编译审批与资源陈旧/改写会拒绝；不启动Cavalry就可看Switcher状态
npm run tauri:dev:native
# 仅本地未签名debug包，不能发布
CAVALRY_I18N_ENABLE_NATIVE_PREVIEW=1 npx tauri build --debug --bundles app --no-sign \
  --config src-tauri/tauri.native-preview.conf.json
~~~

开发启动必须使用上述native脚本及native-preview配置配对；仅手工设置编译环境开关不是完整预览打包入口。配置独立preview identifier/productName、state子域（后端另固定追加native-2.8-preview），关闭旧injector前置与旧资源，release profile硬拒绝启用。动作内核验main/Api/Core/QtCore与catalog字节身份，再按OS同uid home绑定实测normal-profile固定路径；hash不是Qt TestMode或实际运行路径证明。全Cavalryguard是快照，不是OS启动锁/任意writer排除。正常launch无自定义环境/测试参数且不替用户终止进程。

此前1,547键未签名debug包已逐字验证manifest/三语payload与当时审批和官方源重建一致，不含旧语言目录或injector；默认Node合同523/523、默认Rust360通过/4项明确人工门忽略、显式native编译的定向合同41/41。无宿主与同版本host探测失败的四语400×484浏览器fixture只投影三个真实完成阶段、无restart/Official，恢复英文终态不冒称恢复安装。真实包另通过只读AppleScript/AX及窗口截图核对：发现 `/Applications/Cavalry.app` 2.8.0，卡片无 `Tried:` 地址溢出，400逻辑像素窗口内安装卡片360；原生AX外框高度观测485，配置仍400×484，不把两种量度混称。共享配置/未完整支持提示的四语copy收敛后，Activity标题与正文均在卡片内。此检查未点击Switch/Restore，7项用户语言文件与宿主摘要前后不变，只证明真实WebView状态/布局，不证明生产事务或Cavalry翻译live。

上一轮重建的1,551键包仅作历史离线debug证明：未签名，bundle identifier为 `com.daftai.cavalry-i18n.native-preview`；当时fresh manifest与三语payload的字节/hash均与producer输出一致，manifest标记 `complete:false`，也不含旧语言目录或injector。该历史manifest SHA-256为`527159ed111ed8ab119c960d93949aa689830f6a72be51e12af4748ed00c133d`；payload SHA-256分别为简体`79a9bf998e94d755a778c7af0e019479e57f27d0f34c95c2f65350933093433f`、繁体`f597f9773d48ddd13c22e98137c8ef039ac452611c0ac024f6eda4533db57e59`、日语`f48095825cce721b8eb07e16426a7ef99aa66066fb2be7af19409e75c825c9d6`。默认Node 533/533、默认Rust 360通过/0失败/4项人工门ignored且0 warning，显式native Rust定向合同41/41也均属于该历史验证轮次。此前仍在运行的Preview进程来自旧1,547键映像，未由该轮重启；该段真实WebView只读画面不是当前审批/资源包验证。本轮未对Cavalry执行语言切换、恢复或重启，故没有Cavalry翻译live验收。

上一轮1,852键/32模块的离线debug包已通过默认Node560/560、native Rust41及四资源精确字节回读，manifest SHA `2b44f831450a6082e0dcfe5d2fe698ccdee4a1c5bf2521e8caa26bebc976cce8`、input SHA `85c5f8be3985a049359c123c6ca7315c8714c6b2fac14501e5ca32acd7355f07`；complete:false、中文missing8418/日语8028、未启动。本段保留旧身份，不代验当前2,204键工件。

上一轮1,651键producer重新生成成功（exit 0），manifest及三语payload离线覆盖状态为：manifest `complete:false`，SHA-256 `5d6746de866894f5dc4b7bcbeadc45534c5a437948766e6684562e89be56d8d0`，审批/目标输入摘要`36eb96d99eec86a210207f3118c3739569ae5393206c6fdd7dfe99392844f38b`；简体、繁体、日语payload SHA-256依次为`7ce91a9c03c0e4cbcfc2912f44cc2f1ebd6629b23a5195d285eee29dc3f8a948`、`c784c523d8321de0c73fea59a9f9f08635b718ef7cf86f8cfe97bb80942aa606`、`f0b27a6c22eee3b09fa17ef04e638ca85633036ad4655ec625a9327b577ebfb6`。新增18项默认合同18/18通过、0 skip；`npm test:contracts` 551/551通过、0 skip，`check:app`通过且diffcheck为0。该轮native Rust定向测试41 pass/0 fail/0 ignored/17 suites/0 warning；unsigned native-preview debug build exit 0，唯一 `--no-sign` warning符合预期。该轮 `.app` bundle 的manifest与三个语言payload已逐文件按字节数/SHA-256精确匹配fresh derived output（依序1,187/185,679/185,920/273,566 bytes），旧injector/旧languages/DLL/dylib资源均缺席；该离线package proof SHA-256为`34247547c6755e62a373a7dff459aa7275000797f7bcb17716df486c57a8d30d`。这只证明`complete:false`的unsigned debug工件闭合，不等同启动、WebView、Cavalry live或发行通过。新包未启动，旧预览进程未重启，真实Cavalry与profile未改动；此前的1,547键真实WebView只读布局证据与1,551键离线包继续保留为历史。

正式发布仍需三语补译、真实CUA normal-profile/Qt TestMode与共享副本回归、live显示缺口/窄补充、生产打包/签名发行验证及分版本updater闭包。默认当前2.7发布配置/版本号不变；Windows本轮不推进。


## 11. 固定旧 updater feed 的离线工件（未接生产发布）

`tools/create_legacy_updater_manifest.js` 与固定 p12 原文 fixture 已提供离线冻结能力：原始字节先验锁定，只将三个已发行平台的下载 URL 固定到 `cavalry-2.7.2-p12`，保留原 `1.0.6`、说明、日期与签名字节，输出再次通过精确字节锁。它不依赖当前 package SemVer 或未来2.8平台profile；保留历史Windows清单不代表新增Windows支持。CLI只接受显式 canonical目录中的 `latest.json`，新建或验证同字节已有内容，不覆盖异内容或跟随symlink。10项离线合同已接默认门，含真实字节变异与CLI验证；它不下载archive，也不重新验证archive的密码学签名。中断可能留下部分输出，下次会拒绝，需要使用新的输出目录或人工处理；不承诺原子发布、目录掉电耐久或排除并发父目录替换。

当前共享updater endpoint、release metadata、publisher与workflow仍保持既有单feed协议，尚未采用该离线producer。发布2.8前仍须将冻结的 `latest.json` 与独立 `latest-2.8.json` 接入显式production profile，并对实际公开资产和两个feed逐字节readback；仅有历史下载入口或离线生成器均不能证明旧客户端已被隔离。新feed的平台集合与资产数量须按当期实际发行profile确定，不能从旧p12的三平台集合推定。默认版本/发行配置未切换，Windows仍暂停。

## 12. 非激活WK检查点（2026-10-05）

系统WebKit直接消费当前renderer及明确fake bridge，验证四语默认英语+Official、日语Unknown来源+默认英语、简体Official+已翻译六态。CSS视窗400×484，snapshotWidth单位为points，本机800pt/2x输出1600×1936；root查看简体/日语，独审查看六截图并核对摘要。语言、来源、Restore能力分离，source/profile六文件监视回读不变，未启动Tauri或Cavalry、未Apply或修改语言。

保留四份harness RED：无变化的setActivationPolicy返回false被误判、WK创建内部隐藏TUINSWindow触发过严zero-window断言、在同一硬门下进一步只读窗口诊断、snapshot points被误作pixels。分别修正测试断言并锁固定canonical输出/拒symlink与既存覆盖；不改生产代码、不把captureComplete当pass。最终独立Node24回执门6/6，系统prohibited/无自身激活/0可见-key-main窗口；内部窗口真实记为1，不误称总窗口0。

[Qt6.9.2 integration/delegate](https://github.com/qt/qtbase/blob/v6.9.2/src/plugins/platforms/cocoa/qcocoaapplicationdelegate.mm)及[raise/resolver](https://github.com/qt/qtbase/blob/v6.9.2/src/plugins/platforms/cocoa/qcocoawindow.mm)源码另证实两个不同语义的候选guard：非空`QT_MAC_DISABLE_FOREGROUND_APPLICATION_TRANSFORM=1`跳过Qt启动激活，`QT_MAC_SET_RAISE_PROCESS=0`关闭raise中的进程activate但不阻止orderFront。尚未实测Cavalry该启动组合，通知只能事后记录；不能据研究报告承诺完全不抢前台，更不能重跑已知会自激活的open -g。当前Cavalry Untitled未提供AXEdited，未据名称猜可丢弃或退出它。

该检查点只补WebKit引擎和接缝研究事实，不增加正式键、不关闭§5.2真实consumer/恢复/帮助/性能/发行待办。

## 13. 帮助窄消费的复制边界（2026-10-05）

独立、未部署的Apple arm64/libc++合成fixture完成普通及ASan/UBSan各15/15。四个字符串与整个参数向量逐成员深拷贝，仅副本description替换；长字符串、嵌入NUL、非ASCII、临时副本析构后的callee-owned内容、name/source碰撞及显式locale/版本/ABI拒绝均有合同。准备失败只在original调用前透传一次；original已部分写入或抛异常都不重试。它不包含vendor类型重解释、loader或真实Qt对象，不证明厂商ABI/hover消费者。

root审查发现初稿将查表sourceBytes与实际record.description分开传递，漂移record可以借正确候选原文误命中。新增反例实际先RED（构建0、运行1），再删除重复输入：resolver直接读取实际record的完整description字节；修后两个配置各15/15，原始失败日志保留。LeakSanitizer另报本平台不支持，不冒称通过；闭合后只清理自有二进制及dSYM，保留源与证据。

当前2.8 arm64静态链另闭合单条`primitive`的namespace过滤与map-key原字节：它不是从canonical路径尾推导。固定Node24将这一个运行名与四份原厂MetaData、两个framework、完整record/source身份及既有三语审批绑定，内存仅改其description，非目标内容不变。该回执明确1条候选、其余511运行名未完整认证、complete=false、consumerConnected=false；可信locale、实际C++互操作、安全加载和可逆hover canary仍待证明，不因此勾选512帮助完成。

真实Tauri徽章联动也不走捷径：锁定Tao/Wry创建路径本身请求AppKit激活，生产page lifecycle还会show/focus；仅设visible=false/focused=false不能满足不抢前台。保持E工单未勾，不启动这种伪隐藏烟测；必要时先验证测试专用的禁激活控制，再运行只读生产status/renderer联动。

## 14. 最短链路：无窗口真实 AppHandle 状态验收

2026-10-05：不为只读徽章验证另建message gate、私有ABI driver或测试壳；直接用Tauri `Builder::build` 获得真实AppHandle，调用生产 `commands::get_status` 一次。配置清空windows/tray/plugins、关闭默认菜单，**不调用run/run_iteration、不建WebView、不注册写命令**；`generate_context!(test=true)`仅免除依赖lib已有的重复Info.plist嵌入，真实Wry/AppHandle不替换为mock。

- 新增显式人工例 `src-tauri/examples/native_status_apphandle_smoke.rs`，162行；OS UID/euid及fixed-home前置、真实Preferences首读前symlink门、native-preview配置ID、完整10278/10473/三语零缺口manifest独立守门。非作者静态审查通过后才执行。
- **实际1/1通过、最终编译0警告**：当前原厂2.8.0、OS默认profile、完整pack，经真实AppHandle生产函数返回`official/en/unset/userProfile/resources available`。这是first-run空receipt范围；真实durable receipt仅absent前置/监视，未冒称已应用翻译状态。
- PID70135的自有CLI只观察到0激活通知、252次25ms采样无目标前台、无目标WindowServer窗口，前台PID684前后相同；被动监控不保证不漏瞬时行为，也不预防激活。10个vendor/profile/manifest监视文件摘要和mode未变；生产diagnostics在自有临时state写1条并清理。
- 首次编译误用private OS-home与unstable Manager API的RED、第二份context plist linker warning保留；改用窄OS账户前置与稳定`webview_windows()`，不增产品API、不压制warning。
- **未验收IPC/bridge/CSP/renderer徽章联动、Switch/Restore或完整三语UI**。§5.2仍26已完成/18未完成、当前全catalog实机0/51，不把独立WK与后端结果拼成联动通过。

人工重复入口（需当前原厂默认profile及已生成完整native resources，默认不自动运行）：

```bash
cd src-tauri
CAVALRY_I18N_ENABLE_NATIVE_PREVIEW=1 TAURI_CONFIG="$(cat tauri.native-preview.conf.json)" \
  cargo build --locked --example native_status_apphandle_smoke
CAVALRY_I18N_NATIVE_STATUS_SMOKE_APP=/Applications/Cavalry.app \
  target/debug/examples/native_status_apphandle_smoke
```

实际机器回执SHA-256：`native-status-apphandle-monitor.json` **9b5d60ad7e335a9d75e615026b09d9c8dd3054d84bd87f8115bc839c83bc6a0b**；运行日志 **0ce226a2df2ac657c0392d37af4e1d7a110a987f12e48aeb161f2f6bc798321b**。进程清单另确认旧PID84091已不存在、当前无Cavalry；不再要求先关闭未知scene，但启动仍走受控原厂背景实验，不能重用已知自激活的盲目`open -g`。


## 15. 原厂后台启动：先证最短正常路径

2026-10-05：当前用户进程路径只读前置与原厂main/target SHA、固定Apple requirement通过后，直接`NSWorkspace.openApplication`新建无URL实例，`activates=false`并设置Qt6.9.2的两个局部guard：`QT_MAC_DISABLE_FOREGROUND_APPLICATION_TRANSFORM=1`、`QT_MAC_SET_RAISE_PROCESS=0`。未安装注入器、改bundle、使用test profile、操作scene或隐藏结果来掩盖激活。

- **单次实际English启动通过**：PID74780，真实进程两个guard均读回1；刺激前开始监测，346次配置25ms采样观察0目标激活通知/前台/active/遮挡，前台PID29592前后相同。它只证明本机此次启动，采样不预防激活也不保证不漏瞬时事件；不是全三语、首绘或产品restart验收。
- 本轮root创建且未编辑实例按PID正常退出，无Save/Discard/forcekill，前台仍29592；locale继续缺键、strings/receipt仍absent，Preferences摘要`9f76ac00cbf805d16fa5f7aa34f59f8977a875c63654941cd5359cdf0212c44e`未变，原厂App未写。
- **收尾授权边界纠正**：历史辅助用AX默认Untitled标题并把读取失败折叠nil；独审明确该逻辑不能证明一般dirty/recovery状态。此次结果仅限定root-created/noURL/noedit事实，不将它推广为自动退出未知作品的门。后续逐窗记录实际AX状态码，未知作品、恢复窗口或保存对话一律保留，不复用title-only授权。
- 首次进程前置因不可读PID拒绝，后确证STAT Z无地址空间才另建新前置；不忽略未知live进程。两次Swift编译RED修正后当前150行独立typecheck通过，不用纸面审查冒称可编译。

当前完整catalog实机仍**0/51**、§5.2仍**26/18**；下一步仅复用既有production native profile事务作单动作Switch/重应用/English restore，不调用已知会抢前台的盲目`open -g`，再沿已测guarded路径观察真实翻译。

## 16. 生产用户事务与四语首屏检查点

2026-10-05：以下子项已经实际完成，§5.2的整流程大项仍为**26已完成/18待完成**。不按首屏抽样推算全catalog进度，不把直接owner调用与单独启动拼成实际Switcher联动。

| 子项 | 结果与边界 |
|---|---|
| [x] 完整pack的简体、繁体、日语生产Apply | 3/3；显式ignored smoke持真实operation lock，复用`native_user::apply_inner`与writer guard，不启动App |
| [x] 简体同语言重应用 | 1/1；首次receipt字节与locale前像均保留，不以新前像覆盖旧备份 |
| [x] 生产固定English Restore | 1/1；en-GB提交，自有strings/receipt移除；不是测试手写字节回退或恢复locale缺键 |
| [x] 四语原厂后台启动与初始面板 | 4/4；三语各10个相同首屏键与源/pack/实屏匹配，English面板与ASCII画布提示可读 |
| [x] root已审空白实验实例正常退出 | 4/4；精确PID、无URL/scene操作及截图审批，不Save/Discard/forcekill；AXEdited/AXDocument失败保留实际状态码，不从Untitled推断一般作品可丢弃 |
| [ ] 全catalog、实际Switcher联动、512帮助和显示缺口 | 未完成；上述结果分别对应当前生产事务、原厂启动和首屏范围 |

本轮最终smoke源SHA-256 **`2cfcc056c40920f3f067ca3144100a5749abb7a7681f1d8e4e66c65320edce68`**；实际5动作共用该源编译的test binary。最终native lib定向回归258通过/0失败/3明确人工ignored，编译0 warning；不是重复全量Rust370或重新出包。每次动作均验证六个vendor文件、manifest/三包、diagnostics和非locale偏好语义/mode未变，失败不自动重试或整份Preferences回滚。

四次启动均验证实际子进程的两个Qt guard；前台PID前后不变，采样内无目标激活通知/前台/active/遮挡。配置25ms采样包含查询开销，不声称实际固定间隔、绝对预防或首绘无闪烁。当前无本轮Cavalry实例，用户profile为固定English，自有语言文件与receipt均absent；持久operation lock inode保留，不当缓存删除。

**确定的下一步缺口：**三语画布工具帮助和Viewport Quality显示CJK方框，Welcome消息及动态窗口标题仍英文。arm64静态链为`TransformTool::getHelpStrings` → registry → Viewport text-path cache → `MakePathFromText` → Lato Regular → Skia字形Path；原厂Lato没有CJK覆盖，Qt面板字体正常不能代验这条链。原厂2.8启用Hardened Runtime，缺少DYLD环境变量与关闭Library Validation的授权，用户strings包也没有字体入口；不得据此盲装旧2.7 injector、全局改字体或重签用户原厂App。先复用已有原生消费者与加载入口；确需签名/部署边界变化时单独裁决最小方案。

机器检查点SHA-256 **`f6a380f136e7b0f3ca0b9bc387cf3cd374810791787e46e905e9941fedd9039e`**绑定5动作、四语PID/PNG/AX/审查/正常退出及最终profile事实。原始过程证据仅留会话stage/私人文档，公开构建和发布不依赖它们。

## 17. 固定旧版 archive 的真实签名核验

2026-10-05：复用现有`src-tauri/tests/updater_signature_contract.rs`的显式ignored流式门，不新增验签框架、不重新打包。实际读回[固定p12 Release](https://github.com/daftAI2026/Cavalry-i18n/releases/tag/cavalry-2.7.2-p12)的三项updater payload；公开`latest.json`与2521B tracked fixture逐字一致，[p12客户端配置](https://raw.githubusercontent.com/daftAI2026/Cavalry-i18n/cavalry-2.7.2-p12/src-tauri/tauri.conf.json)公钥与当前共享配置相同。2554B冻结feed只固定三个URL，三份原签名不变。

- [x] macOS aarch64、macOS x64、历史Windows EXE三个真实payload的SHA/size/API asset身份匹配，原manifest对应签名实际3/3通过；未安装或执行任何payload，也不抵扣Windows 2.8实施。
- [x] 真实复制的Windows历史payload在offset128变异一字节，现有密码学门按预期拒绝；不是只验证签名格式、key ID或GitHub摘要。
- [x] 验后lsof无引用，精确删除3个下载payload与1个坏复制共23,353,474逻辑字节；curl失败part本就不存在，不计删除。首次cleanup在四次删除后因不存在part断言失败，后纠正缺失目标处理并补记回执；保留小型签名文本、源/manifest快照、摘要和正负日志，不冒称物理释放量。
- [ ] 双feed production publisher/CI、旧客户端实际接收和未来Release exact-readback仍未完成；默认配置、共享endpoint、版本号及线上Release未改。

首次curl因TLS错误失败，原日志保留；改用GitHub精确asset-ID API正常TLS读回，不用insecure绕过。该测试binary仅编译一次（9.54s/0 warning），三语资源未重建。验证检查点SHA-256 **`40aa4b17ae54f0d16b5205a0748e499515e83b974e39acc402ee51b6022f4dd4`**绑定下载、原签名、准确validator source/binary和实际正负日志；这是历史archive信任证明，不是2.8产品发行证明。


## 18. 复用晚期机制与副本字体窄验证

2026-10-05：用户要求不仅迁移键表，还保留2.7.2晚期搜索、首帧、输入/字体身份及时间轴修复；先对照实际调用点，不盲装旧injector或全局改字体。

| 子项 | 实际结果与边界 |
|---|---|
| [x] 原厂2.8 arm64字体工厂/调用点补证 | 真实Core `MakeScalableFont`构造24B对象；CTFont→SkTypeface精确身份及完整字形覆盖；不以复制活SkFont/borrowed指针冒充owner |
| [x] Hans工具提示副本canary | 九条exact native文字中8条CJK借用字体、Space原字体；有限事件日志与主窗PNG显示可读。仅本次副本，不是产品部署或三语全画布通过 |
| [ ] 本次副本后台启动/正常退出 | 启动观察到1次目标激活、2个前台/active/遮挡样本，后台门失败；先前正常退出请求未退出。保留事实，不据此猜用户/厂商谁触发，不抵扣历史4/4原厂样本 |
| [x] 视口状态独立离线策略 | 明确`renderFrame → text-path cache` caller，三状态×无后缀/MSAA/Auto九个exact组合，与工具帮助owner隔离。先RED 84/102，普通和ASan/UBSan再各102/102；arm64零warning编译，未部署/实跑，非字体修复完成 |
| [x] 2.7.2晚期代码差分对照 | 搜索/显示修复进入p9，输入值/字体身份及时间轴修复进入p10；root核p10→p12相关injector/语言/规范/TS路径零差分，不漏最后发布线中的既有机制 |
| [ ] 属性全域、时间轴与搜索实机对等 | 不能从10278官方键齐全推断动态属性已覆盖；Forge八项只是例子。原生键存在/官方源缺口/动态consumer/DNT分别列账；测量与绘制必须同字体，原始名称和搜索身份不改 |

首轮canary源SHA **`2f72bf2212a50a7f8633bc85ad7d342bd866abb671e20bae461e9297ac9ca9de`**；事件日志SHA **`b00ff729189955043b4e612505780db59d1b018df79235f6a4e00ba4b6f3206b`**，启动回执SHA **`24b628cb4be44e62732b33119a7d47feca13aac56b9459be24d2f21dda018ebb`**。源码、编译、实际加载和截图各自绑定，不用尚未运行的第二轮源替换首轮证据。

副本仅本地ad-hoc签名，不具Official身份。携带厂商restricted identity/keychain entitlements的两次启动被AMFI拒绝，即使strict codesign已通过；移除这些厂商身份声明后才成功启动。只在自有副本放宽DYLD/library validation，未改原厂安装/系统策略或Keychain；不承诺无平台副作用，也不将实验准入失败时退出78的代码直接当产品fallback。

用户已明确两个图层只是测试、允许退出/重启，后又撤销保存要求；不再以保存路径阻塞工作。既有本地`ca`只读readiness返回2.7.2 `bridge_unavailable`，未派发save或安装/替换Bridge，不把它冒充2.8控制能力。后续仍按精确PID、可丢弃测试scene及不抢前台约束操作，不forcekill未知作品或删除正在加载的副本。

**身份与搜索回归单独验：**字体family/style（含Regular/Bold等）、`type:font`默认对象、模型/API identity及用户实际输入不翻。2.8 Group的native显示已有历史小样，但同小样的英文/中文查询存在有限命中反例；Qt regex的CJK清理风险只是底层证据，不夸大为全搜索失败。Fast与Classic分开验输入、结果集、排序和创建身份，原生已覆盖的显示不再叠旧通用翻译。

§5.2仍**26已完成/18待完成**，完整catalog仍**0/51**。512帮助consumer、全属性/UI/三语字体、真实Switcher联动、性能和发行仍未完成；离线构建只生成必要定向fixture，不重复打包。
