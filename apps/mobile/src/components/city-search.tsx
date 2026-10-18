import { cityName, loadCities, type City, type CityIndex } from '@murshid/content/cities';
import { isolate } from '@murshid/i18n';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { countryName } from '@/lib/format';
import { useAppLocale } from '@/lib/locale';
import { useColors } from '@/lib/theme';
import { Skeleton } from './ui/skeleton';
import { Text } from './ui/text';

/** Search the offline city list in any of the three languages (SPEC 3: manual city works fully). */
export function CitySearch({ onPick }: { onPick: (city: City) => void }) {
  const t = useTranslations('onboarding.location');
  const { locale } = useAppLocale();
  const color = useColors();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<CityIndex | null>(null);

  useEffect(() => {
    let live = true;
    void loadCities().then((loaded) => {
      if (live) setIndex(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  const typed = query.trim().length > 0;
  const results = index && typed ? index.search(query, 8) : [];
  const names = results.map((c) => cityName(c, locale));

  return (
    <View className="gap-3">
      <View className="min-h-touch flex-row items-center gap-3 rounded-control border border-hairline bg-surface px-4">
        <MagnifyingGlass size={20} color={color.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search')}
          placeholderTextColor={color.inkMuted}
          accessibilityLabel={t('searchLabel')}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          className={`flex-1 py-3 text-ink ${locale === 'ar' ? 'font-ui text-ar-body' : 'font-ui text-body'}`}
        />
      </View>
      {typed && !index && (
        <View className="gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </View>
      )}
      {typed && index && results.length === 0 && (
        <Text role="callout" tone="muted" accessibilityLiveRegion="polite">
          {t('noResults')}
        </Text>
      )}
      {results.length > 0 && (
        <View className="overflow-hidden rounded-card border border-card-edge bg-surface">
          {results.map((city, i) => {
            const twin = names.some((n, j) => j !== i && n === names[i]);
            // The region is in English: isolate it so it never flips the line's direction.
            const where = [twin ? isolate(city.region) : '', countryName(city.countryCode, locale)]
              .filter(Boolean)
              .join(locale === 'ar' ? '، ' : ', ');
            return (
              <Pressable
                key={city.id}
                onPress={() => onPick(city)}
                accessibilityRole="button"
                className="min-h-touch border-b border-hairline px-4 py-3"
                style={({ pressed }) => (pressed ? { backgroundColor: color.hairline } : undefined)}
              >
                <Text role="body">{names[i]!}</Text>
                <Text role="caption" tone="muted">
                  {where}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
