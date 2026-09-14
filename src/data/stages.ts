import type { OpeningLine } from "./openings";

/** Each stage adds this many of the trainee's own moves: own, reply, own. */
const OWN_MOVES_PER_STAGE = 2;

export interface Stage {
  /** Last ply of the stage, inclusive — where a run of it ends. */
  endPly: number;
  /** The trainee's own moves this stage introduces, as ply indices. */
  newPlies: number[];
}

/**
 * Splits a line into Adım Adım stages for one side. A stage is three half
 * moves counted from the trainee's side — own move, reply, own move — so
 * each adds two of the trainee's moves; the opponent's replies are played
 * for them and never count. A stage ends on the trainee's own move (ending
 * on an auto-played reply would finish the run on something nobody was
 * tested on), except the last, which runs to the end of the base line the
 * way a normal run does. A side with an odd number of moves ends on a
 * one-move stage.
 */
export function planStages(moves: readonly string[], side: "w" | "b"): Stage[] {
  const own: number[] = [];
  for (let ply = side === "w" ? 0 : 1; ply < moves.length; ply += 2) own.push(ply);

  const stages: Stage[] = [];
  for (let start = 0; start < own.length; start += OWN_MOVES_PER_STAGE) {
    const newPlies = own.slice(start, start + OWN_MOVES_PER_STAGE);
    const isLast = start + OWN_MOVES_PER_STAGE >= own.length;
    stages.push({ endPly: isLast ? moves.length - 1 : newPlies[newPlies.length - 1], newPlies });
  }
  return stages;
}

/** The line cut down to one stage: the base moves up to `endPly` and no +5
 *  extension, which stays a separate step once the line is learned. */
export function stageLine(line: OpeningLine, endPly: number): OpeningLine {
  const plies = endPly + 1;
  return {
    ...line,
    moves: line.moves.slice(0, plies),
    comments: line.comments.slice(0, plies),
    strategy: line.strategy.slice(0, plies),
    extension: undefined,
  };
}
