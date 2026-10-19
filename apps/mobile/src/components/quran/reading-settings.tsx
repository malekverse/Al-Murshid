import { surah as surahInfo } from '@murshid/content/quran';
import {
  readingThemes,
  reciterIds,
  translationIds,
  type QuranPrefs,
  type TranslationId,
} from '@murshid/data';
import { quranSizeRange, space, typeScale } from '@murshid/tokens';
import { CloudArrowDown } from 'phosphor-react-native/src/icons/CloudArrowDown';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { Pressable, ScrollView, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { IconButton } from '@/components/ui/icon-button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { useAppLocale } from '@/lib/locale';
import { downloadSurah, removeDownload, useDownload, useDownloads } from '@/lib/quran-files';
import { updateSettings } from '@/lib/settings';
import { useSurahName } from './common';

const speeds = ['0.75', '1', '1.25', '1.5'] as const;
const repeats = ['1', '2', '3', '5', '10'] as const;

export function setQuranPrefs(change: Partial<QuranPrefs>) {
  updateSettings((s) => ({ ...s, quran: { ...s.quran, ...change } }));
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
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
      <Text role="body" tone={selected ? 'lantern' : 'default'} className="flex-1">
        {label}
      </Text>
    </Pressable>
  );
}

/** Download the surah being read, and the list of downloads (SPEC 5.5: offline listening). */
function Downloads({ surah, reciter }: { surah: number | null; reciter: QuranPrefs['reciter'] }) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const name = useSurahName();
  const current = useDownload(reciter, surah ?? 1);
  const all = useDownloads();
  const size = (bytes: number) =>
    format.number(bytes / 1_048_576, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 });

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
      {all.length === 0 ? (
        <Text role="caption" tone="muted">
          {t('audio.downloadsEmpty')}
        </Text>
      ) : (
        all.map((d) => (
          <View key={`${d.reciter}/${d.surah}`} className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text role="body">{name(surahInfo(d.surah))}</Text>
              <Text role="caption" tone="muted">
                {`${t(`reciters.${d.reciter}`)} · ${t('audio.size', { size: size(d.bytes) })}`}
              </Text>
            </View>
            <IconButton
              icon={Trash}
              label={t('audio.removeDownload')}
              onPress={() => removeDownload(d.reciter, d.surah)}
            />
          </View>
        ))
      )}
    </View>
  );
}

export function ReadingSettings({
  open,
  onClose,
  prefs,
  surah,
}: {
  open: boolean;
  onClose: () => void;
  prefs: QuranPrefs;
  /** The surah being read, offered for download. */
  surah: number | null;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const { locale } = useAppLocale();
  const size = prefs.arabicSize ?? typeScale.quran.arabic.size;
  const translation = prefs.translations[locale];

  return (
    <Sheet open={open} onClose={onClose} title={t('settings.title')}>
      <ScrollView style={{ maxHeight: space[16] * 9 }} contentContainerStyle={{ gap: space[8] }}>
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

        <View
          className="gap-2"
          accessibilityRole="radiogroup"
          accessibilityLabel={t('reciters.label')}
        >
          <Text role="callout" tone="muted">
            {t('reciters.label')}
          </Text>
          {reciterIds.map((id) => (
            <Choice
              key={id}
              label={t(`reciters.${id}`)}
              selected={prefs.reciter === id}
              onPress={() => setQuranPrefs({ reciter: id })}
            />
          ))}
        </View>

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

        <Downloads surah={surah} reciter={prefs.reciter} />
      </ScrollView>
    </Sheet>
  );
}
