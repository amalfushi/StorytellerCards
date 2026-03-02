import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { PlayerToken } from './PlayerToken';
import { TokenBadges } from './TokenManager';
import {
  mockCharacters,
  alicePlayer,
  charliePlayer,
  bobPlayer,
  dianaPlayer,
  evePlayer,
  travJackPlayer,
  playerWithDrunk,
  playerWithPoisoned,
  playerWithMultipleTokens,
  playerWithManyTokens,
} from '../../stories/mockData';
import type { CharacterDef, PlayerSeat } from '../../types';

const noop = () => {};

/** Look up a character definition by id. */
const char = (id: string): CharacterDef | undefined => mockCharacters.find((c) => c.id === id);

/**
 * Wrapper that renders a PlayerToken with TokenBadges around it,
 * simulating how TownSquareTab composes these in production.
 * The badges fan outward from the token's centre (pointing away from
 * a simulated town-square centre above the token).
 */
function PlayerTokenWithBadges({
  player,
  characterDef,
  showCharacters,
  size = 'medium',
}: {
  player: PlayerSeat;
  characterDef?: CharacterDef;
  showCharacters: boolean;
  size?: 'small' | 'medium' | 'large';
}) {
  const tileX = 0;
  const tileY = 0;
  // Simulate the centre being above the token so badges fan downward
  const centerX = 0;
  const centerY = -120;
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <PlayerToken
        player={player}
        characterDef={characterDef}
        showCharacters={showCharacters}
        isSelected={false}
        onClick={noop}
        size={size}
      />
      {showCharacters && player.tokens.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
          }}
        >
          <TokenBadges
            tokens={player.tokens}
            tileX={tileX}
            tileY={tileY}
            centerX={centerX}
            centerY={centerY}
          />
        </Box>
      )}
    </Box>
  );
}

const meta = {
  title: 'TownSquare/PlayerToken',
  component: PlayerToken,
  args: {
    showCharacters: false,
    isSelected: false,
    onClick: noop,
    size: 'medium',
  },
  argTypes: {
    showCharacters: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
} satisfies Meta<typeof PlayerToken>;

export default meta;
type Story = StoryObj<typeof meta>;

// ────────────────────────────────────────────────────────
// Day-view stories
// ────────────────────────────────────────────────────────

/** Day view — alive player showing name + seat number. */
export const DayViewAlive: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: false,
  },
};

/** Day view — dead player with faded appearance and ghost indicator. */
export const DayViewDead: Story = {
  args: {
    player: charliePlayer,
    characterDef: char('fortuneteller'),
    showCharacters: false,
  },
};

// ────────────────────────────────────────────────────────
// Night-view stories (showCharacters = true)
// ────────────────────────────────────────────────────────

/** Night view — townsfolk character with blue icon and blue border. */
export const NightViewTownsfolk: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: true,
  },
};

/** Night view — demon character with dark red icon and evil border. */
export const NightViewDemon: Story = {
  args: {
    player: bobPlayer,
    characterDef: char('imp'),
    showCharacters: true,
  },
};

/** Night view — minion character with red styling. */
export const NightViewMinion: Story = {
  args: {
    player: dianaPlayer,
    characterDef: char('cerenovus'),
    showCharacters: true,
  },
};

// ────────────────────────────────────────────────────────
// State variations
// ────────────────────────────────────────────────────────

/** Dead player who has used their ghost vote — shows crossed-out ballot. */
export const GhostVoteUsed: Story = {
  args: {
    player: evePlayer,
    characterDef: char('drunk'),
    showCharacters: false,
  },
};

/** Traveller token — split blue/red border in night view. */
export const TravellerToken: Story = {
  args: {
    player: travJackPlayer,
    characterDef: undefined,
    showCharacters: true,
  },
};

/** Selected token — elevated with highlighted ring. */
export const Selected: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: false,
    isSelected: true,
  },
};

// ────────────────────────────────────────────────────────
// Size variations
// ────────────────────────────────────────────────────────

/** Small size — compact token for 15+ player games. */
export const SmallSize: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: true,
    size: 'small',
  },
};

/** Large size — roomy token for 5–8 player games. */
export const LargeSize: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: true,
    size: 'large',
  },
};

// ────────────────────────────────────────────────────────
// Token stories (F3-16)
// ────────────────────────────────────────────────────────

/** Player with a Drunk token — shows single blue badge (night view). */
export const WithDrunkToken: StoryObj = {
  render: () => (
    <PlayerTokenWithBadges
      player={playerWithDrunk}
      characterDef={char('noble')}
      showCharacters={true}
    />
  ),
};

/** Player with a Poisoned token — shows single purple badge (night view). */
export const WithPoisonedToken: StoryObj = {
  render: () => (
    <PlayerTokenWithBadges
      player={playerWithPoisoned}
      characterDef={char('imp')}
      showCharacters={true}
    />
  ),
};

/** Player with Drunk + 3 custom tokens — fan of 4 badges (night view). */
export const WithMultipleTokens: StoryObj = {
  render: () => (
    <PlayerTokenWithBadges
      player={playerWithMultipleTokens}
      characterDef={char('cerenovus')}
      showCharacters={true}
    />
  ),
};

/** Worst case: 1 Drunk + 1 Poisoned + 8 custom tokens (10 total, night view). */
export const WithManyTokens: StoryObj = {
  render: () => (
    <PlayerTokenWithBadges
      player={playerWithManyTokens}
      characterDef={char('fortuneteller')}
      showCharacters={true}
    />
  ),
};
