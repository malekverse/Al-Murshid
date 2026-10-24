import { describe, expect, it } from 'vitest';
import { defaultPinned, MAX_PINNED, pinnedTools, togglePin } from './tools';

describe('the Tools hub', () => {
  it('pins Qibla and the calendar to Today by default', () => {
    expect(defaultPinned).toEqual(['qibla', 'calendar']);
  });

  it('shows only the pinned tools this platform has, once each, four at most', () => {
    expect(pinnedTools(['rise', 'qibla', 'qibla', 'calendar'], ['qibla', 'calendar'])).toEqual([
      'qibla',
      'calendar',
    ]);
    expect(
      pinnedTools(['tasbih', 'rise', 'qibla', 'calendar'], ['qibla', 'calendar', 'rise', 'tasbih']),
    ).toHaveLength(MAX_PINNED);
  });

  it('pins and unpins, and refuses a fifth', () => {
    expect(togglePin(['qibla'], 'rise')).toEqual(['qibla', 'rise']);
    expect(togglePin(['qibla', 'rise'], 'qibla')).toEqual(['rise']);
    // Stored settings could hold four entries already (an older list, a duplicate): no more pins.
    expect(togglePin(['qibla', 'qibla', 'calendar', 'rise'], 'tasbih')).toBeNull();
  });
});
