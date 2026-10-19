'use client';

import { hiddenWord, hideModes, type HideMode } from '@murshid/data';
import { memorizeBar } from '@murshid/tokens';
import { useTranslations } from 'next-intl';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { setQuranPrefs } from './reading-settings';

// Memorizing (Phase 5b): words or ayah markers hidden in every view, each keeping its exact
// place, so nothing reflows. A tap reveals one; holding shows the whole ayah while held.

/** How long a press must last to peek at the whole ayah. */
const HOLD_MS = 450;

export interface Memorize {
  mode: HideMode;
  /** Whether a word (by id) is hidden now: `index` from 0 in its ayah, `marker` its number. */
  hidden: (id: number, index: number, marker: boolean, ayahKey: string) => boolean;
  reveal: (id: number) => void;
  peek: (ayahKey: string | null) => void;
  /** Hide again what was revealed. */
  reset: () => void;
  revealedCount: number;
}

/** The reader's hiding state: what the mode hides, less what was revealed or is being peeked at. */
export function useMemorize(mode: HideMode): Memorize {
  const [state, setState] = useState<{ mode: HideMode; revealed: Set<number> }>({
    mode,
    revealed: new Set(),
  });
  const [peeking, setPeeking] = useState<string | null>(null);
  // A new mode starts with everything it hides hidden.
  const revealed = state.mode === mode ? state.revealed : new Set<number>();
  if (state.mode !== mode) setState({ mode, revealed });
  return {
    mode,
    hidden: (id, index, marker, ayahKey) =>
      hiddenWord(mode, index, marker) && !revealed.has(id) && peeking !== ayahKey,
    reveal: (id) => setState((s) => ({ mode: s.mode, revealed: new Set(s.revealed).add(id) })),
    peek: setPeeking,
    reset: () => setState({ mode, revealed: new Set() }),
    revealedCount: revealed.size,
  };
}

/**
 * A word that may be hidden. Hidden, it keeps its exact place and width, drawn as a thin bar near
 * the line's base: a tap reveals it, holding shows its whole ayah until released. Shown, it is
 * the word as given.
 */
export function Veil({
  hidden,
  marker = false,
  ayahKey,
  memorize,
  id,
  className,
  children,
}: {
  hidden: boolean;
  marker?: boolean;
  ayahKey: string;
  memorize: Memorize;
  id: number;
  className?: string;
  children: ReactNode;
}) {
  const t = useTranslations('quran.memorize');
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);
  if (!hidden) return children;

  const cancelHold = () => clearTimeout(hold.current);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={marker ? t('hiddenMarker') : t('hidden')}
      className={cn(
        'relative cursor-pointer rounded-control select-none hover:bg-ink/5',
        className,
      )}
      onPointerDown={() => {
        cancelHold();
        hold.current = setTimeout(() => {
          // Peeking shows the whole ayah, this word with it, so this element goes away while
          // held: the release is heard on the window.
          memorize.peek(ayahKey);
          const end = () => {
            memorize.peek(null);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
          };
          window.addEventListener('pointerup', end);
          window.addEventListener('pointercancel', end);
        }, HOLD_MS);
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      // A click is a tap (a hold never ends in a click here, its element being gone by then).
      // Revealing on click, not on release, keeps that click off the word now shown.
      onClick={(e) => {
        e.stopPropagation();
        memorize.reveal(id);
      }}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          memorize.reveal(id);
        }
      }}
    >
      {/* The word's own box keeps the place; it is simply not drawn. */}
      <span aria-hidden className="invisible">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-x-0 rounded-full bg-ink/25"
        style={{ bottom: `${memorizeBar.offset}em`, height: `${memorizeBar.height}em` }}
      />
    </span>
  );
}

/** What to hide while memorizing, and a way to hide again what was revealed. */
export function MemorizeSheet({
  open,
  onOpenChange,
  memorize,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memorize: Memorize;
}) {
  const t = useTranslations('quran.memorize');
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('title')} description={t('hint')}>
      <div className="flex flex-col gap-6 pb-4">
        <div role="radiogroup" aria-label={t('title')} className="flex flex-col gap-1">
          {hideModes.map((mode) => {
            const selected = memorize.mode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setQuranPrefs({ hide: mode });
                  onOpenChange(false);
                }}
                className={cn(
                  'flex min-h-touch items-center gap-3 rounded-control px-4 text-start',
                  selected ? 'bg-lantern/15 text-lantern-ink' : 'hover:bg-ink/5',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-4 shrink-0 rounded-full border-2',
                    selected ? 'border-lantern bg-lantern' : 'border-hairline',
                  )}
                />
                <Text as="span" role="body" tone="inherit">
                  {t(`modes.${mode}`)}
                </Text>
              </button>
            );
          })}
        </div>
        {memorize.mode !== 'off' && memorize.revealedCount > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              memorize.reset();
              onOpenChange(false);
            }}
          >
            {t('hideAgain')}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
