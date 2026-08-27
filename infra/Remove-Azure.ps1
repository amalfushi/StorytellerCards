<#
.SYNOPSIS
Deletes the temporary personal Azure environment for Storyteller Cards.

.DESCRIPTION
Uses PowerShell confirmation handling before deleting the resource group named
for the deployment prefix. Deleting the group permanently removes App Service,
ACR, release images, and persisted application data, and stops their billing.
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [string] $SubscriptionId,
    [ValidatePattern('^[a-z][a-z0-9-]{2,23}$')]
    [string] $NamePrefix = 'storytellercards'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI is required.'
}

if ($SubscriptionId) {
    & az account set --subscription $SubscriptionId
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to select Azure subscription '$SubscriptionId'."
    }
}

$resourceGroupName = "$NamePrefix-rg"
if ($PSCmdlet.ShouldProcess($resourceGroupName, 'Delete Azure resource group and all contained resources')) {
    & az group delete --name $resourceGroupName --yes
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to delete resource group '$resourceGroupName'."
    }
}
