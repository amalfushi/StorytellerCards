import { describe, it, expect } from 'vitest';
import { createRef, useEffect } from 'react';
import { act, render } from '@testing-library/react';
import {
  CharacterWheel,
  type CharacterWheelHandle,
  WHEEL_ROW_HEIGHT_PX,
  WHEEL_STRIP_REPEATS,
} from '@/components/TownSquare/CharacterWheel.tsx';
import type { CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

function makeChar(
  id: string,
  name: string,
  type: CharacterType = CharacterType.Townsfolk,
): CharacterDef {
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

const chars: CharacterDef[] = [
  makeChar('alpha', 'Alpha'),
  makeChar('beta', 'Beta'),
  makeChar('gamma', 'Gamma'),
];

describe('CharacterWheel', () => {
  it('renders the bounded repeated strip needed for edge-safe spinning', () => {
    const { getByTestId } = render(<CharacterWheel characters={chars} />);
    const strip = getByTestId('character-wheel-strip');
    expect(strip.childElementCount).toBe(chars.length * WHEEL_STRIP_REPEATS);
    expect(WHEEL_STRIP_REPEATS).toBeLessThanOrEqual(7);
  });

  it('spinTo resolves immediately for an unknown character without animating', async () => {
    const ref = createRef<CharacterWheelHandle>();
    render(<CharacterWheel ref={ref} characters={chars} />);
    let resolved = false;
    await act(async () => {
      await ref.current!.spinTo('does-not-exist');
      resolved = true;
    });
    expect(resolved).toBe(true);
  });

  it('spinTo for a known character animates and settles', async () => {
    const ref = createRef<CharacterWheelHandle>();
    const { getByTestId } = render(<CharacterWheel ref={ref} characters={chars} />);
    const strip = getByTestId('character-wheel-strip');
    const wheel = getByTestId('character-wheel');

    // Kick off the spin; the transition itself will not fire transitionend in
    // jsdom, so we synthesise it.
    let donePromise!: Promise<void>;
    await act(async () => {
      donePromise = ref.current!.spinTo('beta', 50);
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(wheel.getAttribute('data-spinning')).toBe('true');
    expect(strip.style.transform).toMatch(/translateY\(-\d+(\.\d+)?px\)/);
    expect(strip.style.transform).toBe('translateY(-936px)');

    await act(async () => {
      strip.dispatchEvent(new Event('transitionend'));
      // SETTLE_SNAP_DELAY_MS = 80 — wait long enough for the snap-back.
      await new Promise((r) => setTimeout(r, 150));
      await donePromise;
    });

    expect(wheel.getAttribute('data-spinning')).toBe('false');
    // Row height is exposed as a constant; sanity-check that the strip rows
    // are tall enough that the snap math is using it.
    expect(WHEEL_ROW_HEIGHT_PX).toBeGreaterThan(0);
  });

  it('initialises the strip transform on mount via the resting effect', () => {
    // Render in an effect so the ResizeObserver / layout effects have a chance
    // to run before we read the inline style.
    let stripEl: HTMLDivElement | null = null;
    function Probe() {
      useEffect(() => {
        stripEl = document.querySelector('[data-testid="character-wheel-strip"]') as HTMLDivElement;
      });
      return <CharacterWheel characters={chars} />;
    }
    render(<Probe />);
    expect(stripEl).not.toBeNull();
    expect(stripEl!.style.transform).toMatch(/translateY\(-\d+(\.\d+)?px\)/);
  });

  it('renders a shorter wheel in compact mode', () => {
    const { getByTestId } = render(<CharacterWheel characters={chars} compact />);
    expect(getByTestId('character-wheel')).toHaveStyle({ height: '280px' });
  });

  it('supports a light private-draft surface', () => {
    const { getByTestId } = render(<CharacterWheel characters={chars} surface="light" />);
    expect(getByTestId('character-wheel')).toHaveStyle({ backgroundColor: '#fff' });
  });
});
