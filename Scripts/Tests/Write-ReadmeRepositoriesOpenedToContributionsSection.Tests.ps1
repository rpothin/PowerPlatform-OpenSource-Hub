# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Write-ReadmeRepositoriesOpenedToContributionsSection.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Write-ReadmeRepositoriesOpenedToContributionsSection function
    Import-Module $global:executingTestPath/../Write-ReadmeRepositoriesOpenedToContributionsSection.ps1 -Force

    # Import required modules
    Import-Module $global:executingTestPath/../../Scripts/Write-MarkdownSection.ps1 -Force
    Import-Module $global:executingTestPath/../../Scripts/New-ShieldIoBadge.ps1 -Force
    Import-Module $global:executingTestPath/../../Scripts/ConvertTo-MarkdownTable.ps1 -Force
}

Describe "Write-ReadmeRepositoriesOpenedToContributionsSection Unit tests" {
    BeforeAll {
        # Define the input data for the tests
        $inputData = @(
            [pscustomobject]@{
                fullName = "Repo 1"
                url = "https://github.com/repo1"
                language = "PowerShell"
                hasGoodFirstIssues = $true
                hasHelpWantedIssues = $true
                openedGoodFirstIssues = 17
                openedHelpWantedIssues = 30
                openedToContributionsIssues = 47
                topics = @("microsoft", "microsoftteams", "powerapps", "powerautomate", "logicapps", "azure")
            },
            [pscustomobject]@{
                fullName = "Repo 2"
                url = "https://github.com/repo2"
                language = "C#"
                hasGoodFirstIssues = $false
                hasHelpWantedIssues = $true
                openedGoodFirstIssues = 0
                openedHelpWantedIssues = 10
                openedToContributionsIssues = 10
                topics = @("microsoft", "azure")
            },
            [pscustomobject]@{
                fullName = "Repo 3"
                url = "https://github.com/repo3"
                language = "JavaScript"
                hasGoodFirstIssues = $true
                hasHelpWantedIssues = $false
                openedGoodFirstIssues = 5
                openedHelpWantedIssues = 0
                openedToContributionsIssues = 5
                topics = @("microsoft", "azure")
            }
        )
        
        # Mock Write-MarkdownSection function
        Mock Write-MarkdownSection {
            param($Content, $Path)

            # Do nothing
        }
    }

    Context "with valid input data" {
        It "returns the expected output" {
            $output = Write-ReadmeRepositoriesOpenedToContributionsSection -GitHubRepositoriesDetails $inputData
            $output | Should -BeLike "*Repo 1](https://github.com/repo1)|PowerShell*"
            $output | Should -BeLike "*microsoftteams Badge](https://img.shields.io/badge/microsoftteams-*"
            $output | Should -BeLike "*https://github.com/repo3)|JavaScript*"
            $output | Should -BeLike "*azure Badge](https://img.shields.io/badge/azure-*"
        }
    }

    Context "without repository details" {
        It "returns 'List on its way...🐌'" {
            $output = Write-ReadmeRepositoriesOpenedToContributionsSection -GitHubRepositoriesDetails @()
            $output | Should -BeLike "*List on its way...🐌*"
        }
    }
}