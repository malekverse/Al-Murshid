// Types for loaders.js, which scripts/build-remember.ts generates. Written by hand.
import type { RememberChapter, RememberHadith } from '../../src/remember-types';

type Load<T> = () => Promise<{ default: T }>;

export declare const chapters: Record<
  'ar' | 'en' | 'fr',
  Record<RememberChapter, Load<RememberHadith[]>>
>;
export declare const indexes: Record<
  'ar' | 'en' | 'fr',
  Load<{ slug: RememberChapter; count: number }[]>
>;
