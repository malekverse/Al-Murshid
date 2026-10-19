'use client';

import { ayahWords, loadSurahText, normalizeArabic } from '@murshid/content/quran';
import { checkRecitation, type WordCheck } from '@murshid/core';

// The recitation check (Phase 5b, a prototype until its go or no-go: docs/PHASE-5B.md). A speech
// model fine-tuned on recitation (tarteel-ai/whisper-base-ar-quran, Apache-2.0, as ONNX) runs in
// this browser through Transformers.js; the audio never leaves the device. Its transcript is only
// lined up with the published words (@murshid/core checkRecitation) and is never shown.

/** The model, converted to ONNX for Transformers.js (Apache-2.0, like the original). */
export const MODEL = 'YunusZJ/whisper-base-ar-quran-ONNX';
/**
 * The weights to load. The smallest that work are 4-bit (the 8-bit merged decoder is not actually
 * smaller); the bench also measures full precision, to tell the model's errors from rounding's.
 */
export const precisions = {
  q4: { encoder_model: 'q4', decoder_model_merged: 'q4' },
  'fp32-encoder': { encoder_model: 'fp32', decoder_model_merged: 'q4' },
  fp32: { encoder_model: 'fp32', decoder_model_merged: 'fp32' },
} as const;
export type Precision = keyof typeof precisions;
/** About the download, once, at 4 bits. */
export const MODEL_MB = 159;

type Recognizer = (audio: Float32Array) => Promise<string>;
const recognizers = new Map<Precision, Promise<Recognizer>>();

/** Loads the model once (downloading it the first time); `onProgress` gets 0 to 1. */
export function loadRecognizer(
  onProgress?: (done: number) => void,
  precision: Precision = 'q4',
): Promise<Recognizer> {
  let recognizer = recognizers.get(precision);
  recognizer ??= (async () => {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    const files = new Map<string, { loaded: number; total: number }>();
    const asr = await pipeline('automatic-speech-recognition', MODEL, {
      dtype: precisions[precision],
      device: 'wasm',
      progress_callback: (p: {
        status: string;
        file?: string;
        loaded?: number;
        total?: number;
      }) => {
        if (p.status !== 'progress' || !p.file || !p.total) return;
        files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
        let loaded = 0;
        let total = 0;
        for (const f of files.values()) {
          loaded += f.loaded;
          total += f.total;
        }
        onProgress?.(total ? loaded / total : 0);
      },
    });
    return async (audio: Float32Array) => {
      const out = (await asr(audio, {
        language: 'arabic',
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
      })) as { text: string } | { text: string }[];
      return Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text;
    };
  })();
  recognizers.set(precision, recognizer);
  // A failed download may succeed later.
  recognizer.catch(() => recognizers.delete(precision));
  return recognizer;
}

/** Audio as the model hears it: one channel at 16 kHz. */
export async function decodeAudio(data: ArrayBuffer): Promise<Float32Array> {
  const context = new AudioContext({ sampleRate: 16_000 });
  try {
    const buffer = await context.decodeAudioData(data);
    return buffer.getChannelData(0);
  } finally {
    void context.close();
  }
}

export interface CheckedWord {
  surah: number;
  ayah: number;
  /** The published word, as shown. */
  text: string;
  mark: WordCheck;
}

/**
 * Checks a recitation of ayahs `from` to `to` of a surah: what was heard, lined up with the
 * published words (without the ayah numbers), each marked recited, skipped, different or not
 * reached.
 */
export async function checkAyahs(
  surah: number,
  from: number,
  to: number,
  transcript: string,
): Promise<CheckedWord[]> {
  const text = await loadSurahText(surah);
  const words: Omit<CheckedWord, 'mark'>[] = [];
  for (let ayah = from; ayah <= to; ayah++) {
    for (const w of ayahWords(text, ayah).slice(0, -1)) words.push({ surah, ayah, text: w.text });
  }
  const heard = transcript.split(/\s+/).map(normalizeArabic).filter(Boolean);
  const marks = checkRecitation(
    words.map((w) => normalizeArabic(w.text)),
    heard,
  );
  return words.map((w, i) => ({ ...w, mark: marks[i]! }));
}
