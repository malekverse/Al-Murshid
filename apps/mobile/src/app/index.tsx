import { isolate, localeNames, locales } from '@murshid/i18n';
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
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { PressableScale } from '@/components/pressable-scale';
import { Segmented } from '@/components/segmented';
import { Text } from '@/components/text';
import { useAppLocale } from '@/lib/locale';
import { useThemePreference, type ThemePreference } from '@/lib/theme';

// Phase 1 token showcase (SPEC 12). Today replaces this screen in Phase 4.
export default function ShowcaseScreen() {
  const t = useTranslations('showcase');
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + space[8],
        paddingBottom: insets.bottom + space[16],
      }}
      contentContainerClassName="gap-12 px-4"
    >
      <View className="gap-6">
        <View className="gap-3">
          <Text role="callout" tone="lantern">
            {t('eyebrow')}
          </Text>
          <Text role="display" accessibilityRole="header">
            {t('title')}
          </Text>
          <Text role="body" tone="muted">
            {t('intro')}
          </Text>
        </View>
        <Controls />
      </View>

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
    </ScrollView>
  );
}

function Controls() {
  const t = useTranslations('common');
  const { locale, setLocale } = useAppLocale();
  const [theme, setTheme] = useThemePreference();
  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
    { value: 'auto', label: t('theme.auto') },
  ];

  return (
    <View className="gap-3">
      <Segmented label={t('theme.label')} value={theme} options={themes} onChange={setTheme} />
      <Segmented
        label={t('language.label')}
        value={locale}
        options={locales.map((l) => ({
          value: l,
          label: localeNames[l],
          script: l === 'ar' ? ('arabic' as const) : ('latin' as const),
        }))}
        onChange={setLocale}
      />
    </View>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <View className="gap-6">
      <View className="gap-1">
        <Text role="title2" accessibilityRole="header">
          {title}
        </Text>
        <Text role="callout" tone="muted">
          {hint}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`overflow-hidden rounded-card border border-card-edge bg-surface shadow-card dark:shadow-none ${className}`}
    >
      {children}
    </View>
  );
}

/** Token names and values are code: always Latin and left-to-right, isolated from RTL text. */
function TokenName({ children, muted = false }: { children: string; muted?: boolean }) {
  return (
    <Text role="caption" script="latin" tone={muted ? 'muted' : 'default'}>
      {isolate(children, 'ltr')}
    </Text>
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
    <View className="flex-row flex-wrap gap-3">
      {swatches.map((s) => (
        <Card key={s.token} className="grow basis-[45%]">
          <View className="border-b border-hairline bg-canvas p-2">
            <View className={`h-16 rounded-control border border-hairline ${s.className}`} />
          </View>
          <View className="gap-1 p-3">
            <TokenName>{s.name}</TokenName>
            <TokenName muted>{colors.light[s.token]}</TokenName>
            <TokenName muted>{colors.dark[s.token]}</TokenName>
            {s.against && (
              <Text role="caption" tone="muted" className="pt-1">
                {`${t('common.theme.light')} · ${t('showcase.swatch.contrast', { ratio: ratio('light', s.token, s.against) })}\n${t('common.theme.dark')} · ${t('showcase.swatch.contrast', { ratio: ratio('dark', s.token, s.against) })}`}
              </Text>
            )}
          </View>
        </Card>
      ))}
    </View>
  );
}

function SkyGrid() {
  const t = useTranslations('glossary');
  const label = (p: SkyPeriod) => (p === 'night' ? t('night') : t(`prayer.${p}`));

  return (
    <View className="flex-row flex-wrap gap-3">
      {skyPeriods.map((period) => {
        // The glass tone follows the sky, not the app theme (SPEC 6.1, tokens glassToneFor).
        const tone = colors[glassToneFor(sky[period].bottom)];
        return (
          <View
            key={period}
            className="aspect-[3/4] grow basis-[30%] justify-end overflow-hidden rounded-card p-2"
            style={{
              experimental_backgroundImage: `linear-gradient(to bottom, ${sky[period].top}, ${sky[period].bottom})`,
            }}
          >
            <View
              className="rounded-control px-3 py-2"
              style={{ backgroundColor: tone.surfaceGlass }}
            >
              <Text role="headline" tone="inherit" style={{ color: tone.ink }}>
                {label(period)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TypeSpecimens() {
  const t = useTranslations('showcase.specimen');
  const { locale } = useAppLocale();
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
      {uiRoles.map((role) => {
        const m = typeScale[role][script];
        return (
          <View key={role} className="gap-2 border-b border-hairline p-4">
            <View className="flex-row items-center justify-between gap-3">
              <TokenName>{role.replace(/(\d)/, '-$1')}</TokenName>
              <TokenName
                muted
              >{`${metrics(m.size, m.lineHeight)} · ${typeScale[role].weight}`}</TokenName>
            </View>
            <Text role={role}>{sample[role]}</Text>
          </View>
        );
      })}
      <View className="gap-2 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <TokenName>dhikr</TokenName>
          <TokenName muted>
            {metrics(typeScale.dhikr.arabic.size, typeScale.dhikr.arabic.lineHeight)}
          </TokenName>
        </View>
        <Text role="dhikr" script="arabic">
          {t('sacredSample')}
        </Text>
        <Text role="caption" tone="muted">
          {t('sacredCaption')}
        </Text>
      </View>
    </Card>
  );
}

// Literal classes so Uniwind generates them; widths follow the space tokens.
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
    <View className="gap-3">
      <Card className="gap-4 p-6">
        <Text role="headline">{t('spacing')}</Text>
        <View className="gap-2">
          {(Object.keys(space) as unknown as (keyof typeof space)[]).map((step) => (
            <View key={step} className="flex-row items-center gap-3">
              <View className="w-8">
                <TokenName muted>{format.number(space[step])}</TokenName>
              </View>
              <View className={`h-3 rounded-full bg-lantern ${spaceWidth[step]}`} />
            </View>
          ))}
        </View>
      </Card>
      <Card className="gap-4 p-6">
        <Text role="headline">{t('radius')}</Text>
        <View className="flex-row flex-wrap gap-3">
          {(Object.keys(radiusClass) as (keyof typeof radiusClass)[]).map((name) => (
            <View key={name} className="grow basis-[40%] items-center gap-2">
              <View
                className={`h-16 w-full border border-hairline bg-canvas ${radiusClass[name]}`}
              />
              <TokenName>{name}</TokenName>
            </View>
          ))}
        </View>
      </Card>
      <Card className="flex-row items-center justify-between gap-4 p-6">
        <Text role="headline">{t('touch')}</Text>
        <View className="size-touch items-center justify-center rounded-control border-2 border-dashed border-lantern">
          <TokenName muted>{format.number(touchTarget)}</TokenName>
        </View>
      </Card>
    </View>
  );
}

function MotionTokens() {
  const t = useTranslations('showcase.motion');
  const format = useFormatter();

  return (
    <View className="gap-3">
      <Card className="min-h-touch items-center justify-center p-8">
        <PressableScale
          accessibilityRole="button"
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          className="min-h-touch items-center justify-center rounded-full bg-lantern px-8 py-3 shadow-card dark:shadow-none"
        >
          <Text role="headline" tone="onLantern">
            {t('press')}
          </Text>
        </PressableScale>
      </Card>
      <Card className="gap-4 p-6">
        <Text role="headline">{t('durations')}</Text>
        {Object.entries(duration).map(([name, ms]) => (
          <View key={name} className="flex-row items-center justify-between gap-3">
            <TokenName>{name}</TokenName>
            <Text role="caption" tone="muted">
              {t('ms', { value: ms })}
            </Text>
          </View>
        ))}
      </Card>
      <Card className="gap-4 p-6">
        <Text role="headline">{t('springs')}</Text>
        {Object.entries(spring).map(([name, s]) => (
          <View key={name} className="flex-row items-center justify-between gap-3">
            <TokenName>{`spring-${name}`}</TokenName>
            <TokenName
              muted
            >{`${format.number(s.stiffness)} / ${format.number(s.damping)}`}</TokenName>
          </View>
        ))}
      </Card>
    </View>
  );
}
