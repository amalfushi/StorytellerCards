# Blood on the Clocktower — Domain Knowledge

> This document explains the tabletop game concepts needed to understand Storyteller Cards.

## The Game

Blood on the Clocktower (BotC) is a social deduction game for 5–20 players. One player is the **Storyteller** (game master) who runs the game. All other players receive a secret character with a secret role.

## Teams

- **Good team**: Townsfolk + Outsiders. Goal: execute the Demon.
- **Evil team**: Minions + Demons. Goal: reduce the town to 2 living players (or fewer).
- The Storyteller is neutral — they facilitate the game.

## Character Types

| Type | Team | Count in Game | Purpose |
|------|------|--------------|---------|
| **Townsfolk** | Good | Scales with player count | Helpful abilities (info, protection) |
| **Outsider** | Good | 0–4 depending on count | Usually hinder their own team |
| **Minion** | Evil | 1–3 depending on count | Support the Demon, deceive the town |
| **Demon** | Evil | 1 (usually) | Kills players at night, must be found |
| **Traveller** | Varies | Join/leave anytime | Special rules, assigned alignment by ST |
| **Fabled** | N/A | Added by ST as needed | Meta-game adjusters (not player characters) |

## Player Count Distribution

For each total player count, there's a fixed distribution:

| Players | Townsfolk | Outsiders | Minions | Demons |
|---------|-----------|-----------|---------|--------|
| 5 | 3 | 0 | 1 | 1 |
| 6 | 3 | 1 | 1 | 1 |
| 7 | 5 | 0 | 1 | 1 |
| 8 | 5 | 1 | 1 | 1 |
| 9 | 5 | 2 | 1 | 1 |
| 10 | 7 | 0 | 2 | 1 |
| 11 | 7 | 1 | 2 | 1 |
| 12 | 7 | 2 | 2 | 1 |
| 13 | 9 | 0 | 3 | 1 |
| 14 | 9 | 1 | 3 | 1 |
| 15 | 9 | 2 | 3 | 1 |

Some characters modify this (e.g., Baron: +2 Outsiders, −2 Townsfolk). See [`playerCountRules.ts`](../UI/src/data/playerCountRules.ts).

## Scripts

A **Script** is a curated subset of characters used for a specific game. Examples:
- **Trouble Brewing** (beginner, official)
- **Boozling** (custom, used for this project's development — see [`Boozling.json`](milestone0/Boozling.json))
- **One in One Out** (custom — see [`OneInOneOut.json`](milestone2/OneInOneOut.json))

Scripts define which characters *could* appear in a game. The actual characters assigned depend on player count.

## Game Flow

### Setup
1. Storyteller picks a Script
2. Players sit in a circle (the **Town Square**)
3. Storyteller assigns each player a character (secretly)
4. Each player gets a character token — only they and the Storyteller know it

### Day Phase
- **Public info**: player names, seat positions, who is alive/dead
- **Secret info**: characters, alignments (only Storyteller sees these)
- Players discuss, accuse, and vote to execute someone
- The [`ShowCharactersToggle`](../UI/src/components/common/ShowCharactersToggle.tsx) controls this Day/Night visibility in the app
- Day has a discussion timer ([`DayTimer`](../UI/src/components/Timer/DayTimer.tsx))

### Night Phase
- The Storyteller "puts the town to sleep" (everyone closes eyes)
- Characters wake **one at a time** in a specific order (the Night Order)
- Each character performs their ability (the Storyteller facilitates):
  - **Information** characters learn something (e.g., Empath learns if neighbors are evil)
  - **Action** characters choose targets (e.g., Poisoner poisons someone)
  - **Kill** characters choose who dies (e.g., Imp kills a player)
- The Storyteller tracks all this secretly
- This is what the **Night Phase Flashcards** automate

### First Night vs Other Nights
- **First Night**: includes special setup steps (Minion Info, Demon Info) and some characters only act on the first night
- **Other Nights**: the regular night cycle for the rest of the game
- The night order is different for each (different characters, different positions)

## Key Concepts for the App

### The Grimoire
In the physical game, the Storyteller has a **Grimoire** — a hidden book with tokens for every player showing their true character and any status effects. The Town Square view in this app is a digital Grimoire.

### Status Effects
- **Drunk**: character thinks they have an ability but it does nothing (they get false info)
- **Poisoned**: same effect as drunk, but caused by another character's ability
- These are tracked via [`PlayerToken`](../UI/src/types/index.ts) on each `PlayerSeat`

### Death
- Dead players can still participate in Day discussions
- Dead players get **one ghost vote** for the rest of the game (`ghostVoteUsed` flag)
- Dead characters generally don't wake at night (but there are exceptions)

### Travellers
- Can join or leave the game at any time
- Get assigned an alignment by the Storyteller (not by the script)
- Have special rules for execution (exile instead of execution)
- Added via [`AddTravellerDialog`](../UI/src/components/TownSquare/AddTravellerDialog.tsx)

### Reminder Tokens
In the physical game, small tokens are placed near player tokens to track ongoing effects:
- "Is the Drunk" — placed by ST during setup
- "Poisoned" — placed when a character uses their poison ability
- "Dead" — placed when a character dies
- Character-specific reminders (e.g., Fortune Teller's "Red Herring")

The app tracks these in `PlayerSeat.activeReminders` and `PlayerSeat.tokens`. The [`TokenManager`](../UI/src/components/TownSquare/TokenManager.tsx) (M3-12) handles placement in the Town Square view.

## Why the Storyteller Needs This App

Running a BotC game manually requires:
1. Memorizing or looking up the night order for the chosen script
2. Remembering each character's exact ability text
3. Tracking who is drunk, poisoned, dead, etc.
4. Keeping notes on what happened each night
5. Managing timers for Day discussion

This app automates all of that, especially the Night Phase where getting the order or instructions wrong can break the game.
