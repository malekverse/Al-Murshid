import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

const coachResponses = [
  "My dear child, remember that the Prophet ﷺ said: \"The most beloved deeds to Allah are those done consistently, even if they are small.\" Start with what feels manageable today.",
  "SubhanAllah, you are asking the right questions. The fact that you are reflecting shows your heart is alive. Allah says: \"Verily, in the remembrance of Allah do hearts find rest.\" (13:28)",
  "I am proud of you for seeking guidance. The scholars say that the journey of a thousand miles begins with a single step. What small step can you take today toward your goal?",
  "Remember, my child, that Allah does not burden a soul beyond what it can bear (2:286). Whatever you are facing, He has equipped you with the strength to overcome it.",
  "The companions of the Prophet ﷺ went through immense trials, yet they never lost hope in Allah's mercy. Your struggle is a sign of your faith — the one who is tested is the one who is loved.",
  "Let me share something beautiful with you: Umar ibn Al-Khattab (RA) said, \"Take account of yourselves before you are taken to account.\" This is the essence of Muhasabah — self-reflection.",
];

export default function AICoachScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "As-salamu alaykum, my dear child. I am your Murshid — your spiritual companion on this blessed journey. Tell me, what is on your heart today?",
      sender: 'coach',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
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

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate AI response delay
    const delay = 1500 + Math.random() * 1500;
    setTimeout(() => {
      const responseText = coachResponses[Math.floor(Math.random() * coachResponses.length)];
      const coachMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'coach',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, coachMsg]);
      setIsTyping(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, delay);
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
            <Text className="text-amber-400 text-xs font-bold tracking-wider">AL-MURSHID</Text>
          </View>
        )}
        <View className={`max-w-[85%] rounded-3xl px-5 py-4 shadow-lg ${isCoach ? 'rounded-tl-md' : 'rounded-tr-md'}`}>
          {isCoach ? (
            <View className="rounded-3xl rounded-tl-md overflow-hidden">
              <LinearGradient
                colors={['#064e3b', '#022c22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
              />
              <View className="px-5 py-4">
                <Text className="text-emerald-50 text-base leading-relaxed font-medium">{msg.text}</Text>
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-emerald-950"
      keyboardVerticalOffset={0}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10 border-b border-emerald-800/50">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
        >
          <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-emerald-50 text-lg font-bold tracking-wide">Al-Murshid</Text>
          <Text className="text-emerald-400 text-xs font-medium">Your Spiritual Mentor</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Muhasabah' as never)}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
        >
          <Ionicons name="journal" size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}

        {/* Typing Indicator */}
        {isTyping && (
          <View className="items-start mb-4">
            <View className="flex-row items-center mb-1.5 ml-1">
              <View className="w-6 h-6 rounded-full bg-amber-500/20 items-center justify-center mr-2 border border-amber-500/30">
                <Ionicons name="sparkles" size={12} color="#fbbf24" />
              </View>
              <Text className="text-amber-400 text-xs font-bold tracking-wider">AL-MURSHID</Text>
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
              placeholder="Share what's on your heart..."
              placeholderTextColor="rgba(110, 231, 183, 0.35)"
              multiline
              className="flex-1 text-emerald-50 text-base font-medium"
              style={{ maxHeight: 100 }}
              onSubmitEditing={sendMessage}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            className="w-12 h-12 rounded-full overflow-hidden shadow-lg active:opacity-80"
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="w-12 h-12 items-center justify-center">
              <Ionicons name="send" size={20} color="#022c22" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
