import { surah as surahInfo } from '@murshid/content/quran';
import { colors, space } from '@murshid/tokens';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { BookOpen } from 'phosphor-react-native/src/icons/BookOpen';
import { EyeSlash } from 'phosphor-react-native/src/icons/EyeSlash';
import { Pause } from 'phosphor-react-native/src/icons/Pause';
import { Play } from 'phosphor-react-native/src/icons/Play';
import { Rows } from 'phosphor-react-native/src/icons/Rows';
import { SkipBack } from 'phosphor-react-native/src/icons/SkipBack';
import { SkipForward } from 'phosphor-react-native/src/icons/SkipForward';
import { TextAa } from 'phosphor-react-native/src/icons/TextAa';
import { X } from 'phosphor-react-native/src/icons/X';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { useReaderTheme, useSurahName } from './common';
import { useRecitation } from './recitation';

/**
 * The reader's top bar: back, where you are, and the reading controls. The view button turns
 * between the mushaf and the scrolling reader (its layout is chosen in the reading settings).
 */
export function ReaderBar({
  title,
  subtitle,
  view,
  onToggleView,
  onSettings,
  memorizing,
  onMemorize,
  playing,
  onPlay,
}: {
  title: string;
  subtitle?: string;
  view: 'mushaf' | 'text' | 'translation';
  onToggleView: () => void;
  onSettings: () => void;
  /** Words or markers are hidden for memorizing. */
  memorizing: boolean;
  onMemorize: () => void;
  playing: boolean;
  onPlay: () => void;
}) {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center gap-1 border-b border-hairline bg-canvas px-2 pb-2"
      style={{ paddingTop: insets.top + space[2] }}
    >
      <IconButton
        icon={ArrowLeft}
        mirror
        label={t('quran.reader.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/quran'))}
      />
      <View className="flex-1">
        <Text role="headline" numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && (
          <Text role="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <IconButton
        icon={view === 'mushaf' ? Rows : BookOpen}
        label={view === 'mushaf' ? t('quran.reader.verses') : t('quran.reader.page')}
        onPress={onToggleView}
      />
      <IconButton
        icon={EyeSlash}
        label={t('quran.memorize.title')}
        selected={memorizing}
        onPress={onMemorize}
      />
      <IconButton icon={TextAa} label={t('quran.reader.settings')} onPress={onSettings} />
      <IconButton
        icon={playing ? Pause : Play}
        label={playing ? t('quran.audio.pause') : t('quran.audio.play')}
        variant="tinted"
        onPress={onPlay}
      />
    </View>
  );
}

/** The recitation in progress: play or pause, step ayah by ayah, stop. */
export function AudioBar() {
  const t = useTranslations('quran');
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const name = useSurahName();
  const theme = useReaderTheme();
  const r = useRecitation();
  if (r.surah === null) return null;
  const info = surahInfo(r.surah);
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      accessibilityLabel={t('audio.playing', {
        surah: name(info),
        reciter: t(`reciters.${r.reciter}`),
      })}
      className="absolute inset-x-0 bottom-0 px-2"
      style={{ paddingBottom: insets.bottom + space[2] }}
    >
      <View className="flex-row items-center gap-2 rounded-card border border-card-edge bg-surface p-2 shadow-lift">
        <IconButton
          icon={r.playing ? Pause : Play}
          label={r.playing ? t('audio.pause') : t('audio.play')}
          variant="tinted"
          onPress={r.playing ? r.pause : r.resume}
        />
        <Pressable
          className="flex-1 px-2"
          accessibilityRole="button"
          onPress={() =>
            router.push(
              r.ayah && r.ayah > 1 ? `/quran/${info.number}/${r.ayah}` : `/quran/${info.number}`,
            )
          }
        >
          <Text role="callout" numberOfLines={1}>
            {r.ayah ? `${name(info)} ${format.number(r.ayah)}` : name(info)}
          </Text>
          <Text role="caption" tone="muted" numberOfLines={1} accessibilityLiveRegion="polite">
            {r.error
              ? t('audio.error')
              : r.loading
                ? t('audio.loading')
                : r.turn
                  ? t('audio.yourTurn')
                  : r.passage
                    ? t('audio.range', {
                        from: format.number(r.passage.from),
                        to: format.number(r.passage.to),
                        pass: format.number(r.passage.pass),
                        times: format.number(r.passage.times),
                      })
                    : t(`reciters.${r.reciter}`)}
          </Text>
        </Pressable>
        {r.loading && <ActivityIndicator color={colors[theme].lantern} />}
        {/* Media controls are never mirrored (SPEC 7). */}
        <IconButton icon={SkipBack} label={t('audio.previous')} onPress={() => r.step(-1)} />
        <IconButton icon={SkipForward} label={t('audio.next')} onPress={() => r.step(1)} />
        <IconButton icon={X} label={t('audio.stop')} onPress={r.stop} />
      </View>
    </Animated.View>
  );
}
