<#
.SYNOPSIS
Deploys or rolls back Storyteller Cards to an exact release version.

.DESCRIPTION
Resolves the requested ACR version tag to its immutable digest, configures App
Service to run that digest, records the deployed version and digest, enables
container logging, restarts the app, and waits for the health endpoint. Passing
an older retained version performs a rollback without rebuilding it.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^\d+\.\d+\.\d+(-[0-9A-Za-z][0-9A-Za-z.-]*)?$')]
    [string] $Version,
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

$account = (& az account show --output json) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    throw 'Azure CLI is not signed in. Run az login, then retry.'
}

$resourceGroupName = "$NamePrefix-rg"
$registry = (& az acr list `
    --resource-group $resourceGroupName `
    --query '[0].{name:name,loginServer:loginServer}' `
    --output json) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $registry.name) {
    throw "No Azure Container Registry was found in resource group '$resourceGroupName'."
}

$webAppName = & az webapp list `
    --resource-group $resourceGroupName `
    --query '[0].name' `
    --output tsv
if ($LASTEXITCODE -ne 0 -or -not $webAppName) {
    throw "No Azure Web App was found in resource group '$resourceGroupName'."
}
$webAppName = $webAppName.Trim()

$repository = 'storyteller-cards'
$releaseImage = "${repository}:$Version"
$digest = & az acr manifest show-metadata `
    --registry $registry.name `
    --name $releaseImage `
    --query digest `
    --output tsv
if ($LASTEXITCODE -ne 0 -or -not $digest) {
    throw "Release '$Version' does not exist in registry '$($registry.name)'. Build it first."
}
$digest = $digest.Trim()

$immutableImage = "$($registry.loginServer)/${repository}@$digest"
$webAppUrl = "https://$webAppName.azurewebsites.net"

Write-Host "Subscription: $($account.name) ($($account.id))"
Write-Host "Release:      $Version"
Write-Host "Digest:       $digest"
Write-Host "Web app:      $webAppName"
Write-Host ''
Write-Host 'Configuring App Service with the immutable release image...'

& az webapp config container set `
    --resource-group $resourceGroupName `
    --name $webAppName `
    --container-image-name $immutableImage `
    --container-registry-url "https://$($registry.loginServer)" `
    --output none
if ($LASTEXITCODE -ne 0) {
    throw "Unable to configure App Service for release '$Version'."
}

& az webapp config appsettings set `
    --resource-group $resourceGroupName `
    --name $webAppName `
    --settings "APP_VERSION=$Version" "APP_IMAGE_DIGEST=$digest" `
    --output none
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to record the deployed application version.'
}

& az webapp log config `
    --resource-group $resourceGroupName `
    --name $webAppName `
    --docker-container-logging filesystem `
    --output none
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to enable App Service container logging.'
}

& az webapp restart `
    --resource-group $resourceGroupName `
    --name $webAppName `
    --output none
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to restart App Service.'
}

$healthUrl = "$webAppUrl/health"
$deadline = (Get-Date).AddMinutes(5)
do {
    Start-Sleep -Seconds 10
    try {
        $health = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 15
        if ($health.StatusCode -eq 200) {
            Write-Host ''
            Write-Host 'Release deployment complete.'
            Write-Host "Version: $Version"
            Write-Host "Digest:  $digest"
            Write-Host "URL:     $webAppUrl"
            return
        }
    } catch {
        Write-Verbose "Waiting for container startup: $($_.Exception.Message)"
    }
} while ((Get-Date) -lt $deadline)

throw "Release '$Version' did not become healthy within five minutes. Inspect logs with: az webapp log tail --resource-group $resourceGroupName --name $webAppName"
