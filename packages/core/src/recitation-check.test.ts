import { describe, expect, it } from 'vitest';
import { checkRecitation, wordSimilarity } from './recitation-check';

// Al-Ikhlas 1-2, normalized as search text is (no vowel marks): "قل هو الله احد الله الصمد".
const ikhlas = ['قل', 'هو', 'الله', 'احد', 'الله', 'الصمد'];

describe('checking a recitation', () => {
  it('marks every word recited when all are heard', () => {
    expect(checkRecitation(ikhlas, ikhlas)).toEqual(Array(6).fill('recited'));
  });

  it('forgives a letter or two misheard', () => {
    expect(wordSimilarity('الصمد', 'الصمت')).toBeGreaterThanOrEqual(0.6);
    expect(checkRecitation(ikhlas, ['قل', 'هو', 'الله', 'احد', 'الله', 'الصمت'])).toEqual(
      Array(6).fill('recited'),
    );
  });

  it('marks a word skipped, and one said differently', () => {
    expect(checkRecitation(ikhlas, ['قل', 'الله', 'احد', 'الله', 'الصمد'])).toEqual([
      'recited',
      'skipped',
      'recited',
      'recited',
      'recited',
      'recited',
    ]);
    expect(checkRecitation(ikhlas, ['قل', 'هو', 'الرحمن', 'احد', 'الله', 'الصمد'])).toEqual([
      'recited',
      'recited',
      'different',
      'recited',
      'recited',
      'recited',
    ]);
  });

  it('does not hold a repeated word against the reciter', () => {
    expect(checkRecitation(ikhlas, ['قل', 'هو', 'هو', 'الله', 'احد', 'الله', 'الصمد'])).toEqual(
      Array(6).fill('recited'),
    );
  });

  it('leaves the words after the last one heard unreached', () => {
    expect(checkRecitation(ikhlas, ['قل', 'هو', 'الله'])).toEqual([
      'recited',
      'recited',
      'recited',
      'unreached',
      'unreached',
      'unreached',
    ]);
    expect(checkRecitation(ikhlas, [])).toEqual(Array(6).fill('unreached'));
    expect(checkRecitation([], ['قل'])).toEqual([]);
  });

  it('measures how alike two words are', () => {
    expect(wordSimilarity('', '')).toBe(1);
    expect(wordSimilarity('قل', 'قل')).toBe(1);
    expect(wordSimilarity('قل', 'هو')).toBe(0);
  });
});
