import { createRequire } from 'node:module';
import { defineConfig } from 'eslint/config';
import logicalProperties from '@murshid/config/eslint/logical-properties';

const require = createRequire(import.meta.url);
const expoConfig = require('eslint-config-expo/flat');

export default defineConfig([
  expoConfig,
  {
    plugins: { murshid: logicalProperties },
    rules: { 'murshid/logical-properties': 'error' },
  },
  { ignores: ['dist/*', '.expo/*', 'src/uniwind-types.d.ts'] },
]);
