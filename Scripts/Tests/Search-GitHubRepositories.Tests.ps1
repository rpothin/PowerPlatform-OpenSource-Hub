# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Search-GitHubRepositories.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Search-GitHubRepositories function
    Import-Module $global:executingTestPath/../Search-GitHubRepositories.ps1 -Force
}

Describe "Search-GitHubRepositories Unit Tests" {
    Context "Parameters validation" {
        It "Should throw an error if Topic parameter contains spaces" {
            $result = { Search-GitHubRepositories -Topic "invalid topic" -SearchLimit 10 } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "The value of the Topic parameter cannot contain spaces."
        }

        It "Should throw an error if SearchLimit is not a positive integer" {
            $result = { Search-GitHubRepositories -Topic "validtopic" -SearchLimit -1 } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "Cannot validate argument on parameter 'SearchLimit'. The -1 argument is less than the minimum allowed range of 1. Supply an argument that is greater than or equal to 1 and then try the command again."
        }

        It "Should throw an error if SearchLimit is greater than 1000" {
            $result = { Search-GitHubRepositories -Topic "validtopic" -SearchLimit 1001 } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "Cannot validate argument on parameter 'SearchLimit'. The 1001 argument is greater than the maximum allowed range of 1000. Supply an argument that is less than or equal to 1000 and then try the command again."
        }

        It "Should throw an error if MinStars is not a positive integer (zero)" {
            $result = { Search-GitHubRepositories -Topic "validtopic" -SearchLimit 10 -MinStars 0 } | Should -Throw -PassThru
            $result.Exception.Message | Should -Match "MinStars"
        }

        It "Should throw an error if MinStars is negative" {
            $result = { Search-GitHubRepositories -Topic "validtopic" -SearchLimit 10 -MinStars -5 } | Should -Throw -PassThru
            $result.Exception.Message | Should -Match "MinStars"
        }
    }

    Context "Valid execution with a mocked gh command" {
        BeforeEach {
            Mock Invoke-GhCli {
                "[
                    {
                      'createdAt': '0000-00-00T00:00:00Z',
                      'description': 'Anonymised Description',
                      'fullName': 'anonymised/Anonymised',
                      'hasIssues': true,
                      'homepage': 'https://anonymised.url',
                      'language': 'Anonymised Language',
                      'license': {
                        'key': 'anonymised',
                        'name': 'Anonymised License',
                        'url': 'https://anonymised.url'
                      },
                      'name': 'Anonymised',
                      'openIssuesCount': 0,
                      'owner': {
                        'id': 'AnonymisedID',
                        'is_bot': false,
                        'login': 'anonymised',
                        'type': 'Anonymised',
                        'url': 'https://anonymised.url'
                      },
                      'updatedAt': '0000-00-00T00:00:00Z',
                      'url': 'https://anonymised.url'
                    }
                  ]"
            }
        }

        It "Should return an array of repositories with correct properties when valid parameters are provided" {
            $result = Search-GitHubRepositories -Topic "validtopic" -SearchLimit 1
            $result | Should -Not -BeNullOrEmpty
            $result[0].fullName | Should -Be "anonymised/Anonymised"
            $result[0].language | Should -Be "Anonymised Language"
            $result.count | Should -Be 1
        }

        It "Should include stars qualifier in gh arguments when MinStars is provided" {
            $capturedArguments = $null
            Mock Invoke-GhCli {
                param($Arguments)
                $script:capturedArguments = $Arguments
                "[]"
            }

            Search-GitHubRepositories -Topic "validtopic" -SearchLimit 1 -MinStars 5
            $script:capturedArguments | Should -Contain "stars:>=5"
        }

        It "Should not include stars qualifier in gh arguments when MinStars is not provided" {
            $capturedArguments = $null
            Mock Invoke-GhCli {
                param($Arguments)
                $script:capturedArguments = $Arguments
                "[]"
            }

            Search-GitHubRepositories -Topic "validtopic" -SearchLimit 1
            $script:capturedArguments | Should -Not -Contain "stars:>=5"
        }
    }
}
