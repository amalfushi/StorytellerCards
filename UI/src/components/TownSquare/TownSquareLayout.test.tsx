import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TownSquareLayout } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { TokenPosition, CornerCharacter } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { Slot } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';
import type { TownSquarePlayer } from '@/components/TownSquare/PlayerToken.tsx';

function makeLayoutFixture(count: number): {
  slots: Slot[];
  playersBySlotId: Map<string, TownSquarePlayer>;
} {
  const slots: Slot[] = Array.from({ length: count }, (_, index) => ({
    kind: 'seat',
    id: `slot-${index + 1}`,
    playerId: `player-${index + 1}`,
  }));
  const playersBySlotId = new Map<string, TownSquarePlayer>();
  slots.forEach((slot, index) => {
    if (slot.kind !== 'seat' || !slot.playerId) return;
    playersBySlotId.set(slot.id, {
      playerId: slot.playerId,
      slotId: slot.id,
      seatNumber: index + 1,
      name: `Player ${index + 1}`,
      characterId: 'noble',
      alive: true,
      ghostVoteUsed: false,
      visibleAlignment: Alignment.Unknown,
      actualAlignment: Alignment.Good,
      startingAlignment: Alignment.Good,
      activeReminders: [],
      isTraveller: false,
      tokens: [],
    });
  });
  return { slots, playersBySlotId };
}

function renderLayout(
  count: number,
  overrides: Partial<React.ComponentProps<typeof TownSquareLayout>> = {},
) {
  const fixture = makeLayoutFixture(count);
  const renderToken =
    overrides.renderToken ??
    vi.fn((player: TownSquarePlayer, _position: TokenPosition) => (
      <div data-testid={`token-${player.seatNumber}`}>{player.name}</div>
    ));
  return {
    ...render(
      <TownSquareLayout
        slots={fixture.slots}
        playersBySlotId={fixture.playersBySlotId}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
        {...overrides}
      />,
    ),
    renderToken,
    ...fixture,
  };
}

describe('TownSquareLayout', () => {
  it('renders without crashing', () => {
    const { container } = renderLayout(5);
    expect(container).toBeTruthy();
  });

  it.each([5, 10, 15])('renders player tokens for %i occupied seats', (count) => {
    renderLayout(count, {
      shape: count > 10 ? 'ovoid' : 'circle',
      containerHeight: count > 10 ? 600 : 400,
    });
    for (let i = 1; i <= count; i++) {
      expect(screen.getByTestId(`token-${i}`)).toBeInTheDocument();
    }
  });

  it('handles an empty slot list', () => {
    renderLayout(0);
    expect(screen.getByText('Town Square')).toBeInTheDocument();
  });

  it('shows the Town Square label in the centre', () => {
    renderLayout(5);
    expect(screen.getByText('Town Square')).toBeInTheDocument();
  });

  it('renders all tokens returned by the renderToken callback', () => {
    renderLayout(5);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Player ${i}`)).toBeInTheDocument();
    }
  });

  it('returns null when container dimensions are zero', () => {
    const { container } = renderLayout(5, { containerWidth: 0, containerHeight: 0 });
    expect(container.innerHTML).toBe('');
  });

  it('calls renderToken for each occupied player slot', () => {
    const mockRenderToken = vi.fn((player: TownSquarePlayer) => (
      <div data-testid={`token-${player.seatNumber}`}>{player.name}</div>
    ));
    renderLayout(7, { renderToken: mockRenderToken });
    expect(mockRenderToken).toHaveBeenCalledTimes(7);
  });

  it('passes position data to renderToken', () => {
    const mockRenderToken = vi.fn((_player: TownSquarePlayer, position: TokenPosition) => (
      <div data-testid="positioned-token">
        {position.x.toFixed(0)},{position.y.toFixed(0)}
      </div>
    ));
    renderLayout(1, { renderToken: mockRenderToken });
    expect(mockRenderToken).toHaveBeenCalledWith(
      expect.objectContaining({ playerId: 'player-1', seatNumber: 1 }),
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        angle: expect.any(Number),
      }),
    );
  });

  it('uses slot order when rendering tokens', () => {
    const slots: Slot[] = [
      { kind: 'seat', id: 'slot-3', playerId: 'player-3' },
      { kind: 'seat', id: 'slot-1', playerId: 'player-1' },
      { kind: 'seat', id: 'slot-2', playerId: 'player-2' },
    ];
    const playersBySlotId = new Map<string, TownSquarePlayer>([
      [
        'slot-3',
        {
          ...makeLayoutFixture(1).playersBySlotId.get('slot-1')!,
          playerId: 'player-3',
          slotId: 'slot-3',
          seatNumber: 3,
          name: 'Third',
        },
      ],
      [
        'slot-1',
        {
          ...makeLayoutFixture(1).playersBySlotId.get('slot-1')!,
          playerId: 'player-1',
          slotId: 'slot-1',
          seatNumber: 1,
          name: 'First',
        },
      ],
      [
        'slot-2',
        {
          ...makeLayoutFixture(1).playersBySlotId.get('slot-1')!,
          playerId: 'player-2',
          slotId: 'slot-2',
          seatNumber: 2,
          name: 'Second',
        },
      ],
    ]);
    const callOrder: string[] = [];
    const renderToken = vi.fn((player: TownSquarePlayer) => {
      callOrder.push(player.name ?? '');
      return <div>{player.name}</div>;
    });
    render(
      <TownSquareLayout
        slots={slots}
        playersBySlotId={playersBySlotId}
        renderToken={renderToken}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    expect(callOrder).toEqual(['Third', 'First', 'Second']);
  });

  it('renders spacer and storyteller markers while reserving layout positions', () => {
    const slots: Slot[] = [
      { kind: 'seat', id: 'slot-1', playerId: 'player-1' },
      { kind: 'spacer', id: 'gap-1' },
      { kind: 'storyteller', id: 'st-1' },
    ];
    const player = makeLayoutFixture(1).playersBySlotId.get('slot-1')!;
    render(
      <TownSquareLayout
        slots={slots}
        playersBySlotId={new Map([['slot-1', player]])}
        renderToken={(p) => <div>{p.name}</div>}
        shape="circle"
        containerWidth={400}
        containerHeight={400}
      />,
    );
    expect(screen.getByTestId('spacer-marker-gap-1')).toBeInTheDocument();
    expect(screen.getByTestId('storyteller-marker-st-1')).toBeInTheDocument();
  });

  const mockFabled: CornerCharacter[] = [
    { id: 'angel', name: 'Angel', abilityShort: 'Protects new players.' },
    { id: 'djinn', name: 'Djinn', abilityShort: 'Manages jinxes.' },
  ];

  const mockLoric: CornerCharacter[] = [
    { id: 'bigwig', name: 'Big Wig', abilityShort: 'Gives defence lawyer.' },
  ];

  it('renders Fabled chips in setup powers corner', () => {
    renderLayout(5, { activeFabled: mockFabled });
    expect(screen.getByTestId('setup-powers-corner')).toBeInTheDocument();
    expect(screen.getByTestId('fabled-chip-angel')).toBeInTheDocument();
    expect(screen.getByTestId('fabled-chip-djinn')).toBeInTheDocument();
  });

  it('renders Loric chips in setup powers corner', () => {
    renderLayout(5, { activeLoric: mockLoric });
    expect(screen.getByTestId('setup-powers-corner')).toBeInTheDocument();
    expect(screen.getByTestId('loric-chip-bigwig')).toBeInTheDocument();
  });

  it('does not render setup powers when no Fabled or Loric are active', () => {
    renderLayout(5);
    expect(screen.queryByTestId('setup-powers-corner')).not.toBeInTheDocument();
  });

  it('renders Fabled and Loric in the unified setup powers corner', () => {
    renderLayout(5, { activeFabled: mockFabled, activeLoric: mockLoric });
    expect(screen.getByTestId('setup-powers-corner')).toBeInTheDocument();
    expect(screen.getByTestId('fabled-chip-angel')).toBeInTheDocument();
    expect(screen.getByTestId('loric-chip-bigwig')).toBeInTheDocument();
  });

  it('shows ability dialog when Fabled chip is clicked', () => {
    renderLayout(5, { activeFabled: mockFabled });
    fireEvent.click(screen.getByTestId('fabled-chip-angel'));
    expect(screen.getByText('Protects new players.')).toBeInTheDocument();
  });

  it('shows ability dialog when Loric chip is clicked', () => {
    renderLayout(5, { activeLoric: mockLoric });
    fireEvent.click(screen.getByTestId('loric-chip-bigwig'));
    expect(screen.getByText('Gives defence lawyer.')).toBeInTheDocument();
  });

  it('positions tokens closer to centre in linear layout mode', () => {
    const radialPositions: TokenPosition[] = [];
    const linearPositions: TokenPosition[] = [];
    const captureRadial = vi.fn((_player: TownSquarePlayer, pos: TokenPosition) => {
      radialPositions.push(pos);
      return <div />;
    });
    const captureLinear = vi.fn((_player: TownSquarePlayer, pos: TokenPosition) => {
      linearPositions.push(pos);
      return <div />;
    });
    const fixture = makeLayoutFixture(4);
    const props = {
      slots: fixture.slots,
      playersBySlotId: fixture.playersBySlotId,
      shape: 'circle' as const,
      containerWidth: 400,
      containerHeight: 400,
    };
    const { unmount } = render(
      <TownSquareLayout {...props} renderToken={captureRadial} tokenLayout="radial" />,
    );
    unmount();
    render(<TownSquareLayout {...props} renderToken={captureLinear} tokenLayout="linear" />);
    const radialDist = Math.hypot(radialPositions[0].x - 200, radialPositions[0].y - 200);
    const linearDist = Math.hypot(linearPositions[0].x - 200, linearPositions[0].y - 200);
    expect(linearDist).toBeLessThan(radialDist);
  });
});
