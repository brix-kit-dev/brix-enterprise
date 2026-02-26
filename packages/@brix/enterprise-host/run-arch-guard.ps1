<#
.SYNOPSIS
    Run Architecture Guard for shinwa-host-assembly repository
#>
param([switch]$StopOnFirstFailure)

Import-Module "$PSScriptRoot\..\scripts\ArchGuard.psm1" -Force

$Modules = @(
    @{ Path = "host-shell-standalone"; Profile = "HostProfile"; Layer = "Host" }
    @{ Path = "host-shell-embedded"; Profile = "HostProfile"; Layer = "Host" }
)

$Result = Invoke-ArchitectureGuard `
    -Modules $Modules `
    -BasePath $PSScriptRoot `
    -RepoName "shinwa-host-assembly" `
    -ReportPath "$PSScriptRoot\arch-guard-report.md" `
    -StopOnFirstFailure:$StopOnFirstFailure

exit $Result.ExitCode
