import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { PaperLight } from './paper-light';
import { StarLattice } from './star-lattice';
import { Text } from './text';

export type Illustration = 'your-sky' | 'bookmarks' | 'notes' | 'search' | 'offline' | 'error';

const SIZE = 192;

/** Empty, offline and error states: a picture, one warm sentence, one way forward (SPEC 6.6). */
export function EmptyState({
  illustration,
  title,
  action,
}: {
  illustration: Illustration;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center gap-6 px-6 py-12">
      <View style={{ width: SIZE, height: SIZE }}>
        <StarLattice size={SIZE} />
        {/* Paper and light (SPEC 6.7), in the colors of the sky now; each state its own skyline. */}
        <View style={StyleSheet.absoluteFill}>
          <PaperLight seed={illustration} width={SIZE} height={SIZE} />
        </View>
      </View>
      <Text role="headline" className="max-w-xs text-center">
        {title}
      </Text>
      {action}
    </View>
  );
}
