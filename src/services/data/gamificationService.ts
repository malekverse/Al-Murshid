import { useAppStore } from '../../store';
import { getLevel, getLevelTitle } from '../../types';

export const computeLevel = () => {
  const noorPoints = useAppStore.getState().noorPoints;
  return getLevel(noorPoints);
};

export const computeLevelTitle = (lang: 'en' | 'ar' = 'en') => {
  const level = computeLevel();
  return getLevelTitle(level, lang);
};

export const getMilestoneProgress = (): { current: number; next: number; progress: number } => {
  const noorPoints = useAppStore.getState().noorPoints;
  const milestones = [0, 50, 150, 500, 1000];

  let current = 0;
  let next = milestones[1];

  for (let i = 0; i < milestones.length - 1; i++) {
    if (noorPoints >= milestones[i] && noorPoints < milestones[i + 1]) {
      current = milestones[i];
      next = milestones[i + 1];
      break;
    }
    if (noorPoints >= milestones[milestones.length - 1]) {
      current = milestones[milestones.length - 1];
      next = milestones[milestones.length - 1];
    }
  }

  const range = next - current;
  const progress = range > 0 ? (noorPoints - current) / range : 1;
  return { current, next, progress: Math.min(progress, 1) };
};
