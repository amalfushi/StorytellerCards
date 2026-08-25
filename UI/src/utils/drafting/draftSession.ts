import type { CharacterDef } from '@/types/index.ts';
import {
  getLegalDraftCandidates,
  type DraftCharacter,
  type DraftFeasibilityInput,
} from '@/utils/drafting/draftFeasibility.ts';
import type { DraftSetupMode } from '@/utils/drafting/draftRules.ts';

export const DraftPresentationMode = {
  Open: 'open',
  SecretSingleType: 'secret-single-type',
  SecretTwoTypes: 'secret-two-types',
} as const;
export type DraftPresentationMode =
  (typeof DraftPresentationMode)[keyof typeof DraftPresentationMode];

export interface DraftOffer {
  offeredCharacterIds: string[];
  mulliganCharacterId: string | null;
  rolledCharacterTypes: DraftCharacter['type'][];
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
  presentationMode?: DraftPresentationMode;
  variableModifierValues?: Readonly<Record<string, number>>;
  characterCopyTargets?: Readonly<Record<string, number>>;
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

function getPresentationPool(
  candidateIds: readonly string[],
  config: DraftSessionConfig,
  random: DraftRandomSource,
  preferredCharacterId?: string,
): { candidateIds: string[]; rolledCharacterTypes: DraftCharacter['type'][] } {
  const mode = config.presentationMode ?? DraftPresentationMode.Open;
  if (mode === DraftPresentationMode.Open) {
    return {
      candidateIds: mixCandidateTypes(candidateIds, config.scriptCharacters, random),
      rolledCharacterTypes: [],
    };
  }

  const typeById = new Map(
    config.scriptCharacters.map((character) => [character.id, character.type]),
  );
  const feasibleTypes = shuffle(
    [
      ...new Set(
        candidateIds
          .map((id) => typeById.get(id))
          .filter((type): type is DraftCharacter['type'] => type !== undefined),
      ),
    ],
    random,
  );
  const preferredType = preferredCharacterId ? typeById.get(preferredCharacterId) : undefined;
  if (preferredType) {
    const preferredTypeIndex = feasibleTypes.indexOf(preferredType);
    if (preferredTypeIndex > 0) {
      feasibleTypes.splice(preferredTypeIndex, 1);
      feasibleTypes.unshift(preferredType);
    }
  }
  const typeCount = mode === DraftPresentationMode.SecretSingleType ? 1 : 2;
  const rolledCharacterTypes = feasibleTypes.slice(0, typeCount);
  const allowedTypes = new Set(rolledCharacterTypes);
  const restrictedCandidates = candidateIds.filter((id) => {
    const type = typeById.get(id);
    return type !== undefined && allowedTypes.has(type);
  });

  const mixedCandidates = mixCandidateTypes(restrictedCandidates, config.scriptCharacters, random);
  if (preferredCharacterId) {
    const preferredIndex = mixedCandidates.indexOf(preferredCharacterId);
    if (preferredIndex > 0) {
      mixedCandidates.splice(preferredIndex, 1);
      mixedCandidates.unshift(preferredCharacterId);
    }
  }

  return {
    candidateIds: mixedCandidates,
    rolledCharacterTypes,
  };
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
    variableModifierValues: config.variableModifierValues,
    characterCopyTargets: config.characterCopyTargets,
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

  if (legalCandidateIds.length === 0) {
    return {
      offer: null,
      legalCandidateIds,
      blockedReason: 'No character leaves a legal completion from this draft state.',
    };
  }

  const villageIdiotCopies = committedCharacterIds.filter((id) => id === 'villageidiot').length;
  const villageIdiotBias = villageIdiotCopies === 1 ? 0.55 : villageIdiotCopies >= 2 ? 0.75 : 0;
  const preferredCharacterId =
    legalCandidateIds.includes('villageidiot') && random() < villageIdiotBias
      ? 'villageidiot'
      : undefined;
  const presentation = getPresentationPool(legalCandidateIds, config, random, preferredCharacterId);
  const presentationCandidateIds =
    preferredCharacterId &&
    (config.presentationMode ?? DraftPresentationMode.Open) === DraftPresentationMode.Open
      ? [
          preferredCharacterId,
          ...presentation.candidateIds.filter((id) => id !== preferredCharacterId),
        ]
      : presentation.candidateIds;
  const optionCount = Math.min(3, Math.max(1, presentationCandidateIds.length - 1));
  const offeredCharacterIds = presentationCandidateIds.slice(0, optionCount);
  const mulliganCharacterId = presentationCandidateIds[optionCount] ?? null;

  return {
    offer: {
      offeredCharacterIds,
      mulliganCharacterId,
      rolledCharacterTypes: presentation.rolledCharacterTypes,
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

  if (resolution === 'mulligan' && offer.mulliganCharacterId === null) {
    throw new Error('This offer does not have a mulligan.');
  }

  const validCharacterIds =
    resolution === 'mulligan' && offer.mulliganCharacterId
      ? [offer.mulliganCharacterId]
      : offer.offeredCharacterIds;
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
