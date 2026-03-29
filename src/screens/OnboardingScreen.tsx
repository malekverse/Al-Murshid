import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { StatusBar } from 'expo-status-bar';

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
      className="flex-1 bg-emerald-950"
    >
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center p-8">
        {step === 0 && (
          <View className="items-center w-full mt-10">
            <Text className="text-5xl font-bold text-amber-400 mb-6 text-center">
              Al-Murshid
            </Text>
            <Text className="text-xl text-emerald-100 text-center mb-16 leading-relaxed">
              Your 1:1 spiritual mentor to guide you on the path of the Sabiqoon.
            </Text>
            <TouchableOpacity 
              onPress={handleNext}
              className="bg-amber-500 w-full rounded-full py-4 items-center shadow-lg active:bg-amber-600"
            >
              <Text className="text-emerald-950 font-bold text-xl">Enter the Mithaq</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View className="items-center w-full mt-10">
            <Text className="text-2xl font-serif text-emerald-100 mb-8 text-center italic leading-loose">
              "Tell me, my child... what is your biggest struggle today?"
            </Text>
            
            <TouchableOpacity onPress={handleNext} className="bg-emerald-900 border border-emerald-700 w-full rounded-2xl p-4 mb-4 active:bg-emerald-800">
              <Text className="text-emerald-50 font-semibold text-lg text-center">Consistency in Prayer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleNext} className="bg-emerald-900 border border-emerald-700 w-full rounded-2xl p-4 mb-4 active:bg-emerald-800">
              <Text className="text-emerald-50 font-semibold text-lg text-center">Lack of Knowledge</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleNext} className="bg-emerald-900 border border-emerald-700 w-full rounded-2xl p-4 mb-8 active:bg-emerald-800">
              <Text className="text-emerald-50 font-semibold text-lg text-center">Finding Focus & Peace</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View className="items-center w-full mt-10">
             <Text className="text-2xl font-serif text-emerald-100 mb-8 text-center italic leading-loose">
              "We all stumble. It is not the falling that matters, but the rising. Let us take the first step together."
            </Text>
            <TouchableOpacity 
              onPress={handleNext}
              className="bg-amber-500 w-full rounded-full py-4 items-center shadow-lg active:bg-amber-600 mt-8"
            >
              <Text className="text-emerald-950 font-bold text-xl">Begin Journey</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
