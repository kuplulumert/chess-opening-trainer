const STORAGE_KEY = "chess-opening-trainer-favourites:v1";

/**
 * How many openings Home's quick-access screen holds. Two: enough for the
 * pair someone is actually drilling, few enough that the screen stays a
 * shortcut instead of turning into a second openings list.
 */
export const MAX_FAVOURITES = 2;

/** Line ids, in the order they were added. */
export function getFavourites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(stored)) return [];
    return stored.filter((id): id is string => typeof id === "string").slice(0, MAX_FAVOURITES);
  } catch {
    return [];
  }
}

export function saveFavourites(ids: readonly string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_FAVOURITES)));
  } catch {
    // localStorage unavailable (private mode, quota) — the picks just don't
    // outlive this session.
  }
}
