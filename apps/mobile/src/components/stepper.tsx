import { Minus } from 'phosphor-react-native/src/icons/Minus';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { IconButton } from './ui/icon-button';
import { Text } from './ui/text';

/** − value + for small whole numbers (minute adjustments, the Hijri offset). */
export function Stepper({
  label,
  valueText,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  canDecrease = true,
  canIncrease = true,
}: {
  label: ReactNode;
  valueText: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  canDecrease?: boolean;
  canIncrease?: boolean;
}) {
  return (
    <View className="min-h-touch flex-row items-center gap-3 px-4 py-2">
      <View className="flex-1">
        {typeof label === 'string' ? <Text role="body">{label}</Text> : label}
      </View>
      <IconButton
        icon={Minus}
        label={decreaseLabel}
        variant="tinted"
        onPress={onDecrease}
        disabled={!canDecrease}
      />
      {/* A label that already says the value (the Hijri offset) needs no number between. */}
      {valueText !== '' && (
        <Text role="callout" accessibilityLiveRegion="polite" className="min-w-16 text-center">
          {valueText}
        </Text>
      )}
      <IconButton
        icon={Plus}
        label={increaseLabel}
        variant="tinted"
        onPress={onIncrease}
        disabled={!canIncrease}
      />
    </View>
  );
}
