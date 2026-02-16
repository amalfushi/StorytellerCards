import { useRef, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import { PlayerQuickActions } from './PlayerQuickActions';
import { alicePlayer, charliePlayer, travJackPlayer } from '../../stories/mockData';
import type { PlayerSeat } from '../../types';

const noop = () => {};

/**
 * Wrapper that provides a Button anchor element for the Menu.
 * The menu is auto-opened on mount so Storybook can render it immediately.
 */
function AnchoredQuickActions({
  player,
  showCharacters,
}: {
  player: PlayerSeat;
  showCharacters: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Auto-open after mount so the menu is visible in Storybook
    if (btnRef.current) {
      setAnchor(btnRef.current);
    }
  }, []);

  return (
    <>
      <Button ref={btnRef} variant="outlined" onClick={() => setAnchor(btnRef.current)}>
        {player.playerName} (Seat {player.seat})
      </Button>
      <PlayerQuickActions
        anchorEl={anchor}
        player={player}
        showCharacters={showCharacters}
        onClose={() => setAnchor(null)}
        onToggleAlive={noop}
        onToggleGhostVote={noop}
        onEditCharacter={noop}
        onRemoveTraveller={noop}
      />
    </>
  );
}

const meta = {
  title: 'TownSquare/PlayerQuickActions',
  component: PlayerQuickActions,
  args: {
    anchorEl: null,
    player: alicePlayer,
    showCharacters: false,
    onClose: noop,
    onToggleAlive: noop,
    onToggleGhostVote: noop,
    onEditCharacter: noop,
    onRemoveTraveller: noop,
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PlayerQuickActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Day view quick actions for an alive player — shows "Mark as Dead". */
export const AlivePlayerDay: Story = {
  render: () => <AnchoredQuickActions player={alicePlayer} showCharacters={false} />,
};

/** Day view quick actions for a dead player — shows "Mark as Alive" and "Use Ghost Vote". */
export const DeadPlayerDay: Story = {
  render: () => <AnchoredQuickActions player={charliePlayer} showCharacters={false} />,
};

/** Quick actions for a traveller — includes "Remove Traveller" option. */
export const TravellerActions: Story = {
  render: () => <AnchoredQuickActions player={travJackPlayer} showCharacters={false} />,
};

/** Night view quick actions — adds "Edit Character" option. */
export const NightViewActions: Story = {
  render: () => <AnchoredQuickActions player={alicePlayer} showCharacters={true} />,
};
