# Milestone 32 — Lazy Loading UI Components & Character Images

## Status: ⏳ Planning

> **Goal:** Reduce initial load time and memory usage by lazy-loading character token images and deferring component hydration. Most games use 15–20 characters out of 179 (with 312 alignment variants, totalling ~491 image assets). Mobile devices especially benefit from loading only what's visible.

---

## 1. Problem Statement

The app currently loads all character icon resources eagerly:

| Asset Type | Count | Used Per Game |
|-----------|-------|---------------|
| Base character icons (`{id}Icon.webp`) | 179 | ~15–20 |
| Good alignment variants (`_g.webp`) | ~156 | ~15–20 |
| Evil alignment variants (`_e.webp`) | ~156 | ~15–20 |
| **Total image assets** | **~491** | **~15–20** |

### Impact

- **Mobile data waste**: Users on phones download hundreds of images they'll never see in a given game session.
- **Longer initial paint**: The browser queues requests for all `<img>` tags, competing with critical resources (JS, CSS, fonts).
- **Memory pressure**: All decoded images stay in the browser's image cache, consuming RAM on memory-constrained mobile devices.
- **TownSquare / PlayerList**: Only 5–15 player tokens are visible at once, but every character icon in the script reference and character selection list loads immediately.

### Current Image Rendering

`CharacterIconImage` (`UI/src/components/common/CharacterIconImage.tsx`) renders an `<img>` tag with an `onError` fallback chain (alignment variant → base icon → letter circle). It does **not** use `loading="lazy"` or any viewport-aware loading strategy.

---

## 2. Solution Overview

### 2.1 Native Lazy Loading (`loading="lazy"`)

The simplest win — add `loading="lazy"` to `<img>` tags in `CharacterIconImage`. The browser defers fetching images that are outside the viewport until the user scrolls near them.

**Pros:** Zero dependencies, zero JS overhead, supported by all modern browsers.
**Cons:** No control over threshold distance; no unloading of off-screen images.

**Applies to:** All `CharacterIconImage` usages in scrollable lists (ScriptReferenceTab, CharacterSelection, NightOrderEntry, CharacterCard).

**Does NOT apply to:** Player tokens in TownSquare and NightFlashcard — these are always visible and should load eagerly.

### 2.2 IntersectionObserver for Fine-Grained Control

For lists with many items (ScriptReferenceTab shows 50+ characters, CharacterSelection shows the full script), use `IntersectionObserver` to:

1. Render a lightweight placeholder (the letter-circle fallback) until the element enters the viewport.
2. Set the `src` only when visible, triggering the actual image fetch.
3. Optionally unload images that leave the viewport (see §2.4).

Wrap this in a reusable `useLazyImage` hook or a `LazyImage` wrapper component.

### 2.3 React.lazy + Suspense for Route-Level Code Splitting

Heavy page components can be code-split so they're loaded on-demand:

| Component | Route | Eager or Lazy |
|-----------|-------|---------------|
| `GameViewPage` | `/session/:id/game/:gid` | Eager (primary view) |
| `ScriptReferenceTab` | Tab within GameView | **Lazy** — not always opened |
| `CharacterSelection` | Setup flow | **Lazy** — only during setup |
| `NightOrderEntry` list | Night order tab | **Lazy** — reference only |
| `CharacterDetailModal` | Modal overlay | **Lazy** — on-demand |
| `NightHistoryPage` | `/session/:id/game/:gid/history` | **Lazy** — rarely visited |

Use `React.lazy(() => import('./ComponentName'))` wrapped in `<Suspense fallback={<Skeleton />}>`.

### 2.4 Image Unloading (Idle Cleanup)

For long-running game sessions, images that haven't been viewed recently can be unloaded to free memory:

1. **Track last-used timestamp** per image URL in a `Map<string, number>`.
2. **Idle sweep** via `setInterval` (every 30s): find images last used > 60s ago.
3. **Unload**: Clear the `src` attribute (or set to empty string) on off-screen images, resetting them to placeholder state.
4. **Re-lazy-load**: When the element re-enters the viewport, the `IntersectionObserver` sets `src` again, triggering a fresh (likely cached) fetch.
5. **Blob URL cleanup**: If any future feature uses `URL.createObjectURL`, call `URL.revokeObjectURL` during unload.

This is a **bonus/stretch feature** — the primary value comes from §2.1 and §2.2.

---

## 3. Task List

### Phase 1: Native `loading="lazy"` on Images
- [ ] Add `loading="lazy"` attribute to the `<img>` tag in `CharacterIconImage`
- [ ] Add an `eager` prop to `CharacterIconImage` (default `false`) for callers that need immediate loading (TownSquare PlayerToken, NightFlashcard)
- [ ] Update `PlayerToken` and `NightFlashcard` to pass `eager={true}`
- [ ] Verify scrollable lists (ScriptReferenceTab, CharacterSelection, NightOrderEntry) defer image loading
- [ ] Add tests for the `eager` prop and `loading` attribute rendering

### Phase 2: `useLazyImage` Hook with IntersectionObserver
- [ ] Create `useLazyImage` hook in `UI/src/hooks/useLazyImage.ts`
  - Accepts: `src`, `options` (rootMargin, threshold)
  - Returns: `{ ref, currentSrc, isLoaded }` — `currentSrc` is `undefined` until visible
- [ ] Create unit tests for `useLazyImage` with mocked `IntersectionObserver`
- [ ] Integrate `useLazyImage` into `CharacterIconImage` for non-eager images
- [ ] Show the letter-circle placeholder until the image enters the viewport
- [ ] Verify image loads when scrolled into view (Storybook story with scroll container)

### Phase 3: React.lazy Route-Level Code Splitting
- [ ] Wrap `ScriptReferenceTab` import with `React.lazy`
- [ ] Wrap `CharacterSelection` import with `React.lazy`
- [ ] Wrap `CharacterDetailModal` import with `React.lazy`
- [ ] Wrap `NightHistoryPage` import with `React.lazy`
- [ ] Add `<Suspense>` boundaries with `<Skeleton>` fallbacks at each lazy boundary
- [ ] Verify Vite produces separate chunks for lazy-loaded components (`npm run build` + check output)
- [ ] Add tests verifying Suspense fallback renders while loading

### Phase 4: Image Unloading (Stretch Goal)
- [ ] Create `useImageLifecycle` hook in `UI/src/hooks/useImageLifecycle.ts`
  - Manages a `Map<string, number>` of `imageUrl → lastUsedTimestamp`
  - Runs idle sweep every 30s, marks images unused for > 60s as unloaded
- [ ] Integrate with `useLazyImage` — when image is unloaded, reset to placeholder state
- [ ] IntersectionObserver re-triggers load when unloaded image scrolls back into view
- [ ] Add a `URL.revokeObjectURL` cleanup path for any blob URLs
- [ ] Unit tests for idle sweep timing and re-load cycle
- [ ] Configurable thresholds via props or context (sweep interval, idle timeout)

### Phase 5: Performance Validation & Documentation
- [ ] Measure before/after using Chrome DevTools Network tab (document image request count on initial load)
- [ ] Measure before/after Lighthouse Performance score on mobile throttling
- [ ] Document results in this milestone doc
- [ ] Update `milestone32.md` with `## Status: ✅ Complete`
- [ ] Update `docs/progress.md`
- [ ] Update `AGENTS.md` test stats
- [ ] Check all task checkboxes

---

## 4. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `UI/src/hooks/useLazyImage.ts` | IntersectionObserver-based lazy image hook |
| `UI/src/hooks/useLazyImage.test.ts` | Tests for `useLazyImage` |
| `UI/src/hooks/useImageLifecycle.ts` | Image unloading / idle cleanup hook (Phase 4) |
| `UI/src/hooks/useImageLifecycle.test.ts` | Tests for `useImageLifecycle` |

### Modified Files

| File | Change |
|------|--------|
| `UI/src/components/common/CharacterIconImage.tsx` | Add `loading="lazy"`, `eager` prop, integrate `useLazyImage` |
| `UI/src/components/common/CharacterIconImage.test.tsx` | Tests for lazy/eager behaviour |
| `UI/src/components/common/CharacterIconImage.stories.tsx` | Storybook stories for lazy loading in scroll container |
| `UI/src/components/TownSquare/PlayerToken.tsx` | Pass `eager={true}` to `CharacterIconImage` |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Pass `eager={true}` to `CharacterIconImage` |
| `UI/src/components/ScriptViewer/ScriptReferenceTab.tsx` | Wrap with `React.lazy` at import site |
| `UI/src/components/ScriptViewer/CharacterCard.tsx` | No change — benefits from `CharacterIconImage` lazy loading |
| `UI/src/components/Setup/CharacterSelection.tsx` | Wrap with `React.lazy` at import site |
| `UI/src/components/common/CharacterDetailModal.tsx` | Wrap with `React.lazy` at import site |
| `UI/src/components/NightOrder/NightOrderEntry.tsx` | No change — benefits from `CharacterIconImage` lazy loading |
| `UI/src/pages/GameViewPage.tsx` | Add `<Suspense>` boundaries for lazy-loaded tabs/modals |
| `UI/src/pages/NightHistoryPage.tsx` | Wrap with `React.lazy` at import site |

---

## 5. Dependencies

- **M28** (Alignment Icon Variants) ✅ — alignment variant fallback chain in `CharacterIconImage` must be preserved
- **M22** (BotC Data Import) ✅ — base WebP icons already imported
- No external library dependencies — uses native browser APIs (`loading="lazy"`, `IntersectionObserver`, `React.lazy`)
- No blockers.

---

## 6. Acceptance Criteria

- [ ] `CharacterIconImage` renders `loading="lazy"` by default on its `<img>` tag
- [ ] `CharacterIconImage` renders `loading="eager"` when `eager={true}` is passed
- [ ] TownSquare `PlayerToken` and `NightFlashcard` pass `eager={true}` — visible tokens load immediately
- [ ] Scrollable character lists (ScriptReferenceTab, CharacterSelection) defer image loading until scroll
- [ ] `useLazyImage` hook correctly uses IntersectionObserver to detect viewport entry
- [ ] Letter-circle placeholder shows until image enters viewport (non-eager mode)
- [ ] `ScriptReferenceTab`, `CharacterSelection`, `CharacterDetailModal`, `NightHistoryPage` are code-split into separate Vite chunks
- [ ] `<Suspense>` fallback (Skeleton) renders while lazy components load
- [ ] Vite build output shows separate chunks for lazy-loaded components
- [ ] **(Stretch)** Images unused for 60+ seconds are unloaded; re-entering viewport triggers re-load
- [ ] **(Stretch)** `URL.revokeObjectURL` is called for any blob URLs during unload
- [ ] Existing alignment variant fallback chain (alignment → base → letter) still works
- [ ] All existing tests pass, 0 TypeScript errors, 0 ESLint errors
- [ ] Initial image request count reduced (documented before/after in this doc)

---

## 7. Performance Budget (Target Metrics)

| Metric | Before (Expected) | After (Target) |
|--------|-------------------|----------------|
| Images loaded on initial GameView render | ~50–100+ | < 20 (visible tokens only) |
| Images loaded in ScriptReferenceTab | All in script (~25–30) | Only visible (~8–10) |
| Lighthouse Performance (mobile, 4G) | TBD — measure before | ≥ 5 point improvement |
| JS bundle chunks | 1 main chunk | Main + 4–5 lazy chunks |

---

## 8. Technical Notes

### Browser Support for `loading="lazy"`
- Chrome 77+, Firefox 75+, Safari 15.4+, Edge 79+ — covers all target mobile browsers.
- No polyfill needed for our mobile-first audience.

### IntersectionObserver Threshold
- Use `rootMargin: '200px'` to start loading images 200px before they enter the viewport — avoids visible pop-in during fast scrolling.

### React.lazy Gotchas
- `React.lazy` only works with default exports — affected components currently use named exports. Wrap with a re-export module: `export default ComponentName` in a separate file, or use a factory wrapper.
- Alternative: Use Vite's `import()` directly and manage loading state manually, preserving our named-export-only convention.

### Image Unloading Considerations
- Cleared images that re-enter the viewport will likely hit the browser's disk cache (HTTP 304), so re-load is fast.
- `revokeObjectURL` only applies if we create blob URLs — current implementation uses static paths, so this is a no-op today but future-proofs the system.
