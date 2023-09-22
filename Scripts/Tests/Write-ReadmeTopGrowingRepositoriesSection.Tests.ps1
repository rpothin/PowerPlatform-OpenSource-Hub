# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Write-ReadmeTopGrowingRepositoriesSection.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Write-ReadmeTopGrowingRepositoriesSection function
    Import-Module $global:executingTestPath/../Write-ReadmeTopGrowingRepositoriesSection.ps1 -Force

    # Import required modules
    Import-Module $global:executingTestPath/../../Scripts/Write-MarkdownSection.ps1 -Force
    Import-Module $global:executingTestPath/../../Scripts/New-ShieldIoBadge.ps1 -Force
    Import-Module $global:executingTestPath/../../Scripts/ConvertTo-MarkdownTable.ps1 -Force
}

Describe "Write-ReadmeTopGrowingRepositoriesSection Unit Tests" {
    Context "Tests with mocked commands" {
        BeforeEach {
            # Define the input data for the tests
            $repositoriesDetails = @(
                [pscustomobject]@{
                    fullName = "user/repo1"
                    url = "https://github.com/user/repo1"
                    language = "PowerShell"
                    stargazerCount = 50
                    watchers = [pscustomobject]@{totalCount = 20}
                    topics = @("topic1", "topic2")
                    popularityScore = 30
                },
                [pscustomobject]@{
                    fullName = "user/repo2"
                    url = "https://github.com/user/repo2"
                    language = "C#"
                    stargazerCount = 25
                    watchers = [pscustomobject]@{totalCount = 15}
                    topics = @("topic2", "topic3")
                    popularityScore = 20
                },
                [pscustomobject]@{
                    fullName = "user/repo3"
                    url = "https://github.com/user/repo3"
                    language = "JavaScript"
                    stargazerCount = 2
                    watchers = [pscustomobject]@{totalCount = 10}
                    topics = @("topic1", "topic3")
                    popularityScore = 5
                }
            )
    
            $popularityScoresSnapshot = @(
                [pscustomobject]@{
                    fullName = "user/repo1"
                    popularityScore = 40
                },
                [pscustomobject]@{
                    fullName = "user/repo2"
                    popularityScore = 25
                }
            )
    
            Mock Write-MarkdownSection {
                # Do nothing
            }
        }

        It "returns the expected output" {
            $output = Write-ReadmeTopGrowingRepositoriesSection -GitHubRepositoriesDetails $repositoriesDetails -GitHubRepositoriesPopularityScoresSnapshot $popularityScoresSnapshot
            $output.ToString() | Should -BeLike "*Stars Badge](https://img.shields.io/badge/10-yellow*"
            $output.ToString() | Should -BeLike "*Watchers Badge](https://img.shields.io/badge/20-orange*"
            $output.ToString() | Should -BeLike "*Stars Badge](https://img.shields.io/badge/5-yellow*"
            $output.ToString() | Should -BeLike "*Watchers Badge](https://img.shields.io/badge/15-orange*"
            $output.ToString() | Should -Be $null
        }

        It "returns 'List on its way...🐌' without repository details" {
            $output = Write-ReadmeTopGrowingRepositoriesSection -GitHubRepositoriesDetails @() -GitHubRepositoriesPopularityScoresSnapshot $popularityScoresSnapshot
            $output | Should -Be "List on its way...🐌"
        }

        It "returns 'List on its way...🐌' without snapshot" {
            $output = Write-ReadmeTopGrowingRepositoriesSection -GitHubRepositoriesDetails $repositoriesDetails -GitHubRepositoriesPopularityScoresSnapshot @()
            $output | Should -Be "List on its way...🐌"
        }
    }
}