import { useCallback, useState } from "react";
import {
  clearReminderPref,
  getStoredRemindersEnabled,
  requestReminderPermission,
} from "../utils/notifications";

/** What a toggle attempt actually did — "blocked" means the OS refused. */
export type ReminderToggleResult = "on" | "off" | "blocked";

/**
 * Whether the trainee has opted into review reminders — React state (not
 * just a localStorage read) so flipping it immediately drives the effect in
 * App.tsx that (re)schedules the pending notification, rather than waiting
 * for some unrelated state change to happen to re-run it.
 */
export function useReminders() {
  const [enabled, setEnabled] = useState(() => getStoredRemindersEnabled());

  // Reports the outcome rather than just flipping state: a refused request
  // and a deliberate switch-off both leave the toggle dark, and the caller
  // has to tell them apart to explain the first one.
  const toggleReminders = useCallback(async (): Promise<ReminderToggleResult> => {
    if (enabled) {
      clearReminderPref();
      setEnabled(false);
      return "off";
    }
    const granted = await requestReminderPermission();
    setEnabled(granted);
    return granted ? "on" : "blocked";
  }, [enabled]);

  return { remindersEnabled: enabled, toggleReminders };
}
