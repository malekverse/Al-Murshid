import { loadTimings, surah as surahInfo } from '@murshid/content/quran';
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
import type { ReciterChoice } from '@murshid/data';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { recitationSource } from '@/lib/quran-files';
import { useSettings } from '@/lib/settings';

// Recitation on the phone (SPEC 5.5): one player for the whole app, so listening carries on
// across screens, in the background and on the lock screen. It plays a downloaded surah from the
// phone when there is one, follows the recording ayah by ayah and word by word from QUL's
// timestamps, repeats each ayah as often as asked, and repeats a passage as a whole with an
// optional pause after each ayah for memorizing (Phase 5b, rules in @murshid/core).

/** A passage played several times while memorizing: from the ayah played up to `to`. */
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

interface Recitation extends RecitationState {
  reciter: ReciterChoice;
  play: (surah: number, fromAyah?: number, passage?: PassagePlan) => void;
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
  passage: null,
  turn: false,
};

/** How early an ayah's end counts as reached: the player reports ten times a second. */
const MARGIN_MS = 120;

const RecitationContext = createContext<Recitation | null>(null);

export function useRecitation(): Recitation {
  const value = use(RecitationContext);
  if (!value) throw new Error('useRecitation needs a RecitationProvider');
  return value;
}

export function RecitationProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('quran');
  const settings = useSettings();
  const { reciter, speed, repeat } = settings.quran;

  const player = useRef<AudioPlayer | null>(null);
  const spans = useRef<AyahSpan[]>([]);
  const cursor = useRef<PlaybackCursor>(startCursor());
  const plan = useRef<(PassagePlan & { from: number }) | null>(null);
  const pending = useRef<{ seek: number } | null>(null);
  // During the listener's turn the audio is paused but the recitation is still on.
  const inTurn = useRef(false);
  const turnTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const endTurn = () => {
    clearTimeout(turnTimer.current);
    inTurn.current = false;
  };
  const [state, setState] = useState<RecitationState>(idle);
  // Status callbacks outlive a render; they read the latest values from here.
  const latest = useRef({ state, repeat, speed });
  useEffect(() => {
    latest.current = { state, repeat, speed };
  });

  const update = (patch: Partial<RecitationState>) =>
    setState((s) => {
      const next = { ...s, ...patch };
      return (Object.keys(patch) as (keyof RecitationState)[]).some((k) => s[k] !== next[k])
        ? next
        : s;
    });

  const onStatus = (status: AudioStatus) => {
    const p = player.current;
    if (!p) return;
    if (status.isLoaded && pending.current) {
      const { seek } = pending.current;
      pending.current = null;
      // A last ayah without a usable end runs to the recording's real end.
      if (status.duration > 0) {
        spans.current = withRecordingEnd(spans.current, status.duration * 1000);
      }
      void p.seekTo(seek).then(() => p.play());
      update({ loading: false, playing: true });
      return;
    }
    if (status.didJustFinish) {
      plan.current = null;
      update({ playing: false, passage: null });
      return;
    }
    if (inTurn.current) return;
    const ms = status.currentTime * 1000;
    const passage = plan.current;
    const result = playbackStep(
      spans.current,
      ms,
      cursor.current,
      {
        repeat: latest.current.repeat,
        range: passage ? { from: passage.from, to: passage.to, times: passage.times } : null,
        gap: passage?.gap ?? false,
      },
      MARGIN_MS,
    );
    cursor.current = result.cursor;
    const { step } = result;
    if (step.kind === 'seek') void p.seekTo(step.ms / 1000);
    if (step.kind === 'stop') {
      p.pause();
      plan.current = null;
      update({ playing: false, passage: null });
      return;
    }
    if (step.kind === 'gap') {
      // The listener's turn: wait as long as the ayah took at this speed, then go on.
      inTurn.current = true;
      p.pause();
      update({ turn: true });
      turnTimer.current = setTimeout(() => {
        inTurn.current = false;
        update({ turn: false });
        p.play();
      }, step.ms / latest.current.speed);
      return;
    }
    const index = ayahAtTime(spans.current, ms);
    const span = spans.current[index];
    update({
      ayah: index < 0 ? null : index + 1,
      word: span ? wordAtTime(span, ms) : null,
      playing: status.playing,
      loading: status.isBuffering && status.playing,
      passage: passage
        ? { from: passage.from, to: passage.to, times: passage.times, pass: cursor.current.pass }
        : null,
    });
  };

  const ensurePlayer = () => {
    if (!player.current) {
      // Ten updates a second keep the word highlight close to the voice.
      player.current = createAudioPlayer(null, { updateInterval: 100 });
      player.current.addListener('playbackStatusUpdate', onStatus);
    }
    return player.current;
  };

  useEffect(() => {
    // Keep playing with the screen off, and own the audio while reciting (lock screen controls
    // need it).
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    return () => {
      player.current?.remove();
      player.current = null;
    };
  }, []);

  useEffect(() => {
    player.current?.setPlaybackRate(speed);
  }, [speed]);

  const play = (surah: number, fromAyah = 1, passage?: PassagePlan) => {
    const p = ensurePlayer();
    endTurn();
    plan.current = passage ? { ...passage, from: fromAyah } : null;
    cursor.current = startCursor();
    update({
      surah,
      ayah: fromAyah,
      word: null,
      loading: true,
      error: false,
      playing: false,
      turn: false,
      passage: passage ? { from: fromAyah, to: passage.to, times: passage.times, pass: 1 } : null,
    });
    loadTimings(reciter, surah)
      .then((timings) => {
        spans.current = playbackSpans(timings);
        const span = spans.current[fromAyah - 1];
        pending.current = { seek: fromAyah > 1 && span ? span.start / 1000 : 0 };
        p.replace({ uri: recitationSource(reciter, surah) });
        p.setPlaybackRate(latest.current.speed);
        const s = surahInfo(surah);
        p.setActiveForLockScreen(
          true,
          {
            title: `${s.nameSimple} · ${s.nameArabic}`,
            artist: t(`reciters.${reciter}`),
            albumTitle: t('title'),
          },
          { showSeekForward: true, showSeekBackward: true },
        );
      })
      .catch(() => update({ loading: false, error: true }));
  };

  const pause = () => {
    endTurn();
    player.current?.pause();
    update({ playing: false, turn: false });
  };
  const resume = () => {
    if (!player.current || latest.current.state.surah === null) return;
    endTurn();
    player.current.play();
    update({ playing: true, error: false, turn: false });
  };
  const stop = () => {
    endTurn();
    plan.current = null;
    player.current?.pause();
    player.current?.setActiveForLockScreen(false);
    setState(idle);
  };
  const step = (by: 1 | -1) => {
    const { surah, ayah } = latest.current.state;
    if (surah === null || !player.current) return;
    const target = Math.min(surahInfo(surah).ayahCount, Math.max(1, (ayah ?? 1) + by));
    const span = spans.current[target - 1];
    if (!span) return;
    // Stepping out of a passage ends it.
    const passage = plan.current;
    if (passage && (target < passage.from || target > passage.to)) plan.current = null;
    cursor.current = {
      ...cursor.current,
      ayah: target - 1,
      left: latest.current.repeat - 1,
      gapped: -1,
    };
    void player.current.seekTo(span.start / 1000);
    update({ ayah: target, word: null, ...(plan.current ? {} : { passage: null }) });
  };

  return (
    <RecitationContext value={{ ...state, reciter, play, pause, resume, stop, step }}>
      {children}
    </RecitationContext>
  );
}
