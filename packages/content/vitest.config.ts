import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Some tests read all 114 surahs of every file in quran/generated, and the cities test loads the
  // whole table before it starts (over 10 s on a busy CI machine).
  test: { testTimeout: 60_000, hookTimeout: 60_000 },
});
