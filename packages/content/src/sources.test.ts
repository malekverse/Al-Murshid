import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sources from '../sources.json';

const root = fileURLToPath(new URL('../../../', import.meta.url));

// SPEC 10: the bundled Quran text, and the font that renders it, must be byte for byte what the
// source published. A changed hash means a file was edited, re-encoded or replaced.
describe('bundled sources match what was published', () => {
  for (const file of sources.files) {
    it(`${file.path} is unmodified`, () => {
      const hash = createHash('sha256')
        .update(readFileSync(root + file.path))
        .digest('hex');
      expect(hash).toBe(file.sha256);
    });
  }

  it('records a source, a publisher and a license for every file', () => {
    for (const file of sources.files) {
      expect(file.url).toMatch(/^https:\/\//);
      expect(file.publisher.length).toBeGreaterThan(0);
      expect(file.license.length).toBeGreaterThan(0);
    }
  });
});
