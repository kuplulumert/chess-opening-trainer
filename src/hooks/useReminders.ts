import { useCallback, useState } from "react";
import {
  clearReminderPref,
  getStoredRemindersEnabled,
  requestReminderPermission,
} from "../utils/notifications";

/**
 * Whether the trainee has opted into review reminders — React state (not
 * just a localStorage read) so flipping it immediately drives the effect in
 * App.tsx that (re)schedules the pending notification, rather than waiting
 * for some unrelated state change to happen to re-run it.
 */
export function useReminders() {
  const [enabled, setEnabled] = useState(() => getStoredRemindersEnabled());

  const enableReminders = useCallback(async () => {
    const granted = await requestReminderPermission();
    setEnabled(granted);
    return granted;
  }, []);

  const disableReminders = useCallback(() => {
    clearReminderPref();
    setEnabled(false);
  }, []);

  return { remindersEnabled: enabled, enableReminders, disableReminders };
}
