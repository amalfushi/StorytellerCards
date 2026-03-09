import { describe, it, expect } from 'vitest';
import { detectSignalType, SignalType } from '@/utils/signalDetection.ts';

describe('detectSignalType', () => {
  it('detects finger signal patterns', () => {
    expect(detectSignalType('Give a finger signal')).toBe(SignalType.Finger);
    expect(detectSignalType('Show the number')).toBe(SignalType.Finger);
    expect(detectSignalType('Show them fingers')).toBe(SignalType.Finger);
    expect(detectSignalType('Hold up a number')).toBe(SignalType.Finger);
    expect(detectSignalType('give a finger signal of 0, 1, or 2')).toBe(SignalType.Finger);
  });

  it('detects thumbs up/down patterns', () => {
    expect(detectSignalType('Give a Thumbs Up or Thumbs Down')).toBe(SignalType.ThumbsUpDown);
    expect(detectSignalType('thumbs up or down')).toBe(SignalType.ThumbsUpDown);
    expect(detectSignalType('Nod or shake their head')).toBe(SignalType.ThumbsUpDown);
    expect(detectSignalType('give a thumbs-up')).toBe(SignalType.ThumbsUpDown);
  });

  it('returns none for non-signal descriptions', () => {
    expect(detectSignalType('Wake the character')).toBe(SignalType.None);
    expect(detectSignalType('Point at the Demon')).toBe(SignalType.None);
    expect(detectSignalType('Choose a player')).toBe(SignalType.None);
  });
});
