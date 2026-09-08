import { scheduleReview, qualityFromRun, type SrsState } from "./srs";

const STORAGE_KEY = "chess-opening-trainer-progress:v1";

export interface LineProgress {
  completions: number;
  lastCompletedAt: string | null;
  /** Absent until the first quiz-mode completion — old saved data upgrades
   *  in place with no migration step, and a line with no `srs` yet just
   *  isn't part of the due-for-review queue (see data/dueLines.ts). */
  srs?: SrsState;
}

type ProgressMap = Record<string, LineProgress>;

function key(lineId: string, color: "w" | "b"): string {
  return `${lineId}:${color}`;
}

function loadAll(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveAll(map: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — progress just won't persist.
  }
}

export function getProgress(lineId: string, color: "w" | "b"): LineProgress {
  const map = loadAll();
  return map[key(lineId, color)] ?? { completions: 0, lastCompletedAt: null };
}

export function getAllProgress(): ProgressMap {
  return loadAll();
}

/**
 * Records one quiz-mode completion: bumps the medal-tier completion count
 * (unchanged, cosmetic) and, in the same read-modify-write, feeds the run's
 * outcome into the SM-2 scheduler so the line gets a real next-due date
 * instead of just being counted.
 */
export function recordReview(
  lineId: string,
  color: "w" | "b",
  mistakes: number,
  hintUsed: boolean,
): LineProgress {
  const map = loadAll();
  const k = key(lineId, color);
  const prev = map[k] ?? { completions: 0, lastCompletedAt: null };
  const quality = qualityFromRun(mistakes, hintUsed);
  const next: LineProgress = {
    completions: prev.completions + 1,
    lastCompletedAt: new Date().toISOString(),
    srs: scheduleReview(prev.srs, quality),
  };
  map[k] = next;
  saveAll(map);
  return next;
}
