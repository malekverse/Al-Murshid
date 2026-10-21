import { space } from '@murshid/tokens';
import { useFocusEffect } from 'expo-router';
import { LockSimple } from 'phosphor-react-native/src/icons/LockSimple';
import { useCallback } from 'react';
import { AppState, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { unlockYou } from '@/lib/app-lock';
import { useColors } from '@/lib/theme';

/** You behind the app lock (SPEC 5.7): it asks once when the tab opens, then waits for a tap. */
export function LockedYou() {
  const t = useTranslations('reflection.lock');
  const insets = useSafeAreaInsets();
  const color = useColors();

  // Ask when You opens; when it locked in the background, ask once the app is back.
  useFocusEffect(
    useCallback(() => {
      const ask = () => void unlockYou(t('prompt'));
      if (AppState.currentState === 'active') {
        ask();
        return;
      }
      const subscription = AppState.addEventListener('change', (status) => {
        if (status !== 'active') return;
        subscription.remove();
        ask();
      });
      return () => subscription.remove();
    }, [t]),
  );

  return (
    <View
      className="flex-1 items-center justify-center gap-6 bg-canvas px-8"
      style={{ paddingTop: insets.top + space[6] }}
    >
      <View className="size-16 items-center justify-center rounded-full bg-surface">
        <LockSimple size={28} color={color.lanternInk} />
      </View>
      <View className="items-center gap-2">
        <Text role="title2" accessibilityRole="header" className="text-center">
          {t('title')}
        </Text>
        <Text role="body" tone="muted" className="text-center">
          {t('body')}
        </Text>
      </View>
      <Button onPress={() => void unlockYou(t('prompt'))}>{t('unlock')}</Button>
    </View>
  );
}
