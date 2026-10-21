'use client';

import {
  parseReflectionPlaintext,
  reflectionPlaintext,
  tidyReflection,
  type Reflection,
  type ReflectionText,
} from '@murshid/data';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db, type ReflectionRow } from './db';

// Night reflections (SPEC 5.7, 9): kept in this browser only, sealed with AES-GCM under a key
// WebCrypto made here. The key is non-extractable: the page can use it, but nothing can read it
// out of IndexedDB. Each row's evening is bound to it as additional data, so rows cannot be
// swapped between dates.

const KEY_NAME = 'reflection-key';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let keyPromise: Promise<CryptoKey> | null = null;

function reflectionKey(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    const stored = await db.secrets.get(KEY_NAME);
    if (stored) return stored.key;
    const fresh = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ]);
    // Another tab may have made one meanwhile: the first stored wins.
    return db.transaction('rw', db.secrets, async () => {
      const raced = await db.secrets.get(KEY_NAME);
      if (raced) return raced.key;
      await db.secrets.put({ name: KEY_NAME, key: fresh });
      return fresh;
    });
  })().catch((error: unknown) => {
    keyPromise = null;
    throw error;
  });
  return keyPromise;
}

/** Forget the key held for this visit (after everything is deleted). */
export function forgetReflectionKey() {
  keyPromise = null;
}

/** An evening's reflection, or null when it cannot be opened here (its key is gone). */
export interface ReflectionEntry {
  date: string;
  reflection: Reflection | null;
}

async function open(row: ReflectionRow): Promise<ReflectionEntry> {
  try {
    const key = await reflectionKey();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: row.iv, additionalData: encoder.encode(row.date) },
      key,
      row.sealed,
    );
    return {
      date: row.date,
      reflection: parseReflectionPlaintext(row.date, decoder.decode(plain), row.updatedAt),
    };
  } catch {
    return { date: row.date, reflection: null };
  }
}

export function openReflections(rows: readonly ReflectionRow[]): Promise<ReflectionEntry[]> {
  return Promise.all(rows.map(open));
}

/** Every reflection, newest evening first, opened. */
export function useReflections(): ReflectionEntry[] | undefined {
  const rows = useLiveQuery(() => db.reflections.orderBy('date').reverse().toArray(), []);
  const [opened, setOpened] = useState<{ rows: ReflectionRow[]; entries: ReflectionEntry[] }>();
  useEffect(() => {
    if (!rows) return;
    let live = true;
    void openReflections(rows).then((entries) => {
      if (live) setOpened({ rows, entries });
    });
    return () => {
      live = false;
    };
  }, [rows]);
  return opened && opened.rows === rows ? opened.entries : undefined;
}

/** The evenings with a reflection ("2026-10-18"), without opening any. */
export function useWrittenNights(): string[] | undefined {
  return useLiveQuery(() => db.reflections.toCollection().primaryKeys(), []);
}

/** Saves an evening's reflection; with nothing written, removes it. */
export async function saveReflection(date: string, text: ReflectionText, now = new Date()) {
  const tidy = tidyReflection(text);
  if (!tidy) {
    await db.reflections.delete(date);
    return;
  }
  const key = await reflectionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(date) },
    key,
    encoder.encode(reflectionPlaintext(tidy)),
  );
  await db.reflections.put({ date, iv, sealed, updatedAt: now.toISOString() });
}

export async function deleteReflection(date: string) {
  await db.reflections.delete(date);
}
