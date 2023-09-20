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
        $repositoriesOpenedToContributions = $repositoriesDetails | Where-Object { $_.hasGoodFirstIssues -eq $true -or $_.hasHelpWantedIssues -eq $true }

        # Order the list of repositories opened to contributions by the number of opened to contribution issues descendant
        $repositoriesOpenedToContributionsSorted = $repositoriesOpenedToContributions | Sort-Object -Property openedToContributionsIssues -Descending

        # Prepare the list of repositories opened to contributions for the conversion in a markdown table
        $repositoriesOpenedToContributionsPrepared = $repositoriesOpenedToContributionsSorted | Select-Object `
            @{Name="Name";Expression={"[" + $_.fullName + "](" + $_.url + ")"}}, `
            @{Name="Description";Expression={$_.description}}, `
            @{Name="Language";Expression={$_.language}}, `
            @{Name="License";Expression={if ([string]::IsNullOrEmpty($_.license.name)) { "No license" } else{ $_.license.name }}}, `
            @{Name="Issues";Expression={(New-ShieldIoBadge -AlternativeText "Good First Issues Badge" -Message "Good First Issues" -Label $_.openedGoodFirstIssues -Color "green" -OutputFormat "Markdown") + " " + (New-ShieldIoBadge -AlternativeText "Help Wanted Issues Badge" -Message "Help Wanted Issues" -Label $_.openedHelpWantedIssues -Color "blue" -OutputFormat "Markdown")}}, `
            @{Name="Code of Conduct";Expression={ if ($null -eq $_.codeOfConduct) { "No code of conduct" } else { "[Code of Conduct](" + $_.codeOfConduct.url + ")" }}}, `
            @{Name="Security Policy";Expression={if ($_.isSecurityPolicyEnabled -eq $false) { "No security policy" } else { "[Security Policy](" + $_.securityPolicyUrl + ")" }}}, `
            @{Name="Latest Release";Expression={ if ($null -eq $_.latestRelease) { "No release" } else { "[" + $_.latestRelease.name + "](" + $_.latestRelease.url + ")" }}}, `
            @{Name="Popularity";Expression={(New-ShieldIoBadge -AlternativeText "Stars Badge" -Message "Stars" -Label $_.stargazerCount -Color "yellow" -OutputFormat "Markdown") + " " + (New-ShieldIoBadge -AlternativeText "Watchers Badge" -Message "Watchers" -Label $_.watchers.totalCount -Color "orange" -OutputFormat "Markdown")}}, `
            @{Name="Topics";Expression={($_.topics | ForEach-Object { New-ShieldIoBadge -AlternativeText "$_ Badge" -Message "$_" -OutputFormat "Markdown" }) -join " "}}

        # Convert the list of repositories opened to contributions in a markdown table
        $repositoriesOpenedToContributionsTable = $repositoriesOpenedToContributionsPrepared | ConvertTo-MarkdownTable

        # Update the content of the section with the list of repositories opened to contributions
        Write-MarkdownSection -MarkdownFilePath ".\README.md" -SectionIdentifier "repositories-opened-to-contribution" -SectionContent $repositoriesOpenedToContributionsTable.ToString()

        $repositoriesOpenedToContributionsTable
    }
}