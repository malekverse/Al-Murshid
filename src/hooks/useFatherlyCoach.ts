import { useAppStore } from '../store';

export const useFatherlyCoach = () => {
  const sunnahStreak = useAppStore((state) => state.sunnahStreak);
  const userLevel = useAppStore((state) => state.userLevel);

  const getInsight = () => {
    if (sunnahStreak === 0) {
      return "Every journey begins with a single step. Make your intention pure today.";
    } else if (sunnahStreak < 3) {
      return `You have completed ${sunnahStreak} days of consistency. The Prophet (PBUH) loved small continuous deeds over large sporadic ones. Keep it up!`;
    } else if (sunnahStreak < 7) {
      return "MashaAllah, you are building a habit that Allah loves. Don't let Shaytan break your stride.";
    } else {
      return "Your tree is blooming with Noor. Remember to stay humble and guide your brothers and sisters.";
    }
  };

  return {
    insight: getInsight(),
  };
};
