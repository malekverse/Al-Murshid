import type { SurahName } from '@murshid/content/quran';
import { colors } from '@murshid/tokens';
import { ImageResponse } from 'next/og';
import { shapeLine, wrap, type Face, type Line } from './text';

// The share images of the public pages (Phase 6), in Quiet Light: the page's own colors on its
// canvas, the name of the app with its lantern mark, and what the page holds. Drawn as one SVG
// (text shaped in text.ts) that next/og turns into a PNG.

export const size = { width: 1200, height: 630 };
const W = size.width;
const H = size.height;
const PAD = 80;
const c = colors.light;

type Align = 'start' | 'center';

interface Frame {
  rtl: boolean;
  brand: string;
  footer?: string;
}

/** A line placed on the image: aligned to the start side of the language, or centered. */
function place(line: Line, baseline: number, align: Align, rtl: boolean): string {
  const x = align === 'center' ? (W - line.width) / 2 : rtl ? W - PAD - line.width : PAD;
  return `<g transform="translate(${x.toFixed(1)} ${baseline.toFixed(1)})">${line.svg}</g>`;
}

function text(
  value: string,
  face: Face,
  px: number,
  fill: string,
  baseline: number,
  align: Align,
  rtl: boolean,
) {
  return place(shapeLine(value, face, px, fill), baseline, align, rtl);
}

/** The frame: the canvas, the lantern mark and the app's name above, a line of context below. */
function frame({ rtl, brand, footer }: Frame, body: string): string {
  const mark = rtl ? W - PAD - 56 : PAD;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect width="${W}" height="${H}" fill="${c.canvas}"/>`,
    `<rect x="${mark}" y="${PAD - 8}" width="56" height="6" rx="3" fill="${c.lantern}"/>`,
    text(brand, 'ui-medium', 30, c.lanternInk, PAD + 40, 'start', rtl),
    body,
    footer ? text(footer, 'ui', 26, c.inkMuted, H - PAD + 10, 'start', rtl) : '',
    '</svg>',
  ].join('');
}

/** A surah's calligraphic name from its outline, centered, `height` pixels tall. */
function calligraphy(name: SurahName, centerY: number, height: number): string {
  const scale = height / (name.ascender - name.descender);
  const width = name.width * scale;
  const x = (W - width) / 2;
  const top = centerY - height / 2;
  const glyphs = name.glyphs
    .map(([gx, gy, d]) => `<path d="${d}" transform="translate(${gx} ${-gy}) scale(1 -1)"/>`)
    .join('');
  return `<g fill="${c.ink}" transform="translate(${x.toFixed(1)} ${(top + name.ascender * scale).toFixed(1)}) scale(${scale.toFixed(5)})">${glyphs}</g>`;
}

export function surahCard(f: Frame & { name: SurahName; title: string; meta: string }): string {
  return frame(
    f,
    [
      calligraphy(f.name, 280, 190),
      text(f.title, 'ui-medium', 52, c.ink, 450, 'center', f.rtl),
      text(f.meta, 'ui', 30, c.inkMuted, 500, 'center', f.rtl),
    ].join(''),
  );
}

/**
 * An ayah: its published text when it fits in four lines, else the surah's name and the ayah's
 * reference. The text is never cut short.
 */
export function ayahCard(f: Frame & { text: string; reference: string; name: SurahName }): string {
  for (const px of [52, 44, 38]) {
    const lines = wrap(f.text, 'quran', px, W - 2 * PAD, c.ink);
    const lineHeight = px * 1.9;
    if (lines.length <= 4 && lines.length * lineHeight <= 330) {
      const top = 320 - (lines.length * lineHeight) / 2 + px;
      return frame(
        f,
        [
          ...lines.map((l, i) => place(l, top + i * lineHeight, 'center', true)),
          text(f.reference, 'ui-medium', 32, c.lanternInk, 520, 'center', f.rtl),
        ].join(''),
      );
    }
  }
  return frame(
    f,
    [
      calligraphy(f.name, 280, 190),
      text(f.reference, 'ui-medium', 48, c.ink, 470, 'center', f.rtl),
    ].join(''),
  );
}

/** A city: today's five prayers in a row, under the title. */
export function cityCard(
  f: Frame & { title: string; subtitle: string; prayers: { name: string; time: string }[] },
): string {
  const cols = f.rtl ? [...f.prayers].reverse() : f.prayers;
  const colWidth = (W - 2 * PAD) / cols.length;
  const columns = cols
    .map((p, i) => {
      const cx = PAD + colWidth * i + colWidth / 2;
      const name = shapeLine(p.name, 'ui', 28, c.inkMuted);
      const time = shapeLine(p.time, 'ui-medium', 40, c.ink);
      return [
        `<g transform="translate(${(cx - name.width / 2).toFixed(1)} 430)">${name.svg}</g>`,
        `<g transform="translate(${(cx - time.width / 2).toFixed(1)} 485)">${time.svg}</g>`,
      ].join('');
    })
    .join('');
  const title = wrap(f.title, 'ui-medium', 60, W - 2 * PAD, c.ink).slice(0, 2);
  return frame(
    f,
    [
      ...title.map((l, i) => place(l, 230 + i * 74, 'start', f.rtl)),
      text(f.subtitle, 'ui', 30, c.inkMuted, 230 + title.length * 74 - 20, 'start', f.rtl),
      `<rect x="${PAD}" y="380" width="${W - 2 * PAD}" height="2" fill="${c.hairline}"/>`,
      columns,
    ].join(''),
  );
}

/** A page of links (all countries, a country's cities): its title and what it offers. */
export function textCard(f: Frame & { title: string; body: string }): string {
  const title = wrap(f.title, 'ui-medium', 64, W - 2 * PAD, c.ink).slice(0, 2);
  const body = wrap(f.body, 'ui', 32, W - 2 * PAD, c.inkMuted).slice(0, 3);
  return frame(
    f,
    [
      ...title.map((l, i) => place(l, 270 + i * 80, 'start', f.rtl)),
      ...body.map((l, i) => place(l, 270 + title.length * 80 + 10 + i * 46, 'start', f.rtl)),
    ].join(''),
  );
}

/** The PNG for an image drawn as SVG. */
export function png(svg: string): ImageResponse {
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>.
    <img src={src} width={W} height={H} alt="" />,
    size,
  );
}
