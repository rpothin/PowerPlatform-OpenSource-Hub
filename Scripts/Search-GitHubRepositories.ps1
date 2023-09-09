function Search-GitHubRepositories {
    <#
        .SYNOPSIS
            Search GitHub repositories based on provided parameters.

        .DESCRIPTION
            Using the GitHub CLI (gh), this script searches GitHub repositories based on provided parameters.

        .PARAMETER Topic
            The topic considered for the search of GitHub repositories.

        .PARAMETER SearchLimit
            Limit on the maximum number of repositories we will search for through the GitHub CLI.
            The value need to be between 1 and 1000 to be compliant with the GitHub CLI search repos command definition.

        .INPUTS
            None. You cannot pipe objects to Search-GitHubRepositories.

        .OUTPUTS
            Object. This script returns 

        .EXAMPLE
            .\Scripts\Search-GitHubRepositories.ps1 -Topic "powerplatform" -SearchLimit 250
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
        # The topic considered for the search of GitHub repositories as a string without spaces.
        [Parameter(Mandatory = $true)]
        [string]$Topic,

        # Limit on the maximum number of repositories we will search for through the GitHub CLI.
        [Parameter(Mandatory = $true)]
        [ValidateRange(1,1000)]
        [int]$SearchLimit    
    )

    Process{
        # Check if the value of the Topic value contains spaces and return a clear error message if it does
        if ($Topic -match "\s") {
            Throw "The value of the Topic parameter cannot contain spaces."
        }

        # Initialize an empty array to store the results
        $repositories = @()

        # Search the GitHub repositories based on the provided parameters
        $repositories = gh search repos --topic $Topic --visibility public --limit $SearchLimit --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json

        # Search the GitHub repositories based on the provided parameters with good first issues
        $repositoriesWithGoodFirstIssues = gh search repos --topic $Topic --visibility public --limit $SearchLimit --good-first-issues ">0" --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json

        # Add a properey to the results to indicate if the repository has good first issues
        foreach ($repository in $repositories) {
            if ($repositoriesWithGoodFirstIssues.fullname -contains $repository.fullname) {
                $repository | Add-Member -MemberType NoteProperty -Name hasGoodFirstIssues -Value $true
            }
            else {
                $repository | Add-Member -MemberType NoteProperty -Name hasGoodFirstIssues -Value $false
            }
        }

        # Search the GitHub repositories based on the provided parameters with help wanted issues
        $repositoriesWithHelpWantedIssues = gh search repos --topic $Topic --visibility public --limit $SearchLimit --help-wanted-issues ">0" --json description,fullName,homepage,language,license,name,hasIssues,openIssuesCount,owner,createdAt,updatedAt,url,watchersCount | ConvertFrom-Json

        # Add a properey to the results to indicate if the repository has help wanted issues
        foreach ($repository in $repositories) {
            if ($repositoriesWithHelpWantedIssues.fullname -contains $repository.fullname) {
                $repository | Add-Member -MemberType NoteProperty -Name hasHelpWantedIssues -Value $true
            }
            else {
                $repository | Add-Member -MemberType NoteProperty -Name hasHelpWantedIssues -Value $false
            }
        }

        # Return the results
        $repositories
    }
}