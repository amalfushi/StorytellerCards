import type {
  CharacterDef,
  NightHistoryEntry,
  NightOrderData,
  NightOrderEntry,
  Participant,
  Player,
  PlayerGameState,
  PlayerId,
  PlayerToken,
  Slot,
} from '../types';
import { Alignment, CharacterType } from '../types';
import { allCharacters, buildNightOrder } from '../data/characters/index.ts';
import type { TownSquarePlayer } from '../components/TownSquare/PlayerToken.tsx';

export const mockCharacters: CharacterDef[] = allCharacters;
export const mockNightOrder: NightOrderData = {
  firstNight: buildNightOrder(allCharacters, true),
  otherNights: buildNightOrder(allCharacters, false),
};

export const fortuneTeller = mockCharacters.find((c) => c.id === 'fortuneteller')!;
export const imp = mockCharacters.find((c) => c.id === 'imp')!;
export const cerenovus = mockCharacters.find((c) => c.id === 'cerenovus')!;
export const noble = mockCharacters.find((c) => c.id === 'noble')!;
export const drunk = mockCharacters.find((c) => c.id === 'drunk')!;
export const slayer = mockCharacters.find((c) => c.id === 'slayer')!;
export const philosopher = mockCharacters.find((c) => c.id === 'philosopher')!;
export const huntsman = mockCharacters.find((c) => c.id === 'huntsman')!;
export const pitHag = mockCharacters.find((c) => c.id === 'pithag')!;
export const lunatic = mockCharacters.find((c) => c.id === 'lunatic')!;
export const fangGu = mockCharacters.find((c) => c.id === 'fanggu')!;
export const baron = mockCharacters.find((c) => c.id === 'baron')!;
export const scarletWoman = mockCharacters.find((c) => c.id === 'scarletwoman')!;
export const nodashii = mockCharacters.find((c) => c.id === 'nodashii')!;
export const oracle = mockCharacters.find((c) => c.id === 'oracle')!;

export const spiritOfIvory: CharacterDef = {
  id: 'spiritofivory',
  name: 'Spirit of Ivory',
  type: CharacterType.Traveller,
  defaultAlignment: Alignment.Good,
  abilityShort: 'There can’t be more than 1 extra death per day.',
  abilityDetailed:
    'There can’t be more than 1 extra death per day. If a player would die and this would mean more than 1 extra death this day, they don’t die.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

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
export const minionInfoEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'minioninfo',
)!;
export const demonInfoEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'demoninfo',
)!;
export const pitHagOtherNightEntry: NightOrderEntry = mockNightOrder.otherNights.find(
  (e) => e.id === 'pithag',
)!;
export const lunaticFirstNightEntry: NightOrderEntry = mockNightOrder.firstNight.find(
  (e) => e.id === 'lunatic',
)!;
export const fangGuOtherNightEntry: NightOrderEntry = mockNightOrder.otherNights.find(
  (e) => e.id === 'fanggu',
)!;

export type StoryPlayer = TownSquarePlayer & { seat: number; playerName: string };

interface StoryPlayerOptions {
  id: string;
  seat: number;
  name: string;
  characterId?: string;
  alive?: boolean;
  ghostVoteUsed?: boolean;
  actualAlignment?: Alignment;
  startingAlignment?: Alignment;
  visibleAlignment?: Alignment;
  isTraveller?: boolean;
  tokens?: PlayerToken[];
  activeReminders?: string[];
}

export function makePlayerState(overrides: Partial<PlayerGameState> = {}): PlayerGameState {
  return {
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    tokens: [],
    ...overrides,
  };
}

export function makeStoryPlayer({
  id,
  seat,
  name,
  characterId = '',
  alive = true,
  ghostVoteUsed = false,
  actualAlignment = Alignment.Unknown,
  startingAlignment = actualAlignment,
  visibleAlignment = Alignment.Unknown,
  isTraveller = false,
  tokens = [],
  activeReminders = [],
}: StoryPlayerOptions): StoryPlayer {
  return {
    ...makePlayerState({
      characterId,
      alive,
      ghostVoteUsed,
      visibleAlignment,
      actualAlignment,
      startingAlignment,
      activeReminders,
      tokens,
    }),
    playerId: id,
    slotId: `slot-${seat}`,
    name,
    seatNumber: seat,
    playerName: name,
    seat,
    isTraveller,
  };
}

export function storyPlayersToSessionPlayers(players: StoryPlayer[]): Player[] {
  return players.map((player) => ({ id: player.playerId, name: player.name ?? player.playerName }));
}

export function storyPlayersToSlots(players: StoryPlayer[]): Slot[] {
  return players.map((player) => ({ kind: 'seat', id: player.slotId, playerId: player.playerId }));
}

export function storyPlayersToParticipants(players: StoryPlayer[]): Participant[] {
  return players.map((player) => ({ playerId: player.playerId, isTraveller: player.isTraveller }));
}

export function storyPlayersToPlayerState(
  players: StoryPlayer[],
): Record<PlayerId, PlayerGameState> {
  return Object.fromEntries(
    players.map((player) => [
      player.playerId,
      makePlayerState({
        characterId: player.characterId,
        alive: player.alive,
        ghostVoteUsed: player.ghostVoteUsed,
        visibleAlignment: player.visibleAlignment,
        actualAlignment: player.actualAlignment,
        startingAlignment: player.startingAlignment,
        activeReminders: player.activeReminders,
        tokens: player.tokens,
        apparentCharacterId: player.apparentCharacterId,
        alignmentHistory: player.alignmentHistory,
        gainedAbility: player.gainedAbility,
      }),
    ]),
  );
}

export const TOKEN_COLORS = {
  drunk: '#1976d2',
  poisoned: '#7b1fa2',
  custom: '#ff9800',
} as const;

export const mockDrunkToken: PlayerToken = {
  id: 'tok-drunk-1',
  type: 'drunk',
  label: 'Drunk',
  color: TOKEN_COLORS.drunk,
};
export const mockPoisonedToken: PlayerToken = {
  id: 'tok-poisoned-1',
  type: 'poisoned',
  label: 'Poisoned',
  color: TOKEN_COLORS.poisoned,
};
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
export const mockDrunkTokens: PlayerToken[] = [mockDrunkToken];
export const mockPoisonedTokens: PlayerToken[] = [mockPoisonedToken];
export const mockMultipleTokens: PlayerToken[] = [mockDrunkToken, ...mockCustomTokens.slice(0, 3)];
export const mockManyTokens: PlayerToken[] = [
  mockDrunkToken,
  mockPoisonedToken,
  ...mockCustomTokens,
];

export const mockPlayers: StoryPlayer[] = [
  makeStoryPlayer({
    id: 'player-1',
    seat: 1,
    name: 'Alice',
    characterId: 'noble',
    actualAlignment: Alignment.Good,
  }),
  makeStoryPlayer({
    id: 'player-2',
    seat: 2,
    name: 'Bob',
    characterId: 'imp',
    actualAlignment: Alignment.Evil,
  }),
  makeStoryPlayer({
    id: 'player-3',
    seat: 3,
    name: 'Charlie',
    characterId: 'fortuneteller',
    alive: false,
    actualAlignment: Alignment.Good,
  }),
  makeStoryPlayer({
    id: 'player-4',
    seat: 4,
    name: 'Diana',
    characterId: 'cerenovus',
    actualAlignment: Alignment.Evil,
  }),
  makeStoryPlayer({
    id: 'player-5',
    seat: 5,
    name: 'Eve',
    characterId: 'drunk',
    alive: false,
    ghostVoteUsed: true,
    actualAlignment: Alignment.Good,
  }),
  makeStoryPlayer({
    id: 'player-6',
    seat: 6,
    name: 'Frank',
    characterId: 'philosopher',
    actualAlignment: Alignment.Good,
  }),
  makeStoryPlayer({
    id: 'player-7',
    seat: 7,
    name: 'Grace',
    characterId: 'slayer',
    actualAlignment: Alignment.Good,
  }),
  makeStoryPlayer({
    id: 'player-8',
    seat: 8,
    name: 'Hank',
    characterId: 'baron',
    actualAlignment: Alignment.Evil,
  }),
  makeStoryPlayer({ id: 'player-9', seat: 9, name: 'Iris', actualAlignment: Alignment.Unknown }),
  makeStoryPlayer({
    id: 'player-10',
    seat: 10,
    name: 'TravJack',
    characterId: 'spiritofivory',
    actualAlignment: Alignment.Good,
    visibleAlignment: Alignment.Good,
    isTraveller: true,
  }),
];

export const alicePlayer = mockPlayers[0];
export const bobPlayer = mockPlayers[1];
export const charliePlayer = mockPlayers[2];
export const dianaPlayer = mockPlayers[3];
export const evePlayer = mockPlayers[4];
export const irisPlayer = mockPlayers[8];
export const travJackPlayer = mockPlayers[9];

export const evilTravellerPlayer = makeStoryPlayer({
  id: 'player-13',
  seat: 13,
  name: 'Wendy',
  characterId: 'spiritofivory',
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Good,
  visibleAlignment: Alignment.Evil,
  isTraveller: true,
});
export const evilTownsfolkPlayer = makeStoryPlayer({
  id: 'player-11',
  seat: 11,
  name: 'Mallory',
  characterId: 'noble',
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Good,
});
export const goodDemonPlayer = makeStoryPlayer({
  id: 'player-12',
  seat: 12,
  name: 'Victor',
  characterId: 'imp',
  actualAlignment: Alignment.Good,
  startingAlignment: Alignment.Evil,
});

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

export const mockNightHistoryEntries: NightHistoryEntry[] = [
  {
    dayNumber: 1,
    isFirstNight: true,
    completedAt: '2026-02-15T22:30:00.000Z',
    subActionStates: { noble: [true, true], fortuneteller: [true, true], imp: [true] },
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
    subActionStates: { fortuneteller: [true, true], philosopher: [true], imp: [true] },
    notes: { imp: 'Killed Diana.' },
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
export const mockNightHistoryWithSelections: NightHistoryEntry[] = [
  {
    dayNumber: 1,
    isFirstNight: true,
    completedAt: '2026-02-15T22:30:00.000Z',
    subActionStates: { noble: [true, true], fortuneteller: [true, true], imp: [true] },
    notes: { noble: 'Shown Alice, Bob, Charlie — one is evil.' },
    selections: { fortuneteller: ['Alice', 'Bob'] },
  },
  {
    dayNumber: 2,
    isFirstNight: false,
    completedAt: '2026-02-15T23:15:00.000Z',
    subActionStates: { fortuneteller: [true, true], imp: [true] },
    notes: { imp: 'Killed Diana.' },
    selections: { imp: 'Diana', fortuneteller: ['Charlie', 'Eve'] },
  },
  {
    dayNumber: 3,
    isFirstNight: false,
    completedAt: '2026-02-16T00:05:00.000Z',
    subActionStates: { fortuneteller: [true, true], cerenovus: [true, true], imp: [true] },
    notes: {},
    selections: { imp: 'Frank', cerenovus: ['Grace', 'Noble'], fortuneteller: ['Alice', 'Hank'] },
  },
];

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
const evilIds = new Set(['baron', 'cerenovus', 'scarletwoman', 'marionette', 'imp', 'fanggu']);

export function generateMockPlayers(count: number): StoryPlayer[] {
  return Array.from({ length: count }, (_, i) => {
    const characterId = characterPool[i % characterPool.length];
    const alignment = evilIds.has(characterId) ? Alignment.Evil : Alignment.Good;
    return makeStoryPlayer({
      id: `player-${i + 1}`,
      seat: i + 1,
      name: playerNames[i % playerNames.length],
      characterId,
      actualAlignment: alignment,
      startingAlignment: alignment,
    });
  });
}

export const playerWithDrunk = { ...alicePlayer, tokens: mockDrunkTokens };
export const playerWithPoisoned = { ...bobPlayer, tokens: mockPoisonedTokens };
export const playerWithMultipleTokens = { ...dianaPlayer, tokens: mockMultipleTokens };
export const playerWithManyTokens = { ...charliePlayer, alive: true, tokens: mockManyTokens };

export const worstCase20Players: StoryPlayer[] = generateMockPlayers(20).map((player, index) => {
  if (index === 2) return { ...player, alive: false, tokens: [mockDrunkToken] };
  if (index === 4) return { ...player, alive: false, ghostVoteUsed: true };
  if (index === 6)
    return { ...player, tokens: [mockPoisonedToken, mockCustomTokens[0], mockCustomTokens[4]] };
  if (index === 9)
    return {
      ...player,
      tokens: [mockDrunkToken, mockPoisonedToken, ...mockCustomTokens.slice(0, 3)],
    };
  if (index === 13) return { ...player, alive: false };
  if (index === 15) return { ...player, tokens: [mockCustomTokens[5]] };
  if (index === 16) return { ...player, alive: false, ghostVoteUsed: true };
  if (index === 17)
    return makeStoryPlayer({
      id: 'player-18',
      seat: 18,
      name: 'Rosa',
      characterId: 'spiritofivory',
      actualAlignment: Alignment.Good,
      visibleAlignment: Alignment.Good,
      isTraveller: true,
    });
  if (index === 18)
    return makeStoryPlayer({
      id: 'player-19',
      seat: 19,
      name: 'Sam',
      characterId: 'spiritofivory',
      actualAlignment: Alignment.Evil,
      startingAlignment: Alignment.Good,
      visibleAlignment: Alignment.Evil,
      isTraveller: true,
    });
  if (index === 19)
    return makeStoryPlayer({
      id: 'player-20',
      seat: 20,
      name: 'Tina',
      actualAlignment: Alignment.Unknown,
    });
  return player;
});

export const mockSessionPlayers: Player[] = storyPlayersToSessionPlayers(mockPlayers);
export const mockSlots: Slot[] = storyPlayersToSlots(mockPlayers);
export const mockParticipants: Participant[] = storyPlayersToParticipants(mockPlayers);
export const mockPlayerState: Record<PlayerId, PlayerGameState> =
  storyPlayersToPlayerState(mockPlayers);
