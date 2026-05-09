import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useFatherlyCoach } from '../hooks/useFatherlyCoach';
import { useAppStore } from '../store';
import { sendMessage, resetConversation } from '../services/aiCoachService';
import { persistConversationMessage, loadRecentConversation, trimConversationHistory } from '../services/data/conversationService';
import { getReflections } from '../store/database';
import { flipIcon } from '../utils/rtl';
import LoadingState from '../components/LoadingState';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  isError?: boolean;
}

export default function AICoachScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { insight } = useFatherlyCoach();
  const sunnahStreak = useAppStore((s) => s.sunnahStreak);
  const userLevel = useAppStore((s) => s.userLevel);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastSentRef = useRef('');
  const [inputText, setInputText] = useState('');

  const welcomeText = `${t('aiCoach.welcomeMessage')}\n\n${insight}`;
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: welcomeText, sender: 'coach' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadRecentConversation().then((rows) => {
      const history = (rows as any[]).reverse().map((r) => ({
        id: `hist_${r.id}`,
        text: r.content,
        sender: r.role as 'user' | 'coach',
      }));
      if (history.length > 0) {
        setMessages(prev => [...prev, ...history]);
      }
    }).catch((e) => console.warn('loadConversationHistory failed:', e))
    .finally(() => setLoadingHistory(false));
  }, []);

  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      const createDotAnimation = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        );
      const a1 = createDotAnimation(typingDot1, 0);
      const a2 = createDotAnimation(typingDot2, 150);
      const a3 = createDotAnimation(typingDot3, 300);
      a1.start(); a2.start(); a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    }
  }, [isTyping]);

  const getReflectionsContext = async (): Promise<string | undefined> => {
    try {
      const rows = await getReflections();
      const recent = (rows as any[]).slice(0, 7);
      if (recent.length === 0) return undefined;
      const summaries = recent.map((r: any) => {
        try {
          const data = JSON.parse(atob(r.encryptedPayload));
          return `[${r.date}] Mood: ${data.mood || '?'} | Gratitude: ${data.gratitude || '-'} | Struggle: ${data.struggle || '-'} | Intention: ${data.intention || '-'}`;
        } catch { return null; }
      }).filter(Boolean);
      return summaries.length > 0 ? summaries.join('\n') : undefined;
    } catch { return undefined; }
  };

  const sendUserMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    setErrorMsg(null);
    lastSentRef.current = text.trim();

    const trimmed = text.trim();
    const userMsg: Message = { id: Date.now().toString(), text: trimmed, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    scrollToEnd();

      persistConversationMessage('user', trimmed).catch((e) => console.warn('persist user msg failed:', e));

    try {
      const reflectionsContext = await getReflectionsContext();
      const reply = await sendMessage(
        trimmed,
        i18n.language,
        sunnahStreak,
        userLevel,
        reflectionsContext
      );
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: reply, sender: 'coach' }]);
      persistConversationMessage('assistant', reply).catch((e) => console.warn('persist assistant msg failed:', e));
      trimConversationHistory().catch((e) => console.warn('trim history failed:', e));
    } catch (err: any) {
      const errorText = err.message || 'Failed to get response';
      setErrorMsg(errorText);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: errorText, sender: 'coach', isError: true },
      ]);
    } finally {
      setIsTyping(false);
      scrollToEnd();
    }
  };

  const scrollToEnd = () => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleReset = () => {
    Alert.alert(
      t('aiCoach.title'),
      t('aiCoach.clearConversation'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('aiCoach.clearAction'),
          style: 'destructive',
          onPress: () => {
            resetConversation();
            setMessages([{ id: '0', text: welcomeText, sender: 'coach' }]);
            setErrorMsg(null);
          },
        },
      ]
    );
  };

  const renderMessage = (msg: Message) => {
    const isCoach = msg.sender === 'coach';
    return (
      <View key={msg.id} className={`mb-4 ${isCoach ? 'items-start' : 'items-end'}`}>
        {isCoach && (
          <View className="flex-row items-center mb-1.5 ml-1">
            <View className="w-6 h-6 rounded-full bg-amber-500/20 items-center justify-center mr-2 border border-amber-500/30">
              <Ionicons name="sparkles" size={12} color="#fbbf24" />
            </View>
            <Text className="text-amber-400 text-xs font-bold tracking-wider">{t('aiCoach.botName')}</Text>
          </View>
        )}
        <View className={`max-w-[85%] rounded-3xl px-5 py-4 shadow-lg ${isCoach ? 'rounded-tl-md' : 'rounded-tr-md'}`}>
          {isCoach ? (
            <View className="rounded-3xl rounded-tl-md overflow-hidden">
              <LinearGradient
                colors={msg.isError ? ['#7f1d1d', '#450a0a'] : ['#064e3b', '#022c22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
              />
              <View className="px-5 py-4">
                <Text className={`text-base leading-relaxed font-medium ${msg.isError ? 'text-red-300' : 'text-emerald-50'}`}>{msg.text}</Text>
                {msg.isError && (
                  <TouchableOpacity
                      onPress={() => {
                      setMessages(prev => prev.filter(m => m.id !== msg.id));
                      setErrorMsg(null);
                      sendUserMessage(lastSentRef.current);
                    }}
                    className="mt-3 bg-amber-500/20 rounded-full px-4 py-2 self-start border border-amber-500/30"
                  >
                    <Text className="text-amber-400 text-xs font-bold">{t('aiCoach.retry')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View className="bg-amber-500/20 rounded-3xl rounded-tr-md px-5 py-4 border border-amber-500/30">
              <Text className="text-amber-100 text-base leading-relaxed font-medium">{msg.text}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loadingHistory) {
    return <LoadingState message={t('misc.loadingData')} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-emerald-950"
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10 border-b border-emerald-800/50">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-emerald-50 text-lg font-bold tracking-wide">{t('aiCoach.title')}</Text>
          <Text className="text-emerald-400 text-xs font-medium">{t('aiCoach.subtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={handleReset}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
          accessibilityLabel="Refresh conversation"
        >
          <Ionicons name="refresh" size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(renderMessage)}

        {isTyping && (
          <View className="items-start mb-4">
            <View className="flex-row items-center mb-1.5 ml-1">
              <View className="w-6 h-6 rounded-full bg-amber-500/20 items-center justify-center mr-2 border border-amber-500/30">
                <Ionicons name="sparkles" size={12} color="#fbbf24" />
              </View>
              <Text className="text-amber-400 text-xs font-bold tracking-wider">{t('aiCoach.botName')}</Text>
            </View>
            <View className="bg-emerald-900/60 rounded-3xl rounded-tl-md px-6 py-4 border border-emerald-800/50 flex-row items-center">
              {[typingDot1, typingDot2, typingDot3].map((dot, i) => (
                <Animated.View
                  key={i}
                  style={{
                    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                    transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-emerald-400 mx-1"
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View className="px-4 pb-8 pt-3 border-t border-emerald-800/50 bg-emerald-950">
        <View className="flex-row items-end">
          <View className="flex-1 bg-emerald-900/60 rounded-3xl border border-emerald-800/50 px-5 py-3 mr-3 flex-row items-center min-h-[48px]">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('aiCoach.placeholder')}
              placeholderTextColor="rgba(110, 231, 183, 0.35)"
              multiline
              className="flex-1 text-emerald-50 text-base font-medium"
              style={{ maxHeight: 100, textAlign: i18n.language === 'ar' ? 'right' : 'left' }}
              onSubmitEditing={() => sendUserMessage(inputText)}
            />
          </View>
          <TouchableOpacity
            onPress={() => sendUserMessage(inputText)}
            className="w-12 h-12 rounded-full overflow-hidden shadow-lg active:opacity-80"
            accessibilityLabel="Send message"
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="w-12 h-12 items-center justify-center">
              <Ionicons name={flipIcon('send') as any} size={20} color="#022c22" style={{ transform: [{ scaleX: i18n.language === 'ar' ? -1 : 1 }] }} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
