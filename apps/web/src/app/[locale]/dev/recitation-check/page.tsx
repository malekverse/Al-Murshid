import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Harness } from './harness';

// The recitation check's measuring bench (Phase 5b): a developer page, never shipped.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RecitationCheckPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Harness />;
}
