# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Get-GitHubRepositoryDetails.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Get-GitHubRepositoryDetails function
    Import-Module $global:executingTestPath/../Get-GitHubRepositoryDetails.ps1 -Force
}

Describe "Get-GitHubRepositoryDetails Unit Tests" {
    Context "Parameters validation" {
        It "Should throw an error if RepositoryFullName parameter is not valid" {
            $result = { Get-GitHubRepositoryDetails -RepositoryFullName "invalid repository full name" } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "The repository full name 'invalid repository full name' is not valid."
        }

        It "Should not throw an error for a RepositoryFullName like 'ORBISAG/ORBIS.PCF.ColorfulOptionset'" {
            $result = { Get-GitHubRepositoryDetails -RepositoryFullName "ORBISAG/ORBIS.PCF.ColorfulOptionset" } | Should -Not -Throw
        }

        It "Should not throw an error for a RepositoryFullName like 'microsoft/MTC_GuestAccessTeamsWorkshop'" {
            $result = { Get-GitHubRepositoryDetails -RepositoryFullName "microsoft/MTC_GuestAccessTeamsWorkshop" } | Should -Not -Throw
        }
    }

    Context "Valid execution for a non-existing repository" {
        BeforeEach {
            Mock gh {
                $errorRecord = New-Object System.Management.Automation.ErrorRecord -ArgumentList @(
                    [System.Exception]::new("The repository 'anon/repo' does not exist."),
                    "RepositoryDoesNotExist",
                    [System.Management.Automation.ErrorCategory]::ObjectNotFound,
                    $null
                )
                $errorRecord
            }
        }

        It "Should return an error message if GitHub repository does not exist" {
            $result = Get-GitHubRepositoryDetails -RepositoryFullName "anon/repo"
            $result.error | Should -Be "The repository 'anon/repo' does not exist."
        }
    }

    Context "Valid execution for an existing repository" {
        BeforeEach {
            Mock gh {
                # Check the parameters that were passed to the 'gh' command
                param($Command, $Param1)

                if ($Command -eq 'repo') {
                    # If the 'gh' command was called with 'repo view', return this mock data as a multi-line JSON structure as a string
                    return "{
                        'codeOfConduct': {
                            'key': 'anon_covenant',
                            'name': 'Anon Covenant',
                            'url': 'https://anon.com/AnonCovenant.md'
                        },
                        'forkCount': 0,
                        'fundingLinks': [],
                        'isSecurityPolicyEnabled': true,
                        'isTemplate': false,
                        'latestRelease': {
                            'name': 'Release 1.0.0',
                            'tagName': '1.0.0',
                            'url': 'https://anon.com/anon/anon/releases/tag/1.0.0',
                            'publishedAt': '2000-01-01T00:00:00Z'
                        },
                        'primaryLanguage': {
                            'name': 'AnonScript'
                        },
                        'repositoryTopics': [
                            {
                            'name': 'anon'
                            }
                        ],
                        'securityPolicyUrl': 'https://anon.com/anon/anon/security/policy',
                        'stargazerCount': 5,
                        'watchers': {
                            'totalCount': 3
                        }
                    }"
                }
                elseif ($Command -eq 'api' -and $Param1 -eq 'repos/anon/repo/topics') {
                    # If the 'gh' command was called with 'api repos', return this mock data
                    return "{
                        'names': [
                            'topic1',
                            'topic2',
                            'topic3',
                            'topic4'
                        ]
                    }"
                }
                elseif ($Command -eq 'api' -and $Param1 -eq 'repos/anon/repo/languages') {
                    # If the 'gh' command was called with 'api repos', return this mock data
                    return "{
                        'languages1': '123',
                        'languages2': '456'
                    }"
                }
                elseif ($Command -eq 'issue') {
                    # If the 'gh' command was called with 'api repos', return this mock data
                    return "[
                        {
                            'number': '123',
                            'title': '456'
                        },
                        {
                            'number': '123',
                            'title': '456'
                        }
                    ]"
                }
            }
        }

        It "Should return the details of the considered GitHub repository if it exists" {
            $result = Get-GitHubRepositoryDetails -RepositoryFullName "anon/repo"
            $result.codeOfConduct.key | Should -Be "anon_covenant"
            $result.codeOfConduct.name | Should -Be "Anon Covenant"
            $result.codeOfConduct.url | Should -Be "https://anon.com/AnonCovenant.md"
            $result.forkCount | Should -Be 0
            $result.fundingLinks | Should -Be @()
            $result.isSecurityPolicyEnabled | Should -Be $true
            $result.isTemplate | Should -Be $false
            $result.languages.count | Should -Be 2
            $result.languages[0] | Should -Be "languages1"
            $result.latestRelease.name | Should -Be "Release 1.0.0"
            $result.latestRelease.tagName | Should -Be "1.0.0"
            $result.latestRelease.url | Should -Be "https://anon.com/anon/anon/releases/tag/1.0.0"
            $result.latestRelease.publishedAt | Should -Be "01/01/2000 00:00:00"
            $result.primaryLanguage.name | Should -Be "AnonScript"
            $result.repositoryTopics[0].name | Should -Be "anon"
            $result.securityPolicyUrl | Should -Be "https://anon.com/anon/anon/security/policy"
            $result.stargazerCount | Should -Be 5
            $result.watchers.totalCount | Should -Be 3
            $result.topics[0] | Should -Be "topic1"
            $result.topics[1] | Should -Be "topic2"
            $result.hasGoodFirstIssues | Should -Be $true
            $result.openedGoodFirstIssues | Should -Be 2
            $result.hasHelpWantedIssues | Should -Be $true
            $result.openedHelpWantedIssues | Should -Be 2
            $result.openedToContributionsIssues | Should -Be 4
            $result.popularityScore | Should -Be 8
        }
    }

    Context "Valid execution for an existing repository with issues disabled" {
        BeforeEach {
            Mock gh {
                # Check the parameters that were passed to the 'gh' command
                param($Command, $Param1)

                if ($Command -eq 'repo') {
                    # If the 'gh' command was called with 'repo view', return this mock data as a multi-line JSON structure as a string
                    return "{
                        'codeOfConduct': {
                            'key': 'anon_covenant',
                            'name': 'Anon Covenant',
                            'url': 'https://anon.com/AnonCovenant.md'
                        },
                        'forkCount': 0,
                        'fundingLinks': [],
                        'isSecurityPolicyEnabled': true,
                        'isTemplate': false,
                        'latestRelease': {
                            'name': 'Release 1.0.0',
                            'tagName': '1.0.0',
                            'url': 'https://anon.com/anon/anon/releases/tag/1.0.0',
                            'publishedAt': '2000-01-01T00:00:00Z'
                        },
                        'primaryLanguage': {
                            'name': 'AnonScript'
                        },
                        'repositoryTopics': [
                            {
                            'name': 'anon'
                            }
                        ],
                        'securityPolicyUrl': 'https://anon.com/anon/anon/security/policy',
                        'stargazerCount': 0,
                        'watchers': {
                            'totalCount': 0
                        }
                    }"
                }
                elseif ($Command -eq 'api' -and $Param1 -eq 'repos/anon/repo/topics') {
                    # If the 'gh' command was called with 'api repos', return this mock data
                    return "{
                        'names': [
                            'topic1',
                            'topic2',
                            'topic3',
                            'topic4'
                        ]
                    }"
                }
                elseif ($Command -eq 'api' -and $Param1 -eq 'repos/anon/repo/languages') {
                    # If the 'gh' command was called with 'api repos', return this mock data
                    return "{
                        'languages1': '123',
                        'languages2': '456'
                    }"
                }
                elseif ($Command -eq 'issue') {
                    break # To simulate a repository with issues disabled, we break the loop and do not return any issue
                }
            }
        }

        It "Should return the details of the considered GitHub repository if it exists but has issues disabled" {
            $result = Get-GitHubRepositoryDetails -RepositoryFullName "anon/repo"
            $result.hasGoodFirstIssues | Should -Be $false
            $result.openedGoodFirstIssues | Should -Be 0
            $result.hasHelpWantedIssues | Should -Be $false
            $result.openedHelpWantedIssues | Should -Be 0
            $result.openedToContributionsIssues | Should -Be 0
        }
    }
}