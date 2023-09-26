# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Export-GitHubRepositoriesPopularityScore.Tests.ps1

# Set a global variable with the path of the executing script
$executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Export-GitHubRepositoriesPopularityScore function
    Import-Module $executingTestPath/../Export-GitHubRepositoriesPopularityScore.ps1 -Force
}

Describe "Export-GitHubRepositoriesPopularityScore Unit Tests" {
    Context "Parameters validation" {
        BeforeEach {
            $outputFilePath = "C:\path\to\output.json"
        }

        It "If input file does not exist, should throw an error" {
            Mock Test-Path { $false }

            { Export-GitHubRepositoriesPopularityScore -InputFilePath "nonexistent.json" -OutputFilePath $outputFilePath } | Should -Throw "The input file 'nonexistent.json' does not exist."
        }
    
        It "If input file is not a JSON file, should throw an error" {
            Mock Test-Path { $true }

            { Export-GitHubRepositoriesPopularityScore -InputFilePath "notjson.txt" -OutputFilePath $outputFilePath } | Should -Throw "The input file path 'notjson.txt' is not targeting a JSON file."
        }
    }

    Context "Valid execution with mocked commands" {
        BeforeEach {
            $inputFilePath = "C:\path\to\input.json"
            $outputFilePath = "C:\path\to\output.json"

            Mock Test-Path { $true }

            Mock Get-Content {
                return "[
                    {
                    'createdAt': '2018-11-21T16:54:50Z',
                    'description': 'Manages, configures, extracts and monitors Microsoft 365 tenant configurations',
                    'fullName': 'microsoft/Microsoft365DSC',
                    'hasIssues': true,
                    'homepage': 'https://aka.ms/M365DSC',
                    'language': 'PowerShell',
                    'license': {
                      'key': 'mit',
                      'name': 'MIT License',
                      'url': 'https://api.github.com/licenses/mit'
                    },
                    'name': 'Microsoft365DSC',
                    'openIssuesCount': 152,
                    'owner': {
                      'id': 'MDEyOk9yZ2FuaXphdGlvbjYxNTQ3MjI=',
                      'is_bot': false,
                      'login': 'microsoft',
                      'type': 'Organization',
                      'url': 'https://github.com/microsoft'
                    },
                    'updatedAt': '2023-09-20T19:03:16Z',
                    'url': 'https://github.com/microsoft/Microsoft365DSC',
                    'codeOfConduct': {
                      'key': 'contributor_covenant',
                      'name': 'Contributor Covenant',
                      'url': 'https://github.com/microsoft/Microsoft365DSC/blob/Dev/CODE_OF_CONDUCT.md'
                    },
                    'forkCount': 381,
                    'fundingLinks': [],
                    'isSecurityPolicyEnabled': true,
                    'isTemplate': false,
                    'latestRelease': {
                      'name': 'Release 1.23.920.2',
                      'tagName': '1.23.920.2',
                      'url': 'https://github.com/microsoft/Microsoft365DSC/releases/tag/1.23.920.2',
                      'publishedAt': '2023-09-20T15:40:35Z'
                    },
                    'primaryLanguage': {
                      'name': 'PowerShell'
                    },
                    'securityPolicyUrl': 'https://github.com/microsoft/Microsoft365DSC/security/policy',
                    'stargazerCount': 1154,
                    'watchers': {
                      'totalCount': 65
                    },
                    'topics': [
                      'microsoft365',
                      'powershell',
                      'monitoring',
                      'desiredstateconfiguration',
                      'configuration-as-code',
                      'devops',
                      'office365',
                      'sharepoint',
                      'onedrive',
                      'powerplatform',
                      'teams',
                      'microsoft',
                      'securityandcompliance',
                      'skypeforbusiness',
                      'azuread',
                      'exchangeonline',
                      'intune',
                      'hacktoberfest'
                    ],
                    'languages': [
                      'PowerShell',
                      'TypeScript',
                      'SCSS',
                      'HTML',
                      'CSS'
                    ],
                    'openedGoodFirstIssues': 0,
                    'hasGoodFirstIssues': false,
                    'openedHelpWantedIssues': 2,
                    'hasHelpWantedIssues': true,
                    'openedToContributionsIssues': 2,
                    'popularityScore': 1229
                  },
                  {
                    'createdAt': '2020-07-20T18:51:25Z',
                    'description': 'This extension provides an Azure Functions app with Open API capability for better discoverability to consuming parties',
                    'fullName': 'Azure/azure-functions-openapi-extension',
                    'hasIssues': true,
                    'homepage': 'https://www.nuget.org/packages/Microsoft.Azure.WebJobs.Extensions.OpenApi/',
                    'language': 'C#',
                    'license': {
                      'key': 'mit',
                      'name': 'MIT License',
                      'url': 'https://api.github.com/licenses/mit'
                    },
                    'name': 'azure-functions-openapi-extension',
                    'openIssuesCount': 168,
                    'owner': {
                      'id': 'MDEyOk9yZ2FuaXphdGlvbjY4NDQ0OTg=',
                      'is_bot': false,
                      'login': 'Azure',
                      'type': 'Organization',
                      'url': 'https://github.com/Azure'
                    },
                    'updatedAt': '2023-09-20T07:42:30Z',
                    'url': 'https://github.com/Azure/azure-functions-openapi-extension',
                    'codeOfConduct': {
                      'key': 'other',
                      'name': 'Other',
                      'url': 'https://github.com/Azure/azure-functions-openapi-extension/blob/main/CODE_OF_CONDUCT.md'
                    },
                    'forkCount': 170,
                    'fundingLinks': [],
                    'isSecurityPolicyEnabled': true,
                    'isTemplate': false,
                    'latestRelease': {
                      'name': 'v1.5.1: Update',
                      'tagName': 'v1.5.1',
                      'url': 'https://github.com/Azure/azure-functions-openapi-extension/releases/tag/v1.5.1',
                      'publishedAt': '2023-01-27T09:53:32Z'
                    },
                    'primaryLanguage': {
                      'name': 'C#'
                    },
                    'securityPolicyUrl': 'https://github.com/Azure/azure-functions-openapi-extension/security/policy',
                    'stargazerCount': 324,
                    'watchers': {
                      'totalCount': 38
                    },
                    'topics': [
                      'azure-functions',
                      'swagger-ui',
                      'hacktoberfest',
                      'azure',
                      'openapi',
                      'power-platform'
                    ],
                    'languages': [
                      'C#',
                      'PowerShell',
                      'Shell',
                      'Dockerfile'
                    ],
                    'openedGoodFirstIssues': 4,
                    'hasGoodFirstIssues': true,
                    'openedHelpWantedIssues': 0,
                    'hasHelpWantedIssues': false,
                    'openedToContributionsIssues': 4,
                    'popularityScore': 362
                  }
                ]"
            }

            Mock Out-File {
                # Do nothing
            }
        }

        It "should calculate the popularity score for each repository" {
            $result = Export-GitHubRepositoriesPopularityScore -InputFilePath $inputFilePath -OutputFilePath $outputFilePath
            $result.Count | Should -Be 2
            $result[0].fullName | Should -Be "microsoft/Microsoft365DSC"
            $result[0].popularityScore | Should -Be 1229
            $result[1].fullName | Should -Be "Azure/azure-functions-openapi-extension"
            $result[1].popularityScore | Should -Be 362
        }
    }
}