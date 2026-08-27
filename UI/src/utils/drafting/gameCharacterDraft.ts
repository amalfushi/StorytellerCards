import type {
  CharacterDraftCharacterRoll,
  CharacterDraftEntry,
  CharacterDraftOfferSnapshot,
  CharacterDraftSetupMode,
  CharacterDraftState,
  DraftableCharacterType,
  PlayerId,
} from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import {
  createDraftSession,
  DraftPresentationMode,
  regenerateDraftOffer,
  resolveDraftPick,
  type DraftOffer,
  type DraftPick,
  type DraftRandomSource,
  type DraftSessionConfig,
  type DraftSessionState,
} from '@/utils/drafting/draftSession.ts';
import {
  getLegalDraftCompletionCounts,
  type DraftCharacter,
} from '@/utils/drafting/draftFeasibility.ts';
import { CHARACTER_DRAFT_RULES, DraftIdentityKind } from '@/utils/drafting/draftRules.ts';
import { calculateAdaptiveTargets, type AdaptiveTargets } from '@/utils/adaptiveDistribution.ts';

const DRAFTABLE_TYPES: DraftableCharacterType[] = [
  CharacterType.Townsfolk,
  CharacterType.Outsider,
  CharacterType.Minion,
  CharacterType.Demon,
];

const HIDDEN_OUTSIDER_CHARACTER_IDS = new Set(['drunk', 'lunatic']);

const SETUP_MODE_CHARACTER_IDS: Partial<Record<CharacterDraftSetupMode, string>> = {
  atheist: 'atheist',
  legion: 'legion',
  lilmonsta: 'lilmonsta',
  summoner: 'summoner',
  kazali: 'kazali',
};

function falseIdentityTypes(characterId: string): readonly CharacterType[] | null {
  const identity = CHARACTER_DRAFT_RULES[characterId]?.identity;
  if (identity === DraftIdentityKind.FalseTownsfolk) return [CharacterType.Townsfolk];
  if (identity === DraftIdentityKind.FalseGood) {
    return [CharacterType.Townsfolk, CharacterType.Outsider];
  }
  if (identity === DraftIdentityKind.FalseDemon) return [CharacterType.Demon];
  return null;
}

function isValidFalseIdentity(actualCharacterId: string, falseIdentityId: string): boolean {
  if (actualCharacterId === 'marionette') {
    return falseIdentityId !== 'drunk' && falseIdentityId !== 'lunatic';
  }
  if (actualCharacterId === 'drunk') return falseIdentityId !== 'lunatic';
  return true;
}

function pickFalseIdentity(
  actualCharacterId: string,
  scriptCharacters: readonly DraftCharacter[],
  excludedIds: ReadonlySet<string>,
  committedCharacterIds: ReadonlySet<string>,
  usedVisibleIds: ReadonlySet<string>,
  random: DraftRandomSource,
): string | null {
  const allowedTypes = falseIdentityTypes(actualCharacterId);
  if (!allowedTypes) return null;
  const candidates = scriptCharacters.filter(
    (character) =>
      allowedTypes.includes(character.type) &&
      character.id !== actualCharacterId &&
      isValidFalseIdentity(actualCharacterId, character.id) &&
      !excludedIds.has(character.id),
  );
  const fallbackCandidates = scriptCharacters.filter(
    (character) =>
      allowedTypes.includes(character.type) &&
      character.id !== actualCharacterId &&
      isValidFalseIdentity(actualCharacterId, character.id) &&
      committedCharacterIds.has(character.id) &&
      !usedVisibleIds.has(character.id),
  );
  const pool = candidates.length > 0 ? candidates : fallbackCandidates;
  if (pool.length === 0) return null;
  const index = Math.min(pool.length - 1, Math.floor(Math.max(0, random()) * pool.length));
  return pool[index].id;
}

export function maskDraftOfferIdentities(
  offer: DraftOffer,
  legalCandidateCount: number,
  config: DraftSessionConfig,
  committedCharacterIds: readonly string[],
  random: DraftRandomSource,
): CharacterDraftOfferSnapshot {
  const actualIds = [
    ...offer.offeredCharacterIds,
    ...(offer.mulliganCharacterId ? [offer.mulliganCharacterId] : []),
  ];
  const excludedIds = new Set([...committedCharacterIds, ...actualIds]);
  const committedIds = new Set(committedCharacterIds);
  const usedVisibleIds = new Set<string>();
  const mapping: Record<string, string> = {};
  const toVisibleId = (actualCharacterId: string): string => {
    const requiredFalseIdentityTypes = falseIdentityTypes(actualCharacterId);
    if (!requiredFalseIdentityTypes) {
      usedVisibleIds.add(actualCharacterId);
      return actualCharacterId;
    }
    const falseIdentityId = pickFalseIdentity(
      actualCharacterId,
      config.scriptCharacters,
      excludedIds,
      committedIds,
      usedVisibleIds,
      random,
    );
    if (!falseIdentityId) {
      throw new Error(
        `Cannot safely draft ${actualCharacterId}: the script has no unused valid false identity.`,
      );
    }
    excludedIds.add(falseIdentityId);
    usedVisibleIds.add(falseIdentityId);
    mapping[falseIdentityId] = actualCharacterId;
    return falseIdentityId;
  };
  const forcedHiddenCharacterId = offer.offeredCharacterIds.find(
    (characterId) => falseIdentityTypes(characterId) !== null,
  );
  if (forcedHiddenCharacterId) {
    return {
      offeredCharacterIds: offer.offeredCharacterIds.map(() =>
        toVisibleId(forcedHiddenCharacterId),
      ),
      mulliganCharacterId: offer.mulliganCharacterId ? toVisibleId(forcedHiddenCharacterId) : null,
      rolledCharacterTypes: [...offer.rolledCharacterTypes],
      legalCandidateCount,
      actualCharacterIdsByOfferedId: mapping,
    };
  }

  return {
    offeredCharacterIds: offer.offeredCharacterIds.map(toVisibleId),
    mulliganCharacterId: offer.mulliganCharacterId ? toVisibleId(offer.mulliganCharacterId) : null,
    rolledCharacterTypes: [...offer.rolledCharacterTypes],
    legalCandidateCount,
    actualCharacterIdsByOfferedId: Object.keys(mapping).length > 0 ? mapping : undefined,
  };
}

function toEntry(
  playerId: PlayerId,
  offer: DraftOffer,
  legalCandidateCount: number,
  config: DraftSessionConfig,
  committedCharacterIds: readonly string[],
  random: DraftRandomSource,
): CharacterDraftEntry {
  return {
    playerId,
    offer: maskDraftOfferIdentities(
      offer,
      legalCandidateCount,
      config,
      committedCharacterIds,
      random,
    ),
  };
}

function identityMaskFailure(
  state: CharacterDraftState,
  currentPlayerIndex: number,
  error: unknown,
): CharacterDraftState {
  if (!(error instanceof Error) || !error.message.startsWith('Cannot safely draft ')) {
    throw error;
  }
  return {
    ...state,
    status: 'blocked',
    currentPlayerIndex,
    blockedReason: error.message,
    revision: state.revision + 1,
  };
}

function actualCharacterIdForOffer(entry: CharacterDraftEntry, visibleCharacterId: string): string {
  return entry.offer.actualCharacterIdsByOfferedId?.[visibleCharacterId] ?? visibleCharacterId;
}

function toSessionState(state: CharacterDraftState): DraftSessionState {
  const resolvedEntries = state.entries.filter(
    (
      entry,
    ): entry is CharacterDraftEntry & {
      selectedCharacterId: string;
      resolution: DraftPick['resolution'];
    } => entry.selectedCharacterId !== undefined && entry.resolution !== undefined,
  );
  const currentEntry = state.entries.find((entry) => entry.playerId === state.activePlayerId);

  return {
    committedCharacterIds: resolvedEntries.map(
      (entry) => entry.actualCharacterId ?? entry.selectedCharacterId,
    ),
    picks: resolvedEntries.map((entry, playerIndex) => ({
      playerIndex,
      characterId: entry.actualCharacterId ?? entry.selectedCharacterId,
      resolution: entry.resolution,
    })),
    currentOffer:
      state.status === 'drafting' && currentEntry
        ? {
            offeredCharacterIds: currentEntry.offer.offeredCharacterIds.map((characterId) =>
              actualCharacterIdForOffer(currentEntry, characterId),
            ),
            mulliganCharacterId: currentEntry.offer.mulliganCharacterId
              ? actualCharacterIdForOffer(currentEntry, currentEntry.offer.mulliganCharacterId)
              : null,
            rolledCharacterTypes: [...currentEntry.offer.rolledCharacterTypes],
          }
        : null,
    legalCandidateIds: [],
    status: state.status,
    blockedReason: state.blockedReason,
  };
}

function withResolvedTurn(
  state: CharacterDraftState,
  session: DraftSessionState,
): CharacterDraftState {
  const resolvedCount = state.entries.filter((entry) => entry.actualCharacterId).length;
  return {
    ...state,
    status: resolvedCount === state.playerOrder.length ? 'complete' : 'drafting',
    currentPlayerIndex: resolvedCount,
    activePlayerId: undefined,
    blockedReason: resolvedCount === state.playerOrder.length ? undefined : session.blockedReason,
    revision: state.revision + 1,
  };
}

function shuffle<T>(values: readonly T[], random: DraftRandomSource): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.min(index, Math.floor(Math.max(0, random()) * (index + 1)));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function randomIndex(length: number, random: DraftRandomSource): number {
  return Math.min(length - 1, Math.floor(Math.max(0, random()) * length));
}

function withMarionetteRoll(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  random: DraftRandomSource,
): CharacterDraftState {
  if (state.marionetteRoll) return state;
  const minionCharacterIds = config.scriptCharacters
    .filter((character) => character.type === CharacterType.Minion)
    .map((character) => character.id);
  if (!minionCharacterIds.includes('marionette')) return state;

  const minionPlayerIds = state.playerOrder.filter(
    (playerId) => state.plannedCharacterTypes?.[playerId]?.[0] === CharacterType.Minion,
  );
  if (minionPlayerIds.length === 0) return state;

  return {
    ...state,
    marionetteRoll: {
      playerId: minionPlayerIds[randomIndex(minionPlayerIds.length, random)],
      characterId: minionCharacterIds[randomIndex(minionCharacterIds.length, random)],
    },
  };
}

function persistedOutsiderCharacterRolls(
  state: CharacterDraftState,
): CharacterDraftCharacterRoll[] {
  if (state.outsiderCharacterRolls) return state.outsiderCharacterRolls;
  return state.outsiderHiddenRoll ? [state.outsiderHiddenRoll] : [];
}

export function getHiddenOutsiderRolls(state: CharacterDraftState): CharacterDraftCharacterRoll[] {
  return persistedOutsiderCharacterRolls(state).filter((roll) =>
    HIDDEN_OUTSIDER_CHARACTER_IDS.has(roll.characterId),
  );
}

function withOutsiderCharacterRolls(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  random: DraftRandomSource,
): CharacterDraftState {
  const outsiderCharacterIds = config.scriptCharacters
    .filter((character) => character.type === CharacterType.Outsider)
    .map((character) => character.id);
  if (!outsiderCharacterIds.some((id) => HIDDEN_OUTSIDER_CHARACTER_IDS.has(id))) return state;

  const outsiderPlayerIds = state.playerOrder.filter(
    (playerId) => state.plannedCharacterTypes?.[playerId]?.[0] === CharacterType.Outsider,
  );
  const targetRollCount = Math.min(
    getDraftExpectedCharacterCounts(state, config.playerCount).outsiders,
    outsiderCharacterIds.length,
  );
  if (targetRollCount === 0) return state;

  const existingRolls = [...persistedOutsiderCharacterRolls(state)];
  for (const entry of state.entries) {
    const characterId = entry.actualCharacterId;
    if (
      characterId &&
      config.scriptCharacters.some(
        (character) => character.id === characterId && character.type === CharacterType.Outsider,
      ) &&
      !existingRolls.some((roll) => roll.characterId === characterId)
    ) {
      existingRolls.push({ playerId: entry.playerId, characterId });
    }
  }
  const additionalCharacterIds = shuffle(
    outsiderCharacterIds.filter(
      (characterId) => !existingRolls.some((roll) => roll.characterId === characterId),
    ),
    random,
  ).slice(0, Math.max(0, targetRollCount - existingRolls.length));
  const reservedPlayerIds = new Set(
    existingRolls
      .filter((roll) => HIDDEN_OUTSIDER_CHARACTER_IDS.has(roll.characterId))
      .map((roll) => roll.playerId),
  );
  const availablePlayerIds = shuffle(
    outsiderPlayerIds.filter((playerId) => !reservedPlayerIds.has(playerId)),
    random,
  );
  const additionalRolls = additionalCharacterIds.map((characterId, index) => {
    const reservedPlayerId = HIDDEN_OUTSIDER_CHARACTER_IDS.has(characterId)
      ? availablePlayerIds.shift()
      : undefined;
    const playerId =
      HIDDEN_OUTSIDER_CHARACTER_IDS.has(characterId) && reservedPlayerId
        ? reservedPlayerId
        : (outsiderPlayerIds[index % outsiderPlayerIds.length] ?? state.playerOrder[0]);
    return { playerId, characterId };
  });
  return {
    ...state,
    outsiderHiddenRoll: undefined,
    outsiderCharacterRolls: [...existingRolls, ...additionalRolls],
  };
}

function withHiddenCharacterRolls(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  random: DraftRandomSource,
): CharacterDraftState {
  return withOutsiderCharacterRolls(withMarionetteRoll(state, config, random), config, random);
}

function committedCharacterIds(state: CharacterDraftState): string[] {
  return state.entries.flatMap((entry) =>
    entry.actualCharacterId ? [entry.actualCharacterId] : [],
  );
}

export function getDraftExpectedCharacterCounts(
  state: CharacterDraftState,
  playerCount: number,
): AdaptiveTargets {
  const selectedCharacterIds = committedCharacterIds(state);
  const setupCharacterId = SETUP_MODE_CHARACTER_IDS[state.setupMode];
  if (setupCharacterId && !selectedCharacterIds.includes(setupCharacterId)) {
    selectedCharacterIds.push(setupCharacterId);
  }
  return calculateAdaptiveTargets(playerCount, selectedCharacterIds, {
    variableModifierValues: state.variableModifierValues,
    xaanX: state.variableModifierValues?.xaan,
    extraVillageIdiots: Math.max(0, (state.characterCopyTargets?.villageidiot ?? 1) - 1),
  });
}

export function replanGameCharacterDraftTypes(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  if (state.status === 'complete') {
    return { ...state, plannedCharacterTypes: undefined };
  }

  const resolvedPlayerIds = new Set(
    state.entries.filter((entry) => entry.actualCharacterId).map((entry) => entry.playerId),
  );
  const remainingPlayerIds = state.playerOrder.filter(
    (playerId) => !resolvedPlayerIds.has(playerId),
  );
  const hiddenReservations: Array<{
    playerId: PlayerId;
    characterId: string;
    type: DraftableCharacterType;
  }> = [];
  if (
    state.marionetteRoll?.characterId === 'marionette' &&
    remainingPlayerIds.includes(state.marionetteRoll.playerId)
  ) {
    hiddenReservations.push({
      playerId: state.marionetteRoll.playerId,
      characterId: 'marionette',
      type: CharacterType.Minion,
    });
  }
  for (const roll of getHiddenOutsiderRolls(state)) {
    if (remainingPlayerIds.includes(roll.playerId)) {
      hiddenReservations.push({
        playerId: roll.playerId,
        characterId: roll.characterId,
        type: CharacterType.Outsider,
      });
    }
  }
  const completionCounts =
    hiddenReservations.length > 0
      ? getLegalDraftCompletionCounts({
          playerCount: config.playerCount,
          scriptCharacters: config.scriptCharacters,
          committedCharacterIds: [
            ...committedCharacterIds(state),
            ...hiddenReservations.map((reservation) => reservation.characterId),
          ],
          setupMode: config.setupMode,
          variableModifierValues: state.variableModifierValues,
          characterCopyTargets: state.characterCopyTargets,
        })
      : undefined;
  const expected = getDraftExpectedCharacterCounts(state, config.playerCount);
  const remainingByType = new Map<DraftableCharacterType, number>([
    [CharacterType.Townsfolk, completionCounts?.Townsfolk ?? expected.townsfolk],
    [CharacterType.Outsider, completionCounts?.Outsider ?? expected.outsiders],
    [CharacterType.Minion, completionCounts?.Minion ?? expected.minions],
    [CharacterType.Demon, completionCounts?.Demon ?? expected.demons],
  ]);

  for (const characterId of committedCharacterIds(state)) {
    const type = config.scriptCharacters.find((character) => character.id === characterId)?.type;
    if (type) remainingByType.set(type, Math.max(0, (remainingByType.get(type) ?? 0) - 1));
  }

  const primaryTypes = shuffle(
    DRAFTABLE_TYPES.flatMap((type) =>
      Array.from({ length: remainingByType.get(type) ?? 0 }, () => type),
    ),
    random,
  );
  if (primaryTypes.length !== remainingPlayerIds.length) {
    return { ...state, plannedCharacterTypes: undefined };
  }

  for (const reservation of hiddenReservations) {
    const reservedPlayerIndex = remainingPlayerIds.indexOf(reservation.playerId);
    const requiredTypeIndex = primaryTypes.indexOf(reservation.type);
    if (requiredTypeIndex >= 0 && requiredTypeIndex !== reservedPlayerIndex) {
      [primaryTypes[reservedPlayerIndex], primaryTypes[requiredTypeIndex]] = [
        primaryTypes[requiredTypeIndex],
        primaryTypes[reservedPlayerIndex],
      ];
    }
  }

  const possibleSecondaryTypes = DRAFTABLE_TYPES.filter(
    (type) => (remainingByType.get(type) ?? 0) > 0,
  );
  const plannedCharacterTypes: Partial<Record<PlayerId, DraftableCharacterType[]>> = {};
  remainingPlayerIds.forEach((playerId, index) => {
    const primaryType = primaryTypes[index];
    const secondaryTypes =
      state.presentationMode === DraftPresentationMode.SecretTwoTypes
        ? shuffle(
            possibleSecondaryTypes.filter((type) => type !== primaryType),
            random,
          ).slice(0, 1)
        : [];
    plannedCharacterTypes[playerId] = [primaryType, ...secondaryTypes];
  });

  return { ...state, plannedCharacterTypes };
}

export function updateGameCharacterDraftSetup(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  updates: {
    variableModifierValues?: Record<string, number>;
    characterCopyTargets?: Record<string, number>;
  },
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  const nextConfig = {
    ...config,
    variableModifierValues: updates.variableModifierValues ?? state.variableModifierValues,
    characterCopyTargets: updates.characterCopyTargets ?? state.characterCopyTargets,
  };
  return withHiddenCharacterRolls(
    replanGameCharacterDraftTypes(
      {
        ...state,
        ...updates,
        revision: state.revision + 1,
      },
      nextConfig,
      random,
    ),
    nextConfig,
    random,
  );
}

export function createGameCharacterDraft(
  playerIds: readonly PlayerId[],
  config: DraftSessionConfig,
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  const playerOrder = [...playerIds];
  const session = createDraftSession(config, random);
  const state: CharacterDraftState = {
    status: session.status === 'blocked' ? 'blocked' : 'drafting',
    setupMode: config.setupMode,
    presentationMode: config.presentationMode ?? 'open',
    playerOrder,
    currentPlayerIndex: 0,
    variableModifierValues: config.variableModifierValues
      ? { ...config.variableModifierValues }
      : undefined,
    characterCopyTargets: config.characterCopyTargets
      ? { ...config.characterCopyTargets }
      : undefined,
    entries: [],
    blockedReason: session.blockedReason,
    revision: 1,
  };
  return withHiddenCharacterRolls(
    replanGameCharacterDraftTypes(state, config, random),
    config,
    random,
  );
}

export function upgradeLegacyGameCharacterDraft(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  if (
    state.status === 'blocked' &&
    state.blockedReason?.endsWith("is outside the reserved player's rolled character types.")
  ) {
    const resumed = replanGameCharacterDraftTypes(
      {
        ...state,
        status: 'drafting',
        activePlayerId: undefined,
        blockedReason: undefined,
      },
      config,
      random,
    );
    const reservations = [
      ...(state.marionetteRoll?.characterId === 'marionette'
        ? [{ playerId: state.marionetteRoll.playerId, type: CharacterType.Minion }]
        : []),
      ...getHiddenOutsiderRolls(state).map((roll) => ({
        playerId: roll.playerId,
        type: CharacterType.Outsider,
      })),
    ];
    if (
      reservations.length > 0 &&
      reservations.every(
        (reservation) =>
          resumed.plannedCharacterTypes?.[reservation.playerId]?.[0] === reservation.type,
      )
    ) {
      return {
        ...resumed,
        revision: state.revision + 1,
      };
    }
    return state;
  }
  if (state.status === 'blocked' && state.entries.length === 0) {
    const regenerated = createGameCharacterDraft(state.playerOrder, config, random);
    if (regenerated.status === 'drafting') {
      return {
        ...regenerated,
        revision: state.revision + 1,
      };
    }
    return state;
  }
  if (state.status !== 'drafting') return state;

  const expected = getDraftExpectedCharacterCounts(state, config.playerCount);
  if (
    state.outsiderHiddenRoll !== undefined &&
    state.outsiderCharacterRolls === undefined &&
    expected.outsiders > 0
  ) {
    const stateWithPlans = state.plannedCharacterTypes
      ? state
      : replanGameCharacterDraftTypes(state, config, random);
    return {
      ...withHiddenCharacterRolls(stateWithPlans, config, random),
      revision: state.revision + 1,
    };
  }
  const scriptCharacterIds = new Set(config.scriptCharacters.map((character) => character.id));
  const missingMarionetteRoll =
    expected.minions > 0 &&
    scriptCharacterIds.has('marionette') &&
    state.marionetteRoll === undefined;
  const missingOutsiderHiddenRoll =
    expected.outsiders > 0 &&
    (scriptCharacterIds.has('drunk') || scriptCharacterIds.has('lunatic')) &&
    state.outsiderHiddenRoll === undefined &&
    state.outsiderCharacterRolls === undefined;

  if (!missingMarionetteRoll && !missingOutsiderHiddenRoll) return state;

  const upgraded = createGameCharacterDraft(state.playerOrder, config, random);
  return {
    ...upgraded,
    revision: state.revision + 1,
  };
}

function configForDraftPlayer(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  playerId: PlayerId,
): DraftSessionConfig {
  const controlledMarionetteRoll = state.marionetteRoll;
  const receivesMarionette =
    controlledMarionetteRoll?.playerId === playerId &&
    controlledMarionetteRoll.characterId === 'marionette';
  const controlledOutsiderRolls = getHiddenOutsiderRolls(state);
  const hasControlledOutsiderRoll =
    state.outsiderCharacterRolls !== undefined || state.outsiderHiddenRoll !== undefined;
  const controlledOutsiderRoll = controlledOutsiderRolls.find((roll) => roll.playerId === playerId);
  const receivesOutsiderHiddenCharacter = controlledOutsiderRoll !== undefined;
  const forcedCharacterId = receivesMarionette
    ? 'marionette'
    : receivesOutsiderHiddenCharacter
      ? controlledOutsiderRoll.characterId
      : undefined;
  const excludedCharacterIds = [
    ...(controlledMarionetteRoll && !receivesMarionette ? ['marionette'] : []),
    ...(hasControlledOutsiderRoll
      ? [...HIDDEN_OUTSIDER_CHARACTER_IDS].filter(
          (characterId) => controlledOutsiderRoll?.characterId !== characterId,
        )
      : []),
  ];
  const resolvedPlayerIds = new Set(
    state.entries.filter((entry) => entry.actualCharacterId).map((entry) => entry.playerId),
  );
  const reservedCharacterIds = [
    controlledMarionetteRoll?.characterId === 'marionette' &&
    controlledMarionetteRoll.playerId !== playerId &&
    !resolvedPlayerIds.has(controlledMarionetteRoll.playerId)
      ? 'marionette'
      : undefined,
    ...controlledOutsiderRolls
      .filter((roll) => roll.playerId !== playerId && !resolvedPlayerIds.has(roll.playerId))
      .map((roll) => roll.characterId),
  ].filter((characterId): characterId is string => characterId !== undefined);

  return {
    ...config,
    plannedCharacterTypes:
      state.presentationMode === DraftPresentationMode.Open
        ? undefined
        : state.plannedCharacterTypes?.[playerId],
    forcedCharacterId,
    excludedCharacterIds: excludedCharacterIds.length > 0 ? excludedCharacterIds : undefined,
    reservedCharacterIds: reservedCharacterIds.length > 0 ? reservedCharacterIds : undefined,
  };
}

export function selectGameCharacterDraftPlayer(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  playerId: PlayerId,
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  if (state.status !== 'drafting') throw new Error('The draft is not accepting player turns.');
  if (!state.playerOrder.includes(playerId))
    throw new Error('The player is not part of this draft.');
  if (state.entries.some((entry) => entry.playerId === playerId && entry.actualCharacterId)) {
    throw new Error('The player has already completed their draft.');
  }

  const stateWithPlans = state.plannedCharacterTypes
    ? state
    : withHiddenCharacterRolls(
        replanGameCharacterDraftTypes(state, config, random),
        config,
        random,
      );
  const playerConfig = configForDraftPlayer(stateWithPlans, config, playerId);
  const session = regenerateDraftOffer(
    {
      ...toSessionState({ ...stateWithPlans, activePlayerId: undefined }),
      currentOffer: null,
      status: 'drafting',
    },
    playerConfig,
    random,
  );
  if (!session.currentOffer) {
    return {
      ...stateWithPlans,
      activePlayerId: undefined,
      status: 'blocked',
      blockedReason: session.blockedReason,
      revision: state.revision + 1,
    };
  }

  try {
    const entry = toEntry(
      playerId,
      session.currentOffer,
      session.legalCandidateIds.length,
      playerConfig,
      session.committedCharacterIds,
      random,
    );
    return {
      ...stateWithPlans,
      activePlayerId: playerId,
      entries: [...state.entries.filter((candidate) => candidate.playerId !== playerId), entry],
      blockedReason: undefined,
      revision: state.revision + 1,
    };
  } catch (error) {
    return identityMaskFailure(
      { ...stateWithPlans, activePlayerId: playerId },
      stateWithPlans.currentPlayerIndex,
      error,
    );
  }
}

export function resolveGameCharacterDraft(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  characterId: string,
  resolution: DraftPick['resolution'],
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  const currentEntry = state.entries.find((entry) => entry.playerId === state.activePlayerId);
  if (!currentEntry) throw new Error('The game draft does not have an active player.');
  const actualCharacterId = actualCharacterIdForOffer(currentEntry, characterId);
  const playerConfig = configForDraftPlayer(state, config, currentEntry.playerId);

  const nextSession = resolveDraftPick(
    toSessionState(state),
    playerConfig,
    actualCharacterId,
    resolution,
    random,
  );
  const entries = [...state.entries];
  const currentEntryIndex = entries.findIndex((entry) => entry.playerId === currentEntry.playerId);
  entries[currentEntryIndex] = {
    ...currentEntry,
    selectedCharacterId: characterId,
    actualCharacterId,
    apparentCharacterId: characterId,
    resolution,
  };

  return withHiddenCharacterRolls(
    replanGameCharacterDraftTypes(
      withResolvedTurn({ ...state, entries }, nextSession),
      config,
      random,
    ),
    config,
    random,
  );
}

export function regenerateGameCharacterDraftOffer(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  const activePlayerId = state.activePlayerId;
  if (!activePlayerId) throw new Error('The game draft does not have an active player.');
  const playerConfig = configForDraftPlayer(state, config, activePlayerId);
  const nextSession = regenerateDraftOffer(toSessionState(state), playerConfig, random);
  const currentOffer = nextSession.currentOffer;
  if (!currentOffer) {
    return {
      ...state,
      status: 'blocked',
      blockedReason: nextSession.blockedReason,
      revision: state.revision + 1,
    };
  }

  const entries = [...state.entries];
  const currentEntryIndex = entries.findIndex((entry) => entry.playerId === activePlayerId);
  try {
    entries[currentEntryIndex] = toEntry(
      activePlayerId,
      currentOffer,
      nextSession.legalCandidateIds.length,
      playerConfig,
      nextSession.committedCharacterIds,
      random,
    );
  } catch (error) {
    return identityMaskFailure({ ...state, entries }, state.currentPlayerIndex, error);
  }
  return {
    ...state,
    entries,
    blockedReason: nextSession.blockedReason,
    revision: state.revision + 1,
  };
}
