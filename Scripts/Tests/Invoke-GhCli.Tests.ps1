# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Invoke-GhCli.Tests.ps1

# Set a global variable with the path of the executing script
$global:executingTestPath = Split-Path -Parent $MyInvocation.MyCommand.Path

BeforeAll {
    # Import Invoke-GhCli function
    Import-Module $global:executingTestPath/../Invoke-GhCli.ps1 -Force
}

Describe "Invoke-GhCli Unit Tests" {
    Context "Parameters validation" {
        It "Should throw an error when no arguments are provided" {
            $result = { Invoke-GhCli } | Should -Throw -PassThru
            $result.Exception.Message | Should -Be "No GitHub CLI arguments were provided."
        }
    }

    Context "Retry behavior" {
        BeforeEach {
            Mock Start-Sleep { }
        }

        It "Should return GitHub CLI output when the command succeeds" {
            Mock gh {
                "{ 'ok': true }"
            }

            $result = Invoke-GhCli -Arguments @("api", "/rate_limit")

            $result | Should -Be "{ 'ok': true }"
            Assert-MockCalled gh -Times 1
        }

        It "Should retry transient failures and then return output" {
            $script:attempts = 0
            Mock gh {
                $script:attempts++
                if ($script:attempts -eq 1) {
                    throw "HTTP 502 Bad Gateway"
                }

                "{ 'ok': true }"
            }

            $result = Invoke-GhCli -Arguments @("api", "/rate_limit") -InitialBackoffSeconds 0

            $result | Should -Be "{ 'ok': true }"
            Assert-MockCalled gh -Times 2
            Assert-MockCalled Start-Sleep -Times 1
        }

        It "Should not retry non-transient failures" {
            Mock gh {
                throw "repository not found"
            }

            {
                Invoke-GhCli -Arguments @("repo", "view", "anon/repo") -InitialBackoffSeconds 0
            } | Should -Throw "GitHub CLI command failed after 1 attempt(s): gh repo view anon/repo*"

            Assert-MockCalled gh -Times 1
            Assert-MockCalled Start-Sleep -Times 0
        }

        It "Should stop retrying after the maximum attempt count" {
            Mock gh {
                throw "HTTP 503 Service Unavailable"
            }

            {
                Invoke-GhCli -Arguments @("api", "/rate_limit") -MaximumAttempts 2 -InitialBackoffSeconds 0
            } | Should -Throw "GitHub CLI command failed after 2 attempt(s): gh api /rate_limit*"

            Assert-MockCalled gh -Times 2
            Assert-MockCalled Start-Sleep -Times 1
        }
    }
}
