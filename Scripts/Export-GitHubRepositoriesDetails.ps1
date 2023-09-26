function Export-GitHubRepositoriesDetails {
    <#
        .SYNOPSIS
            Search GitHub repositories for topics defined in a configuration file.

        .DESCRIPTION
            Go through the topics in a configuration file to retrieve GitHub repositories and key details.
            Combine and remove duplicates from the results of the search and export the results to a JSON file.
            For storage consumption and performance reasons, the results are filtered to keep only the repositories respecting the following conditions:
                - have at least 10 stars or at least 10 watchers
                - have been updated in the last 6 months
                - is not archived

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
                createdAt               : 08/24/2021 06:56:19
                description             : Client Application to subscribe Business Central Webhooks
                fullName                : msnraju/business-central-webhooks
                hasIssues               : True
                homepage                : https://www.msnjournals.com/post/all-you-need-to-know-about-business-central-webhooks
                language                : JavaScript
                license                 : @{key=mit; name=MIT License; url=https://api.github.com/licenses/mit}
                name                    : business-central-webhooks
                openIssuesCount         : 0
                owner                   : @{id=MDQ6VXNlcjE3Nzg0MjU5; is_bot=False; login=msnraju; type=User; url=https://github.com/msnraju}
                updatedAt               : 06/01/2023 15:36:44
                url                     : https://github.com/msnraju/business-central-webhooks
                hasGoodFirstIssues      : False
                hasHelpWantedIssues     : False
                codeOfConduct           :
                forkCount               : 1
                fundingLinks            : {}
                isSecurityPolicyEnabled : False
                isTemplate              : False
                latestRelease           :
                primaryLanguage         : @{name=JavaScript}
                securityPolicyUrl       :
                stargazerCount          : 4
                watchers                : @{totalCount=1}
                topics                  : {business-central, dynamics365, webhooks, nodejs…}
                languages               : {JavaScript, HTML}
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
            # Check the consumption of the GitHub API rate limit - Search
            $githubApiRateLimit = gh api /rate_limit | ConvertFrom-Json
            $githubApiSearchConsumptionPercentage = [math]::Round(($githubApiRateLimit.resources.search.used / $githubApiRateLimit.resources.search.limit) * 100, 2)

            # If the consumption of the GitHub API Search is greater than 80%, wait for 2 minutes
            if ($githubApiSearchConsumptionPercentage -gt 80) {
                Write-Warning -Message "The consumption of the GitHub API Search is greater than 60% ($($githubApiSearchConsumptionPercentage)%) - waiting for 2 minutes."
                Start-Sleep -Seconds 120
            }

            # Search GitHub repositories based on the topic and the search limit defined in the configuration file
            $repositoriesFound = Search-GitHubRepositories -Topic $repositoriesSearchCriterion.Topic -SearchLimit $repositoriesSearchCriterion.SearchLimit

            # If number of repositories found is equal to the search limit, write a warning
            if ($repositoriesFound.count -eq $repositoriesSearchCriterion.SearchLimit) {
                Write-Warning -Message "The number of repositories found for the topic '$($repositoriesSearchCriterion.Topic)' is equal to the search limit of $($repositoriesSearchCriterion.SearchLimit)."
            } else {
                Write-Verbose "Number of repositories found for the topic '$($repositoriesSearchCriterion.Topic)': $($repositoriesFound.count) / $($repositoriesSearchCriterion.SearchLimit)"
            }

            # Add these repositories to the array of results
            $repositories += $repositoriesFound
        }

        # Validate the number of objects in the array of results before removing duplicates and write this count as verbose
        Write-Verbose -Message "Total number of repositories found: $($repositories.count)"

        # Remove duplicates from the array of results
        $repositories = $repositories | Sort-Object -Property fullName | Get-Unique -AsString

        # Validate the number of objects in the array of results after removing duplicates and write this count as verbose
        Write-Verbose -Message "Number of repositories after removing duplicates: $($repositories.count)"

        # Filter the array of results to keep only the repositories respecting the following conditions:
        # - have been updated in the last 6 months
        # - is not archived
        $repositories = $repositories | Where-Object { $_.isArchived -eq $false -and $_.updatedAt -gt (Get-Date).AddMonths(-6) }

        # For each repository in the array of results, get the details
        foreach ($repository in $repositories) {
            # Check the consumption of the GitHub API rate limit - GraphQL and Core
            $githubApiRateLimit = gh api /rate_limit | ConvertFrom-Json
            $githubApiGraphQlConsumptionPercentage = [math]::Round(($githubApiRateLimit.resources.graphql.used / $githubApiRateLimit.resources.graphql.limit) * 100, 2)
            $githubApiCoreConsumptionPercentage = [math]::Round(($githubApiRateLimit.resources.core.used / $githubApiRateLimit.resources.core.limit) * 100, 2)

            # If the consumption of the GitHub API GraphQL or Core is greater than 80%, wait for 60 minutes
            if ($githubApiGraphQlConsumptionPercentage -gt 80 -or $githubApiCoreConsumptionPercentage -gt 80) {
                Write-Warning -Message "The consumption of the GitHub API GraphQL ($($githubApiGraphQlConsumptionPercentage)%) or Core is greater than 80% ($($githubApiCoreConsumptionPercentage)%) - waiting for 60 minutes."
                Start-Sleep -Seconds 3600
            }

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

        # Filter the array of results to keep only the repositories respecting the following conditions:
        # - have been updated in the last 6 months
        $repositoriesWithDetails = $repositoriesWithDetails | Where-Object { $_.stargazerCount -ge 10 -or $_.watchers.totalCount -ge 10 }

        # Validate the number of objects in the array of results after filtering and write this count as verbose
        Write-Verbose -Message "Number of repositories after filtering: $($repositoriesWithDetails.count)"

        # Sort the array of results by the value of the watchersCount property in the descendant order of the repository
        $repositoriesWithDetails = $repositoriesWithDetails | Sort-Object -Property stargazerCount -Descending

        # Initialize the parent folder of the output file path if it does not exist
        $parentFolder = Split-Path -Path $OutputFilePath -Parent
        if (-not (Test-Path -Path $parentFolder)) {
            New-Item -Path $parentFolder -ItemType Directory
        }

        # Export the results to a JSON file
        $repositoriesWithDetails | ConvertTo-Json -Depth 4 | Out-File -FilePath $OutputFilePath

        # Return the results
        $repositoriesWithDetails
    }
}