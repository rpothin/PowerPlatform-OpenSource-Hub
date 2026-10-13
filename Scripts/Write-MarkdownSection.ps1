function Write-MarkdownSection {
    <#
        .SYNOPSIS
            Replace the content in a section of a Markdown file.

        .DESCRIPTION
            Replace the content in a section of a Markdown file.

        .PARAMETER MarkdownFilePath
            The path to the Markdown file to update.

        .PARAMETER SectionIdentifier
            The identifier of the section to update.

        .PARAMETER SectionContent
            The content to replace the section with.

        .INPUTS
            None. You cannot pipe objects to Write-MarkdownSection.

        .OUTPUTS
            None. This script does not return any objects.

        .EXAMPLE
            Import-Module .\Scripts\Write-MarkdownSection.ps1 -Force
            Write-MarkdownSection -MarkdownFilePath ".\README.md" -SectionIdentifier "GitHubRepositoriesDetails" -SectionContent "This is the content of the section."
    #>

    [CmdletBinding()]
    Param(
        # The path to the Markdown file to update.
        [Parameter(Mandatory = $true)]
        [string]$MarkdownFilePath,

        # The identifier of the section to update.
        [Parameter(Mandatory = $true)]
        [string]$SectionIdentifier,

        # The content to replace the section with.
        [Parameter(Mandatory = $true)]
        [string]$SectionContent
    )

    Process{
        # Validate the existence of the file
        if (-not (Test-Path $MarkdownFilePath)) {
            throw "The file '$MarkdownFilePath' does not exist."
        }

        # Validate the file is a Markdown file
        if ((Get-Item $MarkdownFilePath).Extension -ne ".md") {
            throw "The provided file '$MarkdownFilePath' is not a Markdown file."
        }

        # Initialize start and end balises based on the provided section identifier
        $startBalise = "<!--START_SECTION:$SectionIdentifier-->"
        $endBalise = "<!--END_SECTION:$SectionIdentifier-->"

        # Get the content of the Markdown file
        $markdownFileContent = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $MarkdownFilePath).Path)

        # Validate the existence of the section based on the start and end balises and throw an error if at least one does not exist
        $startMatches = [regex]::Matches($markdownFileContent, [regex]::Escape($startBalise))
        $endMatches = [regex]::Matches($markdownFileContent, [regex]::Escape($endBalise))
        if ($startMatches.Count -ne 1 -or $endMatches.Count -ne 1 -or $endMatches[0].Index -lt ($startMatches[0].Index + $startBalise.Length)) {
            throw "The Markdown file '$MarkdownFilePath' is missing at least one balise for the following section identifier: '$SectionIdentifier--'."
        }

        $lineEnding = if ($markdownFileContent.Contains("`r`n")) { "`r`n" } else { "`n" }
        $normalizedSectionContent = $SectionContent -replace "\r\n?|\n", $lineEnding
        $newSectionContent = "$startBalise$lineEnding$normalizedSectionContent$lineEnding$endBalise"

        $pattern = "(?s)$([regex]::Escape($startBalise)).*?$([regex]::Escape($endBalise))"
        $markdownFileContent = [regex]::Replace(
            $markdownFileContent,
            $pattern,
            [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $newSectionContent },
            [System.Text.RegularExpressions.RegexOptions]::CultureInvariant
        )

        # Write the content to the Markdown file
        [System.IO.File]::WriteAllText(
            (Resolve-Path -LiteralPath $MarkdownFilePath).Path,
            $markdownFileContent,
            [System.Text.UTF8Encoding]::new($false)
        )
    }
}