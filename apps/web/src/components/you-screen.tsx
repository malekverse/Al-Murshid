'use client';

import {
  Calculator,
  CalendarBlank,
  Clock,
  Crosshair,
  MapPin,
  Moon,
  SlidersHorizontal,
  SunHorizon,
} from '@phosphor-icons/react';
import {
  civilDate,
  defaultMethodFor,
  methods,
  timeNames,
  type HighLatitudeChoice,
  type MethodId,
} from '@murshid/core';
import { locationLabel, placeOf, withLocation, withMethod, type Settings } from '@murshid/data';
import { localeNames, locales, type Locale } from '@murshid/i18n';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useId, useState, type ReactNode } from 'react';
import { CitySearch } from '@/components/city-search';
import { ChoiceSheet, Stepper } from '@/components/settings-controls';
import { useThemePreference, type ThemePreference } from '@/components/theme';
import { Button } from '@/components/ui/button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { JourneySection } from '@/components/you/journey-section';
import { YourSky } from '@/components/you/your-sky';
import { usePathname, useRouter } from '@/i18n/navigation';
import { countryName, usePrayerName } from '@/lib/format';
import { locateDevice, locationFromCity } from '@/lib/locate';
import { updateSettings, useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';

const highLatitudeChoices: HighLatitudeChoice[] = [
  'auto',
  'middle-of-the-night',
  'seventh-of-the-night',
  'twilight-angle',
];
type Open = 'location' | 'method' | 'asr' | 'highLatitude' | 'adjust' | null;

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section id={id} aria-labelledby={headingId} className="flex scroll-mt-8 flex-col gap-3">
      <Text as="h2" role="headline" id={headingId} className="px-2">
        {title}
      </Text>
      {children}
    </section>
  );
}

export function YouScreen() {
  const settings = useSettings();
  const t = useTranslations();
  if (!settings) {
    return (
      <Main title={t('settings.title')}>
        <div aria-hidden className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </Main>
    );
  }
  return <Settings_ settings={settings} />;
}

function Main({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-col gap-8 px-4 pt-6 pb-12 md:pt-12"
    >
      <Text as="h1" role="title1" className="px-2">
        {title}
      </Text>
      {children}
    </main>
  );
}

function Settings_({ settings }: { settings: Settings }) {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const prayerName = usePrayerName();
  const [theme, setTheme] = useThemePreference();
  const [open, setOpen] = useState<Open>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<'denied' | 'failed' | null>(null);
  const simpleId = useId();
  const now = useNow(60_000);
  const today = now
    ? civilDate(
        now,
        placeOf(settings)?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      )
    : null;

  const location = settings.location;
  const country = location ? countryName(location.countryCode, locale) : null;
  const recommended = location ? defaultMethodFor(location.countryCode) : null;
  const methodName = (id: MethodId) => t(`settings.method.names.${id}`);
  const sheet = (name: Exclude<Open, null>) => ({
    open: open === name,
    onOpenChange: (next: boolean) => setOpen(next ? name : null),
  });
  const minutes = (value: number) =>
    value === 0
      ? t('settings.adjust.none')
      : format.number(value, {
          style: 'unit',
          unit: 'minute',
          unitDisplay: 'short',
          signDisplay: 'exceptZero',
        });
  const offset = settings.hijriOffset;

  return (
    <Main title={t('settings.title')}>
      {today ? (
        <YourSky settings={settings} today={today} />
      ) : (
        <Skeleton aria-hidden className="h-96 w-full rounded-card" />
      )}
      <JourneySection settings={settings} />

      <Section id="location" title={t('settings.sections.prayer')}>
        <ListGroup>
          <ListRow
            icon={MapPin}
            title={t('settings.location.label')}
            subtitle={
              location
                ? location.source === 'device'
                  ? `${locationLabel(location, locale)} · ${t('settings.location.device')}`
                  : `${locationLabel(location, locale)}, ${country}`
                : undefined
            }
            onPress={() => setOpen('location')}
          />
          <ListRow
            icon={Calculator}
            title={t('settings.method.label')}
            subtitle={methodName(settings.method)}
            onPress={() => setOpen('method')}
          />
          <ListRow
            icon={SunHorizon}
            title={t('settings.asr.label')}
            subtitle={t(`settings.asr.${settings.asr}`)}
            onPress={() => setOpen('asr')}
          />
          <ListRow
            icon={Moon}
            title={t('settings.highLatitude.label')}
            subtitle={t(`settings.highLatitude.${settings.highLatitude}`)}
            onPress={() => setOpen('highLatitude')}
          />
          <ListRow
            icon={SlidersHorizontal}
            title={t('settings.adjust.label')}
            subtitle={t('settings.adjust.note')}
            onPress={() => setOpen('adjust')}
          />
        </ListGroup>
      </Section>

      <Section id="hijri" title={t('settings.hijri.label')}>
        <ListGroup>
          <Stepper
            label={
              <span className="inline-flex items-center gap-3">
                <CalendarBlank size={20} aria-hidden />
                {t('settings.hijri.value', {
                  direction: offset > 0 ? 'later' : offset < 0 ? 'earlier' : 'none',
                  count: Math.abs(offset),
                })}
              </span>
            }
            valueText=""
            decreaseLabel={t('settings.hijri.earlier')}
            increaseLabel={t('settings.hijri.later')}
            canDecrease={offset > -2}
            canIncrease={offset < 2}
            onDecrease={() =>
              updateSettings((s) => ({
                ...s,
                hijriOffset: Math.max(-2, s.hijriOffset - 1) as Settings['hijriOffset'],
              }))
            }
            onIncrease={() =>
              updateSettings((s) => ({
                ...s,
                hijriOffset: Math.min(2, s.hijriOffset + 1) as Settings['hijriOffset'],
              }))
            }
          />
        </ListGroup>
        <Text role="caption" tone="muted" className="px-2">
          {t('settings.hijri.note')}
        </Text>
      </Section>

      <Section title={t('settings.sections.reminders')}>
        <ListGroup>
          <ListRow icon={Clock} title={t('settings.reminders.webNote')} />
        </ListGroup>
      </Section>

      <Section title={t('settings.sections.appearance')}>
        <div className="flex flex-col gap-4 rounded-card border border-card-edge bg-surface p-4">
          <div className="flex flex-col gap-2">
            <Text role="callout" tone="muted">
              {t('common.language.label')}
            </Text>
            <Segmented
              label={t('common.language.label')}
              value={locale as Locale}
              onChange={(next) => router.replace(pathname, { locale: next })}
              options={locales.map((l) => ({ value: l, label: localeNames[l], lang: l }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text role="callout" tone="muted">
              {t('common.theme.label')}
            </Text>
            <Segmented
              label={t('common.theme.label')}
              value={theme}
              onChange={(next: ThemePreference) => setTheme(next)}
              options={(['light', 'dark', 'auto'] as const).map((v) => ({
                value: v,
                label: t(`common.theme.${v}`),
              }))}
            />
          </div>
        </div>
        <ListGroup>
          <ListRow
            title={t('settings.simpleView.label')}
            subtitle={t('settings.simpleView.note')}
            titleId={simpleId}
            control={
              <Toggle
                checked={settings.simpleView}
                onChange={(on) => updateSettings((s) => ({ ...s, simpleView: on }))}
                labelledBy={simpleId}
              />
            }
          />
        </ListGroup>
      </Section>

      <Section title={t('settings.sections.about')}>
        <div className="flex flex-col gap-2 rounded-card border border-card-edge bg-surface p-4">
          <Text role="callout">{t('settings.about.noRulings')}</Text>
          <Text role="caption" tone="muted">
            {t('settings.about.sources')}
          </Text>
        </div>
      </Section>

      {/* Location: search a city, or use the device's position. */}
      <Sheet {...sheet('location')} title={t('settings.location.change')}>
        <div className="flex flex-col gap-4">
          <Button
            variant="secondary"
            loading={locating}
            icon={<Crosshair size={20} aria-hidden />}
            onClick={() => {
              setLocating(true);
              setLocateError(null);
              locateDevice().then(
                (loc) => {
                  updateSettings((s) => withLocation(s, loc));
                  setLocating(false);
                  setOpen(null);
                },
                (error: unknown) => {
                  setLocating(false);
                  setLocateError(
                    error instanceof Error && error.message === 'denied' ? 'denied' : 'failed',
                  );
                },
              );
            }}
          >
            {t('settings.location.refresh')}
          </Button>
          {locateError && (
            <Text role="callout" tone="muted" aria-live="polite">
              {t(`onboarding.location.${locateError}`)}
            </Text>
          )}
          <CitySearch
            onPick={(city) => {
              updateSettings((s) => withLocation(s, locationFromCity(city)));
              setOpen(null);
            }}
          />
        </div>
      </Sheet>

      <ChoiceSheet
        {...sheet('method')}
        title={t('settings.method.label')}
        value={settings.method}
        onChange={(id) => updateSettings((s) => withMethod(s, id))}
        choices={(Object.keys(methods) as MethodId[])
          .map((id) => ({
            value: id,
            label: methodName(id),
            hint:
              id === recommended && country
                ? t('settings.method.recommended', { country })
                : undefined,
          }))
          .sort((a, b) => (a.value === recommended ? -1 : b.value === recommended ? 1 : 0))}
      />
      <ChoiceSheet
        {...sheet('asr')}
        title={t('settings.asr.label')}
        value={settings.asr}
        onChange={(asr) => updateSettings((s) => ({ ...s, asr }))}
        choices={(['standard', 'hanafi'] as const).map((v) => ({
          value: v,
          label: t(`settings.asr.${v}`),
        }))}
      />
      <ChoiceSheet
        {...sheet('highLatitude')}
        title={t('settings.highLatitude.label')}
        description={t('settings.highLatitude.note')}
        value={settings.highLatitude}
        onChange={(highLatitude) => updateSettings((s) => ({ ...s, highLatitude }))}
        choices={highLatitudeChoices.map((v) => ({
          value: v,
          label: t(`settings.highLatitude.${v}`),
        }))}
      />
      <Sheet
        {...sheet('adjust')}
        title={t('settings.adjust.label')}
        description={t('settings.adjust.note')}
      >
        <ListGroup>
          {timeNames.map((name) => {
            const value = settings.adjustments[name] ?? 0;
            const set = (next: number) =>
              updateSettings((s) => ({
                ...s,
                adjustments: { ...s.adjustments, [name]: Math.max(-30, Math.min(30, next)) },
              }));
            return (
              <Stepper
                key={name}
                label={prayerName(name)}
                valueText={minutes(value)}
                decreaseLabel={`${prayerName(name)}: ${t('settings.adjust.earlier')}`}
                increaseLabel={`${prayerName(name)}: ${t('settings.adjust.later')}`}
                canDecrease={value > -30}
                canIncrease={value < 30}
                onDecrease={() => set(value - 1)}
                onIncrease={() => set(value + 1)}
              />
            );
          })}
        </ListGroup>
      </Sheet>
    </Main>
  );
}
