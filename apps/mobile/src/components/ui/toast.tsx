import { space, motion as tokens, spring } from '@murshid/tokens';
import { X } from 'phosphor-react-native/src/icons/X';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { useColors } from '@/lib/theme';
import { Text } from './text';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

type ShowToast = (message: string, action?: ToastAction) => void;
const ToastContext = createContext<ShowToast>(() => {});

const enter = FadeInUp.springify()
  .stiffness(spring.gentle.stiffness)
  .damping(spring.gentle.damping);

/** One calm toast at a time, at the top, read aloud by screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('components');
  const insets = useSafeAreaInsets();
  const color = useColors();
  const [toast, setToast] = useState<{ id: number; message: string; action?: ToastAction } | null>(
    null,
  );

  const show = useCallback<ShowToast>((message, action) => {
    setToast({ id: Date.now(), message, action });
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), tokens.toastVisible);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + space[2], start: space[4], end: space[4] }}
        className="items-center"
      >
        {toast && (
          <Animated.View
            key={toast.id}
            entering={enter}
            exiting={FadeOut}
            className="min-h-touch flex-row items-center gap-2 rounded-full bg-ink ps-6 pe-2 shadow-lift"
          >
            <Text role="callout" tone="inherit" style={{ color: color.canvas }}>
              {toast.message}
            </Text>
            {toast.action && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  setToast(null);
                }}
                className="min-h-touch justify-center rounded-full bg-canvas/10 px-4"
              >
                <Text role="callout" tone="inherit" style={{ color: color.canvas }}>
                  {toast.action.label}
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('dismiss')}
              onPress={() => setToast(null)}
              className="size-touch items-center justify-center rounded-full"
            >
              <X size={18} color={color.canvas} />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ToastContext>
  );
}

export function useToast(): ShowToast {
  return use(ToastContext);
}
