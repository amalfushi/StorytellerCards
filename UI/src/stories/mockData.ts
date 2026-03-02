import type {
  CharacterDef,
  PlayerSeat,
  PlayerToken,
  NightOrderData,
  NightOrderEntry,
  NightHistoryEntry,
} from '../types';
import { Alignment, CharacterType } from '../types';
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

/**
 * Mock Traveller character — "Spirit of Ivory".
 * Not in characters.json; created here so stories can demonstrate
 * the split blue/red traveller border and alignment-coloured outline.
 */
export const spiritOfIvory: CharacterDef = {
  id: 'spiritofivory',
  name: 'Spirit of Ivory',
  type: CharacterType.Traveller,
  defaultAlignment: Alignment.Good,
  abilityShort: 'There can\u2019t be more than 1 extra death per day.',
  abilityDetailed:
    'There can\u2019t be more than 1 extra death per day. If a player would die and this would mean more than 1 extra death this day, they don\u2019t die.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

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
    tokens: [],
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
    tokens: [],
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
    tokens: [],
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
    tokens: [],
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
    tokens: [],
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
    tokens: [],
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
    tokens: [],
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
    tokens: [],
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
    tokens: [],
  },
  {
    seat: 10,
    playerName: 'TravJack',
    characterId: 'spiritofivory',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Good',
    actualAlignment: 'Good',
    startingAlignment: 'Good',
    activeReminders: [],
    isTraveller: true,
    tokens: [],
  },
];

/** Convenience look-ups for specific mock players. */
export const alicePlayer = mockPlayers[0]; // Noble, alive
export const bobPlayer = mockPlayers[1]; // Imp, alive
export const charliePlayer = mockPlayers[2]; // Fortune Teller, dead
export const dianaPlayer = mockPlayers[3]; // Cerenovus, alive
export const evePlayer = mockPlayers[4]; // Drunk, dead + ghost vote used
export const irisPlayer = mockPlayers[8]; // No character assigned
export const travJackPlayer = mockPlayers[9]; // Traveller (Spirit of Ivory, Good)

/** Evil-aligned traveller for demo (assigned evil by Storyteller). */
export const evilTravellerPlayer: PlayerSeat = {
  seat: 13,
  playerName: 'Wendy',
  characterId: 'spiritofivory',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: 'Evil',
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: true,
  tokens: [],
};

/** M3-6: Alignment-mismatch mock players for story testing. */
export const evilTownsfolkPlayer: PlayerSeat = {
  seat: 11,
  playerName: 'Mallory',
  characterId: 'noble',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: 'Unknown',
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

export const goodDemonPlayer: PlayerSeat = {
  seat: 12,
  playerName: 'Victor',
  characterId: 'imp',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: 'Unknown',
  actualAlignment: Alignment.Good,
  startingAlignment: Alignment.Evil,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

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
    selections: {},
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
    selections: {},
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
    selections: {},
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
    selections: {},
  },
  {
    dayNumber: 5,
    isFirstNight: false,
    completedAt: '2026-02-16T01:45:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true], cerenovus: [true, true] },
    notes: {},
    selections: {},
  },
  {
    dayNumber: 6,
    isFirstNight: false,
    completedAt: '2026-02-16T02:20:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true] },
    notes: { imp: 'Starpass attempted to Bob.' },
    selections: {},
  },
  {
    dayNumber: 7,
    isFirstNight: false,
    completedAt: '2026-02-16T03:00:00.000Z',
    subActionStates: { fortuneteller: [true, true], philosopher: [true], imp: [true] },
    notes: { philosopher: 'Became the Slayer.' },
    selections: {},
  },
  {
    dayNumber: 8,
    isFirstNight: false,
    completedAt: '2026-02-16T03:40:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true] },
    notes: {},
    selections: {},
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
      tokens: [],
    };
  });
}

// ──────────────────────────────────────────────
// Mock Token Data (F3-16)
// ──────────────────────────────────────────────

/** Token colour constants matching TokenManager.tsx */
export const TOKEN_COLORS = {
  drunk: '#1976d2',
  poisoned: '#7b1fa2',
  custom: '#ff9800',
} as const;

/** A single Drunk token. */
export const mockDrunkToken: PlayerToken = {
  id: 'tok-drunk-1',
  type: 'drunk',
  label: 'Drunk',
  color: TOKEN_COLORS.drunk,
};

/** A single Poisoned token. */
export const mockPoisonedToken: PlayerToken = {
  id: 'tok-poisoned-1',
  type: 'poisoned',
  label: 'Poisoned',
  color: TOKEN_COLORS.poisoned,
};

/** Pre-built custom token array for reuse. */
export const mockCustomTokens: PlayerToken[] = [
  {
    id: 'tok-custom-1',
    type: 'custom',
    label: 'Is the Drunk',
    sourceCharacterId: 'drunk',
    color: TOKEN_COLORS.custom,
  },
  {
    id: 'tok-custom-2',
    type: 'custom',
    label: 'Chosen',
    sourceCharacterId: 'fortuneteller',
    color: TOKEN_COLORS.custom,
  },
  {
    id: 'tok-custom-3',
    type: 'custom',
    label: 'No ability',
    sourceCharacterId: 'philosopher',
    color: TOKEN_COLORS.custom,
  },
  {
    id: 'tok-custom-4',
    type: 'custom',
    label: 'Used ability',
    sourceCharacterId: 'slayer',
    color: TOKEN_COLORS.custom,
  },
  {
    id: 'tok-custom-5',
    type: 'custom',
    label: 'Mad',
    sourceCharacterId: 'cerenovus',
    color: '#e91e63',
  },
  { id: 'tok-custom-6', type: 'custom', label: 'Safe', color: '#4caf50' },
  { id: 'tok-custom-7', type: 'custom', label: 'Protected', color: '#2196f3' },
  { id: 'tok-custom-8', type: 'custom', label: 'Target', color: '#f44336' },
];

/** Drunk token list (single item). */
export const mockDrunkTokens: PlayerToken[] = [mockDrunkToken];

/** Poisoned token list (single item). */
export const mockPoisonedTokens: PlayerToken[] = [mockPoisonedToken];

/** Drunk + 3 custom tokens. */
export const mockMultipleTokens: PlayerToken[] = [
  mockDrunkToken,
  mockCustomTokens[0],
  mockCustomTokens[1],
  mockCustomTokens[2],
];

/** Worst case: 1 drunk + 1 poisoned + 8 custom tokens (10 total). */
export const mockManyTokens: PlayerToken[] = [
  mockDrunkToken,
  mockPoisonedToken,
  ...mockCustomTokens,
];

/** Player with a Drunk token (Alice, Noble). */
export const playerWithDrunk: PlayerSeat = {
  ...alicePlayer,
  tokens: mockDrunkTokens,
};

/** Player with a Poisoned token (Bob, Imp). */
export const playerWithPoisoned: PlayerSeat = {
  ...bobPlayer,
  tokens: mockPoisonedTokens,
};

/** Player with Drunk + 3 custom tokens (Diana, Cerenovus). */
export const playerWithMultipleTokens: PlayerSeat = {
  ...dianaPlayer,
  tokens: mockMultipleTokens,
};

/** Player with 10 tokens — worst case (Charlie, Fortune Teller). */
export const playerWithManyTokens: PlayerSeat = {
  ...charliePlayer,
  alive: true,
  tokens: mockManyTokens,
};

// ──────────────────────────────────────────────
// Worst-case 20-player roster (F3-4)
// ──────────────────────────────────────────────

/**
 * Hand-crafted 20-player list for worst-case TownSquareLayout stories.
 *
 * Includes a realistic mix of:
 * - 12 Townsfolk/Outsiders (Good)
 * - 3 Minions + 2 Demons (Evil)
 * - 2 Travellers (one Good, one Evil-aligned)
 * - 1 unassigned seat
 * - 4 dead players (two with ghost vote used)
 * - varied long/short names
 * - F3-16: some players have tokens (seats 3, 7, 10, 16)
 */
export const worstCase20Players: PlayerSeat[] = [
  {
    seat: 1,
    playerName: 'Alice',
    characterId: 'noble',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 2,
    playerName: 'Bob',
    characterId: 'fortuneteller',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 3,
    playerName: 'Charlie',
    characterId: 'slayer',
    alive: false,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [mockDrunkToken],
  },
  {
    seat: 4,
    playerName: 'Diana',
    characterId: 'philosopher',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 5,
    playerName: 'Eve',
    characterId: 'drunk',
    alive: false,
    ghostVoteUsed: true,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 6,
    playerName: 'Frank',
    characterId: 'oracle',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 7,
    playerName: 'Grace',
    characterId: 'sage',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [mockPoisonedToken, mockCustomTokens[0], mockCustomTokens[4]],
  },
  {
    seat: 8,
    playerName: 'Hank',
    characterId: 'huntsman',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 9,
    playerName: 'Iris',
    characterId: 'cannibal',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 10,
    playerName: 'Jack',
    characterId: 'highpriestess',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [mockDrunkToken, mockPoisonedToken, ...mockCustomTokens.slice(0, 3)],
  },
  {
    seat: 11,
    playerName: 'Karen',
    characterId: 'mutant',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 12,
    playerName: 'Leo',
    characterId: 'damsel',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 13,
    playerName: 'Mia',
    characterId: 'baron',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 14,
    playerName: 'Nate',
    characterId: 'cerenovus',
    alive: false,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 15,
    playerName: 'Olive',
    characterId: 'scarletwoman',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 16,
    playerName: 'Pete',
    characterId: 'imp',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [mockCustomTokens[5]],
  },
  {
    seat: 17,
    playerName: 'Quinn',
    characterId: 'fanggu',
    alive: false,
    ghostVoteUsed: true,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 18,
    playerName: 'Rosa',
    characterId: 'spiritofivory',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Good,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: true,
    tokens: [],
  },
  {
    seat: 19,
    playerName: 'Sam',
    characterId: 'spiritofivory',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Evil,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: true,
    tokens: [],
  },
  {
    seat: 20,
    playerName: 'Tina',
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
];
