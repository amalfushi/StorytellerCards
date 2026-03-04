import type { CharacterDef } from '@/types/index.ts';

export const ventriloquist: CharacterDef = {
  id: 'ventriloquist',
  name: 'Ventriloquist',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort:
    'If a player is mad as a fresh character during their nomination, they might not die if executed today.',
  abilityDetailed: `The Ventriloquist rewards players for lying about who they are.
• Being "mad as a fresh character" means to claim to be a character that is different to a character that you have previously claimed to be.
• A player benefits from the Ventriloquist only if they are mad as a fresh character during the time that they are nominated.
• It doesn’t matter what their real character is. Players may be mad as a fake character then later mad as their real character, mad as their real character then later mad as a fake character, or mad as two fake characters.
• If the player does not die, they learn this after the execution happens. They don’t learn whether it was due to the Ventriloquist or not.
• The Storyteller judges whether the player is mad or not, and might let them die even if they were convincingly mad.
• This can protect the Demon, but the Storyteller will not protect the Demon if that means that evil wins.
• A player is only protected from dying on the same day that they were mad as a fresh character.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Ventriloquist',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/ventriloquistIcon.png',
    medium: '/icons/characters/ventriloquistIcon.png',
    large: '/icons/characters/ventriloquistIcon.png',
    placeholder: '#558b2f',
  },
  reminders: [{ id: 'ventriloquist-mad', text: 'MAD' }],
};
