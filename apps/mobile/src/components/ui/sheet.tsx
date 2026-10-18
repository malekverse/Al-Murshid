import { duration, motion as tokens, radius, spring } from '@murshid/tokens';
import { X } from 'phosphor-react-native/src/icons/X';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslations } from 'use-intl';
import { useAppLocale } from '@/lib/locale';
import { IconButton } from './icon-button';
import { Text } from './text';

// 0 = closed, 1 = open. The screen behind reads it to settle back (SPEC 6.4).
const SheetProgress = createContext<SharedValue<number> | null>(null);

/** Wraps the app: scales and rounds the screen behind an open sheet. */
export function SheetHost({ children }: { children: ReactNode }) {
  const progress = useSharedValue(0);
  const reduce = useReducedMotion();
  const style = useAnimatedStyle(() => ({
    flex: 1,
    overflow: 'hidden',
    borderRadius: progress.get() * radius.sheet,
    transform: [
      { scale: reduce ? 1 : interpolate(progress.get(), [0, 1], [1, tokens.sheetBackdropScale]) },
    ],
  }));
  return (
    <SheetProgress value={progress}>
      <Animated.View style={style}>{children}</Animated.View>
    </SheetProgress>
  );
}

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

/**
 * A sheet for short tasks (SPEC 4): springs up, the screen behind dims and settles to 96%, and
 * it closes by dragging down, tapping the backdrop, the back button or the visible close button.
 */
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const t = useTranslations('components');
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const host = use(SheetProgress);
  const { direction } = useAppLocale();
  const [mounted, setMounted] = useState(open);
  const height = Dimensions.get('window').height;
  const y = useSharedValue(height);
  const backdrop = useSharedValue(0);

  // Mount as soon as it opens (derived during render); unmount after the closing animation.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      y.set(reduce ? 0 : withSpring(0, spring.gentle));
      backdrop.set(withTiming(1, { duration: duration.standard }));
      if (host) host.set(withSpring(1, spring.gentle));
    } else if (mounted) {
      const done = () => setMounted(false);
      y.set(
        withTiming(reduce ? 0 : height, { duration: duration.standard }, (finished) => {
          if (finished) scheduleOnRN(done);
        }),
      );
      backdrop.set(withTiming(0, { duration: duration.standard }));
      if (host) host.set(withSpring(0, spring.gentle));
    }
  }, [open, mounted, reduce, height, y, backdrop, host]);

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      y.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY)
        scheduleOnRN(onClose);
      else y.set(withSpring(0, spring.gentle));
    });

  const panel = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }],
    opacity: reduce ? backdrop.get() : 1,
  }));
  const dim = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;
  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* A modal is its own native window: give it the app's current direction (SPEC 7). */}
      <GestureHandlerRootView style={{ flex: 1, direction }}>
        <Animated.View style={[{ position: 'absolute', inset: 0 }, dim]} className="bg-ink/30">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            style={{ flex: 1 }}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              position: 'absolute',
              start: 0,
              end: 0,
              bottom: 0,
              maxHeight: '85%',
              paddingBottom: insets.bottom,
            },
            panel,
          ]}
          className="rounded-t-sheet border border-card-edge bg-surface shadow-lift"
        >
          <GestureDetector gesture={drag}>
            <View>
              <View className="items-center pt-3" accessibilityHint={t('sheet.handle')}>
                <View className="h-1 w-10 rounded-full bg-ink/20" />
              </View>
              <View className="flex-row items-start gap-4 px-6 pt-2">
                <View className="flex-1 gap-1 pt-2">
                  <Text role="title2" accessibilityRole="header">
                    {title}
                  </Text>
                  {description && (
                    <Text role="body" tone="muted">
                      {description}
                    </Text>
                  )}
                </View>
                <IconButton icon={X} label={t('close')} onPress={onClose} />
              </View>
            </View>
          </GestureDetector>
          <View className="px-6 pt-4 pb-8">{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
