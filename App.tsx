import "./global.css";
import React, { useEffect, useState } from 'react';
import './src/i18n';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { initLanguageFromStorage } from './src/i18n';
import i18n from './src/i18n';
import { initDatabase } from './src/store/database';
import ErrorBoundary from './src/components/ErrorBoundary';

cssInterop(LinearGradient, {
  className: 'style',
});

export default function App() {
  const [langKey, setLangKey] = useState(i18n.language);

  useEffect(() => {
    initLanguageFromStorage();
    initDatabase().catch(console.error);

    const onLanguageChanged = (lng: string) => {
      setLangKey(lng);
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  return (
    <ErrorBoundary>
      <NavigationContainer key={langKey}>
        <RootNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
