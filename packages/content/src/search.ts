// Text normalization for search only. Nothing here touches what is displayed: the Quran is always
// shown exactly as published, and these functions build the plain forms it is matched against.

/**
 * Arabic without harakat, Quranic annotation marks, small letters, tatweel or letter variants,
 * so a search for "الرحمن" finds "ٱلرَّحۡمَٰنِ". Ayah numbers and the rub and sajdah signs drop out.
 */
export function normalizeArabic(text: string): string {
  return (
    text
      .normalize('NFD')
      // Every combining mark (harakat, the superscript alef, the mushaf's small high signs), then
      // tatweel, the small waw and yeh, the rub el hizb and sajdah signs, and Arabic digits.
      .replace(/\p{M}/gu, '')
      .replace(/[ـۥۦ۞۩٠-٩۰-۹]/g, '')
      .replace(/[أإآٱٲٳٵ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  );
}

/** Latin text, lowercase and without accents, so "priere" finds "prière". */
export function normalizeLatin(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
