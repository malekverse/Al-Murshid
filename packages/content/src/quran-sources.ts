import sources from '../quran/generated/sources.json';

/**
 * The QuranEnc releases the apps show, with the version each credit must name (SPEC 10). Built by
 * scripts/build-quran.ts from the pinned files.
 */
export const quranSources: {
  translation: Record<'en' | 'fr', { key: string; version: string }>;
  tafsir: Record<'ar' | 'fr', { key: string; version: string }>;
} = sources;

/** The versions named by the apps' credit line ("settings.about.quran"). */
export const quranCreditVersions = {
  en: quranSources.translation.en.version,
  fr: quranSources.translation.fr.version,
  ar: quranSources.tafsir.ar.version,
  frTafsir: quranSources.tafsir.fr.version,
};
