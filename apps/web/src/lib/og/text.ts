import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import * as hb from 'harfbuzzjs';

// Text for the share images (Phase 6), drawn as outlines: Satori, which next/og uses, cannot join
// Arabic letters or order right-to-left lines, so every line is shaped here with HarfBuzz and
// becomes SVG paths. Arabic runs use Readex Pro's Arabic subset, or the King Fahd Complex's Hafs
// font for Quran text; Latin runs use Readex Pro. The fonts are read, never changed; they are
// read from the app's folder (next.config ships them with these routes).

/** A WOFF (1.0) file's tables, unpacked into the TrueType/OpenType file HarfBuzz reads. */
function woffToSfnt(woff: Buffer): Buffer {
  const numTables = woff.readUInt16BE(12);
  const tables: { tag: number; checksum: number; data: Buffer }[] = [];
  for (let i = 0; i < numTables; i++) {
    const at = 44 + i * 20;
    const offset = woff.readUInt32BE(at + 4);
    const compLength = woff.readUInt32BE(at + 8);
    const origLength = woff.readUInt32BE(at + 12);
    const raw = woff.subarray(offset, offset + compLength);
    tables.push({
      tag: woff.readUInt32BE(at),
      checksum: woff.readUInt32BE(at + 16),
      data: compLength < origLength ? inflateSync(raw) : raw,
    });
  }
  const header = 12 + numTables * 16;
  const size = tables.reduce((n, t) => n + Math.ceil(t.data.length / 4) * 4, header);
  const out = Buffer.alloc(size);
  out.writeUInt32BE(woff.readUInt32BE(4), 0); // flavor
  out.writeUInt16BE(numTables, 4);
  const pow = 2 ** Math.floor(Math.log2(numTables));
  out.writeUInt16BE(pow * 16, 6);
  out.writeUInt16BE(Math.log2(pow), 8);
  out.writeUInt16BE(numTables * 16 - pow * 16, 10);
  let offset = header;
  tables.forEach((t, i) => {
    out.writeUInt32BE(t.tag, 12 + i * 16);
    out.writeUInt32BE(t.checksum, 16 + i * 16);
    out.writeUInt32BE(offset, 20 + i * 16);
    out.writeUInt32BE(t.data.length, 24 + i * 16);
    t.data.copy(out, offset);
    offset += Math.ceil(t.data.length / 4) * 4;
  });
  return out;
}

export type Face = 'ui' | 'ui-medium' | 'quran';
/** Readex Pro comes in subsets: Arabic, basic Latin (with digits), and extended Latin. */
type Script = 'arabic' | 'latin' | 'latinExt';

const readex = (subset: 'arabic' | 'latin' | 'latin-ext', weight: 400 | 600) => () =>
  woffToSfnt(
    readFileSync(
      join(
        process.cwd(),
        '../../node_modules/@fontsource/readex-pro/files',
        `readex-pro-${subset}-${weight}-normal.woff`,
      ),
    ),
  );

const files: Record<Face, Record<Script, () => Buffer>> = {
  ui: {
    arabic: readex('arabic', 400),
    latin: readex('latin', 400),
    latinExt: readex('latin-ext', 400),
  },
  'ui-medium': {
    arabic: readex('arabic', 600),
    latin: readex('latin', 600),
    latinExt: readex('latin-ext', 600),
  },
  quran: {
    // The pinned TTF (sources.json); the web app's WOFF2 is the same font.
    arabic: () => readFileSync(join(process.cwd(), '../mobile/assets/fonts/UthmanicHafs_V22.ttf')),
    latin: readex('latin', 400),
    latinExt: readex('latin-ext', 400),
  },
};

const fonts = new Map<string, { font: hb.Font; upem: number }>();
function fontFor(face: Face, script: Script) {
  const key = `${face}:${script}`;
  let f = fonts.get(key);
  if (!f) {
    const bytes = files[face][script]();
    const hbFace = new hb.Face(new hb.Blob(new Uint8Array(bytes)));
    f = { font: new hb.Font(hbFace), upem: hbFace.upem };
    fonts.set(key, f);
  }
  return f;
}

// Script_Extensions, not Script: the tatweel and the harakat are shared with other scripts.
const ARABIC = /\p{Script_Extensions=Arabic}/u;
/** What Readex Pro's basic Latin subset holds (its unicode-range, roughly). */
const isBasicLatin = (ch: string) => {
  const cp = ch.codePointAt(0)!;
  return cp <= 0xff || (cp >= 0x2000 && cp <= 0x206f) || cp === 0x20ac;
};
const STRONG = /[\p{L}\p{N}]/u;

type Dir = 'rtl' | 'ltr';
interface Run {
  text: string;
  font: Script;
  dir: Dir;
}

/** Whether a font draws every character of `text` (no missing glyph). */
function draws(face: Face, script: Script, text: string): boolean {
  const { font } = fontFor(face, script);
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  return buffer.getGlyphInfos().every((g) => g.codepoint !== 0);
}

/**
 * The line cut into runs of one font and one direction, in reading order. Letters and digits
 * decide the direction (Arabic right to left, Latin left to right); spaces and punctuation take
 * the direction of the letters around them, or the line's when those differ, and the font beside
 * them that draws them (a simplified Unicode bidi algorithm, enough for titles and times).
 */
function runs(text: string, face: Face, base: Dir): Run[] {
  // Quran text is shaped whole with the Hafs font: its marks, signs and numbers belong together.
  if (face === 'quran' && [...text].every((ch) => ARABIC.test(ch) || !STRONG.test(ch))) {
    return [{ text, font: 'arabic', dir: 'rtl' }];
  }
  type Raw = { text: string; font: Script | null; dir: Dir | null };
  const raw: Raw[] = [];
  for (const ch of text) {
    const arabic = ARABIC.test(ch);
    const strong = STRONG.test(ch);
    const font: Script | null = arabic
      ? 'arabic'
      : !strong
        ? null
        : isBasicLatin(ch)
          ? 'latin'
          : 'latinExt';
    const dir: Dir | null = strong ? (arabic ? 'rtl' : 'ltr') : null;
    const last = raw.at(-1);
    if (last && last.font === font && last.dir === dir) last.text += ch;
    else raw.push({ text: ch, font, dir });
  }
  const strongDir = (from: number, step: 1 | -1): Dir | null => {
    for (let i = from; i >= 0 && i < raw.length; i += step) if (raw[i]!.dir) return raw[i]!.dir;
    return null;
  };
  const resolved: Run[] = raw.map((r, i) => {
    const before = strongDir(i - 1, -1);
    const after = strongDir(i + 1, 1);
    const dir = r.dir ?? (before && before === after ? before : base);
    const neighbours = [raw[i - 1]?.font, raw[i + 1]?.font, 'latin' as Script].filter(
      (f): f is Script => Boolean(f),
    );
    const font = r.font ?? neighbours.find((f) => draws(face, f, r.text)) ?? 'latin';
    return { text: r.text, font, dir };
  });
  // Neighbours alike become one run (shaped together).
  const merged: Run[] = [];
  for (const r of resolved) {
    const last = merged.at(-1);
    if (last && last.font === r.font && last.dir === r.dir) last.text += r.text;
    else merged.push({ ...r });
  }
  // Visual order (bidi rule L2): in a right-to-left line, left-to-right stretches keep their
  // order while the line runs from right to left; in a left-to-right line, right-to-left
  // stretches are reversed in place.
  const reverseStretches = (list: Run[], dir: Dir) => {
    const out: Run[] = [];
    for (let i = 0; i < list.length;) {
      if (list[i]!.dir !== dir) {
        out.push(list[i]!);
        i++;
        continue;
      }
      let j = i;
      while (j < list.length && list[j]!.dir === dir) j++;
      out.push(...list.slice(i, j).reverse());
      i = j;
    }
    return out;
  };
  return base === 'rtl'
    ? reverseStretches(merged, 'ltr').reverse()
    : reverseStretches(merged, 'rtl');
}

export interface Line {
  /** Width in pixels at the size asked for. */
  width: number;
  /** SVG for the line, its pen starting at x = 0 on the baseline y = 0. */
  svg: string;
}

/** One line, shaped and laid out in reading order (right to left when it starts in Arabic). */
export function shapeLine(text: string, face: Face, size: number, fill: string): Line {
  const first = [...text].find((ch) => STRONG.test(ch));
  const base: Dir = first && ARABIC.test(first) ? 'rtl' : 'ltr';
  let x = 0;
  const groups = runs(text, face, base).map((run) => {
    const { font, upem } = fontFor(face, run.font);
    const buffer = new hb.Buffer();
    buffer.addText(run.text);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const scale = size / upem;
    const infos = buffer.getGlyphInfos();
    const positions = buffer.getGlyphPositions();
    // HarfBuzz returns right-to-left runs already in visual order.
    let pen = 0;
    const paths: string[] = [];
    infos.forEach((info, i) => {
      const p = positions[i]!;
      const d = font.glyphToPath(info.codepoint);
      const gx = (pen + p.xOffset) * scale;
      const gy = -p.yOffset * scale;
      if (d) {
        paths.push(
          `<path d="${d}" transform="translate(${gx.toFixed(1)} ${gy.toFixed(1)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})"/>`,
        );
      }
      pen += p.xAdvance;
    });
    const g = `<g transform="translate(${x.toFixed(1)} 0)">${paths.join('')}</g>`;
    x += pen * scale;
    return g;
  });
  return { width: x, svg: `<g fill="${fill}">${groups.join('')}</g>` };
}

/** The text in lines of at most `maxWidth`, broken between words. */
export function wrap(
  text: string,
  face: Face,
  size: number,
  maxWidth: number,
  fill: string,
): Line[] {
  // Ordinary spaces only: a no-break space (the published text's, before an ayah's number) holds.
  const words = text.split(/ +/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && shapeLine(next, face, size, fill).width > maxWidth) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines.map((l) => shapeLine(l, face, size, fill));
}
