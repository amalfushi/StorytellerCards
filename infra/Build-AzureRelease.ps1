<#
.SYNOPSIS
Builds and records an immutable Storyteller Cards release in Azure Container Registry.

.DESCRIPTION
Requires a clean Git checkout and an annotated SemVer tag for the current
commit, optionally creating the tag. It remotely builds the container with ACR
Tasks, records source metadata, refuses duplicate versions, and locks the
resulting image against overwrite or deletion. It does not deploy the release.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^\d+\.\d+\.\d+(-[0-9A-Za-z][0-9A-Za-z.-]*)?$')]
    [string] $Version,
    [string] $SubscriptionId,
    [ValidatePattern('^[a-z][a-z0-9-]{2,23}$')]
    [string] $NamePrefix = 'storytellercards',
    [switch] $CreateGitTag
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI is required.'
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is required.'
}

if ($SubscriptionId) {
    & az account set --subscription $SubscriptionId
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to select Azure subscription '$SubscriptionId'."
    }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$workingTreeChanges = & git -C $repoRoot status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to inspect the Git working tree.'
}
if ($workingTreeChanges) {
    throw 'Release builds require a clean Git working tree. Commit or stash all changes, then retry.'
}

$commit = & git -C $repoRoot rev-parse HEAD
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to resolve the current Git commit.'
}
$commit = $commit.Trim()
$shortCommit = & git -C $repoRoot rev-parse --short=12 HEAD
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to resolve the abbreviated Git commit.'
}
$shortCommit = $shortCommit.Trim()
$gitTag = "v$Version"
$tagCommit = & git -C $repoRoot rev-list -n 1 $gitTag 2>$null
if ($LASTEXITCODE -ne 0) {
    $tagCommit = $null
}

if (-not $tagCommit) {
    if (-not $CreateGitTag) {
        throw "Git tag '$gitTag' does not exist. Create it manually or rerun with -CreateGitTag."
    }

    & git -C $repoRoot tag --annotate $gitTag --message "Storyteller Cards $Version"
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to create Git tag '$gitTag'."
    }
    $tagCommit = $commit
}

if ($tagCommit.Trim() -ne $commit) {
    throw "Git tag '$gitTag' points to $($tagCommit.Trim()), not the current commit $commit."
}

$tagType = & git -C $repoRoot cat-file -t $gitTag
if ($LASTEXITCODE -ne 0 -or -not $tagType) {
    throw "Unable to inspect Git tag '$gitTag'."
}
if ($tagType.Trim() -ne 'tag') {
    throw "Git tag '$gitTag' is lightweight. Replace it with an annotated tag before building a release."
}

$resourceGroupName = "$NamePrefix-rg"
$registry = (& az acr list `
    --resource-group $resourceGroupName `
    --query '[0].{name:name,loginServer:loginServer}' `
    --output json) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $registry.name) {
    throw "No Azure Container Registry was found in resource group '$resourceGroupName'. Provision infrastructure first."
}

$repository = 'storyteller-cards'
$releaseImage = "${repository}:$Version"
& az acr manifest show-metadata `
    --registry $registry.name `
    --name $releaseImage `
    --only-show-errors `
    --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    throw "Release '$Version' already exists in '$($registry.name)'. Choose a new version; release tags are immutable."
}

Write-Host "Building Storyteller Cards $Version from commit $shortCommit..."
& az acr build `
    --registry $registry.name `
    --image $releaseImage `
    --build-arg "APP_VERSION=$Version" `
    --build-arg "VCS_REF=$commit" `
    $repoRoot
if ($LASTEXITCODE -ne 0) {
    throw "Azure Container Registry build failed for release '$Version'."
}

$digest = & az acr manifest show-metadata `
    --registry $registry.name `
    --name $releaseImage `
    --query digest `
    --output tsv
if ($LASTEXITCODE -ne 0 -or -not $digest) {
    throw "Release '$Version' was built, but its image digest could not be resolved."
}
$digest = $digest.Trim()

& az acr repository update `
    --name $registry.name `
    --image $releaseImage `
    --write-enabled false `
    --delete-enabled false `
    --output none
if ($LASTEXITCODE -ne 0) {
    throw "Release '$Version' was built, but its tag could not be locked against overwrite."
}

Write-Host ''
Write-Host 'Release build complete.'
Write-Host "Version:  $Version"
Write-Host "Git tag:  $gitTag"
Write-Host "Commit:   $commit"
Write-Host "Image:    $($registry.loginServer)/$releaseImage"
Write-Host "Digest:   $digest"
if ($CreateGitTag) {
    Write-Host ''
    Write-Host "Publish the Git tag when ready: git push origin $gitTag"
}
Write-Host ''
Write-Host "Deploy with: .\infra\Deploy-AzureRelease.ps1 -Version $Version"
