import { colors, glassBlur } from '@murshid/tokens';
import { BlurView } from 'expo-blur';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, View, type ViewProps } from 'react-native';
import { GlassTone } from './tone';

export interface CardProps extends ViewProps {
  className?: string;
  children?: ReactNode;
}

/** Paper card for everything off Today (SPEC 6.3). Dark theme trades the shadow for an edge. */
export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <View
      className={`overflow-hidden rounded-card border border-card-edge bg-surface shadow-card dark:shadow-none ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}

function useReduceTransparency() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/**
 * Glass over the sky, Today only. Its tone follows the sky behind it (glassToneFor), not the
 * app theme. iOS blurs the sky; Android shows the same tinted glass without blur, since a
 * blur there needs a separate target view and the sky behind is already a smooth gradient.
 * Reduce Transparency turns it solid.
 */
export function GlassCard({
  tone,
  className = '',
  children,
  ...rest
}: CardProps & { tone: 'light' | 'dark' }) {
  const reduce = useReduceTransparency();
  const palette = colors[tone];
  const fill = reduce ? palette.surface : palette.surfaceGlass;

  return (
    <View
      className={`overflow-hidden rounded-card border ${className}`}
      style={{
        borderColor: palette.hairline,
        backgroundColor: Platform.OS === 'ios' ? undefined : fill,
      }}
      {...rest}
    >
      {Platform.OS === 'ios' && !reduce && (
        // expo-blur intensity runs 1-100; the web uses glassBlur px. Same perceived softness.
        <BlurView
          intensity={glassBlur * 2}
          tint={tone}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}
      {Platform.OS === 'ios' && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0, backgroundColor: fill }}
        />
      )}
      <GlassTone value={tone}>{children}</GlassTone>
    </View>
  );
}
