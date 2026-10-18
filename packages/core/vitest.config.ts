import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // SPEC 8.1: core has 100% unit-test coverage of prayer, Qibla, Hijri and Journey logic.
      include: [
        'src/prayer-times.ts',
        'src/qibla.ts',
        'src/hijri.ts',
        'src/journey.ts',
        'src/reminders.ts',
        'src/sun.ts',
        'src/geo.ts',
      ],
      thresholds: { lines: 100, functions: 100, statements: 100, branches: 100 },
      reporter: ['text-summary', 'text'],
    },
  },
});
