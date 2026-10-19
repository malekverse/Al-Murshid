import { loadTimings, surah as surahInfo } from '@murshid/content/quran';
import { ayahAtTime, playbackSpans, wordAtTime, type AyahSpan } from '@murshid/core';
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
// timestamps, and repeats each ayah as often as asked.

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
  const { reciter, speed, repeat } = settings.quran;

  const player = useRef<AudioPlayer | null>(null);
  const spans = useRef<AyahSpan[]>([]);
  const repeats = useRef({ ayah: -1, left: 0 });
  const pending = useRef<{ seek: number } | null>(null);
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
      void p.seekTo(seek).then(() => p.play());
      update({ loading: false, playing: true });
      return;
    }
    if (status.didJustFinish) {
      update({ playing: false });
      return;
    }
    const ms = status.currentTime * 1000;
    const index = ayahAtTime(spans.current, ms);
    const span = spans.current[index];
    if (span && index !== repeats.current.ayah) {
      repeats.current = { ayah: index, left: latest.current.repeat - 1 };
    }
    const next = spans.current[index + 1];
    // At the end of an ayah that still has repeats, go back to its start.
    if (span && repeats.current.left > 0 && ms >= (next ? next.start : span.end) - 120) {
      repeats.current.left -= 1;
      void p.seekTo(span.start / 1000);
    }
    update({
      ayah: index < 0 ? null : index + 1,
      word: span ? wordAtTime(span, ms) : null,
      playing: status.playing,
      loading: status.isBuffering && status.playing,
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

  const play = (surah: number, fromAyah = 1) => {
    const p = ensurePlayer();
    update({ surah, ayah: fromAyah, word: null, loading: true, error: false, playing: false });
    repeats.current = { ayah: -1, left: 0 };
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
    player.current?.pause();
    update({ playing: false });
  };
  const resume = () => {
    if (!player.current || latest.current.state.surah === null) return;
    player.current.play();
    update({ playing: true, error: false });
  };
  const stop = () => {
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
    repeats.current = { ayah: target - 1, left: latest.current.repeat - 1 };
    void player.current.seekTo(span.start / 1000);
    update({ ayah: target, word: null });
  };

  return (
    <RecitationContext value={{ ...state, reciter, play, pause, resume, stop, step }}>
      {children}
    </RecitationContext>
  );
}
