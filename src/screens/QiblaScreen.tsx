import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Coordinates, Qibla } from 'adhan';
import { LinearGradient } from 'expo-linear-gradient';

export default function QiblaScreen() {
  const [qiblaHeading, setQiblaHeading] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [isAligned, setIsAligned] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevDirection = useRef(0);
  const wasAligned = useRef(false);

  useEffect(() => {
    let locationSub: Location.LocationSubscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission is required.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = new Coordinates(location.coords.latitude, location.coords.longitude);
        // @ts-ignore
        const qibla = new Qibla(coords);
        setQiblaHeading(qibla.direction);

        locationSub = await Location.watchHeadingAsync((headingData) => {
          const currentHeading =
            headingData.trueHeading !== -1
              ? headingData.trueHeading
              : headingData.magHeading;
          setHeading(currentHeading);
        });
      } catch (e) {
        setErrorMsg('Unable to access location/compass.');
      }
    })();

    return () => {
      if (locationSub) locationSub.remove();
    };
  }, []);

  useEffect(() => {
    const direction = (qiblaHeading - heading + 360) % 360;

    // Calculate shortest rotation path across 0/360 boundary
    let diff = direction - prevDirection.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const newTarget = prevDirection.current + diff;
    prevDirection.current = newTarget;

    Animated.spring(rotationAnim, {
      toValue: newTarget,
      damping: 15,
      stiffness: 80,
      mass: 1,
      useNativeDriver: true,
    }).start();

    const errorMargin = 3;
    const aligned = direction <= errorMargin || direction >= 360 - errorMargin;
    setIsAligned(aligned);

    if (aligned) {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      if (!wasAligned.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        wasAligned.current = true;
      }
    } else {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      wasAligned.current = false;
    }
  }, [heading, qiblaHeading]);

  const rotateInterpolation = rotationAnim.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  const glowShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const glowBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#065f46', '#f59e0b'],
  });

  return (
    <LinearGradient colors={['#022c22', '#064e3b', '#022c22']} style={styles.container}>
      <Text style={styles.title}>Qibla Compass</Text>

      <Animated.View
        style={[
          styles.compassOuter,
          {
            borderColor: glowBorderColor,
            shadowRadius: glowShadowRadius,
            shadowOpacity: isAligned ? 0.8 : 0,
          },
        ]}
      >
        {/* Cardinal markers */}
        <View style={styles.markerN} />
        <View style={styles.markerS} />
        <View style={styles.markerW} />
        <View style={styles.markerE} />

        {/* Tick marks around the edge */}
        {[...Array(36)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              {
                transform: [
                  { rotate: `${i * 10}deg` },
                  { translateY: -120 },
                ],
              },
            ]}
          />
        ))}

        {/* Rotating needle */}
        <Animated.View
          style={[
            styles.pointerContainer,
            { transform: [{ rotate: rotateInterpolation }] },
          ]}
        >
          <View style={styles.needleUp} />
          <View style={styles.needleTail} />
        </Animated.View>

        {/* Center Kaaba motif */}
        <View style={styles.centerDiamond}>
          <View style={styles.centerInner} />
        </View>
      </Animated.View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        {errorMsg ? (
           <Text style={styles.errorText}>{errorMsg}</Text>
        ) : isAligned ? (
          <Text style={styles.alignedText}>ALIGNED</Text>
        ) : (
          <Text style={styles.helperText}>
            Follow the golden arrow{'\n'}to face the Kaaba
          </Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  title: {
    color: '#fbbf24',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
    letterSpacing: 2,
  },
  compassOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#064e3b',
    borderWidth: 4,
    borderColor: '#065f46',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  pointerContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleUp: {
    position: 'absolute',
    top: 24,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 100,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#f59e0b',
  },
  needleTail: {
    position: 'absolute',
    bottom: 40,
    width: 6,
    height: 80,
    backgroundColor: '#047857',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  centerDiamond: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: '#d97706',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#022c22',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  centerInner: {
    width: 12,
    height: 12,
    backgroundColor: '#022c22',
    borderRadius: 2,
  },
  markerN: {
    position: 'absolute',
    top: 12,
    width: 4,
    height: 18,
    backgroundColor: '#10b981',
    borderRadius: 2,
    zIndex: 10,
  },
  markerS: {
    position: 'absolute',
    bottom: 12,
    width: 4,
    height: 18,
    backgroundColor: '#047857',
    borderRadius: 2,
    zIndex: 10,
  },
  markerW: {
    position: 'absolute',
    left: 12,
    width: 18,
    height: 4,
    backgroundColor: '#047857',
    borderRadius: 2,
    zIndex: 10,
  },
  markerE: {
    position: 'absolute',
    right: 12,
    width: 18,
    height: 4,
    backgroundColor: '#047857',
    borderRadius: 2,
    zIndex: 10,
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#065f46',
    borderRadius: 1,
  },
  statusContainer: {
    height: 64,
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignedText: {
    color: '#fbbf24',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  helperText: {
    color: 'rgba(209, 250, 229, 0.7)',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
