'use client';

import { useSyncExternalStore } from 'react';

// A small JSON value in localStorage, validated on every read, shared across tabs. When storage
// is blocked (private mode) the value lives in memory for the visit, like settings.ts.

export interface LocalValue<T> {
  /** The value, or undefined while the page is still rendering on the server. */
  useValue: () => T | undefined;
  read: () => T;
  write: (next: T) => void;
}

export function localValue<T>(key: string, parse: (raw: unknown) => T): LocalValue<T> {
  const event = `murshid-change:${key}`;
  let memory: string | null = null;
  let cache: { raw: string | null; value: T } | null = null;

  const readRaw = () => {
    try {
      return localStorage.getItem(key) ?? memory;
    } catch {
      return memory;
    }
  };

  const read = (): T => {
    const raw = readRaw();
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
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) onChange();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(event, onChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(event, onChange);
    };
  };

  return {
    useValue: () => useSyncExternalStore(subscribe, read, () => undefined),
    read,
    write: (next: T) => {
      const raw = JSON.stringify(next);
      memory = raw;
      try {
        localStorage.setItem(key, raw);
      } catch {
        // Private mode: kept in memory for this visit.
      }
      window.dispatchEvent(new Event(event));
    },
  };
}
