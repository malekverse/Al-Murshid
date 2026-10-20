// What a reader asked for on the page the server sent, before the full reader took over
// (Phase 6): the reader does it as soon as it is there. Elements carry it as data attributes.

export type ReaderIntent =
  | { kind: 'word'; ayah: number; index: number }
  | { kind: 'actions'; ayah: number }
  | { kind: 'footnote'; ayah: number; mark: string; ref: string }
  | { kind: 'settings' | 'memorize' | 'play' | 'view' };

/**
 * The intent an element carries (`data-intent`, `data-ayah`, `data-word`, `data-mark`, `data-ref`
 * for a footnote's note in the translation), if any. In
 * an ayah's words (`data-intent="words"`), a word is known by its place; the last is the number.
 */
export function readIntent(el: Element): ReaderIntent | null {
  const words = el.closest<HTMLElement>('[data-intent="words"]');
  if (words) {
    const word = el.closest('span');
    const index = word && word.parentElement === words ? [...words.children].indexOf(word) : -1;
    if (index < 0 || index === words.children.length - 1) return null;
    const ayah = Number(words.closest<HTMLElement>('[data-ayah]')?.dataset.ayah);
    return { kind: 'word', ayah, index };
  }
  const target = el.closest<HTMLElement>('[data-intent]');
  if (!target) return null;
  const { intent } = target.dataset;
  const ayah = Number(target.closest<HTMLElement>('[data-ayah]')?.dataset.ayah);
  switch (intent) {
    case 'word':
      return { kind: 'word', ayah, index: Number(target.dataset.word) };
    case 'actions':
      return { kind: 'actions', ayah };
    case 'footnote':
      return {
        kind: 'footnote',
        ayah,
        mark: target.dataset.mark ?? '',
        ref: target.dataset.ref ?? '',
      };
    case 'settings':
    case 'memorize':
    case 'play':
    case 'view':
      return { kind: intent };
    default:
      return null;
  }
}
