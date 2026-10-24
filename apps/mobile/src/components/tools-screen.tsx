import { MAX_PINNED, pinnedTools, togglePin, type ToolId } from '@murshid/core';
import { space } from '@murshid/tokens';
import { router, type Href } from 'expo-router';
import { Alarm } from 'phosphor-react-native/src/icons/Alarm';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { Compass } from 'phosphor-react-native/src/icons/Compass';
import { HandHeart } from 'phosphor-react-native/src/icons/HandHeart';
import { PushPin } from 'phosphor-react-native/src/icons/PushPin';
import { PushPinSlash } from 'phosphor-react-native/src/icons/PushPinSlash';
import type { Icon } from 'phosphor-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { IconButton } from './ui/icon-button';
import { Text } from './ui/text';
import { useToast } from './ui/toast';
import { haptics } from '@/lib/haptics';
import { updateSettings, useSettings } from '@/lib/settings';
import { useColors } from '@/lib/theme';

// The Tools hub (SPEC 5.11): every occasional tool, each one tap away, and up to four pinned to
// Today's row.

export const mobileTools: { id: ToolId; href: Href; icon: Icon }[] = [
  { id: 'qibla', href: '/qibla', icon: Compass },
  { id: 'calendar', href: '/calendar', icon: CalendarBlank },
  { id: 'rise', href: '/fajr-rise', icon: Alarm },
  { id: 'tasbih', href: '/tasbih', icon: HandHeart },
];
export const mobileToolIds = mobileTools.map((t) => t.id);

export function ToolsScreen() {
  const t = useTranslations('today.tools');
  const tc = useTranslations('common.actions');
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const color = useColors();
  const settings = useSettings();
  const pinned = pinnedTools(settings.pinnedTools, mobileToolIds);

  const toggle = (id: ToolId) => {
    const next = togglePin(pinned, id);
    if (!next) return toast(t('full'));
    haptics.selection();
    updateSettings((s) => ({ ...s, pinnedTools: next.slice(0, MAX_PINNED) }));
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top + space[2] }}>
      <View className="flex-row items-center gap-2 px-4">
        <IconButton icon={ArrowLeft} label={tc('back')} mirror onPress={() => router.back()} />
        <Text role="title2" accessibilityRole="header" className="flex-1">
          {t('title')}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: space[4],
          paddingBottom: insets.bottom + space[12],
          gap: space[4],
        }}
      >
        <Text role="callout" tone="muted" className="px-2">
          {t('intro')}
        </Text>
        <View className="overflow-hidden rounded-card border border-card-edge bg-surface shadow-card dark:shadow-none">
          {mobileTools.map(({ id, href, icon: IconComponent }, i) => {
            const on = pinned.includes(id);
            return (
              <View
                key={id}
                className={`flex-row items-center gap-2 pe-2 ${i > 0 ? 'border-t border-hairline' : ''}`}
              >
                <Pressable
                  onPress={() => router.push(href)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t(id)}, ${t(`notes.${id}`)}`}
                  className="min-h-16 flex-1 flex-row items-center gap-4 px-4 py-3"
                  style={({ pressed }) =>
                    pressed ? { backgroundColor: color.hairline } : undefined
                  }
                >
                  <View className="size-10 items-center justify-center rounded-control bg-lantern/10">
                    <IconComponent size={22} color={color.lanternInk} />
                  </View>
                  <View className="flex-1">
                    <Text role="body">{t(id)}</Text>
                    <Text role="caption" tone="muted">
                      {t(`notes.${id}`)}
                    </Text>
                  </View>
                </Pressable>
                <IconButton
                  icon={on ? PushPin : PushPinSlash}
                  label={on ? t('unpin') : t('pin')}
                  selected={on}
                  onPress={() => toggle(id)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
