import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Some tests read all 114 surahs of every file in quran/generated.
  test: { testTimeout: 60_000 },
});
