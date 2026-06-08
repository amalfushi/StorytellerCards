import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlayerShowDrawer } from '@/components/NightPhase/PlayerShowDrawer.tsx';
import type { CharacterDef, ShowToPlayerMessage, ShowToPlayerTemplate } from '@/types/index.ts';

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

const makeMessage = (overrides: Partial<ShowToPlayerMessage> = {}): ShowToPlayerMessage => ({
  id: 'message-1',
  seat: 1,
  text: 'Open your eyes',
  createdAt: '2026-06-01T00:00:00.000Z',
  ...overrides,
});

const makeTemplate = (overrides: Partial<ShowToPlayerTemplate> = {}): ShowToPlayerTemplate => ({
  id: 'template-1',
  text: 'Choose a player by pointing',
  scope: 'script',
  scriptId: 'carousel',
  usageCount: 2,
  lastUsedAt: '2026-06-01T00:00:00.000Z',
  ...overrides,
});

const bluffCharacters: CharacterDef[] = [
  makeChar({ id: 'washerwoman', name: 'Washerwoman', type: 'Townsfolk' }),
  makeChar({ id: 'empath', name: 'Empath', type: 'Townsfolk' }),
  makeChar({ id: 'butler', name: 'Butler', type: 'Outsider' }),
];

describe('PlayerShowDrawer', () => {
  it('renders multiple active messages for one player', () => {
    render(
      <PlayerShowDrawer
        open
        onClose={vi.fn()}
        seat={1}
        messages={[makeMessage(), makeMessage({ id: 'message-2', text: 'Go to the basement' })]}
      />,
    );

    expect(screen.getByText('Open your eyes')).toBeInTheDocument();
    expect(screen.getByText('Go to the basement')).toBeInTheDocument();
  });

  it('creates a new message from the compose box', () => {
    const onAddMessage = vi.fn();
    render(<PlayerShowDrawer open onClose={vi.fn()} seat={1} onAddMessage={onAddMessage} />);

    fireEvent.change(screen.getByTestId('show-message-compose').querySelector('textarea')!, {
      target: { value: 'Quietly stand up' },
    });
    fireEvent.click(screen.getByTestId('add-show-message-btn'));

    expect(onAddMessage).toHaveBeenCalledWith(1, 'Quietly stand up');
  });

  it('pins an active message as a template', () => {
    const onPinTemplate = vi.fn();
    render(
      <PlayerShowDrawer
        open
        onClose={vi.fn()}
        seat={1}
        scriptId="carousel"
        messages={[makeMessage({ text: 'Go to the basement' })]}
        onPinTemplate={onPinTemplate}
      />,
    );

    fireEvent.click(screen.getByLabelText('Pin template'));

    expect(onPinTemplate).toHaveBeenCalledWith('Go to the basement', 'script', 'carousel');
  });

  it('adds and shows a recent template when tapped', () => {
    const onAddMessage = vi.fn();
    const onBumpTemplateUsage = vi.fn();
    render(
      <PlayerShowDrawer
        open
        onClose={vi.fn()}
        seat={1}
        scriptId="carousel"
        templates={[makeTemplate()]}
        onAddMessage={onAddMessage}
        onBumpTemplateUsage={onBumpTemplateUsage}
      />,
    );

    fireEvent.click(screen.getAllByText('Choose a player by pointing')[0]);

    expect(onAddMessage).toHaveBeenCalledWith(1, 'Choose a player by pointing', 'template-1');
    expect(onBumpTemplateUsage).toHaveBeenCalledWith('template-1');
    expect(screen.getByTestId('player-show-screen')).toBeInTheDocument();
  });

  it('opens fullscreen show screen when Show Bluffs is clicked', () => {
    render(
      <PlayerShowDrawer
        open
        onClose={vi.fn()}
        seat={1}
        bluffCharacters={bluffCharacters}
        bluffLabel="Demon Bluffs"
      />,
    );

    fireEvent.click(screen.getByTestId('show-bluffs-btn'));

    expect(screen.getByText('Your bluffs are:')).toBeInTheDocument();
  });

  it('shows a once-per-game ability prompt when the character is flagged', () => {
    render(
      <PlayerShowDrawer
        open
        onClose={vi.fn()}
        seat={1}
        characterDef={makeChar({ oncePerGame: true })}
      />,
    );

    fireEvent.click(screen.getByTestId('show-once-per-game-prompt-btn'));

    expect(screen.getByTestId('player-show-message')).toHaveTextContent(
      'Would you like to use your ability?',
    );
  });

  it('auto-clones the last shown message when no active message exists', () => {
    const onAddMessage = vi.fn();
    render(
      <PlayerShowDrawer
        open
        onClose={vi.fn()}
        seat={1}
        messages={[
          makeMessage({
            id: 'shown-message',
            text: 'Previously shown',
            lastShownAt: '2026-06-01T01:00:00.000Z',
          }),
        ]}
        onAddMessage={onAddMessage}
      />,
    );

    expect(onAddMessage).toHaveBeenCalledWith(1, 'Previously shown', undefined);
  });
});
