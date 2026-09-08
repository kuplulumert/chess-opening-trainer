import type { OpeningLine } from "./openings";
import type { LineProgress } from "../utils/storage";
import type { PlayerColor } from "../hooks/useOpeningTrainer";
import { isDue, daysOverdue } from "../utils/srs";

export interface DueLine {
  line: OpeningLine;
  color: PlayerColor;
  daysOverdue: number;
}

/**
 * Lines the SM-2 scheduler says are due, most-overdue first. Only counts
 * a line+color that's actually been quizzed before (has an `srs` record) —
 * everything never yet studied belongs in the ordinary opening list, not a
 * review queue, or day one would surface all 27 lines as "due".
 */
export function getDueLines(
  openings: OpeningLine[],
  progress: Record<string, LineProgress>,
  now: Date = new Date(),
): DueLine[] {
  const due: DueLine[] = [];
  for (const line of openings) {
    for (const color of ["w", "b"] as const) {
      const srs = progress[`${line.id}:${color}`]?.srs;
      if (!srs || !isDue(srs, now)) continue;
      due.push({ line, color, daysOverdue: daysOverdue(srs, now) });
    }
  }
  return due.sort((a, b) => b.daysOverdue - a.daysOverdue);
}
