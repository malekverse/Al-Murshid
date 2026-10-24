import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // SPEC 8.1: core has 100% unit-test coverage of prayer, Qibla, Hijri and Journey logic.
      include: [
        'src/prayer-times.ts',
        'src/prayer-state.ts',
        'src/qibla.ts',
        'src/hijri.ts',
        'src/journey.ts',
        'src/reminders.ts',
        'src/sun.ts',
        'src/geo.ts',
        'src/today.ts',
        'src/calendar.ts',
        'src/khatmah.ts',
        'src/recitation.ts',
        'src/recitation-check.ts',
        'src/seasons.ts',
        'src/your-sky.ts',
        'src/reflection.ts',
        'src/tasbih.ts',
        'src/widget.ts',
        'src/rise.ts',
        'src/tools.ts',
        'src/zone-times.ts',
      ],
      thresholds: { lines: 100, functions: 100, statements: 100, branches: 100 },
      reporter: ['text-summary', 'text'],
    },
  },
});
