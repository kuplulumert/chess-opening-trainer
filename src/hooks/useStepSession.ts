import { useCallback, useMemo, useState } from "react";
import type { OpeningLine } from "../data/openings";
import { planStages, stageLine, type Stage } from "../data/stages";
import type { PlayerColor } from "./useOpeningTrainer";

/** Clean runs in a row that pass a stage — the same for every stage. */
export const CLEAN_RUNS_TO_PASS = 3;

/**
 * intro: the stage's new moves are shown. hint: the moves missed on the
 * previous run are shown. recall: nothing is shown — the only runs that
 * count toward passing.
 */
export type StepPhase = "intro" | "hint" | "recall";

export type RunOutcome = "failed" | "uncounted" | "clean" | "stagePassed" | "finished";

export interface StepSessionState {
  stage: number;
  phase: StepPhase;
  streak: number;
  /** Plies whose move is shown on the board during this run. */
  shown: number[];
  finished: boolean;
  /** Set along with `finished`: whether this session taught the line, as
   *  opposed to refreshing one already learned — the caller knows which. */
  learnedNow: boolean;
}

function startOfStage(stages: Stage[], stage: number): StepSessionState {
  const index = Math.min(Math.max(stage, 0), stages.length - 1);
  return {
    stage: index,
    phase: "intro",
    streak: 0,
    shown: stages[index].newPlies,
    finished: false,
    learnedNow: false,
  };
}

/**
 * Adım Adım's rules as a small state machine over one line and side: each
 * stage is one intro run plus CLEAN_RUNS_TO_PASS clean runs in a row, every
 * run replaying the line from move one. A run that shows moves never
 * counts; a mistake resets the streak and shows the missed move next run.
 *
 * Judging is split from applying: `judgeRun` works out what a finished run
 * means without changing anything, so the caller can leave the result on
 * the final position for a moment and only then `apply` it.
 */
export function useStepSession(
  line: OpeningLine,
  side: PlayerColor,
  active: boolean,
  startStage: number,
) {
  const stages = useMemo(() => planStages(line.moves, side), [line.moves, side]);

  // Same synchronous reset-on-key pattern as useOpeningTrainer: a new line,
  // a new side, or coming back into the mode starts over at the saved stage.
  const sessionKey = `${line.id}:${side}:${active}`;
  const [activeKey, setActiveKey] = useState(sessionKey);
  const [state, setState] = useState(() => startOfStage(stages, startStage));
  if (activeKey !== sessionKey) {
    setActiveKey(sessionKey);
    setState(startOfStage(stages, startStage));
  }

  const judgeRun = useCallback(
    (missedPlies: readonly number[]): { outcome: RunOutcome; next: StepSessionState } => {
      if (missedPlies.length > 0) {
        return {
          outcome: "failed",
          next: { ...state, phase: "hint", streak: 0, shown: [...missedPlies] },
        };
      }
      if (state.phase !== "recall") {
        return { outcome: "uncounted", next: { ...state, phase: "recall", streak: 0, shown: [] } };
      }
      const streak = state.streak + 1;
      if (streak < CLEAN_RUNS_TO_PASS) return { outcome: "clean", next: { ...state, streak } };
      if (state.stage === stages.length - 1) {
        return { outcome: "finished", next: { ...state, streak, finished: true } };
      }
      return { outcome: "stagePassed", next: startOfStage(stages, state.stage + 1) };
    },
    [state, stages],
  );

  const restart = useCallback(() => setState(startOfStage(stages, 0)), [stages]);

  // Clamped: on the render where the key changes, `state` is still the
  // previous line's until the queued reset lands, and that line may have
  // had more stages than this one.
  const endPly = stages[Math.min(state.stage, stages.length - 1)].endPly;
  const truncated = useMemo(() => stageLine(line, endPly), [line, endPly]);
  const shownPlies = useMemo(() => new Set(state.shown), [state.shown]);

  return {
    stage: state.stage,
    stageCount: stages.length,
    phase: state.phase,
    streak: state.streak,
    finished: state.finished,
    learnedNow: state.learnedNow,
    line: truncated,
    shownPlies,
    judgeRun,
    apply: setState,
    restart,
  };
}
