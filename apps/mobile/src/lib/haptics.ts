import * as Haptics from 'expo-haptics';
import { readSettings } from './settings';

// Haptics (SPEC 6.5): a light selection for taps, toggles and each tasbih bead, a medium impact
// for a finished count or the Qibla found, success for a logged prayer or a reached target. One
// setting turns them all off.

const on = () => readSettings().haptics;

export const haptics = {
  selection() {
    if (on()) void Haptics.selectionAsync();
  },
  medium() {
    if (on()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  success() {
    if (on()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
