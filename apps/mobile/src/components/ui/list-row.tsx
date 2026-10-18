import type { Icon } from 'phosphor-react-native';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useAppLocale } from '@/lib/locale';
import { useColors } from '@/lib/theme';
import { Text } from './text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: Icon;
  value?: string;
  /** A control at the end instead of a value (a Toggle). Rows with a control are not buttons. */
  control?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

/**
 * One settings-style row. Pressable rows highlight like native lists instead of shrinking,
 * and their chevron points in the reading direction.
 */
export function ListRow({
  title,
  subtitle,
  icon: IconComponent,
  value,
  control,
  onPress,
  disabled,
}: ListRowProps) {
  const color = useColors();
  const { direction } = useAppLocale();
  const interactive = Boolean(onPress) && !control;

  const content = (
    <>
      {IconComponent && (
        <View className="size-10 items-center justify-center rounded-control bg-canvas">
          <IconComponent size={20} color={color.ink} />
        </View>
      )}
      <View className="flex-1">
        <Text role="body">{title}</Text>
        {subtitle && (
          <Text role="caption" tone="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text role="callout" tone="muted">
          {value}
        </Text>
      )}
      {control}
      {interactive && (
        <CaretRight
          size={18}
          color={color.inkMuted}
          style={direction === 'rtl' ? { transform: [{ scaleX: -1 }] } : undefined}
        />
      )}
    </>
  );

  const rowClass = 'min-h-16 flex-row items-center gap-4 px-4 py-3';
  if (!interactive) {
    return (
      <View
        className={rowClass}
        accessible={!control}
        accessibilityLabel={control ? undefined : title}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`${rowClass} ${disabled ? 'opacity-40' : ''}`}
      style={({ pressed }) => (pressed ? { backgroundColor: color.hairline } : undefined)}
    >
      {content}
    </Pressable>
  );
}

/** Rows grouped on one paper card, separated by hairlines. */
export function ListGroup({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <View className="overflow-hidden rounded-card border border-card-edge bg-surface shadow-card dark:shadow-none">
      {items.map((child, i) => (
        <View key={i} className={i > 0 ? 'border-t border-hairline' : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}
