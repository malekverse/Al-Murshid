import { duration } from '@murshid/tokens';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PressableScale } from './pressable-scale';
import { Text } from './text';
import { haptics } from '@/lib/haptics';

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  /** Script of the label itself (a language picker shows each name in its own script). */
  script?: 'latin' | 'arabic';
}

interface SegmentedProps<V extends string> {
  label: string;
  value: V;
  options: readonly SegmentOption<V>[];
  onChange: (value: V) => void;
}

function Segment<V extends string>({
  option,
  selected,
  onSelect,
}: {
  option: SegmentOption<V>;
  selected: boolean;
  onSelect: () => void;
}) {
  const on = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    on.set(withTiming(selected ? 1 : 0, { duration: duration.quick }));
  }, [on, selected]);
  const thumb = useAnimatedStyle(() => ({ opacity: on.get() }));

  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      className="min-h-touch min-w-touch items-center justify-center rounded-full px-4"
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, thumb]}>
        <View className="flex-1 rounded-full bg-lantern" />
      </Animated.View>
      <Text role="callout" script={option.script} tone={selected ? 'onLantern' : 'muted'}>
        {option.label}
      </Text>
    </PressableScale>
  );
}

/** A radio group drawn as a pill; the selected thumb cross-fades (SPEC 6.4, quick). */
export function Segmented<V extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<V>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row self-start rounded-full border border-hairline bg-surface p-1 shadow-card dark:border-card-edge dark:shadow-none"
    >
      {options.map((option) => (
        <Segment
          key={option.value}
          option={option}
          selected={option.value === value}
          onSelect={() => {
            if (option.value === value) return;
            haptics.selection();
            onChange(option.value);
          }}
        />
      ))}
    </View>
  );
}
