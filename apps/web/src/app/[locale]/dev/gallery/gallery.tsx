'use client';

import { ArrowLeft, Bell, Calculator, Plus, TextAa } from '@phosphor-icons/react';
import { duration, glassToneFor, skyAt, type SunPosition } from '@murshid/tokens';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { ShowcaseControls } from '@/components/showcase-controls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Countdown } from '@/components/ui/countdown';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { PrayerRow } from '@/components/ui/prayer-row';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { SkyBackground } from '@/components/ui/sky-background';
import { Slider } from '@/components/ui/slider';
import { TabBar, type Destination } from '@/components/ui/tab-bar';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Toggle } from '@/components/ui/toggle';
import { Link } from '@/i18n/navigation';

// Sample times only (shown in UTC); real times come from packages/core in Phase 3.
const at = (h: number, m: number) => new Date(Date.UTC(2026, 9, 16, h, m));

export function Gallery() {
  const t = useTranslations('gallery');

  return (
    <main id="main" className="mx-auto flex max-w-page flex-col gap-16 px-4 pt-12 pb-24 md:px-8">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-reading flex-col gap-3">
          <Link
            href="/"
            className="inline-flex min-h-touch items-center gap-2 self-start text-lantern-ink"
          >
            <ArrowLeft size={18} aria-hidden className="rtl:-scale-x-100" />
            <Text as="span" role="callout" tone="inherit">
              {t('tokens')}
            </Text>
          </Link>
          <Text as="h1" role="display">
            {t('title')}
          </Text>
          <Text role="body" tone="muted">
            {t('intro')}
          </Text>
        </div>
        <ShowcaseControls />
      </header>

      <SkySection />
      <ButtonsSection />
      <ControlsSection />
      <CardsSection />
      <ProgressSection />
      <PrayerSection />
      <FeedbackSection />
      <NavigationSection />
      <SheetSection />
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <Text as="h2" role="title2">
        {title}
      </Text>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <Text as="span" role="caption" tone="muted">
      {children}
    </Text>
  );
}

function SkySection() {
  const t = useTranslations('gallery');
  const [altitude, setAltitude] = useState(-6);
  const [rising, setRising] = useState<'morning' | 'evening'>('morning');
  const [playing, setPlaying] = useState(false);
  const sun: SunPosition = { altitude, noonAltitude: 60, rising: rising === 'morning' };
  const tone = glassToneFor(skyAt(sun).bottom);

  // "Play a day": walk the sun up and back down, one step per ambient beat.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setAltitude((a) => {
        if (rising === 'morning') {
          if (a >= 60) {
            setRising('evening');
            return 60;
          }
          return a + 2;
        }
        if (a <= -24) {
          setPlaying(false);
          return -24;
        }
        return a - 2;
      });
    }, duration.ambient / 3);
    return () => clearInterval(id);
  }, [playing, rising]);

  return (
    <Section title={t('sections.sky')}>
      <SkyBackground sun={sun} className="min-h-96 rounded-card">
        <div className="flex min-h-96 items-end p-4 md:p-6">
          <div data-theme={tone} className="w-full max-w-sm">
            <Card variant="glass" className="flex flex-col gap-1 p-6">
              <Text role="headline">{t('samples.glassTitle')}</Text>
              <Text role="callout" tone="muted">
                {t('samples.glassBody')}
              </Text>
            </Card>
          </div>
        </div>
      </SkyBackground>
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex flex-col gap-1">
          <Label>
            {t('samples.sunAltitude')} ·{' '}
            {/* Signed numbers stay left-to-right inside Arabic text. */}
            <bdi dir="ltr">{t('samples.degrees', { value: altitude })}</bdi>
          </Label>
          <Slider
            label={t('samples.sunAltitude')}
            valueText={t('samples.degrees', { value: altitude })}
            value={altitude}
            onChange={setAltitude}
            min={-30}
            max={70}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label={t('samples.sunAltitude')}
            value={rising}
            onChange={setRising}
            options={[
              { value: 'morning', label: t('samples.morning') },
              { value: 'evening', label: t('samples.evening') },
            ]}
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (!playing) {
                setRising('morning');
                setAltitude(-24);
              }
              setPlaying(!playing);
            }}
          >
            {playing ? t('samples.reset') : t('samples.playDay')}
          </Button>
        </div>
      </div>
    </Section>
  );
}

function ButtonsSection() {
  const t = useTranslations('gallery');
  const tc = useTranslations('components');
  return (
    <Section title={t('sections.buttons')}>
      <Card className="flex flex-col gap-8 p-6">
        {(['primary', 'secondary', 'ghost'] as const).map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-4">
            <span className="w-24">
              <Label>{t(`variants.${variant}`)}</Label>
            </span>
            <Button variant={variant}>{t('samples.continue')}</Button>
            <Button variant={variant} disabled>
              {t('states.disabled')}
            </Button>
            <Button variant={variant} loading>
              {t('samples.continue')}
            </Button>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <Label>{t('variants.large')}</Label>
          <Button size="lg">{tc('prayer.iPrayed')}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="w-24">
            <Label>{t('variants.icon')}</Label>
          </span>
          <IconButton icon={Bell} label={t('samples.rowReminders')} />
          <IconButton icon={Bell} label={t('samples.rowReminders')} variant="tinted" />
          <IconButton icon={ArrowLeft} label={t('tokens')} variant="tinted" mirror />
          <IconButton icon={Bell} label={t('samples.rowReminders')} variant="tinted" disabled />
        </div>
      </Card>
    </Section>
  );
}

function ControlsSection() {
  const t = useTranslations('gallery');
  const format = useFormatter();
  const hapticsId = useId();
  const simpleId = useId();
  const [haptics, setHaptics] = useState(true);
  const [simple, setSimple] = useState(false);
  const [size, setSize] = useState(1.3);
  const percent = format.number(size, { style: 'percent' });

  return (
    <Section title={t('sections.controls')}>
      <ListGroup>
        <ListRow
          title={t('samples.haptics')}
          titleId={hapticsId}
          control={<Toggle checked={haptics} onChange={setHaptics} labelledBy={hapticsId} />}
        />
        <ListRow
          title={t('samples.simpleView')}
          titleId={simpleId}
          control={<Toggle checked={simple} onChange={setSimple} labelledBy={simpleId} />}
        />
        <ListRow title={t('samples.textSize')} icon={TextAa} value={percent} />
        <div className="px-4 pb-4">
          <Slider
            label={t('samples.textSize')}
            valueText={percent}
            value={size}
            onChange={setSize}
            min={1}
            max={2}
            step={0.1}
          />
        </div>
        <ListRow
          title={t('samples.haptics')}
          control={
            <Toggle checked={false} onChange={() => {}} label={t('samples.haptics')} disabled />
          }
        />
      </ListGroup>
    </Section>
  );
}

function CardsSection() {
  const t = useTranslations('gallery');
  const toast = useToast();
  return (
    <Section title={t('sections.cards')}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-2 p-6">
          <Label>{t('variants.solid')}</Label>
          <Text role="headline">{t('samples.cardTitle')}</Text>
          <Text role="callout" tone="muted">
            {t('samples.cardBody')}
          </Text>
        </Card>
        <ListGroup>
          <ListRow
            title={t('samples.rowReminders')}
            icon={Bell}
            value={t('samples.rowRemindersValue')}
            onPress={() => toast(t('samples.rowReminders'))}
          />
          <ListRow
            title={t('samples.rowMethod')}
            subtitle={t('samples.rowMethodValue')}
            icon={Calculator}
            onPress={() => toast(t('samples.rowMethod'))}
          />
          <ListRow title={t('samples.rowMethod')} icon={Calculator} onPress={() => {}} disabled />
        </ListGroup>
      </div>
    </Section>
  );
}

function ProgressSection() {
  const t = useTranslations('gallery');
  const format = useFormatter();
  const [count, setCount] = useState(12);
  const [seconds, setSeconds] = useState(3725);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Section title={t('sections.progress')}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-6 p-6">
          <Label>{t('samples.portion')}</Label>
          <div className="flex flex-wrap items-center gap-6">
            {[0, 0.25, 0.6, 1].map((p) => (
              <ProgressRing
                key={p}
                progress={p}
                label={t('samples.portion')}
                valueText={format.number(p, { style: 'percent' })}
              />
            ))}
            <ProgressRing
              progress={count / 33}
              size={72}
              label={t('samples.portion')}
              valueText={format.number(count)}
            >
              <Text as="span" role="headline">
                {format.number(count)}
              </Text>
            </ProgressRing>
            <IconButton
              icon={Plus}
              label={t('samples.portion')}
              variant="tinted"
              onClick={() => setCount((c) => (c >= 33 ? 0 : c + 1))}
            />
          </div>
        </Card>
        <Card className="flex flex-col gap-4 p-6">
          <Label>{t('samples.nextPrayer')}</Label>
          <Countdown
            seconds={seconds}
            numberClassName="text-display"
            unitClassName="text-headline text-ink-muted"
          />
          <div className="flex flex-wrap gap-2">
            {[3725, 1500, 65, 12].map((s) => (
              <Button key={s} variant="ghost" onClick={() => setSeconds(s)}>
                <Countdown seconds={s} />
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}

function PrayerSection() {
  const t = useTranslations('gallery');
  const tg = useTranslations('glossary');
  const toast = useToast();
  const [jumuah, setJumuah] = useState(false);
  const jumuahId = useId();
  const tell = (name: string) => () => toast(name);

  return (
    <Section title={t('sections.prayer')}>
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="flex flex-col gap-1 p-2">
          <PrayerRow prayer="fajr" time={at(4, 52)} state="logged" onPress={tell('fajr')} />
          <PrayerRow prayer="sunrise" time={at(6, 14)} />
          <PrayerRow
            prayer="dhuhr"
            time={at(12, 21)}
            state="logged"
            jumuah={jumuah}
            onPress={tell('dhuhr')}
          />
          <PrayerRow prayer="asr" time={at(15, 34)} state="current" onPress={tell('asr')} />
          <PrayerRow prayer="maghrib" time={at(18, 9)} onPress={tell('maghrib')} />
          <PrayerRow prayer="isha" time={at(19, 29)} onPress={tell('isha')} />
        </Card>
        <Card className="flex items-center gap-2 self-start px-4 py-2">
          <Text as="span" role="callout" id={jumuahId}>
            {tg('prayer.jumuah')}
          </Text>
          <Toggle checked={jumuah} onChange={setJumuah} labelledBy={jumuahId} />
        </Card>
      </div>
    </Section>
  );
}

function FeedbackSection() {
  const t = useTranslations('gallery');
  const tc = useTranslations('components');
  const toast = useToast();
  return (
    <Section title={t('sections.feedback')}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col items-start gap-4 p-6">
          <Button variant="secondary" onClick={() => toast(t('samples.toastSaved'))}>
            {t('samples.showToast')}
          </Button>
          <Label>{t('states.loading')}</Label>
          <div aria-busy className="flex w-full flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </Card>
        {/* Empty states live on the page itself, not on cards: their pictures are keyed to the canvas. */}
        <div className="rounded-card border border-hairline">
          <EmptyState
            illustration="bookmarks"
            title={t('samples.emptyTitle')}
            action={<Button variant="secondary">{t('samples.emptyAction')}</Button>}
          />
        </div>
        <div className="rounded-card border border-hairline">
          <EmptyState
            illustration="error"
            title={t('samples.errorTitle')}
            action={<Button variant="secondary">{tc('tryAgain')}</Button>}
          />
        </div>
      </div>
    </Section>
  );
}

function NavigationSection() {
  const t = useTranslations('gallery');
  const [active, setActive] = useState<Destination>('today');
  return (
    <Section title={t('sections.navigation')}>
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <Card className="flex h-80 overflow-hidden">
          <TabBar layout="rail" active={active} onSelect={setActive} />
        </Card>
        <Card className="flex h-80 flex-col justify-end overflow-hidden">
          <TabBar active={active} onSelect={setActive} />
        </Card>
      </div>
    </Section>
  );
}

function SheetSection() {
  const t = useTranslations('gallery');
  const [open, setOpen] = useState(false);
  return (
    <Section title={t('sections.sheet')}>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t('samples.sheetTitle')}
        description={t('samples.sheetBody')}
        trigger={
          <Button variant="secondary" className="self-start">
            {t('samples.openSheet')}
          </Button>
        }
      >
        <div className="flex flex-col gap-1">
          <PrayerRow prayer="fajr" time={at(4, 52)} state="logged" onPress={() => {}} />
          <PrayerRow prayer="dhuhr" time={at(12, 21)} onPress={() => {}} />
          <PrayerRow prayer="asr" time={at(15, 34)} onPress={() => {}} />
        </div>
      </Sheet>
    </Section>
  );
}
