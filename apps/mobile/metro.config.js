// Expo configures Metro for the pnpm monorepo automatically (SDK 52+).
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// withUniwindConfig must stay the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  // The Quran reader's paper theme, scoped with <ScopedTheme theme="sepia">.
  extraThemes: ['sepia'],
});
