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
        if ($script:sentinelRepositories.Count -le 0) {
            throw "At least one sentinel repository must be configured."
        }

        if ($script:sentinelRepositories.Count -gt 10) {
            throw "The sentinel repository list should stay compact; found $($script:sentinelRepositories.Count) entries."
        }
    }

    It "Should define only full repository names and rationale" {
        $allowedProperties = @("fullName", "rationale")

        foreach ($sentinelRepository in $script:sentinelRepositories) {
            $unexpectedProperties = @($sentinelRepository.PSObject.Properties.Name | Where-Object { $_ -notin $allowedProperties })
            if ($unexpectedProperties.Count -ne 0) {
                throw "Unexpected sentinel repository properties: $($unexpectedProperties -join ', ')."
            }

            if ($sentinelRepository.fullName -notmatch "^[^/]+/[^/]+$") {
                throw "Sentinel repository '$($sentinelRepository.fullName)' is not a full repository name."
            }

            if ([string]::IsNullOrWhiteSpace($sentinelRepository.rationale)) {
                throw "Sentinel repository '$($sentinelRepository.fullName)' must include a rationale."
            }
        }
    }

    It "Should list unique sentinel repository names" {
        $fullNames = @($script:sentinelRepositories | Select-Object -ExpandProperty fullName)
        $uniqueFullNames = @($fullNames | Sort-Object -Unique)

        if ($uniqueFullNames.Count -ne $fullNames.Count) {
            throw "Sentinel repository names must be unique."
        }
    }

    It "Should reference repositories present in committed repository details" {
        $repositoryDetailFullNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
        foreach ($repositoryDetail in $script:repositoryDetails) {
            [void]$repositoryDetailFullNames.Add($repositoryDetail.fullName)
        }

        foreach ($sentinelRepository in $script:sentinelRepositories) {
            if (-not $repositoryDetailFullNames.Contains($sentinelRepository.fullName)) {
                throw "Sentinel repository '$($sentinelRepository.fullName)' is not present in committed repository details."
            }
        }
    }
}

