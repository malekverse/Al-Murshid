'use client';

import { audioUrl, loadTimings, surah as surahInfo } from '@murshid/content/quran';
import {
  ayahAtTime,
  playbackSpans,
  playbackStep,
  startCursor,
  withRecordingEnd,
  wordAtTime,
  type AyahSpan,
  type PlaybackCursor,
} from '@murshid/core';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/lib/settings';
import { idle, publishPlayer, type PassagePlan, type RecitationState } from './recitation-store';

// Recitation on web (SPEC 5.5): one audio element for the whole app, so listening carries on
// while browsing. It follows the recording ayah by ayah and word by word from QUL's timestamps,
// repeats each ayah as often as asked, repeats a passage as a whole and can pause after each ayah
// for memorizing (Phase 5b, rules in @murshid/core), and shows in the system's media controls.
// Screens reach it through `useRecitation` (recitation-store); `RecitationHost` loads it on the
// first request, so pages that never play do not carry it (Phase 6).

/** How early an ayah's end counts as reached: the frame loop looks every 16 ms or so. */
const MARGIN_MS = 40;

/** The player: one audio element for the whole app. It renders nothing; screens read the store. */
export function RecitationPlayer() {
  const t = useTranslations('quran');
  const settings = useSettings();
  const prefs = settings?.quran;
  const reciter = prefs?.reciter ?? 'afasy';
  const speed = prefs?.speed ?? 1;
  const repeat = prefs?.repeat ?? 1;

  const audio = useRef<HTMLAudioElement | null>(null);
  const spans = useRef<AyahSpan[]>([]);
  const cursor = useRef<PlaybackCursor>(startCursor());
  const plan = useRef<PassagePlan & { from: number }>(null);
  const turnTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // During the listener's turn the audio is paused but the recitation is still on.
  const inTurn = useRef(false);
  const endTurn = () => {
    clearTimeout(turnTimer.current);
    inTurn.current = false;
  };
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

  // Follow the recording: the ayah and word at the current time, and what repeating asks for.
  useEffect(() => {
    if (!state.playing) return;
    let frame = 0;
    const tick = () => {
      const el = audio.current;
      if (el && !inTurn.current) {
        const ms = el.currentTime * 1000;
        const p = plan.current;
        const rules = {
          repeat,
          range: p ? { from: p.from, to: p.to, times: p.times } : null,
          gap: p?.gap ?? false,
        };
        const result = playbackStep(spans.current, ms, cursor.current, rules, MARGIN_MS);
        cursor.current = result.cursor;
        const { step } = result;
        if (step.kind === 'seek') el.currentTime = step.ms / 1000;
        if (step.kind === 'stop') {
          el.pause();
          plan.current = null;
          update({ passage: null });
          return;
        }
        if (step.kind === 'gap') {
          // The listener's turn: wait as long as the ayah took at this speed, then go on.
          inTurn.current = true;
          el.pause();
          update({ turn: true });
          turnTimer.current = setTimeout(() => {
            inTurn.current = false;
            update({ turn: false });
            void el.play();
          }, step.ms / el.playbackRate);
          frame = requestAnimationFrame(tick);
          return;
        }
        const index = ayahAtTime(spans.current, el.currentTime * 1000);
        const span = spans.current[index];
        update({
          ayah: index < 0 ? null : index + 1,
          word: span ? wordAtTime(span, el.currentTime * 1000) : null,
          passage: p ? { from: p.from, to: p.to, times: p.times, pass: cursor.current.pass } : null,
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.playing, repeat]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);

  const play = (surah: number, fromAyah = 1, passage?: PassagePlan) => {
    const el = element();
    endTurn();
    plan.current = passage ? { ...passage, from: fromAyah } : null;
    cursor.current = startCursor();
    update({
      surah,
      ayah: fromAyah,
      word: null,
      loading: true,
      error: false,
      turn: false,
      passage: passage ? { from: fromAyah, to: passage.to, times: passage.times, pass: 1 } : null,
    });
    loadTimings(reciter, surah)
      .then((timings) => {
        spans.current = playbackSpans(timings);
        const src = audioUrl(reciter, surah);
        if (el.src !== src) el.src = src;
        el.playbackRate = speed;
        const start = () => {
          // A last ayah without a usable end runs to the recording's real end.
          if (Number.isFinite(el.duration)) {
            spans.current = withRecordingEnd(spans.current, el.duration * 1000);
          }
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
    endTurn();
    audio.current?.pause();
    update({ playing: false, turn: false });
  };
  const resume = () => {
    const el = audio.current;
    if (!el || current.current.surah === null) return;
    endTurn();
    update({ turn: false });
    el.play().then(
      () => update({ playing: true, error: false }),
      () => update({ error: true }),
    );
  };
  const stop = () => {
    endTurn();
    audio.current?.pause();
    plan.current = null;
    setState(idle);
  };
  const step = (by: 1 | -1) => {
    const { surah, ayah } = current.current;
    if (surah === null) return;
    const target = Math.min(surahInfo(surah).ayahCount, Math.max(1, (ayah ?? 1) + by));
    const span = spans.current[target - 1];
    if (span && audio.current) {
      // Stepping out of a passage ends it.
      const p = plan.current;
      if (p && (target < p.from || target > p.to)) plan.current = null;
      cursor.current = { ...cursor.current, ayah: target - 1, left: repeat - 1, gapped: -1 };
      audio.current.currentTime = span.start / 1000;
      update({ ayah: target, word: null, ...(plan.current ? {} : { passage: null }) });
    }
  };

  // The end of the surah, and pauses from outside (headphones, the system).
  useEffect(() => {
    const el = element();
    const onEnded = () => {
      plan.current = null;
      update({ playing: false, passage: null });
    };
    const onPause = () => {
      if (!inTurn.current) update({ playing: false });
    };
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

  // Published after every render, so screens always call the latest handlers.
  useEffect(() => {
    publishPlayer({ ...state, reciter, play, pause, resume, stop, step });
  });

  return null;
}
