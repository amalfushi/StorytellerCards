import type {
  CharacterDraftEntry,
  CharacterDraftOfferSnapshot,
  CharacterDraftState,
  PlayerId,
} from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import {
  createDraftSession,
  regenerateDraftOffer,
  resolveDraftPick,
  type DraftOffer,
  type DraftPick,
  type DraftRandomSource,
  type DraftSessionConfig,
  type DraftSessionState,
} from '@/utils/drafting/draftSession.ts';
import type { DraftCharacter } from '@/utils/drafting/draftFeasibility.ts';
import { CHARACTER_DRAFT_RULES, DraftIdentityKind } from '@/utils/drafting/draftRules.ts';

function falseIdentityTypes(characterId: string): readonly CharacterType[] | null {
  const identity = CHARACTER_DRAFT_RULES[characterId]?.identity;
  if (identity === DraftIdentityKind.FalseTownsfolk) return [CharacterType.Townsfolk];
  if (identity === DraftIdentityKind.FalseGood) {
    return [CharacterType.Townsfolk, CharacterType.Outsider];
  }
  if (identity === DraftIdentityKind.FalseDemon) return [CharacterType.Demon];
  return null;
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
      !excludedIds.has(character.id),
  );
  const fallbackCandidates = scriptCharacters.filter(
    (character) =>
      allowedTypes.includes(character.type) &&
      character.id !== actualCharacterId &&
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
  const currentEntry =
    state.entries.find((entry) => entry.playerId === state.activePlayerId) ??
    state.entries[state.currentPlayerIndex];

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
  return state;
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

  const session = regenerateDraftOffer(
    {
      ...toSessionState({ ...state, activePlayerId: undefined }),
      currentOffer: null,
      status: 'drafting',
    },
    config,
    random,
  );
  if (!session.currentOffer) {
    return {
      ...state,
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
      config,
      session.committedCharacterIds,
      random,
    );
    return {
      ...state,
      activePlayerId: playerId,
      entries: [...state.entries.filter((candidate) => candidate.playerId !== playerId), entry],
      blockedReason: undefined,
      revision: state.revision + 1,
    };
  } catch (error) {
    return identityMaskFailure(
      { ...state, activePlayerId: playerId },
      state.currentPlayerIndex,
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
  const currentEntry =
    state.entries.find((entry) => entry.playerId === state.activePlayerId) ??
    state.entries[state.currentPlayerIndex];
  if (!currentEntry) throw new Error('The game draft does not have an active player.');
  const actualCharacterId = actualCharacterIdForOffer(currentEntry, characterId);

  const nextSession = resolveDraftPick(
    toSessionState(state),
    config,
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

  return withResolvedTurn({ ...state, entries }, nextSession);
}

export function regenerateGameCharacterDraftOffer(
  state: CharacterDraftState,
  config: DraftSessionConfig,
  random: DraftRandomSource = Math.random,
): CharacterDraftState {
  const nextSession = regenerateDraftOffer(toSessionState(state), config, random);
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
  const activePlayerId = state.activePlayerId ?? state.playerOrder[state.currentPlayerIndex];
  const currentEntryIndex = entries.findIndex((entry) => entry.playerId === activePlayerId);
  try {
    entries[currentEntryIndex] = toEntry(
      activePlayerId,
      currentOffer,
      nextSession.legalCandidateIds.length,
      config,
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
