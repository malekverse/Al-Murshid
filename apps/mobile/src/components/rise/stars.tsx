import { STAR_FIELD, STAR_ROUNDS, starSequence, tapStar } from '@murshid/core';
import { duration } from '@murshid/tokens';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useFormatter, useTranslations } from 'use-intl';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { useColors } from '@/lib/theme';

/** How long a star stays lit while the order plays, and the pause between two. */
const LIT_MS = duration.gentle + duration.quick;
const GAP_MS = duration.standard;

// The eight-pointed star of the lattice (SPEC 6.3), as one polygon.
const STAR = Array.from({ length: 16 }, (_, k) => {
  const r = k % 2 === 0 ? 22 : 10;
  const a = (Math.PI / 8) * k - Math.PI / 2;
  return `${(24 + r * Math.cos(a)).toFixed(2)},${(24 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

/**
 * Stars light in an order; the person taps them in the same order: four, then five. A slip
 * plays the same order again, with no penalty.
 */
export function Stars({ onDone, onActivity }: { onDone: () => void; onActivity: () => void }) {
  const t = useTranslations('rise.stars');
  const format = useFormatter();
  const color = useColors();
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState(() => starSequence(STAR_ROUNDS[0]));
  const [phase, setPhase] = useState<'watch' | 'repeat'>('watch');
  const [lit, setLit] = useState<number | null>(null);
  const [found, setFound] = useState(0);
  const [slipped, setSlipped] = useState(false);

  // Play the order, then hand over.
  useEffect(() => {
    if (phase !== 'watch') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const start = duration.gentle;
    sequence.forEach((star, i) => {
      const at = start + i * (LIT_MS + GAP_MS);
      timers.push(setTimeout(() => setLit(star), at));
      timers.push(setTimeout(() => setLit(null), at + LIT_MS));
    });
    timers.push(
      setTimeout(
        () => {
          setPhase('repeat');
          AccessibilityInfo.announceForAccessibility(t('repeat'));
        },
        start + sequence.length * (LIT_MS + GAP_MS),
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, sequence, t]);

  const tap = (star: number) => {
    if (phase !== 'repeat') return;
    onActivity();
    setLit(star);
    setTimeout(() => setLit((current) => (current === star ? null : current)), duration.standard);
    const next = tapStar(sequence, found, star);
    if (next.result === 'slip') {
      haptics.medium();
      setFound(0);
      setSlipped(true);
      setPhase('watch');
      return;
    }
    setFound(next.found);
    setSlipped(false);
    if (next.result === 'next') return haptics.selection();
    haptics.success();
    if (round + 1 < STAR_ROUNDS.length) {
      setRound(round + 1);
      setSequence(starSequence(STAR_ROUNDS[round + 1]!));
      setFound(0);
      setPhase('watch');
    } else {
      onDone();
    }
  };

  const prompt = phase === 'watch' ? (slipped ? t('slip') : t('watch')) : t('repeat');

  return (
    <View className="flex-1 justify-center gap-6">
      <View className="gap-1">
        <Text role="headline" className="text-center" accessibilityLiveRegion="polite">
          {prompt}
        </Text>
        <Text role="callout" tone="muted" className="text-center">
          {t('round', {
            done: format.number(round + 1),
            total: format.number(STAR_ROUNDS.length),
          })}
        </Text>
      </View>
      <View className="gap-3 self-center">
        {[0, 1, 2].map((row) => (
          <View key={row} className="flex-row gap-3">
            {[0, 1, 2].map((col) => {
              const star = row * 3 + col;
              const on = lit === star;
              return (
                <PressableScale
                  key={star}
                  onPress={() => tap(star)}
                  disabled={phase !== 'repeat' || star >= STAR_FIELD}
                  accessibilityRole="button"
                  accessibilityLabel={t('star', { number: format.number(star + 1) })}
                  accessibilityState={{ selected: on }}
                  className={`size-20 items-center justify-center rounded-card border ${
                    on ? 'border-lantern bg-lantern/20' : 'border-hairline bg-surface/60'
                  }`}
                >
                  <Svg width={48} height={48} viewBox="0 0 48 48">
                    <Polygon
                      points={STAR}
                      fill={on ? color.lantern : color.inkMuted}
                      opacity={on ? 1 : 0.35}
                    />
                  </Svg>
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
