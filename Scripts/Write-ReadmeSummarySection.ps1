function Write-ReadmeSummarySection {
    <#
        .SYNOPSIS
            Replace the content of the summary section of the README file.

        .DESCRIPTION
            Replace the content of the summary section of the README file with insights from the GitHub repositories details.

        .PARAMETER GitHubRepositoriesDetails
            Details of the GitHub Repositories.

        .PARAMETER Topics
            List of topics considered to search GitHub repositories.

        .INPUTS
            None. You cannot pipe objects to Write-ReadmeSummarySection.

        .OUTPUTS
            None. This script return the content of the summary section as a string.

        .EXAMPLE
            Import-Module .\Scripts\Write-MarkdownSection.ps1 -Force
            Import-Module .\Scripts\New-ShieldIoBadge.ps1 -Force
            Import-Module .\Scripts\Write-ReadmeSummarySection.ps1 -Force
            Write-ReadmeSummarySection -GitHubRepositoriesDetails $GitHubRepositoriesDetails -Topics $Topics
    #>

    [CmdletBinding()]
    [OutputType([string])]
    param (
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.Object[]]$GitHubRepositoriesDetails,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.Object[]]$Topics
    )

    Process {
        # Get the number of repositories referenced
        $repositoriesCount = $GitHubRepositoriesDetails.count

        # Get the number of referenced repositories updated in the last 30 days
        $repositoriesUpdatedInTheLast30DaysCount = $GitHubRepositoriesDetails | Where-Object { $_.updatedAt -gt (Get-Date).AddDays(-30) } | Measure-Object | Select-Object -ExpandProperty Count

        # Get the number of opened good first issues in the referenced repositories
        $openedGoodFirstIssuesCount = $GitHubRepositoriesDetails | Where-Object { $_.openedGoodFirstIssues -gt 0 } | Measure-Object | Select-Object -ExpandProperty Count

        # Get the number of opened help wanted issues in the referenced repositories
        $openedHelpWantedIssuesCount = $GitHubRepositoriesDetails | Where-Object { $_.openedHelpWantedIssues -gt 0 } | Measure-Object | Select-Object -ExpandProperty Count

        # Get the percentage of referenced repositories with security policy enabled
        $securityPolicyEnabledPercentage = [math]::Round(($GitHubRepositoriesDetails | Where-Object { $_.isSecurityPolicyEnabled -eq $true } | Measure-Object | Select-Object -ExpandProperty Count) / $repositoriesCount * 100)

        # Get the percentage of referenced repositories with a code of conduct based on the fact that the codeOfConduct property is not null
        $codeOfConductEnabledPercentage = [math]::Round(($GitHubRepositoriesDetails | Where-Object { $null -ne $_.codeOfConduct } | Measure-Object | Select-Object -ExpandProperty Count) / $repositoriesCount * 100)

        # Configure summary badges
        $summaryBadgesCentered = "<h3 align='center'>`n"

        $summaryBadgesCentered += "  " + (New-ShieldIoBadge -AlternativeText "Repositories Count Badge" -Message "Repositories" -Label $repositoriesCount -Color "602890" -OutputFormat "HTML") + "`n"
        $summaryBadgesCentered += "  " + (New-ShieldIoBadge -AlternativeText "Active Repositories Count Badge" -Message "Active Repositories" -Label $repositoriesUpdatedInTheLast30DaysCount -Color "A24FBF" -OutputFormat "HTML") + "`n"
        $summaryBadgesCentered += "  " + (New-ShieldIoBadge -AlternativeText "Opened Good First Issues Count Badge" -Message "Good First Issues" -Label $openedGoodFirstIssuesCount -Color "green" -OutputFormat "HTML") + "`n"
        $summaryBadgesCentered += "  " + (New-ShieldIoBadge -AlternativeText "Opened Help Wanted Issues Count Badge" -Message "Help Wanted Issues" -Label $openedHelpWantedIssuesCount -Color "blue" -OutputFormat "HTML") + "`n"
        
        $summaryBadgesCentered += "  <br/>`n"
        
        $summaryBadgesCentered += "  " + (New-ShieldIoBadge -AlternativeText "Security Policy Enabled Percentage Badge" -Message "Security Policy Enabled Percentage" -Label $securityPolicyEnabledPercentage -Color "orange" -OutputFormat "HTML") + "`n"
        $summaryBadgesCentered += "  " + (New-ShieldIoBadge -AlternativeText "Code of Conduct Availability Percentage Badge" -Message "Code of Conduct Availability Percentage" -Label $codeOfConductEnabledPercentage -Color "9F2B63" -OutputFormat "HTML") + "`n"
        
        $summaryBadgesCentered += "</h3>`n`n"

        # Concatenate the topics property in the configuration file as static badges
        foreach ($topic in $Topics)
        {
          $topicName = $topic.topic
          
          $topicBadge = "  " + (New-ShieldIoBadge -AlternativeText "$topicName Badge" -Message $topicName -OutputFormat "HTML") + "`n"
          
          $listOfTopics += $topicBadge
        }

        # Center the list of topics
        $listOfTopicsCentered = "<p align='center'>`n"
        $listOfTopicsCentered += "$listOfTopics"
        $listOfTopicsCentered += "</p>"

        # Summary content composed of the summary badges and the list of topics
        $summaryContent = $summaryBadgesCentered + $listOfTopicsCentered

        Write-MarkdownSection -MarkdownFilePath ".\README.md" -SectionIdentifier "summary" -SectionContent $summaryContent

        $summaryContent
    }
}