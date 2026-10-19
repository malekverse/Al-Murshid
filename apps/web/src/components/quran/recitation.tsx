'use client';

import { audioUrl, loadTimings, surah as surahInfo } from '@murshid/content/quran';
import { ayahAtTime, playbackSpans, wordAtTime, type AyahSpan } from '@murshid/core';
import type { ReciterChoice } from '@murshid/data';
import { useTranslations } from 'next-intl';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSettings } from '@/lib/settings';

// Recitation on web (SPEC 5.5): one audio element for the whole app, so listening carries on
// while browsing. It follows the recording ayah by ayah and word by word from QUL's timestamps,
// repeats each ayah as often as asked, and shows in the system's media controls.

export interface RecitationState {
  surah: number | null;
  /** The ayah being recited (from 1), or null before the first (the basmalah). */
  ayah: number | null;
  /** The word being recited (from 1), when the timestamps allow it. */
  word: number | null;
  playing: boolean;
  loading: boolean;
  error: boolean;
}

interface Recitation extends RecitationState {
  reciter: ReciterChoice;
  play: (surah: number, fromAyah?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  step: (by: 1 | -1) => void;
}

const idle: RecitationState = {
  surah: null,
  ayah: null,
  word: null,
  playing: false,
  loading: false,
  error: false,
};

const RecitationContext = createContext<Recitation | null>(null);

export function useRecitation(): Recitation {
  const value = use(RecitationContext);
  if (!value) throw new Error('useRecitation needs a RecitationProvider');
  return value;
}

export function RecitationProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('quran');
  const settings = useSettings();
  const prefs = settings?.quran;
  const reciter = prefs?.reciter ?? 'afasy';
  const speed = prefs?.speed ?? 1;
  const repeat = prefs?.repeat ?? 1;

  const audio = useRef<HTMLAudioElement | null>(null);
  const spans = useRef<AyahSpan[]>([]);
  const repeats = useRef({ ayah: -1, left: 0 });
  const [state, setState] = useState<RecitationState>(idle);
  // The system's media handlers outlive a render; they read the latest state from here.
  const current = useRef(state);
  useEffect(() => {
    current.current = state;
  });

  const update = (patch: Partial<RecitationState>) =>
    setState((s) => {
      const next = { ...s, ...patch };
      return (Object.keys(patch) as (keyof RecitationState)[]).some((k) => s[k] !== next[k])
        ? next
        : s;
    });

  const element = () => {
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.preload = 'auto';
    }
    return audio.current;
  };

  // Follow the recording: the ayah and word at the current time, and each ayah's repeats.
  useEffect(() => {
    if (!state.playing) return;
    let frame = 0;
    const tick = () => {
      const el = audio.current;
      if (el) {
        const ms = el.currentTime * 1000;
        const index = ayahAtTime(spans.current, ms);
        const span = spans.current[index];
        if (span && index !== repeats.current.ayah)
          repeats.current = { ayah: index, left: repeat - 1 };
        const next = spans.current[index + 1];
        // At the end of an ayah that still has repeats, go back to its start.
        if (span && repeats.current.left > 0 && ms >= (next ? next.start : span.end) - 40) {
          repeats.current.left -= 1;
          el.currentTime = span.start / 1000;
        }
        update({ ayah: index < 0 ? null : index + 1, word: span ? wordAtTime(span, ms) : null });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.playing, repeat]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);

  const play = (surah: number, fromAyah = 1) => {
    const el = element();
    update({ surah, ayah: fromAyah, word: null, loading: true, error: false });
    repeats.current = { ayah: -1, left: 0 };
    loadTimings(reciter, surah)
      .then((timings) => {
        spans.current = playbackSpans(timings);
        const src = audioUrl(reciter, surah);
        if (el.src !== src) el.src = src;
        el.playbackRate = speed;
        const start = () => {
          const span = spans.current[fromAyah - 1];
          el.currentTime = fromAyah > 1 && span ? span.start / 1000 : 0;
          return el.play();
        };
        return el.readyState >= 1
          ? start()
          : new Promise<void>((resolve, reject) => {
              el.addEventListener('loadedmetadata', () => start().then(resolve, reject), {
                once: true,
              });
              el.addEventListener('error', reject, { once: true });
            });
      })
      .then(() => update({ playing: true, loading: false }))
      .catch(() => update({ playing: false, loading: false, error: true }));
  };

  const pause = () => {
    audio.current?.pause();
    update({ playing: false });
  };
  const resume = () => {
    const el = audio.current;
    if (!el || current.current.surah === null) return;
    el.play().then(
      () => update({ playing: true, error: false }),
      () => update({ error: true }),
    );
  };
  const stop = () => {
    audio.current?.pause();
    setState(idle);
  };
  const step = (by: 1 | -1) => {
    const { surah, ayah } = current.current;
    if (surah === null) return;
    const target = Math.min(surahInfo(surah).ayahCount, Math.max(1, (ayah ?? 1) + by));
    const span = spans.current[target - 1];
    if (span && audio.current) {
      repeats.current = { ayah: target - 1, left: repeat - 1 };
      audio.current.currentTime = span.start / 1000;
      update({ ayah: target, word: null });
    }
  };

  // The end of the surah, and pauses from outside (headphones, the system).
  useEffect(() => {
    const el = element();
    const onEnded = () => update({ playing: false });
    const onPause = () => update({ playing: false });
    const onPlay = () => update({ playing: true });
    el.addEventListener('ended', onEnded);
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, []);

  // The system's media controls: lock screen, headphones, media keys.
  useEffect(() => {
    if (!('mediaSession' in navigator) || state.surah === null) return;
    const s = surahInfo(state.surah);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${s.nameSimple} · ${s.nameArabic}`,
      artist: t(`reciters.${reciter}`),
      album: t('title'),
    });
    navigator.mediaSession.setActionHandler('play', resume);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    // The handlers read the latest state through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.surah, reciter]);

  return (
    <RecitationContext value={{ ...state, reciter, play, pause, resume, stop, step }}>
      {children}
    </RecitationContext>
  );
}
