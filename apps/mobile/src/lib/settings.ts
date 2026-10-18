import { parseSettings, type Settings } from '@murshid/data';
import { useSyncExternalStore } from 'react';
import { keys, storage } from './storage';

// Personal settings (SPEC 8.3, 9): MMKV, validated on every read through @murshid/data.

let cache: { raw: string | undefined; value: Settings } | null = null;

export function readSettings(): Settings {
  const raw = storage.getString(keys.settings);
  // useSyncExternalStore needs the same object while nothing changed.
  if (cache && cache.raw === raw) return cache.value;
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  cache = { raw, value: parseSettings(parsed) };
  return cache.value;
}

function subscribe(onChange: () => void) {
  const listener = storage.addOnValueChangedListener((key) => {
    if (key === keys.settings) onChange();
  });
  return () => listener.remove();
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, readSettings);
}

export function updateSettings(change: (current: Settings) => Settings) {
  storage.set(keys.settings, JSON.stringify(change(readSettings())));
}
