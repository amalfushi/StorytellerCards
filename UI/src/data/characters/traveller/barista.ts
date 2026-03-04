import type { CharacterDef } from '@/types/index.ts';

export const barista: CharacterDef = {
  id: 'barista',
  name: 'Barista',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Each night, until dusk, 1) a player becomes sober, healthy & gets true info, or 2) their ability works twice. They learn which.',
  abilityDetailed: `The Barista either makes people sober & healthy, or allows them to act twice as much as normal.
• The Storyteller chooses which player the Barista affects each night, and which one of the two Barista abilities is in effect. The Barista does not know who or what the Storyteller chooses, but the affected player does.
• If the affected player is acting twice, then they do so at the normal time. If they would normally wake at night, they act, go to sleep, then wake to act again. If they have already used a “once per game” ability, they may use that ability again. If they have a “once per game” ability but have not used it yet, they may use it twice before dusk.
• If the Barista makes a player sober and healthy, their drunkenness and poisoning, if any, is removed, and they may not become drunk or poisoned until dusk. This player must get true information, even if a Vortox is in play.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Barista',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/baristaIcon.png',
    medium: '/icons/characters/baristaIcon.png',
    large: '/icons/characters/baristaIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'barista-soberandhealthy', text: 'SOBER AND HEALTHY' },
    { id: 'barista-actstwice', text: 'ACTS TWICE' },
    { id: 'barista-drunk', text: 'DRUNK' },
    { id: 'barista-poisoned', text: 'POISONED' },
  ],
};
