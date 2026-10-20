import type { ReactNode } from 'react';
import { AppProviders } from '@/components/app-providers';

export default function DevLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
