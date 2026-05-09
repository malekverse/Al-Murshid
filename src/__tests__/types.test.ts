import { getLevel, getLevelTitle, LEVEL_MILESTONES, LEVEL_TITLES } from '../types';

describe('getLevel', () => {
  it('returns level 1 for 0 points', () => {
    expect(getLevel(0)).toBe(1);
  });

  it('returns level 1 for points below 50', () => {
    expect(getLevel(49)).toBe(1);
  });

  it('returns level 2 for 50 points', () => {
    expect(getLevel(50)).toBe(2);
  });

  it('returns level 3 for 150 points', () => {
    expect(getLevel(150)).toBe(3);
  });

  it('returns level 4 for 500 points', () => {
    expect(getLevel(500)).toBe(4);
  });

  it('returns level 5 for 1000+ points', () => {
    expect(getLevel(1000)).toBe(5);
    expect(getLevel(9999)).toBe(5);
  });

  it('handles negative points', () => {
    expect(getLevel(-10)).toBe(1);
  });
});

describe('getLevelTitle', () => {
  it('returns English title for level 1', () => {
    expect(getLevelTitle(1, 'en')).toBe(LEVEL_TITLES[0].en);
  });

  it('returns Arabic title for level 1', () => {
    expect(getLevelTitle(1, 'ar')).toBe(LEVEL_TITLES[0].ar);
  });

  it('returns last title for out-of-range level', () => {
    expect(getLevelTitle(99, 'en')).toBe(LEVEL_TITLES[LEVEL_TITLES.length - 1].en);
  });
});
