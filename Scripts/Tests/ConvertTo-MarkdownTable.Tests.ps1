# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\ConvertTo-MarkdownTable.Tests.ps1

# Set a global variable with the path of the executing script
$executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import ConvertTo-MarkdownTable function
    Import-Module $executingTestPath/../ConvertTo-MarkdownTable.ps1 -Force
}

Describe "ConvertTo-MarkdownTable Unit Tests" {
    Context "Parameters validation" {
        It "Should throw an error if InputObject parameter is not valid" {
            $inputObject = "invalid object"
            $result = { $inputObject | ConvertTo-MarkdownTable } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "The input object is not of type 'PSCustomObject'."
        }

        It "Should throw an error if InputObject parameter is empty" {
            $emptyObject = New-Object PSObject
            { $emptyObject | ConvertTo-MarkdownTable } | Should -Throw "The input object is empty."
        }
    }

    Context "Valid execution" {
        It "Should return markdown table with headers and 1 row for 1 object" {
            $inputObject = [PSCustomObject]@{
                Property1 = "Value1"
                Property2 = "Value2"
                Property3 = "Value3"
            }
            $result = $inputObject | ConvertTo-MarkdownTable
            $result | Should -Be @('|Property1|Property2|Property3|', '|---------|---------|---------|', '|Value1|Value2|Value3|')
        }

        It "Should return markdown table with headers and 3 row2 for an array of 3 objects" {
            $inputObject = @(
                [PSCustomObject]@{
                    Property1 = "Value1"
                    Property2 = "Value2"
                    Property3 = "Value3"
                },
                [PSCustomObject]@{
                    Property1 = "Value1"
                    Property2 = "Value2"
                    Property3 = "Value3"
                },
                [PSCustomObject]@{
                    Property1 = "Value1"
                    Property2 = "Value2"
                    Property3 = "Value3"
                }
            )
            $result = $inputObject | ConvertTo-MarkdownTable
            $result | Should -Be @('|Property1|Property2|Property3|', '|---------|---------|---------|', '|Value1|Value2|Value3|', '|Value1|Value2|Value3|', '|Value1|Value2|Value3|')
        }
    }
}