import { cn } from '@/lib/cn';

// The verse reader's markup, shared by the client reader and the page the server sends first
// (Phase 6). The full reader takes over that page on the first touch, so both must lay out
// identically: these classes are the one place they are written. The pieces repeated for every
// ayah are short utilities defined in globals.css (ayah, ayah-words, icon-button, footnote).

/** The reader's top bar. */
export const readerBarClass =
  'sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-md';
export const readerBarRowClass = 'mx-auto flex min-h-16 w-full max-w-page items-center gap-2 px-2';
export const readerBackClass =
  'flex size-touch shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5';

/** The column the surah flows in, and its opening (name, then the basmalah). */
export const readerMainClass = 'mx-auto flex w-full max-w-reading flex-col px-4 pb-32';
export const surahOpeningClass = 'flex flex-col items-center gap-2 py-8';

/**
 * One ayah in the verse view. Ayahs off screen are not laid out until they come near
 * (`content-visibility`), so a long surah opens as fast as a short one.
 */
export const ayahClass = (playing: boolean) => cn('ayah', playing && 'rounded-card bg-lantern/5');

/** A word of an ayah, which a tap opens. */
export const wordClass = (playingWord: boolean) =>
  cn('cursor-pointer rounded-control', playingWord ? 'bg-lantern/25' : 'hover:bg-ink/5');

/**
 * The same look for the words of an ayah sent by the server, set once on the ayah's paragraph:
 * there each word is a bare span (the last is the ayah's number), which keeps a long surah's page
 * small. The layout is the reader's, word for word.
 */
export const serverWordsClass = 'ayah-words';

/** A translation's footnote mark. */
export const footnoteClass = 'footnote';

/** The row under an ayah: its reference, marks and actions. */
export const ayahFooterClass = 'flex items-center gap-3';

/** A 48 x 48 round button holding one icon (SPEC 6.3 touch targets). */
export type IconButtonVariant = 'plain' | 'tinted' | 'glass';
const iconButtonVariants: Record<IconButtonVariant, string> = {
  plain: 'text-ink hover:bg-ink/5',
  tinted:
    'border border-hairline bg-surface text-ink shadow-card hover:bg-canvas dark:border-card-edge dark:shadow-none',
  glass: 'glass border border-hairline text-ink',
};
export const iconButtonClass = (variant: IconButtonVariant = 'plain', className?: string) =>
  cn('icon-button', iconButtonVariants[variant], className);
/** The icon inside, in pixels. */
export const ICON_SIZE = 22;

/** The previous and next surah, under the last ayah. */
export const surahNavClass = 'flex flex-wrap justify-between gap-4 py-8';
export const surahNavLinkClass = 'rounded-full px-4 py-3 hover:bg-ink/5';
