# Milestone 44 — Personal Azure Deployment

## Status: ✅ Complete — deployment intentionally deferred

**Implementation date:** 2026-08-25

The documented plan and deployment implementation are complete in the M44
worktree. An authenticated Azure what-if verified the exact five-resource plan
against the personal subscription. The owner explicitly chose not to provision
resources yet, so no Azure resources or charges were created. Milestone 43 has
been integrated; the container seeds its curated scripts into persistent storage
without overwriting existing files. The selected deployment defaults are
`westus3` and B1.

## Goal

Make Storyteller Cards available from a phone while away from the local
development machine. Optimize for one user, low effort, low cost, and safe
teardown. Scalable infrastructure, multi-region reliability, and durable
database guarantees are explicitly out of scope.

## UI / API Infrastructure Options

| Option | Shape | Advantages | Drawbacks | Decision |
| ------ | ----- | ---------- | --------- | -------- |
| **1. One Azure App Service custom container** | Go serves the Vite build, REST API, and SSE from one Linux App Service; ACR stores/builds the image; `/home/data` stores JSON. | Matches the existing same-origin architecture, one public endpoint, no CORS, no API URL configuration, SSE remains simple, B1 can stay warm, F1 is available. | App Service and Basic ACR are billable; F1 has quotas/cold starts; App Service filesystem is not a database. | **Selected** |
| **2. Static Web Apps + Container Apps** | Free Static Web Apps hosts React; a consumption Container App hosts Go; Azure Files stores JSON. | UI can be free; API can scale to zero; clean separation. | Reintroduces cross-origin configuration unless a linked backend is used; linked backends require the appropriate SWA plan; SSE and scale-to-zero are a poor fit; Azure Files and the Container Apps environment add moving parts. | Rejected for this milestone |
| **3. Two App Services** | One web app hosts UI and another hosts API. | Familiar App Service workflow and independent deployments. | Pays/operates two apps, reintroduces CORS and API endpoint configuration, and gains nothing for a single-user app because Go already serves the UI. | Rejected |
| **4. Small Linux VM** | One VM runs the container with a managed disk and public HTTPS proxy. | Straightforward persistence and complete control; no registry is required after copying an image. | Requires OS patching, TLS/proxy management, firewall hardening, monitoring, and process supervision during vacation. | Rejected |

Azure Functions was also considered and rejected: long-lived SSE connections and
filesystem-backed mutable state do not fit the serverless function model.

## Selected Design

```text
App Service HTTPS endpoint
  -> optional-at-runtime / enabled-in-Azure HTTP Basic middleware
  -> Go Chi router
     -> /api/* REST and SSE
     -> /health unauthenticated health probe
     -> React assets and index.html SPA fallback
  -> /home/data persistent App Service storage
```

The Bicep deployment creates a Basic ACR, Linux App Service plan, web app,
system-assigned identity, and scoped `AcrPull` role assignment. Separate
PowerShell scripts provision infrastructure, build immutable SemVer releases
with ACR Tasks, deploy or roll back an exact digest, and list release history.
Local Docker and AI tooling are unnecessary.

### SKU Choice

- **Recommended: B1** — predictable availability and Always On for vacation use.
- **Budget override: F1** — acceptable if cold starts and daily CPU quotas are
  tolerable. ACR Basic remains billable.

Exact prices are subscription- and region-dependent; the deployment script
supports Azure what-if and prints the selected subscription, SKU, and location
before resource creation.

### Expected One-Week Cost

Public West US 3 retail meters on 2026-08-25:

| Resource | Rate | Seven days |
| -------- | ---- | ---------- |
| Linux App Service B1 | $0.017/hour | $2.856 |
| Basic ACR | $0.1666/day | $1.1662 |
| **Base total** | | **$4.0222** |

Plan for **$4–$4.50 USD for one week**, or approximately **$4.60 for eight
days** when deploying the day before travel. Existing monthly credits should
cover this while credit remains. Delete the entire resource group immediately
afterward; stopping the web app alone does not stop the App Service plan charge.
See [`infra/README.md`](../../../infra/README.md) for assumptions, current
official pricing links, the vacation runbook, and teardown instructions.

## Security and Data

- App Service enforces HTTPS and TLS 1.2+.
- The deployment generates a random HTTP Basic password unless one is supplied.
- `/health` is intentionally public for App Service health checks.
- ACR admin credentials are disabled; App Service pulls with managed identity.
- FTP is disabled.
- JSON data persists under `/home/data`.
- The app remains single-instance. Concurrent writes from multiple instances
  are unsupported by the file store.
- Basic authentication is a pragmatic temporary control, not the long-term
  identity design. Entra-backed App Service Authentication is the preferred
  future option if this becomes a shared or permanent service.

## Task List

- [x] Compare at least three Azure UI/API hosting options.
- [x] Select a design aligned with the existing same-origin application.
- [x] Add a multi-stage production container.
- [x] Add persistent data and static asset directory configuration.
- [x] Package Milestone 43 scripts and safely seed missing files into persistent storage.
- [x] Add SPA route fallback for direct React route navigation.
- [x] Add private-by-default authentication for the public deployment.
- [x] Add subscription-scoped Bicep for App Service, ACR, identity, and role assignment.
- [x] Separate infrastructure provisioning, release building, and release deployment.
- [x] Add clean-tree and Git-tag validation for SemVer release builds.
- [x] Add immutable ACR version tags, OCI source labels, and digest-based deployments.
- [x] Add release inventory and one-command rollback support.
- [x] Add a confirmed teardown script.
- [x] Document a complete non-AI personal-machine release runbook.
- [x] Document deployment, verification, rollback, operation, cost controls, and teardown.
- [x] Authenticate to and run Azure what-if against the selected personal subscription.
- [x] Confirm the five-resource West US 3 B1 plan without creating resources.
- [x] Document expected one-week cost and the deploy/teardown runbook.

## Validation

- [x] Go API tests, including new Basic authentication and SPA handler tests.
- [x] Bicep compilation with Azure CLI.
- [x] PowerShell parser validation for provisioning, build, deployment, inventory, and teardown scripts.
- [x] Vite production asset build.
- [x] Authenticated Azure what-if against the personal subscription.
- [ ] Full TypeScript build after Milestone 43 lands. The current `main` branch
  has pre-existing M43-adjacent type errors and Vitest configuration typing
  errors; M44 does not suppress or modify those checks.
- [ ] Future-deployment validation: ACR container build and live App Service
  smoke test. Intentionally deferred because the plan-only scope creates no
  billable resources.

## Acceptance Criteria

- [x] One command can preview infrastructure changes in the selected subscription.
- [x] Provisioning, building, and deployment are explicit separate commands.
- [x] A release maps a SemVer Git tag to an immutable ACR digest.
- [x] Any retained release can be deployed or rolled back without rebuilding.
- [x] The process can be run from a normal PowerShell terminal without AI tooling.
- [x] The deployed app uses one HTTPS origin for UI, REST, and SSE.
- [x] Session data is configured for persistent App Service storage.
- [x] Public access requires generated credentials.
- [x] All created resources can be removed through a confirmation-gated command.
- [x] The owner can review expected costs before deciding when to provision.
