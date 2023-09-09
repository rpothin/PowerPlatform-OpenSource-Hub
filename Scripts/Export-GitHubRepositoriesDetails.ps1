function Export-GitHubRepositoriesDetails {
    <#
        .SYNOPSIS
            Search GitHub repositories for topics defined in a configuration file.

        .DESCRIPTION
            Go through the topics in a configuration file to retrieve GitHub repositories and key details.
            Combine and remove duplicates from the results of the search and export the results to a JSON file.

        .PARAMETER ConfigurationFilePath
            The path to the configuration file containing the topics to search for.

        .PARAMETER OutputFilePath
            The path to the JSON file where the results of the search will be exported.

        .INPUTS
            None. You cannot pipe objects to Export-GitHubRepositoriesDetails.

        .OUTPUTS
            Object. This script returns 

        .EXAMPLE
            Import-Module .\Scripts\Export-GitHubRepositoriesDetails.ps1 -Force
            Export-GitHubRepositoriesDetails -ConfigurationFilePath ".\Configuration\GitHubRepositoriesSearchCriteria.json" -OutputFilePath ".\Data\GitHubRepositoriesDetails.json"
                createdAt           : 02/24/2021 22:16:04
                description         : Contains curated community Microsoft Power App samples
                fullName            : pnp/powerapps-samples
                hasIssues           : True
                homepage            : https://aka.ms/powerplatform-samples
                language            : 
                license             : @{key=mit; name=MIT License; url=https://api.github.com/licenses/mit}
                name                : powerapps-samples
                openIssuesCount     : 27
                owner               : @{id=MDEyOk9yZ2FuaXphdGlvbjMxNDQzOTI5; is_bot=False; login=pnp; type=Organization; url=https://github.com/pnp}
                updatedAt           : 09/08/2023 16:33:49
                url                 : https://github.com/pnp/powerapps-samples
                watchersCount       : 319
                hasGoodFirstIssues  : False
                hasHelpWantedIssues : True    
    #>

    [CmdletBinding()]
    [OutputType([psobject])]
    Param(
        # The path to the configuration file containing the topics to search for.
        [Parameter(Mandatory = $true)]
        [string]$ConfigurationFilePath,

        # The path to the JSON file where the results of the search will be exported.
        [Parameter(Mandatory = $true)]
        [string]$OutputFilePath
    )

    Process{
        # Validate the existence of the configuration file
        if (-not (Test-Path -Path $ConfigurationFilePath)) {
            Throw "Not configuration file found at the path '$ConfigurationFilePath'."
        }

        # Read the configuration file
        $repositoriesSearchCriteria = Get-Content -Path $ConfigurationFilePath -Raw | ConvertFrom-Json

        # Initialize an empty array to store the results
        $repositoriesDetails = @()

        # Go through the topics in the configuration file
        foreach ($repositoriesSearchCriterion in $repositoriesSearchCriteria) {
            # Search GitHub repositories based on the topic and the search limit defined in the configuration file
            $repositoriesFound = Search-GitHubRepositories -Topic $repositoriesSearchCriterion.Topic -SearchLimit $repositoriesSearchCriterion.SearchLimit
            
            # Add these repositories to the array of results
            $repositoriesDetails += $repositoriesFound
        }

        # Remove duplicates from the array of results
        #$repositoriesDetails = $repositoriesDetails | Select-Object -Unique
        $repositoriesDetails = $repositoriesDetails | Sort-Object -Property fullName | Get-Unique -AsString

        # Sort the array of results by the value of the watchersCount property in the descendant order of the repository
        $repositoriesDetails = $repositoriesDetails | Sort-Object -Property watchersCount -Descending

        # Export the results to a JSON file
        $repositoriesDetails | ConvertTo-Json | Out-File -FilePath $OutputFilePath

        # Return the results
        $repositoriesDetails
    }
}