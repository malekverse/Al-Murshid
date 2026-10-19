import {
  ayahWords,
  divisionStart,
  JUZ_COUNT,
  loadSurahText,
  pageOf,
  searchQuran,
  surah as surahInfo,
  surahs,
  type AyahRef,
  type QuranSearchResult,
} from '@murshid/content/quran';
import { translationFor, translationLanguage } from '@murshid/data';
import { space, typeScale } from '@murshid/tokens';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { BookOpenText } from 'phosphor-react-native/src/icons/BookOpenText';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';
import { useFormatter, useTranslations } from 'use-intl';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAppLocale } from '@/lib/locale';
import { readingPosition, useBookmarks, useLoad } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { useColors } from '@/lib/theme';
import {
  markColor,
  readerHref,
  readerPlace,
  SurahCalligraphy,
  useSurahName,
  useSurahNameFont,
  type ReaderPlace,
} from './common';
import { KhatmahCard } from './khatmah';

type Tab = 'surahs' | 'juz' | 'bookmarks';
type Row =
  | { kind: 'surah'; number: number }
  | { kind: 'juz'; number: number }
  | {
      kind: 'bookmark';
      surah: number;
      ayah: number;
      /** The last ayah of a marked passage, if it is one. */
      ayahEnd: number | null;
      color: Parameters<typeof markColor>[1];
    };

function ContinueCard({ place }: { place: ReaderPlace }) {
  const t = useTranslations('quran.home');
  const format = useFormatter();
  const color = useColors();
  const name = useSurahName();
  const position = readingPosition.useValue();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push(position ? readerHref(position.surah, position.ayah, place) : readerHref(1))
      }
    >
      <Card className="flex-row items-center gap-4 p-6">
        <View className="size-12 items-center justify-center rounded-full bg-lantern/15">
          <BookOpenText size={24} color={color.lanternInk} />
        </View>
        <View className="flex-1 gap-1">
          <Text role="headline">{position ? t('continue') : t('begin')}</Text>
          {position && (
            <Text role="callout" tone="muted">
              {t('continueAt', {
                surah: name(surahInfo(position.surah)),
                ayah: format.number(position.ayah),
                page: format.number(position.page),
              })}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

/** A found ayah: its reference and its published text. */
function AyahResult({ at, place }: { at: AyahRef; place: ReaderPlace }) {
  const name = useSurahName();
  const format = useFormatter();
  const text = useLoad(() => loadSurahText(at.surah), `text/${at.surah}`);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(readerHref(at.surah, at.ayah, place))}
      className="gap-2 rounded-card px-4 py-3"
    >
      <Text role="caption" tone="lantern">
        {`${name(surahInfo(at.surah))} ${format.number(at.ayah)}`}
      </Text>
      {text.data ? (
        <Text
          numberOfLines={2}
          className="font-quran text-ink"
          style={{
            fontSize: typeScale.quran.arabic.size * 0.75,
            lineHeight: typeScale.quran.arabic.size * 0.75 * typeScale.quran.arabic.lineHeight,
            writingDirection: 'rtl',
            direction: 'rtl',
          }}
        >
          {ayahWords(text.data, at.ayah)
            .map((w) => w.text + w.after)
            .join('')}
        </Text>
      ) : (
        <Skeleton className="h-6 w-full" />
      )}
    </Pressable>
  );
}

function SearchResults({ query, place }: { query: string; place: ReaderPlace }) {
  const t = useTranslations('quran.search');
  const tSurah = useTranslations('quran.surah');
  const format = useFormatter();
  const name = useSurahName();
  const { locale } = useAppLocale();
  const settings = useSettings();
  const [result, setResult] = useState<QuranSearchResult | null>(null);
  const translation = translationFor(settings.quran, locale);
  const lang = translation ? translationLanguage[translation] : locale === 'fr' ? 'fr' : 'en';

  useEffect(() => {
    let live = true;
    const id = setTimeout(() => {
      void searchQuran(query, lang).then((r) => live && setResult(r));
    }, 200);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [query, lang]);

  if (!result) return <Skeleton className="h-24 w-full" />;
  return (
    <View className="gap-4" accessibilityLiveRegion="polite">
      {result.reference && result.surahs.length === 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push(readerHref(result.reference!.surah, result.reference!.ayah, place))
          }
          className="rounded-card bg-lantern/10 px-4 py-3"
        >
          <Text role="callout" tone="lantern">
            {t('goTo', {
              surah: name(surahInfo(result.reference.surah)),
              ayah: format.number(result.reference.ayah),
            })}
          </Text>
        </Pressable>
      )}
      {result.surahs.length > 0 && (
        <View className="gap-1">
          <Text role="callout" tone="muted" className="px-4">
            {t('surahs')}
          </Text>
          {result.surahs.map((s) => (
            <Pressable
              key={s.number}
              accessibilityRole="button"
              onPress={() => router.push(readerHref(s.number, 1, place))}
              className="min-h-touch flex-row items-center justify-between gap-4 px-4 py-2"
            >
              <Text role="body">{`${format.number(s.number)}. ${name(s)}`}</Text>
              <Text role="caption" tone="muted">
                {tSurah('ayahs', { count: s.ayahCount })}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {result.ayahs.length > 0 && (
        <View className="gap-1">
          <Text role="callout" tone="muted" className="px-4">
            {t('ayahs', { count: result.total })}
          </Text>
          {result.ayahs.map((a) => (
            <AyahResult key={`${a.surah}:${a.ayah}`} at={a} place={place} />
          ))}
          {result.total > result.ayahs.length && (
            <Text role="caption" tone="muted" className="px-4">
              {t('more', { shown: result.ayahs.length, total: result.total })}
            </Text>
          )}
        </View>
      )}
      {!result.reference && result.surahs.length === 0 && result.ayahs.length === 0 && (
        <Text role="body" tone="muted" className="px-4">
          {t('none', { query })}
        </Text>
      )}
    </View>
  );
}

/** The Quran home (SPEC 5.5): continue reading, the khatmah, surahs, juz and bookmarks, search. */
export function QuranHome() {
  const t = useTranslations('quran');
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const color = useColors();
  const { theme } = useUniwind();
  const { locale } = useAppLocale();
  const name = useSurahName();
  const settings = useSettings();
  const bookmarks = useBookmarks();
  const fontReady = useSurahNameFont();
  const [tab, setTab] = useState<Tab>('surahs');
  const [query, setQuery] = useState('');
  const place = readerPlace(settings.quran);
  const searching = query.trim().length > 0;

  const rows: Row[] = searching
    ? []
    : tab === 'surahs'
      ? surahs.map((s) => ({ kind: 'surah', number: s.number }))
      : tab === 'juz'
        ? Array.from({ length: JUZ_COUNT }, (_, i) => ({ kind: 'juz', number: i + 1 }))
        : (bookmarks ?? []).map((b) => ({
            kind: 'bookmark',
            surah: b.surah,
            ayah: b.ayah,
            ayahEnd: b.ayahEnd ?? null,
            color: b.color,
          }));

  const header = (
    <View className="gap-6 pb-4">
      <Text role="title1" accessibilityRole="header" className="px-2">
        {t('title')}
      </Text>
      <View className="flex-row items-center gap-3 rounded-control border border-hairline bg-surface px-4">
        <MagnifyingGlass size={20} color={color.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={color.inkMuted}
          accessibilityLabel={t('search.label')}
          autoCorrect={false}
          returnKeyType="search"
          className={`min-h-touch flex-1 py-3 text-ink ${locale === 'ar' ? 'font-ui text-ar-body' : 'font-ui text-body'}`}
        />
      </View>
      {searching ? (
        <SearchResults query={query} place={place} />
      ) : (
        <>
          <ContinueCard place={place} />
          <KhatmahCard />
          {/* Segmented aligns itself to the start; this wrapper, sized to it, centres it. */}
          <View className="self-center">
            <Segmented
              label={t('home.tabs.label')}
              value={tab}
              onChange={setTab}
              options={[
                { value: 'surahs', label: t('home.tabs.surahs') },
                { value: 'juz', label: t('home.tabs.juz') },
                { value: 'bookmarks', label: t('home.tabs.bookmarks') },
              ]}
            />
          </View>
          {tab === 'bookmarks' && bookmarks?.length === 0 && (
            <EmptyState illustration="bookmarks" title={t('bookmarks.empty')} />
          )}
        </>
      )}
    </View>
  );

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === 'surah') {
      const s = surahInfo(item.number);
      const origin = t(`surah.${s.revelationPlace}`);
      const ayahs = t('surah.ayahs', { count: s.ayahCount });
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('surah.row', {
            number: format.number(s.number),
            name: name(s),
            place: origin,
            ayahs,
          })}
          onPress={() => router.push(readerHref(s.number, 1, place))}
          className="min-h-touch flex-row items-center gap-4 px-3 py-3"
        >
          <View className="size-10 items-center justify-center rounded-full border border-hairline">
            <Text role="caption" tone="muted">
              {format.number(s.number)}
            </Text>
          </View>
          <View className="flex-1">
            <Text role="body" numberOfLines={1}>
              {name(s)}
            </Text>
            <Text role="caption" tone="muted">{`${origin} · ${ayahs}`}</Text>
          </View>
          {fontReady && <SurahCalligraphy number={s.number} />}
        </Pressable>
      );
    }
    if (item.kind === 'juz') {
      const start = divisionStart('juz', item.number);
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(readerHref(start.surah, start.ayah, place))}
          className="min-h-touch flex-row items-center gap-4 px-3 py-3"
        >
          <View className="size-10 items-center justify-center rounded-full border border-hairline">
            <Text role="caption" tone="muted">
              {format.number(item.number)}
            </Text>
          </View>
          <View className="flex-1">
            <Text role="body">{t('juz.name', { number: format.number(item.number) })}</Text>
            <Text role="caption" tone="muted">
              {t('juz.starts', {
                surah: name(surahInfo(start.surah)),
                ayah: format.number(start.ayah),
                page: format.number(pageOf(start.surah, start.ayah, place.edition)),
              })}
            </Text>
          </View>
        </Pressable>
      );
    }
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(readerHref(item.surah, item.ayah, place))}
        className="min-h-touch flex-row items-center gap-4 px-3 py-3"
      >
        <View
          accessibilityLabel={t(`bookmarks.colors.${item.color}`)}
          className="size-3 rounded-full"
          style={{ backgroundColor: markColor(theme === 'dark' ? 'dark' : 'light', item.color) }}
        />
        <View className="flex-1">
          <Text role="body">
            {item.ayahEnd
              ? t('range.label', {
                  surah: name(surahInfo(item.surah)),
                  from: format.number(item.ayah),
                  to: format.number(item.ayahEnd),
                })
              : `${name(surahInfo(item.surah))} ${format.number(item.ayah)}`}
          </Text>
          <Text role="caption" tone="muted">
            {t('mushaf.page', {
              page: format.number(pageOf(item.surah, item.ayah, place.edition)),
            })}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-canvas">
      <FlashList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(r) =>
          r.kind === 'bookmark' ? `b${r.surah}:${r.ayah}` : `${r.kind}${r.number}`
        }
        getItemType={(r) => r.kind}
        // Rows show the calligraphy once its font is in, and bookmark colors follow the theme.
        extraData={[fontReady, theme, locale]}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + space[4],
          paddingBottom: insets.bottom + space[16],
          paddingHorizontal: space[4],
        }}
      />
    </View>
  );
}
