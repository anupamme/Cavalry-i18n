# baoyu-translate scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
main.ts: Bun CLI 入口，分派 chunk 或打印帮助；不调用模型。
chunk.ts: Markdown 块解析与分块写出，保留代码/HTML 与源 frontmatter。
package.json: 可选分块器的 markdown-it 14.1.1 声明，不合并进产品 package.json。
bun.lock: 上游分块器冻结依赖树，安装验证仅在自有临时目录进行。

依赖边界:
技能与语义配置只被 Agent 使用；不得成为产品构建、运行时或实机验收的替身。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
