// Checking a recitation (Phase 5b): what a speech model heard, lined up with the published words.
// Both sides arrive normalized (no vowel marks, one form per letter), so the check is about words
// only, never vowels or tajweed. It marks the published words and never shows what was heard.

/** How a published word was recited. */
export type WordCheck =
  /** Heard, as written or close enough. */
  | 'recited'
  /** Not heard where it belongs. */
  | 'skipped'
  /** Something else was heard in its place. */
  | 'different'
  /** After the last word heard: the reciter stopped before it. */
  | 'unreached';

/** Edit distance between two strings, by characters. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row.push(
        Math.min(
          previous[j]! + 1,
          row[j - 1]! + 1,
          previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
        ),
      );
    }
    previous = row;
  }
  return previous[b.length]!;
}

/** How alike two words are, from 0 (nothing shared) to 1 (the same). */
export function wordSimilarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - distance(a, b) / longest;
}

/** Words at least this alike count as the same: a letter or two may be misheard. */
const SAME = 0.6;
/** An extra word heard (a repeat, a restart) costs less than a word missed or changed. */
const EXTRA = 0.6;

/**
 * Lines up the words heard with the words expected (an alignment by edit distance over words) and
 * says how each expected word was recited. Extra words heard are not held against the reciter.
 * Where two alignments are as good (a word that recurs), the earlier match wins, so stopping
 * early leaves the rest unreached rather than skipped.
 */
export function checkRecitation(
  expected: readonly string[],
  heard: readonly string[],
): WordCheck[] {
  // Aligned from the end of reversed sequences, the walk back runs from the start.
  const marks = align([...expected].reverse(), [...heard].reverse()).reverse();
  // Words missing after the last one heard were not reached rather than skipped.
  for (let k = marks.length - 1; k >= 0 && marks[k] === 'skipped'; k--) marks[k] = 'unreached';
  return marks;
}

function align(expected: readonly string[], heard: readonly string[]): WordCheck[] {
  const n = expected.length;
  const m = heard.length;
  const same = (i: number, j: number) => wordSimilarity(expected[i]!, heard[j]!) >= SAME;
  // cost[i][j]: the cheapest way to line up the first i expected words with the first j heard.
  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j * EXTRA : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i]![j] = Math.min(
        cost[i - 1]![j - 1]! + (same(i - 1, j - 1) ? 0 : 1),
        cost[i - 1]![j]! + 1,
        cost[i]![j - 1]! + EXTRA,
      );
    }
  }
  // Walk back from the end, labelling each expected word.
  const marks: WordCheck[] = new Array<WordCheck>(n);
  let i = n;
  let j = m;
  while (i > 0) {
    const pair = j > 0 ? cost[i - 1]![j - 1]! + (same(i - 1, j - 1) ? 0 : 1) : Infinity;
    if (j > 0 && cost[i]![j] === pair) {
      marks[i - 1] = same(i - 1, j - 1) ? 'recited' : 'different';
      i--;
      j--;
    } else if (j > 0 && cost[i]![j] === cost[i]![j - 1]! + EXTRA) {
      j--;
    } else {
      marks[i - 1] = 'skipped';
      i--;
    }
  }
  return marks;
}
