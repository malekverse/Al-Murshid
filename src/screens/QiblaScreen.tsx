import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Coordinates, Qibla } from 'adhan';
import { LinearGradient } from 'expo-linear-gradient';

export default function QiblaScreen() {
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [isAligned, setIsAligned] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevRotation = useRef(0);
  const wasAligned = useRef(false);

  useEffect(() => {
    let headingSub: Location.LocationSubscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission is required for the Qibla compass.');
          setIsLoading(false);
          return;
        }

        // Get user's current position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        // Calculate Qibla bearing from user's location
        // Qibla() is a function that returns degrees from True North
        const coords = new Coordinates(
          location.coords.latitude,
          location.coords.longitude
        );
        const qibla = Qibla(coords);
        setQiblaDirection(qibla);
        setIsLoading(false);

        // Subscribe to device heading updates
        headingSub = await Location.watchHeadingAsync((headingData) => {
          // Prefer trueHeading (GPS-corrected); fall back to magHeading
          const heading =
            headingData.trueHeading >= 0
              ? headingData.trueHeading
              : headingData.magHeading;
          setDeviceHeading(heading);
        });
      } catch (e) {
        console.error('Qibla error:', e);
        setErrorMsg('Unable to access location or compass sensor.');
        setIsLoading(false);
      }
    })();

    return () => {
      if (headingSub) headingSub.remove();
    };
  }, []);

  // React to heading changes — rotate the needle
  useEffect(() => {
    if (qiblaDirection === null) return;

    // How many degrees the user needs to rotate clockwise to face Qibla
    const rawDiff = (qiblaDirection - deviceHeading + 360) % 360;

    // Compute the shortest-path rotation to avoid 359→1 jumps
    let delta = rawDiff - (prevRotation.current % 360 + 360) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const newTarget = prevRotation.current + delta;
    prevRotation.current = newTarget;

    Animated.spring(rotationAnim, {
      toValue: newTarget,
      damping: 20,
      stiffness: 100,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    // Alignment detection (±5° tolerance)
    const aligned = rawDiff <= 5 || rawDiff >= 355;
    setIsAligned(aligned);

    if (aligned) {
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      if (!wasAligned.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        wasAligned.current = true;
      }
    } else {
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
      wasAligned.current = false;
    }
  }, [deviceHeading, qiblaDirection]);

  const rotateStr = rotationAnim.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  const glowBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#065f46', '#f59e0b'],
  });
  const glowShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  // Loading state
  if (isLoading) {
    return (
      <LinearGradient colors={['#022c22', '#064e3b', '#022c22']} style={styles.container}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text style={styles.helperText}>{'Locating you...'}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#022c22', '#064e3b', '#022c22']} style={styles.container}>
      <Text style={styles.title}>Qibla Compass</Text>

      {qiblaDirection !== null && (
        <Text style={styles.bearingText}>
          Qibla bearing: {qiblaDirection.toFixed(1)}° from True North
        </Text>
      )}

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
        {/* Cardinal labels (fixed on the compass ring) */}
        <Text style={[styles.cardinalLabel, { top: 16 }]}>N</Text>
        <Text style={[styles.cardinalLabel, { bottom: 16 }]}>S</Text>
        <Text style={[styles.cardinalLabel, { left: 16 }]}>W</Text>
        <Text style={[styles.cardinalLabel, { right: 16 }]}>E</Text>

        {/* Tick marks around the edge */}
        {[...Array(36)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              i % 9 === 0 && styles.tickMajor,
              {
                transform: [
                  { rotate: `${i * 10}deg` },
                  { translateY: -125 },
                ],
              },
            ]}
          />
        ))}

        {/* Rotating Qibla pointer */}
        <Animated.View
          style={[
            styles.pointerContainer,
            { transform: [{ rotate: rotateStr }] },
          ]}
        >
          {/* Arrow pointing UP = towards Qibla */}
          <View style={styles.needleUp} />
          <View style={styles.needleTail} />

          {/* Kaaba icon at tip */}
          <View style={styles.kaabaTip}>
            <Text style={styles.kaabaEmoji}>🕋</Text>
          </View>
        </Animated.View>

        {/* Center dot */}
        <View style={styles.centerDot}>
          <View style={styles.centerDotInner} />
        </View>
      </Animated.View>

      {/* Status */}
      <View style={styles.statusContainer}>
        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : isAligned ? (
          <View style={styles.alignedContainer}>
            <Text style={styles.alignedText}>ALIGNED ✓</Text>
            <Text style={styles.alignedSub}>You are facing the Kaaba</Text>
          </View>
        ) : (
          <Text style={styles.helperText}>
            {'Rotate your device until the\narrow points up'}
          </Text>
        )}
      </View>

      {/* Current heading readout */}
      <Text style={styles.headingReadout}>
        Device heading: {deviceHeading.toFixed(0)}°
      </Text>
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
    marginBottom: 8,
    letterSpacing: 2,
  },
  bearingText: {
    color: 'rgba(167, 243, 208, 0.6)',
    fontSize: 13,
    marginBottom: 32,
    fontWeight: '600',
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
    top: 28,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 90,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#f59e0b',
  },
  needleTail: {
    position: 'absolute',
    bottom: 44,
    width: 4,
    height: 70,
    backgroundColor: '#047857',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  kaabaTip: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaEmoji: {
    fontSize: 18,
  },
  centerDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#d97706',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#022c22',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  centerDotInner: {
    width: 8,
    height: 8,
    backgroundColor: '#022c22',
    borderRadius: 4,
  },
  cardinalLabel: {
    position: 'absolute',
    color: '#6ee7b7',
    fontSize: 14,
    fontWeight: 'bold',
    zIndex: 10,
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#065f46',
    borderRadius: 1,
  },
  tickMajor: {
    width: 3,
    height: 14,
    backgroundColor: '#10b981',
  },
  statusContainer: {
    height: 70,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignedContainer: {
    alignItems: 'center',
  },
  alignedText: {
    color: '#fbbf24',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  alignedSub: {
    color: '#6ee7b7',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  helperText: {
    color: 'rgba(209, 250, 229, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  headingReadout: {
    color: 'rgba(167, 243, 208, 0.4)',
    fontSize: 12,
    marginTop: 16,
    fontWeight: '600',
  },
});
