import { audioUrl, PAGE_COUNT, SURAH_COUNT } from '@murshid/content/quran';
import { reciterIds, type ReciterChoice } from '@murshid/data';
import { Directory, File, Paths } from 'expo-file-system';
import * as Font from 'expo-font';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { assetBaseUrl } from './addresses';
import { mmkvValue } from './mmkv-value';

// Files the reader keeps on the phone (SPEC 5.5, 9): recitations downloaded for offline
// listening, a surah or a whole reciter at a time (Phase 5b), and each mushaf page's font, fetched
// once when the page is first opened. The storage screen lists both and removes them.

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
/** Downloads under way, each settling to whether it worked. */
const pending = new Map<string, Promise<boolean>>();
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

/** Downloads a surah's recitation (once, however often asked); settles to whether it worked. */
export function downloadSurah(reciter: ReciterChoice, surah: number): Promise<boolean> {
  const key = `${reciter}/${surah}`;
  let p = pending.get(key);
  if (!p) {
    p = fetchSurah(reciter, surah, key).finally(() => pending.delete(key));
    pending.set(key, p);
  }
  return p;
}

async function fetchSurah(reciter: ReciterChoice, surah: number, key: string) {
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
    return true;
  } catch {
    if (!abort.signal.aborted) failed.add(key);
    const file = audioFile(reciter, surah);
    if (file.exists) file.delete();
    return false;
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

// ---------- Whole reciters ----------

// A whole reciter downloads one surah after another. The reciters asked for are kept across
// launches, so a download stopped by a lost connection or a closed app carries on where it
// stopped: surahs already on the phone are skipped, and a surah cut short is fetched again.

/** Reciters to download whole, in the order asked. */
const queue = mmkvValue('audio-queue', (raw) =>
  Array.isArray(raw)
    ? raw.filter((r): r is ReciterChoice => (reciterIds as readonly string[]).includes(String(r)))
    : [],
);
let worker: Promise<void> | null = null;
/** The last surah failed (offline, most often): waiting for the next launch or a retry. */
let stalled = false;

const surahs = Array.from({ length: SURAH_COUNT }, (_, i) => i + 1);
const missingSurah = (reciter: ReciterChoice) =>
  surahs.find((s) => downloads.read()[`${reciter}/${s}`] === undefined);

async function work() {
  for (;;) {
    const reciter = queue.read()[0];
    if (!reciter) return;
    const surah = missingSurah(reciter);
    if (surah === undefined) {
      queue.write(queue.read().filter((r) => r !== reciter));
      continue;
    }
    const ok = await downloadSurah(reciter, surah);
    // Paused meanwhile: on with the next reciter. Failed: stop, and keep the queue for later.
    if (!ok && queue.read().includes(reciter)) {
      stalled = true;
      return;
    }
  }
}

/** Carries on with the reciters asked for (at launch, or after a failure). */
export function resumeDownloads() {
  stalled = false;
  worker ??= work().finally(() => {
    worker = null;
    notify();
  });
  notify();
}

/** Downloads every surah of a reciter, after any reciter already downloading. */
export function downloadReciter(reciter: ReciterChoice) {
  if (!queue.read().includes(reciter)) queue.write([...queue.read(), reciter]);
  resumeDownloads();
}

/** Stops downloading a reciter whole; the surahs already in stay. */
export function pauseReciter(reciter: ReciterChoice) {
  queue.write(queue.read().filter((r) => r !== reciter));
  for (const s of surahs) cancelDownload(reciter, s);
  notify();
}

/** Removes everything downloaded of a reciter. */
export function removeReciter(reciter: ReciterChoice) {
  pauseReciter(reciter);
  const dir = new Directory(Paths.document, 'quran-audio', reciter);
  if (dir.exists) dir.delete();
  const next = { ...downloads.read() };
  for (const key of Object.keys(next)) if (key.startsWith(`${reciter}/`)) delete next[key];
  downloads.write(next);
}

/** The reciters asked for whole, in order. */
export const useDownloadQueue = () => queue.useValue();

export interface ReciterDownload {
  /** Asked for whole: downloading now, waiting its turn, or stopped by a failure. */
  state: 'idle' | 'downloading' | 'queued' | 'stalled';
  /** Surahs on the phone, of all of them, and their size. */
  done: number;
  total: number;
  bytes: number;
  /** The surah downloading now, and how far it is (0 to 1). */
  current: { surah: number; progress: number } | null;
}

export function useReciterDownload(reciter: ReciterChoice): ReciterDownload {
  useSyncExternalStore(subscribe, () => version);
  const index = downloads.useValue();
  const asked = queue.useValue();
  let done = 0;
  let bytes = 0;
  for (const [key, size] of Object.entries(index)) {
    if (!key.startsWith(`${reciter}/`)) continue;
    done++;
    bytes += size;
  }
  let current: ReciterDownload['current'] = null;
  for (const [key, entry] of active) {
    const [r, s] = key.split('/');
    if (r === reciter) current = { surah: Number(s), progress: entry.progress };
  }
  const state = !asked.includes(reciter)
    ? 'idle'
    : stalled || !worker
      ? 'stalled'
      : asked[0] === reciter
        ? 'downloading'
        : 'queued';
  return { state, done, total: SURAH_COUNT, bytes, current };
}

/** The downloaded file when there is one, otherwise the stream. */
export function recitationSource(reciter: ReciterChoice, surah: number): string {
  const file = audioFile(reciter, surah);
  return file.exists ? file.uri : audioUrl(reciter, surah);
}

// ---------- Mushaf page fonts ----------

// Served by the asset Worker (lib/addresses), or by the web dev server when apps/mobile/.env sets
// EXPO_PUBLIC_ASSET_BASE_URL=http://localhost:3000 (with `adb reverse tcp:3000 tcp:3000` on the
// emulator). Each Madani edition (Phase 5b: 1405H, 1421H, 1441H) has one font per page, kept once
// downloaded.

export type GlyphEdition = 'v1' | 'v2' | 'v4';

const fontDir = (edition: GlyphEdition) => `quran-fonts-${edition}`;
const fontFile = (page: number, edition: GlyphEdition) =>
  new File(Paths.document, fontDir(edition), `p${page}.ttf`);
const fontLoads = new Map<string, Promise<void>>();

export const pageFontFamily = (page: number, edition: GlyphEdition = 'v2') =>
  `qcf-${edition}-p${page}`;

function loadPageFont(page: number, edition: GlyphEdition): Promise<void> {
  const key = `${edition}:${page}`;
  let p = fontLoads.get(key);
  if (!p) {
    p = (async () => {
      const file = fontFile(page, edition);
      if (!file.exists) {
        new Directory(Paths.document, fontDir(edition)).create({
          intermediates: true,
          idempotent: true,
        });
        await File.downloadFileAsync(`${assetBaseUrl}/fonts/quran-${edition}/p${page}.ttf`, file, {
          idempotent: true,
        });
      }
      await Font.loadAsync({ [pageFontFamily(page, edition)]: file.uri });
    })();
    // A failed download (offline) may succeed later.
    p.catch(() => fontLoads.delete(key));
    fontLoads.set(key, p);
  }
  return p;
}

/** The page fonts kept for an edition: how many, and their size. */
export function pageFontsStored(edition: GlyphEdition): { count: number; bytes: number } {
  const dir = new Directory(Paths.document, fontDir(edition));
  if (!dir.exists) return { count: 0, bytes: 0 };
  let count = 0;
  let bytes = 0;
  for (const entry of dir.list()) {
    if (entry instanceof File) {
      count++;
      bytes += entry.size ?? 0;
    }
  }
  return { count, bytes };
}

/** Removes an edition's page fonts; pages fetch theirs again when next opened. */
export function removePageFonts(edition: GlyphEdition) {
  const dir = new Directory(Paths.document, fontDir(edition));
  if (dir.exists) dir.delete();
  for (const key of [...fontLoads.keys()]) if (key.startsWith(`${edition}:`)) fontLoads.delete(key);
}

export type FontState = 'loading' | 'ready' | 'error';

/** A page's font, for an edition drawn with page fonts; null (the Indopak mushaf) needs none. */
export function usePageFont(page: number, edition: GlyphEdition | null = 'v2', neighbours = true) {
  const [states, setStates] = useState<Record<string, FontState>>({});
  const [attempt, setAttempt] = useState(0);
  const key = `${edition}:${page}`;
  useEffect(() => {
    if (!edition) return;
    let live = true;
    loadPageFont(page, edition).then(
      () => live && setStates((s) => ({ ...s, [key]: 'ready' })),
      () => live && setStates((s) => ({ ...s, [key]: 'error' })),
    );
    // The pages either side, so turning a page is instant.
    if (neighbours) {
      for (const next of [page + 1, page - 1]) {
        if (next >= 1 && next <= PAGE_COUNT) loadPageFont(next, edition).catch(() => {});
      }
    }
    return () => {
      live = false;
    };
  }, [page, edition, key, attempt, neighbours]);
  return {
    state: (!edition || Font.isLoaded(pageFontFamily(page, edition))
      ? 'ready'
      : (states[key] ?? 'loading')) as FontState,
    retry: () => {
      setStates((s) => ({ ...s, [key]: 'loading' }));
      setAttempt((a) => a + 1);
    },
  };
}
