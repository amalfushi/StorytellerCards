# Milestone 44 Progress

## 2026-08-26 — Friendly App Service URL deployed

- Added an optional explicit App Service name while retaining the generated
  names as the safe default for first-time deployments.
- Split shared ACR and App Service plan provisioning from app provisioning so
  replacement apps can reference existing infrastructure without updating it.
- Added explicit web-app targeting to release deployment and inventory scripts;
  implicit selection now refuses to continue when multiple apps exist.
- Previewed the replacement deployment and confirmed it would create only
  `storytellercards` and its managed-identity ACR pull role assignment, with no
  shared-resource updates or deletions.
- Provisioned `storytellercards` in the existing
  `storytellercards-hm7rgicvjobuq-plan` and deployed the existing immutable
  `0.44.1` image digest.
- Verified `https://storytellercards.azurewebsites.net` health, Basic
  authentication, authenticated UI and nested routes, nine seeded scripts,
  exact release metadata, and managed-identity ACR pulls.
- Verified the original suffixed app remained running and healthy throughout
  replacement validation, with exactly one App Service plan serving both apps.
- After validation, the owner manually deleted the original suffixed app. The
  friendly-name app is now the only app using the existing plan.
- The replacement app has its own `/home` storage. No persistent session, game,
  or imported-script data was migrated from the original app before deletion.

## 2026-08-26 — Release deployed and owner-verified

- Provisioned the authenticated five-resource West US 3 B1 plan after a fresh
  what-if again confirmed five creations with no updates or deletions.
- Built release `v0.44.0` through ACR Tasks and deployed its immutable digest to
  the App Service.
- Locked the release tag against overwrite and deletion and published the
  matching annotated Git tag.
- Verified the public health endpoint, Basic authentication challenge,
  authenticated UI and nested SPA routes, nine seeded scripts, exact deployed
  version and digest, and managed-identity ACR pulls.
- Created a disposable session, restarted App Service, verified the session
  survived in persistent storage, and removed the test record.
- Fixed first-release handling for nonexistent Git/ACR tags and Windows UTF-8
  ACR log streaming.
- The owner confirmed the deployed application through normal hands-on use.

## 2026-08-26 — Milestone 43 integration validated

- Merged Milestone 43 into the deployment branch.
- Added safe first-run seeding of bundled curated scripts into persistent
  storage without overwriting imported or edited files.
- Passed TypeScript compilation, 4,350 UI tests with 3 skipped, 231 Storybook
  interaction tests, Go tests, lifecycle and sync E2E suites, and the full
  journey E2E suite.

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

## 2026-08-26 — Memorable generated credentials

- Changed the default generated password from opaque Base64URL text to four
  distinct in-app character IDs plus an eight-character random Base32 suffix.
- Retained roughly 70 bits of total entropy while making the credential easier
  to recognize and remember.
- Documented the password format, example, storage expectations, and why the
  random suffix must be retained.
