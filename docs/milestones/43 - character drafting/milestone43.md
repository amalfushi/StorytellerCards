# Milestone 43 — Character Drafting

## Status: 🚧 In Progress

**Started:** 2026-08-23

This milestone adds player-driven character drafting. Each non-Traveller player
privately chooses one of three legal script characters or accepts an
irreversible mulligan that rolls one different legal character. The system must
preserve a legal Blood on the Clocktower setup after every choice, including
setup modifiers, required partners, hidden identities, repeated characters,
special game modes, and seating constraints.

## Product goals

1. Give players meaningful agency without allowing a draft choice to make the
   game setup impossible.
2. Preserve exact character-type counts and every supported setup rule.
3. Keep hidden actual characters separate from player-visible draft results.
4. Give the Storyteller a complete draft board and the ability to adjust
   generated offers before revealing them.
5. Randomize seating after drafting, then let the Storyteller secretly repair
   adjacency and line constraints.
6. Minimize information leaked by offer timing, option composition, or draft
   order.

## Non-goals

- Public simultaneous drafting.
- Perfectly uniform randomness. Correctness and option quality take precedence.
- Preventing every inference from a finite script and exact role counts.
- Treating in-game character changes such as Pit-Hag, Engineer, Farmer, Barber,
  Hatter, or Snake Charmer as initial draft count changes.
- Drafting Travellers, Fabled, or Loric characters.

## Approved hybrid design

The implementation combines three mechanisms:

1. **Exact feasibility engine:** a character is legal only when committing it
   leaves at least one complete legal setup.
2. **Candidate setup ensemble:** retain multiple complete legal setups and use
   them to produce varied, mixed, believable option sets.
3. **Storyteller draft board:** pre-generate every offer and mulligan result,
   show all hidden actual/apparent outcomes to the Storyteller, and allow edits
   before any player sees an offer.

Probability weights rank only candidates already proven legal. They never
decide legality.

```text
isOfferable(character) =
  hasLegalCompletion(commitCharacter(currentState, character))
```

All three options independently satisfy this rule. The mulligan result is
precomputed from a fourth legal branch, excludes the original three options,
and becomes mandatory once selected.

## Canonical rule model

Draft rules are declarative and separate from display components:

| Rule family             | Examples                                                     | Solver effect                                                                |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Count modifier          | Baron, Fang Gu, Vigormortis                                  | Changes exact type targets.                                                  |
| Variable count modifier | Balloonist, Hermit, Godfather, Xaan, Kazali, Lord of Typhon  | Branches over Storyteller-approved values before offers are revealed.        |
| Required partner        | Choirboy → King, Huntsman → Damsel                           | Reserves the required character or rejects the branch.                       |
| Repeated character      | Village Idiot, Legion                                        | Allows a bounded or mode-specific duplicate count.                           |
| Game mode               | Atheist, Legion, Lil' Monsta, Summoner, Kazali               | Replaces normal setup rules or changes how evil assignments are represented. |
| Hidden identity         | Drunk, Lunatic, Marionette, Kazali conversions               | Stores actual and apparent draft outcomes independently.                     |
| Alignment setup         | Bounty Hunter                                                | Reserves and marks an evil Townsfolk without changing its character type.    |
| Incompatibility         | Heretic with Baron/Godfather/Lleech/Pit-Hag/Spy/Widow        | Prevents both characters from being in the completed setup.                  |
| Off-board resource      | Demon/Summoner/Snitch bluffs, Boffin ability, false identity | Reserves or warns about enough not-in-play identities.                       |
| Seating constraint      | Marionette, Lord of Typhon, No Dashii                        | Applied by constrained post-draft seating, not option counts.                |
| Information rule        | Poppy Grower, Magician, King, Damsel, Vizier, Widow          | Changes reveal timing and recipient information.                             |

The canonical registry must distinguish:

- `hard` rules that can invalidate a branch;
- `workflow` rules that require a hidden Storyteller decision;
- `presentation` rules that alter what a player is shown; and
- `seating` rules resolved after roles are final.

## Exhaustive regular-character audit

The audit covered all 138 regular definitions currently in
`UI/src/data/characters`: 69 Townsfolk, 23 Outsiders, 27 Minions, and 19 Demons.

### Townsfolk with drafting or setup impact

| Character     | Required handling                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alchemist     | Storyteller selects a Minion ability. Some jinxed abilities change setup, especially Alchemist-Summoner (`No Demon`). Treat the gained ability as a hidden setup decision, not a second drafted character. |
| Atheist       | Irreversible all-good mode. It is illegal after any evil actual character is committed. Remaining offers are good only.                                                                                    |
| Balloonist    | Storyteller chooses `+0` or `+1 Outsider`; the choice must be fixed in the branch before offers depend on it.                                                                                              |
| Bounty Hunter | Requires one other Townsfolk to start evil. Reserve an eligible Townsfolk and conceal the alignment change.                                                                                                |
| Choirboy      | Requires King in play. Committing Choirboy reserves King immediately.                                                                                                                                      |
| Huntsman      | Requires Damsel in play. Committing Huntsman reserves an Outsider slot for Damsel immediately.                                                                                                             |
| Magician      | Evil players receive false team information. Delay evil-team reveals until the final actual setup is known.                                                                                                |
| No Dashii     | Its two neighbors must be Townsfolk for the intended setup. Resolve through constrained seating after the draft.                                                                                           |
| Poppy Grower  | Suppresses normal Minion/Demon recognition. Reveal workflow must branch before evil-team information is shown.                                                                                             |
| Village Idiot | Allows one to three copies; if extras exist, one extra is drunk. Copies consume Townsfolk slots and need distinct player assignments.                                                                      |

Other Townsfolk have no initial count or eligibility effect:
Acrobat, Alsaahir, Amnesiac, Artist, Banshee, Cannibal, Chambermaid, Chef,
Clockmaker, Courtier, Cult Leader, Dreamer, Empath, Engineer, Exorcist, Farmer,
Fisherman, Flowergirl, Fool, Fortune Teller, Gambler, General, Gossip,
Grandmother, High Priestess, Innkeeper, Investigator, Juggler, King, Knight,
Librarian, Lycanthrope, Mathematician, Mayor, Minstrel, Monk, Nightwatchman,
Noble, Oracle, Pacifist, Philosopher, Pixie, Preacher, Princess, Professor,
Ravenkeeper, Sage, Sailor, Savant, Seamstress, Shugenja, Slayer, Snake Charmer,
Soldier, Steward, Tea Lady, Town Crier, Undertaker, Virgin, and Washerwoman.
Their setup tokens and in-game transformations remain normal post-draft setup.

### Outsiders with drafting or setup impact

| Character | Required handling                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drunk     | The actual character consumes an Outsider slot, but the player receives a false three-option draft and apparent Townsfolk result. Preserve both actual and apparent outcomes. |
| Hermit    | Storyteller chooses `-0` or `-1 Outsider`. It also has every Outsider ability on the script, so the draft board must flag unusually complex scripts.                          |
| Heretic   | Cannot coexist with Baron, Godfather, Lleech, Pit-Hag, Spy, or Widow under the current official jinx data.                                                                    |
| Lunatic   | The actual character consumes an Outsider slot, but the player receives a Demon-like draft and fake bluffs. The real Demon must know the Lunatic and their choices.           |
| Snitch    | Every Minion receives three bluffs. Validate or warn about the off-board good-character pool before reveal.                                                                   |

Other Outsiders have no initial count or eligibility effect:
Barber, Butler, Damsel, Golem, Goon, Hatter, Klutz, Moonchild, Mutant, Ogre,
Plague Doctor, Politician, Puzzlemaster, Recluse, Saint, Sweetheart, Tinker, and
Zealot. Damsel remains a required partner and information rule when Huntsman
selects it.

### Minions with drafting or setup impact

| Character  | Required handling                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Baron      | Adds two Outsiders and removes two Townsfolk. Incompatible with Heretic.                                                            |
| Boffin     | Requires an eligible not-in-play good ability, known to Boffin and Demon. Some abilities are forbidden by jinx.                     |
| Evil Twin  | Requires an opposing-alignment twin and a private paired reveal.                                                                    |
| Godfather  | Storyteller chooses `-1` or `+1 Outsider`. Incompatible with Heretic.                                                               |
| Marionette | Actual Minion with a false good draft. Must neighbor a Demon and must remain hidden from its player.                                |
| Pit-Hag    | Incompatible with Heretic. Its later character changes do not alter initial draft counts.                                           |
| Spy        | Incompatible with Heretic. Registration as good does not alter its Minion slot.                                                     |
| Summoner   | Starts with no Demon player, receives three bluffs, and creates a Demon on night three. The missing Demon slot becomes a good slot. |
| Vizier     | Publicly known. Its reveal must happen only after every hidden draft outcome is finalized.                                          |
| Widow      | Incompatible with Heretic and requires one good player to learn a Widow is in play.                                                 |
| Xaan       | The selected `X` is exactly the number of Outsiders. Fix `X` before dependent offers are revealed.                                  |

Other Minions have no initial count or eligibility effect:
Assassin, Boomdandy, Cerenovus, Devil's Advocate, Fearmonger, Goblin, Harpy,
Mastermind, Mezepheles, Organ Grinder, Poisoner, Psychopath, Scarlet Woman,
Witch, Wizard, and Wraith.

### Demons with drafting or setup impact

| Character      | Required handling                                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fang Gu        | Adds one Outsider and removes one Townsfolk.                                                                                                                                                                     |
| Kazali         | Chooses which players become which Minions. Players selected for conversion need provisional/apparent good drafts; final evil assignments are a hidden setup phase. Outsider adjustment is Storyteller-variable. |
| Legion         | Replaces the normal distribution with repeated Legion copies and a small good minority. It must be selected before incompatible normal evil assignments exist.                                                   |
| Lil' Monsta    | Setup-only Demon token, never a player draft option. Uses zero Demon players and one additional Minion player.                                                                                                   |
| Lleech         | Incompatible with Heretic and requires a hidden host selection.                                                                                                                                                  |
| Lord of Typhon | Adds one Minion, has a variable Outsider adjustment, and requires all evil players in one continuous line with the Demon in the middle.                                                                          |
| No Dashii      | Requires Townsfolk neighbors for intended poisoning and constrained seating.                                                                                                                                     |
| Vigormortis    | Removes one Outsider and adds one Townsfolk.                                                                                                                                                                     |

Other Demons have no initial count or eligibility effect:
Al-Hadikhia, Imp, Leviathan, Ojo, Po, Pukka, Riot, Shabaloth, Vortox,
Yaggababble, and Zombuul. Their public status, later transformations, or death
rules are handled after setup. Standard Demons still require three not-in-play
good bluffs unless another information rule changes that flow.

## Draft workflow

1. Storyteller selects participants, script, and drafting mode.
2. Engine generates legal setup branches and asks the Storyteller to resolve
   any variable setup values.
3. Engine creates a hidden board containing draft order, three options,
   mulligan result, actual character, apparent character, and rule warnings.
4. Storyteller edits or regenerates individual offers. Every edit is checked by
   the exact solver.
5. Offers are revealed privately one player at a time. Players choose one
   option or the mandatory mulligan.
6. Hidden-identity players see only their apparent draft. The Storyteller sees
   and commits the actual role first.
7. When all drafts are committed, the engine generates a randomized seating
   permutation satisfying hard adjacency/line constraints where possible.
8. Storyteller secretly edits and confirms seating, then performs ordered
   information reveals and normal first-night setup.

### Standalone draft simulator

The home page exposes a draft simulator that exercises the production offer
generator and player presentation without creating a session or game. It
supports official base scripts, custom script JSON import, player count and
setup-mode selection, normal choices, mandatory mulligans, offer regeneration,
and Storyteller-only diagnostics showing how each commitment changes the legal
candidate pool. A blocked state is explicit when fewer than four distinct legal
branches remain, because three choices plus a different mulligan cannot be
honestly generated from that state.

## Player experience

- Reuse the existing full-screen slot-machine presentation.
- Normal draft: three synchronized columns, each ending on one offered
  character.
- The player taps one character or **Mulligan**.
- Mulligan: the three columns collapse to one, the predetermined fourth result
  rolls, and no further choice is available.
- Do not show public draft position, remaining role counts, rejected options,
  or other players' offers.
- Clearly state that a mulligan is final before starting its animation.

## State model

Draft state is persisted on `Game` so refresh and cross-device sync cannot
reroll or reveal different outcomes.

```ts
interface CharacterDraftState {
  status: "planning" | "ready" | "drafting" | "complete" | "cancelled";
  playerOrder: PlayerId[];
  currentPlayerIndex: number;
  setup: DraftSetupDecisions;
  entries: Record<PlayerId, CharacterDraftEntry>;
  revision: number;
}

interface CharacterDraftEntry {
  offeredCharacterIds: [string, string, string];
  mulliganCharacterId: string;
  selectedCharacterId?: string;
  actualCharacterId?: string;
  apparentCharacterId?: string;
  resolution: "pending" | "choice" | "mulligan";
}
```

Persist generated outcomes before reveal. Any Storyteller edit increments the
draft revision. Once an entry is revealed, changing it requires an explicit
reset confirmation.

## Information-leak mitigations

- Randomize private draft order and hide turn numbers.
- Pre-generate offers so response timing does not expose solver pressure.
- Prefer mixed character types when several legal branches support them.
- Avoid repeatedly showing the same unselected character unless scarcity
  requires it.
- Keep option probabilities and candidate setup counts hidden.
- Randomize final seating independently of draft order.
- Allow the Storyteller to repair adjacency secretly.
- Document that exact counts make zero-information drafting impossible; the
  goal is bounded, non-actionable leakage.

## Implementation phases

### Phase 1 — Rule and feasibility foundation

- [x] Audit all regular characters.
- [x] Define rule families and edge-case catalog.
- [x] Add the canonical draft-rule registry.
- [x] Add a pure exact-feasibility engine with memoized normalized states.
- [x] Add candidate legality and mulligan-pool helpers.
- [x] Add exhaustive unit tests for standard counts, modifiers, modes,
      dependencies, incompatibilities, and duplicates.

### Phase 2 — Persistent draft workflow

- [x] Add a standalone ephemeral simulator backed by production draft logic.
- [x] Add reusable offer generation and draft-session transitions.
- [ ] Add `CharacterDraftState` to the game model and API roundtrip.
- [ ] Add reducer actions for planning, board editing, reveal, choice,
      mulligan, reset, cancel, and completion.
- [ ] Prevent regenerated randomness after save, refresh, or sync.
- [ ] Add migration behavior for games without draft state.

### Phase 3 — Storyteller draft board

- [ ] Generate a complete hidden board from multiple legal setup candidates.
- [ ] Display actual/apparent outcomes, type pressure, dependencies, and
      seating warnings.
- [ ] Support legal per-entry regeneration and manual replacement.
- [ ] Lock or explicitly reset revealed entries.

### Phase 4 — Player draft presentation

- [x] Build the reusable three-column slot-machine draft presentation.
- [x] Add irreversible one-column mulligan animation.
- [ ] Add private handoff and accessibility-safe reduced-motion behavior.
- [ ] Add hidden-identity illusion drafts.

### Phase 5 — Seating and reveal orchestration

- [ ] Generate constrained random seating for Marionette, Lord of Typhon, and
      No Dashii.
- [ ] Integrate secret Storyteller edits with existing Town Square Edit Seating.
- [ ] Order Poppy Grower, Magician, King, Damsel, Vizier, Widow, Lunatic,
      Marionette, and evil-team reveals correctly.
- [ ] Require confirmed final seating before play starts.

## Testing strategy

- Example tests for every explicit registry rule.
- Property tests across player counts 5–15 and representative scripts:
  every offered choice and mulligan must have a complete legal continuation.
- Adversarial tests that repeatedly choose the option with the scarcest type.
- Permutation tests for draft order independence.
- Duplicate tests for Village Idiot and Legion only.
- Hidden-identity tests proving actual roles never enter player-visible props.
- Persistence and API roundtrip tests proving generated offers are stable.
- Component and Storybook interaction tests for choice, mulligan, private
  handoff, reduced motion, and Storyteller board editing.
- Seating property tests proving constraints or returning an explicit
  Storyteller-resolution warning when no permutation exists.
- Lifecycle E2E from game planning through draft, seating confirmation, refresh,
  and first night.

## Acceptance criteria

- [ ] Every visible option independently leaves at least one legal completion.
- [ ] Mulligan excludes all three original options and is mandatory.
- [ ] Exact final type counts match the resolved setup branch.
- [ ] All supported count modifiers, dependencies, incompatibilities, and
      special modes are enforced.
- [ ] Actual and apparent characters are independently persisted and revealed.
- [ ] Refresh and cross-device synchronization never reroll a revealed board.
- [ ] Storyteller can review and legally edit the entire board before reveal.
- [ ] Final seating is randomized and checked for every supported constraint.
- [ ] Draft order and remaining counts are not exposed to players.
- [ ] Existing manual assignment and randomization workflows remain available.
- [ ] Required unit, Storybook, API, and lifecycle suites pass.
