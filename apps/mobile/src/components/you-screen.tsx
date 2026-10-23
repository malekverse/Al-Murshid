import {
  civilDate,
  defaultMethodFor,
  methods,
  prayers,
  timeNames,
  type HighLatitudeChoice,
  type MethodId,
  type Prayer,
} from '@murshid/core';
import { locationLabel, placeOf, withLocation, withMethod, type Settings } from '@murshid/data';
import { localeNames, locales, type Locale } from '@murshid/i18n';
import { space } from '@murshid/tokens';
import { Bell } from 'phosphor-react-native/src/icons/Bell';
import { Calculator } from 'phosphor-react-native/src/icons/Calculator';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { Crosshair } from 'phosphor-react-native/src/icons/Crosshair';
import { DownloadSimple } from 'phosphor-react-native/src/icons/DownloadSimple';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { Moon } from 'phosphor-react-native/src/icons/Moon';
import { SlidersHorizontal } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { SunHorizon } from 'phosphor-react-native/src/icons/SunHorizon';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { router } from 'expo-router';
import { getCalendars } from 'expo-localization';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { AppState, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { ChoiceList } from './choice-list';
import { CitySearch } from './city-search';
import { PermissionNotes, ReminderSheet } from './reminder-sheet';
import { Stepper } from './stepper';
import { Button } from './ui/button';
import { ListGroup, ListRow } from './ui/list-row';
import { Segmented } from './ui/segmented';
import { Sheet } from './ui/sheet';
import { Text } from './ui/text';
import { Toggle } from './ui/toggle';
import { RiseRow } from './rise/rise-row';
import { JourneySection } from './you/journey-section';
import { NightReflection } from './you/night-reflection';
import { YourSky } from './you/your-sky';
import { canLock, setYouLock, useYouLock } from '@/lib/app-lock';
import { deleteEverything, exportEverything } from '@/lib/data-export';
import { countryName, usePrayerName } from '@/lib/format';
import { useAppLocale } from '@/lib/locale';
import { locateDevice, locationFromCity } from '@/lib/locate';
import { updateSettings, useSettings } from '@/lib/settings';
import { useColors, useThemePreference, type ThemePreference } from '@/lib/theme';
import { useNow } from '@/lib/use-now';

const highLatitudeChoices: HighLatitudeChoice[] = [
  'auto',
  'middle-of-the-night',
  'seventh-of-the-night',
  'twilight-angle',
];
type Open = 'location' | 'method' | 'asr' | 'highLatitude' | 'adjust' | 'delete' | null;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text role="headline" accessibilityRole="header" className="px-2">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** `focus` brings the night reflection into view; a new value scrolls again. */
export function YouScreen({ focus = null }: { focus?: string | null }) {
  const t = useTranslations();
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const { locale, setLocale } = useAppLocale();
  const color = useColors();
  const settings = useSettings();
  const prayerName = usePrayerName();
  const [theme, setTheme] = useThemePreference();
  const [open, setOpen] = useState<Open>(null);
  const [reminderFor, setReminderFor] = useState<Prayer | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<'denied' | 'failed' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const lock = useYouLock();
  const [lockable, setLockable] = useState<boolean | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [reflectionY, setReflectionY] = useState<number | null>(null);
  const now = useNow(60_000);

  // A screen lock set up in the system settings counts as soon as the app comes back.
  useEffect(() => {
    const check = () => void canLock().then(setLockable);
    check();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') check();
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (focus && reflectionY !== null) scroll.current?.scrollTo({ y: reflectionY, animated: true });
  }, [focus, reflectionY]);
  const today = civilDate(now, placeOf(settings)?.timeZone ?? getCalendars()[0]?.timeZone ?? 'UTC');

  const location = settings.location;
  const country = location ? countryName(location.countryCode, locale) : null;
  const recommended = location ? defaultMethodFor(location.countryCode) : null;
  const methodName = (id: MethodId) => t(`settings.method.names.${id}`);
  const close = () => setOpen(null);
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
  const setOffset = (next: number) =>
    updateSettings((s) => ({
      ...s,
      hijriOffset: Math.max(-2, Math.min(2, next)) as Settings['hijriOffset'],
    }));
  const reminderSummary = (p: Prayer) => {
    const r = settings.reminders[p];
    return r.before === null || r.style === 'off'
      ? t(`settings.reminders.styles.${r.style}`)
      : `${t(`settings.reminders.styles.${r.style}`)} · ${t('settings.reminders.beforeValue', { count: r.before })}`;
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={scroll}
        className="flex-1 bg-canvas"
        contentContainerStyle={{
          paddingTop: insets.top + space[6],
          paddingBottom: space[12],
          paddingHorizontal: space[4],
          gap: space[8],
        }}
      >
        <View className="px-2">
          <Text role="title1" accessibilityRole="header">
            {t('settings.title')}
          </Text>
        </View>

        <YourSky settings={settings} today={today} />
        <JourneySection settings={settings} />
        <View onLayout={(e) => setReflectionY(e.nativeEvent.layout.y)}>
          <NightReflection settings={settings} now={now} />
        </View>

        <Section title={t('settings.sections.prayer')}>
          <ListGroup>
            <ListRow
              icon={MapPin}
              title={t('settings.location.label')}
              subtitle={
                location
                  ? location.source === 'device'
                    ? `${locationLabel(location, locale)} · ${t('settings.location.device')}`
                    : [locationLabel(location, locale), country].join(locale === 'ar' ? '، ' : ', ')
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

        <Section title={t('settings.hijri.label')}>
          <ListGroup>
            <Stepper
              label={
                <View className="flex-row items-center gap-3">
                  <CalendarBlank size={20} color={color.ink} />
                  <Text role="body" accessibilityLiveRegion="polite" className="flex-1">
                    {t('settings.hijri.value', {
                      direction: offset > 0 ? 'later' : offset < 0 ? 'earlier' : 'none',
                      count: Math.abs(offset),
                    })}
                  </Text>
                </View>
              }
              valueText=""
              decreaseLabel={t('settings.hijri.earlier')}
              increaseLabel={t('settings.hijri.later')}
              canDecrease={offset > -2}
              canIncrease={offset < 2}
              onDecrease={() => setOffset(offset - 1)}
              onIncrease={() => setOffset(offset + 1)}
            />
          </ListGroup>
          <Text role="caption" tone="muted" className="px-2">
            {t('settings.hijri.note')}
          </Text>
        </Section>

        <Section title={t('settings.sections.reminders')}>
          <PermissionNotes />
          <ListGroup>
            {prayers.map((p) => (
              <ListRow
                key={p}
                icon={Bell}
                title={prayerName(p)}
                subtitle={reminderSummary(p)}
                onPress={() => setReminderFor(p)}
              />
            ))}
          </ListGroup>
          <ListGroup>
            <RiseRow />
          </ListGroup>
        </Section>

        <Section title={t('settings.sections.appearance')}>
          <View className="gap-4 rounded-card border border-card-edge bg-surface p-4">
            <View className="gap-2">
              <Text role="callout" tone="muted">
                {t('common.language.label')}
              </Text>
              <Segmented
                label={t('common.language.label')}
                value={locale as Locale}
                onChange={(next) => setLocale(next)}
                options={locales.map((l) => ({
                  value: l,
                  label: localeNames[l],
                  script: l === 'ar' ? ('arabic' as const) : ('latin' as const),
                }))}
              />
            </View>
            <View className="gap-2">
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
            </View>
          </View>
          <ListGroup>
            <ListRow
              title={t('settings.simpleView.label')}
              subtitle={t('settings.simpleView.note')}
              control={
                <Toggle
                  checked={settings.simpleView}
                  onChange={(on) => updateSettings((s) => ({ ...s, simpleView: on }))}
                  label={t('settings.simpleView.label')}
                />
              }
            />
            <ListRow
              title={t('settings.haptics.label')}
              subtitle={t('settings.haptics.note')}
              control={
                <Toggle
                  checked={settings.haptics}
                  onChange={(on) => updateSettings((s) => ({ ...s, haptics: on }))}
                  label={t('settings.haptics.label')}
                />
              }
            />
          </ListGroup>
        </Section>

        <Section title={t('settings.sections.seasons')}>
          <ListGroup>
            <ListRow
              title={t('settings.ramadanMode.label')}
              subtitle={t('settings.ramadanMode.note')}
              control={
                <Toggle
                  checked={settings.ramadanMode}
                  onChange={(on) => updateSettings((s) => ({ ...s, ramadanMode: on }))}
                  label={t('settings.ramadanMode.label')}
                />
              }
            />
          </ListGroup>
        </Section>

        <Section title={t('settings.sections.privacy')}>
          <ListGroup>
            <ListRow
              title={t('reflection.lock.label')}
              subtitle={
                lockable === false ? t('reflection.lock.unavailable') : t('reflection.lock.note')
              }
              control={
                <Toggle
                  checked={lock.enabled === true}
                  disabled={lockable !== true && lock.enabled !== true}
                  onChange={(on) => void setYouLock(on, t('reflection.lock.prompt'))}
                  label={t('reflection.lock.label')}
                  testID="you-lock"
                />
              }
            />
            <ListRow
              icon={DownloadSimple}
              title={t('settings.privacy.export.label')}
              subtitle={t('settings.privacy.export.note')}
              onPress={() => void exportEverything(t('settings.privacy.export.label'))}
            />
            <ListRow
              icon={Trash}
              title={t('settings.privacy.delete.label')}
              subtitle={t('settings.privacy.delete.note')}
              onPress={() => setOpen('delete')}
            />
          </ListGroup>
          <Text role="caption" tone="muted" className="px-2">
            {t('settings.privacy.local')}
          </Text>
        </Section>

        <Section title={t('settings.sections.about')}>
          <View className="gap-2 rounded-card border border-card-edge bg-surface p-4">
            <Text role="callout">{t('settings.about.noRulings')}</Text>
            <Text role="caption" tone="muted">
              {t('settings.about.sources')}
            </Text>
          </View>
        </Section>
      </ScrollView>

      <Sheet
        open={open === 'delete'}
        onClose={close}
        title={t('settings.privacy.delete.confirmTitle')}
        description={t('settings.privacy.delete.confirmBody')}
      >
        <View className="gap-3">
          <Button
            variant="danger"
            size="lg"
            loading={deleting}
            onPress={() => {
              setDeleting(true);
              void deleteEverything().then(() => {
                setDeleting(false);
                close();
                router.replace('/welcome');
              });
            }}
          >
            {t('settings.privacy.delete.confirm')}
          </Button>
          <Button variant="secondary" size="lg" onPress={close}>
            {t('common.actions.cancel')}
          </Button>
        </View>
      </Sheet>

      <Sheet open={open === 'location'} onClose={close} title={t('settings.location.change')}>
        <View className="gap-4">
          <Button
            variant="secondary"
            loading={locating}
            icon={<Crosshair size={20} color={color.ink} />}
            onPress={() => {
              setLocating(true);
              setLocateError(null);
              locateDevice().then(
                (loc) => {
                  updateSettings((s) => withLocation(s, loc));
                  setLocating(false);
                  close();
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
            <Text role="callout" tone="muted" accessibilityLiveRegion="polite">
              {t(`onboarding.location.${locateError}`)}
            </Text>
          )}
          <CitySearch
            onPick={(city) => {
              updateSettings((s) => withLocation(s, locationFromCity(city)));
              close();
            }}
          />
        </View>
      </Sheet>

      <Sheet open={open === 'method'} onClose={close} title={t('settings.method.label')}>
        <ChoiceList
          label={t('settings.method.label')}
          value={settings.method}
          onChange={(id) => {
            updateSettings((s) => withMethod(s, id));
            close();
          }}
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
      </Sheet>

      <Sheet open={open === 'asr'} onClose={close} title={t('settings.asr.label')}>
        <ChoiceList
          label={t('settings.asr.label')}
          value={settings.asr}
          onChange={(asr) => {
            updateSettings((s) => ({ ...s, asr }));
            close();
          }}
          choices={(['standard', 'hanafi'] as const).map((v) => ({
            value: v,
            label: t(`settings.asr.${v}`),
          }))}
        />
      </Sheet>

      <Sheet
        open={open === 'highLatitude'}
        onClose={close}
        title={t('settings.highLatitude.label')}
        description={t('settings.highLatitude.note')}
      >
        <ChoiceList
          label={t('settings.highLatitude.label')}
          value={settings.highLatitude}
          onChange={(highLatitude) => {
            updateSettings((s) => ({ ...s, highLatitude }));
            close();
          }}
          choices={highLatitudeChoices.map((v) => ({
            value: v,
            label: t(`settings.highLatitude.${v}`),
          }))}
        />
      </Sheet>

      <Sheet
        open={open === 'adjust'}
        onClose={close}
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

      <ReminderSheet prayer={reminderFor} onClose={() => setReminderFor(null)} />
    </View>
  );
}
