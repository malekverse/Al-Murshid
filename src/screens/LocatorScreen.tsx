import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Linking, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NearbyPlace {
  id: string;
  name: string;
  type: 'mosque' | 'halal';
  distance: number;
  lat: number;
  lon: number;
  address?: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function estimateWalkTime(m: number): string {
  const mins = Math.round(m / 80); // ~80 m/min walking
  return mins < 60 ? `${mins} min walk` : `${Math.round(mins / 60)}h ${mins % 60}m walk`;
}

function estimateDriveTime(m: number): string {
  const mins = Math.round(m / 500); // ~30 km/h city driving
  return mins < 1 ? '< 1 min drive' : `${mins} min drive`;
}

async function fetchNearbyMosques(lat: number, lon: number, radius: number): Promise<NearbyPlace[]> {
  const query = `[out:json][timeout:15];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon}););out center body;`;
  const res = await fetchWithTimeout(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('API error');
  const json = await res.json();
  return json.elements
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;
      return {
        id: String(el.id),
        name: el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:ar'] || 'Mosque',
        type: 'mosque' as const,
        distance: haversineDistance(lat, lon, elLat, elLon),
        lat: elLat, lon: elLon,
        address: el.tags?.['addr:street'] ? `${el.tags?.['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim() : undefined,
      };
    })
    .filter(Boolean)
    .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance);
}

async function fetchNearbyHalal(lat: number, lon: number, radius: number): Promise<NearbyPlace[]> {
  const query = `[out:json][timeout:15];(node["cuisine"~"halal|kebab|turkish|arabic|middle_eastern|pakistani|indian"](around:${radius},${lat},${lon});node["diet:halal"="yes"](around:${radius},${lat},${lon}););out body;`;
  const res = await fetchWithTimeout(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('API error');
  const json = await res.json();
  const seen = new Set<string>();
  return json.elements
    .map((el: any) => {
      if (!el.lat || !el.lon) return null;
      const key = `${el.lat.toFixed(5)},${el.lon.toFixed(5)}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        id: String(el.id),
        name: el.tags?.name || el.tags?.['name:en'] || 'Halal Restaurant',
        type: 'halal' as const,
        distance: haversineDistance(lat, lon, el.lat, el.lon),
        lat: el.lat, lon: el.lon,
        address: el.tags?.['addr:street'] ? `${el.tags?.['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim() : undefined,
      };
    })
    .filter(Boolean)
    .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance);
}

function generateMapHtml(userLat: number, userLon: number, places: NearbyPlace[], type: 'mosque' | 'halal'): string {
  const markers = places.slice(0, 30).map(p => {
    const icon = type === 'mosque' ? '🕌' : '🍽️';
    const escapedName = p.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
    return `L.marker([${p.lat}, ${p.lon}], {icon: L.divIcon({className:'custom-marker',html:'<div class="marker-pin ${type}">${icon}</div>',iconSize:[36,36],iconAnchor:[18,36]})}).addTo(map).bindPopup('<b>${escapedName}</b><br>${formatDistance(p.distance)}');`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; }
  body, html, #map { width:100%; height:100%; }
  .custom-marker { background:none; border:none; }
  .marker-pin {
    width:36px; height:36px; border-radius:50%; display:flex;
    align-items:center; justify-content:center; font-size:20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .marker-pin.mosque { background: rgba(6,78,59,0.9); border: 2px solid #6ee7b7; }
  .marker-pin.halal { background: rgba(15,118,110,0.9); border: 2px solid #fbbf24; }
  .user-dot {
    width:18px; height:18px; border-radius:50%; background:#fbbf24;
    border: 3px solid #fff; box-shadow: 0 0 12px rgba(251,191,36,0.6);
  }
  .leaflet-popup-content-wrapper {
    background:#022c22; color:#ecfdf5; border-radius:12px;
    border: 1px solid rgba(110,231,183,0.3);
  }
  .leaflet-popup-tip { background:#022c22; }
  .leaflet-popup-content { margin:10px 14px; font-family:system-ui; font-size:13px; }
  .leaflet-popup-content b { color:#fbbf24; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${userLat}, ${userLon}], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
  L.marker([${userLat}, ${userLon}], {icon: L.divIcon({className:'custom-marker',html:'<div class="user-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map).bindPopup('<b>You are here</b>');
  ${markers}
</script>
</body>
</html>`;
}

const RADIUS_OPTIONS = [2000, 5000, 10000];
const RADIUS_LABELS = ['2 km', '5 km', '10 km'];

export default function LocatorScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'mosque' | 'halal'>('mosque');
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mosques, setMosques] = useState<NearbyPlace[]>([]);
  const [halalPlaces, setHalalPlaces] = useState<NearbyPlace[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusIdx, setRadiusIdx] = useState(1); // default 5 km
  const [showMap, setShowMap] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const listAnims = useRef<Animated.Value[]>([]).current;

  const fetchData = async (lat: number, lon: number, radius: number) => {
    setIsLoading(true);
    try {
      const [m, h] = await Promise.all([
        fetchNearbyMosques(lat, lon, radius).catch(() => []),
        fetchNearbyHalal(lat, lon, radius).catch(() => []),
      ]);
      setMosques(m);
      setHalalPlaces(h);
      const count = (activeTab === 'mosque' ? m : h).length;
      while (listAnims.length < count) {
        listAnims.push(new Animated.Value(0));
      }
      Animated.stagger(50, listAnims.slice(0, count).map(a =>
        Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true })
      )).start();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError(t('locator.permRequired'));
          setIsLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        setUserCoords({ lat, lon });
        await fetchData(lat, lon, RADIUS_OPTIONS[radiusIdx]);
      } catch {
        setLocationError(t('locator.error'));
        setIsLoading(false);
      }
    })();
  }, []);

  // Refetch when radius changes
  const handleRadiusChange = () => {
    const next = (radiusIdx + 1) % RADIUS_OPTIONS.length;
    setRadiusIdx(next);
    if (userCoords) fetchData(userCoords.lat, userCoords.lon, RADIUS_OPTIONS[next]);
  };

  useEffect(() => {
    const places = activeTab === 'mosque' ? mosques : halalPlaces;
    if (places.length === 0) return;
    listAnims.forEach(a => a.setValue(0));
    Animated.stagger(60, places.slice(0, 20).map((_, i) =>
      Animated.timing(listAnims[i], { toValue: 1, duration: 350, useNativeDriver: true })
    )).start();
  }, [activeTab, mosques, halalPlaces]);

  const places = activeTab === 'mosque' ? mosques : halalPlaces;

  const openInMaps = (p: NearbyPlace) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`);
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-16 pb-3 flex-row justify-between items-center z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Go back">
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('locator.title')}</Text>
        <TouchableOpacity onPress={() => setShowMap(!showMap)} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel={showMap ? "Show list view" : "Show map view"}>
          <Ionicons name={showMap ? 'list' : 'map'} size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher + Radius */}
      <View className="px-6 mb-3">
        <View className="flex-row bg-emerald-900/60 rounded-2xl p-1.5 border border-emerald-800/50">
          {(['mosque', 'halal'] as const).map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === tab ? 'overflow-hidden' : ''}`}>
              {activeTab === tab && <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />}
              <View className="flex-row items-center">
                <Ionicons name={tab === 'mosque' ? 'location' : 'restaurant'} size={15} color={activeTab === tab ? '#fbbf24' : '#6b7280'} style={{ marginRight: 5 }} />
                <Text className={`font-bold text-sm ${activeTab === tab ? 'text-amber-400' : 'text-emerald-500'}`}>{tab === 'mosque' ? t('locator.mosques') : t('locator.halal')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* Radius toggle */}
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-emerald-400/60 text-xs font-bold uppercase tracking-widest">{t('locator.radius')}</Text>
          <TouchableOpacity onPress={handleRadiusChange} className="bg-emerald-900/60 px-4 py-1.5 rounded-full border border-emerald-700/50 flex-row items-center">
            <Ionicons name="resize" size={12} color="#6ee7b7" style={{ marginRight: 6 }} />
            <Text className="text-emerald-200 text-xs font-bold">{RADIUS_LABELS[radiusIdx]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Map (Mini View) */}
      {showMap && userCoords && !isLoading && places.length > 0 && (
        <View className="mx-6 mb-3 rounded-3xl overflow-hidden border border-emerald-700/40 shadow-xl" style={{ height: 220 }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: generateMapHtml(userCoords.lat, userCoords.lon, places, activeTab) }}
            style={{ flex: 1, backgroundColor: '#022c22' }}
            scrollEnabled={false}
            javaScriptEnabled={true}
          />
          <TouchableOpacity 
            className="absolute top-2 right-2 bg-emerald-900/80 p-2 rounded-full border border-emerald-700/50"
            onPress={() => setIsMapExpanded(true)}
            accessibilityLabel="Expand map"
          >
            <Ionicons name="expand" size={18} color="#fbbf24" />
          </TouchableOpacity>
        </View>
      )}

      {/* Expanded Map Modal */}
      <Modal visible={isMapExpanded} animationType="slide" transparent={false}>
        <View className="flex-1 bg-emerald-950">
          <StatusBar style="light" />
          <View className="pt-12 pb-3 px-6 bg-emerald-950 flex-row justify-between items-center z-10 border-b border-emerald-900/50">
            <Text className="text-emerald-50 text-xl font-bold tracking-wide">
              {activeTab === 'mosque' ? t('locator.mosquesMap') : t('locator.halalMap')}
            </Text>
            <TouchableOpacity onPress={() => setIsMapExpanded(false)} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color="#6ee7b7" />
            </TouchableOpacity>
          </View>
          {userCoords && places.length > 0 && (
            <WebView
              originWhitelist={['*']}
              source={{ html: generateMapHtml(userCoords.lat, userCoords.lon, places, activeTab) }}
              style={{ flex: 1, backgroundColor: '#022c22' }}
              javaScriptEnabled={true}
            />
          )}
        </View>
      </Modal>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text className="text-emerald-300 mt-4 font-medium">{t('locator.loading')}</Text>
        </View>
      ) : locationError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="location-outline" size={64} color="#6ee7b7" style={{ marginBottom: 16 }} />
          <Text className="text-emerald-100 text-center text-lg font-medium">{locationError}</Text>
        </View>
      ) : places.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="search-outline" size={64} color="#6ee7b7" style={{ marginBottom: 16 }} />
          <Text className="text-emerald-100 text-center text-lg font-bold mb-2">{activeTab === 'mosque' ? t('locator.noMosques') : t('locator.noHalal')}</Text>
          <Text className="text-emerald-400 text-center text-sm">{t('locator.expandRadius')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
          <Text className="text-emerald-400/70 text-xs font-bold mb-3 uppercase tracking-widest">
            {t('locator.results').replace('{{count}}', String(places.length))}
          </Text>

          {places.slice(0, 20).map((place, idx) => (
            <Animated.View
              key={place.id}
              style={{
                opacity: listAnims[idx] || 1,
                transform: [{ translateY: (listAnims[idx] || new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              }}
            >
              <TouchableOpacity className="mb-3 rounded-2xl overflow-hidden shadow-lg border border-emerald-800/40 active:opacity-80" onPress={() => openInMaps(place)}>
                <LinearGradient colors={place.type === 'mosque' ? ['#064e3b', '#022c22'] : ['#0f766e', '#042f2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                <View className="p-4 flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 border ${place.type === 'mosque' ? 'bg-emerald-800/60 border-emerald-700/50' : 'bg-teal-800/60 border-teal-700/50'}`}>
                    <Text style={{ fontSize: 22 }}>{place.type === 'mosque' ? '🕌' : '🍽️'}</Text>
                  </View>

                  <View className="flex-1 mr-2">
                    <Text className="text-emerald-50 font-bold text-sm mb-0.5" numberOfLines={1}>{place.name}</Text>
                    {place.address ? <Text className="text-emerald-300/60 text-[11px] font-medium" numberOfLines={1}>{place.address}</Text> : null}
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="walk" size={11} color="#6ee7b7" style={{ marginRight: 3 }} />
                      <Text className="text-emerald-400/80 text-[10px] font-medium mr-3">{estimateWalkTime(place.distance)}</Text>
                      <Ionicons name="car" size={11} color="#6ee7b7" style={{ marginRight: 3 }} />
                      <Text className="text-emerald-400/80 text-[10px] font-medium">{estimateDriveTime(place.distance)}</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <View className="bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 mb-1.5">
                      <Text className="text-amber-400 text-xs font-extrabold">{formatDistance(place.distance)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openInMaps(place)} className="flex-row items-center">
                      <Ionicons name="navigate" size={14} color="#6ee7b7" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
