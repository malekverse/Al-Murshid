import { createMMKV } from 'react-native-mmkv';

/** Small key-value settings (SPEC 8.3). Personal data lives in SQLite, not here. */
export const storage = createMMKV({ id: 'murshid.settings' });

export const keys = {
  locale: 'locale',
  theme: 'theme',
} as const;
