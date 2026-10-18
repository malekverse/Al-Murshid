import { createContext } from 'react';

/**
 * The tone of the glass a piece of text sits on (SPEC 6.3: glass follows the sky, not the app
 * theme). GlassCard provides it; Text reads it, so everything inside glass stays legible.
 */
export const GlassTone = createContext<'light' | 'dark' | null>(null);
