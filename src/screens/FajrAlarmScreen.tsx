import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraView } from 'expo-camera';

export default function FajrAlarmScreen() {
  const [isSmartAlarmEnabled, setIsSmartAlarmEnabled] = useState(true);
  const [wuduVerification, setWuduVerification] = useState(true);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

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
            alert("Wudu Verified! MashaAllah.");
          }, 500);
        }
      }, 300);
    } else {
      alert("Camera permission is required for Wudu check.");
    }
  };

  return (
    <View className="flex-1 bg-emerald-950 px-6 pt-16">
      <StatusBar style="light" />
      
      <View className="mb-8">
        <Text className="text-amber-400 text-3xl font-bold">Smart Fajr Alarm</Text>
        <Text className="text-emerald-200 text-base mt-2 leading-relaxed">
          Circadian Deen Optimizer. We calculate the optimal sleep schedule to wake you refreshed for Fajr.
        </Text>
      </View>

      <View className="bg-emerald-900 rounded-3xl p-6 mb-6 shadow-lg border border-emerald-800/50">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-emerald-100 text-lg font-semibold">Smart Fajr Wakeup</Text>
          <Switch 
            value={isSmartAlarmEnabled} 
            onValueChange={setIsSmartAlarmEnabled}
            trackColor={{ false: '#064e3b', true: '#f59e0b' }}
            thumbColor={'#ecfdf5'}
          />
        </View>

        <View className="border-t border-emerald-800/50 pt-4 mb-4">
          <Text className="text-emerald-300 text-xs uppercase tracking-wider mb-1">Target Fajr Time</Text>
          <Text className="text-white text-3xl font-bold">04:45 AM</Text>
        </View>
        
        <View className="bg-emerald-800/50 rounded-xl p-4">
          <Text className="text-amber-300 font-semibold mb-1">🌙 Wind Down Alert</Text>
          <Text className="text-emerald-100 text-sm">To get 7 hours of rest, be in bed by 9:30 PM.</Text>
        </View>
      </View>

      {/* Biometric Wudu Check */}
      <View className="bg-emerald-900 rounded-3xl p-6 shadow-lg border border-emerald-800/50 mb-6">
        <View className="flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-emerald-100 text-lg font-semibold mb-1">Face-ID Wudu Check</Text>
            <Text className="text-emerald-300 text-xs leading-tight">
              Require a camera scan of your damp face to dismiss the alarm, ensuring you don't sleep through Fajr.
            </Text>
          </View>
          <Switch 
            value={wuduVerification} 
            onValueChange={setWuduVerification}
            trackColor={{ false: '#064e3b', true: '#f59e0b' }}
            thumbColor={'#ecfdf5'}
          />
        </View>
        {wuduVerification && (
          <TouchableOpacity 
            onPress={startWuduScan}
            className="mt-6 bg-amber-500 rounded-full py-3 items-center active:bg-amber-600"
          >
            <Text className="text-emerald-950 font-bold">Test Biometric Scanner</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Camera Modal for Wudu Check */}
      <Modal visible={isCameraActive} animationType="slide">
        <View className="flex-1 bg-black">
          {hasPermission ? (
            <CameraView 
              style={{ flex: 1 }} 
              facing="front"
            >
              <View className="flex-1 bg-black/40 items-center justify-center p-6">
                <Text className="text-amber-400 text-2xl font-bold mb-8 text-center">
                  Verifying Wudu...
                </Text>
                
                {/* Face Scanning Frame Outline */}
                <View className="w-64 h-80 border-4 border-amber-400 rounded-full items-center justify-center mb-8 relative">
                  <View className="absolute w-full h-full border-4 border-emerald-500 rounded-full opacity-50" style={{ transform: [{ scale: 1.1 }] }} />
                  {scanProgress < 100 ? (
                    <ActivityIndicator size="large" color="#fbbf24" />
                  ) : (
                    <Text className="text-5xl">💧</Text>
                  )}
                </View>

                {/* Progress Bar */}
                <View className="w-full bg-emerald-900 h-3 rounded-full overflow-hidden border border-emerald-800/50 mb-4">
                  <View 
                    className="bg-amber-400 h-full rounded-full" 
                    style={{ width: `${scanProgress}%` }} 
                  />
                </View>
                <Text className="text-emerald-100 font-semibold">{scanProgress}% - Analyzing skin dampness...</Text>

                <TouchableOpacity 
                  onPress={() => setIsCameraActive(false)}
                  className="mt-12 bg-red-900/80 px-8 py-3 rounded-full border border-red-800"
                >
                  <Text className="text-red-100 font-bold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-white">No access to camera</Text>
              <TouchableOpacity onPress={() => setIsCameraActive(false)} className="mt-4 bg-emerald-900 px-6 py-2 rounded-full">
                <Text className="text-white">Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
