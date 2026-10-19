import { loadTafsir, tafsirOf, tafsirRuns } from '@murshid/content/quran';
import { fonts, space } from '@murshid/tokens';
import { Text as RNText, ScrollView, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAppLocale } from '@/lib/locale';
import { useLoad } from '@/lib/quran';

/**
 * The short tafsir of an ayah (SPEC 5.5, Phase 5b): Al-Mukhtasar in the app's language. A passage
 * may explain several ayahs; it shows once, with the ayahs it covers. Its own bold and italic are
 * kept, but Arabic is never set in italics (SPEC 7).
 */
export function TafsirSheet({
  target,
  onClose,
}: {
  target: { surah: number; ayah: number; title: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const { locale } = useAppLocale();
  const surah = target?.surah ?? 1;
  const data = useLoad(
    target ? () => loadTafsir(locale, surah) : null,
    `tafsir/${locale}/${surah}`,
  );
  const passage = target && data.data ? tafsirOf(data.data, target.ayah) : null;

  return (
    <Sheet
      open={target !== null}
      onClose={onClose}
      title={target ? `${t('tafsir.title')} · ${target.title}` : ''}
    >
      {data.error ? (
        <View className="gap-3">
          <Text role="body">{t('tafsir.error')}</Text>
          <Button variant="secondary" onPress={data.retry} className="self-start">
            {t('reader.retry')}
          </Button>
        </View>
      ) : !passage ? (
        <View className="gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </View>
      ) : (
        <ScrollView style={{ maxHeight: space[16] * 7 }} contentContainerStyle={{ gap: space[4] }}>
          {passage.from !== passage.to && (
            <Text role="callout" tone="lantern">
              {t('tafsir.covers', {
                from: format.number(passage.from),
                to: format.number(passage.to),
              })}
            </Text>
          )}
          <Text role="body">
            {tafsirRuns(passage.text).map((run, i) => (
              <RNText
                key={i}
                style={{
                  // The weight comes from its own family, so Arabic never gets a synthetic bold.
                  fontFamily: run.bold ? fonts.native.ui[600] : undefined,
                  fontStyle: run.italic && locale !== 'ar' ? 'italic' : 'normal',
                }}
              >
                {run.text}
              </RNText>
            ))}
          </Text>
          <Text role="caption" tone="muted">
            {t('tafsir.source')}
          </Text>
        </ScrollView>
      )}
    </Sheet>
  );
}
