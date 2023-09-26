function ConvertTo-MarkdownTable {
    <#
        .SYNOPSIS
            Convert the content of an object as a markdown table.

        .DESCRIPTION
            Create a markdown table from the content of an object as an array where each row is a line of the table.
            The properties names are used as the headers of the table and the values as the rows.

        .PARAMETER InputObject
            The object to convert to a markdown table.

        .INPUTS
            This function accepts an object as an input.

        .OUTPUTS
            String. This function returns a string containing the markdown table.

        .EXAMPLE
            Import-Module .\Scripts\ConvertTo-MarkdownTable.ps1 -Force
            $object | ConvertTo-MarkdownTable
                | Property1 | Property2 | Property3 |
                | --------- | --------- | --------- |
                | Value1    | Value2    | Value3    |
                | Value1    | Value2    | Value3    |
    #>

    [CmdletBinding()]
    [OutputType([string])]
    Param(
        # The object to convert to a markdown table.
        [Parameter(Mandatory = $true, ValueFromPipeline = $true, Position = 0)]
        [psobject]$InputObject
    )

    Begin {
        # Initialize variables
        $headersDone = $false
        $pattern = '(?<!\\)\|'  # escape every '|' unless already escaped
    }

    Process {
        # Check that the input object is of type psobject
        if ($InputObject.GetType().Name -ne 'PSCustomObject') {
            throw "The input object is not of type 'PSCustomObject'."
        }

        # Check that the input object is not empty
        $inputObjectAsJson = $InputObject | ConvertTo-Json
        if ($inputObjectAsJson -eq "{}" -or $inputObjectAsJson -eq "[]") {
            throw "The input object is empty."
        }

        # If the headers are not configured yet, configure them
        if (!$headersDone) {
            $headersDone = $true

            # Configure the headers
            '|{0}|' -f (($_.PSObject.Properties.Name -replace $pattern, '\|') -join '|')
            '|{0}|' -f (($_.PSObject.Properties.Name -replace '.', '-') -join '|')
        }

        # Configure the rows
        '|{0}|' -f (($_.PsObject.Properties.Value -replace $pattern, '\|') -join '|')
    }
}