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
import { signInWithEmail, signInWithGoogle, signInWithApple, signInLocally } from '../../services/supabase/auth';
import { getSupabase } from '../../services/supabase/client';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabaseUnconfigured = !getSupabase();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }
    setLoading(true);
    setError('');

    const result = await signInWithEmail(email.trim(), password);
    setLoading(false);

    if (result.success && result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName || email.split('@')[0],
        authProvider: 'email',
      });
    } else {
      setError(result.error || t('auth.loginError'));
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    const result = await signInWithGoogle();
    setLoading(false);
    if (result.success && result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName || 'User',
        photoUrl: result.user.photoUrl,
        authProvider: 'google',
      });
    } else {
      setError(result.error || t('auth.loginError'));
    }
  };

  const handleApple = async () => {
    setLoading(true);
    setError('');
    const result = await signInWithApple();
    setLoading(false);
    if (result.success && result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName || 'User',
        authProvider: 'apple',
      });
    } else {
      setError(result.error || t('auth.loginError'));
    }
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 justify-center">
            <View className="items-center mb-10">
              <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4 border-2 border-amber-500/30">
                <Ionicons name="shield-checkmark" size={40} color="#fbbf24" />
              </View>
              <Text className="text-emerald-50 text-3xl font-bold">{t('auth.welcomeBack')}</Text>
              <Text className="text-emerald-400/60 text-sm mt-2">{t('auth.loginSubtitle')}</Text>
            </View>

            {supabaseUnconfigured && (
              <View className="bg-amber-900/40 border border-amber-700/50 rounded-xl p-3 mb-4">
                <Text className="text-amber-300 text-sm text-center font-medium">
                  ⚠️ Supabase not configured. Auth will use local-only mode — data won't sync across devices.
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
                  className="bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-6"
                />
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  className="bg-amber-500 py-3 rounded-xl items-center active:opacity-80"
                >
                  {loading ? (
                    <ActivityIndicator color="#022c22" />
                  ) : (
                    <Text className="text-emerald-950 font-bold text-lg">{t('auth.signIn')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-px bg-emerald-800/50" />
              <Text className="text-emerald-500/60 mx-4 text-sm">{t('auth.orContinueWith')}</Text>
              <View className="flex-1 h-px bg-emerald-800/50" />
            </View>

            <View className="flex-row gap-4 mb-6">
              <TouchableOpacity
                onPress={handleGoogle}
                disabled={loading}
                className="flex-1 bg-emerald-900/60 border border-emerald-700/50 rounded-xl py-3 items-center flex-row justify-center active:opacity-80"
              >
                <Ionicons name="logo-google" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
                <Text className="text-emerald-50 font-bold">Google</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={handleApple}
                  disabled={loading}
                  className="flex-1 bg-emerald-900/60 border border-emerald-700/50 rounded-xl py-3 items-center flex-row justify-center active:opacity-80"
                >
                  <Ionicons name="logo-apple" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
                  <Text className="text-emerald-50 font-bold">Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              className="items-center"
            >
              <Text className="text-emerald-400 text-sm">
                {t('auth.noAccount')} <Text className="text-amber-400 font-bold">{t('auth.signUp')}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const result = signInLocally();
                if (result.success && result.user) {
                  setUser(result.user);
                }
              }}
              className="items-center mt-4"
            >
              <Text className="text-emerald-600 text-xs">
                {t('auth.continueOffline') || 'Continue Offline (Guest Mode)'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
