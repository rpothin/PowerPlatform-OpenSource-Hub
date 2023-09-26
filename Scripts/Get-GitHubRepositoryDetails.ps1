function Get-GitHubRepositoryDetails {
    <#
        .SYNOPSIS
            Retrieve details of a GitHub repository.

        .DESCRIPTION
            Using GitHub CLI combined with the GitHub API, this function retrieves details of a GitHub repository.

        .PARAMETER RepositoryFullName
            The full name (organization/repository) of the GitHub repository to retrieve details for.

        .INPUTS
            None. You cannot pipe objects to Get-GitHubRepositoryDetails.

        .OUTPUTS
            Object. This script returns the details of the considered GitHub repository.

        .EXAMPLE
            Import-Module .\Scripts\Get-GitHubRepositoryDetails.ps1 -Force
            Get-GitHubRepositoryDetails -RepositoryFullName "sampleUser/sampleRepo"
                codeOfConduct           : @{key=sample_key; name=Sample Name; url=https://github.com/sampleUser/sampleRepo/blob/Dev/CODE_OF_CONDUCT.md}
                forkCount               : 123
                fundingLinks            : {}
                isSecurityPolicyEnabled : True
                isTemplate              : False
                languages               : {@{size=1234567; node=}, @{size=123; node=}, @{size=123; node=}, @{size=123; node=}…}
                latestRelease           : @{name=Release 1.2.3; tagName=1.2.3; url=https://github.com/sampleUser/sampleRepo/releases/tag/1.2.3; publishedAt=01/01/2022 12:00:00}
                primaryLanguage         : @{name=SampleLanguage}
                securityPolicyUrl       : https://github.com/sampleUser/sampleRepo/security/policy
                stargazerCount          : 123
                watchers                : @{totalCount=12}
                topics                  : {topic1, topic2, topic3, topic4…}
                hasGoodFirstIssues      : False
                openedGoodFirstIssues   : 0
                hasHelpWantedIssues     : True
                openedHelpWantedIssues  : 1
                openedToContributionsIssues  : 1
                popularityScore         : 135
    #>

    [CmdletBinding()]
    [OutputType([psobject])]
    Param(
        # The full name (organization/repository) of the GitHub repository to retrieve details for.
        [Parameter(Mandatory = $true)]
        [string]$RepositoryFullName
    )

    Process{
        # Validate the format of the repository full name
        if ($RepositoryFullName -notmatch "^[a-zA-Z0-9-_.]+/[a-zA-Z0-9-_.]+$") {
            Throw "The repository full name '$RepositoryFullName' is not valid."
        }

        # Initialize the repository details object
        $repositoryDetails = [PSCustomObject]@{}

        # Initialize an array to store the languages of the repository
        $repositoryLanguages = @()

        # Validate the existence of the repository and get a first round of details
        $repositoryDetails = gh repo view $RepositoryFullName --json codeOfConduct,forkCount,fundingLinks,isSecurityPolicyEnabled,isTemplate,latestRelease,primaryLanguage,securityPolicyUrl,stargazerCount,watchers 2>&1

        # If the repository does not exist, add an error message to the repository details object
        if ($repositoryDetails -is [System.Management.Automation.ErrorRecord]) {
            $repositoryDetails = New-Object PSObject # In that case we need to create a new object to be able to add the error message because the object returned by the GitHub CLI is not a PSObject

            $errorMessage = "The repository '$RepositoryFullName' does not exist."
            $repositoryDetails | Add-Member -MemberType NoteProperty -Name "error" -Value $errorMessage
        }
        # If the repository exists, get its topics and add them to the repository details object
        else {
            $repositoryTopics = gh api repos/$RepositoryFullName/topics | ConvertFrom-Json
            $repositoryLanguagesTemp = gh api repos/$RepositoryFullName/languages | ConvertFrom-Json

            # Convert the object from JSON to PSObject to be able to add the topics
            $repositoryDetails = $repositoryDetails | ConvertFrom-Json

            $repositoryDetails | Add-Member -MemberType NoteProperty -Name "topics" -Value $repositoryTopics.names

            $repositoryLanguagesTemp.PSObject.Properties | ForEach-Object {
                # Add the current name to the array of languages
                $repositoryLanguages += $_.Name
            }

            $repositoryDetails | Add-Member -MemberType NoteProperty -Name "languages" -Value $repositoryLanguages

            # Get the number of good first issues for the repository
            $repositoryGoodFirstIssuesAsJson = gh issue list --repo $($RepositoryFullName) --state open --label "good first issue" --json number,title

            # Management of the case where considered repository has disabled issues - output of the previous command 'repository has disabled issues'
            if ($?) {
                $repositoryGoodFirstIssues = $repositoryGoodFirstIssuesAsJson | ConvertFrom-Json
                $repositoryDetails | Add-Member -MemberType NoteProperty -Name openedGoodFirstIssues -Value $repositoryGoodFirstIssues.count

                if ($repositoryGoodFirstIssues.count -gt 0) {
                    $repositoryDetails | Add-Member -MemberType NoteProperty -Name hasGoodFirstIssues -Value $true
                }
                else {
                    $repositoryDetails | Add-Member -MemberType NoteProperty -Name hasGoodFirstIssues -Value $false
                }

                # Get the number of help wanted issues for the repository
                $repositoryHelpWantedIssues = gh issue list --repo $($RepositoryFullName) --state open --label "help wanted" --json number,title | ConvertFrom-Json
                $repositoryDetails | Add-Member -MemberType NoteProperty -Name openedHelpWantedIssues -Value $repositoryHelpWantedIssues.count

                if ($repositoryHelpWantedIssues.count -gt 0) {
                    $repositoryDetails | Add-Member -MemberType NoteProperty -Name hasHelpWantedIssues -Value $true
                }
                else {
                    $repositoryDetails | Add-Member -MemberType NoteProperty -Name hasHelpWantedIssues -Value $false
                }
            } else {
                $repositoryDetails | Add-Member -MemberType NoteProperty -Name openedGoodFirstIssues -Value 0
                $repositoryDetails | Add-Member -MemberType NoteProperty -Name hasGoodFirstIssues -Value $false
                $repositoryDetails | Add-Member -MemberType NoteProperty -Name openedHelpWantedIssues -Value 0
                $repositoryDetails | Add-Member -MemberType NoteProperty -Name hasHelpWantedIssues -Value $false
            }

            $repositoryDetails | Add-Member -MemberType ScriptProperty -Name openedToContributionsIssues -Value {$this.openedGoodFirstIssues + $this.openedHelpWantedIssues}
            $repositoryDetails | Add-Member -MemberType ScriptProperty -Name popularityScore -Value {$this.stargazerCount + $this.watchers.totalCount}
        }

        # Return the details of the GitHub repository
        $repositoryDetails
    }
}