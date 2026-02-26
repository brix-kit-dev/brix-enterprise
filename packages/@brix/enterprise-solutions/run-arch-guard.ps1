<#
.SYNOPSIS
    Run Architecture Guard for shinwa-solutions repository
#>
param([switch]$StopOnFirstFailure)

Import-Module "$PSScriptRoot\..\scripts\ArchGuard.psm1" -Force

$Modules = @(
    @{ Path = "shinwa-app-booking\booking-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-identity\identity-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-messenger\messenger-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-carousel\carousel-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-partners\partners-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-products\products-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-storage\storage-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-contracts\contracts-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-case\case-core"; Profile = "PluginProfile"; Layer = "Plugins" }
    @{ Path = "shinwa-app-intake\intake-core"; Profile = "PluginProfile"; Layer = "Plugins" }
)

$Result = Invoke-ArchitectureGuard `
    -Modules $Modules `
    -BasePath $PSScriptRoot `
    -RepoName "shinwa-solutions" `
    -ReportPath "$PSScriptRoot\arch-guard-report.md" `
    -StopOnFirstFailure:$StopOnFirstFailure

exit $Result.ExitCode
