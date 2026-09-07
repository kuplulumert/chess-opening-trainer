// Persisted on/off flag for the temporary TouchDebug overlay — kept in
// localStorage so it survives the board's remount on every line change.
const STORAGE_KEY = "chess-touch-debug";

export function isTouchDebugEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTouchDebugEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fine — just not persisted across the next remount.
  }
}
