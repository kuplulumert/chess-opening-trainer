import { LocalNotifications } from "@capacitor/local-notifications";
import type { LineProgress } from "./storage";
import { isNative } from "./native";

// A single, always-replaced local notification (fixed id) rather than one
// per due line — SM-2 due dates drift continuously, so anything more than
// "here's your next one" would mean constantly juggling a pending queue
// against iOS's notification limits for very little benefit.
const REMINDER_ID = 1;
const PREF_KEY = "chess-opening-trainer-reminders-enabled:v1";

export function getStoredRemindersEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === "1";
  } catch {
    return false;
  }
}

function persist(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, enabled ? "1" : "0");
  } catch {
    // localStorage unavailable — the preference just won't survive a relaunch.
  }
}

/** Requests the OS permission and persists the outcome. No-op (false) on web. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    const granted = result.display === "granted";
    persist(granted);
    return granted;
  } catch {
    return false;
  }
}

export function clearReminderPref(): void {
  persist(false);
}

interface ReminderCopy {
  title: string;
  body: string;
}

/**
 * Re-derives the one pending reminder from current SRS state: finds the
 * soonest *future* due date across every reviewed line+color and schedules
 * a single notification for it, replacing whatever was pending before.
 * Lines already due right now aren't scheduled for — those surface
 * immediately in-app (Skill Map's "Review due" queue), nothing to wait for.
 * Called after every review and on every app launch, so the pending
 * notification always reflects the latest state instead of drifting stale.
 */
export async function syncReviewReminder(
  enabled: boolean,
  progress: Record<string, LineProgress>,
  copy: ReminderCopy,
): Promise<void> {
  if (!isNative) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch {
    // Best-effort cleanup — nothing to reschedule against if this fails.
  }
  if (!enabled) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") return;
  } catch {
    return;
  }

  let nextDue: number | null = null;
  const now = Date.now();
  for (const key in progress) {
    const srs = progress[key]?.srs;
    if (!srs) continue;
    const dueAt = new Date(srs.dueAt).getTime();
    if (dueAt <= now) continue;
    if (nextDue === null || dueAt < nextDue) nextDue = dueAt;
  }
  if (nextDue === null) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: copy.title,
          body: copy.body,
          schedule: { at: new Date(nextDue) },
        },
      ],
    });
  } catch {
    // Scheduling isn't essential to the trainer itself.
  }
}
