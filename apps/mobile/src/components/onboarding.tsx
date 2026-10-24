import type { ReminderStyle, StartingPoint } from '@murshid/core';
import {
  locationLabel,
  withLocation,
  withStartingPoint,
  type LocationSetting,
} from '@murshid/data';
import { direction, localeNames, locales } from '@murshid/i18n';
import { space } from '@murshid/tokens';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { Check } from 'phosphor-react-native/src/icons/Check';
import { Crosshair } from 'phosphor-react-native/src/icons/Crosshair';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { useState, type ReactNode } from 'react';
import { Keyboard, PixelRatio, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { CitySearch } from './city-search';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { IconButton } from './ui/icon-button';
import { PaperLight } from './ui/paper-light';
import { PressableScale } from './ui/pressable-scale';
import { Text } from './ui/text';
import { countryName } from '@/lib/format';
import { useAppLocale } from '@/lib/locale';
import { locateDevice, locationFromCity } from '@/lib/locate';
import { readSettings, updateSettings } from '@/lib/settings';
import { useColors } from '@/lib/theme';

// Onboarding (SPEC 3), under a minute and without an account: language, location, "Where are
// you today?", reminders, then (when the phone's text is large) the offer of simple view.

type Step = 'language' | 'location' | 'start' | 'reminders' | 'simple';
const answers: StartingPoint[] = ['just-starting', 'sometimes', 'most-days', 'all-five'];
const reminderStyles: Exclude<ReminderStyle, 'off'>[] = ['adhan', 'soft', 'silent'];
/** Suggest simple view when the system text size is this large or more (SPEC 3). */
const LARGE_TEXT = 1.3;

function Layout({
  steps,
  step,
  title,
  body,
  onBack,
  children,
}: {
  steps: readonly Step[];
  step: Step;
  title: string;
  body?: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      className="flex-1 bg-canvas"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: insets.top + space[4],
        paddingBottom: insets.bottom + space[8],
        paddingHorizontal: space[4],
        gap: space[8],
      }}
    >
      <View className="min-h-touch flex-row items-center justify-between">
        {onBack ? (
          <IconButton icon={ArrowLeft} label={t('common.actions.back')} mirror onPress={onBack} />
        ) : (
          <View />
        )}
        <Text role="caption" tone="muted">
          {t('onboarding.progress', { current: steps.indexOf(step) + 1, total: steps.length })}
        </Text>
      </View>
      {/* Paper and light (SPEC 6.7): Fajr's sky until a city is chosen, then the city's own. */}
      <PaperLight seed={step} width={width - 2 * space[4]} height={2 * space[16]} />
      <View className="gap-3">
        <Text role="title1" accessibilityRole="header">
          {title}
        </Text>
        {body && (
          <Text role="body" tone="muted">
            {body}
          </Text>
        )}
      </View>
      {children}
    </ScrollView>
  );
}

/** A large, plain choice: the whole row is the button (SPEC 3, comfort for every age). */
function Choice({
  selected,
  onPress,
  children,
  script,
}: {
  selected?: boolean;
  onPress: () => void;
  children: string;
  script?: 'latin' | 'arabic';
}) {
  const color = useColors();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`min-h-16 flex-row items-center justify-between gap-4 rounded-card border px-6 ${
        selected
          ? 'border-lantern bg-lantern/10'
          : 'border-card-edge bg-surface shadow-card dark:shadow-none'
      }`}
    >
      <Text role="headline" tone={selected ? 'lantern' : 'default'} script={script}>
        {children}
      </Text>
      {selected && <Check size={22} weight="bold" color={color.lanternInk} />}
    </PressableScale>
  );
}

export function Onboarding() {
  const t = useTranslations();
  const { locale, setLocale } = useAppLocale();
  const color = useColors();
  const largeText = PixelRatio.getFontScale() >= LARGE_TEXT;
  const steps: Step[] = [
    'language',
    'location',
    'start',
    'reminders',
    ...(largeText ? (['simple'] as const) : []),
  ];
  const [step, setStep] = useState<Step>('language');
  const [finding, setFinding] = useState<'idle' | 'locating' | 'search' | 'denied' | 'failed'>(
    'idle',
  );
  const [picked, setPicked] = useState<LocationSetting | null>(() => readSettings().location);
  const [style, setStyle] = useState<Exclude<ReminderStyle, 'off'>>('adhan');
  const [asking, setAsking] = useState(false);

  const next = () => {
    const i = steps.indexOf(step);
    if (i < steps.length - 1) setStep(steps[i + 1]!);
    else {
      updateSettings((s) => ({ ...s, onboarded: true }));
      // Arrival: Today opens on the sky for this moment (SPEC 3).
      router.replace('/');
    }
  };
  const back = () => {
    const i = steps.indexOf(step);
    if (i > 0) setStep(steps[i - 1]!);
  };
  const common = { steps, step, onBack: step === 'language' ? undefined : back };

  if (step === 'language') {
    return (
      <Layout
        {...common}
        title={t('onboarding.language.title')}
        body={t('onboarding.language.body')}
      >
        <View className="gap-3">
          {locales.map((l) => (
            <Choice
              key={l}
              selected={l === locale}
              script={direction(l) === 'rtl' ? 'arabic' : 'latin'}
              onPress={() => {
                if (l !== locale) setLocale(l);
                next();
              }}
            >
              {localeNames[l]}
            </Choice>
          ))}
        </View>
      </Layout>
    );
  }

  if (step === 'location') {
    if (picked) {
      const preview = withLocation(readSettings(), picked);
      const country = countryName(picked.countryCode, locale);
      return (
        <Layout {...common} title={t('onboarding.location.title')}>
          <Card className="gap-2 p-6">
            <Text role="title2">
              {t('onboarding.location.place', { city: locationLabel(picked, locale), country })}
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
          <View className="gap-3">
            <Button
              size="lg"
              onPress={() => {
                updateSettings((s) => withLocation(s, picked));
                next();
              }}
            >
              {t('common.actions.continue')}
            </Button>
            <Button
              variant="ghost"
              onPress={() => {
                setPicked(null);
                setFinding('search');
              }}
            >
              {t('settings.location.change')}
            </Button>
          </View>
        </Layout>
      );
    }
    return (
      <Layout
        {...common}
        title={t('onboarding.location.title')}
        body={t('onboarding.location.body')}
      >
        <View className="gap-3">
          {finding !== 'search' && (
            <Button
              size="lg"
              loading={finding === 'locating'}
              icon={<Crosshair size={22} color={color.onLantern} />}
              onPress={() => {
                setFinding('locating');
                locateDevice().then(
                  (location) => {
                    setPicked(location);
                    setFinding('idle');
                  },
                  (error: unknown) =>
                    setFinding(
                      error instanceof Error && error.message === 'denied' ? 'denied' : 'failed',
                    ),
                );
              }}
            >
              {t('onboarding.location.useLocation')}
            </Button>
          )}
          {(finding === 'denied' || finding === 'failed') && (
            <Text role="callout" tone="muted" accessibilityLiveRegion="polite">
              {t(`onboarding.location.${finding}`)}
            </Text>
          )}
          {finding === 'search' ? (
            <CitySearch
              onPick={(city) => {
                // The keyboard would otherwise stay over the Continue button below.
                Keyboard.dismiss();
                setPicked(locationFromCity(city));
                setFinding('idle');
              }}
            />
          ) : (
            <Button
              variant="secondary"
              size="lg"
              icon={<MagnifyingGlass size={22} color={color.ink} />}
              onPress={() => setFinding('search')}
            >
              {t('onboarding.location.chooseCity')}
            </Button>
          )}
        </View>
      </Layout>
    );
  }

  if (step === 'start') {
    return (
      <Layout {...common} title={t('onboarding.start.title')} body={t('onboarding.start.caption')}>
        <View className="gap-3">
          {answers.map((answer) => (
            <Choice
              key={answer}
              onPress={() => {
                updateSettings((s) => withStartingPoint(s, answer));
                next();
              }}
            >
              {t(`onboarding.start.answers.${answer}`)}
            </Choice>
          ))}
        </View>
      </Layout>
    );
  }

  if (step === 'reminders') {
    // The value first, then the permission (SPEC 3).
    return (
      <Layout
        {...common}
        title={t('onboarding.reminders.title')}
        body={t('onboarding.reminders.body')}
      >
        <View className="gap-3">
          {reminderStyles.map((s) => (
            <Choice key={s} selected={s === style} onPress={() => setStyle(s)}>
              {t(`onboarding.reminders.styles.${s}`)}
            </Choice>
          ))}
        </View>
        <View className="gap-3">
          <Button
            size="lg"
            loading={asking}
            onPress={() => {
              setAsking(true);
              updateSettings((s) => ({
                ...s,
                reminders: Object.fromEntries(
                  Object.entries(s.reminders).map(([p, r]) => [p, { ...r, style }]),
                ) as typeof s.reminders,
              }));
              void Notifications.requestPermissionsAsync().finally(() => {
                setAsking(false);
                next();
              });
            }}
          >
            {t('onboarding.reminders.allow')}
          </Button>
          <Button variant="ghost" onPress={next}>
            {t('common.actions.notNow')}
          </Button>
        </View>
      </Layout>
    );
  }

  return (
    <Layout
      {...common}
      title={t('onboarding.simpleView.title')}
      body={t('onboarding.simpleView.body')}
    >
      <View className="gap-3">
        <Button
          size="lg"
          onPress={() => {
            updateSettings((s) => ({ ...s, simpleView: true }));
            next();
          }}
        >
          {t('onboarding.simpleView.use')}
        </Button>
        <Button variant="ghost" onPress={next}>
          {t('onboarding.simpleView.keep')}
        </Button>
      </View>
    </Layout>
  );
}
