// Expo configures Metro for the pnpm monorepo automatically (SDK 52+).
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// The web app's build output, public files (the mushaf page fonts) and test results are never part
// of the phone app: kept out of Metro's crawl of the monorepo, whose file watcher otherwise times
// out on Windows after a few web builds.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  /apps[\\/]web[\\/]\.next[\\/].*/,
  /apps[\\/]web[\\/]public[\\/].*/,
  /apps[\\/]web[\\/]e2e[\\/]\.(results|screens)[\\/].*/,
];

// withUniwindConfig must stay the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  // The Quran reader's paper theme, scoped with <ScopedTheme theme="sepia">.
  extraThemes: ['sepia'],
});
