<#
[INPUT]: 依赖临时production pack源、安装根与可加载windows_native_pack.ps1的PowerShell 5.1+宿主
[OUTPUT]: 对传入fixture执行Assert-InstalledNativeResources，失败时透传断言异常
[POS]: tools的native pack合同driver；Node只在Windows运行，不安装应用或写用户配置
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SourceRoot,
    [Parameter(Mandatory = $true)]
    [string]$InstallRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-Condition {
    param(
        [Parameter(Mandatory = $true)]
        [bool]$Condition,
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

. (Join-Path $PSScriptRoot 'windows_native_pack.ps1')
Assert-InstalledNativeResources -SourceRoot $SourceRoot -InstallRoot $InstallRoot
