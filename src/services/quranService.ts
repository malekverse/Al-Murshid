/**
 * Quran Data Service
 * 
 * Data Source: Al-Quran Cloud API (https://alquran.cloud)
 * Arabic Text: Uthmani Mushaf script (quran-uthmani edition)
 * English Translation: Saheeh International (en.sahih edition)
 * 
 * This is one of the most widely-used and verified Quran APIs,
 * sourced from the King Fahd Complex for the Printing of the Holy Quran.
 */

const API_BASE = 'https://api.alquran.cloud/v1';

export interface SurahMeta {
  number: number;
  name: string;           // Arabic name with tashkeel
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

export interface SurahDetail {
  arabic: Ayah[];
  translation: Ayah[];
  meta: SurahMeta;
}

/**
 * Fetch the list of all 114 Surahs with metadata.
 * Returns accurate data from the Al-Quran Cloud API.
 */
export async function fetchSurahList(): Promise<SurahMeta[]> {
  const res = await fetch(`${API_BASE}/surah`);
  if (!res.ok) throw new Error(`Failed to fetch surah list: ${res.status}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error('Invalid API response');
  return json.data;
}

/**
 * Fetch a complete Surah with:
 * - Arabic text in Uthmani script
 * - Saheeh International English translation
 * 
 * Both editions are fetched in a single API call for efficiency.
 */
export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const res = await fetch(`${API_BASE}/surah/${surahNumber}/editions/quran-uthmani,en.sahih`);
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}: ${res.status}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error('Invalid API response');

  const [arabicEdition, translationEdition] = json.data;

  return {
    arabic: arabicEdition.ayahs,
    translation: translationEdition.ayahs,
    meta: {
      number: arabicEdition.number,
      name: arabicEdition.name,
      englishName: arabicEdition.englishName,
      englishNameTranslation: arabicEdition.englishNameTranslation,
      numberOfAyahs: arabicEdition.numberOfAyahs,
      revelationType: arabicEdition.revelationType,
    },
  };
}

/**
 * Fetch audio URL for a surah from a specific reciter.
 * Default: Mishary Rashid Alafasy (ar.alafasy)
 */
export function getAudioUrl(surahNumber: number, reciter: string = 'ar.alafasy'): string {
  // Individual ayah audio format from the CDN
  const paddedSurah = String(surahNumber).padStart(3, '0');
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${paddedSurah}.mp3`;
}

/**
 * Mushaf Page Data
 * 
 * The Madina Mushaf has exactly 604 pages.
 * This function fetches the Uthmani Arabic text for a specific page,
 * returning exactly the ayahs that appear on that physical page
 * of the printed Mushaf.
 */
export interface MushafPageAyah {
  number: number;
  numberInSurah: number;
  text: string;
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  juz: number;
  hizbQuarter: number;
  page: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
  audio?: string;
}

export interface MushafPageData {
  pageNumber: number;
  ayahs: MushafPageAyah[];
  surahs: { [key: string]: { name: string; englishName: string; number: number } };
}

export async function fetchMushafPage(pageNumber: number, reciter: string = 'ar.alafasy'): Promise<MushafPageData> {
  if (pageNumber < 1 || pageNumber > 604) {
    throw new Error('Page number must be between 1 and 604');
  }

  // Fetch both Uthmani text and audio edition concurrently
  const [textRes, audioRes] = await Promise.all([
    fetch(`${API_BASE}/page/${pageNumber}/quran-uthmani`),
    fetch(`${API_BASE}/page/${pageNumber}/${reciter}`)
  ]);

  if (!textRes.ok) throw new Error(`Failed to fetch page ${pageNumber}: ${textRes.status}`);
  
  const textJson = await textRes.json();
  const audioJson = audioRes.ok ? await audioRes.json() : null;

  if (textJson.code !== 200) throw new Error('Invalid API response');

  const ayahs: MushafPageAyah[] = textJson.data.ayahs.map((a: any, index: number) => {
    let audioUrl = undefined;
    if (audioJson && audioJson.data && audioJson.data.ayahs && audioJson.data.ayahs[index]) {
      audioUrl = audioJson.data.ayahs[index].audio;
    }

    return {
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.text,
      surahNumber: a.surah.number,
      surahName: a.surah.name,
      surahEnglishName: a.surah.englishName,
      juz: a.juz,
      hizbQuarter: a.hizbQuarter,
      page: a.page,
      sajda: a.sajda,
      audio: audioUrl,
    };
  });

  return {
    pageNumber,
    ayahs,
    surahs: textJson.data.surahs,
  };
}

export const TOTAL_MUSHAF_PAGES = 604;
