import { ayah, ayahs, surah } from '@murshid/content';
import {
  colors,
  glassToneFor,
  quranSizeRange,
  radius,
  skyAt,
  space,
  typeScale,
  type SunPosition,
} from '@murshid/tokens';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { Bell } from 'phosphor-react-native/src/icons/Bell';
import { Calculator } from 'phosphor-react-native/src/icons/Calculator';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { TextAa } from 'phosphor-react-native/src/icons/TextAa';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isolate } from '@murshid/i18n';
import { useFormatter, useTranslations } from 'use-intl';
import { AyahText } from '@/components/ui/ayah-text';
import { Button } from '@/components/ui/button';
import { Card, GlassCard } from '@/components/ui/card';
import { Countdown } from '@/components/ui/countdown';
import { DhikrCard } from '@/components/ui/dhikr-card';
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
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Toggle } from '@/components/ui/toggle';
import { useAppLocale } from '@/lib/locale';

// Sample times only (shown in UTC); real times come from packages/core in Phase 3.
const at = (h: number, m: number) => new Date(Date.UTC(2026, 9, 16, h, m));

export default function GalleryScreen() {
  const t = useTranslations('gallery');
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + space[4],
        paddingBottom: insets.bottom + space[16],
      }}
      contentContainerClassName="gap-12 px-4"
    >
      <View className="gap-3">
        <View className="flex-row">
          <IconButton
            icon={ArrowLeft}
            label={t('tokens')}
            mirror
            variant="tinted"
            onPress={() => router.back()}
          />
        </View>
        <Text role="display" accessibilityRole="header">
          {t('title')}
        </Text>
        <Text role="body" tone="muted">
          {t('intro')}
        </Text>
      </View>
      <SkySection />
      <View className="flex-row">
        <Button variant="secondary" onPress={() => router.push('/dev/sky')}>
          {t('samples.skyTest')}
        </Button>
      </View>
      <ButtonsSection />
      <ControlsSection />
      <CardsSection />
      <SacredSection />
      <ProgressSection />
      <PrayerSection />
      <FeedbackSection />
      <SheetSection />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-6">
      <Text role="title2" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text role="caption" tone="muted">
      {children}
    </Text>
  );
}

function SkySection() {
  const t = useTranslations('gallery');
  const [altitude, setAltitude] = useState(-6);
  const [rising, setRising] = useState<'morning' | 'evening'>('morning');
  const sun: SunPosition = { altitude, noonAltitude: 60, rising: rising === 'morning' };
  const tone = glassToneFor(skyAt(sun).bottom);

  return (
    <Section title={t('sections.sky')}>
      <SkyBackground sun={sun} style={{ height: 360, borderRadius: radius.card }}>
        <View className="flex-1 justify-end p-4">
          <GlassCard tone={tone} className="gap-1 p-6">
            <Text role="headline" tone="inherit" style={{ color: colors[tone].ink }}>
              {t('samples.glassTitle')}
            </Text>
          </GlassCard>
        </View>
      </SkyBackground>
      <View className="gap-1">
        {/* Signed numbers stay left-to-right inside Arabic text. */}
        <Label>{`${t('samples.sunAltitude')} · ${isolate(t('samples.degrees', { value: altitude }), 'ltr')}`}</Label>
        <Slider
          label={t('samples.sunAltitude')}
          valueText={t('samples.degrees', { value: altitude })}
          value={altitude}
          onChange={setAltitude}
          min={-30}
          max={70}
        />
      </View>
      <Segmented
        label={t('samples.sunAltitude')}
        value={rising}
        onChange={setRising}
        options={[
          { value: 'morning', label: t('samples.morning') },
          { value: 'evening', label: t('samples.evening') },
        ]}
      />
    </Section>
  );
}

function ButtonsSection() {
  const t = useTranslations('gallery');
  const tc = useTranslations('components');
  return (
    <Section title={t('sections.buttons')}>
      <Card className="gap-6 p-6">
        {(['primary', 'secondary', 'ghost'] as const).map((variant) => (
          <View key={variant} className="gap-3">
            <Label>{t(`variants.${variant}`)}</Label>
            <View className="flex-row flex-wrap gap-3">
              <Button variant={variant}>{t('samples.continue')}</Button>
              <Button variant={variant} disabled>
                {t('states.disabled')}
              </Button>
              <Button variant={variant} loading>
                {t('samples.continue')}
              </Button>
            </View>
          </View>
        ))}
        <View className="gap-3">
          <Label>{t('variants.large')}</Label>
          <Button size="lg">{tc('prayer.iPrayed')}</Button>
        </View>
        <View className="gap-3">
          <Label>{t('variants.icon')}</Label>
          <View className="flex-row gap-3">
            <IconButton icon={Bell} label={t('samples.rowReminders')} />
            <IconButton icon={Bell} label={t('samples.rowReminders')} variant="tinted" />
            <IconButton icon={ArrowLeft} label={t('tokens')} variant="tinted" mirror />
            <IconButton icon={Bell} label={t('samples.rowReminders')} variant="tinted" disabled />
          </View>
        </View>
      </Card>
    </Section>
  );
}

function ControlsSection() {
  const t = useTranslations('gallery');
  const format = useFormatter();
  const [haptics, setHaptics] = useState(true);
  const [simple, setSimple] = useState(false);
  const [size, setSize] = useState(1.3);
  const percent = format.number(size, { style: 'percent' });
  return (
    <Section title={t('sections.controls')}>
      <ListGroup>
        <ListRow
          title={t('samples.haptics')}
          control={<Toggle checked={haptics} onChange={setHaptics} label={t('samples.haptics')} />}
        />
        <ListRow
          title={t('samples.simpleView')}
          control={<Toggle checked={simple} onChange={setSimple} label={t('samples.simpleView')} />}
        />
        <View>
          <ListRow title={t('samples.textSize')} icon={TextAa} value={percent} />
          <View className="px-4 pb-4">
            <Slider
              label={t('samples.textSize')}
              valueText={percent}
              value={size}
              onChange={setSize}
              min={1}
              max={2}
              step={0.1}
            />
          </View>
        </View>
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
      <Card className="gap-2 p-6">
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
    </Section>
  );
}

// Al-Muzzammil 73:4, Ayat al-Kursi (2:255) and Al-Ikhlas, verbatim from packages/content.
const sacred = { short: ayah(73, 4), long: ayah(2, 255), ikhlas: ayahs(112, 1, 4) };

function SacredSection() {
  const t = useTranslations('gallery');
  // The app's language, not use-intl's locale (an Intl tag such as ar-u-nu-latn).
  const { locale } = useAppLocale();
  const format = useFormatter();
  const [size, setSize] = useState<number>(typeScale.quran.arabic.size);
  const name = (n: number) => (locale === 'ar' ? surah(n).nameArabic : surah(n).nameSimple);
  const [first, last] = [sacred.ikhlas[0]!, sacred.ikhlas.at(-1)!];
  // "112:1–4" reads left to right in every language.
  const range = isolate(
    `${format.number(first.surah)}:${format.number(first.ayah)}–${format.number(last.ayah)}`,
    'ltr',
  );
  const sizeText = format.number(size / typeScale.quran.arabic.size, { style: 'percent' });

  return (
    <Section title={t('sections.sacred')}>
      <Card className="gap-4 p-6">
        <Label>{t('samples.ayah')}</Label>
        <AyahText
          text={sacred.short.text}
          surahName={name(sacred.short.surah)}
          number={sacred.short.ayah}
        />
      </Card>
      <Label>{t('samples.dhikrFromQuran')}</Label>
      <DhikrCard
        arabic={sacred.ikhlas.map((a) => a.text).join(' ')}
        quran
        reference={t('samples.verseRange', { surah: name(first.surah), range })}
        target={3}
      />
      <Card className="gap-4 p-6">
        <Label>{t('samples.longAyah')}</Label>
        <Slider
          label={t('samples.textSize')}
          valueText={sizeText}
          value={size}
          onChange={setSize}
          min={quranSizeRange.min}
          max={quranSizeRange.max}
          step={2}
        />
        <AyahText
          text={sacred.long.text}
          surahName={name(sacred.long.surah)}
          number={sacred.long.ayah}
          size={size}
        />
      </Card>
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
      <Card className="gap-6 p-6">
        <Label>{t('samples.portion')}</Label>
        <View className="flex-row flex-wrap items-center gap-4">
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
            <Text role="headline">{format.number(count)}</Text>
          </ProgressRing>
          <IconButton
            icon={Plus}
            label={t('samples.portion')}
            variant="tinted"
            onPress={() => setCount((c) => (c >= 33 ? 0 : c + 1))}
          />
        </View>
      </Card>
      <Card className="gap-4 p-6">
        <Label>{t('samples.nextPrayer')}</Label>
        <Countdown seconds={seconds} />
        <View className="flex-row flex-wrap gap-2">
          {[3725, 1500, 65, 12].map((s) => (
            <Button key={s} variant="ghost" onPress={() => setSeconds(s)}>
              {format.number(s)}
            </Button>
          ))}
        </View>
      </Card>
    </Section>
  );
}

function PrayerSection() {
  const t = useTranslations('gallery');
  const tg = useTranslations('glossary');
  const toast = useToast();
  const [jumuah, setJumuah] = useState(false);
  const tell = (name: string) => () => toast(tg(`prayer.${name}` as 'prayer.fajr'));
  return (
    <Section title={t('sections.prayer')}>
      <Card className="gap-1 p-2">
        <PrayerRow
          prayer="fajr"
          time={at(4, 52)}
          timeZone="UTC"
          state="logged"
          onPress={tell('fajr')}
        />
        <PrayerRow prayer="sunrise" time={at(6, 14)} timeZone="UTC" />
        <PrayerRow
          prayer="dhuhr"
          time={at(12, 21)}
          timeZone="UTC"
          state="logged"
          jumuah={jumuah}
          onPress={tell('dhuhr')}
        />
        <PrayerRow
          prayer="asr"
          time={at(15, 34)}
          timeZone="UTC"
          state="current"
          onPress={tell('asr')}
        />
        <PrayerRow prayer="maghrib" time={at(18, 9)} timeZone="UTC" onPress={tell('maghrib')} />
        <PrayerRow prayer="isha" time={at(19, 29)} timeZone="UTC" onPress={tell('isha')} />
      </Card>
      <ListGroup>
        <ListRow
          title={tg('prayer.jumuah')}
          control={<Toggle checked={jumuah} onChange={setJumuah} label={tg('prayer.jumuah')} />}
        />
      </ListGroup>
    </Section>
  );
}

function FeedbackSection() {
  const t = useTranslations('gallery');
  const tc = useTranslations('components');
  const toast = useToast();
  return (
    <Section title={t('sections.feedback')}>
      <Card className="items-start gap-4 p-6">
        <Button variant="secondary" onPress={() => toast(t('samples.toastSaved'))}>
          {t('samples.showToast')}
        </Button>
        <Label>{t('states.loading')}</Label>
        <View className="w-full gap-3">
          {[0, 1, 2].map((i) => (
            <View key={i} className="flex-row items-center gap-4">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </View>
          ))}
        </View>
      </Card>
      {/* Empty states live on the canvas: their pictures are keyed to it. */}
      <EmptyState
        illustration="bookmarks"
        title={t('samples.emptyTitle')}
        action={<Button variant="secondary">{t('samples.emptyAction')}</Button>}
      />
      <EmptyState
        illustration="offline"
        title={t('samples.errorTitle')}
        action={<Button variant="secondary">{tc('tryAgain')}</Button>}
      />
    </Section>
  );
}

function SheetSection() {
  const t = useTranslations('gallery');
  const [open, setOpen] = useState(false);
  return (
    <Section title={t('sections.sheet')}>
      <View className="flex-row">
        <Button variant="secondary" onPress={() => setOpen(true)}>
          {t('samples.openSheet')}
        </Button>
      </View>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('samples.sheetTitle')}
        description={t('samples.sheetBody')}
      >
        <View className="gap-1">
          <PrayerRow
            prayer="fajr"
            time={at(4, 52)}
            timeZone="UTC"
            state="logged"
            onPress={() => {}}
          />
          <PrayerRow prayer="dhuhr" time={at(12, 21)} timeZone="UTC" onPress={() => {}} />
          <PrayerRow prayer="asr" time={at(15, 34)} timeZone="UTC" onPress={() => {}} />
        </View>
      </Sheet>
    </Section>
  );
}
