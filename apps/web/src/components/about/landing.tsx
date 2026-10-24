import {
  Alarm,
  DeviceMobile,
  GlobeHemisphereWest,
  LockSimple,
  ProhibitInset,
  ShieldCheck,
  UserCircleMinus,
} from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import { ayahWords, loadSurahText } from '@murshid/content/quran';
import type { Locale } from '@murshid/i18n';
import {
  colors,
  glassToneFor,
  paperScene,
  periodSun,
  skyAt,
  starlight,
  typeScale,
  type PrayerName,
} from '@murshid/tokens';
import { getTranslations } from 'next-intl/server';
import { Fragment, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button-markup';
import { Mark } from '@/components/ui/mark';
import { PaperScene } from '@/components/ui/paper-scene';
import { PrayerGlyph } from '@/components/ui/prayer-glyph';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { LiveSky } from './live-sky';
import { TasbihDemo } from './tasbih-demo';

// The landing page (SPEC 4, Phase 7c): a day you scroll through. The live sky first, then one
// section per prayer moment, each under its own sky with something real in it, then the privacy
// promise and the way in. Server-rendered, with two small islands (the sky and the tasbih).

type Moment = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

/** Paper and light (SPEC 6.7) after the evening: the night's sky over each theme's paper. */
const night = (theme: 'light' | 'dark') =>
  paperScene(
    'landing',
    skyAt(periodSun.night),
    periodSun.night,
    colors[theme].canvas,
    starlight,
    colors[theme].lantern,
    { width: 1200, height: 260 },
  );

// Until Readex Pro is ready in the page's script, 2 s at most, the first card stays hidden
// (globals.css), as the Quran pages wait for their font: the heading takes its real width while
// nothing is visible.
const hideUntilUiFont = `(function(){var d=document.documentElement,f=document.fonts;if(!f||!f.load)return;d.setAttribute('data-ui-font','pending');var show=function(){d.removeAttribute('data-ui-font')};var done=function(){requestAnimationFrame(function(){requestAnimationFrame(show)})};f.load('600 1em "Readex Pro"',d.lang==='ar'?'\u0639':'a').then(done,done);setTimeout(show,2000)})()`;

/** The sky band of each moment: literal class names, so Tailwind sees them. */
const band: Record<Moment, string> = {
  fajr: 'bg-linear-to-b from-sky-fajr-top to-sky-fajr-bottom',
  dhuhr: 'bg-linear-to-b from-sky-fajr-bottom via-sky-dhuhr-top via-25% to-sky-dhuhr-bottom',
  asr: 'bg-linear-to-b from-sky-dhuhr-bottom via-sky-asr-top via-25% to-sky-asr-bottom',
  maghrib: 'bg-linear-to-b from-sky-asr-bottom via-sky-maghrib-top via-25% to-sky-maghrib-bottom',
  isha: 'bg-linear-to-b from-sky-maghrib-bottom via-sky-night-top via-25% to-sky-night-bottom',
};
const period: Record<Moment, keyof typeof periodSun> = {
  fajr: 'fajr',
  dhuhr: 'dhuhr',
  asr: 'asr',
  maghrib: 'maghrib',
  isha: 'night',
};
/** Glass over each band takes the band's tone, so its text keeps its contrast (SPEC 6.1). */
const tone = (m: Moment) => glassToneFor(skyAt(periodSun[period[m]]).bottom);

function Section({
  moment,
  name,
  arabicName,
  title,
  body,
  demo,
  locale,
  reverse = false,
}: {
  moment: Moment;
  name: string;
  arabicName: string;
  title: string;
  body: string;
  demo: ReactNode;
  locale: Locale;
  reverse?: boolean;
}) {
  return (
    <section aria-labelledby={`moment-${moment}`} className={cn('relative', band[moment])}>
      <div
        data-theme={tone(moment)}
        className="mx-auto grid max-w-page items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24"
      >
        <div
          className={cn(
            'glass flex flex-col gap-4 rounded-card border border-hairline p-6 md:p-8',
            reverse && 'md:order-2',
          )}
        >
          <div className="flex items-center gap-3 text-ink-muted">
            <PrayerGlyph prayer={moment as PrayerName} size={28} />
            <Text as="span" role="callout" tone="muted">
              {name}
            </Text>
            {locale !== 'ar' && (
              <Text as="span" role="callout" tone="muted" script="arabic">
                {arabicName}
              </Text>
            )}
          </div>
          <Text as="h2" id={`moment-${moment}`} role="title1">
            {title}
          </Text>
          <Text role="body" tone="muted">
            {body}
          </Text>
        </div>
        <div className="flex justify-center">{demo}</div>
      </div>
    </section>
  );
}

/** A phone, drawn with the app's tokens: the demos sit in it as they do on a screen. */
function Phone({ children, theme }: { children: ReactNode; theme: 'light' | 'dark' }) {
  return (
    <div
      data-theme={theme}
      className="w-72 overflow-hidden rounded-sheet border-8 border-surface bg-canvas shadow-lift ring-1 ring-hairline"
    >
      <div className="flex min-h-128 flex-col gap-4 p-4">{children}</div>
    </div>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

async function RiseDemo({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'rise' });
  // Sums read left to right with the person's digits in the app; the sample uses Western digits.
  const sum = '47 + 13 =';
  return (
    <Phone theme="dark">
      <div className="flex items-center gap-2">
        <Alarm size={18} className="text-lantern-ink" aria-hidden />
        <Text as="span" role="callout" tone="lantern">
          {t('title')}
        </Text>
      </div>
      <Text role="display" className="tabular" dir="ltr">
        5:08
      </Text>
      <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4">
        <Text role="caption" tone="muted" className="text-center">
          {t('sums.prompt')}
        </Text>
        <p dir="ltr" className="text-center text-title-1 text-ink tabular">
          {sum} <span className="text-ink-muted">?</span>
        </p>
        <div dir="ltr" className="grid grid-cols-3 gap-2" aria-hidden>
          {KEYS.map((k) => (
            <span
              key={k}
              className={cn(
                'flex h-10 items-center justify-center rounded-control text-headline',
                k === '✓' ? 'bg-lantern text-on-lantern' : 'border border-hairline text-ink',
              )}
            >
              {k}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 pt-2">
        <Text as="span" role="callout" tone="muted">
          {t('ring.off')}
        </Text>
        <span className="h-1 w-24 overflow-hidden rounded-full bg-hairline">
          <span className="block h-full w-1/3 bg-lantern" />
        </span>
        <Text as="span" role="caption" tone="muted">
          {t('ring.offHint')}
        </Text>
      </div>
    </Phone>
  );
}

async function QuranDemo() {
  const fatiha = await loadSurahText(1);
  const size = typeScale.quran.arabic.size;
  return (
    <div
      data-theme="light"
      className="w-full max-w-md rounded-card border border-card-edge bg-surface p-6 shadow-card"
    >
      {/* The published text, untouched (SPEC 10), in the King Fahd Complex's font. */}
      <p
        lang="ar"
        dir="rtl"
        className="text-center font-quran text-ink"
        style={{ fontSize: size, lineHeight: typeScale.quran.arabic.lineHeight }}
      >
        {Array.from({ length: 7 }, (_, i) =>
          ayahWords(fatiha, i + 1).map((w, j) => (
            <Fragment key={`${i}-${j}`}>
              {w.text}
              {w.after || ' '}
            </Fragment>
          )),
        )}
      </p>
    </div>
  );
}

function SkyDemo() {
  // A sample month: days with lights glow, the others are plain night (SPEC 3, Your Sky).
  const lights = [
    5, 4, 5, 3, 5, 5, 2, 4, 5, 5, 5, 3, 1, 4, 5, 5, 4, 5, 5, 3, 5, 4, 5, 5, 0, 3, 5, 5,
  ];
  return (
    <div
      data-theme="dark"
      className="grid w-full max-w-sm grid-cols-7 gap-2 rounded-card bg-surface/60 p-4"
    >
      {lights.map((n, i) => (
        <span
          key={i}
          aria-hidden
          className="relative aspect-square overflow-hidden rounded-control bg-linear-to-b from-sky-night-top to-sky-night-bottom"
        >
          {n > 0 && (
            <span
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle, var(--color-lantern) 0%, transparent 65%)',
                opacity: n / 5,
              }}
            />
          )}
        </span>
      ))}
    </div>
  );
}

async function ReflectionDemo({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'reflection' });
  return (
    <div
      data-theme="dark"
      className="flex w-full max-w-md flex-col gap-4 rounded-card border border-hairline bg-surface p-6"
    >
      <div className="flex items-center gap-2 text-ink-muted">
        <LockSimple size={18} aria-hidden />
        <Text as="span" role="callout" tone="muted">
          {t('tonight')}
        </Text>
      </div>
      {(['gratitude', 'intention', 'note'] as const).map((field) => (
        <div key={field} className="flex flex-col gap-2">
          <Text as="span" role="caption" tone="muted">
            {t(`fields.${field}`)}
          </Text>
          <span className="h-10 rounded-control border border-hairline" />
        </div>
      ))}
    </div>
  );
}

function PromiseItem({ icon: IconComponent, children }: { icon: Icon; children: string }) {
  return (
    <li className="flex items-center gap-3 rounded-card border border-card-edge bg-surface p-4 shadow-card">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-lantern/10 text-lantern-ink">
        <IconComponent size={22} aria-hidden />
      </span>
      <Text as="span" role="body">
        {children}
      </Text>
    </li>
  );
}

export async function Landing({ locale }: { locale: Locale }) {
  const [t, tp] = await Promise.all([
    getTranslations({ locale, namespace: 'about' }),
    getTranslations({ locale, namespace: 'glossary.prayer' }),
  ]);
  const arabic = await getTranslations({ locale: 'ar', namespace: 'glossary.prayer' });
  const script = locale === 'ar' ? 'arabic' : 'latin';
  const app = `/${locale}`;
  const names = {
    fajr: tp('fajr'),
    dhuhr: tp('dhuhr'),
    asr: tp('asr'),
    maghrib: tp('maghrib'),
    isha: tp('isha'),
    jumuah: tp('jumuah'),
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <main id="main">
        <LiveSky
          locale={locale}
          labels={{
            next: t.raw('hero.next') as string,
            now: t.raw('hero.now') as string,
            place: t.raw('hero.place') as string,
            names,
          }}
        >
          <header>
            <nav
              aria-label={t('nav.label')}
              className="mx-auto flex max-w-page items-center gap-4 px-4 py-4"
            >
              <a href={`/${locale}/about`} className="flex items-center gap-2 text-ink">
                <Mark size={36} />
                <Text as="span" role="headline">
                  {t('nav.label')}
                </Text>
              </a>
              <span className="flex-1" />
              <a
                href={`/${locale}/prayer-times`}
                className="hidden min-h-touch items-center rounded-full px-4 text-ink hover:bg-ink/10 sm:flex"
              >
                <Text as="span" role="callout" tone="inherit">
                  {t('nav.prayerTimes')}
                </Text>
              </a>
              <a
                href={`/${locale}/quran/1`}
                className="hidden min-h-touch items-center rounded-full px-4 text-ink hover:bg-ink/10 sm:flex"
              >
                <Text as="span" role="callout" tone="inherit">
                  {t('nav.quran')}
                </Text>
              </a>
              <a href={app} className={buttonClass({ variant: 'primary', script })}>
                {t('nav.open')}
              </a>
            </nav>
          </header>
          {/* Runs before the card is parsed, so it is never painted in the fallback font. */}
          <script dangerouslySetInnerHTML={{ __html: hideUntilUiFont }} />
          <div className="mx-auto flex min-h-[80dvh] max-w-reading flex-col justify-end px-4 pt-12 pb-6">
            <div
              data-hero
              className="glass flex flex-col gap-5 rounded-sheet border border-hairline p-6 md:p-10"
            >
              <Text as="h1" role="display">
                {t('hero.title')}
              </Text>
              <Text role="body" tone="muted">
                {t('hero.body')}
              </Text>
              <div className="flex flex-wrap gap-3">
                <a href={app} className={buttonClass({ variant: 'primary', script })}>
                  {t('hero.open')}
                </a>
                <a
                  href={`/${locale}/prayer-times`}
                  className={buttonClass({ variant: 'secondary', script })}
                >
                  {t('hero.times')}
                </a>
              </div>
            </div>
          </div>
        </LiveSky>

        <div className="mx-auto flex max-w-reading flex-col gap-2 px-4 py-16 text-center">
          <Text as="h2" role="title1">
            {t('day.title')}
          </Text>
          <Text role="body" tone="muted">
            {t('day.body')}
          </Text>
        </div>

        <Section
          moment="fajr"
          name={tp('fajr')}
          arabicName={arabic('fajr')}
          title={t('moments.fajr.title')}
          body={t('moments.fajr.body')}
          demo={<RiseDemo locale={locale} />}
          locale={locale}
        />
        <Section
          moment="dhuhr"
          name={tp('dhuhr')}
          arabicName={arabic('dhuhr')}
          title={t('moments.dhuhr.title')}
          body={t('moments.dhuhr.body')}
          demo={<QuranDemo />}
          locale={locale}
          reverse
        />
        <Section
          moment="asr"
          name={tp('asr')}
          arabicName={arabic('asr')}
          title={t('moments.asr.title')}
          body={t('moments.asr.body')}
          demo={
            <div
              data-theme="light"
              className="w-full max-w-sm rounded-card border border-card-edge bg-surface shadow-card"
            >
              <TasbihDemo
                locale={locale}
                label={t.raw('moments.asr.count') as string}
                hint={t('moments.asr.tap')}
              />
            </div>
          }
          locale={locale}
        />
        <Section
          moment="maghrib"
          name={tp('maghrib')}
          arabicName={arabic('maghrib')}
          title={t('moments.maghrib.title')}
          body={t('moments.maghrib.body')}
          demo={<SkyDemo />}
          locale={locale}
          reverse
        />
        <Section
          moment="isha"
          name={tp('isha')}
          arabicName={arabic('isha')}
          title={t('moments.isha.title')}
          body={t('moments.isha.body')}
          demo={<ReflectionDemo locale={locale} />}
          locale={locale}
        />

        <section
          aria-labelledby="promise"
          className="mx-auto flex max-w-page flex-col gap-6 px-4 py-16"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-lantern-ink" aria-hidden />
            <Text as="h2" id="promise" role="title1">
              {t('promise.title')}
            </Text>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            <PromiseItem icon={ProhibitInset}>{t('promise.items.ads')}</PromiseItem>
            <PromiseItem icon={ShieldCheck}>{t('promise.items.trackers')}</PromiseItem>
            <PromiseItem icon={UserCircleMinus}>{t('promise.items.account')}</PromiseItem>
            <PromiseItem icon={DeviceMobile}>{t('promise.items.device')}</PromiseItem>
          </ul>
        </section>

        <div className="mx-auto max-w-page px-4 pb-16">
          <PaperScene
            scene={night('light')}
            id="landing-day"
            className="h-auto w-full dark:hidden"
          />
          <PaperScene
            scene={night('dark')}
            id="landing-night"
            className="hidden h-auto w-full dark:block"
          />
        </div>

        <section
          aria-labelledby="everywhere"
          className="mx-auto flex max-w-page flex-col gap-4 px-4 pb-16"
        >
          <div className="flex items-center gap-3">
            <GlobeHemisphereWest size={28} className="text-lantern-ink" aria-hidden />
            <Text as="h2" id="everywhere" role="title2">
              {t('everywhere.title')}
            </Text>
          </div>
          <Text role="body" tone="muted">
            {t('everywhere.body')}
          </Text>
          <p className="flex flex-wrap gap-2">
            {(
              [
                ['ar', 'العربية'],
                ['en', 'English'],
                ['fr', 'Français'],
              ] as const
            ).map(([code, label]) => (
              <a
                key={code}
                href={`/${code}/about`}
                lang={code}
                aria-current={code === locale ? 'page' : undefined}
                className={buttonClass({
                  variant: code === locale ? 'primary' : 'secondary',
                  script: code === 'ar' ? 'arabic' : 'latin',
                })}
              >
                {label}
              </a>
            ))}
          </p>
        </section>

        <section className={cn('relative px-4', band.fajr)} data-theme={tone('fajr')}>
          <div className="glass mx-auto my-24 flex max-w-reading flex-col items-center gap-5 rounded-sheet border border-hairline px-6 py-12 text-center">
            <Mark size={56} className="text-ink" />
            <Text as="h2" role="title1">
              {t('closing.title')}
            </Text>
            <a
              href={app}
              className={buttonClass({
                variant: 'primary',
                size: 'lg',
                script,
                className: 'max-w-sm',
              })}
            >
              {t('closing.open')}
            </a>
            <Text role="callout" tone="muted">
              {t('closing.stores')}
            </Text>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-page flex-col gap-2 px-4 py-8">
        <Text role="caption" tone="muted">
          {t('footer.sources')}
        </Text>
      </footer>
    </div>
  );
}
