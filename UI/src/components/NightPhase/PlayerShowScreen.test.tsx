import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerShowScreen } from '@/components/NightPhase/PlayerShowScreen.tsx';
import type { CharacterDef } from '@/types/index.ts';

const makeChar = (overrides: Partial<CharacterDef> = {}): CharacterDef => ({
  id: 'washerwoman',
  name: 'Washerwoman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Test ability',
  firstNight: null,
  otherNights: null,
  reminders: [],
  ...overrides,
});

const bluffCharacters: CharacterDef[] = [
  makeChar({ id: 'washerwoman', name: 'Washerwoman', type: 'Townsfolk' }),
  makeChar({ id: 'empath', name: 'Empath', type: 'Townsfolk' }),
  makeChar({ id: 'butler', name: 'Butler', type: 'Outsider' }),
];

describe('PlayerShowScreen', () => {
  describe('bluffs variant', () => {
    it('renders bluff characters with title', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="bluffs"
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.getByText('Your bluffs are:')).toBeInTheDocument();
      expect(screen.getByTestId('player-show-bluff-washerwoman')).toBeInTheDocument();
      expect(screen.getByTestId('player-show-bluff-empath')).toBeInTheDocument();
      expect(screen.getByTestId('player-show-bluff-butler')).toBeInTheDocument();
    });

    it('displays character names', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="bluffs"
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.getByText('Washerwoman')).toBeInTheDocument();
      expect(screen.getByText('Empath')).toBeInTheDocument();
      expect(screen.getByText('Butler')).toBeInTheDocument();
    });

    it('does not show text message in bluffs variant', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="bluffs"
          bluffCharacters={bluffCharacters}
          message="Some message"
        />,
      );
      expect(screen.queryByTestId('player-show-message')).not.toBeInTheDocument();
    });
  });

  describe('text variant', () => {
    it('renders the message text', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="text"
          message="This character chose you"
        />,
      );
      expect(screen.getByTestId('player-show-message')).toHaveTextContent(
        'This character chose you',
      );
    });

    it('does not show bluffs in text variant', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="text"
          message="Hello"
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.queryByText('Your bluffs are:')).not.toBeInTheDocument();
    });

    it('does not render message content when message is empty', () => {
      render(<PlayerShowScreen open={true} onClose={vi.fn()} variant="text" message="" />);
      expect(screen.queryByTestId('player-show-message')).not.toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<PlayerShowScreen open={true} onClose={onClose} variant="text" message="Hello" />);
      fireEvent.click(screen.getByTestId('player-show-screen-close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when open is false', () => {
      render(<PlayerShowScreen open={false} onClose={vi.fn()} variant="text" message="Hello" />);
      expect(screen.queryByTestId('player-show-screen')).not.toBeInTheDocument();
    });
  });
});
