// The app's entry. Background work must be defined here, before Expo Router: when Android
// wakes the app for a notification action (SPEC 5.2, "I prayed" with the app closed), it runs
// this file without rendering any screen, so tasks defined only in a layout would never exist.
import './src/lib/intl-polyfills';
import './src/lib/background';
import 'expo-router/entry';
