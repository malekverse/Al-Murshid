import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';

export default function ZakatCalculatorScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  
  const [cash, setCash] = useState('');
  const [goldValue, setGoldValue] = useState('');
  const [silverValue, setSilverValue] = useState('');
  const [investments, setInvestments] = useState('');
  const [liabilities, setLiabilities] = useState('');

  // Calculation Logic
  const currencySymbol = i18n.language === 'ar' ? 'د.ع' : '$';
  const formatCurrency = (val: number) => {
    const locale = i18n.language === 'ar' ? 'ar-IQ' : 'en-US';
    return val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseAmount = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
  
  const totalAssets = parseAmount(cash) + parseAmount(goldValue) + parseAmount(silverValue) + parseAmount(investments);
  const netAssets = Math.max(0, totalAssets - parseAmount(liabilities));
  const zakatDue = netAssets * 0.025;

  const renderInputField = (title: string, icon: any, value: string, setValue: (val: string) => void, placeholder: string) => (
    <View className="mb-6">
      <View className="flex-row items-center mb-2 px-1">
        <Ionicons name={icon} size={16} color="#6ee7b7" style={{ marginRight: 6 }} />
        <Text className="text-emerald-300 text-sm font-bold uppercase tracking-widest">{title}</Text>
      </View>
      <View className="bg-emerald-900/40 rounded-2xl border border-emerald-800/60 flex-row items-center px-4 py-1 shadow-inner">
        <Text className="text-emerald-500 font-bold text-lg mr-2">{currencySymbol}</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="rgba(52, 211, 153, 0.3)"
          keyboardType="numeric"
          className="flex-1 text-white text-xl font-bold py-3"
          style={{ height: 50 }}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('zakat.title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}>
        
        {/* Intro */}
        <View className="mb-8 mt-2">
          <Text className="text-amber-400 text-3xl font-extrabold tracking-tight mb-2">{t('zakat.subtitle')}</Text>
          <Text className="text-emerald-200 text-sm leading-relaxed font-medium">
            {t('zakat.verse')}
          </Text>
        </View>

        {/* Assets Section */}
        <View className="rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden mb-8">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <Text className="text-white text-xl font-bold tracking-wide mb-6">{t('zakat.assets')}</Text>
            
            {renderInputField(t('zakat.cash'), 'wallet', cash, setCash, '0.00')}
            {renderInputField(t('zakat.gold'), 'sparkles', goldValue, setGoldValue, '0.00')}
            {renderInputField(t('zakat.silver'), 'moon', silverValue, setSilverValue, '0.00')}
            {renderInputField(t('zakat.investments'), 'trending-up', investments, setInvestments, '0.00')}
            
            <View className="border-t border-emerald-700/50 pt-6 mt-2">
              <Text className="text-white text-xl font-bold tracking-wide mb-6">{t('zakat.liabilities')}</Text>
              {renderInputField(t('zakat.owe'), 'cash', liabilities, setLiabilities, '0.00')}
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Floating Results Footer */}
      <View className="absolute bottom-0 left-0 right-0 rounded-t-[40px] shadow-2xl overflow-hidden border-t border-amber-500/30">
        <LinearGradient
          colors={['#0f766e', '#042f2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View className="px-8 pt-6 pb-10">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-teal-200 text-sm font-bold uppercase tracking-widest mb-1">{t('zakat.netAssets')}</Text>
              <Text className="text-teal-50 text-xl font-semibold">{currencySymbol}{formatCurrency(netAssets)}</Text>
            </View>
            <View className="h-10 w-px bg-teal-700/50 mx-4" />
            <View className="items-end">
              <Text className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-1">{t('zakat.rate')}</Text>
              <Text className="text-teal-50 text-xl font-semibold">2.5%</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-end mb-6 bg-teal-900/40 p-4 rounded-2xl border border-teal-700/50">
            <View className="flex-row items-center">
              <Ionicons name="gift" size={24} color="#fbbf24" style={{ marginRight: 8 }} />
              <Text className="text-white text-lg font-bold">{t('zakat.due')}</Text>
            </View>
            <Text className="text-amber-400 text-3xl font-extrabold tracking-tighter">
              {currencySymbol}{formatCurrency(zakatDue)}
            </Text>
          </View>

          <TouchableOpacity className="w-full shadow-2xl active:opacity-80 rounded-full overflow-hidden">
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="py-4 items-center flex-row justify-center">
              <Ionicons name="heart" size={20} color="#022c22" style={{ marginRight: 8 }} />
              <Text className="text-emerald-950 font-extrabold text-lg tracking-wide">{t('zakat.donate')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
