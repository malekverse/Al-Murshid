import {
  normalizeArabic,
  normalizeLatin,
  reciter as reciterInfo,
  surah as surahInfo,
} from '@murshid/content/quran';
import {
  editionIds,
  readingThemes,
  reciterIds,
  translationIds,
  type QuranPrefs,
  type TranslationId,
} from '@murshid/data';
import { quranSizeRange, space, typeScale } from '@murshid/tokens';
import { router } from 'expo-router';
import { CloudArrowDown } from 'phosphor-react-native/src/icons/CloudArrowDown';
import { DownloadSimple } from 'phosphor-react-native/src/icons/DownloadSimple';
import { HardDrives } from 'phosphor-react-native/src/icons/HardDrives';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { useAppLocale } from '@/lib/locale';
import {
  downloadReciter,
  downloadSurah,
  pauseReciter,
  resumeDownloads,
  useDownload,
  useReciterDownload,
} from '@/lib/quran-files';
import { updateSettings } from '@/lib/settings';
import { useColors } from '@/lib/theme';
import { useSurahName } from './common';

const speeds = ['0.75', '1', '1.25', '1.5'] as const;
const repeats = ['1', '2', '3', '5', '10'] as const;

export function setQuranPrefs(change: Partial<QuranPrefs>) {
  updateSettings((s) => ({ ...s, quran: { ...s.quran, ...change } }));
}

/** The three ways to read (Phase 5b): the mushaf's pages, the Arabic text, or with translation. */
export type ReaderView = 'mushaf' | 'text' | 'translation';

/** One choice in a list of radios. */
export function Choice({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  /** A line under the label. */
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-touch flex-row items-center gap-3 rounded-control px-4 ${selected ? 'bg-lantern/15' : ''}`}
    >
      <View
        className={`size-4 rounded-full border-2 ${selected ? 'border-lantern bg-lantern' : 'border-hairline'}`}
      />
      <View className="flex-1">
        <Text role="body" tone={selected ? 'lantern' : 'default'}>
          {label}
        </Text>
        {hint && (
          <Text role="caption" tone="muted">
            {hint}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = ['murattal', 'mujawwad', 'teaching'] as const;

/**
 * The reciters (Phase 5b: 18), grouped by how they recite, with a search. Those whose timestamps
 * follow ayahs rather than words say so: the highlight moves by ayah.
 */
function ReciterList({ value }: { value: QuranPrefs['reciter'] }) {
  const t = useTranslations('quran.reciters');
  const { locale } = useAppLocale();
  const color = useColors();
  const [query, setQuery] = useState('');
  const q = query.trim();
  const matches = (name: string) =>
    !q ||
    normalizeLatin(name).includes(normalizeLatin(q)) ||
    normalizeArabic(name).includes(normalizeArabic(q));
  const groups = styles
    .map((style) => ({
      style,
      ids: reciterIds.filter((id) => reciterInfo(id).style === style && matches(t(id))),
    }))
    .filter((g) => g.ids.length > 0);
  return (
    <View className="gap-2">
      <Text role="callout" tone="muted">
        {t('label')}
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('search')}
        placeholderTextColor={color.inkMuted}
        accessibilityLabel={t('search')}
        autoCorrect={false}
        className={`min-h-touch rounded-control border border-hairline bg-canvas px-4 py-3 text-ink ${locale === 'ar' ? 'font-ui text-ar-body' : 'font-ui text-body'}`}
      />
      {groups.map(({ style, ids }) => (
        <View
          key={style}
          className="gap-1"
          accessibilityRole="radiogroup"
          accessibilityLabel={t(`styles.${style}`)}
        >
          <Text role="caption" tone="muted" className="px-4 pt-2">
            {t(`styles.${style}`)}
          </Text>
          {ids.map((id) => (
            <Choice
              key={id}
              label={t(id)}
              hint={reciterInfo(id).words ? undefined : t('byAyah')}
              selected={value === id}
              onPress={() => setQuranPrefs({ reciter: id })}
            />
          ))}
        </View>
      ))}
      {groups.length === 0 && (
        <Text role="callout" tone="muted" className="px-4">
          {t('none')}
        </Text>
      )}
    </View>
  );
}

/**
 * Download the surah being read, or every surah of the reciter (Phase 5b), and the way to the
 * storage screen, which lists and removes downloads (SPEC 5.5: offline listening).
 */
function Downloads({
  surah,
  reciter,
  onClose,
}: {
  surah: number | null;
  reciter: QuranPrefs['reciter'];
  onClose: () => void;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const name = useSurahName();
  const current = useDownload(reciter, surah ?? 1);
  const whole = useReciterDownload(reciter);
  const counts = { done: format.number(whole.done), total: format.number(whole.total) };

  return (
    <View className="gap-3">
      <Text role="callout" tone="muted">
        {t('audio.downloads')}
      </Text>
      {surah !== null && current.state !== 'done' && (
        <ListGroup>
          <ListRow
            icon={CloudArrowDown}
            title={t('audio.download')}
            subtitle={`${name(surahInfo(surah))} · ${t(`reciters.${reciter}`)}`}
            value={
              current.state === 'downloading'
                ? t('audio.downloading', {
                    percent: format.number(current.progress, { style: 'percent' }),
                  })
                : current.state === 'error'
                  ? t('audio.error')
                  : undefined
            }
            disabled={current.state === 'downloading'}
            onPress={() => void downloadSurah(reciter, surah)}
          />
        </ListGroup>
      )}
      <ListGroup>
        {whole.done < whole.total && (
          <ListRow
            icon={DownloadSimple}
            title={
              whole.state === 'idle'
                ? t('audio.downloadAll')
                : whole.state === 'stalled'
                  ? t('audio.resume')
                  : t('audio.pauseDownload')
            }
            subtitle={
              whole.state === 'idle'
                ? t('audio.downloadAllHint', {
                    reciter: t(`reciters.${reciter}`),
                    total: counts.total,
                  })
                : whole.state === 'stalled'
                  ? t('audio.stalled', counts)
                  : whole.state === 'queued'
                    ? t('audio.queued', counts)
                    : whole.current
                      ? t('audio.allProgressSurah', {
                          ...counts,
                          surah: name(surahInfo(whole.current.surah)),
                          percent: format.number(whole.current.progress, { style: 'percent' }),
                        })
                      : t('audio.allProgress', counts)
            }
            onPress={() =>
              whole.state === 'idle'
                ? downloadReciter(reciter)
                : whole.state === 'stalled'
                  ? resumeDownloads()
                  : pauseReciter(reciter)
            }
          />
        )}
        <ListRow
          icon={HardDrives}
          title={t('audio.storage')}
          subtitle={t('audio.storageHint')}
          onPress={() => {
            onClose();
            router.push('/quran/storage');
          }}
        />
      </ListGroup>
    </View>
  );
}

export function ReadingSettings({
  open,
  onClose,
  prefs,
  surah,
  view,
  onView,
}: {
  open: boolean;
  onClose: () => void;
  prefs: QuranPrefs;
  /** The surah being read, offered for download. */
  surah: number | null;
  /** The view on screen, and how to switch to another (the reader moves to the same place). */
  view: ReaderView;
  onView: (view: ReaderView) => void;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const { locale } = useAppLocale();
  const size = prefs.arabicSize ?? typeScale.quran.arabic.size;
  const translation = prefs.translations[locale];
  const year = (y: number) => format.number(y, { useGrouping: false });
  const editionYear = { v1: 1405, v2: 1421, v4: 1441 } as const;

  return (
    <Sheet open={open} onClose={onClose} title={t('settings.title')}>
      <ScrollView style={{ maxHeight: space[16] * 9 }} contentContainerStyle={{ gap: space[8] }}>
        <View className="gap-2">
          <Text role="callout" tone="muted">
            {t('settings.view')}
          </Text>
          <Segmented
            label={t('settings.view')}
            value={view}
            onChange={(v) => {
              onClose();
              if (v !== view) onView(v);
            }}
            options={(['mushaf', 'text', 'translation'] as const).map((v) => ({
              value: v,
              label: t(`settings.views.${v}`),
            }))}
          />
        </View>

        <View
          className="gap-2"
          accessibilityRole="radiogroup"
          accessibilityLabel={t('settings.edition')}
        >
          <Text role="callout" tone="muted">
            {t('settings.edition')}
          </Text>
          {editionIds.map((id) => (
            <Choice
              key={id}
              label={
                id === 'indopak'
                  ? t('settings.editions.indopak', { lines: format.number(15) })
                  : t('settings.editions.madani', { year: year(editionYear[id]) })
              }
              selected={prefs.edition === id}
              // On a phone the 1441H pages always show their tajweed colors.
              onPress={() => setQuranPrefs({ edition: id, tajweed: id === 'v4' })}
            />
          ))}
          <ListGroup>
            <ListRow
              title={t('settings.tajweed')}
              subtitle={t('settings.tajweedHint', { year: year(1441) })}
              control={
                <Toggle
                  label={t('settings.tajweed')}
                  checked={prefs.edition === 'v4'}
                  onChange={(on) =>
                    setQuranPrefs(
                      on ? { edition: 'v4', tajweed: true } : { edition: 'v2', tajweed: false },
                    )
                  }
                />
              }
            />
          </ListGroup>
        </View>

        <Slider
          label={t('settings.arabicSize')}
          min={quranSizeRange.min}
          max={quranSizeRange.max}
          step={2}
          value={size}
          valueText={format.number(size)}
          onChange={(v) => setQuranPrefs({ arabicSize: v })}
        />

        <View
          className="gap-2"
          accessibilityRole="radiogroup"
          accessibilityLabel={t('settings.translation')}
        >
          <Text role="callout" tone="muted">
            {t('settings.translation')}
          </Text>
          {([null, ...translationIds] as (TranslationId | null)[]).map((id) => (
            <Choice
              key={id ?? 'none'}
              label={t(`settings.${id ?? 'none'}`)}
              selected={translation === id}
              onPress={() =>
                setQuranPrefs({ translations: { ...prefs.translations, [locale]: id } })
              }
            />
          ))}
        </View>

        <ListGroup>
          <ListRow
            title={t('settings.wordMeanings')}
            control={
              <Toggle
                label={t('settings.wordMeanings')}
                checked={prefs.wordMeanings}
                onChange={(v) => setQuranPrefs({ wordMeanings: v })}
              />
            }
          />
          <ListRow
            title={t('settings.transliteration')}
            control={
              <Toggle
                label={t('settings.transliteration')}
                checked={prefs.transliteration}
                onChange={(v) => setQuranPrefs({ transliteration: v })}
              />
            }
          />
        </ListGroup>

        <View className="gap-2">
          <Text role="callout" tone="muted">
            {t('settings.theme')}
          </Text>
          <Segmented
            label={t('settings.theme')}
            value={prefs.theme}
            onChange={(theme) => setQuranPrefs({ theme })}
            options={readingThemes.map((v) => ({ value: v, label: t(`settings.themes.${v}`) }))}
          />
        </View>

        <ReciterList value={prefs.reciter} />

        <View className="gap-2">
          <Text role="callout" tone="muted">
            {t('audio.speed')}
          </Text>
          <Segmented
            label={t('audio.speed')}
            value={String(prefs.speed) as (typeof speeds)[number]}
            onChange={(v) => setQuranPrefs({ speed: Number(v) })}
            options={speeds.map((v) => ({ value: v, label: `${format.number(Number(v))}×` }))}
          />
        </View>

        <View className="gap-2">
          <Text role="callout" tone="muted">
            {t('audio.repeat')}
          </Text>
          <Segmented
            label={t('audio.repeat')}
            value={String(prefs.repeat) as (typeof repeats)[number]}
            onChange={(v) => setQuranPrefs({ repeat: Number(v) })}
            options={repeats.map((v) => ({ value: v, label: `${format.number(Number(v))}×` }))}
          />
        </View>

        <Downloads surah={surah} reciter={prefs.reciter} onClose={onClose} />
      </ScrollView>
    </Sheet>
  );
}
