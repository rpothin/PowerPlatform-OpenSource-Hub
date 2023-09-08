<#
    .SYNOPSIS
        Search GitHub repositories based on provided parameters.

    .DESCRIPTION
        Using the GitHub CLI (gh), this script searches GitHub repositories based on provided parameters.

    .PARAMETER Keywords
        The keywords considered for the search of GitHub repositories.

    .PARAMETER SearchType
        The type of search to perform. Valid values are: stars, followers, good-first-issues and help-wanted-issues

    .PARAMETER Threshold
        The threshold corresponding to the SearchType to use for the search.

    .INPUTS
        None. You cannot pipe objects to Search-GitHubRepositories.

    .OUTPUTS
        Object. This script returns 

    .EXAMPLE
        .\Scripts\Search-GitHubRepositories.ps1 -Keywords "PowerPlatform-ALM-With-GitHub-Template" -SearchType stars -Threshold 1
            createdAt       : 10/30/2020 02:45:02
            description     : Template repository for the ALM of Power Platform solutions with GitHub
            fullName        : rpothin/PowerPlatform-ALM-With-GitHub-Template
            hasIssues       : True
            homepage        : 
            language        : PowerShell
            license         : @{key=mit; name=MIT License; url=https://api.github.com/licenses/mit}
            name            : PowerPlatform-ALM-With-GitHub-Template
            openIssuesCount : 11
            owner           : @{id=MDQ6VXNlcjIzMjQwMjQ1; is_bot=False; login=rpothin; type=User; url=https://github.com/rpothin}
            updatedAt       : 08/04/2023 13:29:55
            url             : https://github.com/rpothin/PowerPlatform-ALM-With-GitHub-Template
            watchersCount   : 32
#>

[CmdletBinding()]
[OutputType([psobject])]
Param(
    [Parameter(Mandatory = $true)]
    [string]$Keywords,

    [Parameter(Mandatory = $true)]
    [ValidateSet('stars', 'followers', 'good-first-issues', 'help-wanted-issues')]
    [string]$SearchType,

    [Parameter(Mandatory = $true)]
    [int]$Threshold
)

# Search the GitHub repositories based on the provided parameters
switch ($SearchType) {
    "stars" { $repositories = gh search repos $Keywords --stars ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    "followers" { $repositories = gh search repos $Keywords --followers ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    "good-first-issues" { $repositories = gh search repos $Keywords --good-first-issues ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    "help-wanted-issues" { $repositories = gh search repos $Keywords --help-wanted-issues ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    default { Write-Error "Invalid SearchType provided - $SearchType. Valid values are: stars, followers, good-first-issues and help-wanted-issues" }
}

# Return the results
$repositories