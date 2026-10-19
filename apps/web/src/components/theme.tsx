'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'murshid-theme';
const CHANGE_EVENT = 'murshid-theme-change';

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong theme.
 * Keep it tiny and dependency-free.
 */
export const themeScript = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}')||'auto';var d=p==='dark'||(p==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function subscribe(onChange: () => void) {
  // Other tabs (storage) and this tab (custom event) both update the preference.
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function apply(pref: ThemePreference) {
  const dark =
    pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function useThemePreference() {
  const pref = useSyncExternalStore(subscribe, readPreference, () => 'auto' as const);

  // Keep <html data-theme> in sync, and follow the system while on Auto.
  useEffect(() => {
    apply(pref);
    if (pref !== 'auto') return;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('auto');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [pref]);

  const update = (next: ThemePreference) => {
    try {
      if (next === 'auto') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the page still switches, the choice is just not remembered.
      apply(next);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return [pref, update] as const;
}

function subscribeResolved(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

/** The theme on screen now, light or dark, as <html data-theme> says. */
export function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribeResolved,
    () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
    () => 'light',
  );
}
