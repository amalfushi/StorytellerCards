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
    isDead: false,
  },
  argTypes: {
    size: { control: { type: 'range', min: 16, max: 120, step: 4 } },
    isDead: { control: 'boolean' },
    typeColor: { control: 'color' },
  },
} satisfies Meta<typeof CharacterIconImage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default icon for a known character (Fortune Teller). */
export const Default: Story = {};

/** Imp character — demon type with dark red colour. */
export const DemonCharacter: Story = {
  args: {
    characterId: 'imp',
    characterName: 'Imp',
    typeColor: '#b71c1c',
  },
};

/** Small size (24px) — used in PlayerRow and compact views. */
export const SmallSize: Story = {
  args: {
    size: 24,
  },
};

/** Medium size (40px) — used in CharacterDetailModal. */
export const MediumSize: Story = {
  args: {
    size: 40,
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
 * Fallback state — unknown character ID that has no PNG.
 * The `onError` handler triggers the coloured-circle-with-letter fallback.
 */
export const FallbackUnknown: Story = {
  args: {
    characterId: 'totally_unknown_character',
    characterName: 'Unknown',
    typeColor: '#9e9e9e',
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
    size: 48,
  },
};

/** Clickable variant — cursor changes to pointer. */
export const Clickable: Story = {
  args: {
    onClick: () => alert('Icon clicked!'),
  },
};

/** Side-by-side comparison of multiple character types. */
export const MultipleTypes: StoryObj = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <CharacterIconImage characterId="chef" characterName="Chef" typeColor="#1976d2" size={48} />
      <CharacterIconImage characterId="drunk" characterName="Drunk" typeColor="#42a5f5" size={48} />
      <CharacterIconImage characterId="baron" characterName="Baron" typeColor="#d32f2f" size={48} />
      <CharacterIconImage characterId="imp" characterName="Imp" typeColor="#b71c1c" size={48} />
      <CharacterIconImage
        characterId="gardener"
        characterName="Gardener"
        typeColor="#558b2f"
        size={48}
      />
    </Box>
  ),
};

/** Size comparison row — 24, 32, 48, 64, 80. */
export const SizeComparison: StoryObj = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[24, 32, 48, 64, 80].map((s) => (
        <CharacterIconImage
          key={s}
          characterId="fortuneteller"
          characterName="Fortune Teller"
          typeColor="#1976d2"
          size={s}
        />
      ))}
    </Box>
  ),
};
