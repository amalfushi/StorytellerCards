import { describe, it, expect } from 'vitest';
import { parseHelpTextForChoices, parseHelpTextForChoice } from './NightChoiceHelper';

describe('parseHelpTextForChoices', () => {
  describe('single player choices', () => {
    it('parses "chooses a player"', () => {
      const result = parseHelpTextForChoices('The Monk chooses a player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(false);
      expect(result[0].maxSelections).toBe(1);
      expect(result[0].label).toBe('Choose a player');
    });

    it('parses "choose a player" (no "s")', () => {
      const result = parseHelpTextForChoices('The player may choose a player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
    });

    it('parses "might choose a player"', () => {
      const result = parseHelpTextForChoices('The Gossip might choose a player to protect.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(false);
    });

    it('parses "points to a player"', () => {
      const result = parseHelpTextForChoices('Point to a player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].maxSelections).toBe(1);
    });
  });

  describe('living and dead player choices', () => {
    it('parses "chooses a living player"', () => {
      const result = parseHelpTextForChoices('The character chooses a living player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('livingPlayer');
      expect(result[0].multiple).toBe(false);
      expect(result[0].maxSelections).toBe(1);
      expect(result[0].label).toBe('Choose a living player');
    });

    it('parses "might choose a living player"', () => {
      const result = parseHelpTextForChoices('They might choose a living player to target.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('livingPlayer');
    });

    it('parses "chooses a dead player"', () => {
      const result = parseHelpTextForChoices('The Oracle chooses a dead player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('deadPlayer');
      expect(result[0].multiple).toBe(false);
      expect(result[0].maxSelections).toBe(1);
      expect(result[0].label).toBe('Choose a dead player');
    });

    it('parses "might choose a dead player"', () => {
      const result = parseHelpTextForChoices('They might choose a dead player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('deadPlayer');
    });
  });

  describe('multi-player choices', () => {
    it('parses "chooses 2 players"', () => {
      const result = parseHelpTextForChoices('The character chooses 2 players.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(true);
      expect(result[0].maxSelections).toBe(2);
      expect(result[0].label).toBe('Choose 2 players');
    });

    it('parses "chooses 3 players"', () => {
      const result = parseHelpTextForChoices('The character chooses 3 players.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(true);
      expect(result[0].maxSelections).toBe(3);
      expect(result[0].label).toBe('Choose 3 players');
    });

    it('parses "chooses 2 living players"', () => {
      const result = parseHelpTextForChoices('The Seamstress chooses 2 living players.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('livingPlayer');
      expect(result[0].multiple).toBe(true);
      expect(result[0].maxSelections).toBe(2);
      expect(result[0].label).toBe('Choose 2 living players');
    });

    it('parses "might choose 2 players"', () => {
      const result = parseHelpTextForChoices('They might choose 2 players.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(true);
      expect(result[0].maxSelections).toBe(2);
    });

    it('parses "point to 2 players"', () => {
      const result = parseHelpTextForChoices('Point to 2 players.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(true);
      expect(result[0].maxSelections).toBe(2);
    });

    it('parses "point to the 3 players"', () => {
      const result = parseHelpTextForChoices('Point to the 3 players marked KNOW.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(true);
      expect(result[0].maxSelections).toBe(3);
    });
  });

  describe('character choices', () => {
    it('parses "chooses a character"', () => {
      const result = parseHelpTextForChoices('The Pixie chooses a character.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('character');
      expect(result[0].multiple).toBe(false);
      expect(result[0].maxSelections).toBe(1);
      expect(result[0].label).toBe('Choose a character');
    });

    it('parses "might choose a character"', () => {
      const result = parseHelpTextForChoices('They might choose a character to become.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('character');
    });

    it('parses "name a character"', () => {
      const result = parseHelpTextForChoices('The player may name a character.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('character');
      expect(result[0].maxSelections).toBe(1);
    });
  });

  describe('yes/no choices', () => {
    it('parses "nod or shake"', () => {
      const result = parseHelpTextForChoices('Either nod or shake your head.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('yesno');
      expect(result[0].multiple).toBe(false);
      expect(result[0].maxSelections).toBe(1);
      expect(result[0].label).toBe('Nod / Shake');
    });

    it('parses "nod yes or shake no"', () => {
      const result = parseHelpTextForChoices('Nod yes or shake no to indicate.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('yesno');
    });

    it('parses "Either nod or shake"', () => {
      const result = parseHelpTextForChoices('Either nod or shake head.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('yesno');
    });
  });

  describe('alignment choices', () => {
    it('parses "good or evil"', () => {
      const result = parseHelpTextForChoices('Show them good or evil.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('alignment');
      expect(result[0].multiple).toBe(false);
      expect(result[0].maxSelections).toBe(1);
      expect(result[0].label).toBe('Alignment');
    });

    it('parses "choose…alignment"', () => {
      const result = parseHelpTextForChoices('Choose an alignment for the player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('alignment');
    });
  });

  describe('compound choices', () => {
    it('parses "chooses a player & a character"', () => {
      const result = parseHelpTextForChoices(
        'The Cerenovus chooses a player & a character for them to become.',
      );
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('player');
      expect(result[0].multiple).toBe(false);
      expect(result[0].maxSelections).toBe(1);
      expect(result[0].label).toBe('Choose a player');
      expect(result[1].type).toBe('character');
      expect(result[1].multiple).toBe(false);
      expect(result[1].maxSelections).toBe(1);
      expect(result[1].label).toBe('Choose a character');
    });

    it('parses "chooses a player & a demon character"', () => {
      const result = parseHelpTextForChoices(
        'The Summoner chooses a player & a demon character.',
      );
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('player');
      expect(result[1].type).toBe('character');
    });
  });

  describe('no choices detected', () => {
    it('returns empty array for text with no choices', () => {
      const result = parseHelpTextForChoices('Wake the player. Show the token.');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      const result = parseHelpTextForChoices('');
      expect(result).toEqual([]);
    });

    it('returns empty array for generic instructions', () => {
      const result = parseHelpTextForChoices(
        'If there are 7 or more players, wake all Minions.',
      );
      expect(result).toEqual([]);
    });

    it('returns empty array for unusual formatting without keywords', () => {
      const result = parseHelpTextForChoices('!!@@## random $$ text');
      expect(result).toEqual([]);
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase "CHOOSES A PLAYER"', () => {
      const result = parseHelpTextForChoices('THE MONK CHOOSES A PLAYER.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('player');
    });

    it('handles mixed case "Chooses a Living Player"', () => {
      const result = parseHelpTextForChoices('The character Chooses a Living Player.');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('livingPlayer');
    });
  });
});

describe('parseHelpTextForChoice', () => {
  it('returns first parsed choice when choices exist', () => {
    const result = parseHelpTextForChoice('The Monk chooses a player.');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('player');
  });

  it('returns null for text with no choices', () => {
    const result = parseHelpTextForChoice('Wake the player. Show the token.');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = parseHelpTextForChoice('');
    expect(result).toBeNull();
  });

  it('returns only the first choice for compound patterns', () => {
    const result = parseHelpTextForChoice(
      'The Cerenovus chooses a player & a character.',
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('player');
  });
});
