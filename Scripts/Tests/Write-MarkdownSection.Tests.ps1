# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Write-MarkdownSection.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Write-MarkdownSection function
    Import-Module $global:executingTestPath/../Write-MarkdownSection.ps1 -Force
}

Describe "Write-MarkdownSection Unit Test" {
    Context "Parameters validation" {
        It "Should throw an error if MarkdownFilePath parameter is not valid" {
            Mock Test-Path { $false }
            $result = { Write-MarkdownSection -MarkdownFilePath "invalid path" -SectionIdentifier "GitHubRepositoriesDetails" -SectionContent "This is the content of the section." } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "The file 'invalid path' does not exist."
        }

        It "Should throw an error if provided path is not for a Markdown file" {
            Mock Test-Path { $true }
            Mock Get-Item { [PSCustomObject]@{ Extension = ".txt" } }
            $result = { Write-MarkdownSection -MarkdownFilePath ".\README.txt" -SectionIdentifier "GitHubRepositoriesDetails" -SectionContent "This is the content of the section." } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "The provided file '.\README.txt' is not a Markdown file."
        }

        It "Should throw an error if at least one balise for the considered SectionIdenfier was not found" {
            Mock Test-Path { $true }
            Mock Get-Item { [PSCustomObject]@{ Extension = ".md" } }
            Mock Get-Content { "<!--START_SECTION:GitHubRepositoriesDetails-->" }
            $result = { Write-MarkdownSection -MarkdownFilePath ".\README.md" -SectionIdentifier "GitHubRepositoriesDetails" -SectionContent "This is the content of the section." } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "The Markdown file '.\README.md' is missing at least one balise for the following section identifier: 'GitHubRepositoriesDetails--'."
        }
    }

    Context "Valid execution with mocked commands" {
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-Item { [PSCustomObject]@{ Extension = ".md" } }
            Mock Get-Content { "<!--START_SECTION:GitHubRepositoriesDetails--><!--END_SECTION:GitHubRepositoriesDetails-->" }
            Mock Set-Content { }
        }

        It "Should update the content of the section without throwing an error" {
            { Write-MarkdownSection -MarkdownFilePath ".\README.md" -SectionIdentifier "GitHubRepositoriesDetails" -SectionContent "This is the content of the section." } | Should -Not -Throw
        }
    }
}