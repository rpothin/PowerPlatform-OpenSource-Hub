# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Get-ShieldIoBadge.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Get-ShieldIoBadge function
    Import-Module $global:executingTestPath/../Get-ShieldIoBadge.ps1 -Force
}

Describe "Get-ShieldIoBadge Unit Tests" {
    It "Returns a Markdown shield.io badge" {
        $badge = Get-ShieldIoBadge -AlternativeText "Static Badge" -Message "any text" -Label "you like" -Color "blue" -OutputFormat "Markdown"
        $expectedBadge = "![Static Badge](https://img.shields.io/badge/any_text-you_like-blue)"
        $badge | Should -Be $expectedBadge
    }

    It "Returns an HTML shield.io badge" {
        $badge = Get-ShieldIoBadge -AlternativeText "Static Badge" -Message "just the message" -Color "8A2BE2" -OutputFormat "HTML"
        $expectedBadge = "<img alt='Static Badge' src='https://img.shields.io/badge/just_the_message-8A2BE2'>"
        $badge | Should -Be $expectedBadge
    }

    It "Replaces spaces with underscores in the message and label" {
        $badge = Get-ShieldIoBadge -AlternativeText "Static Badge" -Message "any text" -Label "you like" -OutputFormat "Markdown"
        $badge | Should -Match "any_text-you_like-.*"
    }

    It "Replaces underscores with '__' in the message and label" {
        $badge = Get-ShieldIoBadge -AlternativeText "Static Badge" -Message "any_text" -Label "you_like" -OutputFormat "Markdown"
        $badge | Should -Match "any__text-you__like-.*"
    }

    It "Replaces dashes with '--' in the message and label" {
        $badge = Get-ShieldIoBadge -AlternativeText "Static Badge" -Message "any-text" -Label "you-like" -OutputFormat "Markdown"
        $badge | Should -Match "any--text-you--like-.*"
    }
}