import { surah as surahInfo } from '@murshid/content/quran';
import { reciterIds, type ReciterChoice } from '@murshid/data';
import { space } from '@murshid/tokens';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { CaretDown } from 'phosphor-react-native/src/icons/CaretDown';
import { Pause } from 'phosphor-react-native/src/icons/Pause';
import { Play } from 'phosphor-react-native/src/icons/Play';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { useColors } from '@/lib/theme';
import {
  downloadReciter,
  pageFontsStored,
  pauseReciter,
  removeDownload,
  removePageFonts,
  removeReciter,
  resumeDownloads,
  useDownloadQueue,
  useDownloads,
  useReciterDownload,
  type GlyphEdition,
} from '@/lib/quran-files';
import { useSurahName } from './common';

// What the Quran keeps on the phone (Phase 5b): recitations by reciter, whole or surah by surah,
// and the mushaf page fonts by edition, each with its size and a way to remove it. Removing asks
// first: a whole reciter is hundreds of megabytes to fetch again.

const editions: GlyphEdition[] = ['v2', 'v1', 'v4'];
const editionYear = { v1: 1405, v2: 1421, v4: 1441 } as const;

function useSize() {
  const format = useFormatter();
  return (bytes: number) =>
    format.number(bytes / 1_048_576, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 });
}

function confirmRemove(
  t: ReturnType<typeof useTranslations>,
  name: string,
  size: string,
  remove: () => void,
) {
  Alert.alert(t('quran.storage.removeConfirm', { name, size }), undefined, [
    { text: t('common.actions.cancel'), style: 'cancel' },
    { text: t('quran.storage.removeAction'), style: 'destructive', onPress: remove },
  ]);
}

/** A reciter's downloads: how many surahs and how much, the whole download's state, the surahs. */
function ReciterRow({
  reciter,
  surahs,
}: {
  reciter: ReciterChoice;
  surahs: { surah: number; bytes: number }[];
}) {
  const t = useTranslations();
  const format = useFormatter();
  const size = useSize();
  const surahName = useSurahName();
  const color = useColors();
  const whole = useReciterDownload(reciter);
  const [open, setOpen] = useState(false);
  const name = t(`quran.reciters.${reciter}`);
  const counts = { done: format.number(whole.done), total: format.number(whole.total) };
  const status =
    whole.state === 'downloading'
      ? whole.current
        ? t('quran.audio.allProgressSurah', {
            ...counts,
            surah: surahName(surahInfo(whole.current.surah)),
            percent: format.number(whole.current.progress, { style: 'percent' }),
          })
        : t('quran.audio.allProgress', counts)
      : whole.state === 'queued'
        ? t('quran.audio.queued', counts)
        : whole.state === 'stalled'
          ? t('quran.audio.stalled', counts)
          : null;

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          className="min-h-touch flex-1 justify-center"
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${t('quran.storage.list')}`}
          accessibilityState={{ expanded: open }}
          disabled={surahs.length === 0}
          onPress={() => setOpen((o) => !o)}
        >
          <Text role="body">{name}</Text>
          <Text role="caption" tone="muted">
            {t('quran.storage.surahs', { count: whole.done, size: size(whole.bytes) })}
          </Text>
          {status && (
            <Text role="caption" tone="lantern" accessibilityLiveRegion="polite">
              {status}
            </Text>
          )}
        </Pressable>
        {surahs.length > 0 && (
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <CaretDown size={20} color={color.inkMuted} />
          </View>
        )}
        {whole.state === 'idle' ? (
          whole.done < whole.total && (
            <IconButton
              icon={Play}
              label={t('quran.audio.downloadAll')}
              onPress={() => downloadReciter(reciter)}
            />
          )
        ) : whole.state === 'stalled' ? (
          <IconButton icon={Play} label={t('quran.audio.resume')} onPress={resumeDownloads} />
        ) : (
          <IconButton
            icon={Pause}
            label={t('quran.audio.pauseDownload')}
            onPress={() => pauseReciter(reciter)}
          />
        )}
        {whole.done > 0 && (
          <IconButton
            icon={Trash}
            label={t('quran.storage.remove', { name })}
            onPress={() => confirmRemove(t, name, size(whole.bytes), () => removeReciter(reciter))}
          />
        )}
      </View>
      {open &&
        surahs.map((d) => (
          <View key={d.surah} className="flex-row items-center gap-3 ps-4">
            <View className="flex-1">
              <Text role="callout">{surahName(surahInfo(d.surah))}</Text>
              <Text role="caption" tone="muted">
                {size(d.bytes)}
              </Text>
            </View>
            <IconButton
              icon={Trash}
              label={t('quran.storage.remove', { name: surahName(surahInfo(d.surah)) })}
              onPress={() => removeDownload(reciter, d.surah)}
            />
          </View>
        ))}
    </View>
  );
}

export function StorageScreen() {
  const t = useTranslations();
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const size = useSize();
  const all = useDownloads();
  const queue = useDownloadQueue();
  // Reading the folders is quick; it is read again after a removal.
  const [fonts, setFonts] = useState(() => editions.map((e) => ({ e, ...pageFontsStored(e) })));
  const reciters = reciterIds
    .map((reciter) => ({
      reciter,
      surahs: all.filter((d) => d.reciter === reciter).sort((a, b) => a.surah - b.surah),
    }))
    .filter((r) => r.surahs.length > 0 || queue.includes(r.reciter));
  const total =
    all.reduce((sum, d) => sum + d.bytes, 0) + fonts.reduce((sum, f) => sum + f.bytes, 0);
  const keptFonts = fonts.filter((f) => f.count > 0);

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + space[4],
        paddingBottom: insets.bottom + space[8],
        paddingHorizontal: space[4],
        gap: space[6],
      }}
    >
      <View className="flex-row items-center gap-2">
        <IconButton
          icon={ArrowLeft}
          label={t('common.actions.back')}
          mirror
          onPress={() => router.back()}
        />
        <View className="flex-1">
          <Text role="title2" accessibilityRole="header">
            {t('quran.storage.title')}
          </Text>
          <Text role="caption" tone="muted">
            {t('quran.storage.total', { size: size(total) })}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <Text role="callout" tone="muted" accessibilityRole="header">
          {t('quran.storage.recitations')}
        </Text>
        <Card className="gap-2 p-4">
          {reciters.length === 0 ? (
            <Text role="callout" tone="muted">
              {t('quran.audio.downloadsEmpty')}
            </Text>
          ) : (
            reciters.map((r) => <ReciterRow key={r.reciter} {...r} />)
          )}
        </Card>
      </View>

      <View className="gap-3">
        <Text role="callout" tone="muted" accessibilityRole="header">
          {t('quran.storage.pages')}
        </Text>
        <Card className="gap-2 p-4">
          {keptFonts.length === 0 ? (
            <Text role="callout" tone="muted">
              {t('quran.storage.none')}
            </Text>
          ) : (
            keptFonts.map((f) => {
              const name = t('quran.settings.editions.madani', {
                year: format.number(editionYear[f.e], { useGrouping: false }),
              });
              return (
                <View key={f.e} className="min-h-touch flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text role="body">{name}</Text>
                    <Text role="caption" tone="muted">
                      {t('quran.storage.pageCount', { count: f.count, size: size(f.bytes) })}
                    </Text>
                  </View>
                  <IconButton
                    icon={Trash}
                    label={t('quran.storage.remove', { name })}
                    onPress={() =>
                      confirmRemove(t, name, size(f.bytes), () => {
                        removePageFonts(f.e);
                        setFonts(editions.map((e) => ({ e, ...pageFontsStored(e) })));
                      })
                    }
                  />
                </View>
              );
            })
          )}
          <Text role="caption" tone="muted">
            {t('quran.storage.pagesHint')}
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}
