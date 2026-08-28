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
    [string] $NamePrefix = 'storytellercards',
    [ValidatePattern('^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$')]
    [string] $WebAppName
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

# Resolve one explicit app, or retain the convenient implicit behavior only
# while the resource group contains exactly one app.
if ($WebAppName) {
    $resolvedWebAppName = & az webapp show `
        --resource-group $resourceGroupName `
        --name $WebAppName `
        --query name `
        --output tsv
    if ($LASTEXITCODE -ne 0 -or -not $resolvedWebAppName) {
        throw "Web app '$WebAppName' was not found in resource group '$resourceGroupName'."
    }
} else {
    $webAppNames = @(
        (& az webapp list `
            --resource-group $resourceGroupName `
            --query '[].name' `
            --output json) | ConvertFrom-Json
    )
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to list Azure Web Apps in resource group '$resourceGroupName'."
    }
    if ($webAppNames.Count -eq 0) {
        throw "No Azure Web App was found in resource group '$resourceGroupName'."
    }
    if ($webAppNames.Count -gt 1) {
        throw "Multiple Azure Web Apps were found in resource group '$resourceGroupName'. Specify -WebAppName."
    }
    $resolvedWebAppName = $webAppNames[0]
}
$resolvedWebAppName = $resolvedWebAppName.Trim()

$deployedVersion = & az webapp config appsettings list `
    --resource-group $resourceGroupName `
    --name $resolvedWebAppName `
    --query "[?name=='APP_VERSION'].value | [0]" `
    --output tsv
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the deployed application version.'
}
$deployedVersionText = if ($deployedVersion) { $deployedVersion.Trim() } else { '<none>' }

$deployedDigest = & az webapp config appsettings list `
    --resource-group $resourceGroupName `
    --name $resolvedWebAppName `
    --query "[?name=='APP_IMAGE_DIGEST'].value | [0]" `
    --output tsv
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the deployed image digest.'
}
$deployedDigestText = if ($deployedDigest) { $deployedDigest.Trim() } else { '<none>' }

$configuredImage = & az webapp config show `
    --resource-group $resourceGroupName `
    --name $resolvedWebAppName `
    --query linuxFxVersion `
    --output tsv
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the configured App Service image.'
}
$configuredImageText = if ($configuredImage) { $configuredImage.Trim() } else { '<none>' }

Write-Host "Web app:         $resolvedWebAppName"
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
