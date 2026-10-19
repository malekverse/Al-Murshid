import { useSyncExternalStore } from 'react';
import { storage } from './storage';

// A small JSON value in MMKV, validated on every read and shared live with every screen, like
// settings.ts.

export interface MmkvValue<T> {
  useValue: () => T;
  read: () => T;
  write: (next: T) => void;
}

export function mmkvValue<T>(key: string, parse: (raw: unknown) => T): MmkvValue<T> {
  let cache: { raw: string | undefined; value: T } | null = null;

  const read = (): T => {
    const raw = storage.getString(key);
    // useSyncExternalStore needs the same object while nothing changed.
    if (cache && cache.raw === raw) return cache.value;
    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    cache = { raw, value: parse(parsed) };
    return cache.value;
  };

  const subscribe = (onChange: () => void) => {
    const listener = storage.addOnValueChangedListener((changed) => {
      if (changed === key) onChange();
    });
    return () => listener.remove();
  };

  return {
    useValue: () => useSyncExternalStore(subscribe, read),
    read,
    write: (next: T) => storage.set(key, JSON.stringify(next)),
  };
}
