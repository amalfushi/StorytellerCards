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

  describe('text variant rewrites might/may as questions', () => {
    it('rewrites "might" phrases as player-facing questions', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="text"
          message="The Philosopher might choose a character"
        />,
      );
      expect(screen.getByTestId('player-show-message')).toHaveTextContent(
        'Would you like to choose a character?',
      );
    });

    it('rewrites "may" phrases as player-facing questions', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="text"
          message="The Acrobat may choose any player"
        />,
      );
      expect(screen.getByTestId('player-show-message')).toHaveTextContent(
        'Would you like to choose any player?',
      );
    });

    it('does not rewrite "might not" phrases', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="text"
          message="The Mayor might not die tonight"
        />,
      );
      expect(screen.getByTestId('player-show-message')).toHaveTextContent(
        'The Mayor might not die tonight',
      );
    });

    it('passes through messages without might/may unchanged', () => {
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

  describe('token variant with source character', () => {
    const cerenovus = makeChar({
      id: 'cerenovus',
      name: 'Cerenovus',
      type: 'Minion',
      defaultAlignment: 'Evil',
    });
    const harpy = makeChar({
      id: 'harpy',
      name: 'Harpy',
      type: 'Minion',
      defaultAlignment: 'Evil',
    });
    const fortune = makeChar({
      id: 'fortuneteller',
      name: 'Fortune Teller',
      type: 'Townsfolk',
      defaultAlignment: 'Good',
    });

    it('renders source character icon when sourceCharacter is provided', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="This character has selected you:"
          sourceCharacter={cerenovus}
        />,
      );
      expect(screen.getByTestId('source-character-cerenovus')).toBeInTheDocument();
      expect(screen.getByText('Cerenovus')).toBeInTheDocument();
    });

    it('renders additional label when provided', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="This character has selected you:"
          sourceCharacter={cerenovus}
          additionalLabel="You are now MAD that you are:"
        />,
      );
      expect(screen.getByTestId('token-additional-label')).toHaveTextContent(
        'You are now MAD that you are:',
      );
    });

    it('renders additional character icon when additionalCharacter is provided', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="This character has selected you:"
          sourceCharacter={cerenovus}
          additionalLabel="You are now MAD that you are:"
          additionalCharacter={fortune}
        />,
      );
      expect(screen.getByTestId('additional-character-fortuneteller')).toBeInTheDocument();
      expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
    });

    it('renders character icon list when provided', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="These characters are not in play:"
          characterList={[fortune]}
        />,
      );
      expect(screen.getByTestId('token-character-list-fortuneteller')).toBeInTheDocument();
      expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
    });

    it('renders instruction text when provided', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="This character has selected you:"
          sourceCharacter={harpy}
          instructionText="You must be MAD that the player being pointed to is evil, or one or both of you might die."
        />,
      );
      expect(screen.getByTestId('token-instruction-text')).toHaveTextContent(
        'You must be MAD that the player being pointed to is evil',
      );
    });

    it('renders Cerenovus fullscreen with all elements', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="This character has selected you:"
          sourceCharacter={cerenovus}
          additionalLabel="You are now MAD that you are:"
          additionalCharacter={fortune}
          instructionText="Something bad may happen if you do not pretend to be the character you are mad about."
        />,
      );
      expect(screen.getByText('This character has selected you:')).toBeInTheDocument();
      expect(screen.getByTestId('source-character-cerenovus')).toBeInTheDocument();
      expect(screen.getByTestId('token-additional-label')).toBeInTheDocument();
      expect(screen.getByTestId('additional-character-fortuneteller')).toBeInTheDocument();
      expect(screen.getByTestId('token-instruction-text')).toBeInTheDocument();
    });

    it('renders Pixie fullscreen with character picker and instruction without the Pixie source icon', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="You must be MAD that you are:"
          showCharacterPicker={true}
          scriptCharacters={[fortune]}
          initialSelectedCharacterId="fortuneteller"
          instructionText="If you are MAD that you are this character, you may gain their ability when they die."
        />,
      );
      expect(screen.getByText('You must be MAD that you are:')).toBeInTheDocument();
      expect(screen.queryByTestId('source-character-pixie')).not.toBeInTheDocument();
      expect(screen.getByTestId('selected-character-fortuneteller')).toBeInTheDocument();
      expect(screen.getByTestId('token-character-picker')).toBeInTheDocument();
      expect(screen.getByTestId('token-instruction-text')).toBeInTheDocument();
    });

    it('renders Cult Leader alignment picker with only Good and Evil', () => {
      const onAlignmentChange = vi.fn();
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="You are now:"
          showCharacterPicker={true}
          showAlignmentPicker={true}
          alignmentValue="Good"
          onAlignmentChange={onAlignmentChange}
        />,
      );
      fireEvent.mouseDown(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: 'Good' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Evil' })).toBeInTheDocument();
      expect(screen.queryByTestId('token-character-picker')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('option', { name: 'Evil' }));
      expect(onAlignmentChange).toHaveBeenCalledWith('Evil');
    });

    it('does not render source character when not provided', () => {
      render(
        <PlayerShowScreen open={true} onClose={vi.fn()} variant="token" tokenText="You are:" />,
      );
      expect(screen.queryByTestId(/source-character-/)).not.toBeInTheDocument();
    });

    it('does not render instruction text when not provided', () => {
      render(
        <PlayerShowScreen
          open={true}
          onClose={vi.fn()}
          variant="token"
          tokenText="This character has selected you:"
          sourceCharacter={cerenovus}
        />,
      );
      expect(screen.queryByTestId('token-instruction-text')).not.toBeInTheDocument();
    });
  });
});
