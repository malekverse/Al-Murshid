import { saveSleepLog } from '../../store/database';
import { useAppStore } from '../../store';

export const logSleep = async (hoursSlept: number) => {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();

  await saveSleepLog(date, hoursSlept, timestamp);

  const points = Math.round(hoursSlept);
  useAppStore.getState().addNoorPoints(points);
};
