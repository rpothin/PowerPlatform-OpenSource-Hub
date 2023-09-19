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
        $repositoriesOpenedToContributions = $repositoriesOpenedToContributions | Sort-Object -Property openedToContributionsIssues -Descending

        # Select of properties in the list of repositories opened to contributions
        $repositoriesOpenedToContributions = $repositoriesOpenedToContributions | Select-Object @{Name="fullNameAndUrl";Expression={"[" + $_.fullName + "](" + $_.url + ")"}}, description, language, @{Name="licenseAndUrl";Expression={"[" + $_.license.name + "](" + $_.license.url + ")"}}, openedGoodFirstIssues, openedHelpWantedIssues, @{Name="codeOfConductDirectLink";Expression={"[Code of Conduct](" + $_.codeOfConduct.url + ")"}}, @{Name="latestReleaseAndUrl";Expression={"[" + $_.latestRelease.tagName + "](" + $_.latestRelease.url + ")"}}, @{Name="securityPolicy";Expression={if ($_.isSecurityPolicyEnabled -eq $true) {"[" + $_.latestRelease.name + "](" + $_.latestRelease.url + ")"} else {"No"}}}
    }
}