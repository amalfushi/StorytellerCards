# Milestone 31 — Remove All Lint Suppressions

## Status: 📋 Planned

## Problem Statement

The codebase contains 9 `eslint-disable` comments across 5 files. Per the AGENTS.md non-negotiable directive, all lint/quality suppressions must be removed and the underlying code fixed properly.

## Inventory

### `react-refresh/only-export-components` (4 occurrences)

Non-component exports alongside components break React Refresh HMR.

| File | Line | Export | Fix Strategy |
|------|------|--------|-------------|
| `UI/src/context/GameContext.tsx` | 751 | `useGame()` hook | Add `allowExportNames` to ESLint config, or move hook to separate file |
| `UI/src/context/SessionContext.tsx` | 359 | `useSession()` hook | Same as above |
| `UI/src/components/Setup/SetupChecklist.tsx` | 85 | `buildChecklistItems()` utility | Move to a separate utility file (e.g. `setupChecklistUtils.ts`) |
| `UI/src/stories/decorators.tsx` | 1 | File-level disable (multiple decorator exports) | Add stories dir to ignore pattern, or restructure exports |

### `react-hooks/exhaustive-deps` (4 occurrences)

Intentional "run once" effects that omit deps.

| File | Line | Context | Fix Strategy |
|------|------|---------|-------------|
| `UI/src/stories/decorators.tsx` | 47 | `loadGame` in mount effect | Use ref to track initialization |
| `UI/src/stories/decorators.tsx` | 55 | `setPhase` after game loaded | Use ref to track initialization |
| `UI/src/stories/decorators.tsx` | 66 | `toggleShowCharacters` after game loaded | Use ref to track initialization |
| `UI/src/components/common/ShowCharactersToggle.test.tsx` | 51, 58 | Test helper mount effects | Use ref to track initialization |

### `react-hooks/set-state-in-effect` (1 occurrence)

| File | Line | Context | Fix Strategy |
|------|------|---------|-------------|
| `UI/src/pages/GameViewPage.tsx` | 121 | Dead code — auto-resume night view | Remove entirely (nightProgress is never persisted, already removed in M29) |

## Task List

- [ ] Configure `react-refresh/only-export-components` rule with `allowExportNames` for hooks (`useGame`, `useSession`) and remove those 3 suppressions
- [ ] Move `buildChecklistItems()` to a separate utility file and remove its suppression
- [ ] Fix stories/decorators.tsx: use refs for initialization tracking instead of empty dep arrays, remove all 4 suppressions
- [ ] Fix ShowCharactersToggle.test.tsx: use refs for initialization tracking, remove both suppressions
- [ ] Remove dead auto-resume effect in GameViewPage.tsx (if not already removed by M29 merge)
- [ ] Verify 0 eslint-disable comments remain: `grep -r "eslint-disable" UI/src/`
- [ ] Run full lint + test suite
- [ ] Update docs

## Acceptance Criteria

- [ ] Zero `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or equivalent suppressions in the codebase
- [ ] `npx eslint .` passes with 0 errors, 0 warnings
- [ ] All tests pass
- [ ] No behavioral changes — pure refactor
