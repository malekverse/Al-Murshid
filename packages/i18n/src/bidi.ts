// Bidi isolation (SPEC 7). Content direction is separate from UI direction: wrap user
// content and mixed-script strings so they never reorder their surroundings.
// Web uses <bdi>; native uses these Unicode isolate marks.

const FSI = '⁨'; // first strong isolate: direction from the content itself
const LRI = '⁦';
const RLI = '⁧';
const PDI = '⁩';

export function isolate(text: string, dir: 'auto' | 'ltr' | 'rtl' = 'auto'): string {
  const open = dir === 'ltr' ? LRI : dir === 'rtl' ? RLI : FSI;
  return `${open}${text}${PDI}`;
}

const strongRtl = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const strongLtr = /[A-Za-zÀ-ɏ]/;

/** Direction of the first strong character, like the HTML `dir="auto"` algorithm. */
export function detectDirection(text: string): 'rtl' | 'ltr' | null {
  for (const ch of text) {
    if (strongRtl.test(ch)) return 'rtl';
    if (strongLtr.test(ch)) return 'ltr';
  }
  return null;
}
