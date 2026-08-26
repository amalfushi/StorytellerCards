<#
.SYNOPSIS
Shows the current Storyteller Cards deployment and available Azure releases.

.DESCRIPTION
Reads the configured App Service version, digest, and container image, then
lists the versioned images in Azure Container Registry in newest-first order.
This is a read-only inventory command and does not modify Azure resources.
#>
[CmdletBinding()]
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
$registryName = & az acr list `
    --resource-group $resourceGroupName `
    --query '[0].name' `
    --output tsv
if ($LASTEXITCODE -ne 0 -or -not $registryName) {
    throw "No Azure Container Registry was found in resource group '$resourceGroupName'."
}
$registryName = $registryName.Trim()

$webAppName = & az webapp list `
    --resource-group $resourceGroupName `
    --query '[0].name' `
    --output tsv
if ($LASTEXITCODE -ne 0 -or -not $webAppName) {
    throw "No Azure Web App was found in resource group '$resourceGroupName'."
}
$webAppName = $webAppName.Trim()

$deployedVersion = & az webapp config appsettings list `
    --resource-group $resourceGroupName `
    --name $webAppName `
    --query "[?name=='APP_VERSION'].value | [0]" `
    --output tsv
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the deployed application version.'
}
$deployedVersionText = if ($deployedVersion) { $deployedVersion.Trim() } else { '<none>' }

$deployedDigest = & az webapp config appsettings list `
    --resource-group $resourceGroupName `
    --name $webAppName `
    --query "[?name=='APP_IMAGE_DIGEST'].value | [0]" `
    --output tsv
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the deployed image digest.'
}
$deployedDigestText = if ($deployedDigest) { $deployedDigest.Trim() } else { '<none>' }

$configuredImage = & az webapp config show `
    --resource-group $resourceGroupName `
    --name $webAppName `
    --query linuxFxVersion `
    --output tsv
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the configured App Service image.'
}
$configuredImageText = if ($configuredImage) { $configuredImage.Trim() } else { '<none>' }

Write-Host "Deployed version: $deployedVersionText"
Write-Host "Deployed digest:  $deployedDigestText"
Write-Host "Configured image: $configuredImageText"
Write-Host ''
Write-Host 'Available releases:'
& az acr repository show-tags `
    --name $registryName `
    --repository storyteller-cards `
    --orderby time_desc `
    --detail `
    --output table
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to list release images.'
}
