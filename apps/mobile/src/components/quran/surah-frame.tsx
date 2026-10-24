import { colors, surahFrameGlyph as frame } from '@murshid/tokens';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Line, Path, Polygon } from 'react-native-svg';
import { useReaderTheme } from './common';

// A surah's opening frame (Phase 7c, SPEC 6.7): the calligraphic name in a cartouche of two rules
// ending in pointed caps, a lattice star in each, in lantern light, as on the web. Symmetric, so it
// is laid out left to right in every language, the caps opening toward the rules. One drawing at
// the measured width, so the rules meet the caps to the pixel. Its colors follow the reader's page.

function Cap({ ink, star }: { ink: string; star: string }) {
  return (
    <>
      <Path d={frame.cap.outer} stroke={ink} strokeWidth={frame.rules[0].stroke} />
      <Path
        d={frame.cap.inner}
        stroke={ink}
        strokeOpacity={0.5}
        strokeWidth={frame.rules[1].stroke}
      />
      <Polygon points={frame.cap.star} fill={star} />
    </>
  );
}

export function SurahFrame({ children }: { children: ReactNode }) {
  const palette = colors[useReaderTheme()];
  const [width, setWidth] = useState(0);
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className="w-full items-center justify-center"
      style={{ direction: 'ltr', height: frame.height }}
    >
      {width > 0 && (
        <Svg
          width={width}
          height={frame.height}
          style={StyleSheet.absoluteFill}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <G fill="none">
            <Cap ink={palette.lanternInk} star={palette.lantern} />
            <G transform={`matrix(-1 0 0 1 ${width} 0)`}>
              <Cap ink={palette.lanternInk} star={palette.lantern} />
            </G>
            {frame.rules.map(({ y, x, stroke, faint }) => (
              <Line
                key={y}
                x1={x}
                x2={width - x}
                y1={y}
                y2={y}
                stroke={palette.lanternInk}
                strokeOpacity={faint ? 0.5 : 1}
                strokeWidth={stroke}
              />
            ))}
          </G>
        </Svg>
      )}
      {children}
    </View>
  );
}
