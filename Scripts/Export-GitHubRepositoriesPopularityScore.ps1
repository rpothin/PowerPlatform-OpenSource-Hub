function Export-GitHubRepositoriesPopularityScore {
    <#
        .SYNOPSIS
            Generate a snapshot of the popularity score of GitHub repositories.

        .DESCRIPTION
            For each GitHub repository, calculate a popularity score based on the number of stars, and watchers and save the results in a dedicated JSON file.

        .PARAMETER InputFilePath
            The path to the JSON file with the list of the GitHub Repositories.

        .PARAMETER OutputFilePath
            The path to the JSON file where the results of the calculation will be exported.

        .INPUTS
            None. You cannot pipe objects to Export-GitHubRepositoriesPopularityScore.

        .OUTPUTS
            Object. This script returns a list of repository objects (with details).

        .EXAMPLE
            Import-Module .\Scripts\Export-GitHubRepositoriesPopularityScore.ps1 -Force
            Export-GitHubRepositoriesPopularityScore -InputFilePath ".\Data\GitHubRepositoriesDetails.json" -OutputFilePath ".\Data\GitHubRepositoriesPopularityScoresSnapshot.json"
                fullName                : msnraju/business-central-webhooks
                popularityScore         : 20

                fullName                : msnraju/business-central-webhooks
                popularityScore         : 20
    #>

    [CmdletBinding()]
    [OutputType([psobject])]
    param (
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$InputFilePath,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$OutputFilePath
    )

    Process {
        # Validate the existence of the input file
        if (-not (Test-Path -Path $InputFilePath)) {
            throw "The input file '$InputFilePath' does not exist."
        }

        # Validate that the input file path is targeting a JSON file
        if (-not ($InputFilePath -match "\.json$")) {
            throw "The input file path '$InputFilePath' is not targeting a JSON file."
        }

        # Read the input file
        $repositories = Get-Content -Path $InputFilePath | ConvertFrom-Json

        # Calculate the popularity score for each repository
        $repositoriesWithPopularityScore = $repositories | Select-Object fullName, popularityScore

        # Sort the repositories by popularity score descendant
        $repositoriesWithPopularityScore = $repositoriesWithPopularityScore | Sort-Object -Property popularityScore -Descending

        # Export the results in the output file
        $repositoriesWithPopularityScore | ConvertTo-Json | Out-File -FilePath $OutputFilePath

        $repositoriesWithPopularityScore
    }
}