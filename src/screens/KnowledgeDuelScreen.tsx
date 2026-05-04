import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

const quizData: Question[] = [
  { id: '1', text: 'In which month was the Quran first revealed?', options: ['Rajab', 'Ramadan', 'Dhul-Hijjah', 'Sha\'ban'], correctAnswer: 1 },
  { id: '2', text: 'Who was the first person to accept Islam?', options: ['Ali ibn Abi Talib', 'Abu Bakr', 'Khadijah bint Khuwaylid', 'Zayd ibn Harithah'], correctAnswer: 2 },
  { id: '3', text: 'What is the longest Surah in the Quran?', options: ['Al-Imran', 'Al-Ma\'idah', 'Al-Nisa', 'Al-Baqarah'], correctAnswer: 3 },
  { id: '4', text: 'Which prophet was swallowed by a whale?', options: ['Prophet Nuh', 'Prophet Yunus', 'Prophet Musa', 'Prophet Ibrahim'], correctAnswer: 1 },
  { id: '5', text: 'How many times is prayer (Salah) obligatory daily?', options: ['3', '4', '5', '7'], correctAnswer: 2 },
  { id: '6', text: 'In which battle did the Muslims face the Quraish despite being heavily outnumbered?', options: ['Battle of Uhud', 'Battle of the Trench', 'Battle of Hunayn', 'Battle of Badr'], correctAnswer: 3 },
];

export default function KnowledgeDuelScreen() {
  const navigation = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctOption, setCorrectOption] = useState<number | null>(null);

  const timerAnim = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(1)).current;

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0 && !isGameOver) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      
      Animated.timing(timerAnim, {
        toValue: (timeLeft - 1) / 60,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else if (timeLeft === 0 && isPlaying) {
      handleGameOver();
    }
    return () => clearTimeout(timer);
  }, [isPlaying, timeLeft, isGameOver]);

  const startGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying(true);
    setIsGameOver(false);
    setTimeLeft(60);
    setScore(0);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setCorrectOption(null);
    timerAnim.setValue(1);
  };

  const handleGameOver = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsGameOver(true);
    setIsPlaying(false);
  };

  const animateCard = () => {
    Animated.sequence([
      Animated.timing(cardAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return; // Prevent multiple clicks

    const currentQ = quizData[currentQuestionIdx];
    setSelectedOption(index);
    setCorrectOption(currentQ.correctAnswer);

    if (index === currentQ.correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(prev => prev + 10);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      if (currentQuestionIdx < quizData.length - 1) {
        animateCard();
        setTimeout(() => {
          setCurrentQuestionIdx(prev => prev + 1);
          setSelectedOption(null);
          setCorrectOption(null);
        }, 150);
      } else {
        handleGameOver();
      }
    }, 1200);
  };

  const renderStartScreen = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-teal-900/60 items-center justify-center border-4 border-teal-500/30 mb-8 shadow-2xl">
        <Ionicons name="flash" size={48} color="#fbbf24" />
      </View>
      <Text className="text-4xl font-extrabold text-amber-400 tracking-tight text-center mb-4">Knowledge Duel</Text>
      <Text className="text-emerald-100 text-lg text-center font-medium leading-relaxed mb-12">
        Test your knowledge of the Seerah and Quran. You have 60 seconds to answer as many questions as you can.
      </Text>
      <TouchableOpacity 
        onPress={startGame}
        className="w-full shadow-2xl active:opacity-80 rounded-full overflow-hidden"
      >
        <LinearGradient
          colors={['#f59e0b', '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View className="py-4 items-center flex-row justify-center">
          <Ionicons name="play" size={24} color="#022c22" style={{ marginRight: 8 }} />
          <Text className="text-emerald-950 font-extrabold text-xl tracking-wide">Start Duel</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderGameOverScreen = () => (
    <View className="flex-1 items-center justify-center px-8">
      <Ionicons name="trophy" size={80} color="#fbbf24" style={{ marginBottom: 24 }} />
      <Text className="text-2xl font-bold text-emerald-50 mb-2">Duel Complete!</Text>
      <Text className="text-5xl font-extrabold text-amber-400 mb-8">+{score} Noor</Text>
      
      <View className="bg-emerald-900/60 w-full p-6 rounded-3xl border border-emerald-800/50 mb-8 shadow-lg">
        <View className="flex-row justify-between mb-4">
          <Text className="text-emerald-200 font-medium text-lg">Correct Answers:</Text>
          <Text className="text-white font-bold text-lg">{score / 10}/{quizData.length}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-emerald-200 font-medium text-lg">Accuracy:</Text>
          <Text className="text-amber-400 font-bold text-lg">{Math.round((score / 10) / quizData.length * 100)}%</Text>
        </View>
      </View>

      <View className="w-full flex-row space-x-4">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="flex-1 bg-emerald-800/80 py-4 rounded-full border border-emerald-700/50 items-center mr-2"
        >
          <Text className="text-emerald-50 font-bold text-lg">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={startGame}
          className="flex-1 py-4 rounded-full overflow-hidden shadow-lg items-center ml-2"
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text className="text-emerald-950 font-bold text-lg">Play Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGameScreen = () => {
    const currentQ = quizData[currentQuestionIdx];

    return (
      <View className="flex-1 pt-12 px-6">
        {/* Top Bar */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50">
            <Ionicons name="close" size={20} color="#6ee7b7" />
          </TouchableOpacity>
          <View className="bg-amber-500/20 px-4 py-2 rounded-full border border-amber-500/40 flex-row items-center">
            <Ionicons name="star" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
            <Text className="text-amber-400 font-bold text-base">{score} Noor</Text>
          </View>
        </View>

        {/* Timer Bar */}
        <View className="w-full h-3 bg-emerald-900 rounded-full mb-8 overflow-hidden border border-emerald-800">
          <Animated.View 
            style={{ 
              width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: timerAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: ['#ef4444', '#f59e0b', '#10b981'] })
            }}
            className="h-full rounded-full"
          />
        </View>

        {/* Question Area */}
        <Animated.View 
          style={{ opacity: cardAnim, transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}
          className="flex-1"
        >
          <Text className="text-emerald-400 text-sm font-bold tracking-widest uppercase mb-4 text-center">
            Question {currentQuestionIdx + 1} of {quizData.length}
          </Text>
          
          <View className="bg-emerald-900/40 p-6 rounded-3xl border border-emerald-700/30 mb-8 shadow-xl">
            <Text className="text-emerald-50 text-2xl font-bold leading-relaxed text-center">
              {currentQ.text}
            </Text>
          </View>

          {/* Options */}
          <View className="space-y-4">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = correctOption === idx;
              const isWrong = isSelected && !isCorrect;
              const showCorrect = selectedOption !== null && isCorrect;

              let bgColor = "bg-emerald-800/40";
              let borderColor = "border-emerald-700/50";
              let textColor = "text-emerald-100";
              let icon = null;

              if (showCorrect) {
                bgColor = "bg-teal-600/40";
                borderColor = "border-teal-400";
                textColor = "text-white font-bold";
                icon = <Ionicons name="checkmark-circle" size={24} color="#34d399" />;
              } else if (isWrong) {
                bgColor = "bg-red-900/40";
                borderColor = "border-red-500/80";
                textColor = "text-red-100";
                icon = <Ionicons name="close-circle" size={24} color="#fca5a5" />;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={`${bgColor} p-5 rounded-2xl border ${borderColor} flex-row justify-between items-center mb-3 shadow-md`}
                >
                  <Text className={`${textColor} text-lg flex-1 mr-4`}>{option}</Text>
                  {icon}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <LinearGradient
        colors={['#022c22', '#064e3b']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {!isPlaying && !isGameOver && renderStartScreen()}
      {isPlaying && !isGameOver && renderGameScreen()}
      {isGameOver && renderGameOverScreen()}
    </View>
  );
}
