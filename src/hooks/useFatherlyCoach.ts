import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';

export const useFatherlyCoach = () => {
  const sunnahStreak = useAppStore((state) => state.sunnahStreak);
  const userLevel = useAppStore((state) => state.userLevel);
  const { t } = useTranslation();

  const getInsight = () => {
    if (sunnahStreak === 0) {
      return t('home.insight0');
    } else if (sunnahStreak < 3) {
      return t('home.insight1_2', { days: sunnahStreak });
    } else if (sunnahStreak < 7) {
      return t('home.insight3_6');
    } else {
      return t('home.insight7');
    }
  };

  return {
    insight: getInsight(),
  };
};
