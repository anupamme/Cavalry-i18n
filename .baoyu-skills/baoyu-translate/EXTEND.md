# [INPUT]: 依赖项目翻译规范与 docs/cavalry-glossary.md 的四语术语
# [OUTPUT]: 提供 baoyu-translate 的 refined / technical 项目偏好；目标语言按任务显式选择
# [POS]: 项目级技能的语义扩展，独立于 .agents/skills 中的上游实现，不参与产品运行时
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# -- 项目偏好 --------------------------------------------------------
# 四语词表按 en 与当前目标语言列读取；UI 资源不添加文章式解释或括注。
# 品牌、身份、占位符与格式边界遵 docs/translation-guidelines.md。

target_language: zh-CN
default_mode: refined
audience: technical
style: technical

glossary_files:
  - ../../docs/cavalry-glossary.md
