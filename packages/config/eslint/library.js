// Flat config for the pure TypeScript packages (no React, no platform code).
import tseslint from 'typescript-eslint';
import logicalProperties from './logical-properties.js';

export default tseslint.config(
  { ignores: ['**/generated/**', '**/dist/**'] },
  ...tseslint.configs.recommended,
  {
    plugins: { murshid: logicalProperties },
    rules: {
      'murshid/logical-properties': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-native', 'next'],
          patterns: ['react/*', 'react-native/*', 'next/*', 'expo*'],
        },
      ],
    },
  },
);
