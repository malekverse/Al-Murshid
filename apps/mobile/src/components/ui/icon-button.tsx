import type { Icon } from 'phosphor-react-native';
import { useAppLocale } from '@/lib/locale';
import { useColors } from '@/lib/theme';
import { PressableScale } from './pressable-scale';

type Variant = 'plain' | 'tinted';

const variants: Record<Variant, string> = {
  plain: '',
  tinted: 'border border-hairline bg-surface shadow-card dark:border-card-edge dark:shadow-none',
};

export interface IconButtonProps {
  icon: Icon;
  /** Spoken by screen readers. Required: icons alone are not labels. */
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Directional icons (back, chevrons) flip in RTL; clocks, checks and media controls never do. */
  mirror?: boolean;
  disabled?: boolean;
}

/** A 48 x 48 round button holding one icon (SPEC 6.3 touch targets). */
export function IconButton({
  icon: IconComponent,
  label,
  onPress,
  variant = 'plain',
  mirror = false,
  disabled = false,
}: IconButtonProps) {
  const color = useColors();
  const { direction } = useAppLocale();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      className={`size-touch items-center justify-center rounded-full ${variants[variant]} ${disabled ? 'opacity-40' : ''}`}
    >
      <IconComponent
        size={22}
        color={color.ink}
        style={mirror && direction === 'rtl' ? { transform: [{ scaleX: -1 }] } : undefined}
      />
    </PressableScale>
  );
}
