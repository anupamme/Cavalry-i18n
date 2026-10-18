<#
[INPUT]: 依赖当前生成的native manifest/三pack、目标安装根及主脚本Assert-Condition失败表达
[OUTPUT]: 校验manifest profile、精确语言集合，以及安装manifest和pack对生成输入的长度/SHA-256一致性
[POS]: tools 的Windows native pack校验器；由NSIS安装冒烟调用，不持有全局状态
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
#>
function Assert-InstalledNativeResources {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceRoot,
        [Parameter(Mandatory = $true)]
        [string]$InstallRoot
    )

    $nativePackLocales = @('zh-Hans', 'zh-Hant', 'ja_JP')
    $installedNativePackRoot = Join-Path $InstallRoot 'target\native-language-packs'
    $sourceManifestPath = Join-Path $SourceRoot 'manifest.json'
    $installedManifestPath = Join-Path $installedNativePackRoot 'manifest.json'
    foreach ($path in @($sourceManifestPath, $installedManifestPath)) {
        Assert-Condition -Condition (Test-Path -LiteralPath $path -PathType Leaf) `
            -Message "Native resource manifest is missing: $path"
    }

    $sourceManifestLength = (Get-Item -LiteralPath $sourceManifestPath -Force).Length
    $installedManifestLength = (Get-Item -LiteralPath $installedManifestPath -Force).Length
    $sourceManifestHash = (Get-FileHash -LiteralPath $sourceManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $installedManifestHash = (Get-FileHash -LiteralPath $installedManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Assert-Condition `
        -Condition ($sourceManifestLength -eq $installedManifestLength -and $sourceManifestHash -ceq $installedManifestHash) `
        -Message 'Installed native resource manifest differs byte-for-byte from the current generated input.'

    $manifest = Get-Content -LiteralPath $sourceManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert-Condition `
        -Condition (
            $manifest.schemaVersion -eq 1 -and
            $manifest.kind -ceq 'production-2.8' -and
            $manifest.cavalryVersion -ceq '2.8.0' -and
            $manifest.complete -eq $true
        ) `
        -Message 'Current native resource manifest is not a complete production-2.8 bundle.'

    $actualLocales = @(
        $manifest.packs.PSObject.Properties |
            Select-Object -ExpandProperty Name |
            Sort-Object
    )
    $expectedLocales = @($nativePackLocales | Sort-Object)
    $localeDifferences = @(
        Compare-Object -ReferenceObject $expectedLocales -DifferenceObject $actualLocales -CaseSensitive
    )
    Assert-Condition -Condition ($localeDifferences.Count -eq 0) `
        -Message 'Native resource manifest must contain exactly zh-Hans, zh-Hant, and ja_JP.'

    foreach ($locale in $nativePackLocales) {
        $info = $manifest.packs.PSObject.Properties[$locale].Value
        Assert-Condition `
            -Condition (
                $info.file -ceq "$locale.json" -and
                $info.bytes -gt 0 -and
                $info.sha256 -cmatch '^[0-9a-f]{64}$'
            ) `
            -Message "Native resource manifest metadata is invalid for $locale."

        $sourcePackPath = Join-Path $SourceRoot $info.file
        $installedPackPath = Join-Path $installedNativePackRoot $info.file
        foreach ($path in @($sourcePackPath, $installedPackPath)) {
            Assert-Condition -Condition (Test-Path -LiteralPath $path -PathType Leaf) `
                -Message "Native resource pack is missing: $path"
        }

        $sourcePackLength = (Get-Item -LiteralPath $sourcePackPath -Force).Length
        $installedPackLength = (Get-Item -LiteralPath $installedPackPath -Force).Length
        $sourcePackHash = (Get-FileHash -LiteralPath $sourcePackPath -Algorithm SHA256).Hash.ToLowerInvariant()
        $installedPackHash = (Get-FileHash -LiteralPath $installedPackPath -Algorithm SHA256).Hash.ToLowerInvariant()
        Assert-Condition `
            -Condition (
                $sourcePackLength -eq $info.bytes -and
                $sourcePackHash -ceq $info.sha256 -and
                $installedPackLength -eq $sourcePackLength -and
                $installedPackHash -ceq $sourcePackHash
            ) `
            -Message "Installed native resource pack differs from its manifest/source: $locale."
    }
}
