'use client';

import { parseSettings, type Settings } from '@murshid/data';
import { useSyncExternalStore } from 'react';

// Personal settings live in this browser only (SPEC 9): localStorage, validated on every read.
// When storage is blocked (private mode), they live in memory for the visit.

const KEY = 'murshid-settings';
const EVENT = 'murshid-settings-change';

let memory: string | null = null;
let cache: { raw: string | null; value: Settings } | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function read(): Settings {
  const raw = readRaw();
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
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The person's settings, or null while the page is still rendering on the server. */
export function useSettings(): Settings | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function readSettings(): Settings {
  return read();
}

export function updateSettings(change: (current: Settings) => Settings) {
  const next = JSON.stringify(change(read()));
  memory = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Private mode: kept in memory for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}
