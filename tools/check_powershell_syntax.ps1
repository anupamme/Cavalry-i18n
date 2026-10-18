<#
[INPUT]: 依赖PowerShell语言解析器与单个仓库脚本路径。
[OUTPUT]: 调用Parser.ParseFile并报告语法错误；不执行目标脚本。
[POS]: tools的只读PowerShell语法driver，供Windows合同逐文件调用。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    [Console]::Error.WriteLine("PowerShell syntax input does not exist: $Path")
    exit 2
}

$resolvedPath = [System.IO.Path]::GetFullPath($Path)
$tokens = $null
$parseErrors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile(
    $resolvedPath,
    [ref]$tokens,
    [ref]$parseErrors
)
$parseErrorList = @()
if ($null -ne $parseErrors) {
    $parseErrorList = @($parseErrors)
}
foreach ($parseError in $parseErrorList) {
    [Console]::Error.WriteLine((
        '{0}:{1}:{2}: {3}' -f
        $resolvedPath,
        $parseError.Extent.StartLineNumber,
        $parseError.Extent.StartColumnNumber,
        $parseError.Message
    ))
}
if ($parseErrorList.Count -gt 0) {
    exit 1
}
Write-Output "PowerShell syntax valid: $resolvedPath"
