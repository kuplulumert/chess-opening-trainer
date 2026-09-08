// Standard SuperMemo SM-2 spaced repetition — the same scheduling algorithm
// behind Anki and Chessable's MoveTrainer. Replaces the old "medals count
// total completions forever" model with one that actually tracks whether a
// line is *due*: intervals grow on a clean pass, reset on a rough one, and
// the ease factor adapts per line to how hard it consistently is.

export interface SrsState {
  /** How steeply the interval grows on a clean review. SM-2 floors this at 1.3. */
  easeFactor: number;
  /** The interval that was just scheduled, in days — the input to the *next* one. */
  intervalDays: number;
  /** Consecutive clean (quality >= 3) reviews. A lapse resets this to 0. */
  repetitions: number;
  /** ISO timestamp of the next scheduled review. */
  dueAt: string;
}

// No history yet: due immediately, at the algorithm's starting ease.
export const INITIAL_SRS_STATE: SrsState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  dueAt: new Date(0).toISOString(),
};

/**
 * One review's outcome as a 0-5 quality score, SM-2's own scale:
 * 5 perfect recall, 4 a hesitation, 3 correct but effortful (SM-2's pass
 * threshold), below 3 a lapse that resets the streak.
 *
 * Derived from what actually happened during the run rather than asking the
 * trainee to self-grade (which SM-2 assumes but a chess trainer can measure
 * directly): a hint was requested, or how many wrong squares were tried
 * before the line was completed.
 */
export function qualityFromRun(mistakes: number, hintUsed: boolean): number {
  if (hintUsed) return 3;
  if (mistakes <= 0) return 5;
  if (mistakes === 1) return 4;
  if (mistakes === 2) return 3;
  return 2;
}

/** Applies one SM-2 review step. `now` is injectable for testing. */
export function scheduleReview(prev: SrsState | undefined, quality: number, now: Date = new Date()): SrsState {
  const state = prev ?? INITIAL_SRS_STATE;
  const q = Math.max(0, Math.min(5, quality));

  let repetitions = state.repetitions;
  let intervalDays: number;

  if (q < 3) {
    // A lapse: back to daily review, streak broken. The ease factor still
    // adjusts below (it drops), but doesn't reset — a line that's normally
    // easy shouldn't lose all its accumulated ease over one slip.
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(state.intervalDays * state.easeFactor);
    repetitions += 1;
  }

  // SM-2's own ease update formula. Never below 1.3, or a few lapses in a
  // row could push the interval into shrinking forever instead of settling.
  const easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return { easeFactor, intervalDays, repetitions, dueAt: dueAt.toISOString() };
}

export function isDue(srs: SrsState | undefined, now: Date = new Date()): boolean {
  if (!srs) return true;
  return new Date(srs.dueAt).getTime() <= now.getTime();
}

/** Positive = overdue by this many days; negative = not due for this long. */
export function daysOverdue(srs: SrsState | undefined, now: Date = new Date()): number {
  if (!srs) return 0;
  const ms = now.getTime() - new Date(srs.dueAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
