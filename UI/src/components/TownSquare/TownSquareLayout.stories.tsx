import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TownSquareLayout } from './TownSquareLayout';
import { TokenBadges } from './TokenManager';
import {
  generateMockPlayers,
  worstCase20Players,
  mockCharacters,
  spiritOfIvory,
} from '../../stories/mockData';
import type { PlayerSeat, CharacterDef } from '../../types';
import type { TokenPosition } from './TownSquareLayout';

/**
 * Simple coloured placeholder for a player token.
 * Shows the seat number inside a small circle.
 */
/** Build a character lookup map including the mock traveller. */
const characterMap = new Map<string, CharacterDef>();
mockCharacters.forEach((ch) => characterMap.set(ch.id, ch));
characterMap.set(spiritOfIvory.id, spiritOfIvory);

/**
 * Simple coloured placeholder for a player token.
 * Shows the seat number inside a small circle.
 */
function TokenPlaceholder({ player }: { player: PlayerSeat }) {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '12px',
        bgcolor: '#1976d2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '0.7rem',
        fontWeight: 600,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}
    >
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
        {player.seat}
      </Typography>
      <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)' }}>
        {player.playerName}
      </Typography>
    </Box>
  );
}

/**
 * Richer token that shows character name + alignment colour.
 * Used by worst-case stories for the "visible info" (night view) variant.
 */
function RichTokenPlaceholder({ player }: { player: PlayerSeat }) {
  const ch = characterMap.get(player.characterId);
  const isDead = !player.alive;
  const borderColor =
    player.actualAlignment === 'Evil'
      ? '#d32f2f'
      : player.actualAlignment === 'Good'
        ? '#1976d2'
        : '#9e9e9e';
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '12px',
        bgcolor: isDead ? '#e0e0e0' : '#fff',
        border: `2px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 600,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        opacity: isDead ? 0.45 : 1,
      }}
    >
      <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: borderColor, lineHeight: 1.1 }}>
        {ch ? ch.name.slice(0, 7) : '?'}
      </Typography>
      <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', lineHeight: 1.1 }}>
        {player.playerName}
      </Typography>
      <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled', lineHeight: 1 }}>
        {player.seat}
        {isDead ? ' 💀' : ''}
      </Typography>
    </Box>
  );
}

/** Default renderToken callback using TokenPlaceholder. */
const renderToken = (player: PlayerSeat, _position: TokenPosition) => (
  <TokenPlaceholder player={player} />
);

/** Placeholder card dimensions (48×48 square). */
const PLACEHOLDER_CARD_W = 48;
const PLACEHOLDER_CARD_H = 48;

/**
 * Rich renderToken that also renders TokenBadges for players with tokens.
 * Uses the layout's position to compute badge angles relative to the
 * container centre (passed via closure).
 */
function createRichTokenWithBadges(
  containerWidth: number,
  containerHeight: number,
  tokenLayout: 'radial' | 'linear' = 'radial',
) {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  return (player: PlayerSeat, position: TokenPosition) => (
    <Box sx={{ position: 'relative' }}>
      <RichTokenPlaceholder player={player} />
      {player.tokens.length > 0 && (
        <Box sx={{ position: 'absolute', left: '50%', top: '50%' }}>
          <TokenBadges
            tokens={player.tokens}
            tileX={position.x}
            tileY={position.y}
            centerX={centerX}
            centerY={centerY}
            cardWidth={PLACEHOLDER_CARD_W}
            cardHeight={PLACEHOLDER_CARD_H}
            tokenLayout={tokenLayout}
          />
        </Box>
      )}
    </Box>
  );
}

const meta = {
  title: 'TownSquare/TownSquareLayout',
  component: TownSquareLayout,
  args: {
    renderToken,
    tokenRadius: 24,
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    containerWidth: {
      control: { type: 'range', min: 200, max: 1200, step: 25 },
      description: 'Width of the layout container (px)',
    },
    containerHeight: {
      control: { type: 'range', min: 200, max: 1200, step: 25 },
      description: 'Height of the layout container (px)',
    },
    tokenRadius: {
      control: { type: 'range', min: 12, max: 48, step: 2 },
      description: 'Half-width of the token for edge padding (px)',
    },
    shape: {
      control: { type: 'select' },
      options: ['circle', 'ovoid'],
      description: 'Layout shape — circle for tablets, ovoid for phones',
    },
  },
} satisfies Meta<typeof TownSquareLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

// ────────────────────────────────────────────────────────
// Circle layouts (tablet — 600×600)
// ────────────────────────────────────────────────────────

/** Circle layout with 5 players — small game. */
export const CircleFivePlayers: Story = {
  args: {
    players: generateMockPlayers(5),
    shape: 'circle',
    containerWidth: 600,
    containerHeight: 600,
  },
};

/** Circle layout with 10 players — medium game. */
export const CircleTenPlayers: Story = {
  args: {
    players: generateMockPlayers(10),
    shape: 'circle',
    containerWidth: 600,
    containerHeight: 600,
  },
};

/** Circle layout with 20 players — stress test. */
export const CircleTwentyPlayers: Story = {
  args: {
    players: generateMockPlayers(20),
    shape: 'circle',
    containerWidth: 600,
    containerHeight: 600,
  },
};

// ────────────────────────────────────────────────────────
// Ovoid layouts (phone portrait — 375×500)
// ────────────────────────────────────────────────────────

/** Ovoid layout with 5 players — small game on phone. */
export const OvoidFivePlayers: Story = {
  args: {
    players: generateMockPlayers(5),
    shape: 'ovoid',
    containerWidth: 375,
    containerHeight: 500,
  },
};

/** Ovoid layout with 10 players — medium game on phone. */
export const OvoidTenPlayers: Story = {
  args: {
    players: generateMockPlayers(10),
    shape: 'ovoid',
    containerWidth: 375,
    containerHeight: 500,
  },
};

/** Ovoid layout with 20 players — stress test on phone. */
export const OvoidTwentyPlayers: Story = {
  args: {
    players: generateMockPlayers(20),
    shape: 'ovoid',
    containerWidth: 375,
    containerHeight: 500,
  },
};

// ────────────────────────────────────────────────────────
// Worst-case scenarios (F3-4) — 20 realistic players
// ────────────────────────────────────────────────────────

/**
 * Worst-case circle layout — 20 players, hidden character info (day view).
 * Names only, no character data visible.
 */
export const WorstCaseCircleHidden: Story = {
  args: {
    players: worstCase20Players,
    shape: 'circle',
    containerWidth: 600,
    containerHeight: 600,
    renderToken,
  },
};

/**
 * Worst-case circle layout — 20 players, visible character info (night view).
 * Shows character names, alignment borders, alive/dead states, and token badges.
 */
export const WorstCaseCircleVisible: Story = {
  args: {
    players: worstCase20Players,
    shape: 'circle',
    containerWidth: 600,
    containerHeight: 600,
    renderToken: createRichTokenWithBadges(600, 600),
  },
};

/**
 * Worst-case ovoid layout — 20 players, hidden character info (day view).
 * Phone portrait dimensions; names only.
 */
export const WorstCaseOvoidHidden: Story = {
  args: {
    players: worstCase20Players,
    shape: 'ovoid',
    containerWidth: 375,
    containerHeight: 500,
    renderToken,
  },
};

/**
 * Worst-case ovoid layout — 20 players, visible character info (night view).
 * Phone portrait; shows character names, alignment borders, alive/dead states, and token badges.
 */
export const WorstCaseOvoidVisible: Story = {
  args: {
    players: worstCase20Players,
    shape: 'ovoid',
    containerWidth: 800,
    containerHeight: 400,
    renderToken: createRichTokenWithBadges(375, 500),
  },
};

// ────────────────────────────────────────────────────────
// Token badge layout variants (Phase 7B)
// ────────────────────────────────────────────────────────

/**
 * Radial token badge layout — badges fan outward from the
 * tile centre away from the town square centre.
 * This is the default badge layout mode.
 */
export const RadialTokenBadges: Story = {
  args: {
    players: worstCase20Players,
    shape: 'circle',
    containerWidth: 600,
    containerHeight: 600,
    renderToken: createRichTokenWithBadges(600, 600, 'radial'),
  },
};

/**
 * Linear token badge layout — badges are placed in a straight line
 * along the card edge furthest from the town square centre.
 * Useful for dense layouts where fan overlap is a problem.
 */
export const LinearTokenBadges: Story = {
  args: {
    players: worstCase20Players,
    shape: 'circle',
    containerWidth: 600,
    containerHeight: 600,
    renderToken: createRichTokenWithBadges(600, 600, 'linear'),
  },
};

// ────────────────────────────────────────────────────────
// Responsive viewport variants (P2-2)
// ────────────────────────────────────────────────────────

/** Tablet viewport — ovoid 10-player layout at iPad size. */
export const TabletViewport: Story = {
  ...OvoidTenPlayers,
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

/** Desktop viewport — circle 10-player layout at desktop size. */
export const DesktopViewport: Story = {
  ...CircleTenPlayers,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
