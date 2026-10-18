import { describe, expect, it } from 'vitest';
import {
  detectDirection,
  direction,
  intlLocale,
  isolate,
  matchLocale,
  numberingSystem,
  toArabicIndic,
} from './index';

describe('locales', () => {
  it('maps direction from the language', () => {
    expect(direction('ar')).toBe('rtl');
    expect(direction('ar-TN')).toBe('rtl');
    expect(direction('en')).toBe('ltr');
    expect(direction('fr-FR')).toBe('ltr');
  });

  it('matches the device language and falls back to Arabic', () => {
    expect(matchLocale(['fr-FR', 'en-US'])).toBe('fr');
    expect(matchLocale(['en_GB'])).toBe('en');
    expect(matchLocale(['tr-TR', 'de-DE'])).toBe('ar');
    expect(matchLocale([])).toBe('ar');
  });
});

describe('digits', () => {
  it('uses Western digits in every language by default, Arabic included', () => {
    expect(numberingSystem('en', 'US')).toBe('latn');
    expect(numberingSystem('fr', 'MA')).toBe('latn');
    expect(numberingSystem('ar', 'TN')).toBe('latn');
    expect(numberingSystem('ar', 'SA')).toBe('latn');
    expect(numberingSystem('ar', 'EG')).toBe('latn');
    expect(numberingSystem('ar', null)).toBe('latn');
  });

  it('lets a person opt into Arabic-Indic digits', () => {
    expect(numberingSystem('ar', 'SA', 'arab')).toBe('arab');
    expect(numberingSystem('en', 'US', 'arab')).toBe('arab');
    expect(numberingSystem('ar', 'SA', 'latn')).toBe('latn');
  });

  it('builds a tag Intl understands', () => {
    expect(intlLocale('ar', 'tn')).toBe('ar-TN-u-nu-latn');
    expect(intlLocale('ar', undefined)).toBe('ar-u-nu-latn');
    expect(new Intl.NumberFormat(intlLocale('ar', 'SA')).format(48)).toBe('48');
    expect(new Intl.NumberFormat(intlLocale('ar', 'SA', 'arab')).format(48)).toBe('٤٨');
  });

  it('converts ayah numbers to Arabic-Indic', () => {
    expect(toArabicIndic(255)).toBe('٢٥٥');
  });
});

describe('bidi', () => {
  it('wraps text in isolate marks', () => {
    expect(isolate('Asr', 'ltr')).toBe('⁦Asr⁩');
    expect(isolate('العصر')).toBe('⁨العصر⁩');
  });

  it('detects the first strong direction', () => {
    expect(detectDirection('123 العصر')).toBe('rtl');
    expect(detectDirection('« Asr »')).toBe('ltr');
    expect(detectDirection('123')).toBeNull();
  });
});
