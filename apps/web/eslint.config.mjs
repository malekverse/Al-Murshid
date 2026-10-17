import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import logicalProperties from '@murshid/config/eslint/logical-properties';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { murshid: logicalProperties },
    rules: { 'murshid/logical-properties': 'error' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
