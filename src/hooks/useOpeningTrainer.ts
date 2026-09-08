import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { OpeningLine } from "../data/openings";
import { hapticError, hapticMove, hapticSuccess } from "../utils/native";
import { playMoveSound } from "../utils/sound";

export type PlayerColor = "w" | "b";
export type TrainerMode = "quiz" | "study";
export type MoveFeedback = "idle" | "correct" | "wrong";

const OPPONENT_MOVE_DELAY_MS = 550;
const WRONG_ATTEMPTS_BEFORE_HINT = 2;

function moveColor(plyIndex: number): PlayerColor {
  return plyIndex % 2 === 0 ? "w" : "b";
}

// The position reached after the first `plies` moves of the line.
function positionAfter(moves: string[], plies: number): Chess {
  const game = new Chess();
  for (let i = 0; i < plies; i++) game.move(moves[i]);
  return game;
}

// Colors strictly alternate by ply, so a color's most recent played move is
// either the last played ply itself, or the one right before it.
function lastStrategyForColor(
  strategy: string[],
  moveIndex: number,
  color: PlayerColor,
): string | null {
  const lastPly = moveIndex - 1;
  if (lastPly < 0) return null;
  const targetPly = moveColor(lastPly) === color ? lastPly : lastPly - 1;
  return targetPly >= 0 ? strategy[targetPly] : null;
}

export function useOpeningTrainer(line: OpeningLine, playerColor: PlayerColor, mode: TrainerMode) {
  const [game, setGame] = useState(() => new Chess());
  const [moveIndex, setMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState<MoveFeedback>("idle");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lastWrongSquares, setLastWrongSquares] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [hintRequested, setHintRequested] = useState(false);
  // Run-scoped, unlike wrongAttempts/hintRequested above (which are
  // per-move and reset on every applyBookMove): these accumulate across
  // the whole line and only reset when the run itself restarts. They're
  // what the SM-2 scheduler grades the run on — see qualityFromRun.
  const [mistakeCount, setMistakeCount] = useState(0);
  const [hintUsedInRun, setHintUsedInRun] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  // Reset synchronously when the line, colour, or mode changes, rather than in an
  // effect: an effect resets one render too late, so consumers would briefly still
  // see the finished state of the *previous* run under the new line/colour.
  const runKey = `${line.id}:${playerColor}:${mode}`;
  const [activeRunKey, setActiveRunKey] = useState(runKey);
  if (activeRunKey !== runKey) {
    setActiveRunKey(runKey);
    setGame(new Chess());
    setMoveIndex(0);
    setFeedback("idle");
    setWrongAttempts(0);
    setLastWrongSquares(null);
    setHintRequested(false);
    setMistakeCount(0);
    setHintUsedInRun(false);
  }

  const isDone = moveIndex >= line.moves.length;
  const isPlayerTurn = !isDone && moveColor(moveIndex) === playerColor;
  const isOpponentTurn = !isDone && moveColor(moveIndex) !== playerColor;

  const applyBookMove = useCallback((index: number) => {
    setGame((prev) => {
      const next = new Chess(prev.fen());
      next.move(line.moves[index]);
      return next;
    });
    playMoveSound();
    // The move that finishes the line gets the "success" pattern instead
    // of the ordinary tick.
    if (index + 1 === line.moves.length) hapticSuccess();
    else hapticMove();
    setMoveIndex(index + 1);
    setFeedback("idle");
    setWrongAttempts(0);
    setLastWrongSquares(null);
    setHintRequested(false);
  }, [line.moves]);

  const reset = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setGame(new Chess());
    setMoveIndex(0);
    setFeedback("idle");
    setWrongAttempts(0);
    setLastWrongSquares(null);
    setHintRequested(false);
    setMistakeCount(0);
    setHintUsedInRun(false);
  }, []);

  // Auto-play only the opponent's book moves — in both modes, the trainee
  // always plays their own chosen color's moves themselves.
  useEffect(() => {
    if (isDone) return;
    if (moveColor(moveIndex) === playerColor) return;

    timeoutRef.current = window.setTimeout(() => {
      applyBookMove(moveIndex);
    }, OPPONENT_MOVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [moveIndex, isDone, playerColor, applyBookMove]);

  const attemptMove = useCallback(
    (from: Square, to: Square): boolean => {
      if (!isPlayerTurn) return false;

      const probe = new Chess(game.fen());
      let result;
      try {
        result = probe.move({ from, to, promotion: "q" });
      } catch {
        result = null;
      }
      if (!result) return false;

      const expectedSan = line.moves[moveIndex];
      if (result.san === expectedSan) {
        applyBookMove(moveIndex);
        setFeedback("correct");
        window.setTimeout(() => setFeedback("idle"), 500);
      } else {
        setFeedback("wrong");
        hapticError();
        setLastWrongSquares({ from, to });
        setWrongAttempts((n) => n + 1);
        setMistakeCount((n) => n + 1);
        window.setTimeout(() => setFeedback("idle"), 500);
      }
      return true;
    },
    [game, isPlayerTurn, line.moves, moveIndex, applyBookMove],
  );

  // Stepping back rewinds to the trainee's *previous turn*, not just one
  // ply: landing on the opponent's turn instead would have the auto-reply
  // effect immediately re-play the very move that was just undone.
  const firstPlayerPly = playerColor === "w" ? 0 : 1;
  const canStepBack = moveIndex > firstPlayerPly;
  const canStepForward = !isDone;

  const stepBack = useCallback(() => {
    let target = moveIndex - 1;
    while (target >= 0 && moveColor(target) !== playerColor) target--;
    if (target < 0) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setGame(positionAfter(line.moves, target));
    setMoveIndex(target);
    setFeedback("idle");
    setWrongAttempts(0);
    setLastWrongSquares(null);
    setHintRequested(false);
    playMoveSound();
  }, [moveIndex, playerColor, line.moves]);

  // Plays the next book move outright, whoever's turn it is — during the
  // opponent's reply delay this just skips the wait. Used on the trainee's
  // own turn, though, it's the same as being handed the answer: counts
  // against this run's SM-2 quality the same way a hint does.
  const stepForward = useCallback(() => {
    if (isDone) return;
    if (isPlayerTurn) setHintUsedInRun(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    applyBookMove(moveIndex);
  }, [isDone, isPlayerTurn, moveIndex, applyBookMove]);

  // Jump to the position after the first `plies` moves — the move strip in
  // the info panel uses this. Landing on the opponent's turn is fine: the
  // auto-reply effect just continues the line from there.
  const goTo = useCallback(
    (plies: number) => {
      if (plies < 0 || plies > line.moves.length) return;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setGame(positionAfter(line.moves, plies));
      setMoveIndex(plies);
      setFeedback("idle");
      setWrongAttempts(0);
      setLastWrongSquares(null);
      setHintRequested(false);
      playMoveSound();
    },
    [line.moves],
  );

  const showHint = mode === "study" || hintRequested || wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT;
  const revealedHint = showHint && !isDone ? line.moves[moveIndex] : null;

  // Derived from moveIndex rather than game.history(): chess.js loses move history
  // whenever a new Chess instance is constructed from a FEN string.
  const history = useMemo(() => line.moves.slice(0, moveIndex), [line.moves, moveIndex]);

  return {
    fen: game.fen(),
    history,
    moveIndex,
    isDone,
    isPlayerTurn,
    isOpponentTurn,
    feedback,
    wrongAttempts,
    lastWrongSquares,
    revealedHint,
    nextMoveSan: isDone ? null : line.moves[moveIndex],
    currentComment: isDone ? null : line.comments[moveIndex],
    whiteStrategy: lastStrategyForColor(line.strategy, moveIndex, "w"),
    blackStrategy: lastStrategyForColor(line.strategy, moveIndex, "b"),
    totalMoves: line.moves.length,
    attemptMove,
    requestHint: () => {
      setHintRequested(true);
      setHintUsedInRun(true);
    },
    mistakeCount,
    hintUsedInRun,
    reset,
    canStepBack,
    canStepForward,
    stepBack,
    stepForward,
    goTo,
  };
}
