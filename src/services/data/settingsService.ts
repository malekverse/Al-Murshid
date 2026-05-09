import { setUserSetting, getUserSetting, getAllUserSettings } from '../../store/database';

export const loadPersistedSettings = async () => {
  const rows = await getAllUserSettings();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[(row as any).key] = (row as any).value;
  }
  return settings;
};

export const persistSetting = async (key: string, value: string) => {
  await setUserSetting(key, value);
};

export const loadSetting = async (key: string): Promise<string | null> => {
  return await getUserSetting(key);
};
