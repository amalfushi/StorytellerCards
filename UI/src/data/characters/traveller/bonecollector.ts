import type { CharacterDef } from '@/types/index.ts';

export const bonecollector: CharacterDef = {
  id: 'bonecollector',
  name: 'Bone Collector',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Once per game, at night*, choose a dead player: they regain their ability until dusk.',
  abilityDetailed: `The Bone Collector temporarily gives dead players their ability back.
• The Bone Collector must choose a dead player. The chosen player remains dead, but they get their ability to use. If their ability was a “you start knowing” or a “once per game” ability—such as the Virgin, Slayer, Clockmaker, Seamstress, or Juggler—they may use it again, even if it was already used, until dusk falls.
• When the Bone Collector chooses a player, that player does not learn they were selected by the Bone Collector, although they find out soon enough when they are woken to use their ability.
• If the Bone Collector dies, that player no longer has the ability they regained due to the Bone Collector.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Bone_Collector',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/bonecollectorIcon.webp',
    medium: '/icons/characters/bonecollectorIcon.webp',
    large: '/icons/characters/bonecollectorIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'bonecollector-hasability', text: 'HAS ABILITY' },
    { id: 'bonecollector-noability', text: 'NO ABILITY' },
  ],
  flavor:
    'I collect many things. Hair. Teeth. Clothes. Fragments of poems. The dreams of lost lovers. My secret arts are not for you to know but my fee is a mere pittance. Bring me the blood of a noblewoman who died of heartbreak under a full moon, and you shall have your answers.',
  edition: 'snv',
};
