import { getCalendars } from 'expo-localization';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const read = () => getCalendars()[0]?.timeZone ?? null;

/**
 * The phone's time zone, read again each time the app comes back to the front: after a flight the
 * app is usually reopened, not restarted, and Android does not tell it the zone changed.
 */
export function useDeviceZone(): string | null {
  const [zone, setZone] = useState(read);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setZone(read());
    });
    return () => subscription.remove();
  }, []);
  return zone;
}
