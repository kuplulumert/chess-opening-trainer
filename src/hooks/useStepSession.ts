import { useCallback, useMemo, useState } from "react";
import type { OpeningLine } from "../data/openings";
import { planStages, stageLine, type Stage } from "../data/stages";
import { isStepMode, type PlayerColor, type TrainerMode } from "./useOpeningTrainer";

/**
 * Error-free runs in a row that pass a stage. The chunked mode asks for one
 * fewer than "+": each of its runs is just the current chunk, replayed from
 * where the stage begins, while every "+" run replays the line from move one.
 */
export const RUNS_TO_PASS = { steps: 2, stepsPlus: 3 } as const;

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
 * stage is one intro run (its new moves shown) plus `runsToPass` clean runs
 * in a row. A run that shows moves never counts; a mistake resets the streak
 * and shows the missed move next run.
 *
 * The two modes differ in what a run is. "stepsPlus" replays the line from
 * move one every time. "steps" drills the current chunk where it stands,
 * from `startPly`, so a passed stage carries straight on into the next
 * moves instead of sending the board back to the opening.
 *
 * Judging is split from applying: `judgeRun` works out what a finished run
 * means without changing anything, so the caller can leave the result on
 * the final position for a moment and only then `apply` it.
 */
export function useStepSession(
  line: OpeningLine,
  side: PlayerColor,
  mode: TrainerMode,
  startStage: number,
) {
  const continuous = mode === "steps";
  const runsToPass = mode === "stepsPlus" ? RUNS_TO_PASS.stepsPlus : RUNS_TO_PASS.steps;

  const stages = useMemo(() => planStages(line.moves, side), [line.moves, side]);

  // Same synchronous reset-on-key pattern as useOpeningTrainer: a new line,
  // a new side, or a new mode starts over at the saved stage.
  const sessionKey = `${line.id}:${side}:${mode}`;
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
      if (streak < runsToPass) return { outcome: "clean", next: { ...state, streak } };
      if (state.stage === stages.length - 1) {
        return { outcome: "finished", next: { ...state, streak, finished: true } };
      }
      return { outcome: "stagePassed", next: startOfStage(stages, state.stage + 1) };
    },
    [state, stages, runsToPass],
  );

  const restart = useCallback(() => setState(startOfStage(stages, 0)), [stages]);

  // Clamped: on the render where the key changes, `state` is still the
  // previous line's until the queued reset lands, and that line may have
  // had more stages than this one.
  const stageIndex = Math.min(state.stage, stages.length - 1);
  const endPly = stages[stageIndex].endPly;
  // Where a run of this stage starts: right after the previous stage's last
  // ply when runs are chunks, move one when they replay the whole line.
  const startPly = continuous && stageIndex > 0 ? stages[stageIndex - 1].endPly + 1 : 0;
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
    startPly: isStepMode(mode) ? startPly : 0,
    runsToPass,
    judgeRun,
    apply: setState,
    restart,
  };
}
