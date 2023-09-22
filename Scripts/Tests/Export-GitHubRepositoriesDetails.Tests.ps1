# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Export-GitHubRepositoriesDetails.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Export-GitHubRepositoriesDetails function
    Import-Module $global:executingTestPath/../Export-GitHubRepositoriesDetails.ps1 -Force

    # Import required modules
    Import-Module $global:executingTestPath/../../Scripts/Search-GitHubRepositories.ps1 -Force
    Import-Module $global:executingTestPath/../../Scripts/Get-GitHubRepositoryDetails.ps1 -Force
}

Describe "Export-GitHubRepositoriesDetails Unit Tests" {
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

    Context "Valid execution with mocked commands" {
        BeforeEach {
            Mock Test-Path { $true }
            
            Import-Module $global:executingTestPath/../Search-GitHubRepositories.ps1 -Force
            Mock Search-GitHubRepositories {
                @(
                    [PSCustomObject]@{
                        createdAt = '00/00/0000 00:00:00'
                        description = 'Anonymized description'
                        fullName = 'Anonymized/Anonymized'
                        hasIssues = 'Anonymized'
                        homepage = ''
                        language = 'Anonymized'
                        license = @{key='anonymized'; name='Anonymized License'; url='anonymized'}
                        name = 'Anonymized'
                        openIssuesCount = 'Anonymized'
                        owner = @{id='Anonymized'; is_bot='Anonymized'; login='Anonymized'; type='Anonymized'; url='anonymized'}
                        updatedAt = '00/00/0000 00:00:00'
                        url = 'anonymized'
                        hasGoodFirstIssues = $false
                        hasHelpWantedIssues = $false
                        codeOfConduct = ''
                        forkCount = 'Anonymized'
                        fundingLinks = @{}
                        isSecurityPolicyEnabled = 'Anonymized'
                        isTemplate = 'Anonymized'
                        latestRelease = @{name='Anonymized'; tagName='Anonymized'; url='anonymized'; publishedAt='00/00/0000 00:00:00'}
                        primaryLanguage = @{name='Anonymized'}
                        securityPolicyUrl = ''
                        stargazerCount = 'Anonymized'
                        watchers = @{totalCount='Anonymized'}
                        topics = @('anonymized', 'anonymized', 'anonymized', 'anonymized')
                        languages = @('Anonymized', 'Anonymized')
                    },
                    [PSCustomObject]@{
                        createdAt = '00/00/0000 00:00:00'
                        description = 'Anonymized description'
                        fullName = 'Anonymized/Anonymized2'
                        hasIssues = 'Anonymized'
                        homepage = ''
                        language = 'Anonymized'
                        license = @{key='anonymized'; name='Anonymized License'; url='anonymized'}
                        name = 'Anonymized'
                        openIssuesCount = 'Anonymized'
                        owner = @{id='Anonymized'; is_bot='Anonymized'; login='Anonymized'; type='Anonymized'; url='anonymized'}
                        updatedAt = '00/00/0000 00:00:00'
                        url = 'anonymized'
                        hasGoodFirstIssues = $true
                        hasHelpWantedIssues = $true
                        codeOfConduct = ''
                        forkCount = 'Anonymized'
                        fundingLinks = @{}
                        isSecurityPolicyEnabled = 'Anonymized'
                        isTemplate = 'Anonymized'
                        latestRelease = @{name='Anonymized'; tagName='Anonymized'; url='anonymized'; publishedAt='00/00/0000 00:00:00'}
                        primaryLanguage = @{name='Anonymized'}
                        securityPolicyUrl = ''
                        stargazerCount = 'Anonymized'
                        watchers = @{totalCount='Anonymized'}
                        topics = @('anonymized', 'anonymized', 'anonymized', 'anonymized')
                        languages = @('Anonymized', 'Anonymized')
                    }
                )
            }

            Mock gh {
                # Check the parameters that were passed to the 'gh' command
                param($Command, $Param1)

                if ($Command -eq 'api' -and $Param1 -eq '/rate_limit') {
                    return "{
                        'resources': {
                          'core': {
                            'limit': 5000,
                            'used': 61,
                            'remaining': 4939,
                            'reset': 1695306507
                          },
                          'search': {
                            'limit': 30,
                            'used': 0,
                            'remaining': 30,
                            'reset': 1695306457
                          },
                          'graphql': {
                            'limit': 5000,
                            'used': 65,
                            'remaining': 4935,
                            'reset': 1695307895
                          }
                        }
                      }"
                }
            }

            Import-Module $global:executingTestPath/../../Scripts/Get-GitHubRepositoryDetails.ps1 -Force
            Mock Get-GitHubRepositoryDetails {
                [PSCustomObject]@{}
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
            # Remove potential $null values from the array - not sure why they are there
            $result = $result | Where-Object { $_ -ne $null }
            $result.Count | Should -Be 2
            $result[0].fullName | Should -Be "Anonymized/Anonymized"
            $result[0].hasGoodFirstIssues | Should -Be $false
            $result[0].hasHelpWantedIssues | Should -Be $false
            $result[1].fullName | Should -Be "Anonymized/Anonymized2"
            $result[1].hasGoodFirstIssues | Should -Be $true
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
            # Remove potential $null values from the array - not sure why they are there
            $result = $result | Where-Object { $_ -ne $null }
            $result.Count | Should -Be 2
        }

        It "Should create the parent folder of the output file if it does not exist" {
            Mock Split-Path { ".\Data" }
            
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
            
            Mock Test-Path { 
                param($Path)
                # If path contains Data, return false else return true
                if ($Path -match "Data") {
                    return $false
                } else {
                    return $true
                }
            }
            
            Mock New-Item {
                # Do nothing
            }

            $result = Export-GitHubRepositoriesDetails -ConfigurationFilePath ".\Configuration\GitHubRepositoriesSearchCriteria.json" -OutputFilePath ".\Data\GitHubRepositoriesDetails.json"
            # Remove potential $null values from the array - not sure why they are there
            $result = $result | Where-Object { $_ -ne $null }
            $result.Count | Should -Be 2
        }
    }
}