import { BookOpen, CaretLeft, DotsThree, EyeSlash, Play, TextAa } from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import {
  ayahWords,
  loadSurahName,
  loadSurahText,
  loadTranslation,
  pageOf,
  sajdaOf,
  surah as surahInfo,
  type SurahTranslation,
} from '@murshid/content/quran';
import { defaultQuranPrefs, translationFor, translationLanguage } from '@murshid/data';
import type { Locale } from '@murshid/i18n';
import { surahNameSize, typeScale } from '@murshid/tokens';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Fragment, Suspense } from 'react';
import { Text } from '@/components/ui/text';
import { breadcrumbs, JsonLd, siteUrl } from '@/lib/seo';
import {
  ayahClass,
  ayahFooterClass,
  footnoteClass,
  ICON_SIZE,
  iconButtonClass,
  readerBackClass,
  readerBarClass,
  readerBarRowClass,
  readerMainClass,
  surahNavClass,
  surahNavLinkClass,
  serverWordsClass,
  surahOpeningClass,
  type IconButtonVariant,
} from './reader-markup';
import { ReaderUpgrade } from './reader-upgrade';
import { SurahNameOutline } from './surah-name-outline';

// A surah as the server sends it (Phase 6): the published text with the translation of the
// address's language, in the reader's default view, ready to read before any script runs. Its
// markup is the reader's (reader-markup.ts), so the full reader takes over without anything
// moving (ReaderUpgrade). Controls carry what they ask for (`data-intent`); links just work.

/** The ayah actions' icon, drawn once per page and used by every ayah (keeps long surahs small). */
const ACTIONS_ICON = 'icon-dots-three';

/** A button the full reader answers, once it has taken over. */
function IntentButton({
  icon: IconComponent,
  label,
  intent,
  variant,
  pressed,
}: {
  /** An icon, or the id of one drawn once on the page. */
  icon: Icon | string;
  label: string;
  intent: string;
  variant?: IconButtonVariant;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      data-intent={intent}
      className={iconButtonClass(variant)}
    >
      {typeof IconComponent === 'string' ? (
        <svg width={ICON_SIZE} height={ICON_SIZE} aria-hidden>
          <use href={`#${IconComponent}`} width={ICON_SIZE} height={ICON_SIZE} />
        </svg>
      ) : (
        <IconComponent size={ICON_SIZE} weight="regular" aria-hidden />
      )}
    </button>
  );
}

export async function StaticSurah({ locale, surah }: { locale: Locale; surah: number }) {
  const info = surahInfo(surah);
  const translation = translationFor(defaultQuranPrefs(), locale);
  const lang = translation ? translationLanguage[translation] : null;
  const [text, fatiha, tr, t, tAyah, format, calligraphy] = await Promise.all([
    loadSurahText(surah),
    loadSurahText(1),
    lang ? loadTranslation(lang, surah) : Promise.resolve<SurahTranslation | null>(null),
    getTranslations({ locale, namespace: 'quran' }),
    getTranslations({ locale, namespace: 'components.ayah' }),
    getFormatter({ locale }),
    loadSurahName(surah),
  ]);
  const name = (n: number) => (locale === 'ar' ? surahInfo(n).nameArabic : surahInfo(n).nameSimple);
  const size = typeScale.quran.arabic.size;
  const lineHeight = typeScale.quran.arabic.lineHeight;
  const basmalah = ayahWords(fatiha, 1).slice(0, -1);
  // The ayahs in groups of a dozen.
  const groups: number[][] = [];
  for (let ayah = 1; ayah <= text.w.length; ayah++) {
    if ((ayah - 1) % 12 === 0) groups.push([]);
    groups.at(-1)!.push(ayah);
  }

  return (
    <ReaderUpgrade locale={locale} surah={surah} translationLang={lang}>
      <div className="min-h-dvh bg-canvas text-ink">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Chapter',
            name: name(surah),
            alternateName: [info.nameArabic, info.nameSimple],
            position: surah,
            inLanguage: 'ar',
            url: `${siteUrl}/${locale}/quran/${surah}`,
            isPartOf: { '@type': 'Book', name: t('seo.quran'), inLanguage: 'ar' },
          }}
        />
        <JsonLd
          data={breadcrumbs(locale, [
            { name: t('seo.quran'), path: '/quran' },
            { name: name(surah), path: `/quran/${surah}` },
          ])}
        />
        <svg aria-hidden width="0" height="0" className="absolute">
          <defs>
            <DotsThree id={ACTIONS_ICON} weight="regular" />
          </defs>
        </svg>
        <header className={readerBarClass}>
          <div className={readerBarRowClass}>
            <a href={`/${locale}/quran`} aria-label={t('reader.back')} className={readerBackClass}>
              <CaretLeft size={24} className="rtl:-scale-x-100" aria-hidden />
            </a>
            <div className="flex min-w-0 flex-1 flex-col">
              <Text as="h1" role="headline" className="truncate">
                {name(surah)}
              </Text>
              <Text as="p" role="caption" tone="muted" className="truncate">
                {`${t(`surah.${info.revelationPlace}`)} · ${t('surah.ayahs', { count: info.ayahCount })}`}
              </Text>
            </div>
            <IntentButton icon={BookOpen} label={t('reader.page')} intent="view" />
            <IntentButton
              icon={EyeSlash}
              label={t('memorize.title')}
              intent="memorize"
              pressed={false}
            />
            <IntentButton icon={TextAa} label={t('reader.settings')} intent="settings" />
            <IntentButton icon={Play} label={t('audio.play')} intent="play" variant="tinted" />
          </div>
        </header>

        <main id="main" className={readerMainClass}>
          <div className={surahOpeningClass}>
            <SurahNameOutline name={calligraphy} size={surahNameSize.header} />
            {locale !== 'ar' && (
              <Text role="callout" tone="muted">
                {info.nameSimple}
              </Text>
            )}
          </div>
          {info.bismillahPre && (
            <div className="pb-4">
              <p
                lang="ar"
                dir="rtl"
                className="text-center font-quran text-ink"
                style={{ fontSize: size, lineHeight }}
              >
                {basmalah
                  .map((w, i) => (i === basmalah.length - 1 ? w.text : w.text + w.after))
                  .join('')}
              </p>
            </div>
          )}

          {/* Hydrated a group at a time (each boundary is its own task), so a long surah never
              holds the page for long. The first group is on screen at once, so it is sent in
              place: React streams a boundary that follows a large shell after the page, and would
              reveal those ayahs late. */}
          {groups.map((group, g) => {
            const Group = g === 0 ? Fragment : Suspense;
            return (
              <Group key={group[0]}>
                {group.map((ayah) => {
                  const i = ayah - 1;
                  const words = ayahWords(text, ayah);
                  const segments = tr?.t[i];
                  return (
                    <article
                      key={ayah}
                      id={`ayah-${ayah}`}
                      data-ayah={ayah}
                      data-page={pageOf(surah, ayah)}
                      aria-label={tAyah('label', { surah: name(surah), number: ayah })}
                      className={ayahClass(false)}
                    >
                      <p
                        lang="ar"
                        dir="rtl"
                        className={`font-quran text-ink ${serverWordsClass}`}
                        style={{ fontSize: size, lineHeight }}
                        data-intent="words"
                      >
                        {words.map((w, j) =>
                          j === words.length - 1 ? (
                            <span key={j}>{w.text}</span>
                          ) : (
                            <Fragment key={j}>
                              <span>{w.text}</span>
                              {w.after}
                            </Fragment>
                          ),
                        )}
                      </p>
                      {segments && (
                        <Text role="body" className="whitespace-pre-line">
                          {segments.map((seg, k) => {
                            if (typeof seg === 'string') return <span key={k}>{seg}</span>;
                            const note = tr.f[seg[1]];
                            if (!note) return null;
                            return (
                              <button
                                key={k}
                                type="button"
                                aria-label={t('reader.footnote', { mark: seg[0] })}
                                data-intent="footnote"
                                data-mark={seg[0]}
                                data-ref={seg[1]}
                                className={footnoteClass}
                              >
                                {seg[0]}
                              </button>
                            );
                          })}
                        </Text>
                      )}
                      <div className={ayahFooterClass}>
                        <Text as="span" role="caption" tone="muted">
                          {`${format.number(surah)}:${format.number(ayah)}`}
                        </Text>
                        {sajdaOf(surah, ayah) !== null && (
                          <Text as="span" role="caption" tone="lantern">
                            {t('reader.sajda')}
                          </Text>
                        )}
                        <span className="flex-1" />
                        <IntentButton
                          icon={ACTIONS_ICON}
                          label={t('actions.label', { surah, ayah })}
                          intent="actions"
                        />
                      </div>
                    </article>
                  );
                })}
              </Group>
            );
          })}

          <nav className={surahNavClass}>
            {surah > 1 ? (
              <a href={`/${locale}/quran/${surah - 1}`} className={surahNavLinkClass}>
                <Text as="span" role="callout" tone="lantern">
                  {t('reader.previous', { surah: name(surah - 1) })}
                </Text>
              </a>
            ) : (
              <span />
            )}
            {surah < 114 && (
              <a href={`/${locale}/quran/${surah + 1}`} className={surahNavLinkClass}>
                <Text as="span" role="callout" tone="lantern">
                  {t('reader.next', { surah: name(surah + 1) })}
                </Text>
              </a>
            )}
          </nav>
        </main>
      </div>
    </ReaderUpgrade>
  );
}
