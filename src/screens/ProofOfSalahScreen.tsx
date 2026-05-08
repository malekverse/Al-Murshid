import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';

export default function ProofOfSalahScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const addNoorPoints = useAppStore((s) => s.addNoorPoints);
  const [permission, requestPermission] = useCameraPermissions();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  const scanAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVerifying) {
      // Animate scanning line
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
        ])
      ).start();

      // Simulate network/ML verification delay
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addNoorPoints(50);
        setIsVerifying(false);
        setIsVerified(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }, 3000);
    }
  }, [isVerifying]);

  const handleCapture = async () => {
    if (cameraRef.current && !isVerifying && !isVerified) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsVerifying(true);
      // In production: take picture, grab GPS, send to backend
      // await cameraRef.current.takePictureAsync();
    }
  };

  if (!permission) {
    return <View className="flex-1 bg-emerald-950" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-emerald-950 items-center justify-center p-8">
        <Ionicons name="camera-outline" size={64} color="#6ee7b7" style={{ marginBottom: 24 }} />
        <Text className="text-emerald-50 text-xl font-bold text-center mb-4 tracking-wide">{t('proofOfSalah.cameraPermissionTitle')}</Text>
        <Text className="text-emerald-200/80 text-center mb-8 font-medium">
          {t('proofOfSalah.cameraPermissionDesc')}
        </Text>
        <TouchableOpacity 
          onPress={requestPermission}
          className="bg-amber-500 w-full py-4 rounded-full items-center shadow-lg"
        >
          <Text className="text-emerald-950 font-bold text-lg">{t('proofOfSalah.grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <StatusBar style="light" hidden={!isVerified} />

      {!isVerified ? (
        <View style={{ flex: 1 }}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef} />
          <View className="absolute inset-0 pointer-events-box-none z-10">
            {/* Top Bar Overlay */}
            <View className="pt-16 px-6 flex-row justify-between items-center z-10 pointer-events-box-none">
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/20 backdrop-blur-md pointer-events-auto"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View className="bg-black/40 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md flex-row items-center pointer-events-none">
                <Ionicons name="location" size={14} color="#6ee7b7" style={{ marginRight: 6 }} />
                <Text className="text-white font-bold text-xs tracking-widest uppercase">{t('proofOfSalah.masjidName')}</Text>
              </View>
            </View>

            {/* Scanner UI */}
            <View className="flex-1 items-center justify-center p-8 pointer-events-none">
              <View className="w-64 h-64 border-2 border-amber-400/50 rounded-3xl relative overflow-hidden">
                {/* Corner brackets */}
                <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
                
                {isVerifying && (
                  <Animated.View 
                    className="w-full h-1 bg-amber-400 shadow-lg shadow-amber-400"
                    style={{
                      transform: [{
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 250]
                        })
                      }]
                    }}
                  />
                )}
              </View>

              {isVerifying && (
                <View className="mt-12 items-center bg-black/60 px-6 py-4 rounded-2xl border border-white/10 backdrop-blur-md pointer-events-none">
                  <ActivityIndicator size="large" color="#fbbf24" style={{ marginBottom: 12 }} />
                  <Text className="text-amber-400 font-bold text-lg">{t('proofOfSalah.verifying')}</Text>
                  <Text className="text-emerald-200/80 text-xs mt-1">{t('proofOfSalah.analyzing')}</Text>
                </View>
              )}
            </View>

            {/* Capture Button */}
            {!isVerifying && (
              <View className="absolute bottom-12 w-full items-center pointer-events-box-none">
                <Text className="text-white font-medium text-sm mb-6 drop-shadow-lg pointer-events-none">
                  {t('proofOfSalah.snapPhoto')}
                </Text>
                <TouchableOpacity 
                  onPress={handleCapture}
                  className="w-20 h-20 rounded-full border-4 border-white/50 items-center justify-center pointer-events-auto"
                >
                  <View className="w-16 h-16 rounded-full bg-white shadow-lg" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* Success Screen */
        <Animated.View style={{ flex: 1, opacity: fadeAnim }} className="bg-emerald-950 items-center justify-center p-8">
          <LinearGradient
            colors={['#022c22', '#064e3b']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View className="w-32 h-32 rounded-full bg-amber-500/20 items-center justify-center mb-8 border-4 border-amber-400/50 shadow-2xl">
            <Ionicons name="checkmark-done" size={64} color="#fbbf24" />
          </View>
          
          <Text className="text-emerald-50 text-3xl font-extrabold text-center mb-2 tracking-wide">
            {t('proofOfSalah.jamaahVerified')}
          </Text>
          <Text className="text-emerald-300 text-lg font-medium text-center mb-12">
            {t('proofOfSalah.masjidWithPrayer')}
          </Text>
          
          <View className="bg-emerald-900/60 w-full p-6 rounded-3xl border border-emerald-700/50 mb-12 shadow-xl items-center">
            <Text className="text-amber-400 text-5xl font-extrabold mb-2">+50</Text>
            <Text className="text-emerald-100 text-sm font-bold uppercase tracking-widest">{t('proofOfSalah.noorPointsEarned')}</Text>
            <View className="h-px w-full bg-emerald-800 my-4" />
            <View className="flex-row items-center">
              <Ionicons name="flame" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text className="text-amber-300 font-bold text-sm">{t('proofOfSalah.fajrChainActive')}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('CommunityHeatmap')}
            className="w-full rounded-full overflow-hidden shadow-xl active:opacity-80"
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="py-4 flex-row items-center justify-center">
              <Ionicons name="map" size={20} color="#022c22" style={{ marginRight: 8 }} />
              <Text className="text-emerald-950 font-bold text-lg tracking-wide">{t('proofOfSalah.viewHeatmap')}</Text>
            </View>
          </TouchableOpacity>

        </Animated.View>
      )}
    </View>
  );
}
