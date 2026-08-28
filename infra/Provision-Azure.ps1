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
    [ValidatePattern('^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$')]
    [string] $WebAppName,
    [ValidateSet('F1', 'B1')]
    [string] $Sku = 'B1',
    [string] $AccessPassword,
    [switch] $UseExistingInfrastructure,
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

$generatedAccessPassword = -not $AccessPassword
if ($generatedAccessPassword) {
    $characterRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'UI\src\data\characters'
    $characterNames = @(
        Get-ChildItem -Path $characterRoot -Directory |
            ForEach-Object { Get-ChildItem -Path $_.FullName -File -Filter '*.ts' } |
            Where-Object { $_.BaseName -match '^[a-z0-9]{4,}$' } |
            Select-Object -ExpandProperty BaseName -Unique
    )
    if ($characterNames.Count -lt 4) {
        throw "Unable to find at least four character names under '$characterRoot'."
    }

    $randomNumberGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $availableNames = [Collections.Generic.List[string]]::new()
        $availableNames.AddRange([string[]] $characterNames)
        $selectedNames = for ($nameNumber = 0; $nameNumber -lt 4; $nameNumber++) {
            $randomBytes = [byte[]]::new(2)
            $selectionRange = 65536 - (65536 % $availableNames.Count)
            do {
                $randomNumberGenerator.GetBytes($randomBytes)
                $randomValue = [BitConverter]::ToUInt16($randomBytes, 0)
            } while ($randomValue -ge $selectionRange)

            $selectedIndex = $randomValue % $availableNames.Count
            $selectedName = $availableNames[$selectedIndex]
            $availableNames.RemoveAt($selectedIndex)
            $selectedName
        }

        # Four known-list names need extra entropy, so append 40 random Base32 bits.
        $suffixAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        $suffixBytes = [byte[]]::new(8)
        $randomNumberGenerator.GetBytes($suffixBytes)
        $suffix = -join ($suffixBytes | ForEach-Object { $suffixAlphabet[$_ % 32] })
        $AccessPassword = "$($selectedNames -join '-')-$suffix"
    } finally {
        $randomNumberGenerator.Dispose()
    }
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
    "provisionSharedInfrastructure=$((-not $UseExistingInfrastructure).ToString().ToLowerInvariant())",
    "basicAuthPassword=$AccessPassword"
)

# Supplying a web app name creates or updates that app while retaining the
# subscription-specific registry and App Service plan derived from NamePrefix.
if ($WebAppName) {
    $deploymentArguments += "webAppName=$WebAppName"
}
$deploymentArguments += @('--output', 'json')

Write-Host "Subscription: $($account.name) ($($account.id))"
Write-Host "SKU:          $Sku"
Write-Host "Location:     $Location"
if ($WebAppName) {
    Write-Host "Web app:      $WebAppName"
}
Write-Host "Shared infra: $(if ($UseExistingInfrastructure) { 'Reuse existing' } else { 'Create or update' })"

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
if ($generatedAccessPassword) {
    Write-Host "Password:       $AccessPassword"
} else {
    Write-Host 'Password:       supplied value retained (not displayed)'
}
Write-Host ''
if ($generatedAccessPassword) {
    Write-Host 'Save the generated password before continuing.'
}
Write-Host 'Build and deploy a release:'
Write-Host '  .\infra\Build-AzureRelease.ps1 -Version <major.minor.patch> -CreateGitTag'
Write-Host "  .\infra\Deploy-AzureRelease.ps1 -Version <major.minor.patch> -WebAppName '$webAppName'"
