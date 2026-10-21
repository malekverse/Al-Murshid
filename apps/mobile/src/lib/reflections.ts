import {
  parseReflectionPlaintext,
  reflectionPlaintext,
  tidyReflection,
  type Reflection,
  type ReflectionText,
} from '@murshid/data';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import {
  AESEncryptionKey,
  AESKeySize,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { db, reflections } from '@/db';

// Night reflections (SPEC 5.7, 9): kept on this phone only, sealed with AES-256-GCM. The key is
// made on the device and kept in its secure storage (Android Keystore, iOS Keychain), which is
// left out of backups, so a copied database cannot be read elsewhere. Each row's evening is bound
// to it as additional data, so rows cannot be swapped between dates.

const KEY_NAME = 'reflection-key';
export const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let keyPromise: Promise<AESEncryptionKey> | null = null;

function reflectionKey(): Promise<AESEncryptionKey> {
  keyPromise ??= (async () => {
    const stored = await SecureStore.getItemAsync(KEY_NAME, secureOptions);
    if (stored) return AESEncryptionKey.import(stored, 'base64');
    const key = await AESEncryptionKey.generate(AESKeySize.AES256);
    await SecureStore.setItemAsync(KEY_NAME, await key.encoded('base64'), secureOptions);
    return key;
  })().catch((error: unknown) => {
    keyPromise = null;
    throw error;
  });
  return keyPromise;
}

/** Deletes the key itself (after everything is deleted): nothing sealed with it opens again. */
export async function deleteReflectionKey() {
  keyPromise = null;
  await SecureStore.deleteItemAsync(KEY_NAME, secureOptions);
}

/** An evening's reflection, or null when it cannot be opened here (its key is gone). */
export interface ReflectionEntry {
  date: string;
  reflection: Reflection | null;
}

type Row = typeof reflections.$inferSelect;

async function open(row: Row): Promise<ReflectionEntry> {
  try {
    const key = await reflectionKey();
    const plain = await aesDecryptAsync(AESSealedData.fromCombined(row.sealed), key, {
      additionalData: encoder.encode(row.date),
    });
    return {
      date: row.date,
      reflection: parseReflectionPlaintext(row.date, decoder.decode(plain), row.updatedAt),
    };
  } catch {
    return { date: row.date, reflection: null };
  }
}

export function openReflections(rows: readonly Row[]): Promise<ReflectionEntry[]> {
  return Promise.all(rows.map(open));
}

export function allReflectionRows(): Row[] {
  return db.select().from(reflections).orderBy(desc(reflections.date)).all();
}

/** Every reflection, newest evening first, opened. */
export function useReflections(): ReflectionEntry[] | undefined {
  const { data, updatedAt } = useLiveQuery(
    db.select().from(reflections).orderBy(desc(reflections.date)),
  );
  const [opened, setOpened] = useState<{ at: Date; entries: ReflectionEntry[] }>();
  useEffect(() => {
    if (!updatedAt) return;
    let live = true;
    void openReflections(data).then((entries) => {
      if (live) setOpened({ at: updatedAt, entries });
    });
    return () => {
      live = false;
    };
  }, [data, updatedAt]);
  return opened && opened.at === updatedAt ? opened.entries : undefined;
}

/** The evenings with a reflection ("2026-10-18"), without opening any. */
export function useWrittenNights(): string[] | undefined {
  const { data, updatedAt } = useLiveQuery(db.select({ date: reflections.date }).from(reflections));
  return updatedAt ? data.map((r) => r.date) : undefined;
}

/** Saves an evening's reflection; with nothing written, removes it. */
export async function saveReflection(date: string, text: ReflectionText, now = new Date()) {
  const tidy = tidyReflection(text);
  if (!tidy) {
    db.delete(reflections).where(eq(reflections.date, date)).run();
    return;
  }
  const key = await reflectionKey();
  const sealed = await aesEncryptAsync(encoder.encode(reflectionPlaintext(tidy)), key, {
    additionalData: encoder.encode(date),
  });
  const row = { date, sealed: await sealed.combined('base64'), updatedAt: now.toISOString() };
  db.insert(reflections)
    .values(row)
    .onConflictDoUpdate({
      target: reflections.date,
      set: { sealed: row.sealed, updatedAt: row.updatedAt },
    })
    .run();
}

export function deleteReflection(date: string) {
  db.delete(reflections).where(eq(reflections.date, date)).run();
}
