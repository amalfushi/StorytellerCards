# Personal Azure Deployment

Milestone 44 deploys Storyteller Cards as one Linux custom container:

```text
Browser
  -> Azure App Service HTTPS + HTTP Basic authentication
     -> Go server
        -> React static files and SPA fallback
        -> /api REST handlers
        -> /api/.../events SSE streams
        -> /home/data persistent JSON files
```

The design intentionally optimizes for one user, low operational effort, and
easy teardown rather than scale or high availability.

## Resources and Cost Controls

The Bicep deployment creates:

- One resource group.
- One Basic Azure Container Registry used for remote image builds.
- One Linux App Service plan with one app.
- One system-assigned identity with `AcrPull` on the registry.

`B1` is the default because it supports Always On and avoids the Free tier CPU
quota while vacation access needs to be dependable. `F1` is available through
the `-Sku F1` parameter when minimum spend matters more than cold starts and
quotas. Both choices still incur the Container Registry charge. Check the
[App Service pricing](https://azure.microsoft.com/pricing/details/app-service/linux/)
and [Container Registry pricing](https://azure.microsoft.com/pricing/details/container-registry/)
for the selected subscription and region before provisioning.

### Expected One-Week Cost

The following estimate uses the public USD consumption meters returned by the
[Azure Retail Prices API](https://learn.microsoft.com/rest/api/cost-management/retail-prices/azure-retail-prices)
for West US 3 on 2026-08-25:

| Resource | Retail meter | Seven-day estimate |
| -------- | ------------ | ------------------ |
| Linux App Service Basic B1 | $0.017/hour x 168 hours | $2.856 |
| Azure Container Registry Basic | $0.1666/day x 7 days | $1.1662 |
| **Expected base total** | | **$4.0222** |

Budget **about $4–$4.50 USD for seven days**. A single small ACR build, image
storage, App Service storage, and light phone traffic should remain within
included allowances or add only cents; the estimate reserves roughly $0.50 for
rounding and incidental usage. Taxes, negotiated subscription rates, currency
conversion, and future price changes are not included. Existing monthly Azure
credits should make the out-of-pocket amount $0 while eligible credit remains,
but Cost Management is the source of truth for the subscription.

For planning:

- 8 days, including deployment the day before travel: approximately **$4.60**
  before credits.
- 30 days: approximately **$17.41** before credits.
- Stopping or deleting only the web app does **not** stop App Service plan
  charges. Delete `storytellercards-rg` to stop both B1 and ACR billing.
- Do not add Application Insights, a database, a custom domain, private
  endpoints, or additional instances for this temporary deployment.

This is deliberately one App Service, not separate UI and API services. The app
already uses relative API paths and SSE on the same origin, and the Go server
already owns production static-file hosting.

## Prerequisites

The entire process runs from an ordinary PowerShell terminal. It does not
require Copilot CLI, an AI agent, GitHub Actions, or any other automation
service.

Install these tools on the personal Windows machine:

1. [Git for Windows](https://git-scm.com/download/win).
2. [Node.js 24](https://nodejs.org/) and npm.
3. [Go 1.25](https://go.dev/doc/install).
4. [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli-windows).
5. Windows PowerShell 5.1 or PowerShell 7.
6. Docker Desktop is optional; Azure Container Registry builds the official
   release image remotely.

Clone the repository and install dependencies:

```powershell
git clone https://github.com/amalfushi/StorytellerCards.git
cd StorytellerCards
npm run install:all
```

Sign in and select the personal Azure subscription:

```powershell
az login
az account list --output table
az account set --subscription '<subscription-id-or-name>'
az account show --output table
```

If the account requires a tenant-specific MFA login:

```powershell
az login --tenant '<tenant-id>' --use-device-code
```

Docker is not required locally. `az acr build` sends the repository context to
Azure Container Registry Tasks, which builds the checked-in `Dockerfile`
remotely.

## Release Model

Releases use [Semantic Versioning](https://semver.org/):

- `0.44.0`: first release associated with Milestone 44.
- `0.44.1`: backward-compatible bug fix.
- `0.45.0`: next feature milestone.
- `1.0.0`: first version declared stable.
- `0.45.0-rc.1`: optional prerelease.

Each release has four linked identities:

| Identity | Example | Purpose |
| -------- | ------- | ------- |
| Git tag | `v0.44.0` | Exact source commit |
| ACR tag | `storyteller-cards:0.44.0` | Human-readable release |
| OCI revision label | Full Git SHA | Source traceability |
| Container digest | `sha256:...` | Immutable deployment identity |

`Build-AzureRelease.ps1` requires a clean Git working tree, verifies the Git tag
points to `HEAD`, refuses an existing ACR version, and locks the built ACR tag
against update and deletion. `Deploy-AzureRelease.ps1` resolves the version to
its digest and deploys the digest, not the mutable tag text.

## First-Time Infrastructure Setup

Provisioning is separate from building and deploying releases. It normally runs
once for the vacation environment.

### 1. Preview

Run an Azure what-if before creating billable resources:

```powershell
.\infra\Provision-Azure.ps1 -WhatIf
```

To target a non-default subscription, location, name, or Free plan:

```powershell
.\infra\Provision-Azure.ps1 `
  -SubscriptionId '<subscription-id>' `
  -Location 'westus3' `
  -NamePrefix 'storytellercards' `
  -Sku F1 `
  -WhatIf
```

The expected preview is five creations: resource group, Basic ACR, B1 Linux App
Service plan, web app, and ACR pull role assignment. Stop and investigate if it
shows updates or deletions you did not expect.

### 2. Provision

After reviewing the preview:

```powershell
.\infra\Provision-Azure.ps1 -Sku B1
```

The script:

1. Uses the current Azure CLI subscription unless `-SubscriptionId` is given.
2. Generates a memorable random access password unless `-AccessPassword` is
   given.
3. Deploys the resource group, registry, plan, app, persistent storage settings,
   health probe, managed identity, and `AcrPull` assignment with Bicep.
4. Prints resource names, the URL, and the one-time generated
   username/password.

Generated passwords contain four distinct Storyteller Cards character IDs of at
least four characters plus an eight-character cryptographic Base32 suffix, for
example:

```text
kazali-lordoftyphon-atheist-king-K7M4P9RX
```

The character names make most of the password memorable. The suffix is
important: four names selected from the known in-app character list provide
only about 30 bits of uncertainty, while the suffix adds 40 random bits. Do not
remove the suffix or substitute a personally chosen phrase.

Save the printed password in a password manager. The browser sends Basic
credentials only over the App Service HTTPS endpoint. Local development stays
unauthenticated because `BASIC_AUTH_PASSWORD` is unset.

Provisioning initially points the new web app at a public Microsoft placeholder
container. It contains no Storyteller Cards code or data, but it also does not
use the application's Basic authentication. Build and deploy the first release
immediately after provisioning; do not treat provisioning alone as a completed
deployment.

Session, game, and imported-script JSON files live under `/home/data`.
`WEBSITES_ENABLE_APP_SERVICE_STORAGE=true` keeps this directory on App
Service's persistent `/home` share across container restarts and image updates.
This storage is adequate for the single-user scenario but is not intended for
multi-instance writes or high availability.

Each release image also contains the curated production and test scripts from
`API/data/scripts`. At startup, the API copies only bundled script files that
are missing from `/home/data/scripts`. Deploying a newer release therefore adds
new bundled scripts without overwriting imported or edited files already in
persistent storage.

## Build a Versioned Release

Use this release checklist each time:

1. Choose the next SemVer version.
2. Update user-facing or milestone documentation for meaningful changes.
3. Commit all intended source changes.
4. Update `main` and run the release checks.
5. Build and lock the ACR release.
6. Push the annotated Git tag.
7. Deploy the version and complete the verification checklist.

Always release from the intended `main` commit, never from an uncommitted
working tree:

```powershell
git switch main
git pull --ff-only
npm run install:all
npm run test:all
npm run test:e2e:journey
npm --prefix UI run build
```

Build release `0.44.0` and create its annotated Git tag:

```powershell
.\infra\Build-AzureRelease.ps1 `
  -Version 0.44.0 `
  -CreateGitTag
```

The script uploads the clean checkout to ACR Tasks, runs the multi-stage
`Dockerfile`, tags the image, prints its digest, and locks the release tag.
Publish the source tag after a successful build:

```powershell
git push origin v0.44.0
```

For an existing Git tag, omit `-CreateGitTag`:

```powershell
git switch --detach v0.44.0
.\infra\Build-AzureRelease.ps1 -Version 0.44.0
```

The same version cannot be rebuilt. If the source changes, commit it and choose
a new patch, minor, or major version.

### Optional Local Container Check

Docker is not part of the official release path, but it can validate the
container locally before the ACR build:

```powershell
$version = '0.44.0'
$commit = git rev-parse HEAD
docker build `
  --build-arg "APP_VERSION=$version" `
  --build-arg "VCS_REF=$commit" `
  --tag "storyteller-cards:$version" `
  .
docker run --rm `
  --publish 8080:8080 `
  --env BASIC_AUTH_PASSWORD=local-test `
  "storyteller-cards:$version"
```

Open `http://localhost:8080`, use username `storyteller` and password
`local-test`, then stop the container with `Ctrl+C`.

## Deploy a Release

Deploy an exact release independently of its build:

```powershell
.\infra\Deploy-AzureRelease.ps1 -Version 0.44.0
```

The script:

1. Verifies the version exists in ACR.
2. Resolves its immutable digest.
3. Configures App Service to pull that digest with managed identity.
4. Records `APP_VERSION` and `APP_IMAGE_DIGEST` in App Service settings.
5. Restarts the app and waits up to five minutes for `/health`.

List available versions and the currently deployed version:

```powershell
.\infra\Get-AzureReleases.ps1
```

### Verify Every Deployment

1. Open the printed URL in a private browser window and sign in.
2. Refresh a nested route directly and confirm the UI loads.
3. Create or update a test session.
4. Restart the app and confirm the session still exists:

   ```powershell
   az webapp restart `
     --resource-group storytellercards-rg `
     --name '<app-name>'
   ```

5. Open two browser tabs and confirm a game update reaches the other tab
   through SSE.
6. Run `Get-AzureReleases.ps1` and verify the deployed version.

## Roll Back

Deploy any older retained version with the same deployment command:

```powershell
.\infra\Deploy-AzureRelease.ps1 -Version 0.44.0
```

Rollback changes application code only. It does not roll back JSON data. Do not
roll back across an incompatible data-model change unless the release notes
explicitly confirm backward compatibility or the data has been backed up.

## Vacation Runbook

1. **One day before travel:** run what-if, review the five expected creations,
   provision B1, build a tagged release, and deploy that exact version.
2. Open the generated HTTPS URL in a private browser window and verify the
   generated credentials, a direct UI route refresh, one saved session, and a
   container restart.
3. During travel, use Azure Cost Management to keep a small budget alert or
   inspect accumulated cost.
4. **Immediately after travel:** run `Remove-Azure.ps1` and confirm the resource
   group no longer exists. Export any JSON data that should be retained before
   teardown.

## Operate

Tail application and container logs:

```powershell
az webapp log tail `
  --resource-group storytellercards-rg `
  --name '<app-name>'
```

List deployed app details:

```powershell
az webapp list `
  --resource-group storytellercards-rg `
  --output table
```

Show the current release and release history:

```powershell
.\infra\Get-AzureReleases.ps1
```

Provisioning again with the same `NamePrefix` updates infrastructure but does
not build or deploy application code. Changing `NamePrefix` creates a separate
resource group. Build and deployment remain explicit, separate operations.

### Troubleshooting

If a deployment does not become healthy:

```powershell
az webapp log tail `
  --resource-group storytellercards-rg `
  --name '<app-name>'
```

If a script targets the wrong account, stop and run:

```powershell
az account show --output table
az account set --subscription '<personal-subscription-id>'
```

If a release build says the working tree is dirty:

```powershell
git status
```

Commit intended changes or stash unrelated changes. Do not bypass the clean-tree
check for an official release.

## Tear Down

Delete the resource group after vacation to stop all charges:

```powershell
.\infra\Remove-Azure.ps1
```

PowerShell requests confirmation because this permanently deletes the app,
registry, and persisted `/home/data` files.

## Azure References

- [Configure a custom container for Azure App Service](https://learn.microsoft.com/azure/app-service/configure-custom-container)
- [Persistent shared storage in a Linux custom container](https://learn.microsoft.com/azure/app-service/configure-custom-container#use-persistent-shared-storage)
- [Azure Container Registry Tasks](https://learn.microsoft.com/azure/container-registry/container-registry-tasks-overview)
- [Use managed identity to pull from Azure Container Registry](https://learn.microsoft.com/azure/app-service/configure-custom-container#use-managed-identity-to-pull-image-from-azure-container-registry)
