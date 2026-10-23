import { placeOf } from '@murshid/data';
import { router } from 'expo-router';
import { Alarm } from 'phosphor-react-native/src/icons/Alarm';
import { useTranslations } from 'use-intl';
import { ListRow } from '@/components/ui/list-row';
import { useTimeFormat } from '@/lib/format';
import { nextAlarm, riseSettings } from '@/lib/rise';
import { useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';

/** Fajr Rise's way in from Reminders and from Fajr's reminder sheet (SPEC 5.10). */
export function RiseRow({ onOpen }: { onOpen?: () => void }) {
  const t = useTranslations('rise');
  const rise = riseSettings.useValue();
  const settings = useSettings();
  const time = useTimeFormat(placeOf(settings)?.timeZone ?? 'UTC');
  const now = useNow(60_000);
  const next = rise.enabled ? nextAlarm(now) : null;
  return (
    <ListRow
      icon={Alarm}
      title={t('title')}
      subtitle={t('intro')}
      value={next ? t('entry.on', { time: time(next.at) }) : t('entry.off')}
      onPress={() => {
        onOpen?.();
        router.push('/fajr-rise');
      }}
    />
  );
}
