# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\SentinelRepositories.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Describe "SentinelRepositories configuration" {
    BeforeAll {
        $repositoryRoot = (Resolve-Path -Path (Join-Path -Path $global:executingTestPath -ChildPath "..\..")).Path
        $configurationFilePath = Join-Path -Path $repositoryRoot -ChildPath "Configuration\SentinelRepositories.json"
        $repositoryDetailsFilePath = Join-Path -Path $repositoryRoot -ChildPath "Data\GitHubRepositoriesDetails.json"

        $script:sentinelConfiguration = Get-Content -Path $configurationFilePath -Raw | ConvertFrom-Json
        $script:sentinelRepositories = @($script:sentinelConfiguration.repositories)
        $script:repositoryDetails = @(Get-Content -Path $repositoryDetailsFilePath -Raw | ConvertFrom-Json)
    }

    It "Should keep the sentinel list compact and focused" {
        ($script:sentinelRepositories.Count -gt 0) | Should Be $true
        ($script:sentinelRepositories.Count -le 10) | Should Be $true
    }

    It "Should define only full repository names and rationale" {
        $allowedProperties = @("fullName", "rationale")

        foreach ($sentinelRepository in $script:sentinelRepositories) {
            $unexpectedProperties = @($sentinelRepository.PSObject.Properties.Name | Where-Object { $_ -notin $allowedProperties })
            $unexpectedProperties.Count | Should Be 0
            $sentinelRepository.fullName | Should Match "^[^/]+/[^/]+$"
            ([string]::IsNullOrWhiteSpace($sentinelRepository.rationale)) | Should Be $false
        }
    }

    It "Should list unique sentinel repository names" {
        $fullNames = @($script:sentinelRepositories | Select-Object -ExpandProperty fullName)
        $uniqueFullNames = @($fullNames | Sort-Object -Unique)

        $uniqueFullNames.Count | Should Be $fullNames.Count
    }

    It "Should reference repositories present in committed repository details" {
        $repositoryDetailFullNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
        foreach ($repositoryDetail in $script:repositoryDetails) {
            [void]$repositoryDetailFullNames.Add($repositoryDetail.fullName)
        }

        foreach ($sentinelRepository in $script:sentinelRepositories) {
            $repositoryDetailFullNames.Contains($sentinelRepository.fullName) | Should Be $true
        }
    }
}

