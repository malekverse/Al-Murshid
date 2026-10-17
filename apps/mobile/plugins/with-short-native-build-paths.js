// Windows only. The repo lives in a long OneDrive path, and CMake/Ninja cannot use paths past
// 260 characters; some libraries also write the full source path into their object folder names.
// This moves every module's C++ build folder (.cxx) to %LOCALAPPDATA%\murshid-cxx\<module> and sets
// CMake's object path cap to 250, so it hashes long object names (the Android toolchain does not
// apply that cap by default, and a lower cap leaves no room for the 32-character hash).
// Nothing changes on macOS, Linux or EAS. See docs/DECISIONS.md.
const { withProjectBuildGradle } = require('expo/config-plugins');

const START = '// @generated begin al-murshid: short native build paths';
const END = '// @generated end al-murshid: short native build paths';

const SNIPPET = `${START}
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
  def cxxRoot = new File(System.getenv('LOCALAPPDATA') ?: System.getProperty('java.io.tmpdir'), 'murshid-cxx')
  subprojects { sub ->
    ['com.android.library', 'com.android.application'].each { pluginId ->
      sub.plugins.withId(pluginId) {
        sub.android.externalNativeBuild.cmake.buildStagingDirectory = new File(cxxRoot, sub.name)
        sub.android.defaultConfig.externalNativeBuild.cmake.arguments('-DCMAKE_OBJECT_PATH_MAX=250')
      }
    }
  }
}
${END}
`;

module.exports = function withShortNativeBuildPaths(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults;
    if (gradle.language !== 'groovy') return cfg;
    // Replace any earlier version of the block, then insert it before the React Native root
    // plugin, which evaluates the subprojects.
    const start = gradle.contents.indexOf(START);
    const end = gradle.contents.indexOf(END);
    if (start !== -1 && end !== -1) {
      gradle.contents =
        gradle.contents.slice(0, start) + gradle.contents.slice(end + END.length + 1);
    }
    gradle.contents = gradle.contents.replace(
      'apply plugin: "expo-root-project"',
      `${SNIPPET}\napply plugin: "expo-root-project"`,
    );
    return cfg;
  });
};
