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
        ...

    .LINK
        ...

    .NOTES
        ..
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
    "stars" { $repositories = gh repo search $Keywords --stars ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    "followers" { $repositories = gh repo search $Keywords --followers ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    "good-first-issues" { $repositories = gh repo search $Keywords --good-first-issues ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    "help-wanted-issues" { $repositories = gh repo search $Keywords --help-wanted-issues ">$Threshold" --visibility public --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json }
    default { Write-Error "Invalid SearchType provided - $SearchType. Valid values are: stars, followers, good-first-issues and help-wanted-issues" }
}

# Return the results
$repositories