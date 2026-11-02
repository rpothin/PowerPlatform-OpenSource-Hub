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

        .PARAMETER MetadataOutputFilePath
            Optional. When provided, writes snapshot timestamp and source provenance metadata.

        .PARAMETER SourceCommit
            The source commit SHA. Required when MetadataOutputFilePath is provided.

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
    [OutputType([psobject], [object[]])]
    param (
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$InputFilePath,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$OutputFilePath,

        [Parameter(Mandatory = $false)]
        [string]$MetadataOutputFilePath,

        [Parameter(Mandatory = $false)]
        [ValidatePattern('^[0-9a-fA-F]{40}$')]
        [string]$SourceCommit
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
        $inputJson = Get-Content -Path $InputFilePath -Raw
        $repositories = @(ConvertFrom-Json -InputObject $inputJson)

        # Calculate the popularity score for each repository
        $repositoriesWithPopularityScore = @($repositories | Select-Object fullName, popularityScore)

        # Sort the repositories by popularity score descendant
        $repositoriesWithPopularityScore = @($repositoriesWithPopularityScore | Sort-Object -Property popularityScore -Descending)

        # Export the results in the output file
        $snapshotEntriesJson = @(
            foreach ($repository in $repositoriesWithPopularityScore) {
                ConvertTo-Json -InputObject $repository -Depth 100 -Compress
            }
        )
        $snapshotJson = if ($snapshotEntriesJson.Count -eq 0) {
            "[]"
        } else {
            "[`n  $($snapshotEntriesJson -join ",`n  ")`n]"
        }
        $snapshotJson | Out-File -FilePath $OutputFilePath

        # Write companion metadata file when path is provided
        if ($PSBoundParameters.ContainsKey('MetadataOutputFilePath') -and -not [string]::IsNullOrEmpty($MetadataOutputFilePath)) {
            if ([string]::IsNullOrWhiteSpace($SourceCommit)) {
                throw "A source commit SHA is required when writing snapshot metadata."
            }
            $normalizedInputJson = $inputJson -replace "\r\n?|\n", "`n"
            $inputHashBytes = [System.Text.Encoding]::UTF8.GetBytes($normalizedInputJson)
            $sha256 = [System.Security.Cryptography.SHA256]::Create()
            try {
                $inputHash = $sha256.ComputeHash($inputHashBytes)
            } finally {
                $sha256.Dispose()
            }
            $inputHashHex = -join ($inputHash | ForEach-Object { $_.ToString("x2") })
            $metadata = [PSCustomObject]@{
                _snapshotTakenAt = [System.DateTime]::UtcNow.ToString("o")
                _sourceCommit = $SourceCommit.ToLowerInvariant()
                _sourceSha256 = $inputHashHex
            }
            ConvertTo-Json -InputObject $metadata -Depth 10 | Out-File -FilePath $MetadataOutputFilePath
        }

        $repositoriesWithPopularityScore
    }
}