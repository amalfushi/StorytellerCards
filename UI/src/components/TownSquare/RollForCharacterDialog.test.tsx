import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { RollForCharacterDialog } from '@/components/TownSquare/RollForCharacterDialog.tsx';
import type { CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

function makeChar(id: string, name: string, type: CharacterType): CharacterDef {
  return {
    id,
    name,
    type,
    defaultAlignment:
      type === CharacterType.Demon || type === CharacterType.Minion
        ? Alignment.Evil
        : Alignment.Good,
    abilityShort: `${name} ability`,
    firstNight: null,
    otherNights: null,
    reminders: [],
  };
}

const scriptCharacters: CharacterDef[] = [
  makeChar('washerwoman', 'Washerwoman', CharacterType.Townsfolk),
  makeChar('chef', 'Chef', CharacterType.Townsfolk),
  makeChar('butler', 'Butler', CharacterType.Outsider),
  makeChar('poisoner', 'Poisoner', CharacterType.Minion),
  makeChar('imp', 'Imp', CharacterType.Demon),
  // Travellers must be filtered out of the wheel pool.
  makeChar('scapegoat', 'Scapegoat', CharacterType.Traveller),
];

/** Flush the wheel's transitionend + settle delay so handleSpin resolves. */
async function flushSpin() {
  await act(async () => {
    const strip = document.querySelector('[data-testid="character-wheel-strip"]');
    if (strip) strip.dispatchEvent(new Event('transitionend'));
    await new Promise((r) => setTimeout(r, 150));
  });
}

describe('RollForCharacterDialog', () => {
  beforeEach(() => {
    // Deterministic random for the random-branch test.
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the no-assignment warning only when the player has no character', () => {
    const { rerender } = render(
      <RollForCharacterDialog
        open
        scriptCharacters={scriptCharacters}
        preAssignedCharacterId={null}
        playerName="Alice"
        onApplyRandom={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTestId('roll-warning-no-assignment')).toBeTruthy();

    rerender(
      <RollForCharacterDialog
        open
        scriptCharacters={scriptCharacters}
        preAssignedCharacterId="imp"
        playerName="Alice"
        onApplyRandom={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('roll-warning-no-assignment')).toBeNull();
  });

  it('calls onApplyRandom with the picked id when no character was pre-assigned', async () => {
    const onApplyRandom = vi.fn();
    render(
      <RollForCharacterDialog
        open
        scriptCharacters={scriptCharacters}
        preAssignedCharacterId={null}
        playerName="Alice"
        onApplyRandom={onApplyRandom}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('roll-for-character-spin'));
    await flushSpin();

    expect(onApplyRandom).toHaveBeenCalledTimes(1);
    const pickedId = onApplyRandom.mock.calls[0][0];
    // Random spy returns 0 → first character of the sorted wheel pool.
    // Sort is Townsfolk → Outsider → Minion → Demon, then alpha, and
    // Travellers are filtered out. So first should be a townsfolk.
    expect(['chef', 'washerwoman']).toContain(pickedId);
  });

  it('does NOT call onApplyRandom when the player already has an assignment', async () => {
    const onApplyRandom = vi.fn();
    render(
      <RollForCharacterDialog
        open
        scriptCharacters={scriptCharacters}
        preAssignedCharacterId="poisoner"
        playerName="Alice"
        onApplyRandom={onApplyRandom}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('roll-for-character-spin'));
    await flushSpin();

    expect(onApplyRandom).not.toHaveBeenCalled();
  });

  it('clicking close fires onClose', () => {
    const onClose = vi.fn();
    render(
      <RollForCharacterDialog
        open
        scriptCharacters={scriptCharacters}
        preAssignedCharacterId="imp"
        playerName="Alice"
        onApplyRandom={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId('roll-for-character-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('still spins when preAssigned character is a Traveller (filtered out of wheel) by picking a random visible character', async () => {
    const onApplyRandom = vi.fn();
    render(
      <RollForCharacterDialog
        open
        scriptCharacters={scriptCharacters}
        preAssignedCharacterId="scapegoat"
        playerName="Alice"
        onApplyRandom={onApplyRandom}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('roll-for-character-spin'));
    await flushSpin();
    // Predetermined branch never invokes onApplyRandom even on fallback,
    // because the on-disk assignment is the source of truth.
    expect(onApplyRandom).not.toHaveBeenCalled();
    expect(screen.getByTestId('roll-for-character-result')).toBeTruthy();
  });
});
