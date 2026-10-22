import { civilDate, isoDate } from '@murshid/core';
import { placeOf } from '@murshid/data';
import { space } from '@murshid/tokens';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { useSettings } from '@/lib/settings';
import { useTasbihTotal } from '@/lib/tasbih';
import { useNow } from '@/lib/use-now';
import { BeadRing } from './bead-ring';

// Remember (SPEC 4, 5.6) shows only what exists: Tasbih now; the adhkar collections, duas and the
// 99 Names when their reviewed texts land (docs/PHASE-7.md).

export function RememberHome() {
  const t = useTranslations('remember');
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const now = useNow(60_000);
  const timeZone = placeOf(settings)?.timeZone ?? getCalendars()[0]?.timeZone ?? 'UTC';
  const total = useTasbihTotal(isoDate(civilDate(now, timeZone)));

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + space[6],
        paddingBottom: space[12],
        paddingHorizontal: space[4],
        gap: space[8],
      }}
    >
      <View className="px-2">
        <Text role="title1" accessibilityRole="header">
          {t('title')}
        </Text>
      </View>
      <PressableScale
        accessibilityRole="button"
        onPress={() => router.push('/tasbih')}
        className="flex-row items-center gap-4 rounded-card border border-card-edge bg-surface p-6 shadow-card dark:shadow-none"
      >
        <BeadRing beads={33} lit={11} complete={false} size={64} />
        <View className="flex-1 gap-1">
          <Text role="headline">{t('tasbih.title')}</Text>
          <Text role="callout" tone="muted">
            {t('tasbih.body')}
          </Text>
          {total !== undefined && total > 0 && (
            <Text role="caption" tone="muted">
              {t('tasbih.today', { count: format.number(total) })}
            </Text>
          )}
        </View>
      </PressableScale>
      <Text role="callout" tone="muted" className="px-2">
        {t('coming')}
      </Text>
    </ScrollView>
  );
}
