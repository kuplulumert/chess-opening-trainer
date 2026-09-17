import { scheduleReview, qualityFromRun, type SrsState } from "./srs";

const STORAGE_KEY = "chess-opening-trainer-progress:v1";

export interface LineProgress {
  completions: number;
  lastCompletedAt: string | null;
  /** Absent until the first quiz-mode completion — old saved data upgrades
   *  in place with no migration step, and a line with no `srs` yet just
   *  isn't part of the due-for-review queue (see data/dueLines.ts). */
  srs?: SrsState;
  /** Adım Adım: the stage this line+side has reached, so leaving mid-way
   *  resumes there. Only the stage — never the clean-run streak, which only
   *  means anything within one sitting. Gone once the line is learned:
   *  recordReview rewrites the record without it. */
  stepStage?: number;
  /** Adım Adım's chunked mode has been through every stage of this
   *  line+side. Not the same as learned: its runs are single chunks, never
   *  the line from the start, so this only routes the next visit to
   *  Practice. Gone once the line is learned — recordReview rewrites the
   *  record without it. */
  stepsDone?: boolean;
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

export function saveStepStage(lineId: string, color: "w" | "b", stage: number): void {
  const map = loadAll();
  const k = key(lineId, color);
  map[k] = { ...(map[k] ?? { completions: 0, lastCompletedAt: null }), stepStage: stage };
  saveAll(map);
}

/** Adım Adım's chunked mode is through every stage of this line+side. */
export function saveStepsDone(lineId: string, color: "w" | "b"): void {
  const map = loadAll();
  const k = key(lineId, color);
  map[k] = { ...(map[k] ?? { completions: 0, lastCompletedAt: null }), stepsDone: true };
  saveAll(map);
}

/**
 * Adım Adım's "start from scratch": forgets the stage this line+side
 * reached and that its stages were ever finished, so it opens at stage one
 * again. Everything else in the record stays, and a record with neither
 * saved isn't touched at all.
 */
export function clearStepStage(lineId: string, color: "w" | "b"): void {
  const map = loadAll();
  const k = key(lineId, color);
  const record = map[k];
  if (record?.stepStage === undefined && record?.stepsDone === undefined) return;
  const next = { ...record };
  delete next.stepStage;
  delete next.stepsDone;
  map[k] = next;
  saveAll(map);
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
