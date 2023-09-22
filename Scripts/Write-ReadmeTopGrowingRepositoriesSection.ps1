function Write-ReadmeTopGrowingRepositoriesSection {
    <#
        .SYNOPSIS
            Replace the content of the section with the list of top growing repositories in the README file.

        .DESCRIPTION
            Replace the content of the section with the list of top growing repositories in the README file.

        .PARAMETER GitHubRepositoriesDetails
            Details of the GitHub Repositories.

        .PARAMETER GitHubRepositoriesPopularityScoresSnapshot
            Snapshot of the popularity score (number of stars + number of watchers) for the referenced GitHub repositories.

        .INPUTS
            None. You cannot pipe objects to Write-ReadmeTopGrowingRepositoriesSection.

        .OUTPUTS
            None. This script return the content of the section with the list of top growing repositories as a string.

        .EXAMPLE
            Import-Module .\Scripts\Write-MarkdownSection.ps1 -Force
            Import-Module .\Scripts\New-ShieldIoBadge.ps1 -Force
            Import-Module .\Scripts\ConvertTo-MarkdownTable.ps1 -Force
            Import-Module .\Scripts\Write-ReadmeTopGrowingRepositoriesSection.ps1 -Force
            Write-ReadmeRepositoriesOpenedToContributionsSection -GitHubRepositoriesDetails $GitHubRepositoriesDetails
                |Name|Language|Stars|Watchers|Topics|
                |----|--------|-----------------|------------------|------|
                |[OfficeDev/microsoft-teams-apps-requestateam](https://github.com/OfficeDev/microsoft-teams-apps-requestateam)|PowerShell|![Stars Badge](https://img.shields.io/badge/17-yellow)|![Watchers Badge](https://img.shields.io/badge/30-orange)|![microsoft Badge](https://img.shields.io/badge/microsoft-C4A0B2) ![microsoftteams Badge](https://img.shields.io/badge/microsoftteams-4F9BFB) ![powerapps Badge](https://img.shields.io/badge/powerapps-8C7127) ![powerautomate Badge](https://img.shields.io/badge/powerautomate-9FA7B5) ![logicapps Badge](https://img.shields.io/badge/logicapps-6343B2) ![azure Badge](https://img.shields.io/badge/azure-3B645D)|
    #>

    [CmdletBinding()]
    [OutputType([string])]
    param (
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.Object[]]$GitHubRepositoriesDetails,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.Object[]]$GitHubRepositoriesPopularityScoresSnapshot
    )

    Process {
        # Add a property to the GitHubRepositoriesDetails object with the popularity score growth based on the corresponding value in the GitHubRepositoriesPopularityScoresSnapshot object
        # If the repository is not present in the GitHubRepositoriesPopularityScoresSnapshot object, the popularity score in the snapshot is considered to be 0
        $repositoriesDetailsWithPopularityScoreGrowth = $GitHubRepositoriesDetails | ForEach-Object {
            $popularityScoreSnapshot = ($GitHubRepositoriesPopularityScoresSnapshot | Where-Object fullName -eq $_.fullName).popularityScore ?? 0
            $popularityScoreGrowth = $popularityScoreSnapshot - $_.popularityScore
            $_ | Add-Member -MemberType NoteProperty -Name popularityScoreGrowth -Value $popularityScoreGrowth
        }

        # Sort the repositories by popularity score growth descendant and keep only the top 10 and keep only those with a popularity score growth strictly greater than 0
        $topGrowingRepositories = $repositoriesDetailsWithPopularityScoreGrowth | Sort-Object popularityScoreGrowth -Descending | Select-Object -First 10 | Where-Object popularityScoreGrowth -gt 0

        # Prepare the list of top growing repositories for the conversion in a markdown table
        $topGrowingRepositoriesPrepared = $topGrowingRepositories | Select-Object `
            @{Name="Name";Expression={"[" + $_.fullName + "](" + $_.url + ")"}}, `
            @{Name="Language";Expression={$_.language}}, `
            @{Name="Stars";Expression={New-ShieldIoBadge -AlternativeText "Stars Badge" -Message $_.stargazerCount -Color "yellow" -OutputFormat "Markdown"}}, `
            @{Name="Watchers";Expression={New-ShieldIoBadge -AlternativeText "Watchers Badge" -Message $_.watchers.totalCount -Color "orange" -OutputFormat "Markdown"}}, `
            @{Name="Topics";Expression={($_.topics | ForEach-Object { New-ShieldIoBadge -AlternativeText "$_ Badge" -Message "$_" -OutputFormat "Markdown" }) -join " "}}

        # Convert the list of top growing repositories in a markdown table as array
        $topGrowingRepositoriesTableAsArray = $topGrowingRepositoriesPrepared | ConvertTo-MarkdownTable

        # Convert the list of top growing repositories in a markdown table as string
        $topGrowingRepositoriesTable = $topGrowingRepositoriesTableAsArray -join "`n"

        # If the content of the section with the list of top growing repositories is empty, replace it with 'List on its way...🐌'
        if ([string]::IsNullOrWhiteSpace($topGrowingRepositoriesTable)) {
            $topGrowingRepositoriesTable = "List on its way...🐌"
        }

        # Update the content of the section with the list of top growing repositories
        Write-MarkdownSection -MarkdownFilePath ".\README.md" -SectionIdentifier "top-growing-repositories" -SectionContent $topGrowingRepositoriesTable

        $topGrowingRepositoriesTable
    }
}