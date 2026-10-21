import { describe, expect, it } from 'vitest';
import { buildExport, exportFileName } from './data-export';
import { newLog } from './prayer-log';
import { newBookmark } from './quran';
import {
  emptyReflection,
  parseReflectionPlaintext,
  REFLECTION_MAX,
  reflectionPlaintext,
  tidyReflection,
} from './reflection';
import { defaultSettings, setAsideReflection, settledNights } from './settings';

const sunday = { year: 2026, month: 10, day: 18 };
const at = '2026-10-18T20:30:00.000Z';

describe('night reflection', () => {
  it('trims each field, and nothing written is no reflection', () => {
    expect(tidyReflection(emptyReflection)).toBeNull();
    expect(tidyReflection({ gratitude: '  ', intention: '\n', note: '' })).toBeNull();
    expect(tidyReflection({ gratitude: ' Family ', intention: '', note: '' })).toEqual({
      gratitude: 'Family',
      intention: '',
      note: '',
    });
    const long = 'a'.repeat(REFLECTION_MAX + 5);
    expect(tidyReflection({ gratitude: '', intention: '', note: long })?.note).toHaveLength(
      REFLECTION_MAX,
    );
  });

  it('seals the fields only, and reads them back with the evening and time', () => {
    const text = { gratitude: 'Family', intention: 'Fajr on time', note: 'A quiet day' };
    const plaintext = reflectionPlaintext(text);
    expect(JSON.parse(plaintext)).toEqual(text);
    expect(parseReflectionPlaintext('2026-10-18', plaintext, at)).toEqual({
      ...text,
      date: '2026-10-18',
      updatedAt: at,
    });
  });

  it('gives nothing back from damaged plaintext', () => {
    expect(parseReflectionPlaintext('2026-10-18', '{"gratitude":', at)).toBeNull();
    expect(parseReflectionPlaintext('2026-10-18', '{"gratitude":1}', at)).toBeNull();
    expect(parseReflectionPlaintext('18/10', reflectionPlaintext(emptyReflection), at)).toBeNull();
  });

  it('settles the evenings written and the one set aside', () => {
    const s = defaultSettings();
    expect(s.reflectionPrompt).toBe(true);
    expect(settledNights(s, ['2026-10-17'])).toEqual(['2026-10-17']);
    expect(settledNights(setAsideReflection(s, sunday), ['2026-10-17'])).toEqual([
      '2026-10-17',
      '2026-10-18',
    ]);
  });
});

describe('export', () => {
  it('holds everything on the device, in order, without tombstones', () => {
    const settings = defaultSettings();
    const live = newLog(sunday, 'asr', 'app', new Date(at));
    const earlier = newLog({ year: 2026, month: 10, day: 17 }, 'fajr', 'notification');
    const removed = { ...newLog(sunday, 'isha', 'app'), deleted: true };
    const kept = newBookmark(18, 10, 'lantern', null, new Date('2026-10-02T10:00:00Z'));
    const first = newBookmark(2, 255, 'sage', null, new Date('2026-10-01T10:00:00Z'));
    const gone = { ...newBookmark(1, 1, 'sky'), deleted: true };
    const file = buildExport(
      {
        settings,
        prayerLogs: [live, removed, earlier],
        ramadanLogs: [],
        quranBookmarks: [kept, gone, first],
        readingPosition: null,
        khatmah: null,
        reflections: [
          { date: '2026-10-18', gratitude: 'b', intention: '', note: '', updatedAt: at },
          { date: '2026-10-17', gratitude: 'a', intention: '', note: '', updatedAt: at },
        ],
      },
      { exportedAt: new Date(at), platform: 'web' },
    );
    expect(file).toMatchObject({
      format: 'al-murshid-export',
      version: 1,
      exportedAt: at,
      platform: 'web',
      settings,
    });
    expect(file.prayerLogs.map((l) => `${l.date}:${l.prayer}`)).toEqual([
      '2026-10-17:fajr',
      '2026-10-18:asr',
    ]);
    expect(file.prayerLogs[0]).not.toHaveProperty('deleted');
    expect(file.quranBookmarks.map((b) => b.surah)).toEqual([2, 18]);
    expect(file.quranBookmarks[0]).not.toHaveProperty('deleted');
    expect(file.reflections.map((r) => r.gratitude)).toEqual(['a', 'b']);
    expect(exportFileName(sunday)).toBe('al-murshid-2026-10-18.json');
  });
});
