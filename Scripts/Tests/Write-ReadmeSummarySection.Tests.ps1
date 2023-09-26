# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Write-ReadmeSummarySection.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Write-ReadmeSummarySection function
    Import-Module $global:executingTestPath/../Write-ReadmeSummarySection.ps1 -Force

    # Import required modules
    Import-Module $global:executingTestPath/../../Scripts/Write-MarkdownSection.ps1 -Force
    Import-Module $global:executingTestPath/../../Scripts/New-ShieldIoBadge.ps1 -Force
}

Describe "Write-ReadmeSummarySection Unit Tests" {
    BeforeAll {
        $GitHubRepositoriesDetails = @(
            [pscustomobject]@{
                openedGoodFirstIssues = 0
                openedHelpWantedIssues = 0
                isSecurityPolicyEnabled = $true
            },
            [pscustomobject]@{
                openedGoodFirstIssues = 1
                openedHelpWantedIssues = 0
                isSecurityPolicyEnabled = $false
            },
            [pscustomobject]@{
                openedGoodFirstIssues = 0
                openedHelpWantedIssues = 1
                isSecurityPolicyEnabled = $true
            },
            [pscustomobject]@{
                openedGoodFirstIssues = 1
                openedHelpWantedIssues = 1
                isSecurityPolicyEnabled = $false
            }
        )

        $Topics = @(
            [pscustomobject]@{
                topic = "topic1"
            },
            [pscustomobject]@{
                topic = "topic2"
            }
        )
        
        # Mock Write-MarkdownSection function
        Mock Write-MarkdownSection {
            # Do nothing
        }
    }

    It "Generates the summary section content" {
        $expectedContent = "<h3 align='center'>`n  <img alt='Repositories Count Badge' src='https://img.shields.io/badge/Repositories-4-602890'>`n  <img alt='Active Repositories Count Badge' src='https://img.shields.io/badge/Active_Repositories-0-A24FBF'>`n  <img alt='Opened Good First Issues Count Badge' src='https://img.shields.io/badge/Good_First_Issues-2-green'>`n  <img alt='Opened Help Wanted Issues Count Badge' src='https://img.shields.io/badge/Help_Wanted_Issues-2-blue'>`n  <br/>`n  <img alt='Security Policy Enabled Percentage Badge' src='https://img.shields.io/badge/Security_Policy_Enabled_Percentage-50-orange'>`n  <img alt='Code of Conduct Availability Percentage Badge' src='https://img.shields.io/badge/Code_of_Conduct_Availability_Percentage-0-9F2B63'>`n</h3>*"
        $content = Write-ReadmeSummarySection -GitHubRepositoriesDetails $GitHubRepositoriesDetails -Topics $Topics
        $content | Should -BeLike $expectedContent
        $content | Should -BeLike "*<p align='center'>`n  <img alt='topic1 Badge' src='https://img.shields.io/badge/topic1-*"
        $content | Should -BeLike "*'>`n  <img alt='topic2 Badge' src='https://img.shields.io/badge/topic2-*"
    }
}