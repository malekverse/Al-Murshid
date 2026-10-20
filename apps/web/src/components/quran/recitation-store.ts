'use client';

import type { ReciterChoice } from '@murshid/data';
import { useSyncExternalStore } from 'react';

// The recitation as every screen sees it (Phase 6): a small store, so a page can offer "Play"
// without loading the player. The first request loads it (`RecitationHost`, at the root); the
// player then publishes its state here, and the request it was loaded for runs.

/** A passage played several times while memorizing: ayahs `from` to `to`, `times` times. */
export interface PassagePlan {
  to: number;
  times: number;
  /** Pause after each ayah, as long as the ayah, to recite it back. */
  gap: boolean;
}

export interface RecitationState {
  surah: number | null;
  /** The ayah being recited (from 1), or null before the first (the basmalah). */
  ayah: number | null;
  /** The word being recited (from 1), when the timestamps allow it. */
  word: number | null;
  playing: boolean;
  loading: boolean;
  error: boolean;
  /** The passage being repeated, and which time through it this is. */
  passage: { from: number; to: number; times: number; pass: number } | null;
  /** Paused after an ayah for the listener to recite it back. */
  turn: boolean;
}

export interface Recitation extends RecitationState {
  reciter: ReciterChoice;
  play: (surah: number, fromAyah?: number, passage?: PassagePlan) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  step: (by: 1 | -1) => void;
}

export const idle: RecitationState = {
  surah: null,
  ayah: null,
  word: null,
  playing: false,
  loading: false,
  error: false,
  passage: null,
  turn: false,
};

let player: Recitation | null = null;
let wanted = false;
const waiting: ((player: Recitation) => void)[] = [];
const listeners = new Set<() => void>();
const notify = () => {
  for (const l of listeners) l();
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Runs `request` with the player, loading it first if this is the first request. */
function withPlayer(request: (player: Recitation) => void) {
  if (player) return request(player);
  waiting.push(request);
  if (!wanted) {
    wanted = true;
    notify();
  }
}

/** What screens see before the player is loaded: nothing playing, and requests that load it. */
const unloaded: Recitation = {
  ...idle,
  reciter: 'afasy',
  play: (...args) => withPlayer((p) => p.play(...args)),
  pause: () => {},
  resume: () => {},
  stop: () => {},
  step: () => {},
};

/** The player publishes itself on every render; requests made while it loaded run now. */
export function publishPlayer(value: Recitation) {
  player = value;
  for (const request of waiting.splice(0)) request(value);
  notify();
}

export function useRecitation(): Recitation {
  return useSyncExternalStore(
    subscribe,
    () => player ?? unloaded,
    () => unloaded,
  );
}

/** Whether a screen has asked for the player yet (`RecitationHost` loads it then). */
export function usePlayerWanted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => wanted,
    () => false,
  );
}
