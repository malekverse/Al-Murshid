import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import { useUniwind } from 'uniwind';
import { StarLattice } from './star-lattice';
import { Text } from './text';

// Exported by design/scripts/export_illustrations.py (keyed to the canvas, soft edges).
const pictures = {
  'your-sky': {
    day: require('../../../assets/illustrations/empty-your-sky-day.webp'),
    night: require('../../../assets/illustrations/empty-your-sky-night.webp'),
  },
  bookmarks: {
    day: require('../../../assets/illustrations/empty-bookmarks-day.webp'),
    night: require('../../../assets/illustrations/empty-bookmarks-night.webp'),
  },
  notes: {
    day: require('../../../assets/illustrations/empty-notes-day.webp'),
    night: require('../../../assets/illustrations/empty-notes-night.webp'),
  },
  search: {
    day: require('../../../assets/illustrations/empty-search-day.webp'),
    night: require('../../../assets/illustrations/empty-search-night.webp'),
  },
  offline: {
    day: require('../../../assets/illustrations/empty-offline-day.webp'),
    night: require('../../../assets/illustrations/empty-offline-night.webp'),
  },
  error: {
    day: require('../../../assets/illustrations/empty-error-day.webp'),
    night: require('../../../assets/illustrations/empty-error-night.webp'),
  },
} as const;

export type Illustration = keyof typeof pictures;

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
  const { theme } = useUniwind();
  return (
    <View className="items-center gap-6 px-6 py-12">
      <View style={{ width: SIZE, height: SIZE }}>
        <StarLattice size={SIZE} />
        <Image
          source={pictures[illustration][theme === 'dark' ? 'night' : 'day']}
          style={{ width: SIZE, height: SIZE }}
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text role="headline" className="max-w-xs text-center">
        {title}
      </Text>
      {action}
    </View>
  );
}
