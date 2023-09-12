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
            Object. This script returns a list of repository objects (with details).

        .EXAMPLE
            Import-Module .\Scripts\Search-GitHubRepositories.ps1 -Force
            Import-Module .\Scripts\Get-GitHubRepositoryDetails.ps1 -Force
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

        # Validate that the output file path is targeting a JSON file
        if (-not ($OutputFilePath -match "\.json$")) {
            Throw "The output file path '$OutputFilePath' is not targeting a JSON file."
        }

        # Read the configuration file
        $repositoriesSearchCriteria = Get-Content -Path $ConfigurationFilePath -Raw | ConvertFrom-Json

        # Initialize an empty array to store the results
        $repositories = @()
        $repositoriesWithDetails = @()

        # Go through the topics in the configuration file
        foreach ($repositoriesSearchCriterion in $repositoriesSearchCriteria) {
            # Search GitHub repositories based on the topic and the search limit defined in the configuration file
            $repositoriesFound = Search-GitHubRepositories -Topic $repositoriesSearchCriterion.Topic -SearchLimit $repositoriesSearchCriterion.SearchLimit

            # If number of repositories found is equal to the search limit, write a warning
            if ($repositoriesFound.count -eq $repositoriesSearchCriterion.SearchLimit) {
                Write-Warning -Message "The number of repositories found for the topic '$($repositoriesSearchCriterion.Topic)' is equal to the search limit of $($repositoriesSearchCriterion.SearchLimit)."
            }
            
            # Add these repositories to the array of results
            $repositories += $repositoriesFound
        }

        # Validate the number of objects in the array of results before removing duplicates and write this count as verbose
        Write-Verbose -Message "Number of repositories found: $($repositories.count)"

        # Remove duplicates from the array of results
        $repositories = $repositories | Sort-Object -Property fullName | Get-Unique -AsString

        # Sort the array of results by the value of the watchersCount property in the descendant order of the repository
        $repositories = $repositories | Sort-Object -Property watchersCount -Descending
        
        # Validate the number of objects in the array of results after removing duplicates and write this count as verbose
        Write-Verbose -Message "Number of repositories after removing duplicates: $($repositories.count)"

        # For each repository in the array of results, get the details
        foreach ($repository in $repositories) {
            $repositoryDetails = Get-GitHubRepositoryDetails -RepositoryFullName $repository.fullName

            # Add the details to the information we already have about the repository
            $combinedRepository = New-Object PSObject
            $repository.PSObject.Properties | ForEach-Object {
                $combinedRepository | Add-Member -NotePropertyName $_.Name -NotePropertyValue $_.Value
            }
            $repositoryDetails.PSObject.Properties | ForEach-Object {
                $combinedRepository | Add-Member -NotePropertyName $_.Name -NotePropertyValue $_.Value
            }

            # Add the combined object to the array
            $repositoriesWithDetails += $combinedRepository
        }

        # Export the results to a JSON file
        $repositoriesWithDetails | ConvertTo-Json | Out-File -FilePath $OutputFilePath

        # Return the results
        $repositoriesWithDetails
    }
}