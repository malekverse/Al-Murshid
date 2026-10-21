import { duration, motion as tokens } from '@murshid/tokens';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslations } from 'use-intl';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const box: Record<Variant, string> = {
  primary: 'bg-lantern shadow-card dark:shadow-none',
  secondary: 'border border-hairline bg-surface shadow-card dark:border-card-edge dark:shadow-none',
  ghost: '',
};
const tone = { primary: 'onLantern', secondary: 'default', ghost: 'lantern' } as const;
const dot = { primary: 'bg-on-lantern', secondary: 'bg-ink', ghost: 'bg-lantern-ink' } as const;
const sizes: Record<Size, string> = { md: 'min-h-touch px-6', lg: 'min-h-16 self-stretch px-8' };

export interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  /** For a choice among buttons: announced as selected (web's aria-pressed). */
  selected?: boolean;
  icon?: ReactNode;
  className?: string;
}

/** Calm, pill-shaped button. One primary action per screen (SPEC 2). */
export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  selected,
  icon,
  className = '',
}: ButtonProps) {
  const inert = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: inert, busy: loading, selected }}
      disabled={inert}
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 rounded-full ${box[variant]} ${sizes[size]} ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      <View className="flex-row items-center gap-2" style={{ opacity: loading ? 0 : 1 }}>
        {icon}
        <Text role={size === 'lg' ? 'headline' : 'callout'} tone={tone[variant]}>
          {children}
        </Text>
      </View>
      {loading && <LoadingDots className={dot[variant]} />}
    </PressableScale>
  );
}

function Dot({ index, className }: { index: number; className: string }) {
  const reduce = useReducedMotion();
  const opacity = useSharedValue(0.25);
  useEffect(() => {
    if (reduce) {
      opacity.set(0.7);
      return;
    }
    const half = duration.ambient / 2;
    opacity.set(
      withDelay(
        (index * duration.ambient) / 8,
        withRepeat(
          withSequence(withTiming(1, { duration: half }), withTiming(0.25, { duration: half })),
          -1,
        ),
      ),
    );
  }, [index, opacity, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View style={style} className={`size-2 rounded-full ${className}`} />;
}

/** Three soft dots, shown only if loading lasts long enough to notice. */
export function LoadingDots({ className }: { className: string }) {
  const t = useTranslations('components');
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), tokens.loadingDelay);
    return () => clearTimeout(id);
  }, []);
  return (
    <View
      accessibilityLabel={t('loading')}
      className="absolute inset-0 flex-row items-center justify-center gap-1"
    >
      {visible && [0, 1, 2].map((i) => <Dot key={i} index={i} className={className} />)}
    </View>
  );
}
