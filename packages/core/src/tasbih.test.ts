import { describe, expect, it } from 'vitest';
import { isTasbihComplete, litBeads, ringBeads, tapTasbih } from './tasbih';

describe('tasbih', () => {
  it('counts toward a target, and the next tap after it begins a new round', () => {
    expect(tapTasbih(0, 33)).toEqual({ count: 1, reached: false });
    expect(tapTasbih(32, 33)).toEqual({ count: 33, reached: true });
    expect(isTasbihComplete(33, 33)).toBe(true);
    expect(tapTasbih(33, 33)).toEqual({ count: 1, reached: false });
    // A target lowered below the count completes the round.
    expect(isTasbihComplete(50, 33)).toBe(true);
    expect(tapTasbih(50, 33)).toEqual({ count: 1, reached: false });
  });

  it('counts on without a target', () => {
    expect(tapTasbih(99, null)).toEqual({ count: 100, reached: false });
    expect(isTasbihComplete(1000, null)).toBe(false);
  });

  it('draws one bead per count up to 100, else a ring of 33 going round', () => {
    expect(ringBeads(33)).toBe(33);
    expect(ringBeads(100)).toBe(100);
    expect(ringBeads(1000)).toBe(33);
    expect(ringBeads(null)).toBe(33);
    expect(litBeads(0, 33)).toBe(0);
    expect(litBeads(12, 33)).toBe(12);
    expect(litBeads(33, 33)).toBe(33);
    expect(litBeads(34, null)).toBe(1);
    expect(litBeads(66, null)).toBe(33);
    // A long target's ring fills whole only when the target is reached.
    expect(litBeads(999, 1000)).toBe(9);
    expect(litBeads(1000, 1000)).toBe(33);
  });
});
