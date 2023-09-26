function Get-ShieldIoBadge {
    <#
        .SYNOPSIS
            Return a shield.io badge to use in a markdown file.

        .DESCRIPTION
            Return a shield.io badge to use in a markdown file.

        .PARAMETER AlternativeText
            Alternative text for the image of the shield.io badge.

        .PARAMETER Message
            Message of the the shield.io badge.

        .PARAMETER Label
            Label of the the shield.io badge. (optional)

        .PARAMETER Color
            Color of the the shield.io badge. (optional)

        .PARAMETER OutputFormat
            Format of the shield.io badge to return. Accepted values: Markdown, HTML.

        .INPUTS
            None. You cannot pipe objects to Get-ShieldIoBadge.

        .OUTPUTS
            None. This script return a shield.io badge as a string.

        .EXAMPLE
            Import-Module .\Scripts\Get-ShieldIoBadge.ps1 -Force
            Get-ShieldIoBadge -AlternativeText "Static Badge" -Message "any text" -Label "you like" -OutputFormat "Markdown"
                ![Static Badge](https://img.shields.io/badge/any_text-you_like-blue)

        .EXAMPLE
            Import-Module .\Scripts\Get-ShieldIoBadge.ps1 -Force
            Get-ShieldIoBadge -AlternativeText "Static Badge" -Message "just the message" -Color blue -OutputFormat "HTML"
                <img alt="Static Badge" src="https://img.shields.io/badge/just%20the%20message-8A2BE2">
    #>

    [CmdletBinding()]
    [OutputType([string])]
    Param(
        # Alternative text for the image of the shield.io badge.
        [Parameter(Mandatory = $true)]
        [string]$AlternativeText,

        # Message of the the shield.io badge.
        [Parameter(Mandatory = $true)]
        [string]$Message,

        # Label of the the shield.io badge. (optional)
        [Parameter(Mandatory = $false)]
        [string]$Label,

        # Color of the the shield.io badge. (optional)
        [Parameter(Mandatory = $false)]
        [string]$Color,

        # Format of the shield.io badge to return. Accepted values: Markdown, HTML.
        [Parameter(Mandatory = $true)]
        [ValidateSet("Markdown", "HTML")]
        [string]$OutputFormat
    )

    Process {
        # In the message and in the label, replace
        # - spaces with '_'
        # - '_' with '__'
        # - '-' with '--'
        $Message = $Message -replace "_", "__" -replace "-", "--" -replace " ", "_"
        if ($Label) {
            $Label = $Label -replace "_", "__" -replace "-", "--" -replace " ", "_"
        }

        # If no color is provided, generate a random hexadecimal color value
        if (-not $Color) {
            # Generate a random number between 0 and 16777215 (FFFFFF in hexadecimal)
            $randomNumber = Get-Random -Minimum 0 -Maximum 16777215

            # Convert the random number to a hexadecimal color value without the leading #
            $Color = "{0:X6}" -f $randomNumber
        }

        # Initialize the shield.io badge URL
        $shieldIoBadgeUrl = "https://img.shields.io/badge/$Message"

        # Add the label to the shield.io badge URL if provided
        if ($Label) {
            $shieldIoBadgeUrl += "-$Label"
        }

        # Add the color to the shield.io badge URL
        $shieldIoBadgeUrl += "-$Color"

        # Initialize the shield.io badge
        $shieldIoBadge = ""

        # Add the shield.io badge to the output based on the provided output format
        switch ($OutputFormat) {
            "Markdown" {
                $shieldIoBadge = "![${AlternativeText}](${shieldIoBadgeUrl})"
            }
            "HTML" {
                $shieldIoBadge = "<img alt='${AlternativeText}' src='${shieldIoBadgeUrl}'>"
            }
        }

        # Return the shield.io badge
        return $shieldIoBadge
    }
}