import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Booting Postgres (WebAssembly) and applying migrations takes a few seconds alone and
    // longer when CI runs every package in parallel.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
