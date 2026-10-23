// Fajr Rise's iOS setup (SPEC 5.10): AlarmKit's usage text, and the alarms with their "Open"
// intent compiled into the app target (iOS finds App Intents only in the app's own code). Android
// needs nothing here: the module's manifest brings its permissions, receiver and service.

const {
  IOSConfig,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FILE = 'FajrRiseAlarms.swift';

const withFajrRise = (config, { alarmKitUsage } = {}) => {
  config = withInfoPlist(config, (c) => {
    c.modResults.NSAlarmKitUsageDescription =
      alarmKitUsage ?? 'Al-Murshid rings Fajr Rise, the alarm you set for Fajr.';
    return c;
  });

  config = withDangerousMod(config, [
    'ios',
    async (c) => {
      const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
      const target = path.join(c.modRequest.platformProjectRoot, name, FILE);
      const source = path.join(c.modRequest.projectRoot, 'modules', 'fajr-rise', 'ios-app', FILE);
      await fs.promises.copyFile(source, target);
      return c;
    },
  ]);

  config = withXcodeProject(config, (c) => {
    const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    const filepath = `${name}/${FILE}`;
    if (!c.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: name,
        project: c.modResults,
      });
    }
    return c;
  });

  return config;
};

module.exports = withFajrRise;
