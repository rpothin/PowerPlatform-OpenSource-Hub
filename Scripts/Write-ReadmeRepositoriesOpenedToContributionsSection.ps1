function Write-ReadmeRepositoriesOpenedToContributionsSection {
    <#
        .SYNOPSIS
            Replace the content of the section with the list of repositories opened to contributions in the README file.

        .DESCRIPTION
            Replace the content of the section with the list of repositories opened to contributions in the README file.

        .PARAMETER GitHubRepositoriesDetails
            Details of the GitHub Repositories.

        .INPUTS
            None. You cannot pipe objects to Write-ReadmeRepositoriesOpenedToContributionsSection.

        .OUTPUTS
            None. This script return the content of the section with the list of repositories opened to contributions as a string.

        .EXAMPLE
            Import-Module .\Scripts\Write-MarkdownSection.ps1 -Force
            Import-Module .\Scripts\New-ShieldIoBadge.ps1 -Force
            Import-Module .\Scripts\ConvertTo-MarkdownTable.ps1 -Force
            Import-Module .\Scripts\Write-ReadmeRepositoriesOpenedToContributionsSection.ps1 -Force
            Write-ReadmeRepositoriesOpenedToContributionsSection -GitHubRepositoriesDetails $GitHubRepositoriesDetails
                |Name|Language|Good First Issues|Help Wanted Issues|Topics|
                |----|--------|-----------------|------------------|------|
                |[OfficeDev/microsoft-teams-apps-requestateam](https://github.com/OfficeDev/microsoft-teams-apps-requestateam)|PowerShell|![Good First Issues Badge](https://img.shields.io/badge/17-green)|![Help Wanted Issues Badge](https://img.shields.io/badge/30-blue)|![microsoft Badge](https://img.shields.io/badge/microsoft-C4A0B2) ![microsoftteams Badge](https://img.shields.io/badge/microsoftteams-4F9BFB) ![powerapps Badge](https://img.shields.io/badge/powerapps-8C7127) ![powerautomate Badge](https://img.shields.io/badge/powerautomate-9FA7B5) ![logicapps Badge](https://img.shields.io/badge/logicapps-6343B2) ![azure Badge](https://img.shields.io/badge/azure-3B645D)|
    #>

    [CmdletBinding()]
    [OutputType([string])]
    param (
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.Object[]]$GitHubRepositoriesDetails
    )

    Process {
        # Get the list of repositories opened to contributions - with good first issues or help wanted issues
        $repositoriesOpenedToContributions = $GitHubRepositoriesDetails | Where-Object { $_.hasGoodFirstIssues -eq $true -or $_.hasHelpWantedIssues -eq $true }

        # Order the list of repositories opened to contributions by the number of opened to contribution issues descendant
        $repositoriesOpenedToContributionsSorted = $repositoriesOpenedToContributions | Sort-Object -Property openedToContributionsIssues -Descending

        # Prepare the list of repositories opened to contributions for the conversion in a markdown table
        $repositoriesOpenedToContributionsPrepared = $repositoriesOpenedToContributionsSorted | Select-Object `
            @{Name="Name";Expression={"[" + $_.fullName + "](" + $_.url + ")"}}, `
            @{Name="Language";Expression={$_.language}}, `
            @{Name="Good First Issues";Expression={New-ShieldIoBadge -AlternativeText "Good First Issues Badge" -Message $_.openedGoodFirstIssues -Color "green" -OutputFormat "Markdown"}}, `
            @{Name="Help Wanted Issues";Expression={New-ShieldIoBadge -AlternativeText "Help Wanted Issues Badge" -Message $_.openedHelpWantedIssues -Color "blue" -OutputFormat "Markdown"}}, `
            @{Name="Topics";Expression={($_.topics | ForEach-Object { New-ShieldIoBadge -AlternativeText "$_ Badge" -Message "$_" -OutputFormat "Markdown" }) -join " "}}

        # Convert the list of repositories opened to contributions in a markdown table as array
        $repositoriesOpenedToContributionsTableAsArray = $repositoriesOpenedToContributionsPrepared | ConvertTo-MarkdownTable

        # Convert the list of repositories opened to contributions in a markdown table as string
        $repositoriesOpenedToContributionsTable = $repositoriesOpenedToContributionsTableAsArray -join "`n"

        # If the content of the section with the list of repositories opened to contribution is empty, replace it with 'List on its way...🐌'
        if ([string]::IsNullOrWhiteSpace($repositoriesOpenedToContributionsTable)) {
            $repositoriesOpenedToContributionsTable = "List on its way...🐌"
        }

        # Update the content of the section with the list of repositories opened to contributions
        Write-MarkdownSection -MarkdownFilePath ".\README.md" -SectionIdentifier "repositories-opened-to-contribution" -SectionContent $repositoriesOpenedToContributionsTable

        $repositoriesOpenedToContributionsTable
    }
}