import { savePrayerLog } from '../../store/database';
import { useAppStore } from '../../store';

export const logPrayer = async (prayerName: string) => {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();

  await savePrayerLog(prayerName, date, timestamp);

  useAppStore.getState().logPrayer(prayerName);
};
