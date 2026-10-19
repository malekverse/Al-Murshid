'use client';

import { audioUrl, loadTimings, reciterIds, type ReciterId } from '@murshid/content/quran';
import { playbackSpans, withRecordingEnd } from '@murshid/core';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import {
  checkAyahs,
  decodeAudio,
  loadRecognizer,
  precisions,
  type CheckedWord,
  type Precision,
} from '@/lib/recitation-check';

// A developer's bench for the recitation check (English only, never shipped): a reciter's own
// recording of a passage stands in for a reader, optionally with one word cut out to stand in for
// a slip; the model's transcript is lined up with the published words, and the time it took shown.

interface Run {
  words: CheckedWord[];
  transcript: string;
  seconds: { audio: number; load: number; recognize: number };
}

const markClass: Record<CheckedWord['mark'], string> = {
  recited: '',
  skipped: 'underline decoration-dotted decoration-2 text-ink-muted',
  different: 'rounded-control bg-lantern/25',
  unreached: 'text-ink-muted',
};

export function Harness() {
  const [surah, setSurah] = useState(112);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(4);
  const [reciter, setReciter] = useState<ReciterId>('afasy');
  const [drop, setDrop] = useState(0);
  const [precision, setPrecision] = useState<Precision>('q4');
  const [status, setStatus] = useState('');
  const [run, setRun] = useState<Run | null>(null);

  const go = async () => {
    setRun(null);
    try {
      setStatus('Loading the recording…');
      const timings = await loadTimings(reciter, surah);
      const response = await fetch(audioUrl(reciter, surah));
      const all = await decodeAudio(await response.arrayBuffer());
      const spans = withRecordingEnd(playbackSpans(timings), (all.length / 16_000) * 1000);
      const at = (ms: number) => Math.min(all.length, Math.round((ms / 1000) * 16_000));
      let audio = all.slice(at(spans[from - 1]!.start), at(spans[to - 1]!.end));
      // Cut out one word of the passage (counted from 1 across its ayahs), when asked.
      if (drop > 0) {
        const words = spans
          .slice(from - 1, to)
          .flatMap((s) => [...new Map(s.words.map(([w, a, b]) => [w, [a, b] as const])).values()]);
        const word = words[drop - 1];
        if (word) {
          const offset = at(spans[from - 1]!.start);
          const [a, b] = [at(word[0]) - offset, at(word[1]) - offset];
          const cut = new Float32Array(audio.length - (b - a));
          cut.set(audio.subarray(0, a));
          cut.set(audio.subarray(b), a);
          audio = cut;
        }
      }
      setStatus('Loading the model…');
      const t0 = performance.now();
      const recognize = await loadRecognizer(
        (p) => setStatus(`Loading the model… ${Math.round(p * 100)}%`),
        precision,
      );
      const t1 = performance.now();
      setStatus('Listening…');
      const transcript = await recognize(audio);
      const t2 = performance.now();
      setRun({
        words: await checkAyahs(surah, from, to, transcript),
        transcript,
        seconds: {
          audio: audio.length / 16_000,
          load: (t1 - t0) / 1000,
          recognize: (t2 - t1) / 1000,
        },
      });
      setStatus('');
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const field =
    'min-h-touch rounded-control border border-hairline bg-surface px-3 text-body text-ink';
  return (
    <main id="main" className="mx-auto flex max-w-reading flex-col gap-6 px-4 py-8" dir="ltr">
      <Text as="h1" role="title2">
        Recitation check · bench
      </Text>
      <div className="flex flex-wrap items-end gap-3">
        {(
          [
            ['Surah', surah, setSurah],
            ['From', from, setFrom],
            ['To', to, setTo],
            ['Drop word', drop, setDrop],
          ] as const
        ).map(([label, value, set]) => (
          <label key={label} className="flex flex-col gap-1">
            <Text as="span" role="caption" tone="muted">
              {label}
            </Text>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              className={cn(field, 'w-24')}
            />
          </label>
        ))}
        <label className="flex flex-col gap-1">
          <Text as="span" role="caption" tone="muted">
            Reciter
          </Text>
          <select
            value={reciter}
            onChange={(e) => setReciter(e.target.value as ReciterId)}
            className={field}
          >
            {reciterIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <Text as="span" role="caption" tone="muted">
            Weights
          </Text>
          <select
            value={precision}
            onChange={(e) => setPrecision(e.target.value as Precision)}
            className={field}
          >
            {Object.keys(precisions).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={go}>Check</Button>
      </div>
      {status && (
        <Text role="callout" tone="muted" aria-live="polite">
          {status}
        </Text>
      )}
      {run && (
        <section className="flex flex-col gap-4" data-testid="result">
          <p lang="ar" dir="rtl" className="font-quran text-quran text-ink">
            {run.words.map((w, i) => (
              <span key={i}>
                <span className={markClass[w.mark]} data-mark={w.mark}>
                  {w.text}
                </span>{' '}
              </span>
            ))}
          </p>
          <Text role="caption" tone="muted" data-testid="timing">
            {`audio ${run.seconds.audio.toFixed(1)} s · model load ${run.seconds.load.toFixed(1)} s · recognition ${run.seconds.recognize.toFixed(1)} s`}
          </Text>
          <Text role="caption" tone="muted" lang="ar" dir="rtl" data-testid="transcript">
            {run.transcript}
          </Text>
        </section>
      )}
    </main>
  );
}
