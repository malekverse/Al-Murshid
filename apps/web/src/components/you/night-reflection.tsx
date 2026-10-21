'use client';

import { civilDate, prayerTimes, reflectionNight, isoDate, type CivilDate } from '@murshid/core';
import {
  emptyReflection,
  placeOf,
  prayerSettings,
  REFLECTION_MAX,
  reflectionFields,
  type Reflection,
  type ReflectionText,
  type Settings,
} from '@murshid/data';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/cn';
import {
  deleteReflection,
  saveReflection,
  useReflections,
  type ReflectionEntry,
} from '@/lib/reflections';
import { updateSettings } from '@/lib/settings';

// Night reflection (SPEC 5.7): one gratitude, one intention for tomorrow and a free note, kept in
// this browser only and encrypted. Earlier nights can be read again or deleted; nothing is counted.

/** The evening a reflection written now belongs to, at the person's place. */
function nightNow(settings: Settings, now: Date): CivilDate {
  const place = placeOf(settings);
  const today = civilDate(now, place?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  return place
    ? reflectionNight(now, today, prayerTimes(place, today, prayerSettings(settings)))
    : today;
}

function useNightLabel() {
  const format = useFormatter();
  return (date: string) => {
    const [y, m, d] = date.split('-').map(Number) as [number, number, number];
    return format.dateTime(new Date(Date.UTC(y, m - 1, d, 12)), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });
  };
}

export function NightReflection({ settings, now }: { settings: Settings; now: Date }) {
  const t = useTranslations('reflection');
  const headingId = useId();
  const promptId = useId();
  const section = useRef<HTMLElement>(null);
  const entries = useReflections();
  const night = isoDate(nightNow(settings, now));
  const [reading, setReading] = useState<ReflectionEntry | null>(null);
  const tonight = entries?.find((e) => e.date === night);
  const earlier = entries?.filter((e) => e.date !== night) ?? [];

  // Today's invitation links here: bring the section into view once it exists.
  const ready = entries !== undefined;
  useEffect(() => {
    if (!ready || window.location.hash !== '#reflection') return;
    section.current?.scrollIntoView({ block: 'start' });
    section.current?.querySelector('textarea')?.focus({ preventScroll: true });
  }, [ready]);

  return (
    <section
      ref={section}
      id="reflection"
      aria-labelledby={headingId}
      className="flex scroll-mt-8 flex-col gap-3"
    >
      <Text as="h2" role="headline" id={headingId} className="px-2">
        {t('title')}
      </Text>
      <Card className="flex flex-col gap-4 p-6">
        <Text role="callout" tone="muted">
          {t('intro')}
        </Text>
        {entries === undefined ? (
          <Skeleton aria-hidden className="h-72 w-full rounded-control" />
        ) : (
          <TonightForm
            key={`${night}:${tonight ? 'written' : 'blank'}`}
            night={night}
            initial={tonight?.reflection ?? emptyReflection}
          />
        )}
      </Card>

      {earlier.length > 0 && <PastNights entries={earlier} onOpen={setReading} />}

      <ListGroup>
        <ListRow
          title={t('prompt.label')}
          subtitle={t('prompt.note')}
          titleId={promptId}
          control={
            <Toggle
              checked={settings.reflectionPrompt}
              onChange={(on) => updateSettings((s) => ({ ...s, reflectionPrompt: on }))}
              labelledBy={promptId}
            />
          }
        />
      </ListGroup>

      <ReadSheet entry={reading} onClose={() => setReading(null)} />
    </section>
  );
}

function TonightForm({ night, initial }: { night: string; initial: ReflectionText }) {
  const t = useTranslations('reflection');
  const locale = useLocale();
  const toast = useToast();
  const label = useNightLabel();
  const ids = { gratitude: useId(), intention: useId(), note: useId() };
  const [text, setText] = useState<ReflectionText>(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await saveReflection(night, text);
      toast(t('saved'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Text as="h3" role="headline">
          {t('tonight')}
        </Text>
        <Text as="span" role="caption" tone="muted">
          {label(night)}
        </Text>
      </div>
      {reflectionFields.map((field) => (
        <div key={field} className="flex flex-col gap-2">
          <Text as="label" role="callout" htmlFor={ids[field]}>
            {t(`fields.${field}`)}
          </Text>
          <textarea
            id={ids[field]}
            dir="auto"
            value={text[field]}
            maxLength={REFLECTION_MAX}
            rows={field === 'note' ? 3 : 2}
            onChange={(e) => setText((current) => ({ ...current, [field]: e.target.value }))}
            className={cn(
              'field-sizing-content min-h-20 w-full resize-none rounded-control border border-hairline bg-surface px-4 py-3 text-ink',
              'focus-visible:outline-2 focus-visible:outline-lantern dark:border-card-edge',
              locale === 'ar' ? 'text-ar-body' : 'text-body',
            )}
          />
        </div>
      ))}
      <Button type="submit" loading={saving} className="self-start">
        {t('save')}
      </Button>
    </form>
  );
}

function preview(reflection: Reflection | null): string | null {
  if (!reflection) return null;
  const first = reflectionFields.map((f) => reflection[f]).find(Boolean) ?? '';
  return first.length > 80 ? `${first.slice(0, 80)}…` : first;
}

function PastNights({
  entries,
  onOpen,
}: {
  entries: ReflectionEntry[];
  onOpen: (entry: ReflectionEntry) => void;
}) {
  const t = useTranslations('reflection');
  const label = useNightLabel();
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-2">
      <Text as="h3" role="callout" tone="muted" id={headingId} className="px-2">
        {t('past')}
      </Text>
      <ListGroup>
        {entries.map((entry) => (
          <ListRow
            key={entry.date}
            title={label(entry.date)}
            subtitle={preview(entry.reflection) ?? t('unreadable')}
            onPress={() => onOpen(entry)}
          />
        ))}
      </ListGroup>
    </div>
  );
}

function ReadSheet({ entry, onClose }: { entry: ReflectionEntry | null; onClose: () => void }) {
  const t = useTranslations('reflection');
  const tc = useTranslations('common.actions');
  const label = useNightLabel();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const close = () => {
    setConfirming(false);
    onClose();
  };

  return (
    <Sheet
      open={entry !== null}
      onOpenChange={(open) => !open && close()}
      title={entry ? label(entry.date) : ''}
      description={confirming ? t('deleteBody') : undefined}
    >
      {entry && !confirming && (
        <div className="flex flex-col gap-6">
          {entry.reflection ? (
            reflectionFields
              .filter((f) => entry.reflection![f])
              .map((f) => (
                <div key={f} className="flex flex-col gap-1">
                  <Text role="callout" tone="muted">
                    {t(`fields.${f}`)}
                  </Text>
                  <Text role="body" dir="auto" className="whitespace-pre-line">
                    {entry.reflection![f]}
                  </Text>
                </div>
              ))
          ) : (
            <Text role="body" tone="muted">
              {t('unreadable')}
            </Text>
          )}
          <Button variant="danger" onClick={() => setConfirming(true)} className="self-start">
            {t('delete')}
          </Button>
        </div>
      )}
      {entry && confirming && (
        <div className="flex flex-col gap-3">
          <Text role="headline">{t('deleteTitle')}</Text>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="danger"
              onClick={() => {
                void deleteReflection(entry.date).then(() => {
                  toast(t('deleted'));
                  close();
                });
              }}
            >
              {t('delete')}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {tc('cancel')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
