// Store screenshots (SPEC 6.7, Phase 7c): "the day in five lights". Each frame is a real screen of
// the app over its prayer's sky, with one short line from the landing page (already written in
// every language). The screens come from the iOS Simulator run (its ios-simulator-screens
// artifact names them <locale>-<theme>-<screen>.png) or the Android emulator, named the same way.
//
//   pnpm --filter @murshid/web store -- --screens <folder> --platform ios|android [--out <folder>]
//
// A frame whose screen is missing is left out, and the run says which.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { glassToneFor, colors, periodSun, skyAt, type SkyPeriod } from '@murshid/tokens';

const { values } = parseArgs({
  options: {
    screens: { type: 'string' },
    platform: { type: 'string', default: 'ios' },
    out: { type: 'string' },
  },
});
const folder = values.screens ?? '';
if (!folder) throw new Error('--screens <folder> is required');
const platform = values.platform === 'android' ? 'android' : 'ios';
const root = resolve(import.meta.dirname, '../../..');
const out = resolve(values.out ?? join(root, 'design/store/out', platform));

/** Store sizes: App Store 6.7-inch, Google Play phone. */
const size = platform === 'ios' ? { width: 1290, height: 2796 } : { width: 1080, height: 1920 };

/** The day in order, each frame's screen, sky and line (about.json). */
const frames: { screen: string; sky: SkyPeriod; line: string }[] = [
  { screen: 'light-today', sky: 'sunrise', line: 'hero.title' },
  { screen: 'light-quran', sky: 'dhuhr', line: 'moments.dhuhr.title' },
  { screen: 'light-tasbih', sky: 'asr', line: 'moments.asr.title' },
  { screen: 'light-you', sky: 'maghrib', line: 'moments.maghrib.title' },
  { screen: 'dark-today', sky: 'night', line: 'moments.isha.title' },
  { screen: 'dark-privacy', sky: 'night', line: 'promise.title' },
  { screen: 'dark-quran', sky: 'fajr', line: 'everywhere.title' },
  { screen: 'rise-ring', sky: 'fajr', line: 'moments.fajr.title' },
];

/** Every png under the folder, by file name. */
function screensIn(folder: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const name of readdirSync(folder)) {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) for (const [k, v] of screensIn(path)) found.set(k, v);
    else if (name.endsWith('.png')) found.set(name.slice(0, -4), path);
  }
  return found;
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const dataUrl = (path: string, type: string) =>
  `data:${type};base64,${readFileSync(path).toString('base64')}`;

const fontFiles = join(root, 'node_modules/@fontsource/readex-pro/files');
const fontFace = ['arabic', 'latin', 'latin-ext']
  .map(
    (subset) =>
      `@font-face{font-family:Readex;font-weight:600;src:url(${dataUrl(
        join(fontFiles, `readex-pro-${subset}-600-normal.woff`),
        'font/woff',
      )}) format('woff')}`,
  )
  .join('');

function line(locale: string, key: string): string {
  const messages = JSON.parse(
    readFileSync(join(root, `packages/i18n/messages/${locale}/about.json`), 'utf8'),
  ) as Record<string, unknown>;
  const value = key
    .split('.')
    .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages);
  if (typeof value !== 'string') throw new Error(`No line ${key} in ${locale}`);
  return value;
}

function html(locale: string, screen: string, period: SkyPeriod, text: string): string {
  const sky = skyAt(periodSun[period]);
  const ink = colors[glassToneFor(sky.top)].ink;
  const { width, height } = size;
  const shot = platform === 'ios' ? 0.78 : 0.68;
  return `<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><style>
${fontFace}
*{margin:0;box-sizing:border-box}
body{width:${width}px;height:${height}px;overflow:hidden;font-family:Readex,sans-serif;
  background:linear-gradient(${sky.top},${sky.bottom});display:flex;flex-direction:column;
  align-items:center;gap:${Math.round(height * 0.035)}px;padding-top:${Math.round(height * 0.07)}px}
h1{color:${ink};font-weight:600;font-size:${Math.round(width * 0.066)}px;line-height:1.3;
  text-align:center;max-width:${Math.round(width * 0.84)}px;text-wrap:balance}
img{width:${Math.round(width * shot)}px;border-radius:${Math.round(width * shot * 0.075)}px;
  box-shadow:0 ${Math.round(width * 0.02)}px ${Math.round(width * 0.06)}px rgba(0,0,0,.28);
  outline:${Math.max(2, Math.round(width * 0.003))}px solid rgba(255,255,255,.35)}
</style></head><body><h1>${escape(text)}</h1><img src="${dataUrl(screen, 'image/png')}"></body></html>`;
}

async function main() {
  const screens = screensIn(resolve(folder));
  const browser = await chromium.launch({ channel: 'chromium' });
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  for (const locale of ['ar', 'en', 'fr']) {
    let n = 0;
    for (const frame of frames) {
      // Fajr Rise's flow runs once, in English: its ring screen, else its challenge.
      const screen =
        screens.get(`${locale}-${frame.screen}`) ??
        (locale === 'en' ? (screens.get(frame.screen) ?? screens.get('rise-try')) : undefined);
      if (!screen) {
        console.log(`${platform} ${locale}: no ${frame.screen} screen, frame left out`);
        continue;
      }
      n++;
      await page.setContent(html(locale, screen, frame.sky, line(locale, frame.line)));
      await page.evaluate(() => document.fonts.ready);
      const file = join(out, locale, `${n}-${frame.screen}.png`);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file });
    }
    if (n) console.log(`${platform} ${locale}: ${n} frames in ${join(out, locale)}`);
  }
  await browser.close();
  if (!existsSync(out)) console.log('No frames made: check --screens.');
}

void main();
