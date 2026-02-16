import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TownSquareLayout } from './TownSquareLayout';
import { generateMockPlayers } from '../../stories/mockData';
import type { PlayerSeat } from '../../types';
import type { TokenPosition } from './TownSquareLayout';

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

/** Default renderToken callback using TokenPlaceholder. */
const renderToken = (player: PlayerSeat, _position: TokenPosition) => (
  <TokenPlaceholder player={player} />
);

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
