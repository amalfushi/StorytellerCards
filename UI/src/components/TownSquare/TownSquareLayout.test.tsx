import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TownSquareLayout } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { TokenPosition } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { PlayerSeat } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Helper: generate N mock players
// ──────────────────────────────────────────────

function makePlayers(count: number): PlayerSeat[] {
  return Array.from({ length: count }, (_, i): PlayerSeat => ({
    seat: i + 1,
    playerName: `Player ${i + 1}`,
    characterId: 'noble',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  }));
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('TownSquareLayout', () => {
  const renderToken = vi.fn((player: PlayerSeat, _position: TokenPosition) => (
    <div data-testid={`token-${player.seat}`}>{player.playerName}</div>
  ));

  it('renders without crashing', () => {
    const { container } = render(
      <TownSquareLayout
        players={makePlayers(5)}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    expect(container).toBeTruthy();
  });

  it('renders correct number of player tokens for 5 players', () => {
    render(
      <TownSquareLayout
        players={makePlayers(5)}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`token-${i}`)).toBeInTheDocument();
    }
  });

  it('renders correct number of player tokens for 10 players', () => {
    render(
      <TownSquareLayout
        players={makePlayers(10)}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByTestId(`token-${i}`)).toBeInTheDocument();
    }
  });

  it('renders correct number of player tokens for 15 players', () => {
    render(
      <TownSquareLayout
        players={makePlayers(15)}
        renderToken={renderToken}
        shape="ovoid"
        containerWidth={360}
        containerHeight={600}
      />,
    );
    for (let i = 1; i <= 15; i++) {
      expect(screen.getByTestId(`token-${i}`)).toBeInTheDocument();
    }
  });

  it('handles empty players array', () => {
    render(
      <TownSquareLayout
        players={[]}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    // Should still render the container with "Town Square" label
    expect(screen.getByText('Town Square')).toBeInTheDocument();
  });

  it('shows "Town Square" label in the centre', () => {
    render(
      <TownSquareLayout
        players={makePlayers(5)}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    expect(screen.getByText('Town Square')).toBeInTheDocument();
  });

  it('renders all tokens from the renderToken callback', () => {
    render(
      <TownSquareLayout
        players={makePlayers(5)}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    // Each player should produce a token element from the renderToken callback
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Player ${i}`)).toBeInTheDocument();
    }
  });

  it('returns null when container dimensions are zero', () => {
    const { container } = render(
      <TownSquareLayout
        players={makePlayers(5)}
        renderToken={renderToken}
        shape="circle"
        containerWidth={0}
        containerHeight={0}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('calls renderToken for each player', () => {
    const mockRenderToken = vi.fn((player: PlayerSeat) => (
      <div data-testid={`token-${player.seat}`}>{player.playerName}</div>
    ));
    render(
      <TownSquareLayout
        players={makePlayers(7)}
        renderToken={mockRenderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    expect(mockRenderToken).toHaveBeenCalledTimes(7);
  });

  it('passes position data to renderToken', () => {
    const mockRenderToken = vi.fn((_player: PlayerSeat, position: TokenPosition) => (
      <div data-testid="positioned-token">
        {position.x.toFixed(0)},{position.y.toFixed(0)}
      </div>
    ));
    render(
      <TownSquareLayout
        players={makePlayers(1)}
        renderToken={mockRenderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    expect(mockRenderToken).toHaveBeenCalledWith(
      expect.objectContaining({ seat: 1 }),
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number), angle: expect.any(Number) }),
    );
  });

  it('sorts players by seat number', () => {
    const unsortedPlayers = [
      { ...makePlayers(1)[0], seat: 3, playerName: 'Third' },
      { ...makePlayers(1)[0], seat: 1, playerName: 'First' },
      { ...makePlayers(1)[0], seat: 2, playerName: 'Second' },
    ];
    const callOrder: string[] = [];
    const mockRenderToken = vi.fn((player: PlayerSeat) => {
      callOrder.push(player.playerName);
      return <div>{player.playerName}</div>;
    });
    render(
      <TownSquareLayout
        players={unsortedPlayers}
        renderToken={mockRenderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    expect(callOrder).toEqual(['First', 'Second', 'Third']);
  });
});
