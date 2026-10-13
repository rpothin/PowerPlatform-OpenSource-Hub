# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Write-MarkdownSection.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Write-MarkdownSection function
    Import-Module $global:executingTestPath/../Write-MarkdownSection.ps1 -Force
}

Describe "Write-MarkdownSection Unit Tests" {
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

        It "Should throw an error if section markers are missing or duplicated" {
            $markdownPath = Join-Path $TestDrive "README.md"
            [System.IO.File]::WriteAllText($markdownPath, "<!--START_SECTION:GitHubRepositoriesDetails-->")
            { Write-MarkdownSection -MarkdownFilePath $markdownPath -SectionIdentifier "GitHubRepositoriesDetails" -SectionContent "This is the content of the section." } | Should -Throw "*missing at least one balise*"
        }
    }

    Context "Valid execution" {
        BeforeEach {
            $markdownPath = Join-Path $TestDrive "README.md"
        }

        It "updates the section without changing the file's line-ending style" {
            $original = "Before`r`n<!--START_SECTION:details-->old`r`n<!--END_SECTION:details-->`r`nAfter`r`n"
            [System.IO.File]::WriteAllText($markdownPath, $original, [System.Text.UTF8Encoding]::new($false))
            Write-MarkdownSection -MarkdownFilePath $markdownPath -SectionIdentifier "details" -SectionContent "new`ncontent"

            $updated = [System.IO.File]::ReadAllText($markdownPath)
            $updated | Should -Be "Before`r`n<!--START_SECTION:details-->`r`nnew`r`ncontent`r`n<!--END_SECTION:details-->`r`nAfter`r`n"
            $updated | Should -Not -Match "(?<!`r)`n"
        }
    }
}