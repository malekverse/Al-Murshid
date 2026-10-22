import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  lineLimit,
  monospacedDigit,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// The iOS widgets (SPEC 5.9): small and medium on the home screen, rectangular and inline on the
// lock screen. Each timeline entry carries everything it shows (ios-widgets.ios.ts), already in the
// person's language; SwiftUI keeps the countdown ticking between entries.

export interface PrayerWidgetRow {
  name: string;
  time: string;
  next: boolean;
}

export interface PrayerWidgetProps {
  /** Shown instead of a prayer when the app has not written the coming days. */
  empty: string | null;
  label: string;
  name: string;
  time: string;
  /** The countdown runs from the entry's start to the prayer (epoch ms). */
  from: number;
  until: number;
  /** The words around the countdown, from "in {time}". */
  before: string;
  after: string;
  rows: PrayerWidgetRow[];
  top: string;
  bottom: string;
  ink: string;
  muted: string;
  accent: string;
}

const PrayerWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const family = environment.widgetFamily ?? 'systemSmall';
  const sky = containerBackground(
    {
      type: 'linearGradient',
      colors: [props.top, props.bottom],
      startPoint: { x: 0.5, y: 0 },
      endPoint: { x: 0.5, y: 1 },
    },
    'widget',
  );

  if (props.empty) {
    return (
      <VStack modifiers={[sky]}>
        <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(props.ink)]}>
          {props.empty}
        </Text>
      </VStack>
    );
  }

  const countdown = (
    <HStack spacing={2}>
      {props.before ? <Text>{props.before}</Text> : null}
      <Text
        timerInterval={{ lower: new Date(props.from), upper: new Date(props.until) }}
        countsDown
        modifiers={[monospacedDigit()]}
      />
      {props.after ? <Text>{props.after}</Text> : null}
    </HStack>
  );

  if (family === 'accessoryInline') {
    return <Text>{`${props.name} ${props.time}`}</Text>;
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={0}>
        <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1)]}>{props.name}</Text>
        <Text modifiers={[font({ textStyle: 'caption' })]}>{props.time}</Text>
        <VStack modifiers={[font({ textStyle: 'caption' })]}>{countdown}</VStack>
      </VStack>
    );
  }

  const next = (
    <VStack alignment="leading" spacing={2}>
      <Text
        modifiers={[font({ textStyle: 'caption' }), foregroundStyle(props.muted), lineLimit(1)]}
      >
        {props.label}
      </Text>
      <Text
        modifiers={[font({ size: 26, weight: 'bold' }), foregroundStyle(props.ink), lineLimit(1)]}
      >
        {props.name}
      </Text>
      <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(props.ink)]}>
        {props.time}
      </Text>
      <VStack modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(props.accent)]}>
        {countdown}
      </VStack>
    </VStack>
  );

  if (family === 'systemMedium') {
    return (
      <HStack spacing={16} modifiers={[sky]}>
        {next}
        <VStack alignment="leading" spacing={4}>
          {props.rows.map((row) => (
            <HStack key={row.name} spacing={8}>
              <Text
                modifiers={[
                  font({ textStyle: 'footnote', weight: row.next ? 'bold' : 'regular' }),
                  foregroundStyle(row.next ? props.accent : props.ink),
                ]}
              >
                {row.name}
              </Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ textStyle: 'footnote', weight: row.next ? 'bold' : 'regular' }),
                  foregroundStyle(row.next ? props.accent : props.ink),
                  monospacedDigit(),
                ]}
              >
                {row.time}
              </Text>
            </HStack>
          ))}
        </VStack>
      </HStack>
    );
  }

  return (
    <VStack alignment="leading" modifiers={[sky]}>
      {next}
    </VStack>
  );
};

export default createWidget<PrayerWidgetProps>('PrayerWidget', PrayerWidget, {
  empty: 'Al-Murshid',
  label: '',
  name: '',
  time: '',
  from: 0,
  until: 0,
  before: '',
  after: '',
  rows: [],
  top: '#0B1020',
  bottom: '#1C2541',
  ink: '#F2EFE8',
  muted: '#A39F96',
  accent: '#E8B25A',
});
