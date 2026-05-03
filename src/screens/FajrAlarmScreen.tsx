import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Modal, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function FajrAlarmScreen() {
  const [isSmartAlarmEnabled, setIsSmartAlarmEnabled] = useState(true);
  const [wuduVerification, setWuduVerification] = useState(true);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Custom Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => setToastMsg(null));
  };

  const startWuduScan = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setIsCameraActive(true);
      setScanProgress(0);
      
      // Simulate a scanning process
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setScanProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsCameraActive(false);
            showToast("Wudu Verified! MashaAllah.");
          }, 500);
        }
      }, 300);
    } else {
      showToast("Camera permission is required for Wudu check.");
    }
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <View className="px-6 pt-16 pb-6">
        <Text className="text-amber-400 text-3xl font-extrabold tracking-tight">Smart Fajr Alarm</Text>
        <Text className="text-emerald-200 text-sm mt-2 leading-relaxed font-medium">
          Circadian Deen Optimizer. We calculate the optimal sleep schedule to wake you refreshed for Fajr.
        </Text>
      </View>

      <View className="px-6 flex-1">
        <View className="rounded-3xl mb-6 shadow-2xl border border-emerald-800/40 overflow-hidden">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="alarm" size={24} color="#fbbf24" style={{ marginRight: 8 }} />
                <Text className="text-emerald-50 text-xl font-bold tracking-wide">Smart Wakeup</Text>
              </View>
              <Switch 
                value={isSmartAlarmEnabled} 
                onValueChange={setIsSmartAlarmEnabled}
                trackColor={{ false: '#064e3b', true: '#f59e0b' }}
                thumbColor={'#ecfdf5'}
              />
            </View>

            <View className="border-t border-emerald-700/50 pt-6 mb-4 flex-row justify-between items-end">
              <View>
                <Text className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">Target Fajr Time</Text>
                <Text className="text-white text-4xl font-extrabold tracking-tighter">04:45 <Text className="text-xl text-emerald-300">AM</Text></Text>
              </View>
              <TouchableOpacity className="bg-emerald-800/80 p-3 rounded-full border border-emerald-700/50">
                <Ionicons name="create-outline" size={20} color="#6ee7b7" />
              </TouchableOpacity>
            </View>
            
            <View className="bg-emerald-800/40 rounded-2xl p-4 border border-emerald-700/30 flex-row items-start">
              <Ionicons name="moon" size={18} color="#93c5fd" style={{ marginRight: 8, marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-blue-200 font-bold mb-1">Wind Down Alert</Text>
                <Text className="text-emerald-100/80 text-sm leading-relaxed">To get 7 hours of rest, be in bed by 9:30 PM.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Biometric Wudu Check */}
        <View className="rounded-3xl shadow-2xl border border-teal-700/40 mb-6 overflow-hidden">
          <LinearGradient
            colors={['#0f766e', '#042f2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1 pr-4">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="scan-circle" size={24} color="#6ee7b7" style={{ marginRight: 8 }} />
                  <Text className="text-teal-50 text-lg font-bold tracking-wide">Face-ID Wudu Check</Text>
                </View>
              </View>
              <Switch 
                value={wuduVerification} 
                onValueChange={setWuduVerification}
                trackColor={{ false: '#064e3b', true: '#10b981' }}
                thumbColor={'#ecfdf5'}
              />
            </View>
            <Text className="text-teal-100/80 text-sm leading-relaxed mb-6 font-medium">
              Require a camera scan of your damp face to dismiss the alarm, ensuring you don't sleep through Fajr.
            </Text>
            {wuduVerification && (
              <TouchableOpacity 
                onPress={startWuduScan}
                className="shadow-xl active:opacity-80 rounded-full overflow-hidden"
              >
                <LinearGradient
                  colors={['#10b981', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="py-4 items-center flex-row justify-center">
                  <Ionicons name="camera" size={20} color="#022c22" style={{ marginRight: 8 }} />
                  <Text className="text-emerald-950 font-extrabold text-base tracking-wide">Test Biometric Scanner</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Custom Toast */}
      {toastMsg && (
        <Animated.View 
          style={{ opacity: fadeAnim }} 
          className="absolute bottom-10 left-6 right-6 bg-emerald-800 rounded-2xl p-4 flex-row items-center shadow-2xl border border-emerald-600/50 z-50"
        >
          <Ionicons name="information-circle" size={24} color="#fbbf24" style={{ marginRight: 12 }} />
          <Text className="text-emerald-50 font-semibold flex-1">{toastMsg}</Text>
        </Animated.View>
      )}

      {/* Camera Modal for Wudu Check */}
      <Modal visible={isCameraActive} animationType="fade" transparent={true}>
        <View className="flex-1 bg-emerald-950/95">
          {hasPermission ? (
            <CameraView 
              style={{ flex: 1 }} 
              facing="front"
            >
              <View className="flex-1 relative">
                <LinearGradient 
                  colors={['rgba(2,44,34,0.8)', 'transparent', 'rgba(2,44,34,0.9)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="flex-1 items-center justify-center p-6">
                  <Text className="text-amber-400 text-3xl font-extrabold mb-12 tracking-wide text-center">
                    Verifying Wudu...
                  </Text>
                  
                  {/* Face Scanning Frame Outline */}
                  <View className="w-64 h-80 border-4 border-amber-400/80 rounded-[100px] items-center justify-center mb-12 relative shadow-2xl bg-black/20">
                    <View className="absolute w-full h-full border-2 border-emerald-400/50 rounded-[100px]" style={{ transform: [{ scale: 1.15 }] }} />
                    {scanProgress < 100 ? (
                      <ActivityIndicator size="large" color="#fbbf24" />
                    ) : (
                      <Ionicons name="water" size={80} color="#38bdf8" />
                    )}
                  </View>

                  {/* Progress Bar */}
                  <View className="w-full max-w-xs bg-emerald-900/80 h-3 rounded-full overflow-hidden border border-emerald-700 mb-4 shadow-inner">
                    <View className="h-full rounded-full overflow-hidden" style={{ width: `${scanProgress}%` }}>
                      <LinearGradient
                        colors={['#f59e0b', '#fbbf24']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </View>
                  </View>
                  <Text className="text-emerald-100 font-semibold tracking-wide">{scanProgress}% - Analyzing skin dampness...</Text>

                  <TouchableOpacity 
                    onPress={() => setIsCameraActive(false)}
                    className="mt-auto mb-10 w-full max-w-xs shadow-xl active:opacity-80 rounded-full overflow-hidden border border-red-800/50"
                  >
                    <LinearGradient
                      colors={['#991b1b', '#7f1d1d']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View className="py-4 items-center flex-row justify-center">
                      <Ionicons name="close" size={20} color="#fca5a5" style={{ marginRight: 8 }} />
                      <Text className="text-red-100 font-bold tracking-wide">Cancel Scan</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          ) : (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="camera-reverse" size={64} color="#6ee7b7" style={{ marginBottom: 24 }} />
              <Text className="text-white text-center text-lg mb-8 font-medium">Camera access is required to verify your Wudu.</Text>
              <TouchableOpacity onPress={() => setIsCameraActive(false)} className="w-full active:opacity-80 rounded-full overflow-hidden border border-emerald-600/50">
                <LinearGradient
                  colors={['#065f46', '#047857']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="py-4 items-center">
                  <Text className="text-emerald-50 font-bold tracking-wide">Close</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
