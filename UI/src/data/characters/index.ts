import type { CharacterDef } from '@/types/index.ts';

// ── Townsfolk ──
import { amnesiac } from './townsfolk/amnesiac.ts';
import { balloonist } from './townsfolk/balloonist.ts';
import { cannibal } from './townsfolk/cannibal.ts';
import { farmer } from './townsfolk/farmer.ts';
import { fisherman } from './townsfolk/fisherman.ts';
import { fortuneteller } from './townsfolk/fortuneteller.ts';
import { highpriestess } from './townsfolk/highpriestess.ts';
import { huntsman } from './townsfolk/huntsman.ts';
import { knight } from './townsfolk/knight.ts';
import { monk } from './townsfolk/monk.ts';
import { noble } from './townsfolk/noble.ts';
import { oracle } from './townsfolk/oracle.ts';
import { philosopher } from './townsfolk/philosopher.ts';
import { pixie } from './townsfolk/pixie.ts';
import { sage } from './townsfolk/sage.ts';
import { savant } from './townsfolk/savant.ts';
import { seamstress } from './townsfolk/seamstress.ts';
import { slayer } from './townsfolk/slayer.ts';
import { snakecharmer } from './townsfolk/snakecharmer.ts';
import { steward } from './townsfolk/steward.ts';
import { villageidiot } from './townsfolk/villageidiot.ts';

// ── Outsiders ──
import { damsel } from './outsider/damsel.ts';
import { drunk } from './outsider/drunk.ts';
import { golem } from './outsider/golem.ts';
import { goon } from './outsider/goon.ts';
import { klutz } from './outsider/klutz.ts';
import { mutant } from './outsider/mutant.ts';
import { ogre } from './outsider/ogre.ts';
import { recluse } from './outsider/recluse.ts';

// ── Minions ──
import { baron } from './minion/baron.ts';
import { cerenovus } from './minion/cerenovus.ts';
import { harpy } from './minion/harpy.ts';
import { marionette } from './minion/marionette.ts';
import { mezepheles } from './minion/mezepheles.ts';
import { poisoner } from './minion/poisoner.ts';
import { scarletwoman } from './minion/scarletwoman.ts';
import { spy } from './minion/spy.ts';

// ── Demons ──
import { fanggu } from './demon/fanggu.ts';
import { imp } from './demon/imp.ts';
import { kazali } from './demon/kazali.ts';
import { nodashii } from './demon/nodashii.ts';
import { ojo } from './demon/ojo.ts';

// ── Fabled ──
import { spiritofivory } from './fabled/spiritofivory.ts';

/** All character definitions. */
export const allCharacters: CharacterDef[] = [
  // Townsfolk
  amnesiac,
  balloonist,
  cannibal,
  farmer,
  fisherman,
  fortuneteller,
  highpriestess,
  huntsman,
  knight,
  monk,
  noble,
  oracle,
  philosopher,
  pixie,
  sage,
  savant,
  seamstress,
  slayer,
  snakecharmer,
  steward,
  villageidiot,
  // Outsiders
  damsel,
  drunk,
  golem,
  goon,
  klutz,
  mutant,
  ogre,
  recluse,
  // Minions
  baron,
  cerenovus,
  harpy,
  marionette,
  mezepheles,
  poisoner,
  scarletwoman,
  spy,
  // Demons
  fanggu,
  imp,
  kazali,
  nodashii,
  ojo,
  // Fabled
  spiritofivory,
];

/** Fast lookup map: character ID → CharacterDef. */
export const characterMap: Map<string, CharacterDef> = new Map(allCharacters.map((c) => [c.id, c]));

/**
 * Get a character definition by ID.
 * Returns `undefined` if not found (caller should use getFallbackCharacter for unknowns).
 */
export function getCharacter(id: string): CharacterDef | undefined {
  return characterMap.get(id);
}

export { buildNightOrder, FIRST_NIGHT_STRUCTURAL, OTHER_NIGHTS_STRUCTURAL } from './_nightOrder.ts';
