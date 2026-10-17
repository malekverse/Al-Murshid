import { useState } from 'react';
import { Uniwind } from 'uniwind';
import { keys, storage } from './storage';

export type ThemePreference = 'light' | 'dark' | 'auto';

function read(): ThemePreference {
  const value = storage.getString(keys.theme);
  return value === 'light' || value === 'dark' ? value : 'auto';
}

function apply(pref: ThemePreference) {
  Uniwind.setTheme(pref === 'auto' ? 'system' : pref);
}

/** Restore the saved theme before the first frame. */
export function restoreTheme() {
  apply(read());
}

export function useThemePreference() {
  const [pref, setPref] = useState<ThemePreference>(read);

  const update = (next: ThemePreference) => {
    if (next === 'auto') storage.remove(keys.theme);
    else storage.set(keys.theme, next);
    apply(next);
    setPref(next);
  };

  return [pref, update] as const;
}
