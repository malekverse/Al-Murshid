import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';
import { signUpWithEmail } from '../../services/supabase/auth';
import { getSupabase } from '../../services/supabase/client';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const setUser = useAppStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabaseUnconfigured = !getSupabase();

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setLoading(true);
    setError('');

    const result = await signUpWithEmail(email.trim(), password);
    setLoading(false);

    if (result.success && result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        displayName: displayName.trim() || email.split('@')[0],
        authProvider: 'email',
      });
    } else {
      setError(result.error || t('auth.registerError'));
    }
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 justify-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6 self-start" accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={24} color="#6ee7b7" />
            </TouchableOpacity>

            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4 border-2 border-amber-500/30">
                <Ionicons name="person-add" size={40} color="#fbbf24" />
              </View>
              <Text className="text-emerald-50 text-3xl font-bold">{t('auth.createAccount')}</Text>
              <Text className="text-emerald-400/60 text-sm mt-2">{t('auth.registerSubtitle')}</Text>
            </View>

            {supabaseUnconfigured && (
              <View className="bg-amber-900/40 border border-amber-700/50 rounded-xl p-3 mb-4">
                <Text className="text-amber-300 text-sm text-center font-medium">
                  ⚠️ Supabase not configured. Registration will be local only — data won't sync across devices.
                </Text>
              </View>
            )}
            {error ? (
              <View className="bg-red-900/40 border border-red-700/50 rounded-xl p-3 mb-4">
                <Text className="text-red-300 text-sm text-center">{error}</Text>
              </View>
            ) : null}

            <View className="rounded-3xl overflow-hidden border border-emerald-800/40 mb-4">
              <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
              <View className="p-5">
                <Text className="text-emerald-300 text-xs font-medium mb-2">{t('auth.displayName')}</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t('auth.displayNamePlaceholder')}
                  placeholderTextColor="#6ee7b740"
                  className="bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-4"
                />
                <Text className="text-emerald-300 text-xs font-medium mb-2">{t('auth.email')}</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor="#6ee7b740"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-4"
                />
                <Text className="text-emerald-300 text-xs font-medium mb-2">{t('auth.password')}</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#6ee7b740"
                  secureTextEntry
                  className="bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-4"
                />
                <Text className="text-emerald-300 text-xs font-medium mb-2">{t('auth.confirmPassword')}</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#6ee7b740"
                  secureTextEntry
                  className="bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-6"
                />
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  className="bg-amber-500 py-3 rounded-xl items-center active:opacity-80"
                >
                  {loading ? (
                    <ActivityIndicator color="#022c22" />
                  ) : (
                    <Text className="text-emerald-950 font-bold text-lg">{t('auth.createAccount')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.goBack()} className="items-center">
              <Text className="text-emerald-400 text-sm">
                {t('auth.hasAccount')} <Text className="text-amber-400 font-bold">{t('auth.signIn')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
