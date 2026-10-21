import { civilDate, isoDate, prayerTimes, reflectionNight, type CivilDate } from '@murshid/core';
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
import { getCalendars } from 'expo-localization';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Toggle } from '@/components/ui/toggle';
import { useAppLocale } from '@/lib/locale';
import {
  deleteReflection,
  saveReflection,
  useReflections,
  type ReflectionEntry,
} from '@/lib/reflections';
import { updateSettings } from '@/lib/settings';
import { useColors } from '@/lib/theme';

// Night reflection (SPEC 5.7): one gratitude, one intention for tomorrow and a free note, kept on
// this phone only and encrypted. Earlier nights can be read again or deleted; nothing is counted.

/** The evening a reflection written now belongs to, at the person's place. */
function nightNow(settings: Settings, now: Date): CivilDate {
  const place = placeOf(settings);
  const today = civilDate(now, place?.timeZone ?? getCalendars()[0]?.timeZone ?? 'UTC');
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
  const entries = useReflections();
  const night = isoDate(nightNow(settings, now));
  const [reading, setReading] = useState<ReflectionEntry | null>(null);
  const tonight = entries?.find((e) => e.date === night);
  const earlier = entries?.filter((e) => e.date !== night) ?? [];

  return (
    <View className="gap-3">
      <Text role="headline" accessibilityRole="header" className="px-2">
        {t('title')}
      </Text>
      <Card className="gap-4 p-6">
        <Text role="callout" tone="muted">
          {t('intro')}
        </Text>
        {entries === undefined ? (
          <Skeleton className="h-72 w-full rounded-control" />
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
          control={
            <Toggle
              checked={settings.reflectionPrompt}
              onChange={(on) => updateSettings((s) => ({ ...s, reflectionPrompt: on }))}
              label={t('prompt.label')}
            />
          }
        />
      </ListGroup>

      <ReadSheet entry={reading} onClose={() => setReading(null)} />
    </View>
  );
}

function TonightForm({ night, initial }: { night: string; initial: ReflectionText }) {
  const t = useTranslations('reflection');
  const { locale } = useAppLocale();
  const color = useColors();
  const toast = useToast();
  const label = useNightLabel();
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
    <View className="gap-4">
      <View className="flex-row flex-wrap items-baseline justify-between gap-2">
        <Text role="headline" accessibilityRole="header">
          {t('tonight')}
        </Text>
        <Text role="caption" tone="muted">
          {label(night)}
        </Text>
      </View>
      {reflectionFields.map((field) => (
        <View key={field} className="gap-2">
          <Text role="callout" importantForAccessibility="no">
            {t(`fields.${field}`)}
          </Text>
          <TextInput
            value={text[field]}
            onChangeText={(value) => setText((current) => ({ ...current, [field]: value }))}
            accessibilityLabel={t(`fields.${field}`)}
            maxLength={REFLECTION_MAX}
            multiline
            textAlignVertical="top"
            placeholderTextColor={color.inkMuted}
            className={`min-h-20 rounded-control border border-hairline bg-surface px-4 py-3 text-ink dark:border-card-edge ${locale === 'ar' ? 'font-ui text-ar-body' : 'font-ui text-body'}`}
          />
        </View>
      ))}
      <Button loading={saving} onPress={() => void save()} className="self-start">
        {t('save')}
      </Button>
    </View>
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
  return (
    <View className="gap-2">
      <Text role="callout" tone="muted" accessibilityRole="header" className="px-2">
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
    </View>
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
      onClose={close}
      title={entry ? label(entry.date) : ''}
      description={confirming ? t('deleteBody') : undefined}
    >
      {entry && !confirming && (
        <View className="gap-6">
          {entry.reflection ? (
            reflectionFields
              .filter((f) => entry.reflection![f])
              .map((f) => (
                <View key={f} className="gap-1">
                  <Text role="callout" tone="muted">
                    {t(`fields.${f}`)}
                  </Text>
                  <Text role="body">{entry.reflection![f]}</Text>
                </View>
              ))
          ) : (
            <Text role="body" tone="muted">
              {t('unreadable')}
            </Text>
          )}
          <Button variant="danger" onPress={() => setConfirming(true)} className="self-start">
            {t('delete')}
          </Button>
        </View>
      )}
      {entry && confirming && (
        <View className="gap-3">
          <Text role="headline">{t('deleteTitle')}</Text>
          <View className="flex-row flex-wrap gap-3">
            <Button
              variant="danger"
              onPress={() => {
                deleteReflection(entry.date);
                toast(t('deleted'));
                close();
              }}
            >
              {t('delete')}
            </Button>
            <Button variant="secondary" onPress={() => setConfirming(false)}>
              {tc('cancel')}
            </Button>
          </View>
        </View>
      )}
    </Sheet>
  );
}
