import Image from 'next/image';
import type { ReactNode } from 'react';
import { StarLattice } from './star-lattice';
import { Text } from './text';

export type Illustration = 'your-sky' | 'bookmarks' | 'notes' | 'search' | 'offline' | 'error';

export interface EmptyStateProps {
  illustration: Illustration;
  /** One warm sentence (SPEC 6.6). */
  title: string;
  /** One way forward. */
  action?: ReactNode;
}

/** Empty, offline and error states share one calm shape: a picture, a sentence, an action. */
export function EmptyState({ illustration, title, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-12 text-center">
      <div className="relative size-48">
        {/* The motif fades out inside the picture's own square, so it never reaches the text. */}
        <StarLattice className="absolute inset-0 size-48 text-ink [mask-image:radial-gradient(closest-side,black_35%,transparent)]" />
        {/* Both versions are in the page; the theme shows one, so switching never reloads. */}
        <Image
          src={`/illustrations/empty-${illustration}-day.webp`}
          alt=""
          width={192}
          height={192}
          className="relative dark:hidden"
        />
        <Image
          src={`/illustrations/empty-${illustration}-night.webp`}
          alt=""
          width={192}
          height={192}
          className="relative hidden dark:block"
        />
      </div>
      <Text role="headline" className="max-w-xs">
        {title}
      </Text>
      {action}
    </div>
  );
}
