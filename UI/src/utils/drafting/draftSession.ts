import type { CharacterDef } from '@/types/index.ts';
import {
  getLegalDraftCandidates,
  type DraftCharacter,
  type DraftFeasibilityInput,
} from '@/utils/drafting/draftFeasibility.ts';
import type { DraftSetupMode } from '@/utils/drafting/draftRules.ts';

export interface DraftOffer {
  offeredCharacterIds: [string, string, string];
  mulliganCharacterId: string;
}

export interface DraftPick {
  playerIndex: number;
  characterId: string;
  resolution: 'choice' | 'mulligan';
}

export interface DraftSessionConfig {
  playerCount: number;
  scriptCharacters: readonly DraftCharacter[];
  setupMode: DraftSetupMode;
}

export interface DraftSessionState {
  committedCharacterIds: string[];
  picks: DraftPick[];
  currentOffer: DraftOffer | null;
  legalCandidateIds: string[];
  status: 'drafting' | 'blocked' | 'complete';
  blockedReason?: string;
}

export interface DraftOfferGenerationResult {
  offer: DraftOffer | null;
  legalCandidateIds: string[];
  blockedReason?: string;
}

export type DraftRandomSource = () => number;

const COUNTED_CHARACTER_TYPES = new Set(['Townsfolk', 'Outsider', 'Minion', 'Demon']);

export function toDraftCharacters(characters: readonly CharacterDef[]): DraftCharacter[] {
  return characters
    .filter(
      (
        character,
      ): character is CharacterDef & {
        type: DraftCharacter['type'];
      } => COUNTED_CHARACTER_TYPES.has(character.type),
    )
    .map(({ id, type }) => ({ id, type }));
}

function shuffle<T>(values: readonly T[], random: DraftRandomSource): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.min(index, Math.floor(Math.max(0, random()) * (index + 1)));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function mixCandidateTypes(
  candidateIds: readonly string[],
  scriptCharacters: readonly DraftCharacter[],
  random: DraftRandomSource,
): string[] {
  const typeById = new Map(scriptCharacters.map((character) => [character.id, character.type]));
  const buckets = new Map<DraftCharacter['type'], string[]>();

  for (const id of shuffle(candidateIds, random)) {
    const type = typeById.get(id);
    if (!type) continue;
    const bucket = buckets.get(type) ?? [];
    bucket.push(id);
    buckets.set(type, bucket);
  }

  const typeOrder = shuffle([...buckets.keys()], random);
  const mixed: string[] = [];
  let bucketIndex = 0;
  while (mixed.length < candidateIds.length) {
    const type = typeOrder[bucketIndex % typeOrder.length];
    const candidate = buckets.get(type)?.shift();
    if (candidate) mixed.push(candidate);
    bucketIndex += 1;
  }
  return mixed;
}

function toFeasibilityInput(
  config: DraftSessionConfig,
  committedCharacterIds: readonly string[],
): DraftFeasibilityInput {
  return {
    playerCount: config.playerCount,
    scriptCharacters: config.scriptCharacters,
    committedCharacterIds,
    setupMode: config.setupMode,
  };
}

export function generateDraftOffer(
  config: DraftSessionConfig,
  committedCharacterIds: readonly string[],
  random: DraftRandomSource = Math.random,
): DraftOfferGenerationResult {
  const legalCandidateIds = getLegalDraftCandidates(
    toFeasibilityInput(config, committedCharacterIds),
  );

  if (legalCandidateIds.length < 4) {
    return {
      offer: null,
      legalCandidateIds,
      blockedReason:
        legalCandidateIds.length === 0
          ? 'No character leaves a legal completion from this draft state.'
          : `Only ${legalCandidateIds.length} distinct legal character${legalCandidateIds.length === 1 ? ' remains' : 's remain'}. Three choices plus a different mulligan require at least four.`,
    };
  }

  const [first, second, third, mulligan] = mixCandidateTypes(
    legalCandidateIds,
    config.scriptCharacters,
    random,
  );

  return {
    offer: {
      offeredCharacterIds: [first, second, third],
      mulliganCharacterId: mulligan,
    },
    legalCandidateIds,
  };
}

function buildSessionState(
  config: DraftSessionConfig,
  committedCharacterIds: string[],
  picks: DraftPick[],
  random: DraftRandomSource,
): DraftSessionState {
  if (committedCharacterIds.length === config.playerCount) {
    return {
      committedCharacterIds,
      picks,
      currentOffer: null,
      legalCandidateIds: [],
      status: 'complete',
    };
  }

  const generated = generateDraftOffer(config, committedCharacterIds, random);
  return {
    committedCharacterIds,
    picks,
    currentOffer: generated.offer,
    legalCandidateIds: generated.legalCandidateIds,
    status: generated.offer ? 'drafting' : 'blocked',
    blockedReason: generated.blockedReason,
  };
}

export function createDraftSession(
  config: DraftSessionConfig,
  random: DraftRandomSource = Math.random,
): DraftSessionState {
  return buildSessionState(config, [], [], random);
}

export function resolveDraftPick(
  state: DraftSessionState,
  config: DraftSessionConfig,
  characterId: string,
  resolution: DraftPick['resolution'],
  random: DraftRandomSource = Math.random,
): DraftSessionState {
  const offer = state.currentOffer;
  if (state.status !== 'drafting' || !offer) {
    throw new Error('The draft does not have an active offer.');
  }

  const validCharacterIds =
    resolution === 'mulligan' ? [offer.mulliganCharacterId] : offer.offeredCharacterIds;
  if (!validCharacterIds.includes(characterId)) {
    throw new Error('The selected character is not valid for this offer.');
  }

  const committedCharacterIds = [...state.committedCharacterIds, characterId];
  const picks = [
    ...state.picks,
    {
      playerIndex: state.picks.length,
      characterId,
      resolution,
    },
  ];
  return buildSessionState(config, committedCharacterIds, picks, random);
}

export function regenerateDraftOffer(
  state: DraftSessionState,
  config: DraftSessionConfig,
  random: DraftRandomSource = Math.random,
): DraftSessionState {
  if (state.status === 'complete') return state;
  return buildSessionState(config, [...state.committedCharacterIds], [...state.picks], random);
}
