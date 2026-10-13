[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$MarkdownFilePath,

    [Parameter(Mandatory = $true)]
    [string]$ConfigurationFilePath,

    [Parameter(Mandatory = $true)]
    [string]$DataFilePath,

    [Parameter(Mandatory = $true)]
    [string]$DataSnapshotFilePath,

    [Parameter(Mandatory = $true)]
    [datetime]$AsOf,

    [switch]$UpdateTopGrowing
)

$ErrorActionPreference = "Stop"

function Resolve-RepositoryPath {
    param ([string]$Path)
    $normalizedPath = $Path -replace "\\", "/"
    return (Resolve-Path -LiteralPath $normalizedPath).Path
}

$markdownPath = Resolve-RepositoryPath $MarkdownFilePath
$configurationPath = Resolve-RepositoryPath $ConfigurationFilePath
$dataPath = Resolve-RepositoryPath $DataFilePath
$snapshotPath = $DataSnapshotFilePath -replace "\\", "/"
if ((Split-Path -Leaf $markdownPath) -ne "README.md") {
    throw "The Markdown file must be named 'README.md'."
}

if (-not (Test-Path -LiteralPath $configurationPath)) {
    throw "No search criteria file found at '$configurationPath'."
}
if (-not (Test-Path -LiteralPath $dataPath)) {
    throw "No repository details file found at '$dataPath'."
}

$topics = @(ConvertFrom-Json -InputObject ([System.IO.File]::ReadAllText($configurationPath)))
$repositoriesDetails = @(ConvertFrom-Json -InputObject ([System.IO.File]::ReadAllText($dataPath)))
$repositoriesPopularityScoresSnapshot = @()
if ($UpdateTopGrowing -and (Test-Path -LiteralPath $snapshotPath)) {
    $repositoriesPopularityScoresSnapshot = @(ConvertFrom-Json -InputObject ([System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $snapshotPath).Path)))
}

Push-Location (Split-Path -Parent $markdownPath)
try {
    Import-Module (Join-Path $PSScriptRoot "Write-MarkdownSection.ps1") -Force
    Import-Module (Join-Path $PSScriptRoot "Get-ShieldIoBadge.ps1") -Force
    Import-Module (Join-Path $PSScriptRoot "ConvertTo-MarkdownTable.ps1") -Force
    Import-Module (Join-Path $PSScriptRoot "Write-ReadmeSummarySection.ps1") -Force
    Import-Module (Join-Path $PSScriptRoot "Write-ReadmeRepositoriesOpenedToContributionsSection.ps1") -Force
    Import-Module (Join-Path $PSScriptRoot "Write-ReadmeTopGrowingRepositoriesSection.ps1") -Force

    $null = Write-ReadmeSummarySection -GitHubRepositoriesDetails $repositoriesDetails -Topics $topics -AsOf $AsOf.ToUniversalTime()
    $null = Write-ReadmeRepositoriesOpenedToContributionsSection -GitHubRepositoriesDetails $repositoriesDetails
    if ($UpdateTopGrowing) {
        $null = Write-ReadmeTopGrowingRepositoriesSection `
            -GitHubRepositoriesDetails $repositoriesDetails `
            -GitHubRepositoriesPopularityScoresSnapshot $repositoriesPopularityScoresSnapshot
    }
} finally {
    Pop-Location
}
