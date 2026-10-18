import { Check } from 'phosphor-react-native/src/icons/Check';
import { Pressable, View } from 'react-native';
import { useColors } from '@/lib/theme';
import { Text } from './ui/text';

export interface Choice<V extends string> {
  value: V;
  label: string;
  hint?: string;
}

/** A short list of choices, one selected (inside a sheet: SPEC 4's short tasks). */
export function ChoiceList<V extends string>({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: readonly Choice<V>[];
  value: V;
  onChange: (value: V) => void;
}) {
  const color = useColors();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-1">
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(choice.value)}
            className={`min-h-touch flex-row items-center gap-4 rounded-control px-4 py-3 ${selected ? 'bg-lantern/10' : ''}`}
            style={({ pressed }) => (pressed ? { backgroundColor: color.hairline } : undefined)}
          >
            <View className="flex-1">
              <Text role="body" tone={selected ? 'lantern' : 'default'}>
                {choice.label}
              </Text>
              {choice.hint && (
                <Text role="caption" tone="muted">
                  {choice.hint}
                </Text>
              )}
            </View>
            {selected && <Check size={20} weight="bold" color={color.lanternInk} />}
          </Pressable>
        );
      })}
    </View>
  );
}
