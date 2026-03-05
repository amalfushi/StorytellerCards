import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { CharacterIconImage } from './CharacterIconImage';

const meta = {
  title: 'Common/CharacterIconImage',
  component: CharacterIconImage,
  args: {
    characterId: 'fortuneteller',
    characterName: 'Fortune Teller',
    typeColor: '#1976d2',
    size: 48,
    borderColor: '#1976d2',
    isDead: false,
  },
  argTypes: {
    size: { control: { type: 'range', min: 16, max: 120, step: 4 } },
    isDead: { control: 'boolean' },
    typeColor: { control: 'color' },
    borderColor: { control: 'color' },
  },
} satisfies Meta<typeof CharacterIconImage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default icon for a known character (Fortune Teller) with Good alignment border. */
export const Default: Story = {};

/** Imp character — demon type with Evil alignment red border. */
export const DemonCharacter: Story = {
  args: {
    characterId: 'imp',
    characterName: 'Imp',
    typeColor: '#b71c1c',
    borderColor: '#d32f2f',
  },
};

/**
 * Minimum size enforcement — passing 24 still renders at 48px.
 * The component enforces `Math.max(size, 48)`.
 */
export const MinimumSizeEnforced: Story = {
  args: {
    size: 24,
  },
};

/** Large size (80px) — used in NightFlashcard. */
export const LargeSize: Story = {
  args: {
    size: 80,
  },
};

/** Dead state — desaturated and darkened. */
export const DeadState: Story = {
  args: {
    isDead: true,
    size: 64,
  },
};

/**
 * Good alignment border — blue ring around the icon.
 * Used for Townsfolk, Outsider, and Good-aligned players.
 */
export const GoodAlignmentBorder: Story = {
  args: {
    characterId: 'chef',
    characterName: 'Chef',
    typeColor: '#1976d2',
    borderColor: '#1976d2',
    size: 64,
  },
};

/**
 * Evil alignment border — red ring around the icon.
 * Used for Minion, Demon, and Evil-aligned players.
 */
export const EvilAlignmentBorder: Story = {
  args: {
    characterId: 'imp',
    characterName: 'Imp',
    typeColor: '#b71c1c',
    borderColor: '#d32f2f',
    size: 64,
  },
};

/**
 * Alignment mismatch — Evil Townsfolk.
 * The border is red (Evil alignment) even though the typeColor is blue (Townsfolk).
 * Shows what happens when a player's alignment differs from their character's default.
 */
export const EvilTownsfolkMismatch: Story = {
  args: {
    characterId: 'chef',
    characterName: 'Chef',
    typeColor: '#1976d2',
    borderColor: '#d32f2f',
    size: 64,
  },
};

/**
 * Unknown alignment — falls back to typeColor for the border.
 * Used when alignment is unknown (e.g. unassigned characters).
 */
export const UnknownAlignmentBorder: Story = {
  args: {
    characterId: 'fortuneteller',
    characterName: 'Fortune Teller',
    typeColor: '#1976d2',
    borderColor: '#1976d2',
    size: 64,
  },
};

/** Loric character — green type colour used as border fallback. */
export const LoricCharacter: Story = {
  args: {
    characterId: 'gardener',
    characterName: 'Gardener',
    typeColor: '#558b2f',
    borderColor: '#558b2f',
    size: 64,
  },
};

/**
 * Fallback state — unknown character ID that has no PNG.
 * The `onError` handler triggers the coloured-circle-with-letter fallback.
 */
export const FallbackUnknown: Story = {
  args: {
    characterId: 'totally_unknown_character',
    characterName: 'Unknown',
    typeColor: '#9e9e9e',
    borderColor: '#9e9e9e',
    size: 48,
  },
};

/**
 * Fallback state — empty character ID.
 * Immediately shows the coloured circle with first letter.
 */
export const FallbackEmptyId: Story = {
  args: {
    characterId: '',
    characterName: 'No Character',
    typeColor: '#9e9e9e',
    borderColor: '#9e9e9e',
    size: 48,
  },
};

/** Clickable variant — cursor changes to pointer. */
export const Clickable: Story = {
  args: {
    onClick: () => alert('Icon clicked!'),
  },
};

/** Side-by-side comparison of multiple character types with alignment borders. */
export const MultipleTypes: StoryObj = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <CharacterIconImage
        characterId="chef"
        characterName="Chef"
        typeColor="#1976d2"
        borderColor="#1976d2"
        size={48}
      />
      <CharacterIconImage
        characterId="drunk"
        characterName="Drunk"
        typeColor="#42a5f5"
        borderColor="#1976d2"
        size={48}
      />
      <CharacterIconImage
        characterId="baron"
        characterName="Baron"
        typeColor="#d32f2f"
        borderColor="#d32f2f"
        size={48}
      />
      <CharacterIconImage
        characterId="imp"
        characterName="Imp"
        typeColor="#b71c1c"
        borderColor="#d32f2f"
        size={48}
      />
      <CharacterIconImage
        characterId="gardener"
        characterName="Gardener"
        typeColor="#558b2f"
        borderColor="#558b2f"
        size={48}
      />
    </Box>
  ),
};

/**
 * Size comparison row — all floor to 48 minimum, then 64, 80.
 * Sizes 24 and 32 are clamped to 48.
 */
export const SizeComparison: StoryObj = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[24, 32, 48, 64, 80].map((s) => (
        <CharacterIconImage
          key={s}
          characterId="fortuneteller"
          characterName="Fortune Teller"
          typeColor="#1976d2"
          borderColor="#1976d2"
          size={s}
        />
      ))}
    </Box>
  ),
};
