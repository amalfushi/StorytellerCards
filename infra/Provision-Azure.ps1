<#
.SYNOPSIS
Provisions the temporary personal Azure infrastructure for Storyteller Cards.

.DESCRIPTION
Selects the requested subscription, generates a Basic authentication password
when one is not supplied, and deploys the Bicep resources for ACR and App
Service. Use -WhatIf to preview changes. This script does not build or deploy an
application release.
#>
[CmdletBinding()]
param(
    [string] $SubscriptionId,
    [string] $Location = 'westus3',
    [ValidatePattern('^[a-z][a-z0-9-]{2,23}$')]
    [string] $NamePrefix = 'storytellercards',
    [ValidateSet('F1', 'B1')]
    [string] $Sku = 'B1',
    [string] $AccessPassword,
    [switch] $WhatIf
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI is required. Install it from https://learn.microsoft.com/cli/azure/install-azure-cli-windows'
}

$accountArguments = @('account', 'show', '--output', 'json')
try {
    $account = (& az @accountArguments) | ConvertFrom-Json
} catch {
    throw 'Azure CLI is not signed in. Run az login, then retry.'
}

if ($SubscriptionId) {
    & az account set --subscription $SubscriptionId
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to select Azure subscription '$SubscriptionId'."
    }
    $account = (& az @accountArguments) | ConvertFrom-Json
}

if (-not $AccessPassword) {
    $passwordBytes = [byte[]]::new(24)
    $randomNumberGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $randomNumberGenerator.GetBytes($passwordBytes)
    } finally {
        $randomNumberGenerator.Dispose()
    }
    $AccessPassword = [Convert]::ToBase64String($passwordBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$templateFile = Join-Path $PSScriptRoot 'main.bicep'
$deploymentName = "storyteller-cards-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$deploymentArguments = @(
    'deployment', 'sub', 'create',
    '--name', $deploymentName,
    '--location', $Location,
    '--template-file', $templateFile,
    '--parameters',
    "namePrefix=$NamePrefix",
    "location=$Location",
    "appServiceSkuName=$Sku",
    "basicAuthPassword=$AccessPassword",
    '--output', 'json'
)

Write-Host "Subscription: $($account.name) ($($account.id))"
Write-Host "SKU:          $Sku"
Write-Host "Location:     $Location"

if ($WhatIf) {
    $deploymentArguments[2] = 'what-if'
    & az @deploymentArguments
    if ($LASTEXITCODE -ne 0) {
        throw 'Azure deployment what-if failed.'
    }
    return
}

$deployment = (& az @deploymentArguments) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    throw 'Azure infrastructure deployment failed.'
}

$outputs = $deployment.properties.outputs
$resourceGroupName = $outputs.resourceGroupName.value
$registryName = $outputs.registryName.value
$webAppName = $outputs.webAppName.value
$webAppUrl = $outputs.webAppUrl.value

Write-Host ''
Write-Host 'Infrastructure provisioning complete.'
Write-Host "Resource group: $resourceGroupName"
Write-Host "Registry:       $registryName"
Write-Host "Web app:        $webAppName"
Write-Host "URL:            $webAppUrl"
Write-Host 'Username:       storyteller'
Write-Host "Password:       $AccessPassword"
Write-Host ''
Write-Host 'Save the password, then build and deploy a release:'
Write-Host '  .\infra\Build-AzureRelease.ps1 -Version <major.minor.patch> -CreateGitTag'
Write-Host '  .\infra\Deploy-AzureRelease.ps1 -Version <major.minor.patch>'
