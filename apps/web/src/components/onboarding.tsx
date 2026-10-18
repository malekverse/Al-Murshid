'use client';

import { ArrowLeft, Check, Crosshair, MagnifyingGlass } from '@phosphor-icons/react';
import type { StartingPoint } from '@murshid/core';
import {
  locationLabel,
  withLocation,
  withStartingPoint,
  type LocationSetting,
} from '@murshid/data';
import { localeNames, locales, direction } from '@murshid/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { CitySearch } from '@/components/city-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { countryName } from '@/lib/format';
import { locateDevice, locationFromCity } from '@/lib/locate';
import { readSettings, updateSettings } from '@/lib/settings';

// Onboarding (SPEC 3), under a minute and without an account. On web there is no reminders
// step: reminders come from the mobile app in v1. Each step lives in the URL hash, so Back
// works and switching language keeps the place.

const steps = ['language', 'location', 'start'] as const;
type Step = (typeof steps)[number];
const answers: StartingPoint[] = ['just-starting', 'sometimes', 'most-days', 'all-five'];

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function useStep(): Step {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => '',
  );
  return (steps as readonly string[]).includes(hash) ? (hash as Step) : 'language';
}

const go = (step: Step) => {
  window.location.hash = step;
};

function StepLayout({
  step,
  title,
  body,
  children,
}: {
  step: Step;
  title: string;
  body?: string;
  children: ReactNode;
}) {
  const t = useTranslations();
  const index = steps.indexOf(step);
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-reading flex-col gap-8 px-4 pt-6 pb-12 md:pt-16"
    >
      <div className="flex min-h-touch items-center justify-between gap-4">
        {index > 0 ? (
          <IconButton
            icon={ArrowLeft}
            label={t('common.actions.back')}
            mirror
            onClick={() => window.history.back()}
          />
        ) : (
          <span />
        )}
        <Text role="caption" tone="muted">
          {t('onboarding.progress', { current: index + 1, total: steps.length })}
        </Text>
      </div>
      <div className="flex flex-col gap-3">
        <Text as="h1" role="title1">
          {title}
        </Text>
        {body && (
          <Text role="body" tone="muted">
            {body}
          </Text>
        )}
      </div>
      {children}
    </main>
  );
}

/** A large, plain choice: the whole row is the button (SPEC 3, comfort for every age). */
function Choice({
  selected,
  onPress,
  children,
  lang,
  dir,
}: {
  selected?: boolean;
  onPress: () => void;
  children: ReactNode;
  lang?: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={selected}
      lang={lang}
      dir={dir}
      className={cn(
        'flex min-h-16 w-full items-center justify-between gap-4 rounded-card border px-6 text-start shadow-card transition-colors duration-(--duration-quick) ease-standard focus-visible:outline-2 focus-visible:outline-lantern',
        selected
          ? 'border-lantern bg-lantern/10 text-lantern-ink'
          : 'border-card-edge bg-surface text-ink hover:bg-ink/5',
      )}
    >
      <Text as="span" role="headline" tone="inherit">
        {children}
      </Text>
      {selected && <Check size={22} weight="bold" aria-hidden />}
    </button>
  );
}

function LanguageStep() {
  const t = useTranslations('onboarding.language');
  const locale = useLocale();
  const router = useRouter();
  return (
    <StepLayout step="language" title={t('title')} body={t('body')}>
      <div className="flex flex-col gap-3">
        {locales.map((l) => (
          <Choice
            key={l}
            selected={l === locale}
            lang={l}
            dir={direction(l)}
            onPress={() => {
              if (l === locale) go('location');
              else router.replace('/welcome#location', { locale: l });
            }}
          >
            {localeNames[l]}
          </Choice>
        ))}
      </div>
    </StepLayout>
  );
}

type Finding = 'idle' | 'locating' | 'search' | 'denied' | 'failed';

function LocationStep() {
  const t = useTranslations();
  const locale = useLocale();
  const [finding, setFinding] = useState<Finding>('idle');
  const [picked, setPicked] = useState<LocationSetting | null>(() => readSettings().location);

  const locate = () => {
    setFinding('locating');
    locateDevice().then(
      (location) => {
        setPicked(location);
        setFinding('idle');
      },
      (error: unknown) =>
        setFinding(error instanceof Error && error.message === 'denied' ? 'denied' : 'failed'),
    );
  };

  if (picked) {
    const preview = withLocation(readSettings(), picked);
    const country = countryName(picked.countryCode, locale);
    return (
      <StepLayout step="location" title={t('onboarding.location.title')}>
        <Card className="flex flex-col gap-2 p-6">
          <Text role="title2">
            {t('onboarding.location.place', {
              city: locationLabel(picked, locale),
              country,
            })}
          </Text>
          <Text role="body">
            {t('onboarding.location.method', {
              method: t(`settings.method.names.${preview.method}`),
            })}
          </Text>
          {preview.methodSource === 'country' && (
            <Text role="callout" tone="muted">
              {t('onboarding.location.methodNote', { country })}
            </Text>
          )}
        </Card>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => {
              updateSettings((s) => withLocation(s, picked));
              go('start');
            }}
          >
            {t('common.actions.continue')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setPicked(null);
              setFinding('search');
            }}
          >
            {t('settings.location.change')}
          </Button>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      step="location"
      title={t('onboarding.location.title')}
      body={t('onboarding.location.body')}
    >
      <div className="flex flex-col gap-3">
        {finding !== 'search' && (
          <Button
            size="lg"
            loading={finding === 'locating'}
            icon={<Crosshair size={22} aria-hidden />}
            onClick={locate}
          >
            {t('onboarding.location.useLocation')}
          </Button>
        )}
        {(finding === 'denied' || finding === 'failed') && (
          <Text role="callout" tone="muted" aria-live="polite">
            {t(`onboarding.location.${finding}`)}
          </Text>
        )}
        {finding === 'search' ? (
          <CitySearch
            onPick={(city) => {
              setPicked(locationFromCity(city));
              setFinding('idle');
            }}
          />
        ) : (
          <Button
            variant="secondary"
            size="lg"
            icon={<MagnifyingGlass size={22} aria-hidden />}
            onClick={() => setFinding('search')}
          >
            {t('onboarding.location.chooseCity')}
          </Button>
        )}
      </div>
      {finding === 'locating' && (
        <Text role="callout" tone="muted" aria-live="polite">
          {t('onboarding.location.locating')}
        </Text>
      )}
    </StepLayout>
  );
}

function StartStep() {
  const t = useTranslations('onboarding.start');
  const router = useRouter();
  return (
    <StepLayout step="start" title={t('title')} body={t('caption')}>
      <div className="flex flex-col gap-3">
        {answers.map((answer) => (
          <Choice
            key={answer}
            onPress={() => {
              updateSettings((s) => ({ ...withStartingPoint(s, answer), onboarded: true }));
              // Arrival: Today opens on the sky for this moment (SPEC 3).
              router.replace('/');
            }}
          >
            {t(`answers.${answer}`)}
          </Choice>
        ))}
      </div>
    </StepLayout>
  );
}

export function Onboarding() {
  const step = useStep();
  if (step === 'location') return <LocationStep />;
  if (step === 'start') return <StartStep />;
  return <LanguageStep />;
}
