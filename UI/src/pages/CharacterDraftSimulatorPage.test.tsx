import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/Drafting/CharacterDraftRoller.tsx', () => ({
  CharacterDraftRoller: ({
    playerName,
    offer,
    onChoose,
    onMulligan,
  }: {
    playerName: string;
    offer: {
      offeredCharacterIds: string[];
      mulliganCharacterId: string | null;
    };
    onChoose: (id: string) => void;
    onMulligan: (id: string) => void;
  }) => (
    <div data-testid="mock-draft-roller">
      <span>{playerName}</span>
      <button onClick={() => onChoose(offer.offeredCharacterIds[0])}>Choose first</button>
      {offer.mulliganCharacterId && (
        <button onClick={() => onMulligan(offer.mulliganCharacterId!)}>Take mulligan</button>
      )}
    </div>
  ),
}));

import { CharacterDraftSimulatorPage } from '@/pages/CharacterDraftSimulatorPage.tsx';

describe('CharacterDraftSimulatorPage', () => {
  it('renders configuration without requiring a session or game', () => {
    render(<CharacterDraftSimulatorPage />);
    expect(screen.getByText('Character Draft Simulator')).toBeInTheDocument();
    expect(screen.getByLabelText('Script')).toBeInTheDocument();
    expect(screen.getByLabelText('Players')).toBeInTheDocument();
    expect(screen.getByLabelText('Drafting mode')).toBeInTheDocument();
    expect(screen.getByText(/does not create or modify a game/i)).toBeInTheDocument();
  });

  it('shows the viable candidate count for the active draft', () => {
    render(<CharacterDraftSimulatorPage />);
    fireEvent.click(screen.getByRole('button', { name: /start new draft/i }));
    expect(screen.getByTestId('draft-diagnostics')).toHaveTextContent(
      /legal candidates for the current player/i,
    );
  });

  it('imports the centralized script-catalog JSON format', async () => {
    render(<CharacterDraftSimulatorPage />);
    const file = {
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          id: 'centralized-test',
          name: 'Centralized Test',
          author: 'Test',
          characterIds: ['washerwoman', 'drunk', 'poisoner', 'imp'],
        }),
      ),
    };

    fireEvent.change(screen.getByTestId('draft-script-file'), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(screen.getByLabelText('Script')).toHaveTextContent('Centralized Test'),
    );
    expect(screen.queryByRole('alert')).not.toHaveTextContent(/must be an array/i);
  });

  it('starts a draft and advances after a simulated choice', () => {
    render(<CharacterDraftSimulatorPage />);
    fireEvent.click(screen.getByRole('button', { name: /start new draft/i }));

    expect(screen.getByTestId('mock-draft-roller')).toHaveTextContent('Player 1');
    fireEvent.click(screen.getByRole('button', { name: 'Choose first' }));
    expect(screen.getByTestId('draft-diagnostics')).toHaveTextContent('1 of 7 players committed');
  });

  it('records a simulated mulligan in diagnostics', () => {
    render(<CharacterDraftSimulatorPage />);
    fireEvent.click(screen.getByRole('button', { name: /start new draft/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Take mulligan' }));

    expect(screen.getByTestId('draft-diagnostics')).toHaveTextContent('(mulligan)');
  });

  it('forces a selected hidden character through the production Storyteller handoff', () => {
    render(<CharacterDraftSimulatorPage />);

    fireEvent.mouseDown(screen.getByLabelText('Hidden character'));
    fireEvent.click(screen.getByRole('option', { name: 'Marionette' }));
    fireEvent.click(screen.getByRole('button', { name: /test hidden draft/i }));

    expect(screen.getByTestId('draft-player-hidden-warning-test-player-1')).toBeVisible();
    expect(screen.getByTestId('current-player-hidden-identity-warning')).toHaveTextContent(
      /marionette/i,
    );
    fireEvent.click(screen.getByRole('button', { name: /hand device to test player 1/i }));
    expect(screen.getByTestId('mock-draft-roller')).toHaveTextContent('Test Player 1');
    expect(screen.queryByTestId('current-player-hidden-identity-warning')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Marionette' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Choose first' }));
    expect(screen.getByTestId('draft-player-test-player-1')).toHaveTextContent(
      /marionette.*appears as/i,
    );
  });

  it('returns to the home page', () => {
    render(<CharacterDraftSimulatorPage />);
    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
