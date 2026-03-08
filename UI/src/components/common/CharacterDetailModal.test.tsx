import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';
import type { CharacterDef } from '@/types/index.ts';
import { CharacterType, Alignment, Edition } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock character data
// ──────────────────────────────────────────────

const fullCharacter: CharacterDef = {
  id: 'fortuneteller',
  name: 'Fortune Teller',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort:
    'Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.',
  abilityDetailed:
    'The Fortune Teller detects Demons. They may get false positives on one specific player.',
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fortune_Teller',
  firstNight: {
    order: 19,
    helpText: 'The Fortune Teller points to two players. Give a thumbs up or down.',
    subActions: [
      {
        id: 'ft-fn-1',
        description: 'The Fortune Teller points to two players.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 10,
    helpText: 'The Fortune Teller points to two players. Give the thumbs up or thumbs down.',
    subActions: [
      {
        id: 'ft-on-1',
        description: 'The Fortune Teller points to two players.',
        isConditional: false,
      },
    ],
  },
  reminders: [
    { id: 'ft-red-herring', text: 'Red herring' },
    { id: 'ft-selected', text: 'Selected' },
  ],
};

const minimalCharacter: CharacterDef = {
  id: 'slayer',
  name: 'Slayer',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort:
    'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const evilCharacter: CharacterDef = {
  id: 'imp',
  name: 'Imp',
  type: CharacterType.Demon,
  defaultAlignment: Alignment.Evil,
  abilityShort: 'Each night*, choose a player: they die.',
  abilityDetailed: 'The Imp kills a player each night. If the Imp dies, a Minion becomes the Imp.',
  wikiLink: 'https://wiki.bloodontheclocktower.com/Imp',
  firstNight: null,
  otherNights: {
    order: 24,
    helpText: 'The Imp points to a player. That player dies.',
    subActions: [
      { id: 'imp-on-1', description: 'The Imp points to a player.', isConditional: false },
    ],
  },
  reminders: [{ id: 'imp-dead', text: 'Dead' }],
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('CharacterDetailModal', () => {
  it('renders nothing when character is null', () => {
    const { container } = render(
      <CharacterDetailModal open={true} character={null} onClose={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when open is false (dialog hidden)', () => {
    render(<CharacterDetailModal open={false} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.queryByText('Fortune Teller')).not.toBeInTheDocument();
  });

  it('renders modal with character name when open', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
  });

  it('shows the character type chip', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('Townsfolk')).toBeInTheDocument();
  });

  it('shows the character alignment chip', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows the short ability text', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText(/Each night, choose 2 players/)).toBeInTheDocument();
  });

  it('shows the "Detailed Rules" heading and detailed text when available', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('Detailed Rules')).toBeInTheDocument();
    expect(screen.getByText(/The Fortune Teller detects Demons/)).toBeInTheDocument();
  });

  it('shows fallback text when abilityDetailed is not available', () => {
    render(<CharacterDetailModal open={true} character={minimalCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('Detailed Rules')).toBeInTheDocument();
    expect(screen.getByText('Detailed rules not yet available.')).toBeInTheDocument();
  });

  it('shows wiki link when character has one', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    const wikiLink = screen.getByText('View on Wiki');
    expect(wikiLink).toBeInTheDocument();
    expect(wikiLink.closest('a')).toHaveAttribute(
      'href',
      'https://wiki.bloodontheclocktower.com/Fortune_Teller',
    );
  });

  it('does not show wiki link when character has none', () => {
    render(<CharacterDetailModal open={true} character={minimalCharacter} onClose={vi.fn()} />);
    expect(screen.queryByText('View on Wiki')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={onClose} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows first night action info when present', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText(/First Night \(order 19\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/The Fortune Teller points to two players. Give a thumbs up or down./),
    ).toBeInTheDocument();
  });

  it('shows other nights action info when present', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText(/Other Nights \(order 10\)/)).toBeInTheDocument();
  });

  it('shows "No night actions" when character has no night actions', () => {
    render(<CharacterDetailModal open={true} character={minimalCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('No night actions.')).toBeInTheDocument();
  });

  it('shows reminder tokens when character has them', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('Reminder Tokens')).toBeInTheDocument();
    expect(screen.getByText('Red herring')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('does not show reminder tokens section when character has none', () => {
    render(<CharacterDetailModal open={true} character={minimalCharacter} onClose={vi.fn()} />);
    expect(screen.queryByText('Reminder Tokens')).not.toBeInTheDocument();
  });

  it('handles Evil-aligned character correctly', () => {
    render(<CharacterDetailModal open={true} character={evilCharacter} onClose={vi.fn()} />);
    expect(screen.getByText('Imp')).toBeInTheDocument();
    expect(screen.getByText('Demon')).toBeInTheDocument();
    expect(screen.getByText('Evil')).toBeInTheDocument();
  });

  // ── M22: Flavor text tests ──

  it('shows flavor text when character has one', () => {
    const charWithFlavor: CharacterDef = {
      ...fullCharacter,
      flavor: 'The stars are watching.',
    };
    render(<CharacterDetailModal open={true} character={charWithFlavor} onClose={vi.fn()} />);
    expect(screen.getByText(/The stars are watching/)).toBeInTheDocument();
  });

  it('does not show flavor text when character has none', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    // No element with ldquo (the open quote we wrap flavor in)
    expect(screen.queryByText(/\u201c/)).not.toBeInTheDocument();
  });

  // ── M22: Edition badge tests ──

  it('shows edition badge when character has edition', () => {
    const charWithEdition: CharacterDef = {
      ...fullCharacter,
      edition: Edition.TroubleBrewing,
    };
    render(<CharacterDetailModal open={true} character={charWithEdition} onClose={vi.fn()} />);
    expect(screen.getByText('Trouble Brewing')).toBeInTheDocument();
  });

  it('does not show edition badge when character has no edition', () => {
    render(<CharacterDetailModal open={true} character={fullCharacter} onClose={vi.fn()} />);
    expect(screen.queryByText('Trouble Brewing')).not.toBeInTheDocument();
    expect(screen.queryByText('Bad Moon Rising')).not.toBeInTheDocument();
    expect(screen.queryByText('Sects & Violets')).not.toBeInTheDocument();
    expect(screen.queryByText('Experimental')).not.toBeInTheDocument();
  });
});
