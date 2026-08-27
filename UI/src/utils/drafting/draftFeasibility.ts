import { getDistribution } from '@/data/playerCountRules.ts';
import type { CharacterType } from '@/types/index.ts';
import {
  CHARACTER_DRAFT_RULES,
  DraftSetupMode,
  getMaximumDraftCopies,
  isPlayerDraftable,
} from '@/utils/drafting/draftRules.ts';
import type { DraftSetupMode as DraftSetupModeValue } from '@/utils/drafting/draftRules.ts';

export type DraftCharacterType = Extract<
  CharacterType,
  'Townsfolk' | 'Outsider' | 'Minion' | 'Demon'
>;

export interface DraftCharacter {
  id: string;
  type: DraftCharacterType;
}

export interface DraftFeasibilityInput {
  playerCount: number;
  scriptCharacters: readonly DraftCharacter[];
  committedCharacterIds: readonly string[];
  setupMode?: DraftSetupModeValue;
  variableModifierValues?: Readonly<Record<string, number>>;
  characterCopyTargets?: Readonly<Record<string, number>>;
}

export interface LegalDraftCandidateOptions {
  excludeCharacterIds?: readonly string[];
}

export interface DraftCompletionCounts {
  Townsfolk: number;
  Outsider: number;
  Minion: number;
  Demon: number;
}

interface SetupProfile {
  mode: DraftSetupMode;
  counts: DraftCompletionCounts;
  includedModifierIds: readonly string[];
  forbiddenCharacterIds: ReadonlySet<string>;
  setupCharacterIds: readonly string[];
}

const COUNTED_TYPES: readonly DraftCharacterType[] = ['Townsfolk', 'Outsider', 'Minion', 'Demon'];

const MODE_CHARACTER_IDS = ['atheist', 'legion', 'lilmonsta', 'summoner', 'kazali'] as const;

const COUNT_MODIFIER_IDS = [
  'balloonist',
  'hermit',
  'baron',
  'godfather',
  'xaan',
  'fanggu',
  'lordoftyphon',
  'vigormortis',
] as const;

const STRUCTURAL_CHARACTER_IDS = new Set([
  'bountyhunter',
  'choirboy',
  'king',
  'huntsman',
  'damsel',
  'heretic',
  'baron',
  'godfather',
  'lleech',
  'pithag',
  'spy',
  'widow',
]);

const resultCache = new Map<string, boolean>();

function emptyCounts(): DraftCompletionCounts {
  return { Townsfolk: 0, Outsider: 0, Minion: 0, Demon: 0 };
}

function toCounts(
  townsfolk: number,
  outsiders: number,
  minions: number,
  demons: number,
): DraftCompletionCounts {
  return {
    Townsfolk: townsfolk,
    Outsider: outsiders,
    Minion: minions,
    Demon: demons,
  };
}

function getCacheKey(input: DraftFeasibilityInput): string {
  const script = [...input.scriptCharacters]
    .map((character) => `${character.id}:${character.type}`)
    .sort()
    .join(',');
  const committed = [...input.committedCharacterIds].sort().join(',');
  const modifierValues = Object.entries(input.variableModifierValues ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, value]) => `${id}:${value}`)
    .join(',');
  const copyTargets = Object.entries(input.characterCopyTargets ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, value]) => `${id}:${value}`)
    .join(',');
  return `${input.playerCount}|${input.setupMode ?? 'any'}|${script}|${committed}|${modifierValues}|${copyTargets}`;
}

function countIds(ids: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

function countSelectedTypes(
  selected: ReadonlyMap<string, number>,
  scriptById: ReadonlyMap<string, DraftCharacter>,
): DraftCompletionCounts | undefined {
  const counts = emptyCounts();
  for (const [id, copies] of selected) {
    const character = scriptById.get(id);
    if (!character) return undefined;
    counts[character.type] += copies;
  }
  return counts;
}

function containsIncompatiblePair(ids: ReadonlySet<string>): boolean {
  for (const id of ids) {
    const incompatibleIds = CHARACTER_DRAFT_RULES[id]?.incompatibleCharacterIds ?? [];
    if (incompatibleIds.some((otherId) => ids.has(otherId))) return true;
  }
  return false;
}

function addRequiredCharacters(
  selected: Map<string, number>,
  scriptById: ReadonlyMap<string, DraftCharacter>,
  forbiddenCharacterIds: ReadonlySet<string>,
): boolean {
  const pending = [...selected.keys()];
  while (pending.length > 0) {
    const id = pending.pop();
    if (!id) continue;
    for (const requiredId of CHARACTER_DRAFT_RULES[id]?.requiredCharacterIds ?? []) {
      if (forbiddenCharacterIds.has(requiredId) || !scriptById.has(requiredId)) return false;
      if (!selected.has(requiredId)) {
        selected.set(requiredId, 1);
        pending.push(requiredId);
      }
    }
  }
  return true;
}

function hasEnoughOrdinaryCharacters(
  selected: ReadonlyMap<string, number>,
  profile: SetupProfile,
  scriptById: ReadonlyMap<string, DraftCharacter>,
): boolean {
  const selectedCounts = countSelectedTypes(selected, scriptById);
  if (!selectedCounts) return false;

  const available = emptyCounts();
  for (const [id, copies] of selected) {
    const character = scriptById.get(id);
    if (!character || STRUCTURAL_CHARACTER_IDS.has(id)) continue;
    available[character.type] += Math.max(0, getMaximumDraftCopies(id) - copies);
  }

  for (const character of scriptById.values()) {
    if (
      profile.forbiddenCharacterIds.has(character.id) ||
      STRUCTURAL_CHARACTER_IDS.has(character.id) ||
      selected.has(character.id) ||
      !isPlayerDraftable(character.id)
    ) {
      continue;
    }

    available[character.type] += getMaximumDraftCopies(character.id);
  }

  for (const type of COUNTED_TYPES) {
    const remaining = profile.counts[type] - selectedCounts[type];
    if (remaining < 0 || remaining > available[type]) return false;
  }

  if (selected.has('bountyhunter') && profile.counts.Townsfolk < 2) return false;
  return true;
}

function canFillProfile(
  input: DraftFeasibilityInput,
  profile: SetupProfile,
  scriptById: ReadonlyMap<string, DraftCharacter>,
): boolean {
  const selected = countIds(input.committedCharacterIds);
  for (const id of profile.includedModifierIds)
    selected.set(id, Math.max(1, selected.get(id) ?? 0));
  for (const id of profile.setupCharacterIds) {
    if (isPlayerDraftable(id)) selected.set(id, Math.max(1, selected.get(id) ?? 0));
  }
  for (const [id, target] of Object.entries(input.characterCopyTargets ?? {})) {
    const committedCopies = selected.get(id) ?? 0;
    if (
      !Number.isInteger(target) ||
      target < committedCopies ||
      target > getMaximumDraftCopies(id)
    ) {
      return false;
    }
    if (target > 0) selected.set(id, target);
  }

  for (const [id, copies] of selected) {
    if (
      !scriptById.has(id) ||
      copies > getMaximumDraftCopies(id) ||
      profile.forbiddenCharacterIds.has(id) ||
      !isPlayerDraftable(id)
    ) {
      return false;
    }
  }

  if (!addRequiredCharacters(selected, scriptById, profile.forbiddenCharacterIds)) return false;
  if (containsIncompatiblePair(new Set(selected.keys()))) return false;

  const structuralOptions = [...STRUCTURAL_CHARACTER_IDS].filter(
    (id) =>
      scriptById.has(id) &&
      !selected.has(id) &&
      !profile.forbiddenCharacterIds.has(id) &&
      isPlayerDraftable(id),
  );

  function searchStructural(index: number, current: Map<string, number>): boolean {
    if (index === structuralOptions.length) {
      const completed = new Map(current);
      if (!addRequiredCharacters(completed, scriptById, profile.forbiddenCharacterIds))
        return false;
      if (containsIncompatiblePair(new Set(completed.keys()))) return false;
      return hasEnoughOrdinaryCharacters(completed, profile, scriptById);
    }

    if (searchStructural(index + 1, current)) return true;

    const id = structuralOptions[index];
    current.set(id, 1);
    const possible = searchStructural(index + 1, current);
    current.delete(id);
    return possible;
  }

  return searchStructural(0, selected);
}

function getBaseCounts(playerCount: number, mode: DraftSetupMode): DraftCompletionCounts[] {
  const base = getDistribution(playerCount);

  if (mode === DraftSetupMode.Atheist) {
    return [toCounts(playerCount - base.outsiders, base.outsiders, 0, 0)];
  }
  if (mode === DraftSetupMode.Legion) {
    const goodCount = playerCount <= 5 ? 1 : playerCount <= 8 ? 2 : 3;
    return Array.from({ length: goodCount + 1 }, (_, outsiders) =>
      toCounts(goodCount - outsiders, outsiders, 0, playerCount - goodCount),
    );
  }
  if (mode === DraftSetupMode.LilMonsta) {
    return [toCounts(base.townsfolk, base.outsiders, base.minions + 1, 0)];
  }
  if (mode === DraftSetupMode.Summoner) {
    return [toCounts(base.townsfolk + 1, base.outsiders, base.minions, 0)];
  }

  return [toCounts(base.townsfolk, base.outsiders, base.minions, base.demons)];
}

function getModeCharacterId(mode: DraftSetupMode): string | undefined {
  return MODE_CHARACTER_IDS.find((id) => CHARACTER_DRAFT_RULES[id]?.setupMode === mode);
}

function getAllowedModifierIds(mode: DraftSetupMode, scriptIds: ReadonlySet<string>): string[] {
  return COUNT_MODIFIER_IDS.filter((id) => {
    if (!scriptIds.has(id)) return false;
    const type =
      id === 'fanggu' || id === 'lordoftyphon' || id === 'vigormortis' ? 'Demon' : undefined;
    if (mode === DraftSetupMode.Atheist && type === 'Demon') return false;
    if (
      (mode === DraftSetupMode.LilMonsta || mode === DraftSetupMode.Summoner) &&
      type === 'Demon'
    ) {
      return false;
    }
    return mode !== DraftSetupMode.Legion;
  });
}

function applyModifiers(
  playerCount: number,
  base: DraftCompletionCounts,
  selectedValues: ReadonlyMap<string, readonly number[]>,
): DraftCompletionCounts | undefined {
  let minions = base.Minion;
  let demons = base.Demon;
  let outsiderDelta = 0;
  let exactOutsiders: number | undefined;

  for (const [id, values] of selectedValues) {
    const rules = CHARACTER_DRAFT_RULES[id]?.countRules ?? [];
    rules.forEach((rule, index) => {
      const value = values[index];
      if (value === undefined) return;
      if (rule.type === 'Minion' && rule.operation === 'delta') minions += value;
      if (rule.type === 'Demon' && rule.operation === 'delta') demons += value;
      if (rule.type === 'Outsider' && rule.operation === 'exact') exactOutsiders = value;
      if (rule.type === 'Outsider' && rule.operation === 'delta') outsiderDelta += value;
    });
  }

  const goodSlots = playerCount - minions - demons;
  if (goodSlots < 0) return undefined;

  const outsiders = Math.min(
    goodSlots,
    Math.max(0, exactOutsiders ?? base.Outsider + outsiderDelta),
  );
  return toCounts(goodSlots - outsiders, outsiders, minions, demons);
}

function enumerateModifierSelections(
  modifierIds: readonly string[],
  forcedIds: ReadonlySet<string>,
  variableModifierValues: Readonly<Record<string, number>>,
  visit: (selectedValues: ReadonlyMap<string, readonly number[]>) => boolean,
): boolean {
  const selectedValues = new Map<string, readonly number[]>();

  function enumerateValues(
    id: string,
    rules: NonNullable<(typeof CHARACTER_DRAFT_RULES)[string]['countRules']>,
    ruleIndex: number,
    values: number[],
    done: () => boolean,
  ): boolean {
    if (ruleIndex === rules.length) {
      selectedValues.set(id, [...values]);
      const result = done();
      selectedValues.delete(id);
      return result;
    }

    const configuredValue = variableModifierValues[id];
    const ruleValues =
      configuredValue !== undefined && rules[ruleIndex].values.length > 1
        ? rules[ruleIndex].values.filter((value) => value === configuredValue)
        : rules[ruleIndex].values;
    for (const value of ruleValues) {
      values.push(value);
      if (enumerateValues(id, rules, ruleIndex + 1, values, done)) return true;
      values.pop();
    }
    return false;
  }

  function search(index: number): boolean {
    if (index === modifierIds.length) return visit(selectedValues);

    const id = modifierIds[index];
    if (!forcedIds.has(id) && search(index + 1)) return true;

    const rules = CHARACTER_DRAFT_RULES[id]?.countRules ?? [];
    return enumerateValues(id, rules, 0, [], () => search(index + 1));
  }

  return search(0);
}

function getPossibleModes(
  scriptIds: ReadonlySet<string>,
  requestedMode?: DraftSetupModeValue,
): DraftSetupModeValue[] {
  if (requestedMode) {
    if (requestedMode === DraftSetupMode.Standard) return [requestedMode];
    const modeCharacterId = getModeCharacterId(requestedMode);
    return modeCharacterId && scriptIds.has(modeCharacterId) ? [requestedMode] : [];
  }

  const modes: DraftSetupMode[] = [DraftSetupMode.Standard];
  for (const id of MODE_CHARACTER_IDS) {
    if (!scriptIds.has(id)) continue;
    const mode = CHARACTER_DRAFT_RULES[id]?.setupMode;
    if (mode && !modes.includes(mode)) modes.push(mode);
  }
  return modes;
}

function findCompletionInMode(
  input: DraftFeasibilityInput,
  mode: DraftSetupMode,
  scriptById: ReadonlyMap<string, DraftCharacter>,
): DraftCompletionCounts | undefined {
  const scriptIds = new Set(scriptById.keys());
  const modeCharacterId = getModeCharacterId(mode);
  const setupCharacterIds = modeCharacterId ? [modeCharacterId] : [];
  const forcedIds = new Set<string>();
  if (modeCharacterId && isPlayerDraftable(modeCharacterId)) forcedIds.add(modeCharacterId);

  const modifierIds = getAllowedModifierIds(mode, scriptIds);
  for (const id of input.committedCharacterIds) {
    if (modifierIds.includes(id)) forcedIds.add(id);
  }
  if (mode === DraftSetupMode.Kazali) forcedIds.add('kazali');

  const forbiddenModeIds = new Set<string>(
    MODE_CHARACTER_IDS.filter((id) => id !== modeCharacterId),
  );
  if (mode === DraftSetupMode.Standard) {
    MODE_CHARACTER_IDS.forEach((id) => forbiddenModeIds.add(id));
  }

  for (const base of getBaseCounts(input.playerCount, mode)) {
    let completionCounts: DraftCompletionCounts | undefined;
    const found = enumerateModifierSelections(
      modifierIds,
      forcedIds,
      input.variableModifierValues ?? {},
      (selectedValues) => {
        const counts = applyModifiers(input.playerCount, base, selectedValues);
        if (!counts) return false;

        const includedModifierIds = [...selectedValues.keys()];
        const forbiddenCharacterIds = new Set(forbiddenModeIds);
        modifierIds.forEach((id) => {
          if (!selectedValues.has(id)) forbiddenCharacterIds.add(id);
        });

        const canFill = canFillProfile(
          input,
          {
            mode,
            counts,
            includedModifierIds,
            forbiddenCharacterIds,
            setupCharacterIds,
          },
          scriptById,
        );
        if (canFill) completionCounts = counts;
        return canFill;
      },
    );
    if (found) return completionCounts;
  }
  return undefined;
}

function findLegalDraftCompletion(input: DraftFeasibilityInput): DraftCompletionCounts | undefined {
  if (
    !Number.isInteger(input.playerCount) ||
    input.playerCount < 5 ||
    input.playerCount > 15 ||
    input.committedCharacterIds.length > input.playerCount
  ) {
    return undefined;
  }

  const scriptById = new Map(input.scriptCharacters.map((character) => [character.id, character]));
  if (scriptById.size !== input.scriptCharacters.length) return undefined;

  const scriptIds = new Set(scriptById.keys());
  for (const mode of getPossibleModes(scriptIds, input.setupMode)) {
    const completion = findCompletionInMode(input, mode, scriptById);
    if (completion) return completion;
  }
  return undefined;
}

export function getLegalDraftCompletionCounts(
  input: DraftFeasibilityInput,
): DraftCompletionCounts | undefined {
  return findLegalDraftCompletion(input);
}

export function hasLegalDraftCompletion(input: DraftFeasibilityInput): boolean {
  const cacheKey = getCacheKey(input);
  const cached = resultCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const result = findLegalDraftCompletion(input) !== undefined;
  resultCache.set(cacheKey, result);
  return result;
}

export function getLegalDraftCandidates(
  input: DraftFeasibilityInput,
  options: LegalDraftCandidateOptions = {},
): string[] {
  const excludedIds = new Set(options.excludeCharacterIds ?? []);
  const committedCounts = countIds(input.committedCharacterIds);

  return [...input.scriptCharacters]
    .sort((left, right) => left.id.localeCompare(right.id))
    .filter(
      (character) =>
        !excludedIds.has(character.id) &&
        isPlayerDraftable(character.id) &&
        (committedCounts.get(character.id) ?? 0) <
          (input.characterCopyTargets?.[character.id] ?? getMaximumDraftCopies(character.id)),
    )
    .filter((character) =>
      hasLegalDraftCompletion({
        ...input,
        committedCharacterIds: [...input.committedCharacterIds, character.id],
      }),
    )
    .map((character) => character.id);
}

export function getLegalMulliganCandidates(
  input: DraftFeasibilityInput,
  offeredCharacterIds: readonly string[],
): string[] {
  return getLegalDraftCandidates(input, { excludeCharacterIds: offeredCharacterIds });
}

export function clearDraftFeasibilityCache(): void {
  resultCache.clear();
}
