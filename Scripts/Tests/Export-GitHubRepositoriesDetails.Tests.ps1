# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Export-GitHubRepositoriesDetails.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Search-GitHubRepositories function
    Import-Module $global:executingTestPath/../Export-GitHubRepositoriesDetails.ps1 -Force
}

Describe "Export-GitHubRepositoriesDetails Unit Test" {
    Context "Parameters validation" {
        It "Should throw an error if ConfigurationFilePath parameter is not valid" {
            $result = { Export-GitHubRepositoriesDetails -ConfigurationFilePath "invalid path" -OutputFilePath ".\Data\GitHubRepositoriesDetails.json" } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "Not configuration file found at the path 'invalid path'."
        }

        It "Should throw an error if OutputFilePath parameter is not valid - not targeting a JSON file" {
            Mock Test-Path { $true }

            $result = { Export-GitHubRepositoriesDetails -ConfigurationFilePath ".\Configuration\GitHubRepositoriesSearchCriteria.json" -OutputFilePath ".\Data\GitHubRepositoriesDetails.txt" } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "The output file path '.\Data\GitHubRepositoriesDetails.txt' is not targeting a JSON file."
        }
    }

    Context "Execution of a valid execution with mocked commands" {
        BeforeEach {
            Mock Test-Path { $true }
            
            Import-Module $global:executingTestPath/../Search-GitHubRepositories.ps1 -Force
            Mock Search-GitHubRepositories {
                @(
                    [pscustomobject]@{
                        createdAt           = "01/01/2000 00:00:00"
                        description         = "Anonymized description"
                        fullName            = "anon/repo"
                        hasIssues           = $true
                        homepage            = "https://anon.com"
                        language            = $null
                        license             = [pscustomobject]@{
                            key = "anon"
                            name = "Anon License"
                            url = "https://anon.com/licenses/anon"
                        }
                        name                = "anon-repo"
                        openIssuesCount     = 0
                        owner               = [pscustomobject]@{
                            id = "anonId"
                            is_bot = $false
                            login = "anon"
                            type = "Anon"
                            url = "https://anon.com"
                        }
                        updatedAt           = "01/01/2000 00:00:00"
                        url                 = "https://anon.com"
                        watchersCount       = 0
                        hasGoodFirstIssues  = $false
                        hasHelpWantedIssues = $true
                    },
                    [pscustomobject]@{
                        createdAt           = "01/01/2000 00:00:00"
                        description         = "Another anonymized description"
                        fullName            = "anon/another-repo"
                        hasIssues           = $false
                        homepage            = "https://anon.com"
                        language            = $null
                        license             = [pscustomobject]@{
                            key = "anon"
                            name = "Anon License"
                            url = "https://anon.com/licenses/anon"
                        }
                        name                = "another-anon-repo"
                        openIssuesCount     = 0
                        owner               = [pscustomobject]@{
                            id = "anotherAnonId"
                            is_bot = $false
                            login = "anon"
                            type = "Anon"
                            url = "https://anon.com"
                        }
                        updatedAt           = "01/01/2000 00:00:00"
                        url                 = "https://anon.com"
                        watchersCount       = 0
                        hasGoodFirstIssues  = $false
                        hasHelpWantedIssues = $false
                    }
                )
            }

            Mock Out-File {
                # Do nothing 
            }
        }

        It "Should return a valid array of repositories with correct properties when valid parameters are provided" {
            Mock Get-Content {
                @"
[
    {
        "Topic": "powerplatform",
        "SearchLimit": 250
    }
]
"@
            }

            $result = Export-GitHubRepositoriesDetails -ConfigurationFilePath ".\Configuration\GitHubRepositoriesSearchCriteria.json" -OutputFilePath ".\Data\GitHubRepositoriesDetails.json"
            $result.Count | Should -Be 2
            $result[0].fullName | Should -Be "anon/another-repo"
            $result[0].hasGoodFirstIssues | Should -Be $false
            $result[0].hasHelpWantedIssues | Should -Be $false
            $result[1].fullName | Should -Be "anon/repo"
            $result[1].hasGoodFirstIssues | Should -Be $false
            $result[1].hasHelpWantedIssues | Should -Be $true
        }

        It "Should return an array of repositories where duplicate repositories are removed" {
            Mock Get-Content {
                @"
[
    {
        "Topic": "powerplatform",
        "SearchLimit": 250
    },
    {
        "Topic": "powerplatform",
        "SearchLimit": 250
    }
]
"@
            }

            $result = Export-GitHubRepositoriesDetails -ConfigurationFilePath ".\Configuration\GitHubRepositoriesSearchCriteria.json" -OutputFilePath ".\Data\GitHubRepositoriesDetails.json"
            $result.Count | Should -Be 2
        }
    }
}