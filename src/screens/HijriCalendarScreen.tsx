import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

interface CalendarDay {
  gregorian: string;
  hijriDay: number;
  hijriMonth: string;
  hijriMonthNumber: number;
  hijriYear: string;
  isToday: boolean;
  weekdayIndex: number;
}

interface MonthData {
  calendarDays: CalendarDay[];
  startDayOffset: number;
  upcomingEvents: { name: string; hijriDate: string; gregorianDate: string; icon: string; color: string }[];
  monthLabel: string;
  yearLabel: string;
  gregorianLabel: string;
  loading: boolean;
}

const ISLAMIC_EVENTS: Record<string, string> = {
  '1-1': 'Islamic New Year',
  '10-1': 'Day of Ashura',
  '12-3': 'Mawlid an-Nabi ﷺ',
  '27-7': 'Isra & Mi\'raj',
  '15-8': 'Mid-Sha\'ban',
  '1-9': 'Start of Ramadan',
  '27-9': 'Laylat al-Qadr (est.)',
  '1-10': 'Eid al-Fitr',
  '9-12': 'Day of Arafah',
  '10-12': 'Eid al-Adha',
};

const INITIAL_PAGE = 50; // Represents the current month (Index 50 in a 0-100 array)
const TOTAL_PAGES = 100;
const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => i);

export default function HijriCalendarScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const pagerRef = useRef<PagerView>(null);
  
  const [currentIndex, setCurrentIndex] = useState(INITIAL_PAGE);
  const [monthsCache, setMonthsCache] = useState<Record<number, MonthData>>({});

  useEffect(() => {
    // Pre-fetch current, previous, and next month for smooth swiping
    fetchMonthData(currentIndex);
    fetchMonthData(currentIndex - 1);
    fetchMonthData(currentIndex + 1);
  }, [currentIndex]);

  const fetchMonthData = async (index: number) => {
    if (monthsCache[index]) return; // Already cached or loading

    // Set as loading
    setMonthsCache(prev => ({ ...prev, [index]: { loading: true } as any }));

    try {
      const offset = index - INITIAL_PAGE;
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + offset);

      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      
      const now = new Date();
      const isCurrentMonth = month === (now.getMonth() + 1) && year === now.getFullYear();

      const calRes = await fetchWithTimeout(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
      const calJson = await calRes.json();

      if (calJson.code === 200 && calJson.data) {
        const days: CalendarDay[] = calJson.data.map((entry: any) => {
          const gDate = entry.gregorian.date;
          const gParts = gDate.split('-');
          const gDay = parseInt(gParts[0]);
          const weekdayMap: Record<string, number> = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
          };

          return {
            gregorian: gDate,
            hijriDay: parseInt(entry.hijri.day),
            hijriMonth: entry.hijri.month.en,
            hijriMonthNumber: entry.hijri.month.number,
            hijriYear: entry.hijri.year,
            isToday: isCurrentMonth && gDay === now.getDate(),
            weekdayIndex: weekdayMap[entry.gregorian.weekday.en] ?? 0,
          };
        });

        const startDayOffset = days.length > 0 ? days[0].weekdayIndex : 0;
        
        const events: any[] = [];
        const seenEvents = new Set<string>();
        for (const d of days) {
          const key = `${d.hijriDay}-${d.hijriMonthNumber}`;
          const eventName = ISLAMIC_EVENTS[key];
          if (eventName && !seenEvents.has(eventName)) {
            seenEvents.add(eventName);
            const gParts = d.gregorian.split('-');
            const formatted = new Date(`${gParts[2]}-${gParts[1]}-${gParts[0]}`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            events.push({
              name: eventName,
              hijriDate: `${d.hijriDay} ${d.hijriMonth}`,
              gregorianDate: formatted,
              icon: eventName.includes('Eid') ? 'star' : eventName.includes('Ramadan') ? 'moon' : 'sunny',
              color: eventName.includes('Eid') ? '#6ee7b7' : eventName.includes('Arafah') ? '#fbbf24' : '#93c5fd',
            });
          }
        }

        const midDay = days[15]; // mid-month usually represents the dominant Hijri month

        setMonthsCache(prev => ({
          ...prev,
          [index]: {
            calendarDays: days,
            startDayOffset,
            upcomingEvents: events,
            monthLabel: midDay?.hijriMonth || '',
            yearLabel: midDay?.hijriYear || '',
            gregorianLabel: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            loading: false,
          }
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch Hijri data:', e);
      // Remove from cache so it can be retried
      setMonthsCache(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const goToPrevMonth = () => {
    if (currentIndex > 0 && pagerRef.current) {
      pagerRef.current.setPage(currentIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentIndex < TOTAL_PAGES - 1 && pagerRef.current) {
      pagerRef.current.setPage(currentIndex + 1);
    }
  };

  const renderMonthPage = (index: number) => {
    const data = monthsCache[index];

    // Show a loading indicator if data isn't loaded yet
    if (!data || data.loading) {
      return (
        <View key={index} className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text className="text-emerald-300 mt-4 font-medium">{t('calendar.loading')}</Text>
        </View>
      );
    }

    const gridCells: (CalendarDay | null)[] = [
      ...Array(data.startDayOffset).fill(null),
      ...data.calendarDays,
    ];

    return (
      <View key={index} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
          
          {/* Month & Year Header with Navigation */}
          <View className="items-center mb-8 mt-4">
            <View className="flex-row items-center justify-between w-full px-8">
              <TouchableOpacity onPress={goToPrevMonth} className="p-2" accessibilityLabel="Previous month">
                <Ionicons name={flipIcon('chevron-back') as any} size={28} color="#6ee7b7" />
              </TouchableOpacity>

              <View className="items-center">
                <Text className="text-amber-400 text-3xl font-extrabold tracking-tight">
                  {data.monthLabel}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="moon" size={16} color="#6ee7b7" style={{ marginRight: 6 }} />
                  <Text className="text-emerald-200 text-lg font-bold tracking-widest">{data.yearLabel} AH</Text>
                </View>
                <Text className="text-emerald-400/60 text-sm mt-2 font-medium">
                  {data.gregorianLabel}
                </Text>
              </View>

              <TouchableOpacity onPress={goToNextMonth} className="p-2" accessibilityLabel="Next month">
                <Ionicons name={flipIcon('chevron-forward') as any} size={28} color="#6ee7b7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar Grid */}
          <View className="rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden mb-10">
            <LinearGradient
              colors={['#064e3b', '#022c22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="p-6">
              <View className="flex-row justify-between mb-4 border-b border-emerald-700/50 pb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <Text key={idx} className={`text-center font-bold w-8 ${idx === 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {day}
                  </Text>
                ))}
              </View>

              <View className="flex-row flex-wrap justify-between">
                {gridCells.map((cell, idx) => {
                  const isToday = cell?.isToday ?? false;
                  const eventName = cell ? ISLAMIC_EVENTS[`${cell.hijriDay}-${cell.hijriMonthNumber}`] : null;

                  return (
                    <View key={idx} className="w-8 h-10 mb-2 items-center justify-center relative">
                      {cell ? (
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${isToday ? 'bg-amber-500' : ''}`}>
                          <Text className={`text-[12px] font-bold ${isToday ? 'text-emerald-950' : eventName ? 'text-amber-400' : 'text-emerald-100'}`}>
                            {cell.hijriDay}
                          </Text>
                          <Text className={`text-[7px] ${isToday ? 'text-emerald-900' : 'text-emerald-500'}`}>
                            {new Date(`${cell.gregorian.split('-')[2]}-${cell.gregorian.split('-')[1]}-${cell.gregorian.split('-')[0]}`).getDate()}
                          </Text>
                          {eventName && !isToday && (
                            <View className="absolute -top-1 -right-1">
                              <Ionicons name={eventName.includes('Eid') ? 'star' : 'ellipse'} size={6} color="#fbbf24" />
                            </View>
                          )}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Upcoming Events */}
          {data.upcomingEvents.length > 0 && (
            <>
              <View className="flex-row items-center mb-6">
                <Ionicons name="star" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
                <Text className="text-white text-xl font-bold tracking-wide">{t('calendar.events')}</Text>
              </View>

              <View className="space-y-4">
                {data.upcomingEvents.map((event, idx) => (
                  <View key={idx} className="mb-4 rounded-2xl overflow-hidden shadow-lg border border-emerald-800/40">
                    <LinearGradient
                      colors={['#0f766e', '#042f2e']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View className="p-5 flex-row items-center">
                      <View className="w-12 h-12 rounded-full items-center justify-center mr-4 shadow-md bg-emerald-900/50 border border-emerald-700/50">
                        <Ionicons name={event.icon as any} size={24} color={event.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-emerald-50 font-bold text-lg mb-1">{event.name}</Text>
                        <Text className="text-emerald-300/80 text-xs font-medium">{event.hijriDate} • {event.gregorianDate}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <View className="mt-6 items-center">
            <Text className="text-emerald-500/40 text-xs font-medium">{t('calendar.source')}</Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Screen Global Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('calendar.title')}</Text>
        <View className="w-10" />
      </View>

      {/* Swipable Pager */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={INITIAL_PAGE}
        onPageSelected={(e) => setCurrentIndex(e.nativeEvent.position)}
      >
        {PAGES.map((index) => {
          // Only render pages that are close to the current index to save memory
          if (Math.abs(index - currentIndex) > 2) {
            return <View key={index} />;
          }
          return renderMonthPage(index);
        })}
      </PagerView>

    </View>
  );
}
