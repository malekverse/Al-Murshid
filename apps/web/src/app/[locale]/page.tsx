import { isLocale } from '@murshid/i18n';
import {
  colors,
  contrastRatio,
  duration,
  glassToneFor,
  radius,
  sky,
  skyPeriods,
  space,
  spring,
  touchTarget,
  typeScale,
  uiRoles,
  type ColorTokens,
  type SkyPeriod,
} from '@murshid/tokens';
import type { Metadata } from 'next';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { PressDemo } from '@/components/press-demo';
import { ShowcaseControls } from '@/components/showcase-controls';
import { Text } from '@/components/ui/text';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'showcase.meta' });
  return { title: t('title'), description: t('description') };
}

// Phase 1 token showcase (SPEC 12). Today replaces this route in Phase 4.
export default function ShowcasePage() {
  const t = useTranslations('showcase');

  return (
    <main id="main" className="mx-auto max-w-page px-4 pt-12 pb-16 md:px-8 md:pt-16">
      <header className="flex flex-col gap-8 pb-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-reading flex-col gap-3">
          <Text role="callout" tone="lantern">
            {t('eyebrow')}
          </Text>
          <Text as="h1" role="display">
            {t('title')}
          </Text>
          <Text role="body" tone="muted">
            {t('intro')}
          </Text>
        </div>
        <ShowcaseControls />
      </header>

      <div className="flex flex-col gap-16">
        <Section title={t('sections.color')} hint={t('sections.colorHint')}>
          <ColorGrid />
        </Section>
        <Section title={t('sections.sky')} hint={t('sections.skyHint')}>
          <SkyGrid />
        </Section>
        <Section title={t('sections.type')} hint={t('sections.typeHint')}>
          <TypeSpecimens />
        </Section>
        <Section title={t('sections.space')} hint={t('sections.spaceHint', { size: touchTarget })}>
          <SpaceAndShape />
        </Section>
        <Section title={t('sections.motion')} hint={t('sections.motionHint')}>
          <MotionTokens />
        </Section>
      </div>
    </main>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-reading flex-col gap-1">
        <Text as="h2" role="title2">
          {title}
        </Text>
        <Text role="callout" tone="muted">
          {hint}
        </Text>
      </div>
      {children}
    </section>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-card border border-card-edge bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

/** Token names are code: always Latin, left-to-right, isolated from the surrounding text. */
function TokenName({ children }: { children: string }) {
  return (
    <bdi dir="ltr" lang="en" className="text-caption text-ink">
      {children}
    </bdi>
  );
}

const swatches: {
  token: keyof ColorTokens;
  name: string;
  className: string;
  against?: keyof ColorTokens;
}[] = [
  { token: 'canvas', name: 'canvas', className: 'bg-canvas' },
  { token: 'surface', name: 'surface', className: 'bg-surface' },
  { token: 'ink', name: 'ink', className: 'bg-ink', against: 'surface' },
  { token: 'inkMuted', name: 'ink-muted', className: 'bg-ink-muted', against: 'surface' },
  { token: 'lantern', name: 'lantern', className: 'bg-lantern', against: 'canvas' },
  { token: 'onLantern', name: 'on-lantern', className: 'bg-on-lantern', against: 'lantern' },
  { token: 'lanternInk', name: 'lantern-ink', className: 'bg-lantern-ink', against: 'surface' },
  { token: 'hairline', name: 'hairline', className: 'bg-hairline' },
  { token: 'positive', name: 'positive', className: 'bg-positive', against: 'surface' },
  { token: 'danger', name: 'danger', className: 'bg-danger', against: 'surface' },
  { token: 'focus', name: 'focus', className: 'bg-focus', against: 'canvas' },
  { token: 'cardEdge', name: 'card-edge', className: 'bg-card-edge' },
];

function ColorGrid() {
  const t = useTranslations();
  const format = useFormatter();
  const ratio = (theme: 'light' | 'dark', fg: keyof ColorTokens, bg: keyof ColorTokens) =>
    format.number(contrastRatio(colors[theme][fg], colors[theme][bg]), {
      maximumFractionDigits: 1,
    });

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {swatches.map((s) => (
        <li key={s.token}>
          <Card className="h-full">
            <div className="border-b border-hairline bg-canvas p-2">
              <div className={`h-20 rounded-control border border-hairline ${s.className}`} />
            </div>
            <div className="flex flex-col gap-1 p-3">
              <TokenName>{s.name}</TokenName>
              <bdi dir="ltr" className="text-caption text-ink-muted">
                {colors.light[s.token]}
              </bdi>
              <bdi dir="ltr" className="text-caption text-ink-muted">
                {colors.dark[s.token]}
              </bdi>
              {s.against && (
                <Text role="caption" tone="muted" className="pt-1">
                  {t('common.theme.light')} ·{' '}
                  {t('showcase.swatch.contrast', {
                    ratio: ratio('light', s.token, s.against),
                    one: 1,
                  })}
                  <br />
                  {t('common.theme.dark')} ·{' '}
                  {t('showcase.swatch.contrast', {
                    ratio: ratio('dark', s.token, s.against),
                    one: 1,
                  })}
                </Text>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

const skyClass: Record<SkyPeriod, string> = {
  fajr: 'from-sky-fajr-top to-sky-fajr-bottom',
  sunrise: 'from-sky-sunrise-top to-sky-sunrise-bottom',
  dhuhr: 'from-sky-dhuhr-top to-sky-dhuhr-bottom',
  asr: 'from-sky-asr-top to-sky-asr-bottom',
  maghrib: 'from-sky-maghrib-top to-sky-maghrib-bottom',
  night: 'from-sky-night-top to-sky-night-bottom',
};

function SkyGrid() {
  const t = useTranslations('glossary');
  const label = (p: SkyPeriod) => (p === 'night' ? t('night') : t(`prayer.${p}`));

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {skyPeriods.map((period) => (
        <li
          key={period}
          className={`relative flex aspect-[3/4] items-end rounded-card bg-linear-to-b p-3 ${skyClass[period]}`}
        >
          {/* Text never sits on the gradient: a glass chip whose tone follows the sky. */}
          <div
            data-theme={glassToneFor(sky[period].bottom)}
            className="flex w-full flex-col gap-1 rounded-control bg-surface-glass px-3 py-2 backdrop-blur-md"
          >
            <Text role="headline">{label(period)}</Text>
            <span className="flex flex-col items-start text-caption text-ink-muted">
              <bdi dir="ltr">{sky[period].top}</bdi>
              <bdi dir="ltr">{sky[period].bottom}</bdi>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TypeSpecimens() {
  const t = useTranslations('showcase.specimen');
  const locale = useLocale();
  const format = useFormatter();
  const script = locale === 'ar' ? 'arabic' : 'latin';
  const sample: Record<(typeof uiRoles)[number], string> = {
    display: t('display'),
    title1: t('headline'),
    title2: t('headline'),
    headline: t('headline'),
    body: t('body'),
    callout: t('body'),
    caption: t('caption'),
  };
  const metrics = (size: number, lineHeight: number) =>
    `${format.number(size)} / ${format.number(lineHeight)}`;

  return (
    <Card>
      <ul className="divide-y divide-hairline">
        {uiRoles.map((role) => {
          const m = typeScale[role][script];
          return (
            <li key={role} className="grid gap-2 p-4 md:grid-cols-[12rem_1fr] md:gap-6 md:p-6">
              <div className="flex flex-col">
                <TokenName>{role.replace(/(\d)/, '-$1')}</TokenName>
                <bdi dir="ltr" className="text-caption text-ink-muted">
                  {metrics(m.size, m.lineHeight)} · {typeScale[role].weight}
                </bdi>
              </div>
              <Text role={role}>{sample[role]}</Text>
            </li>
          );
        })}
        <li className="grid gap-2 p-4 md:grid-cols-[12rem_1fr] md:gap-6 md:p-6">
          <div className="flex flex-col">
            <TokenName>dhikr</TokenName>
            <bdi dir="ltr" className="text-caption text-ink-muted">
              {metrics(typeScale.dhikr.arabic.size, typeScale.dhikr.arabic.lineHeight)}
            </bdi>
          </div>
          <div className="flex flex-col gap-1">
            <Text role="dhikr" script="arabic">
              {t('sacredSample')}
            </Text>
            <Text role="caption" tone="muted">
              {t('sacredCaption')}
            </Text>
          </div>
        </li>
      </ul>
    </Card>
  );
}

// Literal classes so Tailwind generates them; widths follow the space tokens.
const spaceWidth: Record<keyof typeof space, string> = {
  1: 'w-1',
  2: 'w-2',
  3: 'w-3',
  4: 'w-4',
  6: 'w-6',
  8: 'w-8',
  12: 'w-12',
  16: 'w-16',
};

const radiusClass: Record<keyof typeof radius | 'pill', string> = {
  control: 'rounded-control',
  card: 'rounded-card',
  sheet: 'rounded-sheet',
  pill: 'rounded-full',
};

function SpaceAndShape() {
  const t = useTranslations('showcase.space');
  const format = useFormatter();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="flex flex-col gap-4 p-6">
        <Text role="headline">{t('spacing')}</Text>
        <ul className="flex flex-col gap-2">
          {(Object.keys(space) as unknown as (keyof typeof space)[]).map((step) => (
            <li key={step} className="flex items-center gap-3">
              <bdi dir="ltr" className="inline-block w-8 text-caption text-ink-muted">
                {format.number(space[step])}
              </bdi>
              <div className={`h-3 rounded-full bg-lantern ${spaceWidth[step]}`} />
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex flex-col gap-4 p-6">
        <Text role="headline">{t('radius')}</Text>
        <ul className="grid grid-cols-2 gap-3">
          {(Object.keys(radiusClass) as (keyof typeof radiusClass)[]).map((name) => (
            <li key={name} className="flex flex-col items-center gap-2">
              <div
                className={`h-16 w-full border border-hairline bg-canvas ${radiusClass[name]}`}
              />
              <TokenName>{name}</TokenName>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex flex-col gap-4 p-6">
        <Text role="headline">{t('touch')}</Text>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex size-touch items-center justify-center rounded-control border-2 border-dashed border-lantern">
            <bdi dir="ltr" className="text-caption text-ink-muted">
              {format.number(touchTarget)}
            </bdi>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MotionTokens() {
  const t = useTranslations('showcase.motion');
  const format = useFormatter();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="flex min-h-48 items-center justify-center p-6">
        <PressDemo />
      </Card>
      <Card className="flex flex-col gap-4 p-6">
        <Text role="headline">{t('durations')}</Text>
        <ul className="flex flex-col gap-2">
          {Object.entries(duration).map(([name, ms]) => (
            <li key={name} className="flex items-center justify-between gap-3">
              <TokenName>{name}</TokenName>
              <Text role="caption" tone="muted">
                {t('ms', { value: ms })}
              </Text>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex flex-col gap-4 p-6">
        <Text role="headline">{t('springs')}</Text>
        <ul className="flex flex-col gap-2">
          {Object.entries(spring).map(([name, s]) => (
            <li key={name} className="flex items-center justify-between gap-3">
              <TokenName>{`spring-${name}`}</TokenName>
              <bdi dir="ltr" className="text-caption text-ink-muted">
                {format.number(s.stiffness)} / {format.number(s.damping)}
              </bdi>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
