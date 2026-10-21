import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { secureOptions } from './reflections';

// The app lock for You (SPEC 5.7): optional, it asks for the device's fingerprint, face or
// passcode before You opens, and locks again whenever the app leaves the screen. The choice is
// kept in secure storage (SPEC 9: app lock settings are encrypted at rest).

const LOCK_KEY = 'you-lock';

interface LockState {
  /** Undefined until secure storage has answered. */
  enabled: boolean | undefined;
  unlocked: boolean;
}

let state: LockState = { enabled: undefined, unlocked: false };
const listeners = new Set<() => void>();

function update(next: Partial<LockState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

void SecureStore.getItemAsync(LOCK_KEY, secureOptions).then(
  (value) => update({ enabled: value === 'on' }),
  () => update({ enabled: false }),
);

AppState.addEventListener('change', (status) => {
  if (status === 'background') update({ unlocked: false });
});

export function useYouLock(): LockState {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => state,
  );
}

/** Whether this device has a fingerprint, face or passcode to ask for. */
export async function canLock(): Promise<boolean> {
  return (
    (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE
  );
}

export async function unlockYou(promptMessage: string): Promise<boolean> {
  // A prompt cut short (the app left mid-way) can leave Android's module "busy", and every later
  // ask then ends at once with app_cancel. Clearing it first is harmless when nothing is pending.
  if (Platform.OS === 'android') await LocalAuthentication.cancelAuthenticate();
  const result = await LocalAuthentication.authenticateAsync({ promptMessage });
  if (result.success) update({ unlocked: true });
  return result.success;
}

/** Turning the lock on asks once, so it is never set on a device that cannot open it. */
export async function setYouLock(on: boolean, promptMessage: string): Promise<boolean> {
  if (on && !(await unlockYou(promptMessage))) return false;
  if (on) await SecureStore.setItemAsync(LOCK_KEY, 'on', secureOptions);
  else await SecureStore.deleteItemAsync(LOCK_KEY, secureOptions);
  update({ enabled: on, unlocked: true });
  return true;
}

/** After everything is deleted: no lock, nothing remembered. */
export async function forgetYouLock() {
  await SecureStore.deleteItemAsync(LOCK_KEY, secureOptions);
  update({ enabled: false, unlocked: false });
}
