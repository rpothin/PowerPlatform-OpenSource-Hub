function Join-GhCliArguments {
    [CmdletBinding()]
    [OutputType([string])]
    Param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]]$Arguments
    )

    ($Arguments | ForEach-Object {
        if ($_ -match '\s') {
            "'$($_ -replace "'", "''")'"
        }
        else {
            $_
        }
    }) -join " "
}

function Test-GhCliFailureIsTransient {
    [CmdletBinding()]
    [OutputType([bool])]
    Param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Message
    )

    $transientPatterns = @(
        "rate limit",
        "secondary rate",
        "abuse detection",
        "timeout",
        "timed out",
        "temporarily unavailable",
        "connection reset",
        "connection refused",
        "TLS",
        "DNS",
        "HTTP 5\d\d",
        "\b500\b",
        "\b502\b",
        "\b503\b",
        "\b504\b"
    )

    foreach ($pattern in $transientPatterns) {
        if ($Message -match $pattern) {
            return $true
        }
    }

    return $false
}

function Invoke-GhCli {
    <#
        .SYNOPSIS
            Invoke the GitHub CLI with bounded retries for transient failures.
    #>

    [CmdletBinding()]
    [OutputType([string[]])]
    Param(
        [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
        [AllowEmptyCollection()]
        [string[]]$Arguments,

        [Parameter()]
        [ValidateRange(1, 10)]
        [int]$MaximumAttempts = 3,

        [Parameter()]
        [ValidateRange(0, 300)]
        [int]$InitialBackoffSeconds = 2,

        [Parameter()]
        [ValidateRange(0, 900)]
        [int]$MaximumBackoffSeconds = 30
    )

    if ($null -eq $Arguments -or $Arguments.Count -eq 0) {
        throw "No GitHub CLI arguments were provided."
    }

    $attempt = 0
    $commandDisplay = "gh $(Join-GhCliArguments -Arguments $Arguments)"

    do {
        $attempt++
        $LASTEXITCODE = 0
        $output = $null
        $exceptionMessage = $null

        try {
            $output = & gh @Arguments 2>&1
            $exitCode = $LASTEXITCODE
        }
        catch {
            $exitCode = 1
            $exceptionMessage = $_.Exception.Message
            $output = $_
        }

        $outputText = ($output | Out-String).Trim()
        if ($exceptionMessage) {
            $outputText = "$exceptionMessage`n$outputText".Trim()
        }

        $hasErrorRecord = @($output | Where-Object { $_ -is [System.Management.Automation.ErrorRecord] }).Count -gt 0
        if ($exitCode -eq 0 -and -not $hasErrorRecord) {
            return $output
        }

        $failureMessage = if ([string]::IsNullOrWhiteSpace($outputText)) { "GitHub CLI exited with code $exitCode." } else { $outputText }
        $shouldRetry = (Test-GhCliFailureIsTransient -Message $failureMessage) -and ($attempt -lt $MaximumAttempts)

        if (-not $shouldRetry) {
            throw "GitHub CLI command failed after $attempt attempt(s): $commandDisplay`n$failureMessage"
        }

        $backoffSeconds = [Math]::Min($MaximumBackoffSeconds, $InitialBackoffSeconds * [Math]::Pow(2, ($attempt - 1)))
        Write-Warning -Message "Transient GitHub CLI failure on attempt $attempt/$MaximumAttempts for '$commandDisplay'. Retrying in $backoffSeconds second(s). Failure: $failureMessage"
        Start-Sleep -Seconds $backoffSeconds
    } while ($attempt -lt $MaximumAttempts)
}
