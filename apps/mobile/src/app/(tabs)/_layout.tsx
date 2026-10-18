import { fonts } from '@murshid/tokens';
import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslations } from 'use-intl';
import { useSettings } from '@/lib/settings';
import { useColors } from '@/lib/theme';

// Phosphor icons (regular, and fill when selected) rendered to images, so Android shows the
// same icons as the web; iOS uses the closest SF Symbols.
const icons = {
  today: {
    default: require('../../../assets/tabs/today.png'),
    selected: require('../../../assets/tabs/today-selected.png'),
  },
  quran: {
    default: require('../../../assets/tabs/quran.png'),
    selected: require('../../../assets/tabs/quran-selected.png'),
  },
  remember: {
    default: require('../../../assets/tabs/remember.png'),
    selected: require('../../../assets/tabs/remember-selected.png'),
  },
  you: {
    default: require('../../../assets/tabs/you.png'),
    selected: require('../../../assets/tabs/you-selected.png'),
  },
};

/**
 * The four destinations as native tabs (SPEC 4), icon and label always visible. First opens go
 * to onboarding.
 */
export default function TabsLayout() {
  const t = useTranslations('components.tabs');
  const settings = useSettings();
  const color = useColors();
  if (!settings.onboarded) return <Redirect href="/welcome" />;

  return (
    <NativeTabs
      backgroundColor={color.surface}
      tintColor={color.lanternInk}
      iconColor={color.inkMuted}
      indicatorColor={color.canvas}
      labelVisibilityMode="labeled"
      labelStyle={{ color: color.inkMuted, fontFamily: fonts.native.ui[500] }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="sun.horizon" src={icons.today} />
        <NativeTabs.Trigger.Label>{t('today')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quran">
        <NativeTabs.Trigger.Icon sf="book" src={icons.quran} />
        <NativeTabs.Trigger.Label>{t('quran')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="remember">
        <NativeTabs.Trigger.Icon sf="hands.and.sparkles" src={icons.remember} />
        <NativeTabs.Trigger.Label>{t('remember')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Icon sf="person.crop.circle" src={icons.you} />
        <NativeTabs.Trigger.Label>{t('you')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
