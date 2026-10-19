'use client';

import {
  BookmarkSimple,
  BookOpenText,
  Copy,
  Play,
  Repeat,
  ShareNetwork,
  Translate,
  X,
} from '@phosphor-icons/react';
import type { Word } from '@murshid/content/quran';
import { bookmarkColors, bookmarkEnd, type QuranBookmark } from '@murshid/data';
import { typeScale } from '@murshid/tokens';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { setBookmark } from '@/lib/quran';
import { PassageSheet, type PassageTarget } from './passage-sheet';
import { markClass } from './quran-home';
import type { PassagePlan } from './recitation';
import { TafsirSheet } from './tafsir-sheet';

export interface WordTarget {
  word: Word;
  meaning: string | null;
  transliteration: string | null;
  rect: DOMRect;
}

/** A word's meaning and transliteration, next to the tapped word (SPEC 5.5). */
export function WordPopover({ target, onClose }: { target: WordTarget; onClose: () => void }) {
  const t = useTranslations('quran');
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; start: number } | null>(null);

  // Below the word when there is room, above it otherwise; always inside the window. The offset
  // is measured from the inline start, so it holds in right-to-left pages too.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const margin = 16;
    const below = target.rect.bottom + 8 + height < window.innerHeight - margin;
    const center = target.rect.left + target.rect.width / 2 - width / 2;
    const fromLeft = Math.min(window.innerWidth - width - margin, Math.max(margin, center));
    const rtl = getComputedStyle(el).direction === 'rtl';
    setPos({
      top: below ? target.rect.bottom + 8 : Math.max(margin, target.rect.top - 8 - height),
      start: rtl ? window.innerWidth - fromLeft - width : fromLeft,
    });
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onClose, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={t('word.meaning')}
      className="fixed z-50 flex w-64 flex-col gap-2 rounded-card border border-card-edge bg-surface p-4 shadow-lift"
      style={
        pos
          ? { top: pos.top, insetInlineStart: pos.start }
          : { top: target.rect.bottom + 8, insetInlineStart: 0, visibility: 'hidden' }
      }
    >
      <p
        lang="ar"
        dir="rtl"
        className="font-quran text-ink"
        style={{
          fontSize: typeScale.quran.arabic.size,
          lineHeight: typeScale.quran.arabic.lineHeight,
        }}
      >
        {target.word.text}
      </p>
      {target.meaning || target.transliteration ? (
        <>
          {target.meaning && (
            <Text role="body" dir="auto">
              {target.meaning}
            </Text>
          )}
          {target.transliteration && (
            <Text role="callout" tone="lantern" dir="ltr">
              {target.transliteration}
            </Text>
          )}
        </>
      ) : (
        <Text role="callout" tone="muted">
          {t('word.none')}
        </Text>
      )}
    </div>
  );
}

export interface ActionsTarget {
  surah: number;
  ayah: number;
  title: string;
  /** The published ayah text, and the translation shown under it, for copying and sharing. */
  text: string;
  translation: string | null;
  words: Word[];
  meanings: (string | null)[] | null;
  transliteration: (string | null)[] | null;
  /** The bookmark marking this ayah, alone or as part of a passage. */
  bookmark: QuranBookmark | null;
  /** The surah's name, to name a passage. */
  surahName: string;
}

/**
 * What an ayah offers (SPEC 5.5, Phase 5b): play from here, repeat a passage, word by word, a
 * bookmark for the ayah or a passage, copy, share.
 */
export function AyahActions({
  target,
  onClose,
  onPlay,
  onRepeat,
  shareUrl,
}: {
  target: ActionsTarget | null;
  onClose: () => void;
  onPlay: (surah: number, ayah: number) => void;
  onRepeat: (surah: number, from: number, plan: PassagePlan) => void;
  shareUrl: (surah: number, ayah: number) => string;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const toast = useToast();
  const [words, setWords] = useState(false);
  const [passage, setPassage] = useState<PassageTarget | null>(null);
  const [tafsir, setTafsir] = useState<{ surah: number; ayah: number; title: string } | null>(null);
  const open = target !== null;
  // These sheets outlive the actions, which close as one opens.
  const later = (
    <>
      <PassageSheet target={passage} onClose={() => setPassage(null)} onRepeat={onRepeat} />
      <TafsirSheet target={tafsir} onClose={() => setTafsir(null)} />
    </>
  );

  if (!target) {
    return (
      <>
        <Sheet open={false} onOpenChange={onClose} title="" />
        {later}
      </>
    );
  }

  const mark = target.bookmark;
  // A passage starting at an earlier ayah is shown, and changed, as a whole.
  const partOf =
    mark && mark.ayah !== target.ayah
      ? t('range.label', {
          surah: target.surahName,
          from: format.number(mark.ayah),
          to: format.number(bookmarkEnd(mark)),
        })
      : null;
  const openPassage = (mode: PassageTarget['mode']) => {
    const from = mode === 'bookmark' && mark ? mark.ayah : target.ayah;
    setPassage({ surah: target.surah, ayah: from, mode, bookmark: mark });
    onClose();
  };

  const quote = [target.text, target.translation, `— ${target.title}`].filter(Boolean).join('\n');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(quote);
      toast(t('actions.copied'));
    } catch {
      // Clipboard blocked: nothing to do, the text stays on screen.
    }
    onClose();
  };
  const share = async () => {
    const url = shareUrl(target.surah, target.ayah);
    if (navigator.share) {
      await navigator.share({ title: target.title, text: quote, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${quote}\n${url}`).catch(() => {});
      toast(t('actions.copied'));
    }
    onClose();
  };

  return (
    <>
      <Sheet open={open && !words} onOpenChange={(o) => !o && onClose()} title={target.title}>
        <div className="flex flex-col gap-6 pb-4">
          <ListGroup>
            <ListRow
              icon={Play}
              title={t('actions.play')}
              onPress={() => {
                onPlay(target.surah, target.ayah);
                onClose();
              }}
            />
            <ListRow
              icon={Repeat}
              title={t('range.repeat')}
              onPress={() => openPassage('repeat')}
            />
            <ListRow
              icon={BookOpenText}
              title={t('actions.tafsir')}
              onPress={() => {
                setTafsir({ surah: target.surah, ayah: target.ayah, title: target.title });
                onClose();
              }}
            />
            <ListRow icon={Translate} title={t('actions.words')} onPress={() => setWords(true)} />
            <ListRow icon={Copy} title={t('actions.copy')} onPress={copy} />
            <ListRow icon={ShareNetwork} title={t('actions.share')} onPress={share} />
          </ListGroup>
          <section className="flex flex-col gap-3">
            <Text as="h3" role="callout" tone="muted">
              {t('bookmarks.colors.label')}
            </Text>
            {partOf && (
              <Text role="callout" tone="muted">
                {t('bookmarks.inRange', { range: partOf })}
              </Text>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {bookmarkColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={mark?.color === c}
                  aria-label={`${t('actions.bookmark')}: ${t(`bookmarks.colors.${c}`)}`}
                  onClick={() => {
                    void setBookmark(mark?.surah ?? target.surah, mark?.ayah ?? target.ayah, c);
                    onClose();
                  }}
                  className={cn(
                    'flex size-touch items-center justify-center rounded-full',
                    mark?.color === c && 'ring-2 ring-focus ring-offset-2 ring-offset-surface',
                  )}
                >
                  <span className={cn('size-6 rounded-full', markClass[c])} />
                </button>
              ))}
              {mark && (
                <IconButton
                  icon={X}
                  label={t('actions.unbookmark')}
                  onClick={() => {
                    void setBookmark(mark.surah, mark.ayah, null);
                    onClose();
                  }}
                />
              )}
            </div>
            <ListGroup>
              <ListRow
                icon={BookmarkSimple}
                title={t('range.bookmark')}
                onPress={() => openPassage('bookmark')}
              />
            </ListGroup>
          </section>
        </div>
      </Sheet>
      <Sheet
        open={open && words}
        onOpenChange={(o) => {
          if (!o) {
            setWords(false);
            onClose();
          }
        }}
        title={`${t('actions.words')} · ${target.title}`}
      >
        <ol className="flex flex-col pb-4">
          {target.words.slice(0, -1).map((w, i) => (
            <li key={i} className="flex items-center gap-4 border-b border-hairline py-3">
              <span
                lang="ar"
                dir="rtl"
                className="min-w-24 font-quran text-ink"
                style={{
                  fontSize: typeScale.quran.arabic.size,
                  lineHeight: typeScale.quran.arabic.lineHeight,
                }}
              >
                {w.text}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <Text as="span" role="body" dir="auto">
                  {target.meanings?.[i] ?? t('word.none')}
                </Text>
                {target.transliteration?.[i] && (
                  <Text as="span" role="caption" tone="lantern" dir="ltr">
                    {target.transliteration[i]}
                  </Text>
                )}
              </span>
            </li>
          ))}
        </ol>
      </Sheet>
      {later}
    </>
  );
}

/** A translation footnote, in a short sheet. */
export function FootnoteSheet({
  note,
  onClose,
}: {
  note: { mark: string; text: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations('quran.reader');
  return (
    <Sheet
      open={note !== null}
      onOpenChange={(o) => !o && onClose()}
      title={note ? t('footnote', { mark: note.mark }) : ''}
    >
      <Text role="body" className="whitespace-pre-line pb-4">
        {note?.text}
      </Text>
    </Sheet>
  );
}
