# Milestone 2 — Progress

> Bug fixes, character assignment, script importing.
>
> Requirements: [`Milestone2.md`](Milestone2.md)

---

## Completed Items

- **M2-1**: Fixed nested button warning in `HomePage` (`IconButton` outside `CardActionArea`)
- **M2-2**: Character assignment before first night (random + manual, player count distribution table)
  - [`CharacterAssignmentDialog.tsx`](../../UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx)
  - [`characterAssignment.ts`](../../UI/src/utils/characterAssignment.ts)
  - [`playerCountRules.ts`](../../UI/src/data/playerCountRules.ts)
- **M2-3**: Show `abilityShort` on `NightFlashcard`
- **M2-4**: Fixed `SubActionChecklist` indentation (If at same level, continuations indented)
- **M2-5**: Script importing working + 18 new characters added + unknown character fallbacks
