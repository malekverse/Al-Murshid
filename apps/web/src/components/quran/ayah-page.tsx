import { CaretLeft } from '@phosphor-icons/react/ssr';
import {
  ayahWords,
  loadSurahText,
  loadTafsir,
  loadTranslation,
  loadTransliteration,
  sajdaOf,
  surah as surahInfo,
  tafsirOf,
  tafsirRuns,
} from '@murshid/content/quran';
import { defaultQuranPrefs, translationFor, translationLanguage } from '@murshid/data';
import type { Locale } from '@murshid/i18n';
import { quranFocusSize, typeScale } from '@murshid/tokens';
import { getFormatter, getTranslations } from 'next-intl/server';
import { buttonClass } from '@/components/ui/button-markup';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { breadcrumbs, JsonLd, siteUrl } from '@/lib/seo';
import { ListenButton } from './listen-button';
import {
  readerBackClass,
  readerBarClass,
  readerBarRowClass,
  surahNavLinkClass,
} from './reader-markup';

// An ayah's own page (Phase 6, SPEC 4's /quran/2/255): the ayah, its translation and notes, its
// words with their meanings and sounds, and its short tafsir, all sent by the server so the page
// reads and ranks as it is. "Read the surah from here" opens the reader at it; inside the app,
// links to read an ayah go there too (/quran/2#ayah-255).

/** The ayah before or after, across surahs. */
function neighbour(surah: number, ayah: number, by: 1 | -1): [number, number] | null {
  if (by === -1) {
    if (ayah > 1) return [surah, ayah - 1];
    return surah > 1 ? [surah - 1, surahInfo(surah - 1).ayahCount] : null;
  }
  if (ayah < surahInfo(surah).ayahCount) return [surah, ayah + 1];
  return surah < 114 ? [surah + 1, 1] : null;
}

export async function AyahPage({
  locale,
  surah,
  ayah,
}: {
  locale: Locale;
  surah: number;
  ayah: number;
}) {
  const info = surahInfo(surah);
  const translation = translationFor(defaultQuranPrefs(), locale);
  // Word meanings come in the translation's language, or English in Arabic, as in the reader.
  const meaningLang = translation ? translationLanguage[translation] : 'en';
  const [text, tr, translit, tafsir, t, format] = await Promise.all([
    loadSurahText(surah),
    loadTranslation(meaningLang, surah),
    loadTransliteration(surah),
    loadTafsir(locale, surah),
    getTranslations({ locale, namespace: 'quran' }),
    getFormatter({ locale }),
  ]);
  const name = (n: number) => (locale === 'ar' ? surahInfo(n).nameArabic : surahInfo(n).nameSimple);
  const ref = ([s, a]: [number, number]) => `${name(s)} ${format.number(a)}`;
  const words = ayahWords(text, ayah);
  const meanings = tr.m[ayah - 1] ?? [];
  const sounds = translit[ayah - 1] ?? [];
  const segments = translation ? tr.t[ayah - 1] : null;
  const notes = (segments ?? []).flatMap((seg) =>
    typeof seg === 'string' || !tr.f[seg[1]] ? [] : [{ mark: seg[0], text: tr.f[seg[1]]! }],
  );
  const passage = tafsirOf(tafsir, ayah);
  const previous = neighbour(surah, ayah, -1);
  const next = neighbour(surah, ayah, 1);
  const title = `${name(surah)} ${format.number(ayah)}`;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Quotation',
          name: title,
          text: words.map((w, i) => (i === words.length - 1 ? w.text : w.text + w.after)).join(''),
          inLanguage: 'ar',
          url: `${siteUrl}/${locale}/quran/${surah}/${ayah}`,
          isPartOf: {
            '@type': 'Chapter',
            name: name(surah),
            position: surah,
            url: `${siteUrl}/${locale}/quran/${surah}`,
            isPartOf: { '@type': 'Book', name: t('seo.quran'), inLanguage: 'ar' },
          },
        }}
      />
      <JsonLd
        data={breadcrumbs(locale, [
          { name: t('seo.quran'), path: '/quran' },
          { name: name(surah), path: `/quran/${surah}` },
          { name: title, path: `/quran/${surah}/${ayah}` },
        ])}
      />
      <header className={readerBarClass}>
        <div className={readerBarRowClass}>
          <a
            href={`/${locale}/quran/${surah}`}
            aria-label={t('ayahPage.inSurah', { surah: name(surah) })}
            className={readerBackClass}
          >
            <CaretLeft size={24} className="rtl:-scale-x-100" aria-hidden />
          </a>
          <div className="flex min-w-0 flex-1 flex-col">
            <Text as="h1" role="headline" className="truncate">
              {title}
            </Text>
            <Text as="p" role="caption" tone="muted" className="truncate">
              {`${t('ayahPage.position', { number: format.number(ayah), count: format.number(info.ayahCount) })} · ${t(`surah.${info.revelationPlace}`)}`}
            </Text>
          </div>
          <ListenButton
            surah={surah}
            ayah={ayah}
            labels={{ listen: t('ayahPage.listen'), pause: t('ayahPage.pause') }}
          />
        </div>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-reading flex-col gap-12 px-4 pt-8 pb-32">
        <article aria-label={title} className="flex flex-col gap-6 border-b border-hairline pb-8">
          <p
            lang="ar"
            dir="rtl"
            className="text-center font-quran text-ink"
            style={{ fontSize: quranFocusSize, lineHeight: typeScale.quran.arabic.lineHeight }}
          >
            {words.map((w, i) => (i === words.length - 1 ? w.text : w.text + w.after)).join('')}
          </p>
          {segments && (
            <Text role="body" className="whitespace-pre-line">
              {segments.map((seg, i) =>
                typeof seg === 'string' ? (
                  <span key={i}>{seg}</span>
                ) : tr.f[seg[1]] ? (
                  <sup key={i} className="px-1 text-caption text-lantern-ink">
                    {seg[0]}
                  </sup>
                ) : null,
              )}
            </Text>
          )}
          {segments && translation && (
            <Text role="caption" tone="muted">
              {t('reader.translationBy', { name: t(`settings.${translation}`) })}
            </Text>
          )}
          {notes.length > 0 && (
            <section aria-label={t('ayahPage.notes')} className="flex flex-col gap-2">
              {notes.map((n) => (
                <Text key={n.mark} role="callout" tone="muted">
                  <span className="text-lantern-ink">{n.mark}</span> {n.text}
                </Text>
              ))}
            </section>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Text as="span" role="caption" tone="muted">
              {`${format.number(surah)}:${format.number(ayah)}`}
            </Text>
            {sajdaOf(surah, ayah) !== null && (
              <Text as="span" role="caption" tone="lantern">
                {t('reader.sajda')}
              </Text>
            )}
            <span className="flex-1" />
            <a
              href={`/${locale}/quran/${surah}#ayah-${ayah}`}
              className={buttonClass({ script: locale === 'ar' ? 'arabic' : 'latin' })}
            >
              {t('ayahPage.readFromHere')}
            </a>
          </div>
        </article>

        <section aria-labelledby="words" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text as="h2" id="words" role="title2">
              {t('ayahPage.words')}
            </Text>
            <Text role="callout" tone="muted">
              {t('ayahPage.wordsHint')}
            </Text>
          </div>
          <ol lang="ar" dir="rtl" className="flex flex-wrap gap-3">
            {words.slice(0, -1).map((w, i) => (
              <li
                key={i}
                className="flex min-w-24 flex-col items-center gap-1 rounded-card border border-card-edge bg-surface px-4 py-3 shadow-card dark:shadow-none"
              >
                <span
                  className="font-quran text-ink"
                  style={{
                    fontSize: typeScale.quran.arabic.size,
                    lineHeight: typeScale.quran.arabic.lineHeight,
                  }}
                >
                  {w.text}
                </span>
                {meanings[i] && (
                  <Text
                    as="span"
                    role="caption"
                    dir="auto"
                    lang={meaningLang}
                    className="max-w-32 text-center"
                  >
                    {meanings[i]}
                  </Text>
                )}
                {sounds[i] && (
                  <Text
                    as="span"
                    role="caption"
                    tone="lantern"
                    script="latin"
                    dir="ltr"
                    lang="en"
                    className="text-center"
                  >
                    {sounds[i]}
                  </Text>
                )}
              </li>
            ))}
          </ol>
        </section>

        {passage && (
          <section aria-labelledby="tafsir" className="flex flex-col gap-3">
            <Text as="h2" id="tafsir" role="title2">
              {t('tafsir.title')}
            </Text>
            {passage.from !== passage.to && (
              <Text role="callout" tone="lantern">
                {t('tafsir.covers', {
                  from: format.number(passage.from),
                  to: format.number(passage.to),
                })}
              </Text>
            )}
            <Text role="body" className="whitespace-pre-line">
              {tafsirRuns(passage.text).map((run, i) => (
                <span
                  key={i}
                  className={cn(
                    run.bold && 'font-semibold',
                    run.italic && locale !== 'ar' && 'italic',
                  )}
                >
                  {run.text}
                </span>
              ))}
            </Text>
            <Text role="caption" tone="muted">
              {t('tafsir.source')}
            </Text>
          </section>
        )}

        <nav className="flex flex-wrap justify-between gap-4">
          {previous ? (
            <a
              href={`/${locale}/quran/${previous[0]}/${previous[1]}`}
              className={surahNavLinkClass}
            >
              <Text as="span" role="callout" tone="lantern">
                {t('ayahPage.previous', { ref: ref(previous) })}
              </Text>
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a href={`/${locale}/quran/${next[0]}/${next[1]}`} className={surahNavLinkClass}>
              <Text as="span" role="callout" tone="lantern">
                {t('ayahPage.next', { ref: ref(next) })}
              </Text>
            </a>
          )}
        </nav>
      </main>
    </div>
  );
}
