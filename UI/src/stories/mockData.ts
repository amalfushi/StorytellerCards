import type {
  CharacterDef,
  PlayerSeat,
  NightOrderData,
  NightOrderEntry,
  NightHistoryEntry,
} from '../types';
import { Alignment } from '../types';
import charactersData from '../data/characters.json';
import nightOrderData from '../data/nightOrder.json';

// ──────────────────────────────────────────────
// Characters
// ──────────────────────────────────────────────

export const mockCharacters: CharacterDef[] = charactersData as CharacterDef[];
export const mockNightOrder = nightOrderData as NightOrderData;

/** Specific characters referenced in stories. */
export const fortuneTeller = mockCharacters.find((c) => c.id === 'fortuneteller')!;
export const imp = mockCharacters.find((c) => c.id === 'imp')!;
export const cerenovus = mockCharacters.find((c) => c.id === 'cerenovus')!;
export const noble = mockCharacters.find((c) => c.id === 'noble')!;
export const drunk = mockCharacters.find((c) => c.id === 'drunk')!;
export const slayer = mockCharacters.find((c) => c.id === 'slayer')!;
export const philosopher = mockCharacters.find((c) => c.id === 'philosopher')!;
export const huntsman = mockCharacters.find((c) => c.id === 'huntsman')!;

// ──────────────────────────────────────────────
// Night order entries (for NightFlashcard / StructuralCard stories)
// ──────────────────────────────────────────────

export const fortuneTellerFirstNightEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'fortuneteller',
)!;

export const fortuneTellerOtherNightEntry: NightOrderEntry = mockNightOrder.otherNights.find(
  (e) => e.id === 'fortuneteller',
)!;

export const impOtherNightEntry: NightOrderEntry = mockNightOrder.otherNights.find(
  (e) => e.id === 'imp',
)!;

export const cerenovusFirstNightEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'cerenovus',
)!;

export const nobleFirstNightEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'noble',
)!;

/** Structural entries */
export const duskFirstNightEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'dusk',
)!;

export const dawnFirstNightEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'dawn',
)!;

export const minionInfoEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'minioninfo',
)!;

export const demonInfoEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'demoninfo',
)!;

// ──────────────────────────────────────────────
// Mock Players
// ──────────────────────────────────────────────

export const mockPlayers: PlayerSeat[] = [
  {
    seat: 1,
    playerName: 'Alice',
    characterId: 'noble',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 2,
    playerName: 'Bob',
    characterId: 'imp',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Evil',
    startingAlignment: 'Evil',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 3,
    playerName: 'Charlie',
    characterId: 'fortuneteller',
    alive: false,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 4,
    playerName: 'Diana',
    characterId: 'cerenovus',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Evil',
    startingAlignment: 'Evil',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 5,
    playerName: 'Eve',
    characterId: 'drunk',
    alive: false,
    ghostVoteUsed: true,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 6,
    playerName: 'Frank',
    characterId: 'philosopher',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 7,
    playerName: 'Grace',
    characterId: 'slayer',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 8,
    playerName: 'Hank',
    characterId: 'baron',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Evil',
    startingAlignment: 'Evil',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 9,
    playerName: 'Iris',
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Unknown',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: false,
  },
  {
    seat: 10,
    playerName: 'TravJack',
    characterId: 'angel',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Good',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: true,
  },
];

/** Convenience look-ups for specific mock players. */
export const alicePlayer = mockPlayers[0]; // Noble, alive
export const bobPlayer = mockPlayers[1]; // Imp, alive
export const charliePlayer = mockPlayers[2]; // Fortune Teller, dead
export const dianaPlayer = mockPlayers[3]; // Cerenovus, alive
export const evePlayer = mockPlayers[4]; // Drunk, dead + ghost vote used
export const irisPlayer = mockPlayers[8]; // No character assigned
export const travJackPlayer = mockPlayers[9]; // Traveller

// ──────────────────────────────────────────────
// Filtered night order (simulating a Boozling script game)
// ──────────────────────────────────────────────

const boozlingCharacterIds = new Set([
  'noble',
  'pixie',
  'highpriestess',
  'balloonist',
  'fortuneteller',
  'oracle',
  'savant',
  'philosopher',
  'huntsman',
  'fisherman',
  'slayer',
  'sage',
  'cannibal',
  'drunk',
  'mutant',
  'damsel',
  'klutz',
  'golem',
  'baron',
  'cerenovus',
  'scarletwoman',
  'marionette',
  'nodashii',
  'fanggu',
  'imp',
]);

export const mockFirstNightEntries: NightOrderEntry[] = mockNightOrder.firstNight.filter(
  (e) => e.type === 'structural' || boozlingCharacterIds.has(e.id),
);

export const mockOtherNightEntries: NightOrderEntry[] = mockNightOrder.otherNights.filter(
  (e) => e.type === 'structural' || boozlingCharacterIds.has(e.id),
);

// ──────────────────────────────────────────────
// Mock Night History Entries
// ──────────────────────────────────────────────

export const mockNightHistoryEntries: NightHistoryEntry[] = [
  {
    dayNumber: 1,
    isFirstNight: true,
    completedAt: '2026-02-15T22:30:00.000Z',
    subActionStates: {
      noble: [true, true],
      fortuneteller: [true, true],
      imp: [true],
    },
    notes: {
      noble: 'Shown Alice, Bob, Charlie — one is evil.',
      fortuneteller: 'Chose Alice and Bob — No.',
    },
  },
  {
    dayNumber: 2,
    isFirstNight: false,
    completedAt: '2026-02-15T23:15:00.000Z',
    subActionStates: {
      fortuneteller: [true, true],
      philosopher: [true],
      imp: [true],
    },
    notes: {
      imp: 'Killed Diana.',
    },
  },
  {
    dayNumber: 3,
    isFirstNight: false,
    completedAt: '2026-02-16T00:05:00.000Z',
    subActionStates: {
      fortuneteller: [true, false],
      philosopher: [false],
      imp: [true],
      cerenovus: [true, true],
    },
    notes: {},
  },
];

/** 8+ entries for scroll-testing the NightHistoryDrawer. */
export const mockManyNightHistoryEntries: NightHistoryEntry[] = [
  ...mockNightHistoryEntries,
  {
    dayNumber: 4,
    isFirstNight: false,
    completedAt: '2026-02-16T01:00:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true] },
    notes: { fortuneteller: 'Chose Eve and Frank — Yes (poisoned).' },
  },
  {
    dayNumber: 5,
    isFirstNight: false,
    completedAt: '2026-02-16T01:45:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true], cerenovus: [true, true] },
    notes: {},
  },
  {
    dayNumber: 6,
    isFirstNight: false,
    completedAt: '2026-02-16T02:20:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true] },
    notes: { imp: 'Starpass attempted to Bob.' },
  },
  {
    dayNumber: 7,
    isFirstNight: false,
    completedAt: '2026-02-16T03:00:00.000Z',
    subActionStates: { fortuneteller: [true, true], philosopher: [true], imp: [true] },
    notes: { philosopher: 'Became the Slayer.' },
  },
  {
    dayNumber: 8,
    isFirstNight: false,
    completedAt: '2026-02-16T03:40:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true] },
    notes: {},
  },
];

// ──────────────────────────────────────────────
// Mock Player Generator
// ──────────────────────────────────────────────

const playerNames = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Hank',
  'Iris',
  'Jack',
  'Karen',
  'Leo',
  'Mia',
  'Nate',
  'Olive',
  'Pete',
  'Quinn',
  'Rosa',
  'Sam',
  'Tina',
];

const characterPool = [
  'noble',
  'fortuneteller',
  'slayer',
  'philosopher',
  'drunk',
  'sage',
  'oracle',
  'huntsman',
  'cannibal',
  'savant',
  'fisherman',
  'balloonist',
  'pixie',
  'highpriestess',
  'mutant',
  'damsel',
  'klutz',
  'golem',
  'baron',
  'cerenovus',
  'scarletwoman',
  'marionette',
  'imp',
  'fanggu',
];

/**
 * Generate N mock players for layout / stress-test stories.
 * Cycles through player names and character IDs.
 */
export function generateMockPlayers(count: number): PlayerSeat[] {
  return Array.from({ length: count }, (_, i): PlayerSeat => {
    const charId = characterPool[i % characterPool.length];
    // Simple heuristic: last ~3 characters in pool are evil
    const isEvil = ['baron', 'cerenovus', 'scarletwoman', 'marionette', 'imp', 'fanggu'].includes(
      charId,
    );
    return {
      seat: i + 1,
      playerName: playerNames[i % playerNames.length],
      characterId: charId,
      alive: true,
      ghostVoteUsed: false,
      visibleAlignment: Alignment.Unknown,
      actualAlignment: isEvil ? Alignment.Evil : Alignment.Good,
      startingAlignment: isEvil ? Alignment.Evil : Alignment.Good,
      activeReminders: [],
      isTraveller: false,
    };
  });
}
