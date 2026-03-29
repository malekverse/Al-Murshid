import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Magnetometer, MagnetometerMeasurement } from 'expo-sensors';
import * as Location from 'expo-location';
import { Coordinates, Qibla } from 'adhan';

export default function QiblaScreen() {
  const [qiblaHeading, setQiblaHeading] = useState<number>(0);
  const [magnetometer, setMagnetometer] = useState<number>(0);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      let location = await Location.getCurrentPositionAsync({});
      const coords = new Coordinates(location.coords.latitude, location.coords.longitude);
      // @ts-ignore
      const qibla = new Qibla(coords);
      setQiblaHeading(qibla.direction);
    })();
  }, []);

  useEffect(() => {
    Magnetometer.setUpdateInterval(50);
    const subscription = Magnetometer.addListener((data: MagnetometerMeasurement) => {
      let heading = Math.atan2(data.y, data.x) * (180 / Math.PI);
      if (heading < 0) heading += 360;
      setMagnetometer(heading);
    });
    return () => subscription.remove();
  }, []);

  const direction = (qiblaHeading - magnetometer + 360) % 360;

  return (
    <View className="flex-1 bg-emerald-950 items-center justify-center p-8">
      <Text className="text-amber-400 text-2xl font-bold mb-4">Qibla Compass</Text>
      <View className="bg-emerald-900 rounded-full w-64 h-64 items-center justify-center border-4 border-emerald-800 shadow-xl overflow-hidden">
        <View 
          style={{ transform: [{ rotate: `${direction}deg` }] }}
          className="w-full h-full items-center"
        >
          <View className="w-2 h-32 bg-amber-500 rounded-t-full mt-4" />
        </View>
      </View>
      <Text className="text-emerald-100 mt-8 text-center px-4">
        Follow the golden arrow to face the Kaaba in Mecca.
      </Text>
    </View>
  );
}
