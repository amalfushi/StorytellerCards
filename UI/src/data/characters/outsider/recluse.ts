import type { CharacterDef } from '@/types/index.ts';

export const recluse: CharacterDef = {
  id: 'recluse',
  name: 'Recluse',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'You might register as evil & as a Minion or Demon, even if dead.',
  abilityDetailed: `The Recluse might appear to be an evil character, but is actually good.
• Whenever the Recluse's alignment is detected, the Storyteller chooses whether the Recluse registers as good or evil.
• Whenever the Recluse is targeted by an ability that affects specific Minions or Demons, the Storyteller chooses whether the Recluse registers as that specific Minion or Demon.
• The Recluse may register as either good or evil, or as an Outsider, Minion, or Demon, at different parts of the same night. The Storyteller chooses whatever is most interesting.
• A Recluse that registers as a particular Minion or Demon does not have this character's ability. For example, a Recluse that registers as a Poisoner does not wake at night and cannot poison a player.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Recluse',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/recluseIcon.webp',
    medium: '/icons/characters/recluseIcon.webp',
    large: '/icons/characters/recluseIcon.webp',
    placeholder: '#1565c0',
  },
  reminders: [],
  flavor:
    "Garn git ya darn grub ya mitts ofma lorn yasee. Grr. Natsy pikkins yonder southwise ye begittin afta ya! Git! Me harvy no so widda licks and demmons no be fightin' hadsup ne'er ma kin. Git, assay!",
  edition: 'tb',
};
