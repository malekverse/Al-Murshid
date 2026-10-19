import { audioUrl, PAGE_COUNT } from '@murshid/content/quran';
import type { ReciterChoice } from '@murshid/data';
import { Directory, File, Paths } from 'expo-file-system';
import * as Font from 'expo-font';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { mmkvValue } from './mmkv-value';

// Files the reader keeps on the phone (SPEC 5.5, 9): recitations downloaded for offline
// listening, and each mushaf page's QCF V2 font, fetched once when the page is first opened.

// ---------- Recitations ----------

const audioFile = (reciter: ReciterChoice, surah: number) =>
  new File(Paths.document, 'quran-audio', reciter, `${surah}.mp3`);

/** What is downloaded: "afasy/2" -> bytes. Kept beside the files for a quick list. */
const downloads = mmkvValue('audio-downloads', (raw) =>
  raw !== null && typeof raw === 'object' ? (raw as Record<string, number>) : {},
);

export type DownloadState =
  | { state: 'none' }
  | { state: 'downloading'; progress: number }
  | { state: 'done'; bytes: number }
  | { state: 'error' };

const active = new Map<string, { progress: number; abort: AbortController }>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
const notify = () => {
  version++;
  for (const l of listeners) l();
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useDownload(reciter: ReciterChoice, surah: number): DownloadState {
  useSyncExternalStore(subscribe, () => version);
  const index = downloads.useValue();
  const key = `${reciter}/${surah}`;
  const running = active.get(key);
  if (running) return { state: 'downloading', progress: running.progress };
  if (index[key] !== undefined) return { state: 'done', bytes: index[key] };
  return failed.has(key) ? { state: 'error' } : { state: 'none' };
}

export async function downloadSurah(reciter: ReciterChoice, surah: number) {
  const key = `${reciter}/${surah}`;
  if (active.has(key)) return;
  const abort = new AbortController();
  active.set(key, { progress: 0, abort });
  failed.delete(key);
  notify();
  try {
    new Directory(Paths.document, 'quran-audio', reciter).create({
      intermediates: true,
      idempotent: true,
    });
    const file = await File.downloadFileAsync(audioUrl(reciter, surah), audioFile(reciter, surah), {
      idempotent: true,
      signal: abort.signal,
      onProgress: ({ bytesWritten, totalBytes }) => {
        const entry = active.get(key);
        if (entry && totalBytes > 0) {
          entry.progress = bytesWritten / totalBytes;
          notify();
        }
      },
    });
    downloads.write({ ...downloads.read(), [key]: file.size ?? 0 });
  } catch {
    if (!abort.signal.aborted) failed.add(key);
    const file = audioFile(reciter, surah);
    if (file.exists) file.delete();
  } finally {
    active.delete(key);
    notify();
  }
}

export function cancelDownload(reciter: ReciterChoice, surah: number) {
  active.get(`${reciter}/${surah}`)?.abort.abort();
}

export function removeDownload(reciter: ReciterChoice, surah: number) {
  const file = audioFile(reciter, surah);
  if (file.exists) file.delete();
  const next = { ...downloads.read() };
  delete next[`${reciter}/${surah}`];
  downloads.write(next);
}

/** Every downloaded recitation, by reciter and surah. */
export function useDownloads(): { reciter: ReciterChoice; surah: number; bytes: number }[] {
  const index = downloads.useValue();
  return Object.entries(index).map(([key, bytes]) => {
    const [reciter, surah] = key.split('/') as [ReciterChoice, string];
    return { reciter, surah: Number(surah), bytes };
  });
}

/** The downloaded file when there is one, otherwise the stream. */
export function recitationSource(reciter: ReciterChoice, surah: number): string {
  const file = audioFile(reciter, surah);
  return file.exists ? file.uri : audioUrl(reciter, surah);
}

// ---------- Mushaf page fonts ----------

// Served with the web app (apps/web/public/fonts/quran-v2), or from the asset CDN once there is
// one. In development, `adb reverse tcp:3000 tcp:3000` lets the emulator reach the web server.
const assetBase = process.env.EXPO_PUBLIC_ASSET_BASE_URL ?? 'http://localhost:3000';
const fontFile = (page: number) => new File(Paths.document, 'quran-fonts-v2', `p${page}.ttf`);
const fontLoads = new Map<number, Promise<void>>();

export const pageFontFamily = (page: number) => `qcf-p${page}`;

function loadPageFont(page: number): Promise<void> {
  let p = fontLoads.get(page);
  if (!p) {
    p = (async () => {
      const file = fontFile(page);
      if (!file.exists) {
        new Directory(Paths.document, 'quran-fonts-v2').create({
          intermediates: true,
          idempotent: true,
        });
        await File.downloadFileAsync(`${assetBase}/fonts/quran-v2/p${page}.ttf`, file, {
          idempotent: true,
        });
      }
      await Font.loadAsync({ [pageFontFamily(page)]: file.uri });
    })();
    // A failed download (offline) may succeed later.
    p.catch(() => fontLoads.delete(page));
    fontLoads.set(page, p);
  }
  return p;
}

export type FontState = 'loading' | 'ready' | 'error';

export function usePageFont(page: number, neighbours = true) {
  const [states, setStates] = useState<Record<number, FontState>>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadPageFont(page).then(
      () => live && setStates((s) => ({ ...s, [page]: 'ready' })),
      () => live && setStates((s) => ({ ...s, [page]: 'error' })),
    );
    // The pages either side, so turning a page is instant.
    if (neighbours) {
      for (const next of [page + 1, page - 1]) {
        if (next >= 1 && next <= PAGE_COUNT) loadPageFont(next).catch(() => {});
      }
    }
    return () => {
      live = false;
    };
  }, [page, attempt, neighbours]);
  return {
    state: (Font.isLoaded(pageFontFamily(page))
      ? 'ready'
      : (states[page] ?? 'loading')) as FontState,
    retry: () => {
      setStates((s) => ({ ...s, [page]: 'loading' }));
      setAttempt((a) => a + 1);
    },
  };
}
