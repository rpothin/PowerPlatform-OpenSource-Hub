# To execute these tests run the following command from the root of the repository: Invoke-Pester -Script .\Scripts\Tests\Invoke-GhCli.Tests.ps1

Describe "Invoke-GhCli Unit Tests" {
    BeforeAll {
        $executingTestPath = $PSScriptRoot

        # Load Invoke-GhCli function
        . (Join-Path -Path $executingTestPath -ChildPath "..\Invoke-GhCli.ps1")
    }

    Context "Parameters validation" {
        It "Should throw an error when no arguments are provided" {
            try {
                Invoke-GhCli
                throw "Expected Invoke-GhCli to throw."
            }
            catch {
                if ($_.Exception.Message -ne "No GitHub CLI arguments were provided.") {
                    throw "Expected missing-arguments error, got: $($_.Exception.Message)"
                }
            }
        }
    }

    Context "Retry behavior" {
        BeforeEach {
            $script:ghCallCount = 0
            $script:sleepCallCount = 0

            Set-Item -Path Function:\script:Start-Sleep -Value {
                $script:sleepCallCount++
            }
        }

        It "Should return GitHub CLI output when the command succeeds" {
            Set-Item -Path Function:\script:gh -Value {
                $script:ghCallCount++
                "{ 'ok': true }"
            }

            $result = Invoke-GhCli -Arguments @("api", "/rate_limit")

            if ($result -ne "{ 'ok': true }") {
                throw "Expected successful GitHub CLI output."
            }

            if ($script:ghCallCount -ne 1) {
                throw "Expected GitHub CLI to be called once, got $script:ghCallCount."
            }
        }

        It "Should retry transient failures and then return output" {
            $script:attempts = 0
            Set-Item -Path Function:\script:gh -Value {
                $script:ghCallCount++
                $script:attempts++
                if ($script:attempts -eq 1) {
                    throw "HTTP 502 Bad Gateway"
                }

                "{ 'ok': true }"
            }

            $result = Invoke-GhCli -Arguments @("api", "/rate_limit") -InitialBackoffSeconds 0

            if ($result -ne "{ 'ok': true }") {
                throw "Expected successful GitHub CLI output after retry."
            }

            if ($script:ghCallCount -ne 2) {
                throw "Expected GitHub CLI to be called twice, got $script:ghCallCount."
            }

            if ($script:sleepCallCount -ne 1) {
                throw "Expected Start-Sleep to be called once, got $script:sleepCallCount."
            }
        }

        It "Should not retry non-transient failures" {
            Set-Item -Path Function:\script:gh -Value {
                $script:ghCallCount++
                throw "repository not found"
            }

            try {
                Invoke-GhCli -Arguments @("repo", "view", "anon/repo") -InitialBackoffSeconds 0
                throw "Expected Invoke-GhCli to throw."
            }
            catch {
                if ($_.Exception.Message -notmatch "GitHub CLI command failed after 1 attempt\(s\): gh repo view anon/repo") {
                    throw "Expected non-transient failure without retry, got: $($_.Exception.Message)"
                }
            }

            if ($script:ghCallCount -ne 1) {
                throw "Expected GitHub CLI to be called once, got $script:ghCallCount."
            }

            if ($script:sleepCallCount -ne 0) {
                throw "Expected Start-Sleep not to be called, got $script:sleepCallCount."
            }
        }

        It "Should stop retrying after the maximum attempt count" {
            Set-Item -Path Function:\script:gh -Value {
                $script:ghCallCount++
                throw "HTTP 503 Service Unavailable"
            }

            try {
                Invoke-GhCli -Arguments @("api", "/rate_limit") -MaximumAttempts 2 -InitialBackoffSeconds 0
                throw "Expected Invoke-GhCli to throw."
            }
            catch {
                if ($_.Exception.Message -notmatch "GitHub CLI command failed after 2 attempt\(s\): gh api /rate_limit") {
                    throw "Expected max-attempt failure, got: $($_.Exception.Message)"
                }
            }

            if ($script:ghCallCount -ne 2) {
                throw "Expected GitHub CLI to be called twice, got $script:ghCallCount."
            }

            if ($script:sleepCallCount -ne 1) {
                throw "Expected Start-Sleep to be called once, got $script:sleepCallCount."
            }
        }
    }
}
