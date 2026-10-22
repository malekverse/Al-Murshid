'use client';

import { ArrowCounterClockwise, ArrowLeft, Check } from '@phosphor-icons/react';
import {
  civilDate,
  isoDate,
  isTasbihComplete,
  litBeads,
  ringBeads,
  tapTasbih,
  TASBIH_MAX,
  tasbihTargets,
} from '@murshid/core';
import { placeOf } from '@murshid/data';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { RollingNumber } from '@/components/ui/countdown';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { updateSettings, useSettings } from '@/lib/settings';
import { addTasbih, tasbihCount, useTasbihTotal } from '@/lib/tasbih';
import { useNow } from '@/lib/use-now';
import { BeadRing } from './bead-ring';

// Tasbih (SPEC 5.6): the whole screen is the tap target. A large count, an optional target, the
// screen kept awake while counting, and the day's total kept in this browser. No haptics on web.

/** Keeps the screen on while counting (Screen Wake Lock API), again after the tab returns. */
function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let live = true;
    const request = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (live) lock = next;
        else void next.release();
      } catch {
        // Refused (battery saver, a hidden tab): the screen may sleep, nothing else changes.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, []);
}

export function TasbihScreen() {
  const t = useTranslations('remember.tasbih');
  const tc = useTranslations('common.actions');
  const format = useFormatter();
  const toast = useToast();
  const settings = useSettings();
  const count = tasbihCount.useValue() ?? 0;
  const now = useNow(60_000);
  const timeZone =
    (settings && placeOf(settings)?.timeZone) ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = now ? isoDate(civilDate(now, timeZone)) : null;
  const total = useTasbihTotal(date);
  const target = settings ? settings.tasbihTarget : 33;
  const complete = isTasbihComplete(count, target);
  const [announcement, setAnnouncement] = useState('');
  const [choosing, setChoosing] = useState(false);
  useWakeLock();

  const tap = () => {
    // The stored count, not the rendered one: a fast second tap can come before the re-render.
    const next = tapTasbih(tasbihCount.read(), target);
    tasbihCount.write(next.count);
    setAnnouncement(next.reached ? t('reached') : '');
    if (date) void addTasbih(date);
  };

  const reset = () => {
    const before = count;
    tasbihCount.write(0);
    toast(t('resetDone'), { label: tc('undo'), onPress: () => tasbihCount.write(before) });
  };

  const countLabel = [
    t('count'),
    format.number(count),
    target ? t('of', { target: format.number(target) }) : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-1 flex-col px-4 pt-6 pb-6 md:pt-12"
    >
      <div className="flex items-center gap-2">
        <Link
          href="/remember"
          aria-label={tc('back')}
          title={tc('back')}
          className="flex size-touch items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <ArrowLeft size={24} aria-hidden className="rtl:-scale-x-100" />
        </Link>
        <Text as="h1" role="title2" className="min-w-0 flex-1">
          {t('title')}
        </Text>
        <Button variant="ghost" onClick={() => setChoosing(true)}>
          {target ? t('target.value', { target: format.number(target) }) : t('target.none')}
        </Button>
        <IconButton
          icon={ArrowCounterClockwise}
          label={t('reset')}
          disabled={count === 0}
          onClick={reset}
        />
      </div>

      {/* The whole area counts: a click, a tap, or Space and Enter on the keyboard. */}
      <button
        type="button"
        onClick={tap}
        aria-label={countLabel}
        className="flex flex-1 touch-manipulation select-none flex-col items-center justify-center gap-6 rounded-sheet py-8 focus-visible:outline-2 focus-visible:outline-lantern"
      >
        <span className="relative grid place-items-center">
          <BeadRing beads={ringBeads(target)} lit={litBeads(count, target)} complete={complete} />
          <span className="absolute flex flex-col items-center gap-1">
            <Text as="span" role="display" tone={complete ? 'lantern' : 'default'}>
              <RollingNumber value={format.number(count)} />
            </Text>
            {target && (
              <Text as="span" role="callout" tone="muted">
                {t('of', { target: format.number(target) })}
              </Text>
            )}
          </span>
        </span>
        <Text as="span" role="callout" tone={complete ? 'lantern' : 'muted'}>
          {complete ? t('reached') : t('hint')}
        </Text>
      </button>

      <Text role="caption" tone="muted" className="text-center">
        {total !== undefined ? t('today', { count: format.number(total) }) : ' '}
      </Text>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>

      <TargetSheet
        open={choosing}
        onOpenChange={setChoosing}
        target={target}
        onChange={(next) => {
          updateSettings((s) => ({ ...s, tasbihTarget: next }));
          setChoosing(false);
        }}
      />
    </main>
  );
}

function TargetSheet({
  open,
  onOpenChange,
  target,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: number | null;
  onChange: (target: number | null) => void;
}) {
  const t = useTranslations('remember.tasbih.target');
  const format = useFormatter();
  const locale = useLocale();
  const inputId = useId();
  const custom = target !== null && !(tasbihTargets as readonly number[]).includes(target);
  const [draft, setDraft] = useState(custom ? String(target) : '');
  const value = Number.parseInt(draft, 10);
  const valid = Number.isInteger(value) && value >= 1 && value <= TASBIH_MAX;
  const choices: { value: number | null; label: string }[] = [
    ...tasbihTargets.map((n) => ({ value: n, label: format.number(n) })),
    { value: null, label: t('none') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('label')}>
      <div className="flex flex-col gap-6">
        <ul role="radiogroup" aria-label={t('label')} className="flex flex-col">
          {choices.map((choice) => {
            const selected = !custom && choice.value === target;
            return (
              <li key={String(choice.value)}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(choice.value)}
                  className={cn(
                    'flex min-h-touch w-full items-center gap-4 rounded-control px-4 py-3 text-start hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-lantern',
                    selected && 'bg-lantern/10',
                  )}
                >
                  <Text
                    as="span"
                    role="body"
                    tone={selected ? 'lantern' : 'default'}
                    className="flex-1"
                  >
                    {choice.label}
                  </Text>
                  {selected && (
                    <Check size={20} weight="bold" aria-hidden className="text-lantern-ink" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onChange(value);
          }}
        >
          <Text as="label" role="callout" htmlFor={inputId}>
            {t('customLabel')}
          </Text>
          <div className="flex items-center gap-3">
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={1}
              max={TASBIH_MAX}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={cn(
                'min-h-touch w-full min-w-0 flex-1 rounded-control border border-hairline bg-surface px-4 text-ink',
                'focus-visible:outline-2 focus-visible:outline-lantern dark:border-card-edge',
                locale === 'ar' ? 'text-ar-body' : 'text-body',
              )}
            />
            <Button type="submit" variant="secondary" disabled={!valid}>
              {t('set')}
            </Button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
