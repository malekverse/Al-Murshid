import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <StatusBar style="light" />
      <View className="flex-1">
        <LinearGradient
          colors={['#022c22', '#064e3b', '#022c22']}
          style={StyleSheet.absoluteFillObject}
        />
        <View className="flex-1 items-center justify-center p-8 relative">
          {/* Background decorative element */}
          <Ionicons name="moon" size={300} color="rgba(251, 191, 36, 0.03)" style={{ position: 'absolute', top: -50, right: -100 }} />
          
          {step === 0 && (
            <View className="items-center w-full mt-10">
              <View className="bg-amber-500/20 p-6 rounded-full mb-8 border border-amber-500/30 shadow-2xl">
                <Ionicons name="compass" size={64} color="#fbbf24" />
              </View>
              <Text className="text-5xl font-extrabold text-amber-400 mb-6 text-center tracking-tighter">
                Al-Murshid
              </Text>
              <Text className="text-xl text-emerald-100 text-center mb-16 leading-relaxed font-medium">
                Your 1:1 spiritual mentor to guide you on the path of the Sabiqoon.
              </Text>
              <TouchableOpacity 
                onPress={handleNext}
                className="w-full shadow-2xl active:opacity-80 rounded-full overflow-hidden"
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="py-4 items-center flex-row justify-center">
                  <Text className="text-emerald-950 font-extrabold text-xl tracking-wide mr-2">Enter the Mithaq</Text>
                  <Ionicons name="arrow-forward" size={24} color="#022c22" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View className="items-center w-full mt-10">
              <Ionicons name="chatbubbles" size={48} color="#fbbf24" style={{ marginBottom: 24 }} />
              <Text className="text-2xl font-serif text-amber-100 mb-12 text-center italic leading-loose" style={{ fontFamily: 'sans-serif' }}>
                "Tell me, my child... what is your biggest struggle today?"
              </Text>
              
              {['Consistency in Prayer', 'Lack of Knowledge', 'Finding Focus & Peace'].map((struggle, idx) => (
                <TouchableOpacity key={idx} onPress={handleNext} className="w-full mb-4 shadow-lg active:opacity-80 rounded-2xl overflow-hidden border border-emerald-500/30">
                  <LinearGradient
                    colors={['#065f46', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View className="p-5 flex-row items-center justify-between">
                    <Text className="text-emerald-50 font-bold text-lg">{struggle}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6ee7b7" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step === 2 && (
            <View className="items-center w-full mt-10">
              <Ionicons name="leaf" size={48} color="#fbbf24" style={{ marginBottom: 24 }} />
              <Text className="text-2xl font-serif text-emerald-100 mb-12 text-center italic leading-loose" style={{ fontFamily: 'sans-serif' }}>
                "We all stumble. It is not the falling that matters, but the rising. Let us take the first step together."
              </Text>
              <TouchableOpacity 
                onPress={handleNext}
                className="w-full shadow-2xl active:opacity-80 mt-8 rounded-full overflow-hidden"
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="py-4 items-center flex-row justify-center">
                  <Text className="text-emerald-950 font-extrabold text-xl tracking-wide mr-2">Begin Journey</Text>
                  <Ionicons name="star" size={24} color="#022c22" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
