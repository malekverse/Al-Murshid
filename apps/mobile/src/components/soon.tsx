import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { EmptyState, type Illustration } from './ui/empty-state';

/** A destination whose phase has not arrived yet: one warm sentence, nothing broken. */
export function Soon({
  what,
  illustration,
}: {
  what: 'quran' | 'remember';
  illustration: Illustration;
}) {
  const t = useTranslations('common.soon');
  return (
    <View className="flex-1 justify-center bg-canvas px-4">
      <EmptyState illustration={illustration} title={t(what)} />
    </View>
  );
}
