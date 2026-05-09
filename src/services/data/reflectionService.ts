import { saveReflection, getReflections as getReflectionsFromDb } from '../../store/database';
import { useAppStore } from '../../store';

export const saveReflectionEntry = async (
  id: string,
  date: string,
  mood: string,
  gratitude: string,
  struggle: string,
  intention: string
) => {
  const payload = JSON.stringify({ mood, gratitude, struggle, intention });
  const encryptedPayload = btoa(payload);

  await saveReflection(id, date, encryptedPayload, '');

  useAppStore.getState().addNoorPoints(15);
};

export const getReflectionHistory = async () => {
  return await getReflectionsFromDb();
};
