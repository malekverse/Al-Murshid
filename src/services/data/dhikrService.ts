import { useAppStore } from '../../store';

const DHIKR_POINTS = 1;

export const recordDhikr = () => {
  useAppStore.getState().incrementDhikr();
  useAppStore.getState().addNoorPoints(DHIKR_POINTS);
};
