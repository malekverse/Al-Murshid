import { pageOf, surahNameGlyph, type MushafEdition, type Surah } from '@murshid/content/quran';
import { civilDate, type CivilDate } from '@murshid/core';
import type { BookmarkColor, ReadingTheme } from '@murshid/data';
import { colors, fonts, surahNameSize, type ThemeName } from '@murshid/tokens';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import { getCalendars } from 'expo-localization';
import { useEffect, useState, type ReactNode } from 'react';
import { Text as RNText, View } from 'react-native';
import { ScopedTheme, useUniwind } from 'uniwind';
import { useAppLocale } from '@/lib/locale';
import { useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';

/** QUL's surah name font, loaded when a Quran screen first needs it (never at launch). */
export function useSurahNameFont(): boolean {
  const [loaded, error] = useFonts({
    'SurahName-V2': require('../../../assets/fonts/surah-name-v2.ttf'),
  });
  return loaded || error !== null;
}

/** The King Fahd Complex's Nastaleeq font, for the Indopak mushaf: loaded the first time it is shown. */
export function useIndopakFont(enabled: boolean): boolean {
  const [ready, setReady] = useState(() => Font.isLoaded(fonts.native.indopak));
  useEffect(() => {
    if (!enabled || ready) return;
    let live = true;
    const done = () => live && setReady(true);
    Font.loadAsync({
      [fonts.native.indopak]: require('../../../assets/fonts/KFGQPCNastaleeq-Regular.ttf'),
    }).then(done, done);
    return () => {
      live = false;
    };
  }, [enabled, ready]);
  return ready;
}

/** A surah's calligraphic name. Decorative: the name is shown or announced beside it. */
export function SurahCalligraphy({
  number,
  size = 'list',
  color,
}: {
  number: number;
  size?: keyof typeof surahNameSize;
  /** Defaults to the reader's ink (the page color the person chose). */
  color?: string;
}) {
  const theme = useReaderTheme();
  return (
    <RNText
      accessible={false}
      importantForAccessibility="no"
      style={{
        fontFamily: fonts.native.surah,
        fontSize: surahNameSize[size],
        lineHeight: surahNameSize[size] * 1.3,
        color: color ?? colors[theme].ink,
      }}
    >
      {surahNameGlyph(number)}
    </RNText>
  );
}

/** A surah's name in the app language: Arabic in Arabic, the transliteration otherwise. */
export function useSurahName() {
  const { locale } = useAppLocale();
  return (s: Surah) => (locale === 'ar' ? s.nameArabic : s.nameSimple);
}

/** Where reading opens: the scrolling reader, or the pages of the chosen mushaf. */
export interface ReaderPlace {
  view: 'verses' | 'mushaf';
  edition: MushafEdition;
}
export const readerPlace = (
  prefs: { view: 'verses' | 'mushaf'; edition: MushafEdition } | undefined,
): ReaderPlace => ({
  view: prefs?.view ?? 'verses',
  edition: prefs?.edition ?? 'v2',
});

/** Where to read an ayah: its place in the verse view, or its page in the chosen mushaf. */
export function readerHref(surah: number, ayah = 1, place?: ReaderPlace) {
  if (place?.view === 'mushaf') {
    return `/quran/page/${pageOf(surah, ayah, place.edition)}` as const;
  }
  return ayah > 1 ? (`/quran/${surah}/${ayah}` as const) : (`/quran/${surah}` as const);
}

/** Today in the person's time zone (or the phone's before a location is set). */
export function useToday(): CivilDate {
  const now = useNow(60_000);
  const settings = useSettings();
  const zone = settings.location?.timeZone ?? getCalendars()[0]?.timeZone ?? 'UTC';
  return civilDate(now, zone);
}

/** The reader's colors: like the app, or light, sepia or dark whatever the app theme. */
export function useReaderTheme(): ThemeName {
  const { theme } = useUniwind();
  const chosen: ReadingTheme = useSettings().quran.theme;
  return chosen === 'app' ? (theme === 'dark' ? 'dark' : 'light') : chosen;
}

/** The reader's surface: a theme scope, so its color tokens follow the chosen page color. */
export function ReadingSurface({ children }: { children: ReactNode }) {
  const theme = useReaderTheme();
  return (
    <ScopedTheme theme={theme}>
      <View className="flex-1 bg-canvas" style={{ backgroundColor: colors[theme].canvas }}>
        {children}
      </View>
    </ScopedTheme>
  );
}

export const markColor = (theme: ThemeName, c: BookmarkColor) => {
  const t = colors[theme];
  return {
    lantern: t.lantern,
    sage: t.markSage,
    sky: t.markSky,
    plum: t.markPlum,
    clay: t.markClay,
  }[c];
};
