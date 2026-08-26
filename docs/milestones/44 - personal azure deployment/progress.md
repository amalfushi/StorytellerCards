# Milestone 44 Progress

## 2026-08-25 — Deployment implementation complete

- Created the `m44/azure-personal-deployment` worktree from `main` so Milestone
  43 can proceed independently.
- Selected a one-container Azure App Service design after comparing four
  infrastructure options.
- Added container packaging, Basic authentication, persistent data directory
  configuration, and React SPA fallback.
- Added Bicep plus PowerShell deployment and teardown automation.
- Validated Go tests, Bicep compilation, PowerShell parsing, and Vite asset
  generation.

## Pending

- Rebase after Milestone 43 and run the full repository quality gates before
  merging M44.
- When vacation dates are known, provision B1 one day before travel, complete
  live phone/restart/SSE smoke tests, and tear down immediately afterward.

## 2026-08-25 — Personal subscription plan verified

- Authenticated Azure CLI to the personal subscription with MFA.
- Ran the deployment what-if for West US 3 and B1.
- Verified five creations and no updates or deletions: resource group, Basic
  ACR, Linux B1 plan, web app, and ACR pull role assignment.
- Fixed Windows PowerShell compatibility in random credential generation.
- Recorded a seven-day public retail estimate of $4.02, with a practical
  $4–$4.50 budget before monthly credits.
- Provisioning was explicitly declined; no Azure resources or charges were
  created.

## 2026-08-25 — Manual release management added

- Split one-time infrastructure provisioning from release build and deployment.
- Added clean-source SemVer builds tied to annotated Git tags and commit labels.
- Made ACR release tags immutable and deployed exact image digests.
- Added release inventory and rollback commands.
- Documented the complete personal-machine workflow, optional local Docker
  validation, verification checklist, troubleshooting, and data-model rollback
  warning. No Copilot or other AI tooling is required.
