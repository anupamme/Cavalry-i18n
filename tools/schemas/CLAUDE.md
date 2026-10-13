# schemas/
> L2 | 父级: ../CLAUDE.md

成员清单
release_asset_provenance.schema.json: 公开 ReleaseAssetProvenance v5 的资产与 sidecar 字节身份合同；接受受支持的2.7/2.8 tag，精确绑定release commit、SBOM/toolchain、profile分账的九/十项分发资产，并如实声明macOS ad-hoc、Windows unsigned与Updater Ed25519状态。
release_toolchain_evidence.schema.json: ReleaseToolchainEvidence 的构建工具链身份合同，供 source/macOS/Windows producer evidence 聚合使用。
windows_release_acceptance.schema.json: WindowsReleaseAcceptance 原始 session 派生摘要合同；供可选 Windows 维护者验收复验 tag/source/session、installer、generic/QPA 和现场矩阵绑定，不参与常规 tag 发布闭环。
windows_nsis_provenance.schema.json: WindowsNsisProvenance v2 跨 producer/verifier 结构合同；固定 x64 target、安装器、可空 updater signature 与 packaging-input fingerprint 的精确键集合，真实文件和摘要仍由双方代码独立复验。
source_artifact_manifest.schema.json: source artifact manifest 的 entry、类型、模式与提交身份合同，供源码归档校验使用。

依赖边界:
- Schema 是 `tools/` 验证器与 CI 的结构真相；具体 live session、签名与资产字节仍由对应 verifier 复验，不能只依赖 schema 文件存在。
- JSON schema 文件不承载 live evidence、签名私钥或机器路径；新增/修改 schema 必须同步其消费者合同测试与父级地图。

法则: 结构精确·额外字段拒绝·运行验证闭合·文档同步

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
