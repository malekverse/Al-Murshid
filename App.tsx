import "./global.css";
import React, { useEffect, useState } from 'react';
import './src/i18n';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { initLanguageFromStorage } from './src/i18n';
import i18n from './src/i18n';

cssInterop(LinearGradient, {
  className: 'style',
});

export default function App() {
  const [langKey, setLangKey] = useState(i18n.language);

  useEffect(() => {
    // Initialize language from persisted storage on startup
    initLanguageFromStorage();

    // Listen for language changes to force full re-render of the tree
    const onLanguageChanged = (lng: string) => {
      setLangKey(lng);
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  return (
    <NavigationContainer key={langKey}>
      <RootNavigator />
    </NavigationContainer>
  );
}
