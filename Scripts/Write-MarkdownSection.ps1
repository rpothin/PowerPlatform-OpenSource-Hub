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
        $markdownFileContent = Get-Content -Path $MarkdownFilePath -Raw

        # Validate the existence of the section based on the start and end balises and throw an error if at least one does not exist
        if ($markdownFileContent -notmatch $startBalise -or $markdownFileContent -notmatch $endBalise) {
            throw "The Markdown file '$MarkdownFilePath' is missing at least one balise for the following section identifier: '$SectionIdentifier--'."
        }

        # Configure the section content with the start and end balises
        $newSectionContent = "$startBalise`n"
        $newSectionContent += "$SectionContent`n"
        $newSectionContent += "$endBalise"

        # Define the regular expression pattern
        $pattern = "(?s)$startBalise.*?$endBalise"

        # Replace the section content in the Markdown file
        $markdownFileContent = $markdownFileContent -replace $pattern, $newSectionContent

        # Write the content to the Markdown file
        $markdownFileContent | Set-Content -Path $MarkdownFilePath
    }
}